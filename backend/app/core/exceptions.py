"""
Custom exceptions for the application.
All exceptions include error codes for API responses.
"""
from fastapi import HTTPException, status


class BookLoreException(Exception):
    """Base exception for all application exceptions."""

    def __init__(
        self,
        code: str,
        message: str,
        status_code: int = status.HTTP_400_BAD_REQUEST
    ):
        self.code = code
        self.message = message
        self.status_code = status_code
        super().__init__(message)

    def to_http_exception(self) -> HTTPException:
        """Convert to FastAPI HTTPException."""
        return HTTPException(
            status_code=self.status_code,
            detail={"error": {"code": self.code, "message": self.message}}
        )


class ValidationException(BookLoreException):
    """Raised when input validation fails."""

    def __init__(self, message: str):
        super().__init__("VALIDATION_ERROR", message, status.HTTP_400_BAD_REQUEST)


class UnauthorizedException(BookLoreException):
    """Raised when authentication fails."""

    def __init__(self, message: str = "Invalid credentials"):
        super().__init__("UNAUTHORIZED", message, status.HTTP_401_UNAUTHORIZED)


class ForbiddenException(BookLoreException):
    """Raised when user lacks permissions."""

    def __init__(self, message: str = "Access forbidden"):
        super().__init__("FORBIDDEN", message, status.HTTP_403_FORBIDDEN)


class NotFoundException(BookLoreException):
    """Raised when a resource is not found."""

    def __init__(self, resource: str = "Resource"):
        super().__init__("NOT_FOUND", f"{resource} not found", status.HTTP_404_NOT_FOUND)


class ConflictException(BookLoreException):
    """Raised when there's a resource conflict."""

    def __init__(self, message: str = "Resource already exists"):
        super().__init__("CONFLICT", message, status.HTTP_409_CONFLICT)


class RateLimitException(BookLoreException):
    """Raised when rate limit is exceeded."""

    def __init__(self, message: str = "Too many requests"):
        super().__init__("RATE_LIMITED", message, status.HTTP_429_TOO_MANY_REQUESTS)


class FileTooLargeException(BookLoreException):
    """Raised when uploaded file exceeds size limit."""

    def __init__(self, message: str = "File too large"):
        super().__init__("FILE_TOO_LARGE", message, status.HTTP_413_REQUEST_ENTITY_TOO_LARGE)


class InvalidFileTypeException(BookLoreException):
    """Raised when file type is not allowed."""

    def __init__(self, message: str = "File type not allowed"):
        super().__init__("INVALID_FILE_TYPE", message, status.HTTP_400_BAD_REQUEST)