"""
YatraSetu Platform Core Package
"""

from app.core.security import SecurityContext, set_database_security_context, clear_database_security_context
from app.core.jurisdiction import JurisdictionAuthorizer, JurisdictionScope
from app.core.soft_delete import SoftDeleteManager
from app.core.hashing import PasswordSecurity
from app.core.tokens import TokenService
from app.core.auth import (
    get_current_user_and_context,
    get_current_active_user,
    require_role,
    require_tourist,
    require_stakeholder,
    require_manager,
    require_admin,
    require_manager_or_admin,
    require_destination_manager,
    require_state_manager,
)

__all__ = [
    "SecurityContext",
    "set_database_security_context",
    "clear_database_security_context",
    "JurisdictionAuthorizer",
    "JurisdictionScope",
    "SoftDeleteManager",
    "PasswordSecurity",
    "TokenService",
    "get_current_user_and_context",
    "get_current_active_user",
    "require_role",
    "require_tourist",
    "require_stakeholder",
    "require_manager",
    "require_admin",
    "require_manager_or_admin",
    "require_destination_manager",
    "require_state_manager",
]
