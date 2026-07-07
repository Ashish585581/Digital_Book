"""
Authentication endpoints.
"""
from fastapi import APIRouter, HTTPException, status, Request
from fastapi.responses import JSONResponse

from app.dependencies import AuthServiceDep, CurrentUser
from app.core.logging import get_logger
from app.core.exceptions import (
    UnauthorizedException,
    ConflictException,
    ServiceUnavailableException,
    ValidationException
)
from app.schemas.auth import (
    UserRegister,
    UserLogin,
    TokenResponse,
    AccessTokenResponse,
    RefreshTokenRequest,
    LogoutRequest,
    UserResponse
)


router = APIRouter()
logger = get_logger(__name__)


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user"
)
async def register(
    request: Request,
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
    logger.info(f"Registration attempt for username: {user_data.username}")
    try:
        user = await auth_service.register(user_data)
        logger.info(f"Registration successful for username: {user_data.username}")
        return user
    except ConflictException as e:
        logger.warning(f"Registration failed - conflict: {e.message}")
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"error": {"code": e.code, "message": e.message}}
        )
    except ServiceUnavailableException as e:
        logger.error(f"Registration failed - service unavailable: {e.message}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={"error": {"code": e.code, "message": e.message}}
        )


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Login and get tokens"
)
async def login(
    request: Request,
    credentials: UserLogin,
    auth_service: AuthServiceDep
):
    """
    Authenticate with username and password.

    Returns access token (15 min) and refresh token (7 days).
    Optionally validates that the user's role matches the expected_role.
    """
    logger.info(f"Login attempt for user: {credentials.username}")
    try:
        return await auth_service.login(
            credentials.username,
            credentials.password,
            credentials.expected_role
        )
    except UnauthorizedException as e:
        logger.warning(f"Login failed - unauthorized: {e.message}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"error": {"code": e.code, "message": e.message}}
        )
    except ServiceUnavailableException as e:
        logger.error(f"Login failed - service unavailable: {e.message}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={"error": {"code": e.code, "message": e.message}}
        )


@router.post(
    "/refresh",
    response_model=AccessTokenResponse,
    summary="Refresh access token"
)
async def refresh_token(
    request: Request,
    refresh_request: RefreshTokenRequest,
    auth_service: AuthServiceDep
):
    """
    Get a new access token using a valid refresh token.
    """
    logger.info("Token refresh attempt")
    try:
        return await auth_service.refresh_access_token(refresh_request.refresh_token)
    except UnauthorizedException as e:
        logger.warning(f"Token refresh failed - unauthorized: {e.message}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"error": {"code": e.code, "message": e.message}}
        )
    except ServiceUnavailableException as e:
        logger.error(f"Token refresh failed - service unavailable: {e.message}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={"error": {"code": e.code, "message": e.message}}
        )


@router.post(
    "/logout",
    summary="Logout and revoke refresh token"
)
async def logout(
    request: Request,
    logout_request: LogoutRequest,
    auth_service: AuthServiceDep
):
    """
    Logout by revoking the refresh token.
    """
    logger.info("Logout request received")
    try:
        await auth_service.logout(logout_request.refresh_token)
        return {"message": "Logged out successfully"}
    except ServiceUnavailableException as e:
        logger.error(f"Logout failed - service unavailable: {e.message}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={"error": {"code": e.code, "message": e.message}}
        )


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current user"
)
async def get_me(
    request: Request,
    current_user: CurrentUser
):
    """
    Get the currently authenticated user's profile.
    """
    return current_user