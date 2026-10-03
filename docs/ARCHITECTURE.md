# YatraSetu — Architecture

## 1. Architecture Status

This document distinguishes implemented frontend architecture from planned backend/database architecture.

### Confirmed
- HTML5
- CSS3
- Vanilla JavaScript
- FastAPI as planned backend
- PostgreSQL as planned database
- REST API approach
- Git/GitHub
- Render deployment target
- Selected GCP services/APIs where genuinely useful
- JWT + RBAC as planned security model

### Implemented
- Public frontend pages
- Shared dashboard UI system
- Destination Manager frontend workspace
- Eight-state manager theme engine
- Client-side UI interactions and page navigation

### Not Yet Implemented
- FastAPI application
- PostgreSQL schema
- Real JWT authentication
- Real RBAC enforcement
- Real REST API integration
- Persistent destination/attraction/event data
- Real analytics calculations
- Real report generation from database data
- Production cloud/backend integration

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
│   └── dashboard.css
├── js/
│   ├── script.js
│   ├── dashboard.js
│   └── manager.js
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
│   └── decision-support.html
├── stakeholder/       # planned
├── tourist/           # planned
└── admin/             # planned
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

`manager.js` currently provides:
- eight-state destination context switching,
- state-specific visual/content changes,
- manager modals,
- filters/interactions,
- report-preview simulation.

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

## 6. Backend Architecture — Planned

FastAPI will expose REST endpoints.

Expected groups:

```text
/api/auth
/api/users
/api/destinations
/api/attractions
/api/events
/api/stakeholders
/api/feedback
/api/trips
/api/analytics
/api/reports
```

Exact routes and schemas should be finalized during backend implementation rather than invented prematurely.

## 7. Database — Planned

PostgreSQL is the planned relational database.

Expected core entities:
- users
- roles
- destinations
- attractions
- events
- stakeholders
- feedback
- trip_plans
- visitor_statistics

Supporting tables may be introduced only when justified by actual requirements.

## 8. Authentication Flow — Planned

```text
Login Form
   |
   v
POST /api/auth/login
   |
   v
FastAPI validates credentials
   |
   v
Password hash verification
   |
   v
JWT generated
   |
   v
Frontend uses token for protected requests
```

## 9. Authorization Flow — Planned

```text
Request
  -> JWT validation
  -> identify user + role
  -> RBAC check
  -> business logic
  -> database operation
  -> response
```

## 10. Deployment

Current target:
- frontend web deployment,
- FastAPI backend on Render,
- PostgreSQL database,
- selected GCP service/API where required.

GitHub is the version-control/deployment source.

Do not state that production backend/database integration is complete until verified in the repository.

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
