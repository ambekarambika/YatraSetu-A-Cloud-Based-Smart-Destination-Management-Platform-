# YatraSetu — Tasks & Development Status

## 1. Current Status

**Overall:** Frontend foundation is strong; Manager UI Phase 6A is substantially implemented but not fully complete/final.

### Current completed/verified areas
- Repository setup
- Git/GitHub setup
- Public landing page
- Login UI
- Registration UI
- Shared dashboard UI system
- Eight-state manager theme engine
- Eleven Manager workspace pages (dashboard, destinations, attractions, events, stakeholders, visitor-statistics, feedback, analytics, reports, decision-support, profile)
- Manager UI interactions listed in the progress report
- Automated page-to-page navigation check
- JavaScript console verification reported as zero errors
- **Manager JavaScript Modular Refactoring (Completed & Verified)**:
  - Commit `a969479`: Extracted shared Manager core context, store adapter, state theme engine, and topbar popups into `manager-core.js`.
  - Commit `ba4ada9`: Extracted connected view renderers, profile page controller, and entity detail/edit modals into `manager-views.js`.
  - `manager.js` reduced from ~2,600 lines to 514 lines (search, filters, add-form handlers, and report generator simulation).
  - Script loading sequence verified across all 11 Manager HTML files.
- **FR-15: Destination Information Videos & Real Video Sourcing (Implemented & Corrected)**:
  - Corrected destination associations and metadata across all 8 states to ensure videos strictly correspond to actual destination content (e.g. Tadoba tiger videos mapped to Tadoba National Park rather than misattributed to Rajgad, Ajanta, or Ellora; Jaisalmer desert campaigns mapped to Jaisalmer rather than Amer; Rishikesh rafting mapped to Rishikesh rather than Haridwar).
  - Explicitly separated verification states into 3 distinct tiers: `official_source` (confirmed government/tourism authority asset), `verified_media` (confirmed playable asset from verified creator/guide), and `prototype_metadata` (illustrative orientation record without confirmed media asset).
  - Enforced publication integrity: all 42 prototype metadata records strictly defaulted to `status: "Draft"` and blocked from being published in the UI or via edit modals without confirmed playable media.
  - Replaced broken destination thumbnail paths with valid local assets (`thumb-lonavala.jpg`, `thumb-ajanta.jpg`) or neutral SVG placeholders (`🎬 Pending Verified Asset`), preventing unwanted fallback to Rajgad Fort thumbnails for unrelated destinations.
  - Exactly 38 genuine, playable destination videos verified via live YouTube oEmbed API (`200 OK`) and integrated across all 8 destinations (31 official sources, 7 verified creator media, 42 draft prototypes).
  - Dual horizontal tab navigation inside existing `destinations.html` (`🏛️ Destination Profiles` & `🎬 Destination Videos`), preserving the 10-page structure and sidebar navigation.
  - Interactive video preview modal with live YouTube iframe embed (`https://www.youtube-nocookie.com/embed/${id}?autoplay=1`), complete with publisher, actual duration, official link, and YouTube standard usage permissions; fallback animated canvas for prototype records.
  - Complete structured video source inventory recorded on `window.YatraSetuManagerData.videoSourceInventory` for transparent auditability.
  - Destination Manager exclusive management permissions (browse, add with custom duration, edit metadata, publish/unpublish toggle, delete with confirmation) with smart storage merge.
  - Territorial jurisdiction enforcement (authorized for active manager jurisdiction; view-only outside scope).
  - Tested in browser via interactive subagent with zero console errors.
- **Manager Authority & Administrator Governance Cross-Workspace Integration (Completed & Verified)**:
  - Harmonized manager seeds and profile definitions across `manager-data.js`, `admin.js`, and `auth.js` to canonical `usr-mgr-01` (Rajesh Patil, `State Manager`, `Maharashtra (All Destinations)`).
  - Bidirectional profile synchronization via `AdminStore.syncWithManagerData`, `AdminStore.reassignManagerAuthority`, and `manager-core.js` (`syncActiveManagerProfile`): updates in the Administrator dashboard immediately reflect across session storage, local storage, topbar badges, profile cards, and review modals in the Manager workspace without requiring manual re-login.
  - Strict hierarchical jurisdiction enforcement:
    - State Manager (`scope: 'STATE'`): Authorized for state-wide stakeholder reviews across all destinations within their assigned state territory (`Maharashtra`), but strictly prohibited from cross-state reviews (e.g., Kerala stakeholders locked with out-of-state restriction banners).
    - Destination Manager (`scope: 'DESTINATION'`): Demoting or reassigning a manager to destination scope (e.g. `Rajgad Fort`) strictly collapses review authority to that single destination. Stakeholders registered in other destinations (e.g., `Lonavala`) display an explanatory restriction banner and disable decision notes and approval actions.
    - Controlled Destination Reassignment: Stakeholder destination reassignment requires mandatory administrative justification (minimum 6 characters) and immutable audit logging (`CONTROLLED_DESTINATION_REASSIGNMENT`). Local Destination Managers are prevented from moving businesses outside their assigned destination.
    - Admin-exclusive account controls: Account activation, deactivation, and deletion remain strictly separated and exclusive to Platform Administrators; suspended accounts display a warning banner in the Manager workspace.
  - End-to-end browser verified with interactive subagent across reassignment, audit logging, profile reflection, jurisdiction restrictions, and authority restoration with zero console errors.

### Not yet implemented
- FastAPI backend
- PostgreSQL schema
- Real authentication
- JWT
- server-side RBAC
- real API integration
- persistent application data
- real analytics calculations
- real report generation
- Tourist workspace video discovery and playback view (Phase 8)
- production backend/database integration


## 2. Phase Roadmap

### Phase 1–3 — Public Interfaces & Authentication UI
**Status: FROZEN / APPROVED**

Includes:
- landing page,
- login page,
- registration page.

### Phase 4–5 — Shared Application UI System
**Status: IMPLEMENTED**

Includes:
- dashboard stylesheet,
- shared sidebar/topbar,
- state theme variables,
- shared JavaScript shell,
- app preview.

### Phase 6A — Destination Manager UI
**Status: IN PROGRESS / SUBSTANTIALLY IMPLEMENTED**

Ten pages exist:
- dashboard
- destinations
- attractions
- events
- stakeholders
- visitor-statistics
- feedback
- analytics
- reports
- decision-support

Verified interactions:
- eight-state selector,
- add destination modal,
- add attraction modal,
- add event modal,
- report preview simulation,
- stakeholder registration review & approval workflow (review dialog, state/destination authorization boundary, registration status filtering, decision notes, cross-workspace listing sync),
- stakeholder-to-manager feedback & coordination channel on Feedback page (dual-tab horizontal navigation: Tourist Feedback and Stakeholder Suggestions matching Connections & Reviews pattern, full-width content displays, dedicated status filtering, review & reply modal, cross-workspace reply synchronization, responsive mobile layout),
- page-to-page navigation,
- zero JavaScript console errors reported.

**Remaining before Phase 6A can be marked final:**
- final human/UI review,
- confirm no remaining visual or functional corrections,
- confirm all manager requirements are represented correctly,
- explicitly approve/freeze the Manager workspace.

Do not start treating Phase 6A as fully frozen until that approval happens.

## 3. Phase 7 — Tourism Stakeholder UI
**Status: PLANNED / NEXT ROLE**

Expected:
- stakeholder overview,
- profile management,
- tourism information/services,
- shared information,
- destination updates,
- manager coordination.

Do not copy Manager dashboard content into this role.

## 4. Phase 8 — Tourist UI
**Status: FOUNDATION, EXPLORE DESTINATIONS & DESTINATION DATA INTEGRATION IMPLEMENTED (Verified)**

### Implemented & Verified in Phase 1 & 2:
- **Tourist Workspace Travel Companion Design System (`frontend/css/tourist.css`)**:
  - Replaced administrative sidebar layout with a clean tourist-oriented top navigation (`.tourist-header`) featuring brand identity, centered nav links (Discover, Destinations, Experiences, Plan Your Trip, Stories, Travel Guidance), quick search trigger, wishlist heart counter (`.tourist-fav-badge`), and user profile badge/dropdown.
  - Warm off-white backgrounds (`#FAF8F5`, `#FCFBF9`), deep forest green (`#1A3D32`), restrained saffron accents (`#E07A22`), and editorial typography (`Playfair Display` + `Plus Jakarta Sans`).
  - Mobile responsive drawer navigation and touch-friendly targets.
- **Tourist Dashboard (Home) (`frontend/tourist/dashboard.html`)**:
  - Hero banner with regional backdrop, search bar with icon and submit button, category chips (Forts & Heritage, Nature & Wildlife, Beaches & Islands, Spiritual & Pilgrimage, Culture & Festivals, Adventure & Outdoor, Food & Local Life, Arts & Crafts), and location badge.
  - "Discover India's Destinations" section showcasing 8 regional state cards (Maharashtra, Kerala, Goa, Rajasthan, Tamil Nadu, Uttarakhand, Kashmir, Assam) with deep links.
  - Split promotional & guide cards: "From Inspiration to Itinerary" trip planning card, "Interactive Travel Guide" directory, and "Featured Experience: Trek to Kataldhar Waterfall".
  - "Curated for You" horizontal cards and "Travel Responsibly" eco-banner.
- **Explore Destinations Page (`frontend/tourist/destinations.html`)**:
  - Full-text destination search combined with horizontal state filter pills (`All States` + 8 state pills).
  - Left filter sidebar with checkboxes for Category, Suitable For (`Family`, `Solo Travel`, `Group Travel`, `Adventure Seekers`), and Season (`Winter`, `Summer`, `Monsoon`).
  - Sort dropdown (`Popularity`, `Rating Highest`, `Name A-Z`, `Name Z-A`) and live results counter.
  - Active filter badges with individual removal buttons and "Clear All" recovery.
  - Loading, empty ("No Destinations Found" with reset button), and error state fallbacks.
  - Destination card grid with images, category tags, locations, ratings, and wishlist toggles.
- **Destination Detail Route & Cross-Workspace Data Integration (`frontend/tourist/destination-detail.html` & `frontend/js/tourist.js`)**:
  - Deep-linkable destination profile route (`?id=${dest.id}`) with hero banner, category tags, wishlist toggle, about section, key highlights, verified manager-published attractions, and 8 tabbed panes (`Overview`, `Attractions`, `Videos`, `Local Services`, `Events`, `Advisories & Guidelines`, `Regional Circuit`, `Reviews`).
  - **Location Integrity & OpenStreetMap**: Validated Indian geographic bounding box (Lat: 6.0° - 38.0° N, Lng: 68.0° - 98.0° E) for all 40 destinations; interactive OpenStreetMap embedded iframe; directions routing link; graceful survey-pending notice for unverified locations.
  - **Strict Attraction Boundary**: attractions queried strictly by explicit `destination_id` matching, eliminating cross-destination leakage.
  - **FR-15 Video Integration**: Curated official destination videos (`status === 'Published'`) with privacy-enhanced YouTube nocookie playback modal (`#touristVideoModal`) and automatic audio/video teardown upon close.
  - **Stakeholder Experience & Services**: Displays approved and active tourism partners (`status === 'Approved'` and `account_status !== 'Deactivated'`) with partner detail/enquiry modal (`#touristStakeholderModal`); private internal manager notes and admin logs are strictly stripped.
  - **Events & Advisories**: Scheduled events from `manager-data.js` and official advisories/notices from `stakeholder-data.js`.
  - **Regional Circuit**: Truthful state-level recommendations without fabricated proximity numbers.
  - **Interactive Tourist Feedback Loop**: Verified manager feedback display + interactive submission modal (`#touristFeedbackModal`) persisting reviews via `sessionStorage` (`yatrasetu_tourist_feedback`).
- **Wishlist & Session Authentication Integration (`frontend/js/tourist.js`)**:
  - Favorited destinations persisted to `localStorage` (`yatrasetu_tourist_favorites`), dynamically updating the topbar counter and slide-over Wishlist drawer.
  - Seamless authentication integration: authenticated tourists display active name ("Ananya Sharma"), guests see "Hi, Guest • Plan My Journey" with login prompts, and managers/stakeholders/admins visiting tourist routes see their role badge with return links.
- **Architectural Scope Protection**:
  - No hotel/flight booking, payments, or OTA marketplace functionality.
  - Internal manager notes, draft media, and administrative audit trails remain hidden.
  - Client-side prototype persistence disclaimer clearly presented.

### Remaining for Phase 8 Subsequent Phases:
- Tourist interactive itinerary trip planner (Phase 8B / "Plan Your Trip").
- Travel Guide / Stories narrative articles (Phase 8D).

## 5. Phase 9 — Administrator UI & Stakeholder Account Permissions
**Status: IMPLEMENTED & END-TO-END VERIFIED (Client/Application Layer)**

Implemented & Verified:
- Administrator Governance Workspace (`frontend/admin/dashboard.html`, `frontend/css/admin.css` & `frontend/js/admin.js`):
  - Canonical 7-tab sidebar navigation: Overview, Stakeholder Accounts, Business Registrations, Destinations Catalog & Jurisdictions, Roles & Permissions (RBAC Matrix), Manager Authority & Jurisdictions, and System Audit Trail.
  - Overview metrics, recent registrations table, and live system activity feed.
  - Stakeholder Accounts management with search by name, email, or stakeholder ID, role filtering, status filtering, and exclusive account action modals (view details, deactivate with amber warning, delete with red danger alert).
  - Business Registrations oversight with state, destination, category, and status filters; registration review modal with direct deep-link to the stakeholder account.
  - Destinations Catalog & Jurisdictions view structured by state territories, active manager assignments, and operational stakeholder counts with deep-linking to filtered accounts.
  - Roles & Permissions (RBAC) architecture matrix defining the 4 platform roles (Platform Administrator, Destination Manager, Tourism Stakeholder, Tourist), permitted scopes, prohibited actions, and transparent prototype storage disclaimer.
  - **Manager Authority & Jurisdictions Subsystem**:
    - Regional oversight cards defining State-Level Access (`scope: 'STATE'`) vs Destination-Level Access (`scope: 'DESTINATION'`) and Platform Administrator controls.
    - Manager Directory table tracking all regional managers (Rajesh Patil, Sunita Nair, Amit Saxena, Priya Menon) with their assigned territories and capability checklists.
    - Interactive Manager Authority modal with dual tabs: Authority Scope Overview (capabilities checklist) and Controlled Jurisdiction Reassignment (scope promotion/demotion, territory reassignment, and mandatory administrative rationale).
    - Immediate administrative platform audit logging (`MANAGER_AUTHORITY_REASSIGNED`) recording actor attribution, prior jurisdiction, new jurisdiction, and rationale; displayed in dedicated Manager Authority Audit History and global System Audit Trail.
  - System Audit Trail view with search, action type filtering (`MANAGER_AUTHORITY_REASSIGNED`, `ACCOUNT_STATUS_DEACTIVATED`, etc.), and CSV export.
  - **Administrator Topbar, Profile & Settings (Refactored to Reuse Shared System)**:
    - Reused the shared topbar, notification panel, and user dropdown system in `frontend/js/dashboard.js` and `frontend/css/dashboard.css` rather than creating duplicate code.
    - Cleaned up `frontend/admin/dashboard.html` to standard shared markup (single notification bell `#notification-btn`, single user profile badge `.user-profile-badge`).
    - Removed ~170 lines of duplicate topbar CSS from `frontend/css/admin.css` and ~150 lines of duplicate topbar JS from `frontend/js/admin.js`.
    - Wired "View Profile" to `#adminProfileModal` (Rajesh Verma identity and scopes) and "Account Settings" to `#adminSettingsGapModal` (transparent Phase 11 FastAPI backend notice).
    - Enabled clicking the sidebar user footer card (`.sidebar-user`) to open `#adminProfileModal`.
    - Connected Logout to targeted session clearance (`sessionStorage.removeItem('yatrasetu_role')`, `removeItem('yatrasetu_email')`, `removeItem('yatrasetu_name')`), preserving unrelated project data.
    - Enforced route protection via `checkAdminAuth()` preventing logged-out visitors from accessing protected Admin tabs and controls, redirecting to `../login.html`.
  - **Dashboard Metrics & Data Reconciliation (Task 1)**:
    - Reconciled dashboard metrics dynamically (`totalStakeholders`: 10, `pendingApprovals`: 3, `activeBusinesses`: 7, `inactiveAccounts`: 0) with live application data and dynamic sub-label updates.
  - Technical Architecture Boundary: Client-side prototype persistence (`localStorage`, `sessionStorage`, in-memory models); production server-enforced security will be introduced in Phase 10 (PostgreSQL Schema) and Phase 11 (FastAPI Backend).
  - End-to-end browser tested across all 7 tabs, metric cards, modal flows, reassignment with rationale, 3 dropdown actions, logout, and access protection after logout with zero console errors.


## 6. Phase 10 — Database Schema
**Status: PLANNED**

Expected:
- PostgreSQL ER model,
- users/roles,
- destinations,
- attractions,
- events,
- stakeholders,
- feedback,
- trip plans,
- visitor statistics,
- supporting relationships as required.

## 7. Phase 11 — FastAPI Backend
**Status: PLANNED**

Expected:
- REST APIs,
- authentication,
- JWT,
- password hashing,
- RBAC,
- validation,
- database integration,
- role-specific authorization.

## 8. Recommended Immediate Task

**Await explicit user approval before beginning the next development phase.**

Checklist / Current Status:
1. Manager JavaScript modular refactoring complete & verified (commits `a969479` and `ba4ada9`).
2. Manager Authority and Admin governance integration across workspaces completed and verified end-to-end via interactive browser subagent with zero console errors.
3. Cross-workspace jurisdiction enforcement (State Manager vs Destination Manager, cross-state boundary locks, mandatory reassignment justifications, audit trail logging) verified in browser.
4. Await explicit approval before planning Phase 7 — Tourism Stakeholder UI or backend integration.

## 9. Testing/Deployment Work Remaining

Later:
- unit/feature tests where appropriate,
- API testing with Postman,
- database integration tests,
- authentication/RBAC tests,
- security validation,
- production deployment,
- cloud integration verification,
- final acceptance criteria validation.

## 10. Technical Debt / Risks

- Frontend currently relies on simulated/sample data.
- Backend/database are not yet implemented.
- Report export is currently a UI trigger/simulation until backend generation is implemented.
- Real analytics will require defined database fields and aggregation logic.
- Exact GCP service/API selection remains a future implementation decision.
