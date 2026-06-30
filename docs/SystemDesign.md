# BookLore - System Design Document

> **Status**: IN PROGRESS

---

## 1. Introduction

### 1.1 Purpose
This document provides a comprehensive system design for the BookLore Digital Library Platform, a production-grade system for managing and distributing educational content to schools.

### 1.2 Scope
- 100 schools target
- 20,000+ users per school (scalable to 2M+ total)
- PDF and EPUB book reading
- Class 1-12 book classification

### 1.3 Definitions

| Term | Definition |
|------|------------|
| `classGrade` | School grade classification (Class 1-12, General) |
| `Tenant` | A single school instance |
| `Admin` | School librarian/staff who manages books |
| `Student` | End user who reads books |

---

## 2. System Architecture

### 2.1 High-Level Architecture

```mermaid
graph TB
    subgraph "External Clients"
        Browser[Web Browser]
        Mobile[Mobile App - Future]
    end

    subgraph "Infrastructure Layer"
        CDN[CDN<br/>Cloudflare/AWS CloudFront]
        LB[Load Balancer<br/>NGINX]
    end

    subgraph "Application Layer"
        Frontend[React Frontend<br/>:3000]
        Backend[FastAPI Backend<br/>:8000]
        Worker[Background Worker<br/>Celery]
    end

    subgraph "Data Layer"
        PG[(PostgreSQL<br/>Primary)]
        PG_RO[(PostgreSQL<br/>Read Replica)]
        REDIS[(Redis<br/>Cache/Sessions)]
        S3[(Object Storage<br/>Books/Files)]
    end

    Browser --> CDN
    CDN --> LB
    LB --> Frontend
    LB --> Backend
    Backend --> PG
    Backend --> PG_RO
    Backend --> REDIS
    Backend --> S3
    Backend --> Worker
```

### 2.2 Component Interactions

```mermaid
sequenceDiagram
    participant User
    participant CDN
    participant Backend
    participant DB
    participant Cache
    participant Storage

    User->>CDN: Request static assets
    CDN-->>User: Static content

    User->>Backend: API Request
    Backend->>Cache: Check cache
    Cache-->>Backend: Cache hit/miss

    alt Cache miss
        Backend->>DB: Query database
        DB-->>Backend: Data
        Backend->>Cache: Store in cache
    end

    Backend-->>User: JSON Response

    alt File upload
        User->>Backend: Upload file
        Backend->>Storage: Store file
        Storage-->>Backend: File path
        Backend->>DB: Save metadata
        DB-->>Backend: Saved
    end
```

---

## 3. Functional Requirements

### 3.1 Core Features

| Feature ID | Feature | Priority | Description |
|------------|---------|----------|-------------|
| F1 | User Authentication | P0 | Login, logout, JWT tokens |
| F2 | Book Upload | P0 | Admin uploads PDF/EPUB |
| F3 | Book Listing | P0 | Browse all books |
| F4 | Book Reading | P0 | In-browser PDF/EPUB reader |
| F5 | Search | P0 | Search by title, author |
| F6 | Class Filter | P0 | Filter by classGrade |
| F7 | Reading Progress | P1 | Track last position |
| F8 | User Management | P1 | Admin manages students |
| F9 | Metadata Editing | P1 | Admin edits title/author/class |

### 3.2 User Interactions

```mermaid
graph LR
    subgraph "Student Flow"
        S1[Login] --> S2[Browse Library]
        S2 --> S3[Search/Filter]
        S3 --> S4[Select Book]
        S4 --> S5[Read Book]
        S5 --> S6[Progress Saved]
        S6 --> S5
    end

    subgraph "Admin Flow"
        A1[Login] --> A2[Go to Admin]
        A2 --> A3[Upload Book]
        A3 --> A4[Add Metadata]
        A4 --> A5[Manage Users]
        A5 --> A2
    end
```

---

## 4. Non-Functional Requirements

### 4.1 Performance

| Metric | Target | Notes |
|--------|--------|-------|
| Page Load | < 2s | First contentful paint |
| API Response | < 200ms | p95 latency |
| Book Open | < 3s | For files up to 100MB |
| Concurrent Users | 500/school | Burst capacity |
| Search Results | < 500ms | Full-text search |

### 4.2 Scalability

| Dimension | Current | Scalable To |
|-----------|---------|-------------|
| Users | 20,000/school | 100,000/school |
| Books | 10,000 | 100,000 |
| Storage | 100GB | 10TB |
| Schools | 1 | 100+ |

### 4.3 Availability

| Metric | Target |
|--------|--------|
| Uptime | 99.5% |
| Recovery Time | < 1 hour |
| Backup Frequency | Daily |

### 4.4 Security

- TLS 1.3 in transit
- bcrypt password hashing (cost factor 12)
- JWT with RS256
- Rate limiting on auth endpoints
- Input validation on all endpoints
- SQL injection prevention via ORM

---

## 5. Module Design

### 5.1 Authentication Module

```mermaid
classDiagram
    class AuthService {
        +login(username, password)
        +logout(refresh_token)
        +refresh_token(token)
        +register(user_data)
        +validate_token(token)
        +hash_password(password)
    }

    class TokenService {
        +create_access_token(data)
        +create_refresh_token(data)
        +verify_access_token(token)
        +verify_refresh_token(token)
    }

    class UserRepository {
        +find_by_username(username)
        +find_by_email(email)
        +create(user_data)
        +update_last_login(user_id)
    }

    AuthService --> TokenService
    AuthService --> UserRepository
```

**Responsibilities:**
- User registration and login
- JWT token generation and validation
- Password hashing with bcrypt
- Refresh token management

**APIs:**
- `POST /auth/register` - Create new user
- `POST /auth/login` - Authenticate and get tokens
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Invalidate refresh token

### 5.2 Book Management Module

```mermaid
classDiagram
    class BookService {
        +upload_book(file, metadata)
        +get_book(book_id)
        +list_books(filters)
        +delete_book(book_id)
        +update_metadata(book_id, data)
        +stream_book(book_id, user_id)
    }

    class FileService {
        +save_file(uploaded_file)
        +delete_file(file_path)
        +generate_thumbnail(pdf_path)
        +get_file_info(file_path)
    }

    class BookRepository {
        +create(book_data)
        +find_by_id(book_id)
        +find_all(filters)
        +delete(book_id)
        +update(book_id, data)
    }

    BookService --> FileService
    BookService --> BookRepository
```

**Responsibilities:**
- Book upload and storage
- File type validation (PDF, EPUB only)
- Metadata management
- Book streaming for reading
- Thumbnail generation

**APIs:**
- `GET /books` - List books (with pagination/filters)
- `GET /books/:id` - Get book details
- `POST /books` - Upload new book (admin)
- `PUT /books/:id` - Update book metadata (admin)
- `DELETE /books/:id` - Delete book (admin)
- `GET /books/:id/stream` - Stream book content

### 5.3 Reading Module

```mermaid
classDiagram
    class ReadingService {
        +get_progress(user_id, book_id)
        +update_progress(user_id, book_id, position)
        +get_all_progress(user_id)
    }

    class ProgressRepository {
        +find(user_id, book_id)
        +upsert(progress_data)
        +find_all_by_user(user_id)
    }

    ReadingService --> ProgressRepository
```

**Responsibilities:**
- Track reading position per user/book
- Resume reading from last position
- Calculate reading statistics

**APIs:**
- `GET /progress` - Get all reading progress for user
- `GET /progress/:bookId` - Get progress for specific book
- `PUT /progress/:bookId` - Update reading position

### 5.4 Search Module

```mermaid
classDiagram
    class SearchService {
        +search_books(query, filters)
        +build_search_query(query, filters)
    }

    class BookRepository {
        +full_text_search(query, filters)
    }
```

**Responsibilities:**
- Full-text search across title and authors
- Filter by classGrade
- Filter by book type (PDF/EPUB)
- Pagination

**APIs:**
- `GET /books/search?q=query&classGrade=6` - Search books

---

## 6. Database Design

### 6.1 Entity Relationship Diagram

```mermaid
erDiagram
    USERS {
        bigint id PK
        varchar username UK
        varchar email UK
        varchar password_hash
        varchar name
        varchar role
        boolean is_active
        timestamp created_at
        timestamp updated_at
        timestamp last_login_at
    }

    LIBRARIES {
        bigint id PK
        varchar name
        varchar icon
        boolean watch_enabled
        timestamp created_at
    }

    BOOKS {
        bigint id PK
        varchar file_name
        varchar file_path
        varchar file_hash
        varchar book_type
        bigint file_size
        bigint library_id FK
        varchar thumbnail_path
        timestamp created_at
        timestamp updated_at
    }

    BOOK_METADATA {
        bigint id PK
        bigint book_id FK UK
        varchar title
        varchar authors
        varchar class_grade
        timestamp created_at
        timestamp updated_at
    }

    READING_PROGRESS {
        bigint id PK
        bigint user_id FK
        bigint book_id FK
        int progress_percent
        varchar last_position
        timestamp last_read_at
        timestamp created_at
        timestamp updated_at
    }

    REFRESH_TOKENS {
        bigint id PK
        bigint user_id FK
        varchar token
        timestamp expires_at
        timestamp created_at
    }

    AUDIT_LOG {
        bigint id PK
        bigint user_id FK
        varchar action
        varchar entity_type
        bigint entity_id
        jsonb old_value
        jsonb new_value
        timestamp created_at
    }

    USERS ||--o{ REFRESH_TOKENS : "has"
    USERS ||--o{ READING_PROGRESS : "has"
    USERS ||--o{ AUDIT_LOG : "performed"
    LIBRARIES ||--o{ BOOKS : "contains"
    BOOKS ||--|| BOOK_METADATA : "has"
    BOOKS ||--o{ READING_PROGRESS : "tracked for"
```

### 6.2 Indexes

| Table | Column(s) | Type | Purpose |
|-------|-----------|------|---------|
| users | username | B-tree | Fast login lookup |
| users | email | B-tree | Fast login lookup |
| books | library_id | B-tree | Filter by library |
| books | book_type | B-tree | Filter by type |
| book_metadata | title | GIN | Full-text search |
| book_metadata | authors | GIN | Full-text search |
| book_metadata | class_grade | B-tree | Filter by grade |
| reading_progress | user_id, book_id | B-tree | Unique progress lookup |

---

## 7. API Design

### 7.1 Authentication APIs

```yaml
POST /api/v1/auth/register:
  body:
    username: string (required, 3-50 chars)
    email: string (required, valid email)
    password: string (required, min 8 chars)
    name: string (required)
  response:
    201: { id, username, email, role }
    400: { error: "Validation error" }
    409: { error: "User already exists" }

POST /api/v1/auth/login:
  body:
    username: string
    password: string
  response:
    200: { access_token, refresh_token, token_type, expires_in }
    401: { error: "Invalid credentials" }

POST /api/v1/auth/refresh:
  body:
    refresh_token: string
  response:
    200: { access_token, expires_in }
    401: { error: "Invalid or expired token" }

POST /api/v1/auth/logout:
  body:
    refresh_token: string
  response:
    200: { message: "Logged out" }
```

### 7.2 Book APIs

```yaml
GET /api/v1/books:
  query:
    page: int (default 1)
    limit: int (default 20, max 100)
    class_grade: string (optional)
    book_type: string (optional)
    search: string (optional)
  response:
    200:
      items: [Book]
      total: int
      page: int
      pages: int

GET /api/v1/books/{id}:
  response:
    200: Book
    404: { error: "Book not found" }

POST /api/v1/books:
  auth: Admin
  body:
    file: binary (PDF/EPUB)
    title: string
    authors: string
    class_grade: string (Class 1-12 or General)
  response:
    201: Book
    400: { error: "Invalid file type" }
    413: { error: "File too large" }

PUT /api/v1/books/{id}:
  auth: Admin
  body:
    title: string (optional)
    authors: string (optional)
    class_grade: string (optional)
  response:
    200: Book
    404: { error: "Book not found" }

DELETE /api/v1/books/{id}:
  auth: Admin
  response:
    204: No content
    404: { error: "Book not found" }

GET /api/v1/books/{id}/stream:
  auth: User
  response:
    200: binary stream (application/pdf or application/epub+zip)
    404: { error: "Book not found" }
```

### 7.3 Progress APIs

```yaml
GET /api/v1/progress:
  auth: User
  response:
    200: [{ book_id, progress_percent, last_position, last_read_at }]

GET /api/v1/progress/{bookId}:
  auth: User
  response:
    200: { book_id, progress_percent, last_position, last_read_at }
    404: { error: "Progress not found" }

PUT /api/v1/progress/{bookId}:
  auth: User
  body:
    progress_percent: int (0-100)
    last_position: string (page number or CFI)
  response:
    200: { message: "Progress updated" }
```

---

## 8. Security Design

### 8.1 Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant DB
    participant Cache

    User->>Frontend: Enter credentials
    Frontend->>Backend: POST /auth/login
    Backend->>DB: Get user by username
    DB-->>Backend: User record
    Backend->>Backend: Verify password (bcrypt)
    Backend->>Backend: Generate JWT pair
    Backend->>DB: Save refresh token hash
    Backend-->>Frontend: { access_token, refresh_token }
    Frontend->>Frontend: Store in memory
    Frontend-->>User: Redirect to home

    Note over User,Cache: Access token expires in 15 min
    User->>Frontend: API request
    Frontend->>Backend: Authorization: Bearer <access_token>
    Backend->>Backend: Validate JWT signature
    Backend-->>Frontend: API response

    Note over User,Cache: Access token expired
    User->>Frontend: API request (fails 401)
    Frontend->>Backend: POST /auth/refresh
    Backend->>DB: Verify refresh token
    Backend->>Backend: Generate new access token
    Backend-->>Frontend: New access token
    Frontend->>Backend: Retry original request
```

### 8.2 Password Security

- Algorithm: bcrypt
- Salt rounds: 12
- Password policy: Minimum 8 characters
- No password in logs

### 8.3 Token Security

| Token | Lifetime | Storage |
|-------|----------|---------|
| Access Token | 15 minutes | Memory only |
| Refresh Token | 7 days | HTTPOnly cookie + DB hash |

### 8.4 Rate Limiting

| Endpoint | Limit |
|----------|-------|
| `/auth/login` | 5 requests/minute/IP |
| `/auth/register` | 3 requests/minute/IP |
| `/auth/refresh` | 10 requests/minute/IP |
| All other APIs | 100 requests/minute/user |

---

## 9. Deployment Design

### 9.1 Docker Architecture

```mermaid
graph TB
    subgraph "Services"
        NGINX[NGINX Reverse Proxy]
        FRONTEND[React Frontend]
        API[FastAPI Backend]
        WORKER[Background Worker]
    end

    subgraph "Data Services"
        PG[(PostgreSQL)]
        REDIS[(Redis)]
    end

    subgraph "Storage"
        VOLUME[Docker Volumes<br/>/data/books<br/>/data/logs]
    end

    NGINX --> FRONTEND
    NGINX --> API
    API --> PG
    API --> REDIS
    API --> WORKER
    API --> VOLUME
    FRONTEND --> VOLUME
```

### 9.2 Environment Variables

```bash
# Backend
DATABASE_URL=postgresql+asyncpg://user:pass@postgres:5432/booklore
REDIS_URL=redis://redis:6379/0
JWT_SECRET_KEY=<generate-with-openssl>
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7

# Frontend
VITE_API_BASE_URL=http://localhost:8000/api/v1

# PostgreSQL
POSTGRES_USER=booklore
POSTGRES_PASSWORD=<strong-password>
POSTGRES_DB=booklore
```

---

## 10. Error Handling

### 10.1 Error Response Format

```json
{
  "error": {
    "code": "BOOK_NOT_FOUND",
    "message": "The requested book does not exist",
    "details": {
      "book_id": 123
    }
  }
}
```

### 10.2 Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| VALIDATION_ERROR | 400 | Invalid input data |
| UNAUTHORIZED | 401 | Missing or invalid token |
| FORBIDDEN | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource not found |
| CONFLICT | 409 | Resource already exists |
| RATE_LIMITED | 429 | Too many requests |
| INTERNAL_ERROR | 500 | Server error |

---

## 11. Monitoring & Logging

### 11.1 Log Levels

| Level | Usage |
|-------|-------|
| DEBUG | Detailed debugging info (dev only) |
| INFO | General operational events |
| WARNING | Abnormal but handled situations |
| ERROR | Failures that need attention |
| CRITICAL | System-wide failures |

### 11.2 Key Metrics

- Request latency (p50, p95, p99)
- Error rate by endpoint
- Active users
- Book upload count
- Reading session count

---

*Document Version: 1.0*
*Status: IN PROGRESS*
*Last Updated: 2026-06-28*