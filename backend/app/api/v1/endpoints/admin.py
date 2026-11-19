"""
YatraSetu Platform — Administrator Governance Endpoints
Provides administrative control over platform statistics, user accounts,
manager jurisdiction assignments, controlled stakeholder destination reassignment,
business registration verification, and immutable audit trail telemetry.
All endpoints require the authoritative 'admin' platform role under RLS.
"""

import uuid
import math
from datetime import datetime
from typing import Optional, List, Dict, Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func, or_, text

from app.database import get_db
from app.core.auth import get_current_user_and_context, require_admin
from app.core.security import SecurityContext
from app.models.identity import User, Role, ManagerAssignment, UserRefreshToken
from app.models.destination import Destination, State
from app.models.stakeholder import StakeholderService
from app.models.governance import AuditLog
from app.schemas.admin import (
    AdminStatsResponse,
    AdminUserItem,
    AdminUserListResponse,
    UserStatusUpdate,
    AdminManagerItem,
    ManagerAssignRequest,
    StakeholderReassignRequest,
    StakeholderReassignResponse,
    AdminRegistrationItem,
    AdminRegistrationListResponse,
    RegistrationStatusUpdate,
    AuditLogItem,
    AuditLogListResponse,
)

router = APIRouter()


# -----------------------------------------------------------------------------
# 1. Platform Statistics & Telemetry
# -----------------------------------------------------------------------------

@router.get(
    "/stats",
    response_model=AdminStatsResponse,
    summary="Get Platform Statistics",
    description="Returns actual database-backed platform telemetry: users, active managers, pending registrations, and destinations.",
)
def get_platform_stats(
    db: Session = Depends(get_db),
    context: SecurityContext = Depends(require_admin),
) -> AdminStatsResponse:
    # Total accounts
    total_users = db.query(func.count(User.id)).scalar() or 0
    total_stakeholders = db.query(func.count(User.id)).filter(User.role_id == "stakeholder").scalar() or 0
    total_tourists = db.query(func.count(User.id)).filter(User.role_id == "tourist").scalar() or 0

    # Active managers with verified assignments
    active_managers = (
        db.query(func.count(User.id))
        .join(ManagerAssignment, User.id == ManagerAssignment.user_id)
        .filter(User.is_active == True, User.role_id == "manager")
        .scalar() or 0
    )

    # Pending stakeholder registrations
    pending_registrations = (
        db.query(func.count(StakeholderService.id))
        .filter(StakeholderService.verification_status == "pending")
        .scalar() or 0
    )

    # Active destinations
    active_destinations = db.query(func.count(Destination.id)).scalar() or 0

    return AdminStatsResponse(
        total_users=total_users,
        active_managers=active_managers,
        pending_registrations=pending_registrations,
        active_destinations=active_destinations,
        total_stakeholders=total_stakeholders,
        total_tourists=total_tourists,
    )


# -----------------------------------------------------------------------------
# 2. User Directory & Lifecycle Management
# -----------------------------------------------------------------------------

@router.get(
    "/users",
    response_model=AdminUserListResponse,
    summary="List Platform Users",
    description="Returns a paginated list of registered users with role, status, and search filters.",
)
def list_users(
    role: Optional[str] = Query(None, description="Filter by role ('admin', 'manager', 'stakeholder', 'tourist')"),
    status: Optional[str] = Query(None, description="Filter by status ('active', 'inactive', 'suspended')"),
    search: Optional[str] = Query(None, description="Search term matching email or full name"),
    page: int = Query(1, ge=1, description="Page index (1-based)"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
    context: SecurityContext = Depends(require_admin),
) -> AdminUserListResponse:
    query = db.query(User)

    if role:
        clean_role = role.strip().lower()
        query = query.filter(User.role_id == clean_role)

    if status:
        clean_status = status.strip().lower()
        if clean_status in ("active", "true"):
            query = query.filter(User.is_active == True)
        elif clean_status in ("inactive", "deactivated", "suspended", "false"):
            query = query.filter(User.is_active == False)

    if search:
        term = f"%{search.strip()}%"
        query = query.filter(or_(User.email.ilike(term), User.full_name.ilike(term)))

    total = query.count()
    total_pages = max(1, math.ceil(total / page_size)) if total > 0 else 1
    offset = (page - 1) * page_size
    users = query.order_by(User.created_at.desc()).offset(offset).limit(page_size).all()

    # Bulk load contextual relationships for returned users
    user_ids = [u.id for u in users]
    mgr_assignments = {}
    if user_ids:
        assignments = db.query(ManagerAssignment).filter(ManagerAssignment.user_id.in_(user_ids)).all()
        for a in assignments:
            mgr_assignments[a.user_id] = a

    sh_services = {}
    if user_ids:
        services = db.query(StakeholderService).filter(StakeholderService.user_id.in_(user_ids)).all()
        for s in services:
            sh_services[s.user_id] = s

    items = []
    for u in users:
        access_level = "Platform Administrator" if u.role_id == "admin" else (
            "Registered Business" if u.role_id == "stakeholder" else (
                "Tourist Explorer" if u.role_id == "tourist" else "Destination Manager"
            )
        )
        jurisdiction = "All Jurisdictions (Global)" if u.role_id == "admin" else "None"
        state_id = None
        destination_id = None
        business_name = None
        verification_status = None

        if u.role_id == "manager" and u.id in mgr_assignments:
            assign = mgr_assignments[u.id]
            state_id = assign.state_id
            destination_id = assign.destination_id
            if assign.destination_id:
                access_level = "Destination Manager"
                jurisdiction = f"Destination: {assign.destination_id} ({assign.state_id})"
            else:
                access_level = "State Manager"
                jurisdiction = f"State: {assign.state_id} (All Destinations)"

        elif u.role_id == "stakeholder" and u.id in sh_services:
            srv = sh_services[u.id]
            state_id = srv.state_id
            destination_id = srv.destination_id
            business_name = srv.business_name
            verification_status = srv.verification_status
            jurisdiction = f"{srv.destination_id} ({srv.state_id})"

        items.append(
            AdminUserItem(
                id=u.id,
                email=u.email,
                role=u.role_id,
                full_name=u.full_name,
                phone_number=u.phone_number,
                is_active=u.is_active,
                is_verified=u.is_verified,
                created_at=u.created_at,
                updated_at=u.updated_at,
                access_level=access_level,
                jurisdiction=jurisdiction,
                state_id=state_id,
                destination_id=destination_id,
                business_name=business_name,
                verification_status=verification_status,
            )
        )

    return AdminUserListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.put(
    "/users/{user_id}/status",
    response_model=AdminUserItem,
    summary="Update User Account Status",
    description="Activates, deactivates, or suspends a platform user account with mandatory audit trail.",
)
def update_user_status(
    user_id: uuid.UUID,
    payload: UserStatusUpdate,
    db: Session = Depends(get_db),
    context: SecurityContext = Depends(require_admin),
) -> AdminUserItem:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User account not found.")

    # Guard: prevent admin from disabling their own account
    if user.id == context.user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="PROTECTED ACTION: Administrators cannot deactivate or suspend their own account.",
        )

    old_active = user.is_active
    new_active = True if payload.status == "active" else False

    user.is_active = new_active
    user.updated_at = func.now()

    # If deactivating, revoke all active refresh tokens immediately
    if not new_active:
        db.query(UserRefreshToken).filter(UserRefreshToken.user_id == user.id).update(
            {"is_revoked": True, "revoked_at": func.now()}
        )

    # Create immutable audit log within the same transaction
    audit_entry = AuditLog(
        table_name="users",
        record_id=user.id,
        action="USER_STATUS_CHANGE",
        changed_by=context.user_id,
        old_values={"is_active": old_active, "status": "active" if old_active else "inactive"},
        new_values={"is_active": new_active, "status": payload.status, "reason": payload.reason},
    )
    db.add(audit_entry)

    db.flush()

    res = AdminUserItem(
        id=user.id,
        email=user.email,
        role=user.role_id,
        full_name=user.full_name,
        phone_number=user.phone_number,
        is_active=user.is_active,
        is_verified=user.is_verified,
        created_at=user.created_at,
        updated_at=user.updated_at,
        access_level="User",
        jurisdiction="None",
    )

    db.commit()
    return res


@router.delete(
    "/users/{user_id}",
    summary="Controlled Soft Deletion / Deactivation",
    description="Safely deactivates and revokes a user account without breaking foreign-key relationships.",
)
def delete_user(
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
    context: SecurityContext = Depends(require_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User account not found.")

    if user.id == context.user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="PROTECTED ACTION: Administrators cannot delete their own account.",
        )

    old_active = user.is_active
    user_email = user.email
    user.is_active = False
    user.updated_at = func.now()

    # Revoke tokens
    db.query(UserRefreshToken).filter(UserRefreshToken.user_id == user.id).update(
        {"is_revoked": True, "revoked_at": func.now()}
    )

    # Write audit log
    audit_entry = AuditLog(
        table_name="users",
        record_id=user.id,
        action="USER_ACCOUNT_DELETED",
        changed_by=context.user_id,
        old_values={"is_active": old_active, "email": user_email},
        new_values={"is_active": False, "status": "deleted_soft"},
    )
    db.add(audit_entry)

    db.commit()
    return {
        "success": True,
        "message": f"User account '{user_email}' safely soft-deactivated and all sessions revoked to preserve audit history.",
    }


# -----------------------------------------------------------------------------
# 3. Manager Authority & Jurisdiction Scoping
# -----------------------------------------------------------------------------

@router.get(
    "/managers",
    response_model=List[AdminManagerItem],
    summary="List Manager Jurisdictions",
    description="Returns all Destination and State Manager accounts with their active jurisdiction assignments.",
)
def list_managers(
    db: Session = Depends(get_db),
    context: SecurityContext = Depends(require_admin),
) -> List[AdminManagerItem]:
    managers = (
        db.query(User)
        .filter(User.role_id == "manager")
        .order_by(User.full_name.asc())
        .all()
    )

    user_ids = [m.id for m in managers]
    assignments = {}
    if user_ids:
        mgr_records = db.query(ManagerAssignment).filter(ManagerAssignment.user_id.in_(user_ids)).all()
        for rec in mgr_records:
            assignments[rec.user_id] = rec

    # Pre-load destination and state names
    states_dict = {s.id: s.name for s in db.query(State).all()}
    dest_dict = {d.id: d.name for d in db.query(Destination).all()}

    items = []
    for m in managers:
        assign = assignments.get(m.id)
        if assign:
            access_level = "State Manager" if assign.destination_id is None else "Destination Manager"
            items.append(
                AdminManagerItem(
                    user_id=m.id,
                    full_name=m.full_name,
                    email=m.email,
                    is_active=m.is_active,
                    assignment_id=assign.id,
                    state_id=assign.state_id,
                    state_name=states_dict.get(assign.state_id, assign.state_id),
                    destination_id=assign.destination_id,
                    destination_name=dest_dict.get(assign.destination_id, assign.destination_id) if assign.destination_id else None,
                    access_level=access_level,
                    assigned_at=assign.assigned_at,
                )
            )
        else:
            items.append(
                AdminManagerItem(
                    user_id=m.id,
                    full_name=m.full_name,
                    email=m.email,
                    is_active=m.is_active,
                    assignment_id=None,
                    state_id=None,
                    state_name=None,
                    destination_id=None,
                    destination_name=None,
                    access_level="Unassigned Manager",
                    assigned_at=None,
                )
            )

    return items


@router.post(
    "/managers/assign",
    response_model=AdminManagerItem,
    summary="Assign or Reassign Manager Jurisdiction",
    description="Assigns or updates a manager's territorial scope (State Manager or Destination Manager).",
)
def assign_manager_jurisdiction(
    payload: ManagerAssignRequest,
    db: Session = Depends(get_db),
    context: SecurityContext = Depends(require_admin),
) -> AdminManagerItem:
    # Validate target user
    manager = db.query(User).filter(User.id == payload.user_id).first()
    if not manager:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User account not found.")
    if manager.role_id != "manager":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Target user does not have the 'manager' role.")

    # Validate state
    state = db.query(State).filter(State.id == payload.state_id).first()
    if not state:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"State '{payload.state_id}' not found.")

    # Validate destination if provided
    destination = None
    if payload.destination_id:
        destination = db.query(Destination).filter(Destination.id == payload.destination_id).first()
        if not destination:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Destination '{payload.destination_id}' not found.")
        if destination.state_id != payload.state_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Destination '{payload.destination_id}' does not belong to state '{payload.state_id}'.",
            )

    # Check for existing assignment
    assignment = db.query(ManagerAssignment).filter(ManagerAssignment.user_id == manager.id).first()
    old_state = assignment.state_id if assignment else None
    old_dest = assignment.destination_id if assignment else None

    if assignment:
        assignment.state_id = payload.state_id
        assignment.destination_id = payload.destination_id
        assignment.assigned_at = func.now()
        action_name = "MANAGER_JURISDICTION_REASSIGNED"
    else:
        assignment = ManagerAssignment(
            user_id=manager.id,
            role_id="manager",
            state_id=payload.state_id,
            destination_id=payload.destination_id,
        )
        db.add(assignment)
        action_name = "MANAGER_JURISDICTION_ASSIGNED"

    db.flush()

    # Record audit log
    audit_entry = AuditLog(
        table_name="manager_assignments",
        record_id=assignment.id,
        action=action_name,
        changed_by=context.user_id,
        old_values={"state_id": old_state, "destination_id": old_dest},
        new_values={
            "state_id": payload.state_id,
            "destination_id": payload.destination_id,
            "reason": payload.reason,
        },
    )
    db.add(audit_entry)

    access_level = "State Manager" if payload.destination_id is None else "Destination Manager"
    res = AdminManagerItem(
        user_id=manager.id,
        full_name=manager.full_name,
        email=manager.email,
        is_active=manager.is_active,
        assignment_id=assignment.id,
        state_id=payload.state_id,
        state_name=state.name,
        destination_id=payload.destination_id,
        destination_name=destination.name if destination else None,
        access_level=access_level,
        assigned_at=datetime.now(),
    )

    db.commit()
    return res


# -----------------------------------------------------------------------------
# 4. Controlled Stakeholder Destination Reassignment
# -----------------------------------------------------------------------------

@router.post(
    "/stakeholders/{service_id}/reassign-destination",
    response_model=StakeholderReassignResponse,
    summary="Controlled Stakeholder Destination Reassignment",
    description="Reassigns a verified business to a new destination with mandatory administrative reason and audit logging.",
)
def reassign_stakeholder_destination(
    service_id: uuid.UUID,
    payload: StakeholderReassignRequest,
    db: Session = Depends(get_db),
    context: SecurityContext = Depends(require_admin),
) -> StakeholderReassignResponse:
    # 1. Fetch stakeholder service
    service = db.query(StakeholderService).filter(StakeholderService.id == service_id).first()
    if not service:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Stakeholder service record not found.")

    # 2. Fetch destination
    dest = db.query(Destination).filter(Destination.id == payload.new_destination_id).first()
    if not dest:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Target destination '{payload.new_destination_id}' not found in catalog.",
        )

    # 3. State integrity validation
    if payload.new_state_id and payload.new_state_id != dest.state_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Destination '{dest.id}' belongs to state '{dest.state_id}', not '{payload.new_state_id}'.",
        )

    # 4. Check uniqueness constraint
    existing = (
        db.query(StakeholderService)
        .filter(
            StakeholderService.destination_id == dest.id,
            StakeholderService.business_name == service.business_name,
            StakeholderService.id != service.id,
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"A service with business name '{service.business_name}' already exists in destination '{dest.id}'.",
        )

    old_destination = service.destination_id
    old_state = service.state_id

    # 5. Apply reassignment
    service.destination_id = dest.id
    service.state_id = dest.state_id
    service.updated_at = func.now()

    # 6. Immutable audit log entry
    audit_entry = AuditLog(
        table_name="stakeholder_services",
        record_id=service.id,
        action="CONTROLLED_DESTINATION_REASSIGNMENT",
        changed_by=context.user_id,
        old_values={"destination_id": old_destination, "state_id": old_state},
        new_values={
            "destination_id": dest.id,
            "state_id": dest.state_id,
            "reason": payload.reason,
        },
    )
    db.add(audit_entry)
    db.flush()

    res = StakeholderReassignResponse(
        service_id=service.id,
        user_id=service.user_id,
        business_name=service.business_name,
        old_destination_id=old_destination,
        new_destination_id=dest.id,
        state_id=dest.state_id,
        reassigned_at=datetime.now(),
        audit_log_id=audit_entry.id,
    )

    db.commit()
    return res


# -----------------------------------------------------------------------------
# 5. Stakeholder Business Registrations Governance
# -----------------------------------------------------------------------------

@router.get(
    "/registrations",
    response_model=AdminRegistrationListResponse,
    summary="List Stakeholder Business Registrations",
    description="Returns submitted business registrations with verification status and destination filters.",
)
def list_registrations(
    status: Optional[str] = Query(None, description="Filter ('pending', 'verified', 'rejected', 'suspended')"),
    destination_id: Optional[str] = Query(None, description="Filter by destination ID"),
    state_id: Optional[str] = Query(None, description="Filter by state ID"),
    search: Optional[str] = Query(None, description="Search matching business name"),
    page: int = Query(1, ge=1, description="Page index"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
    context: SecurityContext = Depends(require_admin),
) -> AdminRegistrationListResponse:
    query = db.query(StakeholderService)

    if status:
        query = query.filter(StakeholderService.verification_status == status.strip().lower())
    if destination_id:
        query = query.filter(StakeholderService.destination_id == destination_id.strip())
    if state_id:
        query = query.filter(StakeholderService.state_id == state_id.strip())
    if search:
        query = query.filter(StakeholderService.business_name.ilike(f"%{search.strip()}%"))

    total = query.count()
    total_pages = max(1, math.ceil(total / page_size)) if total > 0 else 1
    offset = (page - 1) * page_size
    services = query.order_by(StakeholderService.created_at.desc()).offset(offset).limit(page_size).all()

    # Preload user, destination, and state context
    user_ids = [s.user_id for s in services]
    users_dict = {u.id: u for u in db.query(User).filter(User.id.in_(user_ids)).all()} if user_ids else {}
    dest_dict = {d.id: d.name for d in db.query(Destination).all()}
    state_dict = {s.id: s.name for s in db.query(State).all()}

    items = []
    for s in services:
        u = users_dict.get(s.user_id)
        items.append(
            AdminRegistrationItem(
                service_id=s.id,
                user_id=s.user_id,
                business_name=s.business_name,
                category=s.category,
                license_number=s.license_number,
                destination_id=s.destination_id,
                destination_name=dest_dict.get(s.destination_id, s.destination_id),
                state_id=s.state_id,
                state_name=state_dict.get(s.state_id, s.state_id),
                verification_status=s.verification_status,
                applicant_name=u.full_name if u else None,
                applicant_email=u.email if u else None,
                created_at=s.created_at,
                updated_at=s.updated_at,
                contact_info=s.contact_info or {},
            )
        )

    return AdminRegistrationListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.put(
    "/registrations/{service_id}/status",
    response_model=AdminRegistrationItem,
    summary="Update Stakeholder Verification Status",
    description="Updates verification status of a business registration ('verified', 'rejected', 'suspended', 'pending').",
)
def update_registration_status(
    service_id: uuid.UUID,
    payload: RegistrationStatusUpdate,
    db: Session = Depends(get_db),
    context: SecurityContext = Depends(require_admin),
) -> AdminRegistrationItem:
    service = db.query(StakeholderService).filter(StakeholderService.id == service_id).first()
    if not service:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Stakeholder service record not found.")

    old_status = service.verification_status
    service.verification_status = payload.status
    service.updated_at = func.now()

    # Record audit log
    audit_entry = AuditLog(
        table_name="stakeholder_services",
        record_id=service.id,
        action="STAKEHOLDER_VERIFICATION_STATUS_CHANGED",
        changed_by=context.user_id,
        old_values={"verification_status": old_status},
        new_values={"verification_status": payload.status, "reason": payload.reason},
    )
    db.add(audit_entry)
    db.flush()

    user = db.query(User).filter(User.id == service.user_id).first()
    dest = db.query(Destination).filter(Destination.id == service.destination_id).first()
    state = db.query(State).filter(State.id == service.state_id).first()

    res = AdminRegistrationItem(
        service_id=service.id,
        user_id=service.user_id,
        business_name=service.business_name,
        category=service.category,
        license_number=service.license_number,
        destination_id=service.destination_id,
        destination_name=dest.name if dest else service.destination_id,
        state_id=service.state_id,
        state_name=state.name if state else service.state_id,
        verification_status=service.verification_status,
        applicant_name=user.full_name if user else None,
        applicant_email=user.email if user else None,
        created_at=service.created_at,
        updated_at=service.updated_at,
        contact_info=service.contact_info or {},
    )

    db.commit()
    return res


# -----------------------------------------------------------------------------
# 6. Audit Trail Telemetry
# -----------------------------------------------------------------------------

@router.get(
    "/audit-logs",
    response_model=AuditLogListResponse,
    summary="Get Platform Audit Trail",
    description="Returns paginated platform security and administrative audit logs from the audit_logs table.",
)
def get_audit_logs(
    action: Optional[str] = Query(None, description="Filter by audit action name"),
    table_name: Optional[str] = Query(None, description="Filter by target table name"),
    changed_by: Optional[uuid.UUID] = Query(None, description="Filter by actor user UUID"),
    page: int = Query(1, ge=1, description="Page index"),
    page_size: int = Query(25, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
    context: SecurityContext = Depends(require_admin),
) -> AuditLogListResponse:
    query = db.query(AuditLog)

    if action:
        query = query.filter(AuditLog.action == action.strip())
    if table_name:
        query = query.filter(AuditLog.table_name == table_name.strip())
    if changed_by:
        query = query.filter(AuditLog.changed_by == changed_by)

    total = query.count()
    total_pages = max(1, math.ceil(total / page_size)) if total > 0 else 1
    offset = (page - 1) * page_size
    entries = query.order_by(AuditLog.created_at.desc()).offset(offset).limit(page_size).all()

    # Preload actors
    actor_ids = [e.changed_by for e in entries if e.changed_by]
    actors = {u.id: u for u in db.query(User).filter(User.id.in_(actor_ids)).all()} if actor_ids else {}

    items = []
    for e in entries:
        actor = actors.get(e.changed_by)
        items.append(
            AuditLogItem(
                id=e.id,
                table_name=e.table_name,
                record_id=e.record_id,
                action=e.action,
                changed_by=e.changed_by,
                actor_name=actor.full_name if actor else None,
                actor_email=actor.email if actor else None,
                old_values=e.old_values,
                new_values=e.new_values,
                created_at=e.created_at,
            )
        )

    return AuditLogListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


# -----------------------------------------------------------------------------
# 7. Roles & Permissions Query
# -----------------------------------------------------------------------------

@router.get(
    "/roles",
    summary="List Platform Roles",
    description="Returns available platform roles and permission descriptions.",
)
def list_roles(
    db: Session = Depends(get_db),
    context: SecurityContext = Depends(require_admin),
):
    roles = db.query(Role).order_by(Role.id.asc()).all()
    return [
        {
            "id": r.id,
            "name": r.name,
            "description": r.description,
            "created_at": r.created_at,
        }
        for r in roles
    ]
