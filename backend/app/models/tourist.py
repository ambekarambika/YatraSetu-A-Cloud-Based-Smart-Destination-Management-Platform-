"""
YatraSetu Platform — Tourist Ecosystem Models
Defines Trip Plans, Itinerary Items, Saved Destinations (Favorites), and Destination Reviews.
"""

import uuid
from sqlalchemy import (
    Column,
    String,
    Integer,
    Date,
    Text,
    DateTime,
    ForeignKey,
    UniqueConstraint,
    CheckConstraint,
    Uuid,
    func,
)
from sqlalchemy.orm import relationship

from app.database import Base


class TripPlan(Base):
    """
    Tourist personal itineraries and customized travel plans.
    """
    __tablename__ = "trip_plans"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(180), nullable=False)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="trip_plans")
    items = relationship("TripPlanItem", back_populates="trip_plan", cascade="all, delete-orphan", order_by="TripPlanItem.day_number, TripPlanItem.order_index")

    def __repr__(self):
        return f"<TripPlan(id='{self.id}', title='{self.title}', user='{self.user_id}')>"


class TripPlanItem(Base):
    """
    Individual destination stops or attraction activities within a trip itinerary.
    """
    __tablename__ = "trip_plan_items"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    trip_plan_id = Column(Uuid(as_uuid=True), ForeignKey("trip_plans.id", ondelete="CASCADE"), nullable=False, index=True)
    destination_id = Column(String(64), ForeignKey("destinations.id", ondelete="RESTRICT"), nullable=False, index=True)
    attraction_id = Column(Uuid(as_uuid=True), ForeignKey("attractions.id", ondelete="SET NULL"), nullable=True)
    day_number = Column(Integer, nullable=False, default=1)
    order_index = Column(Integer, nullable=False, default=1)
    time_slot = Column(String(64), nullable=True)
    notes = Column(Text, nullable=True)

    # Relationships
    trip_plan = relationship("TripPlan", back_populates="items")
    destination = relationship("Destination")
    attraction = relationship("Attraction")

    def __repr__(self):
        return f"<TripPlanItem(plan='{self.trip_plan_id}', dest='{self.destination_id}', day={self.day_number})>"


class UserFavorite(Base):
    """
    Tourist bookmarks / saved destination wishlist items.
    """
    __tablename__ = "user_favorites"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    destination_id = Column(String(64), ForeignKey("destinations.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    __table_args__ = (
        UniqueConstraint("user_id", "destination_id", name="uq_user_fav_destination"),
    )

    # Relationships
    user = relationship("User", back_populates="favorites")
    destination = relationship("Destination")

    def __repr__(self):
        return f"<UserFavorite(user='{self.user_id}', dest='{self.destination_id}')>"


class DestinationReview(Base):
    """
    Public destination ratings and feedback submitted by authenticated or guest travelers.
    Supports administrative/managerial review moderation.
    """
    __tablename__ = "destination_reviews"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    destination_id = Column(String(64), ForeignKey("destinations.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    guest_author_name = Column(String(120), nullable=False, default="Guest Traveler")
    guest_hmac_identifier = Column(String(75), nullable=True)
    rate_limit_bucket = Column(String(64), nullable=True)
    rating = Column(Integer, nullable=False)
    category = Column(String(64), nullable=False, default="reviews")
    comment = Column(Text, nullable=False)
    review_status = Column(String(32), nullable=False, default="pending_review")
    moderated_by = Column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    moderated_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    __table_args__ = (
        CheckConstraint("rating BETWEEN 1 AND 5", name="chk_dest_review_rating"),
        CheckConstraint("review_status IN ('pending_review', 'approved', 'rejected', 'flagged')", name="chk_dest_review_status"),
        UniqueConstraint("destination_id", "user_id", name="uq_user_dest_review"),
    )

    # Relationships
    destination = relationship("Destination", back_populates="reviews")
    user = relationship("User", foreign_keys=[user_id], back_populates="authored_destination_reviews")
    moderator = relationship("User", foreign_keys=[moderated_by])

    def __repr__(self):
        return f"<DestinationReview(id='{self.id}', dest='{self.destination_id}', rating={self.rating}, status='{self.review_status}')>"
