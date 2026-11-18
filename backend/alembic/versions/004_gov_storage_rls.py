"""004_gov_storage_rls

Revision ID: 004_gov_storage_rls
Revises: 003_harden_rls_policies
Create Date: 2026-11-18 01:50:00.000000

YatraSetu Platform — Governance & Storage Registry RLS Protection
Enforces:
1. ENABLE & FORCE ROW LEVEL SECURITY on manager_assignments.
2. p_manager_assignments_select:
   - Admin: Global read.
   - Manager bootstrap / self-lookup: Reads own assignment via app.current_user_id.
   - State Manager: Reads all assignments in authorized state once state scope is established.
   - Destination Manager: Cannot read other managers' assignments.
   - Tourist / Stakeholder: Access denied (fail-closed).
3. p_manager_assignments_modify: Admin only (INSERT, UPDATE, DELETE).
4. ENABLE & FORCE ROW LEVEL SECURITY on storage_object_registry.
5. p_storage_object_registry_policy: Admin only.
"""
from typing import Sequence, Union
from alembic import op

# revision identifiers, used by Alembic.
revision: str = '004_gov_storage_rls'
down_revision: Union[str, None] = '003_harden_rls_policies'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # -------------------------------------------------------------------------
    # 1. manager_assignments: Enable & Force RLS
    # -------------------------------------------------------------------------
    op.execute("ALTER TABLE manager_assignments ENABLE ROW LEVEL SECURITY;")
    op.execute("ALTER TABLE manager_assignments FORCE ROW LEVEL SECURITY;")

    # -------------------------------------------------------------------------
    # 2. manager_assignments: SELECT Policy
    # - Admin has full global governance read.
    # - Any manager can read their own assignment during authentication bootstrap.
    # - State Manager can read assignments within their assigned state once state scope is active.
    # - Destination Manager cannot read other managers' assignments.
    # - Tourists and stakeholders receive 0 rows.
    # -------------------------------------------------------------------------
    op.execute("""
        CREATE POLICY p_manager_assignments_select ON manager_assignments
        FOR SELECT
        USING (
            -- 1. Admin: Global governance
            current_setting('app.current_role', true) = 'admin'
            -- 2. Bootstrap & Self-Lookup: Any manager reads own assignment
            OR (
                current_setting('app.current_user_id', true) IS NOT NULL
                AND user_id::text = current_setting('app.current_user_id', true)
            )
            -- 3. State Manager Post-Authentication: Reads assignments in assigned state
            OR (
                current_setting('app.current_role', true) = 'manager'
                AND current_setting('app.current_state_id', true) IS NOT NULL
                AND current_setting('app.current_destination_id', true) IS NULL
                AND state_id = current_setting('app.current_state_id', true)
            )
        );
    """)

    # -------------------------------------------------------------------------
    # 3. manager_assignments: Modification Policy (Admin Only)
    # -------------------------------------------------------------------------
    op.execute("""
        CREATE POLICY p_manager_assignments_modify ON manager_assignments
        FOR ALL
        USING (current_setting('app.current_role', true) = 'admin')
        WITH CHECK (current_setting('app.current_role', true) = 'admin');
    """)

    # -------------------------------------------------------------------------
    # 4. storage_object_registry: Enable & Force RLS
    # -------------------------------------------------------------------------
    op.execute("ALTER TABLE storage_object_registry ENABLE ROW LEVEL SECURITY;")
    op.execute("ALTER TABLE storage_object_registry FORCE ROW LEVEL SECURITY;")

    # -------------------------------------------------------------------------
    # 5. storage_object_registry: Admin-Only Access Policy
    # -------------------------------------------------------------------------
    op.execute("""
        CREATE POLICY p_storage_object_registry_policy ON storage_object_registry
        FOR ALL
        USING (current_setting('app.current_role', true) = 'admin')
        WITH CHECK (current_setting('app.current_role', true) = 'admin');
    """)


def downgrade() -> None:
    # -------------------------------------------------------------------------
    # 1. Drop storage_object_registry policy and disable RLS
    # -------------------------------------------------------------------------
    op.execute("DROP POLICY IF EXISTS p_storage_object_registry_policy ON storage_object_registry;")
    op.execute("ALTER TABLE storage_object_registry NO FORCE ROW LEVEL SECURITY;")
    op.execute("ALTER TABLE storage_object_registry DISABLE ROW LEVEL SECURITY;")

    # -------------------------------------------------------------------------
    # 2. Drop manager_assignments policies and disable RLS
    # -------------------------------------------------------------------------
    op.execute("DROP POLICY IF EXISTS p_manager_assignments_modify ON manager_assignments;")
    op.execute("DROP POLICY IF EXISTS p_manager_assignments_select ON manager_assignments;")
    op.execute("ALTER TABLE manager_assignments NO FORCE ROW LEVEL SECURITY;")
    op.execute("ALTER TABLE manager_assignments DISABLE ROW LEVEL SECURITY;")
