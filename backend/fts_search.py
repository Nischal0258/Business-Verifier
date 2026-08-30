"""SQLite FTS5 full-text search for fuzzy company name matching."""

import logging
from typing import Optional, List

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)


async def init_fts5(db: AsyncSession) -> None:
    """Create FTS5 virtual table if it doesn't exist.

    Call during app startup after database initialization.
    """
    try:
        await db.execute(text("""
            CREATE VIRTUAL TABLE IF NOT EXISTS company_search
            USING fts5(company_name, content='cached_reports', content_rowid='id')
        """))
        await db.commit()
        logger.info("FTS5 virtual table initialized.")
    except Exception as e:
        logger.warning(f"FTS5 init failed (may not be supported): {e}")


async def sync_fts5(db: AsyncSession) -> None:
    """Rebuild FTS5 index from cached_reports table.

    Call after bulk inserts or periodically to keep index in sync.
    """
    try:
        await db.execute(text("""
            INSERT INTO company_search(company_search) VALUES('rebuild')
        """))
        await db.commit()
        logger.info("FTS5 index rebuilt.")
    except Exception as e:
        logger.warning(f"FTS5 rebuild failed: {e}")


async def update_fts5_entry(db: AsyncSession, rowid: int, company_name: str) -> None:
    """Insert or update a single entry in the FTS5 index."""
    try:
        # Delete old entry if exists
        await db.execute(text(
            "DELETE FROM company_search WHERE rowid = :rowid"
        ), {"rowid": rowid})
        # Insert new
        await db.execute(text(
            "INSERT INTO company_search(rowid, company_name) VALUES(:rowid, :name)"
        ), {"rowid": rowid, "name": company_name})
        await db.commit()
    except Exception as e:
        logger.warning(f"FTS5 entry update failed: {e}")


async def fuzzy_search(db: AsyncSession, query: str, limit: int = 5) -> List[dict]:
    """Search for companies using FTS5 fuzzy matching.

    Falls back gracefully if FTS5 is not available.

    Parameters
    ----------
    query:
        Search query (company name or partial name).
    limit:
        Maximum number of results.

    Returns
    -------
    List[dict]
        Matching companies with rank scores.
    """
    try:
        # FTS5 match with prefix search support
        fts_query = f'"{query}"*'
        result = await db.execute(text("""
            SELECT
                cr.id,
                cr.company_name,
                cr.is_verified,
                cr.verification_score,
                rank
            FROM company_search
            JOIN cached_reports cr ON company_search.rowid = cr.id
            WHERE company_search MATCH :query
            ORDER BY rank
            LIMIT :limit
        """), {"query": fts_query, "limit": limit})

        rows = result.fetchall()
        return [
            {
                "id": row[0],
                "company_name": row[1],
                "is_verified": row[2],
                "verification_score": row[3],
                "relevance_rank": row[4],
            }
            for row in rows
        ]
    except Exception as e:
        logger.warning(f"FTS5 search failed: {e}")
        return []
