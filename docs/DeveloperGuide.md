# BookLore - Developer Guide

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- Git

### Clone Repository

```bash
git clone https://github.com/your-org/booklore.git
cd booklore
```

---

## Backend Development

### 1. Virtual Environment Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Linux/Mac)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Environment Configuration

```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your settings
DATABASE_URL=postgresql+asyncpg://booklore:password@localhost:5432/booklore
REDIS_URL=redis://localhost:6379/0
JWT_SECRET_KEY=your-secret-key-change-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7
```

### 3. Database Setup

```bash
# Create PostgreSQL database
psql -U postgres
CREATE DATABASE booklore;
CREATE USER booklore WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE booklore TO booklore;
\q

# Run migrations
alembic upgrade head

# Seed initial data
python -m app.scripts.seed
```

### 4. Run Development Server

```bash
# From backend directory
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Or with hot reload
fastapi dev app/main.py --port 8000
```

### 5. Run Tests

```bash
pytest tests/ -v
pytest tests/ -v --cov=app --cov-report=html
```

---

## Frontend Development

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Environment Configuration

```bash
# Create .env file
echo "VITE_API_BASE_URL=http://localhost:8000/api/v1" > .env
```

### 3. Run Development Server

```bash
npm run dev
```

### 4. Build for Production

```bash
npm run build
```

### 5. Run Tests

```bash
npm test
```

---

## Project Structure

### Backend Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app entry point
│   ├── config.py            # Settings management
│   ├── database.py          # Database connection
│   ├── dependencies.py      # Dependency injection
│   │
│   ├── api/                 # API endpoints
│   │   └── v1/
│   │       ├── router.py
│   │       ├── auth.py
│   │       ├── users.py
│   │       ├── books.py
│   │       └── progress.py
│   │
│   ├── models/              # SQLAlchemy models
│   │   ├── base.py
│   │   ├── user.py
│   │   ├── book.py
│   │   └── ...
│   │
│   ├── schemas/             # Pydantic schemas
│   │   ├── auth.py
│   │   ├── user.py
│   │   └── ...
│   │
│   ├── services/            # Business logic
│   │   ├── auth_service.py
│   │   ├── user_service.py
│   │   └── ...
│   │
│   ├── repositories/        # Data access
│   │   ├── user_repository.py
│   │   └── ...
│   │
│   └── core/                # Core utilities
│       ├── config.py
│       ├── security.py
│       └── exceptions.py
│
├── tests/                   # Tests
├── alembic/                 # Database migrations
├── requirements.txt
├── Dockerfile
└── .env.example
```

### Frontend Structure

```
frontend/
├── src/
│   ├── api/                 # API client functions
│   ├── components/          # React components
│   ├── pages/               # Page components
│   ├── hooks/               # Custom hooks
│   ├── stores/              # Zustand stores
│   ├── types/               # TypeScript types
│   ├── App.tsx
│   └── main.tsx
├── public/
├── package.json
└── vite.config.ts
```

---

## Code Standards

### Python (Backend)

1. **Follow PEP 8**
2. **Use type hints** on all functions
3. **Docstrings** on all classes and public methods
4. **Async/await** for all I/O operations
5. **Repository pattern** for data access
6. **Service layer** for business logic

### TypeScript (Frontend)

1. **Strict TypeScript** - no `any` types
2. **Functional components** with hooks
3. **Named exports** over default exports
4. **Component files** - one component per file
5. **Types in separate files** - `types/` folder

---

## Git Workflow

### Branch Naming

```
feature/feature-name
bugfix/bug-description
hotfix/critical-fix
```

### Commit Messages

```
feat: add user registration
fix: resolve login issue with special characters
docs: update API documentation
test: add integration tests for auth
refactor: simplify book service
```

### Pull Request Process

1. Create feature branch
2. Make changes
3. Add tests
4. Update documentation
5. Submit PR for review
6. Address review feedback
7. Merge after approval

---

## Debugging

### Backend Debugging

```python
# Add breakpoint
import pdb; pdb.set_trace()

# Or use ipdb
import ipdb; ipdb.set_trace()
```

### Frontend Debugging

```typescript
// Add console log
console.log('Debug:', value);

// Or use debugger
debugger;
```

### Docker Debugging

```bash
# View logs
docker-compose logs -f backend

# Enter container
docker-compose exec backend bash

# Check database
docker-compose exec postgres psql -U booklore -d booklore
```

---

## Common Tasks

### Create New Model

1. Create model in `app/models/`
2. Create schema in `app/schemas/`
3. Create repository in `app/repositories/`
4. Create service in `app/services/`
5. Add endpoints in `app/api/v1/`
6. Create migration: `alembic revision --autogenerate -m "Add new table"`

### Add New API Endpoint

1. Add Pydantic schema in `app/schemas/`
2. Add business logic in `app/services/`
3. Add endpoint in `app/api/v1/`
4. Add tests in `tests/`

### Update Database Schema

```bash
# Create migration
alembic revision --autogenerate -m "Description of changes"

# Apply migration
alembic upgrade head

# Rollback if needed
alembic downgrade -1
```

---

## Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)
- [React Documentation](https://react.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)

---

*Document Version: 1.0*
*Status: COMPLETED*
*Last Updated: 2026-06-28*