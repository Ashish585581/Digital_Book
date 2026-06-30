"""
Reading progress repository.
"""
from datetime import datetime
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.reading_progress import ReadingProgress
from app.repositories.base import BaseRepository


class ProgressRepository(BaseRepository[ReadingProgress]):
    """Repository for ReadingProgress model operations."""

    def __init__(self, session: AsyncSession):
        super().__init__(session, ReadingProgress)

    async def get_by_user_and_book(
        self, user_id: int, book_id: int
    ) -> ReadingProgress | None:
        """Get progress for a specific user and book."""
        result = await self._session.execute(
            select(ReadingProgress).where(
                ReadingProgress.user_id == user_id,
                ReadingProgress.book_id == book_id
            )
        )
        return result.scalar_one_or_none()

    async def get_all_by_user(self, user_id: int) -> list[ReadingProgress]:
        """Get all reading progress for a user."""
        result = await self._session.execute(
            select(ReadingProgress)
            .where(ReadingProgress.user_id == user_id)
            .order_by(ReadingProgress.last_read_at.desc())
        )
        return list(result.scalars().all())

    async def upsert(
        self,
        user_id: int,
        book_id: int,
        progress_percent: int,
        last_position: str | None
    ) -> ReadingProgress:
        """Create or update reading progress."""
        progress = await self.get_by_user_and_book(user_id, book_id)

        if progress:
            progress.progress_percent = progress_percent
            progress.last_position = last_position
            progress.last_read_at = datetime.utcnow()
            await self.flush()
        else:
            progress = ReadingProgress(
                user_id=user_id,
                book_id=book_id,
                progress_percent=progress_percent,
                last_position=last_position,
                last_read_at=datetime.utcnow()
            )
            self._session.add(progress)
            await self.flush()
            await self._session.refresh(progress)

        return progress