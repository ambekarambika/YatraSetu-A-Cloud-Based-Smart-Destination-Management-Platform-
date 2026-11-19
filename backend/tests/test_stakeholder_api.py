"""
YatraSetu Platform — Tourism Stakeholder Workspace API Test Suite
Tests:
1. Unauthenticated requests are rejected with 401 Unauthorized.
2. Manager and Tourist access is rejected with 403 Forbidden.
3. Unregistered stakeholder profile returns 'unregistered' status.
4. Valid service registration sets status to 'pending' and locks destination.
5. Stakeholder cannot change destination after registration (400 Bad Request).
6. Stakeholder can update business details and contact info.
7. Destination advisories are retrieved for assigned destination.
8. Stakeholder can submit operational suggestions to manager and list them.
9. Media CRUD: Add photo/video, list, update, and delete.
10. Media URL format validation (must begin with http:// or https://).
11. Service offerings CRUD in contact_info.
12. Cross-stakeholder media isolation (cannot edit/delete another stakeholder's media).
"""

import uuid
import pytest
from datetime import datetime, timezone
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.identity import Role, User
from app.models.destination import State, Destination, DestinationAdvisory
from app.models.stakeholder import StakeholderService, StakeholderMedia, StakeholderPost
from app.core.hashing import PasswordSecurity
from app.core.tokens import TokenService


@pytest.fixture
def stakeholder_test_data(db_session: Session):
    """Sets up roles, states, destinations, and advisories for stakeholder tests."""
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
            id="ellora-caves",
            state_id="maharashtra",
            name="Ellora Caves",
            category="Culture",
            description="Rock-cut monuments.",
            max_daily_capacity=5000,
        ),
    ]
    for d in destinations:
        if not db_session.query(Destination).filter(Destination.id == d.id).first():
            db_session.add(d)

    db_session.commit()


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


# -----------------------------------------------------------------------------
# 1. Access Control Tests
# -----------------------------------------------------------------------------

def test_stakeholder_endpoints_unauthenticated(client: TestClient):
    """Unauthenticated calls must return 401 Unauthorized."""
    endpoints = [
        ("GET", "/api/v1/stakeholder/profile"),
        ("PUT", "/api/v1/stakeholder/profile"),
        ("GET", "/api/v1/stakeholder/destination-updates"),
        ("GET", "/api/v1/stakeholder/suggestions"),
        ("POST", "/api/v1/stakeholder/suggestions"),
        ("GET", "/api/v1/stakeholder/media"),
        ("POST", "/api/v1/stakeholder/media"),
        ("GET", "/api/v1/stakeholder/offerings"),
    ]
    for method, path in endpoints:
        res = client.request(method, path, json={})
        assert res.status_code == 401, f"Expected 401 for {method} {path}, got {res.status_code}"


def test_stakeholder_endpoints_forbidden_for_other_roles(
    client: TestClient, db_session: Session, stakeholder_test_data
):
    """Tourist and Manager tokens must be rejected with 403 Forbidden."""
    tourist = create_user(db_session, "tourist@example.com", "tourist", "Tourist User")
    manager = create_user(db_session, "manager@example.com", "manager", "Manager User")
    
    # Assign manager to rajgad-fort so manager authentication passes and RBAC guard triggers
    from app.models.identity import ManagerAssignment
    mgr_assign = ManagerAssignment(
        user_id=manager.id,
        state_id="maharashtra",
        destination_id="rajgad-fort",
    )
    db_session.add(mgr_assign)
    db_session.commit()

    for u in [tourist, manager]:
        headers = auth_headers(u)
        res = client.get("/api/v1/stakeholder/profile", headers=headers)
        assert res.status_code == 403
        assert "Access denied" in res.json()["detail"]


# -----------------------------------------------------------------------------
# 2. Profile & Registration Tests
# -----------------------------------------------------------------------------

def test_stakeholder_profile_unregistered(client: TestClient, db_session: Session, stakeholder_test_data):
    """Newly created stakeholder has unregistered verification status."""
    sh = create_user(db_session, "new_sh@example.com", "stakeholder", "New Guide")
    headers = auth_headers(sh)

    res = client.get("/api/v1/stakeholder/profile", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["role"] == "stakeholder"
    assert data["verification_status"] == "unregistered"
    assert data["is_destination_locked"] is False
    assert data["service_id"] is None


def test_stakeholder_register_service(client: TestClient, db_session: Session, stakeholder_test_data):
    """Registering a service creates record with pending verification and locks destination."""
    sh = create_user(db_session, "guide1@example.com", "stakeholder", "Suresh Deshmukh")
    headers = auth_headers(sh)

    payload = {
        "destination_id": "rajgad-fort",
        "business_name": "Sahyadri Trekking Guides",
        "category": "Tour & Trekking Guides",
        "license_number": "LIC-MH-2026-001",
        "phone": "+91 98220 11223",
        "address": "Gunjavane Village",
        "operating_hours": "06:00 - 18:00",
        "price_range": "₹500 - ₹1,500",
    }
    res = client.post("/api/v1/stakeholder/service", headers=headers, json=payload)
    assert res.status_code == 201
    data = res.json()
    assert data["business_name"] == "Sahyadri Trekking Guides"
    assert data["verification_status"] == "pending"
    assert data["destination_id"] == "rajgad-fort"
    assert data["destination_name"] == "Rajgad Fort"
    assert data["state_name"] == "Maharashtra"
    assert data["is_destination_locked"] is True
    assert data["phone"] == "+91 98220 11223"


def test_stakeholder_destination_locking(client: TestClient, db_session: Session, stakeholder_test_data):
    """Once registered, attempting to change destination must return 400 Bad Request."""
    sh = create_user(db_session, "guide2@example.com", "stakeholder", "Ramesh Joshi")
    headers = auth_headers(sh)

    # Initial registration
    client.post(
        "/api/v1/stakeholder/service",
        headers=headers,
        json={
            "destination_id": "rajgad-fort",
            "business_name": "Ramesh Fort Guides",
            "category": "Guides",
        },
    )

    # Attempt to change destination
    res = client.put(
        "/api/v1/stakeholder/profile",
        headers=headers,
        json={"destination_id": "ellora-caves"},
    )
    assert res.status_code == 400
    assert "Destination cannot be changed after registration" in res.json()["detail"]


def test_stakeholder_profile_update(client: TestClient, db_session: Session, stakeholder_test_data):
    """Stakeholder can update business name, category, and contact details."""
    sh = create_user(db_session, "guide3@example.com", "stakeholder", "Anil Kulkarni")
    headers = auth_headers(sh)

    client.post(
        "/api/v1/stakeholder/service",
        headers=headers,
        json={
            "destination_id": "rajgad-fort",
            "business_name": "Anil Trekking Co",
            "category": "Guides",
        },
    )

    update_payload = {
        "business_name": "Anil Elite Trekking Co",
        "category": "Eco-Tours",
        "address": "Base Camp Office 2",
        "price_range": "₹800 - ₹2,000",
    }
    res = client.put("/api/v1/stakeholder/profile", headers=headers, json=update_payload)
    assert res.status_code == 200
    data = res.json()
    assert data["business_name"] == "Anil Elite Trekking Co"
    assert data["category"] == "Eco-Tours"
    assert data["address"] == "Base Camp Office 2"
    assert data["price_range"] == "₹800 - ₹2,000"


# -----------------------------------------------------------------------------
# 3. Destination Advisories Tests
# -----------------------------------------------------------------------------

def test_stakeholder_destination_updates(client: TestClient, db_session: Session, stakeholder_test_data):
    """Advisories for the stakeholder's assigned destination are retrieved."""
    admin = create_user(db_session, "admin_adv@example.com", "admin", "Admin User")
    sh = create_user(db_session, "guide_adv@example.com", "stakeholder", "Local Partner")
    headers = auth_headers(sh)

    # Register for rajgad-fort
    client.post(
        "/api/v1/stakeholder/service",
        headers=headers,
        json={
            "destination_id": "rajgad-fort",
            "business_name": "Rajgad Local Guides",
            "category": "Guides",
        },
    )

    # Add 1 advisory for rajgad-fort and 1 for ellora-caves
    adv_rajgad = DestinationAdvisory(
        id=uuid.uuid4(),
        destination_id="rajgad-fort",
        severity="warning",
        title="Monsoon Ridge Warning",
        description="Heavy winds on Sanjivani Machi.",
        created_by=admin.id,
        is_active=True,
    )
    adv_ellora = DestinationAdvisory(
        id=uuid.uuid4(),
        destination_id="ellora-caves",
        severity="info",
        title="Cave 16 Maintenance",
        description="Routine cleaning.",
        created_by=admin.id,
        is_active=True,
    )
    db_session.add_all([adv_rajgad, adv_ellora])
    db_session.commit()

    res = client.get("/api/v1/stakeholder/destination-updates", headers=headers)
    assert res.status_code == 200
    advisories = res.json()
    assert len(advisories) == 1
    assert advisories[0]["title"] == "Monsoon Ridge Warning"
    assert advisories[0]["destination_id"] == "rajgad-fort"


# -----------------------------------------------------------------------------
# 4. Manager Coordination & Suggestions Tests
# -----------------------------------------------------------------------------

def test_stakeholder_suggestions_flow(client: TestClient, db_session: Session, stakeholder_test_data):
    """Stakeholder submits suggestions and lists them."""
    sh = create_user(db_session, "guide_sug@example.com", "stakeholder", "Guide Suggestions")
    headers = auth_headers(sh)

    client.post(
        "/api/v1/stakeholder/service",
        headers=headers,
        json={
            "destination_id": "rajgad-fort",
            "business_name": "Rajgad Suggestions Co",
            "category": "Guides",
        },
    )

    payload = {
        "title": "Potable Water Facility Request",
        "content": "Requesting an eco-friendly drinking water station near Gunjavane junction.",
    }
    res = client.post("/api/v1/stakeholder/suggestions", headers=headers, json=payload)
    assert res.status_code == 201
    sug = res.json()
    assert sug["title"] == "Potable Water Facility Request"
    assert sug["post_type"] == "suggestion"

    # List suggestions
    list_res = client.get("/api/v1/stakeholder/suggestions", headers=headers)
    assert list_res.status_code == 200
    items = list_res.json()
    assert len(items) == 1
    assert items[0]["title"] == "Potable Water Facility Request"


# -----------------------------------------------------------------------------
# 5. Media Gallery CRUD Tests
# -----------------------------------------------------------------------------

def test_stakeholder_media_crud(client: TestClient, db_session: Session, stakeholder_test_data):
    """Stakeholder can create, list, update, and delete media items."""
    sh = create_user(db_session, "guide_media@example.com", "stakeholder", "Media Guide")
    headers = auth_headers(sh)

    client.post(
        "/api/v1/stakeholder/service",
        headers=headers,
        json={
            "destination_id": "rajgad-fort",
            "business_name": "Media Trek Co",
            "category": "Photography & Tours",
        },
    )

    # 1. Create photo
    photo_payload = {
        "media_type": "photo",
        "title": "Rajgad Sunrise View",
        "media_url": "https://images.example.com/rajgad_sunrise.jpg",
        "description": "Scenic sunrise overlooking Padmavati Machi.",
        "file_size_bytes": 1024000,
    }
    create_res = client.post("/api/v1/stakeholder/media", headers=headers, json=photo_payload)
    assert create_res.status_code == 201
    media_data = create_res.json()
    media_id = media_data["id"]
    assert media_data["title"] == "Rajgad Sunrise View"

    # 2. List media
    list_res = client.get("/api/v1/stakeholder/media", headers=headers)
    assert list_res.status_code == 200
    media_list = list_res.json()
    assert len(media_list) == 1
    assert media_list[0]["id"] == media_id

    # 3. Update media
    update_res = client.put(
        f"/api/v1/stakeholder/media/{media_id}",
        headers=headers,
        json={"title": "Updated Sunrise Panorama"},
    )
    assert update_res.status_code == 200
    assert update_res.json()["title"] == "Updated Sunrise Panorama"

    # 4. Delete media
    del_res = client.delete(f"/api/v1/stakeholder/media/{media_id}", headers=headers)
    assert del_res.status_code == 200
    assert del_res.json()["success"] is True

    # 5. Verify deleted from list
    post_del = client.get("/api/v1/stakeholder/media", headers=headers)
    assert len(post_del.json()) == 0


def test_stakeholder_media_validation(client: TestClient, db_session: Session, stakeholder_test_data):
    """Media with invalid URLs or media_types must be rejected with 422."""
    sh = create_user(db_session, "guide_val@example.com", "stakeholder", "Val Guide")
    headers = auth_headers(sh)

    client.post(
        "/api/v1/stakeholder/service",
        headers=headers,
        json={
            "destination_id": "rajgad-fort",
            "business_name": "Val Trek Co",
            "category": "Tours",
        },
    )

    # Invalid URL scheme
    res = client.post(
        "/api/v1/stakeholder/media",
        headers=headers,
        json={
            "media_type": "photo",
            "title": "Bad URL",
            "media_url": "ftp://files.example.com/pic.jpg",
        },
    )
    assert res.status_code == 422

    # Invalid media_type
    res2 = client.post(
        "/api/v1/stakeholder/media",
        headers=headers,
        json={
            "media_type": "audio",
            "title": "Audio Tour",
            "media_url": "https://example.com/audio.mp3",
        },
    )
    assert res2.status_code == 422


# -----------------------------------------------------------------------------
# 6. Service Offerings Tests
# -----------------------------------------------------------------------------

def test_stakeholder_offerings_flow(client: TestClient, db_session: Session, stakeholder_test_data):
    """Service offerings can be created, retrieved, and deleted."""
    sh = create_user(db_session, "guide_off@example.com", "stakeholder", "Offering Guide")
    headers = auth_headers(sh)

    client.post(
        "/api/v1/stakeholder/service",
        headers=headers,
        json={
            "destination_id": "rajgad-fort",
            "business_name": "Offering Trek Co",
            "category": "Tours",
        },
    )

    # 1. Create offering
    payload = {
        "title": "Guided Fort Trek & Historical Orientation",
        "category": "Guided Trek",
        "price": "₹600 per trekker",
        "description": "Full-day historical tour with certified local guides.",
    }
    create_res = client.post("/api/v1/stakeholder/offerings", headers=headers, json=payload)
    assert create_res.status_code == 201
    offering = create_res.json()
    offering_id = offering["id"]
    assert offering["title"] == "Guided Fort Trek & Historical Orientation"

    # 2. List offerings
    list_res = client.get("/api/v1/stakeholder/offerings", headers=headers)
    assert list_res.status_code == 200
    offerings = list_res.json()
    assert len(offerings) == 1
    assert offerings[0]["id"] == offering_id

    # 3. Delete offering
    del_res = client.delete(f"/api/v1/stakeholder/offerings/{offering_id}", headers=headers)
    assert del_res.status_code == 200
    assert del_res.json()["success"] is True

    # 4. Verify list empty
    empty_res = client.get("/api/v1/stakeholder/offerings", headers=headers)
    assert len(empty_res.json()) == 0


# -----------------------------------------------------------------------------
# 7. Cross-User Isolation Tests
# -----------------------------------------------------------------------------

def test_cross_stakeholder_media_isolation(client: TestClient, db_session: Session, stakeholder_test_data):
    """Stakeholder B cannot modify or delete Stakeholder A's media."""
    sh_a = create_user(db_session, "sh_a@example.com", "stakeholder", "Stakeholder A")
    sh_b = create_user(db_session, "sh_b@example.com", "stakeholder", "Stakeholder B")
    headers_a = auth_headers(sh_a)
    headers_b = auth_headers(sh_b)

    # Register both
    client.post(
        "/api/v1/stakeholder/service",
        headers=headers_a,
        json={"destination_id": "rajgad-fort", "business_name": "A Co", "category": "Guides"},
    )
    client.post(
        "/api/v1/stakeholder/service",
        headers=headers_b,
        json={"destination_id": "rajgad-fort", "business_name": "B Co", "category": "Guides"},
    )

    # A creates media
    res = client.post(
        "/api/v1/stakeholder/media",
        headers=headers_a,
        json={
            "media_type": "photo",
            "title": "Photo by A",
            "media_url": "https://example.com/photo_a.jpg",
        },
    )
    media_id_a = res.json()["id"]

    # B attempts to delete A's media -> 404
    b_del = client.delete(f"/api/v1/stakeholder/media/{media_id_a}", headers=headers_b)
    assert b_del.status_code == 404

    # B attempts to update A's media -> 404
    b_put = client.put(
        f"/api/v1/stakeholder/media/{media_id_a}",
        headers=headers_b,
        json={"title": "Hacked Title"},
    )
    assert b_put.status_code == 404
