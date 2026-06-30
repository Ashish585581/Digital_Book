"""
Seed script to create initial admin user.
Run after database migration.
"""
import asyncio
import sys
import os

# Add app to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.config import settings
from app.core.database import AsyncSessionLocal
from app.core.security import hash_password
from app.models.user import User


async def create_admin_user():
    """Create the initial admin user."""
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

        # Create admin
        admin = User(
            username="admin",
            email="admin@booklore.local",
            password_hash=hash_password("admin123"),
            name="System Admin",
            role="admin",
            is_active=True
        )
        session.add(admin)
        await session.commit()
        print("Admin user created successfully!")
        print("  Username: admin")
        print("  Password: admin123")
        print("  (Change this password immediately!)")


if __name__ == "__main__":
    asyncio.run(create_admin_user())
