import pytest
from data_engine.student_score import calculate_student_trust_score

def test_calculate_student_trust_score_perfect():
    company_data = {
        "website": "https://example.com",
        "description": "A tech company",
        "industry": "IT",
        "headquarters": "San Francisco"
    }
    opportunities = [
        {"type": "internship", "stipend": "1000", "duration": "3 months"} for _ in range(12)
    ]
    social_media = {
        "active_platforms": ["LinkedIn", "Twitter", "Instagram", "Facebook", "YouTube"]
    }
    reviews = {
        "overall_rating": 4.5
    }
    
    # Needs growth data
    
    result = calculate_student_trust_score(company_data, opportunities, social_media, reviews)
    
    assert result["total_score"] >= 80
    assert result["company_tier"] == "established"
    assert result["is_recommended"] is True
    assert "breakdown" in result

def test_calculate_student_trust_score_empty():
    result = calculate_student_trust_score({}, [], {}, {})
    assert result["total_score"] < 40
    assert result["company_tier"] == "unknown"
    assert result["is_recommended"] is False
