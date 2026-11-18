"""
YatraSetu Platform — Database Engine and Session Management
Configures SQLAlchemy 2.0 engine, SessionLocal, declarative Base, and dependency injection.
"""

import time
from typing import Generator, Dict, Any
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from sqlalchemy.pool import StaticPool

from app.config import settings

# Normalize PostgreSQL URL if needed (e.g. Render / Heroku postgres:// -> postgresql://)
db_url = settings.DATABASE_URL
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

# Configure engine parameters based on database dialect
if settings.is_sqlite:
    # SQLite in-memory or file engine for local testing
    engine = create_engine(
        db_url if db_url else "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool if (not db_url or db_url == "sqlite:///:memory:") else None,
        echo=settings.DEBUG and settings.ENVIRONMENT == "development",
    )
else:
    # Production / Staging PostgreSQL (Neon) with connection pooling and keep-alive
    engine = create_engine(
        db_url,
        pool_size=settings.DB_POOL_SIZE,
        max_overflow=settings.DB_MAX_OVERFLOW,
        pool_timeout=settings.DB_POOL_TIMEOUT,
        pool_recycle=settings.DB_POOL_RECYCLE,
        pool_pre_ping=True,  # Proactively verifies connections before handing them to requests
        echo=settings.DEBUG and settings.ENVIRONMENT == "development",
    )

# Session factory bound to engine
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Declarative base for all SQLAlchemy ORM models
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency that provides a transactional database session per request.
    Automatically closes session upon request completion or failure.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def check_database_connection() -> Dict[str, Any]:
    """
    Verifies database connectivity and returns latency and dialect details.
    Used by /health/db endpoint and startup checks.
    """
    start_time = time.time()
    try:
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1"))
            result.fetchone()
        latency_ms = round((time.time() - start_time) * 1000, 2)
        return {
            "status": "connected",
            "dialect": engine.dialect.name,
            "latency_ms": latency_ms,
            "error": None,
        }
    except Exception as exc:
        latency_ms = round((time.time() - start_time) * 1000, 2)
        return {
            "status": "disconnected",
            "dialect": engine.dialect.name if hasattr(engine, "dialect") else "unknown",
            "latency_ms": latency_ms,
            "error": str(exc),
        }
