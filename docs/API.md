# BookLore - API Reference

## Base URL

```
http://localhost:8000/api/v1
```

## Authentication

All endpoints except `/auth/*` require JWT Bearer token:
```
Authorization: Bearer <access_token>
```

---

## Authentication Endpoints

### POST /auth/register

Register a new user (Admin only in production).

**Request:**
```json
{
  "username": "string (3-50 chars)",
  "email": "string (valid email)",
  "password": "string (min 8 chars)",
  "name": "string (display name)"
}
```

**Response (201):**
```json
{
  "id": 1,
  "username": "student1",
  "email": "student1@school.edu",
  "name": "Student One",
  "role": "student"
}
```

**Errors:**
- `400` - Validation error
- `409` - Username or email already exists

---

### POST /auth/login

Authenticate and get tokens.

**Request:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "expires_in": 900
}
```

**Errors:**
- `401` - Invalid credentials
- `429` - Too many requests (rate limited)

---

### POST /auth/refresh

Refresh access token.

**Request:**
```json
{
  "refresh_token": "string"
}
```

**Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "expires_in": 900
}
```

**Errors:**
- `401` - Invalid or expired refresh token

---

### POST /auth/logout

Logout and invalidate refresh token.

**Request:**
```json
{
  "refresh_token": "string"
}
```

**Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

---

## User Endpoints

### GET /users

List all users (Admin only).

**Query Parameters:**
- `page` (int, default: 1)
- `limit` (int, default: 20, max: 100)
- `role` (string, optional): Filter by role

**Response (200):**
```json
{
  "items": [
    {
      "id": 1,
      "username": "admin",
      "email": "admin@school.edu",
      "name": "Admin User",
      "role": "admin",
      "is_active": true,
      "created_at": "2026-06-28T10:00:00Z"
    }
  ],
  "total": 1,
  "page": 1,
  "pages": 1
}
```

---

### GET /users/{id}

Get user by ID.

**Response (200):**
```json
{
  "id": 1,
  "username": "admin",
  "email": "admin@school.edu",
  "name": "Admin User",
  "role": "admin",
  "is_active": true,
  "created_at": "2026-06-28T10:00:00Z",
  "last_login_at": "2026-06-28T12:00:00Z"
}
```

**Errors:**
- `404` - User not found

---

### POST /users

Create new user (Admin only).

**Request:**
```json
{
  "username": "string",
  "email": "string",
  "password": "string",
  "name": "string",
  "role": "student | admin"
}
```

**Response (201):** Same as GET /users/{id}

---

### PUT /users/{id}

Update user (Admin only).

**Request:**
```json
{
  "name": "string (optional)",
  "role": "student | admin (optional)",
  "is_active": "boolean (optional)"
}
```

**Response (200):** Same as GET /users/{id}

---

### DELETE /users/{id}

Delete user (Admin only).

**Response (204):** No content

**Errors:**
- `404` - User not found
- `400` - Cannot delete yourself

---

## Book Endpoints

### GET /books

List all books.

**Query Parameters:**
- `page` (int, default: 1)
- `limit` (int, default: 20, max: 100)
- `class_grade` (string, optional): Filter by class (e.g., "Class 6")
- `book_type` (string, optional): Filter by type ("PDF" or "EPUB")
- `search` (string, optional): Search in title/author

**Response (200):**
```json
{
  "items": [
    {
      "id": 1,
      "title": "Mathematics Class 6",
      "authors": "R.D. Sharma",
      "class_grade": "Class 6",
      "book_type": "PDF",
      "thumbnail": "/media/covers/abc123.jpg",
      "file_size": 10485760,
      "created_at": "2026-06-28T10:00:00Z"
    }
  ],
  "total": 1,
  "page": 1,
  "pages": 1
}
```

---

### GET /books/{id}

Get book details.

**Response (200):**
```json
{
  "id": 1,
  "title": "Mathematics Class 6",
  "authors": "R.D. Sharma",
  "class_grade": "Class 6",
  "book_type": "PDF",
  "thumbnail": "/media/covers/abc123.jpg",
  "file_name": "math_class6.pdf",
  "file_size": 10485760,
  "created_at": "2026-06-28T10:00:00Z"
}
```

**Errors:**
- `404` - Book not found

---

### POST /books

Upload new book (Admin only).

**Content-Type:** `multipart/form-data`

**Form Fields:**
- `file` (binary): PDF or EPUB file (max 500MB)
- `title` (string): Book title
- `authors` (string): Author name(s)
- `class_grade` (string): Class 1-12 or General

**Response (201):**
```json
{
  "id": 1,
  "title": "Mathematics Class 6",
  "authors": "R.D. Sharma",
  "class_grade": "Class 6",
  "book_type": "PDF",
  "thumbnail": null,
  "file_size": 10485760,
  "created_at": "2026-06-28T10:00:00Z"
}
```

**Errors:**
- `400` - Invalid file type (not PDF/EPUB)
- `413` - File too large

---

### PUT /books/{id}

Update book metadata (Admin only).

**Request:**
```json
{
  "title": "string (optional)",
  "authors": "string (optional)",
  "class_grade": "string (optional)"
}
```

**Response (200):** Same as GET /books/{id}

---

### DELETE /books/{id}

Delete book (Admin only).

**Response (204):** No content

**Errors:**
- `404` - Book not found

---

### GET /books/{id}/stream

Stream book content for reading.

**Headers:**
- `Range` (optional): RFC 7233 byte range

**Response (200):**
- `Content-Type`: `application/pdf` or `application/epub+zip`
- `Content-Length`: File size
- `Accept-Ranges`: bytes

**Errors:**
- `404` - Book not found

---

### POST /books/{id}/cover

Upload book cover image (Admin only).

**Content-Type:** `multipart/form-data`

**Form Fields:**
- `file` (binary): Image file (JPEG, PNG; max 5MB)

**Response (200):**
```json
{
  "thumbnail": "/media/covers/abc123.jpg"
}
```

---

## Reading Progress Endpoints

### GET /progress

Get all reading progress for current user.

**Response (200):**
```json
{
  "items": [
    {
      "book_id": 1,
      "progress_percent": 45,
      "last_position": "page:23",
      "last_read_at": "2026-06-28T12:00:00Z"
    }
  ]
}
```

---

### GET /progress/{bookId}

Get reading progress for specific book.

**Response (200):**
```json
{
  "book_id": 1,
  "progress_percent": 45,
  "last_position": "page:23",
  "last_read_at": "2026-06-28T12:00:00Z"
}
```

**Errors:**
- `404` - Progress not found

---

### PUT /progress/{bookId}

Update reading progress.

**Request:**
```json
{
  "progress_percent": 50,
  "last_position": "page:25"
}
```

**Response (200):**
```json
{
  "message": "Progress updated",
  "book_id": 1,
  "progress_percent": 50,
  "last_position": "page:25"
}
```

---

## Health Check

### GET /health

Health check endpoint (no auth required).

**Response (200):**
```json
{
  "status": "healthy",
  "timestamp": "2026-06-28T12:00:00Z"
}
```

---

## Error Response Format

All errors follow this format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": {}
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| VALIDATION_ERROR | 400 | Invalid input data |
| UNAUTHORIZED | 401 | Missing or invalid token |
| FORBIDDEN | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource not found |
| CONFLICT | 409 | Resource already exists |
| RATE_LIMITED | 429 | Too many requests |
| FILE_TOO_LARGE | 413 | Uploaded file exceeds limit |
| INVALID_FILE_TYPE | 400 | File type not supported |
| INTERNAL_ERROR | 500 | Server error |

---

*Document Version: 1.0*
*Status: COMPLETED*
*Last Updated: 2026-06-28*