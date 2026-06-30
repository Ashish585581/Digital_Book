"""
Common schema definitions.
"""
from pydantic import BaseModel


class ErrorDetail(BaseModel):
    """Error detail structure."""
    code: str
    message: str
    details: dict | None = None


class ErrorResponse(BaseModel):
    """Standard error response."""
    error: ErrorDetail


class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    timestamp: str