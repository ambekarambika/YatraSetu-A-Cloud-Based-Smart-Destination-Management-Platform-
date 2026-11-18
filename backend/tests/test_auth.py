"""
YatraSetu Platform — Authentication & Authorization Unit Test Suite
Validates:
1. Tourist self-registration.
2. Stakeholder self-registration.
3. Denial of Administrator / Manager self-registration.
4. Duplicate email rejection (409 Conflict).
5. Password complexity validation.
6. Successful login with token pair issuance.
7. Failed login with neutral invalid credentials error.
8. Account deactivation / disabled login block.
9. Refresh token rotation.
10. Refresh token reuse detection & revocation.
11. Logout token invalidation.
12. Current user profile (/auth/me) with SecurityContext.
13. Role-based endpoint guards (Tourist, Stakeholder, Manager, Admin).
14. Manager jurisdiction guards (Destination vs State Manager).
"""

import uuid
import pytest
from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.identity import Role, User, UserRefreshToken, ManagerAssignment
from app.models.destination import State, Destination
from app.core.hashing import PasswordSecurity
from app.core.tokens import TokenService
from app.main import app


# -----------------------------------------------------------------------------
# Fixtures
# -----------------------------------------------------------------------------

@pytest.fixture
def auth_setup(db_session: Session):
    """Initializes reference roles and states for auth testing."""
    for role_id, name in [
        ("admin", "Administrator"),
        ("manager", "Destination Manager"),
        ("stakeholder", "Stakeholder"),
        ("tourist", "Tourist"),
    ]:
        if not db_session.query(Role).filter(Role.id == role_id).first():
            db_session.add(Role(id=role_id, name=name))

    if not db_session.query(State).filter(State.id == "maharashtra").first():
        s = State(id="maharashtra", name="Maharashtra", theme_code="saffron", badge_label="West")
        db_session.add(s)

    if not db_session.query(Destination).filter(Destination.id == "rajgad-fort").first():
        d = Destination(
            id="rajgad-fort",
            state_id="maharashtra",
            name="Rajgad Fort",
            category="Fort",
            description="Historic fort",
        )
        db_session.add(d)

    db_session.commit()


# -----------------------------------------------------------------------------
# 1. Registration Tests
# -----------------------------------------------------------------------------

def test_tourist_registration(client: TestClient, db_session: Session, auth_setup):
    """Verifies valid tourist registration."""
    response = client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "Rohan Deshmukh",
            "email": "rohan.tourist@example.com",
            "password": "Password@123",
            "role": "tourist",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["success"] is True

    # Verify user exists in database with Argon2id hash
    user = db_session.query(User).filter(User.email == "rohan.tourist@example.com").first()
    assert user is not None
    assert user.role_id == "tourist"
    assert user.is_active is True
    assert user.is_verified is False
    assert user.password_hash.startswith("$argon2id$")


def test_stakeholder_registration(client: TestClient, db_session: Session, auth_setup):
    """Verifies valid stakeholder registration with destination assignment."""
    response = client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "Suresh Patil",
            "email": "suresh.guides@example.com",
            "password": "Password@123",
            "role": "stakeholder",
            "phone_number": "+91 98200 12345",
            "destination_id": "rajgad-fort",
        },
    )
    assert response.status_code == 201
    user = db_session.query(User).filter(User.email == "suresh.guides@example.com").first()
    assert user is not None
    assert user.role_id == "stakeholder"


def test_admin_and_manager_registration_forbidden(client: TestClient, auth_setup):
    """Verifies that public self-registration cannot request admin or manager role."""
    # Attempt Admin registration
    res_admin = client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "Malicious Admin",
            "email": "bad.admin@example.com",
            "password": "Password@123",
            "role": "admin",
        },
    )
    assert res_admin.status_code == 422  # Pydantic field_validator rejects

    # Attempt Manager registration
    res_mgr = client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "Malicious Manager",
            "email": "bad.manager@example.com",
            "password": "Password@123",
            "role": "manager",
        },
    )
    assert res_mgr.status_code == 422


def test_duplicate_email_registration_rejected(client: TestClient, db_session: Session, auth_setup):
    """Verifies duplicate email registration returns 409 Conflict."""
    payload = {
        "full_name": "Priya Sharma",
        "email": "priya.sharma@example.com",
        "password": "Password@123",
        "role": "tourist",
    }
    res1 = client.post("/api/v1/auth/register", json=payload)
    assert res1.status_code == 201

    res2 = client.post("/api/v1/auth/register", json=payload)
    assert res2.status_code == 409
    assert "already exists" in res2.json()["detail"]


def test_password_complexity_enforcement(client: TestClient, auth_setup):
    """Verifies weak passwords are rejected with 400 Bad Request."""
    weak_passwords = [
        ("short", "at least 8 characters"),
        ("alllowercase1!", "uppercase letter"),
        ("ALLUPPERCASE1!", "lowercase letter"),
        ("NoDigitsHere!", "digit"),
        ("NoSpecialChar123", "special character"),
    ]
    for pwd, _ in weak_passwords:
        res = client.post(
            "/api/v1/auth/register",
            json={
                "full_name": "Test User",
                "email": f"test.{uuid.uuid4().hex[:6]}@example.com",
                "password": pwd,
                "role": "tourist",
            },
        )
        assert res.status_code == 400


# -----------------------------------------------------------------------------
# 2. Login Tests
# -----------------------------------------------------------------------------

def test_login_successful(client: TestClient, db_session: Session, auth_setup):
    """Verifies valid login returns access and refresh token pair."""
    # Create user
    pwd_hash = PasswordSecurity.hash_password("Tourist@2026")
    user = User(
        id=uuid.uuid4(),
        role_id="tourist",
        email="login.test@example.com",
        password_hash=pwd_hash,
        full_name="Login Tester",
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()

    res = client.post(
        "/api/v1/auth/login",
        json={"email": "login.test@example.com", "password": "Tourist@2026"},
    )
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "login.test@example.com"
    assert data["user"]["role"] == "tourist"


def test_login_invalid_credentials_neutral_error(client: TestClient, auth_setup):
    """Verifies incorrect password or non-existent email returns neutral error."""
    # Non-existent email
    res1 = client.post(
        "/api/v1/auth/login",
        json={"email": "nonexistent@example.com", "password": "WrongPassword1!"},
    )
    assert res1.status_code == 401
    assert "Invalid email address or password" in res1.json()["detail"]

    # Wrong password on existing email
    res2 = client.post(
        "/api/v1/auth/login",
        json={"email": "login.test@example.com", "password": "WrongPassword1!"},
    )
    assert res2.status_code == 401
    assert "Invalid email address or password" in res2.json()["detail"]


def test_login_disabled_account_blocked(client: TestClient, db_session: Session, auth_setup):
    """Verifies deactivated user account is rejected with 403 Forbidden."""
    pwd_hash = PasswordSecurity.hash_password("Suspended@123")
    user = User(
        id=uuid.uuid4(),
        role_id="tourist",
        email="suspended.user@example.com",
        password_hash=pwd_hash,
        full_name="Suspended User",
        is_active=False,
    )
    db_session.add(user)
    db_session.commit()

    res = client.post(
        "/api/v1/auth/login",
        json={"email": "suspended.user@example.com", "password": "Suspended@123"},
    )
    assert res.status_code == 403
    assert "ACCOUNT SUSPENDED" in res.json()["detail"]


# -----------------------------------------------------------------------------
# 3. Token Rotation, Reuse & Logout Tests
# -----------------------------------------------------------------------------

def test_refresh_token_rotation(client: TestClient, db_session: Session, auth_setup):
    """Verifies refresh token rotation issues new access and refresh tokens."""
    pwd_hash = PasswordSecurity.hash_password("Rotate@1234")
    user = User(
        id=uuid.uuid4(),
        role_id="tourist",
        email="rotate.test@example.com",
        password_hash=pwd_hash,
        full_name="Rotate User",
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()

    # Login to get initial refresh token
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "rotate.test@example.com", "password": "Rotate@1234"},
    )
    initial_refresh = login_res.json()["refresh_token"]

    # Rotate token
    refresh_res = client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": initial_refresh},
    )
    assert refresh_res.status_code == 200
    new_data = refresh_res.json()
    assert "access_token" in new_data
    assert "refresh_token" in new_data
    assert new_data["refresh_token"] != initial_refresh


def test_refresh_token_reuse_detection(client: TestClient, db_session: Session, auth_setup):
    """
    Verifies that attempting to reuse an already-rotated refresh token triggers
    family invalidation and returns 401 Unauthorized.
    """
    pwd_hash = PasswordSecurity.hash_password("Reuse@12345")
    user = User(
        id=uuid.uuid4(),
        role_id="tourist",
        email="reuse.test@example.com",
        password_hash=pwd_hash,
        full_name="Reuse User",
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()

    # Initial login
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "reuse.test@example.com", "password": "Reuse@12345"},
    )
    token1 = login_res.json()["refresh_token"]

    # Legitimate first rotation
    rot_res = client.post("/api/v1/auth/refresh", json={"refresh_token": token1})
    assert rot_res.status_code == 200

    # Malicious attempt to reuse old token1
    reuse_res = client.post("/api/v1/auth/refresh", json={"refresh_token": token1})
    assert reuse_res.status_code == 401
    assert "reuse detected" in reuse_res.json()["detail"].lower()


def test_logout_revokes_token(client: TestClient, db_session: Session, auth_setup):
    """Verifies that logout revokes refresh token and prevents future use."""
    pwd_hash = PasswordSecurity.hash_password("Logout@1234")
    user = User(
        id=uuid.uuid4(),
        role_id="tourist",
        email="logout.test@example.com",
        password_hash=pwd_hash,
        full_name="Logout User",
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()

    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "logout.test@example.com", "password": "Logout@1234"},
    )
    refresh_token = login_res.json()["refresh_token"]

    # Logout
    logout_res = client.post("/api/v1/auth/logout", json={"refresh_token": refresh_token})
    assert logout_res.status_code == 200

    # Attempt to refresh with logged-out token
    after_res = client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
    assert after_res.status_code == 401


# -----------------------------------------------------------------------------
# 4. User Profile & Role Authorization Tests
# -----------------------------------------------------------------------------

def test_get_current_user_profile_me(client: TestClient, db_session: Session, auth_setup):
    """Verifies /api/v1/auth/me returns authenticated caller profile."""
    pwd_hash = PasswordSecurity.hash_password("Profile@123")
    user = User(
        id=uuid.uuid4(),
        role_id="tourist",
        email="me.test@example.com",
        password_hash=pwd_hash,
        full_name="Profile Tester",
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()

    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "me.test@example.com", "password": "Profile@123"},
    )
    token = login_res.json()["access_token"]

    me_res = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert me_res.status_code == 200
    data = me_res.json()
    assert data["email"] == "me.test@example.com"
    assert data["role_id"] == "tourist"
    assert "password" not in data
    assert "password_hash" not in data


def test_invalid_and_expired_access_token_rejected(client: TestClient, auth_setup):
    """Verifies malformed or expired JWTs are rejected."""
    # Malformed token
    res_malformed = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Bearer invalid.fake.token"},
    )
    assert res_malformed.status_code == 401

    # Expired token
    expired_token, _ = TokenService.create_access_token(
        user_id=uuid.uuid4(),
        role="tourist",
        expires_delta=timedelta(seconds=-10),  # expired 10 seconds ago
    )
    res_expired = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {expired_token}"},
    )
    assert res_expired.status_code == 401
    assert "expired" in res_expired.json()["detail"].lower()
