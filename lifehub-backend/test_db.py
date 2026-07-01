"""Directly test database connection and user creation."""
import sys
sys.path.insert(0, r"E:\DevelopmentEnvironment\Python\project\LifeHub\lifehub-backend")
import os
os.chdir(r"E:\DevelopmentEnvironment\Python\project\LifeHub\lifehub-backend")

import asyncio
import uuid
from app.base.db.session import engine, async_session_factory
from app.base.db.base_model import Base
from app.base.core.security import hash_password
from app.base.models.user import User

async def test():
    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("Tables created/verified")

    # Try inserting a user
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
            print(f"User created: {user.id} {user.username}")
            await session.commit()
        except Exception as e:
            await session.rollback()
            import traceback
            traceback.print_exc()
            print(f"Error: {e}")

    print("Done!")

asyncio.run(test())
