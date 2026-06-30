"""
Base repository class with common database operations.
"""
from typing import Generic, TypeVar, Type
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import Base


ModelType = TypeVar("ModelType", bound=Base)


class BaseRepository(Generic[ModelType]):
    """
    Base repository with common CRUD operations.
    All repositories should inherit from this class.
    """

    def __init__(self, session: AsyncSession, model: Type[ModelType]):
        self._session = session
        self._model = model

    async def get_by_id(self, id: int) -> ModelType | None:
        """Get a single record by ID."""
        result = await self._session.execute(
            select(self._model).where(self._model.id == id)
        )
        return result.scalar_one_or_none()

    async def get_all(self, skip: int = 0, limit: int = 100) -> list[ModelType]:
        """Get all records with pagination."""
        result = await self._session.execute(
            select(self._model).offset(skip).limit(limit)
        )
        return list(result.scalars().all())

    async def count(self) -> int:
        """Count total records."""
        result = await self._session.execute(
            select(func.count()).select_from(self._model)
        )
        return result.scalar_one()

    async def create(self, obj: ModelType) -> ModelType:
        """Create a new record."""
        self._session.add(obj)
        await self._session.flush()
        await self._session.refresh(obj)
        return obj

    async def update(self, obj: ModelType) -> ModelType:
        """Update an existing record."""
        await self._session.flush()
        await self._session.refresh(obj)
        return obj

    async def delete(self, obj: ModelType) -> None:
        """Delete a record."""
        await self._session.delete(obj)
        await self._session.flush()

    async def refresh(self, obj: ModelType) -> None:
        """Refresh a record from the database."""
        await self._session.refresh(obj)

    async def commit(self) -> None:
        """Commit the current transaction."""
        await self._session.commit()

    async def rollback(self) -> None:
        """Rollback the current transaction."""
        await self._session.rollback()