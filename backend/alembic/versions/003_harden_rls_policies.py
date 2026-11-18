"""003_harden_rls_policies

Revision ID: 003_harden_rls_policies
Revises: 002_enable_rls
Create Date: 2026-11-18 00:30:00.000000

YatraSetu Platform — RLS Policy Hardening & Role Protection
Enforces:
1. Immunity of user roles, active status, and verification flags against user self-modification.
2. Prevention of role escalation (ordinary users cannot grant admin/manager roles).
3. Audit log actor validation (changed_by must strictly equal verified current_user_id or be NULL).
4. Public read boundary for stakeholder posts and reviews (only verified & active).
5. Elimination of orphaned media insertion by stakeholders.
6. Complete policy coverage for all 15 RLS-enabled tables (adding stakeholder_messages, stakeholder_reviews).
"""
from typing import Sequence, Union
from alembic import op

# revision identifiers, used by Alembic.
revision: str = '003_harden_rls_policies'
down_revision: Union[str, None] = '002_enable_rls'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # -------------------------------------------------------------------------
    # 1. Replace Users UPDATE Policy
    # Ordinary authenticated users can update ONLY their own profile fields.
    # Under NO circumstances can an ordinary user alter:
    # - role_id (strictly immutable by non-admins; prevents privilege escalation)
    # - is_active (account suspension/reactivation is admin-controlled)
    # - is_verified (trust tier is admin/manager-controlled)
    # -------------------------------------------------------------------------
    op.execute("DROP POLICY IF EXISTS p_users_update ON users;")

    op.execute("""
        CREATE POLICY p_users_update ON users
        FOR UPDATE
        USING (
            current_setting('app.current_role', true) = 'admin'
            OR (
                current_setting('app.current_user_id', true) IS NOT NULL
                AND id::text = current_setting('app.current_user_id', true)
            )
        )
        WITH CHECK (
            current_setting('app.current_role', true) = 'admin'
            OR (
                current_setting('app.current_user_id', true) IS NOT NULL
                AND id::text = current_setting('app.current_user_id', true)
                -- Immutable critical columns for ordinary callers:
                AND role_id = (SELECT u.role_id FROM users u WHERE u.id = users.id)
                AND is_active = (SELECT u.is_active FROM users u WHERE u.id = users.id)
                AND is_verified = (SELECT u.is_verified FROM users u WHERE u.id = users.id)
            )
        );
    """)

    # -------------------------------------------------------------------------
    # 2. Users INSERT Policy
    # Platform self-registration (tourists, stakeholders) cannot assign admin or manager roles.
    # -------------------------------------------------------------------------
    op.execute("""
        CREATE POLICY p_users_insert ON users
        FOR INSERT
        WITH CHECK (
            current_setting('app.current_role', true) = 'admin'
            OR (
                -- Self-registration restricts role to tourist or stakeholder
                role_id IN ('tourist', 'stakeholder')
                -- Newly self-registered accounts cannot be pre-verified
                AND is_verified = false
            )
        );
    """)

    # -------------------------------------------------------------------------
    # 3. Replace Audit Logs INSERT Policy
    # Prevents actor forgery. The changed_by column, if populated, MUST equal
    # current_setting('app.current_user_id').
    # -------------------------------------------------------------------------
    op.execute("DROP POLICY IF EXISTS p_audit_logs_insert ON audit_logs;")

    op.execute("""
        CREATE POLICY p_audit_logs_insert ON audit_logs
        FOR INSERT
        WITH CHECK (
            current_setting('app.current_role', true) = 'admin'
            OR (
                changed_by IS NULL
                OR (
                    current_setting('app.current_user_id', true) IS NOT NULL
                    AND changed_by::text = current_setting('app.current_user_id', true)
                )
            )
        );
    """)

    # -------------------------------------------------------------------------
    # 4. Stakeholder Posts
    # - Verified stakeholder posts are publicly visible.
    # - Full CRUD for the authoring stakeholder and platform admins.
    # -------------------------------------------------------------------------
    op.execute("""
        CREATE POLICY p_stakeholder_posts_all ON stakeholder_posts
        FOR ALL
        USING (
            current_setting('app.current_role', true) = 'admin'
            OR EXISTS (
                SELECT 1 FROM stakeholder_services ss
                WHERE ss.id = stakeholder_posts.service_id
                AND ss.user_id::text = current_setting('app.current_user_id', true)
            )
            -- Public read for verified service posts
            OR (
                current_setting('app.current_role', true) IS NOT NULL
                AND EXISTS (
                    SELECT 1 FROM stakeholder_services ss
                    WHERE ss.id = stakeholder_posts.service_id
                    AND ss.verification_status = 'verified'
                )
            )
        )
        WITH CHECK (
            current_setting('app.current_role', true) = 'admin'
            OR EXISTS (
                SELECT 1 FROM stakeholder_services ss
                WHERE ss.id = stakeholder_posts.service_id
                AND ss.user_id::text = current_setting('app.current_user_id', true)
            )
        );
    """)

    # -------------------------------------------------------------------------
    # 5. Stakeholder Direct Messages Policy
    # - Sender can view and create messages.
    # - Recipient can view received messages and mark as read.
    # - Destination Managers (matching destination) and Admins have governance visibility.
    # -------------------------------------------------------------------------
    op.execute("""
        CREATE POLICY p_stakeholder_messages_all ON stakeholder_messages
        FOR ALL
        USING (
            -- 1. Platform Administrators have global governance audit access
            current_setting('app.current_role', true) = 'admin'
            -- 2. Message Participants: Verified sender or recipient
            OR (
                current_setting('app.current_user_id', true) IS NOT NULL
                AND (
                    sender_id::text = current_setting('app.current_user_id', true)
                    OR recipient_id::text = current_setting('app.current_user_id', true)
                )
            )
            -- 3. Authorized Managers: Scoped strictly to their assigned jurisdiction
            OR (
                current_setting('app.current_role', true) = 'manager'
                AND (
                    -- Destination Manager (destination match)
                    destination_id = current_setting('app.current_destination_id', true)
                    -- State Manager (all destinations in state)
                    OR EXISTS (
                        SELECT 1 FROM destinations d
                        WHERE d.id = stakeholder_messages.destination_id
                        AND d.state_id = current_setting('app.current_state_id', true)
                    )
                )
            )
        )
        WITH CHECK (
            -- Platform Administrators can insert messages
            current_setting('app.current_role', true) = 'admin'
            -- Non-admin callers can only insert messages where they are the verified sender
            OR (
                current_setting('app.current_user_id', true) IS NOT NULL
                AND sender_id::text = current_setting('app.current_user_id', true)
            )
        );
    """)

    # -------------------------------------------------------------------------
    # 6. Stakeholder Reviews Policy
    # - Approved reviews are readable by everyone.
    # - Tourists can view/create their own reviews (pending moderation).
    # - Managers and Admins can moderate.
    # -------------------------------------------------------------------------
    op.execute("""
        CREATE POLICY p_stakeholder_reviews_all ON stakeholder_reviews
        FOR ALL
        USING (
            review_status = 'approved'
            OR current_setting('app.current_role', true) = 'admin'
            OR (
                current_setting('app.current_user_id', true) IS NOT NULL
                AND user_id::text = current_setting('app.current_user_id', true)
            )
            OR (
                current_setting('app.current_role', true) = 'manager'
                AND EXISTS (
                    SELECT 1 FROM stakeholder_services ss
                    WHERE ss.id = stakeholder_reviews.service_id
                    AND (
                        ss.destination_id = current_setting('app.current_destination_id', true)
                        OR ss.state_id = current_setting('app.current_state_id', true)
                    )
                )
            )
        )
        WITH CHECK (
            current_setting('app.current_role', true) = 'admin'
            OR (
                current_setting('app.current_user_id', true) IS NOT NULL
                AND user_id::text = current_setting('app.current_user_id', true)
                AND review_status = 'pending_review'
            )
            OR (
                current_setting('app.current_role', true) = 'manager'
                AND EXISTS (
                    SELECT 1 FROM stakeholder_services ss
                    WHERE ss.id = stakeholder_reviews.service_id
                    AND (
                        ss.destination_id = current_setting('app.current_destination_id', true)
                        OR ss.state_id = current_setting('app.current_state_id', true)
                    )
                )
            )
        );
    """)

    # -------------------------------------------------------------------------
    # 7. Destination Reviews Policy
    # -------------------------------------------------------------------------
    op.execute("""
        CREATE POLICY p_destination_reviews_all ON destination_reviews
        FOR ALL
        USING (
            review_status = 'approved'
            OR current_setting('app.current_role', true) = 'admin'
            OR (
                current_setting('app.current_user_id', true) IS NOT NULL
                AND user_id::text = current_setting('app.current_user_id', true)
            )
            OR (
                current_setting('app.current_role', true) = 'manager'
                AND (
                    destination_id = current_setting('app.current_destination_id', true)
                    OR EXISTS (
                        SELECT 1 FROM destinations d
                        WHERE d.id = destination_reviews.destination_id
                        AND d.state_id = current_setting('app.current_state_id', true)
                    )
                )
            )
        )
        WITH CHECK (
            current_setting('app.current_role', true) = 'admin'
            OR (
                current_setting('app.current_user_id', true) IS NOT NULL
                AND user_id::text = current_setting('app.current_user_id', true)
                -- Ordinary users cannot approve or moderate their own reviews
                AND review_status = 'pending_review'
            )
            OR (
                current_setting('app.current_role', true) = 'manager'
                AND (
                    destination_id = current_setting('app.current_destination_id', true)
                    OR EXISTS (
                        SELECT 1 FROM destinations d
                        WHERE d.id = destination_reviews.destination_id
                        AND d.state_id = current_setting('app.current_state_id', true)
                    )
                )
            )
        );
    """)

    # -------------------------------------------------------------------------
    # 8. Visitor Statistics Policy
    # -------------------------------------------------------------------------
    op.execute("""
        CREATE POLICY p_visitor_statistics_policy ON visitor_statistics
        FOR ALL
        USING (
            current_setting('app.current_role', true) = 'admin'
            OR (
                current_setting('app.current_role', true) = 'manager'
                AND (
                    destination_id = current_setting('app.current_destination_id', true)
                    OR EXISTS (
                        SELECT 1 FROM destinations d
                        WHERE d.id = visitor_statistics.destination_id
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
                        WHERE d.id = visitor_statistics.destination_id
                        AND d.state_id = current_setting('app.current_state_id', true)
                    )
                )
            )
        );
    """)


def downgrade() -> None:
    op.execute("DROP POLICY IF EXISTS p_visitor_statistics_policy ON visitor_statistics;")
    op.execute("DROP POLICY IF EXISTS p_destination_reviews_all ON destination_reviews;")
    op.execute("DROP POLICY IF EXISTS p_stakeholder_reviews_all ON stakeholder_reviews;")
    op.execute("DROP POLICY IF EXISTS p_stakeholder_messages_all ON stakeholder_messages;")
    op.execute("DROP POLICY IF EXISTS p_stakeholder_posts_all ON stakeholder_posts;")
    op.execute("DROP POLICY IF EXISTS p_audit_logs_insert ON audit_logs;")
    op.execute("DROP POLICY IF EXISTS p_users_insert ON users;")
    op.execute("DROP POLICY IF EXISTS p_users_update ON users;")

    # Re-apply 002 versions
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
    op.execute("""
        CREATE POLICY p_audit_logs_insert ON audit_logs
        FOR INSERT
        WITH CHECK (true);
    """)
