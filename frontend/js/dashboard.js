/* ==========================================================================
   YatraSetu — Smart Destination Management Platform
   Shared Application Dashboard Logic (Phase 5 Finalized & Corrected)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    initSidebarToggle();
    initRolePreviewSwitcher();
    initNavItems();

    if (window.YatraSetuManagerContext) {
        window.YatraSetuManagerContext.init();
    }
});

/**
 * Mobile Drawer / Sidebar Toggle
 */
function initSidebarToggle() {
    const toggleBtn = document.getElementById('sidebar-toggle-btn');
    const sidebar = document.getElementById('app-sidebar');

    if (!toggleBtn || !sidebar) return;

    toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('drawer-open');
    });

    // Close sidebar on outer click on small screens
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 840) {
            if (!sidebar.contains(e.target) && !toggleBtn.contains(e.target)) {
                sidebar.classList.remove('drawer-open');
            }
        }
    });
}

/**
 * Interactive Role Switcher Preview (Source of Truth Navigation Items)
 * Demonstrates shared shell role navigation rendering.
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
            title: 'TOURIST DISCOVERY',
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
                    <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line></svg>
                    <span>Events</span>
                </a>
                <a href="#" class="app-nav-item" data-title="Trip Planner">
                    <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                    <span>Trip Planner</span>
                </a>
                <a href="#" class="app-nav-item" data-title="My Trips">
                    <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
                    <span>My Trips</span>
                </a>
                <a href="#" class="app-nav-item" data-title="Feedback">
                    <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                    <span>Feedback</span>
                </a>
                <a href="#" class="app-nav-item" data-title="Profile">
                    <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                    <span>Profile</span>
                </a>`
        },
        stakeholder: {
            title: 'STAKEHOLDER HUB',
            badge: 'STAKEHOLDER',
            eyebrow: 'DEMONSTRATION CONTEXT: TOURISM STAKEHOLDER WORKSPACE',
            breadcrumb: 'Stakeholder Nav Demonstration',
            nav: `
                <div class="nav-section-title">STAKEHOLDER HUB</div>
                <a href="#" class="app-nav-item active" data-title="Overview">
                    <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                    <span>Overview</span>
                </a>
                <a href="#" class="app-nav-item" data-title="My Profile">
                    <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                    <span>My Profile</span>
                </a>
                <a href="#" class="app-nav-item" data-title="My Information / Services">
                    <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                    <span>My Information / Services</span>
                </a>
                <a href="#" class="app-nav-item" data-title="Shared Information">
                    <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg>
                    <span>Shared Information</span>
                </a>
                <a href="#" class="app-nav-item" data-title="Destination Updates">
                    <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                    <span>Destination Updates</span>
                </a>
                <a href="#" class="app-nav-item" data-title="Coordination">
                    <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path></svg>
                    <span>Coordination</span>
                </a>`
        },
        admin: {
            title: 'ADMIN GOVERNANCE',
            badge: 'ADMINISTRATOR',
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
 * Handle Navigation Item Active State Switching
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

                if (breadcrumbActive) breadcrumbActive.textContent = item.innerText.trim();
            }
        });
    });
}
