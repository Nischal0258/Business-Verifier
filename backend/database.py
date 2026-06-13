from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from db_models import Base
from config import settings
import logging

logger = logging.getLogger(__name__)

# Create async engine
engine = create_async_engine(
    settings.database_url,
    echo=False,  # Set to True for SQL logging during development
    future=True
)

from contextlib import asynccontextmanager

# Create async session factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)

# Export aliases for background tasks and lifespan events
async_session_factory = AsyncSessionLocal

@asynccontextmanager
async def get_db_session():
    """Context manager for database sessions outside of FastAPI request lifecycle."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()



async def init_db():
    """Initialize the database by creating all tables."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database initialized successfully")


async def get_db() -> AsyncSession:
    """
    Dependency for FastAPI to get database session.
    Usage: db: AsyncSession = Depends(get_db)
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def close_db():
    """Close database connections."""
    await engine.dispose()
    logger.info("Database connections closed")
