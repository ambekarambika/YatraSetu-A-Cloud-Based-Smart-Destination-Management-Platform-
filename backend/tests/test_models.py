"""
YatraSetu Platform — Model Relationships & Constraints Tests
Verifies core entity creation, foreign key associations, cascades, and constraints.
"""

import uuid
from datetime import date, datetime, timezone
import pytest
from sqlalchemy.exc import IntegrityError

from app.models.identity import Role, User, UserRefreshToken, ManagerAssignment
from app.models.destination import State, Destination, Attraction, Experience, Event
from app.models.stakeholder import StakeholderService, StakeholderMedia
from app.models.tourist import TripPlan, TripPlanItem, UserFavorite, DestinationReview
from app.models.governance import VisitorStatistic, AuditLog, StorageObjectRegistry, MediaDeletionOutbox
from app.seeds import seed_reference_data


def test_seed_reference_data(db_session):
    """Verify that reference data seeds the 4 roles and 8 states idempotently."""
    result = seed_reference_data(db_session)
    assert result["success"] is True
    assert result["roles_created"] == 4
    assert result["states_created"] == 8

    # Verify query
    roles = db_session.query(Role).all()
    assert len(roles) == 4
    role_ids = {r.id for r in roles}
    assert role_ids == {"admin", "manager", "stakeholder", "tourist"}

    states = db_session.query(State).all()
    assert len(states) == 8
    state_ids = {s.id for s in states}
    assert "maharashtra" in state_ids
    assert "kerala" in state_ids


def test_user_creation_and_role_relationship(db_session):
    """Test creating a User and navigating its relationship to Role."""
    seed_reference_data(db_session)

    user = User(
        id=uuid.uuid4(),
        role_id="tourist",
        email="ananya.sharma@example.com",
        password_hash="argon2_or_bcrypt_hash_placeholder",
        full_name="Ananya Sharma",
        phone_number="+91 98765 43210",
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()

    retrieved = db_session.query(User).filter(User.email == "ananya.sharma@example.com").first()
    assert retrieved is not None
    assert retrieved.role.id == "tourist"
    assert retrieved.role.name == "Tourist & Traveler"
    assert retrieved.full_name == "Ananya Sharma"


def test_unique_user_email_constraint(db_session):
    """Verify that duplicate user emails violate the unique constraint."""
    seed_reference_data(db_session)

    user1 = User(
        id=uuid.uuid4(),
        role_id="tourist",
        email="duplicate@gmail.com",
        password_hash="hash1",
        full_name="User One",
    )
    user2 = User(
        id=uuid.uuid4(),
        role_id="tourist",
        email="duplicate@gmail.com",
        password_hash="hash2",
        full_name="User Two",
    )
    db_session.add(user1)
    db_session.commit()

    db_session.add(user2)
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()


def test_destination_and_state_hierarchy(db_session):
    """Test State -> Destination -> Attraction relational cascade."""
    seed_reference_data(db_session)

    destination = Destination(
        id="raigad-fort",
        state_id="maharashtra",
        name="Rajgad Fort",
        category="Heritage Fort",
        description="Historic hill fort capital in the Sahyadri mountains.",
        ideal_duration="1 - 2 Days",
        best_time="July to February",
    )
    db_session.add(destination)
    db_session.commit()

    attraction = Attraction(
        destination_id="raigad-fort",
        name="Padmavati Machi",
        category="Fort Bastion",
        description="Spacious defensive terrace with shrines and water cisterns.",
    )
    db_session.add(attraction)
    db_session.commit()

    retrieved_dest = db_session.query(Destination).filter(Destination.id == "raigad-fort").first()
    assert retrieved_dest is not None
    assert retrieved_dest.state.name == "Maharashtra"
    assert len(retrieved_dest.attractions) == 1
    assert retrieved_dest.attractions[0].name == "Padmavati Machi"


def test_manager_assignment_scopes(db_session):
    """Test State Manager (destination_id IS NULL) and Destination Manager assignments."""
    seed_reference_data(db_session)

    # 1. State Manager
    state_mgr_user = User(
        id=uuid.uuid4(),
        role_id="manager",
        email="state.mgr@gmail.com",
        password_hash="hash_mgr",
        full_name="State Tourism Director",
    )
    db_session.add(state_mgr_user)
    db_session.commit()

    state_assignment = ManagerAssignment(
        user_id=state_mgr_user.id,
        role_id="manager",
        state_id="maharashtra",
        destination_id=None,  # State-wide authority
    )
    db_session.add(state_assignment)
    db_session.commit()

    retrieved = db_session.query(ManagerAssignment).filter(ManagerAssignment.user_id == state_mgr_user.id).first()
    assert retrieved.destination_id is None
    assert retrieved.state_id == "maharashtra"


def test_trip_plan_cascade_deletion(db_session):
    """Verify that deleting a TripPlan automatically cascades deletion to its TripPlanItems."""
    seed_reference_data(db_session)

    user = User(
        id=uuid.uuid4(),
        role_id="tourist",
        email="plan.traveler@gmail.com",
        password_hash="hash_plan",
        full_name="Plan Traveler",
    )
    destination = Destination(
        id="munnar",
        state_id="kerala",
        name="Munnar",
        category="Hill Station",
        description="Tea plantation hills in Kerala.",
    )
    db_session.add_all([user, destination])
    db_session.commit()

    trip = TripPlan(
        user_id=user.id,
        title="Kerala Monsoon Expedition",
        start_date=date(2026, 8, 10),
        end_date=date(2026, 8, 15),
    )
    db_session.add(trip)
    db_session.commit()

    item = TripPlanItem(
        trip_plan_id=trip.id,
        destination_id="munnar",
        day_number=1,
        order_index=1,
        time_slot="Morning",
    )
    db_session.add(item)
    db_session.commit()

    assert db_session.query(TripPlanItem).filter(TripPlanItem.trip_plan_id == trip.id).count() == 1

    # Delete parent trip plan
    db_session.delete(trip)
    db_session.commit()

    # Verify child items were cascaded
    assert db_session.query(TripPlanItem).filter(TripPlanItem.trip_plan_id == trip.id).count() == 0


def test_user_favorite_unique_constraint(db_session):
    """Verify a user cannot favorite the same destination multiple times."""
    seed_reference_data(db_session)

    user = User(
        id=uuid.uuid4(),
        role_id="tourist",
        email="fav.user@gmail.com",
        password_hash="hash_fav",
        full_name="Fav User",
    )
    destination = Destination(
        id="goa-coastal",
        state_id="goa",
        name="Old Goa",
        category="Heritage Port",
        description="Colonial heritage architecture.",
    )
    db_session.add_all([user, destination])
    db_session.commit()

    fav1 = UserFavorite(user_id=user.id, destination_id="goa-coastal")
    fav2 = UserFavorite(user_id=user.id, destination_id="goa-coastal")
    db_session.add(fav1)
    db_session.commit()

    db_session.add(fav2)
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()


def test_visitor_statistic_unique_day_constraint(db_session):
    """Verify visitor statistics enforce uniqueness on (destination_id, record_date)."""
    seed_reference_data(db_session)

    destination = Destination(
        id="amer-fort",
        state_id="rajasthan",
        name="Amer Fort",
        category="Royal Fort",
        description="Historic palace in Jaipur.",
    )
    db_session.add(destination)
    db_session.commit()

    stat1 = VisitorStatistic(
        destination_id="amer-fort",
        record_date=date(2026, 11, 18),
        visitor_count=4500,
        domestic_count=3800,
        international_count=700,
    )
    stat2 = VisitorStatistic(
        destination_id="amer-fort",
        record_date=date(2026, 11, 18),
        visitor_count=5000,
    )
    db_session.add(stat1)
    db_session.commit()

    db_session.add(stat2)
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()
