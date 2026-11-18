/* ==========================================================================
   YatraSetu — Smart Destination Management Platform
   Shared Application Shell, Sidebar, and Topbar System (dashboard.js)
   Provides standardized fixed sidebar, mobile drawer, notifications,
   user identity synchronization, and logout handling across all workspaces.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    initAppSidebar();
    initAppTopbar();
    initRolePreviewSwitcher();
    initNavItems();

    if (window.YatraSetuManagerContext) {
        window.YatraSetuManagerContext.init();
    }
});

/**
 * 1. Fixed Sidebar Navigation & Mobile Collapsible Drawer
 */
function initAppSidebar() {
    const toggleBtn = document.getElementById('sidebar-toggle-btn') || document.querySelector('.btn-sidebar-toggle, .mobile-menu-toggle');
    const sidebar = document.getElementById('app-sidebar');
    if (!sidebar) return;

    // Create or locate backdrop for mobile drawer
    let backdrop = document.querySelector('.sidebar-backdrop');
    if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.className = 'sidebar-backdrop';
        document.body.appendChild(backdrop);
    }

    const openDrawer = () => {
        sidebar.classList.add('show', 'drawer-open');
        backdrop.classList.add('show');
    };

    const closeDrawer = () => {
        sidebar.classList.remove('show', 'drawer-open');
        backdrop.classList.remove('show');
    };

    if (toggleBtn) {
        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (sidebar.classList.contains('show') || sidebar.classList.contains('drawer-open')) {
                closeDrawer();
            } else {
                openDrawer();
            }
        });
    }

    backdrop.addEventListener('click', closeDrawer);

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeDrawer();
    });

    // Close drawer when a navigation item is clicked on mobile
    const navItems = sidebar.querySelectorAll('.app-nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                closeDrawer();
            }
        });
    });

    // Sync active nav item with current URL
    const currentPath = window.location.pathname;
    navItems.forEach(item => {
        const href = item.getAttribute('href');
        if (href && href !== '#' && currentPath.includes(href)) {
            navItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');

            const pageTitle = item.getAttribute('data-title') || item.querySelector('span')?.textContent;
            const breadcrumbActive = document.getElementById('breadcrumb-active');
            if (breadcrumbActive && pageTitle) {
                breadcrumbActive.textContent = pageTitle;
            }
        }
    });

    // Clear session when clicking sidebar footer logout button
    const sidebarLogoutBtns = document.querySelectorAll('.btn-sidebar-logout');
    sidebarLogoutBtns.forEach(btn => {
        btn.addEventListener('click', async () => {
            if (window.YatraSetuApi && typeof window.YatraSetuApi.logout === 'function') {
                await window.YatraSetuApi.logout();
            } else {
                sessionStorage.removeItem('yatrasetu_role');
                sessionStorage.removeItem('yatrasetu_email');
                sessionStorage.removeItem('yatrasetu_name');
            }
        });
    });
}

/**
 * 2. Standardized Topbar: User Identity, User Menu, and Notifications
 */
function initAppTopbar() {
    const topbar = document.querySelector('.app-topbar');
    if (!topbar) return;

    // Detect Active Workspace Role Context
    const currentPath = window.location.pathname;
    let detectedRole = 'tourist';
    let defaultUserName = 'Ananya Sharma';
    let defaultRoleLabel = 'Tourist Member';
    let defaultAvatar = 'AS';

    if (currentPath.includes('/manager/')) {
        detectedRole = 'manager';
        let mgrProfile = null;
        try {
            const rawProfile = sessionStorage.getItem('yatrasetu_manager_profile') || localStorage.getItem('yatrasetu_manager_profile');
            if (rawProfile) mgrProfile = JSON.parse(rawProfile);
        } catch (e) {}

        const profileData = mgrProfile || (window.YatraSetuManagerData && window.YatraSetuManagerData.profile) || {};
        defaultUserName = profileData.name || 'Rajesh Patil';
        const accessLvl = profileData.access_level || profileData.manager_type || sessionStorage.getItem('yatrasetu_manager_access_level') || 'State Manager';
        const terr = profileData.destination || profileData.destination_name || profileData.state_name || 'Maharashtra';
        defaultRoleLabel = `${accessLvl} • ${terr}`;
        defaultAvatar = profileData.avatar_initials || defaultUserName.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'RP';
    } else if (currentPath.includes('/stakeholder/')) {
        detectedRole = 'stakeholder';
        defaultUserName = 'Suresh Deshmukh';
        defaultRoleLabel = 'Tourism Stakeholder';
        defaultAvatar = 'SD';
    } else if (currentPath.includes('/admin/')) {
        detectedRole = 'admin';
        defaultUserName = 'Rajesh Verma';
        defaultRoleLabel = 'System Administrator';
        defaultAvatar = 'RV';
    }

    // Sync User Identity from Session Storage
    const sessionName = sessionStorage.getItem('yatrasetu_name');
    const sessionEmail = sessionStorage.getItem('yatrasetu_email');
    const activeUserName = sessionName || defaultUserName;
    const initials = activeUserName.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2) || defaultAvatar;

    // 2A. Initialize User Profile Badge & Dropdown
    initTopbarUserDropdown(topbar, activeUserName, initials, defaultRoleLabel);

    // 2B. Initialize Notification Button & Floating Panel
    initTopbarNotifications(topbar, detectedRole);

    // 2C. Close Dropdowns on Outer Click
    document.addEventListener('click', (e) => {
        const notifPanel = document.getElementById('notification-dropdown-panel');
        const userMenu = document.getElementById('user-menu-dropdown-panel');
        const notifBtn = topbar.querySelector('.notification-btn');
        const userBadge = topbar.querySelector('.user-profile-badge');

        if (notifPanel && notifBtn && !notifPanel.contains(e.target) && !notifBtn.contains(e.target)) {
            notifPanel.classList.remove('show');
        }
        if (userMenu && userBadge && !userMenu.contains(e.target) && !userBadge.contains(e.target)) {
            userMenu.classList.remove('show');
        }
    });
}

/**
 * Helper: User Profile Badge & Dropdown Panel
 */
function initTopbarUserDropdown(topbar, userName, initials, roleLabel) {
    let userBadge = topbar.querySelector('.user-profile-badge');
    let rightArea = topbar.querySelector('.topbar-right');

    if (!rightArea) {
        rightArea = document.createElement('div');
        rightArea.className = 'topbar-right';
        topbar.appendChild(rightArea);
    }

    if (!userBadge) {
        userBadge = document.createElement('div');
        userBadge.className = 'user-profile-badge';
        userBadge.innerHTML = `
            <div class="user-avatar">${initials}</div>
            <div class="user-info-text">
                <span class="user-name">${userName}</span>
                <span class="user-role">${roleLabel}</span>
            </div>
            <span class="user-caret">▾</span>
        `;
        rightArea.appendChild(userBadge);
    } else {
        // Update existing badge fields
        const avatarEl = userBadge.querySelector('.user-avatar');
        const nameEl = userBadge.querySelector('.user-name');
        const roleEl = userBadge.querySelector('.user-role');

        if (avatarEl) avatarEl.textContent = initials;
        if (nameEl) nameEl.textContent = userName;
        if (roleEl) roleEl.textContent = roleLabel;
        if (!userBadge.querySelector('.user-caret')) {
            const caret = document.createElement('span');
            caret.className = 'user-caret';
            caret.textContent = ' ▾';
            userBadge.appendChild(caret);
        }
    }

    userBadge.style.cursor = 'pointer';

    // Ensure Badge Wrapper
    let badgeWrapper = userBadge.parentElement;
    if (badgeWrapper && !badgeWrapper.classList.contains('user-profile-badge-wrapper')) {
        const parent = userBadge.parentNode;
        if (parent) {
            badgeWrapper = document.createElement('div');
            badgeWrapper.className = 'user-profile-badge-wrapper';
            parent.insertBefore(badgeWrapper, userBadge);
            badgeWrapper.appendChild(userBadge);
        }
    }

    // Floating User Dropdown Panel
    let userMenuPanel = document.getElementById('user-menu-dropdown-panel');
    if (!userMenuPanel) {
        userMenuPanel = document.createElement('div');
        userMenuPanel.id = 'user-menu-dropdown-panel';
        userMenuPanel.className = 'topbar-dropdown-panel user-menu-floating';

        const isRoot = !window.location.pathname.includes('/manager/') &&
                       !window.location.pathname.includes('/stakeholder/') &&
                       !window.location.pathname.includes('/tourist/') &&
                       !window.location.pathname.includes('/admin/');
        const loginPath = isRoot ? 'login.html' : '../login.html';
        const profilePath = window.location.pathname.includes('/manager/') ? 'profile.html' :
                            (window.location.pathname.includes('/stakeholder/') ? 'profile.html' : '#');

        userMenuPanel.innerHTML = `
            <a href="${profilePath}" class="user-menu-item" id="topbar-btn-profile">👤 View Profile</a>
            <a href="${profilePath}" class="user-menu-item" id="topbar-btn-settings">⚙️ Account Settings</a>
            <button type="button" class="user-menu-item logout" id="topbar-btn-logout">🚪 Logout</button>
        `;
        if (badgeWrapper) {
            badgeWrapper.appendChild(userMenuPanel);
        } else if (rightArea) {
            rightArea.appendChild(userMenuPanel);
        }

        const profileBtn = userMenuPanel.querySelector('#topbar-btn-profile');
        if (profileBtn && window.location.pathname.includes('/admin/')) {
            profileBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                userMenuPanel.classList.remove('show');
                if (window.openAdminProfileModal) {
                    window.openAdminProfileModal();
                }
            };
        }

        const settingsBtn = userMenuPanel.querySelector('#topbar-btn-settings');
        if (settingsBtn && window.location.pathname.includes('/admin/')) {
            settingsBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                userMenuPanel.classList.remove('show');
                if (window.openAdminSettingsModal) {
                    window.openAdminSettingsModal();
                }
            };
        }

        const logoutBtn = userMenuPanel.querySelector('#topbar-btn-logout');
        if (logoutBtn) {
            logoutBtn.onclick = async (e) => {
                e.stopPropagation();
                if (window.YatraSetuApi && typeof window.YatraSetuApi.logout === 'function') {
                    await window.YatraSetuApi.logout();
                } else {
                    sessionStorage.removeItem('yatrasetu_role');
                    sessionStorage.removeItem('yatrasetu_email');
                    sessionStorage.removeItem('yatrasetu_name');
                }
                window.location.href = loginPath;
            };
        }
    }

    userBadge.onclick = (e) => {
        e.stopPropagation();
        const notifPanel = document.getElementById('notification-dropdown-panel');
        if (notifPanel) notifPanel.classList.remove('show');
        userMenuPanel.classList.toggle('show');
    };
}

/**
 * Helper: Notification Bell & Floating Panel
 */
function initTopbarNotifications(topbar, role) {
    let notifBtn = topbar.querySelector('.notification-btn');
    let rightArea = topbar.querySelector('.topbar-right');

    if (!notifBtn && rightArea) {
        const notifWrapper = document.createElement('div');
        notifWrapper.className = 'topbar-action-wrapper';
        notifBtn = document.createElement('button');
        notifBtn.type = 'button';
        notifBtn.className = 'notification-btn';
        notifBtn.id = 'notification-btn';
        notifBtn.title = 'Notifications';
        notifBtn.setAttribute('aria-label', 'Notifications');
        notifBtn.innerHTML = `🔔<span class="notification-badge" id="notification-badge">0</span>`;
        notifWrapper.appendChild(notifBtn);
        rightArea.insertBefore(notifWrapper, rightArea.firstChild);
    }

    if (!notifBtn) return;

    let notifWrapper = notifBtn.parentElement;
    if (notifWrapper && !notifWrapper.classList.contains('topbar-action-wrapper')) {
        const parent = notifBtn.parentNode;
        if (parent) {
            notifWrapper = document.createElement('div');
            notifWrapper.className = 'topbar-action-wrapper';
            parent.insertBefore(notifWrapper, notifBtn);
            notifWrapper.appendChild(notifBtn);
        }
    }

    // Role-Specific Prototype Notification Store
    let notifications = [];
    if (role === 'manager') {
        notifications = window.YatraSetuManagerData?.notifications || [
            { id: 'notif-mgr-1', title: '⚠️ High Footfall Warning', message: 'Ajanta Caves approaching 85% daily capacity limit.', time: '25 mins ago', read: false },
            { id: 'notif-mgr-2', title: '📋 Stakeholder Registration', message: 'Sahyadri Trekking Guides submitted verification details.', time: '3 hours ago', read: false },
            { id: 'notif-mgr-3', title: '💬 Feedback Surge', message: '12 new visitor reviews received for Rajgad Fort.', time: '1 day ago', read: true }
        ];
    } else if (role === 'stakeholder') {
        notifications = window.YatraSetuStakeholderData?.notifications || [
            { id: 'notif-sh-1', title: '🚨 Weather & Trail Advisory', message: 'Monsoon trail guidelines updated for Rajgad Fort.', time: '2 hours ago', read: false },
            { id: 'notif-sh-2', title: '💬 Manager Suggestion Review', message: 'Manager Ambika Ambekar reviewed your trail water point suggestion.', time: '1 day ago', read: false },
            { id: 'notif-sh-3', title: '⭐ New Tourist Review', message: 'Anjali Patil left a 5-star review for your trekking guide service.', time: '3 days ago', read: true }
        ];
    } else if (role === 'admin') {
        notifications = [
            { id: 'notif-adm-1', title: '🔐 Security Audit Alert', message: 'Routine credential check passed with 0 permission discrepancies.', time: '1 hour ago', read: false },
            { id: 'notif-adm-2', title: '👤 User Governance', message: 'Account status verified for Destination Manager Ambika Ambekar.', time: '2 days ago', read: true }
        ];
    } else {
        notifications = [
            { id: 'notif-tour-1', title: '📍 Destination Advisory Update', message: 'Seasonal trail guidelines updated for Rajgad Fort.', time: '2 hours ago', read: false },
            { id: 'notif-tour-2', title: '🎉 New Cultural Festival', message: 'Heritage festival registration is now open.', time: '1 day ago', read: true }
        ];
    }

    const notifBadge = notifBtn.querySelector('.notification-badge') || document.getElementById('notification-badge');

    const updateNotifBadge = () => {
        const unreadCount = notifications.filter(n => !n.read).length;
        if (notifBadge) {
            notifBadge.textContent = unreadCount;
            notifBadge.style.display = unreadCount > 0 ? 'flex' : 'none';
        }
    };
    updateNotifBadge();

    // Floating Notification Panel
    let notifPanel = document.getElementById('notification-dropdown-panel');
    if (!notifPanel) {
        notifPanel = document.createElement('div');
        notifPanel.id = 'notification-dropdown-panel';
        notifPanel.className = 'topbar-dropdown-panel notif-dropdown-floating';
        if (notifWrapper) {
            notifWrapper.appendChild(notifPanel);
        } else if (rightArea) {
            rightArea.appendChild(notifPanel);
        }
    }

    const renderNotifList = () => {
        let html = `
            <div class="topbar-dropdown-header">
                <span>Notifications</span>
                <button type="button" id="btn-mark-all-read" style="background:none; border:none; color: var(--state-accent, #EA580C); font-size: 0.75rem; font-weight: 700; cursor: pointer;">Mark all read</button>
            </div>
            <div class="topbar-dropdown-body" id="notification-list-body">
        `;

        if (notifications.length === 0) {
            html += `<div style="padding: 1.5rem; text-align: center; color: var(--text-muted, #64748B); font-size: 0.85rem;">No new notifications</div>`;
        } else {
            html += notifications.map(n => `
                <div class="notification-item ${n.read ? '' : 'unread'}" data-notif-id="${n.id}" style="cursor: pointer;" title="${n.read ? '' : 'Click to mark as read'}">
                    <div class="notification-title">${n.title}</div>
                    <div class="notification-msg">${n.message}</div>
                    <div class="notification-time">${n.time}</div>
                </div>
            `).join('');
        }

        html += `
            </div>
            <div class="topbar-dropdown-footer">
                <span style="color: var(--text-muted, #64748B); font-size: 0.72rem;">YatraSetu Prototype Notification Center</span>
            </div>
        `;

        notifPanel.innerHTML = html;

        const markAllReadBtn = notifPanel.querySelector('#btn-mark-all-read');
        if (markAllReadBtn) {
            markAllReadBtn.onclick = (e) => {
                e.stopPropagation();
                notifications.forEach(n => n.read = true);
                updateNotifBadge();
                renderNotifList();
            };
        }

        // Support clicking individual notification to mark as read
        const unreadItems = notifPanel.querySelectorAll('.notification-item.unread');
        unreadItems.forEach(item => {
            item.onclick = (e) => {
                e.stopPropagation();
                const notifId = item.getAttribute('data-notif-id');
                const target = notifications.find(n => n.id === notifId);
                if (target) {
                    target.read = true;
                    updateNotifBadge();
                    renderNotifList();
                }
            };
        });
    };

    notifBtn.onclick = (e) => {
        e.stopPropagation();
        const userMenu = document.getElementById('user-menu-dropdown-panel');
        if (userMenu) userMenu.classList.remove('show');
        renderNotifList();
        notifPanel.classList.toggle('show');
    };
}

/**
 * 3. Interactive Role Switcher Preview (Phase 5 Showcase Demo Support)
 */
function initRolePreviewSwitcher() {
    const rolePills = document.querySelectorAll('.role-switcher-pill');
    const roleBadge = document.getElementById('current-role-badge');
    const navContainer = document.getElementById('app-sidebar-nav');
    const contextEyebrow = document.getElementById('context-eyebrow');
    const breadcrumbRole = document.getElementById('breadcrumb-role');

    if (!rolePills.length || !navContainer) return;

    const roleConfigs = {
        manager: {
            title: 'MANAGER WORKSPACE',
            badge: 'MANAGER',
            eyebrow: 'DEMONSTRATION CONTEXT: MANAGER WORKSPACE',
            breadcrumb: 'Manager Nav Demonstration',
            nav: `
                <div class="nav-section-title">MANAGER WORKSPACE</div>
                <a href="#" class="app-nav-item active" data-title="Overview">
                    <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                    <span>Overview</span>
                </a>
                <a href="#" class="app-nav-item" data-title="Destinations">
                    <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                    <span>Destinations</span>
                </a>
                <a href="#" class="app-nav-item" data-title="Attractions">
                    <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 21h18"></path><path d="M5 21V7l8-4 8 4v14"></path></svg>
                    <span>Attractions</span>
                </a>
                <a href="#" class="app-nav-item" data-title="Events">
                    <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                    <span>Events</span>
                </a>
                <a href="#" class="app-nav-item" data-title="Stakeholders">
                    <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                    <span>Stakeholders</span>
                </a>
                <a href="#" class="app-nav-item" data-title="Visitor Statistics">
                    <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
                    <span>Visitor Statistics</span>
                </a>
                <a href="#" class="app-nav-item" data-title="Feedback">
                    <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                    <span>Feedback</span>
                </a>
                <a href="#" class="app-nav-item" data-title="Analytics">
                    <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
                    <span>Analytics</span>
                </a>
                <a href="#" class="app-nav-item" data-title="Reports">
                    <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
                    <span>Reports</span>
                </a>
                <a href="#" class="app-nav-item" data-title="Decision Support">
                    <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                    <span>Decision Support</span>
                </a>`
        },
        tourist: {
            title: 'TOURIST WORKSPACE',
            badge: 'TOURIST',
            eyebrow: 'DEMONSTRATION CONTEXT: TOURIST WORKSPACE',
            breadcrumb: 'Tourist Nav Demonstration',
            nav: `
                <div class="nav-section-title">TOURIST DISCOVERY</div>
                <a href="#" class="app-nav-item active" data-title="Overview">
                    <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                    <span>Overview</span>
                </a>
                <a href="#" class="app-nav-item" data-title="Explore Destinations">
                    <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon></svg>
                    <span>Explore Destinations</span>
                </a>
                <a href="#" class="app-nav-item" data-title="Attractions">
                    <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 21h18"></path><path d="M5 21V7l8-4 8 4v14"></path></svg>
                    <span>Attractions</span>
                </a>
                <a href="#" class="app-nav-item" data-title="Events">
                    <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                    <span>Events</span>
                </a>
                <a href="#" class="app-nav-item" data-title="Trip Planner">
                    <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
                    <span>Trip Planner</span>
                </a>
                <a href="#" class="app-nav-item" data-title="Crowd Indicators">
                    <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path></svg>
                    <span>Crowd Indicators</span>
                </a>
                <a href="#" class="app-nav-item" data-title="Feedback">
                    <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                    <span>Feedback & Reviews</span>
                </a>
                <a href="#" class="app-nav-item" data-title="Tourist Profile">
                    <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                    <span>Tourist Profile</span>
                </a>`
        },
        stakeholder: {
            title: 'STAKEHOLDER WORKSPACE',
            badge: 'STAKEHOLDER',
            eyebrow: 'DEMONSTRATION CONTEXT: STAKEHOLDER WORKSPACE',
            breadcrumb: 'Stakeholder Nav Demonstration',
            nav: `
                <div class="nav-section-title">STAKEHOLDER HUB</div>
                <a href="#" class="app-nav-item active" data-title="Overview">
                    <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                    <span>Overview</span>
                </a>
                <a href="#" class="app-nav-item" data-title="My Business">
                    <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                    <span>My Business</span>
                </a>
                <a href="#" class="app-nav-item" data-title="Destination Updates">
                    <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                    <span>Destination Updates</span>
                </a>
                <a href="#" class="app-nav-item" data-title="Connections & Reviews">
                    <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                    <span>Connections & Reviews</span>
                </a>`
        },
        admin: {
            title: 'ADMIN WORKSPACE',
            badge: 'ADMIN',
            eyebrow: 'DEMONSTRATION CONTEXT: ADMINISTRATOR WORKSPACE',
            breadcrumb: 'Admin Nav Demonstration',
            nav: `
                <div class="nav-section-title">ADMIN GOVERNANCE</div>
                <a href="#" class="app-nav-item active" data-title="Overview">
                    <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                    <span>Overview</span>
                </a>
                <a href="#" class="app-nav-item" data-title="Users">
                    <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>
                    <span>Users</span>
                </a>
                <a href="#" class="app-nav-item" data-title="Destinations">
                    <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                    <span>Destinations</span>
                </a>
                <a href="#" class="app-nav-item" data-title="Roles / Access">
                    <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                    <span>Roles / Access</span>
                </a>`
        }
    };

    rolePills.forEach(pill => {
        pill.addEventListener('click', () => {
            const role = pill.getAttribute('data-role');
            if (!roleConfigs[role]) return;

            rolePills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');

            if (roleBadge) roleBadge.textContent = roleConfigs[role].badge;
            if (contextEyebrow) contextEyebrow.innerHTML = `<svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg> ${roleConfigs[role].eyebrow}`;
            if (breadcrumbRole) breadcrumbRole.textContent = roleConfigs[role].breadcrumb;

            navContainer.innerHTML = roleConfigs[role].nav;
            initNavItems();
        });
    });
}

/**
 * 4. Nav Items Click Handler
 */
function initNavItems() {
    const navItems = document.querySelectorAll('.app-nav-item');
    const breadcrumbActive = document.getElementById('breadcrumb-active');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            const href = item.getAttribute('href');
            if (!href || href === '#') {
                e.preventDefault();
                navItems.forEach(i => i.classList.remove('active'));
                item.classList.add('active');

                if (breadcrumbActive) {
                    const text = item.getAttribute('data-title') || item.querySelector('span')?.textContent || item.innerText.trim();
                    breadcrumbActive.textContent = text;
                }
            }
        });
    });
}
