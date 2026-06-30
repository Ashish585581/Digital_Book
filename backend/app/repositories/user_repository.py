"""
User repository for user data access.
"""
from datetime import datetime
from sqlalchemy import select, or_, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.repositories.base import BaseRepository


class UserRepository(BaseRepository[User]):
    """Repository for User model operations."""

    def __init__(self, session: AsyncSession):
        super().__init__(session, User)

    async def find_by_username(self, username: str) -> User | None:
        """Find a user by username (case-insensitive)."""
        result = await self._session.execute(
            select(User).where(func.lower(User.username) == username.lower())
        )
        return result.scalar_one_or_none()

    async def find_by_email(self, email: str) -> User | None:
        """Find a user by email (case-insensitive)."""
        result = await self._session.execute(
            select(User).where(func.lower(User.email) == email.lower())
        )
        return result.scalar_one_or_none()

    async def find_by_username_or_email(self, username: str, email: str) -> User | None:
        """Find a user by username or email."""
        result = await self._session.execute(
            select(User).where(
                or_(
                    func.lower(User.username) == username.lower(),
                    func.lower(User.email) == email.lower()
                )
            )
        )
        return result.scalar_one_or_none()

    async def update_last_login(self, user_id: int) -> None:
        """Update the last login timestamp."""
        user = await self.get_by_id(user_id)
        if user:
            user.last_login_at = datetime.utcnow()
            await self._session.flush()

    async def find_all_paginated(
        self,
        page: int = 1,
        limit: int = 20,
        role: str | None = None
    ) -> tuple[list[User], int]:
        """
        Get users with pagination and optional role filter.

        Returns:
            Tuple of (users list, total count)
        """
        query = select(User)

        if role:
            query = query.where(User.role == role)

        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        total = await self._session.scalar(count_query)

        # Get paginated results
        offset = (page - 1) * limit
        query = query.offset(offset).limit(limit).order_by(User.id)
        result = await self._session.execute(query)

        return list(result.scalars().all()), total