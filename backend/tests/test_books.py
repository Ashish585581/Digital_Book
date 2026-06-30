"""
Tests for book management endpoints.
"""
import pytest
from httpx import AsyncClient


@pytest.fixture
def auth_headers(client: AsyncClient, test_admin_data: dict) -> dict:
    """Get auth headers for admin user."""
    # This is a helper - actual test will register and login


@pytest.mark.asyncio
async def test_list_books_empty(client: AsyncClient, test_admin_data: dict):
    """Test listing books when none exist."""
    await client.post("/api/v1/auth/register", json=test_admin_data)
    login_response = await client.post("/api/v1/auth/login", json={
        "username": test_admin_data["username"],
        "password": test_admin_data["password"]
    })
    token = login_response.json()["access_token"]

    response = await client.get(
        "/api/v1/books",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["items"] == []
    assert data["total"] == 0


@pytest.mark.asyncio
async def test_list_books_pagination(client: AsyncClient, test_admin_data: dict):
    """Test book listing pagination."""
    await client.post("/api/v1/auth/register", json=test_admin_data)
    login_response = await client.post("/api/v1/auth/login", json={
        "username": test_admin_data["username"],
        "password": test_admin_data["password"]
    })
    token = login_response.json()["access_token"]

    response = await client.get(
        "/api/v1/books?page=1&limit=10",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "page" in data
    assert "pages" in data
    assert "total" in data
    assert "items" in data


@pytest.mark.asyncio
async def test_get_book_not_found(client: AsyncClient, test_admin_data: dict):
    """Test getting a book that doesn't exist."""
    await client.post("/api/v1/auth/register", json=test_admin_data)
    login_response = await client.post("/api/v1/auth/login", json={
        "username": test_admin_data["username"],
        "password": test_admin_data["password"]
    })
    token = login_response.json()["access_token"]

    response = await client.get(
        "/api/v1/books/99999",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_create_book_without_auth(client: AsyncClient):
    """Test that creating a book without auth fails."""
    response = await client.post("/api/v1/books")
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_update_book_not_found(client: AsyncClient, test_admin_data: dict):
    """Test updating a non-existent book."""
    await client.post("/api/v1/auth/register", json=test_admin_data)
    login_response = await client.post("/api/v1/auth/login", json={
        "username": test_admin_data["username"],
        "password": test_admin_data["password"]
    })
    token = login_response.json()["access_token"]

    response = await client.put(
        "/api/v1/books/99999",
        json={"title": "New Title"},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_delete_book_not_found(client: AsyncClient, test_admin_data: dict):
    """Test deleting a non-existent book."""
    await client.post("/api/v1/auth/register", json=test_admin_data)
    login_response = await client.post("/api/v1/auth/login", json={
        "username": test_admin_data["username"],
        "password": test_admin_data["password"]
    })
    token = login_response.json()["access_token"]

    response = await client.delete(
        "/api/v1/books/99999",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_stream_book_not_found(client: AsyncClient, test_admin_data: dict):
    """Test streaming a non-existent book."""
    await client.post("/api/v1/auth/register", json=test_admin_data)
    login_response = await client.post("/api/v1/auth/login", json={
        "username": test_admin_data["username"],
        "password": test_admin_data["password"]
    })
    token = login_response.json()["access_token"]

    response = await client.get(
        "/api/v1/books/99999/stream",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_upload_cover_without_file(client: AsyncClient, test_admin_data: dict):
    """Test uploading cover without providing file."""
    await client.post("/api/v1/auth/register", json=test_admin_data)
    login_response = await client.post("/api/v1/auth/login", json={
        "username": test_admin_data["username"],
        "password": test_admin_data["password"]
    })
    token = login_response.json()["access_token"]

    response = await client.post(
        "/api/v1/books/1/cover",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 422  # Validation error
