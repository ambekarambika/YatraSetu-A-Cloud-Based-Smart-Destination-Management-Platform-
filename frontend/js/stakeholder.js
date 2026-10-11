/**
 * YatraSetu — Tourism Stakeholder Hub Controller (stakeholder.js)
 * Manages active stakeholder identity, destination-scoped filtering, profile forms,
 * destination assignment catalog resolution, live preview cards, manager suggestions,
 * and tourist review responses.
 * Dependencies: manager-data.js, stakeholder-data.js
 */

document.addEventListener('DOMContentLoaded', () => {
    initStakeholderContext();
    initStakeholderSidebar();
    initStakeholderOverview();
    initStakeholderProfilePage();
    initStakeholderDestinationUpdates();
    initStakeholderConnectionsReviews();
});

/**
 * 1. Active User Identity & Destination Context Initialization
 */
function initStakeholderContext() {
    const dataStore = window.YatraSetuStakeholderData || {};
    const profile = dataStore.profile || {};
    const managerData = window.YatraSetuManagerData || {};

    // Session Overrides from auth.js if available
    const sessionEmail = sessionStorage.getItem('yatrasetu_email');
    const sessionName = sessionStorage.getItem('yatrasetu_name');
    const sessionOrg = sessionStorage.getItem('yatrasetu_org') || sessionStorage.getItem('yatrasetu_organization');
    const sessionRole = sessionStorage.getItem('yatrasetu_role');
    const sessionDestId = sessionStorage.getItem('yatrasetu_destination_id');

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

    // Destination Resolution
    // Priority:
    // 1) sessionStorage 'yatrasetu_destination_id' if explicitly set
    // 2) profile.destinationId from stakeholder-data.js
    let targetDestId = sessionDestId !== null ? sessionDestId : profile.destinationId;

    if (targetDestId && targetDestId !== 'unassigned' && targetDestId !== '') {
        const foundDest = (managerData.destinations || []).find(d => d.id === targetDestId);
        if (foundDest) {
            profile.destinationId = foundDest.id;
            profile.destinationName = foundDest.name;
            profile.destinationImg = foundDest.img;
            const foundState = (managerData.states || []).find(s => s.id === foundDest.state_id);
            profile.stateName = foundState ? foundState.name : foundDest.state_id;
        } else {
            profile.destinationId = null;
            profile.destinationName = 'No Destination Assigned';
            profile.stateName = 'Unassigned Destination';
            profile.destinationImg = '';
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
function initStakeholderOverview() {
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

    // Destination-Scoped Announcements & Events
    const announcements = (dataStore.announcements || []).filter(a => a.destination_id === destId);
    const events = (managerCatalog.events || []).filter(e => e.destination_id === destId);
    const suggestions = (dataStore.suggestions || []).filter(s => s.destination_id === destId && s.status === 'Pending');

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

    const handleProfileSave = (e) => {
        if (e) e.preventDefault();

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

        // Save Destination Context to Session
        if (chosenDestId) {
            sessionStorage.setItem('yatrasetu_destination_id', chosenDestId);
            profile.destinationId = chosenDestId;
        } else {
            sessionStorage.setItem('yatrasetu_destination_id', 'unassigned');
            profile.destinationId = null;
        }

        // Save User & Org to Session
        sessionStorage.setItem('yatrasetu_name', profile.contactPerson);
        sessionStorage.setItem('yatrasetu_org', profile.organizationName);
        sessionStorage.setItem('yatrasetu_organization', profile.organizationName);

        // Re-initialize context to update sidebar and badges
        initStakeholderContext();
        renderLivePreview(radioVisitor ? radioVisitor.checked : true);

        alert('Profile and operating destination updated successfully! (Changes saved to active browser session)');
    };

    if (saveBtn) saveBtn.addEventListener('click', handleProfileSave);
    if (profileForm) profileForm.addEventListener('submit', handleProfileSave);
}

/**
 * 5. Destination Updates Controller (destination-updates.html)
 */
function initStakeholderDestinationUpdates() {
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
    const rawAnnouncements = (dataStore.announcements || []).filter(a => a.destination_id === destId);
    const rawAttractions = (managerCatalog.attractions || []).filter(a => a.destination_id === destId);
    const rawEvents = (managerCatalog.events || []).filter(e => e.destination_id === destId);

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
                modalImg.onerror = function() {
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
                modalImg.onerror = function() {
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
function initStakeholderConnectionsReviews() {
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
    function renderSuggestionsTable() {
        if (!suggestionsTable) return;

        if (!destId) {
            suggestionsTable.innerHTML = '<tr><td colspan="5" style="padding: 2rem; text-align: center; color: var(--sh-text-muted);">No destination assigned. Assign your operating destination in My Business Profile before coordinating with Destination Managers.</td></tr>';
            return;
        }

        const suggestions = (dataStore.suggestions || []).filter(s => s.destination_id === destId);

        if (suggestions.length === 0) {
            suggestionsTable.innerHTML = `<tr><td colspan="5" style="padding: 1.75rem; text-align: center; color: var(--sh-text-muted);">No suggestions submitted for ${profile.destinationName} yet. Use the "+ Suggest Update" button above.</td></tr>`;
        } else {
            suggestionsTable.innerHTML = suggestions.map(s => `
                <tr style="border-bottom: 1px solid var(--sh-card-border); font-size: 0.85rem;">
                    <td style="padding: 0.85rem 1rem; font-weight: 700; color: var(--sh-text-primary);">${s.topic}</td>
                    <td style="padding: 0.85rem 1rem; color: var(--sh-text-secondary);">${s.suggestionText}</td>
                    <td style="padding: 0.85rem 1rem; color: var(--sh-text-muted);">${s.submittedAt}</td>
                    <td style="padding: 0.85rem 1rem;">
                        <span class="sh-status-badge ${s.statusClass || 'pending'}">${s.status}</span>
                    </td>
                    <td style="padding: 0.85rem 1rem; color: var(--sh-text-muted);">${s.managerNote}</td>
                </tr>
            `).join('');
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

    renderSuggestionsTable();
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
        sugForm.onsubmit = (e) => {
            e.preventDefault();
            const topicInput = document.getElementById('sug-topic-input');
            const textInput = document.getElementById('sug-text-input');

            if (!topicInput || !topicInput.value.trim() || !textInput || !textInput.value.trim()) {
                alert('Please enter both topic and suggestion details.');
                return;
            }

            const newSug = {
                id: `sug-${Date.now()}`,
                destination_id: destId,
                topic: topicInput.value.trim(),
                suggestionText: textInput.value.trim(),
                submittedAt: 'Today',
                status: 'Pending',
                statusClass: 'pending',
                managerNote: 'Pending Manager Review (Prototype)'
            };

            (dataStore.suggestions = dataStore.suggestions || []).unshift(newSug);
            alert('Suggestion submitted to Destination Manager! (Saved in prototype store)');
            if (sugModal) sugModal.style.display = 'none';
            sugForm.reset();
            renderSuggestionsTable();
            initStakeholderOverview();
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
