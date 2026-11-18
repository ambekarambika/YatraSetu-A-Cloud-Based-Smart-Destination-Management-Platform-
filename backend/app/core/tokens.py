"""
YatraSetu Platform — Cryptographic Token Service
Handles JWT access token creation/validation and cryptographically secure
refresh token family rotation and SHA-256 hash storage.
"""

import uuid
import hashlib
import secrets
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Tuple, Optional
import jwt
from jwt.exceptions import PyJWTError, ExpiredSignatureError, InvalidTokenError

from app.config import settings


class TokenService:
    """
    Stateless JWT and Refresh Token operations.
    """

    @classmethod
    def create_access_token(
        cls,
        user_id: uuid.UUID,
        role: str,
        expires_delta: Optional[timedelta] = None,
    ) -> Tuple[str, datetime]:
        """
        Generates short-lived signed JWT access token.
        Claims:
            sub: string representation of user UUID
            role: user platform role
            jti: unique token UUID
            iat: issued at timestamp
            exp: expiration timestamp
        """
        now = datetime.now(timezone.utc)
        if expires_delta:
            expires_at = now + expires_delta
        else:
            expires_at = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

        payload: Dict[str, Any] = {
            "sub": str(user_id),
            "role": role,
            "jti": str(uuid.uuid4()),
            "iat": int(now.timestamp()),
            "exp": int(expires_at.timestamp()),
            "iss": "yatrasetu-auth",
        }

        token = jwt.encode(
            payload,
            settings.JWT_SECRET_KEY,
            algorithm=settings.JWT_ALGORITHM,
        )
        return token, expires_at

    @classmethod
    def decode_access_token(cls, token: str) -> Dict[str, Any]:
        """
        Decodes and cryptographically verifies JWT access token.
        Raises PyJWTError subclasses on invalid signature, expiration, or format.
        """
        return jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
            issuer="yatrasetu-auth",
            options={"require": ["sub", "role", "exp", "iat"]},
        )

    @classmethod
    def generate_refresh_token(cls) -> Tuple[str, str, datetime]:
        """
        Generates a 64-byte URL-safe cryptographically random refresh token.
        Returns:
            raw_token: token string sent exclusively to client
            token_hash: SHA-256 hash stored in database
            expires_at: expiration timestamp
        """
        raw_token = secrets.token_urlsafe(64)
        token_hash = cls.hash_refresh_token(raw_token)
        expires_at = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        return raw_token, token_hash, expires_at

    @classmethod
    def hash_refresh_token(cls, raw_token: str) -> str:
        """
        Computes SHA-256 hash of refresh token string for safe database persistence.
        """
        return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
