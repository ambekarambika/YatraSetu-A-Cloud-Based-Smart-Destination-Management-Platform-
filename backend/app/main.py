"""
YatraSetu Platform — FastAPI Application Entrypoint
Configures CORS middleware, API v1 routing, and root system diagnostics.
"""

from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.api.v1.api import api_router
from app.api.v1.endpoints.health import get_health, get_database_health
from app.schemas.health import HealthResponse, DatabaseHealthResponse

# Initialize FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="YatraSetu Smart Destination Management Platform — Backend API Foundation",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    openapi_url="/openapi.json" if settings.DEBUG else None,
)

# Configure Cross-Origin Resource Sharing (CORS) for frontend interaction
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root-level health probes (standard for Render / Cloud monitoring)
@app.get("/", tags=["System & Health"], summary="Platform Status")
def root_welcome():
    """Welcome and platform metadata endpoint."""
    return {
        "message": "Welcome to YatraSetu Smart Destination Management Platform API",
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "docs": "/docs" if settings.DEBUG else "disabled",
    }


@app.get(
    "/health",
    response_model=HealthResponse,
    status_code=status.HTTP_200_OK,
    tags=["System & Health"],
    summary="Root Liveness Probe",
)
def root_health():
    """Liveness probe delegating to health endpoint."""
    return get_health()


# Include central API v1 routes
app.include_router(api_router, prefix=settings.API_V1_STR)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
    )
