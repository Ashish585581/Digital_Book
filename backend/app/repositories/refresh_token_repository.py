"""
Refresh token repository.
"""
import hashlib
from datetime import datetime
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.refresh_token import RefreshToken
from app.repositories.base import BaseRepository


class RefreshTokenRepository(BaseRepository[RefreshToken]):
    """Repository for RefreshToken model operations."""

    def __init__(self, session: AsyncSession):
        super().__init__(session, RefreshToken)

    @staticmethod
    def hash_token(token: str) -> str:
        """Hash a refresh token for storage."""
        return hashlib.sha256(token.encode()).hexdigest()

    async def find_by_token(self, token: str) -> RefreshToken | None:
        """Find a refresh token by its hash."""
        token_hash = self.hash_token(token)
        result = await self._session.execute(
            select(RefreshToken).where(
                RefreshToken.token_hash == token_hash,
                RefreshToken.expires_at > datetime.utcnow()
            )
        )
        return result.scalar_one_or_none()

    async def create(self, user_id: int, token: str, expires_at: datetime) -> RefreshToken:
        """Create a new refresh token."""
        token_hash = self.hash_token(token)
        refresh_token = RefreshToken(
            user_id=user_id,
            token_hash=token_hash,
            expires_at=expires_at
        )
        self._session.add(refresh_token)
        await self._session.flush()
        await self._session.refresh(refresh_token)
        return refresh_token

    async def delete_by_token(self, token: str) -> bool:
        """Delete a refresh token by its value. Returns True if deleted."""
        token_hash = self.hash_token(token)
        result = await self._session.execute(
            delete(RefreshToken).where(RefreshToken.token_hash == token_hash)
        )
        await self._session.flush()
        return result.rowcount > 0

    async def delete_all_for_user(self, user_id: int) -> int:
        """Delete all refresh tokens for a user. Returns count deleted."""
        result = await self._session.execute(
            delete(RefreshToken).where(RefreshToken.user_id == user_id)
        )
        await self._session.flush()
        return result.rowcount

    async def delete_expired(self) -> int:
        """Delete all expired tokens. Returns count deleted."""
        result = await self._session.execute(
            delete(RefreshToken).where(RefreshToken.expires_at <= datetime.utcnow())
        )
        await self._session.flush()
        return result.rowcount