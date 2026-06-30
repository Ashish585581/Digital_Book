"""
Authentication endpoints.
"""
from fastapi import APIRouter, HTTPException, status

from app.dependencies import AuthServiceDep, CurrentUser
from app.schemas.auth import (
    UserRegister,
    UserLogin,
    TokenResponse,
    AccessTokenResponse,
    RefreshTokenRequest,
    LogoutRequest,
    UserResponse
)
from app.core.exceptions import UnauthorizedException, ConflictException


router = APIRouter()


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user"
)
async def register(
    user_data: UserRegister,
    auth_service: AuthServiceDep
):
    """
    Register a new user account.

    - **username**: Unique username (3-50 characters)
    - **email**: Valid email address
    - **password**: Password (minimum 8 characters)
    - **name**: Display name
    """
    try:
        user = await auth_service.register(user_data)
        return user
    except ConflictException as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"error": {"code": e.code, "message": e.message}}
        )


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Login and get tokens"
)
async def login(
    credentials: UserLogin,
    auth_service: AuthServiceDep
):
    """
    Authenticate with username and password.

    Returns access token (15 min) and refresh token (7 days).
    """
    try:
        return await auth_service.login(credentials.username, credentials.password)
    except UnauthorizedException as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"error": {"code": e.code, "message": e.message}}
        )


@router.post(
    "/refresh",
    response_model=AccessTokenResponse,
    summary="Refresh access token"
)
async def refresh_token(
    request: RefreshTokenRequest,
    auth_service: AuthServiceDep
):
    """
    Get a new access token using a valid refresh token.
    """
    try:
        return await auth_service.refresh_access_token(request.refresh_token)
    except UnauthorizedException as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"error": {"code": e.code, "message": e.message}}
        )


@router.post(
    "/logout",
    summary="Logout and revoke refresh token"
)
async def logout(
    request: LogoutRequest,
    auth_service: AuthServiceDep
):
    """
    Logout by revoking the refresh token.
    """
    await auth_service.logout(request.refresh_token)
    return {"message": "Logged out successfully"}


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current user"
)
async def get_me(
    current_user: CurrentUser
):
    """
    Get the currently authenticated user's profile.
    """
    return current_user