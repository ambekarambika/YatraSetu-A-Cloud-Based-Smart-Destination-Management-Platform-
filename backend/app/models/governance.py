"""
YatraSetu Platform — Governance & Analytics Models
Defines Visitor Statistics, Platform Audit Logs,
Storage Object Reference Registry, and Media Deletion Outbox.
"""

import uuid
from sqlalchemy import (
    Column,
    String,
    Integer,
    Numeric,
    Date,
    Text,
    DateTime,
    ForeignKey,
    UniqueConstraint,
    CheckConstraint,
    Uuid,
    JSON,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship

from app.database import Base


class VisitorStatistic(Base):
    """
    Daily footfall telemetry and carrying capacity utilization metrics per destination.
    Powers manager analytics dashboards and overtourism decision support.
    """
    __tablename__ = "visitor_statistics"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    destination_id = Column(String(64), ForeignKey("destinations.id", ondelete="RESTRICT"), nullable=False, index=True)
    record_date = Column(Date, nullable=False, index=True)
    visitor_count = Column(Integer, nullable=False, default=0)
    domestic_count = Column(Integer, nullable=False, default=0)
    international_count = Column(Integer, nullable=False, default=0)
    capacity_utilization_pct = Column(Numeric(5, 2), nullable=True)
    peak_hour_estimate = Column(String(32), nullable=True)

    __table_args__ = (
        UniqueConstraint("destination_id", "record_date", name="uq_dest_record_date"),
    )

    # Relationships
    destination = relationship("Destination", back_populates="visitor_statistics")

    def __repr__(self):
        return f"<VisitorStatistic(dest='{self.destination_id}', date='{self.record_date}', count={self.visitor_count})>"


class AuditLog(Base):
    """
    Append-only platform security log capturing administrative actions,
    account anonymization, role changes, and review moderations.
    """
    __tablename__ = "audit_logs"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    table_name = Column(String(64), nullable=False, index=True)
    record_id = Column(Uuid(as_uuid=True), nullable=False, index=True)
    action = Column(String(64), nullable=False, index=True)
    changed_by = Column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    old_values = Column(JSON().with_variant(JSONB, "postgresql"), nullable=True)
    new_values = Column(JSON().with_variant(JSONB, "postgresql"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)

    # Relationships
    actor = relationship("User")

    def __repr__(self):
        return f"<AuditLog(id='{self.id}', table='{self.table_name}', action='{self.action}', by='{self.changed_by}')>"


class StorageObjectRegistry(Base):
    """
    Tracks physical cloud object coordinates and reference counts.
    Ensures shared binary files are never deleted while referenced by active services.
    """
    __tablename__ = "storage_object_registry"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    storage_provider = Column(String(32), nullable=False)
    storage_bucket = Column(String(100), nullable=False)
    storage_key = Column(String(500), nullable=False)
    reference_count = Column(Integer, nullable=False, default=1)
    status = Column(String(32), nullable=False, default="active")
    authorization_token = Column(Uuid(as_uuid=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    __table_args__ = (
        CheckConstraint("storage_provider IN ('s3', 'gcs', 'azure', 'local')", name="chk_registry_storage_provider"),
        CheckConstraint("reference_count >= 0", name="chk_registry_ref_count"),
        CheckConstraint("status IN ('active', 'pending_deletion', 'deletion_authorized', 'deleted')", name="chk_registry_status"),
        UniqueConstraint("storage_provider", "storage_bucket", "storage_key", name="uq_registry_storage_object"),
    )

    def __repr__(self):
        return f"<StorageObjectRegistry(key='{self.storage_key}', refs={self.reference_count}, status='{self.status}')>"


class MediaDeletionOutbox(Base):
    """
    Transactional outbox for asynchronous cloud object storage deletion.
    Supports atomic leases, idempotency, retry tracking, and tokenized authorization.
    """
    __tablename__ = "media_deletion_outbox"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    source_media_id = Column(Uuid(as_uuid=True), ForeignKey("stakeholder_media.id", ondelete="SET NULL"), nullable=True, index=True)
    service_id = Column(Uuid(as_uuid=True), nullable=False)
    user_id = Column(Uuid(as_uuid=True), nullable=False)
    storage_provider = Column(String(32), nullable=True)
    storage_bucket = Column(String(100), nullable=True)
    storage_key = Column(String(500), nullable=True)
    media_url = Column(String(500), nullable=False)
    status = Column(String(32), nullable=False, default="pending")
    claimed_by = Column(String(64), nullable=True)
    claimed_at = Column(DateTime(timezone=True), nullable=True)
    lease_expires_at = Column(DateTime(timezone=True), nullable=True)
    authorization_token = Column(Uuid(as_uuid=True), nullable=True)
    retry_count = Column(Integer, nullable=False, default=0)
    max_retries = Column(Integer, nullable=False, default=5)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    processed_at = Column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        CheckConstraint(
            "status IN ('pending', 'processing', 'completed', 'failed', 'exhausted', 'unresolved', 'cancelled_shared_reference')",
            name="chk_outbox_status",
        ),
        CheckConstraint(
            "((storage_provider IS NULL AND storage_bucket IS NULL AND storage_key IS NULL) OR "
            "(storage_provider IS NOT NULL AND storage_bucket IS NOT NULL AND storage_key IS NOT NULL))",
            name="chk_outbox_coordinates_triad",
        ),
    )

    # Relationships
    source_media = relationship("StakeholderMedia")

    def __repr__(self):
        return f"<MediaDeletionOutbox(id='{self.id}', status='{self.status}', key='{self.storage_key}')>"
