"""
BookMetadata model for storing simplified book information.
"""
from sqlalchemy import String, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


# Valid class grade options
CLASS_GRADE_OPTIONS = [
    "General",
    "Class 1", "Class 2", "Class 3", "Class 4", "Class 5",
    "Class 6", "Class 7", "Class 8", "Class 9", "Class 10",
    "Class 11", "Class 12"
]

# Valid library type options
LIBRARY_TYPE_OPTIONS = [
    "school",   # Textbooks, Notes, Assignments, Question Papers, Study Material
    "public"    # Novels, Stories, Science, History, Technology, Biography, Self Help
]


class BookMetadata(Base, TimestampMixin):
    """
    Simplified book metadata for school library.

    Attributes:
        id: Primary key
        book_id: Foreign key to books table
        title: Book title
        authors: Author names
        class_grade: School grade classification
        thumbnail: Cover image URL
        library_type: Whether this is a school or public library book
        is_featured: Whether this book is featured on the home page
    """
    __tablename__ = "book_metadata"
    __table_args__ = (
        UniqueConstraint('book_id', name='uq_book_metadata_book_id'),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    book_id: Mapped[int] = mapped_column(
        ForeignKey("books.id", ondelete="CASCADE"),
        nullable=False,
        unique=True
    )
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    authors: Mapped[str] = mapped_column(String(500), nullable=False)
    class_grade: Mapped[str] = mapped_column(String(20), nullable=False)
    thumbnail: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    library_type: Mapped[str] = mapped_column(String(20), nullable=False, default="public")
    is_featured: Mapped[bool] = mapped_column(default=False, nullable=False)

    # Relationship back to book
    book: Mapped["Book"] = relationship("Book", back_populates="book_metadata")

    def __repr__(self) -> str:
        return f"<BookMetadata(id={self.id}, title='{self.title}', class_grade='{self.class_grade}')>"