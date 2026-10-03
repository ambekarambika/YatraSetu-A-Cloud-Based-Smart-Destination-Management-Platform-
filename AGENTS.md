# YatraSetu — AI Development Agent Instructions

## 1. Purpose

This file defines the operational rules for AI coding agents working on YatraSetu.

The detailed product and architecture context belongs in `docs/PRD.md`, `docs/ARCHITECTURE.md`, `docs/DESIGN.md`, `docs/RULES.md`, `docs/TASKS.md`, and `docs/MEMORY.md`.

## 2. Required Reading

Before making changes:

1. Read `AGENTS.md`.
2. Read the relevant documentation in `docs/`.
3. Inspect the current repository files before assuming implementation status.
4. Treat the actual repository state and the latest explicit project decision as authoritative for implementation status.

## 3. Source-of-Truth Priority

When information conflicts, resolve it in this order:

1. Latest explicit project decision.
2. Current implemented repository state.
3. Finalized requirements and architecture documented in `docs/`.
4. Older plans, ideas, or conversations.

Do not silently choose between conflicting alternatives. Record important resolved decisions in `docs/MEMORY.md`.

## 4. Development Workflow

Every meaningful task follows:

**UNDERSTAND → PLAN → IMPLEMENT → TEST → REPORT → UPDATE DOCUMENTATION**

Do not skip testing or documentation updates when the change affects project state.

## 5. Implementation Rules

- Use HTML5, CSS3, and Vanilla JavaScript for the frontend.
- Do not introduce React, Angular, Bootstrap, Tailwind, or another frontend framework.
- Keep code beginner-friendly and explainable in a viva.
- Prefer simple, readable solutions over abstractions that do not solve a real problem.
- Avoid duplicate CSS, JavaScript, components, pages, or data structures.
- Reuse the existing shared UI system where appropriate.
- Do not rewrite frozen/approved public pages without an explicit reason.
- Do not invent backend functionality and present it as implemented.
- Do not mark a task complete merely because a page or mock UI exists when the requirement needs backend/database integration.
- Do not add dependencies unless they are necessary and documented.
- Never hardcode passwords, API keys, database URLs, JWT secrets, or other credentials.
- Keep secrets in environment variables.
- Preserve the existing project structure unless there is a documented reason to change it.

## 6. UI Rules

- Preserve the approved landing, login, and registration visual language.
- Keep the product tourism-focused rather than looking like a generic SaaS/CRM/banking dashboard.
- Use realistic destination imagery and meaningful tourism context.
- Maintain clear hierarchy, spacing, typography, and responsive behavior.
- Use the state-theme system consistently.
- Do not add visual complexity merely to make a page look advanced.

## 7. Backend/Database Rules

When backend work begins:

- FastAPI + REST APIs are the planned backend.
- PostgreSQL is the planned database.
- JWT authentication and role-based access control are required.
- Validate input at the API boundary.
- Hash passwords securely.
- Use environment variables for secrets and database configuration.
- Keep database relationships explicit and maintainable.

## 8. Testing Rules

For each implemented feature:

- Verify the relevant UI interaction.
- Check browser console errors.
- Test affected API/database behavior once those layers exist.
- Do not report simulated behavior as real persistence.
- Record meaningful failures or blockers in `docs/TASKS.md`.

## 9. Reporting Rules

After work:

- List what changed.
- State what was actually tested.
- Distinguish implemented, simulated/mock, planned, and blocked work.
- Mention files changed.
- Update documentation when project state changes.

## 10. Scope Protection

YatraSetu is a Smart Destination Management Platform, not a hotel/flight booking marketplace.

Do not introduce:
- hotel booking,
- flight booking,
- payment processing,
- large OTA marketplace functionality,
- blockchain,
- Digital Twins,
- unnecessary IoT,
- forced AI/ML,
- unnecessary microservices,
- large ERP/government integrations.

Advanced technology may only be introduced later if it solves a documented requirement.

## 11. Current Development Order

The agreed role-development order is:

1. Destination Manager
2. Tourism Stakeholder
3. Tourist
4. Administrator

Backend/database integration follows the role UI work according to the documented roadmap.

## 12. Important Status Rule

Phase 6A is substantially implemented but **not fully complete/approved as final**. Do not describe Phase 6 as completely finished unless the user explicitly confirms final approval.

The current next role UI after the Manager workspace is Tourism Stakeholder only after the Manager workspace is considered complete.
