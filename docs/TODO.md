# BookLore - TODO List

## Phase 2: Backend Foundation

### 2.1 Project Setup
- [ ] Initialize FastAPI project structure
- [ ] Create requirements.txt with all dependencies
- [ ] Set up SQLAlchemy 2.0 with async support
- [ ] Configure Alembic migrations
- [ ] Set up Redis caching
- [ ] Create Docker configuration
- [ ] Create .env.example file

### 2.2 Core Models
- [ ] Implement User model
- [ ] Implement Book model
- [ ] Implement BookMetadata model
- [ ] Implement ReadingProgress model
- [ ] Implement RefreshToken model
- [ ] Implement AuditLog model

### 2.3 Authentication
- [ ] JWT token service
- [ ] Password hashing (bcrypt)
- [ ] Login endpoint
- [ ] Register endpoint
- [ ] Token refresh endpoint
- [ ] Logout endpoint

### 2.4 Basic CRUD APIs
- [ ] User management (admin only)
- [ ] Book listing with pagination
- [ ] Book detail endpoint
- [ ] Book delete endpoint

**Status**: Ready to start

---

## Phase 3: Book Management

### 3.1 File Upload
- [ ] File storage service
- [ ] PDF/EPUB validation
- [ ] File upload endpoint (multipart)
- [ ] File size limits (500MB)

### 3.2 Book Metadata
- [ ] Metadata creation on upload
- [ ] Metadata update endpoint
- [ ] ClassGrade validation
- [ ] Cover image upload

### 3.3 Book Streaming
- [ ] HTTP Range header support
- [ ] PDF streaming endpoint
- [ ] EPUB streaming endpoint
- [ ] Content-Type negotiation

### 3.4 Search
- [ ] PostgreSQL full-text search
- [ ] GIN index on title/author
- [ ] Filter by classGrade
- [ ] Filter by book type

**Status**: Blocked until Phase 2 complete

---

## Phase 4: Frontend Foundation

### 4.1 Project Setup
- [ ] Initialize React + Vite + TypeScript
- [ ] Configure Tailwind CSS
- [ ] Set up React Router v6
- [ ] Configure shadcn/ui components
- [ ] Set up Zustand for state

### 4.2 Authentication UI
- [ ] Login page
- [ ] Register page (admin only)
- [ ] Token management in frontend
- [ ] Auth context/hook
- [ ] Protected route component

### 4.3 Core Layout
- [ ] Main layout with sidebar
- [ ] Navigation menu
- [ ] User dropdown
- [ ] Toast notifications

**Status**: Blocked until Phase 2 complete

---

## Phase 5: Book Features

### 5.1 Library View
- [ ] Book grid/list view
- [ ] Book card component
- [ ] Pagination
- [ ] ClassGrade filter
- [ ] Book type filter
- [ ] Search bar

### 5.2 Book Detail
- [ ] Book information display
- [ ] Cover image display
- [ ] Read button
- [ ] Edit metadata (admin)

### 5.3 Book Upload
- [ ] Drag-and-drop upload
- [ ] Form fields (title, author, classGrade)
- [ ] Upload progress
- [ ] Success/error handling

### 5.4 Reading
- [ ] PDF reader (pdf.js)
- [ ] EPUB reader (epub.js)
- [ ] Reading progress tracking
- [ ] Resume from last position

**Status**: Blocked until Phase 4 complete

---

## Phase 6: User Management (Admin)

### 6.1 User List
- [ ] User table view
- [ ] Create user form
- [ ] Edit user role
- [ ] Deactivate user
- [ ] Delete user

### 6.2 Admin Dashboard
- [ ] Book count stats
- [ ] User count stats
- [ ] Recent uploads

**Status**: Blocked until Phase 5 complete

---

## Phase 7: Docker & Deployment

### 7.1 Docker Configuration
- [ ] Backend Dockerfile
- [ ] Frontend Dockerfile
- [ ] NGINX configuration
- [ ] Docker Compose setup
- [ ] Environment variables

### 7.2 Database Migrations
- [ ] Initial migration
- [ ] Seed admin user
- [ ] Migration testing

### 7.3 Production Setup
- [ ] PostgreSQL setup
- [ ] Redis setup
- [ ] File storage
- [ ] Backup strategy

**Status**: Blocked until Phase 6 complete

---

## Phase 8: Testing & Polish

### 8.1 Backend Testing
- [ ] Unit tests for services
- [ ] API endpoint tests
- [ ] Authentication tests

### 8.2 Frontend Testing
- [ ] Component tests
- [ ] Integration tests
- [ ] Auth flow tests

### 8.3 Performance
- [ ] Load testing
- [ ] Search performance
- [ ] File streaming test

### 8.4 Documentation
- [ ] Update README
- [ ] API documentation
- [ ] Installation guide
- [ ] Developer guide

**Status**: Blocked until Phase 7 complete

---

## Documentation

### Already Completed ✅
- [x] README.md
- [x] Architecture.md
- [x] SystemDesign.md
- [x] Database.md
- [x] API.md
- [x] Modules.md
- [x] DevelopmentRoadmap.md
- [x] Deployment.md
- [x] Security.md
- [x] Testing.md
- [x] Changes.md

### Pending
- [ ] DeveloperGuide.md
- [ ] Installation.md
- [ ] Update README with actual setup instructions

---

## Critical Decisions Needed

Before proceeding to Phase 2, confirm:

1. **Database per school vs single database with tenant_id**
   - Recommendation: Database per school for MVP simplicity

2. **File storage: Local vs S3**
   - Recommendation: Local for MVP, S3 as future enhancement

3. **Admin user creation flow**
   - First registered user becomes admin? Or require setup token?

---

## Blockers / Questions

- None currently. Awaiting user confirmation to proceed.

---

*Last Updated: 2026-06-28*
*Status: Phase 1 COMPLETED - Ready for Phase 2*