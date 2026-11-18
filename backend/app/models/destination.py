"""
YatraSetu Platform — Destination Ecosystem Models
Defines States, Destinations, Attractions, Experiences, Events,
Curated Circuits, Videos, Advisories, and Travel Stories.
"""

import uuid
from sqlalchemy import (
    Column,
    String,
    Integer,
    Numeric,
    Boolean,
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


class State(Base):
    """
    Regional jurisdiction and state context (e.g. Maharashtra, Kerala, Rajasthan).
    Powers the eight-state theme engine and high-level manager scopes.
    """
    __tablename__ = "states"

    id = Column(String(32), primary_key=True)
    name = Column(String(100), nullable=False)
    theme_code = Column(String(32), nullable=False)
    badge_label = Column(String(64), nullable=False)
    tagline = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    hero_image_url = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    destinations = relationship("Destination", back_populates="state", cascade="all, delete-orphan")
    circuits = relationship("CuratedCircuit", back_populates="state", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<State(id='{self.id}', name='{self.name}')>"


class Destination(Base):
    """
    Core tourism destination entity (e.g. Rajgad Fort, Munnar, Dal Lake).
    Central anchor for attractions, advisories, stakeholder services, and tourist plans.
    """
    __tablename__ = "destinations"

    id = Column(String(64), primary_key=True)
    state_id = Column(String(32), ForeignKey("states.id", ondelete="RESTRICT"), nullable=False, index=True)
    name = Column(String(150), nullable=False)
    category = Column(String(64), nullable=False)
    subtitle = Column(String(255), nullable=True)
    location_label = Column(String(150), nullable=True)
    description = Column(Text, nullable=False)
    hero_image_url = Column(String(500), nullable=True)
    banner_image = Column(String(500), nullable=True)
    ideal_duration = Column(String(64), nullable=True)
    best_time = Column(String(100), nullable=True)
    max_daily_capacity = Column(Integer, nullable=True)
    latitude = Column(Numeric(10, 7), nullable=True)
    longitude = Column(Numeric(10, 7), nullable=True)
    metadata_json = Column("metadata", JSON().with_variant(JSONB, "postgresql"), default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    __table_args__ = (
        UniqueConstraint("id", "state_id", name="uq_destinations_id_state"),
    )

    # Relationships
    state = relationship("State", back_populates="destinations")
    attractions = relationship("Attraction", back_populates="destination", cascade="all, delete-orphan")
    experiences = relationship("Experience", back_populates="destination", cascade="all, delete-orphan")
    events = relationship("Event", back_populates="destination", cascade="all, delete-orphan")
    videos = relationship("DestinationVideo", back_populates="destination", cascade="all, delete-orphan")
    advisories = relationship("DestinationAdvisory", back_populates="destination", cascade="all, delete-orphan")
    stories = relationship("TravelStory", back_populates="destination", cascade="all, delete-orphan")
    services = relationship("StakeholderService", back_populates="destination")
    reviews = relationship("DestinationReview", back_populates="destination", cascade="all, delete-orphan")
    visitor_statistics = relationship("VisitorStatistic", back_populates="destination", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Destination(id='{self.id}', name='{self.name}', state='{self.state_id}')>"


class Attraction(Base):
    """
    Points of interest, monuments, trails, and landmarks within a destination.
    """
    __tablename__ = "attractions"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    destination_id = Column(String(64), ForeignKey("destinations.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(180), nullable=False)
    category = Column(String(64), nullable=False)
    description = Column(Text, nullable=True)
    image_url = Column(String(500), nullable=True)
    rating = Column(Numeric(3, 2), nullable=False, default=0.0)
    status = Column(String(32), nullable=False, default="Open")
    operating_hours = Column(String(100), nullable=True)
    entry_fee_label = Column(String(64), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    destination = relationship("Destination", back_populates="attractions")

    def __repr__(self):
        return f"<Attraction(id='{self.id}', name='{self.name}', dest='{self.destination_id}')>"


class Experience(Base):
    """
    Curated tourist activities (treks, heritage walks, culinary journeys).
    """
    __tablename__ = "experiences"

    id = Column(String(64), primary_key=True)
    destination_id = Column(String(64), ForeignKey("destinations.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(180), nullable=False)
    category = Column(String(64), nullable=False)
    category_label = Column(String(100), nullable=True)
    location_label = Column(String(150), nullable=True)
    duration = Column(String(64), nullable=True)
    difficulty = Column(String(64), nullable=True)
    season = Column(String(64), nullable=True)
    guide_requirement = Column(String(100), nullable=True)
    image_url = Column(String(500), nullable=True)
    description = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    destination = relationship("Destination", back_populates="experiences")

    def __repr__(self):
        return f"<Experience(id='{self.id}', title='{self.title}')>"


class Event(Base):
    """
    Festivals, cultural celebrations, and destination events.
    """
    __tablename__ = "events"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    destination_id = Column(String(64), ForeignKey("destinations.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(180), nullable=False)
    date_num = Column(String(10), nullable=False)
    date_month = Column(String(10), nullable=False)
    location_label = Column(String(150), nullable=False)
    status = Column(String(32), nullable=False, default="Open")
    status_class = Column(String(32), nullable=False, default="active")
    image_url = Column(String(500), nullable=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    destination = relationship("Destination", back_populates="events")

    def __repr__(self):
        return f"<Event(id='{self.id}', title='{self.title}')>"


class CuratedCircuit(Base):
    """
    Multi-destination thematic tourism circuits within a state.
    """
    __tablename__ = "curated_circuits"

    id = Column(String(64), primary_key=True)
    state_id = Column(String(32), ForeignKey("states.id", ondelete="RESTRICT"), nullable=False, index=True)
    name = Column(String(180), nullable=False)
    description = Column(Text, nullable=False)
    duration_label = Column(String(64), nullable=True)
    hero_image_url = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    state = relationship("State", back_populates="circuits")
    items = relationship("CuratedCircuitItem", back_populates="circuit", cascade="all, delete-orphan", order_by="CuratedCircuitItem.day_number, CuratedCircuitItem.order_index")

    def __repr__(self):
        return f"<CuratedCircuit(id='{self.id}', name='{self.name}')>"


class CuratedCircuitItem(Base):
    """
    Individual destination stops within a curated circuit itinerary.
    """
    __tablename__ = "curated_circuit_items"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    circuit_id = Column(String(64), ForeignKey("curated_circuits.id", ondelete="CASCADE"), nullable=False, index=True)
    destination_id = Column(String(64), ForeignKey("destinations.id", ondelete="CASCADE"), nullable=False, index=True)
    day_number = Column(Integer, nullable=False)
    order_index = Column(Integer, nullable=False, default=1)
    notes = Column(Text, nullable=True)

    __table_args__ = (
        UniqueConstraint("circuit_id", "destination_id", "day_number", "order_index", name="uq_circuit_dest_slot"),
    )

    # Relationships
    circuit = relationship("CuratedCircuit", back_populates="items")
    destination = relationship("Destination")

    def __repr__(self):
        return f"<CuratedCircuitItem(circuit='{self.circuit_id}', dest='{self.destination_id}', day={self.day_number})>"


class DestinationVideo(Base):
    """
    Curated video guides and documentary clips for destinations.
    """
    __tablename__ = "destination_videos"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    destination_id = Column(String(64), ForeignKey("destinations.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(180), nullable=False)
    duration = Column(String(32), nullable=False)
    youtube_id = Column(String(64), nullable=False)
    thumbnail_url = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    destination = relationship("Destination", back_populates="videos")

    def __repr__(self):
        return f"<DestinationVideo(id='{self.id}', title='{self.title}')>"


class DestinationAdvisory(Base):
    """
    Official travel advisories, alerts, weather warnings, and notices.
    Issued by Destination Managers or Platform Administrators.
    """
    __tablename__ = "destination_advisories"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    destination_id = Column(String(64), ForeignKey("destinations.id", ondelete="CASCADE"), nullable=False, index=True)
    severity = Column(String(20), nullable=False)
    title = Column(String(180), nullable=False)
    description = Column(Text, nullable=False)
    valid_from = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    valid_until = Column(DateTime(timezone=True), nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    created_by = Column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    __table_args__ = (
        CheckConstraint("severity IN ('info', 'advisory', 'warning', 'critical')", name="chk_advisory_severity"),
    )

    # Relationships
    destination = relationship("Destination", back_populates="advisories")
    author = relationship("User")

    def __repr__(self):
        return f"<DestinationAdvisory(id='{self.id}', severity='{self.severity}', title='{self.title}')>"


class TravelStory(Base):
    """
    Editorial narratives, cultural accounts, and historical perspectives.
    """
    __tablename__ = "travel_stories"

    id = Column(String(64), primary_key=True)
    destination_id = Column(String(64), ForeignKey("destinations.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    author_name = Column(String(120), nullable=False)
    read_time = Column(String(32), nullable=False)
    category = Column(String(64), nullable=False)
    image_url = Column(String(500), nullable=True)
    excerpt = Column(Text, nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    destination = relationship("Destination", back_populates="stories")

    def __repr__(self):
        return f"<TravelStory(id='{self.id}', title='{self.title}')>"
