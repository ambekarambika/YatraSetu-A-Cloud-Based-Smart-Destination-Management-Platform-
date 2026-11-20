# YatraSetu — Architecture

## 1. Architecture Status

This document details the implemented frontend and backend architecture of YatraSetu, distinguishing verified database and API integrations from client-side simulation layers and planned post-MVP enhancements.

### Confirmed Core Stack
- HTML5, CSS3, Vanilla JavaScript (Frontend)
- Python 3.13 & FastAPI (REST API Backend)
- PostgreSQL (Relational Database)
- Git/GitHub (Version Control & CI/CD)
- Render (Backend Web Service) & Vercel (Frontend Static Hosting)
- Argon2id & Cryptographic JWT + Server-Side RBAC (Security Model)

### Implemented Components
- Public frontend pages (Landing, Login, Registration)
- Shared dashboard UI system across all 4 roles
- Role-specific frontend workspaces (Tourist, Destination Manager, Tourism Stakeholder, Administrator)
- Eight-state regional theme engine
- Client-side UI interactions, modals, and responsive workflows
- FastAPI backend application (`backend/app/main.py`, `backend/app/api/v1/api.py`)
- PostgreSQL database schemas with Alembic migrations (`001` through `008`)
- Row Level Security (RLS) policies for tenant, role, and storage isolation
- Argon2id password hashing and cryptographic JWT authentication with token rotation
- Role-Based Access Control (RBAC) and hierarchical manager jurisdiction enforcement
- REST API endpoints for Auth, Tourist, Manager, Stakeholder, Administrator, Catalogue, and Health
- Persistent destination, attraction, event, feedback, and visitor statistics data models
- Destination video playback and metadata management (YouTube privacy-enhanced embeds and prototype drafts)
- Production deployment on Render (FastAPI + Neon PostgreSQL) and Vercel (Frontend)

### Client-Side Logic & Simulation Layers
- Report generation (`manager/reports.html`): Operates with client-side simulated preview and export engines.
- Decision support metrics (`manager/decision-support.html`): Utilizes client-side scoring algorithms and recommendations based on loaded catalogue data.

### Planned / Post-MVP Enhancements
- Automated multi-region database replication and edge caching optimization
- Real-time IoT sensor telemetry integrations (explicitly out-of-scope for core MVP)
- Advanced offline PWA caching service worker


## 2. High-Level Architecture

```text
User
  |
  v
HTML5 + CSS3 + Vanilla JavaScript
  |
  v
REST API
  |
  v
FastAPI Backend
  |
  +--> Authentication / RBAC
  +--> Destination Management
  +--> Attractions
  +--> Events
  +--> Tourist Services
  +--> Stakeholder Management
  +--> Feedback
  +--> Analytics
  +--> Reports
  +--> Decision Support
  |
  v
PostgreSQL
  |
  +--> Users / Roles
  +--> Destinations
  +--> Attractions
  +--> Events
  +--> Stakeholders
  +--> Feedback
  +--> Trip Plans
  +--> Visitor Statistics
```

Selected GCP services/APIs may sit alongside the application where a genuine requirement is identified.

## 3. Frontend Architecture

Current frontend:

```text
frontend/
├── index.html
├── login.html
├── register.html
├── app-preview.html
├── css/
│   ├── style.css
│   ├── dashboard.css
│   ├── auth.css
│   ├── admin.css
│   ├── stakeholder.css
│   ├── tourist.css
│   └── tourist-pages.css
├── js/
│   ├── api.js
│   ├── auth.js
│   ├── main.js
│   ├── dashboard.js
│   ├── admin.js
│   ├── stakeholder.js
│   ├── stakeholder-data.js
│   ├── tourist.js
│   ├── manager.js
│   ├── manager-core.js
│   ├── manager-data.js
│   └── manager-views.js
├── admin/
│   └── dashboard.html
├── manager/
│   ├── dashboard.html
│   ├── destinations.html
│   ├── attractions.html
│   ├── events.html
│   ├── stakeholders.html
│   ├── visitor-statistics.html
│   ├── feedback.html
│   ├── analytics.html
│   ├── reports.html
│   ├── profile.html
│   └── decision-support.html
├── stakeholder/
│   ├── dashboard.html
│   ├── connections-reviews.html
│   ├── destination-updates.html
│   ├── media-listings.html
│   └── profile.html
└── tourist/
    ├── dashboard.html
    ├── destinations.html
    ├── destination-detail.html
    ├── destination-advisories.html
    ├── experiences.html
    ├── plan-trip.html
    ├── stories.html
    └── travel-guidance.html
```

The frontend deliberately does not use React, Angular, Bootstrap, Tailwind, or another frontend framework.

## 4. Shared UI Layer

`dashboard.css` provides:
- CSS custom properties,
- eight-state theme variables,
- sidebar,
- topbar,
- cards,
- tables,
- badges,
- modals,
- application surfaces.

`dashboard.js` provides shared shell/navigation behavior.

`manager.js`, `manager-core.js`, and `manager-views.js` provide:
- eight-state destination context switching,
- state-specific visual/content changes,
- manager modals,
- filters/interactions,
- client-side report-preview simulation (`reports.html`),
- client-side decision-support scoring logic (`decision-support.html`).

## 5. Current Manager Theme Engine

The manager workspace supports:
1. Maharashtra — Sahyadri Saffron
2. Kerala — Coastal Teal
3. Kashmir — Sky Blue
4. Rajasthan — Amber Gold
5. Goa — Ocean Cyan
6. Tamil Nadu — Temple Magenta
7. Uttarakhand — Himalayan Green
8. Assam — Tea Garden Emerald

State selection dynamically changes relevant context such as accent color, hero photography, title/tagline, weather/location information, destination examples, and event feeds.

## 6. Backend Architecture — Implemented Endpoints

FastAPI exposes modular REST endpoints partitioned under `/api/v1`:

```text
/api/v1/health       - System liveness and PostgreSQL database connectivity health probes
/api/v1/auth         - Registration, login, token refresh, logout, session profile (/me)
/api/v1/catalogue    - Public read-only tourism catalogue (states, destinations, attractions, stories)
/api/v1/manager      - Destination Manager scoped operations (destination updates, video moderation)
/api/v1/stakeholder  - Stakeholder services, social posts, media uploads, reviews, community messages
/api/v1/tourist      - Tourist itineraries (trip plans), bookmarked favorites, reviews & feedback
/api/v1/admin        - Platform governance, user account administration, audit logs, metrics
```

*Note on Simulated & Client-Side Functionality*:
While core identity, catalogue, scoped manager actions, stakeholder operations, tourist itineraries, and platform governance are backed by PostgreSQL and FastAPI, analytics report exports and real-time decision-support scoring currently execute via client-side JavaScript logic and simulated computation engines in the frontend workspaces.

## 7. Database Architecture — Implemented

PostgreSQL serves as the relational database managed via SQLAlchemy 2.0 ORM and Alembic schema migrations (revisions 001 through 008).

Implemented core models (`backend/app/models/`):
- **Identity & Access**: `users`, `roles`, `user_refresh_tokens`, `manager_assignments`
- **Destination Ecosystem**: `states`, `destinations`, `attractions`, `experiences`, `events`, `curated_circuits`, `curated_circuit_items`, `destination_videos`, `destination_advisories`, `travel_stories`
- **Stakeholder Ecosystem**: `stakeholder_services`, `stakeholder_media`, `stakeholder_posts`, `stakeholder_messages`, `stakeholder_reviews`
- **Tourist Functionality**: `trip_plans`, `trip_plan_items`, `user_favorites`, `destination_reviews`
- **Governance & Integrity**: `visitor_statistics`, `audit_logs`, `storage_object_registries`, `media_deletion_outbox`
- **Row-Level Security (RLS)**: Enforced via PostgreSQL policies for multi-tenant manager destination scoping (`008_mgr_dest_video_rls`).

## 8. Authentication Flow — Implemented

```text
Client (Login Form)
   |  Submits credentials (email, password)
   v
POST /api/v1/auth/login
   |
   v
FastAPI / SQLAlchemy queries User by normalized email
   |
   v
Password verification via Argon2id (app.core.hashing)
   |
   v
TokenService generates JWT Access Token (HS256) & Refresh Token
   |  Persists refresh token record in user_refresh_tokens
   v
Returns TokenResponse (access_token, refresh_token, token_type, expires_in)
   |
   v
Frontend stores session state and attaches Bearer token to API requests
```

## 9. Authorization Flow — Implemented

```text
Incoming API Request (Bearer <JWT>)
   |
   v
JWT Validation & Decode (app.core.tokens / app.core.auth)
   |  Verifies signature, expiration, and extracts subject (user ID)
   v
Identify User & Active Role (get_current_active_user)
   |
   v
RBAC Permission Check (e.g., require_admin, require_manager, require_stakeholder)
   |
   v
Jurisdiction / Scope Check (app.core.jurisdiction.JurisdictionAuthorizer)
   |  Verifies destination/state assignment for destination managers
   v
PostgreSQL Session Context (set_config for RLS enforcement where applicable)
   |
   v
Business Logic & Database Execution
   |
   v
Standardized JSON Response / Audit Log entry (for sensitive operations)
```

## 10. Deployment

Current architecture deployment targets:
- Frontend: Static web deployment hosted on Vercel (`frontend/` tree).
- Backend: FastAPI ASGI application running on Render web services.
- Database: Managed PostgreSQL database instance (Neon Serverless PostgreSQL).
- Version Control: GitHub repository (`origin/main`) serving as deployment trigger.

Integration with the production backend is active for core API health, catalogue, authentication, and workspace endpoints, while client-side fallback/simulated engines remain available for offline and viva demonstration environments.

## 11. Security Boundary

Security requirements include:
- hashed passwords,
- JWT authentication,
- RBAC,
- request validation,
- CORS,
- HTTPS,
- environment variables for secrets.

No secret belongs in source control.

## 12. Architecture Principle

Build incrementally:

**Frontend feature → API design → database relationship → backend implementation → integration → testing**

Do not build a large speculative backend before requirements and frontend flows are sufficiently understood.
