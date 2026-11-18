"""
YatraSetu Platform Schemas Package
"""

from app.schemas.health import HealthResponse, DatabaseHealthResponse
from app.schemas.auth import (
    UserRegisterRequest,
    LoginRequest,
    RefreshTokenRequest,
    TokenResponse,
    UserProfileResponse,
    MessageResponse,
)
from app.schemas.manager import (
    ManagerContextResponse,
    AttractionCreate,
    AttractionUpdate,
    EventCreate,
    EventUpdate,
)

__all__ = [
    "HealthResponse",
    "DatabaseHealthResponse",
    "UserRegisterRequest",
    "LoginRequest",
    "RefreshTokenRequest",
    "TokenResponse",
    "UserProfileResponse",
    "MessageResponse",
    "ManagerContextResponse",
    "AttractionCreate",
    "AttractionUpdate",
    "EventCreate",
    "EventUpdate",
]
