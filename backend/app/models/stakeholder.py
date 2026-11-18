"""
YatraSetu Platform — Stakeholder Ecosystem Models
Defines Stakeholder Services, Media, Posts, Direct Messages, and Service Reviews.
"""

import uuid
from sqlalchemy import (
    Column,
    String,
    Integer,
    BigInteger,
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


class StakeholderService(Base):
    """
    Authorized commercial businesses, tour guides, and local tourism operators.
    Bound to a specific state and destination, requiring administrative verification.
    """
    __tablename__ = "stakeholder_services"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(Uuid(as_uuid=True), nullable=False, unique=True)
    role_id = Column(String(32), nullable=False, default="stakeholder")
    destination_id = Column(String(64), nullable=False, index=True)
    state_id = Column(String(32), nullable=False, index=True)
    business_name = Column(String(180), nullable=False)
    category = Column(String(64), nullable=False)
    license_number = Column(String(100), nullable=True)
    verification_status = Column(String(32), nullable=False, default="pending")
    contact_info = Column(JSON().with_variant(JSONB, "postgresql"), default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    __table_args__ = (
        CheckConstraint("role_id = 'stakeholder'", name="chk_sh_role"),
        CheckConstraint("verification_status IN ('pending', 'verified', 'rejected', 'suspended')", name="chk_sh_verification_status"),
        ForeignKeyConstraint(["user_id", "role_id"], ["users.id", "users.role_id"], name="fk_sh_user_role", ondelete="RESTRICT"),
        ForeignKeyConstraint(["destination_id", "state_id"], ["destinations.id", "destinations.state_id"], name="fk_stakeholder_destination", ondelete="RESTRICT"),
        UniqueConstraint("destination_id", "business_name", name="uq_stakeholder_business"),
        UniqueConstraint("id", "destination_id", name="uq_stakeholder_service_dest"),
    )

    # Relationships
    user = relationship("User", back_populates="stakeholder_service")
    destination = relationship("Destination", back_populates="services")
    media = relationship("StakeholderMedia", back_populates="service", cascade="all, delete-orphan")
    posts = relationship("StakeholderPost", back_populates="service", cascade="all, delete-orphan")
    reviews = relationship("StakeholderReview", back_populates="service", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<StakeholderService(id='{self.id}', business='{self.business_name}', status='{self.verification_status}')>"


class StakeholderMedia(Base):
    """
    Photos and promotional video records uploaded by tourism stakeholders.
    Stores exact storage coordinates (provider, bucket, key) for lifecycle management.
    """
    __tablename__ = "stakeholder_media"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    service_id = Column(Uuid(as_uuid=True), ForeignKey("stakeholder_services.id", ondelete="CASCADE"), nullable=False, index=True)
    media_type = Column(String(20), nullable=False)
    title = Column(String(180), nullable=False)
    description = Column(Text, nullable=True)
    media_url = Column(String(500), nullable=False)
    thumbnail_url = Column(String(500), nullable=True)
    file_size_bytes = Column(BigInteger, nullable=True)
    storage_provider = Column(String(32), nullable=True)
    storage_bucket = Column(String(100), nullable=True)
    storage_key = Column(String(500), nullable=True)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    __table_args__ = (
        CheckConstraint("media_type IN ('photo', 'video')", name="chk_media_type"),
        CheckConstraint("file_size_bytes IS NULL OR (file_size_bytes > 0 AND file_size_bytes <= 52428800)", name="chk_media_file_size"),
        CheckConstraint("storage_provider IS NULL OR storage_provider IN ('s3', 'gcs', 'azure', 'local')", name="chk_media_storage_provider"),
        CheckConstraint(
            "((storage_provider IS NULL AND storage_bucket IS NULL AND storage_key IS NULL) OR "
            "(storage_provider IS NOT NULL AND storage_bucket IS NOT NULL AND storage_key IS NOT NULL))",
            name="chk_storage_coordinates_triad",
        ),
    )

    # Relationships
    service = relationship("StakeholderService", back_populates="media")

    def __repr__(self):
        return f"<StakeholderMedia(id='{self.id}', title='{self.title}', type='{self.media_type}')>"


class StakeholderPost(Base):
    """
    Announcements, operational updates, and suggestions published by stakeholders.
    """
    __tablename__ = "stakeholder_posts"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    service_id = Column(Uuid(as_uuid=True), ForeignKey("stakeholder_services.id", ondelete="CASCADE"), nullable=False, index=True)
    post_type = Column(String(32), nullable=False)
    title = Column(String(180), nullable=False)
    content = Column(Text, nullable=False)
    is_published = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    __table_args__ = (
        CheckConstraint("post_type IN ('announcement', 'update', 'suggestion')", name="chk_post_type"),
    )

    # Relationships
    service = relationship("StakeholderService", back_populates="posts")

    def __repr__(self):
        return f"<StakeholderPost(id='{self.id}', type='{self.post_type}', title='{self.title}')>"


class StakeholderMessage(Base):
    """
    Direct inquiries and communications between tourists/managers and stakeholders.
    """
    __tablename__ = "stakeholder_messages"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    sender_id = Column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    recipient_id = Column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    destination_id = Column(String(64), ForeignKey("destinations.id", ondelete="RESTRICT"), nullable=False, index=True)
    subject = Column(String(180), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    sender = relationship("User", foreign_keys=[sender_id])
    recipient = relationship("User", foreign_keys=[recipient_id])
    destination = relationship("Destination")

    def __repr__(self):
        return f"<StakeholderMessage(id='{self.id}', from='{self.sender_id}', to='{self.recipient_id}')>"


class StakeholderReview(Base):
    """
    Tourist reviews and ratings for verified stakeholder services.
    Supports administrative/managerial moderation workflows.
    """
    __tablename__ = "stakeholder_reviews"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    service_id = Column(Uuid(as_uuid=True), ForeignKey("stakeholder_services.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    rating = Column(Integer, nullable=False)
    comment = Column(Text, nullable=True)
    review_status = Column(String(32), nullable=False, default="pending_review")
    moderated_by = Column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    moderated_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    __table_args__ = (
        CheckConstraint("rating BETWEEN 1 AND 5", name="chk_sh_review_rating"),
        CheckConstraint("review_status IN ('pending_review', 'approved', 'rejected')", name="chk_sh_review_status"),
        UniqueConstraint("service_id", "user_id", name="uq_user_service_review"),
    )

    # Relationships
    service = relationship("StakeholderService", back_populates="reviews")
    user = relationship("User", foreign_keys=[user_id], back_populates="authored_stakeholder_reviews")
    moderator = relationship("User", foreign_keys=[moderated_by])

    def __repr__(self):
        return f"<StakeholderReview(id='{self.id}', service='{self.service_id}', rating={self.rating}, status='{self.review_status}')>"
