"""
Book service for book management operations.
"""
import os
import uuid
import hashlib
from pathlib import Path

from app.core.config import settings
from app.core.exceptions import NotFoundException, ValidationException, FileTooLargeException
from app.models.book import Book
from app.models.book_metadata import BookMetadata, CLASS_GRADE_OPTIONS
from app.repositories.book_repository import BookRepository
from app.schemas.book import BookMetadataCreate, BookMetadataUpdate


class BookService:
    """Service for book management operations."""

    def __init__(self, book_repository: BookRepository):
        self._book_repo = book_repository

    async def list_books(
        self,
        page: int = 1,
        limit: int = 20,
        class_grade: str | None = None,
        book_type: str | None = None,
        search: str | None = None
    ) -> tuple[list[Book], int]:
        """
        List books with pagination and filters.

        Args:
            page: Page number (1-indexed)
            limit: Items per page
            class_grade: Filter by class grade
            book_type: Filter by book type (PDF/EPUB)
            search: Search in title/author

        Returns:
            Tuple of (books list, total count)
        """
        return await self._book_repo.find_all_paginated(
            page, limit, class_grade, book_type, search
        )

    async def get_book(self, book_id: int) -> Book:
        """
        Get a book by ID with metadata.

        Args:
            book_id: Book ID

        Returns:
            Book with metadata

        Raises:
            NotFoundException: If book not found
        """
        book = await self._book_repo.get_with_metadata(book_id)
        if not book:
            raise NotFoundException("Book")
        return book

    async def create_book(
        self,
        file_content: bytes,
        file_name: str,
        file_size: int,
        book_type: str,
        metadata: BookMetadataCreate
    ) -> Book:
        """
        Create a new book with metadata.

        Args:
            file_content: File bytes
            file_name: Original filename
            file_size: File size in bytes
            book_type: PDF or EPUB
            metadata: Book metadata

        Returns:
            Created book with metadata

        Raises:
            FileTooLargeException: If file exceeds size limit
            ValidationException: If file type is invalid
        """
        # Validate file size
        if file_size > settings.max_file_size:
            raise FileTooLargeException(
                f"File exceeds maximum size of {settings.max_file_size // (1024*1024)}MB"
            )

        # Validate book type
        if book_type.upper() not in ["PDF", "EPUB"]:
            raise ValidationException(f"Invalid book type: {book_type}")

        # Generate unique filename
        ext = Path(file_name).suffix.lower()
        unique_name = f"{uuid.uuid4()}{ext}"
        file_path = os.path.join(settings.upload_dir, unique_name)

        # Calculate file hash
        file_hash = hashlib.sha256(file_content).hexdigest()

        # Check for duplicate
        existing = await self._book_repo.get_by_hash(file_hash)
        if existing:
            raise ValidationException("This book has already been uploaded")

        # Ensure upload directory exists
        os.makedirs(settings.upload_dir, exist_ok=True)

        # Save file
        with open(file_path, 'wb') as f:
            f.write(file_content)

        # Create book record
        book = Book(
            file_name=file_name,
            file_path=file_path,
            file_hash=file_hash,
            book_type=book_type.upper(),
            file_size=file_size
        )
        book = await self._book_repo.create(book)

        # Create metadata
        book_metadata = BookMetadata(
            book_id=book.id,
            title=metadata.title,
            authors=metadata.authors,
            class_grade=metadata.class_grade
        )
        book.book_metadata = book_metadata

        await self._book_repo.commit()

        # Fetch with metadata eagerly loaded to avoid lazy load issues
        book = await self._book_repo.get_with_metadata(book.id)
        return book

    async def update_book(
        self,
        book_id: int,
        metadata: BookMetadataUpdate
    ) -> Book:
        """
        Update book metadata.

        Args:
            book_id: Book ID
            metadata: Updated metadata

        Returns:
            Updated book

        Raises:
            NotFoundException: If book not found
        """
        book = await self._book_repo.get_with_metadata(book_id)
        if not book:
            raise NotFoundException("Book")

        if book.book_metadata is None:
            raise ValidationException("Book metadata not found")

        if metadata.title is not None:
            book.book_metadata.title = metadata.title
        if metadata.authors is not None:
            book.book_metadata.authors = metadata.authors
        if metadata.class_grade is not None:
            if metadata.class_grade not in CLASS_GRADE_OPTIONS:
                raise ValidationException(
                    f"class_grade must be one of: {', '.join(CLASS_GRADE_OPTIONS)}"
                )
            book.book_metadata.class_grade = metadata.class_grade

        await self._book_repo.commit()
        await self._book_repo.refresh(book)

        return book

    async def delete_book(self, book_id: int) -> None:
        """
        Delete a book and its file.

        Args:
            book_id: Book ID

        Raises:
            NotFoundException: If book not found
        """
        book = await self._book_repo.get_with_metadata(book_id)
        if not book:
            raise NotFoundException("Book")

        # Delete file
        if os.path.exists(book.file_path):
            os.remove(book.file_path)

        # Delete thumbnail if exists
        if book.thumbnail_path and os.path.exists(book.thumbnail_path):
            os.remove(book.thumbnail_path)

        await self._book_repo.delete(book)
        await self._book_repo.commit()

    async def upload_cover(
        self,
        book_id: int,
        file_content: bytes
    ) -> str:
        """
        Upload a cover image for a book.

        Args:
            book_id: Book ID
            file_content: Image bytes

        Returns:
            Path to saved cover

        Raises:
            NotFoundException: If book not found
            ValidationException: If file type invalid
        """
        book = await self._book_repo.get_with_metadata(book_id)
        if not book:
            raise NotFoundException("Book")

        # Generate unique filename
        unique_name = f"{uuid.uuid4()}.jpg"
        cover_path = os.path.join(settings.cover_dir, unique_name)

        # Ensure cover directory exists
        os.makedirs(settings.cover_dir, exist_ok=True)

        # Save file
        with open(cover_path, 'wb') as f:
            f.write(file_content)

        # Update book thumbnail
        book.thumbnail_path = cover_path
        await self._book_repo.update(book)
        await self._book_repo.commit()

        return cover_path