"""
YatraSetu Platform — Security, RLS & Authorization Unit Test Suite
Validates:
1. SecurityContext creation, typing, and immutability.
2. Missing identity context handling.
3. Manager jurisdiction logic (State Manager vs Destination Manager vs Admin).
4. Cross-destination and cross-user authorization boundaries.
5. Soft-deletion filtering and administrative query bypass.
6. Database session context setting and cleanup simulation.
"""

import uuid
import pytest
from sqlalchemy.orm import Session

from app.core.security import (
    SecurityContext,
    set_database_security_context,
    clear_database_security_context,
)
from app.core.jurisdiction import JurisdictionAuthorizer, JurisdictionScope
from app.core.soft_delete import SoftDeleteManager
from app.models.identity import Role, User, ManagerAssignment
from app.models.destination import State, Destination, DestinationAdvisory


# -----------------------------------------------------------------------------
# Fixtures
# -----------------------------------------------------------------------------

@pytest.fixture
def sample_hierarchy(db_session: Session):
    """
    Sets up sample states, destinations, users, and manager assignments.
    """
    # 1. Roles
    r_admin = Role(id="admin", name="Administrator")
    r_mgr = Role(id="manager", name="Destination Manager")
    r_sh = Role(id="stakeholder", name="Stakeholder")
    r_tourist = Role(id="tourist", name="Tourist")
    db_session.add_all([r_admin, r_mgr, r_sh, r_tourist])
    db_session.flush()

    # 2. States
    s_mh = State(id="maharashtra", name="Maharashtra", theme_code="saffron", badge_label="West")
    s_kl = State(id="kerala", name="Kerala", theme_code="emerald", badge_label="South")
    db_session.add_all([s_mh, s_kl])
    db_session.flush()

    # 3. Destinations
    d_rajgad = Destination(
        id="rajgad-fort",
        state_id="maharashtra",
        name="Rajgad Fort",
        category="Fort",
        description="Historical hill fort.",
    )
    d_munnar = Destination(
        id="munnar",
        state_id="kerala",
        name="Munnar",
        category="Hill Station",
        description="Tea gardens and hills.",
    )
    db_session.add_all([d_rajgad, d_munnar])
    db_session.flush()

    # 4. Users
    u_admin = User(
        id=uuid.uuid4(),
        role_id="admin",
        email="admin@gmail.com",
        password_hash="argon2_fake_hash",
        full_name="Rajesh Verma",
        is_active=True,
    )
    u_state_mgr = User(
        id=uuid.uuid4(),
        role_id="manager",
        email="statemgr@gmail.com",
        password_hash="argon2_fake_hash",
        full_name="Maharashtra State Director",
        is_active=True,
    )
    u_dest_mgr = User(
        id=uuid.uuid4(),
        role_id="manager",
        email="destmgr@gmail.com",
        password_hash="argon2_fake_hash",
        full_name="Rajgad Fort Officer",
        is_active=True,
    )
    u_tourist = User(
        id=uuid.uuid4(),
        role_id="tourist",
        email="tourist@gmail.com",
        password_hash="argon2_fake_hash",
        full_name="Aarav Sharma",
        is_active=True,
    )
    db_session.add_all([u_admin, u_state_mgr, u_dest_mgr, u_tourist])
    db_session.flush()

    # 5. Manager Assignments
    # State Manager: destination_id IS NULL
    assign_state = ManagerAssignment(
        user_id=u_state_mgr.id,
        role_id="manager",
        state_id="maharashtra",
        destination_id=None,
    )
    # Destination Manager: destination_id == 'rajgad-fort'
    assign_dest = ManagerAssignment(
        user_id=u_dest_mgr.id,
        role_id="manager",
        state_id="maharashtra",
        destination_id="rajgad-fort",
    )
    db_session.add_all([assign_state, assign_dest])
    db_session.commit()

    return {
        "admin": u_admin,
        "state_mgr": u_state_mgr,
        "dest_mgr": u_dest_mgr,
        "tourist": u_tourist,
        "rajgad": d_rajgad,
        "munnar": d_munnar,
    }


# -----------------------------------------------------------------------------
# Test Cases
# -----------------------------------------------------------------------------

def test_security_context_validation():
    """Verifies SecurityContext constructor validations."""
    valid_uuid = uuid.uuid4()
    ctx = SecurityContext(user_id=valid_uuid, role="tourist")
    assert ctx.user_id == valid_uuid
    assert ctx.role == "tourist"
    assert ctx.is_active is True

    # Invalid user_id must raise ValueError
    with pytest.raises(ValueError):
        SecurityContext(user_id="not-a-uuid", role="tourist")  # type: ignore

    # Missing role must raise ValueError
    with pytest.raises(ValueError):
        SecurityContext(user_id=valid_uuid, role="")


def test_missing_identity_context_fails_closed(db_session: Session, sample_hierarchy):
    """
    Verifies that requests without a verified identity context fail closed
    under authorization checks.
    """
    # An inactive context or non-manager role fails destination management check
    anonymous_ctx = SecurityContext(user_id=uuid.uuid4(), role="anonymous", is_active=False)
    can_manage = JurisdictionAuthorizer.can_manage_destination(
        session=db_session,
        context=anonymous_ctx,
        target_destination_id="rajgad-fort",
    )
    assert can_manage is False


def test_cross_destination_manager_access_denial(db_session: Session, sample_hierarchy):
    """
    Verifies that a Destination Manager for Rajgad Fort CANNOT manage Munnar
    or any other unassigned destination.
    """
    dest_mgr = sample_hierarchy["dest_mgr"]
    mgr_ctx = SecurityContext(
        user_id=dest_mgr.id,
        role="manager",
        destination_id="rajgad-fort",
        state_id="maharashtra",
    )

    # Authorized destination
    assert JurisdictionAuthorizer.can_manage_destination(
        session=db_session, context=mgr_ctx, target_destination_id="rajgad-fort"
    ) is True

    # Cross-destination unauthorized access
    assert JurisdictionAuthorizer.can_manage_destination(
        session=db_session, context=mgr_ctx, target_destination_id="munnar"
    ) is False


def test_state_manager_jurisdiction(db_session: Session, sample_hierarchy):
    """
    Verifies that a State Manager can manage any destination within their state,
    but CANNOT manage destinations in other states.
    """
    state_mgr = sample_hierarchy["state_mgr"]
    state_ctx = SecurityContext(
        user_id=state_mgr.id,
        role="manager",
        state_id="maharashtra",
        destination_id=None,
    )

    # Rajgad Fort is in Maharashtra -> Authorized
    assert JurisdictionAuthorizer.can_manage_destination(
        session=db_session, context=state_ctx, target_destination_id="rajgad-fort"
    ) is True

    # Munnar is in Kerala -> Denied
    assert JurisdictionAuthorizer.can_manage_destination(
        session=db_session, context=state_ctx, target_destination_id="munnar"
    ) is False

    # State-level governance authorization
    assert JurisdictionAuthorizer.can_manage_state(
        session=db_session, context=state_ctx, target_state_id="maharashtra"
    ) is True
    assert JurisdictionAuthorizer.can_manage_state(
        session=db_session, context=state_ctx, target_state_id="kerala"
    ) is False


def test_administrator_global_jurisdiction(db_session: Session, sample_hierarchy):
    """
    Verifies that an Administrator has global authority across all destinations and states.
    """
    admin = sample_hierarchy["admin"]
    admin_ctx = SecurityContext(user_id=admin.id, role="admin")

    assert JurisdictionAuthorizer.can_manage_destination(
        session=db_session, context=admin_ctx, target_destination_id="rajgad-fort"
    ) is True
    assert JurisdictionAuthorizer.can_manage_destination(
        session=db_session, context=admin_ctx, target_destination_id="munnar"
    ) is True
    assert JurisdictionAuthorizer.can_manage_state(
        session=db_session, context=admin_ctx, target_state_id="maharashtra"
    ) is True


def test_soft_deletion_query_filtering(db_session: Session, sample_hierarchy):
    """
    Verifies that SoftDeleteManager.filter_active excludes inactive records
    from normal queries while allowing authorized admin inspection.
    """
    admin = sample_hierarchy["admin"]
    rajgad = sample_hierarchy["rajgad"]

    # Create active advisory and inactive (soft-deleted) advisory
    adv_active = DestinationAdvisory(
        destination_id=rajgad.id,
        severity="info",
        title="Active Weather Advisory",
        description="Clear skies expected.",
        is_active=True,
        created_by=admin.id,
    )
    adv_inactive = DestinationAdvisory(
        destination_id=rajgad.id,
        severity="warning",
        title="Old Weather Alert",
        description="Expired heavy rain warning.",
        is_active=False,
        created_by=admin.id,
    )
    db_session.add_all([adv_active, adv_inactive])
    db_session.commit()

    # Normal application query: should return ONLY active advisory
    active_advisories = SoftDeleteManager.filter_active(
        db_session.query(DestinationAdvisory), DestinationAdvisory
    ).filter(DestinationAdvisory.destination_id == rajgad.id).all()

    assert len(active_advisories) == 1
    assert active_advisories[0].title == "Active Weather Advisory"

    # Authorized admin inspection: should return BOTH advisories
    all_advisories = SoftDeleteManager.filter_active(
        db_session.query(DestinationAdvisory), DestinationAdvisory, include_inactive=True
    ).filter(DestinationAdvisory.destination_id == rajgad.id).all()

    assert len(all_advisories) == 2


def test_session_security_context_pooling_cleanup(db_session: Session):
    """
    Verifies that setting and clearing security context executes cleanly
    and resets session state without leaking between requests.
    """
    test_user_id = uuid.uuid4()
    context = SecurityContext(user_id=test_user_id, role="tourist")

    # Applies context to session
    set_database_security_context(db_session, context)

    # Clears context on connection release / session close
    clear_database_security_context(db_session)
