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
        const savedState = sessionStorage.getItem('yatrasetu_active_state_id') || sessionStorage.getItem('yatrasetu_state_theme') || 'maharashtra';
        const savedDest = sessionStorage.getItem('yatrasetu_active_dest_id') || 'all';
        const savedScope = sessionStorage.getItem('yatrasetu_manager_scope') || 'state';
        const savedRole = sessionStorage.getItem('yatrasetu_manager_role') || 'state_manager';

        this._state.activeStateId = STATE_CONFIGS[savedState] ? savedState : 'maharashtra';
        this._state.activeDestinationId = savedDest;
        this._state.managerScope = savedScope;
        this._state.managerRole = savedRole;

        this.applyContextToDOM();
        this.bindSelectors();
        this.bindDestinationCards();
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
        renderConnectedViews(this._state);
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
    },

    bindDestinationCards() {
        document.addEventListener('click', (e) => {
            const card = e.target.closest('[data-destination-id], .destination-card, .ranking-item');
            if (card) {
                const destId = card.getAttribute('data-destination-id') || 
                               card.getAttribute('data-destination') || 
                               card.querySelector('.destination-title, h3, span')?.textContent?.trim().toLowerCase().replace(/\s+/g, '-');
                if (destId) {
                    const parentState = card.getAttribute('data-state-id') || this._state.activeStateId;
                    this.setDestination(destId, parentState);
                    const navHref = card.getAttribute('data-href');
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
 * Connected View Renderer Engine for Manager Subpages
 */
async function renderConnectedViews(context) {
    if (!context || typeof window.YatraSetuManagerStore === 'undefined') return;
    const { activeStateId, activeDestinationId } = context;
    const config = STATE_CONFIGS[activeStateId] || STATE_CONFIGS['maharashtra'];

    const formattedStateName = config.badge.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    const destLabel = activeDestinationId !== 'all' ? activeDestinationId.replace(/-/g, ' ').toUpperCase() : formattedStateName;

    // Update subpage header subtitles to reflect active state/destination context
    const pageSubtitles = document.querySelectorAll('.page-title-group p');
    pageSubtitles.forEach(p => {
        const text = p.textContent || '';
        if (text.match(/in|across|for/i)) {
            p.textContent = text.replace(/(in|across|for)\s+[\w\s&]+/i, `$1 ${destLabel}`);
        } else {
            p.textContent = `${text} for ${destLabel}`;
        }
    });

    // 0. DASHBOARD OVERVIEW VIEW (dashboard.html)
    const dashboardDestGrid = document.querySelector('.destinations-directory-grid');
    if (dashboardDestGrid) {
        const destinations = await window.YatraSetuManagerStore.getDestinations(activeStateId);
        if (destinations && destinations.length > 0) {
            dashboardDestGrid.innerHTML = destinations.slice(0, 4).map((dest, i) => `
                <div class="dest-directory-card" data-destination-id="${dest.id}" data-state-id="${activeStateId}" style="cursor: pointer;">
                    <div class="dest-card-thumb" style="background-image: url('${config.heroImg}'); background-size: cover; background-position: center; height: 160px;"></div>
                    <div class="dest-card-body" style="padding: 1rem;">
                        <h4 style="font-size: 1.05rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.25rem;">${dest.name}</h4>
                        <p style="font-size: 0.8rem; color: var(--text-muted);">${formattedStateName} Destination • Rank #${dest.rank}</p>
                    </div>
                </div>
            `).join('');
        }
    }

    const metricCards = document.querySelectorAll('.metrics-grid-4 .metric-card');
    if (metricCards && metricCards.length >= 4) {
        const destinations = await window.YatraSetuManagerStore.getDestinations(activeStateId);
        const events = await window.YatraSetuManagerStore.getEvents(activeStateId, activeDestinationId);
        const activeDestVal = metricCards[2].querySelector('.metric-value');
        if (activeDestVal) activeDestVal.textContent = destinations.length;
        const upcomingEventsVal = metricCards[3].querySelector('.metric-value');
        if (upcomingEventsVal) upcomingEventsVal.textContent = events.length;
    }

    // 1. DESTINATIONS VIEW (destinations.html)
    const destHeroTitle = document.querySelector('.destination-hero-banner .hero-title');
    const destHeroSub = document.querySelector('.destination-hero-banner .hero-subtitle');
    const destHeroBg = document.querySelector('.destination-hero-banner .destination-hero-bg');
    if (destHeroTitle && config.topDestinations && config.topDestinations.length > 0) {
        destHeroTitle.textContent = config.topDestinations[0].name;
        if (destHeroSub) destHeroSub.textContent = `${config.topDestinations[0].name}, ${formattedStateName} • Scenic destination in ${formattedStateName}`;
        if (destHeroBg && config.heroImg) destHeroBg.style.backgroundImage = `url('${config.heroImg}')`;
    }

    const destGrid = document.querySelector('#destinations-cards-grid');
    if (destGrid) {
        const destinations = await window.YatraSetuManagerStore.getDestinations(activeStateId);
        if (destinations && destinations.length > 0) {
            destGrid.innerHTML = destinations.map(dest => `
                <div class="dest-card" data-destination-id="${dest.id}" data-state-id="${activeStateId}" style="cursor: pointer;">
                    <div class="dest-card-media" style="background-image: url('${config.heroImg}');">
                        <span class="dest-card-tag">Heritage • Tourism</span>
                        <span class="dest-card-rating">--</span>
                    </div>
                    <div class="dest-card-body">
                        <h3 class="dest-card-title">${dest.name}</h3>
                        <span class="dest-card-loc">${formattedStateName} • Destination</span>
                        <div class="dest-card-stats">
                            <span>🏛️ Rank #${dest.rank}</span>
                            <span>📅 Active</span>
                        </div>
                    </div>
                </div>
            `).join('');
        } else {
            destGrid.innerHTML = `<div style="grid-column: 1 / -1; padding: 2.5rem; text-align: center; color: #64748b; font-weight: 500;">No destination records available for ${formattedStateName}.</div>`;
        }
    }

    // 2. ATTRACTIONS VIEW (attractions.html)
    const attractionsTableBody = document.querySelector('#attractions-table-body');
    if (attractionsTableBody) {
        const attractions = await window.YatraSetuManagerStore.getAttractions(activeStateId, activeDestinationId);
        if (attractions && attractions.length > 0) {
            attractionsTableBody.innerHTML = attractions.map(attr => `
                <tr data-category="${attr.category.toLowerCase()}" data-status="open">
                    <td>
                        <div class="poi-cell">
                            <img src="${config.heroImg}" alt="${attr.name}" class="poi-thumb">
                            <div>
                                <div class="poi-name">${attr.name}</div>
                                <div class="poi-meta">${formattedStateName}</div>
                            </div>
                        </div>
                    </td>
                    <td>${attr.destination_id}</td>
                    <td>${attr.category}</td>
                    <td>--</td>
                    <td><span class="status-pill active">Open</span></td>
                    <td style="text-align: right;"><button class="btn-sm btn-outline">Manage</button></td>
                </tr>
            `).join('');
        } else {
            attractionsTableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 2.5rem; color: #64748b; font-weight: 500;">No attraction records available for ${activeDestinationId !== 'all' ? activeDestinationId : formattedStateName}.</td></tr>`;
        }
    }

    // 3. EVENTS VIEW (events.html)
    const featuredEventTitle = document.querySelector('.event-featured-card h2');
    const featuredEventP = document.querySelector('.event-featured-card p');
    const featuredEventMedia = document.querySelector('.event-featured-media');
    if (featuredEventTitle && config.events && config.events.length > 0) {
        featuredEventTitle.textContent = config.events[0].title;
        if (featuredEventP) featuredEventP.innerHTML = `📍 <strong>${config.events[0].dateNum} ${config.events[0].dateMonth}</strong> • ${config.events[0].loc}`;
        if (featuredEventMedia && config.events[0].img) featuredEventMedia.style.backgroundImage = `url('${config.events[0].img}')`;
    }

    const upcomingEventsContainer = document.querySelector('#upcoming-events-container');
    if (upcomingEventsContainer) {
        const events = await window.YatraSetuManagerStore.getEvents(activeStateId, activeDestinationId);
        if (events && events.length > 0) {
            upcomingEventsContainer.innerHTML = events.map(ev => `
                <div class="event-timeline-card">
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <div class="event-date-box">
                            <span class="event-date-num">${ev.dateNum}</span>
                            <span class="event-date-month">${ev.dateMonth}</span>
                        </div>
                        <div>
                            <h4 style="font-size: 0.95rem; font-weight: 800; color: var(--text-primary);">${ev.title}</h4>
                            <span style="font-size: 0.78rem; color: var(--text-muted);">${ev.location}</span>
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                        <span class="status-pill ${ev.statusClass}">${ev.status}</span>
                    </div>
                </div>
            `).join('');
        } else {
            upcomingEventsContainer.innerHTML = `<div style="padding: 2.5rem; text-align: center; color: #64748b; font-weight: 500;">No event records available for ${activeDestinationId !== 'all' ? activeDestinationId : formattedStateName}.</div>`;
        }
    }

    // 4. STAKEHOLDERS VIEW (stakeholders.html)
    const stakeholdersTableBody = document.querySelector('#stakeholders-table-body');
    if (stakeholdersTableBody) {
        const stakeholders = await window.YatraSetuManagerStore.getStakeholders(activeStateId, activeDestinationId);
        if (stakeholders && stakeholders.length > 0) {
            stakeholdersTableBody.innerHTML = stakeholders.map(sh => `
                <tr>
                    <td><strong>${sh.name}</strong></td>
                    <td>${sh.category}</td>
                    <td>${sh.destination}</td>
                    <td>${sh.contact}</td>
                    <td><span class="status-pill active">Active</span></td>
                    <td style="text-align: right;"><button class="btn-sm btn-outline">View</button></td>
                </tr>
            `).join('');
        } else {
            stakeholdersTableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 2.5rem; color: #64748b; font-weight: 500;">No stakeholder records available for ${activeDestinationId !== 'all' ? activeDestinationId : formattedStateName}.</td></tr>`;
        }
    }

    // 5. VISITOR STATISTICS VIEW (visitor-statistics.html)
    const visitorOriginLabel = document.getElementById('visitor-origin-state-label');
    if (visitorOriginLabel) {
        visitorOriginLabel.innerHTML = `<span class="legend-dot" style="background: var(--state-accent);"></span> ${formattedStateName}`;
    }

    // 6. FEEDBACK VIEW (feedback.html)
    const feedbackContainer = document.querySelector('#feedback-list-container');
    if (feedbackContainer) {
        const feedback = await window.YatraSetuManagerStore.getFeedback(activeStateId, activeDestinationId);
        if (feedback && feedback.length > 0) {
            feedbackContainer.innerHTML = feedback.map(fb => `
                <div class="feedback-item-card">
                    <div class="feedback-author-row">
                        <div class="author-info">
                            <div class="author-avatar">${fb.author ? fb.author.slice(0, 2).toUpperCase() : 'VS'}</div>
                            <div>
                                <h4 style="font-size: 0.88rem; font-weight: 700; color: var(--text-primary);">${fb.author || 'Visitor'}</h4>
                                <span style="font-size: 0.75rem; color: var(--text-muted);">${fb.date || 'Recently'} • ${fb.destination}</span>
                            </div>
                        </div>
                        <div style="display: flex; align-items: center; gap: 0.75rem;">
                            <span style="color: #F59E0B; font-size: 0.85rem;">★★★★★</span>
                            <span class="badge badge-success">Positive</span>
                        </div>
                    </div>
                    <p style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.5;">${fb.text}</p>
                </div>
            `).join('');
        } else {
            feedbackContainer.innerHTML = `<div style="padding: 2.5rem; text-align: center; color: #64748b; font-weight: 500;">No visitor feedback records available for ${activeDestinationId !== 'all' ? activeDestinationId : formattedStateName}.</div>`;
        }
    }

    // 7. ANALYTICS VIEW (analytics.html)
    const analyticsTopList = document.querySelector('#analytics-top-destinations-list');
    if (analyticsTopList && config.topDestinations && config.topDestinations.length > 0) {
        analyticsTopList.innerHTML = config.topDestinations.map((dest, i) => `
            <div class="ranking-item">
                <div class="ranking-meta">
                    <span>${dest.name}</span>
                    <span>Rank #${dest.num || i + 1}</span>
                </div>
                <div class="ranking-track">
                    <div class="ranking-fill" style="width: ${Math.max(30, 85 - i * 14)}%;"></div>
                </div>
            </div>
        `).join('');
    }

    // 8. REPORTS VIEW (reports.html)
    const reportCardDescs = document.querySelectorAll('#reports-card-grid .report-item-card p');
    if (reportCardDescs && reportCardDescs.length >= 5) {
        const reportTemplates = [
            `Comprehensive tourism statistics and insights across ${formattedStateName} state circuits.`,
            `Individual destination footfall analysis, carrying capacity, and visitor density for ${formattedStateName}.`,
            `Visitor origin, stay duration, and demographic analysis for ${formattedStateName} state planning.`,
            `Event statistics, visitor turnout, and economic impact analysis for ${formattedStateName} festivals.`,
            `Tourism ecosystem analysis, partner registration status, and service coverage in ${formattedStateName}.`
        ];
        reportCardDescs.forEach((p, idx) => {
            if (reportTemplates[idx]) {
                p.textContent = reportTemplates[idx];
            }
        });
    }

    // 9. DECISION SUPPORT VIEW (decision-support.html)
    const signalsContainer = document.querySelector('#decision-support-signals-container');
    if (signalsContainer) {
        const firstEvent = (config.events && config.events[0]) ? config.events[0] : { title: `${formattedStateName} Cultural Festival`, loc: formattedStateName };
        const dest1 = (config.topDestinations && config.topDestinations[0]) ? config.topDestinations[0].name : formattedStateName;
        const dest2 = (config.topDestinations && config.topDestinations[1]) ? config.topDestinations[1].name : dest1;

        signalsContainer.innerHTML = `
            <div class="decision-signal-card" style="border-left-color: #3B82F6;">
                <div class="signal-header">
                    <div style="display: flex; align-items: center; gap: 0.65rem;">
                        <span style="font-size: 1.2rem;">📈</span>
                        <h3 class="signal-title">Visitor Activity Surge</h3>
                    </div>
                    <span class="badge badge-info">Festival Event</span>
                </div>
                <div class="signal-grid">
                    <div class="signal-box">
                        <span class="signal-box-lbl" style="color: #3B82F6;">DATA SIGNAL</span>
                        <p class="signal-box-txt">Visitor numbers increased by 32% during the ${firstEvent.title} period.</p>
                    </div>
                    <div class="signal-box">
                        <span class="signal-box-lbl">OBSERVATION</span>
                        <p class="signal-box-txt">Overcrowding spike in visitors across ${firstEvent.loc}.</p>
                    </div>
                    <div class="signal-box" style="background: #EFF6FF; border-color: #BFDBFE;">
                        <span class="signal-box-lbl" style="color: #1D4ED8;">MANAGEMENT CONSIDERATION</span>
                        <p class="signal-box-txt" style="color: #1E3A8A; font-weight: 500;">Review crowd-management arrangements, transport facilities, and waste-management for future event periods in ${formattedStateName}.</p>
                    </div>
                </div>
            </div>

            <div class="decision-signal-card" style="border-left-color: #8B5CF6;">
                <div class="signal-header">
                    <div style="display: flex; align-items: center; gap: 0.65rem;">
                        <span style="font-size: 1.2rem;">⚡</span>
                        <h3 class="signal-title">Emerging Destination Interest</h3>
                    </div>
                    <span class="badge badge-warning">High Growth</span>
                </div>
                <div class="signal-grid">
                    <div class="signal-box">
                        <span class="signal-box-lbl" style="color: #8B5CF6;">DATA SIGNAL</span>
                        <p class="signal-box-txt">Interest in ${dest1} increased by 45% in the last quarter.</p>
                    </div>
                    <div class="signal-box">
                        <span class="signal-box-lbl">OBSERVATION</span>
                        <p class="signal-box-txt">Growing popularity among travelers visiting ${formattedStateName}.</p>
                    </div>
                    <div class="signal-box" style="background: #F5F3FF; border-color: #DDD6FE;">
                        <span class="signal-box-lbl" style="color: #6D28D9;">MANAGEMENT CONSIDERATION</span>
                        <p class="signal-box-txt" style="color: #4C1D95; font-weight: 500;">Consider infrastructure improvements and additional tourism services in ${dest1}.</p>
                    </div>
                </div>
            </div>

            <div class="decision-signal-card" style="border-left-color: var(--state-accent);">
                <div class="signal-header">
                    <div style="display: flex; align-items: center; gap: 0.65rem;">
                        <span style="font-size: 1.2rem;">🏔️</span>
                        <h3 class="signal-title">Seasonal Transition Signal</h3>
                    </div>
                    <span class="badge badge-success">Seasonal Trend</span>
                </div>
                <div class="signal-grid">
                    <div class="signal-box">
                        <span class="signal-box-lbl" style="color: var(--state-accent);">DATA SIGNAL</span>
                        <p class="signal-box-txt">Queries for ${dest2} up by 58% for the upcoming seasonal window.</p>
                    </div>
                    <div class="signal-box">
                        <span class="signal-box-lbl">OBSERVATION</span>
                        <p class="signal-box-txt">Higher demand for heritage and eco-trails across ${formattedStateName}.</p>
                    </div>
                    <div class="signal-box" style="background: var(--state-accent-light); border-color: var(--state-accent-border);">
                        <span class="signal-box-lbl" style="color: var(--state-accent-hover);">MANAGEMENT CONSIDERATION</span>
                        <p class="signal-box-txt" style="color: var(--text-primary); font-weight: 500;">Deploy safety marshals and coordinate with local tourism operators in ${dest2}.</p>
                    </div>
                </div>
            </div>
        `;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initDestinationStateContext();
    initManagerModals();
    initTableSearchAndFilters();
    initReportGenerator();
});

/**
 * YatraSetu — Temporary Relational Data Access Adapter
 * Exposes API-shaped relational query functions filtering strictly by state_id and destination_id.
 * Queries existing records without expanding or duplicating fake domain data.
 */
window.YatraSetuManagerStore = {
    async getDestinations(stateId) {
        if (!stateId || !STATE_CONFIGS[stateId]) return [];
        const config = STATE_CONFIGS[stateId];
        return (config.topDestinations || []).map(dest => ({
            id: dest.name.toLowerCase().replace(/\s+/g, '-'),
            state_id: stateId,
            name: dest.name,
            rank: dest.num
        }));
    },

    async getAttractions(stateId, destinationId = 'all') {
        if (!stateId || !STATE_CONFIGS[stateId]) return [];
        const config = STATE_CONFIGS[stateId];
        const attractions = (config.topDestinations || []).map(dest => ({
            id: `attr-${dest.name.toLowerCase().replace(/\s+/g, '-')}`,
            state_id: stateId,
            destination_id: dest.name.toLowerCase().replace(/\s+/g, '-'),
            name: dest.name,
            category: 'Heritage'
        }));
        if (destinationId && destinationId !== 'all') {
            return attractions.filter(a => a.destination_id === destinationId || a.destination_id.includes(destinationId));
        }
        return attractions;
    },

    async getEvents(stateId, destinationId = 'all') {
        if (!stateId || !STATE_CONFIGS[stateId]) return [];
        const config = STATE_CONFIGS[stateId];
        const events = (config.events || []).map((ev, idx) => ({
            id: `event-${stateId}-${idx + 1}`,
            state_id: stateId,
            destination_id: ev.loc ? ev.loc.toLowerCase().split(',')[0].trim().replace(/\s+/g, '-') : 'all',
            title: ev.title,
            dateNum: ev.dateNum,
            dateMonth: ev.dateMonth,
            location: ev.loc,
            status: ev.status,
            statusClass: ev.statusClass,
            img: ev.img
        }));
        if (destinationId && destinationId !== 'all') {
            return events.filter(e => e.destination_id === destinationId || e.destination_id.includes(destinationId));
        }
        return events;
    },

    async getStakeholders(stateId, destinationId = 'all') {
        if (!stateId || !STATE_CONFIGS[stateId]) return [];
        return [];
    },

    async getVisitorStats(stateId, destinationId = 'all') {
        if (!stateId || !STATE_CONFIGS[stateId]) return null;
        return {
            state_id: stateId,
            destination_id: destinationId || 'all',
            weather: STATE_CONFIGS[stateId].weather || '',
            location: STATE_CONFIGS[stateId].location || ''
        };
    },

    async getFeedback(stateId, destinationId = 'all') {
        if (!stateId || !STATE_CONFIGS[stateId]) return [];
        return [];
    }
};

/**
 * State Data Configurations for Dynamic UI Transformation
 */
const STATE_CONFIGS = {
    maharashtra: {
        theme: 'maharashtra',
        badge: 'MAHARASHTRA',
        tagline: 'MAHARASHTRA DESTINATION MANAGEMENT',
        title: 'Maharashtra Workspace',
        subtitle: 'Manage tourism activity, monitor visitor influx, and coordinate destination stakeholders efficiently.',
        quote: '"From our forts to our festivals, Maharashtra inspires every journey." — YatraSetu',
        weather: '☀️ 26°C | Pune, Maharashtra',
        location: '📍 Raigad Fort | Maharashtra',
        heroImg: 'https://images.unsplash.com/photo-1627894483216-2138af692e32?auto=format&fit=crop&w=1600&q=80',
        topDestinations: [
            { num: 1, name: 'Raigad Fort' },
            { num: 2, name: 'Ajanta Caves' },
            { num: 3, name: 'Ellora Caves' },
            { num: 4, name: 'Lonavala' },
            { num: 5, name: 'Shirdi' }
        ],
        exploreText: 'Explore Maharashtra — Heritage • Culture • Nature • People',
        events: [
            { title: 'Pune Heritage Walk', dateNum: '12', dateMonth: 'OCT', loc: 'Pune, Maharashtra', status: 'Open', statusClass: 'active', img: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=200&q=80' },
            { title: 'Ajanta Ellora Festival', dateNum: '18', dateMonth: 'OCT', loc: 'Aurangabad, Maharashtra', status: 'Registration', statusClass: 'pending', img: 'https://images.unsplash.com/photo-1627894483216-2138af692e32?auto=format&fit=crop&w=200&q=80' },
            { title: 'Konkan Food Festival', dateNum: '25', dateMonth: 'OCT', loc: 'Ratnagiri, Maharashtra', status: 'Upcoming', statusClass: 'draft', img: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=200&q=80' }
        ]
    },
    kerala: {
        theme: 'kerala',
        badge: 'KERALA',
        tagline: 'KERALA DESTINATION MANAGEMENT',
        title: 'Kerala Workspace',
        subtitle: 'Sustain God’s Own Country, conserve pristine backwaters, and curate enriching eco-tourism experiences.',
        quote: '"God’s Own Country — Where nature meets heritage in harmony." — YatraSetu',
        weather: '🌧️ 24°C | Kochi, Kerala',
        location: '📍 Munnar Tea Gardens | Kerala',
        heroImg: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1600&q=80',
        topDestinations: [
            { num: 1, name: 'Munnar Hills' },
            { num: 2, name: 'Alleppey Backwaters' },
            { num: 3, name: 'Wayanad Wildlife' },
            { num: 4, name: 'Fort Kochi' },
            { num: 5, name: 'Varkala Cliff' }
        ],
        exploreText: 'Explore Kerala — Nature • Backwaters • Wellness • People',
        events: [
            { title: 'Onam Cultural Pageant', dateNum: '10', dateMonth: 'OCT', loc: 'Kochi, Kerala', status: 'Open', statusClass: 'active', img: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=200&q=80' },
            { title: 'Backwater Regatta Rally', dateNum: '16', dateMonth: 'OCT', loc: 'Alleppey, Kerala', status: 'Registration', statusClass: 'pending', img: 'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=200&q=80' },
            { title: 'Wayanad Eco Summit', dateNum: '22', dateMonth: 'OCT', loc: 'Wayanad, Kerala', status: 'Upcoming', statusClass: 'draft', img: 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=200&q=80' }
        ]
    },
    kashmir: {
        theme: 'kashmir',
        badge: 'JAMMU & KASHMIR',
        tagline: 'KASHMIR DESTINATION MANAGEMENT',
        title: 'Kashmir Workspace',
        subtitle: 'Promote paradise on earth, manage alpine valleys, houseboats, and sustainable high-altitude tourism.',
        quote: '"Gar firdaus bar roo-e zameen ast — Paradise on Earth." — YatraSetu',
        weather: '❄️ 14°C | Srinagar, Kashmir',
        location: '📍 Dal Lake | Srinagar',
        heroImg: 'https://images.unsplash.com/photo-1595815771614-ade9d652a65d?auto=format&fit=crop&w=1600&q=80',
        topDestinations: [
            { num: 1, name: 'Dal Lake Srinagar' },
            { num: 2, name: 'Gulmarg Snow Slopes' },
            { num: 3, name: 'Pahalgam Valley' },
            { num: 4, name: 'Sonamarg Glaciers' },
            { num: 5, name: 'Shankaracharya Temple' }
        ],
        exploreText: 'Explore Kashmir — Lakes • Valleys • Snow Slopes • Crafts',
        events: [
            { title: 'Srinagar Tulip Festival', dateNum: '08', dateMonth: 'APR', loc: 'Indira Gandhi Memorial Garden', status: 'Open', statusClass: 'active', img: 'https://images.unsplash.com/photo-1595815771614-ade9d652a65d?auto=format&fit=crop&w=200&q=80' },
            { title: 'Gulmarg Winter Sports Meet', dateNum: '14', dateMonth: 'DEC', loc: 'Gulmarg Alpine Resort', status: 'Upcoming', statusClass: 'draft', img: 'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=200&q=80' },
            { title: 'Shikara Cultural Regatta', dateNum: '20', dateMonth: 'OCT', loc: 'Dal Lake Boulevard', status: 'Registration', statusClass: 'pending', img: 'https://images.unsplash.com/photo-1595815771614-ade9d652a65d?auto=format&fit=crop&w=200&q=80' }
        ]
    },
    rajasthan: {
        theme: 'rajasthan',
        badge: 'RAJASTHAN',
        tagline: 'RAJASTHAN DESTINATION MANAGEMENT',
        title: 'Rajasthan Workspace',
        subtitle: 'Preserve majestic forts, elevate royal heritage tourism, and foster sustainable desert journeys.',
        quote: '"Padharo Mhare Des — Experience the timeless grandeur of Rajasthan." — YatraSetu',
        weather: '☀️ 32°C | Jaipur, Rajasthan',
        location: '📍 Amber Fort | Jaipur, Rajasthan',
        heroImg: 'https://images.unsplash.com/photo-1599661046827-dacff0c0f09a?auto=format&fit=crop&w=1600&q=80',
        topDestinations: [
            { num: 1, name: 'Amber Fort' },
            { num: 2, name: 'Jaisalmer Desert' },
            { num: 3, name: 'Udaipur City Palace' },
            { num: 4, name: 'Mehrangarh Fort' },
            { num: 5, name: 'Pushkar Lake' }
        ],
        exploreText: 'Explore Rajasthan — Royal Heritage • Forts • Deserts • Culture',
        events: [
            { title: 'Jaipur Literature Fest', dateNum: '14', dateMonth: 'OCT', loc: 'Jaipur, Rajasthan', status: 'Open', statusClass: 'active', img: 'https://images.unsplash.com/photo-1599661046827-dacff0c0f09a?auto=format&fit=crop&w=200&q=80' },
            { title: 'Jaisalmer Desert Safari', dateNum: '20', dateMonth: 'OCT', loc: 'Jaisalmer, Rajasthan', status: 'Registration', statusClass: 'pending', img: 'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=200&q=80' },
            { title: 'Udaipur Light Festival', dateNum: '28', dateMonth: 'OCT', loc: 'Udaipur, Rajasthan', status: 'Upcoming', statusClass: 'draft', img: 'https://images.unsplash.com/photo-1615836245337-f5b9b2303f10?auto=format&fit=crop&w=200&q=80' }
        ]
    },
    goa: {
        theme: 'goa',
        badge: 'GOA',
        tagline: 'GOA DESTINATION MANAGEMENT',
        title: 'Goa Workspace',
        subtitle: 'Balance coastal heritage, manage eco-beach tourism, and coordinate sustainable marine destinations.',
        quote: '"Viva Goa — Sun, sand, heritage, and serene coastal culture." — YatraSetu',
        weather: '🌤️ 29°C | Panaji, Goa',
        location: '📍 Old Goa Basilica | Goa',
        heroImg: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1600&q=80',
        topDestinations: [
            { num: 1, name: 'Old Goa Churches' },
            { num: 2, name: 'Calangute Coast' },
            { num: 3, name: 'Dudhsagar Falls' },
            { num: 4, name: 'Fort Aguada' },
            { num: 5, name: 'Palolem Beach' }
        ],
        exploreText: 'Explore Goa — Beaches • Heritage • Waterfalls • Festivities',
        events: [
            { title: 'Goa Heritage Carnival', dateNum: '11', dateMonth: 'NOV', loc: 'Panaji Promenade', status: 'Open', statusClass: 'active', img: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=200&q=80' },
            { title: 'Fontainhas Cultural Walk', dateNum: '19', dateMonth: 'NOV', loc: 'Latin Quarter Panaji', status: 'Registration', statusClass: 'pending', img: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=200&q=80' },
            { title: 'Dudhsagar Eco Trail', dateNum: '26', dateMonth: 'NOV', loc: 'Mollem Reserve', status: 'Upcoming', statusClass: 'draft', img: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=200&q=80' }
        ]
    },
    tamilnadu: {
        theme: 'tamilnadu',
        badge: 'TAMIL NADU',
        tagline: 'TAMIL NADU DESTINATION MANAGEMENT',
        title: 'Tamil Nadu Workspace',
        subtitle: 'Preserve Dravidian temple heritage, manage Nilgiri hill stations, and promote coastal cultural trails.',
        quote: '"Land of Temples — Millennia of art, devotion, and architecture." — YatraSetu',
        weather: '☀️ 31°C | Madurai, Tamil Nadu',
        location: '📍 Meenakshi Temple | Madurai',
        heroImg: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1600&q=80',
        topDestinations: [
            { num: 1, name: 'Meenakshi Amman Temple' },
            { num: 2, name: 'Ooty Nilgiri Hills' },
            { num: 3, name: 'Mahabalipuram Reliefs' },
            { num: 4, name: 'Tanjore Brihadisvara' },
            { num: 5, name: 'Kanyakumari Point' }
        ],
        exploreText: 'Explore Tamil Nadu — Temples • Nilgiri Hills • Architecture',
        events: [
            { title: 'Mamallapuram Dance Festival', dateNum: '15', dateMonth: 'DEC', loc: 'Shore Temple Complex', status: 'Open', statusClass: 'active', img: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=200&q=80' },
            { title: 'Pongal Heritage Expo', dateNum: '14', dateMonth: 'JAN', loc: 'Madurai Heritage Hub', status: 'Upcoming', statusClass: 'draft', img: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=200&q=80' },
            { title: 'Nilgiri Mountain Railway Tour', dateNum: '22', dateMonth: 'DEC', loc: 'Ooty Station', status: 'Registration', statusClass: 'pending', img: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=200&q=80' }
        ]
    },
    uttarakhand: {
        theme: 'uttarakhand',
        badge: 'UTTARAKHAND',
        tagline: 'UTTARAKHAND DESTINATION MANAGEMENT',
        title: 'Uttarakhand Workspace',
        subtitle: 'Promote Himalayan eco-tourism, manage sacred river valleys, and coordinate adventure trail safety.',
        quote: '"Devbhoomi — Land of the Gods and Sacred Himalayan Valleys." — YatraSetu',
        weather: '🌤️ 18°C | Rishikesh, Uttarakhand',
        location: '📍 Triveni Ghat | Rishikesh',
        heroImg: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=1600&q=80',
        topDestinations: [
            { num: 1, name: 'Rishikesh Ganga Ghats' },
            { num: 2, name: 'Nainital Lake Corridor' },
            { num: 3, name: 'Mussoorie Queen of Hills' },
            { num: 4, name: 'Valley of Flowers' },
            { num: 5, name: 'Jim Corbett Reserve' }
        ],
        exploreText: 'Explore Uttarakhand — Sacred Rivers • Himalayas • Wildlife',
        events: [
            { title: 'International Yoga Festival', dateNum: '05', dateMonth: 'MAR', loc: 'Rishikesh Ghats', status: 'Open', statusClass: 'active', img: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=200&q=80' },
            { title: 'Himalayan Trekking Summit', dateNum: '18', dateMonth: 'OCT', loc: 'Dehradun Convention', status: 'Registration', statusClass: 'pending', img: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=200&q=80' },
            { title: 'Ganga Sandhya Cultural Evening', dateNum: '25', dateMonth: 'OCT', loc: 'Haridwar Har Ki Pauri', status: 'Upcoming', statusClass: 'draft', img: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=200&q=80' }
        ]
    },
    assam: {
        theme: 'assam',
        badge: 'ASSAM',
        tagline: 'ASSAM DESTINATION MANAGEMENT',
        title: 'Assam Workspace',
        subtitle: 'Protect one-horned rhino wildlife reserves, manage Brahmaputra river tourism, and celebrate tea heritage.',
        quote: '"Land of the Red River and Blue Hills." — YatraSetu',
        weather: '⛅ 27°C | Guwahati, Assam',
        location: '📍 Kaziranga National Park | Assam',
        heroImg: 'https://images.unsplash.com/photo-1607141731632-15f9d1469e38?auto=format&fit=crop&w=1600&q=80',
        topDestinations: [
            { num: 1, name: 'Kaziranga National Park' },
            { num: 2, name: 'Majuli Island' },
            { num: 3, name: 'Kamakhya Temple' },
            { num: 4, name: 'Jorhat Tea Estates' },
            { num: 5, name: 'Haflong Hill Station' }
        ],
        exploreText: 'Explore Assam — Wildlife • Tea Gardens • Brahmaputra • Culture',
        events: [
            { title: 'Kaziranga Rhino Conservation Fest', dateNum: '07', dateMonth: 'NOV', loc: 'Kohora Gate Kaziranga', status: 'Open', statusClass: 'active', img: 'https://images.unsplash.com/photo-1607141731632-15f9d1469e38?auto=format&fit=crop&w=200&q=80' },
            { title: 'Majuli Raas Mahotsav', dateNum: '15', dateMonth: 'NOV', loc: 'Majuli Satra Grounds', status: 'Registration', statusClass: 'pending', img: 'https://images.unsplash.com/photo-1607141731632-15f9d1469e38?auto=format&fit=crop&w=200&q=80' },
            { title: 'Assam Tea Tourism Summit', dateNum: '28', dateMonth: 'NOV', loc: 'Jorhat Heritage Club', status: 'Upcoming', statusClass: 'draft', img: 'https://images.unsplash.com/photo-1607141731632-15f9d1469e38?auto=format&fit=crop&w=200&q=80' }
        ]
    }
};

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

/**
 * Table Search & Filtering Logic
 */
function initTableSearchAndFilters() {
    const searchInputs = document.querySelectorAll('.table-search-input, .topbar-search-input-rounded');
    const filterSelects = document.querySelectorAll('.table-filter-select');

    searchInputs.forEach(input => {
        input.addEventListener('input', () => filterTableRows());
    });

    filterSelects.forEach(select => {
        select.addEventListener('change', () => filterTableRows());
    });
}

function filterTableRows() {
    const searchInput = document.querySelector('.table-search-input') || document.querySelector('.topbar-search-input-rounded');
    const filterCategory = document.querySelector('[data-filter="category"]');
    const filterStatus = document.querySelector('[data-filter="status"]');
    const tables = document.querySelectorAll('.app-table');

    if (!tables.length) return;

    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    const categoryTerm = filterCategory ? filterCategory.value.toLowerCase() : 'all';
    const statusTerm = filterStatus ? filterStatus.value.toLowerCase() : 'all';

    tables.forEach(table => {
        const rows = table.querySelectorAll('tbody tr');
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            const rowCategory = row.getAttribute('data-category')?.toLowerCase() || '';
            const rowStatus = row.getAttribute('data-status')?.toLowerCase() || '';

            const matchesSearch = text.includes(searchTerm);
            const matchesCategory = (categoryTerm === 'all' || rowCategory.includes(categoryTerm));
            const matchesStatus = (statusTerm === 'all' || rowStatus.includes(statusTerm));

            if (matchesSearch && matchesCategory && matchesStatus) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    });
}

/**
 * Report Generator Simulation
 */
function initReportGenerator() {
    const generateBtn = document.getElementById('btn-generate-report');
    const reportPreview = document.getElementById('report-preview-container');
    if (!generateBtn || !reportPreview) return;

    generateBtn.addEventListener('click', () => {
        const typeSelect = document.getElementById('report-type-select');
        const periodSelect = document.getElementById('report-period-select');
        const reportTitle = document.getElementById('preview-report-title');
        const reportDate = document.getElementById('preview-report-date');

        const typeName = typeSelect ? typeSelect.options[typeSelect.selectedIndex].text : 'Tourism Report';
        const periodName = periodSelect ? periodSelect.options[periodSelect.selectedIndex].text : 'Current Month';

        generateBtn.disabled = true;
        generateBtn.innerHTML = `Generating Report...`;

        setTimeout(() => {
            generateBtn.disabled = false;
            generateBtn.innerHTML = `Generate Report Preview`;

            if (reportTitle) reportTitle.textContent = `${typeName} — ${periodName}`;
            if (reportDate) reportDate.textContent = `Generated on ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`;

            reportPreview.style.display = 'block';
            reportPreview.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 500);
    });
}
