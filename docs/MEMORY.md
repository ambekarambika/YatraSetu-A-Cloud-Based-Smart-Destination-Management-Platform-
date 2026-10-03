# YatraSetu — Permanent Decision Log

This file records decisions that should not be silently reversed.

## 2026-10-02 — Frontend Technology

**Decision:** Use HTML5, CSS3, and Vanilla JavaScript. No React, Angular, Bootstrap, or Tailwind.

**Reason:** The project prioritizes beginner-friendly, viva-explainable, clean, lightweight frontend code.

**Consequence:** All role workspaces must use the existing native frontend approach.

---

## 2026-10-02 — Product Scope

**Decision:** YatraSetu is a Smart Destination Management Platform, not a hotel/flight booking marketplace.

**Reason:** The project is focused on destination management, tourism information, stakeholder coordination, feedback, analytics, reporting, and decision support.

**Consequence:** Booking marketplace and payment features remain outside scope.

---

## 2026-10-02 — Role Development Order

**Decision:** Develop role workspaces in this order:
1. Destination Manager
2. Tourism Stakeholder
3. Tourist
4. Administrator

**Reason:** The Destination Manager is the central management-side user and was prioritized first.

**Consequence:** Stakeholder UI follows Manager completion/review.

---

## 2026-10-02 — Public UI Freeze

**Decision:** Landing, Login, and Registration interfaces are treated as frozen/approved.

**Reason:** The latest progress report states these phases are frozen and approved.

**Consequence:** Do not redesign them without an explicit new decision.

---

## 2026-10-02 — Manager Workspace Direction

**Decision:** The Manager workspace uses a premium, realistic, tourism-focused visual language rather than a generic SaaS dashboard.

**Reason:** Earlier Manager UI iterations were considered visually noisy/generic.

**Consequence:** Future manager corrections must preserve destination context, restrained cards, realistic imagery, and clear hierarchy.

---

## 2026-10-02 — Eight-State Theme Engine

**Decision:** Manager workspace supports eight state contexts with dynamic visual/content changes.

**States:** Maharashtra, Kerala, Kashmir, Rajasthan, Goa, Tamil Nadu, Uttarakhand, Assam.

**Reason:** The project uses a state-dynamic cultural visual system.

**Consequence:** New Manager pages should integrate with the shared state theme mechanism rather than creating separate theme systems.

---

## 2026-10-02 — Phase 6A Status

**Decision:** Phase 6A is substantially implemented but not fully complete/frozen.

**Reason:** The latest progress report explicitly says Phase 6 is not fully complete.

**Consequence:** Do not label the Manager workspace “fully complete” or move the project status to a final Manager freeze until final review/approval.

---

## 2026-10-02 — Backend Status

**Decision:** Backend and database remain planned, not implemented.

**Reason:** The progress report identifies FastAPI and PostgreSQL as planned and places database/backend work in later phases.

**Consequence:** Frontend simulations must not be represented as real persistence or API functionality.

---

## 2026-10-02 — GCP Position

**Decision:** GCP is a planned supporting cloud option, not a claim that the entire application is already hosted on GCP.

**Reason:** The architecture requires cloud use but the exact GCP service has not been finalized.

**Consequence:** Do not invent a specific GCP service or deployment architecture before it is decided and implemented.

---

## 2026-10-02 — Documentation Status

**Decision:** The project documentation must distinguish confirmed/implemented, in-progress, planned, simulated, and undecided work.

**Reason:** This prevents AI coding agents from confusing mock frontend work with completed backend functionality.

**Consequence:** All future progress reports should use precise status language.
