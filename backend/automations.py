from typing import List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from backend.db_models import CachedReport
import json

class RecommendationEngine:
    """
    Analyzes company scores and reviews to recommend the best companies for students.
    """
    
    @staticmethod
    async def get_top_companies(db: AsyncSession, limit: int = 5) -> List[Dict[str, Any]]:
        """
        Fetch the top recommended companies based on their verification_score 
        (which acts as the Student Trust Score).
        """
        # Fetch companies ordered by score descending
        result = await db.execute(
            select(CachedReport)
            .order_by(desc(CachedReport.verification_score))
            .limit(limit)
        )
        reports = result.scalars().all()
        
        recommendations = []
        for report in reports:
            # We mock some additional review processing logic here
            try:
                sources = json.loads(report.sources_json) if report.sources_json else []
            except Exception:
                sources = []
                
            recommendations.append({
                "company_name": report.company_name,
                "score": report.verification_score,
                "is_verified": report.is_verified,
                "industry": "Tech (Mock)", # In a real scenario, extract from history or add to DB
                "recommendation_reason": f"High trust score of {report.verification_score}. Verified: {report.is_verified}.",
                "sources_analyzed": len(sources)
            })
            
        return recommendations
