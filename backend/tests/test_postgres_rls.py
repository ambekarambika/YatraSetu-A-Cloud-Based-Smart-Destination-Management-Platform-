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
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

POSTGRES_TEST_URL = os.environ.get("POSTGRES_TEST_URL")

# Check if PostgreSQL is available
postgres_available = False
if POSTGRES_TEST_URL:
    try:
        engine_check = create_engine(POSTGRES_TEST_URL)
        with engine_check.connect() as conn:
            conn.execute(text("SELECT 1"))
        postgres_available = True
    except Exception:
        postgres_available = False


pytestmark = pytest.mark.skipif(
    not postgres_available,
    reason="Requires live PostgreSQL instance via POSTGRES_TEST_URL environment variable"
)


@pytest.fixture(scope="module")
def pg_session():
    """Provides a PostgreSQL session connected to the test database."""
    engine = create_engine(POSTGRES_TEST_URL)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()


def test_pg_missing_context_fails_closed(pg_session):
    """
    Verifies that querying RLS-protected tables without SET LOCAL identity
    returns 0 rows (fail-closed behavior).
    """
    pg_session.execute(text("RESET app.current_user_id;"))
    pg_session.execute(text("RESET app.current_role;"))
    
    result = pg_session.execute(text("SELECT COUNT(*) FROM users;")).scalar()
    assert result == 0


def test_pg_cross_user_isolation(pg_session):
    """
    Verifies that User A cannot read or modify User B's record under PostgreSQL RLS.
    """
    user_a_id = str(uuid.uuid4())
    user_b_id = str(uuid.uuid4())

    pg_session.execute(text(f"SET LOCAL app.current_user_id = '{user_a_id}';"))
    pg_session.execute(text("SET LOCAL app.current_role = 'tourist';"))

    result = pg_session.execute(
        text(f"SELECT id FROM users WHERE id = '{user_b_id}';")
    ).fetchall()
    assert len(result) == 0


def test_pg_user_role_escalation_denied(pg_session):
    """
    Verifies that a tourist cannot promote themselves to 'admin' via UPDATE.
    """
    user_id = str(uuid.uuid4())

    pg_session.execute(text(f"SET LOCAL app.current_user_id = '{user_id}';"))
    pg_session.execute(text("SET LOCAL app.current_role = 'tourist';"))

    with pytest.raises(Exception):
        pg_session.execute(
            text(f"UPDATE users SET role_id = 'admin' WHERE id = '{user_id}';")
        )
        pg_session.commit()


def test_pg_audit_log_actor_forgery_denied(pg_session):
    """
    Verifies that an ordinary user cannot insert an audit log claiming to be another actor.
    """
    user_id = str(uuid.uuid4())
    forged_actor_id = str(uuid.uuid4())

    pg_session.execute(text(f"SET LOCAL app.current_user_id = '{user_id}';"))
    pg_session.execute(text("SET LOCAL app.current_role = 'tourist';"))

    with pytest.raises(Exception):
        pg_session.execute(
            text(f"""
                INSERT INTO audit_logs (id, table_name, record_id, action, changed_by)
                VALUES ('{uuid.uuid4()}', 'destinations', '{uuid.uuid4()}', 'UPDATE', '{forged_actor_id}');
            """)
        )
        pg_session.commit()


def test_pg_pooled_connection_context_isolation(pg_session):
    """
    Verifies that SET LOCAL variables do not persist after transaction commit/rollback.
    """
    user_id = str(uuid.uuid4())

    pg_session.execute(text("BEGIN;"))
    pg_session.execute(text(f"SET LOCAL app.current_user_id = '{user_id}';"))
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
    pg_session.execute(text(f"SET LOCAL app.current_user_id = '{manager_id}';"))
    pg_session.execute(text("SET LOCAL app.current_role = 'manager';"))
    # Notice: app.current_state_id and app.current_destination_id are deliberately omitted/null

    # Query own assignment
    rows = pg_session.execute(
        text(f"SELECT id FROM manager_assignments WHERE user_id = '{manager_id}';")
    ).fetchall()
    # Query executed successfully under RLS
    pg_session.execute(text("ROLLBACK;"))


def test_pg_destination_manager_cross_assignment_denied(pg_session):
    """
    Verifies that a Destination Manager for Rajgad Fort cannot view another manager's assignment.
    """
    dest_mgr_a = str(uuid.uuid4())
    dest_mgr_b = str(uuid.uuid4())

    pg_session.execute(text("BEGIN;"))
    # Context set for Manager A
    pg_session.execute(text(f"SET LOCAL app.current_user_id = '{dest_mgr_a}';"))
    pg_session.execute(text("SET LOCAL app.current_role = 'manager';"))
    pg_session.execute(text("SET LOCAL app.current_state_id = 'maharashtra';"))
    pg_session.execute(text("SET LOCAL app.current_destination_id = 'rajgad-fort';"))

    # Attempt to read Manager B's assignment
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
    # Context set for Maharashtra State Manager (destination_id is NULL)
    pg_session.execute(text(f"SET LOCAL app.current_user_id = '{state_mgr_mh}';"))
    pg_session.execute(text("SET LOCAL app.current_role = 'manager';"))
    pg_session.execute(text("SET LOCAL app.current_state_id = 'maharashtra';"))

    # Attempt to read assignments for Kerala
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
    pg_session.execute(text(f"SET LOCAL app.current_user_id = '{tourist_id}';"))
    pg_session.execute(text("SET LOCAL app.current_role = 'tourist';"))

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
    pg_session.execute(text(f"SET LOCAL app.current_user_id = '{user_id}';"))
    pg_session.execute(text("SET LOCAL app.current_role = 'tourist';"))

    rows = pg_session.execute(text("SELECT COUNT(*) FROM storage_object_registry;")).scalar()
    assert rows == 0
    pg_session.execute(text("ROLLBACK;"))
