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
- **Global Loading Performance Optimization & Latency Bottleneck Resolution (Completed & Fully Verified)**:
  - Addressed the 8–10 second navigation loading delay across the application through rigorous Chrome CDP profiling and targeted minimal architectural fixes.
  - Root Cause Diagnosed: Cascading redundant sequential waterfalls of authenticated backend API requests across cross-region PostgreSQL roundtrips (client $\leftrightarrow$ Neon Singapore cluster `ap-southeast-1`), where `manager-core.js` and `manager-views.js` triggered redundant un-cached calls to `/api/v1/manager/events` (3–4× per load) and `tourist.js` sequentially `await`ed 7 catalogue endpoints.
  - Implemented Fix 1 (Manager Request Deduplication & In-Memory Cache): Added in-flight request deduplication promises (`_pendingDestinations`, `_pendingAttractions`, `_pendingEvents`) and in-memory cache checks to `getEvents` and `getAttractions`. Reused resolved destination/event objects in `renderConnectedViews` rather than re-requesting them. Reduced Manager Destinations page load from **8,255.1 ms down to 2,526.2 ms (69.4% reduction, saving 5.7+ seconds)** with API requests reduced from 7 down to 1.
  - Implemented Fix 2 (Tourist Catalogue Parallelization & Session Cache): Replaced the 7-call sequential waterfall in `loadCatalogueFromApi()` with a single `Promise.all` concurrent request, and cached the static catalogue in `sessionStorage` with cross-tab mutation invalidation tracking (`yatrasetu_catalogue_invalidated_at`). Reduced Tourist detail page load from **1,376.9 ms down to 889.8 ms (35% reduction)**.
  - Zero Cache Leakage: Strict cleanup in `api.js` `clearSession()` ensures no data leaks across user sessions or role transitions. Handled failed requests safely without storing incomplete data.
  - Full Backend Verification: 107 of 107 tests passing (including all 18 PostgreSQL RLS tests).
  - Multi-run Chrome CDP benchmark verified across all 5 journeys with zero console errors.
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
- **Phase 3 (Frontend Integration): Destination Manager Integration (Steps 1–5 Completed & Unit Verified)**:
  - **Step 1 (API Client Extension)**: Added 11 manager methods to `frontend/js/api.js` (`getManagerContext`, `getManagedDestinations`, `getManagedDestination`, `getManagedAttractions`, `createManagedAttraction`, `updateManagedAttraction`, `deleteManagedAttraction`, `getManagedEvents`, `createManagedEvent`, `updateManagedEvent`, `deleteManagedEvent`). Included `<script src="../js/api.js">` before consumer scripts in `attractions.html`, `destinations.html`, and `events.html`.
  - **Step 2 (Authoritative Manager Context)**: Connected `YatraSetuManagerContext.init()` in `frontend/js/manager-core.js` to `YatraSetuApi.getManagerContext()`. Manager jurisdiction is derived solely from the backend: destination managers are strictly locked to `assignedDestinationId`; state managers are locked to `assignedStateId`. Handled 401 session expiry and 403 configuration errors via persistent error banner `#mgr-auth-error-banner`.
  - **Step 3 (Manager Store Backend Integration)**: Connected `YatraSetuManagerStore` in `frontend/js/manager-core.js` (`getDestinations()`, `getAttractions()`, `getEvents()`) to backend API endpoints. Applied field normalization (`image_url` → `img`, `date_num` → `dateNum`, `date_month` → `dateMonth`, `location_label` → `location`) while preserving backend UUIDs as record identifiers. Handled empty arrays cleanly without silent fallback to mock data for authenticated sessions.
  - **Step 4 (Attraction CRUD Integration)**: In `frontend/js/manager.js` and `frontend/js/manager-views.js`, connected `#btn-save-attraction`, `#btn-save-edit-attr`, `.btn-attr-delete`, and `#btn-delete-attr-modal` to `YatraSetuApi` attraction methods with schema validation, backend UUID preservation, and feedback via `showManagerToast`.
  - **Step 5 (Event CRUD Integration)**: In `frontend/js/manager.js` and `frontend/js/manager-views.js`, connected `#btn-save-event`, `#btn-save-edit-event`, `.btn-event-delete`, and `#btn-delete-event-modal` to `YatraSetuApi` event methods with length/field validations, backend UUID preservation, and feedback via `showManagerToast`.
  - **Verification**: All 5 modified frontend JavaScript files passed `node -c` syntax checks cleanly. All 58 backend tests passed.
- **Phase 3 (Step 6): Destination Manager End-to-End Browser Verification (Completed & Verified)**:
  - Verified unauthenticated security boundary: all `/manager/*.html` pages immediately redirect unauthenticated visitors to `/login.html` via `checkManagerAuth()`.
  - Verified API security boundary: `GET /api/v1/manager/context`, `/destinations`, `/attractions`, and `/events` all return `HTTP 401 Unauthorized` without a valid Bearer token.
  - Two read-only security audits completed on administrative fixture provisioning and cleanup strategy.
  - Five deterministic E2E test fixtures provisioned on isolated Neon test branch (`POSTGRES_TEST_URL`) using `yatrasetu_admin` (1 destination `rajgad-fort`, 1 manager user, 1 assignment, 1 attraction `Padmavati Machi`, 1 event `Rajgad Heritage Trek`).
  - Migration `006_auth_login_lookup.py` applied, resolving PostgreSQL RLS unauthenticated login lookup and refresh token validation via strict `SECURITY DEFINER` functions with fixed search paths.
  - Standardized `<script src="../js/api.js"></script>` across all 11 Manager HTML pages. Added in-memory destination caching to `manager-core.js` and guarded event rendering in `manager-views.js`.
  - Executed automated headless Chrome CDP suite (`scratch/run_browser_e2e_suite.js`) against live FastAPI backend (`127.0.0.1:8000`, `yatrasetu_app`) and frontend (`http://localhost:8080`):
    - **Step 1 (Target & Health)**: Verified FastAPI health (`/health`) and PostgreSQL connection (`/api/v1/health/db`), confirming isolated test branch (`ep-floral-silence`).
    - **Step 2 (Authentication Flow)**: Verified login page rendering, manager role pill selection, negative login rejection (401 on bad password), valid login redirect to `manager/dashboard.html`, session storage persistence (`yatrasetu_role = manager`, `email = manager.rajgad@example.com`, `name = Rajesh Patil`, scope = `rajgad-fort`), and session preservation across page refresh.
    - **Step 3 (All 10 Manager Pages)**: Verified all 10 Manager pages loaded cleanly with zero uncaught JavaScript errors, scoped to `rajgad-fort` (Dashboard, Destinations, Attractions, Events, Stakeholders, Visitor Statistics, Feedback, Analytics, Reports, Decision Support).
    - **Step 4A (Attraction CRUD)**: Seeded fixture `Padmavati Machi` loaded and listed from Neon database. Created `Browser E2E Sanjivani Machi` (`POST 201 Created`), updated category to `Updated Fortification` via modal (`PUT 200 OK`), deleted via `.btn-attr-delete` (`DELETE 200 OK`), and verified persistence of deletion across page reload.
    - **Step 4B (Event CRUD)**: Seeded fixture `Rajgad Heritage Trek` loaded and listed from Neon database. Created `Browser E2E Conservation Camp` (`POST 201 Created`), updated location to `Updated Padmavati Complex` via modal (`PUT 200 OK`), deleted via `.btn-event-delete` (`DELETE 200 OK`), and verified persistence of deletion across page reload.
    - **Step 5 (Logout & Access Protection)**: User menu logout cleared session storage (`token = null`, `role = null`) and redirected to `login.html`. Direct post-logout navigation to `/manager/dashboard.html` successfully blocked and redirected to `login.html`.
    - **Step 6 (Diagnostics & Artifacts)**: Captured 124 API calls, confirmed 0 uncaught runtime exceptions, wrote detailed diagnostic report `mgr_browser_e2e_report.json`, and generated 20 high-resolution screenshots saved in the artifact directory.
  - Verified post-test database state: confirmed only the 5 initial fixture records remain in the test database.
- **Phase 7 (Step 1): Stakeholder RLS Migration 007 (Completed & Verified)**:
  - Created Alembic migration `backend/alembic/versions/007_stakeholder_rls.py` chained from `006_auth_login_lookup`.
  - Added PostgreSQL Row-Level Security INSERT policy `p_stakeholder_services_insert` on `public.stakeholder_services` enforcing:
    - Admin authorization: `current_setting('app.current_role', true) = 'admin'`.
    - Authenticated Stakeholder authorization:
      - `current_setting('app.current_role', true) = 'stakeholder'`
      - `user_id::text = current_setting('app.current_user_id', true)` (prevents inserting for other accounts)
      - `role_id = 'stakeholder'`
      - `verification_status = 'pending'` (prevents self-approval/self-verification)
      - Destination consistency: `EXISTS (SELECT 1 FROM destinations d WHERE d.id = stakeholder_services.destination_id AND d.state_id = stakeholder_services.state_id)`.
  - Enforced `ALTER TABLE stakeholder_services FORCE ROW LEVEL SECURITY;`.
  - Preserved existing `p_stakeholder_services_select` and `p_stakeholder_services_modify` policies intact.
  - Successfully applied and verified upgrade, rollback (`downgrade -1`), and re-upgrade on isolated Neon test branch (`POSTGRES_TEST_URL`). Alembic revision is `007_stakeholder_rls`. Production (`DATABASE_URL`) was completely untouched and remains at `004_gov_storage_rls`.
  - Verified 12 PostgreSQL RLS tests under runtime role `yatrasetu_app` (`NOBYPASSRLS`):
    - Valid stakeholder INSERT with pending status succeeds.
    - INSERT for another user fails (InsufficientPrivilege).
    - INSERT with manager role fails (InsufficientPrivilege).
    - INSERT with verified status fails (InsufficientPrivilege).
    - Non-existent destination assignment fails (InsufficientPrivilege).
    - Mismatched state/destination assignment fails (InsufficientPrivilege).
    - Tourist cannot see pending service (count=0).
    - Tourist cannot insert service (InsufficientPrivilege).
    - Jurisdiction manager can inspect pending service (count=1).
    - Out-of-jurisdiction manager cannot see pending service (count=0).
    - Stakeholder can update own business info via UPDATE.
    - Stakeholder cannot self-approve via UPDATE (InsufficientPrivilege).
  - All 58 backend tests passed; Neon database fixture records preserved cleanly.
- **Phase 7 (Step 2): Stakeholder Backend Schemas & Endpoints (Completed & Verified)**:
  - Created Pydantic schemas in `backend/app/schemas/stakeholder.py`:
    - Profile: `StakeholderProfileResponse`, `StakeholderProfileUpdate`, `StakeholderServiceRegisterRequest`.
    - Destination Advisories: `StakeholderAdvisoryResponse`.
    - Manager Suggestions: `StakeholderSuggestionCreate`, `StakeholderSuggestionResponse`.
    - Media Gallery: `StakeholderMediaCreate`, `StakeholderMediaUpdate`, `StakeholderMediaResponse`.
    - Service Offerings: `ServiceOfferingCreate`, `ServiceOfferingResponse`.
  - Exported all schemas via `backend/app/schemas/__init__.py`.
  - Implemented 10 REST endpoints in `backend/app/api/v1/endpoints/stakeholder.py`:
    - `GET /api/v1/stakeholder/profile`: Returns verified profile, service details, and destination lock status.
    - `PUT /api/v1/stakeholder/profile`: Updates business name, category, and contact details. Enforces destination locking (400 Bad Request on attempt to change destination).
    - `POST /api/v1/stakeholder/service`: Registers initial commercial service bound to destination with status `'pending'`.
    - `GET /api/v1/stakeholder/destination-updates`: Returns active official advisories for assigned destination.
    - `GET /api/v1/stakeholder/suggestions`: Lists operational notices and suggestions submitted by this stakeholder.
    - `POST /api/v1/stakeholder/suggestions`: Creates a new suggestion post (`StakeholderPost` with `post_type = 'suggestion'`).
    - `GET /api/v1/stakeholder/media`: Lists photos and promotional videos uploaded by the authenticated stakeholder.
    - `POST /api/v1/stakeholder/media`: Adds a photo/video record with media URL validation (http/https).
    - `PUT /api/v1/stakeholder/media/{id}`: Updates owned media item caption, description, or URL.
    - `DELETE /api/v1/stakeholder/media/{id}`: Deletes owned media record.
    - `GET /api/v1/stakeholder/offerings`: Lists offerings from `contact_info['services']`.
    - `POST /api/v1/stakeholder/offerings`: Adds a new service offering item.
    - `DELETE /api/v1/stakeholder/offerings/{id}`: Removes an offering item.
  - Registered router in `backend/app/api/v1/api.py` under prefix `/stakeholder` with `require_stakeholder` guard.
  - Transaction boundary resilience: Populated response payloads prior to `db.commit()` to avoid session expiration under transaction-scoped PostgreSQL RLS boundaries.
  - Added unit test suite `backend/tests/test_stakeholder_api.py` (12 tests, 100% pass). Full test suite status: 70 passed, 18 skipped in 5.33s.
  - Verified 19 live PostgreSQL integration tests via `scratch/test_live_stakeholder_api.py` against isolated Neon test branch using `yatrasetu_app` (`NOBYPASSRLS`): 100% pass across profile, registration, destination locking, advisories, suggestions, media CRUD, cross-user denial, and offerings. Teardown cleaned all temporary records. Neon database fixture records preserved cleanly.
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

## 5. Phase 9 — Administrator Governance Workspace End-to-End
**Status: COMPLETED & FULLY VERIFIED (Full-Stack Backend + PostgreSQL Database + Browser E2E + Write Operations Audit)**

### Full-Stack Implementation & Verification:
- **Backend API Schemas & Endpoints (`backend/app/schemas/admin.py`, `backend/app/api/v1/endpoints/admin.py`)**:
  - Implemented 12 Pydantic schemas and **11 registered administrative endpoints** under `/api/v1/admin`, all strictly guarded by `require_admin` dependency:
    1. `GET /api/v1/admin/stats` (Platform aggregate metrics)
    2. `GET /api/v1/admin/users` (Paginated user directory with role/status/search filters)
    3. `PUT /api/v1/admin/users/{user_id}/status` (User activation, suspension, and deactivation with mandatory audit trail)
    4. `DELETE /api/v1/admin/users/{user_id}` (Controlled soft-deactivation and refresh token revocation; self-deletion guarded)
    5. `GET /api/v1/admin/managers` (Assigned managers directory with jurisdiction scoping)
    6. `POST /api/v1/admin/managers/assign` (State Manager vs Destination Manager jurisdiction assignment and reassignment)
    7. `POST /api/v1/admin/stakeholders/{service_id}/reassign-destination` (Controlled destination reassignment requiring min 6-char justification)
    8. `GET /api/v1/admin/registrations` (Commercial business registration queue with status/state/destination filters)
    9. `PUT /api/v1/admin/registrations/{service_id}/status` (Approve/verify, reject, or suspend commercial registration)
    10. `GET /api/v1/admin/audit-logs` (Immutable governance audit trail ledger)
    11. `GET /api/v1/admin/roles` (Canonical RBAC permissions matrix)
  - Self-deactivation and self-deletion strictly rejected with HTTP 400.
  - Non-admin callers (tourist/stakeholder/manager) strictly rejected with HTTP 403 Forbidden.
  - Transaction-atomic audit logging into `audit_logs` table under PostgreSQL RLS (`yatrasetu_app`).
  - Unit test suite `backend/tests/test_admin_api.py` (**9/9 passed**); full backend test suite **86 passed, 18 skipped (live docker fixtures), 0 failures** in 5.31s.
  - Verified write operations suite (`scratch/verify_admin_write_operations.py`): **All 5 write operations passed (100%)** against isolated Neon test branch (`ep-floral-silence`) using runtime role `yatrasetu_app` (`NOBYPASSRLS`).
- **Frontend API Client & Controller Integration (`frontend/js/api.js`, `frontend/js/admin.js`)**:
  - Extended `frontend/js/api.js` with 11 admin client methods.
  - Connected `frontend/js/admin.js` to live APIs across all 7 dashboard tabs.
  - **Mock Data Elimination**: Removed silent mock-data fallback from connected workflows (`initAdminMetrics`, `renderAdminAccountsTable`, `renderAdminRegistrationsTable`, `renderAdminManagersView`, `renderAdminAuditTrailView`, `renderAdminDestinationsView`). Clean empty and error states rendered when live data is empty or unavailable.
  - **Admin Identity & Provisioning**: Derived topbar and sidebar identity directly from authenticated session storage (`yatrasetu_name`, `yatrasetu_email`, `yatrasetu_user_id`), eliminating hardcoded fallback names. Verified no public admin registration in UI and schema (`validate_public_registration_role` enforces `tourist` or `stakeholder` only).
  - Strict route protection (`checkAdminAuth`): requires active `admin` role and valid JWT access token.
- **Browser E2E Chrome CDP Verification (`scratch/run_admin_browser_e2e.js`)**:
  - **11 verification flows executed and passed** with **13 screenshot artifacts** captured in artifact directory.
  - 0 unhandled console errors.

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


## 6. Phase 10 — Full System Integration, Cross-Role Regression & Submission Readiness
**Status: COMPLETED & FULLY VERIFIED (Full-Stack Regression + Cross-Role Auth & Workflows + Consistency Audit + Read-Only Production Security Audit)**

### Full-System Verification & Regression Results:
- **Full Backend Regression Suite (`pytest backend/tests/ -v`)**:
  - Live PostgreSQL RLS Execution: Configured `POSTGRES_TEST_URL` targeting isolated Neon test branch (`ep-floral-silence`) running under runtime role `yatrasetu_app` (`NOBYPASSRLS`).
  - **104 collected, 104 passed, 0 skipped, 0 failed in 29.21s**.
  - All 18 live PostgreSQL RLS tests passed in single test run (`backend/tests/test_postgres_rls.py`), validating RLS boundaries, tenant isolation, security-definer lookup functions, token family invalidation, and cascade constraints.
- **Cross-Role Authentication & Access Control Verification**:
  - **4 Role Logins**: Destination Manager, Tourism Stakeholder, Tourist Explorer, and Platform Administrator successfully authenticated, received valid JWT token pairs, verified identity via `GET /api/v1/auth/me`, and confirmed expected client-side redirect destinations (`/manager/destinations.html`, `/stakeholder/profile.html`, `/tourist/explore.html`, `/admin/dashboard.html`).
  - **Negative Authentication**: Bad credentials strictly rejected with `HTTP 401 Unauthorized`.
  - **Session Lifecycle**: Refresh token rotation verified with issuance of new access tokens. Old refresh token reuse detected and rejected with `HTTP 401 Unauthorized` (family revocation). Explicit logout (`POST /api/v1/auth/logout`) successfully invalidates the active refresh token.
  - **Direct URL & Route Protection**: Unauthenticated requests to protected endpoints across all 4 roles strictly denied with `HTTP 401 Unauthorized`.
  - **Cross-Role Access Denial Matrix**: 100% of cross-role unauthorized access attempts rejected with `HTTP 403 Forbidden` across all 7 negative test vectors (Tourist -> Manager/Admin/Stakeholder, Stakeholder -> Admin/Manager, Manager -> Admin/Stakeholder).
- **Core Role Workflows Verification**:
  - **Destination Manager**: Context retrieval (`GET /manager/context`), Attraction full lifecycle (`POST`, `GET`, `PUT`), Event full lifecycle (`POST`, `GET`, `PUT`), and Managed destination inspection verified under assigned jurisdiction (`rajgad-fort`).
  - **Tourism Stakeholder**: Business profile retrieval (`GET /stakeholder/profile`), destination updates/advisories (`GET /stakeholder/destination-updates`), manager suggestion submission (`POST /stakeholder/suggestions`), media metadata record creation (`POST /stakeholder/media`), service offering addition (`POST /stakeholder/offerings`) and deletion (`DELETE /stakeholder/offerings/{id}`), destination mutation lock (`PUT /stakeholder/profile` returning HTTP 400).
  - **Tourist Explorer**: Profile & travel preferences update (`PUT /tourist/profile`), destination favorites lifecycle (`POST`/`GET /tourist/favorites`), trip plan creation with ordered stops (`POST /tourist/itineraries`), 5-star destination review submission (`POST /tourist/reviews`), destination advisories query (`GET /tourist/advisories/{dest_id}`).
  - **Platform Administrator**: Database-backed platform telemetry (`GET /admin/stats`), user directory (`GET /admin/users`), commercial registrations queue (`GET /admin/registrations`), manager jurisdictions directory (`GET /admin/managers`), canonical 4-role RBAC matrix (`GET /admin/roles`), immutable audit trail (`GET /admin/audit-logs`).
- **Cross-Role Data Consistency Verification**:
  - Manager-created attraction (`bcfac1c2...`) and event (`e5e06dfc...`) immediately visible in public tourist catalogue (`/api/v1/attractions`, `/api/v1/events`).
  - Destination advisories consistent across Tourist and Stakeholder feeds.
  - Tourist review persisted and retrieved with full fidelity via `/api/v1/tourist/reviews/{dest_id}`.
  - Stakeholder suggestion persisted and retrieved with full fidelity via `/api/v1/stakeholder/suggestions`.
  - Admin business registration verification status change (`PUT /api/v1/admin/registrations/{service_id}/status`) immediately reflected in Stakeholder profile (`GET /api/v1/stakeholder/profile`), and cleanly reverted back to `pending`.
  - Guaranteed cleanup teardown purged all 7 temporary test entities; zero orphan records left on test branch.
- **Production Database Security Audit (Strictly Read-Only on `DATABASE_URL` / `ep-lively-violet`)**:
  - **Alembic Revision**: `007_stakeholder_rls` (schema is up to date).
  - **Table RLS & FORCE RLS**: All 20 application/business tables have `RLS=True, FORCE_RLS=True`. 8 public reference tables have `RLS=False, FORCE_RLS=False`.
  - **Security Definer Functions**: Exactly 2 authentication functions exist (`lookup_user_for_authentication`, `lookup_refresh_token_for_rotation`), owned by `neondb_owner`, with `EXECUTE` privileges.
  - **Production Connection User**: `neondb_owner`.
  - **Runtime Role Observation**: Role `yatrasetu_app` DOES NOT EXIST on production Neon branch; production application currently connects as `neondb_owner` (not `yatrasetu_app`).
  - **Production Admin Accounts**: 0 accounts (no fake or demo accounts created).

## 7. Database Schema Foundation (Alembic Migrations 001–007)
**Status: COMPLETED & PRODUCTION PROMOTED (001–007)**

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

### 7.3 Phase 3: Destination Manager Frontend Integration (Steps 1–5 Complete, Step 6 Paused on Test Provisioning)
- **Step 1: Manager API Client Extension (`frontend/js/api.js`)**:
  - Implemented 11 manager methods: `getManagerContext()`, `getManagedDestinations()`, `getManagedDestination(id)`, `getManagedAttractions()`, `createManagedAttraction(payload)`, `updateManagedAttraction(id, payload)`, `deleteManagedAttraction(id)`, `getManagedEvents()`, `createManagedEvent(payload)`, `updateManagedEvent(id, payload)`, `deleteManagedEvent(id)`.
  - Reused existing `request()` pipeline (bearer injection, token rotation, base URL config).
  - Included `<script src="../js/api.js">` in `attractions.html`, `destinations.html`, and `events.html`.
- **Step 2: Authoritative Manager Context (`frontend/js/manager-core.js`)**:
  - `YatraSetuManagerContext.init()` calls `YatraSetuApi.getManagerContext()` when an access token is present.
  - Derived profile and jurisdiction strictly from verified backend response (`user_id`, `role`, `scope`, `state_id`, `destination_id`).
  - Destination managers locked to assigned destination; state managers locked to assigned state.
  - Expired tokens redirect via `checkManagerAuth()`; 403 configuration errors render persistent top-level `#mgr-auth-error-banner`.
- **Step 3: Manager Store Backend Integration (`frontend/js/manager-core.js`)**:
  - Connected `YatraSetuManagerStore.getDestinations()`, `getAttractions()`, `getEvents()` to backend endpoints.
  - Normalized backend schemas into frontend format (`image_url` → `img`, `date_num` → `dateNum`, `date_month` → `dateMonth`, `location_label` → `location`).
  - Preserved backend UUIDs as record identifiers. Empty API results return clean `[]` (no silent mock data fallback for authenticated sessions).
- **Step 4: Attraction CRUD UI Integration (`frontend/js/manager.js` & `frontend/js/manager-views.js`)**:
  - Connected `#btn-save-attraction` to `YatraSetuApi.createManagedAttraction()` with schema validation.
  - Connected `#btn-save-edit-attr` to `YatraSetuApi.updateManagedAttraction()` preserving backend UUIDs.
  - Connected `.btn-attr-delete` and `#btn-delete-attr-modal` to `YatraSetuApi.deleteManagedAttraction()`.
  - Added user feedback via `showManagerToast` and dynamic table/category refreshes.
- **Step 5: Event CRUD UI Integration (`frontend/js/manager.js` & `frontend/js/manager-views.js`)**:
  - Connected `#btn-save-event` to `YatraSetuApi.createManagedEvent()` with `EventCreate` schema validation.
  - Connected `#btn-save-edit-event` to `YatraSetuApi.updateManagedEvent()` preserving backend UUIDs.
  - Connected `.btn-event-delete` and `#btn-delete-event-modal` to `YatraSetuApi.deleteManagedEvent()`.
  - Added user feedback via `showManagerToast` and dynamic table refreshes.
- **Step 6: End-to-End Browser Verification & Test Provisioning Execution (Authentication & PostgreSQL Integration Complete)**:
  - **Part 1 (Target Safety Check)**: PASS. Verified that `POSTGRES_ADMIN_URL` and `POSTGRES_TEST_URL` target the same isolated test branch (`ep-floral-silence-az89diu6-pooler`), completely isolated from production (`DATABASE_URL`). Verified `current_user` possesses `BYPASSRLS`, database is `neondb`.
  - **Part 2 (Fixture Provisioning & Normalization)**: PASS. Executed `scratch/provision_test_fixtures.py` using dedicated administrative connection with `BYPASSRLS`. Created exactly 5 records: Destination (`rajgad-fort`), Manager User (`manager.rajgad@example.com`), Manager Assignment (linking to `maharashtra` and `rajgad-fort`), Attraction (`Padmavati Machi`), and Event (`Rajgad Heritage Trek`). Normalized email to `@example.com` to pass Pydantic RFC 2606 `EmailStr` validation. Verified 100% foreign key integrity. Argon2id credentials securely stored in gitignored `.test_manager_credentials.json`.
  - **Part 3 (PostgreSQL Migration 006 & Authentication Flow)**: PASS.
    - Implemented Migration `006_auth_login_lookup.py` chained from `005_catalogue_rls`. Created narrow `SECURITY DEFINER` functions `public.lookup_user_for_authentication(lookup_email text)` and `public.lookup_refresh_token_for_rotation(lookup_hash text)` owned by `neondb_owner` with `SET search_path = pg_catalog, pg_temp` and schema qualification. Revoked execute from `PUBLIC`; granted strictly to `yatrasetu_app`.
    - Updated `backend/app/core/auth.py` to set `app.current_user_id` immediately upon JWT cryptographic verification before querying `User`.
    - Updated `backend/app/api/v1/endpoints/auth.py` (`login_user`, `refresh_token`, `logout_user`) to resolve user/token identities securely under `FORCE ROW LEVEL SECURITY`, pre-extracting model attributes before transaction commits to prevent lazy loading failures across `is_local = true` transaction boundaries.
    - Applied Migration 006 to isolated Neon test branch (`006_auth_login_lookup`). Production remains un-migrated (`004_gov_storage_rls`).
  - **Part 4 & 5 (Manager Context, Catalog & Security Verification)**: PASS.
    - Executed `scratch/test_postgres_e2e_verification.py` against isolated test branch using runtime role `yatrasetu_app` (`NOBYPASSRLS`).
    - Direct SELECT on `users` and `user_refresh_tokens` returns 0 rows (fail-closed RLS verified).
    - Login rejected on bad password (401); succeeds on valid credentials (200) returning JWT access/refresh tokens and destination scope (`rajgad-fort`, `maharashtra`).
    - `/api/v1/auth/me` and `/api/v1/manager/context` return verified identity and destination authority.
    - Cross-jurisdiction access to unauthorized destinations (e.g. `munnar`) blocked with 403.
    - Refresh token rotation succeeds; replay attack detection revokes token family (401).
    - Logout invalidates active token (200); subsequent refresh rejected (401).
    - Attraction CRUD (Create, List, Retrieve, Update, Delete, 404 confirmation) and Event CRUD verified 100% under PostgreSQL RLS. Cross-destination creations blocked with 403.
  - **Part 6 (Browser E2E Verification — Completed & Verified)**:
    - Executed Chrome CDP headless browser E2E test suite (`scratch/run_browser_e2e_suite.js`) against live FastAPI server connected to isolated Neon test branch (`yatrasetu_app`).
    - Verified: Invalid login rejection (401), valid manager login (200), authoritative role redirect to `manager/dashboard.html`, topbar badge & destination reflection, destination scope locking, attraction CRUD (create, table reflection, delete, cleanup), event CRUD (create, table reflection, delete, cleanup), and secure logout.
    - Zero console errors recorded across entire session; 20 artifacts/screenshots captured.
  - **Part 7 (Testing & Regression)**: 58 backend tests passed, 18 skipped. All frontend JavaScript files passed syntax checks cleanly.

### 7.4 Phase 7: Tourism Stakeholder Workspace Backend & Frontend Integration (Completed & Verified)
- **Step 1: PostgreSQL RLS Migration 007 (`007_stakeholder_rls.py`)**:
  - Implemented missing `p_stakeholder_services_insert` policy on `stakeholder_services` chained from `006_auth_login_lookup`.
  - Enforced strict security conditions: user_id equals `app.current_user_id`, role equals `'stakeholder'`, and status defaults strictly to `'pending'`. Self-approval/verification prevented at database level.
  - Upgraded, downgraded (`-1`), and re-upgraded isolated Neon test branch (`007_stakeholder_rls`).
  - 12 PostgreSQL RLS tests in `scratch/test_stakeholder_rls_suite.py` passed 100% under `yatrasetu_app` (`NOBYPASSRLS`).
- **Step 2: Stakeholder Backend Schemas & API Endpoints**:
  - Created `backend/app/schemas/stakeholder.py` with 11 Pydantic models for Profile, Registration, Advisories, Suggestions, Media, and Offerings.
  - Created `backend/app/api/v1/endpoints/stakeholder.py` with 10 REST endpoints registered under `/api/v1/stakeholder`.
  - Enforced RBAC (`require_stakeholder`), destination locking (400 on destination change attempt after registration), and owner isolation on media/offerings.
  - Created `backend/tests/test_stakeholder_api.py` (12 unit tests passing).
  - Executed `scratch/test_live_stakeholder_api.py` (19/19 live PostgreSQL tests passing against Neon test branch).
- **Step 3: Frontend API Client & Workspace Integration (`frontend/js/api.js` & `frontend/js/stakeholder.js`)**:
  - Added 13 stakeholder API methods and `hasToken()` alias in `frontend/js/api.js`.
  - Added `<script src="../js/api.js"></script>` across all 5 stakeholder HTML pages (`dashboard.html`, `profile.html`, `destination-updates.html`, `connections-reviews.html`, `media-listings.html`).
  - Connected `frontend/js/stakeholder.js`:
    - `initStakeholderContext()` queries `YatraSetuApi.getStakeholderProfile()`, sets destination lock, and updates topbar/sidebar.
    - `initStakeholderOverview()` queries destination updates and suggestions, driving metric cards.
    - `initStakeholderProfilePage()` enforces destination lock, disables dropdown, and handles profile updates.
    - `initStakeholderDestinationUpdates()` queries live advisories, scopes local attractions/events, and handles search filtering.
    - `initStakeholderConnectionsReviews()` renders suggestions table, submits suggestions to Destination Manager, and displays honest deferred notice for tourist reviews.
    - `initStakeholderMediaListings()` supports media gallery upload via browser DataTransfer/File API, verification status badge ('Pending Approval'), media deletion, and service offerings CRUD.
- **Step 4: Provisioned Stakeholder Test Fixture on Neon Test Branch**:
  - Created user `stakeholder.rajgad@example.com` (`54623e46-0025-4da6-8ffb-c777cf87a2f2`, Suresh Deshmukh), service `Sahyadri Trekking Guides Co-op` (`353282f5-1b39-4eb8-982c-d0afd1665483`), destination `rajgad-fort`, and verified advisory `Monsoon Trail Advisory`.
  - Stored test credentials in `.test_stakeholder_credentials.json`.
- **Step 5: Headless Chrome CDP Browser End-to-End Verification**:
  - Executed `scratch/run_stakeholder_browser_e2e.js` against live FastAPI server and frontend server.
  - 18 comprehensive verification steps passed:
    1. Initial login page load
    2. Negative login test (invalid credentials rejected with 401)
    3. Positive login test (valid credentials authenticate and redirect to `stakeholder/dashboard.html`)
    4. Topbar user badge, initials ("SD"), role ("Tourism Stakeholder"), and sidebar destination ("Rajgad Fort") validated
    5. Destination lock enforcement verified: dropdown is disabled and lock notice displayed
    6. Profile contact details update and live card preview synchronization validated
    7. Destination updates loaded live advisory ("Monsoon Trail Advisory") from test database
    8. Search filter input validated on advisories
    9. Suggestion creation via modal submitted to Destination Manager and rendered in table with "Pending" status
    10. Tourist Reviews tab honest deferred notice verified
    11. Media photo upload simulated via DataTransfer API, verified in gallery with "Pending Approval" status badge
    12. Media deletion verified via confirmation modal
    13. Service offering creation verified via listing modal and reflected in offerings grid
    14. Service offering deletion verified via confirmation modal
    15. Secure logout via topbar user dropdown verified, redirecting to `login.html`
    16. Route protection verified: direct unauthenticated access to `stakeholder/dashboard.html` immediately ejected to `login.html`
    17. Console audit: 0 console errors recorded across the entire session
    18. 18 high-resolution PNG screenshots captured and saved to artifacts directory
- **Step 6: Teardown & Regression Verification**:
  - Cleaned up temporary test suggestions and reset profile contact info on test database.
  - Full backend test suite: 70 passed, 18 skipped in 5.42s.
  - PostgreSQL RLS suite: 12/12 passed.
  - Live API integration suite: 19/19 passed.
- **Step 7: Production Promotion & Controlled Deployment (Completed & Verified)**:
  - Conducted pre-deployment audit on production Neon branch (`ep-lively-violet`): verified initial revision `004_gov_storage_rls`, 28 public tables, 23 active RLS policies, 2 users, 3 refresh tokens, 8 states, 4 roles, and zero records in 23 tables.
  - Established backup and recovery readiness: verified Neon PITR restore point (WAL LSN `0/20035A0`, UTC timestamp `2026-11-19 11:42:18.983140+00:00`), and local logical snapshot (`scratch/production_backup_004_gov_storage_rls.json`).
  - Executed controlled sequential migration upgrade via Alembic:
    - Revision `005_catalogue_rls`: enabled & forced RLS on `destinations`, `attractions`, and `events`; added 12 catalogue policies; replaced obsolete `p_destination_advisories_modify` with separate `insert`, `update`, `delete` policies.
    - Revision `006_auth_login_lookup`: created `public.lookup_user_for_authentication` and `public.lookup_refresh_token_for_rotation` functions owned by `neondb_owner` (`BYPASSRLS`), `SECURITY DEFINER`, with isolated `search_path = pg_catalog, pg_temp`, execution revoked from `PUBLIC`.
    - Revision `007_stakeholder_rls`: added `p_stakeholder_services_insert` on `stakeholder_services` enforcing strict identity, role, and pending status constraints.
  - 100% Post-Migration Verification: confirmed production revision is `007_stakeholder_rls`, 28 tables intact, 38 active RLS policies (0% divergence with test branch), SECURITY DEFINER functions active with execution revoked from PUBLIC, existing production data (2 users, 3 tokens, 8 states, 4 roles) 100% intact, zero test fixture contamination, and safe read-only smoke tests passed.
  - Verified test branch regression status: 30/30 backend PostgreSQL RLS and stakeholder API integration tests passed.
- **Phase 8: Tourist Workspace Full Stack Integration & E2E Verification (Completed & Verified)**:
  - Verified database model and RLS parity: confirmed trip_plans, trip_plan_items, user_favorites, and destination_reviews exist with active RLS on both test and production Neon databases. Zero new database migrations required.
  - Implemented backend schemas (backend/app/schemas/tourist.py) and REST API router (backend/app/api/v1/endpoints/tourist.py):
    - Profile: GET /api/v1/tourist/profile, PUT /api/v1/tourist/profile
    - Wishlist / Favorites: GET /api/v1/tourist/favorites, POST /api/v1/tourist/favorites, DELETE /api/v1/tourist/favorites/{destination_id}
    - Custom Itineraries / Trip Plans: GET /api/v1/tourist/itineraries, GET /api/v1/tourist/itineraries/{plan_id}, POST /api/v1/tourist/itineraries, PUT /api/v1/tourist/itineraries/{plan_id}, DELETE /api/v1/tourist/itineraries/{plan_id}
    - Destination Reviews: GET /api/v1/tourist/reviews/{destination_id}, POST /api/v1/tourist/reviews (enforcing author isolation, pending review status, and own-review visibility)
    - Destination Advisories: GET /api/v1/tourist/advisories/{destination_id}
  - Connected frontend client (frontend/js/api.js) with 13 tourist methods.
  - Wired frontend controller (frontend/js/tourist.js) to live endpoints:
    - User session initialization and topbar badge sync (Hi, Ananya, Tourist Member, initials AS).
    - Wishlist toggles and off-canvas drawer sync.
    - Custom itinerary generator and Save to My Trips persistent cloud itineraries.
    - Destination detail review feedback modal submission and live list re-rendering.
    - Destination advisories page live manager bulletins display.
    - Secure sign-out purging tokens from sessionStorage and localStorage.
  - Backend integration test suite (backend/tests/test_tourist_api.py): 7/7 tests passed.
  - Live Neon test branch API integration verification (scratch/test_live_tourist_api.py): 7/7 steps passed (100%).
  - Full backend test suite regression: 77 passed, 18 skipped (0 failures).
  - Headless Chrome CDP browser E2E verification (scratch/run_tourist_browser_e2e.js):
    1. Negative login rejection with invalid credentials verified.
    2. Positive login redirection to tourist/dashboard.html verified.
    3. User profile and badge identity synchronization verified.
    4. Wishlist favorite toggle and drawer rendering verified.
    5. Custom itinerary generated and saved to database verified in Wishlist/My Trips tab.
    6. Destination review submitted via modal and rendered under Reviews verified.
    7. Live manager advisories on destination-advisories.html?id=rajgad-fort verified.
    8. User sign-out and session token purge verified.
    9. Console audit: 0 unhandled JavaScript errors across the entire test session.
    10. 12 high-resolution screenshots and full report saved to artifacts directory.
  - Test data cleanly purged from test branch.

## 8. Current Phase & Status

- **Phase 1–5: Core Setup, Database, Models, Auth, Catalogue:** Completed & Verified.
- **Phase 6: Destination Manager Workspace:** Completed & Browser-Verified.
- **Phase 7: Tourism Stakeholder Workspace:** Completed, Browser-Verified & Production-Promoted.
- **Phase 8: Tourist Workspace:** Completed & Browser-Verified.
- **Phase 9: Platform Administrator Workspace:** Completed & Browser-Verified.
- **Phase 10: Full System Integration & Regression:** Completed & Verified (104/104 tests passed, 18 RLS tests passed).
- **Phase 11: Production Security & Least-Privilege Role Provisioning:** Completed & Verified (`yatrasetu_app` provisioned with `NOBYPASSRLS` and 28 table least-privilege grants on `ep-lively-violet`).
- **Phase E: Production Tourism Catalogue Seeding:** Completed & Verified on `ep-lively-violet` / `neondb`:
  - 13 destinations, 7 attractions, 4 events, 2 curated circuits, 5 items, 2 experiences, 2 videos, 2 stories, 2 sample reviews, 14 sample telemetry records.
  - Zero operational accounts created; 2 existing tourist users and 3 refresh tokens preserved.
  - 100% idempotent; 0 broken foreign keys.
  - Verified reads under `yatrasetu_app` under RLS.

**Recommended Next Step:**
Awaiting user approval for the Render `DATABASE_URL` cutover from `neondb_owner` to `yatrasetu_app` and post-cutover health verification.


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


---

## 2026-11-20 — Destination Manager & Tourist Workspace Integration Audit, Root-Cause Fix, and End-to-End Verification

- **Disclaimer & Notice Removal:**
  - Removed all `tourist-demo-banner` elements across tourist HTML pages (`destination-detail.html`, `destination-advisories.html`, `experiences.html`, `plan-trip.html`, `stories.html`, `travel-guidance.html`).
  - Removed "Scope Notice" cards and prototype rating tags from `destination-detail.html`.
- **Database Migration 008 Applied on Neon Test Branch (`ep-floral-silence`):**
  - Enhanced `destination_videos` with full schema (`category`, `description`, `video_url`, `status`, `updated_at`).
  - Enabled and forced RLS on `destination_videos` with 4 policies.
  - Hardened `p_destinations_insert` to Admin-only; enabled `p_destinations_update` for managers in their assigned jurisdiction.
- **REST APIs Implemented & Verified:**
  - `GET /destinations/{id}/videos` & `GET /videos` (public video catalogue).
  - `GET /manager/videos`, `POST /manager/videos`, `GET /manager/videos/{id}`, `PUT /manager/videos/{id}`, `DELETE /manager/videos/{id}` (manager video management).
  - `PUT /manager/destinations/{id}` (manager destination overview and profile persistence).
- **Tourist Workspace Media & Data Synchronization:**
  - `frontend/js/tourist.js`: Dynamically loads live published videos via REST API; dynamically aggregates gallery images from `hero_image_url`, `banner_image`, `metadata.gallery_images`, and attraction images.
  - Automatically fetches and displays newly added or updated destinations without fixed list assumptions.
- **State Theme Flickering Resolved:**
  - Created `frontend/js/theme-init.js` running synchronously in `<head>` of all 11 manager HTML templates.
  - Removed hardcoded `data-theme="maharashtra"` from `<body>` in all 11 manager HTML files.
  - Extended CSS selectors in `manager.css` and `dashboard.css` to `:root[data-theme="..."], html[data-theme="..."], body[data-theme="..."]`.
- **Regression Test Verification:**
  - 107 tests collected.
  - 107 passed, 0 failed, 0 skipped.
  - All 18 PostgreSQL Row-Level Security (RLS) tests executed against isolated Neon test branch (`ep-floral-silence`) with 100% success.

---

## 2026-11-20 — Critical End-to-End Destination Data Integrity Repair & Browser E2E

- **Destination Data Model Mapping (12/12 Categories Completed):**
  - Mapped Destination Name, Overview, Description, Main/Hero Image, Gallery Images, Videos, Attractions, Events, Experiences, Stories, Advisories, and Travel Info between Manager Input, Database Fields, and Tourist Display.
- **Root Causes Identified & Repaired:**
  - **Hero & Asset 404s:** Created `frontend/assets/images/destinations/` directory with `rajgad.jpg`, and added `thumb-ellora.jpg` to resolve 404 image errors.
  - **Slug Aliasing:** Added bidirectional slug aliases (`raigad-fort` $\leftrightarrow$ `rajgad-fort`, `amber-fort` $\leftrightarrow$ `amer-fort`) in backend endpoints (`catalogue.py`, `manager.py`, `jurisdiction.py`) and frontend scripts (`tourist.js`, `manager-views.js`).
  - **DOM Hydration Timing:** Fixed `DOMContentLoaded` race condition with `document.readyState` check, preventing scripts from stalling if loaded after interactive state.
  - **Uninitialized Set Bug:** Initialized `this.favorites = new Set()` in `loadFavorites()`, eliminating uncaught `TypeError` that previously stopped overview rendering.
  - **Rating & Review Formatting:** Fixed `NaN (NaNk reviews)` rendering when destinations are hydrated from the live API.
  - **Theme State Synchronization:** Wired `data-theme` and `data-state-theme` updates dynamically on `destination-detail.html`.
- **Browser CDP Verification (10 Real Screenshots Captured):**
  - All 10 screenshots generated and saved to artifact directory:
    - `dest_repair_01_manager_view_modal.png` (Manager view modal)
    - `dest_repair_02_manager_edit_modal.png` (Manager edit modal with all fields)
    - `dest_repair_03_manager_updated_view.png` (Manager updated modal showing database persistence)
    - `dest_repair_04_tourist_rajgad_overview.png` (Tourist Rajgad Fort overview with updated description, hero, and map)
    - `dest_repair_05_tourist_rajgad_gallery_lightbox.png` (Tourist gallery fullscreen lightbox)
    - `dest_repair_06_tourist_rajgad_videos_tab.png` (Tourist orientation videos tab)
    - `dest_repair_07_tourist_rajgad_attractions_tab.png` (Tourist associated attractions tab)
    - `dest_repair_08_tourist_raigad_alias.png` (Tourist alias route `?id=raigad-fort`)
    - `dest_repair_09_tourist_kerala_munnar.png` (Kerala destination with green theme)
    - `dest_repair_10_tourist_rajasthan_amer.png` (Rajasthan destination with royal fort theme)
- **Zero Errors & Test Pass:**
  - Automated browser audit: 0 console errors, 0 network 4xx/5xx errors (`destination_integrity_browser_report.json`).
  - Backend regression: 107 of 107 tests passed (including all 18 PostgreSQL RLS tests).
  - Target: Isolated Neon test branch (`ep-floral-silence`) with runtime role `yatrasetu_app` (`NOBYPASSRLS`). Production database strictly untouched.
