"""
YatraSetu Platform — Authentication & User Pydantic Schemas
Defines request and response schemas for registration, login, token refresh, and user profiles.
"""

import uuid
from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, field_validator


class UserRegisterRequest(BaseModel):
    """
    User self-registration request schema.
    Restricted to 'tourist' and 'stakeholder' roles only.
    """
    full_name: str = Field(..., min_length=2, max_length=150, description="Full name of user")
    email: EmailStr = Field(..., description="Unique email address")
    password: str = Field(..., max_length=128, description="Argon2-compliant password")
    role: str = Field(default="tourist", description="Requested role ('tourist' or 'stakeholder')")
    phone_number: Optional[str] = Field(None, max_length=32, description="Optional contact phone")
    destination_id: Optional[str] = Field(None, max_length=64, description="Target destination ID for stakeholder")

    @field_validator("role")
    @classmethod
    def validate_public_registration_role(cls, v: str) -> str:
        role_clean = v.strip().lower()
        allowed = {"tourist", "stakeholder"}
        if role_clean not in allowed:
            raise ValueError(
                f"Public registration is only permitted for 'tourist' or 'stakeholder'. "
                f"Management and administrative roles must be assigned by governance."
            )
        return role_clean

    @field_validator("full_name")
    @classmethod
    def sanitize_full_name(cls, v: str) -> str:
        clean = v.strip()
        if not clean:
            raise ValueError("Full name cannot be empty or whitespace only.")
        return clean


class LoginRequest(BaseModel):
    """
    Standard email and password login schema.
    """
    email: EmailStr = Field(..., description="Registered email address")
    password: str = Field(..., min_length=1, max_length=128, description="Account password")


class RefreshTokenRequest(BaseModel):
    """
    Refresh token rotation request schema.
    """
    refresh_token: str = Field(..., min_length=10, description="Raw refresh token string")


class TokenResponse(BaseModel):
    """
    Authentication token pair response.
    """
    access_token: str
    token_type: str = "bearer"
    expires_in: int = Field(..., description="Access token expiration in seconds")
    refresh_token: str
    user: Dict[str, Any] = Field(..., description="Sanitized user profile details")


class UserProfileResponse(BaseModel):
    """
    Current authenticated user profile response (never exposes password_hash).
    """
    id: uuid.UUID
    email: EmailStr
    full_name: str
    role_id: str
    phone_number: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    is_active: bool
    is_verified: bool
    created_at: datetime
    manager_scope: Optional[Dict[str, Any]] = None

    model_config = {"from_attributes": True}


class MessageResponse(BaseModel):
    """
    Standard generic operation message.
    """
    message: str
    success: bool = True
