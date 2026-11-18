"""005_catalogue_rls

Revision ID: 005_catalogue_rls
Revises: 004_gov_storage_rls
Create Date: 2026-11-18 22:30:00.000000

YatraSetu Platform — Catalogue RLS & Jurisdiction Boundary Enforcement
Enforces:
1. ENABLE & FORCE ROW LEVEL SECURITY on destinations:
   - p_destinations_select: Public read for catalogue browsing.
   - p_destinations_insert: Admin only.
   - p_destinations_update: Admin only.
   - p_destinations_delete: Admin only.
2. ENABLE & FORCE ROW LEVEL SECURITY on attractions:
   - p_attractions_select: Public read for catalogue browsing.
   - p_attractions_insert: Admin or Manager within assigned destination/state jurisdiction.
   - p_attractions_update: Admin or Manager within assigned destination/state jurisdiction (USING and WITH CHECK).
   - p_attractions_delete: Admin or Manager within assigned destination/state jurisdiction.
3. ENABLE & FORCE ROW LEVEL SECURITY on events:
   - p_events_select: Public read for catalogue browsing.
   - p_events_insert: Admin or Manager within assigned destination/state jurisdiction.
   - p_events_update: Admin or Manager within assigned destination/state jurisdiction (USING and WITH CHECK).
   - p_events_delete: Admin or Manager within assigned destination/state jurisdiction.
4. Correct destination_advisories policy:
   - Explicitly drops the obsolete p_destination_advisories_modify policy from Migration 002.
   - Replaces with separate INSERT, UPDATE, and DELETE policies that strictly separate
     Destination Manager from State Manager, preventing cross-destination advisory tampering.
"""
from typing import Sequence, Union
from alembic import op

# revision identifiers, used by Alembic.
revision: str = '005_catalogue_rls'
down_revision: Union[str, None] = '004_gov_storage_rls'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # -------------------------------------------------------------------------
    # 1. destinations: Enable & Force RLS
    # -------------------------------------------------------------------------
    op.execute("ALTER TABLE destinations ENABLE ROW LEVEL SECURITY;")
    op.execute("ALTER TABLE destinations FORCE ROW LEVEL SECURITY;")

    # 1.1 Public Read (Catalogue Browsing)
    op.execute("""
        CREATE POLICY p_destinations_select ON destinations
        FOR SELECT
        USING (true);
    """)

    # 1.2 Destination Insertion (Admin Only)
    op.execute("""
        CREATE POLICY p_destinations_insert ON destinations
        FOR INSERT
        WITH CHECK (current_setting('app.current_role', true) = 'admin');
    """)

    # 1.3 Destination Update (Admin Only)
    op.execute("""
        CREATE POLICY p_destinations_update ON destinations
        FOR UPDATE
        USING (current_setting('app.current_role', true) = 'admin')
        WITH CHECK (current_setting('app.current_role', true) = 'admin');
    """)

    # 1.4 Destination Deletion (Admin Only)
    op.execute("""
        CREATE POLICY p_destinations_delete ON destinations
        FOR DELETE
        USING (current_setting('app.current_role', true) = 'admin');
    """)

    # -------------------------------------------------------------------------
    # 2. attractions: Enable & Force RLS
    # -------------------------------------------------------------------------
    op.execute("ALTER TABLE attractions ENABLE ROW LEVEL SECURITY;")
    op.execute("ALTER TABLE attractions FORCE ROW LEVEL SECURITY;")

    # 2.1 Public Read
    op.execute("""
        CREATE POLICY p_attractions_select ON attractions
        FOR SELECT
        USING (true);
    """)

    # 2.2 Attraction Insertion
    op.execute("""
        CREATE POLICY p_attractions_insert ON attractions
        FOR INSERT
        WITH CHECK (
            current_setting('app.current_role', true) = 'admin'
            OR (
                current_setting('app.current_role', true) = 'manager'
                AND (
                    (
                        NULLIF(current_setting('app.current_destination_id', true), '') IS NOT NULL
                        AND destination_id = current_setting('app.current_destination_id', true)
                    )
                    OR (
                        NULLIF(current_setting('app.current_destination_id', true), '') IS NULL
                        AND EXISTS (
                            SELECT 1 FROM destinations d
                            WHERE d.id = attractions.destination_id
                            AND d.state_id = current_setting('app.current_state_id', true)
                        )
                    )
                )
            )
        );
    """)

    # 2.3 Attraction Update (Enforces existing row jurisdiction and new row jurisdiction)
    op.execute("""
        CREATE POLICY p_attractions_update ON attractions
        FOR UPDATE
        USING (
            current_setting('app.current_role', true) = 'admin'
            OR (
                current_setting('app.current_role', true) = 'manager'
                AND (
                    (
                        NULLIF(current_setting('app.current_destination_id', true), '') IS NOT NULL
                        AND destination_id = current_setting('app.current_destination_id', true)
                    )
                    OR (
                        NULLIF(current_setting('app.current_destination_id', true), '') IS NULL
                        AND EXISTS (
                            SELECT 1 FROM destinations d
                            WHERE d.id = attractions.destination_id
                            AND d.state_id = current_setting('app.current_state_id', true)
                        )
                    )
                )
            )
        )
        WITH CHECK (
            current_setting('app.current_role', true) = 'admin'
            OR (
                current_setting('app.current_role', true) = 'manager'
                AND (
                    (
                        NULLIF(current_setting('app.current_destination_id', true), '') IS NOT NULL
                        AND destination_id = current_setting('app.current_destination_id', true)
                    )
                    OR (
                        NULLIF(current_setting('app.current_destination_id', true), '') IS NULL
                        AND EXISTS (
                            SELECT 1 FROM destinations d
                            WHERE d.id = attractions.destination_id
                            AND d.state_id = current_setting('app.current_state_id', true)
                        )
                    )
                )
            )
        );
    """)

    # 2.4 Attraction Deletion
    op.execute("""
        CREATE POLICY p_attractions_delete ON attractions
        FOR DELETE
        USING (
            current_setting('app.current_role', true) = 'admin'
            OR (
                current_setting('app.current_role', true) = 'manager'
                AND (
                    (
                        NULLIF(current_setting('app.current_destination_id', true), '') IS NOT NULL
                        AND destination_id = current_setting('app.current_destination_id', true)
                    )
                    OR (
                        NULLIF(current_setting('app.current_destination_id', true), '') IS NULL
                        AND EXISTS (
                            SELECT 1 FROM destinations d
                            WHERE d.id = attractions.destination_id
                            AND d.state_id = current_setting('app.current_state_id', true)
                        )
                    )
                )
            )
        );
    """)

    # -------------------------------------------------------------------------
    # 3. events: Enable & Force RLS
    # -------------------------------------------------------------------------
    op.execute("ALTER TABLE events ENABLE ROW LEVEL SECURITY;")
    op.execute("ALTER TABLE events FORCE ROW LEVEL SECURITY;")

    # 3.1 Public Read
    op.execute("""
        CREATE POLICY p_events_select ON events
        FOR SELECT
        USING (true);
    """)

    # 3.2 Event Insertion
    op.execute("""
        CREATE POLICY p_events_insert ON events
        FOR INSERT
        WITH CHECK (
            current_setting('app.current_role', true) = 'admin'
            OR (
                current_setting('app.current_role', true) = 'manager'
                AND (
                    (
                        NULLIF(current_setting('app.current_destination_id', true), '') IS NOT NULL
                        AND destination_id = current_setting('app.current_destination_id', true)
                    )
                    OR (
                        NULLIF(current_setting('app.current_destination_id', true), '') IS NULL
                        AND EXISTS (
                            SELECT 1 FROM destinations d
                            WHERE d.id = events.destination_id
                            AND d.state_id = current_setting('app.current_state_id', true)
                        )
                    )
                )
            )
        );
    """)

    # 3.3 Event Update
    op.execute("""
        CREATE POLICY p_events_update ON events
        FOR UPDATE
        USING (
            current_setting('app.current_role', true) = 'admin'
            OR (
                current_setting('app.current_role', true) = 'manager'
                AND (
                    (
                        NULLIF(current_setting('app.current_destination_id', true), '') IS NOT NULL
                        AND destination_id = current_setting('app.current_destination_id', true)
                    )
                    OR (
                        NULLIF(current_setting('app.current_destination_id', true), '') IS NULL
                        AND EXISTS (
                            SELECT 1 FROM destinations d
                            WHERE d.id = events.destination_id
                            AND d.state_id = current_setting('app.current_state_id', true)
                        )
                    )
                )
            )
        )
        WITH CHECK (
            current_setting('app.current_role', true) = 'admin'
            OR (
                current_setting('app.current_role', true) = 'manager'
                AND (
                    (
                        NULLIF(current_setting('app.current_destination_id', true), '') IS NOT NULL
                        AND destination_id = current_setting('app.current_destination_id', true)
                    )
                    OR (
                        NULLIF(current_setting('app.current_destination_id', true), '') IS NULL
                        AND EXISTS (
                            SELECT 1 FROM destinations d
                            WHERE d.id = events.destination_id
                            AND d.state_id = current_setting('app.current_state_id', true)
                        )
                    )
                )
            )
        );
    """)

    # 3.4 Event Deletion
    op.execute("""
        CREATE POLICY p_events_delete ON events
        FOR DELETE
        USING (
            current_setting('app.current_role', true) = 'admin'
            OR (
                current_setting('app.current_role', true) = 'manager'
                AND (
                    (
                        NULLIF(current_setting('app.current_destination_id', true), '') IS NOT NULL
                        AND destination_id = current_setting('app.current_destination_id', true)
                    )
                    OR (
                        NULLIF(current_setting('app.current_destination_id', true), '') IS NULL
                        AND EXISTS (
                            SELECT 1 FROM destinations d
                            WHERE d.id = events.destination_id
                            AND d.state_id = current_setting('app.current_state_id', true)
                        )
                    )
                )
            )
        );
    """)

    # -------------------------------------------------------------------------
    # 4. destination_advisories: Harden Policies (Drop Obsolete 002 Policy)
    # -------------------------------------------------------------------------
    op.execute("DROP POLICY IF EXISTS p_destination_advisories_modify ON destination_advisories;")

    # 4.1 Advisory Insertion
    op.execute("""
        CREATE POLICY p_destination_advisories_insert ON destination_advisories
        FOR INSERT
        WITH CHECK (
            current_setting('app.current_role', true) = 'admin'
            OR (
                current_setting('app.current_role', true) = 'manager'
                AND (
                    (
                        NULLIF(current_setting('app.current_destination_id', true), '') IS NOT NULL
                        AND destination_id = current_setting('app.current_destination_id', true)
                    )
                    OR (
                        NULLIF(current_setting('app.current_destination_id', true), '') IS NULL
                        AND EXISTS (
                            SELECT 1 FROM destinations d
                            WHERE d.id = destination_advisories.destination_id
                            AND d.state_id = current_setting('app.current_state_id', true)
                        )
                    )
                )
            )
        );
    """)

    # 4.2 Advisory Update
    op.execute("""
        CREATE POLICY p_destination_advisories_update ON destination_advisories
        FOR UPDATE
        USING (
            current_setting('app.current_role', true) = 'admin'
            OR (
                current_setting('app.current_role', true) = 'manager'
                AND (
                    (
                        NULLIF(current_setting('app.current_destination_id', true), '') IS NOT NULL
                        AND destination_id = current_setting('app.current_destination_id', true)
                    )
                    OR (
                        NULLIF(current_setting('app.current_destination_id', true), '') IS NULL
                        AND EXISTS (
                            SELECT 1 FROM destinations d
                            WHERE d.id = destination_advisories.destination_id
                            AND d.state_id = current_setting('app.current_state_id', true)
                        )
                    )
                )
            )
        )
        WITH CHECK (
            current_setting('app.current_role', true) = 'admin'
            OR (
                current_setting('app.current_role', true) = 'manager'
                AND (
                    (
                        NULLIF(current_setting('app.current_destination_id', true), '') IS NOT NULL
                        AND destination_id = current_setting('app.current_destination_id', true)
                    )
                    OR (
                        NULLIF(current_setting('app.current_destination_id', true), '') IS NULL
                        AND EXISTS (
                            SELECT 1 FROM destinations d
                            WHERE d.id = destination_advisories.destination_id
                            AND d.state_id = current_setting('app.current_state_id', true)
                        )
                    )
                )
            )
        );
    """)

    # 4.3 Advisory Deletion
    op.execute("""
        CREATE POLICY p_destination_advisories_delete ON destination_advisories
        FOR DELETE
        USING (
            current_setting('app.current_role', true) = 'admin'
            OR (
                current_setting('app.current_role', true) = 'manager'
                AND (
                    (
                        NULLIF(current_setting('app.current_destination_id', true), '') IS NOT NULL
                        AND destination_id = current_setting('app.current_destination_id', true)
                    )
                    OR (
                        NULLIF(current_setting('app.current_destination_id', true), '') IS NULL
                        AND EXISTS (
                            SELECT 1 FROM destinations d
                            WHERE d.id = destination_advisories.destination_id
                            AND d.state_id = current_setting('app.current_state_id', true)
                        )
                    )
                )
            )
        );
    """)


def downgrade() -> None:
    # -------------------------------------------------------------------------
    # 1. Restore destination_advisories 002 Policy
    # -------------------------------------------------------------------------
    op.execute("DROP POLICY IF EXISTS p_destination_advisories_delete ON destination_advisories;")
    op.execute("DROP POLICY IF EXISTS p_destination_advisories_update ON destination_advisories;")
    op.execute("DROP POLICY IF EXISTS p_destination_advisories_insert ON destination_advisories;")

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
    # 2. events: Drop Policies and Disable RLS
    # -------------------------------------------------------------------------
    op.execute("DROP POLICY IF EXISTS p_events_delete ON events;")
    op.execute("DROP POLICY IF EXISTS p_events_update ON events;")
    op.execute("DROP POLICY IF EXISTS p_events_insert ON events;")
    op.execute("DROP POLICY IF EXISTS p_events_select ON events;")
    op.execute("ALTER TABLE events NO FORCE ROW LEVEL SECURITY;")
    op.execute("ALTER TABLE events DISABLE ROW LEVEL SECURITY;")

    # -------------------------------------------------------------------------
    # 3. attractions: Drop Policies and Disable RLS
    # -------------------------------------------------------------------------
    op.execute("DROP POLICY IF EXISTS p_attractions_delete ON attractions;")
    op.execute("DROP POLICY IF EXISTS p_attractions_update ON attractions;")
    op.execute("DROP POLICY IF EXISTS p_attractions_insert ON attractions;")
    op.execute("DROP POLICY IF EXISTS p_attractions_select ON attractions;")
    op.execute("ALTER TABLE attractions NO FORCE ROW LEVEL SECURITY;")
    op.execute("ALTER TABLE attractions DISABLE ROW LEVEL SECURITY;")

    # -------------------------------------------------------------------------
    # 4. destinations: Drop Policies and Disable RLS
    # -------------------------------------------------------------------------
    op.execute("DROP POLICY IF EXISTS p_destinations_delete ON destinations;")
    op.execute("DROP POLICY IF EXISTS p_destinations_update ON destinations;")
    op.execute("DROP POLICY IF EXISTS p_destinations_insert ON destinations;")
    op.execute("DROP POLICY IF EXISTS p_destinations_select ON destinations;")
    op.execute("ALTER TABLE destinations NO FORCE ROW LEVEL SECURITY;")
    op.execute("ALTER TABLE destinations DISABLE ROW LEVEL SECURITY;")
