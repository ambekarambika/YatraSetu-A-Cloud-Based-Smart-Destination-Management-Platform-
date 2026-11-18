"""
YatraSetu Platform — Public Catalogue Read-Only Endpoints
Provides unauthenticated public browsing for:
1. States & Destinations
2. Attractions
3. Experiences
4. Tourism Events
5. Curated Circuits

Strictly read-only; no create/update/delete operations exposed.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, func

from app.database import get_db
from app.models.destination import (
    State,
    Destination,
    Attraction,
    Experience,
    Event,
    CuratedCircuit,
    CuratedCircuitItem,
)
from app.schemas.catalogue import (
    PaginatedResponse,
    StateSummaryResponse,
    DestinationSummaryResponse,
    DestinationDetailResponse,
    AttractionResponse,
    ExperienceResponse,
    EventResponse,
    CuratedCircuitResponse,
    CuratedCircuitItemResponse,
)

router = APIRouter()


# -----------------------------------------------------------------------------
# 1. States & Destinations
# -----------------------------------------------------------------------------

@router.get(
    "/states",
    response_model=List[StateSummaryResponse],
    status_code=status.HTTP_200_OK,
    summary="List Official Cultural States",
    description="Returns public reference catalog of official cultural states for navigation and filtering.",
)
def list_states(
    db: Session = Depends(get_db),
) -> List[StateSummaryResponse]:
    """Retrieve all official states ordered by name."""
    states = db.query(State).order_by(State.name.asc()).all()
    return states


@router.get(
    "/states/{state_id}",
    response_model=StateSummaryResponse,
    status_code=status.HTTP_200_OK,
    summary="Get State Details",
    description="Returns regional metadata and theme configurations for a specific state.",
)
def get_state(
    state_id: str,
    db: Session = Depends(get_db),
) -> StateSummaryResponse:
    """Retrieve state record by ID/slug."""
    state = db.query(State).filter(State.id == state_id.strip().lower()).first()
    if not state:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"State '{state_id}' not found.",
        )
    return state


@router.get(
    "/destinations",
    response_model=PaginatedResponse[DestinationSummaryResponse],
    status_code=status.HTTP_200_OK,
    summary="List Tourism Destinations",
    description="Returns paginated public destinations with optional filtering by state, category, or search term.",
)
def list_destinations(
    state_id: Optional[str] = Query(None, description="Filter by state identifier (e.g. 'maharashtra')"),
    category: Optional[str] = Query(None, description="Filter by category (e.g. 'Fort', 'Hill Station')"),
    search: Optional[str] = Query(None, min_length=1, max_length=100, description="Search term matching name or description"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
    db: Session = Depends(get_db),
) -> PaginatedResponse[DestinationSummaryResponse]:
    """Paginated destinations query with optional filtering."""
    query = db.query(Destination)

    if state_id:
        query = query.filter(Destination.state_id == state_id.strip().lower())

    if category:
        query = query.filter(func.lower(Destination.category) == category.strip().lower())

    if search:
        search_pattern = f"%{search.strip().lower()}%"
        query = query.filter(
            or_(
                func.lower(Destination.name).like(search_pattern),
                func.lower(Destination.description).like(search_pattern),
                func.lower(Destination.location_label).like(search_pattern),
            )
        )

    total = query.count()
    items = query.order_by(Destination.name.asc()).offset(offset).limit(limit).all()

    return PaginatedResponse(
        items=items,
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get(
    "/destinations/{destination_id}",
    response_model=DestinationDetailResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Destination Details",
    description="Returns comprehensive details for a specific destination including state context.",
)
def get_destination(
    destination_id: str,
    db: Session = Depends(get_db),
) -> DestinationDetailResponse:
    """Retrieve full destination details by ID/slug."""
    dest = db.query(Destination).filter(Destination.id == destination_id.strip().lower()).first()
    if not dest:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Destination '{destination_id}' not found.",
        )
    return dest


# -----------------------------------------------------------------------------
# 2. Attractions
# -----------------------------------------------------------------------------

@router.get(
    "/attractions",
    response_model=PaginatedResponse[AttractionResponse],
    status_code=status.HTTP_200_OK,
    summary="List Points of Interest & Attractions",
    description="Returns points of interest with optional destination and category filtering.",
)
def list_attractions(
    destination_id: Optional[str] = Query(None, description="Filter by destination ID"),
    category: Optional[str] = Query(None, description="Filter by attraction category"),
    limit: int = Query(50, ge=1, le=100, description="Items per page"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
    db: Session = Depends(get_db),
) -> PaginatedResponse[AttractionResponse]:
    """Retrieve attractions matching filters."""
    query = db.query(Attraction)

    if destination_id:
        query = query.filter(Attraction.destination_id == destination_id.strip().lower())

    if category:
        query = query.filter(func.lower(Attraction.category) == category.strip().lower())

    total = query.count()
    items = query.order_by(Attraction.name.asc()).offset(offset).limit(limit).all()

    return PaginatedResponse(
        items=items,
        total=total,
        limit=limit,
        offset=offset,
    )


# -----------------------------------------------------------------------------
# 3. Experiences
# -----------------------------------------------------------------------------

@router.get(
    "/experiences",
    response_model=PaginatedResponse[ExperienceResponse],
    status_code=status.HTTP_200_OK,
    summary="List Curated Tourism Experiences",
    description="Returns curated outdoor trails, treks, and cultural experiences.",
)
def list_experiences(
    destination_id: Optional[str] = Query(None, description="Filter by destination ID"),
    category: Optional[str] = Query(None, description="Filter by experience category"),
    difficulty: Optional[str] = Query(None, description="Filter by difficulty level"),
    limit: int = Query(50, ge=1, le=100, description="Items per page"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
    db: Session = Depends(get_db),
) -> PaginatedResponse[ExperienceResponse]:
    """Retrieve experiences matching filters."""
    query = db.query(Experience)

    if destination_id:
        query = query.filter(Experience.destination_id == destination_id.strip().lower())

    if category:
        query = query.filter(func.lower(Experience.category) == category.strip().lower())

    if difficulty:
        query = query.filter(func.lower(Experience.difficulty) == difficulty.strip().lower())

    total = query.count()
    items = query.order_by(Experience.title.asc()).offset(offset).limit(limit).all()

    return PaginatedResponse(
        items=items,
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get(
    "/experiences/{experience_id}",
    response_model=ExperienceResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Experience Details",
    description="Returns detailed information for a specific curated experience.",
)
def get_experience(
    experience_id: str,
    db: Session = Depends(get_db),
) -> ExperienceResponse:
    """Retrieve experience by ID."""
    exp = db.query(Experience).filter(Experience.id == experience_id.strip()).first()
    if not exp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Experience '{experience_id}' not found.",
        )
    return exp


# -----------------------------------------------------------------------------
# 4. Tourism Events
# -----------------------------------------------------------------------------

@router.get(
    "/events",
    response_model=PaginatedResponse[EventResponse],
    status_code=status.HTTP_200_OK,
    summary="List Destination Events & Festivals",
    description="Returns public calendar of scheduled cultural festivals and events.",
)
def list_events(
    destination_id: Optional[str] = Query(None, description="Filter by destination ID"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by event status (e.g. 'Open')"),
    limit: int = Query(50, ge=1, le=100, description="Items per page"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
    db: Session = Depends(get_db),
) -> PaginatedResponse[EventResponse]:
    """Retrieve destination events matching filters."""
    query = db.query(Event)

    if destination_id:
        query = query.filter(Event.destination_id == destination_id.strip().lower())

    if status_filter:
        query = query.filter(func.lower(Event.status) == status_filter.strip().lower())

    total = query.count()
    items = query.order_by(Event.title.asc()).offset(offset).limit(limit).all()

    return PaginatedResponse(
        items=items,
        total=total,
        limit=limit,
        offset=offset,
    )


# -----------------------------------------------------------------------------
# 5. Tourism Circuits
# -----------------------------------------------------------------------------

@router.get(
    "/circuits",
    response_model=PaginatedResponse[CuratedCircuitResponse],
    status_code=status.HTTP_200_OK,
    summary="List Thematic Tourism Circuits",
    description="Returns multi-day curated travel itineraries and regional routes.",
)
def list_circuits(
    state_id: Optional[str] = Query(None, description="Filter by state ID"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
    db: Session = Depends(get_db),
) -> PaginatedResponse[CuratedCircuitResponse]:
    """Retrieve multi-day travel circuits with destination stops."""
    query = db.query(CuratedCircuit)

    if state_id:
        query = query.filter(CuratedCircuit.state_id == state_id.strip().lower())

    total = query.count()
    circuits = query.order_by(CuratedCircuit.name.asc()).offset(offset).limit(limit).all()

    # Enrich circuit items with destination names
    enriched_circuits = []
    for c in circuits:
        c_items = []
        for item in c.items:
            c_items.append(
                CuratedCircuitItemResponse(
                    id=item.id,
                    circuit_id=item.circuit_id,
                    destination_id=item.destination_id,
                    day_number=item.day_number,
                    order_index=item.order_index,
                    notes=item.notes,
                    destination_name=item.destination.name if item.destination else item.destination_id,
                )
            )
        enriched_circuits.append(
            CuratedCircuitResponse(
                id=c.id,
                state_id=c.state_id,
                name=c.name,
                description=c.description,
                duration_label=c.duration_label,
                hero_image_url=c.hero_image_url,
                items=c_items,
            )
        )

    return PaginatedResponse(
        items=enriched_circuits,
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get(
    "/circuits/{circuit_id}",
    response_model=CuratedCircuitResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Circuit Itinerary Details",
    description="Returns detailed stops, day-by-day itineraries, and destination links for a specific circuit.",
)
def get_circuit(
    circuit_id: str,
    db: Session = Depends(get_db),
) -> CuratedCircuitResponse:
    """Retrieve a specific circuit with stops."""
    circuit = db.query(CuratedCircuit).filter(CuratedCircuit.id == circuit_id.strip()).first()
    if not circuit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Circuit '{circuit_id}' not found.",
        )

    c_items = []
    for item in circuit.items:
        c_items.append(
            CuratedCircuitItemResponse(
                id=item.id,
                circuit_id=item.circuit_id,
                destination_id=item.destination_id,
                day_number=item.day_number,
                order_index=item.order_index,
                notes=item.notes,
                destination_name=item.destination.name if item.destination else item.destination_id,
            )
        )

    return CuratedCircuitResponse(
        id=circuit.id,
        state_id=circuit.state_id,
        name=circuit.name,
        description=circuit.description,
        duration_label=circuit.duration_label,
        hero_image_url=circuit.hero_image_url,
        items=c_items,
    )
