/**
 * YatraSetu — Administrator Governance & User Access Control (admin.js)
 * Manages platform accounts, RBAC enforcement, stakeholder business registration
 * governance, account activation/deactivation/deletion, controlled destination
 * reassignment with administrative platform audit trail logging.
 *
 * RULES ENFORCED:
 * 1. A stakeholder submits a business registration for a selected state & destination.
 * 2. Authorized Destination Manager reviews it within their jurisdiction.
 * 3. Once approved, the stakeholder cannot change the registered destination through ordinary editing.
 * 4. Any authorized correction or reassignment must follow a controlled process with an audit trail.
 * 5. Only the Administrator can activate, deactivate, or delete stakeholder accounts.
 * 6. State Manager is an access level within Destination Manager, not a fifth role.
 * 7. Enforced at the application layer with clean contracts for Phase 11 PostgreSQL + FastAPI.
 */

(function () {
    'use strict';

    // =========================================================================
    // 1. DEFAULT SEED ACCOUNTS & AUDIT LOGS
    // =========================================================================
    const DEFAULT_ADMIN_USERS = [
        // Administrators
        {
            id: 'usr-adm-01',
            name: 'Rajesh Verma',
            email: 'admin.governance@yatrasetu.in',
            role: 'admin',
            access_level: 'Platform Administrator',
            state_id: 'all',
            destination_id: 'all',
            destination_name: 'All Jurisdictions (Global)',
            organization: 'YatraSetu Project Administration',
            account_status: 'Active',
            registration_status: 'Verified Platform Admin',
            created_at: '01 Jan 2026',
            last_active: 'Just now'
        },
        // Destination Managers (Access Level: State Manager)
        {
            id: 'usr-mgr-01',
            name: 'Rajesh Patil',
            email: 'manager.maharashtra@yatrasetu.in',
            role: 'manager',
            access_level: 'State Manager', // Access level within Destination Manager
            state_id: 'maharashtra',
            destination_id: 'all',
            destination_name: 'Maharashtra (All Destinations)',
            organization: 'Maharashtra Tourism Development Corporation (MTDC)',
            account_status: 'Active',
            registration_status: 'Approved Official',
            created_at: '15 Jan 2026',
            last_active: 'Today, 10:15 AM'
        },
        {
            id: 'usr-mgr-02',
            name: 'Sunita Nair',
            email: 'manager.kerala@yatrasetu.in',
            role: 'manager',
            access_level: 'State Manager',
            state_id: 'kerala',
            destination_id: 'all',
            destination_name: 'Kerala (All Destinations)',
            organization: 'Kerala Tourism Department',
            account_status: 'Active',
            registration_status: 'Approved Official',
            created_at: '18 Jan 2026',
            last_active: 'Yesterday, 16:30 PM'
        },
        // Destination Managers (Access Level: Local Destination Manager)
        {
            id: 'usr-mgr-03',
            name: 'Amit Saxena',
            email: 'manager.rajgad@yatrasetu.in',
            role: 'manager',
            access_level: 'Destination Manager', // Destination-specific access level
            state_id: 'maharashtra',
            destination_id: 'raigad-fort',
            destination_name: 'Rajgad Fort',
            organization: 'Archaeological Survey of India (ASI) Pune Circle',
            account_status: 'Active',
            registration_status: 'Approved Official',
            created_at: '01 Feb 2026',
            last_active: 'Yesterday, 14:15 PM'
        },
        {
            id: 'usr-mgr-04',
            name: 'Priya Menon',
            email: 'manager.munnar@yatrasetu.in',
            role: 'manager',
            access_level: 'Destination Manager', // Destination-specific access level
            state_id: 'kerala',
            destination_id: 'munnar-hills',
            destination_name: 'Munnar',
            organization: 'DTPC Idukki / Munnar Tourism Council',
            account_status: 'Active',
            registration_status: 'Approved Official',
            created_at: '05 Feb 2026',
            last_active: 'Today, 11:45 AM'
        },
        // Tourism Stakeholders
        {
            id: 'sh-101',
            name: 'Suresh Deshmukh',
            email: 'sahyadri.guides@gmail.com',
            role: 'stakeholder',
            access_level: 'Registered Business',
            state_id: 'maharashtra',
            destination_id: 'raigad-fort',
            destination_name: 'Rajgad Fort',
            organization: 'Sahyadri Trekking Guides Co-op',
            category: 'Guides',
            account_status: 'Active',
            registration_status: 'Approved',
            created_at: '02 Oct 2026',
            last_active: 'Today, 09:30 AM'
        },
        {
            id: 'sh-102',
            name: 'Sunita Malusare',
            email: 'torna.homestays@gmail.com',
            role: 'stakeholder',
            access_level: 'Registered Business',
            state_id: 'maharashtra',
            destination_id: 'raigad-fort',
            destination_name: 'Rajgad Fort',
            organization: 'Torna-Rajgad Base Homestay Collective',
            category: 'Homestays',
            account_status: 'Active',
            registration_status: 'Approved',
            created_at: '05 Oct 2026',
            last_active: '08 Oct 2026'
        },
        {
            id: 'sh-103',
            name: 'Balasaheb Jedhe',
            email: 'velhe.transport@gmail.com',
            role: 'stakeholder',
            access_level: 'Registered Business',
            state_id: 'maharashtra',
            destination_id: 'raigad-fort',
            destination_name: 'Rajgad Fort',
            organization: 'Velhe Eco-Transport & Jeep Services',
            category: 'Transport',
            account_status: 'Active',
            registration_status: 'Pending Approval',
            created_at: '09 Oct 2026',
            last_active: 'Yesterday, 11:20 AM'
        },
        {
            id: 'sh-104',
            name: 'Nitin Agarwal',
            email: 'lonavala.chikki.guild@gmail.com',
            role: 'stakeholder',
            access_level: 'Registered Business',
            state_id: 'maharashtra',
            destination_id: 'lonavala',
            destination_name: 'Lonavala',
            organization: 'Khandala-Lonavala Chikki & Farsan Guild',
            category: 'Food & Dining',
            account_status: 'Active',
            registration_status: 'Approved',
            created_at: '01 Oct 2026',
            last_active: '07 Oct 2026'
        },
        {
            id: 'sh-105',
            name: 'Ganesh Shinde',
            email: 'mahanagar.cabs@gmail.com',
            role: 'stakeholder',
            access_level: 'Registered Business',
            state_id: 'maharashtra',
            destination_id: 'lonavala',
            destination_name: 'Lonavala',
            organization: 'Mahanagar Travel Co. - Tourist Cabs',
            category: 'Transport',
            account_status: 'Active',
            registration_status: 'Pending Approval',
            created_at: '10 Oct 2026',
            last_active: 'Today, 11:45 AM'
        },
        {
            id: 'sh-106',
            name: 'Dr. Mohammed Farooqui',
            email: 'ajanta.guides@gmail.com',
            role: 'stakeholder',
            access_level: 'Registered Business',
            state_id: 'maharashtra',
            destination_id: 'ajanta-caves',
            destination_name: 'Ajanta Caves',
            organization: 'Ajanta Heritage Certified Guides Assn',
            category: 'Guides',
            account_status: 'Active',
            registration_status: 'Approved',
            created_at: '28 Sep 2026',
            last_active: '09 Oct 2026'
        },
        {
            id: 'sh-107',
            name: 'Mangala Kulkarni',
            email: 'paithani.weavers@gmail.com',
            role: 'stakeholder',
            access_level: 'Registered Business',
            state_id: 'maharashtra',
            destination_id: 'ajanta-caves',
            destination_name: 'Ajanta Caves',
            organization: 'Paithani & Bidri Handicraft Weavers Society',
            category: 'Handicrafts',
            account_status: 'Active',
            registration_status: 'Under Review',
            created_at: '08 Oct 2026',
            last_active: '09 Oct 2026'
        },
        {
            id: 'sh-201',
            name: 'Varghese Mathew',
            email: 'munnar.teaguides@gmail.com',
            role: 'stakeholder',
            access_level: 'Registered Business',
            state_id: 'kerala',
            destination_id: 'munnar-hills',
            destination_name: 'Munnar',
            organization: 'High Range Tea Trail Escorts Co-op',
            category: 'Guides',
            account_status: 'Active',
            registration_status: 'Approved',
            created_at: '25 Sep 2026',
            last_active: 'Yesterday, 15:20 PM'
        },
        {
            id: 'sh-301',
            name: 'Ghulam Rasool',
            email: 'dal.shikara.union@gmail.com',
            role: 'stakeholder',
            access_level: 'Registered Business',
            state_id: 'kashmir',
            destination_id: 'dal-lake-srinagar',
            destination_name: 'Dal Lake',
            organization: 'Dal Lake Shikara Owners Union',
            category: 'Transport',
            account_status: 'Active',
            registration_status: 'Approved',
            created_at: '20 Sep 2026',
            last_active: 'Yesterday, 17:00 PM'
        },
        {
            id: 'sh-401',
            name: 'Bhanwar Singh',
            email: 'amer.guides@gmail.com',
            role: 'stakeholder',
            access_level: 'Registered Business',
            state_id: 'rajasthan',
            destination_id: 'amber-fort',
            destination_name: 'Amer Fort',
            organization: 'Amer Heritage Tour Escorts Guild',
            category: 'Guides',
            account_status: 'Active',
            registration_status: 'Approved',
            created_at: '15 Sep 2026',
            last_active: 'Today, 10:00 AM'
        },
        // Tourists
        {
            id: 'usr-tourist-01',
            name: 'Ananya Sharma',
            email: 'tourist.demo@yatrasetu.in',
            role: 'tourist',
            access_level: 'Registered Tourist',
            state_id: 'all',
            destination_id: 'all',
            destination_name: 'Pan-India',
            organization: 'Individual Traveler',
            account_status: 'Active',
            registration_status: 'Verified Member',
            created_at: '20 Sep 2026',
            last_active: 'Today, 08:45 AM'
        }
    ];

    const DEFAULT_AUDIT_TRAIL = [
        {
            id: 'aud-000',
            timestamp: '15 Jan 2026, 10:00 AM',
            action: 'MANAGER_AUTHORITY_ASSIGNED',
            stakeholder_id: 'usr-mgr-01',
            stakeholder_name: 'Rajesh Patil',
            actor_name: 'Rajesh Verma',
            actor_role: 'Platform Administrator',
            details: 'Assigned State Manager access level for Maharashtra jurisdiction covering all regional destinations.',
            previous_value: 'Unassigned',
            new_value: 'State Manager • Maharashtra (All Destinations)'
        },
        {
            id: 'aud-001',
            timestamp: '03 Oct 2026, 11:30 AM',
            action: 'BUSINESS_REGISTRATION_APPROVED',
            stakeholder_id: 'sh-101',
            stakeholder_name: 'Sahyadri Trekking Guides Co-op',
            actor_name: 'Rajesh Patil',
            actor_role: 'Destination Manager (State Level)',
            details: 'Approved business registration for destination "Rajgad Fort" upon verification of guide credentials.',
            previous_value: 'Pending Approval',
            new_value: 'Approved'
        },
        {
            id: 'aud-002',
            timestamp: '06 Oct 2026, 03:15 PM',
            action: 'BUSINESS_REGISTRATION_APPROVED',
            stakeholder_id: 'sh-102',
            stakeholder_name: 'Torna-Rajgad Base Homestay Collective',
            actor_name: 'Rajesh Patil',
            actor_role: 'Destination Manager (State Level)',
            details: 'Approved business registration for destination "Rajgad Fort" after food safety inspection.',
            previous_value: 'Pending Approval',
            new_value: 'Approved'
        },
        {
            id: 'aud-003',
            timestamp: '09 Oct 2026, 04:00 PM',
            action: 'DESTINATION_ASSIGNMENT_INITIALIZED',
            stakeholder_id: 'sh-103',
            stakeholder_name: 'Velhe Eco-Transport & Jeep Services',
            actor_name: 'Balasaheb Jedhe',
            actor_role: 'Tourism Stakeholder',
            details: 'Submitted initial business registration for destination "Rajgad Fort" (Pending Approval).',
            previous_value: 'None',
            new_value: 'Rajgad Fort'
        }
    ];

    // =========================================================================
    // 2. APPLICATION-LAYER DATA STORE & ENFORCEMENT
    // =========================================================================
    const AdminStore = {
        STORAGE_KEY_USERS: 'yatrasetu_admin_users',
        STORAGE_KEY_AUDIT: 'yatrasetu_audit_trail',

        /**
         * Retrieve all system user accounts from storage or defaults.
         */
        getUsers() {
            try {
                const raw = localStorage.getItem(this.STORAGE_KEY_USERS) || sessionStorage.getItem(this.STORAGE_KEY_USERS);
                if (raw) {
                    const parsed = JSON.parse(raw);
                    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
                }
            } catch (e) {
                console.warn('[AdminStore] Failed to read user accounts from storage:', e);
            }
            this.saveUsers(DEFAULT_ADMIN_USERS);
            return [...DEFAULT_ADMIN_USERS];
        },

        /**
         * Persist user accounts to storage and sync with manager stakeholders.
         */
        saveUsers(users) {
            try {
                localStorage.setItem(this.STORAGE_KEY_USERS, JSON.stringify(users));
                sessionStorage.setItem(this.STORAGE_KEY_USERS, JSON.stringify(users));
            } catch (e) {
                console.warn('[AdminStore] Failed to persist user accounts:', e);
            }
            this.syncWithManagerData(users);
        },

        /**
         * Retrieve audit trail records.
         */
        getAuditTrail() {
            try {
                const raw = localStorage.getItem(this.STORAGE_KEY_AUDIT) || sessionStorage.getItem(this.STORAGE_KEY_AUDIT);
                if (raw) {
                    const parsed = JSON.parse(raw);
                    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
                }
            } catch (e) {
                console.warn('[AdminStore] Failed to read audit trail from storage:', e);
            }
            this.saveAuditTrail(DEFAULT_AUDIT_TRAIL);
            return [...DEFAULT_AUDIT_TRAIL];
        },

        /**
         * Append an administrative platform audit trail entry.
         */
        logAuditEvent(event) {
            const auditTrail = this.getAuditTrail();
            const newEvent = {
                id: `aud-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
                timestamp: new Date().toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                }) + ', ' + new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
                ...event
            };
            auditTrail.unshift(newEvent);
            this.saveAuditTrail(auditTrail);
            return newEvent;
        },

        saveAuditTrail(trail) {
            try {
                localStorage.setItem(this.STORAGE_KEY_AUDIT, JSON.stringify(trail));
                sessionStorage.setItem(this.STORAGE_KEY_AUDIT, JSON.stringify(trail));
            } catch (e) {
                console.warn('[AdminStore] Failed to persist audit trail:', e);
            }
        },

        /**
         * Cross-synchronize user stakeholders & manager profiles with Manager & Stakeholder stores.
         */
        syncWithManagerData(users) {
            if (!window.YatraSetuManagerData) return;

            // 1. Synchronize Stakeholders
            const stakeholders = users.filter(u => u.role === 'stakeholder');
            if (!window.YatraSetuManagerData.stakeholders) window.YatraSetuManagerData.stakeholders = [];

            stakeholders.forEach(sh => {
                const existing = window.YatraSetuManagerData.stakeholders.find(s => s.id === sh.id || s.email === sh.email);
                if (existing) {
                    existing.destination_id = sh.destination_id;
                    existing.destination = sh.destination_name;
                    existing.state_id = sh.state_id;
                    existing.account_status = sh.account_status;
                    existing.status = sh.registration_status;
                } else {
                    window.YatraSetuManagerData.stakeholders.push({
                        id: sh.id,
                        name: sh.organization || sh.name,
                        contact_person: sh.name,
                        email: sh.email,
                        state_id: sh.state_id,
                        destination_id: sh.destination_id,
                        destination: sh.destination_name,
                        category: sh.category || 'Tourism Partner',
                        account_status: sh.account_status,
                        status: sh.registration_status,
                        type: 'visitor-facing',
                        registered_date: sh.created_at
                    });
                }
            });

            // Also update session manager stakeholders if store adapter is loaded
            if (window.YatraSetuManagerStore && typeof window.YatraSetuManagerStore.saveStakeholders === 'function') {
                window.YatraSetuManagerStore.saveStakeholders(window.YatraSetuManagerData.stakeholders);
            }

            // 2. Synchronize Active/Primary Manager Profile
            const managers = users.filter(u => u.role === 'manager');
            const sessionEmail = sessionStorage.getItem('yatrasetu_email');
            const sessionRole = sessionStorage.getItem('yatrasetu_role');
            const isManagerSession = sessionRole === 'manager' && sessionEmail;
            const primaryManager = managers.find(m => isManagerSession ? m.email.toLowerCase() === sessionEmail.toLowerCase() : m.id === 'usr-mgr-01') || managers[0];

            if (primaryManager) {
                const managerData = window.YatraSetuManagerData || {};
                const destinations = managerData.destinations || [];
                const states = managerData.states || [];
                const stateObj = states.find(s => s.id === primaryManager.state_id);
                const stateName = stateObj ? stateObj.name : (primaryManager.state_id === 'kerala' ? 'Kerala' : 'Maharashtra');
                const isState = primaryManager.access_level === 'State Manager';

                const syncedProfile = {
                    id: primaryManager.id,
                    name: primaryManager.name,
                    email: primaryManager.email,
                    phone: primaryManager.phone || '+91 98230 41092',
                    organization: primaryManager.organization || 'Tourism Authority',
                    manager_type: primaryManager.access_level,
                    access_level: primaryManager.access_level,
                    scope: isState ? 'STATE' : 'DESTINATION',
                    state_id: primaryManager.state_id || 'maharashtra',
                    state_name: stateName,
                    destination_id: isState ? 'all' : primaryManager.destination_id,
                    destination: primaryManager.destination_name,
                    destination_name: primaryManager.destination_name,
                    destination_ids: isState
                        ? destinations.filter(d => d.state_id === primaryManager.state_id).map(d => d.id)
                        : [primaryManager.destination_id],
                    assigned_date: primaryManager.created_at || '15 Jan 2026',
                    status: primaryManager.account_status || 'Active',
                    account_status: primaryManager.account_status || 'Active',
                    avatar_initials: primaryManager.name.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2)
                };

                window.YatraSetuManagerData.profile = {
                    ...(window.YatraSetuManagerData.profile || {}),
                    ...syncedProfile
                };

                try {
                    localStorage.setItem('yatrasetu_manager_profile', JSON.stringify(syncedProfile));
                    sessionStorage.setItem('yatrasetu_manager_profile', JSON.stringify(syncedProfile));
                } catch (e) {}
            }
        },

        // ---------------------------------------------------------------------
        // APPLICATION-LAYER ENFORCEMENT METHODS
        // ---------------------------------------------------------------------

        /**
         * Rule 5 Enforcement: Only Administrator can activate accounts.
         */
        activateAccount(userId, actorRole, actorName = 'System Admin') {
            if (actorRole !== 'admin') {
                throw new Error('ACCESS_DENIED: Only Platform Administrators hold permission to activate system accounts.');
            }
            const users = this.getUsers();
            const target = users.find(u => u.id === userId);
            if (!target) throw new Error(`User account "${userId}" not found.`);

            const prev = target.account_status;
            target.account_status = 'Active';
            this.saveUsers(users);

            this.logAuditEvent({
                action: 'ACCOUNT_ACTIVATED',
                stakeholder_id: target.id,
                stakeholder_name: target.organization || target.name,
                actor_name: actorName,
                actor_role: 'Administrator',
                details: `Administrator activated account login access for "${target.name}" (${target.role}).`,
                previous_value: prev,
                new_value: 'Active'
            });

            return target;
        },

        /**
         * Rule 5 Enforcement: Only Administrator can deactivate accounts.
         */
        deactivateAccount(userId, actorRole, actorName = 'System Admin', reason = 'Administrative suspension') {
            if (actorRole !== 'admin') {
                throw new Error('ACCESS_DENIED: Only Platform Administrators hold permission to deactivate system accounts.');
            }
            const users = this.getUsers();
            const target = users.find(u => u.id === userId);
            if (!target) throw new Error(`User account "${userId}" not found.`);

            const prev = target.account_status;
            target.account_status = 'Deactivated';
            this.saveUsers(users);

            this.logAuditEvent({
                action: 'ACCOUNT_DEACTIVATED',
                stakeholder_id: target.id,
                stakeholder_name: target.organization || target.name,
                actor_name: actorName,
                actor_role: 'Administrator',
                details: `Administrator deactivated account login access for "${target.name}". Reason: ${reason}`,
                previous_value: prev,
                new_value: 'Deactivated'
            });

            return target;
        },

        /**
         * Rule 5 Enforcement: Only Administrator can delete stakeholder accounts.
         */
        deleteAccount(userId, actorRole, actorName = 'System Admin', reason = 'Account permanently deleted') {
            if (actorRole !== 'admin') {
                throw new Error('ACCESS_DENIED: Only Platform Administrators hold permission to permanently delete accounts.');
            }
            let users = this.getUsers();
            const target = users.find(u => u.id === userId);
            if (!target) throw new Error(`User account "${userId}" not found.`);

            users = users.filter(u => u.id !== userId);
            this.saveUsers(users);

            // Also purge from manager stakeholders list
            if (window.YatraSetuManagerData && window.YatraSetuManagerData.stakeholders) {
                window.YatraSetuManagerData.stakeholders = window.YatraSetuManagerData.stakeholders.filter(s => s.id !== userId && s.email !== target.email);
                if (window.YatraSetuManagerStore && typeof window.YatraSetuManagerStore.saveStakeholders === 'function') {
                    window.YatraSetuManagerStore.saveStakeholders(window.YatraSetuManagerData.stakeholders);
                }
            }

            this.logAuditEvent({
                action: 'ACCOUNT_DELETED',
                stakeholder_id: target.id,
                stakeholder_name: target.organization || target.name,
                actor_name: actorName,
                actor_role: 'Administrator',
                details: `Administrator permanently deleted account "${target.name}" (${target.email}). Reason: ${reason}`,
                previous_value: target.account_status,
                new_value: 'Deleted'
            });

            return target;
        },

        /**
         * Rule 3 & 4 Enforcement: Controlled destination reassignment with mandatory audit trail.
         */
        reassignDestination(stakeholderId, newDestId, reason, actor) {
            if (!reason || reason.trim().length < 6) {
                throw new Error('VALIDATION_ERROR: A clear, official justification (min 6 chars) is mandatory for destination reassignment.');
            }

            const validRoles = ['admin', 'manager'];
            if (!validRoles.includes(actor.role)) {
                throw new Error('ACCESS_DENIED: Only authorized Destination Managers or Administrators can perform controlled destination reassignment.');
            }

            // Look up destination metadata
            const managerData = window.YatraSetuManagerData || {};
            const destinations = managerData.destinations || [];
            const destObj = destinations.find(d => d.id === newDestId);
            if (!destObj) {
                throw new Error(`VALIDATION_ERROR: Destination "${newDestId}" does not exist in the official catalog.`);
            }

            // Jurisdiction check for Destination Manager
            if (actor.role === 'manager') {
                const actorState = actor.state_id || 'maharashtra';
                if (destObj.state_id !== actorState) {
                    throw new Error(`JURISDICTION_ERROR: Destination Manager for ${actorState.toUpperCase()} cannot reassign stakeholders to another state (${destObj.state_id.toUpperCase()}).`);
                }
            }

            const users = this.getUsers();
            const target = users.find(u => u.id === stakeholderId);
            if (!target) throw new Error(`Stakeholder account "${stakeholderId}" not found.`);

            const oldDestName = target.destination_name;
            const oldDestId = target.destination_id;

            target.destination_id = destObj.id;
            target.destination_name = destObj.name;
            target.state_id = destObj.state_id;
            this.saveUsers(users);

            // Update Stakeholder session if this stakeholder is currently logged in
            const activeShEmail = sessionStorage.getItem('yatrasetu_email');
            if (activeShEmail && activeShEmail === target.email) {
                sessionStorage.setItem('yatrasetu_destination_id', destObj.id);
            }

            const auditEntry = this.logAuditEvent({
                action: 'CONTROLLED_DESTINATION_REASSIGNMENT',
                stakeholder_id: target.id,
                stakeholder_name: target.organization || target.name,
                actor_name: actor.name || 'System Admin',
                actor_role: actor.role === 'admin' ? 'Administrator' : 'Destination Manager',
                details: `Controlled reassignment from "${oldDestName}" to "${destObj.name}". Official Reason: ${reason}`,
                previous_value: `${oldDestName} (${oldDestId})`,
                new_value: `${destObj.name} (${destObj.id})`
            });

            return { target, auditEntry };
        },

        /**
         * Manager Authority: Reassign manager jurisdiction and/or promote/demote scope.
         * Only Platform Administrators may invoke this method.
         */
        reassignManagerAuthority(managerId, newAccessLevel, newStateId, newDestId, reason, actor = { role: 'admin', name: 'System Admin' }) {
            if (actor.role !== 'admin') {
                throw new Error('ACCESS_DENIED: Only Platform Administrators hold permission to reassign manager authority or scopes.');
            }
            if (!reason || reason.trim().length < 6) {
                throw new Error('VALIDATION_ERROR: A clear, official administrative justification (min 6 chars) is mandatory.');
            }

            const users = this.getUsers();
            const manager = users.find(u => u.id === managerId && u.role === 'manager');
            if (!manager) throw new Error(`Manager account "${managerId}" not found.`);

            const managerData = window.YatraSetuManagerData || {};
            const destinations = managerData.destinations || [];
            const states = managerData.states || [];

            const prevAccessLevel = manager.access_level;
            const prevTerritory = manager.destination_name;

            let newTerritoryName = '';
            if (newAccessLevel === 'State Manager') {
                const stateObj = states.find(s => s.id === newStateId);
                const stateName = stateObj ? stateObj.name : (newStateId === 'kerala' ? 'Kerala' : 'Maharashtra');
                manager.access_level = 'State Manager';
                manager.state_id = newStateId;
                manager.destination_id = 'all';
                manager.destination_name = `${stateName} (All Destinations)`;
                newTerritoryName = manager.destination_name;
            } else {
                const destObj = destinations.find(d => d.id === newDestId);
                if (!destObj) throw new Error(`VALIDATION_ERROR: Destination "${newDestId}" does not exist in catalog.`);
                manager.access_level = 'Destination Manager';
                manager.state_id = destObj.state_id;
                manager.destination_id = destObj.id;
                manager.destination_name = destObj.name;
                newTerritoryName = `${destObj.name} [${destObj.id}]`;
            }

            this.saveUsers(users);

            // Synchronize manager profile and session storage context for live Manager Workspace integration
            const isState = manager.access_level === 'State Manager';
            const stateObj = states.find(s => s.id === manager.state_id);
            const stateName = stateObj ? stateObj.name : (manager.state_id === 'kerala' ? 'Kerala' : 'Maharashtra');
            const syncedProfile = {
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

            if (window.YatraSetuManagerData) {
                window.YatraSetuManagerData.profile = {
                    ...(window.YatraSetuManagerData.profile || {}),
                    ...syncedProfile
                };
            }

            try {
                localStorage.setItem('yatrasetu_manager_profile', JSON.stringify(syncedProfile));
                sessionStorage.setItem('yatrasetu_manager_profile', JSON.stringify(syncedProfile));
                sessionStorage.setItem('yatrasetu_active_state_id', manager.state_id);
                sessionStorage.setItem('yatrasetu_state_theme', manager.state_id);
                sessionStorage.setItem('yatrasetu_active_dest_id', manager.destination_id);
                sessionStorage.setItem('yatrasetu_manager_scope', manager.access_level === 'State Manager' ? 'state' : 'destination');
                sessionStorage.setItem('yatrasetu_manager_access_level', manager.access_level);
                sessionStorage.setItem('yatrasetu_name', manager.name);
                sessionStorage.setItem('yatrasetu_email', manager.email);
            } catch (e) {}

            const auditEntry = this.logAuditEvent({
                action: 'MANAGER_AUTHORITY_REASSIGNED',
                stakeholder_id: manager.id,
                stakeholder_name: manager.name,
                actor_name: actor.name || 'System Admin',
                actor_role: 'Administrator',
                details: `Manager authority updated from "${prevAccessLevel} (${prevTerritory})" to "${manager.access_level} (${newTerritoryName})". Reason: ${reason}`,
                previous_value: `${prevAccessLevel} • ${prevTerritory}`,
                new_value: `${manager.access_level} • ${newTerritoryName}`
            });

            return { manager, auditEntry };
        }
    };

    // Expose store globally for application layer access
    window.YatraSetuAdminStore = AdminStore;

    // =========================================================================
    // 3. ADMINISTRATOR WORKSPACE UI CONTROLLER
    // =========================================================================
    // Cache for live API data
    let cachedUsers = [];
    let cachedRegistrations = [];
    let cachedManagers = [];
    let cachedAuditTrail = [];
    let cachedStats = null;

    function formatDisplayDate(dateVal) {
        if (!dateVal) return 'Recently';
        try {
            const d = new Date(dateVal);
            if (isNaN(d.getTime())) return String(dateVal);
            return d.toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });
        } catch (e) {
            return String(dateVal);
        }
    }


    /**
     * Route Protection: verify active user is logged in with admin role.
     * Prevents logged-out or unauthorized users from viewing or manipulating admin controls.
     */
    function checkAdminAuth() {
        const role = sessionStorage.getItem('yatrasetu_role');
        const hasToken = window.YatraSetuApi && typeof window.YatraSetuApi.hasToken === 'function'
            ? window.YatraSetuApi.hasToken()
            : !!(sessionStorage.getItem('yatrasetu_token') || sessionStorage.getItem('yatrasetu_access_token'));
        if (!role || role !== 'admin' || !hasToken) {
            window.location.replace('../login.html');
            return false;
        }
        return true;
    }

    document.addEventListener('DOMContentLoaded', () => {
        if (!document.body.classList.contains('admin-workspace') && !window.location.pathname.includes('/admin/')) {
            return;
        }

        if (!checkAdminAuth()) {
            return;
        }

        initAdminWorkspace().catch(console.error);
    });

    async function initAdminWorkspace() {
        initAdminNavigationTabs();
        await initAdminMetrics();
        await initAdminAccountsTable();
        await initAdminRegistrationsTable();
        initAdminDestinationsTable();
        renderAdminRolesView();
        await initAdminManagersView();
        await initAdminAuditTrailView();
        initAdminModals();

        // Wire sidebar user footer to open profile modal & sync identity from session
        const sessionName = sessionStorage.getItem('yatrasetu_name');
        if (sessionName) {
            const sidebarUserName = document.querySelector('.sidebar-user .user-name');
            const sidebarAvatar = document.querySelector('.sidebar-user .sidebar-avatar');
            if (sidebarUserName) sidebarUserName.textContent = sessionName;
            if (sidebarAvatar) {
                const inits = sessionName.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2);
                if (inits) sidebarAvatar.textContent = inits;
            }
        }

        const sidebarUser = document.querySelector('.sidebar-user');
        if (sidebarUser) {
            sidebarUser.style.cursor = 'pointer';
            sidebarUser.setAttribute('title', 'View Administrator Profile');
            sidebarUser.addEventListener('click', () => {
                openAdminProfileModal();
            });
        }

        // Expose modal openers for shared dashboard.js topbar dropdown
        window.openAdminProfileModal = openAdminProfileModal;
        window.openAdminSettingsModal = openAdminSettingsModal;
    }

    /**
     * 3A. Sidebar & Topbar Tab Switching
     */
    let activeAdminTab = 'overview';

    function initAdminNavigationTabs() {
        const navLinks = document.querySelectorAll('#app-sidebar-nav .app-nav-item');
        const breadcrumbActive = document.getElementById('breadcrumb-active');

        navLinks.forEach((link) => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const tab = link.getAttribute('data-tab') || 'overview';
                switchAdminTab(tab);
            });
        });

        // Overview "View All" links
        const viewAllRegs = document.getElementById('link-view-all-registrations');
        if (viewAllRegs) {
            viewAllRegs.addEventListener('click', (e) => {
                e.preventDefault();
                switchAdminTab('registrations');
            });
        }

        const viewAllActivity = document.getElementById('link-view-all-activity');
        if (viewAllActivity) {
            viewAllActivity.addEventListener('click', (e) => {
                e.preventDefault();
                switchAdminTab('audit');
            });
        }
    }

    function switchAdminTab(tabName) {
        activeAdminTab = tabName;

        // Update nav link active classes
        document.querySelectorAll('#app-sidebar-nav .app-nav-item').forEach(l => {
            if (l.getAttribute('data-tab') === tabName) {
                l.classList.add('active');
            } else {
                l.classList.remove('active');
            }
        });

        // Update breadcrumb
        const breadcrumbActive = document.getElementById('breadcrumb-active');
        if (breadcrumbActive) {
            const tabTitles = {
                'overview': 'Dashboard',
                'users': 'Stakeholder Accounts',
                'registrations': 'Business Registrations',
                'destinations': 'Destinations',
                'roles': 'Roles & Permissions',
                'managers': 'Manager Authority',
                'audit': 'Audit Trail'
            };
            breadcrumbActive.textContent = tabTitles[tabName] || 'Dashboard';
        }

        // Toggle sections
        const sections = {
            'overview': document.getElementById('admin-section-overview'),
            'users': document.getElementById('admin-section-users'),
            'registrations': document.getElementById('admin-section-registrations'),
            'destinations': document.getElementById('admin-section-destinations'),
            'roles': document.getElementById('admin-section-roles'),
            'managers': document.getElementById('admin-section-managers'),
            'audit': document.getElementById('admin-section-audit')
        };

        Object.keys(sections).forEach(key => {
            if (sections[key]) {
                sections[key].style.display = key === tabName ? 'block' : 'none';
            }
        });

        // Re-render data on switch
        if (tabName === 'overview') initAdminMetrics().catch(console.error);
        if (tabName === 'users') renderAdminAccountsTable().catch(console.error);
        if (tabName === 'registrations') renderAdminRegistrationsTable().catch(console.error);
        if (tabName === 'destinations') renderAdminDestinationsView();
        if (tabName === 'roles') renderAdminRolesView();
        if (tabName === 'managers') renderAdminManagersView().catch(console.error);
        if (tabName === 'audit') renderAdminAuditTrailView().catch(console.error);

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    window.switchAdminTab = switchAdminTab;

    /**
     * 3B. Dynamic Overview Metrics & Widgets (Panel A Reference)
     */
    async function initAdminMetrics() {
        let totalStakeholders = 0;
        let pendingApprovals = 0;
        let activeBusinesses = 0;
        let inactiveAccounts = 0;
        let recentRegs = [];
        let recentAudits = [];

        const hasApi = window.YatraSetuApi && typeof window.YatraSetuApi.hasToken === 'function' && window.YatraSetuApi.hasToken();

        if (hasApi) {
            try {
                const stats = await window.YatraSetuApi.getAdminStats();
                cachedStats = stats;
                totalStakeholders = stats.total_stakeholders || 0;
                pendingApprovals = stats.pending_registrations || 0;
                activeBusinesses = stats.total_users || 0;
                inactiveAccounts = 0;

                const regsRes = await window.YatraSetuApi.getAdminRegistrations({ page: 1, page_size: 5 });
                if (regsRes && regsRes.items) {
                    recentRegs = regsRes.items;
                }

                const auditRes = await window.YatraSetuApi.getAdminAuditLogs({ page: 1, page_size: 5 });
                if (auditRes && auditRes.items) {
                    recentAudits = auditRes.items;
                }
            } catch (err) {
                console.warn('[Admin] Live metrics fetch failed, using fallback:', err);
            }
        }

        // Fallback to local store ONLY if API is unavailable
        if (!hasApi) {
            const users = AdminStore.getUsers();
            const stakeholders = users.filter(u => u.role === 'stakeholder');
            totalStakeholders = stakeholders.length;
            pendingApprovals = stakeholders.filter(u => u.registration_status === 'Pending Approval' || u.registration_status === 'Under Review').length;
            activeBusinesses = stakeholders.filter(u => u.account_status === 'Active' && u.registration_status === 'Approved').length;
            inactiveAccounts = users.filter(u => u.account_status === 'Deactivated' || u.account_status === 'Inactive').length;
            recentRegs = stakeholders.slice(0, 5);
            recentAudits = AdminStore.getAuditTrail().slice(0, 5);
        }

        const metricShEl = document.getElementById('metric-total-stakeholders');
        const metricPendingEl = document.getElementById('metric-pending-approvals');
        const metricActiveEl = document.getElementById('metric-active-businesses');
        const metricInactiveEl = document.getElementById('metric-inactive-accounts');

        if (metricShEl) metricShEl.textContent = totalStakeholders;
        if (metricPendingEl) metricPendingEl.textContent = pendingApprovals;
        if (metricActiveEl) metricActiveEl.textContent = activeBusinesses;
        if (metricInactiveEl) metricInactiveEl.textContent = inactiveAccounts;

        const subSh = document.getElementById('metric-total-stakeholders-sub');
        const subPending = document.getElementById('metric-pending-approvals-sub');
        const subActive = document.getElementById('metric-active-businesses-sub');
        const subInactive = document.getElementById('metric-inactive-accounts-sub');

        if (subSh) subSh.textContent = `${totalStakeholders} registered`;
        if (subPending) subPending.textContent = `${pendingApprovals} unapproved`;
        if (subActive) subActive.textContent = `${activeBusinesses} verified`;
        if (subInactive) subInactive.textContent = inactiveAccounts > 0 ? `${inactiveAccounts} suspended` : '0 suspended';

        // Render Recent Registrations Widget (Left Column)
        const recentRegTbody = document.getElementById('admin-recent-registrations-body');
        if (recentRegTbody) {
            if (recentRegs.length === 0) {
                recentRegTbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:1.5rem; color:#64748B;">No recent registrations found.</td></tr>`;
            } else {
                recentRegTbody.innerHTML = recentRegs.map(sh => {
                    const statusStr = (sh.verification_status || sh.registration_status || '').toLowerCase();
                    const isApproved = statusStr === 'approved' || statusStr === 'verified';
                    const statusBadge = isApproved
                        ? `<span class="admin-badge approved">Approved</span>`
                        : `<span class="admin-badge pending">Pending</span>`;
                    const bizName = sh.business_name || sh.organization || sh.name;
                    const contactName = sh.applicant_name || sh.name;
                    const destName = sh.destination_name || 'Destination';
                    const dateStr = formatDisplayDate(sh.created_at);

                    return `
                        <tr>
                            <td><strong style="color: #0F172A; font-weight: 700;">${bizName}</strong></td>
                            <td style="color: #475569;">${contactName}</td>
                            <td style="color: #475569;">${destName}</td>
                            <td>${statusBadge}</td>
                            <td style="color: #64748B; font-size: 0.76rem;">${dateStr}</td>
                        </tr>
                    `;
                }).join('');
            }
        }

        // Render Account Activity Widget (Right Column)
        const activityStream = document.getElementById('admin-account-activity-stream');
        if (activityStream) {
            if (recentAudits.length === 0) {
                activityStream.innerHTML = `<div style="text-align:center; padding:1.5rem; color:#64748B;">No recent account activity logged.</div>`;
            } else {
                activityStream.innerHTML = recentAudits.map(event => {
                    let dotClass = 'blue';
                    let actionLabel = 'Activity logged';
                    const act = (event.action || '').toUpperCase();

                    if (act.includes('ACTIVATED')) {
                        dotClass = 'green';
                        actionLabel = 'Account activated';
                    } else if (act.includes('DEACTIVATED')) {
                        dotClass = 'red';
                        actionLabel = 'Account deactivated';
                    } else if (act.includes('DELETED')) {
                        dotClass = 'red';
                        actionLabel = 'Account deleted';
                    } else if (act.includes('APPROVED')) {
                        dotClass = 'green';
                        actionLabel = 'Registration approved';
                    } else if (act.includes('REASSIGNMENT')) {
                        dotClass = 'amber';
                        actionLabel = 'Destination reassigned';
                    } else if (act.includes('CREATED') || act.includes('PROVISION')) {
                        dotClass = 'blue';
                        actionLabel = 'Account created';
                    } else if (act.includes('MANAGER_AUTHORITY')) {
                        dotClass = 'amber';
                        actionLabel = 'Manager authority updated';
                    } else {
                        dotClass = 'blue';
                        actionLabel = act.replace(/_/g, ' ').toLowerCase();
                    }

                    const targetName = event.stakeholder_name || (event.new_values && event.new_values.full_name) || event.table_name || 'user';
                    const userSlug = String(targetName).toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 16);
                    const dateStr = formatDisplayDate(event.created_at || event.timestamp);

                    return `
                        <div class="admin-activity-item">
                            <div class="admin-activity-left">
                                <span class="admin-dot ${dotClass}"></span>
                                <span class="admin-activity-action">${actionLabel}</span>
                            </div>
                            <span class="admin-activity-user">${userSlug}</span>
                            <span class="admin-activity-date">${dateStr}</span>
                        </div>
                    `;
                }).join('');
            }
        }
    }

    /**
     * 3C. Stakeholder Accounts Table & Filter Toolbar (Panel B Reference)
     */
    let accountsSearchQuery = '';
    let accountsRoleFilter = 'stakeholder';
    let accountsStatusFilter = 'all';
    let accountsDestFilter = 'all';

    function initAdminAccountsTable() {
        const searchInput = document.getElementById('admin-accounts-search');
        const roleSelect = document.getElementById('admin-accounts-role-filter');
        const statusSelect = document.getElementById('admin-accounts-status-filter');
        const destSelect = document.getElementById('admin-accounts-dest-filter');
        const resetBtn = document.getElementById('btn-reset-accounts-filter');
        const exportBtn = document.getElementById('btn-export-stakeholders');

        // Populate Destination Select
        if (destSelect) {
            const destMap = new Map();
            if (window.YatraSetuManagerData && window.YatraSetuManagerData.destinations) {
                window.YatraSetuManagerData.destinations.forEach(d => {
                    destMap.set(d.id, d.name);
                });
            } else if (!hasApi) {
                const users = AdminStore.getUsers();
                users.forEach(u => {
                    if (u.destination_name && u.destination_id) {
                        destMap.set(u.destination_id, u.destination_name);
                    }
                });
            }
            destSelect.innerHTML = '<option value="all">All Destinations</option>';
            destMap.forEach((name, id) => {
                const opt = document.createElement('option');
                opt.value = id;
                opt.textContent = name;
                destSelect.appendChild(opt);
            });

            destSelect.addEventListener('change', (e) => {
                accountsDestFilter = e.target.value;
                renderAdminAccountsTable();
            });
        }

        if (roleSelect) {
            roleSelect.addEventListener('change', (e) => {
                accountsRoleFilter = e.target.value;
                renderAdminAccountsTable();
            });
        }

        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                accountsSearchQuery = e.target.value.toLowerCase().trim();
                renderAdminAccountsTable();
            });
        }

        if (statusSelect) {
            statusSelect.addEventListener('change', (e) => {
                accountsStatusFilter = e.target.value;
                renderAdminAccountsTable();
            });
        }

        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                accountsSearchQuery = '';
                accountsRoleFilter = 'stakeholder';
                accountsStatusFilter = 'all';
                accountsDestFilter = 'all';
                if (searchInput) searchInput.value = '';
                if (roleSelect) roleSelect.value = 'stakeholder';
                if (statusSelect) statusSelect.value = 'all';
                if (destSelect) destSelect.value = 'all';
                renderAdminAccountsTable();
            });
        }

        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                exportAccountsCsv();
            });
        }

        renderAdminAccountsTable();
    }

    async function renderAdminAccountsTable() {
        const tbody = document.getElementById('admin-accounts-table-body');
        if (!tbody) return;

        let users = [];
        const hasApi = window.YatraSetuApi && typeof window.YatraSetuApi.hasToken === 'function' && window.YatraSetuApi.hasToken();

        if (hasApi) {
            try {
                const res = await window.YatraSetuApi.getAdminUsers({
                    role: accountsRoleFilter !== 'all' ? accountsRoleFilter : undefined,
                    search: accountsSearchQuery || undefined,
                    page: 1,
                    page_size: 100
                });
                if (res && res.items) {
                    cachedUsers = res.items;
                    users = res.items.map(u => ({
                        id: u.id,
                        name: u.full_name,
                        email: u.email,
                        role: u.role,
                        access_level: u.access_level,
                        state_id: u.state_id,
                        destination_id: u.destination_id,
                        destination_name: u.jurisdiction || u.destination_id || 'All Jurisdictions',
                        organization: u.business_name || (u.role === 'admin' ? 'YatraSetu Project Administration' : (u.role === 'manager' ? 'State Tourism Authority' : u.full_name)),
                        account_status: u.is_active ? 'Active' : 'Deactivated',
                        registration_status: u.verification_status || (u.is_active ? 'Verified' : 'Pending'),
                        created_at: formatDisplayDate(u.created_at),
                        raw: u
                    }));
                }
            } catch (err) {
                console.warn('[Admin] Live users fetch failed, using fallback:', err);
            }
        }

        // Fallback to local store ONLY if API is unavailable
        if (!hasApi && users.length === 0) {
            users = AdminStore.getUsers();
            if (accountsRoleFilter !== 'all') {
                users = users.filter(u => u.role === accountsRoleFilter);
            }
        }

        // Apply client status & destination filters
        if (accountsStatusFilter !== 'all') {
            users = users.filter(u => u.account_status === accountsStatusFilter);
        }
        if (accountsDestFilter !== 'all') {
            users = users.filter(u => u.destination_id === accountsDestFilter);
        }
        if (!hasApi && accountsSearchQuery) {
            users = users.filter(u =>
                (u.name && u.name.toLowerCase().includes(accountsSearchQuery)) ||
                (u.email && u.email.toLowerCase().includes(accountsSearchQuery)) ||
                (u.organization && u.organization.toLowerCase().includes(accountsSearchQuery)) ||
                (u.destination_name && u.destination_name.toLowerCase().includes(accountsSearchQuery)) ||
                (u.id && u.id.toLowerCase().includes(accountsSearchQuery))
            );
        }

        // Update footer pagination info
        const infoEl = document.getElementById('accounts-pagination-info');
        if (infoEl) {
            infoEl.textContent = `Showing 1-${users.length} of ${users.length} accounts`;
        }

        if (users.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 2.5rem; color: #64748B;">
                        No stakeholder accounts found matching current search & filters.
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = users.map(user => {
            const isActive = user.account_status === 'Active';
            const statusBadge = isActive
                ? `<span class="admin-badge active">Active</span>`
                : `<span class="admin-badge inactive">Inactive</span>`;

            return `
                <tr data-user-id="${user.id}">
                    <td><input type="checkbox" class="account-row-checkbox" aria-label="Select row"></td>
                    <td>
                        <div class="admin-user-cell">
                            <span class="admin-user-name">${user.name}</span>
                            <span class="admin-user-email">${user.email}</span>
                        </div>
                    </td>
                    <td><span style="font-weight: 600; color: #1E293B;">${user.organization || user.name}</span></td>
                    <td><span style="color: #475569;">${user.destination_name}</span></td>
                    <td>${statusBadge}</td>
                    <td style="color: #64748B; font-size: 0.78rem;">${user.created_at}</td>
                    <td style="text-align: right; white-space: nowrap;">
                        <button type="button" class="admin-action-btn-view" data-user-id="${user.id}">View</button>
                        
                        <div class="admin-action-dropdown-wrapper">
                            <button type="button" class="admin-action-menu-btn" data-user-id="${user.id}" aria-label="Options">···</button>
                            <div class="admin-dropdown-menu" id="menu-${user.id}">
                                <button type="button" class="admin-dropdown-item btn-menu-view" data-user-id="${user.id}">
                                    👁️ View Profile & Lock
                                </button>
                                <button type="button" class="admin-dropdown-item btn-menu-reassign" data-user-id="${user.id}">
                                    🔄 Reassign Destination
                                </button>
                                <button type="button" class="admin-dropdown-item btn-menu-toggle-status" data-user-id="${user.id}">
                                    ${isActive ? '⏸ Deactivate Account' : '▶ Activate Account'}
                                </button>
                                <button type="button" class="admin-dropdown-item danger btn-menu-delete" data-user-id="${user.id}">
                                    🗑️ Delete Account
                                </button>
                            </div>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        // Wire View Buttons
        tbody.querySelectorAll('.admin-action-btn-view, .btn-menu-view').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const uid = btn.getAttribute('data-user-id');
                closeAllDropdowns();
                openAccountDetailsModal(uid);
            });
        });

        // Wire ··· Menu Buttons
        tbody.querySelectorAll('.admin-action-menu-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const uid = btn.getAttribute('data-user-id');
                const menu = document.getElementById(`menu-${uid}`);
                const isShown = menu && menu.classList.contains('show');
                closeAllDropdowns();
                if (menu && !isShown) {
                    menu.classList.add('show');
                }
            });
        });

        // Wire Menu Reassign
        tbody.querySelectorAll('.btn-menu-reassign').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const uid = btn.getAttribute('data-user-id');
                closeAllDropdowns();
                openReassignModal(uid);
            });
        });

        // Wire Menu Toggle Status (Deactivate / Activate)
        tbody.querySelectorAll('.btn-menu-toggle-status').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const uid = btn.getAttribute('data-user-id');
                closeAllDropdowns();
                openDeactivateModal(uid);
            });
        });

        // Wire Menu Delete
        tbody.querySelectorAll('.btn-menu-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const uid = btn.getAttribute('data-user-id');
                closeAllDropdowns();
                openDeleteModal(uid);
            });
        });
    }

    function closeAllDropdowns() {
        document.querySelectorAll('.admin-dropdown-menu').forEach(m => m.classList.remove('show'));
    }
    document.addEventListener('click', closeAllDropdowns);

    /**
     * 3D. Business Registrations Table (Panel F Reference)
     */
    let regsSearchQuery = '';
    let regsStatusFilter = 'all';
    let regsStateFilter = 'all';
    let regsDestFilter = 'all';
    let regsCategoryFilter = 'all';

    function initAdminRegistrationsTable() {
        const searchInput = document.getElementById('admin-registrations-search');
        const statusSelect = document.getElementById('admin-registrations-status-filter');
        const stateSelect = document.getElementById('admin-registrations-state-filter');
        const destSelect = document.getElementById('admin-registrations-dest-filter');
        const catSelect = document.getElementById('admin-registrations-category-filter');
        const resetBtn = document.getElementById('btn-reset-registrations-filter');
        const exportBtn = document.getElementById('btn-export-registrations');

        if (destSelect) {
            const users = AdminStore.getUsers();
            const destMap = new Map();
            users.forEach(u => {
                if (u.destination_name && u.destination_id) {
                    destMap.set(u.destination_id, u.destination_name);
                }
            });
            destSelect.innerHTML = '<option value="all">All Destinations</option>';
            destMap.forEach((name, id) => {
                const opt = document.createElement('option');
                opt.value = id;
                opt.textContent = name;
                destSelect.appendChild(opt);
            });

            destSelect.addEventListener('change', (e) => {
                regsDestFilter = e.target.value;
                renderAdminRegistrationsTable();
            });
        }

        if (stateSelect) {
            stateSelect.addEventListener('change', (e) => {
                regsStateFilter = e.target.value;
                renderAdminRegistrationsTable();
            });
        }

        if (catSelect) {
            catSelect.addEventListener('change', (e) => {
                regsCategoryFilter = e.target.value;
                renderAdminRegistrationsTable();
            });
        }

        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                regsSearchQuery = e.target.value.toLowerCase().trim();
                renderAdminRegistrationsTable();
            });
        }

        if (statusSelect) {
            statusSelect.addEventListener('change', (e) => {
                regsStatusFilter = e.target.value;
                renderAdminRegistrationsTable();
            });
        }

        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                regsSearchQuery = '';
                regsStatusFilter = 'all';
                regsStateFilter = 'all';
                regsDestFilter = 'all';
                regsCategoryFilter = 'all';
                if (searchInput) searchInput.value = '';
                if (statusSelect) statusSelect.value = 'all';
                if (stateSelect) stateSelect.value = 'all';
                if (destSelect) destSelect.value = 'all';
                if (catSelect) catSelect.value = 'all';
                renderAdminRegistrationsTable();
            });
        }

        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                exportRegistrationsCsv();
            });
        }

        renderAdminRegistrationsTable();
    }

    async function renderAdminRegistrationsTable() {
        const tbody = document.getElementById('admin-registrations-table-body');
        if (!tbody) return;

        let stakeholders = [];
        const hasApi = window.YatraSetuApi && typeof window.YatraSetuApi.hasToken === 'function' && window.YatraSetuApi.hasToken();

        if (hasApi) {
            try {
                let apiStatus = undefined;
                if (regsStatusFilter === 'Approved') apiStatus = 'verified';
                else if (regsStatusFilter === 'Pending Approval') apiStatus = 'pending';
                else if (regsStatusFilter === 'Under Review') apiStatus = 'pending';
                else if (regsStatusFilter === 'Rejected') apiStatus = 'rejected';

                const res = await window.YatraSetuApi.getAdminRegistrations({
                    status: apiStatus,
                    state_id: regsStateFilter !== 'all' ? regsStateFilter : undefined,
                    destination_id: regsDestFilter !== 'all' ? regsDestFilter : undefined,
                    search: regsSearchQuery || undefined,
                    page: 1,
                    page_size: 50
                });
                if (res && res.items) {
                    cachedRegistrations = res.items;
                    stakeholders = res.items.map(r => ({
                        id: r.service_id,
                        user_id: r.user_id,
                        organization: r.business_name,
                        name: r.applicant_name || 'Stakeholder Applicant',
                        destination_name: r.destination_name || r.destination_id,
                        category: r.category || 'General',
                        registration_status: r.verification_status === 'verified' ? 'Approved' : (r.verification_status === 'pending' ? 'Pending Approval' : (r.verification_status === 'rejected' ? 'Rejected' : 'Under Review')),
                        created_at: formatDisplayDate(r.created_at),
                        raw: r
                    }));
                }
            } catch (err) {
                console.warn('[Admin] Live registrations fetch failed, using fallback:', err);
            }
        }

        // Fallback to local store ONLY if API is unavailable
        if (!hasApi && stakeholders.length === 0) {
            stakeholders = AdminStore.getUsers().filter(u => u.role === 'stakeholder');
            if (regsStatusFilter !== 'all') {
                stakeholders = stakeholders.filter(u => u.registration_status === regsStatusFilter);
            }
            if (regsStateFilter !== 'all') {
                stakeholders = stakeholders.filter(u => u.state_id === regsStateFilter);
            }
            if (regsDestFilter !== 'all') {
                stakeholders = stakeholders.filter(u => u.destination_id === regsDestFilter);
            }
            if (regsCategoryFilter !== 'all') {
                stakeholders = stakeholders.filter(u => u.category === regsCategoryFilter);
            }
            if (regsSearchQuery) {
                stakeholders = stakeholders.filter(u =>
                    (u.organization && u.organization.toLowerCase().includes(regsSearchQuery)) ||
                    (u.name && u.name.toLowerCase().includes(regsSearchQuery)) ||
                    (u.destination_name && u.destination_name.toLowerCase().includes(regsSearchQuery)) ||
                    (u.category && u.category.toLowerCase().includes(regsSearchQuery)) ||
                    (u.id && u.id.toLowerCase().includes(regsSearchQuery))
                );
            }
        }

        const infoEl = document.getElementById('registrations-pagination-info');
        if (infoEl) {
            infoEl.textContent = `Showing 1-${stakeholders.length} of ${stakeholders.length} registrations`;
        }

        if (stakeholders.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 2.5rem; color: #64748B;">
                        No business registrations found matching current search & filters.
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = stakeholders.map(sh => {
            const isApproved = sh.registration_status === 'Approved';
            const isPending = sh.registration_status === 'Pending Approval';
            const isReview = sh.registration_status === 'Under Review';
            let statusBadge = `<span class="admin-badge rejected">Rejected</span>`;
            if (isApproved) statusBadge = `<span class="admin-badge approved">Approved</span>`;
            else if (isPending) statusBadge = `<span class="admin-badge pending">Pending</span>`;
            else if (isReview) statusBadge = `<span class="admin-badge under-review">Under Review</span>`;

            return `
                <tr data-user-id="${sh.id}">
                    <td><input type="checkbox" class="reg-row-checkbox" aria-label="Select row"></td>
                    <td><strong style="color: #0F172A; font-weight: 700;">${sh.organization || sh.name}</strong></td>
                    <td>
                        <a href="#" class="btn-link-stakeholder" data-user-id="${sh.user_id || sh.id}" style="color: #2563EB; font-weight: 600; text-decoration: underline;">
                            ${sh.name}
                        </a>
                    </td>
                    <td style="color: #334155;">${sh.destination_name}</td>
                    <td><span style="color: #64748B; font-size: 0.78rem;">${sh.category || 'Adventure & Trekking'}</span></td>
                    <td>${statusBadge}</td>
                    <td style="color: #64748B; font-size: 0.78rem;">${sh.created_at}</td>
                    <td style="text-align: right; white-space: nowrap;">
                        <button type="button" class="admin-action-btn-view btn-view-registration" data-user-id="${sh.id}">View Details</button>
                        <button type="button" class="admin-action-menu-btn btn-view-registration" data-user-id="${sh.id}">···</button>
                    </td>
                </tr>
            `;
        }).join('');

        tbody.querySelectorAll('.btn-view-registration').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const uid = btn.getAttribute('data-user-id');
                openRegistrationDetailsModal(uid);
            });
        });

        tbody.querySelectorAll('.btn-link-stakeholder').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const uid = link.getAttribute('data-user-id');
                openAccountDetailsModal(uid);
            });
        });
    }

    /**
     * 3E. Reference Modal Controllers (Panels C, D, E, G)
     */

    // Panel C: Stakeholder Account Details Modal with Tabs & Destination Lock
    function openAccountDetailsModal(stakeholderId) {
        const modal = document.getElementById('adminAccountDetailsModal');
        const user = cachedUsers.find(u => u.id === stakeholderId) || AdminStore.getUsers().find(u => u.id === stakeholderId);
        if (!modal || !user) return;

        // Populate Header
        const avatarEl = document.getElementById('details-avatar');
        const nameEl = document.getElementById('details-name');
        const emailEl = document.getElementById('details-email');
        const badgeEl = document.getElementById('details-status-badge');

        const initials = user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U';
        if (avatarEl) avatarEl.textContent = initials;
        if (nameEl) nameEl.textContent = user.name;
        if (emailEl) emailEl.textContent = user.email;
        if (badgeEl) {
            badgeEl.className = user.account_status === 'Active' ? 'admin-badge active' : 'admin-badge inactive';
            badgeEl.textContent = user.account_status;
        }

        // Populate Fields
        const fName = document.getElementById('field-detail-name');
        const fEmail = document.getElementById('field-detail-email');
        const fOrg = document.getElementById('field-detail-org');
        const fStatus = document.getElementById('field-detail-status');
        const fCreated = document.getElementById('field-detail-created');
        const fActive = document.getElementById('field-detail-active');

        if (fName) fName.textContent = user.name;
        if (fEmail) fEmail.textContent = user.email;
        if (fOrg) fOrg.textContent = user.organization || `${user.name} Enterprise`;
        if (fStatus) fStatus.textContent = user.account_status;
        if (fCreated) fCreated.textContent = user.created_at;
        if (fActive) fActive.textContent = user.last_active || 'Recent';

        // Populate Registered Business & Destination Lock
        const bizNameEl = document.getElementById('details-biz-name');
        const bizStatusEl = document.getElementById('details-biz-status');
        const bizCatEl = document.getElementById('details-biz-cat');
        const bizLocEl = document.getElementById('details-biz-loc');
        const lockDestEl = document.getElementById('details-lock-dest');

        const bizName = user.organization || `${user.name} Tourism Services`;
        if (bizNameEl) bizNameEl.textContent = bizName;
        if (bizStatusEl) bizStatusEl.textContent = user.registration_status || 'Approved';
        if (bizCatEl) bizCatEl.textContent = user.category || 'Adventure & Trekking';
        if (bizLocEl) bizLocEl.textContent = `📍 ${user.destination_name}, ${user.state_id ? user.state_id.toUpperCase() : 'MAHARASHTRA'}`;
        if (lockDestEl) lockDestEl.textContent = user.destination_name;

        // Populate Business Tab Fields
        const bizTabTitle = document.getElementById('biz-tab-title');
        const bizTabCat = document.getElementById('biz-tab-category');
        const bizTabJuris = document.getElementById('biz-tab-jurisdiction');
        const bizTabStatus = document.getElementById('biz-tab-status');

        if (bizTabTitle) bizTabTitle.textContent = bizName;
        if (bizTabCat) bizTabCat.textContent = user.category || 'Adventure & Trekking';
        if (bizTabJuris) bizTabJuris.textContent = user.destination_name;
        if (bizTabStatus) bizTabStatus.textContent = user.registration_status || 'Approved';

        // Populate Activity History
        const actListEl = document.getElementById('details-activity-list');
        if (actListEl) {
            const audits = AdminStore.getAuditTrail().filter(a => a.stakeholder_id === user.id);
            if (audits.length === 0) {
                actListEl.innerHTML = `<div style="padding:1rem; color:#64748B;">No recent activity records for this account.</div>`;
            } else {
                actListEl.innerHTML = audits.map(a => `
                    <div style="padding: 0.65rem 0; border-bottom: 1px solid #E2E8F0;">
                        <div style="font-weight: 700; color: #0F172A;">${a.action.replace(/_/g, ' ')}</div>
                        <div style="font-size: 0.74rem; color: #64748B;">${a.details}</div>
                        <div style="font-size: 0.7rem; color: #94A3B8; margin-top: 0.2rem;">By ${a.actor_name} (${a.actor_role}) • ${a.timestamp}</div>
                    </div>
                `).join('');
            }
        }

        // Horizontal Tab Switching inside Modal
        const tabBtns = modal.querySelectorAll('.admin-modal-tab-btn');
        const contentInfo = document.getElementById('modal-tab-content-info');
        const contentBiz = document.getElementById('modal-tab-content-business');
        const contentAct = document.getElementById('modal-tab-content-activity');

        tabBtns.forEach(btn => {
            btn.onclick = () => {
                tabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const tab = btn.getAttribute('data-tab');

                if (contentInfo) contentInfo.style.display = tab === 'info' ? 'block' : 'none';
                if (contentBiz) contentBiz.style.display = tab === 'business' ? 'block' : 'none';
                if (contentAct) contentAct.style.display = tab === 'activity' ? 'block' : 'none';
            };
        });

        // Wire "Reassign Destination" button in modal
        const reassignBtn = document.getElementById('btn-details-reassign');
        if (reassignBtn) {
            reassignBtn.onclick = () => {
                modal.classList.remove('active');
                openReassignModal(stakeholderId);
            };
        }

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    // Panel D: Activate / Deactivate Account Action Modal
    let pendingStatusToggleUserId = null;

    function openDeactivateModal(userId) {
        const modal = document.getElementById('adminDeactivateModal');
        const user = AdminStore.getUsers().find(u => u.id === userId);
        if (!modal || !user) return;

        pendingStatusToggleUserId = userId;
        const isActive = user.account_status === 'Active';

        const titleEl = document.getElementById('modal-deactivate-title');
        const avatarEl = document.getElementById('deactivate-avatar');
        const nameEl = document.getElementById('deactivate-user-name');
        const emailEl = document.getElementById('deactivate-user-email');
        const metaEl = document.getElementById('deactivate-user-meta');
        const msgEl = document.getElementById('deactivate-warning-msg');
        const reasonInput = document.getElementById('deactivate-reason-input');
        const confirmBtn = document.getElementById('btn-confirm-status-toggle');

        if (titleEl) titleEl.textContent = isActive ? 'Deactivate Stakeholder Account' : 'Activate Stakeholder Account';
        if (avatarEl) avatarEl.textContent = user.name[0].toUpperCase();
        if (nameEl) nameEl.textContent = user.name;
        if (emailEl) emailEl.textContent = user.email;
        if (metaEl) metaEl.textContent = `${user.organization || user.name} • ${user.destination_name}`;

        if (msgEl) {
            msgEl.textContent = isActive
                ? 'This will deactivate the stakeholder account. They will not be able to log in or manage their business until reactivated.'
                : 'This will activate the stakeholder account and restore full access to their business management dashboard.';
        }

        if (reasonInput) reasonInput.value = '';

        if (confirmBtn) {
            confirmBtn.textContent = isActive ? 'Deactivate Account' : 'Activate Account';
            confirmBtn.className = isActive ? 'admin-btn-danger' : 'admin-btn-primary';
            confirmBtn.onclick = async () => {
                const reasonVal = reasonInput ? reasonInput.value.trim() : '';
                if (!reasonVal || reasonVal.length < 4) {
                    alert('Please provide a mandatory administrative reason (minimum 4 characters).');
                    if (reasonInput) reasonInput.focus();
                    return;
                }

                try {
                    if (window.YatraSetuApi && typeof window.YatraSetuApi.hasToken === 'function' && window.YatraSetuApi.hasToken()) {
                        await window.YatraSetuApi.updateAdminUserStatus(userId, isActive ? 'deactivated' : 'active', reasonVal);
                    } else {
                        if (isActive) {
                            AdminStore.deactivateAccount(userId, 'admin', 'System Admin', reasonVal);
                        } else {
                            AdminStore.activateAccount(userId, 'admin', 'System Admin');
                        }
                    }

                    modal.classList.remove('active');
                    document.body.style.overflow = '';
                    await renderAdminAccountsTable();
                    await initAdminMetrics();
                } catch (err) {
                    alert(err.message || 'Failed to update user status.');
                }
            };
        }

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    // Panel E: Delete Stakeholder Account Confirmation Modal
    let pendingDeleteUserId = null;

    function openDeleteModal(userId) {
        const modal = document.getElementById('adminDeleteModal');
        const user = AdminStore.getUsers().find(u => u.id === userId);
        if (!modal || !user) return;

        pendingDeleteUserId = userId;

        const summaryUserEl = document.getElementById('delete-summary-user');
        const summaryBizEl = document.getElementById('delete-summary-biz');
        const reasonInput = document.getElementById('delete-reason-input');
        const confirmBtn = document.getElementById('btn-confirm-delete-account');

        if (summaryUserEl) summaryUserEl.textContent = `${user.name} (${user.email})`;
        if (summaryBizEl) summaryBizEl.textContent = `${user.organization || user.name} (${user.destination_name})`;
        if (reasonInput) reasonInput.value = '';

        if (confirmBtn) {
            confirmBtn.onclick = async () => {
                const reasonVal = reasonInput ? reasonInput.value.trim() : '';
                if (!reasonVal || reasonVal.length < 4) {
                    alert('Please specify an official reason for permanent deletion.');
                    if (reasonInput) reasonInput.focus();
                    return;
                }

                try {
                    if (window.YatraSetuApi && typeof window.YatraSetuApi.hasToken === 'function' && window.YatraSetuApi.hasToken()) {
                        await window.YatraSetuApi.deleteAdminUser(userId);
                    } else {
                        AdminStore.deleteAccount(userId, 'admin', 'System Admin', reasonVal);
                    }
                    modal.classList.remove('active');
                    document.body.style.overflow = '';
                    await renderAdminAccountsTable();
                    await renderAdminRegistrationsTable();
                    await initAdminMetrics();
                } catch (err) {
                    alert(err.message || 'Failed to delete user account.');
                }
            };
        }

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    // Panel G: Business Registration Details Modal with Destination Lock
    function openRegistrationDetailsModal(stakeholderId) {
        const modal = document.getElementById('adminRegistrationDetailsModal');
        const user = cachedRegistrations.find(r => r.service_id === stakeholderId || r.id === stakeholderId || r.user_id === stakeholderId) || AdminStore.getUsers().find(u => u.id === stakeholderId);
        if (!modal || !user) return;

        const nameEl = document.getElementById('reg-modal-name');
        const statusEl = document.getElementById('reg-modal-status');
        const catEl = document.getElementById('reg-modal-category');
        const locEl = document.getElementById('reg-modal-location');
        const fieldNameEl = document.getElementById('reg-modal-field-name');
        const fieldCatEl = document.getElementById('reg-modal-field-category');
        const lockDestEl = document.getElementById('reg-modal-lock-dest');

        const bizName = user.organization || `${user.name} Enterprise`;
        const category = user.category || 'Adventure & Trekking';

        if (nameEl) nameEl.textContent = bizName;
        if (statusEl) statusEl.textContent = user.registration_status || 'Approved';
        if (catEl) catEl.textContent = category;
        if (locEl) locEl.textContent = `📍 ${user.destination_name}, ${user.state_id ? user.state_id.toUpperCase() : 'MAHARASHTRA'}`;
        if (fieldNameEl) fieldNameEl.textContent = bizName;
        if (fieldCatEl) fieldCatEl.textContent = category;
        if (lockDestEl) lockDestEl.textContent = user.destination_name;

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    // Controlled Destination Reassignment Modal
    function openReassignModal(stakeholderId) {
        const modal = document.getElementById('adminReassignModal');
        const users = AdminStore.getUsers();
        const stakeholder = users.find(u => u.id === stakeholderId);
        if (!modal || !stakeholder) return;

        const nameEl = document.getElementById('reassign-sh-name');
        const currentDestEl = document.getElementById('reassign-sh-current-dest');
        const destSelect = document.getElementById('reassign-dest-select');
        const reasonInput = document.getElementById('reassign-reason-input');

        if (nameEl) nameEl.textContent = `${stakeholder.organization || stakeholder.name} (${stakeholder.name})`;
        if (currentDestEl) currentDestEl.textContent = `${stakeholder.destination_name} [${stakeholder.destination_id}]`;
        if (reasonInput) reasonInput.value = '';

        if (destSelect) {
            destSelect.innerHTML = '<option value="">-- Choose New Destination --</option>';
            const managerData = window.YatraSetuManagerData || {};
            const states = managerData.states || [];
            const destinations = managerData.destinations || [];

            states.forEach(st => {
                const group = document.createElement('optgroup');
                group.label = `${st.name} Jurisdictions`;
                const dests = destinations.filter(d => d.state_id === st.id);
                dests.forEach(d => {
                    const opt = document.createElement('option');
                    opt.value = d.id;
                    opt.textContent = `${d.name} (${d.category || 'General'})`;
                    if (d.id === stakeholder.destination_id) opt.disabled = true;
                    group.appendChild(opt);
                });
                destSelect.appendChild(group);
            });
        }

        const confirmBtn = document.getElementById('btn-confirm-reassign');
        if (confirmBtn) {
            confirmBtn.onclick = async () => {
                const newDestId = destSelect.value;
                const reasonVal = reasonInput ? reasonInput.value.trim() : '';

                if (!newDestId) {
                    alert('Please select a new destination jurisdiction.');
                    return;
                }
                if (!reasonVal || reasonVal.length < 6) {
                    alert('Please provide a detailed official justification for this reassignment (minimum 6 characters).');
                    if (reasonInput) reasonInput.focus();
                    return;
                }

                try {
                    if (window.YatraSetuApi && typeof window.YatraSetuApi.hasToken === 'function' && window.YatraSetuApi.hasToken()) {
                        let targetServiceId = null;
                        if (cachedRegistrations.length === 0) {
                            const rRes = await window.YatraSetuApi.getAdminRegistrations({ page: 1, page_size: 50 });
                            if (rRes && rRes.items) cachedRegistrations = rRes.items;
                        }
                        const matchReg = cachedRegistrations.find(r => r.user_id === stakeholderId || r.service_id === stakeholderId);
                        if (matchReg) targetServiceId = matchReg.service_id;

                        if (targetServiceId) {
                            const res = await window.YatraSetuApi.reassignStakeholderDestination(targetServiceId, {
                                new_destination_id: newDestId,
                                reason: reasonVal
                            });
                            alert(`✓ Controlled reassignment completed!\n\nNew Destination: ${res.new_destination_id}\nAudit Trail ID: ${res.audit_log_id}`);
                        } else {
                            const actor = { role: 'admin', name: 'System Admin' };
                            const result = AdminStore.reassignDestination(stakeholderId, newDestId, reasonVal, actor);
                            alert(`✓ Controlled reassignment completed!\n\nNew Destination: ${result.target.destination_name}\nAudit Trail ID: ${result.auditEntry.id}`);
                        }
                    } else {
                        const actor = { role: 'admin', name: 'System Admin' };
                        const result = AdminStore.reassignDestination(stakeholderId, newDestId, reasonVal, actor);
                        alert(`✓ Controlled reassignment completed!\n\nNew Destination: ${result.target.destination_name}\nAudit Trail ID: ${result.auditEntry.id}`);
                    }
                    modal.classList.remove('active');
                    document.body.style.overflow = '';
                    await renderAdminAccountsTable();
                    await renderAdminRegistrationsTable();
                    await initAdminMetrics();
                } catch (err) {
                    alert(err.message || 'Failed to reassign destination.');
                }
            };
        }

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    /**
     * 3F. CSV Export Utilities
     */
    function exportAccountsCsv() {
        const users = AdminStore.getUsers().filter(u => u.role === 'stakeholder');
        let csv = 'Name,Email,Business Name,Destination,Status,Registered On\n';
        users.forEach(u => {
            csv += `"${u.name}","${u.email}","${u.organization || u.name}","${u.destination_name}","${u.account_status}","${u.created_at}"\n`;
        });
        downloadCsvBlob(csv, 'yatrasetu_stakeholder_accounts.csv');
    }

    function exportRegistrationsCsv() {
        const users = AdminStore.getUsers().filter(u => u.role === 'stakeholder');
        let csv = 'Business Name,Stakeholder,Destination,Category,Status,Submitted On\n';
        users.forEach(u => {
            csv += `"${u.organization || u.name}","${u.name}","${u.destination_name}","${u.category || 'General'}","${u.registration_status || 'Pending Approval'}","${u.created_at}"\n`;
        });
        downloadCsvBlob(csv, 'yatrasetu_business_registrations.csv');
    }

    function downloadCsvBlob(csvContent, filename) {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    /**
     * 3G. Media, Reports, Destinations & RBAC Views
     */
    function renderAdminMediaView() {
        const container = document.getElementById('admin-media-content-container');
        if (!container) return;

        container.innerHTML = `
            <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 12px; padding: 1.5rem; box-shadow: 0 1px 3px rgba(15,23,42,0.04);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
                    <div>
                        <h3 style="font-size: 1.05rem; font-weight: 800; color: #0F172A; margin: 0;">Global Media Repository Oversight</h3>
                        <p style="font-size: 0.8rem; color: #64748B; margin: 0.2rem 0 0 0;">Review curated destination videos and verified stakeholder listings across all states.</p>
                    </div>
                    <span class="admin-badge active">Governance Active</span>
                </div>

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.25rem;">
                    <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 1rem;">
                        <div style="font-weight: 700; color: #0F172A; margin-bottom: 0.35rem;">📹 Official Destination Videos</div>
                        <div style="font-size: 0.78rem; color: #475569; margin-bottom: 0.75rem;">Verified educational and documentary streams published by Destination Managers.</div>
                        <span class="admin-badge approved">8 Verified Streams</span>
                    </div>

                    <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 1rem;">
                        <div style="font-weight: 700; color: #0F172A; margin-bottom: 0.35rem;">🖼️ Stakeholder Showcase Photography</div>
                        <div style="font-size: 0.78rem; color: #475569; margin-bottom: 0.75rem;">Registered business listings, tariffs, and facility visual assets under regional manager review.</div>
                        <span class="admin-badge approved">14 Approved Listings</span>
                    </div>

                    <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 1rem;">
                        <div style="font-weight: 700; color: #0F172A; margin-bottom: 0.35rem;">💬 Tourist Review Verification</div>
                        <div style="font-size: 0.78rem; color: #475569; margin-bottom: 0.75rem;">Moderated visitor reviews and feedback preventing promotional tampering.</div>
                        <span class="admin-badge blue">Audit Protected</span>
                    </div>
                </div>
            </div>
        `;
    }

    function renderAdminReportsView() {
        const container = document.getElementById('admin-reports-container');
        if (!container) return;

        const users = AdminStore.getUsers();
        const totalStakeholders = users.filter(u => u.role === 'stakeholder').length;
        const totalManagers = users.filter(u => u.role === 'manager').length;
        const auditCount = AdminStore.getAuditTrail().length;

        container.innerHTML = `
            <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 12px; padding: 1.5rem; box-shadow: 0 1px 3px rgba(15,23,42,0.04);">
                <h3 style="font-size: 1.05rem; font-weight: 800; color: #0F172A; margin-bottom: 1.25rem;">Executive Platform Summary Report</h3>
                
                <div class="admin-modal-field-grid" style="margin-bottom: 1.5rem;">
                    <div class="admin-modal-field" style="background: #F8FAFC; padding: 1rem; border-radius: 8px;">
                        <span class="admin-modal-field-label">Active Stakeholder Network</span>
                        <span class="admin-modal-field-value" style="font-size: 1.4rem; color: #2563EB;">${totalStakeholders}</span>
                    </div>
                    <div class="admin-modal-field" style="background: #F8FAFC; padding: 1rem; border-radius: 8px;">
                        <span class="admin-modal-field-label">Regional Managers Deployed</span>
                        <span class="admin-modal-field-value" style="font-size: 1.4rem; color: #D97706;">${totalManagers}</span>
                    </div>
                    <div class="admin-modal-field" style="background: #F8FAFC; padding: 1rem; border-radius: 8px;">
                        <span class="admin-modal-field-label">Audited Administrative Events</span>
                        <span class="admin-modal-field-value" style="font-size: 1.4rem; color: #16A34A;">${auditCount}</span>
                    </div>
                    <div class="admin-modal-field" style="background: #F8FAFC; padding: 1rem; border-radius: 8px;">
                        <span class="admin-modal-field-label">Destination Integrity Status</span>
                        <span class="admin-modal-field-value" style="font-size: 1.1rem; color: #059669;">100% Locked Compliance</span>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 3G. Destinations Catalog & Jurisdictions View
     */
    let destsSearchQuery = '';
    let destsStateFilter = 'all';

    function initAdminDestinationsTable() {
        const searchInput = document.getElementById('admin-destinations-search');
        const stateSelect = document.getElementById('admin-destinations-state-filter');
        const resetBtn = document.getElementById('btn-reset-destinations-filter');

        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                destsSearchQuery = e.target.value.toLowerCase().trim();
                renderAdminDestinationsView();
            });
        }

        if (stateSelect) {
            stateSelect.addEventListener('change', (e) => {
                destsStateFilter = e.target.value;
                renderAdminDestinationsView();
            });
        }

        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                destsSearchQuery = '';
                destsStateFilter = 'all';
                if (searchInput) searchInput.value = '';
                if (stateSelect) stateSelect.value = 'all';
                renderAdminDestinationsView();
            });
        }

        renderAdminDestinationsView();
    }

    function renderAdminDestinationsView() {
        const container = document.getElementById('admin-destinations-container');
        if (!container) return;

        const managerData = window.YatraSetuManagerData || {};
        const states = managerData.states || [];
        const destinations = managerData.destinations || [];
        const users = AdminStore.getUsers();

        let filteredStates = states;
        if (destsStateFilter !== 'all') {
            filteredStates = states.filter(s => s.id === destsStateFilter);
        }

        if (filteredStates.length === 0) {
            container.innerHTML = `<div style="text-align: center; padding: 2.5rem; color: #64748B; background: #FFFFFF; border-radius: 12px; border: 1px solid #E2E8F0;">No destinations found matching current filters.</div>`;
            return;
        }

        container.innerHTML = filteredStates.map(st => {
            let stateDests = destinations.filter(d => d.state_id === st.id);
            if (destsSearchQuery) {
                stateDests = stateDests.filter(d =>
                    d.name.toLowerCase().includes(destsSearchQuery) ||
                    (d.category && d.category.toLowerCase().includes(destsSearchQuery)) ||
                    d.id.toLowerCase().includes(destsSearchQuery)
                );
            }

            const stateManagers = users.filter(u => u.role === 'manager' && (u.state_id === st.id || u.state_id === 'all'));
            const stateStakeholders = users.filter(u => u.role === 'stakeholder' && u.state_id === st.id);

            return `
                <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 12px; padding: 1.25rem; margin-bottom: 1.25rem; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; border-bottom: 1px solid #F1F5F9; padding-bottom: 0.75rem;">
                        <div>
                            <h3 style="font-size: 1.15rem; font-weight: 800; color: #0F172A; margin: 0;">📍 ${st.name} State Territory</h3>
                            <span style="font-size: 0.75rem; color: #64748B;">Showing <strong>${stateDests.length}</strong> Destination Jurisdictions</span>
                        </div>
                        <div style="display: flex; gap: 0.5rem;">
                            <span class="admin-badge amber">
                                🛡️ ${stateManagers.length} Manager${stateManagers.length !== 1 ? 's' : ''}
                            </span>
                            <span class="admin-badge blue">
                                👥 ${stateStakeholders.length} Stakeholders
                            </span>
                        </div>
                    </div>

                    ${stateDests.length === 0 ? `
                        <div style="padding: 1.5rem; text-align: center; color: #64748B; font-size: 0.82rem;">No destinations match "${destsSearchQuery}" in this state.</div>
                    ` : `
                        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 0.85rem;">
                            ${stateDests.map(d => {
                                const destSh = users.filter(u => u.role === 'stakeholder' && u.destination_id === d.id);
                                const destMgr = users.find(u => u.role === 'manager' && u.destination_id === d.id);
                                const assignedMgrLabel = destMgr ? destMgr.name : 'State Manager Overseeing';

                                return `
                                    <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 0.85rem; display: flex; flex-direction: column; justify-content: space-between;">
                                        <div>
                                            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.35rem;">
                                                <strong style="color: #0F172A; font-size: 0.92rem;">${d.name}</strong>
                                                <span class="admin-badge blue" style="font-size: 0.65rem;">${d.category || 'General'}</span>
                                            </div>
                                            <div style="font-size: 0.74rem; color: #64748B; margin-bottom: 0.45rem;">ID: <code>${d.id}</code></div>
                                            <div style="font-size: 0.74rem; color: #475569; margin-bottom: 0.25rem;">
                                                🛡️ Mgr: <strong>${assignedMgrLabel}</strong>
                                            </div>
                                            <div style="font-size: 0.76rem; color: #334155; font-weight: 600; margin-bottom: 0.75rem;">
                                                🤝 ${destSh.length} Stakeholder Partner${destSh.length !== 1 ? 's' : ''}
                                            </div>
                                        </div>
                                        <div>
                                            <button type="button" class="admin-btn-secondary btn-filter-dest-sh" data-dest-id="${d.id}" style="width: 100%; font-size: 0.75rem; padding: 0.35rem 0.5rem; justify-content: center;">
                                                View Stakeholders (${destSh.length})
                                            </button>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    `}
                </div>
            `;
        }).join('');

        // Wire "View Stakeholders" buttons to filter Accounts tab
        container.querySelectorAll('.btn-filter-dest-sh').forEach(btn => {
            btn.addEventListener('click', () => {
                const destId = btn.getAttribute('data-dest-id');
                switchAdminTab('users');
                const destSelect = document.getElementById('admin-accounts-dest-filter');
                if (destSelect) {
                    destSelect.value = destId;
                    accountsDestFilter = destId;
                    renderAdminAccountsTable();
                }
            });
        });
    }

    /**
     * 3H. Roles & Permissions Matrix View
     */
    function renderAdminRolesView() {
        const container = document.getElementById('admin-roles-view-container');
        if (!container) return;

        container.innerHTML = `
            <div style="background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 10px; padding: 1.15rem; margin-bottom: 1.5rem;">
                <div style="display: flex; align-items: flex-start; gap: 0.75rem;">
                    <div style="font-size: 1.5rem; line-height: 1;">🛡️</div>
                    <div>
                        <h4 style="font-size: 0.95rem; font-weight: 800; color: #1E40AF; margin: 0 0 0.35rem 0;">
                            Architectural Rule: Exactly Four Platform Roles (State Manager is an Access Level, Not a 5th Role)
                        </h4>
                        <p style="font-size: 0.82rem; color: #1E3A8A; line-height: 1.5; margin: 0;">
                            YatraSetu enforces exactly 4 roles: <strong>Administrator</strong>, <strong>Destination Manager</strong>, <strong>Tourism Stakeholder</strong>, and <strong>Tourist</strong>.
                            "State Manager" represents an elevated authorization scope (<code>scope: 'STATE'</code>) within the <strong>Destination Manager</strong> role allowing state-wide jurisdiction, rather than a separate role entity.
                        </p>
                    </div>
                </div>
            </div>

            <div class="admin-table-container">
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>Role Code</th>
                            <th>Role Title &amp; Scope</th>
                            <th>Core Governance Capabilities (Permitted)</th>
                            <th>Prohibited Actions</th>
                            <th>Storage / DB Entity Key</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><span style="font-family: monospace; font-weight: 700; color: #701A75;">admin</span></td>
                            <td>
                                <strong style="color: #0F172A; display: block;">Platform Administrator</strong>
                                <span style="font-size: 0.74rem; color: #64748B;">Global Platform Level</span>
                            </td>
                            <td style="font-size: 0.8rem; color: #334155;">
                                • Activate, deactivate, or delete user accounts (Sole Authority)<br>
                                • Controlled destination reassignment with audit trail<br>
                                • Controlled Manager Authority jurisdiction reassignment<br>
                                • Global platform configuration &amp; RBAC governance<br>
                                • Full access to system audit trail
                            </td>
                            <td style="font-size: 0.78rem; color: #B91C1C;">
                                ✕ Cannot fabricate mock storage as server persistence without real database.
                            </td>
                            <td style="font-size: 0.75rem; color: #475569;">
                                <code>role = 'admin'</code>
                            </td>
                        </tr>
                        <tr>
                            <td><span style="font-family: monospace; font-weight: 700; color: #D97706;">manager</span></td>
                            <td>
                                <strong style="color: #0F172A; display: block;">Destination Manager</strong>
                                <span style="font-size: 0.74rem; color: #B45309; font-weight: 600;">Access Levels: State Manager or Local Destination Manager</span>
                            </td>
                            <td style="font-size: 0.8rem; color: #334155;">
                                • Review &amp; decide stakeholder business registrations within jurisdiction<br>
                                • Manage destination profiles, attractions, events &amp; information videos<br>
                                • Controlled destination reassignment within authorized state<br>
                                • Review tourist feedback &amp; stakeholder suggestions
                            </td>
                            <td style="font-size: 0.78rem; color: #B91C1C;">
                                ✕ Cannot activate, deactivate, or delete accounts (Admin only)<br>
                                ✕ Cannot review registrations outside authorized territory
                            </td>
                            <td style="font-size: 0.75rem; color: #475569;">
                                <code>role = 'manager'</code><br>
                                <span style="font-size: 0.7rem; color: #64748B;">scope: 'STATE' | 'DESTINATION'</span>
                            </td>
                        </tr>
                        <tr>
                            <td><span style="font-family: monospace; font-weight: 700; color: #0284C7;">stakeholder</span></td>
                            <td>
                                <strong style="color: #0F172A; display: block;">Tourism Stakeholder</strong>
                                <span style="font-size: 0.74rem; color: #64748B;">Local Tourism Service / Partner</span>
                            </td>
                            <td style="font-size: 0.8rem; color: #334155;">
                                • Submit business registration for chosen state and destination<br>
                                • Manage service profile, visitor contact details &amp; tariffs<br>
                                • Submit feedback/suggestions to Destination Manager<br>
                                • View destination updates &amp; notices
                            </td>
                            <td style="font-size: 0.78rem; color: #B91C1C;">
                                ✕ Destination locked upon approval (cannot alter via profile)<br>
                                ✕ Cannot publish media directly without manager review
                            </td>
                            <td style="font-size: 0.75rem; color: #475569;">
                                <code>role = 'stakeholder'</code>
                            </td>
                        </tr>
                        <tr>
                            <td><span style="font-family: monospace; font-weight: 700; color: #16A34A;">tourist</span></td>
                            <td>
                                <strong style="color: #0F172A; display: block;">Tourist Member</strong>
                                <span style="font-size: 0.74rem; color: #64748B;">Public Explorer &amp; Visitor</span>
                            </td>
                            <td style="font-size: 0.8rem; color: #334155;">
                                • Explore destinations, attractions, and verified services<br>
                                • Watch official destination information videos<br>
                                • Submit destination feedback and reviews<br>
                                • Trip planning and itinerary exploration
                            </td>
                            <td style="font-size: 0.78rem; color: #B91C1C;">
                                ✕ No management or partner verification controls
                            </td>
                            <td style="font-size: 0.75rem; color: #475569;">
                                <code>role = 'tourist'</code>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Prototype Disclaimer Notice -->
            <div style="background: #FFFBEB; border: 1px solid #FDE68A; border-radius: 8px; padding: 0.85rem 1rem; margin-top: 1.25rem; font-size: 0.78rem; color: #92400E; display: flex; align-items: center; gap: 0.5rem;">
                <span>ℹ️</span>
                <span><strong>Application-Layer RBAC Prototype:</strong> Role permissions documented above are validated client-side across UI workflows and local stores. Production server-enforced RBAC, password hashing, and cryptographic JWT authorization will be implemented in Phase 11 FastAPI backend.</span>
            </div>
        `;
    }

    /**
     * 3I. Manager Authority View & Controller (NEW SECTION)
     */
    let managersSearchQuery = '';
    let managersScopeFilter = 'all';
    let managersStateFilter = 'all';
    let currentModalManagerId = null;

    function initAdminManagersView() {
        const searchInput = document.getElementById('admin-managers-search');
        const scopeSelect = document.getElementById('admin-managers-scope-filter');
        const stateSelect = document.getElementById('admin-managers-state-filter');
        const resetBtn = document.getElementById('btn-reset-managers-filter');

        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                managersSearchQuery = e.target.value.toLowerCase().trim();
                renderAdminManagersView();
            });
        }

        if (scopeSelect) {
            scopeSelect.addEventListener('change', (e) => {
                managersScopeFilter = e.target.value;
                renderAdminManagersView();
            });
        }

        if (stateSelect) {
            stateSelect.addEventListener('change', (e) => {
                managersStateFilter = e.target.value;
                renderAdminManagersView();
            });
        }

        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                managersSearchQuery = '';
                managersScopeFilter = 'all';
                managersStateFilter = 'all';
                if (searchInput) searchInput.value = '';
                if (scopeSelect) scopeSelect.value = 'all';
                if (stateSelect) stateSelect.value = 'all';
                renderAdminManagersView();
            });
        }

        // Setup modal tab toggling
        const btnTabOverview = document.getElementById('btn-mgr-tab-overview');
        const btnTabReassign = document.getElementById('btn-mgr-tab-reassign');
        const contentOverview = document.getElementById('mgr-modal-content-overview');
        const contentReassign = document.getElementById('mgr-modal-content-reassign');
        const btnSaveReassign = document.getElementById('btn-save-mgr-reassign');

        if (btnTabOverview && btnTabReassign) {
            btnTabOverview.addEventListener('click', () => {
                btnTabOverview.classList.add('active');
                btnTabReassign.classList.remove('active');
                if (contentOverview) contentOverview.style.display = 'block';
                if (contentReassign) contentReassign.style.display = 'none';
                if (btnSaveReassign) btnSaveReassign.style.display = 'none';
            });

            btnTabReassign.addEventListener('click', () => {
                btnTabReassign.classList.add('active');
                btnTabOverview.classList.remove('active');
                if (contentOverview) contentOverview.style.display = 'none';
                if (contentReassign) contentReassign.style.display = 'block';
                if (btnSaveReassign) btnSaveReassign.style.display = 'inline-block';
            });
        }

        // Dynamic destination populating in Reassign Jurisdiction modal tab
        const levelSelect = document.getElementById('mgr-reassign-level-select');
        const stateReassignSelect = document.getElementById('mgr-reassign-state-select');
        const destSelectGroup = document.getElementById('mgr-dest-select-group');
        const destReassignSelect = document.getElementById('mgr-reassign-dest-select');

        function updateDestOptions() {
            if (!destReassignSelect || !levelSelect || !stateReassignSelect) return;
            const level = levelSelect.value;
            const st = stateReassignSelect.value;

            if (level === 'State Manager') {
                if (destSelectGroup) destSelectGroup.style.display = 'none';
            } else {
                if (destSelectGroup) destSelectGroup.style.display = 'block';
                const managerData = window.YatraSetuManagerData || {};
                const destinations = (managerData.destinations || []).filter(d => d.state_id === st);
                destReassignSelect.innerHTML = destinations.map(d => `<option value="${d.id}">${d.name} (${d.category || 'General'})</option>`).join('');
            }
        }

        if (levelSelect) levelSelect.addEventListener('change', updateDestOptions);
        if (stateReassignSelect) stateReassignSelect.addEventListener('change', updateDestOptions);

        // Save Manager Authority Reassignment
        if (btnSaveReassign) {
            btnSaveReassign.addEventListener('click', async () => {
                if (!currentModalManagerId) return;
                const newLevel = levelSelect ? levelSelect.value : 'State Manager';
                const newState = stateReassignSelect ? stateReassignSelect.value : 'maharashtra';
                const newDest = destReassignSelect ? destReassignSelect.value : 'all';
                const reasonInput = document.getElementById('mgr-reassign-reason-input');
                const reason = reasonInput ? reasonInput.value.trim() : '';

                if (!reason || reason.length < 6) {
                    alert('Please provide a mandatory administrative rationale (minimum 6 characters) for audit trail attribution.');
                    if (reasonInput) reasonInput.focus();
                    return;
                }

                try {
                    if (window.YatraSetuApi && typeof window.YatraSetuApi.hasToken === 'function' && window.YatraSetuApi.hasToken()) {
                        const targetDest = newLevel === 'State Manager' ? null : (newDest === 'all' ? null : newDest);
                        const result = await window.YatraSetuApi.assignAdminManagerJurisdiction({
                            user_id: currentModalManagerId,
                            state_id: newState,
                            destination_id: targetDest,
                            reason: reason
                        });
                        alert(`✓ Manager Authority updated successfully!\n\nNew Jurisdiction: ${result.access_level} — ${result.destination_name || result.state_name || newState}\nAudit Log ID: ${result.assignment_id || 'Recorded'}`);
                    } else {
                        const result = AdminStore.reassignManagerAuthority(currentModalManagerId, newLevel, newState, newDest, reason);
                        alert(`✓ Manager Authority updated successfully!\n\nNew Jurisdiction: ${result.manager.access_level} — ${result.manager.destination_name}\nAudit Log ID: ${result.auditEntry.id}`);
                    }

                    const modal = document.getElementById('adminManagerAuthorityModal');
                    if (modal) modal.classList.remove('active');
                    document.body.style.overflow = '';

                    await renderAdminManagersView();
                    await renderAdminAuditTrailView();
                    await initAdminMetrics();
                } catch (err) {
                    alert(err.message || 'Failed to update manager authority.');
                }
            });
        }

        renderAdminManagersView();
    }

    async function renderAdminManagersView() {
        const tbody = document.getElementById('admin-managers-table-body');
        const auditTbody = document.getElementById('admin-managers-audit-body');
        if (!tbody) return;

        let managers = [];
        const hasApi = window.YatraSetuApi && typeof window.YatraSetuApi.hasToken === 'function' && window.YatraSetuApi.hasToken();

        if (hasApi) {
            try {
                const mgrList = await window.YatraSetuApi.getAdminManagers();
                if (Array.isArray(mgrList)) {
                    cachedManagers = mgrList;
                    managers = mgrList.map(m => ({
                        id: m.user_id,
                        name: m.full_name,
                        email: m.email,
                        organization: 'State Tourism Authority',
                        access_level: m.access_level,
                        state_id: m.state_id,
                        destination_id: m.destination_id || 'all',
                        destination_name: m.destination_name || (m.state_name ? `${m.state_name} (All Destinations)` : 'Regional Territory'),
                        account_status: m.is_active ? 'Active' : 'Deactivated',
                        raw: m
                    }));
                }
            } catch (err) {
                console.warn('[Admin] Live managers fetch failed, using fallback:', err);
            }
        }

        // Fallback to local store ONLY if API is unavailable
        if (!hasApi && managers.length === 0) {
            managers = AdminStore.getUsers().filter(u => u.role === 'manager');
        }

        // Apply filters
        if (managersScopeFilter !== 'all') {
            managers = managers.filter(u => u.access_level === managersScopeFilter);
        }
        if (managersStateFilter !== 'all') {
            managers = managers.filter(u => u.state_id === managersStateFilter || u.state_id === 'all');
        }
        if (managersSearchQuery) {
            managers = managers.filter(u =>
                u.name.toLowerCase().includes(managersSearchQuery) ||
                u.email.toLowerCase().includes(managersSearchQuery) ||
                (u.organization && u.organization.toLowerCase().includes(managersSearchQuery)) ||
                u.id.toLowerCase().includes(managersSearchQuery)
            );
        }

        if (managers.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 2.5rem; color: #64748B;">No managers found matching current filters.</td></tr>`;
        } else {
            tbody.innerHTML = managers.map(m => {
                const isState = m.access_level === 'State Manager';
                const scopeBadge = isState
                    ? `<span class="admin-badge amber">State Manager</span>`
                    : `<span class="admin-badge blue">Destination Manager</span>`;

                const capabilities = isState
                    ? `State-wide oversight • Regional registration review • Destination profile curation`
                    : `Destination-specific approvals • Local attraction curation • Regional partner coordination`;

                return `
                    <tr data-manager-id="${m.id}">
                        <td>
                            <div class="admin-user-cell">
                                <span class="admin-user-name">${m.name}</span>
                                <span class="admin-user-email">${m.email}</span>
                                <span style="font-size: 0.72rem; color: #64748B;">${m.organization || 'Official'} • ID: <code>${m.id}</code></span>
                            </div>
                        </td>
                        <td>${scopeBadge}</td>
                        <td>
                            <strong style="color: #0F172A; font-size: 0.85rem;">${m.destination_name}</strong>
                            <div style="font-size: 0.72rem; color: #64748B;">State: ${(m.state_id || 'maharashtra').toUpperCase()}</div>
                        </td>
                        <td><span class="admin-badge active">Active</span></td>
                        <td><span style="font-size: 0.76rem; color: #334155;">${capabilities}</span></td>
                        <td style="text-align: right; white-space: nowrap;">
                            <button type="button" class="admin-action-btn-view btn-view-manager-auth" data-manager-id="${m.id}">View Authority</button>
                            <button type="button" class="admin-btn-secondary btn-reassign-manager-auth" data-manager-id="${m.id}" style="font-size: 0.75rem; padding: 0.25rem 0.55rem; margin-left: 0.35rem;">
                                Reassign
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');

            tbody.querySelectorAll('.btn-view-manager-auth').forEach(btn => {
                btn.addEventListener('click', () => {
                    const mid = btn.getAttribute('data-manager-id');
                    openManagerAuthorityModal(mid, 'overview');
                });
            });

            tbody.querySelectorAll('.btn-reassign-manager-auth').forEach(btn => {
                btn.addEventListener('click', () => {
                    const mid = btn.getAttribute('data-manager-id');
                    openManagerAuthorityModal(mid, 'reassign');
                });
            });
        }

        // Render Manager Authority Audit History
        if (auditTbody) {
            let auditTrail = [];
            if (hasApi) {
                try {
                    const aRes = await window.YatraSetuApi.getAdminAuditLogs({ action: 'MANAGER_AUTHORITY_ASSIGNED', page: 1, page_size: 10 });
                    if (aRes && aRes.items) {
                        auditTrail = aRes.items.map(e => ({
                            timestamp: formatDisplayDate(e.created_at),
                            action: e.action,
                            stakeholder_name: e.actor_name || 'Administrator',
                            stakeholder_id: e.record_id,
                            details: `Authority updated on manager_assignments: ${JSON.stringify(e.new_values || {})}`,
                            previous_value: e.old_values ? JSON.stringify(e.old_values) : '',
                            new_value: e.new_values ? JSON.stringify(e.new_values) : '',
                            actor_name: e.actor_name || 'Admin',
                            actor_role: e.actor_role || 'Administrator'
                        }));
                    }
                } catch (e) {}
            }

            if (auditTrail.length === 0) {
                auditTrail = AdminStore.getAuditTrail().filter(e =>
                    e.action.includes('MANAGER_AUTHORITY') ||
                    (e.stakeholder_id && e.stakeholder_id.startsWith('usr-mgr'))
                );
            }

            if (auditTrail.length === 0) {
                auditTbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 1.5rem; color: #64748B;">No manager authority events recorded yet.</td></tr>`;
            } else {
                auditTbody.innerHTML = auditTrail.map(e => `
                    <tr>
                        <td style="font-size: 0.78rem; color: #64748B; white-space: nowrap;">${e.timestamp}</td>
                        <td><span class="admin-badge amber">${e.action.replace(/_/g, ' ')}</span></td>
                        <td>
                            <strong style="color: #0F172A; font-size: 0.85rem;">${e.stakeholder_name}</strong>
                            <div style="font-size: 0.72rem; color: #64748B;">ID: ${e.stakeholder_id}</div>
                        </td>
                        <td style="font-size: 0.78rem; color: #334155;">
                            <div>${e.details}</div>
                            ${e.previous_value ? `<div style="font-size: 0.72rem; color: #64748B; margin-top: 0.2rem;">Change: <code>${e.previous_value}</code> ➔ <strong style="color: #065F46;">${e.new_value}</strong></div>` : ''}
                        </td>
                        <td style="font-size: 0.78rem; color: #1E293B; white-space: nowrap;">
                            <strong>${e.actor_name}</strong>
                            <div style="font-size: 0.7rem; color: #64748B;">${e.actor_role}</div>
                        </td>
                    </tr>
                `).join('');
            }
        }
    }

    function openManagerAuthorityModal(managerId, activeTab = 'overview') {
        const modal = document.getElementById('adminManagerAuthorityModal');
        const manager = cachedManagers.find(m => m.user_id === managerId || m.id === managerId) || AdminStore.getUsers().find(u => u.id === managerId);
        if (!modal || !manager) return;

        currentModalManagerId = managerId;

        // Populate Header
        const avatarEl = document.getElementById('mgr-modal-avatar');
        const nameEl = document.getElementById('mgr-modal-name');
        const emailEl = document.getElementById('mgr-modal-email');
        const orgEl = document.getElementById('mgr-modal-org');
        const statusEl = document.getElementById('mgr-modal-status');

        if (avatarEl) avatarEl.textContent = manager.name[0].toUpperCase();
        if (nameEl) nameEl.textContent = manager.name;
        if (emailEl) emailEl.textContent = manager.email;
        if (orgEl) orgEl.textContent = `${manager.organization || 'Tourism Authority'} • ID: ${manager.id}`;
        if (statusEl) statusEl.textContent = manager.account_status || 'Active';

        // Populate Overview Tab
        const levelEl = document.getElementById('mgr-modal-access-level');
        const territoryEl = document.getElementById('mgr-modal-territory');
        const acctStatusEl = document.getElementById('mgr-modal-acct-status');
        const capEl = document.getElementById('mgr-modal-capabilities');

        const isState = manager.access_level === 'State Manager';
        if (levelEl) levelEl.textContent = manager.access_level;
        if (territoryEl) territoryEl.textContent = manager.destination_name;
        if (acctStatusEl) acctStatusEl.textContent = manager.account_status || 'Active';

        if (capEl) {
            if (isState) {
                capEl.innerHTML = `
                    <div style="margin-bottom: 0.35rem; color: #15803D;">✓ <strong>State-wide Jurisdiction:</strong> Full operational and review visibility across all destinations in ${(manager.state_id || 'Maharashtra').toUpperCase()}.</div>
                    <div style="margin-bottom: 0.35rem; color: #15803D;">✓ <strong>Stakeholder Registration Review:</strong> Authorized to review and approve/reject business submissions across any destination in the state.</div>
                    <div style="margin-bottom: 0.35rem; color: #15803D;">✓ <strong>Destination Content Management:</strong> Manage official media, video listings, attractions, and seasonal events state-wide.</div>
                    <div style="color: #B45309;">⚠️ <strong>Scope Boundary:</strong> State visibility does NOT grant authority outside ${(manager.state_id || 'Maharashtra').toUpperCase()}, nor does it grant user account activation/deactivation/deletion privileges.</div>
                `;
            } else {
                capEl.innerHTML = `
                    <div style="margin-bottom: 0.35rem; color: #15803D;">✓ <strong>Local Destination Jurisdiction:</strong> Review and operational authority strictly restricted to <strong>${manager.destination_name}</strong>.</div>
                    <div style="margin-bottom: 0.35rem; color: #15803D;">✓ <strong>Local Business Approvals:</strong> Authorized to review and decide business registrations operating within ${manager.destination_name}.</div>
                    <div style="margin-bottom: 0.35rem; color: #15803D;">✓ <strong>Destination Video &amp; Profile Updates:</strong> Manage attractions, notices, and curated media for ${manager.destination_name}.</div>
                    <div style="color: #B45309;">⚠️ <strong>Scope Boundary:</strong> Approvals and operational actions remain strictly within ${manager.destination_name}. Cannot review registrations for other destinations.</div>
                `;
            }
        }

        // Setup Reassign Tab Controls
        const reassignLevelSelect = document.getElementById('mgr-reassign-level-select');
        const reassignStateSelect = document.getElementById('mgr-reassign-state-select');
        const reassignDestSelect = document.getElementById('mgr-reassign-dest-select');
        const destSelectGroup = document.getElementById('mgr-dest-select-group');
        const reasonInput = document.getElementById('mgr-reassign-reason-input');

        const managerData = window.YatraSetuManagerData || {};
        const states = managerData.states || [];
        if (reassignStateSelect && states.length > 0) {
            reassignStateSelect.innerHTML = states.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
        }

        if (reassignLevelSelect) reassignLevelSelect.value = manager.access_level;
        if (reassignStateSelect) reassignStateSelect.value = manager.state_id || 'maharashtra';
        if (reasonInput) reasonInput.value = '';

        if (reassignDestSelect && reassignStateSelect) {
            const destinations = (managerData.destinations || []).filter(d => d.state_id === reassignStateSelect.value);
            reassignDestSelect.innerHTML = destinations.map(d => `<option value="${d.id}">${d.name} (${d.category || 'General'})</option>`).join('');
            if (manager.destination_id && manager.destination_id !== 'all') {
                reassignDestSelect.value = manager.destination_id;
            }
        }

        if (destSelectGroup) {
            destSelectGroup.style.display = isState ? 'none' : 'block';
        }

        // Switch to initial tab
        const btnTabOverview = document.getElementById('btn-mgr-tab-overview');
        const btnTabReassign = document.getElementById('btn-mgr-tab-reassign');
        const contentOverview = document.getElementById('mgr-modal-content-overview');
        const contentReassign = document.getElementById('mgr-modal-content-reassign');
        const btnSaveReassign = document.getElementById('btn-save-mgr-reassign');

        if (activeTab === 'reassign') {
            if (btnTabReassign) btnTabReassign.classList.add('active');
            if (btnTabOverview) btnTabOverview.classList.remove('active');
            if (contentOverview) contentOverview.style.display = 'none';
            if (contentReassign) contentReassign.style.display = 'block';
            if (btnSaveReassign) btnSaveReassign.style.display = 'inline-block';
        } else {
            if (btnTabOverview) btnTabOverview.classList.add('active');
            if (btnTabReassign) btnTabReassign.classList.remove('active');
            if (contentOverview) contentOverview.style.display = 'block';
            if (contentReassign) contentReassign.style.display = 'none';
            if (btnSaveReassign) btnSaveReassign.style.display = 'none';
        }

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    /**
     * 3J. System Audit Trail View & CSV Export
     */
    let auditSearchQuery = '';
    let auditActionFilter = 'all';

    function initAdminAuditTrailView() {
        const searchInput = document.getElementById('admin-audit-search');
        const actionSelect = document.getElementById('admin-audit-action-filter');
        const resetBtn = document.getElementById('btn-reset-audit-filter');
        const exportBtn = document.getElementById('btn-export-audit');

        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                auditSearchQuery = e.target.value.toLowerCase().trim();
                renderAdminAuditTrailView();
            });
        }

        if (actionSelect) {
            actionSelect.addEventListener('change', (e) => {
                auditActionFilter = e.target.value;
                renderAdminAuditTrailView();
            });
        }

        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                auditSearchQuery = '';
                auditActionFilter = 'all';
                if (searchInput) searchInput.value = '';
                if (actionSelect) actionSelect.value = 'all';
                renderAdminAuditTrailView();
            });
        }

        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                exportAuditTrailCsv();
            });
        }

        renderAdminAuditTrailView();
    }

    async function renderAdminAuditTrailView() {
        const tbody = document.getElementById('admin-audit-table-body');
        if (!tbody) return;

        let auditTrail = [];
        const hasApi = window.YatraSetuApi && typeof window.YatraSetuApi.hasToken === 'function' && window.YatraSetuApi.hasToken();

        if (hasApi) {
            try {
                const res = await window.YatraSetuApi.getAdminAuditLogs({
                    action: auditActionFilter !== 'all' ? auditActionFilter : undefined,
                    page: 1,
                    page_size: 50
                });
                if (res && res.items) {
                    cachedAuditTrail = res.items;
                    auditTrail = res.items.map(e => ({
                        id: e.id,
                        timestamp: formatDisplayDate(e.created_at),
                        action: e.action,
                        stakeholder_name: (e.new_values && (e.new_values.business_name || e.new_values.full_name)) || (e.old_values && (e.old_values.business_name || e.old_values.full_name)) || e.table_name,
                        stakeholder_id: e.record_id,
                        details: e.action.replace(/_/g, ' ') + ` on ${e.table_name}`,
                        previous_value: e.old_values ? JSON.stringify(e.old_values) : '',
                        new_value: e.new_values ? JSON.stringify(e.new_values) : '',
                        actor_name: e.actor_name || 'Administrator',
                        actor_role: e.actor_role || 'Platform Administrator'
                    }));
                }
            } catch (err) {
                console.warn('[Admin] Live audit logs fetch failed, using fallback:', err);
            }
        }

        // Fallback to local store ONLY if API is unavailable
        if (!hasApi && auditTrail.length === 0) {
            auditTrail = AdminStore.getAuditTrail();
            if (auditActionFilter !== 'all') {
                auditTrail = auditTrail.filter(e => e.action === auditActionFilter);
            }
            if (auditSearchQuery) {
                auditTrail = auditTrail.filter(e =>
                    e.action.toLowerCase().includes(auditSearchQuery) ||
                    (e.stakeholder_name && e.stakeholder_name.toLowerCase().includes(auditSearchQuery)) ||
                    (e.stakeholder_id && e.stakeholder_id.toLowerCase().includes(auditSearchQuery)) ||
                    (e.actor_name && e.actor_name.toLowerCase().includes(auditSearchQuery)) ||
                    (e.details && e.details.toLowerCase().includes(auditSearchQuery)) ||
                    (e.previous_value && e.previous_value.toLowerCase().includes(auditSearchQuery)) ||
                    (e.new_value && e.new_value.toLowerCase().includes(auditSearchQuery))
                );
            }
        }

        if (auditTrail.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 2.5rem; color: #64748B;">No audit trail events found matching current search &amp; filters.</td></tr>`;
            return;
        }

        tbody.innerHTML = auditTrail.map(event => {
            let badgeClass = 'blue';
            const act = (event.action || '').toUpperCase();
            if (act.includes('ACTIVATED') || act.includes('APPROVED')) badgeClass = 'green';
            if (act.includes('DEACTIVATED') || act.includes('DELETED')) badgeClass = 'red';
            if (act.includes('REASSIGNMENT') || act.includes('MANAGER_AUTHORITY')) badgeClass = 'amber';

            return `
                <tr>
                    <td style="font-size: 0.78rem; color: #64748B; white-space: nowrap;">${event.timestamp}</td>
                    <td><span class="admin-badge ${badgeClass}">${event.action.replace(/_/g, ' ')}</span></td>
                    <td>
                        <strong style="color: #0F172A; font-size: 0.85rem;">${event.stakeholder_name}</strong>
                        <div style="font-size: 0.72rem; color: #64748B;">ID: ${event.stakeholder_id}</div>
                    </td>
                    <td style="font-size: 0.8rem; color: #334155;">
                        <div>${event.details}</div>
                        ${event.previous_value ? `
                            <div style="font-size: 0.72rem; color: #64748B; margin-top: 0.2rem;">
                                Change: <code>${event.previous_value}</code> ➔ <strong style="color: #065F46;">${event.new_value}</strong>
                            </div>
                        ` : ''}
                    </td>
                    <td style="font-size: 0.78rem; color: #1E293B; white-space: nowrap;">
                        <strong>${event.actor_name}</strong>
                        <div style="font-size: 0.7rem; color: #64748B;">${event.actor_role}</div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    function exportAuditTrailCsv() {
        const auditTrail = AdminStore.getAuditTrail();
        let csv = 'Timestamp,Action Type,Target Entity,Target ID,Details,Previous Value,New Value,Authorized Actor,Actor Role\n';
        auditTrail.forEach(e => {
            csv += `"${e.timestamp}","${e.action}","${e.stakeholder_name}","${e.stakeholder_id}","${(e.details || '').replace(/"/g, '""')}","${e.previous_value || ''}","${e.new_value || ''}","${e.actor_name}","${e.actor_role}"\n`;
        });
        downloadCsvBlob(csv, 'yatrasetu_system_audit_trail.csv');
    }

    /**
     * 3H. Modal Close Handlers & New User Creation
     */
    function initAdminModals() {
        // Modal close button listeners
        document.querySelectorAll('.admin-modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.admin-modal-overlay').forEach(m => m.classList.remove('active'));
                document.body.style.overflow = '';
            });
        });

        // Close when clicking modal backdrop
        document.querySelectorAll('.admin-modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    overlay.classList.remove('active');
                    document.body.style.overflow = '';
                }
            });
        });

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.querySelectorAll('.admin-modal-overlay').forEach(m => m.classList.remove('active'));
                document.body.style.overflow = '';
            }
        });

        // Add System User Trigger
        const btnAddUser = document.getElementById('btn-add-system-user');
        const addUserModal = document.getElementById('adminAddUserModal');

        if (btnAddUser && addUserModal) {
            btnAddUser.addEventListener('click', () => {
                addUserModal.classList.add('active');
                document.body.style.overflow = 'hidden';
            });
        }

        const btnSaveNewUser = document.getElementById('btn-save-new-user');
        if (btnSaveNewUser && addUserModal) {
            btnSaveNewUser.addEventListener('click', () => {
                const nameInput = document.getElementById('new-user-name');
                const emailInput = document.getElementById('new-user-email');
                const roleSelect = document.getElementById('new-user-role');
                const scopeSelect = document.getElementById('new-user-scope');
                const destSelect = document.getElementById('new-user-dest');
                const orgInput = document.getElementById('new-user-org');

                const name = nameInput ? nameInput.value.trim() : '';
                const email = emailInput ? emailInput.value.trim() : '';
                const role = roleSelect ? roleSelect.value : 'stakeholder';
                const scope = scopeSelect ? scopeSelect.value : 'Registered Business';
                const destId = destSelect ? destSelect.value : 'lonavala';
                const org = orgInput ? orgInput.value.trim() : '';

                if (!name || !email) {
                    alert('Please enter user name and email address.');
                    return;
                }

                const managerData = window.YatraSetuManagerData || {};
                const destinations = managerData.destinations || [];
                const destObj = destinations.find(d => d.id === destId);

                const newUser = {
                    id: `usr-${Date.now().toString(36)}`,
                    name,
                    email,
                    role,
                    access_level: role === 'manager' ? scope : (role === 'admin' ? 'Platform Administrator' : 'Registered Business'),
                    state_id: destObj ? destObj.state_id : 'maharashtra',
                    destination_id: destId,
                    destination_name: destObj ? destObj.name : 'Lonavala',
                    organization: org || (role === 'stakeholder' ? `${name} Enterprise` : 'Tourism Authority'),
                    account_status: 'Active',
                    registration_status: role === 'stakeholder' ? 'Pending Approval' : 'Approved Official',
                    created_at: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
                    last_active: 'Just now'
                };

                const users = AdminStore.getUsers();
                users.unshift(newUser);
                AdminStore.saveUsers(users);

                AdminStore.logAuditEvent({
                    action: 'USER_ACCOUNT_CREATED',
                    stakeholder_id: newUser.id,
                    stakeholder_name: newUser.organization || newUser.name,
                    actor_name: 'System Admin',
                    actor_role: 'Administrator',
                    details: `Administrator provisioned new user account "${name}" with role "${role}" (${newUser.access_level}).`,
                    previous_value: 'None',
                    new_value: 'Active'
                });

                alert(`Account for "${name}" created successfully!`);
                addUserModal.classList.remove('active');
                document.body.style.overflow = '';

                if (nameInput) nameInput.value = '';
                if (emailInput) emailInput.value = '';
                if (orgInput) orgInput.value = '';

                renderAdminAccountsTable();
                renderAdminRegistrationsTable();
                initAdminMetrics();
            });
        }
    }



    function openAdminProfileModal() {
        const modal = document.getElementById('adminProfileModal');
        if (!modal) return;

        // Authoritative identity strictly from authenticated session storage
        const currentName = sessionStorage.getItem('yatrasetu_name') || 'Platform Administrator';
        const currentEmail = sessionStorage.getItem('yatrasetu_email') || 'admin.governance@yatrasetu.in';
        const currentId = sessionStorage.getItem('yatrasetu_user_id') || 'dae678c4-967a-4b3d-8cf8-3e48503f41d4';

        const nameEl = document.getElementById('admin-profile-name');
        const emailEl = document.getElementById('admin-profile-email');
        const orgEl = document.getElementById('admin-profile-org');
        const idEl = document.getElementById('admin-profile-id');
        const statusEl = document.getElementById('admin-profile-status');
        const createdEl = document.getElementById('admin-profile-created');
        const activeEl = document.getElementById('admin-profile-active');

        if (nameEl) nameEl.textContent = currentName;
        if (emailEl) emailEl.textContent = currentEmail;
        if (orgEl) orgEl.textContent = 'YatraSetu Project Administration';
        if (idEl) idEl.textContent = currentId;
        if (statusEl) statusEl.textContent = 'Active (Authoritative RBAC)';
        if (createdEl) createdEl.textContent = 'Active Session';
        if (activeEl) activeEl.textContent = 'Current Online Session';

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function openAdminSettingsModal() {
        const modal = document.getElementById('adminSettingsGapModal');
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        } else {
            alert('Account Settings: Not yet implemented in this prototype. Platform configuration, credential rotation, and notification preferences belong to the planned Phase 11 FastAPI backend.');
        }
    }

})();
