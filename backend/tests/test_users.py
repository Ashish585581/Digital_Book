"""
Tests for user management endpoints.
"""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_users_as_admin(client: AsyncClient, test_admin_data: dict):
    """Test listing users as admin."""
    # Create admin user
    await client.post("/api/v1/auth/register", json=test_admin_data)

    # Login as admin
    login_response = await client.post("/api/v1/auth/login", json={
        "username": test_admin_data["username"],
        "password": test_admin_data["password"]
    })
    token = login_response.json()["access_token"]

    # Create some users
    for i in range(3):
        await client.post("/api/v1/auth/register", json={
            "username": f"user{i}",
            "email": f"user{i}@example.com",
            "password": "pass123",
            "name": f"User {i}"
        })

    # List users
    response = await client.get(
        "/api/v1/users",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data
    assert data["total"] >= 4  # 3 users + 1 admin


@pytest.mark.asyncio
async def test_list_users_with_role_filter(client: AsyncClient, test_admin_data: dict):
    """Test listing users with role filter."""
    # Create admin and login
    await client.post("/api/v1/auth/register", json=test_admin_data)
    login_response = await client.post("/api/v1/auth/login", json={
        "username": test_admin_data["username"],
        "password": test_admin_data["password"]
    })
    token = login_response.json()["access_token"]

    # Filter by admin role
    response = await client.get(
        "/api/v1/users?role=admin",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    for user in data["items"]:
        assert user["role"] == "admin"


@pytest.mark.asyncio
async def test_get_user_by_id(client: AsyncClient, test_admin_data: dict, test_user_data: dict):
    """Test getting a specific user by ID."""
    # Create admin and user
    await client.post("/api/v1/auth/register", json=test_admin_data)
    await client.post("/api/v1/auth/register", json=test_user_data)

    # Login as admin
    login_response = await client.post("/api/v1/auth/login", json={
        "username": test_admin_data["username"],
        "password": test_admin_data["password"]
    })
    token = login_response.json()["access_token"]

    # Get user by ID (test_user_data has id 2, admin has id 1)
    response = await client.get(
        "/api/v1/users/2",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == test_user_data["username"]


@pytest.mark.asyncio
async def test_get_nonexistent_user(client: AsyncClient, test_admin_data: dict):
    """Test getting a user that doesn't exist."""
    await client.post("/api/v1/auth/register", json=test_admin_data)
    login_response = await client.post("/api/v1/auth/login", json={
        "username": test_admin_data["username"],
        "password": test_admin_data["password"]
    })
    token = login_response.json()["access_token"]

    response = await client.get(
        "/api/v1/users/99999",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_create_user_as_admin(client: AsyncClient, test_admin_data: dict):
    """Test creating a new user as admin."""
    await client.post("/api/v1/auth/register", json=test_admin_data)
    login_response = await client.post("/api/v1/auth/login", json={
        "username": test_admin_data["username"],
        "password": test_admin_data["password"]
    })
    token = login_response.json()["access_token"]

    new_user = {
        "username": "newuser",
        "email": "new@example.com",
        "password": "password123",
        "name": "New User",
        "role": "student"
    }

    response = await client.post(
        "/api/v1/users",
        json=new_user,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["username"] == "newuser"
    assert data["role"] == "student"


@pytest.mark.asyncio
async def test_create_duplicate_username(client: AsyncClient, test_admin_data: dict, test_user_data: dict):
    """Test creating user with duplicate username fails."""
    await client.post("/api/v1/auth/register", json=test_admin_data)
    await client.post("/api/v1/auth/register", json=test_user_data)

    login_response = await client.post("/api/v1/auth/login", json={
        "username": test_admin_data["username"],
        "password": test_admin_data["password"]
    })
    token = login_response.json()["access_token"]

    duplicate_user = {
        "username": test_user_data["username"],
        "email": "different@example.com",
        "password": "password123",
        "name": "Duplicate"
    }

    response = await client.post(
        "/api/v1/users",
        json=duplicate_user,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 409


@pytest.mark.asyncio
async def test_update_user(client: AsyncClient, test_admin_data: dict, test_user_data: dict):
    """Test updating a user's details."""
    await client.post("/api/v1/auth/register", json=test_admin_data)
    await client.post("/api/v1/auth/register", json=test_user_data)

    login_response = await client.post("/api/v1/auth/login", json={
        "username": test_admin_data["username"],
        "password": test_admin_data["password"]
    })
    token = login_response.json()["access_token"]

    response = await client.put(
        "/api/v1/users/2",
        json={"name": "Updated Name", "role": "admin"},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Updated Name"
    assert data["role"] == "admin"


@pytest.mark.asyncio
async def test_cannot_modify_own_account(client: AsyncClient, test_admin_data: dict):
    """Test that admin cannot modify their own account via users endpoint."""
    await client.post("/api/v1/auth/register", json=test_admin_data)
    login_response = await client.post("/api/v1/auth/login", json={
        "username": test_admin_data["username"],
        "password": test_admin_data["password"]
    })
    token = login_response.json()["access_token"]
    admin_id = login_response.json()["user"]["id"]

    response = await client.put(
        f"/api/v1/users/{admin_id}",
        json={"name": "Trying to change myself"},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_delete_user(client: AsyncClient, test_admin_data: dict, test_user_data: dict):
    """Test deleting a user."""
    await client.post("/api/v1/auth/register", json=test_admin_data)
    await client.post("/api/v1/auth/register", json=test_user_data)

    login_response = await client.post("/api/v1/auth/login", json={
        "username": test_admin_data["username"],
        "password": test_admin_data["password"]
    })
    token = login_response.json()["access_token"]

    response = await client.delete(
        "/api/v1/users/2",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 204


@pytest.mark.asyncio
async def test_cannot_delete_own_account(client: AsyncClient, test_admin_data: dict):
    """Test that admin cannot delete their own account."""
    await client.post("/api/v1/auth/register", json=test_admin_data)
    login_response = await client.post("/api/v1/auth/login", json={
        "username": test_admin_data["username"],
        "password": test_admin_data["password"]
    })
    token = login_response.json()["access_token"]
    admin_id = login_response.json()["user"]["id"]

    response = await client.delete(
        f"/api/v1/users/{admin_id}",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 403
