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

---

## 2026-10-10 — Manager JavaScript Modularization

**Decision:** Split monolithic `manager.js` into cohesive modules (`manager-data.js`, `manager-core.js`, `manager-views.js`, `manager.js`) across Checkpoints `a969479` (Stage 1) and `ba4ada9` (Stage 2A).

**Reason:** Solves maintainability and file length issues while strictly adhering to Vanilla JS requirements without adding framework dependencies.

**Consequence:** All 11 Manager HTML files load scripts in exact order: `manager-data.js` → `manager-core.js` → `manager-views.js` → `manager.js` → `dashboard.js`.

---

## 2026-10-10 — Manager Refactoring Scope Constraints & Workflow Rules

**Decision:**
1. Preserve existing Manager Dashboard design and CSS unchanged unless a specific defect requires an approved fix.
2. Do not create `manager-reports.js`; the remaining `manager.js` (514 lines) is sufficiently cohesive for search, filters, add forms, and report generator simulation.
3. Do not refactor CSS merely to reduce file size or improve code organization.
4. Build distinct Tourist, Tourism Stakeholder, and Administrator UI experiences where their workflows require them, reusing shared components and conventions where appropriate.
5. Keep exactly four roles: Destination Manager, Tourism Stakeholder, Tourist, and Administrator.
6. Continue following REUSE BEFORE CREATE and the approved Plan → Approve → Implement → Test → Report → Documentation → Git checkpoint workflow.

---

## 2026-10-10 — Destination Information Video Requirement

**Decision:** Include destination-information videos as a planned feature with strict scope, role permissions, and technical design rules.

**Key Rules:**
1. **Quantity & Duration:** Minimum 80 destination-information videos total across all 8 supported destinations (at least 10 videos per destination). Each video is approximately 30 seconds in duration.
2. **Role Permissions:** Destination Managers are the sole designated role with management permissions (add, edit, publish/unpublish, remove). Tourists can browse and watch published videos. Stakeholders and Administrators do not have video-management permissions.
3. **Platform Scope:** Preserve YatraSetu's identity as a Destination Management Platform, not a video-sharing social network.
4. **Technical Strategy:** Implement metadata entries with hosted video URLs rather than storing raw video binary files directly in PostgreSQL.

**Status:** Planned / Not Implemented. No database tables, APIs, frontend UI, or hosting integrations exist yet.

---

## 2026-10-12 — Stakeholder Business Registration Review & Approval Workflow (FR-08, FR-09, FR-02)

**Decision:** Destination Managers review and approve/reject stakeholder business registrations within their authorized destination/state jurisdiction.
1. **RBAC & Authorization Boundaries:** Destination Managers can only review registrations for destinations they are authorized to manage (enforced in UI and to be validated at the FastAPI boundary). Only Administrators have the authority to activate, deactivate, or delete stakeholder accounts (unauthorized `Delete` button removed from Manager workspace).
2. **Locked Destination Assignment:** Stakeholders cannot alter their approved destination assignment independently; the destination assignment is locked and audited.
3. **Review Actions & Transparency:** Managers can mark registrations as `Approved`, `Under Review`, or `Rejected` with an explicit decision note and timestamp.
4. **Data Synchronization & Persistence:** Changes are synchronized with `sessionStorage` and reflect across stakeholder listings (`window.YatraSetuStakeholderData.listings`), acknowledged as prototype/session storage until PostgreSQL + FastAPI persistence is implemented in Phase 11.

---

## 2026-10-12 — Stakeholder Messages in Manager Feedback Page & Stakeholder Sync (FR-08, FR-09)

**Decision:** Destination Managers coordinate with registered stakeholders via a dedicated Stakeholder Messages section on the existing Feedback page (`frontend/manager/feedback.html`), synchronizing with the Stakeholder Connections & Reviews page (`frontend/stakeholder/connections-reviews.html`).
1. **Single Page & Dual Horizontal Tab Navigation:** Removed side-by-side vertical split in favor of horizontal dual tabs (`💬 Tourist Feedback` and `👥 Stakeholder Suggestions`) matching the layout pattern of Stakeholder Connections & Reviews. The selected tab's content spans the full available page width.
2. **Access Control & Privacy:** Destination Managers can only review and reply to messages within their authorized destination/state territory (read-only outside scope). Tourism stakeholders can only view their own submitted messages and replies (`stakeholder_id === profile.id`), preserving business confidentiality.
3. **Review & Reply Workflow:** Managers can mark messages as `In Review` and send non-empty official responses. The response, responding Manager identity (`name` + role), and timestamp are recorded.
4. **Unified Logical Data Model:** Both manager and stakeholder workspaces interact with the same logical records via browser storage (`yatrasetu_stakeholder_messages`), structured cleanly for future FastAPI REST endpoints and PostgreSQL persistence in Phase 11.

---

## 2026-10-12 — FR-15: Destination Information Videos Implementation

**Decision:** Implement Destination Information Videos directly within the existing Destination Manager `destinations.html` page using horizontal tab navigation (`🏛️ Destination Profiles` and `🎬 Destination Videos`), without creating a new page or new sidebar navigation entry.

**Implementation Details:**
1. **Quantity & Coverage:** Exactly 80 authentic destination information videos seeded (10 entries per destination for all 8 supported destinations: Maharashtra, Kerala, Kashmir, Rajasthan, Goa, Tamil Nadu, Uttarakhand, and Assam). Each record adheres to the ~30-second duration standard.
2. **Prototype Transparency & Media Honesty:** Records are explicitly tagged with `is_verified_asset: false` and rendered with a `Prototype Metadata (~30s)` badge alongside a top disclaimer banner. Simulated streaming references (`https://assets.yatrasetu.org/media/videos/prototype/...`) are used without fabricated asset claims.
3. **Manager Role Authorization & Jurisdiction:** Destination Managers have exclusive management permissions (Browse, Add, Edit, Publish/Unpublish toggle, Delete with confirmation). Territorial jurisdiction is enforced: Maharashtra Destination Manager (`Rajesh Patil`) holds full management rights within Maharashtra; records outside jurisdiction are view-only.
4. **Video Preview Player:** A dedicated modal (`#videoPlayerModal`) provides a 16:9 simulated player canvas, metadata overview, and rapid edit actions for authorized managers.
5. **Form Validation:** The Add/Edit modal (`#videoModal`) validates title length (>= 3 chars), description length (>= 10 chars), and hosted URL format before allowing entries to be saved.
6. **Data Storage & Future Persistence:** All operations are managed by `YatraSetuManagerStore` and persisted to browser storage (`yatrasetu_destination_videos`), with data models cleanly prepared for future FastAPI REST endpoints and PostgreSQL database tables in Phase 11.

---

## 2026-10-12 — FR-15: Real Destination Video Sourcing, Verification & Player Integration

**Decision:** Replace simulated prototype URLs with genuine, verified destination videos sourced from official state tourism departments and Incredible India across all eight destinations, adhering strictly to verification honesty without fabricating links.

**Source Inventory & Verification Summary:**
1. **Verification Standard:** Every candidate video URL verified via live YouTube oEmbed API (`https://www.youtube.com/oembed?url=...&format=json`) confirming HTTP 200 OK, valid publisher/channel, accurate title, real thumbnail, and embeddability.
2. **Verified Count (38 Playable Videos):**
   - Maharashtra: 6 verified (Maharashtra Tourism, Incredible India)
   - Kerala: 6 verified (Kerala Tourism, Travel Blessings)
   - Rajasthan: 7 verified (Department of Tourism Rajasthan, Incredible India)
   - Kashmir: 3 verified (Incredible India, J&K Tourism)
   - Assam: 3 verified (Incredible India, Awesome Assam / ATDC)
   - Tamil Nadu: 5 verified (Tamil Nadu Tourism, Incredible India, TTDC partners)
   - Uttarakhand: 5 verified (Uttarakhand Tourism Board, UTDB partners)
   - Goa: 3 verified (Goa Tourism, GTDC partners)
3. **Prototype Transparency (42 Records):** The remaining 42 records remain honestly designated as prototype simulation records (`is_verified_asset: false`, `verification_status: 'Unverified Prototype Simulation'`) to preserve the 80-video catalogue without inventing false links.
4. **Playback & Permissions:** Genuine videos are rendered within `#videoPlayerModal` using privacy-enhanced YouTube embeds (`youtube-nocookie.com/embed/{id}?autoplay=1`). Unverified prototype records render an animated canvas with orientation guidelines. No third-party media is downloaded or re-hosted.
5. **Auditable Inventory:** The complete source inventory with destination, attraction, title, URL, publisher, actual duration, thumbnail, verification status, and embedding permissions is preserved in `window.YatraSetuManagerData.videoSourceInventory`.

## 2026-10-14 — Destination Video Catalog Correction and Publishing Integrity

**Context:** The initial inventory research pass introduced destination misassignments (e.g. Tadoba tiger videos mapped to Rajgad, Ajanta, or Ellora; Jaisalmer desert campaigns mapped to Amer; Rishikesh rafting mapped to Haridwar) and marked prototype metadata records as Published across the board. Furthermore, missing thumbnail paths caused browser fallbacks to Rajgad Fort across unrelated destinations.

**Key Decisions & Architectural Enforcements:**
1. **Catalog Mapping Integrity:** Videos are strictly mapped to the actual destination covered by their content (e.g. Tadoba videos are assigned to `tadoba`, Mumbai videos to `mumbai`, state-level overviews to `maharashtra-state`, and Raigad videos to `raigad-fort`). No video is assigned to Rajgad, Ajanta, or Ellora merely because that slot existed.
2. **Three-Tier Verification Data Model:**
   - `official_source`: Verified external video accessible from an official government tourism authority (e.g. Maharashtra Tourism, Incredible India, Kerala Tourism, UTDB, ATDC).
   - `verified_media`: Confirmed accessible video from an identified independent guide or creator channel (e.g. Traveller Rishabh, Harsh kharole, Travel Blessings).
   - `prototype_metadata`: Illustrative record without confirmed playable media, strictly maintained as `Draft`.
3. **Strict Publication Integrity:**
   - Prototype records cannot be published for tourists. Both direct UI publish toggles and Add/Edit video form submissions validate and block publishing prototype metadata without a confirmed playable media URL.
   - All 42 prototype records default to `status: "Draft"` in both base data and smart storage synchronization.
4. **Thumbnail Neutrality:**
   - Eliminated `thumb-rajgad.jpg` as the fallback placeholder for unrelated destinations. Introduced an inline neutral SVG draft placeholder (`🎬 Pending Verified Asset`) that renders offline without broken image loops or network requests. Local image assets (`thumb-ajanta.jpg`, `thumb-lonavala.jpg`) are used where valid.

---

## 2026-10-14 — Administrator Workspace, Stakeholder Registration Integrity & RBAC Permissions

**Context:** Implementing Administrator workspace functionality prioritizing business registration integrity, stakeholder account permissions, and controlled destination reassignment with audit logging.

**Key Decisions & Architectural Enforcements:**
1. **Administrator Workspace Architecture (`frontend/admin/dashboard.html` & `frontend/js/admin.js`):**
   - Reused the existing Administrator dashboard shell and styling without creating redundant pages or breaking frozen UI.
   - Integrated 5 tabbed sections: Overview (live dynamic counters & recent activity stream), Users & Stakeholders (searchable, filterable accounts table with controlled action buttons), Destinations Coverage, Roles & RBAC Matrix, and Immutable System Audit Trail.
2. **Exclusive Account Permissions (Rule 5):**
   - Only the Platform Administrator holds the authority to activate, deactivate, or delete user and stakeholder accounts. Destination Managers cannot activate, deactivate, or delete accounts (prohibited in both UI and application store layers).
3. **Controlled Destination Reassignment & Audit Trail (Rule 3 & 4):**
   - Once a stakeholder's business registration is approved, the operating destination is locked against ordinary editing in `profile.html`.
   - Destination reassignment can only be performed through a controlled administrative action (in Admin or authorized Manager review modal) requiring an official justification (min 6 chars).
   - Every reassignment, account activation, deactivation, and deletion creates an immutable audit trail entry (`yatrasetu_audit_trail`) with timestamp, target ID, actor name, actor role, previous value, new value, and rationale.
4. **Role Boundary Enforcement (Rule 6):**
   - Exactly four platform roles exist: `admin`, `manager`, `stakeholder`, and `tourist`.
   - "State Manager" is an access level within `manager` (`scope: 'STATE'`), not a separate fifth role entity.
5. **Application Layer Enforcement (Rule 7):**
   - Authorization checks in `AdminStore` validate actor roles (`admin` or authorized `manager`) before permitting state mutations, preparing clean contracts for Phase 11 FastAPI REST endpoints.

## 2026-10-14 — Cross-Workspace Governance Verification & Data Store Harmonization

**Context:** Comprehensive end-to-end audit and implementation of stakeholder registration approval, destination locking, admin-exclusive account controls, controlled destination reassignment with audit logging, and data consistency across Manager, Stakeholder, and Administrator stores.

**Key Findings & Enforced Solutions:**
1. **Pending Registration Lifecycle (Rule 1 & 2):**
   - When a stakeholder registers on `register.html` (`auth.js`), an account is created with `account_status: 'Active'` and `registration_status: 'Pending Approval'`, accompanied by an audit record (`USER_ACCOUNT_REGISTERED`).
   - The business registration remains in `Pending Approval` until reviewed and approved by the authorized Destination Manager in `manager/stakeholders.html`.
   - In `profile.html`, pending stakeholders see an informative banner (`#sh-dest-pending-notice`) and can choose their destination during initial profile setup.
   - Once approved, the destination dropdown is strictly locked (`selectDest.disabled = true`), displaying an amber warning notice (`#sh-dest-lock-notice`). Any ordinary editing attempt to change the destination is blocked by both UI and save validation.
2. **Cross-Store Consistency (Rule 5):**
   - Eliminated ID collision for `sh-105` by harmonizing `DEFAULT_ADMIN_USERS` in `admin.js` with `manager-data.js` across all 4 states (`sh-101` through `sh-107`, `sh-201`, `sh-301`, `sh-401`).
   - Synchronized default profile identity in `stakeholder-data.js` to `sh-101` (Suresh Deshmukh).
   - Implemented bidirectional store updates in `stakeholder.js`: saving profile updates both `YatraSetuManagerData.stakeholders` (via `ManagerStore.saveStakeholders`) and `yatrasetu_admin_users` (via `AdminStore`), and logs `BUSINESS_REGISTRATION_SUBMITTED` when applicable.
3. **Administrator Account Deactivation Enforcement (Rule 3):**
   - Only Platform Administrators can deactivate or delete accounts.
   - When deactivated, `auth.js` blocks login with an explicit suspension alert.
   - In the Stakeholder workspace (`stakeholder.js`), a deactivated account displays a prominent suspension alert banner (`#sh-deactivated-banner`) and locks profile inputs and save controls.
4. **Controlled Destination Reassignment (Rule 4):**
   - Reassignment requires official justification (minimum 6 characters) and is restricted to administrators or authorized managers within their jurisdiction.
   - Reassignment automatically logs an immutable audit trail entry (`yatrasetu_audit_trail`) with actor identity, previous destination, new destination, and rationale.
5. **Architectural Boundary Transparency (Rule 6):**
   - All current enforcement operates at the **frontend / client-side application layer**. True server-side security, cryptographic validation, and persistent ACID constraints will be enforced by Phase 10 (PostgreSQL Schema) and Phase 11 (FastAPI Backend).

---

## 2026-10-14 — Administrator Workspace Completion & Manager Authority Subsystem

**Context:** Completing and verifying the canonical 7-tab Administrator Workspace and implementing the dedicated **Manager Authority & Jurisdictions** section.

**Key Decisions & Architectural Enforcements:**
1. **Canonical 7-Tab Navigation (`frontend/admin/dashboard.html`):**
   - Sidebar strictly standardizes on 7 functional tabs: `overview` (Dashboard Overview), `users` (Stakeholder Accounts), `registrations` (Business Registrations), `destinations` (Destinations Catalog & Jurisdictions), `roles` (Roles & Permissions), `managers` (Manager Authority & Jurisdictions), and `audit` (System Audit Trail).
2. **Manager Authority & Regional Oversight:**
   - Explicitly clarified and enforced the architectural boundaries between State Managers (`scope: 'STATE'`) and Destination Managers (`scope: 'DESTINATION'`).
   - State Managers hold state-wide review and visibility across all destinations within their assigned state territory, but hold zero cross-state authority and zero account activation/deactivation/deletion privileges.
   - Destination Managers remain strictly confined to their single assigned destination jurisdiction.
   - Only Platform Administrators can alter manager territory, promote/demote access levels, or activate/deactivate/delete user accounts.
3. **Controlled Jurisdiction Reassignment Flow:**
   - Dedicated reassignment modal workflow with real-time destination filtering based on selected state territory.
   - Reassignment requires a mandatory administrative rationale (minimum 6 characters).
   - Any reassignment immediately updates the manager's live authority record and persists an administrative audit log entry (`MANAGER_AUTHORITY_REASSIGNED`) visible in both the Manager Authority Audit History and the global System Audit Trail.
4. **Client-Side Prototype Transparency:**
   - Clear disclaimers communicate to evaluators and reviewers that current enforcement operates via client-side state models (`localStorage`, `sessionStorage`, in-memory stores), with server-enforced JWT and database constraints slated for Phase 10 & 11.

---

## 2026-10-19 — Manager Authority & Administrator Governance Cross-Workspace Integration

**Context:** Complete Manager Authority and Platform Administrator governance integration across workspaces, ensuring manager access level, assigned state, assigned destination, and authorized scope are consistently represented and dynamically synchronized across the Manager workspace and Admin directory.

**Key Decisions & Architectural Enforcements:**
1. **Canonical Manager Seed & Storage Harmonization:**
   - Unified default seed profile across `manager-data.js`, `admin.js`, and `auth.js` to `usr-mgr-01` (Rajesh Patil, `manager.maharashtra@yatrasetu.in`, `State Manager`, `Maharashtra (All Destinations)`).
   - In `AdminStore.syncWithManagerData` and `AdminStore.reassignManagerAuthority`, any manager jurisdiction reassignment dynamically synchronizes `yatrasetu_manager_profile` (in both `localStorage` and `sessionStorage`) as well as the active session keys (`yatrasetu_active_state_id`, `yatrasetu_state_theme`, `yatrasetu_active_dest_id`, `yatrasetu_manager_scope`, `yatrasetu_manager_access_level`).
2. **Manager Workspace Context Integration (`manager-core.js` & `manager-views.js`):**
   - Implemented `syncActiveManagerProfile()` to retrieve the live manager identity from storage and synchronize `YatraSetuManagerContext` without requiring manual logout/login.
   - Dynamic topbar badge displays the manager's live access level and assigned territory (e.g., `State Manager • Maharashtra (All Destinations)` or `Destination Manager • Rajgad Fort`).
   - Profile card (`profile.html`) and scope indicator dynamically reflect the current assigned jurisdiction.
   - Account suspension banner (`#mgr-account-deactivated-banner`) automatically appears if an Administrator deactivates the manager account.
3. **Strict Territorial Jurisdiction Enforcement (Rule 3 & 4):**
   - State Managers (`scope: 'STATE'`): Authorized to review businesses across destinations within their assigned state territory (`Maharashtra`), but strictly prohibited from reviewing businesses in other states (e.g. Kerala). Out-of-state modals display `⚠️ Restricted Management Scope (Registered in KERALA)` and lock decision controls.
   - Destination Managers (`scope: 'DESTINATION'`): Demoting or reassigning a manager to destination scope strictly collapses review authority to that single destination. Reviewing businesses in other destinations (even within the same state, such as Lonavala for a Rajgad Fort manager) displays `⚠️ Restricted Management Scope` and disables decision notes and action buttons.
   - Destination Reassignment Constraints: Local Destination Managers are prohibited from reassigning businesses outside their assigned destination. State Managers can reassign within state boundaries with mandatory justification (minimum 6 characters) and immutable audit logging (`CONTROLLED_DESTINATION_REASSIGNMENT`).
4. **Separation of Governance Responsibilities:**
   - Account activation, deactivation, and deletion controls remain exclusive to Platform Administrators. Destination Managers only manage destination content and review stakeholder business registrations within their authorized territory.
5. **Technical Boundary Transparency:**
   - Current cross-workspace synchronization operates at the client application layer (`localStorage`, `sessionStorage`, in-memory stores). Real server-side enforcement, signed JWT claims, and database transaction consistency will be enforced in Phase 10 (PostgreSQL) and Phase 11 (FastAPI).

---

## 2026-11-04 — Tourist Workspace Phase 1 Foundation & Explore Destinations Implementation

**Context:** Implementation of the Tourist workspace foundation and Explore Destinations directory using the approved Tourist UI mockups as visual reference.

**Key Decisions & Architectural Enforcements:**
1. **Consumer-Focused Travel Companion Design System (`frontend/css/tourist.css`):**
   - Replaced the administrative sidebar with a clean, responsive tourist topbar navigation (`.tourist-header`) featuring brand identity (`Explore • Experience • Preserve`), center navigation links (Discover, Destinations, Experiences, Plan Your Trip, Stories, Travel Guidance), quick search trigger, persistent wishlist heart counter (`.tourist-fav-badge`), and user profile badge/dropdown.
   - Implemented warm off-white backgrounds (`#FAF8F5`, `#FCFBF9`), deep forest green (`#1A3D32`), restrained saffron accents (`#E07A22`), editorial typography (`Playfair Display` serif headers + `Plus Jakarta Sans` sans-serif body), generous spacing, and rounded surface cards.
2. **Single Source of Truth Reuse (`window.YatraSetuManagerData`):**
   - Reused existing 40 destination records across all 8 states (`Maharashtra`, `Kerala`, `Kashmir`, `Rajasthan`, `Goa`, `Tamil Nadu`, `Uttarakhand`, `Assam`), 10 verified attractions, and state configurations without inventing fake backend endpoints or duplicating data stores.
   - Enriched destinations dynamically in `tourist.js` with category mapping, tags, suitability (`Family`, `Solo Travel`, `Group Travel`, `Adventure Seekers`), seasons (`Winter`, `Summer`, `Monsoon`), and editorial highlights while maintaining prototype transparency disclaimers.
3. **Explore Destinations Multi-Dimensional Filter Engine (`frontend/tourist/destinations.html`):**
   - Implemented real-time client-side search combined with horizontal state filter pills (`All States` + 8 state pills), category checkboxes (`Forts & Heritage`, `Beaches & Islands`, `Nature & Wildlife`, `Spiritual & Pilgrimage`, `Cultural & Historical`, `Adventure & Outdoor`), suitability checkboxes, and seasonal checkboxes.
   - Added sorting options (`Popularity`, `Rating Highest`, `Name A-Z`, `Name Z-A`), dynamic results counter, active filter badges with individual removal, loading state, error state, and empty state with "Reset All Filters" recovery.
4. **Destination Detail Route (`frontend/tourist/destination-detail.html`):**
   - Created dedicated destination profile page supporting deep-linking (`?id=${dest.id}`) with grand hero banner, category tags, highlights, about section, verified manager-published attractions from `window.YatraSetuManagerData.attractions`, location card, and tabbed panes (`Overview`, `Attractions`, `Visitor Info`, `Best Time`, `Nearby Places`, `Reviews`).
5. **Wishlist & Session Integration:**
   - Enabled favoriting/wishlisting destinations persisted to `localStorage` (`yatrasetu_tourist_favorites`), dynamically updating the topbar counter and providing a slide-over Wishlist drawer with direct navigation and removal controls.
   - Integrated session identity from `auth.js` (`sessionStorage.getItem('yatrasetu_role')`): tourists see "Hi, Ananya", guest visitors see "Hi, Guest • Plan My Journey" with clean login prompts, and managers/stakeholders/admins visiting tourist routes see their role badge and quick return links.
6. **Scope Protection & Architectural Boundaries:**
   - Preserved existing 4 platform roles (Tourist, Destination Manager, Tourism Stakeholder, Platform Administrator) without introducing extra roles.
   - Maintained strict scope protection: commercial hotel/flight booking, payment gateways, OTA marketplaces, and artificial AI recommendations remain excluded. All internal manager notes, draft prototype media, and administrator audit trails remain hidden from tourists.
   - Transparent disclaimer alerts clarify that current persistence is client-side prototype storage, with PostgreSQL persistence slated for Phase 10.

---

## 2026-11-05 — Tourist Workspace Destination Data Integration & Location Integrity

**Context:** Full relational data integration and location integrity implementation across the Tourist Workspace (`destination-detail.html`, `tourist.js`, `tourist.css`).

**Key Decisions & Architectural Enforcements:**
1. **Location & Geographic Integrity (India Bounding Box Enforced):**
   - All 40 destinations across 8 states now have verified geographic coordinates mapping to authoritative Indian coordinates (Lat: `6.0° N to 38.0° N`, Lng: `68.0° E to 98.0° E`).
   - Added `validateCoordinates()` logic in `tourist.js` that checks type, detects and fixes transposed lat/lng, validates the national bounding box, embeds interactive OpenStreetMap bounded view (`bbox`), and provides OpenStreetMap turn-by-turn routing links without fabricating distances. Destinations without verified coordinates gracefully display an official survey notice.
2. **Strict Destination-to-Attraction Relational Boundary:**
   - Replaced earlier relaxed fallback `a.destination_id === dest.id || a.state_id === dest.state_id` with strict `a.destination_id === dest.id`. Leaking attractions across different destinations within the same state is prohibited.
3. **FR-15 Destination Video Catalog Integration:**
   - Filtered `window.YatraSetuManagerData.destinationVideos` strictly by `destination_id` and `status === 'Published'` (excluding prototype drafts).
   - Added interactive video playback modal (`#touristVideoModal`) embedding privacy-enhanced `youtube-nocookie.com` players with full audio and video teardown on modal dismiss.
4. **Stakeholder Privacy & Publication Boundary:**
   - Only active, approved tourism stakeholders (`status === 'Approved'` and `account_status !== 'Deactivated'`) for the specific destination are displayed.
   - Internal `manager_note` fields and administrative audit trails are strictly stripped from tourist modals (`#touristStakeholderModal`) to protect partner confidentiality.
5. **Official Advisories & Scheduled Events:**
   - Integrated destination-specific advisories from `window.YatraSetuStakeholderData.announcements` (`anc-1`, `anc-2`, etc.) and scheduled events from `window.YatraSetuManagerData.events`.
6. **Feedback Loop & Session Persistence:**
   - Displayed authentic manager-reviewed feedback from `window.YatraSetuManagerData.feedback` and provided an interactive modal (`#touristFeedbackModal`) allowing travelers to submit reviews with ratings and categories, persisted via `sessionStorage` (`yatrasetu_tourist_feedback`).

---

## 2026-11-17 — Stabilization Stage B: Batch 2 Implementation (BUG-05, BUG-06, BUG-07)

**Context:** Bug fixes and stabilization for Stakeholder persistence, script dependencies, and workspace frontend route guards.

**Key Decisions & Architectural Enforcements:**
1. **Stakeholder Listings, Media, and Posts Persistence (BUG-05):**
   - Reused existing storage conventions in `frontend/js/stakeholder.js`: restored stored listings (`yatrasetu_stakeholder_listings`), media (`yatrasetu_stakeholder_media`), and posts (`yatrasetu_stakeholder_posts`) upon `initStakeholderContext()` with `Map` deduplication by `id`.
   - Implemented persistence helpers (`saveStakeholderListings`, `saveStakeholderMedia`, `saveStakeholderPosts`) and wired them into listing creation/edit/deletion, media upload/deletion, and post creation/deletion so data survives browser refresh and cross-page navigation.
   - Media previews with ephemeral blob URLs fallback to persistent sample image assets upon upload so image thumbnails survive page reload.
2. **Script Dependency Alignment (BUG-06):**
   - Preserved existing clean script dependency chain (`manager-data.js` -> `stakeholder-data.js` -> `stakeholder.js` -> `dashboard.js`) in `stakeholder/*.html`.
   - Avoided loading `manager-core.js` into unrelated stakeholder pages; instead implemented direct local storage synchronization fallback in `stakeholder.js` to eliminate manager DOM side-effects.
3. **Manager & Stakeholder Frontend Route Guards (BUG-07):**
   - Implemented `checkManagerAuth()` in `manager-core.js` and `checkStakeholderAuth()` in `stakeholder.js`.
   - Guards inspect `sessionStorage.getItem('yatrasetu_role')`. Users attempting to access `/manager/` without `manager` or `admin` role, or `/stakeholder/` without `stakeholder` or `admin` role, are safely redirected to `../login.html` via `window.location.replace()`.
   - Guards run exclusively on their respective workspace paths, completely avoiding public landing, login, and registration pages to prevent redirect loops.
   - Explicitly documented that frontend route guards protect user navigation flow only, with true authorization enforced at API/JWT boundaries in Phase 11.

---

## 2026-11-17 — Stabilization Stage B: Batch 3 Implementation (BUG-08, BUG-09, SUSP-01, SUSP-02)

**Context:** Bug fixes and stabilization for topbar null-safety, video player namespace resolution, demo credential harmonization, and performance deferral.

**Key Decisions & Architectural Enforcements:**
1. **Dashboard Topbar Null-Safety (BUG-08):**
   - In `frontend/js/dashboard.js`, added null checks before inspecting `.classList` on `userBadge.parentElement` and `notifBtn.parentElement`.
   - Added fallback DOM appending (`if (badgeWrapper) badgeWrapper.appendChild(...) else if (rightArea) rightArea.appendChild(...)`) ensuring topbar initialization never throws when badges or notifications are detached or initialized off-DOM.
2. **Manager Video Preview Namespace Alignment (BUG-09):**
   - In `frontend/js/manager-views.js` (`openVideoPlayerModal`), replaced non-existent `window.YatraSetuManagerCore.syncActiveManagerProfile` with standard global `syncActiveManagerProfile()` and store fallback `window.YatraSetuManagerStore.syncActiveManagerProfile`.
   - Ensures video player modals correctly evaluate real-time authority scope across reassigned or state-level managers without relying on stale static fallback seeds.
3. **Demo Credentials Alignment (SUSP-01):**
   - Confirmed genuine mismatch: `auth.js` demo helper filled `stakeholder.local@yatrasetu.in`, whereas `admin.js`, `manager-data.js`, and `stakeholder-data.js` seed Suresh Deshmukh (`sh-101`) with `sahyadri.guides@gmail.com`.
   - Aligned `demoAccounts.stakeholder.email` to `sahyadri.guides@gmail.com` in `auth.js`.
   - Preserved backward-compatible alias in `initLoginForm` so `stakeholder.local@yatrasetu.in` maps to `sh-101`.
   - Verified that clicking "⚡ Fill Demo Credentials" on `login.html` logs in as Suresh Deshmukh (`sh-101`), properly synchronizing name, user ID, and destination context.
4. **Tourist Filter Concurrency Debouncing Deferral (SUSP-02):**
   - Deferred per explicit instruction: 40 static destination cards filter synchronously in <4ms without measurable UI frame drops.

---

## 2026-11-17 — Tourist Workspace Functional Repair, Destination Details & UI Improvement

**Context:** Complete functional repair and polish of the Tourist Workspace (`frontend/tourist/`), restoring interactive destination details, photo galleries, verified attractions modal, video player visibility, local services integration, curated multi-day trip itineraries, authentic travel chronicles with a modal reader, and dedicated travel guidance pillars.

**Key Decisions & Architectural Enforcements:**
1. **Modal Visibility Mismatch Resolution (Video Playback & Stakeholder Modal Fix):**
   - Root cause identified: `frontend/css/tourist.css` strictly defined `.tourist-modal-overlay.show { display: flex; }`, while `frontend/js/tourist.js` toggled `modal.classList.add('active')`. This kept `.tourist-modal-overlay` hidden (`display: none`), causing video audio to play from the embedded iframe while visual picture remained completely invisible, and causing stakeholder buttons to appear non-responsive.
   - Updated `tourist.css` to `.tourist-modal-overlay.show, .tourist-modal-overlay.active { display: flex; z-index: 2000; }`.
   - Updated modal openers and closers in `tourist.js` to toggle both `.active` and `.show`.
   - On video modal close, the iframe is immediately cleared (`frameContainer.innerHTML = ''`), guaranteeing instant audio and video teardown.
2. **Multi-Image Destination Gallery & Fullscreen Lightbox:**
   - Implemented `DESTINATION_GALLERIES` mapping destination IDs to 5–8 high-resolution authentic photographs with titles, perspectives, and descriptive captions. Added dynamic fallback generator ensuring all 40 destinations have visual galleries.
   - Added `[📷 View Photos]` button pill in the hero banner and a dedicated "Visual Gallery & Scenic Perspectives" section in the Overview tab of `destination-detail.html`.
   - Implemented `#touristLightboxModal` with fullscreen dark backdrop, main image, caption bar, image counter (`Photo X of Y`), direct jump thumbnail strip, and bidirectional keyboard navigation (`ArrowLeft`, `ArrowRight`, `Escape`).
3. **Interactive Attraction Detail Modal & Clickable Attraction Cards:**
   - Enriched attraction records via `ATTRACTION_EDITORIAL` with operational hours/timings, recommended visiting duration, best time/photography guidelines, and visitor safety instructions.
   - Added `#touristAttractionModal` in `destination-detail.html`.
   - Made both Overview preview attraction cards (`.detail-attr-item`) and Tab 2 full attraction cards (`.tourist-attraction-card`) interactive, opening `#touristAttractionModal` with detailed context when clicked.
4. **Interactive Itinerary Planner on Dashboard (`#plan-trip`):**
   - Replaced static promo placeholder on `dashboard.html` with an interactive multi-day planner featuring two modes:
     - **Curated Circuits:** 3 verified multi-day routes (Maharashtra Fort Trail 3-Day, Kerala Backwaters Circuit 4-Day, Rajasthan Royal Fortresses 5-Day) with day-by-day stops, timing, highlights, and direct links to destination detail pages.
     - **Custom Trip Builder:** Interactive generator allowing tourists to select state, duration (2–5 days), and theme (Heritage, Nature, Culture) to synthesize custom itineraries from verified destination records.
5. **Travel Stories & Interactive Story Reader Modal (`#curated-section`):**
   - Populated `#curated-section` with 4 authentic chronicles (Rajgad Fort sunrise climb, Munnar cloud trails, Jaisalmer living fort, and Rishikesh Ganga Aarti) complete with author credits, reading times, and excerpts.
   - Added `#touristStoryModal` and wired "Read Story →" buttons to open a modal chronicle with full narrative and direct link to the related destination guide.
6. **Dedicated Travel Guidance & Visitor Directory (`#travel-guide`):**
   - Created a comprehensive 6-pillar travel guidance directory covering Best Time & Climate Patterns, Transit & How to Reach, Heritage Etiquette & Respect, Trekking Safety & Guides, Sustainable & Responsible Travel, and Packing Essentials.
7. **Experiences Navigation & Filter Continuity (`destinations.html`):**
   - Handled `category=adventure-outdoor` query parameters, ensuring category checkboxes, active filter tags, and filtered destination cards update seamlessly.
   - Added intra-page category navigation interceptors for smooth filtering without unwanted page refreshes.

---

## 2026-11-17 — Tourist Workspace: Dedicated Independent Pages & Navigation Architecture

**Context:** Restructuring the Tourist Workspace from an embedded multi-section dashboard into modular, dedicated independent pages with standardized 6-link navigation and enriched destination information architecture.

**Key Decisions & Architectural Enforcements:**
1. **Modular Page Architecture:**
   - Separated embedded sub-features out of `dashboard.html` into independent pages:
     - `dashboard.html` (Discover): Retains top destination highlights, state exploration, curated spotlights, and recent stories teasers.
     - `destinations.html` (Destinations): Complete destination catalog with state filters and search.
     - `experiences.html` (Experiences): 18 outdoor and cultural experiences across 6 categories (Trekking & Hiking, Water & Coastal, Heritage & Architecture, Wildlife & Nature, Cultural & Spiritual, Culinary & Local Traditions) with interactive `#touristExperienceModal`.
     - `plan-trip.html` (Plan Your Trip): Curated multi-day circuits across 5 states, dynamic custom builder, and personal wishlist planner.
     - `stories.html` (Stories): Dedicated travel chronicles with category filtering and `#touristStoryModal`.
     - `travel-guidance.html` (Travel Guidance): 6 guidance pillars, regional transit directory, high-altitude trekking safety checklist, and emergency directory.
     - `destination-advisories.html?id=...` (Destination Advisories): Dedicated official bulletin and guideline viewer linked directly from destination detail pages.
2. **Navigation Standardisation:**
   - Unified desktop navigation bar and mobile drawer with exact 6 links (`Discover`, `Destinations`, `Experiences`, `Plan Your Trip`, `Stories`, `Travel Guidance`).
   - Dynamic `active` state tracking based on current URL path.
   - Preserved browser history navigation (back/forward) and direct URL bookmarking.
3. **Destination Information Architecture & Official Advisories Separation:**
   - Enriched destination overviews with deep historical background, heritage architecture, cultural significance, geography, and notable landmarks.
   - Standardized 8 tabs on `destination-detail.html`: Overview, Attractions, Videos, Experiences, Events, Authorized Local Services & Guides, Regional Circuit, Reviews & Feedback.
   - In the Overview tab, replaced repetitive full advisory text with an official preview banner containing a direct link to `destination-advisories.html?id=${dest.id}`.
4. **Events and Experiences Interactivity:**
   - Wired destination-specific experiences in Tab 4 to open `#touristExperienceModal`.
   - Wired destination event cards in Tab 5 to `#touristEventModal` displaying dates, locations, schedules, entry fees, and organizer contacts.

---

## 2026-11-17 — Tourist Workspace: UI Stabilization, CSS Consolidation & Section Redesign

**Context:** Full visual and architectural stabilization of the Tourist Workspace, resolving layout anomalies, eliminated redundant CSS rules, and redesigning Destination Detail sections into a cohesive travel editorial design system.

**Key Decisions & Architectural Enforcements:**
1. **Consolidated Design System & Dead Code Removal:**
   - Audited `frontend/css/tourist.css` and purged over 50 dead/unreferenced class selectors (e.g. obsolete promo cards, old guide pills, duplicate experience rules, unreferenced history box selectors).
   - Unified conflicting experience card classes into standard `.experiences-full-grid` and `.experience-full-card`.
   - Enforced consistent typography (`Playfair Display` serif for titles, `Plus Jakarta Sans` for body text), warm `#FAF8F5` surface background, `#1A3D32` primary forest green, and restrained saffron accents.
2. **Mobile Viewport (390px) Overflow Fix:**
   - Root cause identified: Inactive off-screen drawers (Wishlist and Mobile Nav) had positive translateX transforms and off-screen positions without `display: none`, causing modern WebKit/Blink layout viewports to expand to 465px.
   - Fixed by toggling `display: none;` on `.tourist-drawer` when inactive and `display: flex;` when active, clamping document `scrollWidth` strictly to `390px` with 0px horizontal overflow across all 8 tourist pages.
   - Added compact mobile header rules (hiding user name/role text, keeping avatar circle) and smooth horizontal swipe on the 8 destination detail tabs (`scrollbar-width: none`).
3. **Destination Detail Section Redesign:**
   - *Overview*: Replaced 5 repetitive, detached text cards with a high-level 6-point Key Facts Grid (Classification, District, Elevation, Season, Duration, Trail Grade) and an integrated Comprehensive Editorial Narrative Card with clear chapter headings and typography.
   - *Attractions*: Replaced mismatched video grid classes with dedicated `.tourist-attractions-grid` and `.tourist-attraction-card` (180px uniform media, category tags, rating pills, operating hours, and detail modal).
   - *Videos*: Standardized 16:9 thumbnail ratio, duration badges, and play button overlay.
   - *Experiences*: Enforced uniform card dimensions, 2x2 meta grid, and `#touristExperienceModal`.
   - *Events*: Replaced inline styled elements with a modern `.tourist-event-card` with saffron date badge (day number + month), location, timings, and `#touristEventModal`.
   - *Authorized Local Services & Guides*: Enhanced cards with verified partner badge, category tag, base hub, hours, guide rate, and dual actions (direct `tel:` link + "View Details & Enquire").
   - *Regional Circuit*: Replaced generic state cards with dedicated `.circuit-dest-card` grid displaying state rank badge, category, thumbnail, and direct destination link.
   - *Reviews & Feedback*: Cleaned up review presentation with author initials avatar, star rating, verified submission pill, and feedback form modal.
4. **Multi-Device Responsive Verification:**
   - Automated CDP measurements across Desktop (1440px), Laptop (1366px), Tablet (768px), and Mobile (390px) confirmed `noHorizontalOverflow: true` (0 horizontal scroll) on all 8 pages.
   - Automated CDP navigation and interaction test suite passed 100% with zero console errors.

---

## 2026-11-17 — Tourist Workspace: Controlled Repair & Visual Stabilization (Stage 1)

**Decision:** Perform a strictly scoped repair limited to `tourist.css`, `destination-detail.html`, and `tourist.js` without modifying any other workspaces, without global framework/CSS redesign, and without Git rollbacks.

**Resolved Issues & Concrete Fixes:**
1. **Header Responsive Alignment (1180px–1080px):**
   - Added `@media (max-width: 1180px)` rules in `tourist.css` compacting link gaps to `1.15rem`, font-size to `0.88rem`, and hiding `.tourist-brand-tagline` and `.tourist-user-role` to prevent menu collisions. Mobile drawer breakpoint adjusted to 1080px. Zero horizontal overflow verified across 1440px, 1180px, 1024px, 768px, and 390px.
2. **Destination Detail Card Grids Standardization:**
   - Standardized all 8 tab card grids (`.tourist-attractions-grid`, `.tourist-video-grid`, `.experiences-full-grid`, `.tourist-stakeholders-grid`, `.regional-circuit-grid`) to uniform `repeat(auto-fill, minmax(280px, 1fr))` with `1.5rem` gaps.
3. **Purged Malformed HTML & Safe Inline Style Replacement:**
   - Removed unclosed duplicate block of Destination Advisories at lines 292-306 in `destination-detail.html` that caused grid deformation.
   - Created reusable semantic classes in `tourist.css` (`.detail-tab-header`, `.modal-card-lg`, `.detail-pill-forest`, etc.) and safely replaced inline styles from 110 down to 44. Preserved all 31 duplicate responsive selector groups inside media queries.
4. **Resilient Local Destination Images:**
   - Implemented `resolveDestinationImage` and `resolveAttractionImage` routing destinations to authentic local images in `../assets/images/`, with fallbacks and CSS min-height to prevent card collapse; zero broken external URLs remain.
5. **Browser Verification:**
   - All 8 tabs, video player modal, and feedback submission modal confirmed working in visible Chrome with zero console errors.

---

## 2026-11-17 — Tourist CSS Architecture: Three-Tier Stylesheet Split (`tourist-pages.css`)

**Decision:** Separate page-specific Tourist component styles into a dedicated stylesheet `frontend/css/tourist-pages.css`, establishing a clear three-tier CSS architecture:
1. `style.css`: Shared application foundation and dynamic state-theme engine.
2. `tourist.css`: Shared Tourist workspace shell (tokens, header, nav drawer, common modals, footer).
3. `tourist-pages.css`: Dedicated page-level component styling (Discover 8-states grid, Destinations filter sidebar and card tags, Plan Trip circuit timeline, Stories cards, Travel Guidance pillars, and Advisories bulletins).

**Reason:** Prevents cascading regressions where automated cleanups on one page delete selectors required by other pages, protects the shared header/navigation, and eliminates unstyled browser-default controls.

**Consequence:** All eight Tourist HTML pages load `style.css` -> `tourist.css` -> `tourist-pages.css`. Off-canvas mobile navigation standardized cleanly across all pages.

---

## 2026-11-17 — Tourist Workspace: Favorites & Wishlist Drawer System Repair

**Decision:**
1. Fix Wishlist Drawer opening: Added `.show` selector to `.tourist-drawer` and `.tourist-drawer-backdrop` in `tourist.css` so `openWishlistDrawer()` (which adds `.show`) renders the drawer with `display: flex;`.
2. Created and wired dimming backdrop overlay (`#tourist-drawer-backdrop`) so clicking outside the drawer smoothly dismisses it; wired Escape key to dismiss drawer.
3. Synchronized SVG heart fills (`fill="#EF4444"` vs `fill="none"`) on card buttons (`.dest-card-fav-btn`) and detail buttons (`.detail-fav-btn`) upon toggling favorites, added instant topbar badge updating (`.tourist-fav-badge`), and added toast confirmation notifications.
4. Set `data-dest-id` dynamically on `detail-fav-btn` on `destination-detail.html` to keep hero heart in sync when toggled from drawer or page.

**Verification:**
- Verified in Chrome via automated CDP tests: Header heart icon opens Wishlist drawer showing saved cards and items; clicking heart on destination cards immediately fills red, increments topbar badge, and displays toast; clicking "Remove" in drawer removes the item and updates the card heart in real time; closing via `×`, backdrop click, and Escape key verified.


**Decision:**
1. Connect "View Experience Details" button on `destination-detail.html` (under Experiences tab) to `#touristExperienceModal` by adding the modal markup to `destination-detail.html` and binding modal closers in `initModals()`.
2. Add graceful fallbacks in `openExperienceModal()` for missing experience metadata (duration, difficulty, season, guide, gear) and handle destination link navigation intelligently.
3. Remove the two prototype disclaimer banners from `destinations.html` and `dashboard.html`.

**Reason:**
- Root Cause: `#touristExperienceModal` existed only in `experiences.html`. When clicked on `destination-detail.html`, `document.getElementById('touristExperienceModal')` returned null, silently aborting modal opening.
- Prototype notices are no longer needed and their removal restores clean header alignment without awkward spacing.

**Verification:**
- Verified in Chrome via automated CDP tests: Modal opens with specific experience details for "Monsoon Rajgad Fort Citadel Trek" and "Padmavati Machi Heritage Bastion Exploration", closes on X, footer button, and Escape key, and functions on `experiences.html`. Both notice banners confirmed absent from DOM and screenshots.




---

## 2026-11-18 — Backend Foundation: FastAPI, SQLAlchemy 2.0 & PostgreSQL Schema (Phase 1)

**Context:** Implementation of the initial backend foundation and PostgreSQL database architecture for YatraSetu, preserving frozen frontend interfaces, verified schemas, and security specifications.

**Key Decisions & Architectural Enforcements:**
1. **Technology Stack Alignment:**
   - Framework: FastAPI with REST APIs and CORS support.
   - ORM: SQLAlchemy 2.0 with type-safe `Uuid(as_uuid=True)` and cross-dialect `JSON().with_variant(JSONB, 'postgresql')`.
   - Database: PostgreSQL (Neon target) with connection pooling (`pool_pre_ping=True`, `pool_recycle=1800`), falling back to in-memory SQLite for offline automated unit testing.
   - Migrations: Alembic with offline static SQL generation and live Neon execution support.
   - Seeding: Dedicated reference data seeder (`app.seeds`) populating ONLY official reference roles (4) and states (8) without inserting synthetic users, fake reviews, or dummy tourism records.
2. **Schema & Model Implementation (27 Relational Tables):**
   - Identity: `roles`, `users`, `user_refresh_tokens`, `manager_assignments`.
   - Destination Ecosystem: `states`, `destinations`, `attractions`, `experiences`, `events`, `curated_circuits`, `curated_circuit_items`, `destination_videos`, `destination_advisories`, `travel_stories`.
   - Stakeholder Ecosystem: `stakeholder_services`, `stakeholder_media`, `stakeholder_posts`, `stakeholder_messages`, `stakeholder_reviews`.
   - Tourist Functionality: `trip_plans`, `trip_plan_items`, `user_favorites`, `destination_reviews`.
   - Governance & Analytics: `visitor_statistics`, `audit_logs`, `storage_object_registry`, `media_deletion_outbox`.
3. **Security Invariants Enforced:**
   - Strict UUID primary keys across entities.
   - Hierarchical composite foreign keys (`[destination_id, state_id] -> destinations[id, state_id]`, `[user_id, role_id] -> users[id, role_id]`).
   - Manager jurisdiction modeling (State scope when `destination_id IS NULL`; Destination scope when assigned).
   - Storage coordinate triads (nullable provider/bucket/key for legacy records; full triad required for verified objects).
   - Dedicated health and database connectivity diagnostics (`/health`, `/api/v1/health`, `/api/v1/health/db`).
4. **Verification & Testing:**
   - 12 automated unit and integration tests executed via pytest, verifying model relationships, constraints, cascade deletions, unique indexes, and API startup with 100% pass rate in 0.19s.
   - Alembic offline SQL generation verified (`alembic upgrade head --sql`), generating complete transactional DDL.


---

## 2026-11-18 — Phase 1: Authentication Integration (Frontend-Backend)

**Context:** Connecting existing frontend login and registration interfaces to the completed FastAPI authentication endpoints.

**Key Decisions & Architectural Enforcements:**
1. **Shared Vanilla JavaScript API Client (`frontend/js/api.js`):**
   - Created a dependency-free, native JavaScript singleton `window.YatraSetuApi`.
   - Transparent 401 handling: on HTTP 401, attempts single refresh token rotation via `POST /api/v1/auth/refresh`. If successful, retries original request once with new Bearer token; if failed, terminates session cleanly without looping.
   - Centralized session storage key mapping (`yatrasetu_access_token`, `yatrasetu_refresh_token`, `yatrasetu_role`, `yatrasetu_manager_scope`, etc.).
2. **Login Integration (`frontend/js/auth.js`):**
   - `initLoginForm` sends `{ email, password }` only. The client-selected role is never trusted; the role is authoritatively determined from the database `user.role` returned by the backend.
   - Role-based navigation to `${role}/dashboard.html` is strictly preserved.
3. **Registration Integration (`frontend/js/auth.js`):**
   - Public registration is strictly limited to `tourist` and `stakeholder`. Public registration attempts as `manager` or `admin` are rejected with descriptive governance notices.
   - Frontend password complexity validation strictly mirrors backend `PasswordSecurity` rules (min 8 chars, uppercase, lowercase, digit, special character).
   - Removed client-side mock writes to `yatrasetu_admin_users` and `yatrasetu_audit_trail`.
4. **Logout Synchronization:**
   - Topbar and sidebar logout buttons in `dashboard.js`, `manager-core.js`, and `tourist.js` call `window.YatraSetuApi.logout()`, revoking the refresh token in the backend database before clearing local session storage.
5. **Verification & Testing:**
   - 42 pytest tests passing (32 passed, 10 skipped PostgreSQL integration tests).
   - Node.js API client suite (8 tests) and password validation suite (7 tests) passing.
   - 9 live HTTP server integration tests executed against running FastAPI instance on `localhost:8001` passing with 100% success.

---

## 2026-11-18 — Phase 2: Public Catalogue API Integration (Frontend-Backend)

**Context:** Implementation of strictly read-only public catalogue backend APIs and connecting them to the existing Vanilla JavaScript frontend.

**Key Decisions & Architectural Enforcements:**
1. **Public Catalogue Architecture & Endpoints:**
   - Implemented 10 strictly read-only REST endpoints under `backend/app/api/v1/endpoints/catalogue.py`:
     - `GET /api/v1/states`: Fetch supported states (ordered by name).
     - `GET /api/v1/states/{state_id}`: Fetch state detail by ID.
     - `GET /api/v1/destinations`: Paginated destination list with `state_id`, `category`, and `search` filters.
     - `GET /api/v1/destinations/{destination_id}`: Destination detail by ID.
     - `GET /api/v1/attractions`: Paginated attractions list with `destination_id` and `category` filters.
     - `GET /api/v1/experiences`: Paginated experiences list with `destination_id`, `category`, and `difficulty` filters.
     - `GET /api/v1/experiences/{experience_id}`: Experience detail by ID.
     - `GET /api/v1/events`: Paginated events list with `destination_id` and `status` filters.
     - `GET /api/v1/circuits`: Paginated curated multi-day regional circuits with `state_id` filter and embedded stops.
     - `GET /api/v1/circuits/{circuit_id}`: Curated circuit detail by ID.
   - Mutation guard: Zero POST, PUT, PATCH, or DELETE methods exposed on catalogue routes; mutations return HTTP 405 Method Not Allowed.
   - Pagination: Generic `PaginatedResponse[T]` envelope containing `items`, `total`, `limit`, and `offset`.
2. **Frontend API Client Integration (`frontend/js/api.js`):**
   - Added 10 public catalogue client methods (`getStates`, `getState`, `getDestinations`, `getDestination`, `getAttractions`, `getExperiences`, `getExperience`, `getEvents`, `getCircuits`, `getCircuit`) with query parameter serialization.
   - Script inclusion: `<script src="../js/api.js"></script>` added to all 8 tourist workspace pages before data and controller scripts.
3. **Resilient Data Resolution & Graceful Fallback (`frontend/js/tourist.js`):**
   - Asynchronous `loadCatalogueFromApi()` loads live records from REST endpoints.
   - When API returns records (`items.length > 0`), the frontend updates with live database data.
   - When the database returns an empty set (`items: []`, as Neon DB currently has 0 destinations) or is temporarily offline, the frontend falls back gracefully to `window.YatraSetuManagerData` and local catalogs. Zero broken layouts, zero missing cards, and zero JavaScript exceptions.
4. **Verification & Testing:**
   - 51 backend tests: 41 passed, 10 skipped in 1.30s (9 dedicated catalogue tests in `backend/tests/test_catalogue.py`).
   - Live Neon PostgreSQL verification: confirmed 8 states returned from live Neon; empty envelopes returned for empty tables; POST returns 405 Method Not Allowed.
   - Headless Chrome CDP browser tests across 4 tourist pages (`destinations.html`, `experiences.html`, `destination-detail.html`, `dashboard.html`): 100% passed with 0 console errors.

---

## 2026-11-18 — Phase 3 (Step 2): Destination Manager API Foundation

**Context:** Implementation of Destination Manager API foundation (`/api/v1/manager/context`, `/api/v1/manager/destinations`, `/api/v1/manager/destinations/{id}`) with strict database-derived jurisdiction guards.

**Key Decisions & Architectural Enforcements:**
1. **Manager Endpoints & Scoping (`backend/app/api/v1/endpoints/manager.py`):**
   - `GET /api/v1/manager/context`: Resolves manager identity, role (`manager`), scope (`state` or `destination`), state ID/name, destination ID/name, and assignment timestamp from DB `ManagerAssignment`.
   - `GET /api/v1/manager/destinations`: Strictly filtered by jurisdiction:
     - Destination Managers receive only their assigned destination (`Destination.id == context.destination_id`).
     - State Managers receive all destinations belonging to their assigned state (`Destination.state_id == context.state_id`).
   - `GET /api/v1/manager/destinations/{id}`:
     - Destination Managers requesting an ID outside their assigned destination receive `403 Forbidden` (`Access denied: Destination is outside your assigned jurisdiction`).
     - State Managers requesting a destination outside their state jurisdiction receive `403 Forbidden`.
     - Non-existent destinations within scope receive `404 Not Found`.
2. **Pydantic Schemas (`backend/app/schemas/manager.py`):**
   - `ManagerContextResponse`: Encapsulates verified manager attributes without leaking sensitive data or cross-manager records.
   - Reuses `DestinationSummaryResponse` and `DestinationDetailResponse` from catalogue schemas.
3. **Authorization & Security Guards:**
   - Unauthenticated requests: `401 Unauthorized` via `require_manager` -> `get_current_active_user` -> `get_current_user_and_context`.
   - Tourist / Stakeholder roles: `403 Forbidden` (`Access denied: Requires one of roles: manager`).
   - Manager without active assignment: `403 Forbidden` (`CONFIGURATION ERROR: Manager account exists without active jurisdiction assignment`).
   - Cross-jurisdiction access: `403 Forbidden` via `JurisdictionAuthorizer.can_manage_destination`.
4. **Verification & Testing:**
   - 8 new focused unit and security tests in `backend/tests/test_manager_api.py`.
   - Test suite status: 49 passed, 10 skipped in 6.18s.

---

## 2026-11-18 — Phase 3 (Step 3): Attractions and Events Manager APIs

**Context:** Implementation of Attraction and Tourism Event management endpoints for the Destination Manager workspace (`/api/v1/manager/attractions`, `/api/v1/manager/events`) with complete CRUD and jurisdiction validation.

**Key Decisions & Architectural Enforcements:**
1. **Model Alignment & Zero Field Fabrication:**
   - Used actual SQLAlchemy model columns in `backend/app/models/destination.py`:
     - `Attraction`: `id`, `destination_id`, `name`, `category`, `description`, `image_url`, `rating`, `status`, `operating_hours`, `entry_fee_label`.
     - `Event`: `id`, `destination_id`, `title`, `date_num`, `date_month`, `location_label`, `status`, `status_class`, `image_url`, `description`.
   - Explicitly discarded proposed audit fields not backed by the database schema (e.g. `start_date`, `end_date`, `expected_footfall`, `permit_status`).
2. **Endpoints Implemented (`backend/app/api/v1/endpoints/manager.py`):**
   - Attractions:
     - `GET /api/v1/manager/attractions`: Scoped listing with optional `destination_id` and `category` filters.
     - `POST /api/v1/manager/attractions`: Creation validating destination existence and manager jurisdiction.
     - `GET /api/v1/manager/attractions/{attraction_id}`: Detail retrieval checking jurisdiction over attraction's destination.
     - `PUT /api/v1/manager/attractions/{attraction_id}`: Partial updates, plus authority verification on destination if reassigned.
     - `DELETE /api/v1/manager/attractions/{attraction_id}`: Scoped deletion.
   - Events:
     - `GET /api/v1/manager/events`: Scoped listing with optional `destination_id` and `status` filters.
     - `POST /api/v1/manager/events`: Creation with destination jurisdiction checks.
     - `GET /api/v1/manager/events/{event_id}`: Detail retrieval.
     - `PUT /api/v1/manager/events/{event_id}`: Partial updates with reassignment checks.
     - `DELETE /api/v1/manager/events/{event_id}`: Scoped deletion.
3. **Jurisdiction Enforcement Matrix:**
   - Destination Manager: restricted to `context.destination_id`. Attempting to list with a different `destination_id`, create for another destination, or modify an attraction/event outside their destination returns `403 Forbidden`.
   - State Manager: restricted to destinations where `state_id == context.state_id`. Attempting to create or modify attractions/events in another state returns `403 Forbidden`.
   - Non-existent destination references return `404 Not Found` (when caller has state jurisdiction) or `403 Forbidden` (when destination manager attempts an ID outside their assignment).
4. **Verification & Testing:**
   - 9 new unit and security tests in `backend/tests/test_manager_api.py` (total 17 tests in module).
   - Entire test suite: 58 passed, 10 skipped in 9.06s.

---

## 2026-11-18 — Phase 3 (Step 3.5): Migration 005 — Catalogue RLS & Jurisdiction Hardening

**Context:** Implementation of Alembic migration `005_catalogue_rls.py` providing database-level Row-Level Security defense-in-depth on `destinations`, `attractions`, and `events`, while correcting the Migration 002 advisory policy loophole.

**Key Decisions & Architectural Enforcements:**
1. **Granular Command Policies & Least Privilege Scope:**
   - Discarded generic `FOR ALL` policies in favor of separate `SELECT`, `INSERT`, `UPDATE`, and `DELETE` policies.
   - `destinations`: Public `SELECT USING (true)` preserves public browsing. `INSERT`, `UPDATE`, and `DELETE` restricted strictly to `admin`. Managers hold zero mutation authority on destinations (matching approved Phase 3 scope).
   - `attractions` & `events`: Public `SELECT USING (true)`. `INSERT`, `UPDATE`, and `DELETE` enforced with database-level jurisdiction checks:
     - Destination Managers: strictly `destination_id = app.current_destination_id`.
     - State Managers: `NULLIF(app.current_destination_id, '') IS NULL` and destination verified in `app.current_state_id`.
     - `UPDATE` evaluates both `USING` (pre-update row authority) and `WITH CHECK` (post-update row authority), preventing cross-destination or cross-state reassignment attacks.
2. **Migration 002 Advisory Flaw Resolution:**
   - Migration 002's `p_destination_advisories_modify` checked `state_id = app.current_state_id` without verifying `app.current_destination_id IS NULL`, which allowed a Destination Manager to edit advisories for any destination in their state via OR-combination.
   - Migration 005 explicitly dropped `p_destination_advisories_modify` and replaced it with granular `INSERT`, `UPDATE`, and `DELETE` policies.
3. **Zero Policy Recursion:**
   - Subqueries against `destinations` inside `attractions`/`events` policies evaluate `p_destinations_select` (`USING (true)`), which carries no subqueries.
4. **Integration Test Suite Hardening (`backend/tests/test_postgres_rls.py`):**
   - Added 8 integration tests covering unauthenticated catalogue browsing, DM and SM mutations, cross-jurisdiction reassignment denial, manager destination mutation denial, advisory loophole resolution, and tourist/stakeholder mutation denial.
   - Tests explicitly skipped when `POSTGRES_TEST_URL` is unavailable.
5. **Verification & Testing:**
   - Alembic chain verified: single head `005_catalogue_rls`.
   - Test suite status: 58 passed, 18 skipped in 7.54s.
