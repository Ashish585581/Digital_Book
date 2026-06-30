"""
Authentication service handling login, registration, and token management.
"""
from datetime import datetime, timedelta, timezone

from app.core.config import settings
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    verify_refresh_token
)
from app.core.exceptions import (
    UnauthorizedException,
    ConflictException,
    ValidationException
)
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.repositories.refresh_token_repository import RefreshTokenRepository
from app.schemas.auth import TokenResponse, AccessTokenResponse, UserRegister


class AuthService:
    """Service for authentication operations."""

    def __init__(
        self,
        user_repository: UserRepository,
        refresh_token_repository: RefreshTokenRepository
    ):
        self._user_repo = user_repository
        self._refresh_token_repo = refresh_token_repository

    async def register(self, user_data: UserRegister) -> User:
        """
        Register a new user.

        Args:
            user_data: User registration data

        Returns:
            Created user

        Raises:
            ConflictException: If username or email already exists
        """
        # Check if username exists
        existing = await self._user_repo.find_by_username_or_email(
            user_data.username, user_data.email
        )
        if existing:
            if existing.username.lower() == user_data.username.lower():
                raise ConflictException("Username already registered")
            raise ConflictException("Email already registered")

        # Create new user
        user = User(
            username=user_data.username,
            email=user_data.email,
            password_hash=hash_password(user_data.password),
            name=user_data.name,
            role="student"  # Default role
        )
        return await self._user_repo.create(user)

    async def login(self, username: str, password: str) -> TokenResponse:
        """
        Authenticate user and generate tokens.

        Args:
            username: Username or email
            password: Plain text password

        Returns:
            TokenResponse with access and refresh tokens

        Raises:
            UnauthorizedException: If credentials are invalid
        """
        # Find user by username
        user = await self._user_repo.find_by_username(username)
        if not user:
            # Try by email
            user = await self._user_repo.find_by_email(username)

        if not user or not verify_password(password, user.password_hash):
            raise UnauthorizedException("Invalid username or password")

        if not user.is_active:
            raise UnauthorizedException("Account is deactivated")

        # Update last login
        await self._user_repo.update_last_login(user.id)

        # Generate tokens
        token_data = {
            "sub": str(user.id),
            "username": user.username,
            "role": user.role
        }
        access_token = create_access_token(token_data)
        refresh_token = create_refresh_token(token_data)

        # Store refresh token
        expires_at = datetime.utcnow() + timedelta(
            days=settings.refresh_token_expire_days
        )
        await self._refresh_token_repo.create(user.id, refresh_token, expires_at)

        # Commit transaction
        await self._user_repo.commit()

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=settings.access_token_expire_minutes * 60
        )

    async def refresh_access_token(self, refresh_token: str) -> AccessTokenResponse:
        """
        Refresh the access token using a valid refresh token.

        Args:
            refresh_token: Valid refresh token

        Returns:
            New access token with expiration

        Raises:
            UnauthorizedException: If refresh token is invalid or expired
        """
        payload = verify_refresh_token(refresh_token)
        if not payload:
            raise UnauthorizedException("Invalid or expired refresh token")

        # Verify token exists in database
        stored_token = await self._refresh_token_repo.find_by_token(refresh_token)
        if not stored_token:
            raise UnauthorizedException("Refresh token has been revoked")

        # Get user
        user = await self._user_repo.get_by_id(int(payload.get("sub")))
        if not user or not user.is_active:
            raise UnauthorizedException("User not found or inactive")

        # Generate new access token
        token_data = {
            "sub": str(user.id),
            "username": user.username,
            "role": user.role
        }
        access_token = create_access_token(token_data)

        return AccessTokenResponse(
            access_token=access_token,
            expires_in=settings.access_token_expire_minutes * 60
        )

    async def logout(self, refresh_token: str) -> None:
        """
        Logout user by revoking the refresh token.

        Args:
            refresh_token: Refresh token to revoke
        """
        await self._refresh_token_repo.delete_by_token(refresh_token)
        await self._refresh_token_repo.commit()

    async def get_user_by_id(self, user_id: int) -> User | None:
        """Get a user by ID."""
        return await self._user_repo.get_by_id(user_id)