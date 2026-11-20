"""
YatraSetu Platform — Tourism Stakeholder Pydantic Schemas
Defines request and response schemas for Tourism Stakeholder operations:
Profile management, service registration, destination advisories, suggestions,
media listings, and service offerings.
"""

import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, field_validator


# -----------------------------------------------------------------------------
# 1. Stakeholder Profile & Service Registration Schemas
# -----------------------------------------------------------------------------

class StakeholderProfileResponse(BaseModel):
    """Authoritative stakeholder profile and registered service details."""
    user_id: uuid.UUID = Field(..., description="Unique user account identifier")
    email: str = Field(..., description="Stakeholder account email")
    full_name: str = Field(..., description="Stakeholder full name")
    role: str = Field("stakeholder", description="Platform role ('stakeholder')")
    phone_number: Optional[str] = Field(None, description="Contact phone number")
    is_active: bool = Field(True, description="Account active status")
    
    # Service details (None if not yet registered)
    service_id: Optional[uuid.UUID] = Field(None, description="Registered service record ID")
    business_name: Optional[str] = Field(None, description="Commercial business or entity name")
    category: Optional[str] = Field(None, description="Tourism service category")
    license_number: Optional[str] = Field(None, description="Commercial license or permit number")
    destination_id: Optional[str] = Field(None, description="Assigned destination code")
    destination_name: Optional[str] = Field(None, description="Assigned destination name")
    state_id: Optional[str] = Field(None, description="Assigned state code")
    state_name: Optional[str] = Field(None, description="Assigned state name")
    verification_status: str = Field("unregistered", description="Status ('unregistered', 'pending', 'verified', 'rejected', 'suspended')")
    is_destination_locked: bool = Field(False, description="True once destination is locked against direct edit")
    
    # Structured contact & operational info from contact_info JSONB
    contact_person: Optional[str] = Field(None, description="Primary contact representative")
    phone: Optional[str] = Field(None, description="Business telephone number")
    address: Optional[str] = Field(None, description="Physical operational address")
    operating_hours: Optional[str] = Field(None, description="Business operating hours")
    price_range: Optional[str] = Field(None, description="Indicative pricing or rate range")
    contact_info: Dict[str, Any] = Field(default_factory=dict, description="Raw contact and metadata attributes")
    
    created_at: Optional[datetime] = Field(None, description="Registration timestamp")
    updated_at: Optional[datetime] = Field(None, description="Last profile update timestamp")

    model_config = {"from_attributes": True}


class StakeholderProfileUpdate(BaseModel):
    """Payload for updating stakeholder business profile."""
    business_name: Optional[str] = Field(None, min_length=2, max_length=180, description="Business name")
    category: Optional[str] = Field(None, min_length=2, max_length=64, description="Service category")
    license_number: Optional[str] = Field(None, max_length=100, description="Commercial license number")
    destination_id: Optional[str] = Field(None, min_length=1, max_length=64, description="Destination ID (only accepted during initial registration)")
    contact_person: Optional[str] = Field(None, max_length=150, description="Contact person name")
    phone: Optional[str] = Field(None, max_length=32, description="Phone number")
    address: Optional[str] = Field(None, max_length=300, description="Physical address")
    operating_hours: Optional[str] = Field(None, max_length=100, description="Operating hours")
    price_range: Optional[str] = Field(None, max_length=100, description="Price range")
    contact_info: Optional[Dict[str, Any]] = Field(None, description="Additional custom metadata")


class StakeholderServiceRegisterRequest(BaseModel):
    """Payload for registering an initial commercial tourism service."""
    destination_id: str = Field(..., min_length=1, max_length=64, description="Operating destination ID")
    business_name: str = Field(..., min_length=2, max_length=180, description="Business name")
    category: str = Field(..., min_length=2, max_length=64, description="Business category")
    license_number: Optional[str] = Field(None, max_length=100, description="Commercial license number")
    contact_person: Optional[str] = Field(None, max_length=150, description="Contact person")
    phone: Optional[str] = Field(None, max_length=32, description="Contact phone")
    address: Optional[str] = Field(None, max_length=300, description="Base office or facility address")
    operating_hours: Optional[str] = Field(None, max_length=100, description="Operating hours")
    price_range: Optional[str] = Field(None, max_length=100, description="Price range")


# -----------------------------------------------------------------------------
# 2. Destination Advisory Schemas
# -----------------------------------------------------------------------------

class StakeholderAdvisoryResponse(BaseModel):
    """Official destination advisory or announcement issued by destination management."""
    id: uuid.UUID = Field(..., description="Advisory identifier")
    destination_id: str = Field(..., description="Destination identifier")
    severity: str = Field(..., description="Severity level ('info', 'advisory', 'warning', 'critical')")
    title: str = Field(..., description="Advisory headline")
    description: str = Field(..., description="Detailed advisory guidelines")
    valid_from: datetime = Field(..., description="Effective timestamp")
    valid_until: Optional[datetime] = Field(None, description="Expiry timestamp")
    is_active: bool = Field(..., description="Active publication status")
    created_at: datetime = Field(..., description="Creation timestamp")

    model_config = {"from_attributes": True}


# -----------------------------------------------------------------------------
# 3. Manager Coordination & Suggestion Schemas
# -----------------------------------------------------------------------------

class StakeholderSuggestionCreate(BaseModel):
    """Request payload for submitting a suggestion or notice to destination manager."""
    title: str = Field(..., min_length=3, max_length=180, description="Topic or headline")
    content: str = Field(..., min_length=10, description="Detailed suggestion or operational notice")


class StakeholderSuggestionResponse(BaseModel):
    """Suggestion record submitted to destination management."""
    id: uuid.UUID = Field(..., description="Post identifier")
    service_id: uuid.UUID = Field(..., description="Associated service identifier")
    post_type: str = Field("suggestion", description="Post type ('suggestion')")
    title: str = Field(..., description="Suggestion title")
    content: str = Field(..., description="Suggestion content")
    is_published: bool = Field(..., description="Published flag")
    created_at: datetime = Field(..., description="Submission timestamp")

    model_config = {"from_attributes": True}


# -----------------------------------------------------------------------------
# 4. Stakeholder Media Gallery Schemas
# -----------------------------------------------------------------------------

class StakeholderMediaCreate(BaseModel):
    """Request payload for adding a photo or promotional video record."""
    media_type: str = Field(..., pattern="^(photo|video)$", description="Media type ('photo' or 'video')")
    title: str = Field(..., min_length=2, max_length=180, description="Media caption or title")
    media_url: str = Field(..., min_length=5, max_length=500, description="Valid media URL")
    description: Optional[str] = Field(None, max_length=1000, description="Optional description")
    thumbnail_url: Optional[str] = Field(None, max_length=500, description="Thumbnail URL")
    file_size_bytes: Optional[int] = Field(None, ge=1, le=52428800, description="File size in bytes (max 50 MB)")

    @field_validator("media_url")
    @classmethod
    def validate_url(cls, v: str) -> str:
        s = v.strip()
        if not (s.startswith("http://") or s.startswith("https://")):
            raise ValueError("media_url must start with http:// or https://")
        return s


class StakeholderMediaUpdate(BaseModel):
    """Request payload for updating an existing media record."""
    title: Optional[str] = Field(None, min_length=2, max_length=180, description="Updated caption or title")
    description: Optional[str] = Field(None, max_length=1000, description="Updated description")
    media_url: Optional[str] = Field(None, min_length=5, max_length=500, description="Updated media URL")
    thumbnail_url: Optional[str] = Field(None, max_length=500, description="Updated thumbnail URL")

    @field_validator("media_url")
    @classmethod
    def validate_url(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            s = v.strip()
            if not (s.startswith("http://") or s.startswith("https://")):
                raise ValueError("media_url must start with http:// or https://")
            return s
        return v


class StakeholderMediaResponse(BaseModel):
    """Stakeholder media item response."""
    id: uuid.UUID = Field(..., description="Media record identifier")
    service_id: uuid.UUID = Field(..., description="Associated service identifier")
    media_type: str = Field(..., description="Media type ('photo' or 'video')")
    title: str = Field(..., description="Title or caption")
    description: Optional[str] = Field(None, description="Description")
    media_url: str = Field(..., description="Hosted media URL")
    thumbnail_url: Optional[str] = Field(None, description="Thumbnail URL")
    file_size_bytes: Optional[int] = Field(None, description="Size in bytes")
    uploaded_at: datetime = Field(..., description="Upload timestamp")

    model_config = {"from_attributes": True}


# -----------------------------------------------------------------------------
# 5. Service Offerings (Catalog Listings) Schemas
# -----------------------------------------------------------------------------

class ServiceOfferingCreate(BaseModel):
    """Request payload for adding a service listing/offering."""
    title: str = Field(..., min_length=2, max_length=150, description="Offering title (e.g. 'Sunrise Guided Trek')")
    category: str = Field(..., min_length=2, max_length=64, description="Offering category")
    price: Optional[str] = Field(None, max_length=100, description="Price or tariff (e.g. '₹800 per person')")
    description: Optional[str] = Field(None, max_length=500, description="Short service details")


class ServiceOfferingResponse(BaseModel):
    """Service listing/offering item response."""
    id: str = Field(..., description="Offering item identifier")
    title: str = Field(..., description="Offering title")
    category: str = Field(..., description="Offering category")
    price: Optional[str] = Field(None, description="Pricing label")
    description: Optional[str] = Field(None, description="Description")
