"""
YatraSetu Platform — Authentication & Session Management Endpoints
Implements register, login, refresh, logout, and me endpoints with Argon2id and JWT.
"""

import uuid
from datetime import datetime, timezone
from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database import get_db
from app.config import settings
from app.core.hashing import PasswordSecurity
from app.core.tokens import TokenService
from app.core.auth import get_current_active_user
from app.core.security import SecurityContext
from app.core.jurisdiction import JurisdictionAuthorizer
from app.models.identity import User, UserRefreshToken, ManagerAssignment
from app.models.destination import Destination
from app.schemas.auth import (
    UserRegisterRequest,
    LoginRequest,
    RefreshTokenRequest,
    TokenResponse,
    UserProfileResponse,
    MessageResponse,
)

router = APIRouter()


@router.post(
    "/register",
    response_model=MessageResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register New Account",
    description="Registers a new tourist or stakeholder account. Admin and Manager registration is forbidden.",
)
def register_user(
    payload: UserRegisterRequest,
    db: Session = Depends(get_db),
):
    """
    User self-registration:
    - Validates uniqueness of email address.
    - Hashes password with Argon2id.
    - Restricts role to tourist or stakeholder.
    - If stakeholder registers with a destination_id, links initial record.
    """
    norm_email = payload.email.lower().strip()

    # Check for existing user with identical email
    existing_user = db.query(User).filter(User.email == norm_email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email address already exists.",
        )

    # Validate password complexity
    valid_pass, pass_msg = PasswordSecurity.validate_password_complexity(payload.password)
    if not valid_pass:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=pass_msg,
        )

    # Hash password securely
    password_hash = PasswordSecurity.hash_password(payload.password)

    # Construct user
    new_user_id = uuid.uuid4()

    # Establish transaction-scoped registration identity context for PostgreSQL RLS
    bind = db.get_bind()
    if hasattr(bind, "dialect") and bind.dialect.name == "postgresql":
        db.execute(text("SELECT set_config('app.current_user_id', :uid, true)"), {"uid": str(new_user_id)})
        db.execute(text("SELECT set_config('app.current_role', :role, true)"), {"role": payload.role})

    new_user = User(
        id=new_user_id,
        role_id=payload.role,
        email=norm_email,
        password_hash=password_hash,
        full_name=payload.full_name,
        phone_number=payload.phone_number,
        is_active=True,
        is_verified=False,  # New self-registered accounts are unverified by default
        preferences={},
    )
    db.add(new_user)
    db.flush()

    # If stakeholder, create initial StakeholderService record if destination exists
    if payload.role == "stakeholder" and payload.destination_id:
        dest = db.query(Destination).filter(Destination.id == payload.destination_id).first()
        if dest:
            from app.models.stakeholder import StakeholderService
            sh_service = StakeholderService(
                id=uuid.uuid4(),
                user_id=new_user.id,
                role_id="stakeholder",
                destination_id=dest.id,
                state_id=dest.state_id,
                business_name=f"{payload.full_name} Enterprise",
                category="Local Operator",
                verification_status="pending",
                contact_info={"phone": payload.phone_number or ""},
            )
            db.add(sh_service)

    db.commit()

    return MessageResponse(
        message=f"Registration successful for role '{payload.role}'. You may now log in.",
        success=True,
    )


@router.post(
    "/login",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="User Login",
    description="Authenticates with email and password, issuing access and refresh tokens.",
)
def login_user(
    payload: LoginRequest,
    db: Session = Depends(get_db),
):
    """
    Authenticates user:
    - Neutral error message prevents email enumeration.
    - Issues short-lived JWT access token.
    - Issues family-tracked refresh token with SHA-256 persistence.
    """
    norm_email = payload.email.lower().strip()
    generic_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid email address or password.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    bind = db.get_bind()
    is_postgres = hasattr(bind, "dialect") and bind.dialect.name == "postgresql"

    if is_postgres:
        # Use narrow SECURITY DEFINER lookup function to resolve user under RLS
        row = db.execute(
            text(
                "SELECT id, role_id, email, password_hash, full_name, is_active, is_verified "
                "FROM public.lookup_user_for_authentication(:email)"
            ),
            {"email": norm_email},
        ).first()
        if not row:
            raise generic_error

        user_id = row.id
        user_role = row.role_id
        user_email = row.email
        password_hash = row.password_hash
        full_name = row.full_name
        is_active = row.is_active
        is_verified = row.is_verified
    else:
        user = db.query(User).filter(User.email == norm_email).first()
        if not user:
            raise generic_error
        user_id = user.id
        user_role = user.role_id
        user_email = user.email
        password_hash = user.password_hash
        full_name = user.full_name
        is_active = user.is_active
        is_verified = user.is_verified

    # Verify password against Argon2id hash
    if not PasswordSecurity.verify_password(payload.password, password_hash):
        raise generic_error

    # Check account active status
    if not is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="ACCOUNT SUSPENDED: Your account has been deactivated by administration.",
        )

    # Establish transaction-scoped caller identity prior to subsequent queries
    if is_postgres:
        db.execute(text("SELECT set_config('app.current_user_id', :uid, true)"), {"uid": str(user_id)})
        db.execute(text("SELECT set_config('app.current_role', :role, true)"), {"role": user_role})

    # Issue JWT access token
    access_token, expires_at = TokenService.create_access_token(
        user_id=user_id,
        role=user_role,
    )

    # Resolve manager jurisdiction details if applicable BEFORE persisting refresh token
    manager_scope = None
    if user_role == "manager":
        assignment = JurisdictionAuthorizer.get_manager_assignment(db, user_id)
        if not assignment:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="CONFIGURATION ERROR: Manager account exists without active jurisdiction assignment.",
            )
        manager_scope = {
            "state_id": assignment.state_id,
            "destination_id": assignment.destination_id,
            "scope": "STATE" if assignment.destination_id is None else "DESTINATION",
        }

    # Issue refresh token with new family ID and commit only after all validations succeed
    raw_refresh_token, token_hash, refresh_expires_at = TokenService.generate_refresh_token()
    family_id = uuid.uuid4()

    db_refresh_token = UserRefreshToken(
        id=uuid.uuid4(),
        user_id=user_id,
        token_hash=token_hash,
        family_id=family_id,
        is_revoked=False,
        expires_at=refresh_expires_at,
    )
    db.add(db_refresh_token)
    db.commit()

    expires_in_seconds = int((expires_at - datetime.now(timezone.utc)).total_seconds())

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=expires_in_seconds,
        refresh_token=raw_refresh_token,
        user={
            "id": str(user_id),
            "email": user_email,
            "full_name": full_name,
            "role": user_role,
            "is_active": is_active,
            "is_verified": is_verified,
            "manager_scope": manager_scope,
        },
    )


@router.post(
    "/refresh",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Rotate Refresh Token",
    description="Rotates refresh token and issues new access token with replay/reuse attack detection.",
)
def refresh_token(
    payload: RefreshTokenRequest,
    db: Session = Depends(get_db),
):
    """
    Refresh token rotation:
    - Hashes supplied token and looks up record.
    - If token is already revoked -> REUSE ATTACK DETECTED: Revoke entire token family!
    - Verifies expiration and user status.
    - Atomically revokes old token and issues fresh token pair in the same family.
    """
    token_hash = TokenService.hash_refresh_token(payload.refresh_token)
    bind = db.get_bind()
    is_postgres = hasattr(bind, "dialect") and bind.dialect.name == "postgresql"

    if is_postgres:
        # Retrieve token securely via narrow SECURITY DEFINER function under RLS
        token_row = db.execute(
            text(
                "SELECT id, user_id, family_id, is_revoked, expires_at "
                "FROM public.lookup_refresh_token_for_rotation(:thash)"
            ),
            {"thash": token_hash},
        ).first()

        if not token_row:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Establish owner identity context immediately
        db.execute(text("SELECT set_config('app.current_user_id', :uid, true)"), {"uid": str(token_row.user_id)})

        # Query actual token record under verified owner context
        token_record = db.query(UserRefreshToken).filter(UserRefreshToken.id == token_row.id).first()
    else:
        token_record = db.query(UserRefreshToken).filter(
            UserRefreshToken.token_hash == token_hash
        ).first()

    if not token_record:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Detect token reuse / replay attack
    if token_record.is_revoked:
        # Compromise detected: Invalidate all tokens in this family
        db.query(UserRefreshToken).filter(
            UserRefreshToken.family_id == token_record.family_id
        ).update({"is_revoked": True, "revoked_at": datetime.now(timezone.utc)})
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token reuse detected. Session has been revoked.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Check expiration
    now = datetime.now(timezone.utc)
    if token_record.expires_at.replace(tzinfo=timezone.utc) < now:
        token_record.is_revoked = True
        token_record.revoked_at = now
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token has expired. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Load associated user (satisfies p_users_select under established current_user_id)
    user = db.query(User).filter(User.id == token_record.user_id).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is inactive or disabled.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Set authoritative role in PostgreSQL context
    if is_postgres:
        db.execute(text("SELECT set_config('app.current_role', :role, true)"), {"role": user.role_id})

    # Extract all user fields before commit to prevent post-commit lazy load under expired session
    user_id = user.id
    user_email = user.email
    user_full_name = user.full_name
    user_role = user.role_id
    user_is_active = user.is_active
    user_is_verified = user.is_verified

    # Resolve manager jurisdiction details BEFORE commit while transaction context is active
    manager_scope = None
    if user_role == "manager":
        assignment = JurisdictionAuthorizer.get_manager_assignment(db, user_id)
        if assignment:
            manager_scope = {
                "state_id": assignment.state_id,
                "destination_id": assignment.destination_id,
                "scope": "STATE" if assignment.destination_id is None else "DESTINATION",
            }

    # Revoke current token
    token_record.is_revoked = True
    token_record.revoked_at = now

    # Issue new access token
    access_token, access_expires_at = TokenService.create_access_token(
        user_id=user_id,
        role=user_role,
    )

    # Issue new refresh token within the SAME family
    new_raw_token, new_token_hash, new_refresh_expires = TokenService.generate_refresh_token()
    new_record = UserRefreshToken(
        id=uuid.uuid4(),
        user_id=user_id,
        token_hash=new_token_hash,
        family_id=token_record.family_id,
        is_revoked=False,
        expires_at=new_refresh_expires,
    )
    db.add(new_record)
    db.commit()

    expires_in_seconds = int((access_expires_at - now).total_seconds())

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=expires_in_seconds,
        refresh_token=new_raw_token,
        user={
            "id": str(user_id),
            "email": user_email,
            "full_name": user_full_name,
            "role": user_role,
            "is_active": user_is_active,
            "is_verified": user_is_verified,
            "manager_scope": manager_scope,
        },
    )


@router.post(
    "/logout",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="User Logout",
    description="Revokes the active refresh token and invalidates the session.",
)
def logout_user(
    payload: RefreshTokenRequest,
    db: Session = Depends(get_db),
):
    """
    Revokes the provided refresh token.
    """
    token_hash = TokenService.hash_refresh_token(payload.refresh_token)
    bind = db.get_bind()
    is_postgres = hasattr(bind, "dialect") and bind.dialect.name == "postgresql"

    if is_postgres:
        token_row = db.execute(
            text(
                "SELECT id, user_id, family_id, is_revoked, expires_at "
                "FROM public.lookup_refresh_token_for_rotation(:thash)"
            ),
            {"thash": token_hash},
        ).first()
        if token_row:
            db.execute(text("SELECT set_config('app.current_user_id', :uid, true)"), {"uid": str(token_row.user_id)})
            token_record = db.query(UserRefreshToken).filter(UserRefreshToken.id == token_row.id).first()
            if token_record and not token_record.is_revoked:
                token_record.is_revoked = True
                token_record.revoked_at = datetime.now(timezone.utc)
                db.commit()
    else:
        token_record = db.query(UserRefreshToken).filter(
            UserRefreshToken.token_hash == token_hash
        ).first()

        if token_record and not token_record.is_revoked:
            token_record.is_revoked = True
            token_record.revoked_at = datetime.now(timezone.utc)
            db.commit()

    return MessageResponse(
        message="Session logged out successfully.",
        success=True,
    )


@router.get(
    "/me",
    response_model=UserProfileResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Current User Profile",
    description="Returns verified profile details for the authenticated caller.",
)
def get_current_user_profile(
    context: SecurityContext = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Returns user profile for the authenticated SecurityContext caller.
    """
    user = db.query(User).filter(User.id == context.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User record not found.",
        )

    manager_scope = None
    if user.role_id == "manager":
        assignment = JurisdictionAuthorizer.get_manager_assignment(db, user.id)
        if assignment:
            manager_scope = {
                "state_id": assignment.state_id,
                "destination_id": assignment.destination_id,
                "scope": "STATE" if assignment.destination_id is None else "DESTINATION",
            }

    return UserProfileResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role_id=user.role_id,
        phone_number=user.phone_number,
        avatar_url=user.avatar_url,
        bio=user.bio,
        is_active=user.is_active,
        is_verified=user.is_verified,
        created_at=user.created_at,
        manager_scope=manager_scope,
    )
