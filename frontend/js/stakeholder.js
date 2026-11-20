/**
 * YatraSetu — Tourism Stakeholder Hub Controller (stakeholder.js)
 * Manages active stakeholder identity, destination-scoped filtering, profile forms,
 * destination assignment catalog resolution, live preview cards, manager suggestions,
 * and tourist review responses.
 * Dependencies: manager-data.js, stakeholder-data.js
 */

/**
 * Frontend Route Protection: verify active user is logged in with stakeholder role.
 * Prevents logged-out or unauthorized users from viewing or manipulating stakeholder controls.
 */
function checkStakeholderAuth() {
    if (typeof window === 'undefined' || !window.location) return true;
    const isStakeholderPage = window.location.pathname.includes('/stakeholder/') || window.location.href.includes('/stakeholder/');
    if (!isStakeholderPage) return true;

    const token = (typeof sessionStorage !== 'undefined')
        ? (sessionStorage.getItem('yatrasetu_access_token') || (window.YatraSetuApi && window.YatraSetuApi.getAccessToken()))
        : null;
    const role = (typeof sessionStorage !== 'undefined') ? sessionStorage.getItem('yatrasetu_role') : null;
    if (!token || !role || (role !== 'stakeholder' && role !== 'admin')) {
        window.location.replace('../login.html');
        return false;
    }
    return true;
}

function hasLiveApiToken() {
    if (typeof window === 'undefined' || !window.YatraSetuApi) return false;
    if (typeof window.YatraSetuApi.hasToken === 'function') return window.YatraSetuApi.hasToken();
    if (typeof window.YatraSetuApi.isAuthenticated === 'function') return window.YatraSetuApi.isAuthenticated();
    return !!(sessionStorage.getItem('yatrasetu_access_token') || sessionStorage.getItem('yatrasetu_token'));
}

document.addEventListener('DOMContentLoaded', async () => {
    if (!checkStakeholderAuth()) return;
    await initStakeholderContext();
    initStakeholderSidebar();
    await initStakeholderOverview();
    initStakeholderProfilePage();
    await initStakeholderDestinationUpdates();
    await initStakeholderConnectionsReviews();
    await initStakeholderMediaListings();
});

/**
 * 1. Active User Identity & Destination Context Initialization
 */
async function initStakeholderContext() {
    const dataStore = window.YatraSetuStakeholderData || {};
    const profile = dataStore.profile || {};
    const managerData = window.YatraSetuManagerData || {};

    // Live Backend Profile Integration
    if (hasLiveApiToken()) {
        try {
            const apiRes = await window.YatraSetuApi.getStakeholderProfile();
            if (apiRes) {
                profile.id = apiRes.user_id;
                profile.userName = apiRes.full_name;
                profile.contactPerson = apiRes.full_name;
                profile.email = apiRes.email;
                profile.phone = apiRes.phone_number || '';
                profile.account_status = (apiRes.is_active === false) ? 'Deactivated' : 'Active';

                if (apiRes.service_id || apiRes.business_name) {
                    profile.serviceId = apiRes.service_id;
                    profile.organizationName = apiRes.business_name || '';
                    profile.destinationId = apiRes.destination_id;
                    profile.destinationName = apiRes.destination_name || apiRes.destination_id || 'Rajgad Fort';
                    profile.stateId = apiRes.state_id || 'maharashtra';
                    profile.stateName = apiRes.state_name || 'Maharashtra';
                    profile.category = apiRes.category || 'Tour & Trekking Guides';
                    const isVerified = (apiRes.verification_status === 'verified');
                    profile.registration_status = isVerified ? 'Approved' : (apiRes.verification_status === 'rejected' ? 'Rejected' : 'Pending Approval');
                    profile.status = profile.registration_status;
                    profile.isBusinessApproved = isVerified;

                    const cInfo = apiRes.contact_info || {};
                    profile.phone = apiRes.phone || cInfo.phone || apiRes.phone_number || '';
                    profile.address = apiRes.address || cInfo.address || '';
                    profile.hours = apiRes.operating_hours || cInfo.operating_hours || '';
                    profile.priceRange = apiRes.price_range || cInfo.price_range || '';
                    profile.description = cInfo.description || '';
                    if (apiRes.destination_id) {
                        sessionStorage.setItem('yatrasetu_destination_id', apiRes.destination_id);
                    }
                } else {
                    profile.serviceId = null;
                    profile.organizationName = '';
                    profile.destinationId = null;
                    profile.destinationName = 'No Destination Assigned';
                    profile.registration_status = 'Unregistered';
                    profile.status = 'Unregistered';
                    profile.isBusinessApproved = false;
                }

                sessionStorage.setItem('yatrasetu_name', profile.userName);
                if (profile.organizationName) {
                    sessionStorage.setItem('yatrasetu_org', profile.organizationName);
                    sessionStorage.setItem('yatrasetu_organization', profile.organizationName);
                }
            }
        } catch (err) {
            console.error('[stakeholder.js] Profile fetch error:', err);
            if (err && err.status === 401) {
                if (window.YatraSetuApi) window.YatraSetuApi.clearSession();
                window.location.replace('../login.html');
                return;
            }
        }
    } else {
        // Session Overrides from auth.js if available in prototype mode
        const sessionEmail = sessionStorage.getItem('yatrasetu_email');
        const sessionName = sessionStorage.getItem('yatrasetu_name');
        const sessionOrg = sessionStorage.getItem('yatrasetu_org') || sessionStorage.getItem('yatrasetu_organization');
        let sessionDestId = sessionStorage.getItem('yatrasetu_destination_id');

        if (sessionName) {
            profile.userName = sessionName;
            profile.contactPerson = sessionName;
        }
        if (sessionEmail) {
            profile.email = sessionEmail;
        }
        if (sessionOrg) {
            profile.organizationName = sessionOrg;
        }

        // Cross-sync with central Admin users and Manager stakeholders repositories
        try {
            const rawUsers = localStorage.getItem('yatrasetu_admin_users') || sessionStorage.getItem('yatrasetu_admin_users');
            if (rawUsers) {
                const adminUsers = JSON.parse(rawUsers);
                const lookupEmail = sessionEmail || profile.email;
                const matchedUser = adminUsers.find(u => (u.id && u.id === profile.id) || (u.email && u.email.toLowerCase() === (lookupEmail || '').toLowerCase()));
                if (matchedUser) {
                    profile.id = matchedUser.id;
                    profile.userName = matchedUser.name;
                    profile.contactPerson = matchedUser.name;
                    profile.email = matchedUser.email;
                    if (matchedUser.organization) profile.organizationName = matchedUser.organization;
                    if (matchedUser.category) profile.category = matchedUser.category;
                    profile.account_status = matchedUser.account_status || 'Active';
                    profile.registration_status = matchedUser.registration_status || 'Pending Approval';
                    profile.status = matchedUser.registration_status || 'Pending Approval';
                    profile.isBusinessApproved = (profile.registration_status === 'Approved');

                    if (matchedUser.destination_id && matchedUser.destination_id !== 'all' && (!sessionDestId || sessionDestId === '')) {
                        sessionDestId = matchedUser.destination_id;
                        sessionStorage.setItem('yatrasetu_destination_id', matchedUser.destination_id);
                    }
                }
            }
        } catch (e) {
            console.warn('[stakeholder.js] Cross-sync error:', e);
        }
    }

    // Display Account Deactivation Alert if account was deactivated by Platform Administrator
    const existingDeactBanner = document.getElementById('sh-deactivated-banner');
    if (profile.account_status === 'Deactivated') {
        if (!existingDeactBanner) {
            const banner = document.createElement('div');
            banner.id = 'sh-deactivated-banner';
            banner.style.cssText = 'background: #FEE2E2; border: 1px solid #FECACA; color: #991B1B; padding: 0.85rem 1.25rem; border-radius: 8px; margin: 1rem 1.75rem 0 1.75rem; font-size: 0.85rem; display: flex; align-items: center; gap: 0.75rem;';
            banner.innerHTML = `
                <span style="font-size: 1.35rem;">🚫</span>
                <div>
                    <strong>Account Deactivated by Platform Administrator:</strong>
                    <span> Login permissions and business services are suspended. Ordinary profile changes cannot be published until an Administrator reactivates this account.</span>
                </div>
            `;
            const mainContent = document.querySelector('.dashboard-content') || document.querySelector('main');
            if (mainContent && mainContent.parentNode) {
                mainContent.parentNode.insertBefore(banner, mainContent);
            }
        }
    } else if (existingDeactBanner) {
        existingDeactBanner.remove();
    }

    // Destination Resolution
    let targetDestId = profile.destinationId || sessionStorage.getItem('yatrasetu_destination_id');

    if (targetDestId && targetDestId !== 'unassigned' && targetDestId !== '') {
        const foundDest = (managerData.destinations || []).find(d => d.id === targetDestId || (targetDestId === 'rajgad-fort' && d.id === 'raigad-fort') || (targetDestId === 'raigad-fort' && d.id === 'rajgad-fort'));
        if (foundDest) {
            profile.destinationId = foundDest.id;
            profile.destinationName = foundDest.name;
            profile.destinationImg = foundDest.img;
            const foundState = (managerData.states || []).find(s => s.id === foundDest.state_id);
            profile.stateName = foundState ? foundState.name : foundDest.state_id;
        } else {
            profile.destinationId = targetDestId;
            profile.destinationName = profile.destinationName || targetDestId;
            profile.stateName = profile.stateId || 'Maharashtra';
            profile.destinationImg = 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=600&auto=format&fit=crop&q=80';
        }
    } else {
        // Missing or unassigned
        profile.destinationId = null;
        profile.destinationName = 'No Destination Assigned';
        profile.stateName = 'Unassigned Destination';
        profile.destinationImg = '';
    }

    // Sync Topbar User Badge
    const topbarUserAvatar = document.getElementById('topbar-user-avatar');
    const topbarUserName = document.getElementById('topbar-user-name');
    const topbarUserRole = document.getElementById('topbar-user-role');
    const topbarOrgName = document.getElementById('topbar-org-name');

    if (topbarUserAvatar) {
        const initials = (profile.userName || 'SH').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        topbarUserAvatar.textContent = initials;
    }
    if (topbarUserName) {
        topbarUserName.textContent = profile.userName || 'Profile not configured';
    }
    const sessionRole = (typeof sessionStorage !== 'undefined') ? sessionStorage.getItem('yatrasetu_role') : (profile.role || 'stakeholder');
    if (topbarUserRole) {
        if (sessionRole === 'stakeholder') {
            topbarUserRole.textContent = 'Tourism Stakeholder';
        } else if (sessionRole) {
            topbarUserRole.textContent = sessionRole.charAt(0).toUpperCase() + sessionRole.slice(1);
        } else {
            topbarUserRole.textContent = 'Tourism Stakeholder';
        }
    }
    if (topbarOrgName) {
        topbarOrgName.textContent = profile.organizationName || 'Profile not configured';
    }

    // Sync Sidebar Destination Context Box
    const destName = document.getElementById('sidebar-dest-name');
    const destState = document.getElementById('sidebar-dest-state');
    const destImg = document.getElementById('sidebar-dest-img');

    if (destName) destName.textContent = profile.destinationName;
    if (destState) destState.textContent = profile.stateName;
    if (destImg) {
        if (profile.destinationImg) {
            destImg.src = profile.destinationImg;
            destImg.style.display = 'block';
        } else {
            destImg.style.display = 'none';
        }
    }

    // Sync Overview Hero Banner if present
    const heroBanner = document.getElementById('sh-hero-banner');
    const heroGreeting = document.getElementById('sh-hero-greeting');
    const heroOrg = document.getElementById('sh-hero-org');
    const heroLocation = document.getElementById('sh-hero-location');

    if (heroGreeting) {
        const firstName = (profile.userName || 'Partner').split(' ')[0];
        heroGreeting.textContent = `Welcome back, ${firstName}!`;
    }
    if (heroOrg) {
        heroOrg.textContent = profile.organizationName || 'Ecosystem Tourism Partner';
    }
    if (heroLocation) {
        heroLocation.textContent = profile.destinationId
            ? `📍 ${profile.destinationName}, ${profile.stateName}`
            : '📍 No Destination Assigned';
    }
    if (heroBanner) {
        if (profile.destinationImg) {
            heroBanner.style.backgroundImage = `linear-gradient(rgba(10, 17, 40, 0.78), rgba(15, 23, 42, 0.88)), url('${profile.destinationImg}')`;
        } else {
            heroBanner.style.backgroundImage = 'linear-gradient(135deg, #0F172A, #1E293B)';
        }
    }

    // Restore persisted stakeholder listings, media and posts (BUG-05)
    try {
        const rawListings = localStorage.getItem('yatrasetu_stakeholder_listings') || sessionStorage.getItem('yatrasetu_stakeholder_listings');
        if (rawListings) {
            const parsed = JSON.parse(rawListings);
            if (Array.isArray(parsed)) {
                const map = new Map((dataStore.listings || []).map(l => [l.id, l]));
                parsed.forEach(item => map.set(item.id, item));
                dataStore.listings = Array.from(map.values());
            }
        }
    } catch (e) {
        console.warn('[stakeholder.js] Error restoring listings:', e);
    }

    try {
        const rawMedia = localStorage.getItem('yatrasetu_stakeholder_media') || sessionStorage.getItem('yatrasetu_stakeholder_media');
        if (rawMedia) {
            const parsed = JSON.parse(rawMedia);
            if (Array.isArray(parsed)) {
                const map = new Map((dataStore.media || []).map(m => [m.id, m]));
                parsed.forEach(item => map.set(item.id, item));
                dataStore.media = Array.from(map.values());
            }
        }
    } catch (e) {
        console.warn('[stakeholder.js] Error restoring media:', e);
    }

    try {
        const rawPosts = localStorage.getItem('yatrasetu_stakeholder_posts') || sessionStorage.getItem('yatrasetu_stakeholder_posts');
        if (rawPosts) {
            const parsed = JSON.parse(rawPosts);
            if (Array.isArray(parsed)) {
                const map = new Map((dataStore.posts || []).map(p => [p.id, p]));
                parsed.forEach(item => map.set(item.id, item));
                dataStore.posts = Array.from(map.values());
            }
        }
    } catch (e) {
        console.warn('[stakeholder.js] Error restoring posts:', e);
    }
}

/**
 * Persistence Helper Functions (BUG-05)
 */
function saveStakeholderListings(listings) {
    const dataStore = window.YatraSetuStakeholderData || {};
    dataStore.listings = listings;
    try {
        localStorage.setItem('yatrasetu_stakeholder_listings', JSON.stringify(listings));
        sessionStorage.setItem('yatrasetu_stakeholder_listings', JSON.stringify(listings));
    } catch (e) { }

    // Sync to manager stakeholders repository if applicable
    try {
        const rawMgr = localStorage.getItem('yatrasetu_manager_stakeholders') || sessionStorage.getItem('yatrasetu_manager_stakeholders');
        if (rawMgr) {
            const mgrList = JSON.parse(rawMgr);
            listings.forEach(l => {
                const match = mgrList.find(s => s.id === l.id);
                if (match) {
                    match.name = l.name;
                    match.category = l.category;
                    match.type = l.type;
                    match.status = l.status;
                }
            });
            localStorage.setItem('yatrasetu_manager_stakeholders', JSON.stringify(mgrList));
            sessionStorage.setItem('yatrasetu_manager_stakeholders', JSON.stringify(mgrList));
        }
    } catch (e) { }
}

function saveStakeholderMedia(mediaList) {
    const dataStore = window.YatraSetuStakeholderData || {};
    dataStore.media = mediaList;
    try {
        localStorage.setItem('yatrasetu_stakeholder_media', JSON.stringify(mediaList));
        sessionStorage.setItem('yatrasetu_stakeholder_media', JSON.stringify(mediaList));
    } catch (e) { }
}

function saveStakeholderPosts(postsList) {
    const dataStore = window.YatraSetuStakeholderData || {};
    dataStore.posts = postsList;
    try {
        localStorage.setItem('yatrasetu_stakeholder_posts', JSON.stringify(postsList));
        sessionStorage.setItem('yatrasetu_stakeholder_posts', JSON.stringify(postsList));
    } catch (e) { }
}

/**
 * 2. Sidebar Navigation Sync
 */
function initStakeholderSidebar() {
    const currentPath = window.location.pathname;
    const navItems = document.querySelectorAll('.app-sidebar-nav .app-nav-item');

    navItems.forEach(item => {
        const href = item.getAttribute('href');
        if (href && href !== '#' && currentPath.includes(href)) {
            navItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');

            const breadcrumbActive = document.getElementById('breadcrumb-active');
            if (breadcrumbActive) {
                const title = item.getAttribute('data-title') || item.querySelector('span')?.textContent;
                breadcrumbActive.textContent = title;
            }
        }
    });
}

/**
 * 3. Overview Page Controller (dashboard.html)
 */
async function initStakeholderOverview() {
    const noticeFeed = document.getElementById('overview-announcements-feed');
    const eventsFeed = document.getElementById('overview-events-feed');
    if (!noticeFeed && !eventsFeed) return;

    const dataStore = window.YatraSetuStakeholderData || {};
    const managerCatalog = window.YatraSetuManagerData || {};
    const profile = dataStore.profile || {};
    const destId = profile.destinationId;

    // Check if Destination is assigned
    if (!destId) {
        const valAnc = document.getElementById('metric-announcements-count');
        const valEvt = document.getElementById('metric-events-count');
        const valSug = document.getElementById('metric-suggestions-count');

        if (valAnc) valAnc.textContent = '0 Announcements';
        if (valEvt) valEvt.textContent = '0 Upcoming Events';
        if (valSug) valSug.textContent = '0 Pending Suggestions';

        const unassignedEmptyState = `
            <div style="padding: 2rem 1rem; text-align: center; color: var(--sh-text-muted);">
                <div style="font-size: 1.5rem; margin-bottom: 0.35rem;">📍</div>
                <strong style="color: var(--sh-text-primary); font-size: 0.95rem; display: block; margin-bottom: 0.25rem;">No Destination Assigned</strong>
                <p style="font-size: 0.82rem; margin: 0 0 0.85rem 0;">Assign your operating destination in profile to view localized announcements and events.</p>
                <a href="profile.html" class="btn-sh-orange" style="display: inline-block; font-size: 0.8rem; padding: 0.45rem 0.9rem; text-decoration: none;">Configure Destination &rarr;</a>
            </div>
        `;

        if (noticeFeed) noticeFeed.innerHTML = unassignedEmptyState;
        if (eventsFeed) eventsFeed.innerHTML = unassignedEmptyState;
        return;
    }

    let announcements = [];
    let events = [];
    let suggestions = [];

    if (hasLiveApiToken()) {
        try {
            const updates = await window.YatraSetuApi.getStakeholderDestinationUpdates();
            const advisoriesList = Array.isArray(updates) ? updates : (updates?.advisories || []);
            announcements = advisoriesList.map(adv => ({
                id: adv.id,
                title: adv.title,
                content: adv.description || adv.message,
                category: adv.severity ? (adv.severity.charAt(0).toUpperCase() + adv.severity.slice(1)) : 'Advisory',
                date: adv.created_at ? new Date(adv.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Official Notice',
                icon: adv.severity === 'critical' ? '🚨' : (adv.severity === 'warning' ? '⚠️' : '📣')
            }));

            // Events from catalog scoped to destination
            events = (managerCatalog.events || []).filter(e => e.destination_id === destId);

            const rawSug = await window.YatraSetuApi.getStakeholderSuggestions();
            if (Array.isArray(rawSug)) {
                suggestions = rawSug.filter(s => s.status === 'pending');
            }
        } catch (err) {
            console.error('[stakeholder.js] Error loading overview data:', err);
        }
    } else {
        // Prototype fallback
        announcements = (dataStore.announcements || []).filter(a => a.destination_id === destId);
        events = (managerCatalog.events || []).filter(e => e.destination_id === destId);
        suggestions = (dataStore.suggestions || []).filter(s => s.destination_id === destId && s.status === 'Pending');
    }

    // Update Summary Metric Cards
    const valAnc = document.getElementById('metric-announcements-count');
    const valEvt = document.getElementById('metric-events-count');
    const valSug = document.getElementById('metric-suggestions-count');

    if (valAnc) valAnc.textContent = `${announcements.length} Active Announcement${announcements.length === 1 ? '' : 's'}`;
    if (valEvt) valEvt.textContent = `${events.length} Upcoming Event${events.length === 1 ? '' : 's'}`;
    if (valSug) valSug.textContent = `${suggestions.length} Pending Suggestion${suggestions.length === 1 ? '' : 's'}`;

    // Render Latest Announcements Feed
    if (noticeFeed) {
        if (announcements.length === 0) {
            noticeFeed.innerHTML = `
                <div style="padding: 1.75rem 1rem; text-align: center; color: var(--sh-text-muted);">
                    <div style="font-size: 1.3rem; margin-bottom: 0.25rem;">📣</div>
                    <div style="font-size: 0.88rem; font-weight: 600; color: var(--sh-text-primary);">No active announcements</div>
                    <p style="font-size: 0.8rem; margin: 0.25rem 0 0 0;">Destination Manager has not issued notices for ${profile.destinationName} yet.</p>
                </div>`;
        } else {
            noticeFeed.innerHTML = announcements.slice(0, 3).map(a => `
                <div style="background: var(--sh-card-bg); border: 1px solid var(--sh-card-border); border-radius: 12px; padding: 1rem; margin-bottom: 0.85rem; display: flex; gap: 0.85rem; align-items: flex-start;">
                    <div style="font-size: 1.3rem;">${a.icon || '📣'}</div>
                    <div style="flex: 1;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem;">
                            <h4 style="font-size: 0.95rem; font-weight: 700; color: var(--sh-text-primary); margin: 0;">${a.title}</h4>
                            <span style="font-size: 0.75rem; color: var(--sh-text-muted);">${a.date}</span>
                        </div>
                        <p style="font-size: 0.83rem; color: var(--sh-text-secondary); margin: 0; line-height: 1.4;">${a.content}</p>
                    </div>
                </div>
            `).join('');
        }
    }

    // Render Upcoming Events Feed
    if (eventsFeed) {
        if (events.length === 0) {
            eventsFeed.innerHTML = `
                <div style="padding: 1.75rem 1rem; text-align: center; color: var(--sh-text-muted);">
                    <div style="font-size: 1.3rem; margin-bottom: 0.25rem;">📅</div>
                    <div style="font-size: 0.88rem; font-weight: 600; color: var(--sh-text-primary);">No scheduled events</div>
                    <p style="font-size: 0.8rem; margin: 0.25rem 0 0 0;">No official tourism events currently cataloged for ${profile.destinationName}.</p>
                </div>`;
        } else {
            eventsFeed.innerHTML = events.slice(0, 2).map(e => `
                <div style="background: var(--sh-card-bg); border: 1px solid var(--sh-card-border); border-radius: 12px; overflow: hidden; margin-bottom: 0.85rem; display: flex; gap: 0.85rem;">
                    <img src="${e.img}" alt="${e.title}" style="width: 110px; height: 90px; object-fit: cover;">
                    <div style="padding: 0.65rem 0.65rem 0.65rem 0; flex: 1; display: flex; flex-direction: column; justify-content: space-between;">
                        <div>
                            <h4 style="font-size: 0.9rem; font-weight: 700; color: var(--sh-text-primary); margin: 0 0 0.2rem 0;">${e.title}</h4>
                            <span style="font-size: 0.76rem; color: var(--sh-text-muted);">📅 ${e.dateNum} ${e.dateMonth} 2026 • 📍 ${e.location}</span>
                        </div>
                        <div>
                            <a href="destination-updates.html" style="font-size: 0.78rem; font-weight: 700; color: var(--sh-orange-accent); text-decoration: none;">View Details &rarr;</a>
                        </div>
                    </div>
                </div>
            `).join('');
        }
    }
}

/**
 * 4. Profile Page Controller (profile.html)
 */
function initStakeholderProfilePage() {
    const isProfilePage = window.location.pathname.includes('profile.html');
    if (!isProfilePage) return;

    const dataStore = window.YatraSetuStakeholderData || {};
    const managerData = window.YatraSetuManagerData || {};
    const profile = dataStore.profile || {};

    const selectDest = document.getElementById('sh-destination-select');
    const radioVisitor = document.getElementById('type-visitor-facing');
    const radioContributor = document.getElementById('type-info-contributor');
    const cardVisitor = document.getElementById('card-type-visitor');
    const cardContributor = document.getElementById('card-type-contributor');
    const serviceDetailsBox = document.getElementById('service-details-box');

    const inputOrgName = document.getElementById('sh-org-name');
    const selectCat = document.getElementById('sh-category');
    const inputContactPerson = document.getElementById('sh-contact-person');
    const inputPhone = document.getElementById('sh-phone');
    const inputEmail = document.getElementById('sh-email');
    const inputHours = document.getElementById('sh-hours');
    const inputPrice = document.getElementById('sh-price');
    const inputAddress = document.getElementById('sh-address');
    const inputDesc = document.getElementById('sh-desc');

    // Populate Destination Dropdown with All 40 Destinations from Catalog
    if (selectDest) {
        selectDest.innerHTML = '<option value="">-- No Destination Assigned (Unassigned) --</option>';

        // Group destinations by State
        const states = managerData.states || [];
        const destinations = managerData.destinations || [];

        states.forEach(st => {
            const stateDests = destinations.filter(d => d.state_id === st.id);
            if (stateDests.length > 0) {
                const optGroup = document.createElement('optgroup');
                optGroup.label = st.name;
                stateDests.forEach(d => {
                    const opt = document.createElement('option');
                    opt.value = d.id;
                    opt.textContent = `${d.name} (${d.category || 'General'})`;
                    optGroup.appendChild(opt);
                });
                selectDest.appendChild(optGroup);
            }
        });

        // Set current assigned destination value
        selectDest.value = profile.destinationId || '';

        // Rule 3: Once approved or registered, the stakeholder cannot change the registered destination through ordinary editing.
        const isRegistered = Boolean(profile.serviceId || profile.destinationId);
        const isApproved = profile.status === 'Approved' || profile.registration_status === 'Approved' || profile.isBusinessApproved === true;
        const isPending = profile.status === 'Pending Approval' || profile.registration_status === 'Pending Approval';
        const destLockNotice = document.getElementById('sh-dest-lock-notice');
        const destPendingNotice = document.getElementById('sh-dest-pending-notice');
        const destLockNameDisplay = document.getElementById('locked-dest-name-display');

        if (isRegistered) {
            selectDest.disabled = true;
            selectDest.style.backgroundColor = '#F1F5F9';
            selectDest.style.cursor = 'not-allowed';
            selectDest.title = 'Destination locked: Once registered, reassignment requires an authorized administrative process.';
            if (destLockNotice) destLockNotice.style.display = 'block';
            if (destPendingNotice) destPendingNotice.style.display = 'none';
            if (destLockNameDisplay) destLockNameDisplay.textContent = profile.destinationName || 'Rajgad Fort';
        } else {
            selectDest.disabled = false;
            if (destLockNotice) destLockNotice.style.display = 'none';
            if (destPendingNotice) destPendingNotice.style.display = isPending ? 'block' : 'none';
        }

        // Account deactivation state enforcement: disable form controls if admin deactivated
        if (profile.account_status === 'Deactivated') {
            if (selectDest) selectDest.disabled = true;
            const saveBtnEl = document.getElementById('btn-save-profile');
            if (saveBtnEl) {
                saveBtnEl.disabled = true;
                saveBtnEl.style.opacity = '0.5';
                saveBtnEl.style.cursor = 'not-allowed';
                saveBtnEl.textContent = 'Account Suspended (Admin Action)';
            }
        }
    }

    // Bind Initial Form Values
    if (inputOrgName) inputOrgName.value = profile.organizationName || '';
    if (selectCat) selectCat.value = profile.category || 'Tour & Trekking Guides';
    if (inputContactPerson) inputContactPerson.value = profile.contactPerson || profile.userName || '';
    if (inputPhone) inputPhone.value = profile.phone || '';
    if (inputEmail) inputEmail.value = profile.email || '';
    if (inputHours) inputHours.value = profile.hours || '';
    if (inputPrice) inputPrice.value = profile.priceRange || '';
    if (inputAddress) inputAddress.value = profile.address || '';
    if (inputDesc) inputDesc.value = profile.description || '';

    if (profile.type === 'info-contributor' && radioContributor) {
        radioContributor.checked = true;
    } else if (radioVisitor) {
        radioVisitor.checked = true;
    }

    // Toggle Type & Radio Card Highlights
    const updateProfileTypeUI = () => {
        const isVisitor = radioVisitor ? radioVisitor.checked : true;

        if (cardVisitor) cardVisitor.classList.toggle('active', isVisitor);
        if (cardContributor) cardContributor.classList.toggle('active', !isVisitor);
        if (serviceDetailsBox) serviceDetailsBox.style.display = isVisitor ? 'block' : 'none';

        renderLivePreview(isVisitor);
    };

    if (radioVisitor) radioVisitor.addEventListener('change', updateProfileTypeUI);
    if (radioContributor) radioContributor.addEventListener('change', updateProfileTypeUI);

    // Live Card Preview
    function renderLivePreview(isVisitor) {
        const previewContainer = document.getElementById('public-profile-preview');
        if (!previewContainer) return;

        const orgName = (inputOrgName ? inputOrgName.value.trim() : '') || profile.organizationName || 'Business Name';
        const cat = (selectCat ? selectCat.value : '') || profile.category || 'Service';
        const phone = (inputPhone ? inputPhone.value.trim() : '') || profile.phone || 'Phone Number';
        const email = (inputEmail ? inputEmail.value.trim() : '') || profile.email || 'Email';
        const hours = (inputHours ? inputHours.value.trim() : '') || profile.hours || 'Standard Hours';
        const price = (inputPrice ? inputPrice.value.trim() : '') || profile.priceRange || 'On Request';
        const desc = (inputDesc ? inputDesc.value.trim() : '') || profile.description || 'Description of services.';

        // Look up currently selected destination in preview
        const currentSelectedDestId = selectDest ? selectDest.value : profile.destinationId;
        const currentDest = (managerData.destinations || []).find(d => d.id === currentSelectedDestId);

        const previewDestName = currentDest ? currentDest.name : 'No Destination Assigned';
        const previewState = currentDest ? ((managerData.states || []).find(s => s.id === currentDest.state_id)?.name || '') : 'Unassigned';
        const previewImg = currentDest ? currentDest.img : '';

        previewContainer.innerHTML = `
            <div style="background: var(--sh-card-bg); border: 1px solid var(--sh-card-border); border-radius: 14px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.04);">
                ${previewImg ? `
                    <img src="${previewImg}" alt="${previewDestName}" style="width: 100%; height: 140px; object-fit: cover;">
                ` : `
                    <div style="width: 100%; height: 100px; background: #0F172A; display: flex; align-items: center; justify-content: center; color: #94A3B8; font-size: 0.85rem;">
                        📍 No Destination Assigned
                    </div>
                `}
                <div style="padding: 1.25rem;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.35rem;">
                        <h3 style="font-size: 1.1rem; font-weight: 800; color: var(--sh-text-primary); margin: 0;">${orgName}</h3>
                        <span style="font-size: 0.72rem; background: var(--sh-orange-light); border: 1px solid var(--sh-orange-border); color: var(--sh-orange-accent); padding: 0.15rem 0.5rem; border-radius: 10px; font-weight: 700;">Prototype Profile</span>
                    </div>

                    <div style="display: flex; gap: 0.5rem; align-items: center; margin-bottom: 0.75rem; flex-wrap: wrap;">
                        <span style="font-size: 0.75rem; font-weight: 700; color: var(--sh-orange-accent); background: var(--sh-orange-light); padding: 0.2rem 0.55rem; border-radius: 6px;">${cat}</span>
                        <span style="font-size: 0.78rem; color: var(--sh-text-muted);">📍 ${previewDestName}${previewState ? `, ${previewState}` : ''}</span>
                    </div>

                    <p style="font-size: 0.83rem; color: var(--sh-text-secondary); line-height: 1.5; margin-bottom: 1rem;">"${desc}"</p>

                    <div style="border-top: 1px solid var(--sh-card-border); padding-top: 0.85rem; font-size: 0.8rem; color: var(--sh-text-secondary); display: flex; flex-direction: column; gap: 0.45rem;">
                        <div>📞 <strong>Phone:</strong> ${phone}</div>
                        <div>✉️ <strong>Email:</strong> ${email}</div>
                        ${isVisitor ? `
                            <div>🕒 <strong>Hours:</strong> ${hours}</div>
                            <div>💰 <strong>Tariff:</strong> ₹${price}</div>
                        ` : `
                            <div style="color: var(--sh-orange-accent); font-weight: 700;">ℹ️ Information Partner Listing</div>
                        `}
                    </div>
                </div>
            </div>
        `;
    }

    [inputOrgName, selectCat, selectDest, inputPhone, inputEmail, inputHours, inputPrice, inputDesc].forEach(el => {
        if (el) el.addEventListener('input', () => renderLivePreview(radioVisitor ? radioVisitor.checked : true));
        if (el) el.addEventListener('change', () => renderLivePreview(radioVisitor ? radioVisitor.checked : true));
    });

    updateProfileTypeUI();

    // Save Form Handler
    const saveBtn = document.getElementById('btn-save-profile');
    const profileForm = document.getElementById('profile-form');

    const handleProfileSave = async (e) => {
        if (e) e.preventDefault();

        if (profile.account_status === 'Deactivated') {
            alert('ACCOUNT SUSPENDED: Your stakeholder account has been deactivated by the Platform Administrator. Profile changes cannot be submitted.');
            return;
        }

        const nameVal = inputOrgName ? inputOrgName.value.trim() : '';
        const emailVal = inputEmail ? inputEmail.value.trim() : '';

        if (!nameVal) {
            alert('Please enter your business / organization name.');
            if (inputOrgName) inputOrgName.focus();
            return;
        }

        if (!emailVal) {
            alert('Please enter your contact email.');
            if (inputEmail) inputEmail.focus();
            return;
        }

        const chosenDestId = selectDest ? selectDest.value : '';

        // Update In-Memory Profile
        profile.organizationName = nameVal;
        profile.type = radioContributor && radioContributor.checked ? 'info-contributor' : 'visitor-facing';
        profile.category = selectCat ? selectCat.value : 'Tour & Trekking Guides';
        profile.contactPerson = inputContactPerson ? inputContactPerson.value.trim() : profile.userName;
        profile.userName = profile.contactPerson;
        profile.phone = inputPhone ? inputPhone.value.trim() : '';
        profile.email = emailVal;
        profile.hours = inputHours ? inputHours.value.trim() : '';
        profile.priceRange = inputPrice ? inputPrice.value.trim() : '';
        profile.address = inputAddress ? inputAddress.value.trim() : '';
        profile.description = inputDesc ? inputDesc.value.trim() : '';

        // Live Backend Profile Integration
        if (hasLiveApiToken()) {
            try {
                const contactInfo = {
                    phone: profile.phone,
                    address: profile.address,
                    operating_hours: profile.hours,
                    price_range: profile.priceRange,
                    description: profile.description
                };

                if (!profile.serviceId) {
                    if (!chosenDestId) {
                        alert('Please select an operating destination for your business.');
                        if (selectDest) selectDest.focus();
                        return;
                    }
                    const destObj = (managerData.destinations || []).find(d => d.id === chosenDestId);
                    const stateId = destObj ? destObj.state_id : 'maharashtra';

                    await window.YatraSetuApi.registerStakeholderService({
                        business_name: nameVal,
                        destination_id: chosenDestId,
                        state_id: stateId,
                        category: profile.category,
                        contact_info: contactInfo
                    });
                    alert('Business registration submitted for review! Your destination selection is now pending approval by the Destination Manager.');
                } else {
                    await window.YatraSetuApi.updateStakeholderProfile({
                        full_name: profile.contactPerson,
                        phone_number: profile.phone,
                        business_name: nameVal,
                        category: profile.category,
                        contact_info: contactInfo
                    });
                    alert('Profile updated successfully!');
                }

                await initStakeholderContext();
                renderLivePreview(radioVisitor ? radioVisitor.checked : true);
                return;
            } catch (err) {
                console.error('[stakeholder.js] Profile save error:', err);
                alert(err.message || 'Failed to save profile changes.');
                return;
            }
        }

        const isApproved = profile.status === 'Approved' || profile.registration_status === 'Approved' || profile.isBusinessApproved === true;
        let isInitialSubmission = false;

        // Save Destination Context to Session
        if (chosenDestId) {
            if (isApproved && chosenDestId !== profile.destinationId) {
                alert('SECURITY / INTEGRITY ENFORCEMENT: Operating destination is locked after official business approval. Stakeholders cannot alter approved destinations through ordinary editing. Reassignment requires an authorized process with an audit trail.');
                if (selectDest) selectDest.value = profile.destinationId || '';
                return;
            }
            if (!isApproved) {
                if (profile.destinationId !== chosenDestId) isInitialSubmission = true;
                profile.status = 'Pending Approval';
                profile.registration_status = 'Pending Approval';
            }
            sessionStorage.setItem('yatrasetu_destination_id', chosenDestId);
            profile.destinationId = chosenDestId;
        } else {
            if (isApproved) {
                alert('SECURITY / INTEGRITY ENFORCEMENT: Operating destination cannot be unassigned after official business approval.');
                if (selectDest) selectDest.value = profile.destinationId || '';
                return;
            }
            sessionStorage.setItem('yatrasetu_destination_id', 'unassigned');
            profile.destinationId = null;
        }

        // Save User & Org to Session
        sessionStorage.setItem('yatrasetu_name', profile.contactPerson);
        sessionStorage.setItem('yatrasetu_org', profile.organizationName);
        sessionStorage.setItem('yatrasetu_organization', profile.organizationName);

        // Cross-sync: update/insert in window.YatraSetuManagerData.stakeholders
        const managerData = window.YatraSetuManagerData || {};
        if (managerData.stakeholders) {
            const destObj = (managerData.destinations || []).find(d => d.id === profile.destinationId);
            const stateId = destObj ? destObj.state_id : 'maharashtra';
            const destName = destObj ? destObj.name : 'Unassigned';
            profile.destinationName = destName;
            const existingSh = managerData.stakeholders.find(s => s.id === profile.id || (s.email && s.email.toLowerCase() === profile.email.toLowerCase()));

            if (existingSh) {
                existingSh.name = profile.organizationName;
                existingSh.contact_person = profile.contactPerson;
                existingSh.contact = profile.phone;
                existingSh.category = profile.category;
                existingSh.type = profile.type;
                existingSh.hours = profile.hours;
                existingSh.price_range = profile.priceRange;
                existingSh.address = profile.address;
                existingSh.description = profile.description;
                if (!isApproved) {
                    existingSh.destination_id = profile.destinationId;
                    existingSh.destination = destName;
                    existingSh.state_id = stateId;
                }
            } else {
                managerData.stakeholders.push({
                    id: profile.id || `sh-${Date.now().toString(36)}`,
                    state_id: stateId,
                    destination_id: profile.destinationId,
                    destination: destName,
                    name: profile.organizationName,
                    category: profile.category,
                    type: profile.type,
                    contact: profile.phone,
                    email: profile.email,
                    contact_person: profile.contactPerson,
                    address: profile.address,
                    hours: profile.hours,
                    price_range: profile.priceRange,
                    description: profile.description,
                    status: profile.status || 'Pending Approval',
                    account_status: profile.account_status || 'Active',
                    registered_date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
                    reviewed_by: '',
                    reviewed_date: '',
                    manager_note: 'New registration submitted by stakeholder.'
                });
            }

            if (window.YatraSetuManagerStore && typeof window.YatraSetuManagerStore.saveStakeholders === 'function') {
                window.YatraSetuManagerStore.saveStakeholders(managerData.stakeholders);
            } else {
                try {
                    localStorage.setItem('yatrasetu_manager_stakeholders', JSON.stringify(managerData.stakeholders));
                    sessionStorage.setItem('yatrasetu_manager_stakeholders', JSON.stringify(managerData.stakeholders));
                } catch (e) { }
            }
        }

        // Cross-sync: update in AdminStore (yatrasetu_admin_users)
        try {
            const rawUsers = localStorage.getItem('yatrasetu_admin_users') || sessionStorage.getItem('yatrasetu_admin_users');
            if (rawUsers) {
                const adminUsers = JSON.parse(rawUsers);
                const matchedUser = adminUsers.find(u => u.id === profile.id || (u.email && u.email.toLowerCase() === profile.email.toLowerCase()));
                if (matchedUser) {
                    matchedUser.organization = profile.organizationName;
                    matchedUser.name = profile.contactPerson;
                    matchedUser.category = profile.category;
                    if (!isApproved && profile.destinationId) {
                        matchedUser.destination_id = profile.destinationId;
                        matchedUser.destination_name = profile.destinationName;
                    }
                    localStorage.setItem('yatrasetu_admin_users', JSON.stringify(adminUsers));
                    sessionStorage.setItem('yatrasetu_admin_users', JSON.stringify(adminUsers));
                }
            }
        } catch (e) { }

        // Log audit event if new destination was registered by pending stakeholder
        if (isInitialSubmission && profile.destinationId) {
            try {
                const auditKey = 'yatrasetu_audit_trail';
                const rawAudit = localStorage.getItem(auditKey) || sessionStorage.getItem(auditKey);
                let audit = [];
                if (rawAudit) {
                    try { audit = JSON.parse(rawAudit); } catch (e) { }
                }
                audit.unshift({
                    id: `aud-${Date.now().toString(36)}`,
                    timestamp: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) + ', ' + new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
                    action: 'BUSINESS_REGISTRATION_SUBMITTED',
                    stakeholder_id: profile.id,
                    stakeholder_name: profile.organizationName,
                    actor_name: profile.contactPerson,
                    actor_role: 'Tourism Stakeholder',
                    details: `Submitted business registration for destination "${profile.destinationName}" (${profile.destinationId}). Awaiting Destination Manager review.`,
                    previous_value: 'Unassigned',
                    new_value: `${profile.destinationName} (${profile.destinationId})`
                });
                localStorage.setItem(auditKey, JSON.stringify(audit));
                sessionStorage.setItem(auditKey, JSON.stringify(audit));
            } catch (e) { }
        }

        // Re-initialize context to update sidebar and badges
        initStakeholderContext();
        renderLivePreview(radioVisitor ? radioVisitor.checked : true);

        alert(isApproved
            ? 'Profile updated successfully! (Changes saved to active browser session)'
            : 'Business registration submitted for review! Your destination selection is now pending approval by the Destination Manager.');
    };

    if (saveBtn) saveBtn.addEventListener('click', handleProfileSave);
    if (profileForm) profileForm.addEventListener('submit', handleProfileSave);
}

/**
 * 5. Destination Updates Controller (destination-updates.html)
 */
async function initStakeholderDestinationUpdates() {
    const isUpdatesPage = window.location.pathname.includes('destination-updates.html');
    if (!isUpdatesPage) return;

    const dataStore = window.YatraSetuStakeholderData || {};
    const managerCatalog = window.YatraSetuManagerData || {};
    const profile = dataStore.profile || {};
    const destId = profile.destinationId;

    const subtitleEl = document.getElementById('updates-page-subtitle');
    const attrHeadingEl = document.getElementById('updates-attractions-heading');
    const unassignedBanner = document.getElementById('updates-unassigned-banner');
    const filterCard = document.getElementById('updates-filter-card');
    const quickTabsBar = document.getElementById('updates-quick-tabs-bar');
    const noResultsState = document.getElementById('updates-no-results-state');

    const announcementsSection = document.getElementById('updates-announcements-section');
    const attractionsSection = document.getElementById('updates-attractions-section');
    const eventsSection = document.getElementById('updates-events-section');

    const announcementsContainer = document.getElementById('updates-announcements-list');
    const attractionsContainer = document.getElementById('updates-attractions-grid');
    const eventsContainer = document.getElementById('updates-events-list');

    const announcementsBadge = document.getElementById('announcements-count-badge');
    const attractionsBadge = document.getElementById('attractions-count-badge');
    const eventsBadge = document.getElementById('events-count-badge');
    const resultCountEl = document.getElementById('sh-updates-result-count');

    // Controls
    const searchInput = document.getElementById('sh-updates-search');
    const typeFilter = document.getElementById('sh-updates-type-filter');
    const timingFilter = document.getElementById('sh-updates-event-timing');
    const monthFilter = document.getElementById('sh-updates-month-filter');
    const sortFilter = document.getElementById('sh-updates-sort');
    const resetBtn = document.getElementById('sh-updates-reset-btn');
    const clearEmptyBtn = document.getElementById('btn-clear-empty-filters');
    const quickTabBtns = document.querySelectorAll('.sh-tab-pill[data-category]');

    // Dynamic Title/Subtitle Sync
    if (subtitleEl) {
        subtitleEl.textContent = destId
            ? `View official announcements, attractions and events for ${profile.destinationName}.`
            : 'View official announcements, attractions and events for your assigned destination.';
    }
    if (attrHeadingEl) {
        attrHeadingEl.textContent = destId ? `Attractions in ${profile.destinationName}` : 'Local Attractions';
    }

    // 1. Handle Unassigned Destination State
    if (!destId) {
        if (unassignedBanner) {
            unassignedBanner.style.display = 'block';
            unassignedBanner.innerHTML = `
                <div style="padding: 2.25rem 1.5rem; text-align: center; background: var(--sh-card-bg); border: 1px solid var(--sh-card-border); border-radius: 14px; box-shadow: 0 2px 6px rgba(0,0,0,0.02);">
                    <div style="font-size: 2rem; margin-bottom: 0.5rem;">📍</div>
                    <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--sh-text-primary); margin: 0 0 0.35rem 0;">No Destination Assigned</h3>
                    <p style="font-size: 0.88rem; color: var(--sh-text-secondary); margin: 0 0 1.25rem 0; max-width: 500px; margin-left: auto; margin-right: auto;">
                        You currently do not have an active destination assigned to your stakeholder profile. Please configure your operating destination in My Business Profile to view official announcements, local attractions, and scheduled events.
                    </p>
                    <a href="profile.html" class="btn-sh-orange" style="display: inline-flex; font-size: 0.85rem; padding: 0.55rem 1.25rem; text-decoration: none;">
                        Configure Destination in My Business &rarr;
                    </a>
                </div>
            `;
        }
        if (filterCard) filterCard.style.display = 'none';
        if (quickTabsBar) quickTabsBar.style.display = 'none';
        if (announcementsSection) announcementsSection.style.display = 'none';
        if (attractionsSection) attractionsSection.style.display = 'none';
        if (eventsSection) eventsSection.style.display = 'none';
        if (noResultsState) noResultsState.style.display = 'none';
        return;
    }

    // If destination is assigned:
    if (unassignedBanner) unassignedBanner.style.display = 'none';
    if (filterCard) filterCard.style.display = 'block';
    if (quickTabsBar) quickTabsBar.style.display = 'flex';

    // 2. Base Records strictly filtered by Destination ID
    let rawAnnouncements = [];
    let rawAttractions = [];
    let rawEvents = [];

    if (hasLiveApiToken()) {
        try {
            const updates = await window.YatraSetuApi.getStakeholderDestinationUpdates();
            const advisoriesList = Array.isArray(updates) ? updates : (updates?.advisories || []);
            rawAnnouncements = advisoriesList.map(adv => ({
                id: adv.id,
                title: adv.title,
                content: adv.description || adv.message,
                category: adv.severity ? (adv.severity.charAt(0).toUpperCase() + adv.severity.slice(1)) : 'Advisory',
                severity: adv.severity,
                date: adv.created_at ? new Date(adv.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Official Notice',
                guidance: `Official advisory issued by Destination Management. Severity: ${adv.severity}.`,
                icon: adv.severity === 'critical' ? '🚨' : (adv.severity === 'warning' ? '⚠️' : '📣')
            }));

            // Scoped attractions and events
            rawAttractions = (managerCatalog.attractions || []).filter(a => a.destination_id === destId);
            rawEvents = (managerCatalog.events || []).filter(e => e.destination_id === destId);
        } catch (err) {
            console.error('[stakeholder.js] Error fetching destination updates:', err);
        }
    } else {
        rawAnnouncements = (dataStore.announcements || []).filter(a => a.destination_id === destId);
        rawAttractions = (managerCatalog.attractions || []).filter(a => a.destination_id === destId);
        rawEvents = (managerCatalog.events || []).filter(e => e.destination_id === destId);
    }

    // Timing Helper: compares event date against current reference date (October 2026)
    function isEventUpcoming(e) {
        const monthMap = { 'JAN': 0, 'FEB': 1, 'MAR': 2, 'APR': 3, 'MAY': 4, 'JUN': 5, 'JUL': 6, 'AUG': 7, 'SEP': 8, 'OCT': 9, 'NOV': 10, 'DEC': 11 };
        const monthIndex = monthMap[(e.dateMonth || '').toUpperCase()];
        const day = parseInt(e.dateNum, 10) || 1;
        if (monthIndex === undefined) return e.status === 'Upcoming' || e.status === 'Open';
        const eventDate = new Date(2026, monthIndex, day);
        const refDate = new Date(2026, 9, 1); // Reference: Oct 1, 2026
        return eventDate >= refDate || e.status === 'Upcoming';
    }

    // 3. Combined Filter & Render Function
    function applyFiltersAndRender() {
        const query = (searchInput ? searchInput.value.trim().toLowerCase() : '');
        const selectedCategory = (typeFilter ? typeFilter.value : 'all');
        const selectedTiming = (timingFilter ? timingFilter.value : 'all');
        const selectedMonth = (monthFilter ? monthFilter.value : 'all');
        const selectedSort = (sortFilter ? sortFilter.value : 'default');

        // Filter Announcements
        let filteredAnnouncements = [];
        if (selectedCategory === 'all' || selectedCategory === 'announcements') {
            filteredAnnouncements = rawAnnouncements.filter(a => {
                // Month filter
                if (selectedMonth !== 'all') {
                    const matchMonth = (a.date || '').toUpperCase().includes(selectedMonth);
                    if (!matchMonth) return false;
                }

                if (!query) return true;
                const matchTitle = (a.title || '').toLowerCase().includes(query);
                const matchContent = (a.content || '').toLowerCase().includes(query);
                const matchCat = (a.category || '').toLowerCase().includes(query);
                const matchGuidance = (a.guidance || '').toLowerCase().includes(query);
                return matchTitle || matchContent || matchCat || matchGuidance;
            });

            // Sort Announcements
            if (selectedSort === 'az') {
                filteredAnnouncements.sort((a, b) => a.title.localeCompare(b.title));
            } else if (selectedSort === 'newest') {
                // Keep reverse order of publish
                filteredAnnouncements.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
            }
        }

        // Filter Attractions
        let filteredAttractions = [];
        if (selectedCategory === 'all' || selectedCategory === 'attractions') {
            // Note: Attractions are permanent sites without specific monthly dates.
            // If user filters by a specific month and category is 'all', attractions are filtered out;
            // if category is explicitly 'attractions', they remain visible.
            if (selectedMonth === 'all' || selectedCategory === 'attractions') {
                filteredAttractions = rawAttractions.filter(attr => {
                    if (!query) return true;
                    const matchName = (attr.name || '').toLowerCase().includes(query);
                    const matchCat = (attr.category || '').toLowerCase().includes(query);
                    return matchName || matchCat;
                });

                // Sort Attractions
                if (selectedSort === 'az') {
                    filteredAttractions.sort((a, b) => a.name.localeCompare(b.name));
                } else if (selectedSort === 'rating') {
                    filteredAttractions.sort((a, b) => (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0));
                }
            }
        }

        // Filter Events
        let filteredEvents = [];
        if (selectedCategory === 'all' || selectedCategory === 'events') {
            filteredEvents = rawEvents.filter(e => {
                // Timing filter
                if (selectedTiming === 'upcoming' && !isEventUpcoming(e)) return false;
                if (selectedTiming === 'past' && isEventUpcoming(e)) return false;

                // Month filter
                if (selectedMonth !== 'all') {
                    if ((e.dateMonth || '').toUpperCase() !== selectedMonth) return false;
                }

                // Search query
                if (!query) return true;
                const matchTitle = (e.title || '').toLowerCase().includes(query);
                const matchLoc = (e.location || '').toLowerCase().includes(query);
                const matchStatus = (e.status || '').toLowerCase().includes(query);
                return matchTitle || matchLoc || matchStatus;
            });

            // Sort Events
            if (selectedSort === 'az') {
                filteredEvents.sort((a, b) => a.title.localeCompare(b.title));
            }
        }

        const totalVisible = filteredAnnouncements.length + filteredAttractions.length + filteredEvents.length;

        // Update Results Counter
        if (resultCountEl) {
            resultCountEl.textContent = `Showing ${totalVisible} record${totalVisible === 1 ? '' : 's'} for ${profile.destinationName}`;
        }

        // Update Section Badges
        if (announcementsBadge) announcementsBadge.textContent = `${filteredAnnouncements.length} notices`;
        if (attractionsBadge) attractionsBadge.textContent = `${filteredAttractions.length} places`;
        if (eventsBadge) eventsBadge.textContent = `${filteredEvents.length} events`;

        // Handle Zero Matching Results State
        if (totalVisible === 0) {
            if (noResultsState) noResultsState.style.display = 'block';
            if (announcementsSection) announcementsSection.style.display = 'none';
            if (attractionsSection) attractionsSection.style.display = 'none';
            if (eventsSection) eventsSection.style.display = 'none';
            return;
        }

        if (noResultsState) noResultsState.style.display = 'none';

        // 4. Render Announcements Section
        if (selectedCategory === 'all' || selectedCategory === 'announcements') {
            if (announcementsSection) announcementsSection.style.display = 'block';
            if (announcementsContainer) {
                if (filteredAnnouncements.length === 0) {
                    announcementsContainer.innerHTML = `
                        <div style="padding: 1.5rem; text-align: center; color: var(--sh-text-muted); background: var(--sh-card-bg); border: 1px solid var(--sh-card-border); border-radius: 12px;">
                            <div style="font-size: 1.25rem; margin-bottom: 0.25rem;">📣</div>
                            <strong>No announcements match your search query for ${profile.destinationName}.</strong>
                        </div>
                    `;
                } else {
                    announcementsContainer.innerHTML = filteredAnnouncements.map(a => `
                        <div class="sh-update-card" style="padding: 1.15rem; margin-bottom: 1rem; display: flex; gap: 1rem; align-items: flex-start;">
                            <div style="font-size: 1.4rem; padding: 0.35rem 0.65rem; background: var(--sh-orange-light); border-radius: 10px;">${a.icon || '📣'}</div>
                            <div style="flex: 1;">
                                <div style="display: flex; gap: 0.6rem; align-items: center; margin-bottom: 0.3rem; justify-content: space-between; flex-wrap: wrap;">
                                    <div style="display: flex; align-items: center; gap: 0.6rem;">
                                        <h4 style="font-size: 1rem; font-weight: 700; color: var(--sh-text-primary); margin: 0;">${a.title}</h4>
                                        <span class="sh-status-badge review" style="font-size: 0.72rem;">${a.category}</span>
                                    </div>
                                    <span style="font-size: 0.76rem; color: var(--sh-text-muted);">${a.date}</span>
                                </div>
                                <p style="font-size: 0.85rem; color: var(--sh-text-secondary); margin: 0 0 0.85rem 0; line-height: 1.5;">${a.content}</p>
                                <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #F1F5F9; padding-top: 0.65rem;">
                                    <span style="font-size: 0.75rem; color: var(--sh-text-muted);">📍 ${profile.destinationName}</span>
                                    <button type="button" class="btn-view-detail" data-item-type="announcement" data-item-id="${a.id}">
                                        View Details &rarr;
                                    </button>
                                </div>
                            </div>
                        </div>
                    `).join('');
                }
            }
        } else {
            if (announcementsSection) announcementsSection.style.display = 'none';
        }

        // 5. Render Attractions Section
        if (selectedCategory === 'all' || selectedCategory === 'attractions') {
            if (attractionsSection) attractionsSection.style.display = 'block';
            if (attractionsContainer) {
                if (filteredAttractions.length === 0) {
                    attractionsContainer.innerHTML = `
                        <div style="grid-column: 1 / -1; padding: 1.5rem; text-align: center; color: var(--sh-text-muted); background: var(--sh-card-bg); border: 1px solid var(--sh-card-border); border-radius: 12px;">
                            <div style="font-size: 1.25rem; margin-bottom: 0.25rem;">🏛️</div>
                            <strong>No registered attractions matching search for ${profile.destinationName}.</strong>
                        </div>
                    `;
                } else {
                    attractionsContainer.innerHTML = filteredAttractions.map(attr => `
                        <div class="sh-update-card">
                            <img src="${attr.img}" alt="${attr.name}" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=600&auto=format&fit=crop&q=80';" style="width: 100%; height: 145px; object-fit: cover;">
                            <div style="padding: 1rem; display: flex; flex-direction: column; justify-content: space-between; min-height: 120px;">
                                <div>
                                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.3rem;">
                                        <h4 style="font-size: 0.95rem; font-weight: 700; color: var(--sh-text-primary); margin: 0;">${attr.name}</h4>
                                        <span style="font-size: 0.75rem; color: #F59E0B; font-weight: 700;">⭐ ${attr.rating || '4.8'}</span>
                                    </div>
                                    <span style="font-size: 0.76rem; color: var(--sh-text-muted); display: block; margin-bottom: 0.65rem;">${attr.category}</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #F1F5F9; padding-top: 0.65rem;">
                                    <span class="sh-status-badge accepted" style="font-size: 0.7rem;">${attr.status || 'Open'}</span>
                                    <button type="button" class="btn-view-detail" data-item-type="attraction" data-item-id="${attr.id}">
                                        View Details &rarr;
                                    </button>
                                </div>
                            </div>
                        </div>
                    `).join('');
                }
            }
        } else {
            if (attractionsSection) attractionsSection.style.display = 'none';
        }

        // 6. Render Events Section
        if (selectedCategory === 'all' || selectedCategory === 'events') {
            if (eventsSection) eventsSection.style.display = 'block';
            if (eventsContainer) {
                if (filteredEvents.length === 0) {
                    eventsContainer.innerHTML = `
                        <div style="padding: 1.5rem; text-align: center; color: var(--sh-text-muted); background: var(--sh-card-bg); border: 1px solid var(--sh-card-border); border-radius: 12px;">
                            <div style="font-size: 1.25rem; margin-bottom: 0.25rem;">📅</div>
                            <strong>No scheduled events matching current criteria for ${profile.destinationName}.</strong>
                        </div>
                    `;
                } else {
                    eventsContainer.innerHTML = filteredEvents.map(e => `
                        <div class="sh-update-card" style="margin-bottom: 1rem; display: flex; gap: 1rem; overflow: hidden;">
                            <img src="${e.img}" alt="${e.title}" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600&auto=format&fit=crop&q=80';" style="width: 150px; height: 110px; object-fit: cover;">
                            <div style="padding: 0.85rem 1rem 0.85rem 0; flex: 1; display: flex; flex-direction: column; justify-content: space-between;">
                                <div>
                                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.3rem;">
                                        <h4 style="font-size: 0.98rem; font-weight: 700; color: var(--sh-text-primary); margin: 0;">${e.title}</h4>
                                        <span class="sh-status-badge accepted" style="font-size: 0.72rem;">${e.status}</span>
                                    </div>
                                    <span style="font-size: 0.78rem; color: var(--sh-text-muted); display: block; margin-bottom: 0.25rem;">
                                        📅 ${e.dateNum} ${e.dateMonth} 2026 • 📍 ${e.location}
                                    </span>
                                </div>
                                <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #F1F5F9; padding-top: 0.5rem;">
                                    <span style="font-size: 0.74rem; color: var(--sh-text-muted);">
                                        ${isEventUpcoming(e) ? '🟢 Scheduled Upcoming' : '⚪ Concluded Event'}
                                    </span>
                                    <button type="button" class="btn-view-detail" data-item-type="event" data-item-id="${e.id}">
                                        View Details &rarr;
                                    </button>
                                </div>
                            </div>
                        </div>
                    `).join('');
                }
            }
        } else {
            if (eventsSection) eventsSection.style.display = 'none';
        }
    }

    // 7. Event Listeners for Filter Inputs
    if (searchInput) searchInput.addEventListener('input', applyFiltersAndRender);
    if (typeFilter) {
        typeFilter.addEventListener('change', () => {
            // Sync Quick Tab Pills
            quickTabBtns.forEach(btn => {
                btn.classList.toggle('active', btn.getAttribute('data-category') === typeFilter.value);
            });
            applyFiltersAndRender();
        });
    }
    if (timingFilter) timingFilter.addEventListener('change', applyFiltersAndRender);
    if (monthFilter) monthFilter.addEventListener('change', applyFiltersAndRender);
    if (sortFilter) sortFilter.addEventListener('change', applyFiltersAndRender);

    // Quick Tab Pills Sync
    quickTabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            quickTabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const cat = btn.getAttribute('data-category');
            if (typeFilter) typeFilter.value = cat;
            applyFiltersAndRender();
        });
    });

    // Reset Filters Handler
    const resetFilters = () => {
        if (searchInput) searchInput.value = '';
        if (typeFilter) typeFilter.value = 'all';
        if (timingFilter) timingFilter.value = 'all';
        if (monthFilter) monthFilter.value = 'all';
        if (sortFilter) sortFilter.value = 'default';

        quickTabBtns.forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-category') === 'all');
        });

        applyFiltersAndRender();
    };

    if (resetBtn) resetBtn.addEventListener('click', resetFilters);
    if (clearEmptyBtn) clearEmptyBtn.addEventListener('click', resetFilters);

    // Initial Filter Execution
    applyFiltersAndRender();

    // 8. Reusable View Details Modal Controller (Accessible & Read-Only)
    const detailModal = document.getElementById('destinationDetailModal');
    const closeBtn = document.getElementById('btn-close-detail-modal');
    const footerCloseBtn = document.getElementById('btn-footer-close-detail-modal');
    let lastFocusedElement = null;

    const openDetailModal = (type, id, triggerBtn) => {
        if (!detailModal) return;
        lastFocusedElement = triggerBtn || document.activeElement;

        const modalBadge = document.getElementById('modal-detail-badge');
        const modalTitle = document.getElementById('modal-detail-title');
        const modalImgContainer = document.getElementById('modal-image-container');
        const modalImg = document.getElementById('modal-detail-img');
        const modalMeta = document.getElementById('modal-meta-chips');
        const modalContent = document.getElementById('modal-detail-content');
        const modalGuidanceContainer = document.getElementById('modal-guidance-container');
        const modalGuidanceText = document.getElementById('modal-guidance-text');

        if (type === 'announcement') {
            const item = rawAnnouncements.find(a => a.id === id);
            if (!item) return;

            if (modalBadge) {
                modalBadge.textContent = 'OFFICIAL DESTINATION NOTICE';
                modalBadge.className = 'sh-status-badge review';
            }
            if (modalTitle) modalTitle.textContent = item.title;
            if (modalImgContainer) modalImgContainer.style.display = 'none';

            if (modalMeta) {
                modalMeta.innerHTML = `
                    <span class="sh-detail-meta-chip">📍 ${profile.destinationName}, ${profile.stateName}</span>
                    <span class="sh-detail-meta-chip">📅 Date: ${item.date}</span>
                    <span class="sh-detail-meta-chip">🏷️ Category: ${item.category}</span>
                `;
            }

            if (modalContent) modalContent.textContent = item.content;

            if (item.guidance && modalGuidanceContainer && modalGuidanceText) {
                modalGuidanceContainer.style.display = 'block';
                modalGuidanceText.textContent = item.guidance;
            } else if (modalGuidanceContainer) {
                modalGuidanceContainer.style.display = 'none';
            }
        } else if (type === 'attraction') {
            const item = rawAttractions.find(a => a.id === id);
            if (!item) return;

            if (modalBadge) {
                modalBadge.textContent = 'REGISTERED ATTRACTION';
                modalBadge.className = 'sh-status-badge accepted';
            }
            if (modalTitle) modalTitle.textContent = item.name;

            if (modalImgContainer && modalImg) {
                modalImgContainer.style.display = 'block';
                modalImg.onerror = function () {
                    this.onerror = null;
                    this.src = 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=600&auto=format&fit=crop&q=80';
                };
                modalImg.src = item.img;
                modalImg.alt = item.name;
            }

            if (modalMeta) {
                modalMeta.innerHTML = `
                    <span class="sh-detail-meta-chip">📍 ${profile.destinationName}, ${profile.stateName}</span>
                    <span class="sh-detail-meta-chip">⭐ Rating: ${item.rating || '4.8'}/5.0</span>
                    <span class="sh-detail-meta-chip">🏷️ Category: ${item.category}</span>
                    <span class="sh-detail-meta-chip">🟢 Status: ${item.status || 'Open'}</span>
                `;
            }

            if (modalContent) {
                modalContent.textContent = `${item.name} is a key tourist attraction cataloged for ${profile.destinationName}. Local guides and service stakeholders should verify operating hours and route accessibility before directing visitor groups.`;
            }

            if (modalGuidanceContainer && modalGuidanceText) {
                modalGuidanceContainer.style.display = 'block';
                modalGuidanceText.textContent = `Ensure tourists follow conservation etiquette, stay on marked trails, and preserve the heritage site.`;
            }
        } else if (type === 'event') {
            const item = rawEvents.find(e => e.id === id);
            if (!item) return;

            const upcoming = isEventUpcoming(item);

            if (modalBadge) {
                modalBadge.textContent = upcoming ? 'SCHEDULED DESTINATION EVENT' : 'CONCLUDED EVENT';
                modalBadge.className = upcoming ? 'sh-status-badge accepted' : 'sh-status-badge pending';
            }
            if (modalTitle) modalTitle.textContent = item.title;

            if (modalImgContainer && modalImg) {
                modalImgContainer.style.display = 'block';
                modalImg.onerror = function () {
                    this.onerror = null;
                    this.src = 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600&auto=format&fit=crop&q=80';
                };
                modalImg.src = item.img;
                modalImg.alt = item.title;
            }

            if (modalMeta) {
                modalMeta.innerHTML = `
                    <span class="sh-detail-meta-chip">📍 ${item.location}</span>
                    <span class="sh-detail-meta-chip">📅 Date: ${item.dateNum} ${item.dateMonth} 2026</span>
                    <span class="sh-detail-meta-chip">🏷️ Status: ${item.status}</span>
                `;
            }

            if (modalContent) {
                modalContent.textContent = `${item.title} is an official destination event hosted at ${item.location}. Local stakeholders can anticipate elevated visitor traffic during event periods.`;
            }

            if (modalGuidanceContainer && modalGuidanceText) {
                modalGuidanceContainer.style.display = 'block';
                modalGuidanceText.textContent = `Stakeholders offering transportation, guided walks, or nearby services should coordinate timing with the event schedule.`;
            }
        }

        detailModal.style.display = 'flex';
        if (closeBtn) closeBtn.focus();
    };

    const closeDetailModal = () => {
        if (!detailModal) return;
        detailModal.style.display = 'none';
        if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
            lastFocusedElement.focus();
        }
    };

    // Attach Click Delegate for View Details Buttons
    document.addEventListener('click', (e) => {
        const targetBtn = e.target.closest('.btn-view-detail');
        if (targetBtn) {
            e.preventDefault();
            const type = targetBtn.getAttribute('data-item-type');
            const id = targetBtn.getAttribute('data-item-id');
            openDetailModal(type, id, targetBtn);
        }
    });

    if (closeBtn) closeBtn.addEventListener('click', closeDetailModal);
    if (footerCloseBtn) footerCloseBtn.addEventListener('click', closeDetailModal);

    // Backdrop click closes modal
    detailModal.addEventListener('click', (e) => {
        if (e.target === detailModal) {
            closeDetailModal();
        }
    });

    // Escape Key closes modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && detailModal.style.display === 'flex') {
            closeDetailModal();
        }
    });
}

/**
 * 6. Connections & Reviews Controller (connections-reviews.html)
 */
async function initStakeholderConnectionsReviews() {
    const isConnPage = window.location.pathname.includes('connections-reviews.html');
    if (!isConnPage) return;

    const dataStore = window.YatraSetuStakeholderData || {};
    const profile = dataStore.profile || {};
    const destId = profile.destinationId;

    const tabBtnConn = document.getElementById('tab-btn-conn');
    const tabBtnRev = document.getElementById('tab-btn-rev');
    const contentConn = document.getElementById('tab-content-conn');
    const contentRev = document.getElementById('tab-content-rev');

    const suggestionsTable = document.getElementById('suggestions-table-body');
    const managerUpdatesFeed = document.getElementById('manager-updates-list');
    const touristReviewsFeed = document.getElementById('tourist-reviews-list');

    // Dual Tab Navigation
    if (tabBtnConn && tabBtnRev && contentConn && contentRev) {
        tabBtnConn.onclick = () => {
            tabBtnConn.classList.add('active');
            tabBtnRev.classList.remove('active');
            contentConn.style.display = 'block';
            contentRev.style.display = 'none';
        };

        tabBtnRev.onclick = () => {
            tabBtnRev.classList.add('active');
            tabBtnConn.classList.remove('active');
            contentRev.style.display = 'block';
            contentConn.style.display = 'none';
        };
    }

    // Render Suggestions Table
    async function renderSuggestionsTable() {
        if (!suggestionsTable) return;

        if (!destId) {
            suggestionsTable.innerHTML = '<tr><td colspan="5" style="padding: 2rem; text-align: center; color: var(--sh-text-muted);">No destination assigned. Assign your operating destination in My Business Profile before coordinating with Destination Managers.</td></tr>';
            return;
        }

        let suggestions = [];

        if (hasLiveApiToken()) {
            try {
                const res = await window.YatraSetuApi.getStakeholderSuggestions();
                if (Array.isArray(res)) suggestions = res;
            } catch (err) {
                console.error('[stakeholder.js] Error fetching suggestions:', err);
            }
        } else {
            // Read from shared prototype storage
            let allMessages = [];
            try {
                const rawStored = sessionStorage.getItem('yatrasetu_stakeholder_messages') || localStorage.getItem('yatrasetu_stakeholder_messages');
                if (rawStored) allMessages = JSON.parse(rawStored);
            } catch (e) { }

            if (!allMessages || allMessages.length === 0) {
                if (window.YatraSetuManagerData && window.YatraSetuManagerData.stakeholderMessages) {
                    allMessages = window.YatraSetuManagerData.stakeholderMessages;
                } else if (dataStore.suggestions) {
                    allMessages = dataStore.suggestions;
                }
            }

            const currentStakeholderId = profile.id || 'sh-1';
            suggestions = allMessages.filter(s => {
                const matchesOwner = (s.stakeholder_id === currentStakeholderId || (!s.stakeholder_id && s.destination_id === destId));
                const matchesDest = !destId || s.destination_id === destId;
                return matchesOwner && matchesDest;
            });
        }

        if (suggestions.length === 0) {
            suggestionsTable.innerHTML = `<tr><td colspan="5" style="padding: 1.75rem; text-align: center; color: var(--sh-text-muted);">No suggestions submitted for ${profile.destinationName} yet. Use the "+ Suggest Information Update" button above.</td></tr>`;
        } else {
            suggestionsTable.innerHTML = suggestions.map(s => {
                let badgeClass = 'pending';
                const st = (s.status || '').toLowerCase();
                if (st === 'in_review' || st === 'in review') badgeClass = 'review';
                else if (st === 'responded') badgeClass = 'accepted';
                else if (st === 'dismissed') badgeClass = 'pending';

                const displayStatus = s.status ? (s.status.charAt(0).toUpperCase() + s.status.slice(1).replace('_', ' ')) : 'Pending';
                const submittedAt = s.created_at ? new Date(s.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : (s.submitted_at || s.submittedAt || 'Recently');

                const responseHtml = s.manager_response ? `
                    <div style="background: #F0FDF4; border-left: 3px solid #16A34A; padding: 0.45rem 0.75rem; border-radius: 4px; font-size: 0.8rem; color: #166534;">
                        <strong style="color: #14532D; display: block; font-size: 0.76rem;">Destination Manager:</strong>
                        "${s.manager_response}"
                        <div style="font-size: 0.7rem; color: #64748B; margin-top: 0.25rem;">${s.responded_at ? new Date(s.responded_at).toLocaleDateString('en-IN') : ''}</div>
                    </div>
                ` : (st === 'in_review' || st === 'in review' ? `
                    <span style="color: #2563EB; font-style: italic; font-size: 0.8rem;">Under active review by Destination Manager</span>
                ` : `
                    <span style="color: var(--sh-text-muted); font-style: italic; font-size: 0.8rem;">Awaiting Manager Review</span>
                `);

                return `
                    <tr style="border-bottom: 1px solid var(--sh-card-border); font-size: 0.85rem;">
                        <td style="padding: 0.85rem 1rem; font-weight: 700; color: var(--sh-text-primary);">${s.topic}</td>
                        <td style="padding: 0.85rem 1rem; color: var(--sh-text-secondary);">${s.message || s.suggestionText}</td>
                        <td style="padding: 0.85rem 1rem; color: var(--sh-text-muted);">${submittedAt}</td>
                        <td style="padding: 0.85rem 1rem;">
                            <span class="sh-status-badge ${badgeClass}">${displayStatus}</span>
                        </td>
                        <td style="padding: 0.85rem 1rem;">
                            ${responseHtml}
                        </td>
                    </tr>
                `;
            }).join('');
        }
    }

    // Render Recent Manager Updates
    function renderManagerUpdates() {
        if (!managerUpdatesFeed) return;

        if (!destId) {
            managerUpdatesFeed.innerHTML = '<div style="padding: 1.5rem; text-align: center; color: var(--sh-text-muted);">No destination assigned. Please assign a destination to view manager updates.</div>';
            return;
        }

        const updates = (dataStore.managerUpdates || []).filter(m => m.destination_id === destId);

        if (updates.length === 0) {
            managerUpdatesFeed.innerHTML = `<div style="padding: 1.25rem; text-align: center; color: var(--sh-text-muted);">No manager updates recorded for ${profile.destinationName}.</div>`;
        } else {
            managerUpdatesFeed.innerHTML = updates.map(m => `
                <div style="background: var(--sh-card-bg); border: 1px solid var(--sh-card-border); border-radius: 12px; padding: 1rem; display: flex; gap: 0.85rem; align-items: flex-start;">
                    <div style="font-size: 1.2rem;">🔹</div>
                    <div>
                        <div style="display: flex; gap: 0.5rem; align-items: center; margin-bottom: 0.2rem;">
                            <h4 style="font-size: 0.9rem; font-weight: 700; color: var(--sh-text-primary); margin: 0;">${m.title}</h4>
                            <span style="font-size: 0.75rem; color: var(--sh-text-muted);">${m.date}</span>
                        </div>
                        <p style="font-size: 0.82rem; color: var(--sh-text-secondary); margin: 0; line-height: 1.4;">${m.content}</p>
                    </div>
                </div>
            `).join('');
        }
    }

    // Render Tourist Reviews
    function renderReviewsFeed() {
        if (!touristReviewsFeed) return;

        if (hasLiveApiToken()) {
            touristReviewsFeed.innerHTML = `
                <div style="padding: 2.5rem 1.5rem; text-align: center; color: var(--sh-text-muted); background: var(--sh-card-bg); border: 1px solid var(--sh-card-border); border-radius: 12px;">
                    <div style="font-size: 2rem; margin-bottom: 0.5rem;">ℹ️</div>
                    <h4 style="font-size: 1.05rem; font-weight: 700; color: var(--sh-text-primary); margin: 0 0 0.35rem 0;">Tourist Reviews & Inquiries</h4>
                    <p style="font-size: 0.85rem; color: var(--sh-text-secondary); margin: 0;">Direct tourist messaging and review moderation are currently deferred and will be activated in the upcoming Tourist workspace phase.</p>
                </div>
            `;
            return;
        }

        if (!destId) {
            touristReviewsFeed.innerHTML = '<div style="padding: 2rem; text-align: center; color: var(--sh-text-muted);">No destination assigned. Please configure your profile to view tourist reviews.</div>';
            return;
        }

        const reviews = (dataStore.reviews || []).filter(r => r.destination_id === destId);

        if (reviews.length === 0) {
            touristReviewsFeed.innerHTML = `<div style="padding: 2rem; text-align: center; color: var(--sh-text-muted);">No tourist reviews recorded for your services at ${profile.destinationName} yet.</div>`;
        } else {
            touristReviewsFeed.innerHTML = reviews.map(r => `
                <div style="background: var(--sh-card-bg); border: 1px solid var(--sh-card-border); border-radius: 12px; padding: 1.1rem; margin-bottom: 1rem;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
                        <div style="display: flex; align-items: center; gap: 0.65rem;">
                            <div style="width: 34px; height: 34px; border-radius: 50%; background: #8B5CF6; color: #fff; font-weight: 700; display: flex; align-items: center; justify-content: center; font-size: 0.85rem;">
                                ${r.authorInitials || r.author[0]}
                            </div>
                            <div>
                                <h4 style="font-size: 0.92rem; font-weight: 700; color: var(--sh-text-primary); margin: 0;">${r.author}</h4>
                                <span style="font-size: 0.76rem; color: #F59E0B;">${'⭐'.repeat(r.rating)} <span style="color: var(--sh-text-muted); margin-left: 0.3rem;">• ${r.date}</span></span>
                            </div>
                        </div>
                        <button type="button" class="btn-reply-review" data-id="${r.id}" style="background: var(--sh-card-bg); border: 1px solid var(--sh-card-border); padding: 0.35rem 0.75rem; border-radius: 6px; font-weight: 600; font-size: 0.78rem; cursor: pointer;">
                            💬 Reply
                        </button>
                    </div>
                    <p style="font-size: 0.85rem; color: var(--sh-text-secondary); line-height: 1.5; margin: 0 0 0.5rem 0;">"${r.content}"</p>
                    ${r.response ? `
                        <div style="background: var(--sh-orange-light); border-left: 3px solid var(--sh-orange-accent); padding: 0.6rem 0.85rem; border-radius: 6px; font-size: 0.8rem; color: var(--sh-text-primary); margin-top: 0.6rem;">
                            <strong>Your Official Response:</strong> ${r.response}
                        </div>
                    ` : ''}
                </div>
            `).join('');

            // Attach Reply Modal Listeners
            document.querySelectorAll('.btn-reply-review').forEach(btn => {
                btn.onclick = () => {
                    const id = btn.getAttribute('data-id');
                    const targetRev = reviews.find(item => item.id === id);
                    if (!targetRev) return;

                    const replyModal = document.getElementById('reviewResponseModal');
                    const modalAuthor = document.getElementById('modal-review-author');
                    const modalText = document.getElementById('modal-review-text');
                    const modalInput = document.getElementById('modal-response-input');
                    const modalIdInput = document.getElementById('modal-review-id');

                    if (modalAuthor) modalAuthor.textContent = targetRev.author;
                    if (modalText) modalText.textContent = `"${targetRev.content}"`;
                    if (modalInput) modalInput.value = targetRev.response || '';
                    if (modalIdInput) modalIdInput.value = targetRev.id;
                    if (replyModal) replyModal.style.display = 'flex';
                };
            });
        }
    }

    await renderSuggestionsTable();
    renderManagerUpdates();
    renderReviewsFeed();

    // Suggestion Submission Modal
    const openSugModalBtn = document.getElementById('btn-open-suggest-modal');
    const sugModal = document.getElementById('suggestUpdateModal');
    const closeSugModalBtn = document.getElementById('btn-close-suggest-modal');
    const sugForm = document.getElementById('suggest-update-form');

    if (openSugModalBtn && sugModal) {
        openSugModalBtn.onclick = () => {
            if (!destId) {
                alert('Please assign an operating destination in My Business Profile before submitting suggestions to Destination Managers.');
                return;
            }
            sugModal.style.display = 'flex';
        };
    }

    if (closeSugModalBtn && sugModal) {
        closeSugModalBtn.onclick = () => {
            sugModal.style.display = 'none';
        };
    }

    if (sugForm) {
        sugForm.onsubmit = async (e) => {
            e.preventDefault();
            const topicInput = document.getElementById('sug-topic-input');
            const textInput = document.getElementById('sug-text-input');

            if (!topicInput || !topicInput.value.trim() || !textInput || !textInput.value.trim()) {
                alert('Please enter both topic and suggestion details.');
                return;
            }

            if (hasLiveApiToken()) {
                try {
                    await window.YatraSetuApi.createStakeholderSuggestion({
                        topic: topicInput.value.trim(),
                        message: textInput.value.trim()
                    });
                    alert('Suggestion submitted to Destination Manager!');
                    if (sugModal) sugModal.style.display = 'none';
                    sugForm.reset();
                    await renderSuggestionsTable();
                    await initStakeholderOverview();
                    return;
                } catch (err) {
                    console.error('[stakeholder.js] Suggestion submission error:', err);
                    alert(err.message || 'Failed to submit suggestion.');
                    return;
                }
            } else {
                alert('Suggestion submission requires an active authenticated session.');
            }
        };
    }

    // Review Response Submit
    const respForm = document.getElementById('review-response-form');
    const respModal = document.getElementById('reviewResponseModal');
    const closeRespModalBtn = document.getElementById('btn-close-response-modal');

    if (closeRespModalBtn && respModal) {
        closeRespModalBtn.onclick = () => {
            respModal.style.display = 'none';
        };
    }

    if (respForm) {
        respForm.onsubmit = (e) => {
            e.preventDefault();
            const revId = document.getElementById('modal-review-id').value;
            const respText = document.getElementById('modal-response-input').value.trim();

            if (!respText) {
                alert('Please enter your response.');
                return;
            }

            const targetRev = (dataStore.reviews || []).find(r => r.id === revId);
            if (targetRev) {
                targetRev.response = respText;
                alert('Official response published! (Saved in prototype store)');
            }

            if (respModal) respModal.style.display = 'none';
            renderReviewsFeed();
        };
    }
}

/**
 * 7. Media & Listings Controller (media-listings.html)
 * Manages photo/video gallery, file validation, prototype uploads,
 * media previews, destructive confirmation modals, post updates,
 * and service listing CRUD with strict stakeholder ownership protection.
 */
async function initStakeholderMediaListings() {
    const isMediaPage = window.location.pathname.includes('media-listings.html');
    if (!isMediaPage) return;

    const dataStore = window.YatraSetuStakeholderData || {};
    const profile = dataStore.profile || {};
    const currentUserId = profile.id || 'sh-1';
    const destId = profile.destinationId;

    // 1. Destination Scope Gate
    const unassignedBanner = document.getElementById('media-unassigned-banner');
    const mainContent = document.getElementById('media-main-content');
    const destTagName = document.getElementById('media-dest-tag-name');

    if (!destId) {
        if (unassignedBanner) unassignedBanner.style.display = 'block';
        if (mainContent) mainContent.style.display = 'none';
        return;
    }

    if (unassignedBanner) unassignedBanner.style.display = 'none';
    if (mainContent) mainContent.style.display = 'block';
    if (destTagName) destTagName.textContent = profile.destinationName || 'Rajgad Fort';

    // 2. Tab Navigation
    const tabBtnMedia = document.getElementById('tab-btn-media');
    const tabBtnPosts = document.getElementById('tab-btn-posts');
    const tabBtnListings = document.getElementById('tab-btn-listings');
    const tabContentMedia = document.getElementById('tab-content-media');
    const tabContentPosts = document.getElementById('tab-content-posts');
    const tabContentListings = document.getElementById('tab-content-listings');
    const allTabBtns = [tabBtnMedia, tabBtnPosts, tabBtnListings];
    const allTabContents = [tabContentMedia, tabContentPosts, tabContentListings];

    function switchTab(activeBtn, activeContent) {
        allTabBtns.forEach(btn => { if (btn) btn.classList.remove('active'); });
        allTabContents.forEach(content => { if (content) content.style.display = 'none'; });
        if (activeBtn) activeBtn.classList.add('active');
        if (activeContent) activeContent.style.display = 'block';
    }

    if (tabBtnMedia && tabContentMedia) {
        tabBtnMedia.addEventListener('click', () => switchTab(tabBtnMedia, tabContentMedia));
    }
    if (tabBtnPosts && tabContentPosts) {
        tabBtnPosts.addEventListener('click', () => {
            switchTab(tabBtnPosts, tabContentPosts);
            renderPostsFeed();
        });
    }
    if (tabBtnListings && tabContentListings) {
        tabBtnListings.addEventListener('click', () => {
            switchTab(tabBtnListings, tabContentListings);
            renderListingsGrid();
        });
    }

    // =========================================================================
    // 3. MEDIA GALLERY (PHOTOS & VIDEOS)
    // =========================================================================
    let currentMediaFilter = 'all';
    const mediaGrid = document.getElementById('sh-media-grid');
    const mediaEmptyState = document.getElementById('media-empty-state');
    const mediaCounter = document.getElementById('media-gallery-counter');
    const mediaSortSelect = document.getElementById('sh-media-sort');
    const mediaFilterPills = document.querySelectorAll('.sh-media-type-pill-group .sh-tab-pill');

    async function renderMediaGallery() {
        if (!mediaGrid) return;

        let allMedia = [];
        if (hasLiveApiToken()) {
            try {
                const res = await window.YatraSetuApi.getStakeholderMedia();
                if (Array.isArray(res)) {
                    allMedia = res.map(m => ({
                        id: m.id,
                        stakeholder_id: profile.id,
                        destination_id: m.destination_id,
                        type: m.media_type,
                        title: m.title,
                        description: m.description,
                        url: m.media_url,
                        status: m.verification_status === 'approved' ? 'Approved' : (m.verification_status === 'rejected' ? 'Rejected' : 'Pending Approval'),
                        statusClass: m.verification_status === 'approved' ? 'accepted' : (m.verification_status === 'rejected' ? 'review' : 'pending'),
                        uploadedAt: m.created_at ? new Date(m.created_at).toLocaleDateString('en-IN') : 'Today',
                        fileSize: 'Standard'
                    }));
                }
            } catch (err) {
                console.error('[stakeholder.js] Error fetching media:', err);
            }
        } else {
            // Show only records genuinely uploaded by the current stakeholder in prototype store
            allMedia = (dataStore.media || []).filter(m => m.destination_id === destId && m.stakeholder_id === currentUserId);
        }

        const photoCount = allMedia.filter(m => m.type === 'photo').length;
        const videoCount = allMedia.filter(m => m.type === 'video').length;

        // Update pill counts
        mediaFilterPills.forEach(pill => {
            const filterType = pill.getAttribute('data-media-filter');
            if (filterType === 'all') pill.textContent = `All (${allMedia.length})`;
            if (filterType === 'photo') pill.textContent = `Photos (${photoCount})`;
            if (filterType === 'video') pill.textContent = `Videos (${videoCount})`;
        });

        // Filter by selected media type
        let filteredMedia = allMedia.filter(m => {
            if (currentMediaFilter === 'all') return true;
            return m.type === currentMediaFilter;
        });

        // Sort items
        const sortVal = mediaSortSelect ? mediaSortSelect.value : 'newest';
        if (sortVal === 'az') {
            filteredMedia.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
        } else if (sortVal === 'oldest') {
            filteredMedia.sort((a, b) => (a.uploadedAt || '').localeCompare(b.uploadedAt || ''));
        }

        // Update counter
        if (mediaCounter) {
            mediaCounter.textContent = allMedia.length === 0 ? 'No media uploaded' : `Showing ${filteredMedia.length} item${filteredMedia.length === 1 ? '' : 's'}`;
        }

        // Honest Empty States
        if (allMedia.length === 0) {
            if (mediaEmptyState) {
                mediaEmptyState.innerHTML = `
                    <div style="font-size: 2.4rem; margin-bottom: 0.5rem;">📷</div>
                    <h4 style="font-size: 1.05rem; font-weight: 800; color: var(--sh-text-primary); margin: 0 0 0.35rem 0;">No media uploaded yet</h4>
                    <p style="font-size: 0.84rem; color: var(--sh-text-secondary); margin: 0 0 0.35rem 0;">You have not uploaded any photos or videos for ${profile.destinationName}.</p>
                    <p style="font-size: 0.78rem; color: var(--sh-text-muted); margin: 0;">Use the upload box above to add genuine photos or videos of your service, facilities, or guided routes.</p>
                `;
                mediaEmptyState.style.display = 'block';
            }
            mediaGrid.innerHTML = '';
            return;
        }

        if (filteredMedia.length === 0) {
            if (mediaEmptyState) {
                mediaEmptyState.innerHTML = `
                    <div style="font-size: 2.2rem; margin-bottom: 0.5rem;">📷</div>
                    <h4 style="font-size: 1.05rem; font-weight: 800; color: var(--sh-text-primary); margin: 0 0 0.25rem 0;">No ${currentMediaFilter}s found</h4>
                    <p style="font-size: 0.84rem; color: var(--sh-text-secondary); margin: 0;">Try selecting a different filter option or upload new media using the box above.</p>
                `;
                mediaEmptyState.style.display = 'block';
            }
            mediaGrid.innerHTML = '';
            return;
        }

        if (mediaEmptyState) mediaEmptyState.style.display = 'none';

        // Render Cards
        mediaGrid.innerHTML = filteredMedia.map(item => `
            <div class="sh-media-card" data-media-id="${item.id}">
                <div style="position: relative; height: 160px; overflow: hidden; background: #0F172A; display: flex; align-items: center; justify-content: center;">
                    ${item.url ? `
                        <img src="${item.url}" alt="${item.title}" onerror="this.onerror=null; this.style.display='none'; this.nextElementSibling.style.display='flex';" style="width: 100%; height: 100%; object-fit: cover;">
                        <div style="display: none; width: 100%; height: 100%; align-items: center; justify-content: center; font-size: 2rem; color: #94A3B8;">${item.type === 'video' ? '📹' : '📷'}</div>
                    ` : `
                        <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 2.2rem; color: #94A3B8;">${item.type === 'video' ? '📹' : '📷'}</div>
                    `}
                    ${item.type === 'video' ? `
                        <div class="sh-video-duration-badge">${item.duration || 'Video'}</div>
                        <div class="sh-video-play-overlay">
                            <button type="button" class="btn-media-play" data-id="${item.id}" aria-label="Play video preview">▶</button>
                        </div>
                    ` : ''}
                    <span class="sh-status-badge ${item.statusClass || 'pending'}" style="position: absolute; top: 8px; right: 8px; font-size: 0.68rem; box-shadow: 0 2px 5px rgba(0,0,0,0.25);">
                        ${item.status}
                    </span>
                </div>
                <div class="sh-media-info">
                    <h4 class="sh-media-caption" title="${item.title}">${item.title}</h4>
                    <div style="font-size: 0.74rem; color: var(--sh-text-muted); display: flex; justify-content: space-between; margin-bottom: 0.65rem;">
                        <span>${item.type === 'video' ? '📹 Video' : '📷 Photo'} • ${item.fileSize || 'Standard'}</span>
                        <span>${item.uploadedAt || 'Today'}</span>
                    </div>
                    <div class="sh-media-actions">
                        <button type="button" class="btn-media-action btn-preview-media" data-id="${item.id}" title="Preview Media">
                            👁️ Preview
                        </button>
                        <button type="button" class="btn-media-action btn-delete-media" data-id="${item.id}" title="Remove Media" style="color: #DC2626;">
                            🗑️ Remove
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // Filter pill click handlers
    mediaFilterPills.forEach(pill => {
        pill.addEventListener('click', () => {
            mediaFilterPills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            currentMediaFilter = pill.getAttribute('data-media-filter') || 'all';
            renderMediaGallery();
        });
    });

    if (mediaSortSelect) {
        mediaSortSelect.addEventListener('change', renderMediaGallery);
    }

    // =========================================================================
    // 4. UPLOAD MEDIA CONTROLLER (DRAG/DROP, VALIDATION, TEMPORARY PREVIEW)
    // =========================================================================
    const dropzone = document.getElementById('sh-media-dropzone');
    const fileInput = document.getElementById('sh-media-file-input');
    const uploadDetailsForm = document.getElementById('upload-details-form');
    const uploadPreviewImg = document.getElementById('upload-preview-img');
    const uploadPreviewPlaceholder = document.getElementById('upload-preview-placeholder');
    const uploadCaptionInput = document.getElementById('upload-caption-input');
    const uploadTypeSelect = document.getElementById('upload-type-select');
    const uploadDescInput = document.getElementById('upload-desc-input');
    const btnCancelUpload = document.getElementById('btn-cancel-upload');
    const btnSubmitUpload = document.getElementById('btn-submit-upload');
    const progressContainer = document.getElementById('upload-progress-container');
    const progressPercentage = document.getElementById('upload-progress-percentage');
    const progressFill = document.getElementById('upload-progress-fill');

    let currentSelectedFile = null;
    let currentPreviewUrl = '';

    const allowedMimeTypes = ['image/jpeg', 'image/png', 'video/mp4', 'video/quicktime'];
    const maxFileSizeBytes = 50 * 1024 * 1024; // 50MB

    function handleFileSelection(file) {
        if (!file) return;

        // 1. Format validation
        const fileExt = file.name.split('.').pop().toLowerCase();
        const validExt = ['jpg', 'jpeg', 'png', 'mp4', 'mov'].includes(fileExt);
        const validMime = allowedMimeTypes.includes(file.type);

        if (!validExt && !validMime) {
            alert('Unsupported file format. Please upload JPG, PNG, MP4, or MOV files.');
            if (fileInput) fileInput.value = '';
            return;
        }

        // 2. Size validation
        if (file.size > maxFileSizeBytes) {
            const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
            alert(`File size exceeds 50MB limit. Selected file size: ${sizeMB} MB.`);
            if (fileInput) fileInput.value = '';
            return;
        }

        // Revoke prior temporary object URL
        if (currentPreviewUrl && currentPreviewUrl.startsWith('blob:')) {
            URL.revokeObjectURL(currentPreviewUrl);
            currentPreviewUrl = '';
        }

        currentSelectedFile = file;
        const isVideo = file.type.startsWith('video/') || ['mp4', 'mov'].includes(fileExt);

        if (uploadTypeSelect) {
            uploadTypeSelect.value = isVideo ? 'video' : 'photo';
        }

        if (uploadCaptionInput && !uploadCaptionInput.value.trim()) {
            const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
            uploadCaptionInput.value = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
        }

        if (uploadDetailsForm) {
            uploadDetailsForm.style.display = 'block';
        }

        // Generate genuine temporary browser preview using ObjectURL
        try {
            currentPreviewUrl = URL.createObjectURL(file);
            if (isVideo) {
                if (uploadPreviewImg) uploadPreviewImg.style.display = 'none';
                if (uploadPreviewPlaceholder) {
                    uploadPreviewPlaceholder.style.display = 'flex';
                    uploadPreviewPlaceholder.innerHTML = '<span style="font-size: 2rem;">📹</span><span style="font-size: 0.68rem; color: #94A3B8; display: block; margin-top: 0.2rem;">Video Selected</span>';
                }
            } else {
                if (uploadPreviewImg) {
                    uploadPreviewImg.src = currentPreviewUrl;
                    uploadPreviewImg.style.display = 'block';
                }
                if (uploadPreviewPlaceholder) uploadPreviewPlaceholder.style.display = 'none';
            }
        } catch (err) {
            currentPreviewUrl = '';
        }
    }

    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                handleFileSelection(e.target.files[0]);
            }
        });
    }

    if (dropzone) {
        dropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropzone.classList.add('dragover');
        });
        dropzone.addEventListener('dragleave', () => {
            dropzone.classList.remove('dragover');
        });
        dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropzone.classList.remove('dragover');
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleFileSelection(e.dataTransfer.files[0]);
            }
        });
    }

    function resetUploadForm() {
        if (currentPreviewUrl && currentPreviewUrl.startsWith('blob:')) {
            URL.revokeObjectURL(currentPreviewUrl);
        }
        currentSelectedFile = null;
        currentPreviewUrl = '';
        if (fileInput) fileInput.value = '';
        if (uploadCaptionInput) uploadCaptionInput.value = '';
        if (uploadDescInput) uploadDescInput.value = '';
        if (uploadPreviewImg) {
            uploadPreviewImg.style.display = 'none';
            uploadPreviewImg.src = '';
        }
        if (uploadPreviewPlaceholder) {
            uploadPreviewPlaceholder.style.display = 'flex';
            uploadPreviewPlaceholder.textContent = '📹';
        }
        if (progressContainer) progressContainer.style.display = 'none';
        if (progressFill) progressFill.style.width = '0%';
        if (progressPercentage) progressPercentage.textContent = '0%';
        if (uploadDetailsForm) uploadDetailsForm.style.display = 'none';
    }

    if (btnCancelUpload) {
        btnCancelUpload.addEventListener('click', resetUploadForm);
    }

    if (btnSubmitUpload) {
        btnSubmitUpload.addEventListener('click', async () => {
            if (!currentSelectedFile) {
                alert('Please select a photo or video file to upload.');
                return;
            }

            const caption = uploadCaptionInput ? uploadCaptionInput.value.trim() : '';
            if (!caption) {
                alert('Please provide a caption/title for your media.');
                if (uploadCaptionInput) uploadCaptionInput.focus();
                return;
            }

            const mediaType = uploadTypeSelect ? uploadTypeSelect.value : 'photo';
            const description = uploadDescInput ? uploadDescInput.value.trim() : '';
            const fileSizeStr = `${(currentSelectedFile.size / (1024 * 1024)).toFixed(1)} MB`;

            // Live Backend Media Integration
            if (hasLiveApiToken()) {
                const persistentMediaUrl = (currentPreviewUrl && !currentPreviewUrl.startsWith('blob:'))
                    ? currentPreviewUrl
                    : 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop&q=80';
                try {
                    await window.YatraSetuApi.createStakeholderMedia({
                        media_type: mediaType,
                        title: caption,
                        description: description || 'Stakeholder media submission awaiting official verification.',
                        media_url: persistentMediaUrl
                    });
                    alert(`Media "${caption}" added to catalog (Status: Pending Approval). Only the authorized Destination Manager can verify and grant public approval.`);
                    resetUploadForm();
                    await renderMediaGallery();
                    return;
                } catch (err) {
                    console.error('[stakeholder.js] Media upload error:', err);
                    alert(err.message || 'Failed to upload media.');
                    return;
                }
            }

            // Simulate upload progress in prototype mode
            if (progressContainer) progressContainer.style.display = 'block';
            let progress = 0;
            const timer = setInterval(() => {
                progress += 25;
                if (progressFill) progressFill.style.width = `${progress}%`;
                if (progressPercentage) progressPercentage.textContent = `${progress}%`;

                if (progress >= 100) {
                    clearInterval(timer);

                    const persistentMediaUrl = (currentPreviewUrl && !currentPreviewUrl.startsWith('blob:'))
                        ? currentPreviewUrl
                        : 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop&q=80';

                    const newMediaItem = {
                        id: `med-${Date.now()}`,
                        stakeholder_id: currentUserId,
                        destination_id: destId,
                        type: mediaType,
                        title: caption,
                        description: description || 'Stakeholder media submission awaiting official verification.',
                        url: persistentMediaUrl,
                        duration: mediaType === 'video' ? 'Clip' : '',
                        fileSize: fileSizeStr,
                        fileType: currentSelectedFile.type || 'image/jpeg',
                        uploadedAt: 'Today',
                        status: 'Pending Approval',
                        statusClass: 'pending'
                    };

                    (dataStore.media = dataStore.media || []).unshift(newMediaItem);
                    saveStakeholderMedia(dataStore.media);
                    alert(`Media "${caption}" added to local session as a temporary preview (Status: Pending Approval).`);

                    resetUploadForm();
                    renderMediaGallery();
                }
            }, 80);
        });
    }

    // =========================================================================
    // 5. MEDIA PREVIEW MODAL
    // =========================================================================
    const previewModal = document.getElementById('mediaPreviewModal');
    const closePreviewBtn = document.getElementById('btn-close-media-preview');
    const footerClosePreviewBtn = document.getElementById('btn-footer-close-media-preview');
    const previewModalBadge = document.getElementById('preview-modal-badge');
    const previewModalTitle = document.getElementById('preview-modal-title');
    const previewModalImg = document.getElementById('preview-modal-img');
    const previewModalVideoBox = document.getElementById('preview-modal-video-box');
    const previewModalVideoPoster = document.getElementById('preview-modal-video-poster');
    const previewModalDurationTag = document.getElementById('preview-modal-duration-tag');
    const previewModalMeta = document.getElementById('preview-modal-meta-chips');
    const previewModalDesc = document.getElementById('preview-modal-desc');

    function openMediaPreview(itemId) {
        const item = (dataStore.media || []).find(m => m.id === itemId);
        if (!item || !previewModal) return;

        if (previewModalBadge) {
            previewModalBadge.textContent = `${item.status} Media`;
            previewModalBadge.className = `sh-status-badge ${item.statusClass || 'pending'}`;
        }
        if (previewModalTitle) previewModalTitle.textContent = item.title;
        if (previewModalDesc) previewModalDesc.textContent = item.description || 'No description provided.';

        if (item.type === 'video') {
            if (previewModalImg) previewModalImg.style.display = 'none';
            if (previewModalVideoBox) previewModalVideoBox.style.display = 'flex';
            if (previewModalVideoPoster) previewModalVideoPoster.src = item.url || '';
            if (previewModalDurationTag) previewModalDurationTag.textContent = item.duration || 'Video Clip';
        } else {
            if (previewModalVideoBox) previewModalVideoBox.style.display = 'none';
            if (previewModalImg) {
                previewModalImg.src = item.url || '';
                previewModalImg.style.display = 'block';
            }
        }

        if (previewModalMeta) {
            previewModalMeta.innerHTML = `
                <span class="sh-detail-meta-chip">📍 ${profile.destinationName}</span>
                <span class="sh-detail-meta-chip">🏷️ ${item.type === 'video' ? 'Video' : 'Photo'}</span>
                <span class="sh-detail-meta-chip">💾 ${item.fileSize || 'Standard'}</span>
                <span class="sh-detail-meta-chip">📅 Uploaded: ${item.uploadedAt || 'Today'}</span>
                <span class="sh-detail-meta-chip">🛡️ Status: ${item.status}</span>
            `;
        }

        previewModal.style.display = 'flex';
    }

    function closeMediaPreview() {
        if (previewModal) previewModal.style.display = 'none';
    }

    if (closePreviewBtn) closePreviewBtn.addEventListener('click', closeMediaPreview);
    if (footerClosePreviewBtn) footerClosePreviewBtn.addEventListener('click', closeMediaPreview);
    if (previewModal) {
        previewModal.addEventListener('click', (e) => {
            if (e.target === previewModal) closeMediaPreview();
        });
    }

    // =========================================================================
    // 6. DESTRUCTIVE REMOVAL CONFIRMATION MODAL & OWNERSHIP PROTECTION
    // =========================================================================
    const deleteModal = document.getElementById('deleteConfirmModal');
    const btnCloseDelete = document.getElementById('btn-close-delete-modal');
    const btnCancelDelete = document.getElementById('btn-cancel-delete');
    const btnConfirmDelete = document.getElementById('btn-confirm-delete');
    const deleteModalMessage = document.getElementById('delete-modal-message');

    let pendingDeleteAction = null;

    function openDeleteConfirmation(message, onConfirm) {
        if (!deleteModal) return;
        if (deleteModalMessage) deleteModalMessage.textContent = message;
        pendingDeleteAction = onConfirm;
        deleteModal.style.display = 'flex';
    }

    function closeDeleteModal() {
        if (deleteModal) deleteModal.style.display = 'none';
        pendingDeleteAction = null;
    }

    if (btnCloseDelete) btnCloseDelete.addEventListener('click', closeDeleteModal);
    if (btnCancelDelete) btnCancelDelete.addEventListener('click', closeDeleteModal);
    if (deleteModal) {
        deleteModal.addEventListener('click', (e) => {
            if (e.target === deleteModal) closeDeleteModal();
        });
    }

    if (btnConfirmDelete) {
        btnConfirmDelete.addEventListener('click', () => {
            if (typeof pendingDeleteAction === 'function') {
                pendingDeleteAction();
            }
            closeDeleteModal();
        });
    }

    // Delegated click for Media Preview, Play, and Delete
    document.addEventListener('click', (e) => {
        const previewBtn = e.target.closest('.btn-preview-media, .btn-media-play');
        if (previewBtn) {
            e.preventDefault();
            const id = previewBtn.getAttribute('data-id');
            openMediaPreview(id);
            return;
        }

        const deleteMediaBtn = e.target.closest('.btn-delete-media');
        if (deleteMediaBtn) {
            e.preventDefault();
            const id = deleteMediaBtn.getAttribute('data-id');

            // Live Backend Delete
            if (hasLiveApiToken()) {
                openDeleteConfirmation(
                    `Are you sure you want to remove this media item? This action will permanently remove it from your media catalog.`,
                    async () => {
                        try {
                            await window.YatraSetuApi.deleteStakeholderMedia(id);
                            alert(`Media item successfully removed.`);
                            await renderMediaGallery();
                        } catch (err) {
                            console.error('[stakeholder.js] Media delete error:', err);
                            alert(err.message || 'Failed to remove media.');
                        }
                    }
                );
                return;
            }

            const item = (dataStore.media || []).find(m => m.id === id);
            if (!item) return;

            // Strict Ownership Verification
            if (item.stakeholder_id !== currentUserId) {
                alert(`Unauthorized: You cannot delete media owned by another stakeholder.`);
                return;
            }

            openDeleteConfirmation(
                `Are you sure you want to remove "${item.title}"? This action will permanently remove it from your media catalog.`,
                () => {
                    if (item.url && item.url.startsWith('blob:')) {
                        URL.revokeObjectURL(item.url);
                    }
                    dataStore.media = (dataStore.media || []).filter(m => m.id !== id);
                    saveStakeholderMedia(dataStore.media);
                    alert(`Media item "${item.title}" successfully removed.`);
                    renderMediaGallery();
                }
            );
            return;
        }
    });

    // =========================================================================
    // 7. TAB 2: POSTS & UPDATES CONTROLLER
    // =========================================================================
    const postsList = document.getElementById('sh-posts-list');
    const createPostForm = document.getElementById('sh-create-post-form');

    function renderPostsFeed() {
        if (!postsList) return;
        const posts = (dataStore.posts || []).filter(p => p.destination_id === destId && p.stakeholder_id === currentUserId);

        if (posts.length === 0) {
            postsList.innerHTML = `
                <div style="padding: 2.5rem 1.5rem; text-align: center; color: var(--sh-text-muted);">
                    <div style="font-size: 2rem; margin-bottom: 0.5rem;">📝</div>
                    <h4 style="font-size: 1rem; font-weight: 700; color: var(--sh-text-primary); margin: 0 0 0.25rem 0;">No service updates published yet</h4>
                    <p style="font-size: 0.82rem; color: var(--sh-text-secondary); margin: 0;">Use the form above to share verified trek schedules, seasonal availability, or visitor guidance for ${profile.destinationName}.</p>
                </div>
            `;
            return;
        }

        postsList.innerHTML = posts.map(p => `
            <div style="background: var(--sh-card-bg); border: 1px solid var(--sh-card-border); border-radius: 12px; padding: 1.15rem; margin-bottom: 1rem;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.4rem;">
                    <div>
                        <h4 style="font-size: 0.98rem; font-weight: 700; color: var(--sh-text-primary); margin: 0 0 0.2rem 0;">${p.title}</h4>
                        <span style="font-size: 0.75rem; color: var(--sh-text-muted);">📅 ${p.date} • 📍 ${profile.destinationName}</span>
                    </div>
                    <span class="sh-status-badge ${p.statusClass || 'pending'}" style="font-size: 0.72rem;">${p.status}</span>
                </div>
                <p style="font-size: 0.85rem; color: var(--sh-text-secondary); line-height: 1.5; margin: 0 0 0.75rem 0;">${p.content}</p>
                <div style="display: flex; justify-content: flex-end; border-top: 1px solid #F1F5F9; padding-top: 0.6rem;">
                    <button type="button" class="btn-delete-post" data-id="${p.id}" style="background: none; border: none; color: #DC2626; font-size: 0.78rem; font-weight: 600; cursor: pointer;">
                        🗑️ Delete Post
                    </button>
                </div>
            </div>
        `).join('');

        // Attach Post Delete Handlers
        document.querySelectorAll('.btn-delete-post').forEach(btn => {
            btn.onclick = () => {
                const postId = btn.getAttribute('data-id');
                const targetPost = (dataStore.posts || []).find(p => p.id === postId);
                if (!targetPost) return;

                if (targetPost.stakeholder_id !== currentUserId) {
                    alert('Unauthorized: You cannot delete a post owned by another stakeholder.');
                    return;
                }

                openDeleteConfirmation(`Are you sure you want to delete post "${targetPost.title}"?`, () => {
                    dataStore.posts = (dataStore.posts || []).filter(p => p.id !== postId);
                    saveStakeholderPosts(dataStore.posts);
                    alert('Post removed successfully.');
                    renderPostsFeed();
                });
            };
        });
    }

    if (createPostForm) {
        createPostForm.onsubmit = (e) => {
            e.preventDefault();
            const titleInput = document.getElementById('post-title-input');
            const contentInput = document.getElementById('post-content-input');

            if (!titleInput || !titleInput.value.trim() || !contentInput || !contentInput.value.trim()) {
                alert('Please enter both title and content for your service update.');
                return;
            }

            const newPost = {
                id: `post-${Date.now()}`,
                stakeholder_id: currentUserId,
                destination_id: destId,
                title: titleInput.value.trim(),
                content: contentInput.value.trim(),
                date: 'Today',
                status: 'Pending Approval',
                statusClass: 'pending'
            };

            (dataStore.posts = dataStore.posts || []).unshift(newPost);
            saveStakeholderPosts(dataStore.posts);
            alert('Service update submitted! Status is "Pending Approval" awaiting Destination Manager verification. (Saved in prototype store)');
            createPostForm.reset();
            renderPostsFeed();
        };
    }

    // =========================================================================
    // 8. TAB 3: MANAGE LISTINGS CONTROLLER (CREATE, EDIT, OWNERSHIP CHECK)
    // =========================================================================
    const listingsGrid = document.getElementById('sh-listings-grid');
    const btnOpenCreateListing = document.getElementById('btn-open-create-listing');
    const listingModal = document.getElementById('listingModal');
    const btnCloseListingModal = document.getElementById('btn-close-listing-modal');
    const btnCancelListing = document.getElementById('btn-cancel-listing');
    const btnSaveListingSubmit = document.getElementById('btn-save-listing-submit');
    const listingEditorForm = document.getElementById('listing-editor-form');

    const listingFormId = document.getElementById('listing-form-id');
    const listingFormName = document.getElementById('listing-form-name');
    const listingFormCategory = document.getElementById('listing-form-category');
    const listingFormType = document.getElementById('listing-form-type');
    const listingFormHours = document.getElementById('listing-form-hours');
    const listingFormPrice = document.getElementById('listing-form-price');
    const listingFormAddress = document.getElementById('listing-form-address');
    const listingFormDesc = document.getElementById('listing-form-desc');
    const listingFormImg = document.getElementById('listing-form-img');
    const listingFormStatus = document.getElementById('listing-form-status');
    const listingModalTitle = document.getElementById('listing-modal-title');

    async function renderListingsGrid() {
        if (!listingsGrid) return;

        let listings = [];
        if (hasLiveApiToken()) {
            try {
                const res = await window.YatraSetuApi.getStakeholderOfferings();
                if (Array.isArray(res)) {
                    listings = res.map(off => ({
                        id: off.id,
                        stakeholder_id: profile.id,
                        destination_id: destId,
                        name: off.title,
                        description: off.description || 'Verified service offering.',
                        priceRange: off.price != null ? `${off.price} ${off.pricing_unit || 'per group'}` : 'On Request',
                        category: profile.category || 'Tour & Trekking Guides',
                        type: 'visitor-facing',
                        status: off.is_active ? 'Active' : 'Inactive',
                        statusClass: off.is_active ? 'accepted' : 'pending',
                        address: profile.address || 'Gunjavane Village',
                        hours: profile.hours || '06:00 - 18:00',
                        img: ''
                    }));
                }
            } catch (err) {
                console.error('[stakeholder.js] Error fetching offerings:', err);
            }
        } else {
            // Show only records genuinely registered by the current stakeholder
            listings = (dataStore.listings || []).filter(l => l.destination_id === destId && l.stakeholder_id === currentUserId);
        }

        if (listings.length === 0) {
            listingsGrid.innerHTML = `
                <div style="grid-column: 1 / -1; padding: 3rem 1.5rem; text-align: center; background: var(--sh-card-bg); border: 1px solid var(--sh-card-border); border-radius: 14px;">
                    <div style="font-size: 2.4rem; margin-bottom: 0.5rem;">🏪</div>
                    <h4 style="font-size: 1.1rem; font-weight: 800; color: var(--sh-text-primary); margin: 0 0 0.35rem 0;">No service listings registered yet</h4>
                    <p style="font-size: 0.85rem; color: var(--sh-text-secondary); max-width: 480px; margin: 0 auto 1.25rem auto;">Create a verified service listing for ${profile.destinationName} so visitors can discover your services. All submissions require Destination Manager approval before appearing publicly to tourists.</p>
                    <button type="button" class="btn-sh-orange" id="btn-create-empty-listing">+ Create Your First Service Listing</button>
                </div>
            `;
            const emptyCreateBtn = document.getElementById('btn-create-empty-listing');
            if (emptyCreateBtn) {
                emptyCreateBtn.addEventListener('click', () => openListingModal(null));
            }
            return;
        }

        listingsGrid.innerHTML = listings.map(lst => `
            <div class="sh-listing-card">
                <div style="position: relative; height: 160px; overflow: hidden; background: #0F172A; display: flex; align-items: center; justify-content: center;">
                    ${lst.img ? `
                        <img src="${lst.img}" alt="${lst.name}" onerror="this.onerror=null; this.style.display='none'; this.nextElementSibling.style.display='flex';" style="width: 100%; height: 100%; object-fit: cover;">
                        <div style="display: none; width: 100%; height: 100%; align-items: center; justify-content: center; font-size: 2.2rem; color: #94A3B8;">
                            ${lst.category.includes('Guide') ? '🥾' : lst.category.includes('Stay') ? '🏡' : lst.category.includes('Transport') ? '🚐' : '🏪'}
                        </div>
                    ` : `
                        <div style="width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; background: linear-gradient(135deg, #1E293B, #0F172A); color: #94A3B8;">
                            <span style="font-size: 2.2rem;">${lst.category.includes('Guide') ? '🥾' : lst.category.includes('Stay') ? '🏡' : lst.category.includes('Transport') ? '🚐' : '🏪'}</span>
                            <span style="font-size: 0.72rem; color: #CBD5E1; margin-top: 0.25rem;">No Cover Photo</span>
                        </div>
                    `}
                    <span class="sh-status-badge ${lst.statusClass || 'pending'}" style="position: absolute; top: 10px; right: 10px; font-size: 0.72rem; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">
                        ${lst.status}
                    </span>
                </div>
                <div style="padding: 1.25rem;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.35rem;">
                        <h4 style="font-size: 1.05rem; font-weight: 800; color: var(--sh-text-primary); margin: 0;">${lst.name}</h4>
                        <span style="font-size: 0.78rem; color: var(--sh-text-muted); font-weight: 600;">
                            ${lst.rating ? '⭐ ' + lst.rating : '⭐ Unrated'}
                        </span>
                    </div>
                    <span style="font-size: 0.78rem; color: var(--sh-orange-accent); font-weight: 700; display: block; margin-bottom: 0.65rem;">
                        ${lst.category} • ${lst.type === 'visitor-facing' ? 'Visitor-Facing Service' : 'Information Partner'}
                    </span>
                    <p style="font-size: 0.84rem; color: var(--sh-text-secondary); line-height: 1.5; margin: 0 0 0.85rem 0;">
                        ${lst.description}
                    </p>
                    <div style="font-size: 0.78rem; color: var(--sh-text-muted); margin-bottom: 0.85rem; line-height: 1.6; border-top: 1px solid #F1F5F9; padding-top: 0.65rem;">
                        <div>📍 <strong>Address:</strong> ${lst.address}</div>
                        <div>🕒 <strong>Hours:</strong> ${lst.hours || 'Standard Hours'}</div>
                        <div>💳 <strong>Tariff:</strong> ${lst.priceRange ? '₹ ' + lst.priceRange : 'Free / Inquire'}</div>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #F1F5F9; padding-top: 0.85rem;">
                        <button type="button" class="btn-edit-listing" data-id="${lst.id}" style="background: var(--sh-card-bg); border: 1px solid var(--sh-card-border); padding: 0.4rem 0.85rem; border-radius: 6px; font-weight: 600; font-size: 0.8rem; cursor: pointer;">
                            ✏️ Edit Listing
                        </button>
                        <button type="button" class="btn-delete-listing" data-id="${lst.id}" style="background: none; border: 1px solid #FEE2E2; color: #DC2626; padding: 0.4rem 0.85rem; border-radius: 6px; font-weight: 600; font-size: 0.8rem; cursor: pointer;">
                            🗑️ Delete
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        // Attach Listing Edit & Delete Event Listeners
        document.querySelectorAll('.btn-edit-listing').forEach(btn => {
            btn.onclick = () => {
                const id = btn.getAttribute('data-id');
                const lst = (listings || []).find(l => l.id === id);
                if (!lst) return;

                openListingModal(lst);
            };
        });

        document.querySelectorAll('.btn-delete-listing').forEach(btn => {
            btn.onclick = () => {
                const id = btn.getAttribute('data-id');
                const lst = (listings || []).find(l => l.id === id);
                if (!lst) return;

                if (hasLiveApiToken()) {
                    openDeleteConfirmation(`Are you sure you want to remove listing "${lst.name}"?`, async () => {
                        try {
                            await window.YatraSetuApi.deleteStakeholderOffering(id);
                            alert(`Listing "${lst.name}" successfully removed.`);
                            await renderListingsGrid();
                        } catch (err) {
                            console.error('[stakeholder.js] Offering delete error:', err);
                            alert(err.message || 'Failed to remove listing.');
                        }
                    });
                    return;
                }

                // Strict Ownership Verification in prototype store
                if (lst.stakeholder_id !== currentUserId) {
                    alert(`Unauthorized: You cannot delete a listing owned by another stakeholder.`);
                    return;
                }

                openDeleteConfirmation(`Are you sure you want to remove listing "${lst.name}"?`, () => {
                    dataStore.listings = (dataStore.listings || []).filter(l => l.id !== id);
                    saveStakeholderListings(dataStore.listings);
                    alert(`Listing "${lst.name}" successfully removed.`);
                    renderListingsGrid();
                });
            };
        });
    }

    function openListingModal(listingToEdit) {
        if (!listingModal) return;

        if (listingToEdit) {
            if (listingModalTitle) listingModalTitle.textContent = 'Edit Service Listing';
            if (listingFormId) listingFormId.value = listingToEdit.id;
            if (listingFormName) listingFormName.value = listingToEdit.name || '';
            if (listingFormCategory) listingFormCategory.value = listingToEdit.category || 'Tour & Trekking Guides';
            if (listingFormType) listingFormType.value = listingToEdit.type || 'visitor-facing';
            if (listingFormHours) listingFormHours.value = listingToEdit.hours || '';
            if (listingFormPrice) listingFormPrice.value = listingToEdit.priceRange || '';
            if (listingFormAddress) listingFormAddress.value = listingToEdit.address || '';
            if (listingFormDesc) listingFormDesc.value = listingToEdit.description || '';
            if (listingFormImg) listingFormImg.value = listingToEdit.img || '';
            if (listingFormStatus) listingFormStatus.value = listingToEdit.status === 'Draft' ? 'Draft' : 'Pending Approval';
        } else {
            if (listingModalTitle) listingModalTitle.textContent = 'Create New Service Listing';
            if (listingEditorForm) listingEditorForm.reset();
            if (listingFormId) listingFormId.value = '';
            if (listingFormAddress) listingFormAddress.value = profile.address || '';
            if (listingFormHours) listingFormHours.value = profile.hours || '';
            if (listingFormPrice) listingFormPrice.value = profile.priceRange || '';
            if (listingFormStatus) listingFormStatus.value = 'Pending Approval';
        }

        listingModal.style.display = 'flex';
    }

    function closeListingModal() {
        if (listingModal) listingModal.style.display = 'none';
    }

    if (btnOpenCreateListing) {
        btnOpenCreateListing.addEventListener('click', () => openListingModal(null));
    }
    if (btnCloseListingModal) btnCloseListingModal.addEventListener('click', closeListingModal);
    if (btnCancelListing) btnCancelListing.addEventListener('click', closeListingModal);
    if (listingModal) {
        listingModal.addEventListener('click', (e) => {
            if (e.target === listingModal) closeListingModal();
        });
    }

    if (btnSaveListingSubmit) {
        btnSaveListingSubmit.addEventListener('click', async () => {
            const name = listingFormName ? listingFormName.value.trim() : '';
            const address = listingFormAddress ? listingFormAddress.value.trim() : '';
            const desc = listingFormDesc ? listingFormDesc.value.trim() : '';

            if (!name) {
                alert('Please provide a listing/service name.');
                if (listingFormName) listingFormName.focus();
                return;
            }
            if (!address) {
                alert('Please specify the base location or pickup point.');
                if (listingFormAddress) listingFormAddress.focus();
                return;
            }
            if (!desc) {
                alert('Please describe your service offering.');
                if (listingFormDesc) listingFormDesc.focus();
                return;
            }

            // Live Backend Offering Creation
            if (hasLiveApiToken()) {
                try {
                    const priceRaw = listingFormPrice ? listingFormPrice.value.replace(/[^0-9.]/g, '') : '';
                    const numericPrice = parseFloat(priceRaw);
                    await window.YatraSetuApi.createStakeholderOffering({
                        title: name,
                        description: desc,
                        price: isNaN(numericPrice) ? null : numericPrice,
                        pricing_unit: 'per group'
                    });
                    alert(`New service listing "${name}" registered successfully!`);
                    closeListingModal();
                    await renderListingsGrid();
                    return;
                } catch (err) {
                    console.error('[stakeholder.js] Offering save error:', err);
                    alert(err.message || 'Failed to create service listing.');
                    return;
                }
            }

            const existingId = listingFormId ? listingFormId.value : '';
            const statusVal = listingFormStatus ? listingFormStatus.value : 'Pending Approval';
            const statusClass = statusVal === 'Draft' ? 'review' : 'pending';

            if (existingId) {
                // Edit existing listing
                const lst = (dataStore.listings || []).find(l => l.id === existingId);
                if (lst) {
                    if (lst.stakeholder_id !== currentUserId) {
                        alert('Unauthorized: You cannot edit a listing owned by another stakeholder.');
                        return;
                    }
                    lst.name = name;
                    lst.category = listingFormCategory ? listingFormCategory.value : lst.category;
                    lst.type = listingFormType ? listingFormType.value : lst.type;
                    lst.hours = listingFormHours ? listingFormHours.value.trim() : lst.hours;
                    lst.priceRange = listingFormPrice ? listingFormPrice.value.trim() : lst.priceRange;
                    lst.address = address;
                    lst.description = desc;
                    lst.img = listingFormImg && listingFormImg.value.trim() ? listingFormImg.value.trim() : '';
                    lst.status = statusVal;
                    lst.statusClass = statusClass;

                    saveStakeholderListings(dataStore.listings);
                    alert(`Listing "${name}" updated! Status set to "${statusVal}". Note: Only the authorized Destination Manager can grant public approval for this destination.`);
                }
            } else {
                // Create new listing (Default: Pending Approval)
                const newListing = {
                    id: `lst-${Date.now()}`,
                    stakeholder_id: currentUserId,
                    destination_id: destId,
                    name: name,
                    type: listingFormType ? listingFormType.value : 'visitor-facing',
                    category: listingFormCategory ? listingFormCategory.value : 'Tour & Trekking Guides',
                    contactPerson: profile.contactPerson || profile.userName,
                    phone: profile.phone,
                    email: profile.email,
                    address: address,
                    hours: listingFormHours ? listingFormHours.value.trim() : 'Mon - Sun (06:00 - 18:00)',
                    priceRange: listingFormPrice ? listingFormPrice.value.trim() : 'On Request',
                    description: desc,
                    status: statusVal,
                    statusClass: statusClass,
                    rating: null,
                    img: listingFormImg && listingFormImg.value.trim() ? listingFormImg.value.trim() : ''
                };

                (dataStore.listings = dataStore.listings || []).unshift(newListing);
                saveStakeholderListings(dataStore.listings);
                alert(`New listing "${name}" submitted with status "${statusVal}". Note: Only the authorized Destination Manager can grant public approval for this destination. (Saved in prototype store)`);
            }

            closeListingModal();
            renderListingsGrid();
        });
    }

    // Keyboard ESC listener for all media modals
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (previewModal && previewModal.style.display === 'flex') closeMediaPreview();
            if (deleteModal && deleteModal.style.display === 'flex') closeDeleteModal();
            if (listingModal && listingModal.style.display === 'flex') closeListingModal();
        }
    });

    // Initial Gallery Render
    await renderMediaGallery();
}
