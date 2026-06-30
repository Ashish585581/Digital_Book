"""
Pytest configuration and fixtures.
"""
import asyncio
import os
import pytest
import pytest_asyncio
from typing import AsyncGenerator

# Set test database URL BEFORE importing app modules
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///:memory:"

from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.main import app
from app.core.database import Base, get_db, engine


@pytest.fixture(scope="session")
def event_loop():
    """Create event loop for async tests."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="function")
async def test_db_setup():
    """Setup test database tables."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture
async def client(test_db_setup) -> AsyncGenerator[AsyncClient, None]:
    """Create test HTTP client."""
    async_session = async_sessionmaker(
        bind=engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autocommit=False,
        autoflush=False
    )

    async def override_get_db():
        async with async_session() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest.fixture
def test_user_data():
    """Sample user data for testing."""
    return {
        "username": "testuser",
        "email": "test@example.com",
        "password": "testpass123",
        "name": "Test User"
    }


@pytest.fixture
def test_admin_data():
    """Sample admin user data for testing."""
    return {
        "username": "testadmin",
        "email": "admin@example.com",
        "password": "adminpass123",
        "name": "Test Admin"
    }


@pytest.fixture
def test_book_metadata():
    """Sample book metadata for testing."""
    return {
        "title": "Test Mathematics",
        "authors": "Test Author",
        "class_grade": "Class 6"
    }
