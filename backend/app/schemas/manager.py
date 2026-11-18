"""
YatraSetu Platform — Destination Manager Pydantic Schemas
Defines request and response schemas for Destination and State Manager operations:
Manager context, managed destinations, and jurisdictional scope representations.
"""

import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

from app.schemas.catalogue import DestinationSummaryResponse, DestinationDetailResponse


class ManagerContextResponse(BaseModel):
    """
    Authoritative manager identity and jurisdiction context.
    Derived strictly from verified authentication and database assignment.
    """
    user_id: uuid.UUID = Field(..., description="Unique manager user account identifier")
    email: str = Field(..., description="Verified manager email address")
    full_name: str = Field(..., description="Full name of the manager")
    role: str = Field(..., description="Authoritative platform role ('manager')")
    scope: str = Field(..., description="Jurisdiction scope ('state' or 'destination')")
    state_id: str = Field(..., description="Assigned state jurisdiction code")
    state_name: str = Field(..., description="Official state name")
    destination_id: Optional[str] = Field(None, description="Assigned destination ID, or None for state managers")
    destination_name: Optional[str] = Field(None, description="Assigned destination name, or None for state managers")
    assigned_at: datetime = Field(..., description="Timestamp when jurisdiction assignment was granted")

    model_config = {"from_attributes": True}


# -----------------------------------------------------------------------------
# Attraction Management Schemas
# -----------------------------------------------------------------------------

class AttractionCreate(BaseModel):
    """Request payload for creating an attraction in a managed destination."""
    destination_id: str = Field(..., min_length=1, max_length=64, description="Target destination ID")
    name: str = Field(..., min_length=1, max_length=180, description="Attraction name")
    category: str = Field(..., min_length=1, max_length=64, description="Attraction category")
    description: Optional[str] = Field(None, description="Detailed description")
    image_url: Optional[str] = Field(None, max_length=500, description="Image URL")
    rating: Optional[float] = Field(0.0, ge=0.0, le=5.0, description="Initial rating (0.0 - 5.0)")
    status: Optional[str] = Field("Open", max_length=32, description="Operational status (Open, Closed, Maintenance)")
    operating_hours: Optional[str] = Field(None, max_length=100, description="Operating hours label")
    entry_fee_label: Optional[str] = Field(None, max_length=64, description="Entry fee label")


class AttractionUpdate(BaseModel):
    """Request payload for updating an existing attraction."""
    name: Optional[str] = Field(None, min_length=1, max_length=180, description="Updated attraction name")
    category: Optional[str] = Field(None, min_length=1, max_length=64, description="Updated category")
    description: Optional[str] = Field(None, description="Updated description")
    image_url: Optional[str] = Field(None, max_length=500, description="Updated image URL")
    rating: Optional[float] = Field(None, ge=0.0, le=5.0, description="Updated rating")
    status: Optional[str] = Field(None, max_length=32, description="Updated operational status")
    operating_hours: Optional[str] = Field(None, max_length=100, description="Updated operating hours")
    entry_fee_label: Optional[str] = Field(None, max_length=64, description="Updated entry fee label")
    destination_id: Optional[str] = Field(None, min_length=1, max_length=64, description="Target destination ID reassignment")


# -----------------------------------------------------------------------------
# Tourism Event Management Schemas
# -----------------------------------------------------------------------------

class EventCreate(BaseModel):
    """Request payload for creating a tourism event in a managed destination."""
    destination_id: str = Field(..., min_length=1, max_length=64, description="Target destination ID")
    title: str = Field(..., min_length=1, max_length=180, description="Event title")
    date_num: str = Field(..., min_length=1, max_length=10, description="Day number or range (e.g. '15' or '15-18')")
    date_month: str = Field(..., min_length=1, max_length=10, description="Month abbreviation (e.g. 'OCT')")
    location_label: str = Field(..., min_length=1, max_length=150, description="Location or venue name")
    status: Optional[str] = Field("Open", max_length=32, description="Event status (e.g. 'Open', 'Upcoming')")
    status_class: Optional[str] = Field("active", max_length=32, description="CSS badge class (e.g. 'active', 'warning')")
    image_url: Optional[str] = Field(None, max_length=500, description="Cover image URL")
    description: Optional[str] = Field(None, description="Event description")


class EventUpdate(BaseModel):
    """Request payload for updating an existing tourism event."""
    title: Optional[str] = Field(None, min_length=1, max_length=180, description="Updated event title")
    date_num: Optional[str] = Field(None, min_length=1, max_length=10, description="Updated day number or range")
    date_month: Optional[str] = Field(None, min_length=1, max_length=10, description="Updated month abbreviation")
    location_label: Optional[str] = Field(None, min_length=1, max_length=150, description="Updated location label")
    status: Optional[str] = Field(None, max_length=32, description="Updated event status")
    status_class: Optional[str] = Field(None, max_length=32, description="Updated CSS badge class")
    image_url: Optional[str] = Field(None, max_length=500, description="Updated image URL")
    description: Optional[str] = Field(None, description="Updated event description")
    destination_id: Optional[str] = Field(None, min_length=1, max_length=64, description="Target destination ID reassignment")

