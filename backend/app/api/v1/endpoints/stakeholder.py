"""
YatraSetu Platform — Tourism Stakeholder Workspace API Endpoints
Provides self-service business profile management, destination updates/advisories,
manager coordination suggestions, media listings, and service offerings.
"""

import uuid
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified

from app.database import get_db
from app.core.auth import require_stakeholder
from app.core.security import SecurityContext
from app.models.identity import User
from app.models.destination import Destination, State, DestinationAdvisory
from app.models.stakeholder import (
    StakeholderService,
    StakeholderMedia,
    StakeholderPost,
)
from app.schemas.stakeholder import (
    StakeholderProfileResponse,
    StakeholderProfileUpdate,
    StakeholderServiceRegisterRequest,
    StakeholderAdvisoryResponse,
    StakeholderSuggestionCreate,
    StakeholderSuggestionResponse,
    StakeholderMediaCreate,
    StakeholderMediaUpdate,
    StakeholderMediaResponse,
    ServiceOfferingCreate,
    ServiceOfferingResponse,
)
from app.schemas.auth import MessageResponse

router = APIRouter()


def _build_profile_response(user: User, service: Optional[StakeholderService], db: Session) -> StakeholderProfileResponse:
    """Helper to assemble the authoritative StakeholderProfileResponse."""
    dest_name = None
    state_name = None
    
    if service:
        if service.destination_id:
            dest_obj = db.query(Destination).filter(Destination.id == service.destination_id).first()
            if dest_obj:
                dest_name = dest_obj.name
        if service.state_id:
            state_obj = db.query(State).filter(State.id == service.state_id).first()
            if state_obj:
                state_name = state_obj.name
        
        info = service.contact_info or {}
        return StakeholderProfileResponse(
            user_id=user.id,
            email=user.email,
            full_name=user.full_name,
            role="stakeholder",
            phone_number=user.phone_number,
            service_id=service.id,
            business_name=service.business_name,
            category=service.category,
            license_number=service.license_number,
            destination_id=service.destination_id,
            destination_name=dest_name or service.destination_id,
            state_id=service.state_id,
            state_name=state_name or service.state_id,
            verification_status=service.verification_status,
            is_destination_locked=True,
            contact_person=info.get("contact_person", user.full_name),
            phone=info.get("phone", user.phone_number),
            address=info.get("address"),
            operating_hours=info.get("operating_hours"),
            price_range=info.get("price_range"),
            contact_info=info,
            created_at=service.created_at,
            updated_at=service.updated_at,
        )
    else:
        return StakeholderProfileResponse(
            user_id=user.id,
            email=user.email,
            full_name=user.full_name,
            role="stakeholder",
            phone_number=user.phone_number,
            service_id=None,
            business_name=None,
            category=None,
            license_number=None,
            destination_id=None,
            destination_name=None,
            state_id=None,
            state_name=None,
            verification_status="unregistered",
            is_destination_locked=False,
            contact_person=user.full_name,
            phone=user.phone_number,
            address=None,
            operating_hours=None,
            price_range=None,
            contact_info={},
            created_at=None,
            updated_at=None,
        )


# -----------------------------------------------------------------------------
# 1. Stakeholder Profile & Business Information
# -----------------------------------------------------------------------------

@router.get(
    "/profile",
    response_model=StakeholderProfileResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Stakeholder Business Profile",
    description="Returns verified business profile, operating destination, and verification status.",
)
def get_stakeholder_profile(
    context: SecurityContext = Depends(require_stakeholder),
    db: Session = Depends(get_db),
) -> StakeholderProfileResponse:
    user = db.query(User).filter(User.id == context.user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User account not found.")

    service = db.query(StakeholderService).filter(StakeholderService.user_id == context.user_id).first()
    return _build_profile_response(user, service, db)


@router.put(
    "/profile",
    response_model=StakeholderProfileResponse,
    status_code=status.HTTP_200_OK,
    summary="Update Stakeholder Business Profile",
    description="Updates commercial profile details. Enforces destination lock if already registered.",
)
def update_stakeholder_profile(
    payload: StakeholderProfileUpdate,
    context: SecurityContext = Depends(require_stakeholder),
    db: Session = Depends(get_db),
) -> StakeholderProfileResponse:
    user = db.query(User).filter(User.id == context.user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User account not found.")

    service = db.query(StakeholderService).filter(StakeholderService.user_id == context.user_id).first()

    # Initial registration case via profile update
    if not service:
        if not payload.destination_id or not payload.business_name or not payload.category:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Initial business registration requires destination_id, business_name, and category.",
            )
        
        dest = db.query(Destination).filter(Destination.id == payload.destination_id).first()
        if not dest:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Destination '{payload.destination_id}' does not exist.",
            )

        contact_data = payload.contact_info or {}
        if payload.contact_person:
            contact_data["contact_person"] = payload.contact_person
        if payload.phone:
            contact_data["phone"] = payload.phone
        if payload.address:
            contact_data["address"] = payload.address
        if payload.operating_hours:
            contact_data["operating_hours"] = payload.operating_hours
        if payload.price_range:
            contact_data["price_range"] = payload.price_range
        if "services" not in contact_data:
            contact_data["services"] = []

        new_service = StakeholderService(
            id=uuid.uuid4(),
            user_id=context.user_id,
            role_id="stakeholder",
            destination_id=dest.id,
            state_id=dest.state_id,
            business_name=payload.business_name.strip(),
            category=payload.category.strip(),
            license_number=payload.license_number.strip() if payload.license_number else None,
            verification_status="pending",
            contact_info=contact_data,
        )
        db.add(new_service)
        db.flush()
        response_data = _build_profile_response(user, new_service, db)
        db.commit()
        return response_data

    # Existing service update: Destination is strictly locked
    if payload.destination_id and payload.destination_id != service.destination_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Destination cannot be changed after registration. Controlled destination reassignment requires administrative authorization.",
        )

    if payload.business_name:
        service.business_name = payload.business_name.strip()
    if payload.category:
        service.category = payload.category.strip()
    if payload.license_number is not None:
        service.license_number = payload.license_number.strip() if payload.license_number else None

    # Merge contact info
    contact_data = dict(service.contact_info or {})
    if payload.contact_person is not None:
        contact_data["contact_person"] = payload.contact_person
    if payload.phone is not None:
        contact_data["phone"] = payload.phone
    if payload.address is not None:
        contact_data["address"] = payload.address
    if payload.operating_hours is not None:
        contact_data["operating_hours"] = payload.operating_hours
    if payload.price_range is not None:
        contact_data["price_range"] = payload.price_range
    if payload.contact_info:
        for k, v in payload.contact_info.items():
            if k != "services":  # preserve services array unless explicitly managed
                contact_data[k] = v

    service.contact_info = contact_data
    flag_modified(service, "contact_info")

    db.flush()
    response_data = _build_profile_response(user, service, db)
    db.commit()
    return response_data


@router.post(
    "/service",
    response_model=StakeholderProfileResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register Commercial Service",
    description="Registers an initial commercial tourism service bound to a destination with pending status.",
)
def register_stakeholder_service(
    payload: StakeholderServiceRegisterRequest,
    context: SecurityContext = Depends(require_stakeholder),
    db: Session = Depends(get_db),
) -> StakeholderProfileResponse:
    user = db.query(User).filter(User.id == context.user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User account not found.")

    existing_service = db.query(StakeholderService).filter(StakeholderService.user_id == context.user_id).first()
    if existing_service:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A commercial service is already registered for this account.",
        )

    dest = db.query(Destination).filter(Destination.id == payload.destination_id).first()
    if not dest:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Destination '{payload.destination_id}' does not exist.",
        )

    contact_data = {
        "contact_person": payload.contact_person or user.full_name,
        "phone": payload.phone or user.phone_number or "",
        "address": payload.address or "",
        "operating_hours": payload.operating_hours or "",
        "price_range": payload.price_range or "",
        "services": [],
    }

    new_service = StakeholderService(
        id=uuid.uuid4(),
        user_id=context.user_id,
        role_id="stakeholder",
        destination_id=dest.id,
        state_id=dest.state_id,
        business_name=payload.business_name.strip(),
        category=payload.category.strip(),
        license_number=payload.license_number.strip() if payload.license_number else None,
        verification_status="pending",
        contact_info=contact_data,
    )
    db.add(new_service)
    db.flush()
    response_data = _build_profile_response(user, new_service, db)
    db.commit()
    return response_data


# -----------------------------------------------------------------------------
# 2. Destination Advisories (Read-Only for Assigned Destination)
# -----------------------------------------------------------------------------

@router.get(
    "/destination-updates",
    response_model=List[StakeholderAdvisoryResponse],
    status_code=status.HTTP_200_OK,
    summary="Get Official Destination Advisories",
    description="Returns official travel advisories and alerts published by Destination Managers for the assigned destination.",
)
def get_destination_advisories(
    context: SecurityContext = Depends(require_stakeholder),
    db: Session = Depends(get_db),
) -> List[StakeholderAdvisoryResponse]:
    service = db.query(StakeholderService).filter(StakeholderService.user_id == context.user_id).first()
    if not service or not service.destination_id:
        return []

    advisories = (
        db.query(DestinationAdvisory)
        .filter(
            DestinationAdvisory.destination_id == service.destination_id,
            DestinationAdvisory.is_active == True,
        )
        .order_by(DestinationAdvisory.created_at.desc())
        .all()
    )
    return advisories


# -----------------------------------------------------------------------------
# 3. Manager Coordination & Suggestions
# -----------------------------------------------------------------------------

@router.get(
    "/suggestions",
    response_model=List[StakeholderSuggestionResponse],
    status_code=status.HTTP_200_OK,
    summary="List Submitted Suggestions",
    description="Returns operational notices and suggestions submitted by this stakeholder.",
)
def get_stakeholder_suggestions(
    context: SecurityContext = Depends(require_stakeholder),
    db: Session = Depends(get_db),
) -> List[StakeholderSuggestionResponse]:
    service = db.query(StakeholderService).filter(StakeholderService.user_id == context.user_id).first()
    if not service:
        return []

    suggestions = (
        db.query(StakeholderPost)
        .filter(
            StakeholderPost.service_id == service.id,
            StakeholderPost.post_type == "suggestion",
        )
        .order_by(StakeholderPost.created_at.desc())
        .all()
    )
    return suggestions


@router.post(
    "/suggestions",
    response_model=StakeholderSuggestionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit Suggestion to Destination Manager",
    description="Submits an operational notice or suggestion to the Destination Manager.",
)
def create_stakeholder_suggestion(
    payload: StakeholderSuggestionCreate,
    context: SecurityContext = Depends(require_stakeholder),
    db: Session = Depends(get_db),
) -> StakeholderSuggestionResponse:
    service = db.query(StakeholderService).filter(StakeholderService.user_id == context.user_id).first()
    if not service:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please complete your business registration before submitting suggestions.",
        )

    post = StakeholderPost(
        id=uuid.uuid4(),
        service_id=service.id,
        post_type="suggestion",
        title=payload.title.strip(),
        content=payload.content.strip(),
        is_published=True,
    )
    db.add(post)
    db.flush()
    res = StakeholderSuggestionResponse.model_validate(post)
    db.commit()
    return res


# -----------------------------------------------------------------------------
# 4. Stakeholder Media Gallery Management
# -----------------------------------------------------------------------------

@router.get(
    "/media",
    response_model=List[StakeholderMediaResponse],
    status_code=status.HTTP_200_OK,
    summary="List Stakeholder Media Gallery Items",
    description="Returns photos and promotional videos uploaded by the authenticated stakeholder.",
)
def get_stakeholder_media(
    context: SecurityContext = Depends(require_stakeholder),
    db: Session = Depends(get_db),
) -> List[StakeholderMediaResponse]:
    service = db.query(StakeholderService).filter(StakeholderService.user_id == context.user_id).first()
    if not service:
        return []

    media_items = (
        db.query(StakeholderMedia)
        .filter(StakeholderMedia.service_id == service.id)
        .order_by(StakeholderMedia.uploaded_at.desc())
        .all()
    )
    return media_items


@router.post(
    "/media",
    response_model=StakeholderMediaResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add Media Gallery Item",
    description="Adds a photo or promotional video record for the stakeholder's registered business.",
)
def create_stakeholder_media(
    payload: StakeholderMediaCreate,
    context: SecurityContext = Depends(require_stakeholder),
    db: Session = Depends(get_db),
) -> StakeholderMediaResponse:
    service = db.query(StakeholderService).filter(StakeholderService.user_id == context.user_id).first()
    if not service:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please complete your business registration before uploading media.",
        )

    media = StakeholderMedia(
        id=uuid.uuid4(),
        service_id=service.id,
        media_type=payload.media_type,
        title=payload.title.strip(),
        description=payload.description.strip() if payload.description else None,
        media_url=payload.media_url.strip(),
        thumbnail_url=payload.thumbnail_url.strip() if payload.thumbnail_url else None,
        file_size_bytes=payload.file_size_bytes,
    )
    db.add(media)
    db.flush()
    res = StakeholderMediaResponse.model_validate(media)
    db.commit()
    return res


@router.put(
    "/media/{media_id}",
    response_model=StakeholderMediaResponse,
    status_code=status.HTTP_200_OK,
    summary="Update Media Gallery Item",
    description="Updates title, description, or media URL for an owned media record.",
)
def update_stakeholder_media(
    media_id: uuid.UUID,
    payload: StakeholderMediaUpdate,
    context: SecurityContext = Depends(require_stakeholder),
    db: Session = Depends(get_db),
) -> StakeholderMediaResponse:
    service = db.query(StakeholderService).filter(StakeholderService.user_id == context.user_id).first()
    if not service:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service record not found.")

    media = (
        db.query(StakeholderMedia)
        .filter(StakeholderMedia.id == media_id, StakeholderMedia.service_id == service.id)
        .first()
    )
    if not media:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Media item not found or unauthorized.")

    if payload.title is not None:
        media.title = payload.title.strip()
    if payload.description is not None:
        media.description = payload.description.strip() if payload.description else None
    if payload.media_url is not None:
        media.media_url = payload.media_url.strip()
    if payload.thumbnail_url is not None:
        media.thumbnail_url = payload.thumbnail_url.strip() if payload.thumbnail_url else None

    db.flush()
    res = StakeholderMediaResponse.model_validate(media)
    db.commit()
    return res


@router.delete(
    "/media/{media_id}",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Delete Media Gallery Item",
    description="Deletes an owned media record.",
)
def delete_stakeholder_media(
    media_id: uuid.UUID,
    context: SecurityContext = Depends(require_stakeholder),
    db: Session = Depends(get_db),
) -> MessageResponse:
    service = db.query(StakeholderService).filter(StakeholderService.user_id == context.user_id).first()
    if not service:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service record not found.")

    media = (
        db.query(StakeholderMedia)
        .filter(StakeholderMedia.id == media_id, StakeholderMedia.service_id == service.id)
        .first()
    )
    if not media:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Media item not found or unauthorized.")

    db.delete(media)
    db.commit()
    return MessageResponse(message="Media item deleted successfully.", success=True)


# -----------------------------------------------------------------------------
# 5. Service Offerings (Catalog Listings) Management
# -----------------------------------------------------------------------------

@router.get(
    "/offerings",
    response_model=List[ServiceOfferingResponse],
    status_code=status.HTTP_200_OK,
    summary="List Service Offerings",
    description="Returns commercial service listings/offerings managed by this stakeholder.",
)
def get_service_offerings(
    context: SecurityContext = Depends(require_stakeholder),
    db: Session = Depends(get_db),
) -> List[ServiceOfferingResponse]:
    service = db.query(StakeholderService).filter(StakeholderService.user_id == context.user_id).first()
    if not service:
        return []

    info = service.contact_info or {}
    offerings_raw = info.get("services", [])
    return [ServiceOfferingResponse(**item) for item in offerings_raw if isinstance(item, dict) and "id" in item]


@router.post(
    "/offerings",
    response_model=ServiceOfferingResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add Service Offering",
    description="Adds a new commercial service offering to the business catalog.",
)
def create_service_offering(
    payload: ServiceOfferingCreate,
    context: SecurityContext = Depends(require_stakeholder),
    db: Session = Depends(get_db),
) -> ServiceOfferingResponse:
    service = db.query(StakeholderService).filter(StakeholderService.user_id == context.user_id).first()
    if not service:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please complete your business registration before adding service offerings.",
        )

    info = dict(service.contact_info or {})
    offerings = list(info.get("services", []))

    new_item = {
        "id": f"off-{uuid.uuid4().hex[:8]}",
        "title": payload.title.strip(),
        "category": payload.category.strip(),
        "price": payload.price.strip() if payload.price else None,
        "description": payload.description.strip() if payload.description else None,
    }
    offerings.append(new_item)
    info["services"] = offerings
    service.contact_info = info
    flag_modified(service, "contact_info")

    db.commit()
    return ServiceOfferingResponse(**new_item)


@router.delete(
    "/offerings/{offering_id}",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Delete Service Offering",
    description="Deletes a service offering from the business catalog.",
)
def delete_service_offering(
    offering_id: str,
    context: SecurityContext = Depends(require_stakeholder),
    db: Session = Depends(get_db),
) -> MessageResponse:
    service = db.query(StakeholderService).filter(StakeholderService.user_id == context.user_id).first()
    if not service:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service record not found.")

    info = dict(service.contact_info or {})
    offerings = list(info.get("services", []))
    initial_len = len(offerings)

    offerings = [item for item in offerings if isinstance(item, dict) and item.get("id") != offering_id]
    if len(offerings) == initial_len:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service offering not found.")

    info["services"] = offerings
    service.contact_info = info
    flag_modified(service, "contact_info")

    db.commit()
    return MessageResponse(message="Service offering removed successfully.", success=True)
