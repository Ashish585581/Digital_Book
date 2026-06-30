# BookLore - Installation Guide

## Quick Start (Docker)

The fastest way to get BookLore running:

```bash
# Clone the repository
git clone https://github.com/your-org/booklore.git
cd booklore

# Start with Docker Compose
docker-compose up --build

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

---

## Prerequisites

### For Docker Installation
- Docker 20.10+
- Docker Compose 2.0+
- 4GB RAM minimum
- 20GB disk space

### For Native Installation
- Python 3.11+
- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- Git

---

## Docker Installation

### 1. Clone and Setup

```bash
git clone https://github.com/your-org/booklore.git
cd booklore
```

### 2. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your configuration
nano .env
```

Required environment variables:

```bash
# Database
DATABASE_URL=postgresql+asyncpg://booklore:password@postgres:5432/booklore
POSTGRES_USER=booklore
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=booklore

# Redis
REDIS_URL=redis://redis:6379/0

# JWT (generate a secure key)
JWT_SECRET_KEY=$(openssl rand -hex 32)

# Application
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7
```

### 3. Start Services

```bash
# Build and start all services
docker-compose up --build

# Start in background
docker-compose up --build -d

# Check status
docker-compose ps
```

### 4. Create Admin User

```bash
# First login via API to create admin
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@school.edu",
    "password": "YourSecurePassword123",
    "name": "Admin User"
  }'
```

### 5. Access Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

---

## Native Installation (Backend)

### 1. Clone Repository

```bash
git clone https://github.com/your-org/booklore.git
cd booklore/backend
```

### 2. Create Virtual Environment

```bash
# Create venv
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Linux/Mac)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Set Up PostgreSQL

```bash
# Install PostgreSQL (Ubuntu/Debian)
sudo apt install postgresql postgresql-contrib

# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql << EOF
CREATE DATABASE booklore;
CREATE USER booklore WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE booklore TO booklore;
ALTER DATABASE booklore OWNER TO booklore;
EOF
```

### 4. Set Up Redis

```bash
# Install Redis (Ubuntu/Debian)
sudo apt install redis-server

# Start Redis
sudo systemctl start redis
sudo systemctl enable redis
```

### 5. Configure Environment

```bash
# Copy and edit environment file
cp .env.example .env
nano .env
```

### 6. Run Migrations

```bash
# Create initial tables
alembic upgrade head

# Seed admin user
python -m app.scripts.seed_admin
```

### 7. Run Development Server

```bash
# Start server with hot reload
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

---

## Native Installation (Frontend)

### 1. Navigate to Frontend

```bash
cd ../frontend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

```bash
echo "VITE_API_BASE_URL=http://localhost:8000/api/v1" > .env
```

### 4. Run Development Server

```bash
npm run dev
```

### 5. Build for Production

```bash
npm run build
npm run preview
```

---

## Production VPS Deployment

### 1. Server Setup

```bash
# SSH into your VPS
ssh root@your-vps-ip

# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh

# Install Docker Compose
apt install docker-compose -y

# Add Docker group
usermod -aG docker $USER
```

### 2. Clone and Configure

```bash
# Clone repository
git clone https://github.com/your-org/booklore.git /opt/booklore
cd /opt/booklore

# Copy production environment
cp .env.example .env.production
nano .env.production
```

### 3. Configure NGINX

```bash
# Install NGINX
apt install nginx -y

# Create NGINX config
cat > /etc/nginx/sites-available/booklore << 'EOF'
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
    }
}
EOF

# Enable site
ln -s /etc/nginx/sites-available/booklore /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
```

### 4. SSL Certificate

```bash
# Install Certbot
apt install certbot python3-certbot-nginx -y

# Get certificate
certbot --nginx -d your-domain.com

# Auto-renewal
certbot renew --dry-run
```

### 5. Start Services

```bash
cd /opt/booklore

# Start with Docker Compose
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker-compose -f docker-compose.prod.yml ps
```

### 6. Initialize Database

```bash
# Run migrations
docker-compose -f docker-compose.prod.yml exec backend alembic upgrade head

# Create admin user via API
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@school.edu",
    "password": "YourSecurePassword123",
    "name": "Admin User"
  }'
```

---

## Troubleshooting

### Docker Issues

**Port already in use:**
```bash
# Check what's using port 80 or 8000
netstat -tlnp | grep :8000

# Kill the process or change port in docker-compose.yml
```

**Database connection failed:**
```bash
# Check postgres container logs
docker-compose logs postgres

# Ensure DATABASE_URL is correct
```

**Out of memory:**
```bash
# Increase Docker memory in Docker Desktop settings
# Or add swap space
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

### Native Installation Issues

**Python version mismatch:**
```bash
# Check Python version (need 3.11+)
python --version

# If using pyenv
pyenv install 3.11
pyenv global 3.11
```

**PostgreSQL connection refused:**
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Check pg_hba.conf allows connections
sudo nano /etc/postgresql/15/main/pg_hba.conf
```

**Node modules issue:**
```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

---

## Next Steps

After installation:

1. **Login** to the admin panel
2. **Configure** school name and settings
3. **Upload** some sample books
4. **Create** student accounts
5. **Test** the reading experience

---

## Support

For issues:
1. Check the [API documentation](http://localhost:8000/docs)
2. Check Docker logs: `docker-compose logs -f`
3. Check application logs in `/opt/booklore/logs/`

---

*Document Version: 1.0*
*Status: COMPLETED*
*Last Updated: 2026-06-28*