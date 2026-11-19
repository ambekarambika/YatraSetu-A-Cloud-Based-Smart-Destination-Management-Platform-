"""
YatraSetu Platform — FastAPI Authentication & Authorization Dependencies
Provides cryptographically secure authentication dependencies, authoritative database
role loading, SecurityContext derivation, and role-based access control (RBAC).
"""

import uuid
from typing import Optional, List, Generator
from fastapi import Depends, HTTPException, status, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from jwt.exceptions import PyJWTError, ExpiredSignatureError

from app.database import get_db
from app.core.tokens import TokenService
from app.core.security import SecurityContext, set_database_security_context, clear_database_security_context
from app.core.jurisdiction import JurisdictionAuthorizer
from app.models.identity import User, ManagerAssignment

# Standard Bearer token header scheme
http_bearer = HTTPBearer(auto_error=False)


def get_current_user_and_context(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(http_bearer),
    db: Session = Depends(get_db),
) -> SecurityContext:
    """
    Core authentication dependency.
    1. Extracts and cryptographically verifies the JWT access token.
    2. Loads the authoritative User record from the database.
    3. Verifies account status (`is_active == True`).
    4. Loads manager jurisdiction assignment if applicable.
    5. Instantiates an immutable SecurityContext.
    6. Propagates transaction-scoped PostgreSQL session context (`SET LOCAL`).
    """
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    try:
        payload = TokenService.decode_access_token(token)
    except ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Access token has expired. Please refresh your session.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token signature or structure.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id_str = payload.get("sub")
    if not user_id_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token subject payload.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        user_uuid = uuid.UUID(user_id_str)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token subject identifier format.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 1. Establish verified transaction-scoped caller identity BEFORE querying protected user table
    # This satisfies PostgreSQL RLS (p_users_select: id::text = app.current_user_id)
    from sqlalchemy import text
    bind = db.get_bind()
    if hasattr(bind, "dialect") and bind.dialect.name == "postgresql":
        db.execute(text("SELECT set_config('app.current_user_id', :uid, true)"), {"uid": str(user_uuid)})

    # 2. Authoritative User lookup from database under caller's own RLS boundary
    user = db.query(User).filter(User.id == user_uuid).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account associated with this token no longer exists.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="ACCOUNT SUSPENDED: Your account has been deactivated by administration.",
        )

    # Authoritative role from database, NOT client-asserted claim
    authoritative_role = user.role_id

    # 3. Establish authoritative database role context
    if hasattr(bind, "dialect") and bind.dialect.name == "postgresql":
        db.execute(text("SELECT set_config('app.current_role', :role, true)"), {"role": authoritative_role})

    # 4. If manager, resolve authoritative jurisdiction assignment
    state_id: Optional[str] = None
    destination_id: Optional[str] = None
    if authoritative_role == "manager":
        assignment = JurisdictionAuthorizer.get_manager_assignment(db, user.id)
        if not assignment:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="CONFIGURATION ERROR: Manager account exists without active jurisdiction assignment.",
            )
        state_id = assignment.state_id
        destination_id = assignment.destination_id

    # 3. Construct verified immutable SecurityContext and set full scope
    context = SecurityContext(
        user_id=user.id,
        role=authoritative_role,
        is_active=user.is_active,
        is_verified=user.is_verified,
        state_id=state_id,
        destination_id=destination_id,
    )

    # Establish full transaction-scoped PostgreSQL session context for defense-in-depth RLS
    set_database_security_context(db, context)

    return context


def get_optional_user_and_context(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(http_bearer),
    db: Session = Depends(get_db),
) -> Optional[SecurityContext]:
    """
    Optional authentication dependency.
    Extracts and establishes SecurityContext if valid Bearer token is provided.
    Returns None for unauthenticated/guest visitors without throwing 401.
    """
    if not credentials or not credentials.credentials:
        return None
    try:
        return get_current_user_and_context(credentials, db)
    except HTTPException:
        return None


def get_current_active_user(
    context: SecurityContext = Depends(get_current_user_and_context),
) -> SecurityContext:
    """Ensures verified user is currently active."""
    if not context.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive.",
        )
    return context


def require_role(allowed_roles: List[str]):
    """
    Factory dependency for role-based authorization.
    """
    def role_checker(context: SecurityContext = Depends(get_current_active_user)) -> SecurityContext:
        if context.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: Requires one of roles: {', '.join(allowed_roles)}.",
            )
        return context
    return role_checker


# Convenient role-specific dependencies
require_tourist = require_role(["tourist"])
require_stakeholder = require_role(["stakeholder"])
require_manager = require_role(["manager"])
require_admin = require_role(["admin"])
require_manager_or_admin = require_role(["manager", "admin"])


def require_destination_manager(
    context: SecurityContext = Depends(get_current_active_user),
) -> SecurityContext:
    """
    Ensures user is an authorized Manager with assigned destination jurisdiction.
    """
    if context.role != "manager":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Destination Manager role required.",
        )
    if not context.destination_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Account is not assigned to a specific destination.",
        )
    return context


def require_state_manager(
    context: SecurityContext = Depends(get_current_active_user),
) -> SecurityContext:
    """
    Ensures user is an authorized State Manager (state-wide scope, destination_id IS NULL).
    """
    if context.role != "manager":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: State Manager role required.",
        )
    if context.destination_id is not None or not context.state_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Account does not hold state-wide manager jurisdiction.",
        )
    return context
