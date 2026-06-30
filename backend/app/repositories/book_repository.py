"""
Book repository for book data access.
"""
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.book import Book
from app.models.book_metadata import BookMetadata
from app.repositories.base import BaseRepository


class BookRepository(BaseRepository[Book]):
    """Repository for Book model operations."""

    def __init__(self, session: AsyncSession):
        super().__init__(session, Book)

    async def get_with_metadata(self, book_id: int) -> Book | None:
        """Get a book with its metadata eagerly loaded."""
        result = await self._session.execute(
            select(Book)
            .options(selectinload(Book.book_metadata))
            .where(Book.id == book_id)
        )
        return result.scalar_one_or_none()

    async def find_all_paginated(
        self,
        page: int = 1,
        limit: int = 20,
        class_grade: str | None = None,
        book_type: str | None = None,
        search: str | None = None
    ) -> tuple[list[Book], int]:
        """
        Get books with pagination and filters.

        Returns:
            Tuple of (books list, total count)
        """
        query = select(Book).options(selectinload(Book.book_metadata))

        # Apply filters
        if class_grade:
            query = query.join(Book.book_metadata).where(
                BookMetadata.class_grade == class_grade
            )

        if book_type:
            query = query.where(Book.book_type == book_type.upper())

        if search:
            search_term = f"%{search.lower()}%"
            query = query.join(Book.book_metadata).where(
                or_(
                    func.lower(BookMetadata.title).like(search_term),
                    func.lower(BookMetadata.authors).like(search_term)
                )
            )

        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        total = await self._session.scalar(count_query)

        # Get paginated results
        offset = (page - 1) * limit
        query = query.offset(offset).limit(limit).order_by(Book.id.desc())
        result = await self._session.execute(query)

        return list(result.scalars().all()), total

    async def get_by_hash(self, file_hash: str) -> Book | None:
        """Find a book by its file hash (for deduplication)."""
        result = await self._session.execute(
            select(Book).where(Book.file_hash == file_hash)
        )
        return result.scalar_one_or_none()