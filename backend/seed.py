import asyncio
from database import AsyncSessionLocal
from db_models import CachedOpportunity
import json
from datetime import datetime

dummy_data = [
    {
        "company_name": "Google",
        "title": "Software Engineering Intern",
        "location": "Bangalore, India",
        "type": "internship",
        "stipend": "1,00,000 INR/month",
        "source": "careers.google.com",
        "apply_url": "https://careers.google.com"
    },
    {
        "company_name": "OpenAI",
        "title": "Research Scientist",
        "location": "Remote",
        "type": "full_time",
        "stipend": "$250k - $400k/year",
        "source": "openai.com",
        "apply_url": "https://openai.com/careers"
    },
    {
        "company_name": "Microsoft",
        "title": "Cloud Architect",
        "location": "Hyderabad, India",
        "type": "full_time",
        "stipend": "30,00,000 INR/year",
        "source": "careers.microsoft.com",
        "apply_url": "https://careers.microsoft.com"
    },
    {
        "company_name": "Scale AI",
        "title": "Data Annotator Intern",
        "location": "Remote",
        "type": "internship",
        "stipend": "$20/hr",
        "source": "scale.com/careers",
        "apply_url": "https://scale.com/careers"
    },
    {
        "company_name": "DeepMind",
        "title": "AI Ethics Researcher",
        "location": "London, UK",
        "type": "full_time",
        "stipend": "£90,000/year",
        "source": "deepmind.com",
        "apply_url": "https://deepmind.com/careers"
    }
]

async def seed():
    async with AsyncSessionLocal() as session:
        for data in dummy_data:
            opp = CachedOpportunity(
                company_name=data["company_name"],
                title=data["title"],
                location=data["location"],
                type=data["type"],
                stipend=data["stipend"],
                source=data["source"],
                apply_url=data["apply_url"]
            )
            session.add(opp)
        await session.commit()
        print(f"Seeded {len(dummy_data)} opportunities!")

if __name__ == "__main__":
    asyncio.run(seed())
