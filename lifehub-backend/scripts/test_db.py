"""Test database connectivity directly — bypasses FastAPI.

Usage:
    python scripts/test_db.py
"""
import asyncio
import sys
import uuid
from pathlib import Path

# Ensure we can import from app/
BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from app.base.db.session import engine, async_session_factory
from app.base.db.base_model import Base
from app.base.core.security import hash_password
from app.base.models.user import User


async def test():
    print("=" * 50)
    print("  DATABASE DIRECT TEST")
    print("=" * 50)

    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("[1] ✅ Tables created / verified")

    # Insert a user directly
    async with async_session_factory() as session:
        try:
            user = User(
                id=uuid.uuid4(),
                username="direct_test",
                email="direct@test.com",
                hashed_password=hash_password("test123"),
                is_active=True,
            )
            session.add(user)
            await session.flush()
            await session.refresh(user)
            await session.commit()
            print(f"[2] ✅ User created: {user.username} (id={user.id})")
        except Exception as e:
            await session.rollback()
            import traceback
            traceback.print_exc()
            print(f"[2] ❌ Error: {e}")

    # Query back
    async with async_session_factory() as session:
        from sqlalchemy import select
        result = await session.execute(select(User).where(User.username == "direct_test"))
        user = result.scalar_one_or_none()
        if user:
            print(f"[3] ✅ Verified: found {user.username} / {user.email}")
        else:
            print(f"[3] ❌ User not found after insert")

    print("\nDone!")
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(test())
