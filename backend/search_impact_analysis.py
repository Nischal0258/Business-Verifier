import asyncio
import time
import sys
import os
from unittest.mock import MagicMock, patch

# Setup paths
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Mocking modules that might not be installed or cause issues in sandbox
sys.modules["google.generativeai"] = MagicMock()
sys.modules["weasyprint"] = MagicMock()

from data_engine.fetchers import get_registry_data, get_financials

async def run_benchmark(company_names, label):
    results = []
    start_time = time.time()
    
    for name in company_names:
        comp_start = time.time()
        try:
            registry = await get_registry_data(name)
            financials = await get_financials(name)
            
            # Metrics
            has_founders = len(registry.get("founder_profiles", [])) > 0
            has_hq = registry.get("headquarters_info", {}).get("full_address") is not None
            has_revenue = len(financials) > 0 and any(f.get("revenue", 0) > 0 for f in financials)
            
            data_points = sum([
                1 if registry.get("industry") else 0,
                1 if registry.get("employees") else 0,
                1 if has_founders else 0,
                1 if has_hq else 0,
                1 if has_revenue else 0
            ])
            
            results.append({
                "name": name,
                "latency": time.time() - comp_start,
                "completeness": data_points / 5.0,
                "has_founders": has_founders,
                "has_hq": has_hq,
                "has_revenue": has_revenue
            })
        except Exception as e:
            print(f"Error testing {name}: {e}")
            
    total_time = time.time() - start_time
    avg_latency = sum(r["latency"] for r in results) / len(results) if results else 0
    avg_completeness = sum(r["completeness"] for r in results) / len(results) if results else 0
    
    return {
        "label": label,
        "total_time": total_time,
        "avg_latency": avg_latency,
        "avg_completeness": avg_completeness,
        "results": results
    }

async def main():
    test_companies = ["Apple", "Zomato", "Swiggy", "Colgate India"]
    
    print("Starting Baseline Benchmark (All Services Enabled)...")
    baseline = await run_benchmark(test_companies, "Baseline")
    
    print("\nSimulating removal of yfinance...")
    with patch("data_engine.fetchers.yf.Ticker", side_effect=Exception("yfinance disabled")):
        no_yf = await run_benchmark(test_companies, "No yfinance")
        
    print("\nSimulating removal of DuckDuckGo...")
    # Patching the class in the module where it's imported
    with patch("duckduckgo_search.DDGS") as mock_ddgs:
        mock_ddgs.return_value.text.return_value = []
        no_ddg = await run_benchmark(test_companies, "No DuckDuckGo")
        
    print("\nSimulating removal of both...")
    with patch("data_engine.fetchers.yf.Ticker", side_effect=Exception("yfinance disabled")):
        with patch("duckduckgo_search.DDGS") as mock_ddgs:
            mock_ddgs.return_value.text.return_value = []
            no_both = await run_benchmark(test_companies, "No Both")
            
    # Final Analysis Output
    print("\n" + "="*50)
    print("SEARCH IMPACT ANALYSIS REPORT")
    print("="*50)
    
    for report in [baseline, no_yf, no_ddg, no_both]:
        print(f"\nConfiguration: {report['label']}")
        print(f"Avg Latency: {report['avg_latency']:.2f}s")
        print(f"Data Completeness (Recall): {report['avg_completeness']*100:.1f}%")
        
        # Breakdown of specific failures
        founders_rate = sum(1 for r in report["results"] if r["has_founders"]) / len(report["results"])
        hq_rate = sum(1 for r in report["results"] if r["has_hq"]) / len(report["results"])
        rev_rate = sum(1 for r in report["results"] if r["has_revenue"]) / len(report["results"])
        
        print(f"Founders Recall: {founders_rate*100:.1f}%")
        print(f"HQ Info Recall: {hq_rate*100:.1f}%")
        print(f"Financials Recall: {rev_rate*100:.1f}%")

if __name__ == "__main__":
    asyncio.run(main())
