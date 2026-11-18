"""
YatraSetu Platform — Core Application Configuration
Loads configuration securely from environment variables / .env file.
"""

import os
from typing import List
from dotenv import load_dotenv

# Load .env file from backend directory if present
load_dotenv()


class Settings:
    """Application Settings and Environment Variable Parser."""

    # General Settings
    APP_NAME: str = os.getenv("APP_NAME", "YatraSetu Platform API")
    APP_VERSION: str = os.getenv("APP_VERSION", "1.0.0")
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEBUG: bool = os.getenv("DEBUG", "True").lower() in ("true", "1", "yes")
    API_V1_STR: str = os.getenv("API_V1_STR", "/api/v1")

    # Host & Port
    HOST: str = os.getenv("HOST", "127.0.0.1")
    PORT: int = int(os.getenv("PORT", "8000"))

    # CORS Origins (comma-separated string parsed into list)
    _raw_cors: str = os.getenv(
        "CORS_ORIGINS",
        "http://localhost:8080,http://127.0.0.1:8080,http://localhost:3000,http://127.0.0.1:3000",
    )
    CORS_ORIGINS: List[str] = [
        origin.strip() for origin in _raw_cors.split(",") if origin.strip()
    ]

    # Database Settings
    # Defaults to in-memory SQLite if no DATABASE_URL is set (allows testing without live Neon DB)
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")

    DB_POOL_SIZE: int = int(os.getenv("DB_POOL_SIZE", "10"))
    DB_MAX_OVERFLOW: int = int(os.getenv("DB_MAX_OVERFLOW", "20"))
    DB_POOL_TIMEOUT: int = int(os.getenv("DB_POOL_TIMEOUT", "30"))
    DB_POOL_RECYCLE: int = int(os.getenv("DB_POOL_RECYCLE", "1800"))

    # Security & Auth Settings (Phase 2 Prep)
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "insecure_dev_secret_change_in_production")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
    REFRESH_TOKEN_EXPIRE_DAYS: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))

    @property
    def is_sqlite(self) -> bool:
        """Check if active database connection is SQLite (e.g. during local tests)."""
        return not self.DATABASE_URL or self.DATABASE_URL.startswith("sqlite")


# Global singleton settings instance
settings = Settings()
