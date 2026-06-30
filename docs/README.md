# BookLore - Digital Library Platform

> **Status**: Phase 1-3 COMPLETED - Ready for Phase 2 (Backend Implementation)

## Overview

BookLore is a modern, scalable digital library system designed for Indian schools. It provides:

- **PDF & EPUB in-browser reading**
- **Simplified book management** with classGrade classification
- **Multi-user support** with role-based access (Admin/Student)
- **Reading progress tracking**
- **Full-text search**

## Technology Stack

| Layer | Technology |
|-------|------------|
| Backend | Python 3.11+ / FastAPI / SQLAlchemy 2.0 |
| Frontend | React 18+ / TypeScript / Vite |
| Database | PostgreSQL 15+ |
| Cache | Redis |
| File Storage | Local filesystem |
| Deployment | Docker / Docker Compose |

## Quick Start

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

## Project Structure

```
BookLore/
├── backend/          # FastAPI Python backend
├── frontend/         # React TypeScript frontend
├── database/         # Database migrations
├── docker/           # Docker configurations
├── docs/             # Documentation
├── scripts/          # Utility scripts
├── configs/          # Configuration files
├── tests/            # Test suites
├── assets/           # Static assets
├── design/           # Design files
└── tools/            # Development tools
```

## Key Features

### For Students
- Browse library by title, author, or class
- Read PDF and EPUB books in browser
- Track reading progress
- Resume from last position

### For Administrators
- Upload new books (PDF/EPUB)
- Manage book metadata (title, author, classGrade)
- Manage user accounts
- Delete books

### Features Intentionally Excluded
Based on school requirements:
- ~~Metadata providers (Google Books, Amazon, Goodreads)~~
- ~~ISBN/Ratings/Reviews~~
- ~~OPDS Catalog~~
- ~~Kobo/KOReader sync~~
- ~~Email/Kindle sharing~~
- ~~Statistics/Charts~~
- ~~Magic Shelves~~

## Documentation

- [Architecture](docs/Architecture.md)
- [System Design](docs/SystemDesign.md)
- [Database Schema](docs/Database.md)
- [API Reference](docs/API.md)
- [Development Roadmap](docs/DevelopmentRoadmap.md)
- [Deployment Guide](docs/Deployment.md)
- [Security](docs/Security.md)
- [Testing](docs/Testing.md)
- [Installation](docs/Installation.md)

## Requirements

- Docker & Docker Compose
- PostgreSQL 15+ (or Docker)
- Redis (or Docker)
- Python 3.11+ (for local development)
- Node.js 18+ (for local frontend development)

## License

Proprietary - All rights reserved.

## Support

For issues and feature requests, please contact the development team.