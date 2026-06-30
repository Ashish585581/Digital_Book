"""
Pydantic schemas for user management.
"""
from datetime import datetime
from pydantic import BaseModel, Field, EmailStr, field_validator

from app.schemas.base import BaseSchema, PaginatedResponse


class UserCreate(BaseModel):
    """Schema for creating a user (admin only)."""
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=8)
    name: str = Field(..., min_length=1, max_length=100)
    role: str = Field(default="student")

    @field_validator('role')
    @classmethod
    def validate_role(cls, v: str) -> str:
        if v not in ["admin", "student"]:
            raise ValueError("Role must be 'admin' or 'student'")
        return v


class UserUpdate(BaseModel):
    """Schema for updating a user (admin only)."""
    name: str | None = Field(None, min_length=1, max_length=100)
    role: str | None = None
    is_active: bool | None = None

    @field_validator('role')
    @classmethod
    def validate_role(cls, v: str | None) -> str | None:
        if v is not None and v not in ["admin", "student"]:
            raise ValueError("Role must be 'admin' or 'student'")
        return v


class UserDetail(BaseSchema):
    """Schema for detailed user response."""
    id: int
    username: str
    email: str
    name: str
    role: str
    is_active: bool
    created_at: datetime
    updated_at: datetime
    last_login_at: datetime | None = None


class UserListResponse(PaginatedResponse[UserDetail]):
    """Schema for paginated user list response."""
    pass