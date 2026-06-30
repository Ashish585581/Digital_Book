"""
User service for user management operations.
"""
from app.core.exceptions import NotFoundException, ConflictException, ForbiddenException
from app.core.security import hash_password
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.user import UserCreate, UserUpdate


class UserService:
    """Service for user management operations."""

    def __init__(self, user_repository: UserRepository):
        self._user_repo = user_repository

    async def list_users(
        self,
        page: int = 1,
        limit: int = 20,
        role: str | None = None
    ) -> tuple[list[User], int]:
        """
        List users with pagination.

        Args:
            page: Page number (1-indexed)
            limit: Items per page
            role: Optional role filter

        Returns:
            Tuple of (users list, total count)
        """
        return await self._user_repo.find_all_paginated(page, limit, role)

    async def get_user(self, user_id: int) -> User:
        """
        Get a user by ID.

        Args:
            user_id: User ID

        Returns:
            User

        Raises:
            NotFoundException: If user not found
        """
        user = await self._user_repo.get_by_id(user_id)
        if not user:
            raise NotFoundException("User")
        return user

    async def create_user(self, user_data: UserCreate) -> User:
        """
        Create a new user (admin only).

        Args:
            user_data: User creation data

        Returns:
            Created user

        Raises:
            ConflictException: If username or email exists
        """
        # Check if user exists
        existing = await self._user_repo.find_by_username_or_email(
            user_data.username, user_data.email
        )
        if existing:
            if existing.username.lower() == user_data.username.lower():
                raise ConflictException("Username already exists")
            raise ConflictException("Email already exists")

        user = User(
            username=user_data.username,
            email=user_data.email,
            password_hash=hash_password(user_data.password),
            name=user_data.name,
            role=user_data.role
        )
        return await self._user_repo.create(user)

    async def update_user(
        self,
        user_id: int,
        user_data: UserUpdate,
        current_user: User
    ) -> User:
        """
        Update a user (admin only).

        Args:
            user_id: User ID to update
            user_data: Update data
            current_user: Admin making the request

        Returns:
            Updated user

        Raises:
            NotFoundException: If user not found
            ForbiddenException: Cannot modify yourself
        """
        user = await self._user_repo.get_by_id(user_id)
        if not user:
            raise NotFoundException("User")

        if user.id == current_user.id:
            raise ForbiddenException("Cannot modify your own account")

        if user_data.name is not None:
            user.name = user_data.name
        if user_data.role is not None:
            user.role = user_data.role
        if user_data.is_active is not None:
            user.is_active = user_data.is_active

        await self._user_repo.update(user)
        await self._user_repo.commit()
        return user

    async def delete_user(self, user_id: int, current_user: User) -> None:
        """
        Delete a user (admin only).

        Args:
            user_id: User ID to delete
            current_user: Admin making the request

        Raises:
            NotFoundException: If user not found
            ForbiddenException: Cannot delete yourself
        """
        if user_id == current_user.id:
            raise ForbiddenException("Cannot delete your own account")

        user = await self._user_repo.get_by_id(user_id)
        if not user:
            raise NotFoundException("User")

        await self._user_repo.delete(user)
        await self._user_repo.commit()