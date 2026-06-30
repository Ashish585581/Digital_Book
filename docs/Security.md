# BookLore - Security Document

## Overview

Security measures and best practices for the BookLore Digital Library Platform.

---

## 1. Authentication Security

### 1.1 Password Storage

- **Algorithm**: bcrypt with cost factor 12
- **Never store**: Plain text passwords
- **Never log**: Passwords or password hashes

```python
# Correct password hashing
from passlib.context import CryptContext
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)
```

### 1.2 JWT Tokens

| Token Type | Lifetime | Storage |
|------------|----------|---------|
| Access Token | 15 minutes | Memory only (not localStorage) |
| Refresh Token | 7 days | HTTPOnly cookie |

**Token Structure**:
```json
{
  "sub": "user_id",
  "username": "string",
  "role": "admin|student",
  "exp": "expiration_timestamp",
  "iat": "issued_at_timestamp"
}
```

### 1.3 Token Security

- Access tokens stored in memory (not localStorage)
- Refresh tokens in HTTPOnly cookies
- Tokens validated on every request
- Expired tokens rejected

---

## 2. API Security

### 2.1 Authentication Middleware

```python
# Validate JWT on protected routes
async def get_current_user(token: str = Depends(JWTBearer())):
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
        user_id = payload.get("sub")
        if user_id is None:
            raise UnauthorizedException()
    except JWTError:
        raise UnauthorizedException()

    user = await user_repository.find_by_id(int(user_id))
    if user is None:
        raise UnauthorizedException()
    return user
```

### 2.2 Role-Based Access Control

```python
# Admin-only decorator
def admin_required(current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise ForbiddenException("Admin access required")
    return current_user
```

### 2.3 Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/auth/login` | 5 requests | per minute/IP |
| `/auth/register` | 3 requests | per minute/IP |
| `/auth/refresh` | 10 requests | per minute/IP |
| Other APIs | 100 requests | per minute/user |

---

## 3. Input Validation

### 3.1 Pydantic Schemas

All input is validated using Pydantic v2:

```python
from pydantic import BaseModel, EmailStr, field_validator

class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=8)
    name: str = Field(..., min_length=1, max_length=100)
    role: str = Field(default="student")

    @field_validator('role')
    @classmethod
    def validate_role(cls, v):
        if v not in ["admin", "student"]:
            raise ValueError("Role must be admin or student")
        return v
```

### 3.2 File Upload Validation

```python
ALLOWED_EXTENSIONS = {".pdf", ".epub"}
MAX_FILE_SIZE = 500 * 1024 * 1024  # 500MB

def validate_file(file: UploadFile):
    # Check extension
    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise ValidationException(f"File type {ext} not allowed")

    # Check size (read in chunks)
    size = 0
    while chunk := file.file.read(8192):
        size += len(chunk)
        if size > MAX_FILE_SIZE:
            raise ValidationException("File too large")
```

---

## 4. Database Security

### 4.1 SQL Injection Prevention

- Always use SQLAlchemy ORM (parameterized queries)
- Never concatenate user input into SQL strings
- Use async queries for all database operations

### 4.2 Connection Security

```python
# Async database connection
DATABASE_URL = "postgresql+asyncpg://user:pass@host:5432/db"

# Connection pool settings
engine = create_async_engine(
    DATABASE_URL,
    pool_size=20,
    max_overflow=10,
    pool_pre_ping=True
)
```

---

## 5. File Security

### 5.1 File Storage

- Files stored outside web root (`/data/books`)
- Files renamed to UUID to prevent path traversal
- Original filename preserved in database

### 5.2 File Path Validation

```python
def safe_file_path(filename: str) -> Path:
    # Remove path components
    name = Path(filename).name
    # Generate UUID-based name
    unique_name = f"{uuid.uuid4()}{Path(name).suffix}"
    return Path(UPLOAD_DIR) / unique_name
```

### 5.3 File Type Validation

```python
def validate_file_type(file_path: Path) -> str:
    # Check magic bytes for PDF
    with open(file_path, 'rb') as f:
        header = f.read(4)
        if header == b'%PDF':
            return 'PDF'

    # Check for EPUB (ZIP-based)
    with zipfile.ZipFile(file_path) as zf:
        if 'mimetype' in zf.namelist():
            mimetype = zf.read('mimetype').decode()
            if 'epub' in mimetype:
                return 'EPUB'

    raise ValidationException("Invalid file format")
```

---

## 6. CORS Configuration

```python
# Allow only specific origins in production
CORS_ORIGINS = [
    "https://your-domain.com",
    "http://localhost:3000"  # Development only
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 7. Security Headers

```nginx
# NGINX security headers
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

---

## 8. Audit Logging

All significant actions are logged:

```python
async def log_action(
    user_id: int,
    action: str,
    entity_type: str,
    entity_id: int,
    old_value: dict = None,
    new_value: dict = None
):
    audit_log = AuditLog(
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        old_value=old_value,
        new_value=new_value
    )
    await session.add(audit_log)
    await session.commit()
```

**Logged Actions**:
- User login/logout
- User creation/update/deletion
- Book upload/delete
- Metadata changes
- Permission changes

---

## 9. Security Checklist

### Pre-Deployment

- [ ] Change default JWT_SECRET_KEY
- [ ] Set strong database password
- [ ] Configure CORS origins
- [ ] Enable HTTPS (SSL certificate)
- [ ] Set up rate limiting
- [ ] Configure log rotation
- [ ] Remove debug mode
- [ ] Set proper file permissions

### Production

- [ ] Monitor error logs
- [ ] Review audit logs
- [ ] Backup database regularly
- [ ] Update dependencies
- [ ] Run security scans

---

## 10. Common Vulnerabilities

### Prevented by Design

| Vulnerability | Prevention |
|---------------|------------|
| SQL Injection | SQLAlchemy ORM |
| XSS | React auto-escaping |
| CSRF | JWT tokens |
| Password Cracking | bcrypt (cost 12) |
| Session Hijacking | HTTPOnly cookies |
| Path Traversal | UUID filenames |

---

*Document Version: 1.0*
*Status: COMPLETED*
*Last Updated: 2026-06-28*