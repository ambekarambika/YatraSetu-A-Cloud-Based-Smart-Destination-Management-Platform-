# YatraSetu — Development Rules

## 1. Technology Rules

### Frontend
Required:
- HTML5
- CSS3
- Vanilla JavaScript

Forbidden unless explicitly approved:
- React
- Angular
- Bootstrap
- Tailwind
- other frontend UI frameworks

### Backend
Planned:
- Python
- FastAPI
- REST APIs

### Database
Planned:
- PostgreSQL

### Deployment
Current target:
- Render
- selected GCP services/APIs where justified

## 2. Code Quality

- Keep code beginner-friendly.
- Keep functions understandable.
- Avoid unnecessary abstraction.
- Avoid duplicate code.
- Prefer native browser capabilities when sufficient.
- Do not add dependencies for cosmetic reasons.
- Use descriptive names.
- Keep files organized according to their role.

## 3. Product Scope

YatraSetu is not a booking marketplace.

Do not add hotel booking, flight booking, payments, OTA marketplace operations, blockchain, Digital Twins, unnecessary IoT, forced AI/ML, unnecessary microservices, or large ERP/government integrations.

### Manager Scope

Current Manager hierarchy:

```text
State
  ↓
Destination
```

Main/Government Manager:
- State-wide access
- Can manage destinations within the assigned state

Destination Manager:
- Restricted to assigned destination(s)

Do not implement national-level management yet.

Frontend filtering is NOT security.
Final authorization must be enforced by FastAPI.

## 4. UI Rules

- Preserve frozen public pages.
- Maintain the tourism identity.
- Avoid generic SaaS/admin templates.
- Avoid excessive cards.
- Avoid visual clutter.
- Use realistic imagery.
- Use the state-theme system consistently.
- Keep glass effects subtle.
- Keep role-specific content genuinely role-specific.

## 5. Authentication/Security Rules

When implemented:
- hash passwords,
- use JWT,
- enforce RBAC server-side,
- validate input,
- keep secrets in `.env`,
- never commit credentials,
- configure CORS intentionally,
- use HTTPS in production.

## 6. Data Rules

Do not expand frontend JavaScript files with fake domain data.

Do not invent:
- destinations
- attractions
- events
- stakeholders
- visitor statistics
- feedback
- KPI values
- analytics results

Temporary mock data may only be used when explicitly approved for a prototype.

The intended production flow is:

```text
PostgreSQL
    ↓
FastAPI
    ↓
REST API
    ↓
Vanilla JavaScript frontend
```

Mock/sample data may be used for frontend development, but it must be clearly distinguishable from real persistent data.

Do not claim that a frontend modal or simulated report is connected to PostgreSQL until API/database integration is implemented and tested.

## 7. Testing Rules

Every meaningful change should be checked for:
- navigation,
- interactive controls,
- browser console errors,
- responsive behavior where relevant.

When backend work exists, also test:
- API responses,
- validation,
- authorization,
- database operations.

## 8. Documentation Rules

Update the relevant documentation when:
- a decision changes,
- a feature becomes implemented,
- a task becomes blocked,
- architecture changes,
- a new dependency is added,
- deployment status changes.

Use `docs/MEMORY.md` for permanent decisions.

## 9. Status Language

Use precise labels:
- **CONFIRMED / IMPLEMENTED** — verified in the repository.
- **IN PROGRESS** — partially implemented or awaiting final review.
- **PLANNED** — intended but not implemented.
- **SIMULATED** — UI behavior without real persistence/backend.
- **UNDECIDED** — no final choice has been made.
- **BLOCKED** — cannot proceed because a required decision/dependency is missing.

Do not use “complete” loosely.

## 10. Agent Workflow

**UNDERSTAND → PLAN → IMPLEMENT → TEST → REPORT → UPDATE DOCUMENTATION**

Before large changes, explain the planned file/module impact.

After changes, report:
- files changed,
- behavior changed,
- tests performed,
- known limitations,
- documentation updated.

## 11. Reuse Before Create

Before creating ANY new file, inspect the existing project structure.

Prefer:
1. Reusing an existing file.
2. Extending an existing module.
3. Consolidating duplicate functionality.

Do NOT create new HTML, CSS, JavaScript, Python, component, utility, or configuration files merely because a page, state, destination, role, or feature is different.

States and destinations are DATA, not separate codebases.

Do NOT create:
- state-specific HTML pages
- destination-specific HTML pages
- duplicate CSS files
- one JS file per page without a genuine architectural reason
- duplicate components or utilities

If a new file is genuinely required:
1. Explain why the existing files cannot support it.
2. Identify the exact file to be created.
3. Wait for approval before creating it.

Never silently create, rename, move, or delete files.
