"""
YatraSetu Platform — API v1 Router Aggregator
Combines all v1 endpoint routers into a central APIRouter.
"""

from fastapi import APIRouter
from app.api.v1.endpoints import health, auth, catalogue, manager, stakeholder, tourist, admin

api_router = APIRouter()

# Core system and diagnostics
api_router.include_router(health.router, tags=["System & Health"])

# Authentication and Session Management
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication & Access"])

# Public Tourism Catalogue (Read-Only)
api_router.include_router(catalogue.router, tags=["Public Catalogue"])

# Destination Manager Workspace (Scoped Authority)
api_router.include_router(manager.router, prefix="/manager", tags=["Destination Manager"])

# Tourism Stakeholder Workspace (Self-Service & Coordination)
api_router.include_router(stakeholder.router, prefix="/stakeholder", tags=["Tourism Stakeholder"])

# Tourist Companion Workspace (Discovery, Itineraries, Favorites & Reviews)
api_router.include_router(tourist.router, prefix="/tourist", tags=["Tourist Travel Companion"])

# Administrator Workspace (Platform Oversight, Accounts, Governance & Audit)
api_router.include_router(admin.router, prefix="/admin", tags=["Administrator Governance"])
