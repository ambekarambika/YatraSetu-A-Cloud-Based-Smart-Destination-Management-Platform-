"""
YatraSetu Platform — Manager Jurisdiction & Scope Authorization Guard
Evaluates jurisdictional boundaries (Admin global, State Manager regional,
Destination Manager local) based on verified database assignments.
"""

from typing import Optional, List
import uuid
from sqlalchemy.orm import Session

from app.core.security import SecurityContext
from app.models.identity import ManagerAssignment


class JurisdictionScope:
    GLOBAL = "global"
    STATE = "state"
    DESTINATION = "destination"
    NONE = "none"


class JurisdictionAuthorizer:
    """
    Stateless evaluator for platform jurisdictional access control.
    Uses ManagerAssignment table as the authoritative source of truth.
    """

    @staticmethod
    def get_manager_assignment(session: Session, user_id: uuid.UUID) -> Optional[ManagerAssignment]:
        """
        Retrieves active ManagerAssignment record for a given user UUID.
        """
        return session.query(ManagerAssignment).filter(
            ManagerAssignment.user_id == user_id
        ).first()

    @classmethod
    def can_manage_destination(
        cls,
        session: Session,
        context: SecurityContext,
        target_destination_id: str,
        target_state_id: Optional[str] = None,
    ) -> bool:
        """
        Determines whether the actor has management authority over a target destination.
        
        Rules:
        1. admin: True (global management scope).
        2. manager:
           - If destination_id matches target_destination_id -> True.
           - If destination_id IS NULL (State Manager) and assignment.state_id matches
             target_destination.state_id -> True.
           - Otherwise -> False.
        3. tourist / stakeholder / other -> False.
        """
        if not context.is_active:
            return False

        if context.role == "admin":
            return True

        if context.role != "manager":
            return False

        # Query manager assignment from database source of truth
        assignment = cls.get_manager_assignment(session, context.user_id)
        if not assignment:
            return False

        # Destination Manager scope
        if assignment.destination_id is not None:
            return assignment.destination_id == target_destination_id

        # State Manager scope (destination_id is NULL)
        if target_state_id is not None:
            return assignment.state_id == target_state_id

        # If target_state_id is not provided, look up destination's state
        from app.models.destination import Destination
        dest = session.query(Destination).filter(Destination.id == target_destination_id).first()
        if not dest:
            return False

        return assignment.state_id == dest.state_id

    @classmethod
    def can_manage_state(
        cls,
        session: Session,
        context: SecurityContext,
        target_state_id: str,
    ) -> bool:
        """
        Determines whether the actor has management authority over a state jurisdiction.
        
        Rules:
        1. admin: True (global management scope).
        2. manager:
           - If assignment.destination_id IS NULL (State Manager) and assignment.state_id == target_state_id -> True.
           - Destination managers DO NOT have state-level management authority -> False.
        3. other -> False.
        """
        if not context.is_active:
            return False

        if context.role == "admin":
            return True

        if context.role != "manager":
            return False

        assignment = cls.get_manager_assignment(session, context.user_id)
        if not assignment:
            return False

        # Only State Managers (destination_id IS NULL) have state-wide management authority
        if assignment.destination_id is None:
            return assignment.state_id == target_state_id

        return False
