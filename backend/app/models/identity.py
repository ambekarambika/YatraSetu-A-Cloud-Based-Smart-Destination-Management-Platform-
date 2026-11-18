"""
YatraSetu Platform — Identity & Governance Models
Defines Roles, Users, Refresh Tokens, and Manager Jurisdictions.
"""

import uuid
from sqlalchemy import (
    Column,
    String,
    Boolean,
    Text,
    DateTime,
    ForeignKey,
    ForeignKeyConstraint,
    UniqueConstraint,
    CheckConstraint,
    Uuid,
    JSON,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship

from app.database import Base


class Role(Base):
    """
    Core platform role definitions (admin, manager, stakeholder, tourist).
    Single source of truth for role identities.
    """
    __tablename__ = "roles"

    id = Column(String(32), primary_key=True)
    name = Column(String(64), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    users = relationship("User", back_populates="role")

    def __repr__(self):
        return f"<Role(id='{self.id}', name='{self.name}')>"


class User(Base):
    """
    Authenticated platform accounts across all four workspaces.
    Stores core credentials, role assignment, and profile metadata.
    """
    __tablename__ = "users"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    role_id = Column(String(32), ForeignKey("roles.id", ondelete="RESTRICT"), nullable=False, index=True)
    email = Column(String(255), nullable=False, unique=True, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(150), nullable=False)
    phone_number = Column(String(32), nullable=True)
    avatar_url = Column(String(500), nullable=True)
    bio = Column(Text, nullable=True)
    preferences = Column(JSON().with_variant(JSONB, "postgresql"), nullable=False, default=dict)
    is_active = Column(Boolean, nullable=False, default=True)
    is_verified = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    __table_args__ = (
        UniqueConstraint("id", "role_id", name="uq_users_id_role"),
    )

    # Relationships
    role = relationship("Role", back_populates="users")
    refresh_tokens = relationship("UserRefreshToken", back_populates="user", cascade="all, delete-orphan")
    manager_assignment = relationship("ManagerAssignment", back_populates="user", uselist=False, cascade="all, delete-orphan")
    stakeholder_service = relationship("StakeholderService", back_populates="user", uselist=False)
    trip_plans = relationship("TripPlan", back_populates="user", cascade="all, delete-orphan")
    favorites = relationship("UserFavorite", back_populates="user", cascade="all, delete-orphan")
    authored_destination_reviews = relationship("DestinationReview", foreign_keys="DestinationReview.user_id", back_populates="user")
    authored_stakeholder_reviews = relationship("StakeholderReview", foreign_keys="StakeholderReview.user_id", back_populates="user")

    def __repr__(self):
        return f"<User(id='{self.id}', email='{self.email}', role='{self.role_id}')>"


class UserRefreshToken(Base):
    """
    Tracks long-lived JWT refresh tokens for secure session rotation and replay protection.
    """
    __tablename__ = "user_refresh_tokens"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    token_hash = Column(String(255), nullable=False, unique=True, index=True)
    family_id = Column(Uuid(as_uuid=True), nullable=False, index=True)
    is_revoked = Column(Boolean, nullable=False, default=False)
    revoked_at = Column(DateTime(timezone=True), nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="refresh_tokens")

    def __repr__(self):
        return f"<UserRefreshToken(id='{self.id}', user_id='{self.user_id}', is_revoked={self.is_revoked})>"


class ManagerAssignment(Base):
    """
    Enforces geographic jurisdiction for Destination and State Managers.
    State Managers: destination_id IS NULL (manages all destinations within state).
    Destination Managers: specific destination_id assigned.
    """
    __tablename__ = "manager_assignments"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(Uuid(as_uuid=True), nullable=False, unique=True)
    role_id = Column(String(32), nullable=False, default="manager")
    state_id = Column(String(32), ForeignKey("states.id", ondelete="RESTRICT"), nullable=False, index=True)
    destination_id = Column(String(64), nullable=True, index=True)
    assigned_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    __table_args__ = (
        CheckConstraint("role_id = 'manager'", name="chk_mgr_role"),
        ForeignKeyConstraint(["user_id", "role_id"], ["users.id", "users.role_id"], name="fk_mgr_user_role", ondelete="CASCADE"),
        ForeignKeyConstraint(["destination_id", "state_id"], ["destinations.id", "destinations.state_id"], name="fk_mgr_destination_state", ondelete="RESTRICT"),
        UniqueConstraint("user_id", "state_id", "destination_id", name="uq_mgr_scope"),
    )

    # Relationships
    user = relationship("User", back_populates="manager_assignment")
    state = relationship("State")
    destination = relationship("Destination", overlaps="state")

    def __repr__(self):
        scope = "STATE" if self.destination_id is None else f"DESTINATION:{self.destination_id}"
        return f"<ManagerAssignment(user_id='{self.user_id}', state_id='{self.state_id}', scope='{scope}')>"
