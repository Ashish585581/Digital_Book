"""
Book management endpoints.
"""
import math
from fastapi import APIRouter, HTTPException, status, Query, UploadFile, File, Form
from fastapi.responses import StreamingResponse

from app.dependencies import BookServiceDep, CurrentUser, CurrentAdmin
from app.schemas.book import (
    BookResponse,
    BookDetailResponse,
    BookListResponse,
    BookMetadataCreate,
    BookMetadataUpdate,
    CoverUploadResponse
)
from app.core.exceptions import NotFoundException, ValidationException, FileTooLargeException
from app.core.config import settings


router = APIRouter()


@router.get(
    "",
    response_model=BookListResponse,
    summary="List all books"
)
async def list_books(
    current_user: CurrentUser,
    book_service: BookServiceDep,
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    class_grade: str | None = Query(None, description="Filter by class grade"),
    book_type: str | None = Query(None, description="Filter by type (PDF/EPUB)"),
    search: str | None = Query(None, description="Search in title/author")
):
    """
    List all books with optional filters.
    """
    books, total = await book_service.list_books(
        page, limit, class_grade, book_type, search
    )
    pages = math.ceil(total / limit) if total > 0 else 1

    items = []
    for book in books:
        items.append(BookResponse(
            id=book.id,
            title=book.book_metadata.title if book.book_metadata else book.file_name,
            authors=book.book_metadata.authors if book.book_metadata else "Unknown",
            class_grade=book.book_metadata.class_grade if book.book_metadata else "General",
            book_type=book.book_type,
            thumbnail=book.thumbnail_path,
            file_size=book.file_size,
            created_at=book.created_at
        ))

    return BookListResponse(
        items=items,
        total=total,
        page=page,
        pages=pages
    )


@router.get(
    "/{book_id}",
    response_model=BookDetailResponse,
    summary="Get book details"
)
async def get_book(
    book_id: int,
    current_user: CurrentUser,
    book_service: BookServiceDep
):
    """
    Get detailed information about a book.
    """
    try:
        book = await book_service.get_book(book_id)
        return BookDetailResponse(
            id=book.id,
            title=book.book_metadata.title if book.book_metadata else book.file_name,
            authors=book.book_metadata.authors if book.book_metadata else "Unknown",
            class_grade=book.book_metadata.class_grade if book.book_metadata else "General",
            book_type=book.book_type,
            thumbnail=book.thumbnail_path,
            file_size=book.file_size,
            file_name=book.file_name,
            created_at=book.created_at,
            updated_at=book.updated_at
        )
    except NotFoundException as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": e.code, "message": e.message}}
        )


@router.post(
    "",
    response_model=BookResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload a new book (Admin only)"
)
async def create_book(
    admin: CurrentAdmin,
    book_service: BookServiceDep,
    file: UploadFile = File(..., description="PDF or EPUB file"),
    title: str = Form(..., description="Book title"),
    authors: str = Form(..., description="Author name(s)"),
    class_grade: str = Form(..., description="Class grade")
):
    """
    Upload a new book. Admin only.

    Max file size: 500MB
    Supported formats: PDF, EPUB
    """
    # Read file content
    content = await file.read()

    # Determine book type from extension
    file_ext = file.filename.split('.')[-1].lower() if file.filename else ""
    book_type = "PDF" if file_ext == "pdf" else "EPUB" if file_ext == "epub" else "PDF"

    try:
        metadata = BookMetadataCreate(
            title=title,
            authors=authors,
            class_grade=class_grade
        )
        book = await book_service.create_book(
            file_content=content,
            file_name=file.filename or "unknown",
            file_size=len(content),
            book_type=book_type,
            metadata=metadata
        )
        return BookResponse(
            id=book.id,
            title=book.book_metadata.title,
            authors=book.book_metadata.authors,
            class_grade=book.book_metadata.class_grade,
            book_type=book.book_type,
            thumbnail=book.thumbnail_path,
            file_size=book.file_size,
            created_at=book.created_at
        )
    except (FileTooLargeException, ValidationException) as e:
        raise HTTPException(
            status_code=e.status_code,
            detail={"error": {"code": e.code, "message": e.message}}
        )


@router.put(
    "/{book_id}",
    response_model=BookDetailResponse,
    summary="Update book metadata (Admin only)"
)
async def update_book(
    book_id: int,
    metadata: BookMetadataUpdate,
    admin: CurrentAdmin,
    book_service: BookServiceDep
):
    """
    Update book metadata. Admin only.
    """
    try:
        book = await book_service.update_book(book_id, metadata)
        return BookDetailResponse(
            id=book.id,
            title=book.book_metadata.title,
            authors=book.book_metadata.authors,
            class_grade=book.book_metadata.class_grade,
            book_type=book.book_type,
            thumbnail=book.thumbnail_path,
            file_size=book.file_size,
            file_name=book.file_name,
            created_at=book.created_at,
            updated_at=book.updated_at
        )
    except NotFoundException as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": e.code, "message": e.message}}
        )
    except ValidationException as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": {"code": e.code, "message": e.message}}
        )


@router.delete(
    "/{book_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a book (Admin only)"
)
async def delete_book(
    book_id: int,
    admin: CurrentAdmin,
    book_service: BookServiceDep
):
    """
    Delete a book and its file. Admin only.
    """
    try:
        await book_service.delete_book(book_id)
    except NotFoundException as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": e.code, "message": e.message}}
        )


@router.get(
    "/{book_id}/stream",
    summary="Stream book content"
)
async def stream_book(
    book_id: int,
    current_user: CurrentUser,
    book_service: BookServiceDep
):
    """
    Stream book content for reading.
    Supports Range requests for partial content.
    """
    try:
        book = await book_service.get_book(book_id)

        # Determine content type
        content_type = "application/pdf" if book.book_type == "PDF" else "application/epub+zip"

        # Open file for streaming
        file = open(book.file_path, 'rb')
        file_size = book.file_size

        async def stream():
            while chunk := file.read(64 * 1024):
                yield chunk
            file.close()

        return StreamingResponse(
            stream(),
            media_type=content_type,
            headers={
                "Content-Length": str(file_size),
                "Accept-Ranges": "bytes",
                "Content-Disposition": f"inline; filename=\"{book.file_name}\""
            }
        )
    except NotFoundException as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": e.code, "message": e.message}}
        )


@router.post(
    "/{book_id}/cover",
    response_model=CoverUploadResponse,
    summary="Upload book cover (Admin only)"
)
async def upload_cover(
    book_id: int,
    admin: CurrentAdmin,
    book_service: BookServiceDep,
    file: UploadFile = File(..., description="Cover image (JPEG, PNG)")
):
    """
    Upload a cover image for a book. Admin only.
    Max file size: 5MB
    """
    content = await file.read()

    # Basic validation
    if len(content) > settings.max_cover_size:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail={"error": {"code": "FILE_TOO_LARGE", "message": "Cover image too large"}}
        )

    try:
        cover_path = await book_service.upload_cover(book_id, content)
        return CoverUploadResponse(thumbnail=cover_path)
    except NotFoundException as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": e.code, "message": e.message}}
        )