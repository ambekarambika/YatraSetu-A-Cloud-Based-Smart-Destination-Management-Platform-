"""
YatraSetu Platform — Central Database Model Registry
Exports all models to ensure Alembic and SQLAlchemy register metadata completely.
"""

from app.database import Base

# 1. Identity & Governance
from app.models.identity import (
    Role,
    User,
    UserRefreshToken,
    ManagerAssignment,
)

# 2. Destination Ecosystem
from app.models.destination import (
    State,
    Destination,
    Attraction,
    Experience,
    Event,
    CuratedCircuit,
    CuratedCircuitItem,
    DestinationVideo,
    DestinationAdvisory,
    TravelStory,
)

# 3. Stakeholder Ecosystem
from app.models.stakeholder import (
    StakeholderService,
    StakeholderMedia,
    StakeholderPost,
    StakeholderMessage,
    StakeholderReview,
)

# 4. Tourist Functionality
from app.models.tourist import (
    TripPlan,
    TripPlanItem,
    UserFavorite,
    DestinationReview,
)

# 5. Platform Governance & Analytics
from app.models.governance import (
    VisitorStatistic,
    AuditLog,
    StorageObjectRegistry,
    MediaDeletionOutbox,
)

__all__ = [
    "Base",
    # Identity
    "Role",
    "User",
    "UserRefreshToken",
    "ManagerAssignment",
    # Destination
    "State",
    "Destination",
    "Attraction",
    "Experience",
    "Event",
    "CuratedCircuit",
    "CuratedCircuitItem",
    "DestinationVideo",
    "DestinationAdvisory",
    "TravelStory",
    # Stakeholder
    "StakeholderService",
    "StakeholderMedia",
    "StakeholderPost",
    "StakeholderMessage",
    "StakeholderReview",
    # Tourist
    "TripPlan",
    "TripPlanItem",
    "UserFavorite",
    "DestinationReview",
    # Governance
    "VisitorStatistic",
    "AuditLog",
    "StorageObjectRegistry",
    "MediaDeletionOutbox",
]
