"""001_initial_schema

Initial migration establishing the frozen YatraSetu database architecture (27 tables).
Supports clean execution on PostgreSQL / Neon and offline DDL generation.

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-11-18 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. roles
    op.create_table(
        'roles',
        sa.Column('id', sa.String(length=32), nullable=False),
        sa.Column('name', sa.String(length=64), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_roles'))
    )

    # 2. states
    op.create_table(
        'states',
        sa.Column('id', sa.String(length=32), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('theme_code', sa.String(length=32), nullable=False),
        sa.Column('badge_label', sa.String(length=64), nullable=False),
        sa.Column('tagline', sa.String(length=255), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('hero_image_url', sa.String(length=500), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_states'))
    )

    # 3. users
    op.create_table(
        'users',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('role_id', sa.String(length=32), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('full_name', sa.String(length=150), nullable=False),
        sa.Column('phone_number', sa.String(length=32), nullable=True),
        sa.Column('avatar_url', sa.String(length=500), nullable=True),
        sa.Column('bio', sa.Text(), nullable=True),
        sa.Column('preferences', sa.JSON().with_variant(postgresql.JSONB(), 'postgresql'), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('is_verified', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['role_id'], ['roles.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_users')),
        sa.UniqueConstraint('id', 'role_id', name='uq_users_id_role')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_index(op.f('ix_users_role_id'), 'users', ['role_id'], unique=False)

    # 4. user_refresh_tokens
    op.create_table(
        'user_refresh_tokens',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('user_id', sa.Uuid(), nullable=False),
        sa.Column('token_hash', sa.String(length=255), nullable=False),
        sa.Column('family_id', sa.Uuid(), nullable=False),
        sa.Column('is_revoked', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('revoked_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_user_refresh_tokens'))
    )
    op.create_index(op.f('ix_user_refresh_tokens_family_id'), 'user_refresh_tokens', ['family_id'], unique=False)
    op.create_index(op.f('ix_user_refresh_tokens_token_hash'), 'user_refresh_tokens', ['token_hash'], unique=True)
    op.create_index(op.f('ix_user_refresh_tokens_user_id'), 'user_refresh_tokens', ['user_id'], unique=False)

    # 5. destinations
    op.create_table(
        'destinations',
        sa.Column('id', sa.String(length=64), nullable=False),
        sa.Column('state_id', sa.String(length=32), nullable=False),
        sa.Column('name', sa.String(length=150), nullable=False),
        sa.Column('category', sa.String(length=64), nullable=False),
        sa.Column('subtitle', sa.String(length=255), nullable=True),
        sa.Column('location_label', sa.String(length=150), nullable=True),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('hero_image_url', sa.String(length=500), nullable=True),
        sa.Column('banner_image', sa.String(length=500), nullable=True),
        sa.Column('ideal_duration', sa.String(length=64), nullable=True),
        sa.Column('best_time', sa.String(length=100), nullable=True),
        sa.Column('max_daily_capacity', sa.Integer(), nullable=True),
        sa.Column('latitude', sa.Numeric(precision=10, scale=7), nullable=True),
        sa.Column('longitude', sa.Numeric(precision=10, scale=7), nullable=True),
        sa.Column('metadata', sa.JSON().with_variant(postgresql.JSONB(), 'postgresql'), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['state_id'], ['states.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_destinations')),
        sa.UniqueConstraint('id', 'state_id', name='uq_destinations_id_state')
    )
    op.create_index(op.f('ix_destinations_state_id'), 'destinations', ['state_id'], unique=False)

    # 6. manager_assignments
    op.create_table(
        'manager_assignments',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('user_id', sa.Uuid(), nullable=False),
        sa.Column('role_id', sa.String(length=32), nullable=False, server_default='manager'),
        sa.Column('state_id', sa.String(length=32), nullable=False),
        sa.Column('destination_id', sa.String(length=64), nullable=True),
        sa.Column('assigned_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("role_id = 'manager'", name='chk_mgr_role'),
        sa.ForeignKeyConstraint(['destination_id', 'state_id'], ['destinations.id', 'destinations.state_id'], name='fk_mgr_destination_state', ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['user_id', 'role_id'], ['users.id', 'users.role_id'], name='fk_mgr_user_role', ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_manager_assignments')),
        sa.UniqueConstraint('user_id', name=op.f('uq_manager_assignments_user_id')),
        sa.UniqueConstraint('user_id', 'state_id', 'destination_id', name='uq_mgr_scope')
    )
    op.create_index(op.f('ix_manager_assignments_destination_id'), 'manager_assignments', ['destination_id'], unique=False)
    op.create_index(op.f('ix_manager_assignments_state_id'), 'manager_assignments', ['state_id'], unique=False)

    # 7. attractions
    op.create_table(
        'attractions',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('destination_id', sa.String(length=64), nullable=False),
        sa.Column('name', sa.String(length=180), nullable=False),
        sa.Column('category', sa.String(length=64), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('image_url', sa.String(length=500), nullable=True),
        sa.Column('rating', sa.Numeric(precision=3, scale=2), nullable=False, server_default='0.0'),
        sa.Column('status', sa.String(length=32), nullable=False, server_default='Open'),
        sa.Column('operating_hours', sa.String(length=100), nullable=True),
        sa.Column('entry_fee_label', sa.String(length=64), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['destination_id'], ['destinations.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_attractions'))
    )
    op.create_index(op.f('ix_attractions_destination_id'), 'attractions', ['destination_id'], unique=False)

    # 8. experiences
    op.create_table(
        'experiences',
        sa.Column('id', sa.String(length=64), nullable=False),
        sa.Column('destination_id', sa.String(length=64), nullable=False),
        sa.Column('title', sa.String(length=180), nullable=False),
        sa.Column('category', sa.String(length=64), nullable=False),
        sa.Column('category_label', sa.String(length=100), nullable=True),
        sa.Column('location_label', sa.String(length=150), nullable=True),
        sa.Column('duration', sa.String(length=64), nullable=True),
        sa.Column('difficulty', sa.String(length=64), nullable=True),
        sa.Column('season', sa.String(length=64), nullable=True),
        sa.Column('guide_requirement', sa.String(length=100), nullable=True),
        sa.Column('image_url', sa.String(length=500), nullable=True),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['destination_id'], ['destinations.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_experiences'))
    )
    op.create_index(op.f('ix_experiences_destination_id'), 'experiences', ['destination_id'], unique=False)

    # 9. events
    op.create_table(
        'events',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('destination_id', sa.String(length=64), nullable=False),
        sa.Column('title', sa.String(length=180), nullable=False),
        sa.Column('date_num', sa.String(length=10), nullable=False),
        sa.Column('date_month', sa.String(length=10), nullable=False),
        sa.Column('location_label', sa.String(length=150), nullable=False),
        sa.Column('status', sa.String(length=32), nullable=False, server_default='Open'),
        sa.Column('status_class', sa.String(length=32), nullable=False, server_default='active'),
        sa.Column('image_url', sa.String(length=500), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['destination_id'], ['destinations.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_events'))
    )
    op.create_index(op.f('ix_events_destination_id'), 'events', ['destination_id'], unique=False)

    # 10. curated_circuits
    op.create_table(
        'curated_circuits',
        sa.Column('id', sa.String(length=64), nullable=False),
        sa.Column('state_id', sa.String(length=32), nullable=False),
        sa.Column('name', sa.String(length=180), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('duration_label', sa.String(length=64), nullable=True),
        sa.Column('hero_image_url', sa.String(length=500), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['state_id'], ['states.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_curated_circuits'))
    )
    op.create_index(op.f('ix_curated_circuits_state_id'), 'curated_circuits', ['state_id'], unique=False)

    # 11. curated_circuit_items
    op.create_table(
        'curated_circuit_items',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('circuit_id', sa.String(length=64), nullable=False),
        sa.Column('destination_id', sa.String(length=64), nullable=False),
        sa.Column('day_number', sa.Integer(), nullable=False),
        sa.Column('order_index', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['circuit_id'], ['curated_circuits.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['destination_id'], ['destinations.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_curated_circuit_items')),
        sa.UniqueConstraint('circuit_id', 'destination_id', 'day_number', 'order_index', name='uq_circuit_dest_slot')
    )
    op.create_index(op.f('ix_curated_circuit_items_circuit_id'), 'curated_circuit_items', ['circuit_id'], unique=False)
    op.create_index(op.f('ix_curated_circuit_items_destination_id'), 'curated_circuit_items', ['destination_id'], unique=False)

    # 12. destination_videos
    op.create_table(
        'destination_videos',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('destination_id', sa.String(length=64), nullable=False),
        sa.Column('title', sa.String(length=180), nullable=False),
        sa.Column('duration', sa.String(length=32), nullable=False),
        sa.Column('youtube_id', sa.String(length=64), nullable=False),
        sa.Column('thumbnail_url', sa.String(length=500), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['destination_id'], ['destinations.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_destination_videos'))
    )
    op.create_index(op.f('ix_destination_videos_destination_id'), 'destination_videos', ['destination_id'], unique=False)

    # 13. destination_advisories
    op.create_table(
        'destination_advisories',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('destination_id', sa.String(length=64), nullable=False),
        sa.Column('severity', sa.String(length=20), nullable=False),
        sa.Column('title', sa.String(length=180), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('valid_from', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('valid_until', sa.DateTime(timezone=True), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('created_by', sa.Uuid(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("severity IN ('info', 'advisory', 'warning', 'critical')", name='chk_advisory_severity'),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['destination_id'], ['destinations.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_destination_advisories'))
    )
    op.create_index(op.f('ix_destination_advisories_created_by'), 'destination_advisories', ['created_by'], unique=False)
    op.create_index(op.f('ix_destination_advisories_destination_id'), 'destination_advisories', ['destination_id'], unique=False)

    # 14. travel_stories
    op.create_table(
        'travel_stories',
        sa.Column('id', sa.String(length=64), nullable=False),
        sa.Column('destination_id', sa.String(length=64), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('author_name', sa.String(length=120), nullable=False),
        sa.Column('read_time', sa.String(length=32), nullable=False),
        sa.Column('category', sa.String(length=64), nullable=False),
        sa.Column('image_url', sa.String(length=500), nullable=True),
        sa.Column('excerpt', sa.Text(), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['destination_id'], ['destinations.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_travel_stories'))
    )
    op.create_index(op.f('ix_travel_stories_destination_id'), 'travel_stories', ['destination_id'], unique=False)

    # 15. stakeholder_services
    op.create_table(
        'stakeholder_services',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('user_id', sa.Uuid(), nullable=False),
        sa.Column('role_id', sa.String(length=32), nullable=False, server_default='stakeholder'),
        sa.Column('destination_id', sa.String(length=64), nullable=False),
        sa.Column('state_id', sa.String(length=32), nullable=False),
        sa.Column('business_name', sa.String(length=180), nullable=False),
        sa.Column('category', sa.String(length=64), nullable=False),
        sa.Column('license_number', sa.String(length=100), nullable=True),
        sa.Column('verification_status', sa.String(length=32), nullable=False, server_default='pending'),
        sa.Column('contact_info', sa.JSON().with_variant(postgresql.JSONB(), 'postgresql'), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("role_id = 'stakeholder'", name='chk_sh_role'),
        sa.CheckConstraint("verification_status IN ('pending', 'verified', 'rejected', 'suspended')", name='chk_sh_verification_status'),
        sa.ForeignKeyConstraint(['destination_id', 'state_id'], ['destinations.id', 'destinations.state_id'], name='fk_stakeholder_destination', ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['user_id', 'role_id'], ['users.id', 'users.role_id'], name='fk_sh_user_role', ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_stakeholder_services')),
        sa.UniqueConstraint('destination_id', 'business_name', name='uq_stakeholder_business'),
        sa.UniqueConstraint('id', 'destination_id', name='uq_stakeholder_service_dest'),
        sa.UniqueConstraint('user_id', name=op.f('uq_stakeholder_services_user_id'))
    )
    op.create_index(op.f('ix_stakeholder_services_destination_id'), 'stakeholder_services', ['destination_id'], unique=False)
    op.create_index(op.f('ix_stakeholder_services_state_id'), 'stakeholder_services', ['state_id'], unique=False)

    # 16. stakeholder_media
    op.create_table(
        'stakeholder_media',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('service_id', sa.Uuid(), nullable=False),
        sa.Column('media_type', sa.String(length=20), nullable=False),
        sa.Column('title', sa.String(length=180), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('media_url', sa.String(length=500), nullable=False),
        sa.Column('thumbnail_url', sa.String(length=500), nullable=True),
        sa.Column('file_size_bytes', sa.BigInteger(), nullable=True),
        sa.Column('storage_provider', sa.String(length=32), nullable=True),
        sa.Column('storage_bucket', sa.String(length=100), nullable=True),
        sa.Column('storage_key', sa.String(length=500), nullable=True),
        sa.Column('uploaded_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("file_size_bytes IS NULL OR (file_size_bytes > 0 AND file_size_bytes <= 52428800)", name='chk_media_file_size'),
        sa.CheckConstraint("media_type IN ('photo', 'video')", name='chk_media_type'),
        sa.CheckConstraint("storage_provider IS NULL OR storage_provider IN ('s3', 'gcs', 'azure', 'local')", name='chk_media_storage_provider'),
        sa.CheckConstraint("((storage_provider IS NULL AND storage_bucket IS NULL AND storage_key IS NULL) OR (storage_provider IS NOT NULL AND storage_bucket IS NOT NULL AND storage_key IS NOT NULL))", name='chk_storage_coordinates_triad'),
        sa.ForeignKeyConstraint(['service_id'], ['stakeholder_services.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_stakeholder_media'))
    )
    op.create_index(op.f('ix_stakeholder_media_service_id'), 'stakeholder_media', ['service_id'], unique=False)

    # 17. stakeholder_posts
    op.create_table(
        'stakeholder_posts',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('service_id', sa.Uuid(), nullable=False),
        sa.Column('post_type', sa.String(length=32), nullable=False),
        sa.Column('title', sa.String(length=180), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('is_published', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("post_type IN ('announcement', 'update', 'suggestion')", name='chk_post_type'),
        sa.ForeignKeyConstraint(['service_id'], ['stakeholder_services.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_stakeholder_posts'))
    )
    op.create_index(op.f('ix_stakeholder_posts_service_id'), 'stakeholder_posts', ['service_id'], unique=False)

    # 18. stakeholder_messages
    op.create_table(
        'stakeholder_messages',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('sender_id', sa.Uuid(), nullable=False),
        sa.Column('recipient_id', sa.Uuid(), nullable=False),
        sa.Column('destination_id', sa.String(length=64), nullable=False),
        sa.Column('subject', sa.String(length=180), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('is_read', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['destination_id'], ['destinations.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['recipient_id'], ['users.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['sender_id'], ['users.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_stakeholder_messages'))
    )
    op.create_index(op.f('ix_stakeholder_messages_destination_id'), 'stakeholder_messages', ['destination_id'], unique=False)
    op.create_index(op.f('ix_stakeholder_messages_recipient_id'), 'stakeholder_messages', ['recipient_id'], unique=False)
    op.create_index(op.f('ix_stakeholder_messages_sender_id'), 'stakeholder_messages', ['sender_id'], unique=False)

    # 19. stakeholder_reviews
    op.create_table(
        'stakeholder_reviews',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('service_id', sa.Uuid(), nullable=False),
        sa.Column('user_id', sa.Uuid(), nullable=False),
        sa.Column('rating', sa.Integer(), nullable=False),
        sa.Column('comment', sa.Text(), nullable=True),
        sa.Column('review_status', sa.String(length=32), nullable=False, server_default='pending_review'),
        sa.Column('moderated_by', sa.Uuid(), nullable=True),
        sa.Column('moderated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("rating BETWEEN 1 AND 5", name='chk_sh_review_rating'),
        sa.CheckConstraint("review_status IN ('pending_review', 'approved', 'rejected')", name='chk_sh_review_status'),
        sa.ForeignKeyConstraint(['moderated_by'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['service_id'], ['stakeholder_services.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_stakeholder_reviews')),
        sa.UniqueConstraint('service_id', 'user_id', name='uq_user_service_review')
    )
    op.create_index(op.f('ix_stakeholder_reviews_service_id'), 'stakeholder_reviews', ['service_id'], unique=False)
    op.create_index(op.f('ix_stakeholder_reviews_user_id'), 'stakeholder_reviews', ['user_id'], unique=False)

    # 20. trip_plans
    op.create_table(
        'trip_plans',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('user_id', sa.Uuid(), nullable=False),
        sa.Column('title', sa.String(length=180), nullable=False),
        sa.Column('start_date', sa.Date(), nullable=True),
        sa.Column('end_date', sa.Date(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_trip_plans'))
    )
    op.create_index(op.f('ix_trip_plans_user_id'), 'trip_plans', ['user_id'], unique=False)

    # 21. trip_plan_items
    op.create_table(
        'trip_plan_items',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('trip_plan_id', sa.Uuid(), nullable=False),
        sa.Column('destination_id', sa.String(length=64), nullable=False),
        sa.Column('attraction_id', sa.Uuid(), nullable=True),
        sa.Column('day_number', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('order_index', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('time_slot', sa.String(length=64), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['attraction_id'], ['attractions.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['destination_id'], ['destinations.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['trip_plan_id'], ['trip_plans.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_trip_plan_items'))
    )
    op.create_index(op.f('ix_trip_plan_items_destination_id'), 'trip_plan_items', ['destination_id'], unique=False)
    op.create_index(op.f('ix_trip_plan_items_trip_plan_id'), 'trip_plan_items', ['trip_plan_id'], unique=False)

    # 22. user_favorites
    op.create_table(
        'user_favorites',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('user_id', sa.Uuid(), nullable=False),
        sa.Column('destination_id', sa.String(length=64), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['destination_id'], ['destinations.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_user_favorites')),
        sa.UniqueConstraint('user_id', 'destination_id', name='uq_user_fav_destination')
    )
    op.create_index(op.f('ix_user_favorites_destination_id'), 'user_favorites', ['destination_id'], unique=False)
    op.create_index(op.f('ix_user_favorites_user_id'), 'user_favorites', ['user_id'], unique=False)

    # 23. destination_reviews
    op.create_table(
        'destination_reviews',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('destination_id', sa.String(length=64), nullable=False),
        sa.Column('user_id', sa.Uuid(), nullable=True),
        sa.Column('guest_author_name', sa.String(length=120), nullable=False, server_default='Guest Traveler'),
        sa.Column('guest_hmac_identifier', sa.String(length=75), nullable=True),
        sa.Column('rate_limit_bucket', sa.String(length=64), nullable=True),
        sa.Column('rating', sa.Integer(), nullable=False),
        sa.Column('category', sa.String(length=64), nullable=False, server_default='reviews'),
        sa.Column('comment', sa.Text(), nullable=False),
        sa.Column('review_status', sa.String(length=32), nullable=False, server_default='pending_review'),
        sa.Column('moderated_by', sa.Uuid(), nullable=True),
        sa.Column('moderated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("rating BETWEEN 1 AND 5", name='chk_dest_review_rating'),
        sa.CheckConstraint("review_status IN ('pending_review', 'approved', 'rejected', 'flagged')", name='chk_dest_review_status'),
        sa.ForeignKeyConstraint(['destination_id'], ['destinations.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['moderated_by'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_destination_reviews')),
        sa.UniqueConstraint('destination_id', 'user_id', name='uq_user_dest_review')
    )
    op.create_index(op.f('ix_destination_reviews_destination_id'), 'destination_reviews', ['destination_id'], unique=False)
    op.create_index(op.f('ix_destination_reviews_user_id'), 'destination_reviews', ['user_id'], unique=False)

    # 24. visitor_statistics
    op.create_table(
        'visitor_statistics',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('destination_id', sa.String(length=64), nullable=False),
        sa.Column('record_date', sa.Date(), nullable=False),
        sa.Column('visitor_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('domestic_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('international_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('capacity_utilization_pct', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('peak_hour_estimate', sa.String(length=32), nullable=True),
        sa.ForeignKeyConstraint(['destination_id'], ['destinations.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_visitor_statistics')),
        sa.UniqueConstraint('destination_id', 'record_date', name='uq_dest_record_date')
    )
    op.create_index(op.f('ix_visitor_statistics_destination_id'), 'visitor_statistics', ['destination_id'], unique=False)
    op.create_index(op.f('ix_visitor_statistics_record_date'), 'visitor_statistics', ['record_date'], unique=False)

    # 25. audit_logs
    op.create_table(
        'audit_logs',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('table_name', sa.String(length=64), nullable=False),
        sa.Column('record_id', sa.Uuid(), nullable=False),
        sa.Column('action', sa.String(length=64), nullable=False),
        sa.Column('changed_by', sa.Uuid(), nullable=True),
        sa.Column('old_values', sa.JSON().with_variant(postgresql.JSONB(), 'postgresql'), nullable=True),
        sa.Column('new_values', sa.JSON().with_variant(postgresql.JSONB(), 'postgresql'), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['changed_by'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_audit_logs'))
    )
    op.create_index(op.f('ix_audit_logs_action'), 'audit_logs', ['action'], unique=False)
    op.create_index(op.f('ix_audit_logs_changed_by'), 'audit_logs', ['changed_by'], unique=False)
    op.create_index(op.f('ix_audit_logs_created_at'), 'audit_logs', ['created_at'], unique=False)
    op.create_index(op.f('ix_audit_logs_record_id'), 'audit_logs', ['record_id'], unique=False)
    op.create_index(op.f('ix_audit_logs_table_name'), 'audit_logs', ['table_name'], unique=False)

    # 26. storage_object_registry
    op.create_table(
        'storage_object_registry',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('storage_provider', sa.String(length=32), nullable=False),
        sa.Column('storage_bucket', sa.String(length=100), nullable=False),
        sa.Column('storage_key', sa.String(length=500), nullable=False),
        sa.Column('reference_count', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('status', sa.String(length=32), nullable=False, server_default='active'),
        sa.Column('authorization_token', sa.Uuid(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("reference_count >= 0", name='chk_registry_ref_count'),
        sa.CheckConstraint("status IN ('active', 'pending_deletion', 'deletion_authorized', 'deleted')", name='chk_registry_status'),
        sa.CheckConstraint("storage_provider IN ('s3', 'gcs', 'azure', 'local')", name='chk_registry_storage_provider'),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_storage_object_registry')),
        sa.UniqueConstraint('storage_provider', 'storage_bucket', 'storage_key', name='uq_registry_storage_object')
    )

    # 27. media_deletion_outbox
    op.create_table(
        'media_deletion_outbox',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('source_media_id', sa.Uuid(), nullable=True),
        sa.Column('service_id', sa.Uuid(), nullable=False),
        sa.Column('user_id', sa.Uuid(), nullable=False),
        sa.Column('storage_provider', sa.String(length=32), nullable=True),
        sa.Column('storage_bucket', sa.String(length=100), nullable=True),
        sa.Column('storage_key', sa.String(length=500), nullable=True),
        sa.Column('media_url', sa.String(length=500), nullable=False),
        sa.Column('status', sa.String(length=32), nullable=False, server_default='pending'),
        sa.Column('claimed_by', sa.String(length=64), nullable=True),
        sa.Column('claimed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('lease_expires_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('authorization_token', sa.Uuid(), nullable=True),
        sa.Column('retry_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('max_retries', sa.Integer(), nullable=False, server_default='5'),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('processed_at', sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint(
            "((storage_provider IS NULL AND storage_bucket IS NULL AND storage_key IS NULL) OR "
            "(storage_provider IS NOT NULL AND storage_bucket IS NOT NULL AND storage_key IS NOT NULL))",
            name='chk_outbox_coordinates_triad'
        ),
        sa.CheckConstraint(
            "status IN ('pending', 'processing', 'completed', 'failed', 'exhausted', 'unresolved', 'cancelled_shared_reference')",
            name='chk_outbox_status'
        ),
        sa.ForeignKeyConstraint(['source_media_id'], ['stakeholder_media.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_media_deletion_outbox'))
    )
    op.create_index(op.f('ix_media_deletion_outbox_source_media_id'), 'media_deletion_outbox', ['source_media_id'], unique=False)
    # Partial unique index for verified objects
    op.create_index('uq_outbox_verified_object', 'media_deletion_outbox', ['storage_provider', 'storage_bucket', 'storage_key'], unique=True, postgresql_where=sa.text('storage_key IS NOT NULL'))
    # Partial unique index for legacy unresolved records
    op.create_index('uq_outbox_legacy_media_id', 'media_deletion_outbox', ['source_media_id'], unique=True, postgresql_where=sa.text('storage_key IS NULL'))


def downgrade() -> None:
    # Drop tables in reverse topological order
    op.drop_table('media_deletion_outbox')
    op.drop_table('storage_object_registry')
    op.drop_table('audit_logs')
    op.drop_table('visitor_statistics')
    op.drop_table('destination_reviews')
    op.drop_table('user_favorites')
    op.drop_table('trip_plan_items')
    op.drop_table('trip_plans')
    op.drop_table('stakeholder_reviews')
    op.drop_table('stakeholder_messages')
    op.drop_table('stakeholder_posts')
    op.drop_table('stakeholder_media')
    op.drop_table('stakeholder_services')
    op.drop_table('travel_stories')
    op.drop_table('destination_advisories')
    op.drop_table('destination_videos')
    op.drop_table('curated_circuit_items')
    op.drop_table('curated_circuits')
    op.drop_table('events')
    op.drop_table('experiences')
    op.drop_table('attractions')
    op.drop_table('manager_assignments')
    op.drop_table('destinations')
    op.drop_table('user_refresh_tokens')
    op.drop_table('users')
    op.drop_table('states')
    op.drop_table('roles')
