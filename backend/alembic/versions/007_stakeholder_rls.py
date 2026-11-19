"""007_stakeholder_rls

Revision ID: 007_stakeholder_rls
Revises: 006_auth_login_lookup
Create Date: 2026-11-19 14:15:00.000000

YatraSetu Platform — Stakeholder Services RLS Policy
Enforces:
1. Row-Level Security INSERT policy on public.stakeholder_services:
   - Name: p_stakeholder_services_insert
   - Command: FOR INSERT
   - Permissive conditions:
     a) Platform Administrator (current_setting('app.current_role', true) = 'admin')
     b) Authenticated Stakeholder caller satisfying:
        - current_setting('app.current_role', true) = 'stakeholder'
        - user_id::text = current_setting('app.current_user_id', true)
        - role_id = 'stakeholder'
        - verification_status = 'pending'
        - EXISTS (SELECT 1 FROM destinations d WHERE d.id = stakeholder_services.destination_id AND d.state_id = stakeholder_services.state_id)
2. Preserves FORCE ROW LEVEL SECURITY on stakeholder_services.
3. Preserves existing SELECT (p_stakeholder_services_select) and UPDATE (p_stakeholder_services_modify) policies.
"""
from typing import Sequence, Union
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "007_stakeholder_rls"
down_revision: Union[str, None] = "006_auth_login_lookup"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # -------------------------------------------------------------------------
    # 1. Stakeholder Services INSERT Policy
    # -------------------------------------------------------------------------
    op.execute("""
        CREATE POLICY p_stakeholder_services_insert ON stakeholder_services
        FOR INSERT
        WITH CHECK (
            current_setting('app.current_role', true) = 'admin'
            OR (
                current_setting('app.current_role', true) = 'stakeholder'
                AND user_id::text = current_setting('app.current_user_id', true)
                AND role_id = 'stakeholder'
                AND verification_status = 'pending'
                AND EXISTS (
                    SELECT 1 FROM destinations d
                    WHERE d.id = stakeholder_services.destination_id
                      AND d.state_id = stakeholder_services.state_id
                )
            )
        );
    """)

    # Ensure FORCE ROW LEVEL SECURITY remains active
    op.execute("ALTER TABLE stakeholder_services FORCE ROW LEVEL SECURITY;")


def downgrade() -> None:
    # Drop the added insert policy
    op.execute("DROP POLICY IF EXISTS p_stakeholder_services_insert ON stakeholder_services;")
