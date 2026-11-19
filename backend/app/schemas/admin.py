"""
YatraSetu Platform — Administrator Governance Pydantic Schemas
Defines request and response schemas for Administrator platform governance:
Platform statistics, user account lifecycle, manager authority assignments,
stakeholder destination reassignment, registrations review, and audit trail telemetry.
"""

import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, field_validator


# -----------------------------------------------------------------------------
# 1. Platform Overview & Metrics Schemas
# -----------------------------------------------------------------------------

class AdminStatsResponse(BaseModel):
    """Real-time platform telemetry aggregated from live database records."""
    total_users: int = Field(..., description="Total registered platform accounts across all roles")
    active_managers: int = Field(..., description="Active Destination & State Managers with verified assignments")
    pending_registrations: int = Field(..., description="Stakeholder business registrations awaiting review")
    active_destinations: int = Field(..., description="Verified smart tourism destinations in catalog")
    total_stakeholders: int = Field(0, description="Total stakeholder accounts")
    total_tourists: int = Field(0, description="Total registered tourist accounts")

    model_config = {"from_attributes": True}


# -----------------------------------------------------------------------------
# 2. User Governance Schemas
# -----------------------------------------------------------------------------

class AdminUserItem(BaseModel):
    """Detailed user account representation for administrative directory."""
    id: uuid.UUID = Field(..., description="Unique user account UUID")
    email: str = Field(..., description="Unique account email address")
    role: str = Field(..., description="Authoritative platform role ('admin', 'manager', 'stakeholder', 'tourist')")
    full_name: str = Field(..., description="User full name")
    phone_number: Optional[str] = Field(None, description="Contact phone number")
    is_active: bool = Field(..., description="Account active status")
    is_verified: bool = Field(..., description="Identity verification status")
    created_at: datetime = Field(..., description="Account creation timestamp")
    updated_at: Optional[datetime] = Field(None, description="Last update timestamp")
    
    # Contextual role annotations
    access_level: str = Field("User", description="Derived human-readable access tier")
    jurisdiction: str = Field("None", description="Geographic authority or assigned destination")
    state_id: Optional[str] = Field(None, description="Assigned state code if applicable")
    destination_id: Optional[str] = Field(None, description="Assigned destination code if applicable")
    business_name: Optional[str] = Field(None, description="Business name if stakeholder")
    verification_status: Optional[str] = Field(None, description="Registration status if stakeholder")

    model_config = {"from_attributes": True}


class AdminUserListResponse(BaseModel):
    """Paginated list of platform users."""
    items: List[AdminUserItem] = Field(default_factory=list)
    total: int = Field(..., description="Total matching user records")
    page: int = Field(1, description="Current page number")
    page_size: int = Field(20, description="Items per page")
    total_pages: int = Field(1, description="Total calculated pages")


class UserStatusUpdate(BaseModel):
    """Request payload for updating user account status."""
    status: str = Field(..., description="Target status ('active', 'inactive', 'deactivated', 'suspended')")
    reason: Optional[str] = Field(None, min_length=3, description="Administrative justification")

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        clean = v.strip().lower()
        if clean not in ("active", "inactive", "deactivated", "suspended"):
            raise ValueError("Status must be one of: 'active', 'inactive', 'deactivated', 'suspended'")
        return clean


# -----------------------------------------------------------------------------
# 3. Manager Authority & Jurisdiction Schemas
# -----------------------------------------------------------------------------

class AdminManagerItem(BaseModel):
    """Manager assignment and jurisdiction record."""
    user_id: uuid.UUID = Field(..., description="Manager user UUID")
    full_name: str = Field(..., description="Manager full name")
    email: str = Field(..., description="Manager email address")
    is_active: bool = Field(..., description="Whether manager account is active")
    assignment_id: Optional[uuid.UUID] = Field(None, description="Assignment record UUID")
    state_id: Optional[str] = Field(None, description="Assigned state code")
    state_name: Optional[str] = Field(None, description="Assigned state name")
    destination_id: Optional[str] = Field(None, description="Assigned destination code (None for State Manager)")
    destination_name: Optional[str] = Field(None, description="Assigned destination name")
    access_level: str = Field(..., description="'State Manager' or 'Destination Manager'")
    assigned_at: Optional[datetime] = Field(None, description="Assignment timestamp")

    model_config = {"from_attributes": True}


class ManagerAssignRequest(BaseModel):
    """Request payload for assigning or updating manager jurisdiction."""
    user_id: uuid.UUID = Field(..., description="Target manager user UUID")
    state_id: str = Field(..., min_length=1, max_length=32, description="Target state code")
    destination_id: Optional[str] = Field(None, max_length=64, description="Destination code (null for State Manager)")
    reason: str = Field(..., min_length=3, description="Mandatory administrative justification for assignment")


# -----------------------------------------------------------------------------
# 4. Stakeholder Destination Reassignment Schemas
# -----------------------------------------------------------------------------

class StakeholderReassignRequest(BaseModel):
    """Request payload for administrative controlled stakeholder destination reassignment."""
    new_destination_id: str = Field(..., min_length=1, max_length=64, description="Target destination ID")
    new_state_id: Optional[str] = Field(None, max_length=32, description="Target state ID (derived if omitted)")
    reason: str = Field(..., min_length=6, description="Mandatory administrative justification (minimum 6 characters)")


class StakeholderReassignResponse(BaseModel):
    """Result of controlled destination reassignment."""
    service_id: uuid.UUID = Field(..., description="Stakeholder service record UUID")
    user_id: uuid.UUID = Field(..., description="Stakeholder user account UUID")
    business_name: str = Field(..., description="Registered business name")
    old_destination_id: str = Field(..., description="Previous destination ID")
    new_destination_id: str = Field(..., description="Updated destination ID")
    state_id: str = Field(..., description="Destination state ID")
    reassigned_at: datetime = Field(..., description="Timestamp of reassignment")
    audit_log_id: uuid.UUID = Field(..., description="Immutable audit log entry UUID")


# -----------------------------------------------------------------------------
# 5. Stakeholder Business Registrations Review Schemas
# -----------------------------------------------------------------------------

class AdminRegistrationItem(BaseModel):
    """Stakeholder business registration item for administrative governance review."""
    service_id: uuid.UUID = Field(..., description="Registered service record UUID")
    user_id: uuid.UUID = Field(..., description="Applicant user UUID")
    business_name: str = Field(..., description="Commercial business name")
    category: str = Field(..., description="Service category")
    license_number: Optional[str] = Field(None, description="Commercial license or permit number")
    destination_id: str = Field(..., description="Assigned destination code")
    destination_name: Optional[str] = Field(None, description="Assigned destination name")
    state_id: str = Field(..., description="Assigned state code")
    state_name: Optional[str] = Field(None, description="Assigned state name")
    verification_status: str = Field(..., description="'pending', 'verified', 'rejected', 'suspended'")
    applicant_name: Optional[str] = Field(None, description="Applicant full name")
    applicant_email: Optional[str] = Field(None, description="Applicant email address")
    created_at: datetime = Field(..., description="Submission timestamp")
    updated_at: Optional[datetime] = Field(None, description="Last update timestamp")
    contact_info: Dict[str, Any] = Field(default_factory=dict, description="Contact details")

    model_config = {"from_attributes": True}


class AdminRegistrationListResponse(BaseModel):
    """Paginated list of business registrations."""
    items: List[AdminRegistrationItem] = Field(default_factory=list)
    total: int = Field(..., description="Total matching registration records")
    page: int = Field(1, description="Current page number")
    page_size: int = Field(20, description="Items per page")
    total_pages: int = Field(1, description="Total calculated pages")


class RegistrationStatusUpdate(BaseModel):
    """Request payload for updating stakeholder verification status."""
    status: str = Field(..., description="Target status ('verified', 'rejected', 'suspended', 'pending')")
    reason: Optional[str] = Field(None, min_length=3, description="Administrative notes or reason")

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        clean = v.strip().lower()
        if clean not in ("verified", "rejected", "suspended", "pending"):
            raise ValueError("Status must be one of: 'verified', 'rejected', 'suspended', 'pending'")
        return clean


# -----------------------------------------------------------------------------
# 6. Audit Trail Telemetry Schemas
# -----------------------------------------------------------------------------

class AuditLogItem(BaseModel):
    """Immutable platform security audit log record."""
    id: uuid.UUID = Field(..., description="Unique audit event UUID")
    table_name: str = Field(..., description="Affected database entity table")
    record_id: uuid.UUID = Field(..., description="Identifier of modified entity")
    action: str = Field(..., description="Administrative action name")
    changed_by: Optional[uuid.UUID] = Field(None, description="Actor user UUID")
    actor_name: Optional[str] = Field(None, description="Actor full name if resolved")
    actor_email: Optional[str] = Field(None, description="Actor email if resolved")
    old_values: Optional[Dict[str, Any]] = Field(None, description="Pre-modification state")
    new_values: Optional[Dict[str, Any]] = Field(None, description="Post-modification state")
    created_at: datetime = Field(..., description="Event timestamp")

    model_config = {"from_attributes": True}


class AuditLogListResponse(BaseModel):
    """Paginated list of audit trail events."""
    items: List[AuditLogItem] = Field(default_factory=list)
    total: int = Field(..., description="Total matching audit entries")
    page: int = Field(1, description="Current page number")
    page_size: int = Field(20, description="Items per page")
    total_pages: int = Field(1, description="Total calculated pages")
