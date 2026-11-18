"""
YatraSetu Platform — Health & Connectivity Endpoints
Provides system readiness, liveness, and database connection telemetry.
"""

from fastapi import APIRouter, status, Response
from app.config import settings
from app.database import check_database_connection
from app.schemas.health import HealthResponse, DatabaseHealthResponse

router = APIRouter()


@router.get(
    "/health",
    response_model=HealthResponse,
    status_code=status.HTTP_200_OK,
    summary="Application Health & Liveness",
    description="Returns the operational status, version, and environment of the YatraSetu API.",
)
def get_health() -> HealthResponse:
    """Return application liveness information."""
    return HealthResponse(
        status="healthy",
        app_name=settings.APP_NAME,
        version=settings.APP_VERSION,
        environment=settings.ENVIRONMENT,
    )


@router.get(
    "/health/db",
    response_model=DatabaseHealthResponse,
    status_code=status.HTTP_200_OK,
    summary="Database Connectivity & Latency Check",
    description="Executes a ping query (SELECT 1) against the configured database to verify connectivity and measure latency.",
)
def get_database_health(response: Response) -> DatabaseHealthResponse:
    """Ping configured database engine and return connectivity diagnostics."""
    db_status = check_database_connection()
    if db_status["status"] != "connected":
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE

    return DatabaseHealthResponse(
        status=db_status["status"],
        dialect=db_status["dialect"],
        latency_ms=db_status["latency_ms"],
        error=db_status["error"],
    )
