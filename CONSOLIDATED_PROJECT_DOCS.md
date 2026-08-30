# VC Project Consolidated Documentation
## Student-Focused Company Insights Platform (CrewAI-Powered)

---

## Table of Contents
- 1. Project Overview
  - 1.1 Purpose & Core Mission
  - 1.2 Architectural Summary
- 2. Directory Structure
  - 2.1 Root Directory
  - 2.2 Backend (FastAPI)
  - 2.3 Frontend (Next.js/React)
- 3. Backend Key Files & Modules
  - 3.1 Main Application Entry Points
  - 3.2 CrewAI Agents
  - 3.3 Database Layer
  - 3.4 Configuration
- 4. Frontend Key Files & Components
  - 4.1 App Structure
  - 4.2 Core Components
  - 4.3 API Integration
- 5. API Endpoint Specifications
  - 5.1 Student-Focused Endpoints
  - 5.2 Core Endpoints
- 6. Data Models
  - 6.1 SQLAlchemy Database Models
  - 6.2 Pydantic Schemas
  - 6.3 Frontend Type Definitions
- 7. Environment & Deployment
- 8. Interaction Flow Diagram
- 9. Critical Implementation Details

---

## 1. Project Overview
### 1.1 Purpose & Core Mission
This is a fully CrewAI-driven, student-focused platform for company research and trust scores, with a natural language chat interface. No more manual API calls or company verification features removed completely. Everything goes through CrewAI agents!

### 1.2 Architectural Summary
- **Backend**: FastAPI async web framework with SQLAlchemy ORM
- **Frontend**: Next.js 14 App Router with React and TypeScript
- **AI/LLM**: Mandatory CrewAI orchestration with Crew Manager
- **Database**: SQLite (local dev)
- **Styling**: Tailwind CSS with existing design system
- **Icons**: Lucide React
- **State Management**: React hooks + Axios

---

## 2. Directory Structure
### 2.1 Root Directory
- `README.md`: Main project README
- `CONSOLIDATED_PROJECT_DOCS.md`: This file!
- `docker-compose.yml`: Docker compose config for full stack
- `backend/`: FastAPI backend
- `frontend/`: Next.js frontend
- `Data-pipeline/`: Existing data pipeline (untouched)

### 2.2 Backend
- `main.py`: FastAPI app entry point
- `requirements.txt`: Dependencies
- `Dockerfile`: Backend container config
- `config.py`: Config via pydantic-settings
- `database.py`: Async SQLAlchemy engine, session
- `db_models.py`: SQLAlchemy models
- `schemas.py`: Pydantic schemas
- `agents/`: CrewAI agents
  - `config.py`: Agent config, LLM setup
  - `crew.py`: Crew builders including Crew Manager
  - `tools.py`: Agent tools
- `data_engine/` (kept but unused except `student_score.py`)
  - `student_score.py`: Student trust score calculator

### 2.3 Frontend
- `app/`: Next.js 14 App Router
  - `page.tsx`: Chat interface (home)
  - `layout.tsx`: Root layout
  - `jobs/`, `company/`, `profile/`: Old UI kept as-is
- `lib/`: Utils
  - `api.ts`: Axios client with all endpoints
- `components/`: Components
  - `cards/`, `ui/`, `filters/`: Existing components
- `types/`: Type definitions
- `Dockerfile`: Frontend container config

---

## 3. Backend Key Files & Modules
### 3.1 Main Entry Point (`main.py`)
- `/api/v1/students/chat - POST endpoint for natural language queries through Crew Manager
- Favorites endpoints
- Review endpoints
- GET `/api/v1/students/company/{name}
- GET `/api/v1/students/compare`
- Health check, root endpoints

### 3.2 CrewAI Agents (`agents/`)
- `agents/config.py` - Crew Manager added to `agent_configs
- `agents/crew.py` - New `build_conversational_crew(query)` function added

---

## 4. Frontend Key Files & Components
- Home page is now a chat UI!

---

## 5. API Endpoint Specifications
### New Chat Endpoint
`POST /api/v1/students/chat`
Body: `{ query: string }`
Response: `{ success: boolean, data: { response: string, metadata: { agents_used: number, tasks_completed: number } }`

---

## 6. Data Models
SQLAlchemy models kept: FavoriteCompany, InternalStudentReview, Opportunity (if present). CachedReport removed.

---

## 7. Environment Variables
Backend: GEMINI_API_KEY, GROQ_API_KEY, NVIDIA_API_KEY, DATABASE_URL
Frontend: NEXT_PUBLIC_API_URL

---

## 8. Interaction Flow
1. User sends natural language query → frontend sends to `/api/v1/students/chat → Crew Manager agent decides what to do → sub-agents research → Crew Manager synthesizes response → sent back to user!

---

## 9. Critical Notes
- No more company verification, no more financial APIs (unless CrewAI agents do all research!
