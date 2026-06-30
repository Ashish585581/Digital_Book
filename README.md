# BookLore - Digital Library Platform

A production-grade digital library platform designed for Indian schools (Class 1-12).

## Features

- **Book Management**: Upload and manage PDF/EPUB books with metadata
- **Reading**: Built-in PDF and EPUB readers with progress tracking
- **User Management**: Admin and student roles with full CRUD
- **Authentication**: JWT-based auth with access/refresh tokens
- **Scalable**: Designed for 100 schools × 20,000 users = 2M potential users

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Python FastAPI + SQLAlchemy 2.0 (async) |
| Database | PostgreSQL 15 |
| Cache | Redis |
| Frontend | React 18 + TypeScript + Vite |
| UI | Tailwind CSS + Radix UI |
| State | Zustand |
| Reading | react-pdf (PDF) + epubjs (EPUB) |
| Deploy | Docker + Docker Compose |

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Python 3.11+ (for local development)
- Node.js 18+ (for local frontend development)

### Production Deployment

```bash
# Clone the repository
git clone <repository-url>
cd booklore

# Copy environment file and configure
cp .env.docker .env
# Edit .env with your secure passwords

# Build and start
docker-compose up -d

# View logs
docker-compose logs -f
```

Access:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Development Setup

```bash
# Start infrastructure
docker-compose -f docker-compose.dev.yml up -d postgres redis

# Backend
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

## Project Structure

```
booklore/
├── backend/
│   ├── app/
│   │   ├── api/v1/endpoints/  # API routes
│   │   ├── core/              # Config, security, db
│   │   ├── models/            # SQLAlchemy models
│   │   ├── repositories/      # Data access layer
│   │   ├── schemas/           # Pydantic schemas
│   │   └── services/          # Business logic
│   ├── alembic/               # Database migrations
│   └── tests/                 # Pytest tests
├── frontend/
│   ├── src/
│   │   ├── api/               # Axios client
│   │   ├── components/        # React components
│   │   ├── pages/             # Page components
│   │   ├── stores/            # Zustand stores
│   │   └── types/             # TypeScript types
│   └── public/                # Static assets
├── docker-compose.yml         # Production
├── docker-compose.dev.yml     # Development
└── Makefile                  # Commands
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `POSTGRES_PASSWORD` | PostgreSQL password | devpassword |
| `JWT_SECRET_KEY` | JWT signing key (min 32 chars) | - |
| `DATABASE_URL` | PostgreSQL connection string | postgresql+asyncpg://... |
| `REDIS_URL` | Redis connection string | redis://localhost:6379/0 |
| `APP_ENV` | Environment | development |
| `APP_DEBUG` | Debug mode | true |

### Class Grades

Books are classified by school grade:
- General
- Class 1 through Class 12

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register new user |
| POST | `/api/v1/auth/login` | Login |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| POST | `/api/v1/auth/logout` | Logout |

### Users (Admin)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/users` | List users (paginated) |
| GET | `/api/v1/users/{id}` | Get user details |
| POST | `/api/v1/users` | Create user |
| PUT | `/api/v1/users/{id}` | Update user |
| DELETE | `/api/v1/users/{id}` | Delete user |

### Books
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/books` | List books (paginated, filterable) |
| GET | `/api/v1/books/{id}` | Get book details |
| POST | `/api/v1/books` | Upload book (Admin) |
| PUT | `/api/v1/books/{id}` | Update book metadata (Admin) |
| DELETE | `/api/v1/books/{id}` | Delete book (Admin) |
| GET | `/api/v1/books/{id}/stream` | Stream book file |
| POST | `/api/v1/books/{id}/cover` | Upload cover image |

### Reading Progress
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/progress` | Get all progress |
| GET | `/api/v1/progress/{book_id}` | Get progress for book |
| PUT | `/api/v1/progress/{book_id}` | Update progress |

## Docker Commands

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Restart a service
docker-compose restart backend

# Clean up everything (including volumes)
docker-compose down -v

# Use Makefile
make build    # Build
make up       # Start
make down     # Stop
make logs     # View logs
make clean    # Remove everything
```

## Deployment on VPS

### 1. Server Setup

```bash
# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh
usermod -aG docker ubuntu

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
```

### 2. Clone and Configure

```bash
git clone <repository-url> /opt/booklore
cd /opt/booklore

# Configure environment
cp .env.docker .env
nano .env  # Set secure passwords
```

### 3. Deploy

```bash
docker-compose up -d --build
docker-compose ps  # Verify all services running
```

### 4. Nginx (if not using Docker frontend)

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
    }

    location /api {
        proxy_pass http://localhost:8000;
    }
}
```

### 5. SSL with Certbot

```bash
apt install certbot python3-certbot-nginx
certbot --nginx -d your-domain.com
```

## Testing

### Backend Tests

```bash
cd backend
pip install -r requirements.txt
pytest tests/ -v
```

### Frontend Tests

```bash
cd frontend
npm install
npm test
```

## Default Admin Account

After first deployment, create an admin via the API:

```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","email":"admin@school.edu","password":"adminpass123","name":"Admin"}'
```

Then manually update the user's role to `admin` in the database, or use a seed script.

## License

Private - All rights reserved
