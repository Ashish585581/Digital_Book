"""
BookLore FastAPI Application Entry Point.
"""
from contextlib import asynccontextmanager
from datetime import datetime

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.logging import setup_logging, get_logger
from app.core.exceptions import (
    BookLoreException,
    UnauthorizedException,
    ForbiddenException,
    NotFoundException,
    ConflictException,
    ValidationException,
    RateLimitException,
    ServiceUnavailableException,
    DatabaseException
)
from app.api.v1.router import api_router


# Setup logging
setup_logging()
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler for startup/shutdown events."""
    # Startup
    logger.info(f"Starting {settings.app_name} in {settings.app_env} mode")
    yield
    # Shutdown
    logger.info(f"Shutting down {settings.app_name}")


# Create FastAPI application
app = FastAPI(
    title=settings.app_name,
    description="Digital Library Platform for Schools",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Global exception handler for application-specific exceptions
@app.exception_handler(BookLoreException)
async def booklore_exception_handler(request: Request, exc: BookLoreException):
    """Handle BookLore application exceptions."""
    logger.warning(f"Application exception: {exc.code} - {exc.message}")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": exc.code,
                "message": exc.message
            }
        }
    )


# Global exception handler for unhandled exceptions
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Handle unhandled exceptions."""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": {
                "code": "INTERNAL_ERROR",
                "message": "An unexpected error occurred"
            }
        }
    )


# Handler for database connection errors
@app.exception_handler(ConnectionRefusedError)
async def connection_refused_handler(request: Request, exc: ConnectionRefusedError):
    """Handle database connection errors."""
    logger.error(f"Database connection refused: {exc}")
    return JSONResponse(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        content={
            "error": {
                "code": "DATABASE_UNAVAILABLE",
                "message": "Database service is temporarily unavailable"
            }
        }
    )


# Include API router
app.include_router(api_router, prefix="/api/v1")


# Root endpoint
@app.get("/", include_in_schema=False)
async def root():
    """Root endpoint redirecting to docs."""
    return {
        "name": settings.app_name,
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/api/v1/health"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=settings.booklore_port,
        reload=settings.app_debug
    )