"""
YatraSetu Platform — Tourist Workspace Pydantic Schemas
Defines request and response schemas for Tourist Companion operations:
Profile management, saved favorites/wishlists, trip plans and itineraries,
and destination reviews/feedback.
"""

import uuid
from datetime import datetime, date
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, field_validator


# -----------------------------------------------------------------------------
# 1. Tourist Profile Schemas
# -----------------------------------------------------------------------------

class TouristProfileResponse(BaseModel):
    """Authoritative tourist user profile details."""
    user_id: uuid.UUID = Field(..., description="Unique user account identifier")
    email: str = Field(..., description="Tourist account email")
    full_name: str = Field(..., description="Tourist full name")
    role: str = Field("tourist", description="Platform role ('tourist')")
    phone_number: Optional[str] = Field(None, description="Contact phone number")
    preferences: Dict[str, Any] = Field(default_factory=dict, description="Travel preferences")
    is_active: bool = Field(True, description="Account active status")
    is_verified: bool = Field(False, description="Account verified status")
    created_at: Optional[datetime] = Field(None, description="Account registration timestamp")

    model_config = {"from_attributes": True}


class TouristProfileUpdate(BaseModel):
    """Payload for updating tourist profile."""
    full_name: Optional[str] = Field(None, min_length=2, max_length=150, description="Full name")
    phone_number: Optional[str] = Field(None, max_length=32, description="Phone number")
    preferences: Optional[Dict[str, Any]] = Field(None, description="Travel preferences")


# -----------------------------------------------------------------------------
# 2. Wishlist / Favorites Schemas
# -----------------------------------------------------------------------------

class FavoriteCreate(BaseModel):
    """Payload to save a destination to wishlist."""
    destination_id: str = Field(..., min_length=1, max_length=64, description="Destination identifier (e.g. 'rajgad-fort')")


class FavoriteResponse(BaseModel):
    """Saved destination wishlist item."""
    id: uuid.UUID = Field(..., description="Unique bookmark identifier")
    destination_id: str = Field(..., description="Destination identifier")
    destination_name: Optional[str] = Field(None, description="Destination title")
    destination_category: Optional[str] = Field(None, description="Destination category")
    state_id: Optional[str] = Field(None, description="State identifier")
    state_name: Optional[str] = Field(None, description="State name")
    created_at: datetime = Field(..., description="Date bookmarked")

    model_config = {"from_attributes": True}


# -----------------------------------------------------------------------------
# 3. Trip Plans & Itineraries Schemas
# -----------------------------------------------------------------------------

class TripPlanItemCreate(BaseModel):
    """Individual stop or attraction activity in a trip plan."""
    destination_id: str = Field(..., min_length=1, max_length=64, description="Destination identifier")
    attraction_id: Optional[uuid.UUID] = Field(None, description="Optional attraction ID")
    day_number: int = Field(1, ge=1, le=30, description="Day number of itinerary")
    order_index: int = Field(1, ge=1, le=50, description="Order index within day")
    time_slot: Optional[str] = Field(None, max_length=64, description="E.g. 'Morning', '10:00 AM'")
    notes: Optional[str] = Field(None, max_length=500, description="Activity notes")


class TripPlanItemResponse(BaseModel):
    """Itinerary item details."""
    id: uuid.UUID = Field(..., description="Unique item ID")
    trip_plan_id: uuid.UUID = Field(..., description="Parent trip plan ID")
    destination_id: str = Field(..., description="Destination identifier")
    destination_name: Optional[str] = Field(None, description="Destination name")
    attraction_id: Optional[uuid.UUID] = Field(None, description="Attraction ID")
    attraction_name: Optional[str] = Field(None, description="Attraction name")
    day_number: int = Field(..., description="Day number")
    order_index: int = Field(..., description="Order index")
    time_slot: Optional[str] = Field(None, description="Time slot")
    notes: Optional[str] = Field(None, description="Item notes")

    model_config = {"from_attributes": True}


class TripPlanCreate(BaseModel):
    """Payload to create a new personal itinerary."""
    title: str = Field(..., min_length=2, max_length=180, description="Trip title (e.g. 'Sahyadri Forts Weekend')")
    start_date: Optional[date] = Field(None, description="Trip start date")
    end_date: Optional[date] = Field(None, description="Trip end date")
    notes: Optional[str] = Field(None, max_length=2000, description="Trip preparation or packing notes")
    items: Optional[List[TripPlanItemCreate]] = Field(default_factory=list, description="Itinerary stops")


class TripPlanUpdate(BaseModel):
    """Payload to update an existing itinerary."""
    title: Optional[str] = Field(None, min_length=2, max_length=180, description="Trip title")
    start_date: Optional[date] = Field(None, description="Trip start date")
    end_date: Optional[date] = Field(None, description="Trip end date")
    notes: Optional[str] = Field(None, max_length=2000, description="Trip notes")
    items: Optional[List[TripPlanItemCreate]] = Field(None, description="Updated itinerary items")


class TripPlanResponse(BaseModel):
    """Authoritative trip plan response."""
    id: uuid.UUID = Field(..., description="Unique trip plan ID")
    user_id: uuid.UUID = Field(..., description="Owner user ID")
    title: str = Field(..., description="Trip title")
    start_date: Optional[date] = Field(None, description="Start date")
    end_date: Optional[date] = Field(None, description="End date")
    notes: Optional[str] = Field(None, description="Notes")
    created_at: datetime = Field(..., description="Created timestamp")
    updated_at: datetime = Field(..., description="Last updated timestamp")
    items: List[TripPlanItemResponse] = Field(default_factory=list, description="Ordered itinerary items")

    model_config = {"from_attributes": True}


# -----------------------------------------------------------------------------
# 4. Destination Reviews & Feedback Schemas
# -----------------------------------------------------------------------------

class ReviewCreate(BaseModel):
    """Payload to submit destination feedback or review."""
    destination_id: str = Field(..., min_length=1, max_length=64, description="Destination identifier")
    rating: int = Field(..., ge=1, le=5, description="Star rating (1 to 5)")
    category: Optional[str] = Field("reviews", max_length=64, description="Feedback category (e.g. 'reviews', 'cleanliness', 'trails')")
    comment: str = Field(..., min_length=10, max_length=2000, description="Descriptive feedback text")
    guest_author_name: Optional[str] = Field(None, max_length=120, description="Display name for guest or visitor")


class ReviewResponse(BaseModel):
    """Destination review item."""
    id: uuid.UUID = Field(..., description="Review identifier")
    destination_id: str = Field(..., description="Destination identifier")
    destination_name: Optional[str] = Field(None, description="Destination title")
    user_id: Optional[uuid.UUID] = Field(None, description="Author user ID (null for guest)")
    author_name: str = Field(..., description="Author display name")
    rating: int = Field(..., description="Rating (1-5)")
    category: str = Field(..., description="Review category")
    comment: str = Field(..., description="Review comment")
    review_status: str = Field(..., description="Review status ('pending_review', 'approved', 'rejected')")
    created_at: datetime = Field(..., description="Submission timestamp")
    is_own_review: bool = Field(False, description="True if authored by the current authenticated user")

    model_config = {"from_attributes": True}


# -----------------------------------------------------------------------------
# 5. Destination Advisory Schemas (Tourist Consumption)
# -----------------------------------------------------------------------------

class TouristAdvisoryResponse(BaseModel):
    """Active visitor safety bulletin or advisory."""
    id: uuid.UUID = Field(..., description="Advisory identifier")
    destination_id: str = Field(..., description="Destination identifier")
    destination_name: Optional[str] = Field(None, description="Destination title")
    severity: str = Field(..., description="Severity level: 'info', 'advisory', 'warning', 'critical'")
    title: str = Field(..., description="Advisory title")
    description: str = Field(..., description="Detailed instructions and safety guidelines")
    valid_from: datetime = Field(..., description="Effective start time")
    valid_until: Optional[datetime] = Field(None, description="Expiration time")
    is_active: bool = Field(True, description="Active status")
    created_at: datetime = Field(..., description="Publication timestamp")

    model_config = {"from_attributes": True}
