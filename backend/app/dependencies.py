"""
Dependency injection for FastAPI routes.
"""
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import verify_access_token
from app.core.exceptions import UnauthorizedException
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.repositories.refresh_token_repository import RefreshTokenRepository
from app.repositories.book_repository import BookRepository
from app.repositories.progress_repository import ProgressRepository
from app.services.auth_service import AuthService
from app.services.user_service import UserService
from app.services.book_service import BookService
from app.services.progress_service import ProgressService


security = HTTPBearer()


async def get_db_session() -> AsyncSession:
    """Get database session."""
    async for session in get_db():
        yield session


# Repository dependencies
def get_user_repository(
    session: Annotated[AsyncSession, Depends(get_db_session)]
) -> UserRepository:
    return UserRepository(session)


def get_refresh_token_repository(
    session: Annotated[AsyncSession, Depends(get_db_session)]
) -> RefreshTokenRepository:
    return RefreshTokenRepository(session)


def get_book_repository(
    session: Annotated[AsyncSession, Depends(get_db_session)]
) -> BookRepository:
    return BookRepository(session)


def get_progress_repository(
    session: Annotated[AsyncSession, Depends(get_db_session)]
) -> ProgressRepository:
    return ProgressRepository(session)


# Service dependencies
def get_auth_service(
    user_repo: Annotated[UserRepository, Depends(get_user_repository)],
    refresh_repo: Annotated[RefreshTokenRepository, Depends(get_refresh_token_repository)]
) -> AuthService:
    return AuthService(user_repo, refresh_repo)


def get_user_service(
    user_repo: Annotated[UserRepository, Depends(get_user_repository)]
) -> UserService:
    return UserService(user_repo)


def get_book_service(
    book_repo: Annotated[BookRepository, Depends(get_book_repository)]
) -> BookService:
    return BookService(book_repo)


def get_progress_service(
    progress_repo: Annotated[ProgressRepository, Depends(get_progress_repository)]
) -> ProgressService:
    return ProgressService(progress_repo)


# Current user dependency
async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
    user_repo: Annotated[UserRepository, Depends(get_user_repository)]
) -> User:
    """Get the current authenticated user."""
    token = credentials.credentials
    payload = verify_access_token(token)

    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"error": {"code": "UNAUTHORIZED", "message": "Invalid or expired token"}}
        )

    user_id = int(payload.get("sub", 0))
    user = await user_repo.get_by_id(user_id)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"error": {"code": "UNAUTHORIZED", "message": "User not found"}}
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"error": {"code": "UNAUTHORIZED", "message": "Account is deactivated"}}
        )

    return user


async def get_current_admin(
    current_user: Annotated[User, Depends(get_current_user)]
) -> User:
    """Get the current user if they are an admin."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"error": {"code": "FORBIDDEN", "message": "Admin access required"}}
        )
    return current_user


# Type aliases for cleaner route signatures
DbSession = Annotated[AsyncSession, Depends(get_db_session)]
CurrentUser = Annotated[User, Depends(get_current_user)]
CurrentAdmin = Annotated[User, Depends(get_current_admin)]
AuthServiceDep = Annotated[AuthService, Depends(get_auth_service)]
UserServiceDep = Annotated[UserService, Depends(get_user_service)]
BookServiceDep = Annotated[BookService, Depends(get_book_service)]
ProgressServiceDep = Annotated[ProgressService, Depends(get_progress_service)]