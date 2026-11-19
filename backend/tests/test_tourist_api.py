"""
YatraSetu Platform — Tourist Workspace API Test Suite
Tests:
1. Unauthenticated requests to protected endpoints return 401 Unauthorized.
2. Manager and Stakeholder tokens are rejected with 403 Forbidden.
3. Tourist profile retrieval and update.
4. Wishlist / Favorites CRUD (add, list, delete, idempotency).
5. Trip Plans & Itineraries CRUD (create with stops, list, get, update, delete).
6. Cross-tourist itinerary isolation (cannot view, update, or delete another tourist's plan).
7. Destination Reviews flow (submit pending review, list approved + own pending reviews).
8. Destination Advisories retrieval for tourist consumption.
"""

import uuid
import pytest
from datetime import datetime, date, timezone
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.identity import Role, User
from app.models.destination import State, Destination, Attraction, DestinationAdvisory
from app.models.tourist import TripPlan, TripPlanItem, UserFavorite, DestinationReview
from app.core.hashing import PasswordSecurity
from app.core.tokens import TokenService


@pytest.fixture
def tourist_test_data(db_session: Session):
    """Sets up roles, states, destinations, attractions, and advisories for tourist tests."""
    for role_id, name in [
        ("admin", "Platform Administrator"),
        ("manager", "Destination Manager"),
        ("stakeholder", "Tourism Stakeholder"),
        ("tourist", "Tourist"),
    ]:
        if not db_session.query(Role).filter(Role.id == role_id).first():
            db_session.add(Role(id=role_id, name=name))

    for state_id, name in [
        ("maharashtra", "Maharashtra"),
        ("kerala", "Kerala"),
    ]:
        if not db_session.query(State).filter(State.id == state_id).first():
            db_session.add(State(id=state_id, name=name, theme_code=state_id, badge_label=name.upper()))

    destinations = [
        Destination(
            id="rajgad-fort",
            state_id="maharashtra",
            name="Rajgad Fort",
            category="Heritage",
            description="Historic hill fort.",
            max_daily_capacity=2000,
        ),
        Destination(
            id="munnar-hills",
            state_id="kerala",
            name="Munnar Hills",
            category="Nature",
            description="Lush tea estates.",
            max_daily_capacity=4000,
        ),
    ]
    for d in destinations:
        if not db_session.query(Destination).filter(Destination.id == d.id).first():
            db_session.add(d)

    attraction = Attraction(
        id=uuid.uuid4(),
        destination_id="rajgad-fort",
        name="Padmavati Machi",
        category="Plateau",
        description="First fortified plateau.",
    )
    db_session.add(attraction)

    # Add a manager for creating advisories
    mgr = User(
        id=uuid.uuid4(),
        role_id="manager",
        email="manager@example.com",
        password_hash=PasswordSecurity.hash_password("Pass@123"),
        full_name="Manager Rajesh",
        is_active=True,
        is_verified=True,
    )
    db_session.add(mgr)
    db_session.flush()

    advisory = DestinationAdvisory(
        id=uuid.uuid4(),
        destination_id="rajgad-fort",
        severity="warning",
        title="Monsoon Trail Caution",
        description="Slippery rock sections near Chor Darwaza.",
        is_active=True,
        created_by=mgr.id,
    )
    db_session.add(advisory)

    db_session.commit()
    return {"attraction_id": attraction.id, "advisory_id": advisory.id}


def create_user(db_session: Session, email: str, role_id: str, name: str = "Test User") -> User:
    user = User(
        id=uuid.uuid4(),
        role_id=role_id,
        email=email,
        password_hash=PasswordSecurity.hash_password("Password@123"),
        full_name=name,
        is_active=True,
        is_verified=True,
    )
    db_session.add(user)
    db_session.commit()
    return user


def auth_headers(user: User) -> dict:
    token, _ = TokenService.create_access_token(user_id=user.id, role=user.role_id)
    return {"Authorization": f"Bearer {token}"}


# =============================================================================
# 1. Access Control Tests
# =============================================================================

def test_tourist_endpoints_unauthenticated(client: TestClient):
    """Unauthenticated calls to private tourist endpoints must return 401."""
    endpoints = [
        ("GET", "/api/v1/tourist/profile"),
        ("PUT", "/api/v1/tourist/profile"),
        ("GET", "/api/v1/tourist/favorites"),
        ("POST", "/api/v1/tourist/favorites"),
        ("DELETE", "/api/v1/tourist/favorites/rajgad-fort"),
        ("GET", "/api/v1/tourist/itineraries"),
        ("POST", "/api/v1/tourist/itineraries"),
        ("POST", "/api/v1/tourist/reviews"),
    ]
    for method, path in endpoints:
        res = client.request(method, path, json={})
        assert res.status_code == 401, f"Expected 401 for {method} {path}, got {res.status_code}"


def test_tourist_endpoints_forbidden_for_other_roles(
    client: TestClient, db_session: Session, tourist_test_data
):
    """Stakeholder and Manager tokens must be rejected with 403 Forbidden for tourist endpoints."""
    mgr = create_user(db_session, "mgr_forbidden@example.com", "manager", "Manager Forbidden")
    sh = create_user(db_session, "sh_forbidden@example.com", "stakeholder", "Stakeholder Forbidden")

    for user in [mgr, sh]:
        headers = auth_headers(user)
        res = client.get("/api/v1/tourist/profile", headers=headers)
        assert res.status_code == 403, f"Expected 403 for {user.role_id}, got {res.status_code}"

        res_fav = client.get("/api/v1/tourist/favorites", headers=headers)
        assert res_fav.status_code == 403, f"Expected 403 for {user.role_id}, got {res_fav.status_code}"


# =============================================================================
# 2. Tourist Profile Tests
# =============================================================================

def test_tourist_profile_crud(client: TestClient, db_session: Session, tourist_test_data):
    """Tourist can retrieve and update their profile."""
    tourist = create_user(db_session, "ananya@example.com", "tourist", "Ananya Sharma")
    headers = auth_headers(tourist)

    # 1. Get profile
    res = client.get("/api/v1/tourist/profile", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["email"] == "ananya@example.com"
    assert data["full_name"] == "Ananya Sharma"
    assert data["role"] == "tourist"

    # 2. Update profile
    update_payload = {
        "full_name": "Ananya S. Sharma",
        "phone_number": "+91 98765 43210",
        "preferences": {"interests": ["Trekking", "Heritage Forts"], "diet": "Vegetarian"},
    }
    res_up = client.put("/api/v1/tourist/profile", json=update_payload, headers=headers)
    assert res_up.status_code == 200
    up_data = res_up.json()
    assert up_data["full_name"] == "Ananya S. Sharma"
    assert up_data["phone_number"] == "+91 98765 43210"
    assert up_data["preferences"]["interests"] == ["Trekking", "Heritage Forts"]


# =============================================================================
# 3. Wishlist / Favorites Tests
# =============================================================================

def test_tourist_favorites_flow(client: TestClient, db_session: Session, tourist_test_data):
    """Tourist can add, list, and delete saved destinations."""
    tourist = create_user(db_session, "fav_user@example.com", "tourist", "Favorite User")
    headers = auth_headers(tourist)

    # Initial favorites list is empty
    res_init = client.get("/api/v1/tourist/favorites", headers=headers)
    assert res_init.status_code == 200
    assert len(res_init.json()) == 0

    # Add rajgad-fort
    res_add = client.post("/api/v1/tourist/favorites", json={"destination_id": "rajgad-fort"}, headers=headers)
    assert res_add.status_code == 201
    fav_data = res_add.json()
    assert fav_data["destination_id"] == "rajgad-fort"
    assert fav_data["destination_name"] == "Rajgad Fort"

    # Add idempotent test: adding same destination again succeeds
    res_add_again = client.post("/api/v1/tourist/favorites", json={"destination_id": "rajgad-fort"}, headers=headers)
    assert res_add_again.status_code == 201

    # Add munnar-hills
    client.post("/api/v1/tourist/favorites", json={"destination_id": "munnar-hills"}, headers=headers)

    # List favorites: should have 2
    res_list = client.get("/api/v1/tourist/favorites", headers=headers)
    assert res_list.status_code == 200
    items = res_list.json()
    assert len(items) == 2
    dest_ids = [item["destination_id"] for item in items]
    assert "rajgad-fort" in dest_ids
    assert "munnar-hills" in dest_ids

    # Delete rajgad-fort
    res_del = client.delete("/api/v1/tourist/favorites/rajgad-fort", headers=headers)
    assert res_del.status_code == 200

    # Verify only munnar-hills remains
    res_list_after = client.get("/api/v1/tourist/favorites", headers=headers)
    assert len(res_list_after.json()) == 1
    assert res_list_after.json()[0]["destination_id"] == "munnar-hills"

    # Deleting nonexistent destination returns 404
    res_del_404 = client.delete("/api/v1/tourist/favorites/nonexistent", headers=headers)
    assert res_del_404.status_code == 404


# =============================================================================
# 4. Trip Plans & Itineraries Tests
# =============================================================================

def test_tourist_itineraries_crud_and_isolation(client: TestClient, db_session: Session, tourist_test_data):
    """Tourist can create, view, update, and delete itineraries with full cross-user isolation."""
    tourist_a = create_user(db_session, "tourist_a@example.com", "tourist", "Tourist A")
    tourist_b = create_user(db_session, "tourist_b@example.com", "tourist", "Tourist B")
    headers_a = auth_headers(tourist_a)
    headers_b = auth_headers(tourist_b)

    attr_id = tourist_test_data["attraction_id"]

    # 1. Tourist A creates a trip plan
    plan_payload = {
        "title": "Maharashtra Heritage Trek",
        "start_date": "2026-12-01",
        "end_date": "2026-12-03",
        "notes": "Carry warm clothes and trekking shoes.",
        "items": [
            {
                "destination_id": "rajgad-fort",
                "attraction_id": str(attr_id),
                "day_number": 1,
                "order_index": 1,
                "time_slot": "08:00 AM",
                "notes": "Ascend via Pali Darwaza trail.",
            }
        ],
    }
    res_create = client.post("/api/v1/tourist/itineraries", json=plan_payload, headers=headers_a)
    assert res_create.status_code == 201
    plan = res_create.json()
    plan_id = plan["id"]
    assert plan["title"] == "Maharashtra Heritage Trek"
    assert len(plan["items"]) == 1
    assert plan["items"][0]["destination_name"] == "Rajgad Fort"
    assert plan["items"][0]["attraction_name"] == "Padmavati Machi"

    # 2. Tourist A can retrieve their trip plan
    res_get = client.get(f"/api/v1/tourist/itineraries/{plan_id}", headers=headers_a)
    assert res_get.status_code == 200
    assert res_get.json()["title"] == "Maharashtra Heritage Trek"

    # 3. Isolation: Tourist B CANNOT retrieve Tourist A's trip plan (403 Forbidden)
    res_b_get = client.get(f"/api/v1/tourist/itineraries/{plan_id}", headers=headers_b)
    assert res_b_get.status_code == 403

    # 4. Isolation: Tourist B CANNOT update Tourist A's trip plan (403 Forbidden)
    res_b_up = client.put(f"/api/v1/tourist/itineraries/{plan_id}", json={"title": "Hacked Title"}, headers=headers_b)
    assert res_b_up.status_code == 403

    # 5. Isolation: Tourist B CANNOT delete Tourist A's trip plan (403 Forbidden)
    res_b_del = client.delete(f"/api/v1/tourist/itineraries/{plan_id}", headers=headers_b)
    assert res_b_del.status_code == 403

    # 6. Tourist A updates the trip plan
    up_payload = {
        "title": "Maharashtra Heritage Trek — 2026 Edition",
        "notes": "Updated packing list: add rain poncho.",
    }
    res_up = client.put(f"/api/v1/tourist/itineraries/{plan_id}", json=up_payload, headers=headers_a)
    assert res_up.status_code == 200
    assert res_up.json()["title"] == "Maharashtra Heritage Trek — 2026 Edition"

    # 7. Tourist A deletes the trip plan
    res_del = client.delete(f"/api/v1/tourist/itineraries/{plan_id}", headers=headers_a)
    assert res_del.status_code == 200

    # 8. Plan is gone (404)
    res_get_gone = client.get(f"/api/v1/tourist/itineraries/{plan_id}", headers=headers_a)
    assert res_get_gone.status_code == 404


# =============================================================================
# 5. Destination Reviews Flow Tests
# =============================================================================

def test_tourist_reviews_flow(client: TestClient, db_session: Session, tourist_test_data):
    """Tourist can submit a review, and list reviews with correct approval visibility."""
    tourist = create_user(db_session, "reviewer@example.com", "tourist", "Reviewer Raj")
    headers = auth_headers(tourist)

    # 1. Submit review
    review_payload = {
        "destination_id": "rajgad-fort",
        "rating": 5,
        "category": "trails",
        "comment": "Incredible trekking experience. The views from Suvela Machi are unforgettable!",
    }
    res_sub = client.post("/api/v1/tourist/reviews", json=review_payload, headers=headers)
    assert res_sub.status_code == 201
    rev = res_sub.json()
    assert rev["rating"] == 5
    assert rev["review_status"] == "pending_review"
    assert rev["is_own_review"] is True

    # 2. Public unauthenticated user CANNOT see pending reviews
    res_pub = client.get("/api/v1/tourist/reviews/rajgad-fort")
    assert res_pub.status_code == 200
    assert len(res_pub.json()) == 0

    # 3. Authenticated author CAN see their own pending review
    res_auth = client.get("/api/v1/tourist/reviews/rajgad-fort", headers=headers)
    assert res_auth.status_code == 200
    auth_revs = res_auth.json()
    assert len(auth_revs) == 1
    assert auth_revs[0]["is_own_review"] is True
    assert auth_revs[0]["review_status"] == "pending_review"

    # 4. Submitting another review for the same destination updates the existing review
    updated_payload = {
        "destination_id": "rajgad-fort",
        "rating": 4,
        "category": "heritage",
        "comment": "Revised: Still magnificent, but start early in the morning before sun reaches zenith.",
    }
    res_sub2 = client.post("/api/v1/tourist/reviews", json=updated_payload, headers=headers)
    assert res_sub2.status_code == 201
    assert res_sub2.json()["rating"] == 4

    # 5. Verify total reviews for user is still 1 (updated, not duplicated)
    res_auth_2 = client.get("/api/v1/tourist/reviews/rajgad-fort", headers=headers)
    assert len(res_auth_2.json()) == 1


# =============================================================================
# 6. Destination Advisories Retrieval Tests
# =============================================================================

def test_tourist_destination_advisories(client: TestClient, db_session: Session, tourist_test_data):
    """Tourists can retrieve active destination advisories."""
    res = client.get("/api/v1/tourist/advisories/rajgad-fort")
    assert res.status_code == 200
    advisories = res.json()
    assert len(advisories) >= 1
    assert advisories[0]["title"] == "Monsoon Trail Caution"
    assert advisories[0]["severity"] == "warning"
    assert advisories[0]["is_active"] is True
