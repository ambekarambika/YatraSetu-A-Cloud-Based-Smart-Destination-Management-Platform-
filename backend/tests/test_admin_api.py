"""
YatraSetu Platform — Administrator Governance API Unit & Integration Tests
Verifies RBAC protection, platform statistics, user management, status transitions,
manager authority assignments, stakeholder destination reassignment, and audit trail.
"""

import uuid
import pytest
from datetime import datetime
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.identity import User, Role, ManagerAssignment
from app.models.destination import Destination, State
from app.models.stakeholder import StakeholderService
from app.models.governance import AuditLog
from app.core.tokens import TokenService
from app.core.hashing import PasswordSecurity


# -----------------------------------------------------------------------------
# Fixtures
# -----------------------------------------------------------------------------

@pytest.fixture
def admin_test_data(db_session: Session):
    """Seed reference roles, states, and destinations for testing."""
    for role_id, name in [
        ("admin", "Platform Administrator"),
        ("manager", "Destination Manager"),
        ("stakeholder", "Tourism Stakeholder"),
        ("tourist", "Tourist"),
    ]:
        if not db_session.query(Role).filter(Role.id == role_id).first():
            db_session.add(Role(id=role_id, name=name))

    for state_id, name in [
        ("maharashtra", "Maharashtra"),
        ("kerala", "Kerala"),
    ]:
        if not db_session.query(State).filter(State.id == state_id).first():
            db_session.add(State(id=state_id, name=name, theme_code=state_id, badge_label=name.upper()))

    destinations = [
        Destination(
            id="rajgad-fort",
            state_id="maharashtra",
            name="Rajgad Fort",
            category="Forts & Heritage",
            location_label="Pune, Maharashtra",
            description="Historical capital of the Maratha Empire under Chhatrapati Shivaji Maharaj.",
        ),
        Destination(
            id="ajanta-caves",
            state_id="maharashtra",
            name="Ajanta Caves",
            category="UNESCO Heritage",
            location_label="Chhatrapati Sambhajinagar, Maharashtra",
            description="Ancient Buddhist rock-cut caves with world-famous fresco paintings.",
        ),
    ]
    for d in destinations:
        if not db_session.query(Destination).filter(Destination.id == d.id).first():
            db_session.add(d)

    db_session.commit()


@pytest.fixture
def admin_user(db_session: Session, admin_test_data):
    admin = db_session.query(User).filter(User.role_id == "admin").first()
    if not admin:
        admin = User(
            id=uuid.uuid4(),
            role_id="admin",
            email="test.admin.fixture@example.com",
            password_hash=PasswordSecurity.hash_password("Admin@Secure123"),
            full_name="Rajesh Verma (Test Admin)",
            is_active=True,
            is_verified=True,
        )
        db_session.add(admin)
        db_session.commit()
        db_session.refresh(admin)
    return admin


@pytest.fixture
def admin_token(admin_user: User):
    token, _ = TokenService.create_access_token(user_id=admin_user.id, role="admin")
    return token


@pytest.fixture
def tourist_token(db_session: Session, admin_test_data):
    tourist = db_session.query(User).filter(User.role_id == "tourist").first()
    if not tourist:
        tourist = User(
            id=uuid.uuid4(),
            role_id="tourist",
            email="test.tourist.mock@example.com",
            password_hash=PasswordSecurity.hash_password("Tourist@Secure123"),
            full_name="Test Tourist",
            is_active=True,
            is_verified=True,
        )
        db_session.add(tourist)
        db_session.commit()
        db_session.refresh(tourist)
    token, _ = TokenService.create_access_token(user_id=tourist.id, role="tourist")
    return token


@pytest.fixture
def manager_user(db_session: Session, admin_test_data):
    mgr = db_session.query(User).filter(User.role_id == "manager").first()
    if not mgr:
        mgr = User(
            id=uuid.uuid4(),
            role_id="manager",
            email="test.mgr.mock@example.com",
            password_hash=PasswordSecurity.hash_password("Manager@Secure123"),
            full_name="Test Manager",
            is_active=True,
            is_verified=True,
        )
        db_session.add(mgr)
        db_session.flush()

        # Needs assignment for manager context
        assignment = ManagerAssignment(
            user_id=mgr.id,
            role_id="manager",
            state_id="maharashtra",
            destination_id="rajgad-fort",
        )
        db_session.add(assignment)
        db_session.commit()
        db_session.refresh(mgr)
    return mgr


@pytest.fixture
def manager_token(manager_user: User):
    token, _ = TokenService.create_access_token(user_id=manager_user.id, role="manager")
    return token


# -----------------------------------------------------------------------------
# 1. Authentication & Role-Based Access Control Tests
# -----------------------------------------------------------------------------

def test_admin_endpoints_unauthenticated(client: TestClient):
    """Unauthenticated access to any admin endpoint must fail with 401."""
    endpoints = [
        ("GET", "/api/v1/admin/stats"),
        ("GET", "/api/v1/admin/users"),
        ("GET", "/api/v1/admin/managers"),
        ("GET", "/api/v1/admin/registrations"),
        ("GET", "/api/v1/admin/audit-logs"),
        ("GET", "/api/v1/admin/roles"),
    ]
    for method, path in endpoints:
        res = client.request(method, path)
        assert res.status_code == 401, f"Expected 401 for {method} {path}, got {res.status_code}"


def test_admin_endpoints_forbidden_for_non_admin(client: TestClient, tourist_token, manager_token):
    """Tourist and Manager tokens must be rejected with 403 on admin routes."""
    headers_tourist = {"Authorization": f"Bearer {tourist_token}"}
    headers_manager = {"Authorization": f"Bearer {manager_token}"}

    for headers, role_name in [(headers_tourist, "tourist"), (headers_manager, "manager")]:
        res = client.get("/api/v1/admin/stats", headers=headers)
        assert res.status_code == 403, f"Expected 403 for {role_name}, got {res.status_code}"

        res_users = client.get("/api/v1/admin/users", headers=headers)
        assert res_users.status_code == 403, f"Expected 403 for {role_name}, got {res_users.status_code}"


# -----------------------------------------------------------------------------
# 2. Platform Statistics Tests
# -----------------------------------------------------------------------------

def test_admin_stats(client: TestClient, admin_token, admin_test_data):
    """Admin stats endpoint returns real metrics from database."""
    headers = {"Authorization": f"Bearer {admin_token}"}
    res = client.get("/api/v1/admin/stats", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "total_users" in data
    assert "active_managers" in data
    assert "pending_registrations" in data
    assert "active_destinations" in data
    assert data["total_users"] >= 1
    assert data["active_destinations"] >= 1


# -----------------------------------------------------------------------------
# 3. User Directory & Lifecycle Management Tests
# -----------------------------------------------------------------------------

def test_admin_list_users(client: TestClient, admin_token):
    """Admin can list and filter users."""
    headers = {"Authorization": f"Bearer {admin_token}"}
    res = client.get("/api/v1/admin/users?page=1&page_size=10", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "items" in data
    assert "total" in data
    assert data["total"] >= 1

    # Filter by role
    res_admin = client.get("/api/v1/admin/users?role=admin", headers=headers)
    assert res_admin.status_code == 200
    items = res_admin.json()["items"]
    assert all(u["role"] == "admin" for u in items)


def test_admin_user_status_update_and_audit(client: TestClient, admin_token, tourist_token, db_session: Session):
    """Admin can deactivate and activate user accounts with audit trail."""
    headers = {"Authorization": f"Bearer {admin_token}"}

    # Create a target tourist user
    target = User(
        id=uuid.uuid4(),
        role_id="tourist",
        email=f"temp.tourist.{uuid.uuid4().hex[:6]}@example.com",
        password_hash=PasswordSecurity.hash_password("TempPass123!"),
        full_name="Status Target Tourist",
        is_active=True,
    )
    db_session.add(target)
    db_session.commit()

    # Deactivate account
    res = client.put(
        f"/api/v1/admin/users/{target.id}/status",
        headers=headers,
        json={"status": "deactivated", "reason": "Test administrative deactivation"},
    )
    assert res.status_code == 200
    assert res.json()["is_active"] is False

    # Verify audit log was created
    audit = (
        db_session.query(AuditLog)
        .filter(AuditLog.record_id == target.id, AuditLog.action == "USER_STATUS_CHANGE")
        .first()
    )
    assert audit is not None
    assert audit.new_values["status"] == "deactivated"
    assert audit.new_values["reason"] == "Test administrative deactivation"

    # Reactivate account
    res_re = client.put(
        f"/api/v1/admin/users/{target.id}/status",
        headers=headers,
        json={"status": "active", "reason": "Account restored"},
    )
    assert res_re.status_code == 200
    assert res_re.json()["is_active"] is True


def test_admin_cannot_deactivate_or_delete_self(client: TestClient, admin_user: User, admin_token):
    """Administrator is blocked from accidentally deactivating or deleting their own account."""
    headers = {"Authorization": f"Bearer {admin_token}"}

    # Attempt self-deactivation
    res = client.put(
        f"/api/v1/admin/users/{admin_user.id}/status",
        headers=headers,
        json={"status": "deactivated", "reason": "Accidental self-lockout"},
    )
    assert res.status_code == 400
    assert "cannot deactivate" in res.json()["detail"].lower()

    # Attempt self-deletion
    res_del = client.delete(
        f"/api/v1/admin/users/{admin_user.id}",
        headers=headers,
    )
    assert res_del.status_code == 400
    assert "cannot delete" in res_del.json()["detail"].lower()


# -----------------------------------------------------------------------------
# 4. Manager Authority & Jurisdiction Scoping Tests
# -----------------------------------------------------------------------------

def test_admin_manager_authority_assignment(client: TestClient, admin_token, manager_user: User, admin_test_data, db_session: Session):
    """Admin can list and assign/reassign manager jurisdictions."""
    headers = {"Authorization": f"Bearer {admin_token}"}

    # List managers
    res = client.get("/api/v1/admin/managers", headers=headers)
    assert res.status_code == 200
    managers = res.json()
    assert any(m["user_id"] == str(manager_user.id) for m in managers)

    # Reassign manager to State Manager (destination_id = None)
    res_assign = client.post(
        "/api/v1/admin/managers/assign",
        headers=headers,
        json={
            "user_id": str(manager_user.id),
            "state_id": "maharashtra",
            "destination_id": None,
            "reason": "Promoted to State Manager oversight",
        },
    )
    assert res_assign.status_code == 200
    data = res_assign.json()
    assert data["access_level"] == "State Manager"
    assert data["destination_id"] is None

    # Reassign manager to specific destination
    res_dest = client.post(
        "/api/v1/admin/managers/assign",
        headers=headers,
        json={
            "user_id": str(manager_user.id),
            "state_id": "maharashtra",
            "destination_id": "ajanta-caves",
            "reason": "Assigned to lead Ajanta Caves jurisdiction",
        },
    )
    assert res_dest.status_code == 200
    data_dest = res_dest.json()
    assert data_dest["access_level"] == "Destination Manager"
    assert data_dest["destination_id"] == "ajanta-caves"


# -----------------------------------------------------------------------------
# 5. Controlled Stakeholder Destination Reassignment Tests
# -----------------------------------------------------------------------------

def test_admin_stakeholder_destination_reassignment(client: TestClient, admin_token, admin_test_data, db_session: Session):
    """Admin can reassign stakeholder destination with audit trail and validation."""
    headers = {"Authorization": f"Bearer {admin_token}"}

    # Create a stakeholder user and service
    sh_user = User(
        id=uuid.uuid4(),
        role_id="stakeholder",
        email=f"sh.reassign.{uuid.uuid4().hex[:6]}@example.com",
        password_hash=PasswordSecurity.hash_password("StakeholderPass123!"),
        full_name="Reassign Test Stakeholder",
        is_active=True,
    )
    db_session.add(sh_user)
    db_session.flush()

    service = StakeholderService(
        id=uuid.uuid4(),
        user_id=sh_user.id,
        role_id="stakeholder",
        destination_id="rajgad-fort",
        state_id="maharashtra",
        business_name=f"Heritage Treks {uuid.uuid4().hex[:4]}",
        category="Tours & Guides",
        verification_status="verified",
    )
    db_session.add(service)
    db_session.commit()

    # Negative test: reason shorter than 6 characters
    res_short = client.post(
        f"/api/v1/admin/stakeholders/{service.id}/reassign-destination",
        headers=headers,
        json={
            "new_destination_id": "ajanta-caves",
            "reason": "short",
        },
    )
    assert res_short.status_code == 422

    # Positive test: valid reassignment with reason
    res_reassign = client.post(
        f"/api/v1/admin/stakeholders/{service.id}/reassign-destination",
        headers=headers,
        json={
            "new_destination_id": "ajanta-caves",
            "reason": "Administrative relocation to Ajanta Caves circuit",
        },
    )
    assert res_reassign.status_code == 200
    data = res_reassign.json()
    assert data["old_destination_id"] == "rajgad-fort"
    assert data["new_destination_id"] == "ajanta-caves"
    assert data["audit_log_id"] is not None

    # Verify audit log in database
    audit = (
        db_session.query(AuditLog)
        .filter(AuditLog.record_id == service.id, AuditLog.action == "CONTROLLED_DESTINATION_REASSIGNMENT")
        .first()
    )
    assert audit is not None
    assert audit.old_values["destination_id"] == "rajgad-fort"
    assert audit.new_values["destination_id"] == "ajanta-caves"
    assert audit.new_values["reason"] == "Administrative relocation to Ajanta Caves circuit"


# -----------------------------------------------------------------------------
# 6. Audit Trail Telemetry Tests
# -----------------------------------------------------------------------------

def test_admin_audit_logs(client: TestClient, admin_token):
    """Admin can query paginated platform audit logs."""
    headers = {"Authorization": f"Bearer {admin_token}"}
    res = client.get("/api/v1/admin/audit-logs?page=1&page_size=20", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "items" in data
    assert "total" in data
    assert data["page"] == 1
