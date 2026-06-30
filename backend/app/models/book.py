"""
Book model for storing uploaded books.
"""
from sqlalchemy import String, BigInteger, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class Book(Base, TimestampMixin):
    """
    Book file model.

    Attributes:
        id: Primary key
        file_name: Original filename
        file_path: Storage path
        file_hash: SHA256 hash for deduplication
        book_type: PDF or EPUB
        file_size: Size in bytes
        thumbnail_path: Cover image path
    """
    __tablename__ = "books"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_path: Mapped[str] = mapped_column(String(1000), nullable=False)
    file_hash: Mapped[str | None] = mapped_column(String(64), nullable=True)
    book_type: Mapped[str] = mapped_column(String(10), nullable=False)
    file_size: Mapped[int] = mapped_column(BigInteger, default=0, nullable=False)
    thumbnail_path: Mapped[str | None] = mapped_column(String(1000), nullable=True)

    # Relationship to metadata (one-to-one)
    book_metadata: Mapped["BookMetadata"] = relationship(
        "BookMetadata",
        back_populates="book",
        uselist=False,
        cascade="all, delete-orphan"
    )

    # Relationship to reading progress (one-to-many)
    progress: Mapped[list["ReadingProgress"]] = relationship(
        "ReadingProgress",
        back_populates="book",
        cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Book(id={self.id}, file_name='{self.file_name}', type='{self.book_type}')>"