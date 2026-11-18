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
