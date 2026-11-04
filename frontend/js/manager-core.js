/**
 * YatraSetu — Destination Manager Workspace Core Engine (manager-core.js)
 * Manages Relational Store Adapter, Central Context Engine, State Themes,
 * Shared Topbar Shell Controls (Global Search, Floating Popups, Notifications, User Profile),
 * and Overlay Modal Infrastructure across all 11 Manager Workspace Pages.
 */

/**
 * State Data Configurations for Dynamic UI Transformation (Derived from YatraSetuManagerData)
 */
var STATE_CONFIGS = window.STATE_CONFIGS = (window.YatraSetuManagerData && window.YatraSetuManagerData.stateConfigs)
    ? window.YatraSetuManagerData.stateConfigs
    : {};

/**
 * Synchronize active manager profile with shared application state (yatrasetu_manager_profile / yatrasetu_admin_users).
 */
function syncActiveManagerProfile() {
    let profile = null;
    try {
        const rawProfile = sessionStorage.getItem('yatrasetu_manager_profile') || localStorage.getItem('yatrasetu_manager_profile');
        if (rawProfile) profile = JSON.parse(rawProfile);
    } catch (e) {}

    if (!profile) {
        try {
            const rawUsers = localStorage.getItem('yatrasetu_admin_users') || sessionStorage.getItem('yatrasetu_admin_users');
            if (rawUsers) {
                const users = JSON.parse(rawUsers);
                const sessionEmail = sessionStorage.getItem('yatrasetu_email');
                const manager = users.find(u => u.role === 'manager' && (sessionEmail ? u.email.toLowerCase() === sessionEmail.toLowerCase() : u.id === 'usr-mgr-01')) || users.find(u => u.role === 'manager');
                if (manager) {
                    const managerData = window.YatraSetuManagerData || {};
                    const destinations = managerData.destinations || [];
                    const states = managerData.states || [];
                    const stateObj = states.find(s => s.id === manager.state_id);
                    const stateName = stateObj ? stateObj.name : (manager.state_id === 'kerala' ? 'Kerala' : 'Maharashtra');
                    const isState = manager.access_level === 'State Manager';

                    profile = {
                        id: manager.id,
                        name: manager.name,
                        email: manager.email,
                        phone: manager.phone || '+91 98230 41092',
                        organization: manager.organization || 'Tourism Authority',
                        manager_type: manager.access_level,
                        access_level: manager.access_level,
                        scope: isState ? 'STATE' : 'DESTINATION',
                        state_id: manager.state_id || 'maharashtra',
                        state_name: stateName,
                        destination_id: isState ? 'all' : manager.destination_id,
                        destination: manager.destination_name,
                        destination_name: manager.destination_name,
                        destination_ids: isState
                            ? destinations.filter(d => d.state_id === manager.state_id).map(d => d.id)
                            : [manager.destination_id],
                        assigned_date: manager.created_at || '15 Jan 2026',
                        status: manager.account_status || 'Active',
                        account_status: manager.account_status || 'Active',
                        avatar_initials: manager.name.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2)
                    };
                }
            }
        } catch (e) {}
    }

    if (profile && window.YatraSetuManagerData) {
        window.YatraSetuManagerData.profile = {
            ...(window.YatraSetuManagerData.profile || {}),
            ...profile
        };
    }
    return (window.YatraSetuManagerData && window.YatraSetuManagerData.profile) ? window.YatraSetuManagerData.profile : profile;
}
window.syncActiveManagerProfile = syncActiveManagerProfile;

/**
 * YatraSetu — Relational Data Access Adapter / Authoritative Store
 * Exposes API-shaped relational query functions filtering strictly by state_id and destination_id.
 * Consumes central data repository in manager-data.js.
 */
window.YatraSetuManagerStore = {
    syncActiveManagerProfile,
    getProfile() {
        return syncActiveManagerProfile();
    },

    getActiveContext() {
        if (window.YatraSetuManagerContext) {
            return window.YatraSetuManagerContext.getActiveContext();
        }
        return { activeStateId: 'maharashtra', activeDestinationId: 'all' };
    },

    async getDestinations(stateId) {
        if (!window.YatraSetuManagerData || !window.YatraSetuManagerData.destinations) return [];
        if (!stateId || stateId === 'all') return window.YatraSetuManagerData.destinations;
        return window.YatraSetuManagerData.destinations.filter(d => d.state_id === stateId);
    },

    async getAttractions(stateId, destinationId = 'all') {
        if (!window.YatraSetuManagerData || !window.YatraSetuManagerData.attractions) return [];
        let list = window.YatraSetuManagerData.attractions;
        if (stateId && stateId !== 'all') {
            list = list.filter(a => a.state_id === stateId);
        }
        if (destinationId && destinationId !== 'all') {
            list = list.filter(a => a.destination_id === destinationId || a.destination_id.includes(destinationId));
        }
        return list;
    },

    async getEvents(stateId, destinationId = 'all') {
        if (!window.YatraSetuManagerData || !window.YatraSetuManagerData.events) return [];
        let list = window.YatraSetuManagerData.events;
        if (stateId && stateId !== 'all') {
            list = list.filter(e => e.state_id === stateId);
        }
        if (destinationId && destinationId !== 'all') {
            list = list.filter(e => e.destination_id === destinationId || e.destination_id.includes(destinationId));
        }
        return list;
    },

    async getStakeholders(stateId, destinationId = 'all') {
        if (!window.YatraSetuManagerData) return [];

        // Restore from session storage if present (in-memory prototype persistence)
        try {
            const saved = sessionStorage.getItem('yatrasetu_manager_stakeholders');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    window.YatraSetuManagerData.stakeholders = parsed;
                }
            }
        } catch (e) {
            // fallback to default in-memory list
        }

        let list = window.YatraSetuManagerData.stakeholders || [];

        // Harmonize dynamic listings from Stakeholder workspace if present
        if (window.YatraSetuStakeholderData && Array.isArray(window.YatraSetuStakeholderData.listings)) {
            window.YatraSetuStakeholderData.listings.forEach(listing => {
                const existingIdx = list.findIndex(s => s.id === listing.id || s.name.toLowerCase() === listing.name.toLowerCase());
                const destObj = (window.YatraSetuManagerData.destinations || []).find(d => d.id === listing.destination_id);
                const inferredState = destObj ? destObj.state_id : 'maharashtra';
                const formattedStatus = listing.status === 'Approved' ? 'Approved' : (listing.status === 'Under Review' ? 'Under Review' : (listing.status === 'Rejected' ? 'Rejected' : 'Pending Approval'));

                if (existingIdx === -1) {
                    list.push({
                        id: listing.id,
                        state_id: inferredState,
                        destination_id: listing.destination_id,
                        destination: destObj ? destObj.name : 'Rajgad Fort',
                        name: listing.name,
                        category: listing.category || 'Guides',
                        type: listing.type || 'visitor-facing',
                        contact: listing.contact || '+91 98220 11223',
                        email: listing.email || 'partner@tourism.org',
                        contact_person: listing.contactPerson || 'Registered Partner',
                        address: listing.address || 'Local Destination Hub',
                        hours: listing.hours || 'Standard Hours',
                        price_range: listing.priceRange ? `₹${listing.priceRange}` : 'Free / Inquire',
                        description: listing.description || 'Verified local tourism service listing.',
                        status: formattedStatus,
                        registered_date: listing.uploadedAt || 'Recently',
                        reviewed_by: '',
                        reviewed_date: '',
                        manager_note: ''
                    });
                } else {
                    // Keep status in sync if manager previously updated it
                    list[existingIdx].status = formattedStatus;
                }
            });
        }

        if (stateId && stateId !== 'all') {
            list = list.filter(s => s.state_id === stateId);
        }
        if (destinationId && destinationId !== 'all') {
            list = list.filter(s => s.destination_id === destinationId || s.destination_id.includes(destinationId));
        }
        return list;
    },

    saveStakeholders(updatedList) {
        if (!window.YatraSetuManagerData) return;
        window.YatraSetuManagerData.stakeholders = updatedList;
        try {
            sessionStorage.setItem('yatrasetu_manager_stakeholders', JSON.stringify(updatedList));
            localStorage.setItem('yatrasetu_manager_stakeholders', JSON.stringify(updatedList));
        } catch (e) {
            // session storage quota or disabled
        }

        // Cross-workspace sync: update any corresponding listing in Stakeholder store
        if (window.YatraSetuStakeholderData && Array.isArray(window.YatraSetuStakeholderData.listings)) {
            updatedList.forEach(sh => {
                const matchListing = window.YatraSetuStakeholderData.listings.find(l => l.id === sh.id || l.name.toLowerCase() === sh.name.toLowerCase());
                if (matchListing) {
                    matchListing.status = sh.status;
                    matchListing.statusClass = sh.status === 'Approved' ? 'accepted' : (sh.status === 'Under Review' ? 'review' : (sh.status === 'Rejected' ? 'rejected' : 'pending'));
                }
            });
        }

        // Cross-workspace sync: update Admin user accounts repository
        try {
            const rawUsers = localStorage.getItem('yatrasetu_admin_users') || sessionStorage.getItem('yatrasetu_admin_users');
            if (rawUsers) {
                const adminUsers = JSON.parse(rawUsers);
                updatedList.forEach(sh => {
                    const matchUser = adminUsers.find(u => u.id === sh.id || (u.email && u.email.toLowerCase() === (sh.email || '').toLowerCase()));
                    if (matchUser) {
                        matchUser.registration_status = sh.status;
                        matchUser.destination_id = sh.destination_id;
                        matchUser.destination_name = sh.destination;
                    }
                });
                localStorage.setItem('yatrasetu_admin_users', JSON.stringify(adminUsers));
                sessionStorage.setItem('yatrasetu_admin_users', JSON.stringify(adminUsers));
            }
        } catch (e) {}
    },

    async getVisitorStats(stateId, destinationId = 'all') {
        const config = STATE_CONFIGS[stateId] || STATE_CONFIGS['maharashtra'] || {};
        return {
            state_id: stateId,
            destination_id: destinationId || 'all',
            weather: config.weather || '',
            location: config.location || ''
        };
    },

    async getFeedback(stateId, destinationId = 'all') {
        if (!window.YatraSetuManagerData || !window.YatraSetuManagerData.feedback) return [];
        let list = window.YatraSetuManagerData.feedback;
        if (stateId && stateId !== 'all') {
            list = list.filter(f => f.state_id === stateId);
        }
        if (destinationId && destinationId !== 'all') {
            list = list.filter(f => f.destination_id === destinationId || f.destination_id.includes(destinationId));
        }
        return list;
    },

    async getStakeholderMessages(stateId, destinationId = 'all') {
        if (!window.YatraSetuManagerData) return [];
        let list = window.YatraSetuManagerData.stakeholderMessages || [];

        // Try restoring from browser storage (sessionStorage / localStorage)
        try {
            const rawStored = sessionStorage.getItem('yatrasetu_stakeholder_messages') || localStorage.getItem('yatrasetu_stakeholder_messages');
            if (rawStored) {
                const parsed = JSON.parse(rawStored);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    list = parsed;
                    window.YatraSetuManagerData.stakeholderMessages = parsed;
                }
            } else if (list.length > 0) {
                sessionStorage.setItem('yatrasetu_stakeholder_messages', JSON.stringify(list));
                localStorage.setItem('yatrasetu_stakeholder_messages', JSON.stringify(list));
            }
        } catch (e) {
            // storage error fallback
        }

        // Cross-workspace sync with Stakeholder Data if active in window
        if (window.YatraSetuStakeholderData) {
            window.YatraSetuStakeholderData.suggestions = list.map(m => ({
                ...m,
                suggestionText: m.message,
                submittedAt: m.submitted_at,
                managerNote: m.manager_response || (m.status === 'In Review' ? 'Under active review by Destination Manager' : 'Awaiting Manager Review'),
                statusClass: m.status === 'Responded' ? 'accepted' : (m.status === 'In Review' ? 'review' : 'pending')
            }));
        }

        if (stateId && stateId !== 'all') {
            list = list.filter(m => m.state_id === stateId);
        }
        if (destinationId && destinationId !== 'all') {
            list = list.filter(m => m.destination_id === destinationId || (m.destination_id && m.destination_id.includes(destinationId)));
        }
        return list;
    },

    saveStakeholderMessages(updatedList) {
        if (!window.YatraSetuManagerData) return;
        window.YatraSetuManagerData.stakeholderMessages = updatedList;
        try {
            sessionStorage.setItem('yatrasetu_stakeholder_messages', JSON.stringify(updatedList));
            localStorage.setItem('yatrasetu_stakeholder_messages', JSON.stringify(updatedList));
        } catch (e) {
            // storage quota/access guard
        }

        // Cross-workspace synchronization with Stakeholder Store
        if (window.YatraSetuStakeholderData) {
            window.YatraSetuStakeholderData.suggestions = updatedList.map(m => ({
                ...m,
                suggestionText: m.message,
                submittedAt: m.submitted_at,
                managerNote: m.manager_response || (m.status === 'In Review' ? 'Under active review by Destination Manager' : 'Awaiting Manager Review'),
                statusClass: m.status === 'Responded' ? 'accepted' : (m.status === 'In Review' ? 'review' : 'pending')
            }));
        }
    },

    updateStakeholderMessage(msgId, updates) {
        let fullList = (window.YatraSetuManagerData && window.YatraSetuManagerData.stakeholderMessages) || [];
        try {
            const rawStored = sessionStorage.getItem('yatrasetu_stakeholder_messages') || localStorage.getItem('yatrasetu_stakeholder_messages');
            if (rawStored) {
                const parsed = JSON.parse(rawStored);
                if (Array.isArray(parsed)) fullList = parsed;
            }
        } catch (e) {}

        const target = fullList.find(m => m.id === msgId);
        if (target) {
            Object.assign(target, updates);
            this.saveStakeholderMessages(fullList);
            return target;
        }
        return null;
    },

    // FR-15 Destination Information Videos Store Engine
    async getDestinationVideos(stateId, destinationId = 'all') {
        if (!window.YatraSetuManagerData) return [];
        let list = window.YatraSetuManagerData.destinationVideos || [];

        // Try restoring from browser storage (sessionStorage / localStorage)
        try {
            const rawStored = sessionStorage.getItem('yatrasetu_destination_videos') || localStorage.getItem('yatrasetu_destination_videos');
            if (rawStored) {
                const parsed = JSON.parse(rawStored);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    // Smart merge: synchronize authoritative catalog data while preserving user additions
                    const baseMap = new Map((window.YatraSetuManagerData.destinationVideos || []).map(v => [v.id, v]));
                    const merged = parsed.map(storedItem => {
                        const baseItem = baseMap.get(storedItem.id);
                        if (baseItem) {
                            const item = {
                                ...storedItem,
                                title: baseItem.title,
                                description: baseItem.description,
                                destination_id: baseItem.destination_id,
                                destination_name: baseItem.destination_name,
                                category: baseItem.category,
                                video_url: baseItem.video_url,
                                thumbnail_url: baseItem.thumbnail_url,
                                duration: baseItem.duration,
                                publisher: baseItem.publisher,
                                is_verified_asset: baseItem.is_verified_asset,
                                verification_state: baseItem.verification_state,
                                verification_status: baseItem.verification_status,
                                embed_permission: baseItem.embed_permission
                            };
                            // Enforce publication integrity on prototypes
                            if (!item.is_verified_asset || item.verification_state === 'prototype_metadata' || (item.video_url && item.video_url.includes('prototype'))) {
                                item.status = 'Draft';
                            }
                            return item;
                        }
                        return storedItem;
                    });
                    const storedIds = new Set(parsed.map(p => p.id));
                    (window.YatraSetuManagerData.destinationVideos || []).forEach(baseItem => {
                        if (!storedIds.has(baseItem.id)) {
                            merged.push(baseItem);
                        }
                    });
                    list = merged;
                    window.YatraSetuManagerData.destinationVideos = merged;
                }
            } else if (list.length > 0) {
                sessionStorage.setItem('yatrasetu_destination_videos', JSON.stringify(list));
                localStorage.setItem('yatrasetu_destination_videos', JSON.stringify(list));
            }
        } catch (e) {}

        if (stateId && stateId !== 'all') {
            list = list.filter(v => v.state_id === stateId);
        }
        if (destinationId && destinationId !== 'all') {
            list = list.filter(v => v.destination_id === destinationId || (v.destination_id && v.destination_id.includes(destinationId)));
        }
        return list;
    },

    saveDestinationVideos(updatedList) {
        if (!window.YatraSetuManagerData) return;
        window.YatraSetuManagerData.destinationVideos = updatedList;
        try {
            sessionStorage.setItem('yatrasetu_destination_videos', JSON.stringify(updatedList));
            localStorage.setItem('yatrasetu_destination_videos', JSON.stringify(updatedList));
        } catch (e) {}
    },

    updateDestinationVideo(videoId, updates) {
        let fullList = (window.YatraSetuManagerData && window.YatraSetuManagerData.destinationVideos) || [];
        try {
            const rawStored = sessionStorage.getItem('yatrasetu_destination_videos') || localStorage.getItem('yatrasetu_destination_videos');
            if (rawStored) {
                const parsed = JSON.parse(rawStored);
                if (Array.isArray(parsed)) fullList = parsed;
            }
        } catch (e) {}

        const target = fullList.find(v => v.id === videoId);
        if (target) {
            Object.assign(target, updates);
            target.updated_at = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
            this.saveDestinationVideos(fullList);
            return target;
        }
        return null;
    },

    addDestinationVideo(videoData) {
        let fullList = (window.YatraSetuManagerData && window.YatraSetuManagerData.destinationVideos) || [];
        try {
            const rawStored = sessionStorage.getItem('yatrasetu_destination_videos') || localStorage.getItem('yatrasetu_destination_videos');
            if (rawStored) {
                const parsed = JSON.parse(rawStored);
                if (Array.isArray(parsed)) fullList = parsed;
            }
        } catch (e) {}

        const newVideo = {
            id: 'vid-' + (videoData.state_id ? videoData.state_id.slice(0, 2) : 'gen') + '-' + Date.now().toString().slice(-4),
            created_at: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
            updated_at: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
            duration: videoData.duration || '0:30',
            is_verified_asset: Boolean(videoData.is_verified_asset),
            status: videoData.status || 'Draft',
            ...videoData
        };
        fullList.unshift(newVideo);
        this.saveDestinationVideos(fullList);
        return newVideo;
    },

    deleteDestinationVideo(videoId) {
        let fullList = (window.YatraSetuManagerData && window.YatraSetuManagerData.destinationVideos) || [];
        try {
            const rawStored = sessionStorage.getItem('yatrasetu_destination_videos') || localStorage.getItem('yatrasetu_destination_videos');
            if (rawStored) {
                const parsed = JSON.parse(rawStored);
                if (Array.isArray(parsed)) fullList = parsed;
            }
        } catch (e) {}

        const filtered = fullList.filter(v => v.id !== videoId);
        this.saveDestinationVideos(filtered);
        return true;
    }
};

/**
 * Central YatraSetu Manager Context Engine
 * Manages activeStateId, activeDestinationId, managerScope, managerRole.
 * Persists context across page reloads via sessionStorage.
 */
window.YatraSetuManagerContext = {
    _state: {
        activeStateId: 'maharashtra',
        activeDestinationId: 'all',
        managerScope: 'state',
        managerRole: 'state_manager'
    },
    _listeners: [],

    init() {
        const profile = syncActiveManagerProfile() || {};
        const isStateScope = (profile.scope || 'STATE') === 'STATE';

        const urlParams = new URLSearchParams(window.location.search);
        const urlDest = urlParams.get('dest');
        const urlState = urlParams.get('state');

        let savedState = urlState || sessionStorage.getItem('yatrasetu_active_state_id') || profile.state_id || 'maharashtra';
        let savedDest = urlDest || sessionStorage.getItem('yatrasetu_active_dest_id') || (isStateScope ? 'all' : (profile.destination_id || 'all'));

        if (urlDest && window.YatraSetuManagerData && window.YatraSetuManagerData.destinations) {
            const matchDest = window.YatraSetuManagerData.destinations.find(d => d.id === urlDest);
            if (matchDest) {
                savedState = matchDest.state_id;
            }
        }

        this._state.activeStateId = STATE_CONFIGS[savedState] ? savedState : (profile.state_id || 'maharashtra');
        this._state.activeDestinationId = savedDest;
        this._state.managerScope = isStateScope ? 'state' : 'destination';
        this._state.managerRole = isStateScope ? 'state_manager' : 'destination_manager';

        this.persist();
        this.applyContextToDOM();
        this.bindSelectors();
        this.bindDestinationCards();

        if (typeof renderConnectedViews === 'function') {
            renderConnectedViews(this.getActiveContext());
        }
    },

    getActiveContext() {
        return { ...this._state };
    },

    setState(stateId) {
        if (!stateId || !STATE_CONFIGS[stateId]) return;
        this._state.activeStateId = stateId;
        // Reset destination to 'all' when state changes to prevent state-destination mismatch
        this._state.activeDestinationId = 'all';
        this.persist();
        this.applyContextToDOM();
        this.notifyListeners('stateChange');
    },

    setDestination(destId, parentStateId = null) {
        if (parentStateId && STATE_CONFIGS[parentStateId]) {
            this._state.activeStateId = parentStateId;
        }
        this._state.activeDestinationId = destId || 'all';
        this.persist();
        this.applyContextToDOM();
        this.notifyListeners('destinationChange');
    },

    persist() {
        sessionStorage.setItem('yatrasetu_active_state_id', this._state.activeStateId);
        sessionStorage.setItem('yatrasetu_active_dest_id', this._state.activeDestinationId);
        sessionStorage.setItem('yatrasetu_manager_scope', this._state.managerScope);
        sessionStorage.setItem('yatrasetu_manager_role', this._state.managerRole);
        sessionStorage.setItem('yatrasetu_state_theme', this._state.activeStateId);
    },

    applyContextToDOM() {
        const stateKey = this._state.activeStateId;
        const config = STATE_CONFIGS[stateKey] || STATE_CONFIGS['maharashtra'];

        // Synchronize state theme attributes on root html and body
        document.documentElement.setAttribute('data-state-theme', config.theme || stateKey);
        document.body.setAttribute('data-state-theme', config.theme || stateKey);
        document.body.setAttribute('data-theme', config.theme || stateKey);

        // Update topbar state selector dropdowns across pages (disabled on subpages)
        const isDashboard = window.location.pathname.includes('dashboard.html') || window.location.pathname.endsWith('/manager/') || window.location.pathname === '/manager';
        const stateSelectors = document.querySelectorAll('#destination-context-select, .state-select-dropdown');
        stateSelectors.forEach(select => {
            if (select) {
                select.value = stateKey;
                if (!isDashboard) {
                    select.disabled = true;
                    select.title = "State context is managed from the Dashboard";
                } else {
                    select.disabled = false;
                }
            }
        });

        // Update destination selectors if present
        const destSelectors = document.querySelectorAll('#destination-filter-select, .destination-context-dropdown');
        destSelectors.forEach(select => {
            if (select && select.value !== this._state.activeDestinationId) {
                select.value = this._state.activeDestinationId;
            }
        });

        // Update topbar state label if present
        const stateBtnLabel = document.getElementById('topbar-state-label');
        if (stateBtnLabel && config.badge) {
            stateBtnLabel.textContent = config.badge.charAt(0) + config.badge.slice(1).toLowerCase();
        }

        // Update sidebar context badge
        const sidebarRoleState = document.getElementById('sidebar-role-state');
        if (sidebarRoleState && config.badge) {
            sidebarRoleState.textContent = config.badge;
        }

        // Check account deactivation
        const profile = (window.YatraSetuManagerData && window.YatraSetuManagerData.profile) || {};
        let deactBanner = document.getElementById('mgr-account-deactivated-banner');
        if (profile.account_status === 'Deactivated' || profile.status === 'Deactivated') {
            if (!deactBanner) {
                deactBanner = document.createElement('div');
                deactBanner.id = 'mgr-account-deactivated-banner';
                deactBanner.style.cssText = 'background: #FEF2F2; border-bottom: 2px solid #EF4444; color: #991B1B; padding: 0.75rem 1.25rem; font-size: 0.82rem; font-weight: 600; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 1000; box-shadow: 0 2px 8px rgba(220,38,38,0.1);';
                deactBanner.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 0.6rem;">
                        <span style="font-size: 1.1rem;">⚠️</span>
                        <span><strong>Account Suspended:</strong> This Destination Manager account has been deactivated by the Platform Administrator. Operational actions, approvals, and content modifications are locked.</span>
                    </div>
                    <span style="font-size: 0.75rem; background: #DC2626; color: #FFFFFF; padding: 0.2rem 0.6rem; border-radius: 4px;">Deactivated</span>
                `;
                const main = document.querySelector('.app-main') || document.body;
                main.insertBefore(deactBanner, main.firstChild);
            }
        } else if (deactBanner) {
            deactBanner.remove();
        }

        // Apply hero image & texts if present
        const heroBg = document.querySelector('.destination-hero-bg');
        if (heroBg && config.heroImg) {
            heroBg.style.backgroundImage = `url('${config.heroImg}')`;
        }

        const heroTagline = document.getElementById('hero-tagline');
        const heroHeading = document.getElementById('hero-heading');
        const heroSubtitle = document.getElementById('hero-subtitle');
        const heroQuote = document.getElementById('hero-quote-text');
        const heroWeather = document.getElementById('hero-weather-text');
        const heroLocation = document.getElementById('hero-location-text');

        if (heroTagline) heroTagline.textContent = config.tagline;
        if (heroHeading) heroHeading.innerHTML = config.title;
        if (heroSubtitle) heroSubtitle.textContent = config.subtitle;
        if (heroQuote) heroQuote.textContent = config.quote;
        if (heroWeather) heroWeather.textContent = config.weather;
        if (heroLocation) heroLocation.textContent = config.location;

        // Fetch top destinations asynchronously via YatraSetuManagerStore
        if (typeof window.YatraSetuManagerStore !== 'undefined') {
            window.YatraSetuManagerStore.getDestinations(stateKey).then(destinations => {
                const topDestList = document.getElementById('top-destinations-list');
                if (topDestList && destinations && destinations.length > 0) {
                    topDestList.innerHTML = destinations.map(item => `
                        <div class="ranking-item" data-destination="${item.id}">
                            <div class="ranking-num">${item.rank}</div>
                            <span>${item.name}</span>
                        </div>
                    `).join('');
                }
            });
        }

        const exploreBannerText = document.getElementById('explore-banner-text');
        if (exploreBannerText) exploreBannerText.textContent = config.exploreText;

        // Fetch events asynchronously via YatraSetuManagerStore
        if (typeof window.YatraSetuManagerStore !== 'undefined') {
            window.YatraSetuManagerStore.getEvents(stateKey, this._state.activeDestinationId).then(events => {
                const eventsList = document.getElementById('upcoming-events-list');
                if (eventsList && events && events.length > 0) {
                    eventsList.innerHTML = events.map(ev => `
                        <div class="event-card-item">
                            <img src="${ev.img}" class="event-thumb-img" alt="${ev.title}">
                            <div class="event-date-badge">
                                <span class="event-date-num">${ev.dateNum}</span>
                                <span class="event-date-month">${ev.dateMonth}</span>
                            </div>
                            <div class="event-info-body">
                                <div class="event-item-title">${ev.title}</div>
                                <div class="event-item-location">${ev.location}</div>
                            </div>
                            <span class="status-pill ${ev.statusClass}">${ev.status}</span>
                        </div>
                    `).join('');
                }
            });
        }

        // Trigger connected view rendering for active subpage
        if (typeof renderConnectedViews === 'function') {
            renderConnectedViews(this._state);
        }
    },

    bindSelectors() {
        const stateSelectors = document.querySelectorAll('#destination-context-select, .state-select-dropdown');
        stateSelectors.forEach(select => {
            if (!select._contextBound) {
                select.addEventListener('change', (e) => {
                    // Only allow state changing on Dashboard
                    const isDashboard = window.location.pathname.includes('dashboard.html') || window.location.pathname.endsWith('/manager/') || window.location.pathname === '/manager';
                    if (isDashboard && !select.disabled) {
                        this.setState(e.target.value);
                    }
                });
                select._contextBound = true;
            }
        });

        const destSelectors = document.querySelectorAll('#destination-filter-select, .destination-context-dropdown');
        destSelectors.forEach(select => {
            if (!select._destContextBound) {
                select.addEventListener('change', (e) => {
                    this.setDestination(e.target.value);
                });
                select._destContextBound = true;
            }
        });
    },

    bindDestinationCards() {
        document.addEventListener('click', (e) => {
            const card = e.target.closest('[data-destination-id], .dest-card, .dest-directory-card, .ranking-item');
            if (card) {
                const destId = card.getAttribute('data-destination-id') ||
                               card.getAttribute('data-destination') ||
                               card.querySelector('.destination-title, .dest-card-title, h3, h4, span')?.textContent?.trim().toLowerCase().replace(/\s+/g, '-');
                if (destId) {
                    const parentState = card.getAttribute('data-state-id') || this._state.activeStateId;
                    this.setDestination(destId, parentState);
                    const isDashboard = window.location.pathname.includes('dashboard.html') || window.location.pathname.endsWith('/manager/') || window.location.pathname === '/manager';
                    const navHref = card.getAttribute('data-href') || (isDashboard ? 'destinations.html' : null);
                    if (navHref) {
                        window.location.href = navHref;
                    }
                }
            }
        });
    },

    onContextChange(callback) {
        if (typeof callback === 'function') {
            this._listeners.push(callback);
        }
    },

    notifyListeners(eventType) {
        this._listeners.forEach(fn => {
            try { fn(this.getActiveContext(), eventType); } catch (err) { console.error(err); }
        });
    }
};

/**
 * Shared Topbar Features Initialization (Across all 11 Manager Pages)
 */
function initTopbarSharedFeatures() {
    const topbar = document.querySelector('.app-topbar');
    if (!topbar) return;

    // Enforce topbar structural integrity
    topbar.style.height = '64px';
    topbar.style.minHeight = '64px';
    topbar.style.maxHeight = '64px';
    topbar.style.boxSizing = 'border-box';

    // 1. Sidebar Mobile Menu Toggle
    const sidebarToggleBtn = document.getElementById('sidebar-toggle-btn') || topbar.querySelector('.mobile-menu-toggle');
    const appSidebar = document.getElementById('app-sidebar') || document.querySelector('.app-sidebar');

    if (sidebarToggleBtn && appSidebar) {
        sidebarToggleBtn.onclick = (e) => {
            e.stopPropagation();
            appSidebar.classList.toggle('show');
        };
    }

    // 2. Global Search Box
    const searchBox = topbar.querySelector('.search-box');
    if (searchBox) {
        searchBox.style.position = 'relative';
        const searchInput = searchBox.querySelector('.search-input');
        if (searchInput) {
            searchInput.placeholder = "Search destinations, attractions, events...";
            searchInput.autocomplete = "off";

            let searchResultsPanel = document.getElementById('topbar-search-results');
            if (!searchResultsPanel) {
                searchResultsPanel = document.createElement('div');
                searchResultsPanel.id = 'topbar-search-results';
                searchResultsPanel.className = 'topbar-dropdown-panel search-results-floating';
                searchBox.appendChild(searchResultsPanel);
            }

            searchInput.oninput = (e) => {
                const notifPanel = document.getElementById('notification-dropdown-panel');
                if (notifPanel) notifPanel.classList.remove('show');
                const userMenuPanel = document.getElementById('user-menu-dropdown-panel');
                if (userMenuPanel) userMenuPanel.classList.remove('show');

                const query = e.target.value.trim().toLowerCase();
                if (query.length < 2) {
                    searchResultsPanel.classList.remove('show');
                    return;
                }

                const data = window.YatraSetuManagerData || {};
                const dests = (data.destinations || []).filter(d => (d.name || '').toLowerCase().includes(query)).slice(0, 3);
                const attrs = (data.attractions || []).filter(a => (a.name || '').toLowerCase().includes(query)).slice(0, 3);
                const evts = (data.events || []).filter(e => (e.title || '').toLowerCase().includes(query)).slice(0, 3);
                const shs = (data.stakeholders || []).filter(s => (s.name || '').toLowerCase().includes(query)).slice(0, 3);

                if (dests.length === 0 && attrs.length === 0 && evts.length === 0 && shs.length === 0) {
                    searchResultsPanel.innerHTML = `
                        <div style="padding: 1rem; text-align: center; color: var(--text-muted); font-size: 0.85rem;">
                            No results found for "${query}"
                        </div>
                    `;
                    searchResultsPanel.classList.add('show');
                    return;
                }

                let html = '<div class="topbar-dropdown-body" style="max-height: 360px;">';

                if (dests.length > 0) {
                    html += `<div class="search-result-group-header">Destinations</div>`;
                    dests.forEach(d => {
                        html += `
                            <div class="search-result-item" data-search-type="dest" data-id="${d.id}" data-state="${d.state_id}">
                                <div class="search-result-info">
                                    <span class="search-result-title">📍 ${d.name}</span>
                                    <span class="search-result-sub">${d.category || 'Destination'}</span>
                                </div>
                                <span class="search-result-badge">${d.state_id}</span>
                            </div>
                        `;
                    });
                }

                if (attrs.length > 0) {
                    html += `<div class="search-result-group-header">Attractions</div>`;
                    attrs.forEach(a => {
                        html += `
                            <div class="search-result-item" data-search-type="attr" data-id="${a.id}" data-dest="${a.destination_id}" data-state="${a.state_id}">
                                <div class="search-result-info">
                                    <span class="search-result-title">🏛️ ${a.name}</span>
                                    <span class="search-result-sub">${a.category || 'Attraction'}</span>
                                </div>
                                <span class="search-result-badge">${a.state_id}</span>
                            </div>
                        `;
                    });
                }

                if (evts.length > 0) {
                    html += `<div class="search-result-group-header">Events</div>`;
                    evts.forEach(ev => {
                        html += `
                            <div class="search-result-item" data-search-type="event" data-id="${ev.id}" data-dest="${ev.destination_id}" data-state="${ev.state_id}">
                                <div class="search-result-info">
                                    <span class="search-result-title">🎉 ${ev.title}</span>
                                    <span class="search-result-sub">${ev.location || 'Event'}</span>
                                </div>
                                <span class="search-result-badge">${ev.state_id}</span>
                            </div>
                        `;
                    });
                }

                if (shs.length > 0) {
                    html += `<div class="search-result-group-header">Stakeholders</div>`;
                    shs.forEach(s => {
                        html += `
                            <div class="search-result-item" data-search-type="sh" data-id="${s.id}" data-dest="${s.destination_id}" data-state="${s.state_id}">
                                <div class="search-result-info">
                                    <span class="search-result-title">🤝 ${s.name}</span>
                                    <span class="search-result-sub">${s.category || 'Partner'}</span>
                                </div>
                                <span class="search-result-badge">${s.state_id}</span>
                            </div>
                        `;
                    });
                }

                html += '</div>';
                searchResultsPanel.innerHTML = html;
                searchResultsPanel.classList.add('show');

                searchResultsPanel.querySelectorAll('.search-result-item').forEach(item => {
                    item.onclick = (ev) => {
                        ev.stopPropagation();
                        const type = item.getAttribute('data-search-type');
                        const id = item.getAttribute('data-id');
                        const dest = item.getAttribute('data-dest') || id;
                        const state = item.getAttribute('data-state');

                        if (window.YatraSetuManagerContext) {
                            window.YatraSetuManagerContext.setDestination(dest, state);
                        }

                        searchResultsPanel.classList.remove('show');
                        searchInput.value = '';

                        if (type === 'dest') {
                            window.location.href = `destinations.html?dest=${id}`;
                        } else if (type === 'attr') {
                            window.location.href = `attractions.html?dest=${dest}`;
                        } else if (type === 'event') {
                            window.location.href = `events.html?dest=${dest}`;
                        } else if (type === 'sh') {
                            window.location.href = `stakeholders.html?dest=${dest}`;
                        }
                    };
                });
            };
        }
    }

    // 3. Notification Bell Wrapper & Floating Panel
    const notifBtn = topbar.querySelector('.notification-btn');
    if (notifBtn) {
        let notifWrapper = notifBtn.parentElement;
        if (!notifWrapper.classList.contains('topbar-action-wrapper')) {
            notifWrapper = document.createElement('div');
            notifWrapper.className = 'topbar-action-wrapper';
            notifWrapper.style.position = 'relative';
            notifBtn.parentNode.insertBefore(notifWrapper, notifBtn);
            notifWrapper.appendChild(notifBtn);
        }

        const notifBadge = notifBtn.querySelector('.notification-badge');

        const updateNotifBadge = () => {
            const notifications = (window.YatraSetuManagerData && window.YatraSetuManagerData.notifications) ? window.YatraSetuManagerData.notifications : [];
            const unreadCount = notifications.filter(n => !n.read).length;
            if (notifBadge) {
                notifBadge.textContent = unreadCount;
                notifBadge.style.display = unreadCount > 0 ? 'flex' : 'none';
            }
        };
        updateNotifBadge();

        let notifPanel = document.getElementById('notification-dropdown-panel');
        if (!notifPanel) {
            notifPanel = document.createElement('div');
            notifPanel.id = 'notification-dropdown-panel';
            notifPanel.className = 'topbar-dropdown-panel notif-dropdown-floating';
            notifWrapper.appendChild(notifPanel);
        }

        const renderNotifList = () => {
            const notifications = (window.YatraSetuManagerData && window.YatraSetuManagerData.notifications) ? window.YatraSetuManagerData.notifications : [];
            let html = `
                <div class="topbar-dropdown-header">
                    <span>Notifications</span>
                    <button type="button" id="btn-mark-all-read" style="background:none; border:none; color: var(--state-accent); font-size: 0.75rem; font-weight: 700; cursor: pointer;">Mark all read</button>
                </div>
                <div class="topbar-dropdown-body" id="notification-list-body">
            `;

            if (notifications.length === 0) {
                html += `<div style="padding: 1.5rem; text-align: center; color: var(--text-muted); font-size: 0.85rem;">No new notifications</div>`;
            } else {
                html += notifications.map(n => `
                    <div class="notification-item ${n.read ? '' : 'unread'}" data-notif-id="${n.id}">
                        <div class="notification-title">${n.title}</div>
                        <div class="notification-msg">${n.message}</div>
                        <div class="notification-time">${n.time}</div>
                    </div>
                `).join('');
            }

            html += `
                </div>
                <div class="topbar-dropdown-footer">
                    <span style="color: var(--text-muted); font-size: 0.75rem;">YatraSetu Real-time Updates</span>
                </div>
            `;
            notifPanel.innerHTML = html;

            const markAllReadBtn = notifPanel.querySelector('#btn-mark-all-read');
            if (markAllReadBtn) {
                markAllReadBtn.onclick = (e) => {
                    e.stopPropagation();
                    if (window.YatraSetuManagerData && window.YatraSetuManagerData.notifications) {
                        window.YatraSetuManagerData.notifications.forEach(n => n.read = true);
                    }
                    updateNotifBadge();
                    renderNotifList();
                };
            }
        };

        notifBtn.onclick = (e) => {
            e.stopPropagation();
            // Close other popups
            const userMenuPanel = document.getElementById('user-menu-dropdown-panel');
            if (userMenuPanel) userMenuPanel.classList.remove('show');
            const searchResults = document.getElementById('topbar-search-results');
            if (searchResults) searchResults.classList.remove('show');

            renderNotifList();
            notifPanel.classList.toggle('show');
        };
    }

    // 4. User Profile Badge Wrapper & Floating Menu Panel
    const userBadge = topbar.querySelector('.user-profile-badge');
    if (userBadge) {
        let badgeWrapper = userBadge.parentElement;
        if (!badgeWrapper.classList.contains('user-profile-badge-wrapper')) {
            badgeWrapper = document.createElement('div');
            badgeWrapper.className = 'user-profile-badge-wrapper';
            badgeWrapper.style.position = 'relative';
            userBadge.parentNode.insertBefore(badgeWrapper, userBadge);
            badgeWrapper.appendChild(userBadge);
        }

        userBadge.style.cursor = 'pointer';

        // Add dropdown arrow/caret if missing
        if (!userBadge.querySelector('.user-caret')) {
            const caret = document.createElement('span');
            caret.className = 'user-caret';
            caret.textContent = ' ▾';
            caret.style.fontSize = '0.8rem';
            caret.style.color = 'var(--text-muted)';
            userBadge.appendChild(caret);
        }

        const profile = syncActiveManagerProfile() || {
            name: 'Rajesh Patil',
            avatar_initials: 'RP',
            manager_type: 'State Manager',
            destination: 'Maharashtra (All Destinations)'
        };

        const userAvatarEl = userBadge.querySelector('.user-avatar');
        const userNameEl = userBadge.querySelector('.user-name');
        const userRoleEl = userBadge.querySelector('.user-role') || userBadge.querySelector('span[style*="font-size: 0.7rem"]');
        if (userAvatarEl && profile.avatar_initials) userAvatarEl.textContent = profile.avatar_initials;
        if (userNameEl && profile.name) userNameEl.textContent = profile.name;
        if (userRoleEl) {
            const terr = profile.destination || profile.state_name || 'Maharashtra';
            userRoleEl.textContent = `${profile.manager_type || profile.access_level || 'Destination Manager'} • ${terr}`;
        }

        let userMenuPanel = document.getElementById('user-menu-dropdown-panel');
        if (!userMenuPanel) {
            userMenuPanel = document.createElement('div');
            userMenuPanel.id = 'user-menu-dropdown-panel';
            userMenuPanel.className = 'topbar-dropdown-panel user-menu-floating';
            userMenuPanel.innerHTML = `
                <a href="profile.html" class="user-menu-item">👤 View Profile</a>
                <a href="profile.html?action=edit" class="user-menu-item">✏️ Edit Profile</a>
                <a href="profile.html?tab=security" class="user-menu-item">🔒 Account Security</a>
                <button type="button" class="user-menu-item logout" id="topbar-btn-logout">🚪 Logout</button>
            `;
            badgeWrapper.appendChild(userMenuPanel);

            const logoutBtn = userMenuPanel.querySelector('#topbar-btn-logout');
            if (logoutBtn) {
                logoutBtn.onclick = (e) => {
                    e.stopPropagation();
                    sessionStorage.clear();
                    window.location.href = '../login.html';
                };
            }
        }

        userBadge.onclick = (e) => {
            e.stopPropagation();
            // Close other popups
            const notifPanel = document.getElementById('notification-dropdown-panel');
            if (notifPanel) notifPanel.classList.remove('show');
            const searchResults = document.getElementById('topbar-search-results');
            if (searchResults) searchResults.classList.remove('show');

            userMenuPanel.classList.toggle('show');
        };
    }

    // 5. Mutually Exclusive Dismiss & Global Outside Click / Escape Listeners
    document.onclick = (e) => {
        const notifPanel = document.getElementById('notification-dropdown-panel');
        const notifBtn = topbar.querySelector('.notification-btn');
        if (notifPanel && notifBtn && !notifPanel.contains(e.target) && !notifBtn.contains(e.target)) {
            notifPanel.classList.remove('show');
        }

        const userMenuPanel = document.getElementById('user-menu-dropdown-panel');
        const userBadge = topbar.querySelector('.user-profile-badge');
        if (userMenuPanel && userBadge && !userMenuPanel.contains(e.target) && !userBadge.contains(e.target)) {
            userMenuPanel.classList.remove('show');
        }

        const searchResultsPanel = document.getElementById('topbar-search-results');
        const searchBox = topbar.querySelector('.search-box');
        if (searchResultsPanel && searchBox && !searchResultsPanel.contains(e.target) && !searchBox.contains(e.target)) {
            searchResultsPanel.classList.remove('show');
        }
    };

    document.onkeydown = (e) => {
        if (e.key === 'Escape') {
            const notifPanel = document.getElementById('notification-dropdown-panel');
            if (notifPanel) notifPanel.classList.remove('show');
            const userMenuPanel = document.getElementById('user-menu-dropdown-panel');
            if (userMenuPanel) userMenuPanel.classList.remove('show');
            const searchResultsPanel = document.getElementById('topbar-search-results');
            if (searchResultsPanel) searchResultsPanel.classList.remove('show');
        }
    };
}

let currentStateList = ['maharashtra', 'kerala', 'kashmir', 'rajasthan', 'goa', 'tamilnadu', 'uttarakhand', 'assam'];
let currentStateIdx = 0;

/**
 * Initialize State Dropdown and Transform Dashboard Theme Dynamically
 */
function initDestinationStateContext() {
    window.YatraSetuManagerContext.init();

    const stateBtn = document.getElementById('topbar-state-btn');
    if (stateBtn) {
        stateBtn.addEventListener('click', () => {
            cycleStateTheme();
        });
    }
}

function cycleStateTheme() {
    const list = currentStateList;
    const current = window.YatraSetuManagerContext.getActiveContext().activeStateId;
    let idx = list.indexOf(current);
    idx = (idx + 1) % list.length;
    window.YatraSetuManagerContext.setState(list[idx]);
}

function applyStateTheme(stateKey) {
    window.YatraSetuManagerContext.setState(stateKey);
}

/**
 * Manager Modal Controls
 */
function initManagerModals() {
    const openButtons = document.querySelectorAll('[data-modal-target]');
    const closeButtons = document.querySelectorAll('.modal-close, [data-modal-close]');

    openButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-modal-target');
            const modal = document.getElementById(targetId);
            if (modal) {
                modal.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        });
    });

    closeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const modal = btn.closest('.app-modal');
            if (modal) {
                modal.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    });

    document.querySelectorAll('.app-modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initDestinationStateContext();
    initManagerModals();
    initTopbarSharedFeatures();
});
