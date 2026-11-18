"""
YatraSetu Platform — Public Catalogue Pydantic Schemas
Defines request and response schemas for public tourism catalogue browsing:
States, Destinations, Attractions, Experiences, Events, and Circuits.
"""

import uuid
from typing import Optional, List, Dict, Any, Generic, TypeVar
from pydantic import BaseModel, Field

T = TypeVar("T")


class PaginatedResponse(BaseModel, Generic[T]):
    """Standardized paginated list envelope."""
    items: List[T]
    total: int = Field(..., ge=0, description="Total count of matching records")
    limit: int = Field(..., ge=1, description="Number of items requested")
    offset: int = Field(..., ge=0, description="Pagination offset")


# -----------------------------------------------------------------------------
# 1. State Schemas
# -----------------------------------------------------------------------------

class StateSummaryResponse(BaseModel):
    """Public summary representation of a cultural state."""
    id: str
    name: str
    theme_code: str
    badge_label: str
    tagline: Optional[str] = None
    description: Optional[str] = None
    hero_image_url: Optional[str] = None

    model_config = {"from_attributes": True}


# -----------------------------------------------------------------------------
# 2. Destination Schemas
# -----------------------------------------------------------------------------

class DestinationSummaryResponse(BaseModel):
    """Public catalogue summary card representation of a destination."""
    id: str
    state_id: str
    name: str
    category: str
    subtitle: Optional[str] = None
    location_label: Optional[str] = None
    hero_image_url: Optional[str] = None
    banner_image: Optional[str] = None
    ideal_duration: Optional[str] = None
    best_time: Optional[str] = None
    max_daily_capacity: Optional[int] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

    model_config = {"from_attributes": True}


class DestinationDetailResponse(DestinationSummaryResponse):
    """Comprehensive public destination detail representation."""
    description: str
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict, alias="metadata_json")
    state: Optional[StateSummaryResponse] = None

    model_config = {"from_attributes": True, "populate_by_name": True}


# -----------------------------------------------------------------------------
# 3. Attraction Schemas
# -----------------------------------------------------------------------------

class AttractionResponse(BaseModel):
    """Public representation of an attraction / point of interest."""
    id: uuid.UUID
    destination_id: str
    name: str
    category: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    rating: float
    status: str
    operating_hours: Optional[str] = None
    entry_fee_label: Optional[str] = None

    model_config = {"from_attributes": True}


# -----------------------------------------------------------------------------
# 4. Experience Schemas
# -----------------------------------------------------------------------------

class ExperienceResponse(BaseModel):
    """Public representation of an outdoor activity or curated experience."""
    id: str
    destination_id: str
    title: str
    category: str
    category_label: Optional[str] = None
    location_label: Optional[str] = None
    duration: Optional[str] = None
    difficulty: Optional[str] = None
    season: Optional[str] = None
    guide_requirement: Optional[str] = None
    image_url: Optional[str] = None
    description: str

    model_config = {"from_attributes": True}


# -----------------------------------------------------------------------------
# 5. Tourism Event Schemas
# -----------------------------------------------------------------------------

class EventResponse(BaseModel):
    """Public representation of a scheduled festival or destination event."""
    id: uuid.UUID
    destination_id: str
    title: str
    date_num: str
    date_month: str
    location_label: str
    status: str
    status_class: str
    image_url: Optional[str] = None
    description: Optional[str] = None

    model_config = {"from_attributes": True}


# -----------------------------------------------------------------------------
# 6. Tourism Circuit Schemas
# -----------------------------------------------------------------------------

class CuratedCircuitItemResponse(BaseModel):
    """Individual destination stop within a curated circuit itinerary."""
    id: uuid.UUID
    circuit_id: str
    destination_id: str
    day_number: int
    order_index: int
    notes: Optional[str] = None
    destination_name: Optional[str] = None

    model_config = {"from_attributes": True}


class CuratedCircuitResponse(BaseModel):
    """Multi-day regional travel circuit itinerary."""
    id: str
    state_id: str
    name: str
    description: str
    duration_label: Optional[str] = None
    hero_image_url: Optional[str] = None
    items: List[CuratedCircuitItemResponse] = []

    model_config = {"from_attributes": True}
