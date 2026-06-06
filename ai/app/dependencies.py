from __future__ import annotations

from functools import lru_cache
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

from app.config import Settings
from app.schemas.common import CurrentUser

security = HTTPBearer()


@lru_cache
def get_settings() -> Settings:
    return Settings()


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> CurrentUser:
    token = credentials.credentials
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM],
        )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid or expired token",
        )

    sub: str | None = payload.get("sub")
    email: str | None = payload.get("email")

    if not sub or not email:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid token payload",
        )

    return CurrentUser(
        id=sub,
        email=email,
        tenant_id=payload.get("tenant_id", ""),
        session_id=payload.get("session_id", ""),
        roles=payload.get("roles", []),
        permissions=payload.get("permissions", []),
    )


def require_permissions(*required: str):
    async def _check(
        user: Annotated[CurrentUser, Depends(get_current_user)],
    ) -> CurrentUser:
        for perm in required:
            if perm not in user.permissions:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Missing permission: {perm}",
                )
        return user

    return _check
