# BookLore - Testing Document

## Overview

Testing strategy for the BookLore Digital Library Platform.

---

## Testing Pyramid

```
        /\
       /E2E\         E2E Tests (Playwright)
      /------\
     /Integr. \      Integration Tests (API)
    /----------\
   /   Unit     \    Unit Tests (Services)
  /--------------\
```

---

## 1. Unit Tests

### 1.1 Backend Unit Tests

**Location**: `backend/tests/`

**Framework**: pytest with pytest-asyncio

**Coverage Targets**:
- Auth service: 90%
- Book service: 85%
- User service: 85%
- Progress service: 90%

**Example Test**:
```python
# tests/test_auth.py
import pytest
from app.services.auth_service import AuthService
from app.schemas.auth import UserCreate

@pytest.fixture
def auth_service():
    return AuthService(user_repository)

@pytest.mark.asyncio
async def test_login_success(auth_service):
    # Arrange
    user = await create_test_user()

    # Act
    result = await auth_service.login("testuser", "testpass")

    # Assert
    assert result.access_token is not None
    assert result.refresh_token is not None
    assert result.token_type == "bearer"

@pytest.mark.asyncio
async def test_login_invalid_password(auth_service):
    with pytest.raises(UnauthorizedException):
        await auth_service.login("testuser", "wrongpass")
```

### 1.2 Frontend Unit Tests

**Location**: `frontend/src/__tests__/`

**Framework**: Vitest + React Testing Library

**Example Test**:
```typescript
// src/__tests__/components/BookCard.test.tsx
import { render, screen } from '@testing-library/react';
import { BookCard } from '../components/books/BookCard';

describe('BookCard', () => {
  it('renders book title and author', () => {
    render(<BookCard book={mockBook} onRead={() => {}} />);

    expect(screen.getByText('Mathematics Class 6')).toBeInTheDocument();
    expect(screen.getByText('R.D. Sharma')).toBeInTheDocument();
  });

  it('shows class grade badge', () => {
    render(<BookCard book={mockBook} onRead={() => {}} />);

    expect(screen.getByText('Class 6')).toBeInTheDocument();
  });
});
```

---

## 2. Integration Tests

### 2.1 API Integration Tests

**Framework**: FastAPI TestClient + pytest

```python
# tests/test_books.py
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_create_book_admin():
    # Login as admin
    response = client.post("/api/v1/auth/login", json={
        "username": "admin",
        "password": "adminpass"
    })
    token = response.json()["access_token"]

    # Create book
    response = client.post(
        "/api/v1/books",
        headers={"Authorization": f"Bearer {token}"},
        files={"file": ("test.pdf", b"fake pdf", "application/pdf")},
        data={
            "title": "Test Book",
            "authors": "Test Author",
            "class_grade": "Class 6"
        }
    )

    assert response.status_code == 201
    assert response.json()["title"] == "Test Book"

def test_create_book_student_forbidden():
    # Login as student
    response = client.post("/api/v1/auth/login", json={
        "username": "student",
        "password": "studentpass"
    })
    token = response.json()["access_token"]

    # Try to create book
    response = client.post(
        "/api/v1/books",
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 403
```

### 2.2 Database Integration Tests

Use test database with transactions that rollback:

```python
# tests/conftest.py
import pytest
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from app.models.base import Base

@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture
async def test_db():
    engine = create_async_engine("postgresql://test:test@localhost/test_db")

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield engine

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

    await engine.dispose()
```

---

## 3. End-to-End Tests

### 3.1 E2E with Playwright

**Location**: `tests/e2e/`

```typescript
// tests/e2e/library.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Library', () => {
  test('student can browse and read books', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[name="username"]', 'student');
    await page.fill('[name="password"]', 'studentpass');
    await page.click('button[type="submit"]');

    // Browse library
    await expect(page).toHaveURL('/');
    await expect(page.locator('.book-card')).toHaveCount(10);

    // Filter by class
    await page.selectOption('select[name="classGrade"]', 'Class 6');
    await expect(page.locator('.book-card')).toHaveCount(3);

    // Open book
    await page.click('.book-card:first-child');
    await page.click('button:has-text("Read")');

    // Verify reader opened
    await expect(page.locator('.pdf-viewer')).toBeVisible();
  });

  test('admin can upload book', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="username"]', 'admin');
    await page.fill('[name="password"]', 'adminpass');
    await page.click('button[type="submit"]');

    // Navigate to upload
    await page.click('text=Upload Book');

    // Fill form
    await page.fill('[name="title"]', 'New Math Book');
    await page.fill('[name="authors"]', 'New Author');
    await page.selectOption('select[name="classGrade"]', 'Class 7');

    // Upload file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setFiles('test-data/math-book.pdf');

    // Submit
    await page.click('button:has-text("Upload")');

    // Verify success
    await expect(page.locator('.toast-success')).toBeVisible();
  });
});
```

---

## 4. Test Coverage

### 4.1 Coverage Targets

| Layer | Target |
|-------|--------|
| Backend Services | 85% |
| Backend API | 90% |
| Frontend Components | 80% |
| Frontend Hooks | 85% |
| Overall | 80% |

### 4.2 Running Tests

```bash
# Backend tests
cd backend
pytest --cov=app --cov-report=html

# Frontend tests
cd frontend
npm test -- --coverage

# E2E tests
npx playwright test
```

---

## 5. CI/CD Integration

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  backend-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - name: Install dependencies
        run: pip install -r requirements.txt
      - name: Run tests
        run: pytest --cov=app

  frontend-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Use Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npm test -- --coverage
```

---

## 6. Test Data

### 6.1 Fixtures

```python
# tests/fixtures.py
@pytest.fixture
def test_user():
    return {
        "username": "testuser",
        "email": "test@example.com",
        "password": "testpass123",
        "name": "Test User",
        "role": "student"
    }

@pytest.fixture
def test_admin():
    return {
        "username": "testadmin",
        "email": "admin@example.com",
        "password": "adminpass123",
        "name": "Test Admin",
        "role": "admin"
    }

@pytest.fixture
def test_book():
    return {
        "title": "Test Mathematics",
        "authors": "Test Author",
        "class_grade": "Class 6",
        "book_type": "PDF"
    }
```

---

*Document Version: 1.0*
*Status: COMPLETED*
*Last Updated: 2026-06-28*