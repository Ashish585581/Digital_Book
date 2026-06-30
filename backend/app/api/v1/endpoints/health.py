"""
Health check endpoint.
"""
from datetime import datetime
from fastapi import APIRouter

from app.schemas.common import HealthResponse


router = APIRouter()


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Health check"
)
async def health_check():
    """
    Check if the service is healthy.
    """
    return HealthResponse(
        status="healthy",
        timestamp=datetime.utcnow().isoformat()
    )