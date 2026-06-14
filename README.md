# VC Project (Glassdoor‑Style Venture Capital Platform)

## Project Overview

This is a full‑stack platform for discovering and evaluating venture capital firms, featuring Glassdoor‑style reviews, job opportunities, and company insights.

**Repository structure:**

```
/VC PROJECT
├── backend/           # FastAPI backend
├── frontend/          # Next.js + React frontend
├── Data-pipeline/     # Data pipeline (submodule)
└── README.md
```

---

## Phases Completed

### ✅ Phase 1: Foundation
- Agent infrastructure
- Core tools & config
- Database models

### ✅ Phase 2: Core Services
- Job service layer
- Database integration

### ✅ Phase 3: Student‑Focused API
- Job opportunities endpoint
- Favorites management
- Review submission/retrieval

### ✅ Phase 4: Company‑Focused API
- Social media links
- Review summary
- Refresh company data endpoint

### ✅ Phase 5: Frontend UI
- Glassdoor‑style component library (JobCard, ReviewCard, Rating, etc.)
- Updated jobs, company detail, and profile pages

### 🟡 Phase 6: Testing, Documentation, Deployment (WIP)

---

## Tech Stack

### Backend
- **FastAPI** – async web framework
- **SQLAlchemy** – ORM
- **SQLite/PostgreSQL** – database
- **CrewAI** (optional) – agent orchestration

### Frontend
- **Next.js 14** – React framework
- **TypeScript** – type safety
- **Tailwind CSS** – styling
- **Shadcn UI** – component library
- **Lucide React** – icons
- **Axios** – API client

---

## Getting Started

### Backend Setup

1. Navigate to backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # Windows:
   .\venv\Scripts\activate
   # Linux/macOS:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Create a `.env` file (see `.env.example` for reference):
   ```env
   DATABASE_URL="sqlite+aiosqlite:///./app.db"
   ```
5. Start backend dev server:
   ```bash
   uvicorn main:app --reload
   ```
   API docs available at [http://localhost:8000/docs](http://localhost:8000/docs)

### Frontend Setup

1. Navigate to frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create `.env.local`:
   ```env
   NEXT_PUBLIC_API_URL="http://localhost:8000"
   ```
4. Start dev server:
   ```bash
   npm run dev
   ```
   App available at [http://localhost:3000](http://localhost:3000)

---

## License

MIT
