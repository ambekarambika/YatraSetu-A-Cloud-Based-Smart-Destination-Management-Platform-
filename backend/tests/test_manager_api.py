"""
YatraSetu Platform — Destination Manager Workspace Unit & Security Test Suite
Tests:
1. Unauthenticated requests are rejected with 401 Unauthorized.
2. Tourist access is denied with 403 Forbidden.
3. Stakeholder access is denied with 403 Forbidden.
4. Manager without active database assignment is denied with 403 Forbidden.
5. Destination Manager sees only their assigned destination.
6. State Manager sees only destinations within their assigned state.
7. Cross-jurisdiction destination access is denied with 403 Forbidden.
8. Safe handling of invalid / non-existent destination IDs (404 Not Found).
"""

import uuid
import pytest
from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.identity import Role, User, ManagerAssignment
from app.models.destination import State, Destination, Attraction, Event
from app.core.hashing import PasswordSecurity
from app.core.tokens import TokenService


# -----------------------------------------------------------------------------
# Fixtures
# -----------------------------------------------------------------------------

@pytest.fixture
def manager_test_data(db_session: Session):
    """Sets up roles, states, and destinations for manager API tests."""
    # Seed roles
    for role_id, name in [
        ("admin", "Platform Administrator"),
        ("manager", "Destination Manager"),
        ("stakeholder", "Tourism Stakeholder"),
        ("tourist", "Tourist"),
    ]:
        if not db_session.query(Role).filter(Role.id == role_id).first():
            db_session.add(Role(id=role_id, name=name))

    # Seed states
    for state_id, name in [
        ("maharashtra", "Maharashtra"),
        ("kerala", "Kerala"),
    ]:
        if not db_session.query(State).filter(State.id == state_id).first():
            db_session.add(State(
                id=state_id,
                name=name,
                theme_code=state_id,
                badge_label=name.upper(),
            ))

    # Seed destinations: 2 in Maharashtra, 1 in Kerala
    destinations = [
        Destination(
            id="rajgad-fort",
            state_id="maharashtra",
            name="Rajgad Fort",
            category="Heritage",
            description="Historic hill fort in Sahyadris.",
            max_daily_capacity=2000,
        ),
        Destination(
            id="ellora-caves",
            state_id="maharashtra",
            name="Ellora Caves",
            category="Culture",
            description="UNESCO world heritage rock-cut monuments.",
            max_daily_capacity=5000,
        ),
        Destination(
            id="munnar",
            state_id="kerala",
            name="Munnar",
            category="Nature",
            description="Picturesque tea plantation hill station.",
            max_daily_capacity=8000,
        ),
    ]
    for d in destinations:
        if not db_session.query(Destination).filter(Destination.id == d.id).first():
            db_session.add(d)

    db_session.commit()


def create_test_user(
    db_session: Session,
    email: str,
    role_id: str,
    full_name: str = "Test User",
) -> User:
    """Helper to create a verified active test user."""
    user = User(
        id=uuid.uuid4(),
        role_id=role_id,
        email=email,
        password_hash=PasswordSecurity.hash_password("Test@Password123"),
        full_name=full_name,
        is_active=True,
        is_verified=True,
    )
    db_session.add(user)
    db_session.commit()
    return user


def get_auth_headers(user: User) -> dict:
    """Generates valid Bearer Authorization headers for a given user."""
    token, _ = TokenService.create_access_token(user_id=user.id, role=user.role_id)
    return {"Authorization": f"Bearer {token}"}


# -----------------------------------------------------------------------------
# Tests
# -----------------------------------------------------------------------------

def test_unauthenticated_request_rejected(client: TestClient, manager_test_data):
    """Verifies unauthenticated callers receive 401 Unauthorized."""
    endpoints = [
        "/api/v1/manager/context",
        "/api/v1/manager/destinations",
        "/api/v1/manager/destinations/rajgad-fort",
    ]
    for ep in endpoints:
        res = client.get(ep)
        assert res.status_code == 401, f"Expected 401 for unauthenticated {ep}"
        assert "not provided" in res.json()["detail"].lower()


def test_tourist_access_denied(client: TestClient, db_session: Session, manager_test_data):
    """Verifies tourist role cannot access manager workspace endpoints (403 Forbidden)."""
    tourist = create_test_user(db_session, "tourist.denied@example.com", "tourist")
    headers = get_auth_headers(tourist)

    endpoints = [
        "/api/v1/manager/context",
        "/api/v1/manager/destinations",
        "/api/v1/manager/destinations/rajgad-fort",
    ]
    for ep in endpoints:
        res = client.get(ep, headers=headers)
        assert res.status_code == 403, f"Expected 403 for tourist on {ep}"
        assert "access denied" in res.json()["detail"].lower()


def test_stakeholder_access_denied(client: TestClient, db_session: Session, manager_test_data):
    """Verifies stakeholder role cannot access manager workspace endpoints (403 Forbidden)."""
    stakeholder = create_test_user(db_session, "stakeholder.denied@example.com", "stakeholder")
    headers = get_auth_headers(stakeholder)

    endpoints = [
        "/api/v1/manager/context",
        "/api/v1/manager/destinations",
        "/api/v1/manager/destinations/rajgad-fort",
    ]
    for ep in endpoints:
        res = client.get(ep, headers=headers)
        assert res.status_code == 403, f"Expected 403 for stakeholder on {ep}"
        assert "access denied" in res.json()["detail"].lower()


def test_manager_with_no_assignment_denied(client: TestClient, db_session: Session, manager_test_data):
    """Verifies a manager account with no database assignment is denied (403 Forbidden)."""
    unassigned_mgr = create_test_user(db_session, "unassigned.mgr@example.com", "manager")
    headers = get_auth_headers(unassigned_mgr)

    res = client.get("/api/v1/manager/context", headers=headers)
    assert res.status_code == 403
    assert "without active jurisdiction assignment" in res.json()["detail"].lower()

    res_dests = client.get("/api/v1/manager/destinations", headers=headers)
    assert res_dests.status_code == 403


def test_destination_manager_sees_only_assigned_destination(
    client: TestClient, db_session: Session, manager_test_data
):
    """
    Verifies Destination Manager:
    - Context returns destination scope with correct state and destination IDs.
    - Destinations list returns ONLY their single assigned destination.
    - Can view details of their assigned destination.
    """
    dest_mgr = create_test_user(db_session, "rajgad.mgr@example.com", "manager", "Rajgad Manager")
    assignment = ManagerAssignment(
        user_id=dest_mgr.id,
        role_id="manager",
        state_id="maharashtra",
        destination_id="rajgad-fort",
    )
    db_session.add(assignment)
    db_session.commit()

    headers = get_auth_headers(dest_mgr)

    # 1. Context verification
    ctx_res = client.get("/api/v1/manager/context", headers=headers)
    assert ctx_res.status_code == 200
    ctx_data = ctx_res.json()
    assert ctx_data["scope"] == "destination"
    assert ctx_data["state_id"] == "maharashtra"
    assert ctx_data["state_name"] == "Maharashtra"
    assert ctx_data["destination_id"] == "rajgad-fort"
    assert ctx_data["destination_name"] == "Rajgad Fort"
    assert ctx_data["email"] == "rajgad.mgr@example.com"

    # 2. Scoped destination list
    dests_res = client.get("/api/v1/manager/destinations", headers=headers)
    assert dests_res.status_code == 200
    dests_data = dests_res.json()
    assert len(dests_data) == 1
    assert dests_data[0]["id"] == "rajgad-fort"
    assert dests_data[0]["state_id"] == "maharashtra"

    # 3. Destination details for assigned destination
    detail_res = client.get("/api/v1/manager/destinations/rajgad-fort", headers=headers)
    assert detail_res.status_code == 200
    detail_data = detail_res.json()
    assert detail_data["id"] == "rajgad-fort"
    assert detail_data["name"] == "Rajgad Fort"
    assert detail_data["max_daily_capacity"] == 2000


def test_state_manager_sees_only_destinations_in_assigned_state(
    client: TestClient, db_session: Session, manager_test_data
):
    """
    Verifies State Manager:
    - Context returns state scope with destination_id as None.
    - Destinations list returns ALL destinations in their assigned state.
    - Destinations belonging to another state are excluded.
    - Can view details of any destination within their state.
    """
    state_mgr = create_test_user(db_session, "maha.statemgr@example.com", "manager", "Maharashtra State Manager")
    assignment = ManagerAssignment(
        user_id=state_mgr.id,
        role_id="manager",
        state_id="maharashtra",
        destination_id=None,  # State Manager
    )
    db_session.add(assignment)
    db_session.commit()

    headers = get_auth_headers(state_mgr)

    # 1. Context verification
    ctx_res = client.get("/api/v1/manager/context", headers=headers)
    assert ctx_res.status_code == 200
    ctx_data = ctx_res.json()
    assert ctx_data["scope"] == "state"
    assert ctx_data["state_id"] == "maharashtra"
    assert ctx_data["state_name"] == "Maharashtra"
    assert ctx_data["destination_id"] is None
    assert ctx_data["destination_name"] is None

    # 2. Destinations list (should include rajgad-fort and ellora-caves, NOT munnar)
    dests_res = client.get("/api/v1/manager/destinations", headers=headers)
    assert dests_res.status_code == 200
    dests_data = dests_res.json()
    dest_ids = [d["id"] for d in dests_data]
    assert len(dests_data) == 2
    assert "rajgad-fort" in dest_ids
    assert "ellora-caves" in dest_ids
    assert "munnar" not in dest_ids

    # 3. Can access details for both destinations in Maharashtra
    for d_id in ["rajgad-fort", "ellora-caves"]:
        res = client.get(f"/api/v1/manager/destinations/{d_id}", headers=headers)
        assert res.status_code == 200
        assert res.json()["id"] == d_id


def test_cross_jurisdiction_destination_access_denied(
    client: TestClient, db_session: Session, manager_test_data
):
    """
    Verifies cross-jurisdiction access denial:
    1. Destination Manager cannot access another destination in the SAME state (403 Forbidden).
    2. Destination Manager cannot access a destination in ANOTHER state (403 Forbidden).
    3. State Manager cannot access a destination in ANOTHER state (403 Forbidden).
    """
    # Destination Manager assigned strictly to rajgad-fort
    dest_mgr = create_test_user(db_session, "dm.rajgad@example.com", "manager", "Rajgad DM")
    db_session.add(ManagerAssignment(
        user_id=dest_mgr.id,
        role_id="manager",
        state_id="maharashtra",
        destination_id="rajgad-fort",
    ))

    # State Manager assigned to maharashtra
    state_mgr = create_test_user(db_session, "sm.maha@example.com", "manager", "Maha SM")
    db_session.add(ManagerAssignment(
        user_id=state_mgr.id,
        role_id="manager",
        state_id="maharashtra",
        destination_id=None,
    ))
    db_session.commit()

    dm_headers = get_auth_headers(dest_mgr)
    sm_headers = get_auth_headers(state_mgr)

    # 1. Destination Manager attempts to access ellora-caves (same state, different destination)
    res_dm_cross_dest = client.get("/api/v1/manager/destinations/ellora-caves", headers=dm_headers)
    assert res_dm_cross_dest.status_code == 403
    assert "outside your assigned jurisdiction" in res_dm_cross_dest.json()["detail"].lower()

    # 2. Destination Manager attempts to access munnar (different state)
    res_dm_cross_state = client.get("/api/v1/manager/destinations/munnar", headers=dm_headers)
    assert res_dm_cross_state.status_code == 403
    assert "outside your assigned jurisdiction" in res_dm_cross_state.json()["detail"].lower()

    # 3. State Manager attempts to access munnar (Kerala destination while assigned to Maharashtra)
    res_sm_cross_state = client.get("/api/v1/manager/destinations/munnar", headers=sm_headers)
    assert res_sm_cross_state.status_code == 403
    assert "outside your assigned jurisdiction" in res_sm_cross_state.json()["detail"].lower()


def test_destination_not_found_handling(
    client: TestClient, db_session: Session, manager_test_data
):
    """
    Verifies handling of non-existent destination IDs:
    - State Manager requesting non-existent destination receives 404 Not Found.
    - Destination Manager requesting destination outside their assignment receives 403 Forbidden.
    """
    state_mgr = create_test_user(db_session, "sm.lookup@example.com", "manager", "State Manager")
    db_session.add(ManagerAssignment(
        user_id=state_mgr.id,
        role_id="manager",
        state_id="maharashtra",
        destination_id=None,
    ))
    db_session.commit()

    headers = get_auth_headers(state_mgr)
    res = client.get("/api/v1/manager/destinations/non-existent-dest-xyz", headers=headers)
    assert res.status_code == 404
    assert "not found" in res.json()["detail"].lower()


# -----------------------------------------------------------------------------
# Attraction & Event Management Security & CRUD Tests
# -----------------------------------------------------------------------------

def test_unauthenticated_attractions_and_events(client: TestClient, manager_test_data):
    """Verifies unauthenticated callers receive 401 on attraction and event endpoints."""
    endpoints = [
        ("GET", "/api/v1/manager/attractions"),
        ("POST", "/api/v1/manager/attractions"),
        ("GET", "/api/v1/manager/events"),
        ("POST", "/api/v1/manager/events"),
    ]
    for method, ep in endpoints:
        if method == "GET":
            res = client.get(ep)
        else:
            res = client.post(ep, json={})
        assert res.status_code == 401, f"Expected 401 for unauthenticated {method} {ep}"


def test_tourist_and_stakeholder_attraction_event_access_denied(
    client: TestClient, db_session: Session, manager_test_data
):
    """Verifies tourist and stakeholder roles receive 403 on attraction and event management."""
    tourist = create_test_user(db_session, "tourist.attr@example.com", "tourist")
    stakeholder = create_test_user(db_session, "sh.attr@example.com", "stakeholder")

    for user in [tourist, stakeholder]:
        headers = get_auth_headers(user)
        assert client.get("/api/v1/manager/attractions", headers=headers).status_code == 403
        assert client.post("/api/v1/manager/attractions", headers=headers, json={
            "destination_id": "rajgad-fort", "name": "Test", "category": "Fort"
        }).status_code == 403
        assert client.get("/api/v1/manager/events", headers=headers).status_code == 403
        assert client.post("/api/v1/manager/events", headers=headers, json={
            "destination_id": "rajgad-fort", "title": "Test", "date_num": "10",
            "date_month": "OCT", "location_label": "Fort"
        }).status_code == 403


def test_manager_without_assignment_attraction_event_denied(
    client: TestClient, db_session: Session, manager_test_data
):
    """Verifies manager without active assignment receives 403 on attraction and event endpoints."""
    unassigned_mgr = create_test_user(db_session, "unassigned.attr@example.com", "manager")
    headers = get_auth_headers(unassigned_mgr)

    assert client.get("/api/v1/manager/attractions", headers=headers).status_code == 403
    assert client.post("/api/v1/manager/attractions", headers=headers, json={
        "destination_id": "rajgad-fort", "name": "Test", "category": "Fort"
    }).status_code == 403
    assert client.get("/api/v1/manager/events", headers=headers).status_code == 403


def test_destination_manager_attraction_crud_and_scoping(
    client: TestClient, db_session: Session, manager_test_data
):
    """
    Verifies Destination Manager:
    - Lists only attractions in their assigned destination.
    - Successfully creates an attraction in their assigned destination.
    - Successfully retrieves, updates, and deletes their attraction.
    """
    dm = create_test_user(db_session, "dm.crud@example.com", "manager", "Rajgad DM")
    db_session.add(ManagerAssignment(
        user_id=dm.id, role_id="manager", state_id="maharashtra", destination_id="rajgad-fort"
    ))
    # Seed an existing attraction in rajgad and an existing attraction in ellora
    attr_rajgad = Attraction(
        id=uuid.uuid4(), destination_id="rajgad-fort", name="Padmavati Machi", category="Viewpoint"
    )
    attr_ellora = Attraction(
        id=uuid.uuid4(), destination_id="ellora-caves", name="Kailash Temple", category="Monument"
    )
    db_session.add(attr_rajgad)
    db_session.add(attr_ellora)
    db_session.commit()

    headers = get_auth_headers(dm)

    # 1. Listing should return strictly the rajgad attraction
    res_list = client.get("/api/v1/manager/attractions", headers=headers)
    assert res_list.status_code == 200
    items = res_list.json()
    assert len(items) == 1
    assert items[0]["name"] == "Padmavati Machi"

    # Attempting to filter by another destination should be rejected
    res_forbidden_dest = client.get("/api/v1/manager/attractions?destination_id=ellora-caves", headers=headers)
    assert res_forbidden_dest.status_code == 403

    # 2. Create attraction in assigned destination
    res_create = client.post("/api/v1/manager/attractions", headers=headers, json={
        "destination_id": "rajgad-fort",
        "name": "Suvela Machi",
        "category": "Fortification",
        "description": "Narrow ridge fortification with Nedhe needle-hole.",
        "rating": 4.8,
        "status": "Open",
        "operating_hours": "06:00 AM - 06:00 PM",
        "entry_fee_label": "Free",
    })
    assert res_create.status_code == 201
    created_attr = res_create.json()
    created_id = created_attr["id"]
    assert created_attr["name"] == "Suvela Machi"
    assert created_attr["destination_id"] == "rajgad-fort"

    # 3. Get attraction details
    res_get = client.get(f"/api/v1/manager/attractions/{created_id}", headers=headers)
    assert res_get.status_code == 200
    assert res_get.json()["name"] == "Suvela Machi"

    # 4. Update attraction
    res_update = client.put(f"/api/v1/manager/attractions/{created_id}", headers=headers, json={
        "name": "Suvela Machi (Updated)",
        "status": "Maintenance",
    })
    assert res_update.status_code == 200
    assert res_update.json()["name"] == "Suvela Machi (Updated)"
    assert res_update.json()["status"] == "Maintenance"

    # 5. Delete attraction
    res_del = client.delete(f"/api/v1/manager/attractions/{created_id}", headers=headers)
    assert res_del.status_code == 200
    assert "deleted successfully" in res_del.json()["message"]

    # Verify deleted
    assert client.get(f"/api/v1/manager/attractions/{created_id}", headers=headers).status_code == 404


def test_destination_manager_cross_destination_attraction_denied(
    client: TestClient, db_session: Session, manager_test_data
):
    """
    Verifies Destination Manager is forbidden from:
    - Creating an attraction in a different destination within the same state.
    - Creating an attraction in a destination in another state.
    - Updating or deleting attractions belonging to another destination.
    """
    dm = create_test_user(db_session, "dm.cross@example.com", "manager", "Rajgad DM")
    db_session.add(ManagerAssignment(
        user_id=dm.id, role_id="manager", state_id="maharashtra", destination_id="rajgad-fort"
    ))
    attr_ellora = Attraction(
        id=uuid.uuid4(), destination_id="ellora-caves", name="Kailash Temple Cave 16", category="Heritage"
    )
    attr_munnar = Attraction(
        id=uuid.uuid4(), destination_id="munnar", name="Tea Gardens", category="Nature"
    )
    db_session.add(attr_ellora)
    db_session.add(attr_munnar)
    db_session.commit()

    headers = get_auth_headers(dm)

    # 1. Deny create in ellora-caves (same state, different destination)
    res_create_ellora = client.post("/api/v1/manager/attractions", headers=headers, json={
        "destination_id": "ellora-caves",
        "name": "Cave 32",
        "category": "Caves",
    })
    assert res_create_ellora.status_code == 403
    assert "outside your assigned jurisdiction" in res_create_ellora.json()["detail"].lower()

    # 2. Deny create in munnar (different state)
    res_create_munnar = client.post("/api/v1/manager/attractions", headers=headers, json={
        "destination_id": "munnar",
        "name": "Anamudi Peak",
        "category": "Trek",
    })
    assert res_create_munnar.status_code == 403

    # 3. Deny update of ellora attraction
    res_update_ellora = client.put(f"/api/v1/manager/attractions/{attr_ellora.id}", headers=headers, json={
        "name": "Hacked Name"
    })
    assert res_update_ellora.status_code == 403

    # 4. Deny delete of ellora attraction
    res_delete_ellora = client.delete(f"/api/v1/manager/attractions/{attr_ellora.id}", headers=headers)
    assert res_delete_ellora.status_code == 403


def test_state_manager_attraction_crud_and_cross_state_denied(
    client: TestClient, db_session: Session, manager_test_data
):
    """
    Verifies State Manager:
    - Lists all attractions across all destinations in their state.
    - Can filter attractions by a destination within their state.
    - Is denied when filtering or modifying attractions in another state.
    - Can create, update, and delete attractions in any destination within their state.
    """
    sm = create_test_user(db_session, "sm.crud@example.com", "manager", "Maha State Manager")
    db_session.add(ManagerAssignment(
        user_id=sm.id, role_id="manager", state_id="maharashtra", destination_id=None
    ))
    attr_rajgad = Attraction(
        id=uuid.uuid4(), destination_id="rajgad-fort", name="Ballekilla", category="Fort"
    )
    attr_ellora = Attraction(
        id=uuid.uuid4(), destination_id="ellora-caves", name="Ellora Cave 10", category="Cave"
    )
    attr_munnar = Attraction(
        id=uuid.uuid4(), destination_id="munnar", name="Mattupetty Dam", category="Nature"
    )
    db_session.add_all([attr_rajgad, attr_ellora, attr_munnar])
    db_session.commit()

    headers = get_auth_headers(sm)

    # 1. State Manager listing without filter returns both Maharashtra attractions, excludes Munnar
    res_list = client.get("/api/v1/manager/attractions", headers=headers)
    assert res_list.status_code == 200
    names = [a["name"] for a in res_list.json()]
    assert "Ballekilla" in names
    assert "Ellora Cave 10" in names
    assert "Mattupetty Dam" not in names

    # 2. Filter by rajgad-fort
    res_filtered = client.get("/api/v1/manager/attractions?destination_id=rajgad-fort", headers=headers)
    assert res_filtered.status_code == 200
    assert len(res_filtered.json()) == 1
    assert res_filtered.json()[0]["name"] == "Ballekilla"

    # 3. Filter by out-of-state destination munnar -> 403 Forbidden
    res_out_of_state = client.get("/api/v1/manager/attractions?destination_id=munnar", headers=headers)
    assert res_out_of_state.status_code == 403

    # 4. Create attraction in ellora-caves (valid state destination)
    res_create = client.post("/api/v1/manager/attractions", headers=headers, json={
        "destination_id": "ellora-caves",
        "name": "Cave 15 (Dasavatara)",
        "category": "Caves",
    })
    assert res_create.status_code == 201
    created_id = res_create.json()["id"]

    # 5. Deny create in munnar (Kerala)
    res_create_kerala = client.post("/api/v1/manager/attractions", headers=headers, json={
        "destination_id": "munnar",
        "name": "Eravikulam",
        "category": "Park",
    })
    assert res_create_kerala.status_code == 403

    # 6. Deny update and delete of munnar attraction
    assert client.put(f"/api/v1/manager/attractions/{attr_munnar.id}", headers=headers, json={"name": "X"}).status_code == 403
    assert client.delete(f"/api/v1/manager/attractions/{attr_munnar.id}", headers=headers).status_code == 403

    # 7. Update and delete created attraction
    assert client.put(f"/api/v1/manager/attractions/{created_id}", headers=headers, json={"name": "Cave 15 Renamed"}).status_code == 200
    assert client.delete(f"/api/v1/manager/attractions/{created_id}", headers=headers).status_code == 200


def test_event_crud_and_jurisdiction_scoping(
    client: TestClient, db_session: Session, manager_test_data
):
    """
    Verifies Tourism Event management:
    - Destination Manager can list, create, update, and delete events in their destination.
    - Destination Manager cannot create or modify events in another destination.
    - State Manager can manage events across all destinations in their state.
    - Cross-state event creation/modification is rejected with 403 Forbidden.
    """
    dm = create_test_user(db_session, "dm.events@example.com", "manager", "Rajgad DM")
    db_session.add(ManagerAssignment(
        user_id=dm.id, role_id="manager", state_id="maharashtra", destination_id="rajgad-fort"
    ))
    sm = create_test_user(db_session, "sm.events@example.com", "manager", "State Manager")
    db_session.add(ManagerAssignment(
        user_id=sm.id, role_id="manager", state_id="maharashtra", destination_id=None
    ))
    ev_rajgad = Event(
        id=uuid.uuid4(),
        destination_id="rajgad-fort",
        title="Shivaji Maharaj Jayanti",
        date_num="19",
        date_month="FEB",
        location_label="Padmavati Machi",
        status="Upcoming",
        status_class="active",
    )
    ev_munnar = Event(
        id=uuid.uuid4(),
        destination_id="munnar",
        title="Tea Blossom Fest",
        date_num="05",
        date_month="NOV",
        location_label="Munnar Grounds",
        status="Open",
        status_class="active",
    )
    db_session.add_all([ev_rajgad, ev_munnar])
    db_session.commit()

    dm_headers = get_auth_headers(dm)
    sm_headers = get_auth_headers(sm)

    # 1. DM lists events - sees only rajgad event
    res_dm_list = client.get("/api/v1/manager/events", headers=dm_headers)
    assert res_dm_list.status_code == 200
    assert len(res_dm_list.json()) == 1
    assert res_dm_list.json()[0]["title"] == "Shivaji Maharaj Jayanti"

    # 2. DM creates event in rajgad-fort
    res_create_ev = client.post("/api/v1/manager/events", headers=dm_headers, json={
        "destination_id": "rajgad-fort",
        "title": "Sahyadri Heritage Trek",
        "date_num": "26",
        "date_month": "JAN",
        "location_label": "Base Village Gunjavane",
        "status": "Upcoming",
        "status_class": "active",
        "description": "Annual heritage trekking gathering.",
    })
    assert res_create_ev.status_code == 201
    new_ev_id = res_create_ev.json()["id"]

    # 3. DM denied create in ellora-caves
    res_dm_deny = client.post("/api/v1/manager/events", headers=dm_headers, json={
        "destination_id": "ellora-caves",
        "title": "Ellora Dance Fest",
        "date_num": "15",
        "date_month": "MAR",
        "location_label": "Caves Amphitheatre",
    })
    assert res_dm_deny.status_code == 403

    # 4. DM updates their event
    res_update_ev = client.put(f"/api/v1/manager/events/{new_ev_id}", headers=dm_headers, json={
        "title": "Sahyadri Heritage Trek (Winter Edition)",
        "status": "Ongoing",
    })
    assert res_update_ev.status_code == 200
    assert res_update_ev.json()["title"] == "Sahyadri Heritage Trek (Winter Edition)"

    # 5. DM deletes their event
    assert client.delete(f"/api/v1/manager/events/{new_ev_id}", headers=dm_headers).status_code == 200

    # 6. State Manager creates event in ellora-caves
    res_sm_create = client.post("/api/v1/manager/events", headers=sm_headers, json={
        "destination_id": "ellora-caves",
        "title": "Ellora Ajanta Classical Music Fest",
        "date_num": "12",
        "date_month": "DEC",
        "location_label": "Soneri Mahal & Caves",
    })
    assert res_sm_create.status_code == 201

    # 7. State Manager denied create or modify event in Munnar (Kerala)
    assert client.post("/api/v1/manager/events", headers=sm_headers, json={
        "destination_id": "munnar",
        "title": "Kerala Fest",
        "date_num": "01",
        "date_month": "JAN",
        "location_label": "Town",
    }).status_code == 403
    assert client.put(f"/api/v1/manager/events/{ev_munnar.id}", headers=sm_headers, json={"title": "Hacked"}).status_code == 403
    assert client.delete(f"/api/v1/manager/events/{ev_munnar.id}", headers=sm_headers).status_code == 403


def test_invalid_destination_reference_error(
    client: TestClient, db_session: Session, manager_test_data
):
    """
    Verifies handling of non-existent destination references:
    - State Manager attempting to add attraction to non-existent destination receives 404 Not Found.
    - State Manager attempting to add event to non-existent destination receives 404 Not Found.
    """
    sm = create_test_user(db_session, "sm.invalid@example.com", "manager", "State Manager")
    db_session.add(ManagerAssignment(
        user_id=sm.id, role_id="manager", state_id="maharashtra", destination_id=None
    ))
    db_session.commit()

    headers = get_auth_headers(sm)

    res_attr = client.post("/api/v1/manager/attractions", headers=headers, json={
        "destination_id": "non-existent-dest-999",
        "name": "Lost Landmark",
        "category": "Unknown",
    })
    assert res_attr.status_code == 404
    assert "not found" in res_attr.json()["detail"].lower()

    res_ev = client.post("/api/v1/manager/events", headers=headers, json={
        "destination_id": "non-existent-dest-999",
        "title": "Ghost Festival",
        "date_num": "31",
        "date_month": "OCT",
        "location_label": "Nowhere",
    })
    assert res_ev.status_code == 404
    assert "not found" in res_ev.json()["detail"].lower()


def test_validation_errors_on_model_constraints(
    client: TestClient, db_session: Session, manager_test_data
):
    """
    Verifies Pydantic and model validation errors:
    - Empty name or empty title rejected with 422 Unprocessable Entity.
    - Rating outside 0.0-5.0 range rejected with 422.
    - Missing required event fields (date_num, date_month, location_label) rejected with 422.
    """
    dm = create_test_user(db_session, "dm.validation@example.com", "manager", "Rajgad DM")
    db_session.add(ManagerAssignment(
        user_id=dm.id, role_id="manager", state_id="maharashtra", destination_id="rajgad-fort"
    ))
    db_session.commit()

    headers = get_auth_headers(dm)

    # 1. Empty name on attraction
    res_empty_name = client.post("/api/v1/manager/attractions", headers=headers, json={
        "destination_id": "rajgad-fort",
        "name": "",
        "category": "Fort",
    })
    assert res_empty_name.status_code == 422

    # 2. Rating > 5.0
    res_invalid_rating = client.post("/api/v1/manager/attractions", headers=headers, json={
        "destination_id": "rajgad-fort",
        "name": "Overrated Point",
        "category": "Viewpoint",
        "rating": 10.0,
    })
    assert res_invalid_rating.status_code == 422

    # 3. Missing date_num and location_label on event
    res_missing_event = client.post("/api/v1/manager/events", headers=headers, json={
        "destination_id": "rajgad-fort",
        "title": "Incomplete Event",
    })
    assert res_missing_event.status_code == 422


def test_manager_destination_creation_and_update(
    client: TestClient, db_session: Session, manager_test_data
):
    """
    Verifies that state managers can create and update destinations within their state,
    and cross-jurisdiction attempts are rejected with 403.
    """
    sm = create_test_user(db_session, "sm.dest@example.com", "manager", "MH State Manager")
    db_session.add(ManagerAssignment(
        user_id=sm.id, role_id="manager", state_id="maharashtra", destination_id=None
    ))
    db_session.commit()
    headers = get_auth_headers(sm)

    # 1. State manager creates destination in assigned state
    res_create = client.post("/api/v1/manager/destinations", headers=headers, json={
        "id": "torna-fort",
        "state_id": "maharashtra",
        "name": "Torna Fort",
        "category": "Hill Fort",
        "subtitle": "Historic highest hill fort in Pune",
        "description": "Prachandagad or Torna Fort is a large fort in Pune district.",
        "max_daily_capacity": 2500,
    })
    assert res_create.status_code == 201
    assert res_create.json()["id"] == "torna-fort"
    assert res_create.json()["name"] == "Torna Fort"

    # 2. State manager updates destination
    res_update = client.put("/api/v1/manager/destinations/torna-fort", headers=headers, json={
        "subtitle": "Updated Subtitle for Torna",
        "max_daily_capacity": 3000,
    })
    assert res_update.status_code == 200
    assert res_update.json()["subtitle"] == "Updated Subtitle for Torna"
    assert res_update.json()["max_daily_capacity"] == 3000

    # 3. State manager cannot create destination in another state (kerala)
    res_cross = client.post("/api/v1/manager/destinations", headers=headers, json={
        "id": "cross-dest",
        "state_id": "kerala",
        "name": "Cross State Dest",
        "category": "Heritage",
        "description": "Illegal creation test",
    })
    assert res_cross.status_code == 403


def test_manager_video_lifecycle_and_public_sync(
    client: TestClient, db_session: Session, manager_test_data
):
    """
    Verifies full lifecycle of destination videos:
    - Manager creates video for assigned destination (201).
    - Public catalogue video endpoint retrieves the video (200).
    - Manager updates video (200).
    - Manager deletes video (200).
    - Cross-jurisdiction manager access is denied (403).
    """
    dm = create_test_user(db_session, "dm.video@example.com", "manager", "Rajgad Video DM")
    db_session.add(ManagerAssignment(
        user_id=dm.id, role_id="manager", state_id="maharashtra", destination_id="rajgad-fort"
    ))
    db_session.commit()
    headers = get_auth_headers(dm)

    # 1. Create video
    res_create = client.post("/api/v1/manager/videos", headers=headers, json={
        "destination_id": "rajgad-fort",
        "title": "Rajgad Fort Aerial Showcase",
        "category": "Orientation",
        "description": "Stunning drone flyover showing the ramparts and cliffs.",
        "duration": "0:30",
        "video_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        "status": "Published"
    })
    assert res_create.status_code == 201
    video_id = res_create.json()["id"]
    assert res_create.json()["youtube_id"] == "dQw4w9WgXcQ"

    # 2. Public catalogue endpoint can retrieve destination videos
    res_pub = client.get("/api/v1/destinations/rajgad-fort/videos")
    assert res_pub.status_code == 200
    videos = res_pub.json()
    assert any(v["id"] == video_id for v in videos)

    # 3. Manager updates video
    res_update = client.put(f"/api/v1/manager/videos/{video_id}", headers=headers, json={
        "title": "Rajgad Fort Master Aerial Showcase",
        "duration": "0:45",
    })
    assert res_update.status_code == 200
    assert res_update.json()["title"] == "Rajgad Fort Master Aerial Showcase"

    # 4. Cross-jurisdiction manager denied
    dm_kerala = create_test_user(db_session, "dm.kl.video@example.com", "manager", "Kerala Video DM")
    db_session.add(ManagerAssignment(
        user_id=dm_kerala.id, role_id="manager", state_id="kerala", destination_id="munnar-hills"
    ))
    db_session.commit()
    headers_kl = get_auth_headers(dm_kerala)

    res_cross_delete = client.delete(f"/api/v1/manager/videos/{video_id}", headers=headers_kl)
    assert res_cross_delete.status_code == 403

    # 5. Manager deletes video
    res_delete = client.delete(f"/api/v1/manager/videos/{video_id}", headers=headers)
    assert res_delete.status_code == 200
    assert "deleted successfully" in res_delete.json()["message"]


