"""006_auth_login_lookup

Revision ID: 006_auth_login_lookup
Revises: 005_catalogue_rls
Create Date: 2026-11-19 02:45:00.000000

YatraSetu Platform — Secure Authentication Lookup Functions
Enforces:
1. SECURITY DEFINER function public.lookup_user_for_authentication(lookup_email text):
   - Owned by neondb_owner (verified BYPASSRLS).
   - Fixed search_path = pg_catalog, pg_temp.
   - Fully schema-qualified references to public.users.
   - STABLE, read-only: zero data modification.
   - Returns only minimum fields required for authentication.
   - Revokes EXECUTE from PUBLIC.
   - Grants EXECUTE strictly to yatrasetu_app.
2. SECURITY DEFINER function public.lookup_refresh_token_for_rotation(lookup_hash text):
   - Owned by neondb_owner (verified BYPASSRLS).
   - Fixed search_path = pg_catalog, pg_temp.
   - Fully schema-qualified references to public.user_refresh_tokens.
   - STABLE, read-only: zero data modification.
   - Returns only minimum fields required for token validation and identity establishment.
   - Revokes EXECUTE from PUBLIC.
   - Grants EXECUTE strictly to yatrasetu_app.
"""
from typing import Sequence, Union
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "006_auth_login_lookup"
down_revision: Union[str, None] = "005_catalogue_rls"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # -------------------------------------------------------------------------
    # 1. User Authentication Lookup Function
    # -------------------------------------------------------------------------
    op.execute("""
        CREATE OR REPLACE FUNCTION public.lookup_user_for_authentication(lookup_email text)
        RETURNS TABLE (
            id uuid,
            role_id varchar(32),
            email varchar(255),
            password_hash varchar(255),
            full_name varchar(150),
            is_active boolean,
            is_verified boolean
        )
        SECURITY DEFINER
        SET search_path = pg_catalog, pg_temp
        LANGUAGE plpgsql
        STABLE
        AS $$
        BEGIN
            RETURN QUERY
            SELECT 
                u.id,
                u.role_id,
                u.email,
                u.password_hash,
                u.full_name,
                u.is_active,
                u.is_verified
            FROM public.users u
            WHERE u.email = lower(trim(lookup_email))
            LIMIT 1;
        END;
        $$;
    """)

    # -------------------------------------------------------------------------
    # 2. Refresh Token Lookup Function
    # -------------------------------------------------------------------------
    op.execute("""
        CREATE OR REPLACE FUNCTION public.lookup_refresh_token_for_rotation(lookup_hash text)
        RETURNS TABLE (
            id uuid,
            user_id uuid,
            family_id uuid,
            is_revoked boolean,
            expires_at timestamptz
        )
        SECURITY DEFINER
        SET search_path = pg_catalog, pg_temp
        LANGUAGE plpgsql
        STABLE
        AS $$
        BEGIN
            RETURN QUERY
            SELECT 
                t.id,
                t.user_id,
                t.family_id,
                t.is_revoked,
                t.expires_at
            FROM public.user_refresh_tokens t
            WHERE t.token_hash = lookup_hash
            LIMIT 1;
        END;
        $$;
    """)

    # -------------------------------------------------------------------------
    # 3. Restrict Execution Privileges
    # -------------------------------------------------------------------------
    op.execute("REVOKE ALL ON FUNCTION public.lookup_user_for_authentication(text) FROM PUBLIC;")
    op.execute("REVOKE ALL ON FUNCTION public.lookup_refresh_token_for_rotation(text) FROM PUBLIC;")

    # Grant execute to yatrasetu_app conditionally (defensive against environments where role is pending)
    op.execute("""
        DO $$
        BEGIN
            IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'yatrasetu_app') THEN
                GRANT EXECUTE ON FUNCTION public.lookup_user_for_authentication(text) TO yatrasetu_app;
                GRANT EXECUTE ON FUNCTION public.lookup_refresh_token_for_rotation(text) TO yatrasetu_app;
            END IF;
        END $$;
    """)


def downgrade() -> None:
    # Revoke execute permissions
    op.execute("""
        DO $$
        BEGIN
            IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'yatrasetu_app') THEN
                REVOKE EXECUTE ON FUNCTION public.lookup_user_for_authentication(text) FROM yatrasetu_app;
                REVOKE EXECUTE ON FUNCTION public.lookup_refresh_token_for_rotation(text) FROM yatrasetu_app;
            END IF;
        END $$;
    """)

    # Drop functions
    op.execute("DROP FUNCTION IF EXISTS public.lookup_refresh_token_for_rotation(text);")
    op.execute("DROP FUNCTION IF EXISTS public.lookup_user_for_authentication(text);")
