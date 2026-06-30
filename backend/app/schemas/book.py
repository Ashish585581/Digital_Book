"""
Pydantic schemas for book management.
"""
from datetime import datetime
from pydantic import BaseModel, Field, field_validator

from app.models.book_metadata import CLASS_GRADE_OPTIONS
from app.schemas.base import BaseSchema, PaginatedResponse


class BookMetadataCreate(BaseModel):
    """Schema for book metadata during creation."""
    title: str = Field(..., min_length=1, max_length=500)
    authors: str = Field(..., min_length=1, max_length=500)
    class_grade: str = Field(..., min_length=1, max_length=20)

    @field_validator('class_grade')
    @classmethod
    def validate_class_grade(cls, v: str) -> str:
        if v not in CLASS_GRADE_OPTIONS:
            raise ValueError(f"class_grade must be one of: {', '.join(CLASS_GRADE_OPTIONS)}")
        return v


class BookMetadataUpdate(BaseModel):
    """Schema for updating book metadata."""
    title: str | None = Field(None, min_length=1, max_length=500)
    authors: str | None = Field(None, min_length=1, max_length=500)
    class_grade: str | None = None

    @field_validator('class_grade')
    @classmethod
    def validate_class_grade(cls, v: str | None) -> str | None:
        if v is not None and v not in CLASS_GRADE_OPTIONS:
            raise ValueError(f"class_grade must be one of: {', '.join(CLASS_GRADE_OPTIONS)}")
        return v


class BookResponse(BaseSchema):
    """Schema for book list item response."""
    id: int
    title: str
    authors: str
    class_grade: str
    book_type: str
    thumbnail: str | None
    file_size: int
    created_at: datetime


class BookDetailResponse(BookResponse):
    """Schema for book detail response."""
    file_name: str
    updated_at: datetime


class BookListResponse(PaginatedResponse[BookResponse]):
    """Schema for paginated book list response."""
    pass


class CoverUploadResponse(BaseModel):
    """Schema for cover upload response."""
    thumbnail: str