"""
Pydantic schemas for reading progress.
"""
from datetime import datetime
from pydantic import BaseModel, Field, field_validator

from app.schemas.base import BaseSchema


class ProgressUpdate(BaseModel):
    """Schema for updating reading progress."""
    progress_percent: int = Field(..., ge=0, le=100)
    last_position: str | None = Field(None, max_length=100)


class ProgressResponse(BaseSchema):
    """Schema for reading progress response."""
    book_id: int
    progress_percent: int
    last_position: str | None
    last_read_at: datetime | None


class ProgressListResponse(BaseModel):
    """Schema for list of reading progress."""
    items: list[ProgressResponse]