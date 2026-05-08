import json
import logging
from datetime import datetime, timedelta
from typing import Any, Dict, Optional

import aiosqlite
from .models import CompanyReport
from config import settings

logger = logging.getLogger(__name__)

class ReportCache:
    """Persistent cache for company reports using SQLite."""
    
    def __init__(self, db_path: str):
        # The database_url in settings is sqlite+aiosqlite:///path/to/db
        # We need the raw path for aiosqlite
        self.db_path = db_path.replace("sqlite+aiosqlite:///", "")
        self._initialized = False

    async def _init_db(self):
        if self._initialized:
            return
        
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute("""
                CREATE TABLE IF NOT EXISTS report_cache (
                    company_name TEXT PRIMARY KEY,
                    report_json TEXT,
                    created_at TIMESTAMP
                )
            """)
            await db.commit()
        self._initialized = True

    async def get(self, company_name: str) -> Optional[CompanyReport]:
        await self._init_db()
        key = company_name.strip().lower()
        
        try:
            async with aiosqlite.connect(self.db_path) as db:
                async with db.execute(
                    "SELECT report_json, created_at FROM report_cache WHERE company_name = ?", 
                    (key,)
                ) as cursor:
                    row = await cursor.fetchone()
                    if row:
                        report_json, created_at_str = row
                        created_at = datetime.fromisoformat(created_at_str)
                        
                        # Cache valid for 24 hours
                        if datetime.utcnow() - created_at < timedelta(hours=24):
                            logger.info("Cache hit for '%s'", company_name)
                            data = json.loads(report_json)
                            return CompanyReport(**data)
                        else:
                            logger.info("Cache expired for '%s'", company_name)
                            await db.execute("DELETE FROM report_cache WHERE company_name = ?", (key,))
                            await db.commit()
        except Exception as e:
            logger.warning("Cache retrieval failed for '%s': %s", company_name, e)
        
        return None

    async def set(self, company_name: str, report: CompanyReport):
        await self._init_db()
        key = company_name.strip().lower()
        
        try:
            async with aiosqlite.connect(self.db_path) as db:
                await db.execute(
                    "INSERT OR REPLACE INTO report_cache (company_name, report_json, created_at) VALUES (?, ?, ?)",
                    (key, report.model_dump_json(), datetime.utcnow().isoformat())
                )
                await db.commit()
                logger.info("Cached report for '%s'", company_name)
        except Exception as e:
            logger.warning("Cache storage failed for '%s': %s", company_name, e)

# Global cache instance
report_cache = ReportCache(settings.database_url)
