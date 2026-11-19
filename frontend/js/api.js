/**
 * ==========================================================================
 * YatraSetu — Smart Destination Management Platform
 * Centralized Vanilla JavaScript API Client (frontend/js/api.js)
 *
 * Implements:
 * - Configurable Base API URL (window.YATRASETU_API_BASE or http://127.0.0.1:8000/api/v1)
 * - Automatic Authorization header injection (Bearer <access_token>)
 * - Unified JSON request and response parsing
 * - Transparent 401 handling with single-attempt refresh token rotation & retry
 * - Replay attack prevention & infinite loop guards
 * - Clean session synchronization (sessionStorage)
 * ==========================================================================
 */

(function (global) {
    'use strict';

    // Storage Key Constants
    const STORAGE_KEYS = {
        ACCESS_TOKEN: 'yatrasetu_access_token',
        REFRESH_TOKEN: 'yatrasetu_refresh_token',
        ROLE: 'yatrasetu_role',
        EMAIL: 'yatrasetu_email',
        NAME: 'yatrasetu_name',
        USER_ID: 'yatrasetu_user_id',
        MANAGER_SCOPE: 'yatrasetu_manager_scope',
        MANAGER_ACCESS_LEVEL: 'yatrasetu_manager_access_level',
        MANAGER_PROFILE: 'yatrasetu_manager_profile',
        ACTIVE_STATE_ID: 'yatrasetu_active_state_id',
        ACTIVE_DEST_ID: 'yatrasetu_active_dest_id',
        DESTINATION_ID: 'yatrasetu_destination_id'
    };

    class YatraSetuApiClient {
        constructor() {
            this.baseUrl = (typeof window !== 'undefined' && window.YATRASETU_API_BASE)
                ? window.YATRASETU_API_BASE.replace(/\/+$/, '')
                : 'http://127.0.0.1:8000/api/v1';

            this._isRefreshing = false;
            this._refreshPromise = null;
        }

        /**
         * Access token reader
         */
        getAccessToken() {
            try {
                return sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) || null;
            } catch (e) {
                return null;
            }
        }

        /**
         * Refresh token reader
         */
        getRefreshToken() {
            try {
                return sessionStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN) || null;
            } catch (e) {
                return null;
            }
        }

        /**
         * Store token pair in sessionStorage
         */
        setTokens(accessToken, refreshToken) {
            try {
                if (accessToken) {
                    sessionStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
                }
                if (refreshToken) {
                    sessionStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
                }
            } catch (e) {
                console.warn('[YatraSetuApi] Unable to access sessionStorage to persist tokens:', e);
            }
        }

        /**
         * Check if an active session exists
         */
        isAuthenticated() {
            return !!this.getAccessToken();
        }

        /**
         * Synchronize backend user model with frontend session state
         */
        saveUserSession(user) {
            if (!user) return;
            try {
                const role = user.role || user.role_id || 'tourist';
                sessionStorage.setItem(STORAGE_KEYS.USER_ID, user.id || '');
                sessionStorage.setItem(STORAGE_KEYS.EMAIL, user.email || '');
                sessionStorage.setItem(STORAGE_KEYS.NAME, user.full_name || '');
                sessionStorage.setItem(STORAGE_KEYS.ROLE, role);

                if (role === 'manager' && user.manager_scope) {
                    const isState = user.manager_scope.scope === 'STATE';
                    const stateId = user.manager_scope.state_id || 'maharashtra';
                    const destId = user.manager_scope.destination_id;

                    sessionStorage.setItem(STORAGE_KEYS.ACTIVE_STATE_ID, stateId);
                    sessionStorage.setItem(STORAGE_KEYS.ACTIVE_DEST_ID, destId || 'all');
                    sessionStorage.setItem(STORAGE_KEYS.MANAGER_SCOPE, isState ? 'state' : 'destination');
                    sessionStorage.setItem(STORAGE_KEYS.MANAGER_ACCESS_LEVEL, isState ? 'State Manager' : 'Destination Manager');

                    const stateName = (stateId === 'kerala') ? 'Kerala' : 'Maharashtra';
                    const mgrProfile = {
                        id: user.id,
                        name: user.full_name,
                        email: user.email,
                        manager_type: isState ? 'State Manager' : 'Destination Manager',
                        access_level: isState ? 'State Manager' : 'Destination Manager',
                        scope: user.manager_scope.scope,
                        state_id: stateId,
                        state_name: stateName,
                        destination_id: isState ? 'all' : destId,
                        destination_name: destId || 'All State Destinations',
                        status: user.is_active ? 'Active' : 'Inactive',
                        account_status: user.is_active ? 'Active' : 'Inactive',
                        avatar_initials: (user.full_name || 'DM').split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2)
                    };
                    sessionStorage.setItem(STORAGE_KEYS.MANAGER_PROFILE, JSON.stringify(mgrProfile));
                } else if (role === 'stakeholder' && user.destination_id) {
                    sessionStorage.setItem(STORAGE_KEYS.DESTINATION_ID, user.destination_id);
                    sessionStorage.setItem(STORAGE_KEYS.ACTIVE_DEST_ID, user.destination_id);
                }
            } catch (e) {
                console.warn('[YatraSetuApi] Failed to update user session state:', e);
            }
        }

        /**
         * Clears all authentication tokens and identity session keys
         */
        clearSession() {
            try {
                Object.values(STORAGE_KEYS).forEach(k => sessionStorage.removeItem(k));
                sessionStorage.removeItem('yatrasetu_tourist_catalogue');
                sessionStorage.removeItem('yatrasetu_tourist_catalogue_ts');
            } catch (e) {
                console.warn('[YatraSetuApi] Failed to clear sessionStorage:', e);
            }
        }

        /**
         * Core request dispatcher with transparent refresh and single-attempt retry
         */
        async request(endpoint, options = {}, isRetry = false) {
            const url = endpoint.startsWith('http')
                ? endpoint
                : `${this.baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

            const headers = {
                'Content-Type': 'application/json',
                ...(options.headers || {})
            };

            const token = this.getAccessToken();
            if (token && !headers['Authorization']) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            let response;
            try {
                response = await fetch(url, {
                    ...options,
                    headers
                });
            } catch (networkErr) {
                const error = new Error('Cannot connect to authentication service. Please ensure the backend server is running and accessible.');
                error.status = 0;
                error.isNetworkError = true;
                throw error;
            }

            // Handle 401 Unauthorized with token refresh & retry (only once, non-auth endpoints)
            const isAuthEndpoint = endpoint.includes('/auth/login') ||
                endpoint.includes('/auth/register') ||
                endpoint.includes('/auth/refresh') ||
                endpoint.includes('/auth/logout');

            if (response.status === 401 && !isRetry && !isAuthEndpoint) {
                const refreshed = await this.refreshToken();
                if (refreshed) {
                    // Retry original request exactly once
                    return await this.request(endpoint, options, true);
                } else {
                    this.clearSession();
                    const error = new Error('Session has expired. Please sign in again.');
                    error.status = 401;
                    throw error;
                }
            }

            // Parse response body
            let data = null;
            const contentType = response.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
                try {
                    data = await response.json();
                } catch (e) {
                    data = null;
                }
            } else {
                const text = await response.text();
                data = text ? { message: text } : null;
            }

            if (!response.ok) {
                let errorMsg = 'An error occurred during request.';
                if (data && data.detail) {
                    if (typeof data.detail === 'string') {
                        errorMsg = data.detail;
                    } else if (Array.isArray(data.detail)) {
                        // Extract Pydantic validation errors
                        errorMsg = data.detail.map(d => d.msg || JSON.stringify(d)).join('; ');
                    } else {
                        errorMsg = JSON.stringify(data.detail);
                    }
                } else if (data && data.message) {
                    errorMsg = data.message;
                }

                const err = new Error(errorMsg);
                err.status = response.status;
                err.data = data;
                throw err;
            }

            return data;
        }

        /**
         * Transparent Refresh Token Handler
         * Guarantees concurrency safety (deduplicating concurrent refresh calls)
         */
        async refreshToken() {
            const rawRefreshToken = this.getRefreshToken();
            if (!rawRefreshToken) {
                return false;
            }

            if (this._isRefreshing) {
                return this._refreshPromise;
            }

            this._isRefreshing = true;
            this._refreshPromise = (async () => {
                try {
                    const response = await fetch(`${this.baseUrl}/auth/refresh`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ refresh_token: rawRefreshToken })
                    });

                    if (!response.ok) {
                        this.clearSession();
                        return false;
                    }

                    const data = await response.json();
                    if (data && data.access_token && data.refresh_token) {
                        this.setTokens(data.access_token, data.refresh_token);
                        if (data.user) {
                            this.saveUserSession(data.user);
                        }
                        return true;
                    }

                    this.clearSession();
                    return false;
                } catch (err) {
                    this.clearSession();
                    return false;
                } finally {
                    this._isRefreshing = false;
                    this._refreshPromise = null;
                }
            })();

            return this._refreshPromise;
        }

        /**
         * User Authentication (POST /api/v1/auth/login)
         * Accepts email and password only. Uses authoritative role from server response.
         */
        async login(email, password) {
            const payload = {
                email: (email || '').trim().toLowerCase(),
                password: password || ''
            };

            const data = await this.request('/auth/login', {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            if (data && data.access_token && data.refresh_token) {
                this.setTokens(data.access_token, data.refresh_token);
                if (data.user) {
                    this.saveUserSession(data.user);
                }
            }

            return data;
        }

        /**
         * User Registration (POST /api/v1/auth/register)
         * Only tourist and stakeholder allowed. Manager/Admin rejected.
         */
        async register(userData) {
            return await this.request('/auth/register', {
                method: 'POST',
                body: JSON.stringify(userData)
            });
        }

        /**
         * Fetch current authenticated user profile (GET /api/v1/auth/me)
         */
        async getProfile() {
            const userProfile = await this.request('/auth/me', {
                method: 'GET'
            });

            if (userProfile) {
                this.saveUserSession({
                    id: userProfile.id,
                    email: userProfile.email,
                    full_name: userProfile.full_name,
                    role: userProfile.role_id,
                    is_active: userProfile.is_active,
                    is_verified: userProfile.is_verified,
                    manager_scope: userProfile.manager_scope
                });
            }

            return userProfile;
        }

        /**
         * User Logout (POST /api/v1/auth/logout)
         * Revokes refresh token in database, then cleans local session.
         */
        async logout() {
            const rawRefreshToken = this.getRefreshToken();
            if (rawRefreshToken) {
                try {
                    await fetch(`${this.baseUrl}/auth/logout`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ refresh_token: rawRefreshToken })
                    });
                } catch (e) {
                    console.warn('[YatraSetuApi] Logout revocation request failed:', e);
                }
            }
            this.clearSession();
        }

        /**
         * ======================================================================
         * Public Catalogue Endpoints (Read-Only)
         * ======================================================================
         */

        /**
         * Helper to serialize query params object into query string
         */
        _buildQuery(params = {}) {
            const query = new URLSearchParams();
            for (const [key, val] of Object.entries(params)) {
                if (val !== undefined && val !== null && val !== '') {
                    query.append(key, val);
                }
            }
            const qs = query.toString();
            return qs ? `?${qs}` : '';
        }

        /**
         * Fetch all supported states (GET /api/v1/states)
         */
        async getStates() {
            return await this.request('/states', { method: 'GET' });
        }

        /**
         * Fetch state by ID (GET /api/v1/states/{state_id})
         */
        async getState(stateId) {
            return await this.request(`/states/${encodeURIComponent(stateId)}`, { method: 'GET' });
        }

        /**
         * Fetch destinations with optional filters & pagination (GET /api/v1/destinations)
         * @param {Object} params - { state_id, category, search, limit, offset }
         */
        async getDestinations(params = {}) {
            const qs = this._buildQuery(params);
            return await this.request(`/destinations${qs}`, { method: 'GET' });
        }

        /**
         * Fetch destination by ID (GET /api/v1/destinations/{destination_id})
         */
        async getDestination(destinationId) {
            return await this.request(`/destinations/${encodeURIComponent(destinationId)}`, { method: 'GET' });
        }

        /**
         * Fetch attractions with optional filters & pagination (GET /api/v1/attractions)
         * @param {Object} params - { destination_id, category, limit, offset }
         */
        async getAttractions(params = {}) {
            const qs = this._buildQuery(params);
            return await this.request(`/attractions${qs}`, { method: 'GET' });
        }

        /**
         * Fetch experiences with optional filters & pagination (GET /api/v1/experiences)
         * @param {Object} params - { destination_id, category, difficulty, limit, offset }
         */
        async getExperiences(params = {}) {
            const qs = this._buildQuery(params);
            return await this.request(`/experiences${qs}`, { method: 'GET' });
        }

        /**
         * Fetch experience by ID (GET /api/v1/experiences/{experience_id})
         */
        async getExperience(experienceId) {
            return await this.request(`/experiences/${encodeURIComponent(experienceId)}`, { method: 'GET' });
        }

        /**
         * Fetch events with optional filters & pagination (GET /api/v1/events)
         * @param {Object} params - { destination_id, status, limit, offset }
         */
        async getEvents(params = {}) {
            const qs = this._buildQuery(params);
            return await this.request(`/events${qs}`, { method: 'GET' });
        }

        /**
         * Fetch circuits with optional filters & pagination (GET /api/v1/circuits)
         * @param {Object} params - { state_id, limit, offset }
         */
        async getCircuits(params = {}) {
            const qs = this._buildQuery(params);
            return await this.request(`/circuits${qs}`, { method: 'GET' });
        }

        /**
         * Fetch circuit by ID (GET /api/v1/circuits/{circuit_id})
         */
        async getCircuit(circuitId) {
            return await this.request(`/circuits/${encodeURIComponent(circuitId)}`, { method: 'GET' });
        }

        /**
         * Fetch published videos for a destination (GET /api/v1/destinations/{destination_id}/videos)
         */
        async getDestinationVideos(destinationId) {
            return await this.request(`/destinations/${encodeURIComponent(destinationId)}/videos`, { method: 'GET' });
        }

        /**
         * ======================================================================
         * Destination Manager Workspace Endpoints (Authenticated)
         * ======================================================================
         */

        /**
         * Fetch manager context and authoritative jurisdiction (GET /api/v1/manager/context)
         */
        async getManagerContext() {
            return await this.request('/manager/context', { method: 'GET' });
        }

        /**
         * Fetch destinations within manager jurisdiction (GET /api/v1/manager/destinations)
         * @param {Object} params - { limit, offset }
         */
        async getManagedDestinations(params = {}) {
            const qs = this._buildQuery(params);
            return await this.request(`/manager/destinations${qs}`, { method: 'GET' });
        }

        /**
         * Fetch destination details within manager jurisdiction (GET /api/v1/manager/destinations/{destination_id})
         * @param {string} destinationId
         */
        async getManagedDestination(destinationId) {
            return await this.request(`/manager/destinations/${encodeURIComponent(destinationId)}`, { method: 'GET' });
        }

        /**
         * Create destination within manager state jurisdiction (POST /api/v1/manager/destinations)
         * @param {Object} payload - { name, category, state_id?, id?, subtitle?, location_label?, description?, hero_image_url?, banner_image?, max_daily_capacity?, ideal_duration?, best_time?, metadata? }
         */
        async createManagedDestination(payload) {
            return await this.request('/manager/destinations', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
        }

        /**
         * Update destination within manager jurisdiction (PUT /api/v1/manager/destinations/{destination_id})
         * @param {string} destinationId
         * @param {Object} payload - { name?, category?, subtitle?, location_label?, description?, hero_image_url?, banner_image?, max_daily_capacity?, ideal_duration?, best_time?, metadata? }
         */
        async updateManagedDestination(destinationId, payload) {
            return await this.request(`/manager/destinations/${encodeURIComponent(destinationId)}`, {
                method: 'PUT',
                body: JSON.stringify(payload)
            });
        }

        /**
         * Fetch attractions within manager jurisdiction (GET /api/v1/manager/attractions)
         * @param {Object} params - { destination_id, category, limit, offset }
         */
        async getManagedAttractions(params = {}) {
            const qs = this._buildQuery(params);
            return await this.request(`/manager/attractions${qs}`, { method: 'GET' });
        }

        /**
         * Create attraction within manager jurisdiction (POST /api/v1/manager/attractions)
         * @param {Object} payload - { destination_id, name, category, description?, image_url?, rating?, status?, operating_hours?, entry_fee_label? }
         */
        async createManagedAttraction(payload) {
            return await this.request('/manager/attractions', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
        }

        /**
         * Update attraction within manager jurisdiction (PUT /api/v1/manager/attractions/{attraction_id})
         * @param {string} attractionId - UUID string
         * @param {Object} payload - { name?, category?, description?, image_url?, rating?, status?, operating_hours?, entry_fee_label?, destination_id? }
         */
        async updateManagedAttraction(attractionId, payload) {
            return await this.request(`/manager/attractions/${encodeURIComponent(attractionId)}`, {
                method: 'PUT',
                body: JSON.stringify(payload)
            });
        }

        /**
         * Delete attraction within manager jurisdiction (DELETE /api/v1/manager/attractions/{attraction_id})
         * @param {string} attractionId - UUID string
         */
        async deleteManagedAttraction(attractionId) {
            return await this.request(`/manager/attractions/${encodeURIComponent(attractionId)}`, {
                method: 'DELETE'
            });
        }

        /**
         * Fetch events within manager jurisdiction (GET /api/v1/manager/events)
         * @param {Object} params - { destination_id, status, limit, offset }
         */
        async getManagedEvents(params = {}) {
            const qs = this._buildQuery(params);
            return await this.request(`/manager/events${qs}`, { method: 'GET' });
        }

        /**
         * Create event within manager jurisdiction (POST /api/v1/manager/events)
         * @param {Object} payload - { destination_id, title, date_num, date_month, location_label, status?, status_class?, image_url?, description? }
         */
        async createManagedEvent(payload) {
            return await this.request('/manager/events', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
        }

        /**
         * Update event within manager jurisdiction (PUT /api/v1/manager/events/{event_id})
         * @param {string} eventId - UUID string
         * @param {Object} payload - { title?, date_num?, date_month?, location_label?, status?, status_class?, image_url?, description?, destination_id? }
         */
        async updateManagedEvent(eventId, payload) {
            return await this.request(`/manager/events/${encodeURIComponent(eventId)}`, {
                method: 'PUT',
                body: JSON.stringify(payload)
            });
        }

        /**
         * Delete event within manager jurisdiction (DELETE /api/v1/manager/events/{event_id})
         * @param {string} eventId - UUID string
         */
        async deleteManagedEvent(eventId) {
            return await this.request(`/manager/events/${encodeURIComponent(eventId)}`, {
                method: 'DELETE'
            });
        }

        /**
         * Fetch videos within manager jurisdiction (GET /api/v1/manager/videos)
         * @param {Object} params - { destination_id, category, limit, offset }
         */
        async getManagedVideos(params = {}) {
            const qs = this._buildQuery(params);
            return await this.request(`/manager/videos${qs}`, { method: 'GET' });
        }

        /**
         * Create video within manager jurisdiction (POST /api/v1/manager/videos)
         * @param {Object} payload - { destination_id, title, category?, description?, duration?, youtube_id?, video_url?, thumbnail_url?, status? }
         */
        async createManagedVideo(payload) {
            return await this.request('/manager/videos', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
        }

        /**
         * Update video within manager jurisdiction (PUT /api/v1/manager/videos/{video_id})
         * @param {string} videoId - UUID string
         * @param {Object} payload - { title?, category?, description?, duration?, youtube_id?, video_url?, thumbnail_url?, status?, destination_id? }
         */
        async updateManagedVideo(videoId, payload) {
            return await this.request(`/manager/videos/${encodeURIComponent(videoId)}`, {
                method: 'PUT',
                body: JSON.stringify(payload)
            });
        }

        /**
         * Delete video within manager jurisdiction (DELETE /api/v1/manager/videos/{video_id})
         * @param {string} videoId - UUID string
         */
        async deleteManagedVideo(videoId) {
            return await this.request(`/manager/videos/${encodeURIComponent(videoId)}`, {
                method: 'DELETE'
            });
        }

        // =====================================================================
        // TOURISM STAKEHOLDER WORKSPACE API METHODS (PHASE 7)
        // =====================================================================

        /**
         * Fetch current stakeholder profile and service details (GET /api/v1/stakeholder/profile)
         */
        async getStakeholderProfile() {
            return await this.request('/stakeholder/profile', { method: 'GET' });
        }

        /**
         * Update stakeholder profile details (PUT /api/v1/stakeholder/profile)
         * @param {Object} payload - { business_name?, category?, license_number?, destination_id?, contact_person?, phone?, address?, operating_hours?, price_range?, contact_info? }
         */
        async updateStakeholderProfile(payload) {
            return await this.request('/stakeholder/profile', {
                method: 'PUT',
                body: JSON.stringify(payload)
            });
        }

        /**
         * Register initial commercial tourism service (POST /api/v1/stakeholder/service)
         * @param {Object} payload - { destination_id, business_name, category, license_number?, contact_person?, phone?, address?, operating_hours?, price_range? }
         */
        async registerStakeholderService(payload) {
            return await this.request('/stakeholder/service', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
        }

        /**
         * Fetch official destination advisories for stakeholder's assigned destination (GET /api/v1/stakeholder/destination-updates)
         */
        async getStakeholderDestinationUpdates() {
            return await this.request('/stakeholder/destination-updates', { method: 'GET' });
        }

        /**
         * Fetch submitted suggestions/notices to destination manager (GET /api/v1/stakeholder/suggestions)
         */
        async getStakeholderSuggestions() {
            return await this.request('/stakeholder/suggestions', { method: 'GET' });
        }

        /**
         * Submit operational notice or suggestion to destination manager (POST /api/v1/stakeholder/suggestions)
         * @param {Object} payload - { title, content }
         */
        async createStakeholderSuggestion(payload) {
            return await this.request('/stakeholder/suggestions', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
        }

        /**
         * Fetch stakeholder's uploaded media gallery items (GET /api/v1/stakeholder/media)
         */
        async getStakeholderMedia() {
            return await this.request('/stakeholder/media', { method: 'GET' });
        }

        /**
         * Add a photo or promotional video record (POST /api/v1/stakeholder/media)
         * @param {Object} payload - { media_type, title, media_url, description?, thumbnail_url?, file_size_bytes? }
         */
        async createStakeholderMedia(payload) {
            return await this.request('/stakeholder/media', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
        }

        /**
         * Update an owned media item (PUT /api/v1/stakeholder/media/{media_id})
         * @param {string} mediaId - UUID
         * @param {Object} payload - { title?, description?, media_url?, thumbnail_url? }
         */
        async updateStakeholderMedia(mediaId, payload) {
            return await this.request(`/stakeholder/media/${encodeURIComponent(mediaId)}`, {
                method: 'PUT',
                body: JSON.stringify(payload)
            });
        }

        /**
         * Delete an owned media item (DELETE /api/v1/stakeholder/media/{media_id})
         * @param {string} mediaId - UUID
         */
        async deleteStakeholderMedia(mediaId) {
            return await this.request(`/stakeholder/media/${encodeURIComponent(mediaId)}`, {
                method: 'DELETE'
            });
        }

        /**
         * Fetch commercial service offerings (GET /api/v1/stakeholder/offerings)
         */
        async getStakeholderOfferings() {
            return await this.request('/stakeholder/offerings', { method: 'GET' });
        }

        /**
         * Create commercial service offering (POST /api/v1/stakeholder/offerings)
         * @param {Object} payload - { title, category, price?, description? }
         */
        async createStakeholderOffering(payload) {
            return await this.request('/stakeholder/offerings', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
        }

        /**
         * Delete commercial service offering (DELETE /api/v1/stakeholder/offerings/{offering_id})
         * @param {string} offeringId
         */
        async deleteStakeholderOffering(offeringId) {
            return await this.request(`/stakeholder/offerings/${encodeURIComponent(offeringId)}`, {
                method: 'DELETE'
            });
        }

        // =====================================================================
        // TOURIST WORKSPACE API METHODS (PHASE 8)
        // =====================================================================

        /**
         * Fetch tourist profile (GET /api/v1/tourist/profile)
         */
        async getTouristProfile() {
            return await this.request('/tourist/profile', { method: 'GET' });
        }

        /**
         * Update tourist profile (PUT /api/v1/tourist/profile)
         * @param {Object} payload - { full_name?, phone_number?, preferences? }
         */
        async updateTouristProfile(payload) {
            return await this.request('/tourist/profile', {
                method: 'PUT',
                body: JSON.stringify(payload)
            });
        }

        /**
         * List saved wishlist destinations (GET /api/v1/tourist/favorites)
         */
        async getTouristFavorites() {
            return await this.request('/tourist/favorites', { method: 'GET' });
        }

        /**
         * Save destination to wishlist (POST /api/v1/tourist/favorites)
         * @param {string} destinationId
         */
        async addTouristFavorite(destinationId) {
            return await this.request('/tourist/favorites', {
                method: 'POST',
                body: JSON.stringify({ destination_id: destinationId })
            });
        }

        /**
         * Remove destination from wishlist (DELETE /api/v1/tourist/favorites/{destination_id})
         * @param {string} destinationId
         */
        async removeTouristFavorite(destinationId) {
            return await this.request(`/tourist/favorites/${encodeURIComponent(destinationId)}`, {
                method: 'DELETE'
            });
        }

        /**
         * List saved trip plans / itineraries (GET /api/v1/tourist/itineraries)
         */
        async getTouristItineraries() {
            return await this.request('/tourist/itineraries', { method: 'GET' });
        }

        /**
         * Get trip plan by ID (GET /api/v1/tourist/itineraries/{plan_id})
         * @param {string} planId - UUID string
         */
        async getTouristItinerary(planId) {
            return await this.request(`/tourist/itineraries/${encodeURIComponent(planId)}`, {
                method: 'GET'
            });
        }

        /**
         * Create custom trip plan (POST /api/v1/tourist/itineraries)
         * @param {Object} payload - { title, start_date?, end_date?, notes?, items? }
         */
        async createTouristItinerary(payload) {
            return await this.request('/tourist/itineraries', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
        }

        /**
         * Update custom trip plan (PUT /api/v1/tourist/itineraries/{plan_id})
         * @param {string} planId - UUID string
         * @param {Object} payload - { title?, start_date?, end_date?, notes?, items? }
         */
        async updateTouristItinerary(planId, payload) {
            return await this.request(`/tourist/itineraries/${encodeURIComponent(planId)}`, {
                method: 'PUT',
                body: JSON.stringify(payload)
            });
        }

        /**
         * Delete custom trip plan (DELETE /api/v1/tourist/itineraries/{plan_id})
         * @param {string} planId - UUID string
         */
        async deleteTouristItinerary(planId) {
            return await this.request(`/tourist/itineraries/${encodeURIComponent(planId)}`, {
                method: 'DELETE'
            });
        }

        /**
         * Fetch destination reviews and feedback (GET /api/v1/tourist/reviews/{destination_id})
         * @param {string} destinationId
         */
        async getDestinationReviews(destinationId) {
            return await this.request(`/tourist/reviews/${encodeURIComponent(destinationId)}`, {
                method: 'GET'
            });
        }

        /**
         * Submit destination review or feedback (POST /api/v1/tourist/reviews)
         * @param {Object} payload - { destination_id, rating, category?, comment, guest_author_name? }
         */
        async submitDestinationReview(payload) {
            return await this.request('/tourist/reviews', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
        }

        /**
         * Fetch active safety advisories for destination (GET /api/v1/tourist/advisories/{destination_id})
         * @param {string} destinationId
         */
        async getTouristAdvisories(destinationId) {
            return await this.request(`/tourist/advisories/${encodeURIComponent(destinationId)}`, {
                method: 'GET'
            });
        }

        // =====================================================================
        // SECTION 6: PLATFORM ADMINISTRATOR GOVERNANCE ENDPOINTS
        // =====================================================================

        /**
         * Fetch platform statistics (GET /api/v1/admin/stats)
         */
        async getAdminStats() {
            return await this.request('/admin/stats', {
                method: 'GET'
            });
        }

        /**
         * List platform users with optional filters (GET /api/v1/admin/users)
         * @param {Object} [params] - { role?, status?, search?, page?, page_size? }
         */
        async getAdminUsers(params = {}) {
            const query = new URLSearchParams();
            if (params.role) query.set('role', params.role);
            if (params.status) query.set('status', params.status);
            if (params.search) query.set('search', params.search);
            if (params.page) query.set('page', params.page);
            if (params.page_size) query.set('page_size', params.page_size);

            const qs = query.toString();
            return await this.request(`/admin/users${qs ? '?' + qs : ''}`, {
                method: 'GET'
            });
        }

        /**
         * Update user account status (PUT /api/v1/admin/users/{user_id}/status)
         * @param {string} userId
         * @param {string} status - 'active', 'inactive', 'deactivated', 'suspended'
         * @param {string} [reason]
         */
        async updateAdminUserStatus(userId, status, reason = '') {
            return await this.request(`/admin/users/${encodeURIComponent(userId)}/status`, {
                method: 'PUT',
                body: JSON.stringify({ status, reason })
            });
        }

        /**
         * Soft-deactivate a user account (DELETE /api/v1/admin/users/{user_id})
         * @param {string} userId
         */
        async deleteAdminUser(userId) {
            return await this.request(`/admin/users/${encodeURIComponent(userId)}`, {
                method: 'DELETE'
            });
        }

        /**
         * List manager jurisdictions (GET /api/v1/admin/managers)
         */
        async getAdminManagers() {
            return await this.request('/admin/managers', {
                method: 'GET'
            });
        }

        /**
         * Assign or reassign manager jurisdiction (POST /api/v1/admin/managers/assign)
         * @param {Object} payload - { user_id, state_id, destination_id?, reason }
         */
        async assignAdminManagerJurisdiction(payload) {
            return await this.request('/admin/managers/assign', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
        }

        /**
         * Controlled stakeholder destination reassignment (POST /api/v1/admin/stakeholders/{service_id}/reassign-destination)
         * @param {string} serviceId
         * @param {Object} payload - { new_destination_id, new_state_id?, reason }
         */
        async reassignStakeholderDestination(serviceId, payload) {
            return await this.request(`/admin/stakeholders/${encodeURIComponent(serviceId)}/reassign-destination`, {
                method: 'POST',
                body: JSON.stringify(payload)
            });
        }

        /**
         * List stakeholder business registrations (GET /api/v1/admin/registrations)
         * @param {Object} [params] - { status?, destination_id?, state_id?, search?, page?, page_size? }
         */
        async getAdminRegistrations(params = {}) {
            const query = new URLSearchParams();
            if (params.status) query.set('status', params.status);
            if (params.destination_id) query.set('destination_id', params.destination_id);
            if (params.state_id) query.set('state_id', params.state_id);
            if (params.search) query.set('search', params.search);
            if (params.page) query.set('page', params.page);
            if (params.page_size) query.set('page_size', params.page_size);

            const qs = query.toString();
            return await this.request(`/admin/registrations${qs ? '?' + qs : ''}`, {
                method: 'GET'
            });
        }

        /**
         * Update stakeholder verification status (PUT /api/v1/admin/registrations/{service_id}/status)
         * @param {string} serviceId
         * @param {string} status - 'verified', 'rejected', 'suspended', 'pending'
         * @param {string} [reason]
         */
        async updateAdminRegistrationStatus(serviceId, status, reason = '') {
            return await this.request(`/admin/registrations/${encodeURIComponent(serviceId)}/status`, {
                method: 'PUT',
                body: JSON.stringify({ status, reason })
            });
        }

        /**
         * List platform audit trail logs (GET /api/v1/admin/audit-logs)
         * @param {Object} [params] - { action?, table_name?, changed_by?, page?, page_size? }
         */
        async getAdminAuditLogs(params = {}) {
            const query = new URLSearchParams();
            if (params.action) query.set('action', params.action);
            if (params.table_name) query.set('table_name', params.table_name);
            if (params.changed_by) query.set('changed_by', params.changed_by);
            if (params.page) query.set('page', params.page);
            if (params.page_size) query.set('page_size', params.page_size);

            const qs = query.toString();
            return await this.request(`/admin/audit-logs${qs ? '?' + qs : ''}`, {
                method: 'GET'
            });
        }

        /**
         * List platform roles (GET /api/v1/admin/roles)
         */
        async getAdminRoles() {
            return await this.request('/admin/roles', {
                method: 'GET'
            });
        }
    }

    // Export singleton instance to global window / module
    const apiInstance = new YatraSetuApiClient();
    if (typeof window !== 'undefined') {
        window.YatraSetuApi = apiInstance;
        window.YatraSetuApiClient = YatraSetuApiClient;
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { YatraSetuApiClient, YatraSetuApi: apiInstance };
    }

})(typeof window !== 'undefined' ? window : globalThis);
