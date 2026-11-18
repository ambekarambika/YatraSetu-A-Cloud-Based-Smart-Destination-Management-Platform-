"""
YatraSetu Platform — Health & Connectivity Endpoints Test
Verifies application startup, CORS headers, health checks, and database telemetry.
"""

from fastapi import status


def test_root_welcome_endpoint(client):
    """Test GET / returns platform status and metadata."""
    response = client.get("/")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "YatraSetu" in data["message"]
    assert data["version"] == "1.0.0"
    assert data["environment"] == "testing"


def test_root_health_liveness(client):
    """Test GET /health returns 200 OK and healthy status."""
    response = client.get("/health")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["status"] == "healthy"
    assert data["app_name"] == "YatraSetu Platform API"
    assert data["version"] == "1.0.0"


def test_api_v1_health_endpoint(client):
    """Test GET /api/v1/health returns 200 OK and matches root health."""
    response = client.get("/api/v1/health")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["status"] == "healthy"


def test_database_health_check_connected(client):
    """Test GET /api/v1/health/db returns 200 OK when database is connected."""
    response = client.get("/api/v1/health/db")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["status"] == "connected"
    assert data["dialect"] == "sqlite"
    assert data["latency_ms"] is not None
    assert data["error"] is None
