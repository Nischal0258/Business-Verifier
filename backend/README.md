# Business Verification & Analytics API

A production-ready FastAPI backend that verifies companies using web search, LLM analysis, and generates downloadable PDF reports.

## Features

- **Real-time Company Verification**: Searches the web for company information using DuckDuckGo
- **AI-Powered Analysis**: Uses OpenAI GPT-4o-mini to verify business authenticity and extract history
- **Financial Data**: Fetches public company data via yfinance, with LLM fallback for private companies
- **PDF Report Generation**: Clean, corporate-style PDF reports using WeasyPrint
- **Smart Caching**: SQLite-based caching with 30-day refresh to control costs
- **Envelope API Pattern**: Consistent JSON responses with `success`, `data`, `error`, `metadata`

## Architecture

```
backend/
├── main.py                 # FastAPI app with CORS, routes, envelope responses
├── config.py               # Environment-based configuration
├── database.py             # SQLAlchemy async engine and session factory
├── db_models.py            # CachedReport SQLAlchemy model
├── schemas.py              # Pydantic models for API envelope & validation
├── data_engine/            # Real data fetching package
│   ├── fetchers.py         # DuckDuckGo search + BeautifulSoup scraping
│   ├── llm_processor.py    # OpenAI GPT-4o-mini integration
│   ├── financials.py       # yfinance + LLM fallback pipeline
│   └── models.py           # Pydantic models for structured outputs
├── pdf_generator.py        # WeasyPrint HTML→PDF conversion
├── templates/
│   └── report.html         # Corporate HTML template for PDFs
└── requirements.txt        # Python 3.13 dependencies
```

## Quick Start (Windows)

For Windows users who want to get running quickly:

```powershell
# 1. Navigate to backend folder
cd backend

# 2. Create and activate virtual environment
python -m venv venv
venv\Scripts\activate

# 3. Install Python dependencies
pip install -r requirements.txt

# 4. Install GTK3 for PDF generation (Windows only)
# Download from: https://github.com/tschoonj/GTK-for-Windows-Runtime-Environment-Installer/releases

# 5. Set up environment variables
copy .env.example .env
# Edit .env file and add your OPENAI_API_KEY

# 6. Start the server
python -m uvicorn main:app --reload --port 8000
```

---

## Setup Instructions (Detailed)

### Prerequisites

- **Python 3.13+**
- **OpenAI API Key**: Get from https://platform.openai.com/api-keys
- **GTK+ for Windows** (required for PDF report generation)

### Installation

1. **Clone/navigate to the project:**
   ```bash
   cd backend
   ```

2. **Create virtual environment:**
   ```bash
   python -m venv venv
   venv\Scripts\activate  # Windows
   source venv/bin/activate  # macOS/Linux
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env and add your OPENAI_API_KEY
   ```

5. **Run the server:**
   ```bash
   python -m uvicorn main:app --reload --port 8000
   ```

---

### WeasyPrint Setup (Windows)

PDF report generation requires GTK3 libraries. Choose one of the following installation methods:

**Option 1: Using the installer (Recommended)**
1. Download from: https://github.com/tschoonj/GTK-for-Windows-Runtime-Environment-Installer/releases
2. Run the installer (accept defaults)
3. Restart your terminal
4. Verify: `weasyprint --help` should work

**Option 2: Using Chocolatey**
```powershell
choco install gtk-runtime
```

**Verify PDF generation works:**
```powershell
python -c "from weasyprint import HTML; print('WeasyPrint OK')"
```

## API Endpoints

### 1. Verify Company (JSON)

```http
GET /api/verify/{company_name}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "is_verified": true,
    "company_history": "Apple Inc. is a multinational technology company...",
    "jurisdiction": "California, USA",
    "incorporation_date": "1976",
    "turnover_data": [
      {"year": 2023, "revenue": 383285.0, "note": "Total Revenue from Yahoo Finance (AAPL)"},
      {"year": 2022, "revenue": 394328.0, "note": "Total Revenue from Yahoo Finance (AAPL)"}
    ],
    "sources": ["https://en.wikipedia.org/wiki/Apple_Inc", "..."]
  },
  "error": null,
  "metadata": {"cached": false, "source": "live_fetch"}
}
```

### 2. Download PDF Report

```http
GET /api/verify/{company_name}/pdf
```

**Response:** PDF file download with `Content-Disposition: attachment`

### 3. Health Check

```http
GET /health
```

## Error Handling

| Scenario | Response |
|----------|----------|
| No web results | HTTP 200 with `is_verified: false` + message |
| OpenAI API down | HTTP 503 with error envelope |
| yfinance fails (private company) | HTTP 200 with `turnover_data: []` |
| Missing API key | RuntimeError on startup (fail fast) |

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENAI_API_KEY` | Yes | - | OpenAI API key for LLM analysis |
| `CORS_ORIGINS` | No | `http://localhost:3000,http://127.0.0.1:3000` | Comma-separated allowed origins |
| `DATABASE_URL` | No | `sqlite+aiosqlite:///./business_verify.db` | Database connection string |

## Caching Strategy

- Reports cached for **30 days** to control OpenAI API costs
- Cache keyed by company name (case-insensitive)
- Stale data triggers synchronous re-fetch for MVP simplicity
- SQLite database auto-created on first run

## Dependencies

**Core:** FastAPI, Uvicorn, SQLAlchemy 2.0, Pydantic v2
**Data Engine:** OpenAI, duckduckgo-search, beautifulsoup4, yfinance, httpx
**PDF:** WeasyPrint, Jinja2
**Database:** aiosqlite (async SQLite)

## Future PostgreSQL Migration

Simply change `DATABASE_URL`:
```bash
DATABASE_URL=postgresql+asyncpg://user:password@localhost/business_verify
```

All SQLAlchemy logic is database-agnostic.

## Development Notes

- All database operations are async using `aiosqlite`
- Synchronous libraries (yfinance, duckduckgo-search) wrapped with `asyncio.to_thread`
- WeasyPrint requires GTK+ on Windows for HTML→PDF conversion
- LLM prompts designed for factual consistency (temperature=0.1, strict system prompt)
