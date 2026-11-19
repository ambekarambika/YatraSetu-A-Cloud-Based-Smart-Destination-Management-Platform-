"""
YatraSetu Platform — Destination Manager Workspace Endpoints
Provides authenticated endpoints for Destination Managers and State Managers:
1. Manager jurisdiction context retrieval (GET /api/v1/manager/context)
2. Scoped destination listing (GET /api/v1/manager/destinations)
3. Scoped destination detail retrieval (GET /api/v1/manager/destinations/{destination_id})
4. Scoped attraction management: list, create, get, update, delete
5. Scoped tourism event management: list, create, get, update, delete

Strictly enforces database-derived identity, verified roles, and jurisdiction boundaries.
"""

import re
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.auth import require_manager
from app.core.security import SecurityContext
from app.core.jurisdiction import JurisdictionAuthorizer
from app.models.identity import User, ManagerAssignment
from app.models.destination import Destination, State, Attraction, Event, DestinationVideo
from app.schemas.manager import (
    ManagerContextResponse,
    AttractionCreate,
    AttractionUpdate,
    EventCreate,
    EventUpdate,
    DestinationCreate,
    DestinationUpdate,
    DestinationVideoCreate,
    DestinationVideoUpdate,
)
from app.schemas.catalogue import (
    DestinationSummaryResponse,
    DestinationDetailResponse,
    AttractionResponse,
    EventResponse,
    DestinationVideoResponse,
)
from app.schemas.auth import MessageResponse

router = APIRouter()

DESTINATION_ID_ALIASES = {
    "raigad-fort": ["raigad-fort", "rajgad-fort"],
    "rajgad-fort": ["rajgad-fort", "raigad-fort"],
    "amber-fort": ["amber-fort", "amer-fort"],
    "amer-fort": ["amer-fort", "amber-fort"],
}

def resolve_destination_ids(dest_id: str) -> List[str]:
    """Resolves destination IDs including known historical or naming aliases."""
    clean_id = dest_id.strip().lower()
    return DESTINATION_ID_ALIASES.get(clean_id, [clean_id])



# -----------------------------------------------------------------------------
# 1. Manager Context & Profile
# -----------------------------------------------------------------------------

@router.get(
    "/context",
    response_model=ManagerContextResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Manager Context & Jurisdiction",
    description="Returns verified manager identity, assigned jurisdiction (state or destination), and role details.",
)
def get_manager_context(
    context: SecurityContext = Depends(require_manager),
    db: Session = Depends(get_db),
) -> ManagerContextResponse:
    """
    Retrieves the authoritative jurisdiction context for the authenticated manager.
    Requires role 'manager' and an active database assignment in manager_assignments.
    """
    user = db.query(User).filter(User.id == context.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Manager account not found.",
        )

    assignment = JurisdictionAuthorizer.get_manager_assignment(db, context.user_id)
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="CONFIGURATION ERROR: Manager account exists without active jurisdiction assignment.",
        )

    state_obj = db.query(State).filter(State.id == assignment.state_id).first()
    state_name = state_obj.name if state_obj else assignment.state_id

    destination_name = None
    if assignment.destination_id:
        dest_obj = db.query(Destination).filter(Destination.id == assignment.destination_id).first()
        destination_name = dest_obj.name if dest_obj else assignment.destination_id

    scope = "state" if assignment.destination_id is None else "destination"

    return ManagerContextResponse(
        user_id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=context.role,
        scope=scope,
        state_id=assignment.state_id,
        state_name=state_name,
        destination_id=assignment.destination_id,
        destination_name=destination_name,
        assigned_at=assignment.assigned_at,
    )


# -----------------------------------------------------------------------------
# 2. Managed Destination Inventory
# -----------------------------------------------------------------------------

@router.get(
    "/destinations",
    response_model=List[DestinationSummaryResponse],
    status_code=status.HTTP_200_OK,
    summary="List Managed Destinations",
    description="Returns destinations within the manager's assigned jurisdiction. "
                "Destination managers receive only their single assigned destination; "
                "State managers receive all destinations in their assigned state.",
)
def list_managed_destinations(
    limit: int = Query(50, ge=1, le=100, description="Maximum records to return"),
    offset: int = Query(0, ge=0, description="Number of records to skip"),
    context: SecurityContext = Depends(require_manager),
    db: Session = Depends(get_db),
) -> List[DestinationSummaryResponse]:
    """
    Lists destinations restricted strictly to the caller's jurisdictional boundary.
    """
    # Destination Manager scope: strictly their assigned destination
    if context.destination_id is not None:
        destinations = (
            db.query(Destination)
            .filter(
                Destination.id == context.destination_id,
                Destination.state_id == context.state_id,
            )
            .offset(offset)
            .limit(limit)
            .all()
        )
        return destinations

    # State Manager scope (destination_id IS NULL): all destinations in assigned state
    destinations = (
        db.query(Destination)
        .filter(Destination.state_id == context.state_id)
        .order_by(Destination.name.asc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    return destinations


@router.get(
    "/destinations/{destination_id}",
    response_model=DestinationDetailResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Managed Destination Details",
    description="Returns detailed record for a destination, provided it falls within the manager's jurisdiction. "
                "Returns 403 Forbidden for cross-jurisdiction access and 404 for non-existent destinations.",
)
def get_managed_destination(
    destination_id: str,
    context: SecurityContext = Depends(require_manager),
    db: Session = Depends(get_db),
) -> DestinationDetailResponse:
    """
    Retrieves destination details with strict jurisdiction boundary enforcement.
    """
    # 1. Query target destination (handling aliases if necessary)
    destination = (
        db.query(Destination)
        .filter(Destination.id.in_(resolve_destination_ids(destination_id)))
        .first()
    )
    if not destination:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Destination '{destination_id}' not found.",
        )

    # 2. If Destination Manager, verify destination_id matches their assigned destination
    if context.destination_id is not None and context.destination_id not in resolve_destination_ids(destination.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Destination is outside your assigned jurisdiction.",
        )

    # 3. Check jurisdictional authority via JurisdictionAuthorizer
    has_authority = JurisdictionAuthorizer.can_manage_destination(
        session=db,
        context=context,
        target_destination_id=destination.id,
        target_state_id=destination.state_id,
    )
    if not has_authority:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Destination is outside your assigned jurisdiction.",
        )

    return destination


@router.post(
    "/destinations",
    response_model=DestinationDetailResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Managed Destination Profile",
    description="Creates a new destination within the manager's assigned state jurisdiction.",
)
def create_managed_destination(
    payload: DestinationCreate,
    context: SecurityContext = Depends(require_manager),
    db: Session = Depends(get_db),
) -> DestinationDetailResponse:
    """
    Creates a new destination with strict jurisdictional boundary enforcement.
    """
    state_id = payload.state_id or context.state_id
    if not state_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="State ID is required to create a destination.",
        )
    if not JurisdictionAuthorizer.can_manage_state(db, context, state_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied: You do not have management authority over state '{state_id}'.",
        )

    state = db.query(State).filter(State.id == state_id).first()
    if not state:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"State '{state_id}' does not exist in platform catalog.",
        )

    dest_id = payload.id
    if not dest_id:
        clean_name = re.sub(r"[^a-z0-9]+", "-", payload.name.lower()).strip("-")
        dest_id = clean_name or f"dest-{uuid.uuid4().hex[:8]}"

    existing = db.query(Destination).filter(Destination.id == dest_id).first()
    if existing:
        dest_id = f"{dest_id}-{uuid.uuid4().hex[:4]}"

    dest = Destination(
        id=dest_id,
        state_id=state_id,
        name=payload.name,
        category=payload.category,
        subtitle=payload.subtitle or f"A curated destination in {state.name}",
        location_label=payload.location_label or f"{payload.name}, {state.name}",
        description=payload.description or f"Welcome to {payload.name}, a premier destination in {state.name}.",
        hero_image_url=payload.hero_image_url,
        banner_image=payload.banner_image or payload.hero_image_url,
        ideal_duration=payload.ideal_duration or "1-2 Days",
        best_time=payload.best_time or "October to March",
        max_daily_capacity=payload.max_daily_capacity or 5000,
        metadata_json=payload.metadata or {},
    )
    db.add(dest)
    db.commit()
    db.refresh(dest)
    return dest


@router.put(
    "/destinations/{destination_id}",
    response_model=DestinationDetailResponse,
    status_code=status.HTTP_200_OK,
    summary="Update Managed Destination Profile",
    description="Updates destination details within the manager's assigned jurisdiction.",
)
def update_managed_destination(
    destination_id: str,
    payload: DestinationUpdate,
    context: SecurityContext = Depends(require_manager),
    db: Session = Depends(get_db),
) -> DestinationDetailResponse:
    """
    Updates an existing destination with jurisdiction boundary validation.
    """
    dest = db.query(Destination).filter(Destination.id.in_(resolve_destination_ids(destination_id))).first()
    if not dest:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Destination '{destination_id}' not found.",
        )

    if not JurisdictionAuthorizer.can_manage_destination(db, context, dest.id, target_state_id=dest.state_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Destination is outside your assigned jurisdiction.",
        )

    if payload.name is not None:
        dest.name = payload.name
    if payload.category is not None:
        dest.category = payload.category
    if payload.subtitle is not None:
        dest.subtitle = payload.subtitle
    if payload.location_label is not None:
        dest.location_label = payload.location_label
    if payload.description is not None:
        dest.description = payload.description
    if payload.hero_image_url is not None:
        dest.hero_image_url = payload.hero_image_url
    if payload.banner_image is not None:
        dest.banner_image = payload.banner_image
    if payload.ideal_duration is not None:
        dest.ideal_duration = payload.ideal_duration
    if payload.best_time is not None:
        dest.best_time = payload.best_time
    if payload.max_daily_capacity is not None:
        dest.max_daily_capacity = payload.max_daily_capacity
    if payload.metadata is not None:
        existing_meta = dict(dest.metadata_json or {})
        existing_meta.update(payload.metadata)
        dest.metadata_json = existing_meta
        from sqlalchemy.orm.attributes import flag_modified
        flag_modified(dest, "metadata_json")

    db.commit()
    db.refresh(dest)
    return dest


# -----------------------------------------------------------------------------
# 3. Managed Attractions Operations
# -----------------------------------------------------------------------------

@router.get(
    "/attractions",
    response_model=List[AttractionResponse],
    status_code=status.HTTP_200_OK,
    summary="List Managed Attractions",
    description="Returns attractions strictly within the manager's assigned jurisdiction. "
                "Destination managers only see attractions within their assigned destination. "
                "State managers see attractions across their assigned state, with optional destination filtering.",
)
def list_managed_attractions(
    destination_id: Optional[str] = Query(None, description="Optional destination filter"),
    category: Optional[str] = Query(None, description="Optional category filter"),
    limit: int = Query(50, ge=1, le=100, description="Maximum records to return"),
    offset: int = Query(0, ge=0, description="Records to skip"),
    context: SecurityContext = Depends(require_manager),
    db: Session = Depends(get_db),
) -> List[AttractionResponse]:
    """
    Lists attractions within caller's jurisdictional boundary.
    """
    # Destination Manager scope
    if context.destination_id is not None:
        if destination_id and destination_id != context.destination_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: Destination is outside your assigned jurisdiction.",
            )
        query = db.query(Attraction).filter(Attraction.destination_id == context.destination_id)
    else:
        # State Manager scope
        if destination_id:
            dest = db.query(Destination).filter(Destination.id.in_(resolve_destination_ids(destination_id))).first()
            if not dest or dest.state_id != context.state_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied: Destination is outside your state jurisdiction.",
                )
            query = db.query(Attraction).filter(Attraction.destination_id.in_(resolve_destination_ids(destination_id)))
        else:
            query = (
                db.query(Attraction)
                .join(Destination, Attraction.destination_id == Destination.id)
                .filter(Destination.state_id == context.state_id)
            )

    if category:
        query = query.filter(Attraction.category == category)

    attractions = query.order_by(Attraction.name.asc()).offset(offset).limit(limit).all()
    return attractions


@router.post(
    "/attractions",
    response_model=AttractionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Managed Attraction",
    description="Creates a new attraction within the manager's assigned jurisdiction. "
                "Destination managers can only add attractions to their assigned destination. "
                "State managers can add attractions to any destination within their assigned state.",
)
def create_managed_attraction(
    payload: AttractionCreate,
    context: SecurityContext = Depends(require_manager),
    db: Session = Depends(get_db),
) -> AttractionResponse:
    """
    Creates an attraction with strict jurisdiction enforcement on target destination.
    """
    # 1. Destination Manager check
    if context.destination_id is not None and payload.destination_id != context.destination_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Cannot create attraction for a destination outside your assigned jurisdiction.",
        )

    # 2. Verify destination exists
    dest = db.query(Destination).filter(Destination.id == payload.destination_id).first()
    if not dest:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Destination '{payload.destination_id}' not found.",
        )

    # 3. State Manager check
    if not JurisdictionAuthorizer.can_manage_destination(db, context, payload.destination_id, target_state_id=dest.state_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Destination is outside your state jurisdiction.",
        )

    attraction = Attraction(
        id=uuid.uuid4(),
        destination_id=payload.destination_id,
        name=payload.name,
        category=payload.category,
        description=payload.description,
        image_url=payload.image_url,
        rating=payload.rating if payload.rating is not None else 0.0,
        status=payload.status or "Open",
        operating_hours=payload.operating_hours,
        entry_fee_label=payload.entry_fee_label,
    )
    db.add(attraction)
    db.commit()
    db.refresh(attraction)
    return attraction


@router.get(
    "/attractions/{attraction_id}",
    response_model=AttractionResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Managed Attraction Details",
)
def get_managed_attraction(
    attraction_id: uuid.UUID,
    context: SecurityContext = Depends(require_manager),
    db: Session = Depends(get_db),
) -> AttractionResponse:
    """
    Retrieves attraction details verifying jurisdictional authority.
    """
    attraction = db.query(Attraction).filter(Attraction.id == attraction_id).first()
    if not attraction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attraction not found.",
        )

    dest = db.query(Destination).filter(Destination.id == attraction.destination_id).first()
    if not JurisdictionAuthorizer.can_manage_destination(
        db, context, attraction.destination_id, target_state_id=dest.state_id if dest else None
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Attraction is outside your assigned jurisdiction.",
        )

    return attraction


@router.put(
    "/attractions/{attraction_id}",
    response_model=AttractionResponse,
    status_code=status.HTTP_200_OK,
    summary="Update Managed Attraction",
)
def update_managed_attraction(
    attraction_id: uuid.UUID,
    payload: AttractionUpdate,
    context: SecurityContext = Depends(require_manager),
    db: Session = Depends(get_db),
) -> AttractionResponse:
    """
    Updates an attraction with jurisdiction checks on both current and target destinations.
    """
    attraction = db.query(Attraction).filter(Attraction.id == attraction_id).first()
    if not attraction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attraction not found.",
        )

    dest = db.query(Destination).filter(Destination.id == attraction.destination_id).first()
    if not JurisdictionAuthorizer.can_manage_destination(
        db, context, attraction.destination_id, target_state_id=dest.state_id if dest else None
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Attraction is outside your assigned jurisdiction.",
        )

    # If destination reassignment is requested, verify target destination authority
    if payload.destination_id is not None and payload.destination_id != attraction.destination_id:
        target_dest = db.query(Destination).filter(Destination.id == payload.destination_id).first()
        if not target_dest:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Target destination '{payload.destination_id}' not found.",
            )
        if not JurisdictionAuthorizer.can_manage_destination(
            db, context, payload.destination_id, target_state_id=target_dest.state_id
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: Target destination is outside your assigned jurisdiction.",
            )
        attraction.destination_id = payload.destination_id

    if payload.name is not None:
        attraction.name = payload.name
    if payload.category is not None:
        attraction.category = payload.category
    if payload.description is not None:
        attraction.description = payload.description
    if payload.image_url is not None:
        attraction.image_url = payload.image_url
    if payload.rating is not None:
        attraction.rating = payload.rating
    if payload.status is not None:
        attraction.status = payload.status
    if payload.operating_hours is not None:
        attraction.operating_hours = payload.operating_hours
    if payload.entry_fee_label is not None:
        attraction.entry_fee_label = payload.entry_fee_label

    db.commit()
    db.refresh(attraction)
    return attraction


@router.delete(
    "/attractions/{attraction_id}",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Delete Managed Attraction",
)
def delete_managed_attraction(
    attraction_id: uuid.UUID,
    context: SecurityContext = Depends(require_manager),
    db: Session = Depends(get_db),
) -> MessageResponse:
    """
    Deletes an attraction with strict jurisdiction boundary enforcement.
    """
    attraction = db.query(Attraction).filter(Attraction.id == attraction_id).first()
    if not attraction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attraction not found.",
        )

    dest = db.query(Destination).filter(Destination.id == attraction.destination_id).first()
    if not JurisdictionAuthorizer.can_manage_destination(
        db, context, attraction.destination_id, target_state_id=dest.state_id if dest else None
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Attraction is outside your assigned jurisdiction.",
        )

    name = attraction.name
    db.delete(attraction)
    db.commit()
    return MessageResponse(message=f"Attraction '{name}' deleted successfully.")


# -----------------------------------------------------------------------------
# 4. Managed Tourism Events Operations
# -----------------------------------------------------------------------------

@router.get(
    "/events",
    response_model=List[EventResponse],
    status_code=status.HTTP_200_OK,
    summary="List Managed Tourism Events",
    description="Returns tourism events strictly within the manager's assigned jurisdiction. "
                "Destination managers only see events within their assigned destination. "
                "State managers see events across their assigned state, with optional destination filtering.",
)
def list_managed_events(
    destination_id: Optional[str] = Query(None, description="Optional destination filter"),
    status_filter: Optional[str] = Query(None, alias="status", description="Optional status filter"),
    limit: int = Query(50, ge=1, le=100, description="Maximum records to return"),
    offset: int = Query(0, ge=0, description="Records to skip"),
    context: SecurityContext = Depends(require_manager),
    db: Session = Depends(get_db),
) -> List[EventResponse]:
    """
    Lists tourism events within caller's jurisdictional boundary.
    """
    # Destination Manager scope
    if context.destination_id is not None:
        if destination_id and destination_id != context.destination_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: Destination is outside your assigned jurisdiction.",
            )
        query = db.query(Event).filter(Event.destination_id == context.destination_id)
    else:
        # State Manager scope
        if destination_id:
            dest = db.query(Destination).filter(Destination.id.in_(resolve_destination_ids(destination_id))).first()
            if not dest or dest.state_id != context.state_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied: Destination is outside your state jurisdiction.",
                )
            query = db.query(Event).filter(Event.destination_id.in_(resolve_destination_ids(destination_id)))
        else:
            query = (
                db.query(Event)
                .join(Destination, Event.destination_id == Destination.id)
                .filter(Destination.state_id == context.state_id)
            )

    if status_filter:
        query = query.filter(Event.status == status_filter)

    events = query.order_by(Event.created_at.desc()).offset(offset).limit(limit).all()
    return events


@router.post(
    "/events",
    response_model=EventResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Managed Tourism Event",
    description="Creates a new tourism event within the manager's assigned jurisdiction. "
                "Destination managers can only add events to their assigned destination. "
                "State managers can add events to any destination within their assigned state.",
)
def create_managed_event(
    payload: EventCreate,
    context: SecurityContext = Depends(require_manager),
    db: Session = Depends(get_db),
) -> EventResponse:
    """
    Creates a tourism event with strict jurisdiction enforcement on target destination.
    """
    # 1. Destination Manager check
    if context.destination_id is not None and payload.destination_id != context.destination_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Cannot create event for a destination outside your assigned jurisdiction.",
        )

    # 2. Verify destination exists
    dest = db.query(Destination).filter(Destination.id == payload.destination_id).first()
    if not dest:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Destination '{payload.destination_id}' not found.",
        )

    # 3. State Manager check
    if not JurisdictionAuthorizer.can_manage_destination(db, context, payload.destination_id, target_state_id=dest.state_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Destination is outside your state jurisdiction.",
        )

    event = Event(
        id=uuid.uuid4(),
        destination_id=payload.destination_id,
        title=payload.title,
        date_num=payload.date_num,
        date_month=payload.date_month,
        location_label=payload.location_label,
        status=payload.status or "Open",
        status_class=payload.status_class or "active",
        image_url=payload.image_url,
        description=payload.description,
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


@router.get(
    "/events/{event_id}",
    response_model=EventResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Managed Event Details",
)
def get_managed_event(
    event_id: uuid.UUID,
    context: SecurityContext = Depends(require_manager),
    db: Session = Depends(get_db),
) -> EventResponse:
    """
    Retrieves tourism event details verifying jurisdictional authority.
    """
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found.",
        )

    dest = db.query(Destination).filter(Destination.id == event.destination_id).first()
    if not JurisdictionAuthorizer.can_manage_destination(
        db, context, event.destination_id, target_state_id=dest.state_id if dest else None
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Event is outside your assigned jurisdiction.",
        )

    return event


@router.put(
    "/events/{event_id}",
    response_model=EventResponse,
    status_code=status.HTTP_200_OK,
    summary="Update Managed Event",
)
def update_managed_event(
    event_id: uuid.UUID,
    payload: EventUpdate,
    context: SecurityContext = Depends(require_manager),
    db: Session = Depends(get_db),
) -> EventResponse:
    """
    Updates a tourism event with jurisdiction checks on both current and target destinations.
    """
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found.",
        )

    dest = db.query(Destination).filter(Destination.id == event.destination_id).first()
    if not JurisdictionAuthorizer.can_manage_destination(
        db, context, event.destination_id, target_state_id=dest.state_id if dest else None
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Event is outside your assigned jurisdiction.",
        )

    # If destination reassignment is requested, verify target destination authority
    if payload.destination_id is not None and payload.destination_id != event.destination_id:
        target_dest = db.query(Destination).filter(Destination.id == payload.destination_id).first()
        if not target_dest:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Target destination '{payload.destination_id}' not found.",
            )
        if not JurisdictionAuthorizer.can_manage_destination(
            db, context, payload.destination_id, target_state_id=target_dest.state_id
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: Target destination is outside your assigned jurisdiction.",
            )
        event.destination_id = payload.destination_id

    if payload.title is not None:
        event.title = payload.title
    if payload.date_num is not None:
        event.date_num = payload.date_num
    if payload.date_month is not None:
        event.date_month = payload.date_month
    if payload.location_label is not None:
        event.location_label = payload.location_label
    if payload.status is not None:
        event.status = payload.status
    if payload.status_class is not None:
        event.status_class = payload.status_class
    if payload.image_url is not None:
        event.image_url = payload.image_url
    if payload.description is not None:
        event.description = payload.description

    db.commit()
    db.refresh(event)
    return event


@router.delete(
    "/events/{event_id}",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Delete Managed Event",
)
def delete_managed_event(
    event_id: uuid.UUID,
    context: SecurityContext = Depends(require_manager),
    db: Session = Depends(get_db),
) -> MessageResponse:
    """
    Deletes a tourism event with strict jurisdiction boundary enforcement.
    """
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found.",
        )

    dest = db.query(Destination).filter(Destination.id == event.destination_id).first()
    if not JurisdictionAuthorizer.can_manage_destination(
        db, context, event.destination_id, target_state_id=dest.state_id if dest else None
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Event is outside your assigned jurisdiction.",
        )

    title = event.title
    db.delete(event)
    db.commit()
    return MessageResponse(message=f"Event '{title}' deleted successfully.")


# -----------------------------------------------------------------------------
# 5. Managed Destination Videos Operations
# -----------------------------------------------------------------------------

@router.get(
    "/videos",
    response_model=List[DestinationVideoResponse],
    status_code=status.HTTP_200_OK,
    summary="List Managed Destination Videos",
    description="Returns videos strictly within the manager's assigned jurisdiction.",
)
def list_managed_videos(
    destination_id: Optional[str] = Query(None, description="Optional destination filter"),
    category: Optional[str] = Query(None, description="Optional category filter"),
    limit: int = Query(50, ge=1, le=100, description="Maximum records to return"),
    offset: int = Query(0, ge=0, description="Records to skip"),
    context: SecurityContext = Depends(require_manager),
    db: Session = Depends(get_db),
) -> List[DestinationVideoResponse]:
    """
    Lists videos within manager's jurisdictional boundary.
    """
    if context.destination_id is not None:
        if destination_id and destination_id != context.destination_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: Destination is outside your assigned jurisdiction.",
            )
        query = db.query(DestinationVideo).filter(DestinationVideo.destination_id == context.destination_id)
    else:
        if destination_id:
            dest = db.query(Destination).filter(Destination.id == destination_id).first()
            if not dest or dest.state_id != context.state_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied: Destination is outside your state jurisdiction.",
                )
            query = db.query(DestinationVideo).filter(DestinationVideo.destination_id == destination_id)
        else:
            query = (
                db.query(DestinationVideo)
                .join(Destination, DestinationVideo.destination_id == Destination.id)
                .filter(Destination.state_id == context.state_id)
            )

    if category:
        query = query.filter(DestinationVideo.category == category)

    return query.order_by(DestinationVideo.created_at.desc()).offset(offset).limit(limit).all()


@router.post(
    "/videos",
    response_model=DestinationVideoResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Managed Destination Video",
    description="Creates a new destination information/orientation video within manager jurisdiction.",
)
def create_managed_video(
    payload: DestinationVideoCreate,
    context: SecurityContext = Depends(require_manager),
    db: Session = Depends(get_db),
) -> DestinationVideoResponse:
    """
    Creates a new video entry with strict target destination jurisdiction validation.
    """
    dest = db.query(Destination).filter(Destination.id == payload.destination_id).first()
    if not dest:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Destination '{payload.destination_id}' not found.",
        )

    if not JurisdictionAuthorizer.can_manage_destination(db, context, payload.destination_id, target_state_id=dest.state_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Destination is outside your assigned jurisdiction.",
        )

    # Extract YouTube ID from video_url if provided and youtube_id is missing
    yt_id = payload.youtube_id
    if not yt_id and payload.video_url:
        yt_match = re.search(r"(?:youtu\.be/|youtube\.com/(?:embed/|v/|watch\?v=|shorts/)|&v=)([\w-]{11})", payload.video_url)
        if yt_match:
            yt_id = yt_match.group(1)
        else:
            yt_id = "dQw4w9WgXcQ"

    thumb = payload.thumbnail_url
    if not thumb and yt_id and yt_id != "dQw4w9WgXcQ":
        thumb = f"https://img.youtube.com/vi/{yt_id}/hqdefault.jpg"

    video = DestinationVideo(
        id=uuid.uuid4(),
        destination_id=payload.destination_id,
        title=payload.title,
        category=payload.category or "Orientation",
        description=payload.description or "",
        duration=payload.duration or "0:30",
        youtube_id=yt_id or "dQw4w9WgXcQ",
        video_url=payload.video_url or (f"https://www.youtube.com/watch?v={yt_id}" if yt_id else None),
        thumbnail_url=thumb,
        status=payload.status or "Published",
    )
    db.add(video)
    db.commit()
    db.refresh(video)
    return video


@router.get(
    "/videos/{video_id}",
    response_model=DestinationVideoResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Managed Video Details",
)
def get_managed_video(
    video_id: uuid.UUID,
    context: SecurityContext = Depends(require_manager),
    db: Session = Depends(get_db),
) -> DestinationVideoResponse:
    """
    Retrieves video details with jurisdictional authority verification.
    """
    video = db.query(DestinationVideo).filter(DestinationVideo.id == video_id).first()
    if not video:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Video not found.")
    dest = db.query(Destination).filter(Destination.id == video.destination_id).first()
    if not JurisdictionAuthorizer.can_manage_destination(db, context, video.destination_id, target_state_id=dest.state_id if dest else None):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied: Video is outside your jurisdiction.")
    return video


@router.put(
    "/videos/{video_id}",
    response_model=DestinationVideoResponse,
    status_code=status.HTTP_200_OK,
    summary="Update Managed Destination Video",
)
def update_managed_video(
    video_id: uuid.UUID,
    payload: DestinationVideoUpdate,
    context: SecurityContext = Depends(require_manager),
    db: Session = Depends(get_db),
) -> DestinationVideoResponse:
    """
    Updates video details with jurisdictional authority verification.
    """
    video = db.query(DestinationVideo).filter(DestinationVideo.id == video_id).first()
    if not video:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Video not found.")
    dest = db.query(Destination).filter(Destination.id == video.destination_id).first()
    if not JurisdictionAuthorizer.can_manage_destination(db, context, video.destination_id, target_state_id=dest.state_id if dest else None):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied: Video is outside your jurisdiction.")

    if payload.title is not None:
        video.title = payload.title
    if payload.category is not None:
        video.category = payload.category
    if payload.description is not None:
        video.description = payload.description
    if payload.duration is not None:
        video.duration = payload.duration
    if payload.video_url is not None:
        video.video_url = payload.video_url
        yt_match = re.search(r"(?:youtu\.be/|youtube\.com/(?:embed/|v/|watch\?v=|shorts/)|&v=)([\w-]{11})", payload.video_url)
        if yt_match:
            video.youtube_id = yt_match.group(1)
            if not payload.thumbnail_url:
                video.thumbnail_url = f"https://img.youtube.com/vi/{video.youtube_id}/hqdefault.jpg"
    if payload.youtube_id is not None:
        video.youtube_id = payload.youtube_id
    if payload.thumbnail_url is not None:
        video.thumbnail_url = payload.thumbnail_url
    if payload.status is not None:
        video.status = payload.status

    db.commit()
    db.refresh(video)
    return video


@router.delete(
    "/videos/{video_id}",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Delete Managed Destination Video",
)
def delete_managed_video(
    video_id: uuid.UUID,
    context: SecurityContext = Depends(require_manager),
    db: Session = Depends(get_db),
) -> MessageResponse:
    """
    Deletes video entry with jurisdictional boundary verification.
    """
    video = db.query(DestinationVideo).filter(DestinationVideo.id == video_id).first()
    if not video:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Video not found.")
    dest = db.query(Destination).filter(Destination.id == video.destination_id).first()
    if not JurisdictionAuthorizer.can_manage_destination(db, context, video.destination_id, target_state_id=dest.state_id if dest else None):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied: Video is outside your jurisdiction.")

    title = video.title
    db.delete(video)
    db.commit()
    return MessageResponse(message=f"Video '{title}' deleted successfully.")
