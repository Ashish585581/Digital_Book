# BookLore - Database Design

## 1. Database Overview

- **Engine**: PostgreSQL 15+
- **ORM**: SQLAlchemy 2.0 (async)
- **Migrations**: Alembic
- **Connection**: Async via `asyncpg`

## 2. Entity Relationship Diagram

```mermaid
erDiagram
    USERS {
        bigint id PK "Auto-increment"
        varchar username UK "Unique username"
        varchar email UK "Unique email"
        varchar password_hash "bcrypt hash"
        varchar name "Display name"
        varchar role "admin | student"
        boolean is_active "Account status"
        timestamp created_at "Creation time"
        timestamp updated_at "Last update"
        timestamp last_login_at "Last login"
    }

    BOOKS {
        bigint id PK "Auto-increment"
        varchar file_name "Original filename"
        varchar file_path "Storage path"
        varchar file_hash "SHA256 hash"
        varchar book_type "PDF | EPUB"
        bigint file_size "Size in bytes"
        varchar thumbnail_path "Cover image path"
        timestamp created_at "Upload time"
        timestamp updated_at "Last update"
    }

    BOOK_METADATA {
        bigint id PK "Auto-increment"
        bigint book_id FK UK "Reference to books"
        varchar title "Book title"
        varchar authors "Author names"
        varchar class_grade "Class 1-12 or General"
        varchar thumbnail "Cover image URL"
        timestamp created_at "Creation time"
        timestamp updated_at "Last update"
    }

    READING_PROGRESS {
        bigint id PK "Auto-increment"
        bigint user_id FK "Reference to users"
        bigint book_id FK "Reference to books"
        int progress_percent "0-100"
        varchar last_position "Page number or CFI"
        timestamp last_read_at "Last read time"
        timestamp created_at "Creation time"
        timestamp updated_at "Last update"
    }

    REFRESH_TOKENS {
        bigint id PK "Auto-increment"
        bigint user_id FK "Reference to users"
        varchar token_hash "SHA256 of token"
        timestamp expires_at "Expiration time"
        timestamp created_at "Creation time"
    }

    AUDIT_LOG {
        bigint id PK "Auto-increment"
        bigint user_id FK "Reference to users"
        varchar action "Action performed"
        varchar entity_type "Entity type"
        bigint entity_id "Entity ID"
        jsonb old_value "Previous value"
        jsonb new_value "New value"
        timestamp created_at "Action time"
    }

    USERS ||--o{ REFRESH_TOKENS : "has"
    USERS ||--o{ READING_PROGRESS : "has"
    USERS ||--o{ AUDIT_LOG : "performed"
    BOOKS ||--|| BOOK_METADATA : "has"
    BOOKS ||--o{ READING_PROGRESS : "has progress for"
```

## 3. Table Definitions

### 3.1 users

```sql
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'student',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP,
    CONSTRAINT chk_role CHECK (role IN ('admin', 'student'))
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```

### 3.2 books

```sql
CREATE TABLE books (
    id BIGSERIAL PRIMARY KEY,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(1000) NOT NULL,
    file_hash VARCHAR(64),
    book_type VARCHAR(10) NOT NULL,
    file_size BIGINT NOT NULL DEFAULT 0,
    thumbnail_path VARCHAR(1000),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_book_type CHECK (book_type IN ('PDF', 'EPUB'))
);

CREATE INDEX idx_books_book_type ON books(book_type);
CREATE INDEX idx_books_created_at ON books(created_at);
CREATE INDEX idx_books_file_name ON books(file_name);
```

### 3.3 book_metadata

```sql
CREATE TABLE book_metadata (
    id BIGSERIAL PRIMARY KEY,
    book_id BIGINT NOT NULL UNIQUE,
    title VARCHAR(500) NOT NULL,
    authors VARCHAR(500) NOT NULL,
    class_grade VARCHAR(20) NOT NULL,
    thumbnail VARCHAR(1000),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_book_metadata_book FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    CONSTRAINT chk_class_grade CHECK (class_grade IN ('General', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'))
);

CREATE INDEX idx_book_metadata_title ON books(file_name);
CREATE INDEX idx_book_metadata_class_grade ON book_metadata(class_grade);

-- Full-text search index
CREATE INDEX idx_book_metadata_search ON book_metadata USING GIN (
    to_tsvector('english', title || ' ' || authors)
);
```

### 3.4 reading_progress

```sql
CREATE TABLE reading_progress (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    book_id BIGINT NOT NULL,
    progress_percent INTEGER NOT NULL DEFAULT 0,
    last_position VARCHAR(100),
    last_read_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_progress_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_progress_book FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    CONSTRAINT uk_user_book UNIQUE (user_id, book_id),
    CONSTRAINT chk_progress CHECK (progress_percent >= 0 AND progress_percent <= 100)
);

CREATE INDEX idx_progress_user_id ON reading_progress(user_id);
CREATE INDEX idx_progress_book_id ON reading_progress(book_id);
```

### 3.5 refresh_tokens

```sql
CREATE TABLE refresh_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_refresh_token_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
```

### 3.6 audit_log

```sql
CREATE TABLE audit_log (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT,
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id BIGINT,
    old_value JSONB,
    new_value JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);
```

## 4. Migrations (Alembic)

### Migration Timeline

| Version | Description |
|---------|-------------|
| V001 | Initial schema (users, books, book_metadata, reading_progress, refresh_tokens, audit_log) |
| V002 | Seed admin user |

## 5. Database Constraints

### 5.1 ClassGrade Values

```python
CLASS_GRADE_OPTIONS = [
    "General",
    "Class 1", "Class 2", "Class 3", "Class 4", "Class 5",
    "Class 6", "Class 7", "Class 8", "Class 9", "Class 10",
    "Class 11", "Class 12"
]
```

### 5.2 User Roles

```python
USER_ROLES = ["admin", "student"]
```

### 5.3 Book Types

```python
BOOK_TYPES = ["PDF", "EPUB"]
```

---

*Document Version: 1.0*
*Status: COMPLETED*
*Last Updated: 2026-06-28*