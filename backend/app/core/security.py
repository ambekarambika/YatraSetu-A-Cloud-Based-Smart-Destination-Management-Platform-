"""
YatraSetu Platform — Database Security Context & Session Variable Management
Provides transaction-scoped session variable propagation for PostgreSQL RLS policies
and safe fallback behavior for local/testing SQLite engines.

=============================================================================
SECURITY THREAT MODEL & IDENTITY INTEGRITY DOCUMENTATION
=============================================================================

1. Boundary of Trust:
   - Client requests (headers, cookies, query parameters, request bodies) are
     strictly UNTRUSTED. Under no circumstances may client-supplied UUIDs,
     usernames, or roles be passed directly to `SecurityContext`.
   - `SecurityContext` instances must ONLY be constructed server-side after:
       a) Cryptographic signature verification of the JWT bearer access token.
       b) Expiration and not-before timestamp validation (`exp`, `nbf`).
       c) Verification that the token identifier is not listed in `revoked_tokens`.
       d) Verification that `user.is_active == True` in the database.

2. Role of PostgreSQL SET LOCAL in Connection Pooling:
   - In pooled serverless architectures (Neon / PgBouncer / transaction pooler),
     connections are shared across requests. Standard session variables (`SET var = ...`)
     persist on the connection fairy and bleed across requests, leading to
     critical cross-tenant leakage.
   - `SET LOCAL` binds session variables strictly to the lifetime of the active
     transaction (`BEGIN ... COMMIT / ROLLBACK`). When the transaction finishes,
     PostgreSQL automatically purges the variable values.

3. SET LOCAL is NOT Standalone Protection Against a Malicious DB Role:
   - IMPORTANT: Any database role possessing permissions to execute arbitrary SQL
     could theoretically issue another `SET LOCAL app.current_user_id = '...'`
     inside its own session.
   - Therefore, `SET LOCAL` is an ENFORCEMENT LAYER for defense-in-depth, NOT a
     substitute for application-level authentication.
   - Real database-level security relies on the two-layer boundary:
       Layer 1: The application service layer validates identity and applies
                strict query scoping before generating SQL.
       Layer 2: PostgreSQL RLS with `FORCE ROW LEVEL SECURITY` acts as a fail-closed
                guard preventing horizontal data exfiltration even if an ORM query
                omits a tenant filter.
       Layer 3: The database runtime role (`yatrasetu_app`) has `NOBYPASSRLS`
                and lacks `SUPERUSER` privileges, preventing policy circumvention.

4. Defense-in-Depth for High-Assurance Production:
   - For environments requiring cryptographic trust down to the database connection:
       a) Store cryptographically signed session tokens or ephemeral database roles.
       b) Utilize column-level privileges (`REVOKE UPDATE (role_id)`) as enforced
          in migration `003_harden_rls_policies`.
=============================================================================
"""

import uuid
from typing import Optional, Dict, Any
from sqlalchemy import text
from sqlalchemy.orm import Session

# Namespace prefix for YatraSetu application settings in PostgreSQL
CONTEXT_NAMESPACE = "app"


class SecurityContext:
    """
    Immutable representation of verified security identity derived strictly from
    server-validated authentication credentials (e.g. validated JWT access token).
    """
    def __init__(
        self,
        user_id: uuid.UUID,
        role: str,
        is_active: bool = True,
        is_verified: bool = False,
        state_id: Optional[str] = None,
        destination_id: Optional[str] = None,
    ):
        if not isinstance(user_id, uuid.UUID):
            raise ValueError("user_id must be a valid UUID instance")
        if not role or not isinstance(role, str):
            raise ValueError("role must be a non-empty string")

        self._user_id = user_id
        self._role = role.strip().lower()
        self._is_active = bool(is_active)
        self._is_verified = bool(is_verified)
        self._state_id = state_id.strip() if state_id else None
        self._destination_id = destination_id.strip() if destination_id else None

    @property
    def user_id(self) -> uuid.UUID:
        return self._user_id

    @property
    def role(self) -> str:
        return self._role

    @property
    def is_active(self) -> bool:
        return self._is_active

    @property
    def is_verified(self) -> bool:
        return self._is_verified

    @property
    def state_id(self) -> Optional[str]:
        return self._state_id

    @property
    def destination_id(self) -> Optional[str]:
        return self._destination_id

    def to_dict(self) -> Dict[str, Any]:
        return {
            "user_id": str(self._user_id),
            "role": self._role,
            "is_active": self._is_active,
            "is_verified": self._is_verified,
            "state_id": self._state_id,
            "destination_id": self._destination_id,
        }

    def __repr__(self) -> str:
        return (
            f"<SecurityContext(user_id='{self._user_id}', role='{self._role}', "
            f"state='{self._state_id}', dest='{self._destination_id}')>"
        )


def set_database_security_context(session: Session, context: SecurityContext) -> None:
    """
    Applies transaction-scoped PostgreSQL session configuration variables using
    the standard parameterized function `SELECT set_config(setting_name, setting_val, is_local=true)`.
    
    IMPORTANT POOLING GUARANTEE:
    Passing `is_local=true` binds the configuration variables strictly to the lifetime
    of the current database transaction (BEGIN ... COMMIT/ROLLBACK). When the transaction
    ends, PostgreSQL automatically discards the variables, completely preventing context
    leakage across pooled connections (e.g. Neon connection pooler / PgBouncer).
    """
    bind = session.get_bind()
    dialect_name = bind.dialect.name if hasattr(bind, "dialect") else ""

    if dialect_name == "postgresql":
        session.execute(
            text(f"SELECT set_config('{CONTEXT_NAMESPACE}.current_user_id', :user_id, true)"),
            {"user_id": str(context.user_id)},
        )
        session.execute(
            text(f"SELECT set_config('{CONTEXT_NAMESPACE}.current_role', :role, true)"),
            {"role": context.role},
        )
        if context.state_id:
            session.execute(
                text(f"SELECT set_config('{CONTEXT_NAMESPACE}.current_state_id', :state_id, true)"),
                {"state_id": context.state_id},
            )
        if context.destination_id:
            session.execute(
                text(f"SELECT set_config('{CONTEXT_NAMESPACE}.current_destination_id', :dest_id, true)"),
                {"dest_id": context.destination_id},
            )


def clear_database_security_context(session: Session) -> None:
    """
    Explicitly resets context variables to empty/default on the active session.
    While PostgreSQL `SET LOCAL` auto-resets on transaction commit/rollback,
    this helper provides explicit fail-closed sanitization for connection checkout/checkin.
    """
    bind = session.get_bind()
    dialect_name = bind.dialect.name if hasattr(bind, "dialect") else ""

    if dialect_name == "postgresql":
        try:
            session.execute(text(f"RESET {CONTEXT_NAMESPACE}.current_user_id"))
            session.execute(text(f"RESET {CONTEXT_NAMESPACE}.current_role"))
            session.execute(text(f"RESET {CONTEXT_NAMESPACE}.current_state_id"))
            session.execute(text(f"RESET {CONTEXT_NAMESPACE}.current_destination_id"))
        except Exception:
            pass
