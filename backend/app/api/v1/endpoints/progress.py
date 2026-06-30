"""
Reading progress endpoints.
"""
from fastapi import APIRouter, HTTPException, status

from app.dependencies import ProgressServiceDep, CurrentUser
from app.schemas.progress import ProgressUpdate, ProgressResponse, ProgressListResponse


router = APIRouter()


@router.get(
    "",
    response_model=ProgressListResponse,
    summary="Get all reading progress"
)
async def get_all_progress(
    current_user: CurrentUser,
    progress_service: ProgressServiceDep
):
    """
    Get reading progress for all books for the current user.
    """
    progress_list = await progress_service.get_all_progress(current_user.id)

    return ProgressListResponse(
        items=[
            ProgressResponse(
                book_id=p.book_id,
                progress_percent=p.progress_percent,
                last_position=p.last_position,
                last_read_at=p.last_read_at
            )
            for p in progress_list
        ]
    )


@router.get(
    "/{book_id}",
    response_model=ProgressResponse,
    summary="Get reading progress for a book"
)
async def get_progress(
    book_id: int,
    current_user: CurrentUser,
    progress_service: ProgressServiceDep
):
    """
    Get reading progress for a specific book.
    """
    progress = await progress_service.get_progress(current_user.id, book_id)

    if not progress:
        return ProgressResponse(
            book_id=book_id,
            progress_percent=0,
            last_position=None,
            last_read_at=None
        )

    return ProgressResponse(
        book_id=progress.book_id,
        progress_percent=progress.progress_percent,
        last_position=progress.last_position,
        last_read_at=progress.last_read_at
    )


@router.put(
    "/{book_id}",
    response_model=ProgressResponse,
    summary="Update reading progress"
)
async def update_progress(
    book_id: int,
    data: ProgressUpdate,
    current_user: CurrentUser,
    progress_service: ProgressServiceDep
):
    """
    Update reading progress for a book.
    """
    progress = await progress_service.update_progress(
        current_user.id,
        book_id,
        data
    )

    return ProgressResponse(
        book_id=progress.book_id,
        progress_percent=progress.progress_percent,
        last_position=progress.last_position,
        last_read_at=progress.last_read_at
    )