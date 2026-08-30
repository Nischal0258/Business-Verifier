"""Background tasks for pre-fetching stale cache entries."""

import asyncio
import logging
from datetime import datetime, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from db_models import CachedReport

logger = logging.getLogger(__name__)


async def prefetch_stale_reports(
    db_session_factory,
    generate_report_fn,
    days_before_expiry: int = 2,
    max_concurrent: int = 3,
    cache_ttl_days: int = 30,
) -> int:
    """Refresh cache entries that are about to expire.

    Finds reports older than (cache_ttl_days - days_before_expiry)
    and refreshes them in background with concurrency control.

    Parameters
    ----------
    db_session_factory:
        Async session factory (from database module).
    generate_report_fn:
        The generate_full_report async function.
    days_before_expiry:
        Refresh entries this many days before they expire.
    max_concurrent:
        Max number of concurrent refresh tasks.
    cache_ttl_days:
        Cache TTL in days (must match _is_cache_stale logic).

    Returns
    -------
    int
        Number of reports refreshed.
    """
    refresh_threshold = datetime.utcnow() - timedelta(days=cache_ttl_days - days_before_expiry)

    async with db_session_factory() as db:
        result = await db.execute(
            select(CachedReport).where(
                CachedReport.updated_at < refresh_threshold
            )
        )
        stale_reports = result.scalars().all()

    if not stale_reports:
        logger.info("No stale reports to pre-fetch.")
        return 0

    logger.info(f"Found {len(stale_reports)} stale reports to refresh.")

    semaphore = asyncio.Semaphore(max_concurrent)
    refreshed = 0

    async def _refresh_one(company_name: str):
        nonlocal refreshed
        async with semaphore:
            try:
                logger.info(f"Pre-fetching: '{company_name}'")
                report = await generate_report_fn(company_name)

                async with db_session_factory() as db:
                    # Import here to avoid circular imports
                    from main import _save_report_to_cache
                    report_data = report.model_dump()
                    report_data.pop("_is_mock", None)
                    if "sources" not in report_data:
                        report_data["sources"] = []
                    await _save_report_to_cache(db, company_name, report_data)

                refreshed += 1
                logger.info(f"Pre-fetch complete: '{company_name}'")
            except Exception as e:
                logger.warning(f"Pre-fetch failed for '{company_name}': {e}")

    tasks = [_refresh_one(r.company_name) for r in stale_reports]
    await asyncio.gather(*tasks)

    logger.info(f"Pre-fetch complete. Refreshed {refreshed}/{len(stale_reports)} reports.")
    return refreshed


async def schedule_prefetch_loop(
    db_session_factory,
    generate_report_fn,
    interval_hours: int = 6,
):
    """Run prefetch loop every N hours as a background task.

    Start this in the app lifespan:
        asyncio.create_task(schedule_prefetch_loop(session_factory, generate_full_report))
    """
    while True:
        try:
            await prefetch_stale_reports(db_session_factory, generate_report_fn)
        except Exception as e:
            logger.error(f"Prefetch loop error: {e}")

        await asyncio.sleep(interval_hours * 3600)
