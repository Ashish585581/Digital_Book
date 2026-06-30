"""
ReadingProgress model for tracking user's reading position.
"""
from datetime import datetime
from sqlalchemy import String, Integer, ForeignKey, UniqueConstraint, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class ReadingProgress(Base, TimestampMixin):
    """
    User's reading progress for a specific book.

    Attributes:
        id: Primary key
        user_id: Foreign key to users
        book_id: Foreign key to books
        progress_percent: Progress percentage (0-100)
        last_position: Page number or CFI position
        last_read_at: When the user last read
    """
    __tablename__ = "reading_progress"
    __table_args__ = (
        UniqueConstraint('user_id', 'book_id', name='uq_user_book_progress'),
        CheckConstraint('progress_percent >= 0 AND progress_percent <= 100', name='chk_progress_range'),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )
    book_id: Mapped[int] = mapped_column(
        ForeignKey("books.id", ondelete="CASCADE"),
        nullable=False
    )
    progress_percent: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    last_position: Mapped[str | None] = mapped_column(String(100), nullable=True)
    last_read_at: Mapped[datetime] = mapped_column(
        nullable=False,
        default=datetime.utcnow
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="progress")
    book: Mapped["Book"] = relationship("Book", back_populates="progress")

    def __repr__(self) -> str:
        return f"<ReadingProgress(user_id={self.user_id}, book_id={self.book_id}, progress={self.progress_percent}%)>"