# YatraSetu — Backend Foundation & PostgreSQL Setup Guide

Welcome to the backend foundation for **YatraSetu** (Smart Destination Management Platform).  
This backend is built with **Python 3.13**, **FastAPI**, **SQLAlchemy 2.0**, and **Alembic**, designed to connect to **PostgreSQL (Neon)**.

---

## 1. Directory Structure

```
backend/
├── alembic/                      # Alembic schema migration scripts
│   ├── versions/
│   │   └── 001_initial_schema.py # Initial frozen schema (27 tables)
│   ├── env.py                   # Migration environment & model metadata
│   └── script.py.mako           # Revision template
├── app/
│   ├── api/                     # REST API routers
│   │   └── v1/
│   │       ├── endpoints/
│   │       │   └── health.py    # Health & DB connectivity check
│   │       └── api.py           # v1 router aggregator
│   ├── models/                  # SQLAlchemy ORM Models (27 tables)
│   │   ├── identity.py          # Roles, Users, Refresh Tokens, Manager Assignments
│   │   ├── destination.py       # States, Destinations, Attractions, Events, Circuits
│   │   ├── stakeholder.py       # Services, Media, Posts, Messages, Reviews
│   │   ├── tourist.py           # Trip Plans, Items, Favorites, Destination Reviews
│   │   ├── governance.py        # Visitor Stats, Audit Logs, Outbox, Object Registry
│   │   └── __init__.py          # Central model metadata registry
│   ├── schemas/                 # Pydantic validation schemas
│   │   ├── health.py            # Diagnostic schemas
│   │   └── __init__.py
│   ├── config.py                # Environment variable loader (Pydantic / dotenv)
│   ├── database.py              # Engine, SessionLocal, Base, get_db dependency
│   ├── main.py                  # FastAPI app entrypoint, CORS & routes
│   ├── seeds.py                 # Verified reference data seeder (Roles & States)
│   └── __init__.py
├── tests/                       # Automated test suite (runs offline with SQLite)
│   ├── conftest.py              # Pytest fixtures & in-memory DB setup
│   ├── test_models.py           # Model relationships & constraints tests
│   └── test_health.py           # App startup & diagnostic endpoint tests
├── .env.example                 # Environment template with placeholders
├── alembic.ini                  # Alembic CLI configuration
├── requirements.txt             # Python dependencies
└── README.md                    # This setup guide
```

---

## 2. Installation & Local Setup

### Step A: Set Up Python Virtual Environment (Recommended)

From the project root (`d:\YatraSetu`):

```bash
# Navigate to backend directory
cd backend

# Create a virtual environment (optional but recommended)
python -m venv venv

# Activate virtual environment
# On Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# On Windows (CMD):
.\venv\Scripts\activate.bat
# On macOS / Linux:
source venv/bin/activate
```

### Step B: Install Dependencies

```bash
pip install -r requirements.txt
```

---

## 3. Configuring Neon PostgreSQL

1. Log into your [Neon Console](https://console.neon.tech/) and navigate to your project database.
2. In the Neon Dashboard, copy your connection string (under **Connection Details**). Make sure to select **Pooled connection** or standard direct connection.
3. In the `backend/` directory, copy `.env.example` to `.env`:

```bash
copy .env.example .env
```

4. Open `.env` and paste your Neon connection string into `DATABASE_URL`:

```env
DATABASE_URL="postgresql://yatrasetu_app:<PASSWORD>@<NEON_HOST>/yatrasetu_db?sslmode=require"
```

> **Note:** If `DATABASE_URL` is left blank, the application automatically falls back to an in-memory SQLite database for local test execution without failing.

---

## 4. Running Database Migrations

### A. Preview Generated SQL Offline (No Database Connection Required)

To inspect the exact SQL statements before running them:

```bash
alembic upgrade head --sql
```

### B. Apply Migrations to Your Neon Database

Once your `.env` contains valid Neon credentials:

```bash
alembic upgrade head
```

This creates all 27 tables, primary keys, foreign keys, constraints, and indexes.

---

## 5. Seeding Verified Reference Data

To populate the 4 official roles (`admin`, `manager`, `stakeholder`, `tourist`) and the 8 agreed cultural context states (`maharashtra`, `kerala`, `kashmir`, `rajasthan`, `goa`, `tamilnadu`, `uttarakhand`, `assam`) without inserting any synthetic users or fake reviews:

```bash
python -m app.seeds
```

---

## 6. Starting the FastAPI Backend Server

Start the development server with auto-reload:

```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Once running, access:
- **Interactive Swagger Documentation:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc Documentation:** [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)
- **Liveness Health Probe:** [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)
- **Database Connectivity Diagnostics:** [http://127.0.0.1:8000/api/v1/health/db](http://127.0.0.1:8000/api/v1/health/db)

---

## 7. Running the Automated Test Suite

The test suite runs completely offline using an in-memory SQLite database, requiring zero external cloud credentials:

```bash
python -m pytest -v
```

All 12 unit and integration tests will execute and verify:
- Application startup and CORS headers.
- Health and database diagnostic endpoints.
- Role and user model relationships.
- Unique email constraint enforcement.
- Destination, state, and attraction relational hierarchies.
- Manager jurisdiction scoping (State vs. Destination scope).
- Trip plan and itinerary item cascade deletions.
- User destination favorite uniqueness constraints.
- Daily visitor telemetry unique constraints.
- Verified reference data seeding idempotency.
