"""
YatraSetu Platform — Health & Telemetry Schemas
Pydantic validation schemas for health checks and database connectivity telemetry.
"""

from typing import Optional
from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    """General application status and version information."""
    status: str = Field("healthy", description="Application health status")
    app_name: str = Field(..., description="Application name")
    version: str = Field(..., description="API version")
    environment: str = Field(..., description="Deployment environment")


class DatabaseHealthResponse(BaseModel):
    """Database connectivity and latency check."""
    status: str = Field(..., description="Database connection status: 'connected' or 'disconnected'")
    dialect: str = Field(..., description="Database dialect (e.g. postgresql, sqlite)")
    latency_ms: Optional[float] = Field(None, description="Round-trip query latency in milliseconds")
    error: Optional[str] = Field(None, description="Error message if connectivity failed")
