"""
YatraSetu Platform — Public Catalogue Read-Only Unit Test Suite
Validates:
1. Public unauthenticated read access to states, destinations, attractions, experiences, events, circuits.
2. Filtering, search, and pagination on catalogue endpoints.
3. 404 Not Found handling for non-existent entities.
4. Protection against unauthorized mutation (POST/PUT/DELETE return 405 Method Not Allowed).
5. Clean handling of empty catalogue tables.
"""

import uuid
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.destination import (
    State,
    Destination,
    Attraction,
    Experience,
    Event,
    CuratedCircuit,
    CuratedCircuitItem,
)


@pytest.fixture
def catalogue_test_data(db_session: Session):
    """Seed test data for catalogue tests in SQLite test database."""
    # 1. State
    state = State(
        id="maharashtra",
        name="Maharashtra",
        theme_code="maharashtra",
        badge_label="MAHARASHTRA",
        tagline="Maharashtra Tourism",
        description="Heritage and culture",
        hero_image_url="https://example.com/mh.jpg",
    )
    db_session.add(state)

    # 2. Destination
    dest = Destination(
        id="rajgad-fort",
        state_id="maharashtra",
        name="Rajgad Fort",
        category="Fort",
        subtitle="King of Forts",
        location_label="Velhe, Pune District",
        description="Historical Maratha fort and sovereign capital.",
        hero_image_url="https://example.com/rajgad.jpg",
        banner_image="https://example.com/rajgad_banner.jpg",
        ideal_duration="1 Day",
        best_time="October to March",
        max_daily_capacity=1500,
        latitude=18.2570,
        longitude=73.6820,
        metadata_json={"altitude_m": 1376},
    )
    db_session.add(dest)

    # 3. Attraction
    attraction = Attraction(
        id=uuid.uuid4(),
        destination_id="rajgad-fort",
        name="Padmavati Machi",
        category="Plateau & Monument",
        description="Expansive plateau hosting historic temple.",
        image_url="https://example.com/padmavati.jpg",
        rating=4.8,
        status="Open",
        operating_hours="06:00 - 18:00",
        entry_fee_label="Free Entry",
    )
    db_session.add(attraction)

    # 4. Experience
    exp = Experience(
        id="exp-rajgad-citadel-trek",
        destination_id="rajgad-fort",
        title="Balekilla Royal Citadel Climb",
        category="Trek",
        category_label="Heritage Trek",
        location_label="Rajgad Balekilla",
        duration="4 Hours",
        difficulty="Challenging",
        season="Monsoon & Winter",
        guide_requirement="Mandatory",
        image_url="https://example.com/balekilla.jpg",
        description="Technical rock-cut stairway ascent to Balekilla peak.",
    )
    db_session.add(exp)

    # 5. Event
    event = Event(
        id=uuid.uuid4(),
        destination_id="rajgad-fort",
        title="Shiv Jayanti Fortress Gathering",
        date_num="19",
        date_month="FEB",
        location_label="Rajgad Citadel",
        status="Open",
        status_class="active",
        image_url="https://example.com/shivjayanti.jpg",
        description="Annual coronation festival at the Padmavati complex.",
    )
    db_session.add(event)

    # 6. Circuit
    circuit = CuratedCircuit(
        id="maratha-fort-trail",
        state_id="maharashtra",
        name="Maratha Fort & Western Ghats Trail",
        description="3-day journey across ancient hill forts.",
        duration_label="3 Days / 2 Nights",
        hero_image_url="https://example.com/trail.jpg",
    )
    db_session.add(circuit)
    db_session.flush()

    item = CuratedCircuitItem(
        id=uuid.uuid4(),
        circuit_id="maratha-fort-trail",
        destination_id="rajgad-fort",
        day_number=1,
        order_index=1,
        notes="Ascend Padmavati Machi via Chor Darwaja.",
    )
    db_session.add(item)
    db_session.commit()


def test_list_states(client: TestClient, catalogue_test_data):
    """Test public unauthenticated listing of states."""
    res = client.get("/api/v1/states")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    assert any(s["id"] == "maharashtra" for s in data)


def test_get_state_detail(client: TestClient, catalogue_test_data):
    """Test fetching a specific state by ID."""
    res = client.get("/api/v1/states/maharashtra")
    assert res.status_code == 200
    data = res.json()
    assert data["name"] == "Maharashtra"
    assert data["theme_code"] == "maharashtra"

    # Invalid state returns 404
    res_404 = client.get("/api/v1/states/nonexistent")
    assert res_404.status_code == 404


def test_list_destinations_pagination_and_filtering(client: TestClient, catalogue_test_data):
    """Test listing destinations with pagination, state_id, category, and search."""
    # List all
    res = client.get("/api/v1/destinations?limit=10&offset=0")
    assert res.status_code == 200
    data = res.json()
    assert "items" in data
    assert "total" in data
    assert data["total"] >= 1
    assert data["items"][0]["id"] == "rajgad-fort"

    # Filter by state
    res_state = client.get("/api/v1/destinations?state_id=maharashtra")
    assert res_state.status_code == 200
    assert len(res_state.json()["items"]) >= 1

    # Filter by non-existent state -> empty list, not error
    res_empty = client.get("/api/v1/destinations?state_id=nonexistent")
    assert res_empty.status_code == 200
    assert res_empty.json()["total"] == 0
    assert res_empty.json()["items"] == []

    # Search filter
    res_search = client.get("/api/v1/destinations?search=Rajgad")
    assert res_search.status_code == 200
    assert len(res_search.json()["items"]) >= 1


def test_get_destination_detail(client: TestClient, catalogue_test_data):
    """Test fetching single destination by ID/slug."""
    res = client.get("/api/v1/destinations/rajgad-fort")
    assert res.status_code == 200
    data = res.json()
    assert data["id"] == "rajgad-fort"
    assert data["name"] == "Rajgad Fort"
    assert "description" in data
    assert data["latitude"] == 18.2570

    # Non-existent destination -> 404
    res_404 = client.get("/api/v1/destinations/unknown-fort")
    assert res_404.status_code == 404


def test_list_attractions(client: TestClient, catalogue_test_data):
    """Test listing attractions for a destination."""
    res = client.get("/api/v1/attractions?destination_id=rajgad-fort")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] >= 1
    assert data["items"][0]["name"] == "Padmavati Machi"
    assert data["items"][0]["rating"] == 4.8


def test_list_and_get_experiences(client: TestClient, catalogue_test_data):
    """Test listing and single retrieval of curated experiences."""
    res_list = client.get("/api/v1/experiences?destination_id=rajgad-fort")
    assert res_list.status_code == 200
    data = res_list.json()
    assert data["total"] >= 1
    assert data["items"][0]["id"] == "exp-rajgad-citadel-trek"

    res_single = client.get("/api/v1/experiences/exp-rajgad-citadel-trek")
    assert res_single.status_code == 200
    assert res_single.json()["difficulty"] == "Challenging"

    res_404 = client.get("/api/v1/experiences/unknown-exp")
    assert res_404.status_code == 404


def test_list_events(client: TestClient, catalogue_test_data):
    """Test listing destination cultural events."""
    res = client.get("/api/v1/events?destination_id=rajgad-fort&status=Open")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] >= 1
    assert data["items"][0]["date_num"] == "19"
    assert data["items"][0]["date_month"] == "FEB"


def test_list_and_get_circuits(client: TestClient, catalogue_test_data):
    """Test multi-day tourism circuits and itinerary stops."""
    res = client.get("/api/v1/circuits?state_id=maharashtra")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] >= 1
    circuit = data["items"][0]
    assert circuit["id"] == "maratha-fort-trail"
    assert len(circuit["items"]) == 1
    assert circuit["items"][0]["destination_id"] == "rajgad-fort"
    assert circuit["items"][0]["destination_name"] == "Rajgad Fort"

    res_single = client.get("/api/v1/circuits/maratha-fort-trail")
    assert res_single.status_code == 200
    assert res_single.json()["name"] == "Maratha Fort & Western Ghats Trail"

    res_404 = client.get("/api/v1/circuits/unknown-circuit")
    assert res_404.status_code == 404


def test_no_mutation_endpoints_exposed(client: TestClient):
    """Verify that public catalogue endpoints strictly reject POST/PUT/DELETE mutations."""
    # POST to /destinations
    res_post_dest = client.post("/api/v1/destinations", json={"name": "Hacked Fort"})
    assert res_post_dest.status_code == 405  # Method Not Allowed

    # DELETE to /destinations/{id}
    res_del_dest = client.delete("/api/v1/destinations/rajgad-fort")
    assert res_del_dest.status_code == 405

    # PUT to /attractions
    res_put_attr = client.put("/api/v1/attractions", json={"name": "Hacked Attraction"})
    assert res_put_attr.status_code == 405


def test_list_destination_videos(client: TestClient, db_session: Session, catalogue_test_data):
    """Test listing curated destination videos via public catalogue endpoints."""
    from app.models.destination import DestinationVideo
    vid = DestinationVideo(
        id=uuid.uuid4(),
        destination_id="rajgad-fort",
        title="Padmavati Machi Orientation",
        category="Orientation",
        description="Orientation guide to the Machi.",
        duration="0:30",
        youtube_id="abc123xyz",
        video_url="https://www.youtube.com/watch?v=abc123xyz",
        thumbnail_url="https://example.com/thumb.jpg",
        status="Published",
    )
    db_session.add(vid)
    db_session.commit()

    # 1. GET /destinations/{destination_id}/videos
    res_dest_vids = client.get("/api/v1/destinations/rajgad-fort/videos")
    assert res_dest_vids.status_code == 200
    vids = res_dest_vids.json()
    assert len(vids) >= 1
    assert vids[0]["youtube_id"] == "abc123xyz"

    # 2. GET /videos
    res_all_vids = client.get("/api/v1/videos?destination_id=rajgad-fort")
    assert res_all_vids.status_code == 200
    all_vids = res_all_vids.json()
    assert len(all_vids) >= 1
    assert all_vids[0]["title"] == "Padmavati Machi Orientation"

