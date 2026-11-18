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
- **Tourist Workspace Functional Repair, Destination Details & UI Polish (Completed & Verified)**:
  - Fixed modal visibility bug in `frontend/css/tourist.css` (`.tourist-modal-overlay.show, .tourist-modal-overlay.active { display: flex; z-index: 2000; }`), resolving the critical bug where video audio played while video imagery remained invisible, and fixing non-responsive stakeholder detail buttons.
  - Multi-Image Visual Gallery & Fullscreen Lightbox: implemented `DESTINATION_GALLERIES` with 5–8 high-resolution authentic photographs per destination with perspective tags and descriptions. Added `[📷 View Photos]` button pill in the hero and Visual Gallery preview in `destination-detail.html`. Created `#touristLightboxModal` with thumbnail strip, counter, and keyboard navigation (`ArrowLeft`, `ArrowRight`, `Escape`).
  - Interactive Attraction Detail Modal: enriched attractions with operating hours, duration, photography guidance, and visitor guidelines via `ATTRACTION_EDITORIAL`. Created `#touristAttractionModal` and wired both overview preview cards and full tab cards to open modal on click.
  - Authorized Local Services & Guides: verified that `.btn-view-stakeholder` opens `#touristStakeholderModal` visibly, displaying base office, hours, guide rate, scope notice, and direct `tel:`/`mailto:` links.
  - Interactive Itinerary Planner (`#plan-trip`): built a 2-tab planner with 3 curated multi-day regional circuits (Maharashtra Fort Trail, Kerala Backwaters, Rajasthan Heritage Trail) and a custom trip builder generating structured itineraries from verified destination records.
  - Travel Stories & Modal Reader (`#curated-section`): populated 4 authentic chronicles with reading time, author, and imagery; added `#touristStoryModal` for reading full chronicles with direct destination links.
  - Dedicated Travel Guidance Directory (`#travel-guide`): created a 6-pillar guidance directory covering Best Time & Climate Patterns, Transit Hubs, Heritage Etiquette, Trekking Safety, Sustainable Travel, and Packing Essentials.
  - Category Filter Integration: wired `category=adventure-outdoor` query parameters and intra-page navigation interceptors on `destinations.html`.
  - 100% automated browser verification passed across all 18 test points with zero console errors.
- **Tourist Workspace: Dedicated Pages & Information Architecture (Completed & Fully Verified)**:
  - Created 5 dedicated standalone pages under `frontend/tourist/`:
    - `destinations.html` (Destinations Catalog with search and category filters)
    - `experiences.html` (Dedicated Experiences Catalog: 18 outdoor & cultural activities, category chips, state filter, search input, and interactive `#touristExperienceModal`)
    - `plan-trip.html` (Dedicated Trip Planning Workspace: Curated Circuits for MH, KL, RJ, Goa, and JK, interactive custom itinerary builder, and personal travel wishlist planner)
    - `stories.html` (Dedicated Travel Stories & Chronicles: authentic long-form travel chronicles with category filter and full reader `#touristStoryModal`)
    - `travel-guidance.html` (Dedicated Travel Guidance & Visitor Directory: 6 comprehensive guidance pillars, regional transit directory, high-altitude & trekking checklist, and national tourist helplines)
    - `destination-advisories.html` (Dedicated Official Advisories & Guidelines Page: destination query parameter integration `?id=...`, ASI heritage regulations, seasonal climate windows, local administrative contacts, and emergency assistance boxes)
  - Refactored `dashboard.html` (Discover): removed heavy embedded planner, stories, and guidance sections; replaced them with clean spotlight teaser cards linking directly to the dedicated standalone pages; standardized 6-link navigation and mobile drawer.
  - Enhanced Destination Details (`destination-detail.html`):
    - Enriched Overview tab with deep historical background, origin, heritage & architectural significance, cultural traditions, geography, and prominent landmarks.
    - Added bottom Official Advisories preview card linking to `destination-advisories.html?id=${dest.id}` (preventing duplication of full advisory bulletins).
    - Standardized 8 tabs: Overview, Attractions, Videos, Experiences, Events, Authorized Local Services & Guides, Regional Circuit, Reviews & Feedback.
    - Wired Experiences tab with destination-specific activity cards and `#touristExperienceModal`.
    - Wired Events tab with authentic event cards (status badges, dates, locations, organizers) and `#touristEventModal` for interactive details.
  - Automated CDP suite (`scratch/test_tourist_navigation_suite.js`) passed 100% across all 8 test suites with zero console errors.
- **Tourist Workspace: UI Stabilization, CSS Audit & Code Cleanup (Completed & Fully Verified)**:
  - **CSS Consolidation & Dead Code Removal**: Audited `frontend/css/tourist.css` and cleaned up over 50 dead/redundant class selectors, eliminated bottom overrides and patched rules, unified experiences and card class definitions, and established one consistent travel design system (warm `#FAF8F5` surface, forest green `#1A3D32` primary, restrained saffron `#E07A22` accents, subtle `#E8E4DA` borders, consistent border-radius and box shadows).
  - **Mobile 390px Viewport Overflow Resolution**: Resolved off-screen drawer overflow bug where hidden wishlist and mobile drawers expanded the layout viewport to 465px; clamped document `scrollWidth` strictly to `390px` with zero horizontal overflow across all 8 pages. Added compact mobile header rules (hiding user name/role text, keeping avatar) and smooth horizontal swipe on the 8 destination detail tabs (`scrollbar-width: none`).
  - **Destination Detail Section Redesign**:
    - *Overview*: Transformed 5 repetitive, generic text boxes into a magazine-grade layout: a top 6-point Key Facts Grid (Classification, District, Elevation, Season, Duration, Trail Grade), an elegant Comprehensive Editorial Chronicles Card (Lead Summary, Historical Background, Heritage Architecture, Cultural Significance, Topography), Key Highlights chip grid, Attractions Preview, Scenic Gallery Preview, and an Official Advisories preview banner.
    - *Attractions*: Replaced inappropriate video card grid styling with dedicated image-first `.tourist-attraction-card` layout featuring 180px uniform media, category tags, rating pills, operating hours, duration, and direct detail modal interactions.
    - *Videos*: Standardized 16:9 thumbnail ratio, play button overlay with hover animation, duration badge, publisher metadata, and responsive iframe embed.
    - *Experiences*: Unified `.experiences-full-grid` and `.experience-full-card` with clean photo banners, category tags, 2x2 meta grid, and interactive `#touristExperienceModal`.
    - *Events*: Replaced inline styled elements with a modern `.tourist-event-card` with saffron date badge (day number + uppercase month), event thumbnail, location, timings, status pill, and `#touristEventModal` details.
    - *Authorized Local Services & Guides*: Improved directory cards with verified partner badge, category tag, base hub, hours, guide rate, and dual actions (direct `tel:` link + "View Details & Enquire").
    - *Regional Circuit*: Replaced generic state cards with dedicated `.circuit-dest-card` grid displaying state rank badge, category, thumbnail, and direct destination link.
    - *Reviews & Feedback*: Cleaned up review presentation with author initials avatar, star rating, verified submission pill, and feedback form modal.
  - **Multi-Device Responsive Verification**: Automated layout verification across Desktop (1440px), Laptop (1366px), Tablet (768px), and Mobile (390px) confirmed `noHorizontalOverflow: true` (0 horizontal scroll) on all 8 pages. All 8 automated CDP navigation and functional test suites passed 100%.

### Completed Backend & Database Foundation
- **Phase 1: Backend Foundation & Data Modeling (Completed & Verified)**:
  - Created modular `backend/` application structure with FastAPI, SQLAlchemy 2.0, Alembic, and Pydantic.
  - Implemented all 27 approved database models across 5 logical domains (`identity`, `destination`, `stakeholder`, `tourist`, `governance`) with strict UUID identifiers, composite foreign keys, constraints, and timestamps.
  - Configured Alembic with `001_initial_schema.py` supporting offline static SQL generation and live Neon migrations.
  - Idempotent verified lookup seeder (`app.seeds`) for official roles and states.
- **Phase 1.1: Database Security Hardening & RLS Architecture (Completed & Verified)**:
  - Row-Level Security Alembic migrations `002_enable_rls.py`, `003_harden_rls_policies.py`, and `004_gov_storage_rls.py`.
  - Applied `FORCE ROW LEVEL SECURITY` across 17 tenant, governance, and system tables (`users`, `user_refresh_tokens`, `trip_plans`, `trip_plan_items`, `user_favorites`, `stakeholder_services`, `stakeholder_media`, `stakeholder_posts`, `stakeholder_messages`, `destination_advisories`, `destination_reviews`, `stakeholder_reviews`, `visitor_statistics`, `audit_logs`, `media_deletion_outbox`, `manager_assignments`, `storage_object_registry`).
  - Corrected `stakeholder_messages` policy in `003` to match actual schema columns (`sender_id`, `recipient_id`, `destination_id`).
  - Governance protection: `manager_assignments` secured with RLS in `004_gov_storage_rls.py` (admin full CRUD, managers self-read, state managers regional read, tourists/stakeholders blocked).
  - Cloud infrastructure protection: `storage_object_registry` secured with RLS in `004_gov_storage_rls.py` (admin-only access).
  - Least-privilege PostgreSQL role provisioning script `backend/scripts/setup_roles.sql` (`yatrasetu_app` with NOBYPASSRLS, DML only, no TRUNCATE on audit/registry, no CREATE privilege on schema public).
  - Manager jurisdiction authorization guards (`JurisdictionAuthorizer`) & soft-delete filter scoping (`SoftDeleteManager`).
- **Phase 2: Authentication & Role-Based Authorization (Completed & Verified)**:
  - **Argon2id Password Hashing (`app.core.hashing`)**: RFC 9106 parameters (64 MiB memory, 3 iterations, 4 parallelism, 16-byte salt). Complexity validator enforcing uppercase, lowercase, digit, and symbol.
  - **Token Management (`app.core.tokens`)**: Short-lived signed JWT access tokens (PyJWT, HS256) and cryptographically secure 64-byte refresh tokens stored as SHA-256 hashes in `user_refresh_tokens`.
  - **Token Family Rotation & Replay Attack Detection**: Detects token reuse; revokes the entire token family immediately on reuse attempt.
  - **Authentication Endpoints (`app.api.v1.endpoints.auth`)**:
    - `POST /api/v1/auth/register`: Public registration strictly restricted to `tourist` and `stakeholder` (admin and manager registration rejected).
    - `POST /api/v1/auth/login`: Email and password authentication with neutral error messaging (prevents email enumeration).
    - `POST /api/v1/auth/refresh`: Atomic refresh token rotation.
    - `POST /api/v1/auth/logout`: Refresh token revocation.
    - `GET /api/v1/auth/me`: Authenticated profile endpoint returning verified `SecurityContext` identity and manager jurisdiction.
  - **FastAPI RBAC Dependencies (`app.core.auth`)**: Authoritative database user loading, active account checks, and role guards (`require_tourist`, `require_stakeholder`, `require_manager`, `require_admin`, `require_destination_manager`, `require_state_manager`).
  - **Transaction-Local Identity Assertion**: Parameterized `SELECT set_config('app.current_user_id', :uid, true)` and `SELECT set_config('app.current_role', :role, true)` establishing caller identity inside the same transaction block prior to manager assignment lookup.
  - **Automated Test Suite**: 32 unit tests passing in 1.15s (13 auth tests, 7 security tests, 8 model tests, 4 health tests). 10 PostgreSQL integration tests prepared for Docker/CI.

- **Phase 1 (Integration): Authentication Integration (Completed & Verified)**:
  - Centralized Vanilla JS API client `frontend/js/api.js` (`window.YatraSetuApi`) with transparent refresh token rotation, replay prevention, and 401 handling.
  - Connected `login.html` and `register.html` to live FastAPI auth endpoints (`/auth/login`, `/auth/register`, `/auth/logout`, `/auth/refresh`, `/auth/me`).
  - Database role authoritative resolution (client-selected role untrusted; role derived from database).
  - Verified against live Neon PostgreSQL database with official roles and states.
- **Phase 2 (Integration): Public Catalogue API Integration (Completed & Verified)**:
  - Implemented 10 strictly read-only catalogue endpoints in `backend/app/api/v1/endpoints/catalogue.py` (`/states`, `/destinations`, `/attractions`, `/experiences`, `/events`, `/circuits`).
  - Added Pydantic schemas in `backend/app/schemas/catalogue.py` with generic `PaginatedResponse[T]`.
  - Added 10 public catalogue methods to `frontend/js/api.js` (`getStates`, `getDestinations`, etc.).
  - Integrated `frontend/js/tourist.js` to asynchronously load live catalogue records from REST endpoints.
  - Implemented resilient fallback to existing catalogue data when database returns empty sets (0 destinations in Neon).
  - Included `api.js` across all 8 tourist workspace pages.
  - 41 backend tests passed (9 catalogue tests in `backend/tests/test_catalogue.py`).
  - Verified live Neon PostgreSQL responses: 8 states returned; empty paginated envelopes for unpopulated tables; HTTP 405 Method Not Allowed on mutation attempts.
  - Headless Chrome browser integration test passed across all 4 tourist pages with zero console errors.

- **Phase 3 (Step 2): Destination Manager API Foundation (Completed & Verified)**:
  - Implemented Destination Manager foundation endpoints in `backend/app/api/v1/endpoints/manager.py`:
    - `GET /api/v1/manager/context`: Returns authenticated manager's verified identity, role, scope (`state` or `destination`), assigned state, assigned destination, and assignment timestamp.
    - `GET /api/v1/manager/destinations`: Returns list of destinations restricted strictly to caller's jurisdictional boundary (Destination Managers see only their assigned destination; State Managers see all destinations in their assigned state).
    - `GET /api/v1/manager/destinations/{id}`: Returns detailed destination record with strict cross-jurisdiction authorization guards (403 Forbidden for cross-jurisdiction access, 404 for non-existent destinations).
  - Created Pydantic schema `ManagerContextResponse` in `backend/app/schemas/manager.py` and exported via `backend/app/schemas/__init__.py`.
  - Registered manager router in `backend/app/api/v1/api.py` with prefix `/manager`.
  - Enforced RBAC and jurisdiction guards: unauthenticated calls rejected with 401; tourist/stakeholder roles rejected with 403; managers without DB assignments rejected with 403; cross-jurisdiction requests rejected with 403.
  - 8 new focused unit and security tests in `backend/tests/test_manager_api.py`.
  - Entire test suite: 49 passed, 10 skipped (PostgreSQL RLS integration tests requiring live test instance).

- **Phase 3 (Step 3): Attractions and Events Manager APIs (Completed & Verified)**:
  - Implemented Attraction management endpoints in `backend/app/api/v1/endpoints/manager.py`:
    - `GET /api/v1/manager/attractions`: Scoped listing with optional `destination_id` and `category` filters.
    - `POST /api/v1/manager/attractions`: Creation with destination verification and jurisdiction enforcement.
    - `GET /api/v1/manager/attractions/{attraction_id}`: Detail retrieval with jurisdiction check.
    - `PUT /api/v1/manager/attractions/{attraction_id}`: Partial update with optional destination reassignment validation.
    - `DELETE /api/v1/manager/attractions/{attraction_id}`: Scoped deletion returning `MessageResponse`.
  - Implemented Tourism Event management endpoints in `backend/app/api/v1/endpoints/manager.py`:
    - `GET /api/v1/manager/events`: Scoped listing with optional `destination_id` and `status` filters.
    - `POST /api/v1/manager/events`: Creation using actual `Event` columns (`date_num`, `date_month`, `location_label`, `status`, `status_class`).
    - `GET /api/v1/manager/events/{event_id}`: Detail retrieval with jurisdiction check.
    - `PUT /api/v1/manager/events/{event_id}`: Partial update with destination reassignment validation.
    - `DELETE /api/v1/manager/events/{event_id}`: Scoped deletion returning `MessageResponse`.
  - Added Pydantic schemas in `backend/app/schemas/manager.py`: `AttractionCreate`, `AttractionUpdate`, `EventCreate`, `EventUpdate`.
  - Enforced RBAC and strict jurisdiction scoping: 401 for unauthenticated; 403 for tourists/stakeholders/unassigned managers; 403 for cross-destination/cross-state actions; 404 for invalid destination references; 422 for constraint/validation failures.
  - Expanded `backend/tests/test_manager_api.py` to 17 tests (9 new dedicated attraction and event tests).
  - Full test suite: 58 passed, 10 skipped in 9.06s.

- **Phase 3 (Step 3.5): Migration 005 Implementation & Catalogue RLS Hardening (Completed & Verified)**:
  - Created Alembic revision `005_catalogue_rls.py` chained from `004_gov_storage_rls`.
  - Applied `ENABLE & FORCE ROW LEVEL SECURITY` on `destinations`, `attractions`, and `events`.
  - Added public read policies (`p_*_select`) with `USING (true)` preserving unauthenticated catalogue browsing.
  - Restricted `destinations` mutations (`INSERT`, `UPDATE`, `DELETE`) strictly to `admin` (zero manager mutation permission on destinations).
  - Implemented granular command-specific policies on `attractions` and `events` enforcing destination/state jurisdiction (`WITH CHECK` on `INSERT`, `USING` and `WITH CHECK` on `UPDATE`, `USING` on `DELETE`).
  - Corrected Migration 002 advisory vulnerability: explicitly dropped obsolete `p_destination_advisories_modify` and created granular `INSERT`, `UPDATE`, `DELETE` policies eliminating the OR-combination loophole.
  - Added full reversible `downgrade()` restoring 002 policies and disabling RLS on newly secured tables.
  - Added 8 new PostgreSQL integration tests in `backend/tests/test_postgres_rls.py` (total: 18 tests, explicitly skipped when `POSTGRES_TEST_URL` is unset).
  - Verified migration chain integrity: `005_catalogue_rls` is the clean single head.
  - Backend test suite: 58 passed, 18 skipped in 7.54s.

### Not yet implemented
- Role-specific mutation & CRUD APIs (Destination Manager workspace APIs, Stakeholder service APIs, Tourist trip planning / favorites / review APIs)
- Real analytics aggregation queries
- Report PDF/CSV generation
- Production deployment on cloud host


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
**Status: FOUNDATION IMPLEMENTED (SQLAlchemy 2.0 Models & Alembic 001 Schema)**

Implemented:
- 27 frozen relational tables defined in `backend/app/models/` (`identity`, `destination`, `stakeholder`, `tourist`, `governance`).
- Alembic initial revision `001_initial_schema.py` generated and tested with offline SQL generation (`alembic upgrade head --sql`).
- Idempotent verified lookup seeder (`app.seeds`) for official roles and states.
- Live Neon execution ready pending user connection configuration.

## 7. Phase 11 — FastAPI Backend & Authentication (Phase 2 Completed)
**Status: AUTHENTICATION & RBAC IMPLEMENTED (Phase 2 Complete)**

Implemented & Verified:
- FastAPI application entrypoint with CORS middleware for local frontend ports.
- Configuration loader via `.env` with fallback support for SQLite offline testing.
- Database session dependency injection (`get_db`) with automatic connection pooling.
- Health check endpoints (`/health`, `/api/v1/health`, `/api/v1/health/db`).
- Alembic initial revision `001_initial_schema.py` generated with 27 models and verified via static SQL generation (`alembic upgrade head --sql`).
- Idempotent verified lookup seeder (`app.seeds`) for official roles and states.
- **Phase 1.1 Database Security Hardening (Completed & Verified)**:
  - Identity Propagation Architecture (`SET LOCAL app.current_user_id` / `SET LOCAL app.current_role`).
  - Row-Level Security Alembic migrations `002_enable_rls.py`, `003_harden_rls_policies.py`, and `004_gov_storage_rls.py`.
  - Least-privilege PostgreSQL role provisioning script `backend/scripts/setup_roles.sql`.
  - Governance protection: `manager_assignments` secured with RLS (admin full CRUD, managers self-read, state managers regional read, tourists/stakeholders blocked).
  - Cloud infrastructure protection: `storage_object_registry` secured with RLS (admin-only access).
  - Manager jurisdiction authorization guards & soft-delete filter scoping.
- **Phase 2 Authentication & Authorization (Completed & Verified)**:
  - **Argon2id Password Hashing (`app.core.hashing`)**: RFC 9106 parameters (64 MiB memory, 3 iterations, 4 parallelism, 16-byte salt). Complexity validator enforcing uppercase, lowercase, digit, and symbol.
  - **Token Management (`app.core.tokens`)**: Short-lived signed JWT access tokens (PyJWT, HS256) and cryptographically secure 64-byte refresh tokens stored as SHA-256 hashes in `user_refresh_tokens`.
  - **Token Family Rotation & Replay Attack Detection**: Detects token reuse; revokes the entire token family immediately on reuse attempt.
  - **Authentication Endpoints (`app.api.v1.endpoints.auth`)**:
    - `POST /api/v1/auth/register`: Public registration strictly restricted to `tourist` and `stakeholder` (admin and manager registration rejected).
    - `POST /api/v1/auth/login`: Email and password authentication with neutral error messaging (prevents email enumeration).
    - `POST /api/v1/auth/refresh`: Atomic refresh token rotation.
    - `POST /api/v1/auth/logout`: Refresh token revocation.
    - `GET /api/v1/auth/me`: Authenticated profile endpoint returning verified `SecurityContext` identity and manager jurisdiction.
  - **FastAPI RBAC Dependencies (`app.core.auth`)**: Authoritative database user loading, active account checks, and role guards (`require_tourist`, `require_stakeholder`, `require_manager`, `require_admin`, `require_destination_manager`, `require_state_manager`).
  - **Test Suite**: 32 unit tests passing in 1.23s (13 auth tests, 7 security tests, 8 model tests, 4 health tests). 5 PostgreSQL integration tests prepared for Docker/CI.

### 7.2 Phase 1: Authentication Integration (Completed & Verified)
- **Centralized Vanilla JavaScript API Client (`frontend/js/api.js`)**:
  - Implemented configurable API base URL (`window.YATRASETU_API_BASE` or `http://127.0.0.1:8000/api/v1`).
  - Built-in Bearer authorization header injection with `sessionStorage` token management.
  - Transparent 401 handling with single-attempt refresh token rotation (`POST /api/v1/auth/refresh`), retry, infinite loop guards, and session cleanup on failure.
  - Full support for `login`, `register`, `getProfile`, `logout`, `refreshToken`, and session persistence.
- **Login Integration (`frontend/login.html` & `frontend/js/auth.js`)**:
  - Connected `initLoginForm()` to `POST /api/v1/auth/login`.
  - Sends email and password only; role is authoritatively determined by backend and verified in database.
  - Full loading state handling, error alerts for invalid credentials (401) and deactivated accounts (403).
  - Preserves role-based redirection to `${role}/dashboard.html`.
- **Registration Integration (`frontend/register.html` & `frontend/js/auth.js`)**:
  - Connected `initRegisterForm()` to `POST /api/v1/auth/register`.
  - Frontend password complexity validation harmonized with backend `PasswordSecurity` (min 8 chars, uppercase, lowercase, digit, special character).
  - Public registration restricted strictly to `tourist` and `stakeholder`; manager/admin public registration blocked upfront.
  - Removed client-side mock writes to `yatrasetu_admin_users` and `yatrasetu_audit_trail`.
- **Session Profile & Logout Integration**:
  - Synchronized topbar & sidebar logout buttons in `dashboard.js`, `manager-core.js`, and `tourist.js` to call `window.YatraSetuApi.logout()`.
  - Refresh tokens are revoked in the database before local session keys are cleared.
- **Script Order Verification**:
  - Loaded `js/api.js` before consumer scripts in `login.html`, `register.html`, `manager/dashboard.html`, `tourist/dashboard.html`, `stakeholder/dashboard.html`, and `admin/dashboard.html`.
- **Automated Verification**:
  - All 32 backend tests passed.
  - Node.js API client unit test suite (8 tests) and password complexity validation suite (7 tests) passed.
  - 9 live HTTP server integration tests against running FastAPI backend passed.

## 8. Recommended Immediate Task

**Stage B Stabilization (Batches 1, 2, and 3) Completed & Fully Verified.**

Checklist / Current Status:
1. Manager JavaScript modular refactoring complete & verified (commits `a969479` and `ba4ada9`).
2. Manager Authority and Admin governance integration across workspaces completed and verified end-to-end via interactive browser subagent with zero console errors.
3. Cross-workspace jurisdiction enforcement (State Manager vs Destination Manager, cross-state boundary locks, mandatory reassignment justifications, audit trail logging) verified in browser.
4. **Stabilization Stage B — Batch 1 (BUG-01, BUG-02, BUG-03, BUG-04)**: Fully implemented and verified in multi-tab headless Chrome (registration destination dropdown, unassigned destination fallback, feedback storage consistency and deletion sync, tourist video/stakeholder reflection).
5. **Stabilization Stage B — Batch 2 (BUG-05, BUG-06, BUG-07)**: Fully implemented and verified in multi-tab headless Chrome (listings/media/posts storage persistence across refresh/navigation, script dependency alignment without manager-core pollution, frontend route protection on `/manager/` and `/stakeholder/` without redirect loops).
6. **Stabilization Stage B — Batch 3 (BUG-08, BUG-09, SUSP-01, SUSP-02)**: Fully implemented and verified in multi-tab headless Chrome (dashboard topbar null-safety on badge & notifications, manager video preview namespace alignment with `syncActiveManagerProfile()`, demo credential harmonization matching canonical seed `sahyadri.guides@gmail.com` with `sh-101`, SUSP-02 deferred per project instructions).
7. **Tourist Workspace Controlled Repair & Visual Stabilization (Completed & Verified)**:
   - Header responsive alignment: Added `@media (max-width: 1180px)` rules to prevent link collision and drawer collapse breakpoint at 1080px; zero horizontal overflow across 1440px, 1180px, 1024px, 768px, and 390px viewports.
   - Detail tab grid standardization: Standardized attractions, videos, experiences, stakeholders, and regional circuit grids to `repeat(auto-fill, minmax(280px, 1fr))` with 1.5rem gap.
   - HTML & CSS cleanup: Purged malformed duplicate advisories block in `destination-detail.html` (lines 292-306); replaced 66 inline styles with semantic classes (`detail-tab-header`, `modal-card-lg`, `detail-pill-forest`, etc.), safely reducing inline styles from 110 down to 44. Verified responsive scopes of 31 duplicate selector groups.
   - Resilient local images: Implemented `resolveDestinationImage` and `resolveAttractionImage` routing destinations to authentic local images in `../assets/images/`, with fallbacks and CSS min-height to prevent card collapse; zero broken external URLs remain.
   - Browser verified: All 8 detail tabs, video playback modal, and feedback submission modal confirmed working in visible Chrome with zero console errors.
8. **Tourist CSS Architecture Separation & Component Restoration (Completed & Verified)**:
   - Created dedicated stylesheet `frontend/css/tourist-pages.css` cleanly separating page-specific component styling from shared shell `tourist.css` and application base `style.css`.
   - Linked `../css/tourist-pages.css` across all 8 Tourist HTML pages immediately following `tourist.css` (verified HTTP 200).
   - Restored 66 missing classes from commit `91972d2` (`.dest-state-pill`, `.dest-checkbox-item`, `.tourist-states-grid`, `.dest-card-tags`, `.dest-card-tag`, etc.) and added dedicated component styles for Plan Trip, Stories, Guidance, and Advisories.
   - Standardized mobile navigation drawer across all 8 pages as off-canvas drawer (`#tourist-mobile-nav.tourist-drawer`); eradicated leaked mobile navigation text and full-width saved-destinations bar from desktop viewports.
   - Fixed text contrast in `destination-advisories.html` header banner to crisp white (`#FFFFFF`) against dark green.
   - Fully verified in Chrome across 1440px desktop, 1024px laptop, and 390px mobile with zero console errors and clean visual rendering.
9. **Experience Modal & Prototype Notice Cleanup (Completed & Verified)**:
   - Resolved root cause for non-functional "View Experience Details" buttons: `destination-detail.html` was missing `#touristExperienceModal` in the DOM, causing `openExperienceModal()` to abort silently. Added modal structure to `destination-detail.html` and bound close handlers (close X, footer close button, backdrop click, Escape key) in `initModals()`.
   - Enhanced `openExperienceModal()` with defensive fallbacks for missing experience fields and intelligent destination link handling.
   - Removed prototype demonstration notice banners from `destinations.html` and `dashboard.html`, eliminating all banner markup and leftover spacing while preserving page structure.
   - Verified in headless Chrome CDP across `dashboard.html`, `destinations.html`, `destination-detail.html?id=raigad-fort`, and `experiences.html`.
10. **Favorite/Wishlist ("Fav Button") Full System Repair (Completed & Verified)**:
   - Fixed header topbar favorites heart button (`#tourist-nav-fav-btn`): `openWishlistDrawer()` added `.show`, but `tourist.css` only targeted `.tourist-drawer.active, .tourist-drawer.open`, leaving the drawer at `display: none`. Added `.show` selector support in CSS and synced classes (`show`, `active`, `open`).
   - Added dynamic dimming backdrop overlay (`#tourist-drawer-backdrop`) enabling smooth click-outside-to-close behavior and Escape key closing.
   - Fixed SVG fill synchronization across `.dest-card-fav-btn` and `.detail-fav-btn` (`#EF4444` on save, `none` on remove), real-time header count badge updating, and added toast notifications.
   - Verified in Chrome: drawer opening/closing, real-time item removal, card heart toggling, and detail hero sync.
11. **Next Step**: Await user direction on final review. No new feature development started.


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

- Frontend currently relies on simulated/sample data in browser storage (`auth.js` ready to be wired to `/api/v1/auth/*`).
- Role-specific business CRUD endpoints (Manager attractions/events/videos, Stakeholder profiles/media, Tourist bookings/plans) pending Phase 3+.
- Report export is currently a UI trigger/simulation until backend generation is implemented.
- Real analytics will require defined database fields and aggregation logic.
- Exact GCP service/API selection remains a future implementation decision.
