# BookLore - Deployment Guide

## Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- 4GB RAM minimum
- 20GB disk space

---

## Local Development with Docker

```bash
# Clone the repository
git clone https://github.com/your-org/booklore.git
cd booklore

# Start all services
docker-compose up --build

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

---

## Production Deployment on VPS

### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh

# Install Docker Compose
sudo apt install docker-compose -y

# Add current user to docker group
sudo usermod -aG docker $USER
```

### 2. Clone and Configure

```bash
# Clone repository
git clone https://github.com/your-org/booklore.git /opt/booklore
cd /opt/booklore

# Create production environment file
cat > .env.production << EOF
# Database
DATABASE_URL=postgresql+asyncpg://booklore:YOUR_PASSWORD@postgres:5432/booklore
POSTGRES_USER=booklore
POSTGRES_PASSWORD=YOUR_PASSWORD
POSTGRES_DB=booklore

# Redis
REDIS_URL=redis://redis:6379/0

# JWT
JWT_SECRET_KEY=$(openssl rand -hex 32)
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7

# Application
APP_ENV=production
APP_DEBUG=false
BOOKLORE_PORT=8000

# File Storage
UPLOAD_DIR=/data/books
MAX_FILE_SIZE=500000000
EOF

# Create data directory
sudo mkdir -p /data/books
sudo chown -R 1000:1000 /data/books
```

### 3. Configure NGINX

```bash
# Install NGINX
sudo apt install nginx -y

# Create NGINX config
sudo cat > /etc/nginx/sites-available/booklore << 'EOF'
server {
    listen 80;
    server_name your-domain.com;

    client_max_body_size 500M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /docs {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
    }
}
EOF

# Enable site
sudo ln -s /etc/nginx/sites-available/booklore /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

### 4. SSL Configuration (Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal (should happen automatically, but verify)
sudo certbot renew --dry-run
```

### 5. Start Services

```bash
cd /opt/booklore

# Start with Docker Compose (detached mode)
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### 6. Initialize Database

```bash
# Run migrations
docker-compose exec backend alembic upgrade head

# Create admin user
docker-compose exec backend python -c "
from app.services.auth_service import AuthService
from app.repositories.user_repository import UserRepository
from app.core.database import AsyncSessionLocal

async def create_admin():
    async with AsyncSessionLocal() as session:
        repo = UserRepository(session)
        service = AuthService(repo)
        await service.register({
            'username': 'admin',
            'email': 'admin@school.edu',
            'password': 'YOUR_ADMIN_PASSWORD',
            'name': 'Admin',
            'role': 'admin'
        })
        print('Admin user created')

import asyncio
asyncio.run(create_admin())
"
```

---

## Docker Compose Configuration

### docker-compose.yml (Development)

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: booklore
      POSTGRES_PASSWORD: devpassword
      POSTGRES_DB: booklore
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U booklore"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      DATABASE_URL: postgresql+asyncpg://booklore:devpassword@postgres:5432/booklore
      REDIS_URL: redis://redis:6379/0
      JWT_SECRET_KEY: dev-secret-key-change-in-production
      ACCESS_TOKEN_EXPIRE_MINUTES: 15
      REFRESH_TOKEN_EXPIRE_DAYS: 7
    ports:
      - "8000:8000"
    volumes:
      - ./data/books:/data/books
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      VITE_API_BASE_URL: http://localhost:8000/api/v1
    depends_on:
      - backend

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./docker/nginx.dev.conf:/etc/nginx/conf.d/default.conf
    depends_on:
      - frontend
      - backend

volumes:
  postgres_data:
  redis_data:
```

### docker-compose.prod.yml (Production)

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    backup: /data/backups
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    environment:
      DATABASE_URL: ${DATABASE_URL}
      REDIS_URL: ${REDIS_URL}
      JWT_SECRET_KEY: ${JWT_SECRET_KEY}
      JWT_ALGORITHM: ${JWT_ALGORITHM}
      ACCESS_TOKEN_EXPIRE_MINUTES: ${ACCESS_TOKEN_EXPIRE_MINUTES}
      REFRESH_TOKEN_EXPIRE_DAYS: ${REFRESH_TOKEN_EXPIRE_DAYS}
      APP_ENV: production
      APP_DEBUG: "false"
    volumes:
      - book_data:/data/books
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: unless-stopped

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
    environment:
      VITE_API_BASE_URL: /api/v1
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./docker/nginx.prod.conf:/etc/nginx/conf.d/default.conf
      - ./docker/ssl:/etc/nginx/ssl
    depends_on:
      - frontend
      - backend
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
  book_data:
```

---

## Backup Strategy

### Database Backup

```bash
# Daily backup cron job
0 2 * * * docker-compose exec postgres pg_dump -U booklore booklore > /data/backups/booklore_$(date +\%Y\%m\%d).sql
```

### File Backup

```bash
# Backup books directory
0 3 * * * rsync -avz /data/books /data/backups/books/
```

---

## Monitoring

### Health Check

```bash
curl http://localhost:8000/api/v1/health
```

### Docker Stats

```bash
docker stats
```

---

## Troubleshooting

### Database Connection Issues

```bash
# Check postgres logs
docker-compose logs postgres

# Test connection
docker-compose exec postgres psql -U booklore -d booklore
```

### Backend Issues

```bash
# Check backend logs
docker-compose logs backend

# Restart backend
docker-compose restart backend
```

---

*Document Version: 1.0*
*Status: COMPLETED*
*Last Updated: 2026-06-28*