"""
Tests for reading progress endpoints.
"""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_get_all_progress_empty(client: AsyncClient, test_user_data: dict):
    """Test getting all progress when no books have been read."""
    await client.post("/api/v1/auth/register", json=test_user_data)
    login_response = await client.post("/api/v1/auth/login", json={
        "username": test_user_data["username"],
        "password": test_user_data["password"]
    })
    token = login_response.json()["access_token"]

    response = await client.get(
        "/api/v1/progress",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["items"] == []


@pytest.mark.asyncio
async def test_get_progress_for_nonexistent_book(client: AsyncClient, test_user_data: dict):
    """Test getting progress for a book that doesn't exist."""
    await client.post("/api/v1/auth/register", json=test_user_data)
    login_response = await client.post("/api/v1/auth/login", json={
        "username": test_user_data["username"],
        "password": test_user_data["password"]
    })
    token = login_response.json()["access_token"]

    response = await client.get(
        "/api/v1/progress/99999",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["book_id"] == 99999
    assert data["progress_percent"] == 0


@pytest.mark.asyncio
async def test_update_progress_for_nonexistent_book(client: AsyncClient, test_user_data: dict):
    """Test updating progress for a book that doesn't exist returns 404."""
    await client.post("/api/v1/auth/register", json=test_user_data)
    login_response = await client.post("/api/v1/auth/login", json={
        "username": test_user_data["username"],
        "password": test_user_data["password"]
    })
    token = login_response.json()["access_token"]

    response = await client.put(
        "/api/v1/progress/99999",
        json={"progress_percent": 50, "last_position": "page 5"},
        headers={"Authorization": f"Bearer {token}"}
    )
    # Should return 404 because book doesn't exist
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_update_progress_validation(client: AsyncClient, test_user_data: dict):
    """Test progress update with invalid data."""
    await client.post("/api/v1/auth/register", json=test_user_data)
    login_response = await client.post("/api/v1/auth/login", json={
        "username": test_user_data["username"],
        "password": test_user_data["password"]
    })
    token = login_response.json()["access_token"]

    # Progress percent must be between 0 and 100
    response = await client.put(
        "/api/v1/progress/1",
        json={"progress_percent": 150},  # Invalid - over 100
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 422  # Validation error


@pytest.mark.asyncio
async def test_progress_requires_auth(client: AsyncClient):
    """Test that progress endpoints require authentication."""
    response = await client.get("/api/v1/progress")
    assert response.status_code == 403

    response = await client.get("/api/v1/progress/1")
    assert response.status_code == 403

    response = await client.put("/api/v1/progress/1", json={"progress_percent": 50})
    assert response.status_code == 403
