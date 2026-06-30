"""
API v1 router - aggregates all endpoint routers.
"""
from fastapi import APIRouter

from app.api.v1.endpoints import auth, users, books, progress, health


api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(books.router, prefix="/books", tags=["Books"])
api_router.include_router(progress.router, prefix="/progress", tags=["Progress"])
api_router.include_router(health.router, tags=["Health"])