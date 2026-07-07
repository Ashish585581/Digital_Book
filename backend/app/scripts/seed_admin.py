"""
Seed script to create the initial admin user.
Run with: python -m app.scripts.seed_admin
"""
import asyncio
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from app.core.database import AsyncSessionLocal
from app.core.security import hash_password
from app.models.user import User


async def seed_admin():
    """Create the initial admin user."""
    # Import all models to register them with SQLAlchemy
    from app.models.user import User
    from app.models.refresh_token import RefreshToken
    from app.models.reading_progress import ReadingProgress
    from app.models.audit_log import AuditLog
    from app.models.book import Book
    from app.models.book_metadata import BookMetadata

    admin_data = {
        "username": "admin",
        "email": "admin@school.edu",
        "password_hash": hash_password("admin123"),
        "name": "Admin User",
        "role": "admin"
    }

    async with AsyncSessionLocal() as session:
        # Check if admin exists
        from sqlalchemy import select
        result = await session.execute(
            select(User).where(User.username == "admin")
        )
        existing = result.scalar_one_or_none()

        if existing:
            print("Admin user already exists.")
            return

        # Create admin user
        admin = User(**admin_data)
        session.add(admin)
        await session.commit()
        await session.refresh(admin)

        print(f"Admin user created successfully!")
        print(f"Username: admin")
        print(f"Password: admin123")
        print(f"Please change the password after first login.")


if __name__ == "__main__":
    asyncio.run(seed_admin())