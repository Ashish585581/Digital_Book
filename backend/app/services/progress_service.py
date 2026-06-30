"""
Reading progress service.
"""
from app.core.exceptions import NotFoundException
from app.models.reading_progress import ReadingProgress
from app.repositories.progress_repository import ProgressRepository
from app.schemas.progress import ProgressUpdate


class ProgressService:
    """Service for reading progress operations."""

    def __init__(self, progress_repository: ProgressRepository):
        self._progress_repo = progress_repository

    async def get_all_progress(self, user_id: int) -> list[ReadingProgress]:
        """
        Get all reading progress for a user.

        Args:
            user_id: User ID

        Returns:
            List of reading progress records
        """
        return await self._progress_repo.get_all_by_user(user_id)

    async def get_progress(
        self,
        user_id: int,
        book_id: int
    ) -> ReadingProgress | None:
        """
        Get reading progress for a specific book.

        Args:
            user_id: User ID
            book_id: Book ID

        Returns:
            Reading progress or None
        """
        return await self._progress_repo.get_by_user_and_book(user_id, book_id)

    async def update_progress(
        self,
        user_id: int,
        book_id: int,
        data: ProgressUpdate
    ) -> ReadingProgress:
        """
        Update reading progress for a book.

        Args:
            user_id: User ID
            book_id: Book ID
            data: Progress update data

        Returns:
            Updated reading progress
        """
        progress = await self._progress_repo.upsert(
            user_id=user_id,
            book_id=book_id,
            progress_percent=data.progress_percent,
            last_position=data.last_position
        )
        await self._progress_repo.commit()
        return progress