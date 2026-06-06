from __future__ import annotations

from typing import Any, Generic, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class JwtPayload(BaseModel):
    sub: str
    email: str
    tenant_id: str
    session_id: str
    roles: list[str] = []
    permissions: list[str] = []
    iat: int | None = None
    exp: int | None = None


class CurrentUser(BaseModel):
    id: str
    email: str
    tenant_id: str
    session_id: str
    roles: list[str] = []
    permissions: list[str] = []


class PaginationMeta(BaseModel):
    page: int
    limit: int
    total: int
    total_pages: int


class ApiResponse(BaseModel, Generic[T]):
    """Mirrors NestJS DataResponseDto envelope."""

    statusCode: int
    status: bool
    message: str
    data: T | None = None
    meta: dict[str, Any] | None = None

    @classmethod
    def success(
        cls,
        data: T,
        message: str = "Operation successful",
        meta: dict[str, Any] | None = None,
    ) -> "ApiResponse[T]":
        return cls(statusCode=200, status=True, message=message, data=data, meta=meta)

    @classmethod
    def created(cls, data: T, message: str = "Created successfully") -> "ApiResponse[T]":
        return cls(statusCode=201, status=True, message=message, data=data)

    @classmethod
    def error(cls, message: str, status_code: int = 400) -> "ApiResponse[None]":
        return ApiResponse[None](statusCode=status_code, status=False, message=message)
