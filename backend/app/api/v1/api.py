"""
YatraSetu Platform — API v1 Router Aggregator
Combines all v1 endpoint routers into a central APIRouter.
"""

from fastapi import APIRouter
from app.api.v1.endpoints import health, auth, catalogue, manager

api_router = APIRouter()

# Core system and diagnostics
api_router.include_router(health.router, tags=["System & Health"])

# Authentication and Session Management
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication & Access"])

# Public Tourism Catalogue (Read-Only)
api_router.include_router(catalogue.router, tags=["Public Catalogue"])

# Destination Manager Workspace (Scoped Authority)
api_router.include_router(manager.router, prefix="/manager", tags=["Destination Manager"])
