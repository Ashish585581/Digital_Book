"""
Basic auth endpoint tests.
"""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    """Test health check endpoint."""
    response = await client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "timestamp" in data


@pytest.mark.asyncio
async def test_register_user(client: AsyncClient, test_user_data: dict):
    """Test user registration."""
    response = await client.post("/api/v1/auth/register", json=test_user_data)
    assert response.status_code == 201
    data = response.json()
    assert data["username"] == test_user_data["username"]
    assert data["email"] == test_user_data["email"]
    assert data["role"] == "student"
    assert "id" in data


@pytest.mark.asyncio
async def test_register_duplicate_username(client: AsyncClient, test_user_data: dict):
    """Test registration with duplicate username fails."""
    # Register first user
    response = await client.post("/api/v1/auth/register", json=test_user_data)
    assert response.status_code == 201

    # Try to register with same username
    duplicate_data = test_user_data.copy()
    duplicate_data["email"] = "different@example.com"
    response = await client.post("/api/v1/auth/register", json=duplicate_data)
    assert response.status_code == 409


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient, test_user_data: dict):
    """Test successful login."""
    # Register user first
    await client.post("/api/v1/auth/register", json=test_user_data)

    # Login
    response = await client.post("/api/v1/auth/login", json={
        "username": test_user_data["username"],
        "password": test_user_data["password"]
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_login_invalid_credentials(client: AsyncClient, test_user_data: dict):
    """Test login with invalid credentials."""
    # Register user first
    await client.post("/api/v1/auth/register", json=test_user_data)

    # Login with wrong password
    response = await client.post("/api/v1/auth/login", json={
        "username": test_user_data["username"],
        "password": "wrongpassword"
    })
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_me_authenticated(client: AsyncClient, test_user_data: dict):
    """Test getting current user profile."""
    # Register and login
    await client.post("/api/v1/auth/register", json=test_user_data)
    login_response = await client.post("/api/v1/auth/login", json={
        "username": test_user_data["username"],
        "password": test_user_data["password"]
    })
    token = login_response.json()["access_token"]

    # Get current user
    response = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == test_user_data["username"]


@pytest.mark.asyncio
async def test_get_me_unauthenticated(client: AsyncClient):
    """Test getting current user without auth fails."""
    response = await client.get("/api/v1/auth/me")
    assert response.status_code == 403  # HTTPBearer returns 403 when no token