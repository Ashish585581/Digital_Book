"""
Pydantic schemas for authentication.
"""
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field, EmailStr, field_validator

from app.models.user import User


class UserRegister(BaseModel):
    """Schema for user registration request."""
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=8)
    name: str = Field(..., min_length=1, max_length=100)

    @field_validator('username')
    @classmethod
    def validate_username(cls, v: str) -> str:
        if not v.isalnum() and '_' not in v:
            raise ValueError('Username must be alphanumeric with optional underscores')
        return v.lower()


class UserLogin(BaseModel):
    """Schema for login request."""
    username: str = Field(..., min_length=1, max_length=50, description="Username or email")
    password: str = Field(..., min_length=1, description="User password")
    expected_role: str | None = Field(default=None, description="Expected role (student or admin)")

    @field_validator('username')
    @classmethod
    def validate_username(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError('Username cannot be empty')
        return v.strip()

    @field_validator('password')
    @classmethod
    def validate_password(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError('Password cannot be empty')
        return v


class TokenResponse(BaseModel):
    """Schema for token response."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds


class AccessTokenResponse(BaseModel):
    """Schema for access token refresh response."""
    access_token: str
    expires_in: int


class RefreshTokenRequest(BaseModel):
    """Schema for refresh token request."""
    refresh_token: str


class LogoutRequest(BaseModel):
    """Schema for logout request."""
    refresh_token: str


class UserResponse(BaseModel):
    """Schema for user response (without sensitive data)."""
    id: int
    username: str
    email: str
    name: str
    role: str
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)