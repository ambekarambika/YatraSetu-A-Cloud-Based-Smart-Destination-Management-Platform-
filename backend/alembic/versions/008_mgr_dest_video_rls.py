"""008_mgr_dest_video_rls

Revision ID: 008_mgr_dest_video_rls
Revises: 007_stakeholder_rls
Create Date: 2026-11-20 00:15:00.000000

YatraSetu Platform — Manager Destination & Video Lifecycle RLS Policy
Enforces:
1. Destination Videos table enhancement:
   - Adds category, description, video_url, status, updated_at
   - Enables Row-Level Security & FORCE RLS
   - Policies:
     - p_destination_videos_select (public read)
     - p_destination_videos_insert (admin or manager within jurisdiction)
     - p_destination_videos_update (admin or manager within jurisdiction)
     - p_destination_videos_delete (admin or manager within jurisdiction)
2. Destinations table RLS policy update:
   - p_destinations_insert: admin or manager within state jurisdiction
   - p_destinations_update: admin or manager within state/destination jurisdiction
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "008_mgr_dest_video_rls"
down_revision: Union[str, None] = "007_stakeholder_rls"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # -------------------------------------------------------------------------
    # 1. Enhance destination_videos Table
    # -------------------------------------------------------------------------
    op.execute("""
        ALTER TABLE destination_videos
        ADD COLUMN IF NOT EXISTS category VARCHAR(64) DEFAULT 'Orientation',
        ADD COLUMN IF NOT EXISTS description TEXT,
        ADD COLUMN IF NOT EXISTS video_url VARCHAR(500),
        ADD COLUMN IF NOT EXISTS status VARCHAR(32) DEFAULT 'Published',
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    """)

    # Backfill video_url for existing seeded records
    op.execute("""
        UPDATE destination_videos
        SET video_url = 'https://www.youtube.com/watch?v=' || youtube_id
        WHERE video_url IS NULL AND youtube_id IS NOT NULL;
    """)

    # -------------------------------------------------------------------------
    # 2. destination_videos Row-Level Security
    # -------------------------------------------------------------------------
    op.execute("ALTER TABLE destination_videos ENABLE ROW LEVEL SECURITY;")
    op.execute("ALTER TABLE destination_videos FORCE ROW LEVEL SECURITY;")

    # Drop existing policies if any
    op.execute("DROP POLICY IF EXISTS p_destination_videos_select ON destination_videos;")
    op.execute("DROP POLICY IF EXISTS p_destination_videos_insert ON destination_videos;")
    op.execute("DROP POLICY IF EXISTS p_destination_videos_update ON destination_videos;")
    op.execute("DROP POLICY IF EXISTS p_destination_videos_delete ON destination_videos;")

    # Public Read
    op.execute("""
        CREATE POLICY p_destination_videos_select ON destination_videos
        FOR SELECT
        USING (true);
    """)

    # Manager / Admin Insert
    op.execute("""
        CREATE POLICY p_destination_videos_insert ON destination_videos
        FOR INSERT
        WITH CHECK (
            current_setting('app.current_role', true) = 'admin'
            OR (
                current_setting('app.current_role', true) = 'manager'
                AND (
                    (NULLIF(current_setting('app.current_destination_id', true), '') IS NOT NULL AND destination_id = current_setting('app.current_destination_id', true))
                    OR
                    (NULLIF(current_setting('app.current_destination_id', true), '') IS NULL AND EXISTS (
                        SELECT 1 FROM destinations d
                        WHERE d.id = destination_videos.destination_id
                          AND d.state_id = current_setting('app.current_state_id', true)
                    ))
                )
            )
        );
    """)

    # Manager / Admin Update
    op.execute("""
        CREATE POLICY p_destination_videos_update ON destination_videos
        FOR UPDATE
        USING (
            current_setting('app.current_role', true) = 'admin'
            OR (
                current_setting('app.current_role', true) = 'manager'
                AND (
                    (NULLIF(current_setting('app.current_destination_id', true), '') IS NOT NULL AND destination_id = current_setting('app.current_destination_id', true))
                    OR
                    (NULLIF(current_setting('app.current_destination_id', true), '') IS NULL AND EXISTS (
                        SELECT 1 FROM destinations d
                        WHERE d.id = destination_videos.destination_id
                          AND d.state_id = current_setting('app.current_state_id', true)
                    ))
                )
            )
        )
        WITH CHECK (
            current_setting('app.current_role', true) = 'admin'
            OR (
                current_setting('app.current_role', true) = 'manager'
                AND (
                    (NULLIF(current_setting('app.current_destination_id', true), '') IS NOT NULL AND destination_id = current_setting('app.current_destination_id', true))
                    OR
                    (NULLIF(current_setting('app.current_destination_id', true), '') IS NULL AND EXISTS (
                        SELECT 1 FROM destinations d
                        WHERE d.id = destination_videos.destination_id
                          AND d.state_id = current_setting('app.current_state_id', true)
                    ))
                )
            )
        );
    """)

    # Manager / Admin Delete
    op.execute("""
        CREATE POLICY p_destination_videos_delete ON destination_videos
        FOR DELETE
        USING (
            current_setting('app.current_role', true) = 'admin'
            OR (
                current_setting('app.current_role', true) = 'manager'
                AND (
                    (NULLIF(current_setting('app.current_destination_id', true), '') IS NOT NULL AND destination_id = current_setting('app.current_destination_id', true))
                    OR
                    (NULLIF(current_setting('app.current_destination_id', true), '') IS NULL AND EXISTS (
                        SELECT 1 FROM destinations d
                        WHERE d.id = destination_videos.destination_id
                          AND d.state_id = current_setting('app.current_state_id', true)
                    ))
                )
            )
        );
    """)

    # -------------------------------------------------------------------------
    # 3. destinations Update and Insert Policies for Manager Scope
    # -------------------------------------------------------------------------
    op.execute("DROP POLICY IF EXISTS p_destinations_insert ON destinations;")
    op.execute("""
        CREATE POLICY p_destinations_insert ON destinations
        FOR INSERT
        WITH CHECK (
            current_setting('app.current_role', true) = 'admin'
        );
    """)

    op.execute("DROP POLICY IF EXISTS p_destinations_update ON destinations;")
    op.execute("""
        CREATE POLICY p_destinations_update ON destinations
        FOR UPDATE
        USING (
            current_setting('app.current_role', true) = 'admin'
            OR (
                current_setting('app.current_role', true) = 'manager'
                AND (
                    (NULLIF(current_setting('app.current_destination_id', true), '') IS NOT NULL AND id = current_setting('app.current_destination_id', true))
                    OR
                    (NULLIF(current_setting('app.current_destination_id', true), '') IS NULL AND state_id = current_setting('app.current_state_id', true))
                )
            )
        )
        WITH CHECK (
            current_setting('app.current_role', true) = 'admin'
            OR (
                current_setting('app.current_role', true) = 'manager'
                AND (
                    (NULLIF(current_setting('app.current_destination_id', true), '') IS NOT NULL AND id = current_setting('app.current_destination_id', true))
                    OR
                    (NULLIF(current_setting('app.current_destination_id', true), '') IS NULL AND state_id = current_setting('app.current_state_id', true))
                )
            )
        );
    """)

    # Grant permissions to runtime role
    op.execute("GRANT SELECT, INSERT, UPDATE, DELETE ON destination_videos TO yatrasetu_app;")


def downgrade() -> None:
    op.execute("DROP POLICY IF EXISTS p_destination_videos_delete ON destination_videos;")
    op.execute("DROP POLICY IF EXISTS p_destination_videos_update ON destination_videos;")
    op.execute("DROP POLICY IF EXISTS p_destination_videos_insert ON destination_videos;")
    op.execute("DROP POLICY IF EXISTS p_destination_videos_select ON destination_videos;")
    op.execute("ALTER TABLE destination_videos NO FORCE ROW LEVEL SECURITY;")
    op.execute("ALTER TABLE destination_videos DISABLE ROW LEVEL SECURITY;")

    # Revert destinations policies to admin only
    op.execute("DROP POLICY IF EXISTS p_destinations_insert ON destinations;")
    op.execute("""
        CREATE POLICY p_destinations_insert ON destinations
        FOR INSERT
        WITH CHECK (current_setting('app.current_role', true) = 'admin');
    """)

    op.execute("DROP POLICY IF EXISTS p_destinations_update ON destinations;")
    op.execute("""
        CREATE POLICY p_destinations_update ON destinations
        FOR UPDATE
        USING (current_setting('app.current_role', true) = 'admin')
        WITH CHECK (current_setting('app.current_role', true) = 'admin');
    """)
