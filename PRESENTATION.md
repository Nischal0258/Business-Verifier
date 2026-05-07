# Technical Presentation: VerifyIQ System Architecture & Implementation

## **1. Project Overview**
VerifyIQ is a high-performance corporate transparency and verification engine designed to provide instant, AI-powered insights into any global entity. It specializes in resolving complex data for both public and private companies, with a particular focus on the Indian market.

---

## **2. Technology Stack**

### **Frontend (Modern Web Architecture)**
- **Framework**: [Next.js 15 (App Router)](file:///c:/Users/Dell/Desktop/VC%20PROJECT/frontend/package.json) - Chosen for Server-Side Rendering (SSR) and optimized performance.
- **Styling**: [Tailwind CSS](file:///c:/Users/Dell/Desktop/VC%20PROJECT/frontend/tailwind.config.ts) - Used for rapid, utility-first UI development and the implementation of "Glassmorphism" effects.
- **Animations**: [Framer Motion](file:///c:/Users/Dell/Desktop/VC%20PROJECT/frontend/components/verifyiq/HeroSection.tsx) - Powers the smooth transitions, background text scaling, and search bar animations.
- **Icons**: [Lucide React](file:///c:/Users/Dell/Desktop/VC%20PROJECT/frontend/components/verifyiq/HeroSection.tsx) - Provides a consistent, lightweight icon set.
- **Auth**: [Firebase Authentication](file:///c:/Users/Dell/Desktop/VC%20PROJECT/frontend/lib/auth-context.tsx) - Secure, managed authentication with built-in session management.

### **Backend (High-Performance Processing)**
- **Framework**: [FastAPI (Python)](file:///c:/Users/Dell/Desktop/VC%20PROJECT/backend/main.py) - An asynchronous framework known for high speed and automatic OpenAPI documentation.
- **AI Engine**: [Google Gemini 1.5 Flash](file:///c:/Users/Dell/Desktop/VC%20PROJECT/backend/data_engine/summarizer.py) - Provides professional, context-aware company summaries with high throughput.
- **Data Orchestration**: Multi-source data resolution with ordered fallback:
    - [Wikipedia](file:///c:/Users/Dell/Desktop/VC%20PROJECT/backend/data_engine/fetchers.py) - Primary for historical context and founding narratives.
    - [Serper.dev](file:///c:/Users/Dell/Desktop/VC%20PROJECT/backend/data_engine/fetchers.py) - Primary Google search for Knowledge Graph and corporate profiles.
    - [DuckDuckGo](file:///c:/Users/Dell/Desktop/VC%20PROJECT/backend/data_engine/fetchers.py) - Fallback for private/unlisted companies and supplemental data discovery.
- **Financial Data**: Multi-source financial API chain with automatic fallback:
    - [Yahoo Finance (yfinance)](file:///c:/Users/Dell/Desktop/VC%20PROJECT/backend/data_engine/fetchers.py) - Primary for public company income statements.
    - [Alpha Vantage](file:///c:/Users/Dell/Desktop/VC%20PROJECT/backend/data_engine/fetchers.py) - INCOME_STATEMENT API (25 req/day free tier).
    - [Finnhub](file:///c:/Users/Dell/Desktop/VC%20PROJECT/backend/data_engine/fetchers.py) - Comprehensive financial metrics (60 req/sec free tier).
- **PDF Generation**: [WeasyPrint](file:///c:/Users/Dell/Desktop/VC%20PROJECT/backend/pdf_generator.py) with Jinja2 templates for corporate-style PDF reports.
- **Database**: [SQLite with SQLAlchemy/AioSqlite](file:///c:/Users/Dell/Desktop/VC%20PROJECT/backend/config.py) - Asynchronous database interaction for storing search history and audit logs.

---

## **3. System Architecture & Data Flow**

### **The Request Lifecycle**
1. **Input**: User enters a company name in the [Glassmorphism Search Bar](file:///c:/Users/Dell/Desktop/VC%20PROJECT/frontend/components/verifyiq/HeroSection.tsx).
2. **Orchestration**: The [FastAPI backend](file:///c:/Users/Dell/Desktop/VC%20PROJECT/backend/main.py) receives the query and initiates the "Data Engine".
3. **Parallel Fetching**:
    - **Ticker Resolution**: [Yahoo Finance tickers](file:///c:/Users/Dell/Desktop/VC%20PROJECT/backend/data_engine/fetchers.py) checked in parallel with improved internal mapping for Indian and Global markets.
    - **Registry Layer**: [Wikipedia](file:///c:/Users/Dell/Desktop/VC%20PROJECT/backend/data_engine/fetchers.py) and [Serper.dev](file:///c:/Users/Dell/Desktop/VC%20PROJECT/backend/data_engine/fetchers.py) fetch Knowledge Graph data, corporate profiles, and founding narratives.
    - **Supplemental Search**: Automated DuckDuckGo tasks to fill in missing Founders, HQ info, and founding dates.
    - **Financial Layer**: Multi-source fallback chain (Serper → DuckDuckGo → Wikipedia → yFinance → Alpha Vantage) with enhanced regex extraction.
4. **Synthesis**: [Gemini AI](file:///c:/Users/Dell/Desktop/VC%20PROJECT/backend/data_engine/summarizer.py) takes the raw data fragments and synthesizes a structured 3-paragraph history.
5. **Output**: The frontend renders a [dynamic results page](file:///c:/Users/Dell/Desktop/VC%20PROJECT/frontend/app/dashboard/page.tsx) with metrics, charts, and AI summaries.
6. **PDF Export**: Users can click "Download PDF" to generate and download a corporate-style PDF report with all verification data.

---

## **4. Key Features Implementation**

### **Multi-Source Data Resolution**
The core innovation is the `_resolve_ticker`, `get_registry_data`, and `_fetch_wikipedia_data` functions which use a racing strategy to find data across public and private sources. 
- **Wikipedia Integration**: Fetches structured summaries and verifies historical milestones.
- **Robust Fallback Search**: Specifically targets missing founders and HQ details via DuckDuckGo heuristics.
- **Improved Ticker Mapping**: Expanded internal dictionary for rapid resolution of major Indian and global entities.

```python
# Example of Parallel Resolution in fetchers.py
search_queries = [company_name, f"{company_name}.NS", f"{company_name}.BO"]
tasks = [asyncio.to_thread(_get_ticker_sync, q) for q in search_queries]
results = await asyncio.gather(*tasks, return_exceptions=True)
```

### **Glassmorphism UI**
The dashboard uses advanced CSS backdrop filters and radial gradients to create a futuristic "Grok-style" interface.

### **PDF Report Generation**
The PDF download feature allows users to export verification results as a professional PDF document:
- Backend endpoint: `GET /api/verify/{company_name}/pdf`
- Uses WeasyPrint to convert Jinja2-rendered HTML to PDF
- Corporate template includes company name, verification status, history, financial tables, and sources
- Frontend: "Download PDF" button in results header with loading spinner during generation

---

## **5. Performance & Optimization**

- **LRU Caching**: Ticker lookups are cached to ensure repeat searches are near-instant.
- **Parallelism**: External API calls (Gemini, Serper) are executed concurrently to keep response times under 5 seconds.
- **Multi-Source Fallback**: Financial data uses a 5-source fallback chain (Serper → DuckDuckGo → yfinance → Alpha Vantage → Finnhub) to maximize data retrieval success rate.
- **Aggressive Timeouts**: Strict timeout limits prevent "hanging" requests:
    - Search data: 7 seconds
    - yfinance: 5 seconds
    - Alpha Vantage/Finnhub: 15 seconds
    - LLM synthesis: 10 seconds

---

## **6. Deployment & Infrastructure**

- **Frontend**: Deployed on **Vercel** for global edge distribution.
- **Backend**: Deployed on **Render** (via `render.yaml`) using a high-performance Python environment.
- **Environment Management**: Strictly managed via `.env` files for API security.

---

## **7. Roadmap**

1. **Enhanced Risk Scoring**: Implement machine learning models to analyze financial health beyond raw data.
2. **PDF Generation**: ✅ Implemented - automated PDF report export with WeasyPrint and Jinja2 templates.
3. **Multi-User Auditing**: Advanced team-based search history and compliance tracking.
