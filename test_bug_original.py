
import re
from typing import Optional, List, Dict, Any

def _parse_revenue_value(value_str: str) -> Optional[float]:
    """Parse revenue string to float, handling Indian numbering system."""
    value_str = value_str.replace(",", "").strip()

    multipliers = {
        "crore": 10_000_000,
        "cr": 10_000_000,
        "million": 1_000_000,
        "m": 1_000_000,
        "bn": 1_000_000_000,
        "billion": 1_000_000_000,
        "b": 1_000_000_000,
        "tr": 1_000_000_000_000,
        "trillion": 1_000_000_000_000,
        "t": 1_000_000_000_000,
    }

    for suffix, multiplier in multipliers.items():
        if suffix in value_str.lower():
            try:
                number = float(re.sub(r"[^\d.]", "", value_str.lower().replace(suffix, "")))
                return number * multiplier
            except ValueError:
                return None

    try:
        return float(value_str)
    except ValueError:
        return None

def test_original_extraction():
    snippet = "The company reported a revenue of 100 crore in 2023."
    source = "Test"
    
    # EXACT patterns from fetchers.py
    revenue_patterns = [
        r"(?:revenue|sales|revenue of|income|turnover|net worth)\s*(?:of|data)?\s*(?:Rs\.?|USD|\$|₹|INR)?\s*([\d,.]+)\s*(?:crore|cr|million|m|bn|billion|b|trillion|tr|t)",
    ]
    
    for pattern in revenue_patterns:
        match = re.search(pattern, snippet, re.IGNORECASE)
        if match:
            print(f"Match found: {match.groups()}")
            value_str = match.group(1)
            print(f"Captured value_str: {value_str}")
            parsed = _parse_revenue_value(value_str)
            print(f"Parsed result: {parsed}")

if __name__ == "__main__":
    test_original_extraction()
