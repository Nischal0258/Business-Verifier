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
- **Search Orchestration**: [Serper.dev (Google Search API)](file:///c:/Users/Dell/Desktop/VC%20PROJECT/backend/data_engine/fetchers.py) - Extracts Knowledge Graph data and corporate profiles in real-time.
- **Database**: [SQLite with SQLAlchemy/AioSqlite](file:///c:/Users/Dell/Desktop/VC%20PROJECT/backend/config.py) - Asynchronous database interaction for storing search history and audit logs.

---

## **3. System Architecture & Data Flow**

### **The Request Lifecycle**
1. **Input**: User enters a company name in the [Glassmorphism Search Bar](file:///c:/Users/Dell/Desktop/VC%20PROJECT/frontend/components/verifyiq/HeroSection.tsx).
2. **Orchestration**: The [FastAPI backend](file:///c:/Users/Dell/Desktop/VC%20PROJECT/backend/main.py) receives the query and initiates the "Data Engine".
3. **Parallel Fetching**:
    - **Financial Layer**: [Yahoo Finance](file:///c:/Users/Dell/Desktop/VC%20PROJECT/backend/data_engine/fetchers.py) checks for public stock tickers (simultaneously checking Indian suffixes `.NS` and `.BO`).
    - **Web Layer**: [Serper.dev](file:///c:/Users/Dell/Desktop/VC%20PROJECT/backend/data_engine/fetchers.py) fetches Knowledge Graph data and corporate "About Us" snippets.
4. **Synthesis**: [Gemini AI](file:///c:/Users/Dell/Desktop/VC%20PROJECT/backend/data_engine/summarizer.py) takes the raw data fragments and synthesizes a structured 3-paragraph history.
5. **Output**: The frontend renders a [dynamic results page](file:///c:/Users/Dell/Desktop/VC%20PROJECT/frontend/app/dashboard/page.tsx) with metrics, charts, and AI summaries.

---

## **4. Key Features Implementation**

### **Multi-Source Data Resolution**
The core innovation is the `_resolve_ticker` and `get_registry_data` functions which use a racing strategy to find data across public and private sources.

```python
# Example of Parallel Resolution in fetchers.py
search_queries = [company_name, f"{company_name}.NS", f"{company_name}.BO"]
tasks = [asyncio.to_thread(_get_ticker_sync, q) for q in search_queries]
results = await asyncio.gather(*tasks, return_exceptions=True)
```

### **Glassmorphism UI**
The dashboard uses advanced CSS backdrop filters and radial gradients to create a futuristic "Grok-style" interface.

---

## **5. Performance & Optimization**

- **LRU Caching**: Ticker lookups are cached to ensure repeat searches are near-instant.
- **Parallelism**: External API calls (Gemini, Serper, yfinance) are executed concurrently to keep response times under 5 seconds.
- **Aggressive Timeouts**: Strict 7-second limits prevent "hanging" requests from blocking the system.

---

## **6. Deployment & Infrastructure**

- **Frontend**: Deployed on **Vercel** for global edge distribution.
- **Backend**: Deployed on **Render** (via `render.yaml`) using a high-performance Python environment.
- **Environment Management**: Strictly managed via `.env` files for API security.

---

## **7. Roadmap**

1. **Enhanced Risk Scoring**: Implement machine learning models to analyze financial health beyond raw data.
2. **PDF Generation**: Finalize the automated PDF report export feature.
3. **Multi-User Auditing**: Advanced team-based search history and compliance tracking.
