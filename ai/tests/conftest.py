from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Generator

import pytest
from fastapi.testclient import TestClient
from jose import jwt

from app.config import Settings
from app.dependencies import get_settings
from app.main import app

TEST_JWT_SECRET = "test-secret-key-for-testing"
TEST_USER_ID = "user-123"
TEST_TENANT_ID = "tenant-456"


def get_test_settings() -> Settings:
    return Settings(
        JWT_SECRET=TEST_JWT_SECRET,
        APP_ENV="testing",
        DB_HOST="localhost",
        REDIS_HOST="localhost",
    )


def create_test_token(
    user_id: str = TEST_USER_ID,
    email: str = "test@example.com",
    tenant_id: str = TEST_TENANT_ID,
    roles: list[str] | None = None,
    permissions: list[str] | None = None,
    expired: bool = False,
) -> str:
    now = datetime.now(timezone.utc)
    exp = now - timedelta(hours=1) if expired else now + timedelta(hours=1)
    payload = {
        "sub": user_id,
        "email": email,
        "tenant_id": tenant_id,
        "session_id": "session-789",
        "roles": roles or ["admin"],
        "permissions": permissions or ["read", "write"],
        "iat": int(now.timestamp()),
        "exp": int(exp.timestamp()),
    }
    return jwt.encode(payload, TEST_JWT_SECRET, algorithm="HS256")


@pytest.fixture
def settings() -> Settings:
    return get_test_settings()


@pytest.fixture
def client() -> Generator[TestClient, None, None]:
    app.dependency_overrides[get_settings] = get_test_settings
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def auth_token() -> str:
    return create_test_token()


@pytest.fixture
def auth_headers(auth_token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {auth_token}"}


@pytest.fixture
def expired_token() -> str:
    return create_test_token(expired=True)


@pytest.fixture
def expired_headers(expired_token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {expired_token}"}
