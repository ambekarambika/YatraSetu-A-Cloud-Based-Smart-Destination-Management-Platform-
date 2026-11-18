"""
YatraSetu Platform — Cryptographic Password Hashing & Verification
Implements Argon2id password hashing using argon2-cffi (RFC 9106 recommended).
Configures memory cost, time cost, parallelism, and salt length.
"""

import re
from typing import Tuple
from argon2 import PasswordHasher, Type
from argon2.exceptions import VerifyMismatchError, VerificationError, InvalidHashError

# Configure Argon2id hasher with OWASP / RFC 9106 recommended parameters
# Type.ID = Argon2id (resistant to side-channel and GPU cracking attacks)
_password_hasher = PasswordHasher(
    time_cost=3,          # 3 iterations
    memory_cost=65536,    # 64 MiB
    parallelism=4,        # 4 parallel threads
    hash_len=32,          # 32-byte key
    salt_len=16,          # 16-byte cryptographically secure salt
    type=Type.ID,
)


class PasswordSecurity:
    """
    Stateless password security utility.
    Enforces hashing, verification, and policy complexity.
    """

    MIN_LENGTH: int = 8
    MAX_LENGTH: int = 128

    @classmethod
    def validate_password_complexity(cls, password: str) -> Tuple[bool, str]:
        """
        Validates password strength according to platform security policy:
        - Minimum 8 characters, maximum 128 characters
        - At least one uppercase letter [A-Z]
        - At least one lowercase letter [a-z]
        - At least one digit [0-9]
        - At least one special character / symbol
        """
        if not password:
            return False, "Password cannot be empty."

        if len(password) < cls.MIN_LENGTH:
            return False, f"Password must be at least {cls.MIN_LENGTH} characters long."

        if len(password) > cls.MAX_LENGTH:
            return False, f"Password must not exceed {cls.MAX_LENGTH} characters."

        if not re.search(r"[A-Z]", password):
            return False, "Password must contain at least one uppercase letter."

        if not re.search(r"[a-z]", password):
            return False, "Password must contain at least one lowercase letter."

        if not re.search(r"[0-9]", password):
            return False, "Password must contain at least one digit."

        if not re.search(r"[\W_]", password):
            return False, "Password must contain at least one special character."

        return True, ""

    @classmethod
    def hash_password(cls, password: str) -> str:
        """
        Hashes plaintext password using Argon2id with automatic salt generation.
        """
        valid, msg = cls.validate_password_complexity(password)
        if not valid:
            raise ValueError(msg)
        return _password_hasher.hash(password)

    @classmethod
    def verify_password(cls, plain_password: str, hashed_password: str) -> bool:
        """
        Verifies plaintext password against Argon2id hash.
        Fails safely on corrupted or mismatched hashes.
        """
        if not plain_password or not hashed_password:
            return False
        try:
            return _password_hasher.verify(hashed_password, plain_password)
        except (VerifyMismatchError, VerificationError, InvalidHashError):
            return False

    @classmethod
    def needs_rehash(cls, hashed_password: str) -> bool:
        """
        Checks if the hash parameters need upgrading.
        """
        try:
            return _password_hasher.check_needs_rehash(hashed_password)
        except Exception:
            return False
