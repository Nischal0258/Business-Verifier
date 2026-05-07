import asyncio
import logging
import sys
import os

print("--- Script Starting ---")
sys.stdout.flush()

# Add the current directory to path so we can import modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Mock missing dependencies if necessary
from unittest.mock import MagicMock
sys.modules["google.generativeai"] = MagicMock()
sys.modules["weasyprint"] = MagicMock()

print("--- Importing fetchers ---")
sys.stdout.flush()
try:
    from data_engine.fetchers import get_registry_data, get_financials
    print("--- Import successful ---")
except Exception as e:
    print(f"--- Import failed: {e} ---")
    import traceback
    traceback.print_exc()
sys.stdout.flush()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_company(name):
    print(f"\n{'='*20} Testing: {name} {'='*20}")
    
    print("\n--- Registry Data ---")
    registry = await get_registry_data(name)
    print(f"Company Name: {registry.get('company_name')}")
    print(f"Status: {registry.get('status')}")
    print(f"Founders: {registry.get('founder_profiles')}")
    print(f"HQ Info: {registry.get('headquarters_info')}")
    print(f"Registration Date: {registry.get('registration_date')}")
    
    print("\n--- Financial Data ---")
    financials = await get_financials(name)
    for record in financials[:3]:
        print(f"Year: {record.get('year')}, Revenue: {record.get('revenue')}, Note: {record.get('note')}")

async def main():
    companies = ["Apple", "Zomato", "Swiggy", "Tata Group", "Reliance Industries"]
    for company in companies:
        await test_company(company)

if __name__ == "__main__":
    asyncio.run(main())
