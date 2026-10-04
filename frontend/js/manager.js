/**
 * State Data Configurations for Dynamic UI Transformation (Derived from YatraSetuManagerData)
 */
const STATE_CONFIGS = (window.YatraSetuManagerData && window.YatraSetuManagerData.stateConfigs) 
    ? window.YatraSetuManagerData.stateConfigs 
    : {};

/**
 * YatraSetu — Relational Data Access Adapter / Authoritative Store
 * Exposes API-shaped relational query functions filtering strictly by state_id and destination_id.
 * Consumes central data repository in manager-data.js.
 */
window.YatraSetuManagerStore = {
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
        if (!window.YatraSetuManagerData || !window.YatraSetuManagerData.stakeholders) return [];
        let list = window.YatraSetuManagerData.stakeholders;
        if (stateId && stateId !== 'all') {
            list = list.filter(s => s.state_id === stateId);
        }
        if (destinationId && destinationId !== 'all') {
            list = list.filter(s => s.destination_id === destinationId || s.destination_id.includes(destinationId));
        }
        return list;
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
        const urlParams = new URLSearchParams(window.location.search);
        const urlDest = urlParams.get('dest');
        const urlState = urlParams.get('state');

        let savedState = urlState || sessionStorage.getItem('yatrasetu_active_state_id') || sessionStorage.getItem('yatrasetu_state_theme') || 'maharashtra';
        let savedDest = urlDest || sessionStorage.getItem('yatrasetu_active_dest_id') || 'all';

        if (urlDest && window.YatraSetuManagerData && window.YatraSetuManagerData.destinations) {
            const matchDest = window.YatraSetuManagerData.destinations.find(d => d.id === urlDest);
            if (matchDest) {
                savedState = matchDest.state_id;
            }
        }

        this._state.activeStateId = STATE_CONFIGS[savedState] ? savedState : 'maharashtra';
        this._state.activeDestinationId = savedDest;
        this._state.managerScope = sessionStorage.getItem('yatrasetu_manager_scope') || 'state';
        this._state.managerRole = sessionStorage.getItem('yatrasetu_manager_role') || 'state_manager';

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
            dashboardDestGrid.innerHTML = destinations.slice(0, 4).map((dest) => `
                <div class="dest-directory-card" data-destination-id="${dest.id}" data-state-id="${activeStateId}" style="cursor: pointer;">
                    <div class="dest-card-thumb" style="background-image: url('${dest.img}'); background-size: cover; background-position: center; height: 160px;"></div>
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
    const destinations = await window.YatraSetuManagerStore.getDestinations(activeStateId);
    const activeDest = (activeDestinationId !== 'all') 
        ? (destinations.find(d => d.id === activeDestinationId) || destinations[0])
        : (destinations[0] || null);

    const destHeroBanner = document.querySelector('.destination-hero-banner');
    if (destHeroBanner && activeDest) {
        const destHeroTitle = destHeroBanner.querySelector('.hero-title');
        const destHeroSub = destHeroBanner.querySelector('.hero-subtitle');
        const destHeroBg = destHeroBanner.querySelector('.destination-hero-bg');
        const destHeroStats = destHeroBanner.querySelector('div[style*="flex"]');

        if (destHeroTitle) destHeroTitle.textContent = activeDest.name;
        if (destHeroSub) destHeroSub.textContent = `${activeDest.name}, ${formattedStateName} • ${activeDest.category || 'Scenic destination in ' + formattedStateName}`;
        if (destHeroBg && activeDest.img) destHeroBg.style.backgroundImage = `url('${activeDest.img}')`;

        const attrCount = (window.YatraSetuManagerData.attractions || []).filter(a => a.destination_id === activeDest.id).length;
        const evCount = (window.YatraSetuManagerData.events || []).filter(e => e.destination_id === activeDest.id).length;

        if (destHeroStats) {
            destHeroStats.innerHTML = `
                <span>🏛️ <strong>${attrCount}</strong> Attractions</span>
                <span>📅 <strong>${evCount}</strong> Events</span>
                <span>⭐ <strong>4.8</strong> Rating</span>
            `;
        }

        const heroBtn = destHeroBanner.querySelector('.hero-actions button');
        if (heroBtn) {
            heroBtn.setAttribute('data-destination-id', activeDest.id);
            heroBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                openDestinationDetailModal(activeDest.id, 'view');
            };
        }
    }

    const destGrid = document.querySelector('#destinations-cards-grid');
    if (destGrid) {
        if (destinations && destinations.length > 0) {
            destGrid.innerHTML = destinations.map(dest => {
                const isSelected = dest.id === activeDestinationId;
                const attrCount = (window.YatraSetuManagerData.attractions || []).filter(a => a.destination_id === dest.id).length;
                const evCount = (window.YatraSetuManagerData.events || []).filter(e => e.destination_id === dest.id).length;
                return `
                    <div class="dest-card ${isSelected ? 'selected-card' : ''}" data-destination-id="${dest.id}" data-state-id="${activeStateId}" style="cursor: pointer; border: ${isSelected ? '2px solid var(--state-accent)' : '1px solid var(--card-border)'}; border-radius: 12px; overflow: hidden; background: #fff; transition: all 0.2s;">
                        <div class="dest-card-media" style="background-image: url('${dest.img}'); height: 160px; background-size: cover; background-position: center; position: relative;">
                            <span class="dest-card-tag" style="position: absolute; top: 10px; left: 10px; background: rgba(15,23,42,0.75); color: #fff; padding: 2px 8px; border-radius: 4px; font-size: 0.72rem; font-weight: 600;">${dest.category || 'Destination'}</span>
                            <span class="dest-card-rating" style="position: absolute; top: 10px; right: 10px; background: rgba(255,255,255,0.9); color: #D97706; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 700;">⭐ 4.8</span>
                        </div>
                        <div class="dest-card-body" style="padding: 1rem;">
                            <h3 class="dest-card-title" style="font-size: 1.05rem; font-weight: 700; color: #0f172a; margin-bottom: 0.25rem;">${dest.name}</h3>
                            <span class="dest-card-loc" style="font-size: 0.78rem; color: #64748b; font-weight: 500;">${formattedStateName} • Rank #${dest.rank}</span>
                            <div class="dest-card-stats" style="display: flex; gap: 0.75rem; margin-top: 0.5rem; font-size: 0.75rem; color: #475569; font-weight: 600;">
                                <span>🏛️ ${attrCount} Attractions</span>
                                <span>📅 ${evCount} Events</span>
                            </div>
                            <div class="dest-card-actions" style="margin-top: 0.85rem; display: flex; gap: 0.35rem; flex-wrap: wrap;">
                                <button type="button" class="btn-secondary btn-card-details" data-destination-id="${dest.id}" style="padding: 0.3rem 0.6rem; font-size: 0.75rem; flex: 1; font-weight: 600;">View Details</button>
                                <button type="button" class="btn-secondary btn-card-attractions" data-destination-id="${dest.id}" style="padding: 0.3rem 0.6rem; font-size: 0.75rem; font-weight: 600;">Attractions</button>
                                <button type="button" class="btn-secondary btn-card-events" data-destination-id="${dest.id}" style="padding: 0.3rem 0.6rem; font-size: 0.75rem; font-weight: 600;">Events</button>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

            // Attach explicit button click listeners for each card action
            destGrid.querySelectorAll('.btn-card-details').forEach(btn => {
                btn.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const destId = btn.getAttribute('data-destination-id');
                    openDestinationDetailModal(destId, 'view');
                };
            });

            destGrid.querySelectorAll('.btn-card-attractions').forEach(btn => {
                btn.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const destId = btn.getAttribute('data-destination-id');
                    if (window.YatraSetuManagerContext) {
                        window.YatraSetuManagerContext.setDestination(destId);
                    }
                    window.location.href = 'attractions.html';
                };
            });

            destGrid.querySelectorAll('.btn-card-events').forEach(btn => {
                btn.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const destId = btn.getAttribute('data-destination-id');
                    if (window.YatraSetuManagerContext) {
                        window.YatraSetuManagerContext.setDestination(destId);
                    }
                    window.location.href = 'events.html';
                };
            });
        } else {
            destGrid.innerHTML = `<div style="grid-column: 1 / -1; padding: 2.5rem; text-align: center; color: #64748b; font-weight: 500;">No destination records available for ${formattedStateName}.</div>`;
        }
    }

    // 2. ATTRACTIONS VIEW (attractions.html)
    const attractionsTableBody = document.querySelector('#attractions-table-body');
    if (attractionsTableBody) {
        const attractions = await window.YatraSetuManagerStore.getAttractions(activeStateId, activeDestinationId);
        const allDestinations = await window.YatraSetuManagerStore.getDestinations(activeStateId);

        if (typeof updateAttractionPillCounts === 'function') {
            updateAttractionPillCounts(attractions);
        }

        if (attractions && attractions.length > 0) {
            attractionsTableBody.innerHTML = attractions.map(attr => {
                const destObj = allDestinations.find(d => d.id === attr.destination_id);
                const destName = destObj ? destObj.name : (attr.destination_id ? attr.destination_id.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : formattedStateName);
                return `
                <tr data-category="${attr.category ? attr.category.toLowerCase() : ''}" data-status="${(attr.status || 'open').toLowerCase()}">
                    <td>
                        <div class="poi-cell">
                            <img src="${attr.img}" alt="${attr.name}" class="poi-thumb">
                            <div>
                                <div class="poi-info-title">${attr.name}</div>
                                <div class="poi-info-sub">${attr.category || 'Attraction'}</div>
                            </div>
                        </div>
                    </td>
                    <td>${destName}</td>
                    <td>${attr.category || 'General'}</td>
                    <td><strong style="color: #F59E0B;">⭐ ${attr.rating || '4.8'}</strong></td>
                    <td><span class="badge badge-${attr.status === 'Closed' ? 'danger' : (attr.status === 'Maintenance' ? 'warning' : 'success')}">${attr.status || 'Open'}</span></td>
                    <td style="text-align: right;"><button class="btn-secondary" style="padding: 0.25rem 0.6rem; font-size: 0.75rem;">•••</button></td>
                </tr>
                `;
            }).join('');
        } else {
            attractionsTableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 2.5rem; color: #64748b; font-weight: 500;">No attraction records available for ${activeDestinationId !== 'all' ? activeDestinationId : formattedStateName}.</td></tr>`;
        }
        filterTableRows();
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
    initAddAttractionForm();
    initAddDestinationForm();
    initAddEventForm();
    initAddStakeholderForm();
});


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
    const filterPills = document.querySelectorAll('.filter-pill-bar .filter-pill');

    searchInputs.forEach(input => {
        input.addEventListener('input', () => filterTableRows());
    });

    filterSelects.forEach(select => {
        select.addEventListener('change', () => filterTableRows());
    });

    filterPills.forEach(pill => {
        pill.addEventListener('click', (e) => {
            e.preventDefault();
            filterPills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            filterTableRows();
        });
    });
}

function updateAttractionPillCounts(attractions) {
    if (!attractions) return;
    const counts = {
        all: attractions.length,
        fort: 0,
        shrine: 0,
        viewpoint: 0,
        park: 0,
        water: 0
    };
    attractions.forEach(a => {
        const cat = (a.category || '').toLowerCase();
        if (cat.includes('fort')) counts.fort++;
        if (cat.includes('shrine') || cat.includes('temple') || cat.includes('sacred') || cat.includes('ceremony')) counts.shrine++;
        if (cat.includes('viewpoint') || cat.includes('landmark') || cat.includes('pavilion') || cat.includes('scenic')) counts.viewpoint++;
        if (cat.includes('park') || cat.includes('safari') || cat.includes('wildlife') || cat.includes('reserve')) counts.park++;
        if (cat.includes('water') || cat.includes('beach') || cat.includes('boat') || cat.includes('cruise') || cat.includes('lake') || cat.includes('river') || cat.includes('ghat')) counts.water++;
    });
    for (const [key, count] of Object.entries(counts)) {
        const el = document.getElementById(`pill-count-${key}`);
        if (el) el.textContent = count;
    }
}

function filterTableRows() {
    const searchInput = document.querySelector('.table-search-input') || document.querySelector('.topbar-search-input-rounded');
    const filterCategorySelect = document.querySelector('[data-filter="category"]');
    const activePill = document.querySelector('.filter-pill-bar .filter-pill.active');
    const pillCategory = activePill ? (activePill.getAttribute('data-category') || 'all').toLowerCase() : 'all';
    const selectCategory = filterCategorySelect ? filterCategorySelect.value.toLowerCase() : 'all';
    const categoryTerm = pillCategory !== 'all' ? pillCategory : selectCategory;

    const filterStatus = document.querySelector('[data-filter="status"]');
    const tables = document.querySelectorAll('.app-table');

    if (!tables.length) return;

    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    const statusTerm = filterStatus ? filterStatus.value.toLowerCase() : 'all';

    tables.forEach(table => {
        const rows = table.querySelectorAll('tbody tr');
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            const rowCategory = row.getAttribute('data-category')?.toLowerCase() || '';
            const rowStatus = row.getAttribute('data-status')?.toLowerCase() || '';

            const matchesSearch = text.includes(searchTerm);

            let matchesCategory = true;
            if (categoryTerm !== 'all') {
                if (categoryTerm === 'fort') matchesCategory = rowCategory.includes('fort');
                else if (categoryTerm === 'shrine') matchesCategory = rowCategory.includes('shrine') || rowCategory.includes('temple') || rowCategory.includes('sacred') || rowCategory.includes('ceremony');
                else if (categoryTerm === 'viewpoint') matchesCategory = rowCategory.includes('viewpoint') || rowCategory.includes('landmark') || rowCategory.includes('pavilion') || rowCategory.includes('scenic');
                else if (categoryTerm === 'park') matchesCategory = rowCategory.includes('park') || rowCategory.includes('safari') || rowCategory.includes('wildlife') || rowCategory.includes('reserve');
                else if (categoryTerm === 'water') matchesCategory = rowCategory.includes('beach') || rowCategory.includes('water') || rowCategory.includes('boat') || rowCategory.includes('cruise') || rowCategory.includes('lake') || rowCategory.includes('river') || rowCategory.includes('ghat');
                else matchesCategory = rowCategory.includes(categoryTerm);
            }

            const matchesStatus = (statusTerm === 'all' || rowStatus.includes(statusTerm));

            if (matchesSearch && matchesCategory && matchesStatus) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    });
}

function initAddAttractionForm() {
    const modalTargetBtn = document.querySelector('[data-modal-target="addAttractionModal"]');
    const destSelect = document.getElementById('add-attr-dest');
    const saveBtn = document.getElementById('btn-save-attraction');

    if (modalTargetBtn && destSelect) {
        modalTargetBtn.addEventListener('click', () => {
            const activeContext = window.YatraSetuManagerStore ? window.YatraSetuManagerStore.getActiveContext() : { activeStateId: 'maharashtra' };
            const destinations = window.YatraSetuManagerData ? window.YatraSetuManagerData.destinations.filter(d => d.state_id === activeContext.activeStateId) : [];
            destSelect.innerHTML = destinations.map(d => `<option value="${d.id}">${d.name}</option>`).join('');
        });
    }

    if (saveBtn) {
        saveBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const nameInput = document.getElementById('add-attr-name');
            const destSelect = document.getElementById('add-attr-dest');
            const catInput = document.getElementById('add-attr-category');
            const imgInput = document.getElementById('add-attr-img');

            const nameVal = nameInput ? nameInput.value.trim() : '';
            const destVal = destSelect ? destSelect.value : '';
            const catVal = catInput ? catInput.value.trim() : '';
            const imgVal = imgInput ? imgInput.value.trim() : '';

            if (!nameVal) {
                alert('Please enter an attraction name.');
                return;
            }

            const activeContext = window.YatraSetuManagerStore ? window.YatraSetuManagerStore.getActiveContext() : { activeStateId: 'maharashtra' };

            const newAttr = {
                id: 'attr-' + Date.now(),
                state_id: activeContext.activeStateId,
                destination_id: destVal || (window.YatraSetuManagerData.destinations.find(d => d.state_id === activeContext.activeStateId)?.id || 'raigad-fort'),
                name: nameVal,
                category: catVal || 'Attraction',
                img: imgVal || 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=400&q=80',
                rating: '5.0',
                status: 'Open'
            };

            if (window.YatraSetuManagerData && window.YatraSetuManagerData.attractions) {
                window.YatraSetuManagerData.attractions.push(newAttr);
            }

            // Reset inputs
            if (nameInput) nameInput.value = '';
            if (catInput) catInput.value = '';
            if (imgInput) imgInput.value = '';

            // Close modal
            const modal = document.getElementById('addAttractionModal');
            if (modal) modal.classList.remove('active');
            document.body.style.overflow = '';

            // Re-render connected view
            if (typeof renderConnectedViews === 'function' && window.YatraSetuManagerStore) {
                await renderConnectedViews(window.YatraSetuManagerStore.getActiveContext());
            }
        });
    }
}

function initAddDestinationForm() {
    const saveBtn = document.getElementById('btn-save-destination');
    if (saveBtn) {
        saveBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const nameInput = document.getElementById('add-dest-name');
            const catSelect = document.getElementById('add-dest-category');
            const regionInput = document.getElementById('add-dest-region');
            const imgInput = document.getElementById('add-dest-img');

            const nameVal = nameInput ? nameInput.value.trim() : '';
            const catVal = catSelect ? catSelect.value : 'Heritage Fort';
            const regionVal = regionInput ? regionInput.value.trim() : '';
            const imgVal = imgInput ? imgInput.value.trim() : '';

            if (!nameVal) {
                alert('Please enter a destination name.');
                return;
            }

            const activeContext = window.YatraSetuManagerStore ? window.YatraSetuManagerStore.getActiveContext() : { activeStateId: 'maharashtra' };
            const destId = nameVal.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

            const newDest = {
                id: destId || ('dest-' + Date.now()),
                state_id: activeContext.activeStateId,
                name: nameVal,
                category: catVal,
                rank: (window.YatraSetuManagerData.destinations ? window.YatraSetuManagerData.destinations.filter(d => d.state_id === activeContext.activeStateId).length + 1 : 1),
                img: imgVal || 'https://images.unsplash.com/photo-1600100397608-f010e423b963?auto=format&fit=crop&w=800&q=80'
            };

            if (window.YatraSetuManagerData && window.YatraSetuManagerData.destinations) {
                window.YatraSetuManagerData.destinations.push(newDest);
            }

            // Reset inputs
            if (nameInput) nameInput.value = '';
            if (regionInput) regionInput.value = '';
            if (imgInput) imgInput.value = '';

            // Close modal
            const modal = document.getElementById('addDestinationModal');
            if (modal) modal.classList.remove('active');
            document.body.style.overflow = '';

            // Re-render connected view
            if (typeof renderConnectedViews === 'function' && window.YatraSetuManagerStore) {
                await renderConnectedViews(window.YatraSetuManagerStore.getActiveContext());
            }
        });
    }
}

function initAddEventForm() {
    const modalTargetBtn = document.querySelector('[data-modal-target="addEventModal"]');
    const destSelect = document.getElementById('add-event-dest');
    const saveBtn = document.getElementById('btn-save-event');

    if (modalTargetBtn && destSelect) {
        modalTargetBtn.addEventListener('click', () => {
            const activeContext = window.YatraSetuManagerStore ? window.YatraSetuManagerStore.getActiveContext() : { activeStateId: 'maharashtra' };
            const destinations = window.YatraSetuManagerData ? window.YatraSetuManagerData.destinations.filter(d => d.state_id === activeContext.activeStateId) : [];
            destSelect.innerHTML = destinations.map(d => `<option value="${d.id}">${d.name}</option>`).join('');
        });
    }

    if (saveBtn) {
        saveBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const titleInput = document.getElementById('add-event-title');
            const destSelect = document.getElementById('add-event-dest');
            const locInput = document.getElementById('add-event-location');
            const dateInput = document.getElementById('add-event-date');
            const imgInput = document.getElementById('add-event-img');

            const titleVal = titleInput ? titleInput.value.trim() : '';
            const destVal = destSelect ? destSelect.value : '';
            const locVal = locInput ? locInput.value.trim() : '';
            const dateVal = dateInput ? dateInput.value.trim() : '15 OCT';
            const imgVal = imgInput ? imgInput.value.trim() : '';

            if (!titleVal) {
                alert('Please enter an event title.');
                return;
            }

            const activeContext = window.YatraSetuManagerStore ? window.YatraSetuManagerStore.getActiveContext() : { activeStateId: 'maharashtra' };
            const dateParts = dateVal.split(' ');
            const dateNum = dateParts[0] || '15';
            const dateMonth = (dateParts[1] || 'OCT').toUpperCase();

            const newEvent = {
                id: 'event-' + Date.now(),
                state_id: activeContext.activeStateId,
                destination_id: destVal || (window.YatraSetuManagerData.destinations.find(d => d.state_id === activeContext.activeStateId)?.id || 'raigad-fort'),
                title: titleVal,
                dateNum: dateNum,
                dateMonth: dateMonth,
                location: locVal || 'Local Venue',
                status: 'Upcoming',
                statusClass: 'active',
                img: imgVal || 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=400&q=80'
            };

            if (window.YatraSetuManagerData && window.YatraSetuManagerData.events) {
                window.YatraSetuManagerData.events.push(newEvent);
            }

            // Reset inputs
            if (titleInput) titleInput.value = '';
            if (locInput) locInput.value = '';
            if (dateInput) dateInput.value = '';
            if (imgInput) imgInput.value = '';

            // Close modal
            const modal = document.getElementById('addEventModal');
            if (modal) modal.classList.remove('active');
            document.body.style.overflow = '';

            // Re-render connected view
            if (typeof renderConnectedViews === 'function' && window.YatraSetuManagerStore) {
                await renderConnectedViews(window.YatraSetuManagerStore.getActiveContext());
            }
        });
    }
}

function initAddStakeholderForm() {
    const modalTargetBtn = document.querySelector('[data-modal-target="addStakeholderModal"]');
    const destSelect = document.getElementById('add-sh-dest');
    const saveBtn = document.getElementById('btn-save-stakeholder');

    if (modalTargetBtn && destSelect) {
        modalTargetBtn.addEventListener('click', () => {
            const activeContext = window.YatraSetuManagerStore ? window.YatraSetuManagerStore.getActiveContext() : { activeStateId: 'maharashtra' };
            const destinations = window.YatraSetuManagerData ? window.YatraSetuManagerData.destinations.filter(d => d.state_id === activeContext.activeStateId) : [];
            destSelect.innerHTML = `<option value="all">State-wide Partner</option>` + destinations.map(d => `<option value="${d.id}">${d.name}</option>`).join('');
        });
    }

    if (saveBtn) {
        saveBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const nameInput = document.getElementById('add-sh-name');
            const catSelect = document.getElementById('add-sh-category');
            const destSelect = document.getElementById('add-sh-dest');
            const contactInput = document.getElementById('add-sh-contact');

            const nameVal = nameInput ? nameInput.value.trim() : '';
            const catVal = catSelect ? catSelect.value : 'Guides';
            const destVal = destSelect ? destSelect.value : 'all';
            const contactVal = contactInput ? contactInput.value.trim() : '+91 98765 00000';

            if (!nameVal) {
                alert('Please enter a stakeholder/partner name.');
                return;
            }

            const activeContext = window.YatraSetuManagerStore ? window.YatraSetuManagerStore.getActiveContext() : { activeStateId: 'maharashtra' };

            const newStakeholder = {
                id: 'sh-' + Date.now(),
                state_id: activeContext.activeStateId,
                destination_id: destVal,
                destination: destVal !== 'all' ? (window.YatraSetuManagerData.destinations.find(d => d.id === destVal)?.name || destVal) : 'State-wide',
                name: nameVal,
                category: catVal,
                contact: contactVal,
                status: 'Verified'
            };

            if (window.YatraSetuManagerData) {
                if (!window.YatraSetuManagerData.stakeholders) window.YatraSetuManagerData.stakeholders = [];
                window.YatraSetuManagerData.stakeholders.push(newStakeholder);
            }

            // Reset inputs
            if (nameInput) nameInput.value = '';
            if (contactInput) contactInput.value = '';

            // Close modal
            const modal = document.getElementById('addStakeholderModal');
            if (modal) modal.classList.remove('active');
            document.body.style.overflow = '';

            // Re-render connected view
            if (typeof renderConnectedViews === 'function' && window.YatraSetuManagerStore) {
                await renderConnectedViews(window.YatraSetuManagerStore.getActiveContext());
            }
        });
    }
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

/**
 * Destination Details & Actions Modal Functionality
 * Supports: View Details, Edit Details, Save, Cancel, Delete, Close, View Attractions, View Events, View Stakeholders
 */
function openDestinationDetailModal(destId, mode = 'view') {
    if (!destId || !window.YatraSetuManagerData || !window.YatraSetuManagerData.destinations) return;
    const dest = window.YatraSetuManagerData.destinations.find(d => d.id === destId);
    if (!dest) return;

    const modal = document.getElementById('destinationDetailModal');
    const titleEl = document.getElementById('detail-modal-title');
    const bodyEl = document.getElementById('detail-modal-body');
    const footerEl = document.getElementById('detail-modal-footer');
    const closeBtn = document.getElementById('btn-close-detail-modal');

    if (!modal || !bodyEl || !footerEl) return;

    const stateConfig = STATE_CONFIGS[dest.state_id] || STATE_CONFIGS['maharashtra'];
    const formattedState = stateConfig ? stateConfig.badge : dest.state_id;

    const attrCount = (window.YatraSetuManagerData.attractions || []).filter(a => a.destination_id === dest.id).length;
    const evCount = (window.YatraSetuManagerData.events || []).filter(e => e.destination_id === dest.id).length;
    const shCount = (window.YatraSetuManagerData.stakeholders || []).filter(s => s.destination_id === dest.id).length;

    if (mode === 'view') {
        if (titleEl) titleEl.textContent = `${dest.name} — Destination Profile`;

        bodyEl.innerHTML = `
            <div style="display: flex; gap: 1rem; flex-wrap: wrap; margin-bottom: 1rem;">
                <img src="${dest.img}" alt="${dest.name}" style="width: 100%; max-height: 200px; object-fit: cover; border-radius: 8px;">
            </div>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; margin-bottom: 1rem; font-size: 0.88rem;">
                <div><strong>Destination Name:</strong> <span id="detail-dest-name">${dest.name}</span></div>
                <div><strong>ID:</strong> <span id="detail-dest-id">${dest.id}</span></div>
                <div><strong>Category:</strong> <span>${dest.category || 'Heritage & Tourism'}</span></div>
                <div><strong>State:</strong> <span>${formattedState}</span></div>
                <div><strong>Rank:</strong> <span>#${dest.rank}</span></div>
                <div><strong>Status:</strong> <span class="badge badge-success">Active Destination</span></div>
            </div>
            <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 0.85rem; font-size: 0.85rem; margin-bottom: 1rem;">
                <h4 style="font-size: 0.8rem; font-weight: 700; color: #475569; text-transform: uppercase; margin-bottom: 0.5rem;">Associated Ecosystem Records</h4>
                <div style="display: flex; gap: 1.25rem;">
                    <span>🏛️ <strong>${attrCount}</strong> Attractions</span>
                    <span>📅 <strong>${evCount}</strong> Events</span>
                    <span>🤝 <strong>${shCount}</strong> Stakeholders</span>
                </div>
            </div>
        `;

        footerEl.innerHTML = `
            <div style="display: flex; gap: 0.5rem;">
                <button type="button" class="btn-primary" id="btn-edit-dest-modal" style="padding: 0.45rem 0.9rem; font-size: 0.82rem;">Edit Details</button>
                <button type="button" class="btn-secondary" id="btn-delete-dest-modal" style="padding: 0.45rem 0.9rem; font-size: 0.82rem; color: #DC2626; border-color: #FECACA;">Delete</button>
            </div>
            <div style="display: flex; gap: 0.4rem; flex-wrap: wrap;">
                <button type="button" class="btn-secondary" id="btn-nav-attr-modal" style="padding: 0.45rem 0.75rem; font-size: 0.8rem;">View Attractions</button>
                <button type="button" class="btn-secondary" id="btn-nav-ev-modal" style="padding: 0.45rem 0.75rem; font-size: 0.8rem;">View Events</button>
                <button type="button" class="btn-secondary" id="btn-nav-sh-modal" style="padding: 0.45rem 0.75rem; font-size: 0.8rem;">View Stakeholders</button>
            </div>
        `;

        // Bind Action Handlers
        const editBtn = document.getElementById('btn-edit-dest-modal');
        if (editBtn) editBtn.onclick = () => openDestinationDetailModal(destId, 'edit');

        const deleteBtn = document.getElementById('btn-delete-dest-modal');
        if (deleteBtn) {
            deleteBtn.onclick = async () => {
                if (confirm(`Are you sure you want to delete destination "${dest.name}" (${dest.id})?`)) {
                    const idx = window.YatraSetuManagerData.destinations.findIndex(d => d.id === destId);
                    if (idx !== -1) {
                        window.YatraSetuManagerData.destinations.splice(idx, 1);
                    }
                    if (window.YatraSetuManagerContext) {
                        const ctx = window.YatraSetuManagerContext.getActiveContext();
                        if (ctx.activeDestinationId === destId) {
                            window.YatraSetuManagerContext.setDestination('all');
                        }
                    }
                    modal.classList.remove('active');
                    document.body.style.overflow = '';
                    await renderConnectedViews(window.YatraSetuManagerStore.getActiveContext());
                }
            };
        }

        const navAttrBtn = document.getElementById('btn-nav-attr-modal');
        if (navAttrBtn) {
            navAttrBtn.onclick = () => {
                if (window.YatraSetuManagerContext) window.YatraSetuManagerContext.setDestination(destId);
                window.location.href = 'attractions.html';
            };
        }

        const navEvBtn = document.getElementById('btn-nav-ev-modal');
        if (navEvBtn) {
            navEvBtn.onclick = () => {
                if (window.YatraSetuManagerContext) window.YatraSetuManagerContext.setDestination(destId);
                window.location.href = 'events.html';
            };
        }

        const navShBtn = document.getElementById('btn-nav-sh-modal');
        if (navShBtn) {
            navShBtn.onclick = () => {
                if (window.YatraSetuManagerContext) window.YatraSetuManagerContext.setDestination(destId);
                window.location.href = 'stakeholders.html';
            };
        }

    } else if (mode === 'edit') {
        if (titleEl) titleEl.textContent = `Edit Destination — ${dest.name}`;

        bodyEl.innerHTML = `
            <div class="form-group" style="margin-bottom: 0.75rem;">
                <label style="font-weight: 600; font-size: 0.85rem;">Destination Name</label>
                <input type="text" id="edit-dest-name-input" class="form-control" value="${dest.name}">
            </div>
            <div class="form-group" style="margin-bottom: 0.75rem;">
                <label style="font-weight: 600; font-size: 0.85rem;">Category</label>
                <select id="edit-dest-cat-select" class="form-control">
                    <option value="Heritage Fort" ${dest.category === 'Heritage Fort' ? 'selected' : ''}>Heritage Fort</option>
                    <option value="UNESCO World Heritage Site" ${dest.category === 'UNESCO World Heritage Site' ? 'selected' : ''}>UNESCO World Heritage Site</option>
                    <option value="Hill Station" ${dest.category === 'Hill Station' ? 'selected' : ''}>Hill Station</option>
                    <option value="Pilgrimage Site" ${dest.category === 'Pilgrimage Site' ? 'selected' : ''}>Pilgrimage Site</option>
                    <option value="Eco & Wildlife Reserve" ${dest.category === 'Eco & Wildlife Reserve' ? 'selected' : ''}>Eco & Wildlife Reserve</option>
                    <option value="Coastal Beach" ${dest.category === 'Coastal Beach' ? 'selected' : ''}>Coastal Beach</option>
                </select>
            </div>
            <div class="form-group" style="margin-bottom: 0.75rem;">
                <label style="font-weight: 600; font-size: 0.85rem;">Image URL</label>
                <input type="text" id="edit-dest-img-input" class="form-control" value="${dest.img || ''}">
            </div>
        `;

        footerEl.innerHTML = `
            <button type="button" class="btn-secondary" id="btn-cancel-edit-dest" style="padding: 0.45rem 0.9rem; font-size: 0.82rem;">Cancel</button>
            <button type="button" class="btn-primary" id="btn-save-edit-dest" style="padding: 0.45rem 1.1rem; font-size: 0.82rem;">Save Changes</button>
        `;

        const cancelEditBtn = document.getElementById('btn-cancel-edit-dest');
        if (cancelEditBtn) cancelEditBtn.onclick = () => openDestinationDetailModal(destId, 'view');

        const saveEditBtn = document.getElementById('btn-save-edit-dest');
        if (saveEditBtn) {
            saveEditBtn.onclick = async () => {
                const nameVal = document.getElementById('edit-dest-name-input').value.trim();
                const catVal = document.getElementById('edit-dest-cat-select').value;
                const imgVal = document.getElementById('edit-dest-img-input').value.trim();

                if (!nameVal) {
                    alert('Please enter a destination name.');
                    return;
                }

                dest.name = nameVal;
                dest.category = catVal;
                if (imgVal) dest.img = imgVal;

                await renderConnectedViews(window.YatraSetuManagerStore.getActiveContext());
                openDestinationDetailModal(destId, 'view');
            };
        }
    }

    if (closeBtn) {
        closeBtn.onclick = () => {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        };
    }

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}
