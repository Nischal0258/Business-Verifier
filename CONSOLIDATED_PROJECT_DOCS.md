# VC Project Consolidated Documentation
## Glassdoor-Style Venture Capital Platform

---

## Table of Contents
- 1. Project Overview
  - 1.1 Purpose & Core Mission
  - 1.2 Architectural Summary
  - 1.3 Completed Work (Phases 1‑6)
- 2. Directory Structure
  - 2.1 Root Directory
  - 2.2 Backend (FastAPI)
  - 2.3 Frontend (Next.js/React)
  - 2.4 Other Directories
- 3. Backend Key Files & Modules
  - 3.1 Main Application Entry Points
  - 3.2 API Routers
  - 3.3 Data Engine
  - 3.4 CrewAI Agents (Optional)
  - 3.5 Database Layer
  - 3.6 PDF Generation
  - 3.7 Configuration
- 4. Frontend Key Files & Components
  - 4.1 App Structure
  - 4.2 Core Components
  - 4.3 API Integration
- 5. API Endpoint Specifications
  - 5.1 Student-focused Endpoints (Phase 3)
  - 5.2 Company-focused Endpoints (Phase 4)
  - 5.3 Core Endpoints
- 6. Data Models
  - 6.1 SQLAlchemy Database Models
  - 6.2 Pydantic Schemas
  - 6.3 Frontend Type Definitions
- 7. Environment & Deployment
  - 7.1 Environment Variables
  - 7.2 Docker Configuration
  - 7.3 Development Workflow
- 8. Interaction Flow Diagram
- 9. Critical Implementation Details

---

## 1. Project Overview
### 1.1 Purpose & Core Mission
This is a full-stack Glassdoor-style platform for venture capital firms and students, providing:
- Company verification and analytics reports
- Student-focused company insights with trust scores
- Job/internship opportunity listings
- Student reviews of companies
- Favorites management for students
- Company social media integration
- CrewAI agent orchestration (optional)

### 1.2 Architectural Summary
- **Backend**: FastAPI async web framework with SQLAlchemy ORM
- **Frontend**: Next.js 14 App Router with React and TypeScript
- **Database**: SQLite (local dev) / PostgreSQL (prod, optional)
- **AI/LLM**: Optional CrewAI agent framework with Gemini/Groq/NVIDIA integration
- **Styling**: Shadcn/UI, Tailwind CSS
- **Icons**: Lucide React
- **State Management**: React hooks + Axios

### 1.3 Completed Work (Phases 1‑6)
- ✅ Phase 1: CrewAI agent infrastructure (config, tools, crews)
- ✅ Phase 2: Database models + job service layer
- ✅ Phase 3: Student-focused API (favorites, reviews, opportunities)
- ✅ Phase 4: Company-focused API (social, reviews, refresh)
- ✅ Phase 5: Glassdoor-style front-end UI (pages, components)
- ✅ Phase 6: Testing setup, project docs, Docker deployment config

---

## 2. Directory Structure
### 2.1 Root Directory (`VC PROJECT/`)
- `README.md`: Main project README
- `CONSOLIDATED_PROJECT_DOCS.md`: THIS FILE!
- `docker-compose.yml`: Docker compose config for full stack
- `backend/`: FastAPI backend service
- `frontend/`: Next.js frontend app

### 2.2 Backend (`backend/`)
- `main.py`: FastAPI app entry point with lifespan and all endpoints
- `requirements.txt`: Project dependencies
- `Dockerfile`: Backend container image build config
- `config.py`: Pydantic config for environment variables
- `database.py`: Database initialization and session management
- `db_models.py`: SQLAlchemy ORM models
- `schemas.py`: Pydantic request/response schemas
- `pdf_generator.py`: WeasyPrint PDF report generation
- `fts_search.py`: SQLite FTS5 full-text search
- `tasks.py`: Background pre-fetch task scheduler
- `utils.py`: Utilities (normalize company name, etc.)
- `routers/`: FastAPI routers
  - `students.py`: Phase 3 student-focused API endpoints
  - `companies.py`: Phase 4 company-focused API endpoints
- `data_engine/`: Data collection, summarization, reporting
  - `engine.py`: Main report generation logic
  - `fetchers.py`: External API fetchers (registry, financial, social, etc.)
  - `models.py`: Pydantic models for data engine
  - `student_score.py`: Student-focused trust score calculator
- `agents/`: Optional CrewAI agents
  - `config.py`: Agent configuration
  - `crew.py`: CrewAI crew definitions
  - `tools.py`: Agent tools (search, fetch, etc.)

### 2.3 Frontend (`frontend/`)
- `package.json`: Dependencies and scripts
- `Dockerfile`: Frontend container image build config
- `tailwind.config.js`: Tailwind config
- `tsconfig.json`: TypeScript config
- `app/`: Next.js 14 App Router
  - `layout.tsx`: Root layout
  - `page.tsx`: Home page
  - `jobs/`: Job search pages
    - `page.tsx`: Server-side jobs search page
    - `JobsClient.tsx`: Client-side job search component
  - `company/[id]/`: Company detail page
    - `page.tsx`: Server-side company detail
    - `CompanyTabs.tsx`: Tabs (Overview, Reviews, Jobs)
  - `profile/`: User profile/personal center
    - `page.tsx`: Profile page (favorites, reviews)
- `lib/`: Utilities
  - `api.ts`: Axios API client with all endpoints
- `components/`: React components
  - `ui/`: Shadcn/UI components
    - `Rating.tsx`: Star rating component
  - `cards/`: Cards
    - `JobCard.tsx`: Job opportunity card
    - `ReviewCard.tsx`: Student review card
    - `CompanyInfoCard.tsx`: Company info card
  - `filters/`: Filters
    - `FilterSidebar.tsx`: Job filter sidebar
- `types/`: TypeScript type definitions
  - `student.ts`: Student-facing types
- `docs/`: Frontend component docs
  - `COMPONENTS.md`: Component usage guide

---

## 3. Backend Key Files & Modules
### 3.1 Main Application Entry Points
- `main.py`: FastAPI app with:
  - CORS middleware configured
  - Optional CrewAI endpoints guarded by `HAS_CREWAI` flag
  - L1/L2/L3 cache (memory, SQLite, FTS5)
  - Background tasks for pre-fetching reports
  - Health check and root endpoints
  - API versioning (`/api/v1/`)

### 3.2 API Routers
- `routers/students.py`: Phase 3 student API router, mounted at `/api/v1/students`
  - `GET /opportunities`: Job/internship opportunities with search/filters
  - `POST /favorites`: Add company to user favorites
  - `DELETE /favorites/{company_name}`: Remove company from favorites
  - `GET /favorites`: List user's favorite companies
  - `POST /reviews`: Submit student review
  - `GET /reviews/{company_name}`: Get reviews for specific company
- `routers/companies.py`: Phase 4 company API router, mounted at `/api/v1/companies`
  - `GET /{company_name}/social`: Get social media links
  - `GET /{company_name}/reviews`: Get aggregated review summary
  - `GET /{company_name}/opportunities`: Get opportunities for a single company
  - `POST /{company_name}/refresh`: Refresh company data (via CrewAI, optional)

### 3.3 Data Engine (`data_engine/`)
- `engine.py`: `generate_full_report(company_name)` → generates full company report with LLM summarization (mock mode if API key not present)
- `fetchers.py`: Fetchers for:
  - Registry data (business info)
  - Financial data (yfinance, Alpha Vantage, Finnhub)
  - Web search (DuckDuckGo, Bing)
  - Wikipedia summaries
- `models.py`: Pydantic schemas for data engine
- `student_score.py`: Calculate student trust score from company data, social, reviews, opportunities

### 3.4 CrewAI Agents (`agents/` - Optional)
- `config.py`: Agent config (LLM settings, agent roles)
- `crew.py`: `build_student_report_crew(company_name)` → Crew for student-focused research
- `crew.py`: `build_comparator_crew(company_list)` → Compare multiple companies side-by-side
- `tools.py`: Custom tools for CrewAI agents

### 3.5 Database Layer
- `database.py`: Async SQLAlchemy engine, session maker, init_db
- `db_models.py`: SQLAlchemy models:
  - `CachedReport`: Stored company reports
  - `Favorites`: User favorites
  - `StudentReview`: Student reviews of companies
  - `Opportunity`: Job/internship listings

### 3.6 PDF Generation
- `pdf_generator.py`: `create_pdf(data)` → generates PDF report using WeasyPrint from HTML template

### 3.7 Configuration
- `config.py`: Settings via pydantic-settings
  - `DATABASE_URL`: SQLite/PostgreSQL connection string
  - `GEMINI_API_KEY`, `GROQ_API_KEY`, `NVIDIA_API_KEY`: LLM API keys
  - `CORS_ORIGINS`: Allowed CORS origins

---

## 4. Frontend Key Files & Components
### 4.1 App Structure
- `app/layout.tsx`: Root layout with theme provider
- `app/page.tsx`: Home page
- `app/jobs/page.tsx`: Server-side job search
- `app/jobs/JobsClient.tsx`: Client-side filter and job grid
- `app/company/[id]/page.tsx`: Company detail page
- `app/profile/page.tsx`: User profile (favorites, reviews)

### 4.2 Core Components
- `components/ui/Rating.tsx`: Star rating with editable mode
- `components/cards/JobCard.tsx`: Displays job opportunity, supports selectable state
- `components/cards/ReviewCard.tsx`: Displays a student review
- `components/cards/CompanyInfoCard.tsx`: Company header (name, trust score, verified status)
- `components/filters/FilterSidebar.tsx`: Filters for job search (location, job type)

### 4.3 API Integration
- `lib/api.ts`: Axios API client with all endpoints
  - `getOpportunities`: Job search
  - `getFavorites`, `addFavorite`, `removeFavorite`: Favorites management
  - `submitReview`, `getCompanyReviews`: Reviews
  - `getCompanySocial`, `getCompanyReviewSummary`, `getCompanyOpportunities`, `refreshCompanyData`: Company data
  - `getStudentCompanyReport`, `compareCompanies`: Optional CrewAI endpoints

---

## 5. API Endpoint Specifications
### 5.1 Student-focused Endpoints (`/api/v1/students`)
| Method | Path | Summary |
|--------|------|---------|
| GET | /opportunities?search=query&location=loc | Search jobs/internships |
| POST | /favorites | Add company to favorites |
| DELETE | /favorites/{company_name} | Remove from favorites |
| GET | /favorites | Get user's favorites |
| POST | /reviews | Submit student review |
| GET | /reviews/{company_name} | Get reviews for company |

### 5.2 Company-focused Endpoints (`/api/v1/companies`)
| Method | Path | Summary |
|--------|------|---------|
| GET | /{name}/social | Get social links |
| GET | /{name}/reviews | Get aggregated review summary |
| GET | /{name}/opportunities | Get company's opportunities |
| POST | /{name}/refresh | Refresh company data (optional CrewAI) |

### 5.3 Core Endpoints
| Method | Path | Summary |
|--------|------|---------|
| GET | / | Root endpoint |
| GET | /health | Health check |
| GET | /api/verify/{company_name} | Get company verification report |
| GET | /api/verify/{company_name}/pdf | Download company PDF report |

---

## 6. Data Models
### 6.1 SQLAlchemy Database Models (`db_models.py`)
| Model | Fields | Purpose |
|-------|--------|---------|
| CachedReport | id, company_name, is_verified, verification_score, history_text, jurisdiction, incorporation_date, turnover_json, sources_json, updated_at | Stored company reports |
| FavoriteCompany | id, company_name, added_at | User favorites |
| InternalStudentReview | id, company_name, rating, review_text, author_name, created_at | Student reviews |
| Opportunity | id, title, company, location, description, posted_date | Job/internship listings |

### 6.2 Pydantic Schemas (`schemas.py`)
- ApiResponse[Type]: Generic response wrapper
- CompanyVerificationData: Company verification report
- CompanyStudentReport: Student-focused report
- Plus request/response schemas for all endpoints

### 6.3 Frontend Type Definitions (`types/student.ts`)
- OpportunityItem: Job listing type
- FavoriteCompanyCreate/Response: Favorite types
- InternalStudentReviewCreate/Response: Review types
- Plus all other student-facing types

---

## 7. Environment & Deployment
### 7.1 Environment Variables
#### Backend (.env)
| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| DATABASE_URL | Yes | sqlite+aiosqlite:///./app.db | Database connection string |
| GEMINI_API_KEY | No | | Google Gemini API key |
| GROQ_API_KEY | No | | Groq API key |
| NVIDIA_API_KEY | No | | NVIDIA API key |
| CORS_ORIGINS | No | http://localhost:3000 | CORS allowed origins |

#### Frontend (.env.local)
| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| NEXT_PUBLIC_API_URL | Yes | http://localhost:8000 | Backend base URL |

### 7.2 Docker Configuration
- `docker-compose.yml`: Orchestrates both backend and frontend
- `backend/Dockerfile`: Builds FastAPI backend
- `frontend/Dockerfile`: Builds Next.js frontend

### 7.3 Development Workflow
#### Backend
1. `cd backend`
2. `python -m venv venv`
3. Activate venv
4. `pip install -r requirements.txt`
5. Create `.env`
6. `uvicorn main:app --reload`

#### Frontend
1. `cd frontend`
2. `npm install`
3. Create `.env.local`
4. `npm run dev`

---

## 8. Interaction Flow Diagram
```
User Request
    ↓
Frontend Page/Component
    ↓
lib/api.ts (Axios Client)
    ↓
FastAPI Endpoint (main.py or router)
    ↓
Database (SQLAlchemy) OR External APIs (data_engine/fetchers.py)
    ↓
Response → Back to Frontend → Rendered to User
```

Optional CrewAI Flow:
```
Student Company Report Request
    ↓
/api/v1/student/company/{company_name}
    ↓
build_student_report_crew()
    ↓
CrewAI Agents Execute Tasks
    ↓
Parse Results → calculate_student_trust_score()
    ↓
Response
```

---

## 9. Critical Implementation Details
- **Optional CrewAI**: Import is guarded by `try/except` block, sets `HAS_CREWAI` flag
- **Caching**: L1 in-memory (cachetools TTLCache, 500 items, 1hr TTL), L2 SQLite DB, L3 live fetch, L2.5 FTS5 fuzzy search fallback
- **Async Everywhere**: All FastAPI endpoints are async, uses async SQLAlchemy
- **Mock Mode**: If LLM API key not present, data engine uses placeholder summaries
- **FTS5**: SQLite full-text search for fuzzy company name matching
- **Background Tasks**: Schedule periodic pre-fetch of popular company reports
- **CrewAI Agents**: Uses hierarchical agents for research
- **Deployment**: Docker Compose for full stack
- **Frontend Pages**:
  - Jobs: Search and filter internships/jobs
  - Company Detail: Company profile, reviews, jobs
  - Profile: Manage favorites, submit reviews, see your reviews
- **Components Library**: Rating, JobCard, ReviewCard, CompanyInfoCard, FilterSidebar (all responsive)

---

## Notes for AI Models
This file is **self-contained** and provides all necessary context about the VC Project codebase. You do not need to process individual source files unless explicitly asked to modify or debug specific code!
