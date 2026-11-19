"""
YatraSetu Platform — Tourist Workspace API Endpoints
Provides endpoints for Tourist Companion operations:
- Tourist profile retrieval and update
- Wishlist / saved destinations management
- Custom trip plans and itineraries CRUD
- Destination feedback and reviews submission/retrieval
- Official destination safety advisories and bulletins
"""

import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_

from app.database import get_db
from app.core.auth import (
    require_tourist,
    require_role,
    get_optional_user_and_context,
)
from app.core.security import SecurityContext
from app.models.identity import User
from app.models.destination import Destination, Attraction, State, DestinationAdvisory
from app.models.tourist import TripPlan, TripPlanItem, UserFavorite, DestinationReview
from app.schemas.tourist import (
    TouristProfileResponse,
    TouristProfileUpdate,
    FavoriteCreate,
    FavoriteResponse,
    TripPlanCreate,
    TripPlanUpdate,
    TripPlanResponse,
    TripPlanItemResponse,
    ReviewCreate,
    ReviewResponse,
    TouristAdvisoryResponse,
)
from app.schemas.auth import MessageResponse

router = APIRouter()

# Authorize tourist or platform administrator
require_tourist_or_admin = require_role(["tourist", "admin"])


# =============================================================================
# 1. Tourist Profile Endpoints
# =============================================================================

@router.get(
    "/profile",
    response_model=TouristProfileResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Tourist Profile",
    description="Retrieves the authenticated tourist's user profile and travel preferences.",
)
def get_tourist_profile(
    context: SecurityContext = Depends(require_tourist_or_admin),
    db: Session = Depends(get_db),
) -> TouristProfileResponse:
    """Return the authenticated tourist profile."""
    user = db.query(User).filter(User.id == context.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tourist account record not found.",
        )
    return TouristProfileResponse(
        user_id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role_id,
        phone_number=user.phone_number,
        preferences=user.preferences or {},
        is_active=user.is_active,
        is_verified=user.is_verified,
        created_at=user.created_at,
    )


@router.put(
    "/profile",
    response_model=TouristProfileResponse,
    status_code=status.HTTP_200_OK,
    summary="Update Tourist Profile",
    description="Updates the tourist's display name, contact phone, or travel preferences.",
)
def update_tourist_profile(
    payload: TouristProfileUpdate,
    context: SecurityContext = Depends(require_tourist_or_admin),
    db: Session = Depends(get_db),
) -> TouristProfileResponse:
    """Update profile fields while keeping role and system credentials immutable."""
    user = db.query(User).filter(User.id == context.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tourist account record not found.",
        )

    if payload.full_name is not None:
        user.full_name = payload.full_name.strip()
    if payload.phone_number is not None:
        user.phone_number = payload.phone_number.strip() if payload.phone_number else None
    if payload.preferences is not None:
        user.preferences = payload.preferences

    db.flush()
    response_data = TouristProfileResponse(
        user_id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role_id,
        phone_number=user.phone_number,
        preferences=user.preferences or {},
        is_active=user.is_active,
        is_verified=user.is_verified,
        created_at=user.created_at,
    )
    db.commit()
    return response_data


# =============================================================================
# 2. Wishlist / Saved Favorites Endpoints
# =============================================================================

@router.get(
    "/favorites",
    response_model=List[FavoriteResponse],
    status_code=status.HTTP_200_OK,
    summary="List Saved Wishlist Destinations",
    description="Returns all destinations bookmarked by the authenticated tourist.",
)
def list_favorites(
    context: SecurityContext = Depends(require_tourist_or_admin),
    db: Session = Depends(get_db),
) -> List[FavoriteResponse]:
    """Retrieve saved favorites for the authenticated tourist."""
    favs = (
        db.query(UserFavorite)
        .filter(UserFavorite.user_id == context.user_id)
        .order_by(UserFavorite.created_at.desc())
        .all()
    )

    results = []
    for f in favs:
        dest = db.query(Destination).filter(Destination.id == f.destination_id).first()
        state = db.query(State).filter(State.id == dest.state_id).first() if dest else None
        results.append(
            FavoriteResponse(
                id=f.id,
                destination_id=f.destination_id,
                destination_name=dest.name if dest else f.destination_id,
                destination_category=dest.category if dest else None,
                state_id=dest.state_id if dest else None,
                state_name=state.name if state else None,
                created_at=f.created_at,
            )
        )
    return results


@router.post(
    "/favorites",
    response_model=FavoriteResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Save Destination to Wishlist",
    description="Bookmarks a destination for the authenticated tourist.",
)
def add_favorite(
    payload: FavoriteCreate,
    context: SecurityContext = Depends(require_tourist_or_admin),
    db: Session = Depends(get_db),
) -> FavoriteResponse:
    """Add a destination to user's saved wishlist."""
    dest = db.query(Destination).filter(Destination.id == payload.destination_id).first()
    if not dest:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Destination '{payload.destination_id}' does not exist in catalogue.",
        )

    # Check if already favorited (idempotent)
    existing = (
        db.query(UserFavorite)
        .filter(
            UserFavorite.user_id == context.user_id,
            UserFavorite.destination_id == payload.destination_id,
        )
        .first()
    )
    if existing:
        state = db.query(State).filter(State.id == dest.state_id).first()
        return FavoriteResponse(
            id=existing.id,
            destination_id=existing.destination_id,
            destination_name=dest.name,
            destination_category=dest.category,
            state_id=dest.state_id,
            state_name=state.name if state else None,
            created_at=existing.created_at,
        )

    new_fav = UserFavorite(
        id=uuid.uuid4(),
        user_id=context.user_id,
        destination_id=payload.destination_id,
    )
    db.add(new_fav)
    db.flush()
    state = db.query(State).filter(State.id == dest.state_id).first()
    response_data = FavoriteResponse(
        id=new_fav.id,
        destination_id=new_fav.destination_id,
        destination_name=dest.name,
        destination_category=dest.category,
        state_id=dest.state_id,
        state_name=state.name if state else None,
        created_at=new_fav.created_at or datetime.now(timezone.utc),
    )
    db.commit()
    return response_data


@router.delete(
    "/favorites/{destination_id}",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Remove Destination from Wishlist",
    description="Deletes a saved destination bookmark for the authenticated tourist.",
)
def remove_favorite(
    destination_id: str,
    context: SecurityContext = Depends(require_tourist_or_admin),
    db: Session = Depends(get_db),
) -> MessageResponse:
    """Remove destination from saved wishlist."""
    fav = (
        db.query(UserFavorite)
        .filter(
            UserFavorite.user_id == context.user_id,
            UserFavorite.destination_id == destination_id,
        )
        .first()
    )
    if not fav:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Destination '{destination_id}' was not found in your saved wishlist.",
        )

    db.delete(fav)
    db.commit()
    return MessageResponse(message=f"Destination '{destination_id}' removed from wishlist.")


# =============================================================================
# 3. Trip Plans & Itineraries Endpoints
# =============================================================================

def _build_trip_plan_response(plan: TripPlan, db: Session) -> TripPlanResponse:
    """Helper to assemble a TripPlanResponse with nested items."""
    items_response = []
    for item in plan.items:
        dest = db.query(Destination).filter(Destination.id == item.destination_id).first()
        attr = db.query(Attraction).filter(Attraction.id == item.attraction_id).first() if item.attraction_id else None
        items_response.append(
            TripPlanItemResponse(
                id=item.id,
                trip_plan_id=item.trip_plan_id,
                destination_id=item.destination_id,
                destination_name=dest.name if dest else item.destination_id,
                attraction_id=item.attraction_id,
                attraction_name=attr.name if attr else None,
                day_number=item.day_number,
                order_index=item.order_index,
                time_slot=item.time_slot,
                notes=item.notes,
            )
        )

    return TripPlanResponse(
        id=plan.id,
        user_id=plan.user_id,
        title=plan.title,
        start_date=plan.start_date,
        end_date=plan.end_date,
        notes=plan.notes,
        created_at=plan.created_at,
        updated_at=plan.updated_at,
        items=items_response,
    )


@router.get(
    "/itineraries",
    response_model=List[TripPlanResponse],
    status_code=status.HTTP_200_OK,
    summary="List Tourist Trip Plans",
    description="Returns all customized travel itineraries created by the authenticated tourist.",
)
def list_itineraries(
    context: SecurityContext = Depends(require_tourist_or_admin),
    db: Session = Depends(get_db),
) -> List[TripPlanResponse]:
    """Retrieve all trip plans for the current tourist."""
    plans = (
        db.query(TripPlan)
        .filter(TripPlan.user_id == context.user_id)
        .order_by(TripPlan.created_at.desc())
        .all()
    )
    return [_build_trip_plan_response(p, db) for p in plans]


@router.get(
    "/itineraries/{plan_id}",
    response_model=TripPlanResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Trip Plan Details",
    description="Retrieves a specific trip plan with ordered day stops.",
)
def get_itinerary(
    plan_id: uuid.UUID,
    context: SecurityContext = Depends(require_tourist_or_admin),
    db: Session = Depends(get_db),
) -> TripPlanResponse:
    """Retrieve trip plan by ID, enforcing user ownership."""
    plan = db.query(TripPlan).filter(TripPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trip plan not found.",
        )
    if plan.user_id != context.user_id and context.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You do not own this trip plan.",
        )
    return _build_trip_plan_response(plan, db)


@router.post(
    "/itineraries",
    response_model=TripPlanResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Trip Plan",
    description="Creates a new custom trip plan with itinerary stops.",
)
def create_itinerary(
    payload: TripPlanCreate,
    context: SecurityContext = Depends(require_tourist_or_admin),
    db: Session = Depends(get_db),
) -> TripPlanResponse:
    """Create a new itinerary owned by the authenticated tourist."""
    new_plan = TripPlan(
        id=uuid.uuid4(),
        user_id=context.user_id,
        title=payload.title.strip(),
        start_date=payload.start_date,
        end_date=payload.end_date,
        notes=payload.notes.strip() if payload.notes else None,
    )
    db.add(new_plan)
    db.flush()

    if payload.items:
        for it in payload.items:
            dest = db.query(Destination).filter(Destination.id == it.destination_id).first()
            if not dest:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Destination '{it.destination_id}' does not exist.",
                )
            new_item = TripPlanItem(
                id=uuid.uuid4(),
                trip_plan_id=new_plan.id,
                destination_id=it.destination_id,
                attraction_id=it.attraction_id,
                day_number=it.day_number,
                order_index=it.order_index,
                time_slot=it.time_slot,
                notes=it.notes,
            )
            db.add(new_item)

    db.flush()
    response_data = _build_trip_plan_response(new_plan, db)
    db.commit()
    return response_data


@router.put(
    "/itineraries/{plan_id}",
    response_model=TripPlanResponse,
    status_code=status.HTTP_200_OK,
    summary="Update Trip Plan",
    description="Updates trip plan title, notes, dates, or stops.",
)
def update_itinerary(
    plan_id: uuid.UUID,
    payload: TripPlanUpdate,
    context: SecurityContext = Depends(require_tourist_or_admin),
    db: Session = Depends(get_db),
) -> TripPlanResponse:
    """Update trip plan details and optionally replace items."""
    plan = db.query(TripPlan).filter(TripPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trip plan not found.",
        )
    if plan.user_id != context.user_id and context.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You do not own this trip plan.",
        )

    if payload.title is not None:
        plan.title = payload.title.strip()
    if payload.start_date is not None:
        plan.start_date = payload.start_date
    if payload.end_date is not None:
        plan.end_date = payload.end_date
    if payload.notes is not None:
        plan.notes = payload.notes.strip() if payload.notes else None

    if payload.items is not None:
        # Delete existing items and replace with new items
        db.query(TripPlanItem).filter(TripPlanItem.trip_plan_id == plan.id).delete()
        for it in payload.items:
            dest = db.query(Destination).filter(Destination.id == it.destination_id).first()
            if not dest:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Destination '{it.destination_id}' does not exist.",
                )
            new_item = TripPlanItem(
                id=uuid.uuid4(),
                trip_plan_id=plan.id,
                destination_id=it.destination_id,
                attraction_id=it.attraction_id,
                day_number=it.day_number,
                order_index=it.order_index,
                time_slot=it.time_slot,
                notes=it.notes,
            )
            db.add(new_item)

    db.flush()
    response_data = _build_trip_plan_response(plan, db)
    db.commit()
    return response_data


@router.delete(
    "/itineraries/{plan_id}",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Delete Trip Plan",
    description="Deletes a trip plan and its associated stops.",
)
def delete_itinerary(
    plan_id: uuid.UUID,
    context: SecurityContext = Depends(require_tourist_or_admin),
    db: Session = Depends(get_db),
) -> MessageResponse:
    """Delete a trip plan owned by the tourist."""
    plan = db.query(TripPlan).filter(TripPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trip plan not found.",
        )
    if plan.user_id != context.user_id and context.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You do not own this trip plan.",
        )

    db.delete(plan)
    db.commit()
    return MessageResponse(message="Trip plan deleted successfully.")


# =============================================================================
# 4. Destination Reviews & Feedback Endpoints
# =============================================================================

@router.get(
    "/reviews/{destination_id}",
    response_model=List[ReviewResponse],
    status_code=status.HTTP_200_OK,
    summary="Get Destination Reviews",
    description="Returns approved reviews for a destination, plus any pending reviews submitted by the current user.",
)
def get_destination_reviews(
    destination_id: str,
    context: Optional[SecurityContext] = Depends(get_optional_user_and_context),
    db: Session = Depends(get_db),
) -> List[ReviewResponse]:
    """Retrieve approved reviews and caller's own pending reviews."""
    dest = db.query(Destination).filter(Destination.id == destination_id).first()
    if not dest:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Destination '{destination_id}' does not exist.",
        )

    query = db.query(DestinationReview).filter(DestinationReview.destination_id == destination_id)

    if context and context.user_id:
        # Caller sees approved reviews OR their own review submissions
        query = query.filter(
            or_(
                DestinationReview.review_status == "approved",
                DestinationReview.user_id == context.user_id,
            )
        )
    else:
        # Public unauthenticated visitors only see approved reviews
        query = query.filter(DestinationReview.review_status == "approved")

    reviews = query.order_by(DestinationReview.created_at.desc()).all()

    results = []
    for r in reviews:
        is_own = bool(context and context.user_id and r.user_id == context.user_id)
        author = r.guest_author_name
        if r.user_id:
            u = db.query(User).filter(User.id == r.user_id).first()
            if u:
                author = u.full_name
        results.append(
            ReviewResponse(
                id=r.id,
                destination_id=r.destination_id,
                destination_name=dest.name,
                user_id=r.user_id,
                author_name=author,
                rating=r.rating,
                category=r.category,
                comment=r.comment,
                review_status=r.review_status,
                created_at=r.created_at,
                is_own_review=is_own,
            )
        )
    return results


@router.post(
    "/reviews",
    response_model=ReviewResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit Destination Review",
    description="Submits a review for destination management review and publication.",
)
def submit_destination_review(
    payload: ReviewCreate,
    context: SecurityContext = Depends(require_tourist_or_admin),
    db: Session = Depends(get_db),
) -> ReviewResponse:
    """Submit a tourist review (status defaults to 'pending_review' per RLS policy)."""
    dest = db.query(Destination).filter(Destination.id == payload.destination_id).first()
    if not dest:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Destination '{payload.destination_id}' does not exist in catalogue.",
        )

    user = db.query(User).filter(User.id == context.user_id).first()
    author_name = (user.full_name if user else None) or payload.guest_author_name or "Verified Tourist"

    # Check if user already submitted a review for this destination (enforces uq_user_dest_review)
    existing = (
        db.query(DestinationReview)
        .filter(
            DestinationReview.destination_id == payload.destination_id,
            DestinationReview.user_id == context.user_id,
        )
        .first()
    )

    if existing:
        # Update existing review
        existing.rating = payload.rating
        existing.category = payload.category or "reviews"
        existing.comment = payload.comment.strip()
        existing.review_status = "pending_review"
        db.flush()
        response_data = ReviewResponse(
            id=existing.id,
            destination_id=existing.destination_id,
            destination_name=dest.name,
            user_id=existing.user_id,
            author_name=author_name,
            rating=existing.rating,
            category=existing.category,
            comment=existing.comment,
            review_status=existing.review_status,
            created_at=existing.created_at or datetime.now(timezone.utc),
            is_own_review=True,
        )
        db.commit()
        return response_data

    new_review = DestinationReview(
        id=uuid.uuid4(),
        destination_id=payload.destination_id,
        user_id=context.user_id,
        guest_author_name=author_name,
        rating=payload.rating,
        category=payload.category or "reviews",
        comment=payload.comment.strip(),
        review_status="pending_review",
    )
    db.add(new_review)
    db.flush()
    response_data = ReviewResponse(
        id=new_review.id,
        destination_id=new_review.destination_id,
        destination_name=dest.name,
        user_id=new_review.user_id,
        author_name=author_name,
        rating=new_review.rating,
        category=new_review.category,
        comment=new_review.comment,
        review_status=new_review.review_status,
        created_at=new_review.created_at or datetime.now(timezone.utc),
        is_own_review=True,
    )
    db.commit()
    return response_data


# =============================================================================
# 5. Destination Advisories Endpoints (Tourist Consumption)
# =============================================================================

@router.get(
    "/advisories/{destination_id}",
    response_model=List[TouristAdvisoryResponse],
    status_code=status.HTTP_200_OK,
    summary="Get Destination Advisories",
    description="Returns all active visitor notices, weather alerts, and safety guidelines for a destination.",
)
def get_destination_advisories(
    destination_id: str,
    db: Session = Depends(get_db),
) -> List[TouristAdvisoryResponse]:
    """Retrieve active safety advisories for tourist guidance."""
    dest = db.query(Destination).filter(Destination.id == destination_id).first()
    if not dest:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Destination '{destination_id}' does not exist.",
        )

    advisories = (
        db.query(DestinationAdvisory)
        .filter(
            DestinationAdvisory.destination_id == destination_id,
            DestinationAdvisory.is_active == True,
        )
        .order_by(DestinationAdvisory.created_at.desc())
        .all()
    )

    return [
        TouristAdvisoryResponse(
            id=adv.id,
            destination_id=adv.destination_id,
            destination_name=dest.name,
            severity=adv.severity,
            title=adv.title,
            description=adv.description,
            valid_from=adv.valid_from,
            valid_until=adv.valid_until,
            is_active=adv.is_active,
            created_at=adv.created_at,
        )
        for adv in advisories
    ]
