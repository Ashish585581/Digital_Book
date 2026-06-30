"""
User management endpoints.
"""
import math
from fastapi import APIRouter, HTTPException, status, Query

from app.dependencies import UserServiceDep, CurrentAdmin
from app.schemas.user import (
    UserCreate,
    UserUpdate,
    UserDetail,
    UserListResponse
)
from app.core.exceptions import NotFoundException, ConflictException, ForbiddenException


router = APIRouter()


@router.get(
    "",
    response_model=UserListResponse,
    summary="List all users (Admin only)"
)
async def list_users(
    admin: CurrentAdmin,
    user_service: UserServiceDep,
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    role: str | None = Query(None, description="Filter by role (admin/student)")
):
    """
    List all users with pagination. Admin only.
    """
    users, total = await user_service.list_users(page, limit, role)
    pages = math.ceil(total / limit) if total > 0 else 1

    return UserListResponse(
        items=[UserDetail.model_validate(u) for u in users],
        total=total,
        page=page,
        pages=pages
    )


@router.get(
    "/{user_id}",
    response_model=UserDetail,
    summary="Get user by ID (Admin only)"
)
async def get_user(
    user_id: int,
    admin: CurrentAdmin,
    user_service: UserServiceDep
):
    """
    Get a specific user's details. Admin only.
    """
    try:
        user = await user_service.get_user(user_id)
        return user
    except NotFoundException as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": e.code, "message": e.message}}
        )


@router.post(
    "",
    response_model=UserDetail,
    status_code=status.HTTP_201_CREATED,
    summary="Create user (Admin only)"
)
async def create_user(
    user_data: UserCreate,
    admin: CurrentAdmin,
    user_service: UserServiceDep
):
    """
    Create a new user. Admin only.
    """
    try:
        user = await user_service.create_user(user_data)
        return user
    except ConflictException as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"error": {"code": e.code, "message": e.message}}
        )


@router.put(
    "/{user_id}",
    response_model=UserDetail,
    summary="Update user (Admin only)"
)
async def update_user(
    user_id: int,
    user_data: UserUpdate,
    admin: CurrentAdmin,
    user_service: UserServiceDep
):
    """
    Update a user's details. Admin only.
    Cannot modify your own account.
    """
    try:
        user = await user_service.update_user(user_id, user_data, admin)
        return user
    except NotFoundException as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": e.code, "message": e.message}}
        )
    except ForbiddenException as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"error": {"code": e.code, "message": e.message}}
        )


@router.delete(
    "/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete user (Admin only)"
)
async def delete_user(
    user_id: int,
    admin: CurrentAdmin,
    user_service: UserServiceDep
):
    """
    Delete a user. Admin only.
    Cannot delete your own account.
    """
    try:
        await user_service.delete_user(user_id, admin)
    except NotFoundException as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": e.code, "message": e.message}}
        )
    except ForbiddenException as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"error": {"code": e.code, "message": e.message}}
        )