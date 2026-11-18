"""002_enable_rls

Revision ID: 002_enable_rls
Revises: 001_initial_schema
Create Date: 2026-11-18 00:20:00.000000

YatraSetu Platform — PostgreSQL Row Level Security (RLS) Implementation
Enables ENABLE ROW LEVEL SECURITY and FORCE ROW LEVEL SECURITY across all tenant
and multi-stakeholder tables. Defines fail-closed access policies based on
transaction-scoped context variables (app.current_user_id, app.current_role).
"""
from typing import Sequence, Union
from alembic import op

# revision identifiers, used by Alembic.
revision: str = '002_enable_rls'
down_revision: Union[str, None] = '001_initial_schema'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # -------------------------------------------------------------------------
    # 1. Enable & Force Row Level Security on Sensitive Tables
    # -------------------------------------------------------------------------
    rls_tables = [
        "users",
        "user_refresh_tokens",
        "trip_plans",
        "trip_plan_items",
        "user_favorites",
        "stakeholder_services",
        "stakeholder_media",
        "stakeholder_posts",
        "stakeholder_messages",
        "destination_advisories",
        "destination_reviews",
        "stakeholder_reviews",
        "visitor_statistics",
        "audit_logs",
        "media_deletion_outbox",
    ]

    for table in rls_tables:
        op.execute(f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY;")
        op.execute(f"ALTER TABLE {table} FORCE ROW LEVEL SECURITY;")

    # -------------------------------------------------------------------------
    # 2. Users Table Policies
    # - Authenticated users can view their own profile.
    # - Managers and Admins can view user profiles for governance.
    # - Users can update only their own profile.
    # -------------------------------------------------------------------------
    op.execute("""
        CREATE POLICY p_users_select ON users
        FOR SELECT
        USING (
            current_setting('app.current_role', true) = 'admin'
            OR current_setting('app.current_role', true) = 'manager'
            OR id::text = current_setting('app.current_user_id', true)
        );
    """)

    op.execute("""
        CREATE POLICY p_users_update ON users
        FOR UPDATE
        USING (
            current_setting('app.current_role', true) = 'admin'
            OR id::text = current_setting('app.current_user_id', true)
        )
        WITH CHECK (
            current_setting('app.current_role', true) = 'admin'
            OR id::text = current_setting('app.current_user_id', true)
        );
    """)

    # -------------------------------------------------------------------------
    # 3. User Refresh Tokens Policies
    # - Only the token owner can access or revoke their refresh tokens.
    # -------------------------------------------------------------------------
    op.execute("""
        CREATE POLICY p_refresh_tokens_all ON user_refresh_tokens
        FOR ALL
        USING (
            current_setting('app.current_role', true) = 'admin'
            OR user_id::text = current_setting('app.current_user_id', true)
        )
        WITH CHECK (
            current_setting('app.current_role', true) = 'admin'
            OR user_id::text = current_setting('app.current_user_id', true)
        );
    """)

    # -------------------------------------------------------------------------
    # 4. Tourist Trip Plans & Items Policies
    # - Tourists have full CRUD on their own itineraries.
    # -------------------------------------------------------------------------
    op.execute("""
        CREATE POLICY p_trip_plans_all ON trip_plans
        FOR ALL
        USING (
            current_setting('app.current_role', true) = 'admin'
            OR user_id::text = current_setting('app.current_user_id', true)
        )
        WITH CHECK (
            current_setting('app.current_role', true) = 'admin'
            OR user_id::text = current_setting('app.current_user_id', true)
        );
    """)

    op.execute("""
        CREATE POLICY p_trip_plan_items_all ON trip_plan_items
        FOR ALL
        USING (
            current_setting('app.current_role', true) = 'admin'
            OR EXISTS (
                SELECT 1 FROM trip_plans tp
                WHERE tp.id = trip_plan_items.trip_plan_id
                AND tp.user_id::text = current_setting('app.current_user_id', true)
            )
        )
        WITH CHECK (
            current_setting('app.current_role', true) = 'admin'
            OR EXISTS (
                SELECT 1 FROM trip_plans tp
                WHERE tp.id = trip_plan_items.trip_plan_id
                AND tp.user_id::text = current_setting('app.current_user_id', true)
            )
        );
    """)

    op.execute("""
        CREATE POLICY p_user_favorites_all ON user_favorites
        FOR ALL
        USING (
            current_setting('app.current_role', true) = 'admin'
            OR user_id::text = current_setting('app.current_user_id', true)
        )
        WITH CHECK (
            current_setting('app.current_role', true) = 'admin'
            OR user_id::text = current_setting('app.current_user_id', true)
        );
    """)

    # -------------------------------------------------------------------------
    # 5. Stakeholder Services & Media Policies
    # - Verified services are publicly readable or manager readable.
    # - Stakeholders can view and modify only their own registered service and media.
    # - Managers can inspect and moderate services within their assigned jurisdiction.
    # -------------------------------------------------------------------------
    op.execute("""
        CREATE POLICY p_stakeholder_services_select ON stakeholder_services
        FOR SELECT
        USING (
            verification_status = 'verified'
            OR current_setting('app.current_role', true) = 'admin'
            OR user_id::text = current_setting('app.current_user_id', true)
            OR (
                current_setting('app.current_role', true) = 'manager'
                AND (
                    destination_id = current_setting('app.current_destination_id', true)
                    OR state_id = current_setting('app.current_state_id', true)
                )
            )
        );
    """)

    op.execute("""
        CREATE POLICY p_stakeholder_services_modify ON stakeholder_services
        FOR UPDATE
        USING (
            current_setting('app.current_role', true) = 'admin'
            OR user_id::text = current_setting('app.current_user_id', true)
            OR (
                current_setting('app.current_role', true) = 'manager'
                AND (
                    destination_id = current_setting('app.current_destination_id', true)
                    OR state_id = current_setting('app.current_state_id', true)
                )
            )
        )
        WITH CHECK (
            current_setting('app.current_role', true) = 'admin'
            OR (
                user_id::text = current_setting('app.current_user_id', true)
                -- Stakeholder cannot approve their own verification status
                AND verification_status = (SELECT s.verification_status FROM stakeholder_services s WHERE s.id = stakeholder_services.id)
            )
            OR (
                current_setting('app.current_role', true) = 'manager'
                AND (
                    destination_id = current_setting('app.current_destination_id', true)
                    OR state_id = current_setting('app.current_state_id', true)
                )
            )
        );
    """)

    op.execute("""
        CREATE POLICY p_stakeholder_media_all ON stakeholder_media
        FOR ALL
        USING (
            current_setting('app.current_role', true) = 'admin'
            OR EXISTS (
                SELECT 1 FROM stakeholder_services ss
                WHERE ss.id = stakeholder_media.service_id
                AND ss.user_id::text = current_setting('app.current_user_id', true)
            )
        )
        WITH CHECK (
            current_setting('app.current_role', true) = 'admin'
            OR EXISTS (
                SELECT 1 FROM stakeholder_services ss
                WHERE ss.id = stakeholder_media.service_id
                AND ss.user_id::text = current_setting('app.current_user_id', true)
            )
        );
    """)

    # -------------------------------------------------------------------------
    # 6. Destination Advisories (Manager Jurisdiction)
    # - Active advisories are readable by all.
    # - Only authorized Managers (matching jurisdiction) or Admins can insert/update/delete.
    # -------------------------------------------------------------------------
    op.execute("""
        CREATE POLICY p_destination_advisories_select ON destination_advisories
        FOR SELECT
        USING (
            is_active = true
            OR current_setting('app.current_role', true) IN ('admin', 'manager')
        );
    """)

    op.execute("""
        CREATE POLICY p_destination_advisories_modify ON destination_advisories
        FOR ALL
        USING (
            current_setting('app.current_role', true) = 'admin'
            OR (
                current_setting('app.current_role', true) = 'manager'
                AND (
                    destination_id = current_setting('app.current_destination_id', true)
                    OR EXISTS (
                        SELECT 1 FROM destinations d
                        WHERE d.id = destination_advisories.destination_id
                        AND d.state_id = current_setting('app.current_state_id', true)
                    )
                )
            )
        )
        WITH CHECK (
            current_setting('app.current_role', true) = 'admin'
            OR (
                current_setting('app.current_role', true) = 'manager'
                AND (
                    destination_id = current_setting('app.current_destination_id', true)
                    OR EXISTS (
                        SELECT 1 FROM destinations d
                        WHERE d.id = destination_advisories.destination_id
                        AND d.state_id = current_setting('app.current_state_id', true)
                    )
                )
            )
        );
    """)

    # -------------------------------------------------------------------------
    # 7. Sensitive Platform Tables: Audit Logs & Media Outbox
    # - Audit logs are append-only; cannot be updated or deleted by application users.
    # - Read access restricted to platform administrators.
    # -------------------------------------------------------------------------
    op.execute("""
        CREATE POLICY p_audit_logs_select ON audit_logs
        FOR SELECT
        USING (current_setting('app.current_role', true) = 'admin');
    """)

    op.execute("""
        CREATE POLICY p_audit_logs_insert ON audit_logs
        FOR INSERT
        WITH CHECK (true);
    """)

    op.execute("""
        CREATE POLICY p_media_outbox_policy ON media_deletion_outbox
        FOR ALL
        USING (current_setting('app.current_role', true) = 'admin')
        WITH CHECK (current_setting('app.current_role', true) = 'admin');
    """)


def downgrade() -> None:
    # -------------------------------------------------------------------------
    # Drop all RLS policies and disable RLS
    # -------------------------------------------------------------------------
    op.execute("DROP POLICY IF EXISTS p_users_select ON users;")
    op.execute("DROP POLICY IF EXISTS p_users_update ON users;")
    op.execute("DROP POLICY IF EXISTS p_refresh_tokens_all ON user_refresh_tokens;")
    op.execute("DROP POLICY IF EXISTS p_trip_plans_all ON trip_plans;")
    op.execute("DROP POLICY IF EXISTS p_trip_plan_items_all ON trip_plan_items;")
    op.execute("DROP POLICY IF EXISTS p_user_favorites_all ON user_favorites;")
    op.execute("DROP POLICY IF EXISTS p_stakeholder_services_select ON stakeholder_services;")
    op.execute("DROP POLICY IF EXISTS p_stakeholder_services_modify ON stakeholder_services;")
    op.execute("DROP POLICY IF EXISTS p_stakeholder_media_all ON stakeholder_media;")
    op.execute("DROP POLICY IF EXISTS p_destination_advisories_select ON destination_advisories;")
    op.execute("DROP POLICY IF EXISTS p_destination_advisories_modify ON destination_advisories;")
    op.execute("DROP POLICY IF EXISTS p_audit_logs_select ON audit_logs;")
    op.execute("DROP POLICY IF EXISTS p_audit_logs_insert ON audit_logs;")
    op.execute("DROP POLICY IF EXISTS p_media_outbox_policy ON media_deletion_outbox;")

    rls_tables = [
        "users",
        "user_refresh_tokens",
        "trip_plans",
        "trip_plan_items",
        "user_favorites",
        "stakeholder_services",
        "stakeholder_media",
        "stakeholder_posts",
        "stakeholder_messages",
        "destination_advisories",
        "destination_reviews",
        "stakeholder_reviews",
        "visitor_statistics",
        "audit_logs",
        "media_deletion_outbox",
    ]

    for table in rls_tables:
        op.execute(f"ALTER TABLE {table} NO FORCE ROW LEVEL SECURITY;")
        op.execute(f"ALTER TABLE {table} DISABLE ROW LEVEL SECURITY;")
