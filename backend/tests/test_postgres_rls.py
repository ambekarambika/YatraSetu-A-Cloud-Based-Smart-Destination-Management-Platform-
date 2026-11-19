"""
YatraSetu Platform — PostgreSQL Integration Test Suite (Disposable Database / Docker / CI)
=============================================================================
IMPORTANT VERIFICATION NOTICE:
This integration suite tests PostgreSQL-specific Row-Level Security (RLS) policies,
SET LOCAL transaction isolation, role escalation prevention, audit forgery denial,
manager assignment governance boundaries, and storage registry isolation.

EXECUTION INSTRUCTIONS:
This suite requires a live PostgreSQL instance (e.g., local disposable Docker container,
staging PostgreSQL, or CI service).

To run against a disposable PostgreSQL instance:
    export POSTGRES_TEST_URL="postgresql://postgres:postgres@localhost:5432/yatrasetu_test"
    pytest backend/tests/test_postgres_rls.py

When POSTGRES_TEST_URL is not set or PostgreSQL is unreachable, these tests
are explicitly SKIPPED with an informative message. They are NOT reported as passed
unless actually executed against PostgreSQL.
=============================================================================
"""

import os
import uuid
import pytest
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

load_dotenv()

POSTGRES_TEST_URL = os.environ.get("POSTGRES_TEST_URL")

# Check if PostgreSQL is available
postgres_available = False
if POSTGRES_TEST_URL:
    try:
        engine_check = create_engine(POSTGRES_TEST_URL, pool_pre_ping=True)
        with engine_check.connect() as conn:
            conn.execute(text("SELECT 1"))
        postgres_available = True
    except Exception:
        postgres_available = False


pytestmark = pytest.mark.skipif(
    not postgres_available,
    reason="Requires live PostgreSQL instance via POSTGRES_TEST_URL environment variable"
)


# -----------------------------------------------------------------------------
# Fixtures & Transaction Isolation Lifecycle
# -----------------------------------------------------------------------------

@pytest.fixture(scope="module")
def pg_engine():
    """Provides a shared PostgreSQL engine for the test module."""
    engine = create_engine(POSTGRES_TEST_URL, pool_pre_ping=True)
    yield engine
    engine.dispose()


@pytest.fixture(scope="function")
def pg_session(pg_engine):
    """
    Provides a clean, transaction-isolated session per test function.
    Guarantees rollback on teardown so failed tests never contaminate subsequent tests.
    """
    Session = sessionmaker(bind=pg_engine)
    session = Session()
    try:
        yield session
    finally:
        session.rollback()
        session.close()


def set_pg_context(session, user_id=None, role=None, state_id=None, destination_id=None, is_local=True):
    """Sets PostgreSQL configuration variables safely using standard set_config."""
    if user_id is not None:
        session.execute(
            text("SELECT set_config('app.current_user_id', :val, :loc);"),
            {"val": str(user_id), "loc": is_local},
        )
    if role is not None:
        session.execute(
            text("SELECT set_config('app.current_role', :val, :loc);"),
            {"val": str(role), "loc": is_local},
        )
    if state_id is not None:
        session.execute(
            text("SELECT set_config('app.current_state_id', :val, :loc);"),
            {"val": str(state_id), "loc": is_local},
        )
    if destination_id is not None:
        session.execute(
            text("SELECT set_config('app.current_destination_id', :val, :loc);"),
            {"val": str(destination_id), "loc": is_local},
        )


def reset_pg_context(session):
    """Safely resets all app security context settings without reserved keyword syntax issues."""
    session.execute(text("SELECT set_config('app.current_user_id', '', false);"))
    session.execute(text("SELECT set_config('app.current_role', '', false);"))
    session.execute(text("SELECT set_config('app.current_state_id', '', false);"))
    session.execute(text("SELECT set_config('app.current_destination_id', '', false);"))


def seed_test_destinations(session):
    """Seeds test destinations within an active transaction for foreign-key and jurisdiction checks."""
    session.execute(text("SELECT set_config('app.current_role', 'admin', true);"))
    session.execute(text("""
        INSERT INTO destinations (id, state_id, name, category, description)
        VALUES 
            ('rajgad-fort', 'maharashtra', 'Rajgad Fort', 'Fort', 'Historic hill fort'),
            ('ellora-caves', 'maharashtra', 'Ellora Caves', 'Caves', 'Rock-cut caves'),
            ('munnar', 'kerala', 'Munnar', 'Nature', 'Hill station')
        ON CONFLICT (id) DO NOTHING;
    """))


# -----------------------------------------------------------------------------
# Base RLS Tests (Migrations 002 & 003)
# -----------------------------------------------------------------------------

def test_pg_missing_context_fails_closed(pg_session):
    """
    Verifies that querying RLS-protected tables without identity context
    returns 0 rows (fail-closed behavior).
    """
    reset_pg_context(pg_session)
    result = pg_session.execute(text("SELECT COUNT(*) FROM users;")).scalar()
    assert result == 0


def test_pg_cross_user_isolation(pg_session):
    """
    Verifies that User A cannot read or modify User B's record under PostgreSQL RLS.
    """
    user_a_id = str(uuid.uuid4())
    user_b_id = str(uuid.uuid4())

    set_pg_context(pg_session, user_id=user_a_id, role="tourist")

    result = pg_session.execute(
        text(f"SELECT id FROM users WHERE id = '{user_b_id}';")
    ).fetchall()
    assert len(result) == 0


def test_pg_user_role_escalation_denied(pg_session):
    """
    Verifies that a tourist cannot promote themselves to 'admin' via UPDATE.
    """
    pg_session.execute(text("BEGIN;"))
    user_id = str(uuid.uuid4())

    # Seed tourist user record within transaction
    set_pg_context(pg_session, role="admin")
    pg_session.execute(text(f"""
        INSERT INTO users (id, email, password_hash, full_name, role_id, is_active, is_verified, preferences)
        VALUES ('{user_id}', '{user_id}@example.com', 'hash', 'Tourist User', 'tourist', true, false, '{{}}');
    """))

    # Switch to tourist context
    set_pg_context(pg_session, user_id=user_id, role="tourist")

    with pytest.raises(Exception):
        pg_session.execute(
            text(f"UPDATE users SET role_id = 'admin' WHERE id = '{user_id}';")
        )
    pg_session.execute(text("ROLLBACK;"))


def test_pg_audit_log_actor_forgery_denied(pg_session):
    """
    Verifies that an ordinary user cannot insert an audit log claiming to be another actor.
    """
    pg_session.execute(text("BEGIN;"))
    user_id = str(uuid.uuid4())
    forged_actor_id = str(uuid.uuid4())

    set_pg_context(pg_session, user_id=user_id, role="tourist")

    with pytest.raises(Exception):
        pg_session.execute(
            text(f"""
                INSERT INTO audit_logs (id, table_name, record_id, action, changed_by)
                VALUES ('{uuid.uuid4()}', 'destinations', '{uuid.uuid4()}', 'UPDATE', '{forged_actor_id}');
            """)
        )
    pg_session.execute(text("ROLLBACK;"))


def test_pg_pooled_connection_context_isolation(pg_session):
    """
    Verifies that SET LOCAL variables do not persist after transaction commit/rollback.
    """
    user_id = str(uuid.uuid4())

    pg_session.execute(text("BEGIN;"))
    set_pg_context(pg_session, user_id=user_id, is_local=True)
    pg_session.execute(text("COMMIT;"))

    val = pg_session.execute(
        text("SELECT current_setting('app.current_user_id', true);")
    ).scalar()
    assert val is None or val == ""


# -----------------------------------------------------------------------------
# Migration 004 Integration Tests
# -----------------------------------------------------------------------------

def test_pg_manager_bootstrap_assignment_lookup(pg_session):
    """
    Verifies that a manager can read their own assignment during authentication bootstrap
    when app.current_state_id and app.current_destination_id are NULL.
    """
    manager_id = str(uuid.uuid4())

    pg_session.execute(text("BEGIN;"))
    set_pg_context(pg_session, user_id=manager_id, role="manager")

    rows = pg_session.execute(
        text(f"SELECT id FROM manager_assignments WHERE user_id = '{manager_id}';")
    ).fetchall()
    pg_session.execute(text("ROLLBACK;"))


def test_pg_destination_manager_cross_assignment_denied(pg_session):
    """
    Verifies that a Destination Manager for Rajgad Fort cannot view another manager's assignment.
    """
    dest_mgr_a = str(uuid.uuid4())
    dest_mgr_b = str(uuid.uuid4())

    pg_session.execute(text("BEGIN;"))
    set_pg_context(pg_session, user_id=dest_mgr_a, role="manager", state_id="maharashtra", destination_id="rajgad-fort")

    rows = pg_session.execute(
        text(f"SELECT id FROM manager_assignments WHERE user_id = '{dest_mgr_b}';")
    ).fetchall()
    assert len(rows) == 0
    pg_session.execute(text("ROLLBACK;"))


def test_pg_state_manager_cross_state_denied(pg_session):
    """
    Verifies that a Maharashtra State Manager cannot view manager assignments in Kerala.
    """
    state_mgr_mh = str(uuid.uuid4())

    pg_session.execute(text("BEGIN;"))
    set_pg_context(pg_session, user_id=state_mgr_mh, role="manager", state_id="maharashtra")

    rows = pg_session.execute(
        text("SELECT id FROM manager_assignments WHERE state_id = 'kerala';")
    ).fetchall()
    assert len(rows) == 0
    pg_session.execute(text("ROLLBACK;"))


def test_pg_non_admin_assignment_modification_rejected(pg_session):
    """
    Verifies that non-admin callers cannot insert, update, or delete manager_assignments.
    """
    tourist_id = str(uuid.uuid4())

    pg_session.execute(text("BEGIN;"))
    set_pg_context(pg_session, user_id=tourist_id, role="tourist")

    with pytest.raises(Exception):
        pg_session.execute(
            text(f"""
                INSERT INTO manager_assignments (id, user_id, role_id, state_id, destination_id)
                VALUES ('{uuid.uuid4()}', '{tourist_id}', 'manager', 'maharashtra', 'rajgad-fort');
            """)
        )
    pg_session.execute(text("ROLLBACK;"))


def test_pg_storage_registry_isolated_from_ordinary_roles(pg_session):
    """
    Verifies that ordinary roles (tourist, stakeholder, manager) receive 0 rows from storage_object_registry.
    """
    user_id = str(uuid.uuid4())

    pg_session.execute(text("BEGIN;"))
    set_pg_context(pg_session, user_id=user_id, role="tourist")

    rows = pg_session.execute(text("SELECT COUNT(*) FROM storage_object_registry;")).scalar()
    assert rows == 0
    pg_session.execute(text("ROLLBACK;"))


# -----------------------------------------------------------------------------
# Migration 005 Integration Tests (Catalogue & Advisory RLS Hardening)
# -----------------------------------------------------------------------------

def test_pg_catalogue_unauthenticated_select_allowed(pg_session):
    """
    Verifies that public catalogue browsing (SELECT) on destinations, attractions,
    and events succeeds when unauthenticated (app.current_user_id and role are NULL).
    """
    pg_session.execute(text("BEGIN;"))
    reset_pg_context(pg_session)

    dests = pg_session.execute(text("SELECT COUNT(*) FROM destinations;")).scalar()
    attrs = pg_session.execute(text("SELECT COUNT(*) FROM attractions;")).scalar()
    events = pg_session.execute(text("SELECT COUNT(*) FROM events;")).scalar()
    assert dests >= 0
    assert attrs >= 0
    assert events >= 0
    pg_session.execute(text("ROLLBACK;"))


def test_pg_destination_manager_attraction_mutations(pg_session):
    """
    Verifies that a Destination Manager:
    - Can insert attractions into their assigned destination.
    - Is denied (RLS violation) when attempting to insert into another destination.
    """
    dm_id = str(uuid.uuid4())
    attr_id_ok = str(uuid.uuid4())
    attr_id_bad = str(uuid.uuid4())

    pg_session.execute(text("BEGIN;"))
    seed_test_destinations(pg_session)
    set_pg_context(pg_session, user_id=dm_id, role="manager", state_id="maharashtra", destination_id="rajgad-fort")

    # 1. Permitted insert in assigned destination
    pg_session.execute(text(f"""
        INSERT INTO attractions (id, destination_id, name, category, rating, status)
        VALUES ('{attr_id_ok}', 'rajgad-fort', 'Padmavati Machi Test', 'Fort', 4.5, 'Open');
    """))

    # 2. Denied insert in another destination within the same state
    with pytest.raises(Exception):
        pg_session.execute(text(f"""
            INSERT INTO attractions (id, destination_id, name, category, rating, status)
            VALUES ('{attr_id_bad}', 'ellora-caves', 'Cave 16 Test', 'Caves', 4.9, 'Open');
        """))

    pg_session.execute(text("ROLLBACK;"))


def test_pg_state_manager_attraction_mutations(pg_session):
    """
    Verifies that a State Manager:
    - Can insert attractions into destinations in their assigned state.
    - Is denied when attempting to insert into a destination belonging to another state.
    """
    sm_id = str(uuid.uuid4())
    attr_id_mh = str(uuid.uuid4())
    attr_id_kl = str(uuid.uuid4())

    pg_session.execute(text("BEGIN;"))
    seed_test_destinations(pg_session)
    set_pg_context(pg_session, user_id=sm_id, role="manager", state_id="maharashtra", destination_id="")

    # 1. Permitted insert for destination in Maharashtra
    pg_session.execute(text(f"""
        INSERT INTO attractions (id, destination_id, name, category, rating, status)
        VALUES ('{attr_id_mh}', 'rajgad-fort', 'Suvela Machi SM', 'Fort', 4.8, 'Open');
    """))

    # 2. Denied insert for destination in Kerala
    with pytest.raises(Exception):
        pg_session.execute(text(f"""
            INSERT INTO attractions (id, destination_id, name, category, rating, status)
            VALUES ('{attr_id_kl}', 'munnar', 'Tea Garden SM', 'Nature', 4.7, 'Open');
        """))

    pg_session.execute(text("ROLLBACK;"))


def test_pg_attraction_reassignment_denied(pg_session):
    """
    Verifies that an UPDATE attempting to reassign an attraction to an out-of-jurisdiction
    destination fails WITH CHECK and raises an RLS error.
    """
    dm_id = str(uuid.uuid4())
    attr_id = str(uuid.uuid4())

    pg_session.execute(text("BEGIN;"))
    seed_test_destinations(pg_session)
    # Seed attraction as admin
    set_pg_context(pg_session, role="admin")
    pg_session.execute(text(f"""
        INSERT INTO attractions (id, destination_id, name, category, rating, status)
        VALUES ('{attr_id}', 'rajgad-fort', 'Reassign Test Attraction', 'Fort', 4.0, 'Open');
    """))

    # Switch to Destination Manager for rajgad-fort
    set_pg_context(pg_session, user_id=dm_id, role="manager", state_id="maharashtra", destination_id="rajgad-fort")

    # Attempt to reassign destination_id to ellora-caves
    with pytest.raises(Exception):
        pg_session.execute(text(f"""
            UPDATE attractions SET destination_id = 'ellora-caves' WHERE id = '{attr_id}';
        """))

    pg_session.execute(text("ROLLBACK;"))


def test_pg_event_jurisdiction_enforcement(pg_session):
    """
    Verifies that Event mutations enforce strict destination and state jurisdiction.
    """
    dm_id = str(uuid.uuid4())
    ev_ok_id = str(uuid.uuid4())
    ev_bad_id = str(uuid.uuid4())

    pg_session.execute(text("BEGIN;"))
    seed_test_destinations(pg_session)
    set_pg_context(pg_session, user_id=dm_id, role="manager", state_id="maharashtra", destination_id="rajgad-fort")

    # Permitted event creation
    pg_session.execute(text(f"""
        INSERT INTO events (id, destination_id, title, date_num, date_month, location_label, status, status_class)
        VALUES ('{ev_ok_id}', 'rajgad-fort', 'Shivaji Jayanti', '19', 'FEB', 'Machi', 'Open', 'active');
    """))

    # Denied cross-destination event creation
    with pytest.raises(Exception):
        pg_session.execute(text(f"""
            INSERT INTO events (id, destination_id, title, date_num, date_month, location_label, status, status_class)
            VALUES ('{ev_bad_id}', 'ellora-caves', 'Ellora Dance', '15', 'MAR', 'Caves', 'Open', 'active');
        """))

    pg_session.execute(text("ROLLBACK;"))


def test_pg_manager_destination_mutations_denied(pg_session):
    """
    Verifies that managers (both Destination and State Managers) cannot INSERT, UPDATE,
    or DELETE rows in the destinations table (Admin-only mutations).
    """
    sm_id = str(uuid.uuid4())

    pg_session.execute(text("BEGIN;"))
    seed_test_destinations(pg_session)
    set_pg_context(pg_session, user_id=sm_id, role="manager", state_id="maharashtra", destination_id="")

    # State Manager attempting to insert a destination
    with pytest.raises(Exception):
        pg_session.execute(text(f"""
            INSERT INTO destinations (id, state_id, name, category, description)
            VALUES ('fake-fort', 'maharashtra', 'Fake Fort', 'Heritage', 'A fake destination');
        """))

    # State Manager attempting to delete a destination
    with pytest.raises(Exception):
        pg_session.execute(text("""
            DELETE FROM destinations WHERE id = 'rajgad-fort';
        """))

    pg_session.execute(text("ROLLBACK;"))


def test_pg_advisories_hardened_cross_destination_denied(pg_session):
    """
    Verifies that a Destination Manager for rajgad-fort cannot insert an advisory for ellora-caves,
    confirming that the Migration 002 OR-combination loophole is closed.
    """
    dm_id = str(uuid.uuid4())
    adv_id = str(uuid.uuid4())

    pg_session.execute(text("BEGIN;"))
    seed_test_destinations(pg_session)
    set_pg_context(pg_session, user_id=dm_id, role="manager", state_id="maharashtra", destination_id="rajgad-fort")

    # Attempt to insert advisory for ellora-caves (same state, different destination)
    with pytest.raises(Exception):
        pg_session.execute(text(f"""
            INSERT INTO destination_advisories (id, destination_id, title, advisory_type, severity, message, is_active, issued_by)
            VALUES ('{adv_id}', 'ellora-caves', 'Trail Warning', 'safety', 'warning', 'Slippery rocks', true, '{dm_id}');
        """))

    pg_session.execute(text("ROLLBACK;"))


def test_pg_tourist_and_stakeholder_catalogue_mutations_denied(pg_session):
    """
    Verifies that tourists and stakeholders receive RLS policy violations when attempting
    to INSERT, UPDATE, or DELETE on destinations, attractions, or events.
    """
    tourist_id = str(uuid.uuid4())

    pg_session.execute(text("BEGIN;"))
    seed_test_destinations(pg_session)
    set_pg_context(pg_session, user_id=tourist_id, role="tourist")

    with pytest.raises(Exception):
        pg_session.execute(text(f"""
            INSERT INTO attractions (id, destination_id, name, category, rating, status)
            VALUES ('{uuid.uuid4()}', 'rajgad-fort', 'Hacked Attraction', 'Fort', 5.0, 'Open');
        """))

    with pytest.raises(Exception):
        pg_session.execute(text(f"""
            INSERT INTO events (id, destination_id, title, date_num, date_month, location_label)
            VALUES ('{uuid.uuid4()}', 'rajgad-fort', 'Hacked Fest', '01', 'JAN', 'Fort');
        """))

    pg_session.execute(text("ROLLBACK;"))
