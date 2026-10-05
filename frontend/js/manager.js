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
 * Connected View Renderer Engine for Manager Subpages
 */
async function renderConnectedViews(context) {
    if (!context || typeof window.YatraSetuManagerStore === 'undefined') return;
    const { activeStateId, activeDestinationId } = context;
    const config = STATE_CONFIGS[activeStateId] || STATE_CONFIGS['maharashtra'];

    const formattedStateName = config.badge.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    const destLabel = activeDestinationId !== 'all' ? activeDestinationId.replace(/-/g, ' ').toUpperCase() : formattedStateName;

    // Populate destination filter dropdowns dynamically if present on active page
    const destinationsForState = await window.YatraSetuManagerStore.getDestinations(activeStateId);
    const destFilterSelects = document.querySelectorAll('#destination-filter-select, .destination-context-dropdown');
    destFilterSelects.forEach(select => {
        if (select) {
            const currentVal = activeDestinationId;
            select.innerHTML = `<option value="all">All Destinations</option>` + 
                destinationsForState.map(d => `<option value="${d.id}" ${d.id === currentVal ? 'selected' : ''}>${d.name}</option>`).join('');
            select.value = currentVal;
        }
    });

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
                    <td style="text-align: right; white-space: nowrap;">
                        <button type="button" class="btn-secondary btn-attr-view" data-attr-id="${attr.id}" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; font-weight: 600; margin-right: 0.25rem;">View</button>
                        <button type="button" class="btn-secondary btn-attr-edit" data-attr-id="${attr.id}" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; font-weight: 600; margin-right: 0.25rem;">Edit</button>
                        <button type="button" class="btn-secondary btn-attr-delete" data-attr-id="${attr.id}" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; font-weight: 600; color: #DC2626; border-color: #FECACA;">Delete</button>
                    </td>
                </tr>
                `;
            }).join('');

            attractionsTableBody.querySelectorAll('.btn-attr-view').forEach(btn => {
                btn.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    openAttractionDetailModal(btn.getAttribute('data-attr-id'), 'view');
                };
            });
            attractionsTableBody.querySelectorAll('.btn-attr-edit').forEach(btn => {
                btn.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    openAttractionDetailModal(btn.getAttribute('data-attr-id'), 'edit');
                };
            });
            attractionsTableBody.querySelectorAll('.btn-attr-delete').forEach(btn => {
                btn.onclick = async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const attrId = btn.getAttribute('data-attr-id');
                    const attrItem = (window.YatraSetuManagerData.attractions || []).find(a => a.id === attrId);
                    if (attrItem && confirm(`Are you sure you want to delete attraction "${attrItem.name}"?`)) {
                        const idx = window.YatraSetuManagerData.attractions.findIndex(a => a.id === attrId);
                        if (idx !== -1) window.YatraSetuManagerData.attractions.splice(idx, 1);
                        await renderConnectedViews(window.YatraSetuManagerStore.getActiveContext());
                    }
                };
            });
        } else {
            attractionsTableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 2.5rem; color: #64748b; font-weight: 500;">No attraction records available for ${activeDestinationId !== 'all' ? activeDestinationId : formattedStateName}.</td></tr>`;
        }
        filterTableRows();
    }

    // 3. EVENTS VIEW (events.html)
    const featuredEventTitle = document.querySelector('.event-featured-card h2');
    const featuredEventP = document.querySelector('.event-featured-card p');
    const featuredEventMedia = document.querySelector('.event-featured-media');
    const featuredEventBtn = document.querySelector('.event-featured-card button');

    const events = await window.YatraSetuManagerStore.getEvents(activeStateId, activeDestinationId);

    if (featuredEventTitle && events && events.length > 0) {
        const ev0 = events[0];
        featuredEventTitle.textContent = ev0.title;
        if (featuredEventP) featuredEventP.innerHTML = `📍 <strong>${ev0.dateNum || '28'} ${ev0.dateMonth || 'SEP'}</strong> • ${ev0.location || ev0.loc}`;
        if (featuredEventMedia && ev0.img) featuredEventMedia.style.backgroundImage = `url('${ev0.img}')`;
        if (featuredEventBtn) {
            featuredEventBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                openEventDetailModal(ev0.id, 'view');
            };
        }
    }

    const upcomingEventsContainer = document.querySelector('#upcoming-events-container');
    if (upcomingEventsContainer) {
        if (events && events.length > 0) {
            upcomingEventsContainer.innerHTML = events.map(ev => `
                <div class="event-timeline-card" data-category="${(ev.category || 'cultural').toLowerCase()}" style="display: flex; align-items: center; justify-content: space-between; padding: 1rem; border: 1px solid var(--card-border); border-radius: 10px; margin-bottom: 0.75rem; background: #fff;">
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <div class="event-date-box" style="text-align: center; background: var(--state-accent-light); padding: 0.5rem 0.75rem; border-radius: 8px;">
                            <span class="event-date-num" style="display: block; font-weight: 800; font-size: 1.1rem; color: var(--state-accent);">${ev.dateNum}</span>
                            <span class="event-date-month" style="font-size: 0.7rem; font-weight: 700; text-transform: uppercase; color: var(--text-muted);">${ev.dateMonth}</span>
                        </div>
                        <div>
                            <h4 style="font-size: 0.95rem; font-weight: 800; color: var(--text-primary); margin-bottom: 0.2rem;">${ev.title}</h4>
                            <span style="font-size: 0.78rem; color: var(--text-muted);">📍 ${ev.location}</span>
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                        <span class="status-pill ${ev.statusClass}">${ev.status}</span>
                        <button type="button" class="btn-secondary btn-event-view" data-event-id="${ev.id}" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; font-weight: 600;">View Details</button>
                        <button type="button" class="btn-secondary btn-event-edit" data-event-id="${ev.id}" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; font-weight: 600;">Edit</button>
                        <button type="button" class="btn-secondary btn-event-delete" data-event-id="${ev.id}" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; font-weight: 600; color: #DC2626; border-color: #FECACA;">Delete</button>
                    </div>
                </div>
            `).join('');

            upcomingEventsContainer.querySelectorAll('.btn-event-view').forEach(btn => {
                btn.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    openEventDetailModal(btn.getAttribute('data-event-id'), 'view');
                };
            });
            upcomingEventsContainer.querySelectorAll('.btn-event-edit').forEach(btn => {
                btn.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    openEventDetailModal(btn.getAttribute('data-event-id'), 'edit');
                };
            });
            upcomingEventsContainer.querySelectorAll('.btn-event-delete').forEach(btn => {
                btn.onclick = async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const eventId = btn.getAttribute('data-event-id');
                    const evItem = (window.YatraSetuManagerData.events || []).find(e => e.id === eventId);
                    if (evItem && confirm(`Are you sure you want to delete event "${evItem.title}"?`)) {
                        const idx = window.YatraSetuManagerData.events.findIndex(e => e.id === eventId);
                        if (idx !== -1) window.YatraSetuManagerData.events.splice(idx, 1);
                        await renderConnectedViews(window.YatraSetuManagerStore.getActiveContext());
                    }
                };
            });
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
                <tr data-category="${(sh.category || '').toLowerCase()}">
                    <td><strong>${sh.name}</strong></td>
                    <td>${sh.category}</td>
                    <td>${sh.destination}</td>
                    <td>${sh.contact}</td>
                    <td><span class="status-pill active">${sh.status || 'Verified'}</span></td>
                    <td style="text-align: right; white-space: nowrap;">
                        <button type="button" class="btn-secondary btn-sh-view" data-sh-id="${sh.id}" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; font-weight: 600; margin-right: 0.25rem;">View</button>
                        <button type="button" class="btn-secondary btn-sh-edit" data-sh-id="${sh.id}" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; font-weight: 600; margin-right: 0.25rem;">Edit</button>
                        <button type="button" class="btn-secondary btn-sh-delete" data-sh-id="${sh.id}" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; font-weight: 600; color: #DC2626; border-color: #FECACA;">Delete</button>
                    </td>
                </tr>
            `).join('');

            stakeholdersTableBody.querySelectorAll('.btn-sh-view').forEach(btn => {
                btn.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    openStakeholderDetailModal(btn.getAttribute('data-sh-id'), 'view');
                };
            });
            stakeholdersTableBody.querySelectorAll('.btn-sh-edit').forEach(btn => {
                btn.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    openStakeholderDetailModal(btn.getAttribute('data-sh-id'), 'edit');
                };
            });
            stakeholdersTableBody.querySelectorAll('.btn-sh-delete').forEach(btn => {
                btn.onclick = async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const shId = btn.getAttribute('data-sh-id');
                    const shItem = (window.YatraSetuManagerData.stakeholders || []).find(s => s.id === shId);
                    if (shItem && confirm(`Are you sure you want to delete stakeholder "${shItem.name}"?`)) {
                        const idx = window.YatraSetuManagerData.stakeholders.findIndex(s => s.id === shId);
                        if (idx !== -1) window.YatraSetuManagerData.stakeholders.splice(idx, 1);
                        await renderConnectedViews(window.YatraSetuManagerStore.getActiveContext());
                    }
                };
            });
        } else {
            stakeholdersTableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 2.5rem; color: #64748b; font-weight: 500;">No stakeholder records available for ${activeDestinationId !== 'all' ? activeDestinationId : formattedStateName}.</td></tr>`;
        }
    }

    // 5. VISITOR STATISTICS VIEW (visitor-statistics.html)
    const visitorOriginLabel = document.getElementById('visitor-origin-state-label');
    if (visitorOriginLabel) {
        visitorOriginLabel.innerHTML = `<span class="legend-dot" style="background: var(--state-accent);"></span> ${formattedStateName}`;
    }

    const visitorMetricCards = document.querySelectorAll('.metrics-grid-4 .metric-card');
    if (visitorMetricCards && visitorMetricCards.length >= 4 && window.location.pathname.includes('visitor-statistics.html')) {
        const isSingleDest = activeDestinationId !== 'all';
        const totalVis = isSingleDest ? '142.5K' : '1.85M';
        const domVis = isSingleDest ? '128.0K' : '1.62M';
        const intlVis = isSingleDest ? '14.5K' : '230K';
        const avgStay = isSingleDest ? '2.4 Days' : '3.8 Days';

        const vals = [totalVis, domVis, intlVis, avgStay];
        const subs = [
            `Active tracking for ${destLabel}`,
            `90% of total visitors`,
            `10% of total visitors`,
            `Average tourist stay duration`
        ];

        visitorMetricCards.forEach((card, idx) => {
            const valEl = card.querySelector('.metric-value');
            const subEl = card.querySelector('.metric-footer');
            if (valEl && vals[idx]) valEl.textContent = vals[idx];
            if (subEl && subs[idx]) subEl.textContent = subs[idx];
        });
    }

    // 6. FEEDBACK VIEW (feedback.html)
    const feedbackContainer = document.querySelector('#feedback-list-container');
    if (feedbackContainer) {
        const feedback = await window.YatraSetuManagerStore.getFeedback(activeStateId, activeDestinationId);
        
        // Update Overall Rating Card & Rating Distribution if elements exist
        const overallScoreEl = document.querySelector('.rating-overall-card .overall-score');
        const overallReviewSub = document.querySelector('.rating-overall-card span:last-child');
        const starRatingDisplay = document.querySelector('.rating-overall-card div[style*="font-size"]');
        
        if (overallScoreEl) {
            if (feedback && feedback.length > 0) {
                const sumRating = feedback.reduce((acc, f) => acc + (f.rating || 5), 0);
                const avgScore = (sumRating / feedback.length).toFixed(1);
                overallScoreEl.textContent = avgScore;
                if (starRatingDisplay) starRatingDisplay.textContent = '★'.repeat(Math.round(avgScore)) + '☆'.repeat(5 - Math.round(avgScore));
                if (starRatingDisplay) starRatingDisplay.style.color = '#F59E0B';
                if (overallReviewSub) overallReviewSub.textContent = `${feedback.length} review${feedback.length > 1 ? 's' : ''} recorded for ${destLabel}`;
            } else {
                overallScoreEl.textContent = '4.8';
                if (starRatingDisplay) starRatingDisplay.textContent = '★★★★★';
                if (starRatingDisplay) starRatingDisplay.style.color = '#F59E0B';
                if (overallReviewSub) overallReviewSub.textContent = `Active ratings for ${destLabel}`;
            }
        }

        // Update Rating Distribution Bar Fills
        const ratingBarItems = document.querySelectorAll('.rating-bar-list .rating-bar-item');
        if (ratingBarItems && ratingBarItems.length >= 5) {
            const defaultDist = ['75%', '18%', '5%', '2%', '0%'];
            ratingBarItems.forEach((item, idx) => {
                const fill = item.querySelector('.rating-bar-fill');
                const pct = item.querySelector('span:last-child');
                if (fill && defaultDist[idx]) fill.style.width = defaultDist[idx];
                if (pct && defaultDist[idx]) pct.textContent = defaultDist[idx];
            });
        }

        if (feedback && feedback.length > 0) {
            feedbackContainer.innerHTML = feedback.map(fb => `
                <div class="feedback-item-card" data-category="${(fb.category || 'reviews').toLowerCase()}" style="background: #fff; border: 1px solid var(--card-border); border-radius: 10px; padding: 1.25rem; margin-bottom: 1rem;">
                    <div class="feedback-author-row" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                        <div class="author-info" style="display: flex; align-items: center; gap: 0.75rem;">
                            <div class="author-avatar" style="width: 36px; height: 36px; border-radius: 50%; background: var(--state-accent-light); color: var(--state-accent); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.85rem;">${fb.author ? fb.author.slice(0, 2).toUpperCase() : 'VS'}</div>
                            <div>
                                <h4 style="font-size: 0.88rem; font-weight: 700; color: var(--text-primary); margin: 0;">${fb.author || 'Visitor'}</h4>
                                <span style="font-size: 0.75rem; color: var(--text-muted);">${fb.date || 'Recently'} • ${fb.destination || formattedStateName}</span>
                            </div>
                        </div>
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <span style="color: #F59E0B; font-size: 0.85rem;">${'★'.repeat(fb.rating || 5)}</span>
                            <span class="badge badge-success">Positive</span>
                            <button type="button" class="btn-secondary btn-fb-view" data-fb-id="${fb.id}" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; font-weight: 600;">View</button>
                            <button type="button" class="btn-secondary btn-fb-delete" data-fb-id="${fb.id}" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; font-weight: 600; color: #DC2626; border-color: #FECACA;">Delete</button>
                        </div>
                    </div>
                    <p style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.5; margin: 0;">${fb.text}</p>
                </div>
            `).join('');

            feedbackContainer.querySelectorAll('.btn-fb-view').forEach(btn => {
                btn.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    openFeedbackDetailModal(btn.getAttribute('data-fb-id'));
                };
            });
            feedbackContainer.querySelectorAll('.btn-fb-delete').forEach(btn => {
                btn.onclick = async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const fbId = btn.getAttribute('data-fb-id');
                    if (confirm('Are you sure you want to delete this feedback record?')) {
                        const idx = window.YatraSetuManagerData.feedback.findIndex(f => f.id === fbId);
                        if (idx !== -1) window.YatraSetuManagerData.feedback.splice(idx, 1);
                        await renderConnectedViews(window.YatraSetuManagerStore.getActiveContext());
                    }
                };
            });
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
        const firstEvent = (events && events.length > 0) ? events[0] : (config.events && config.events[0]) ? config.events[0] : { title: `${formattedStateName} Cultural Festival`, location: formattedStateName };
        const dest1 = (config.topDestinations && config.topDestinations[0]) ? config.topDestinations[0].name : formattedStateName;
        const dest2 = (config.topDestinations && config.topDestinations[1]) ? config.topDestinations[1].name : dest1;

        signalsContainer.innerHTML = `
            <div class="decision-signal-card" data-category="insights" style="border-left-color: #3B82F6;">
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
                        <p class="signal-box-txt">Visitor numbers increased during the ${firstEvent.title} period.</p>
                    </div>
                    <div class="signal-box">
                        <span class="signal-box-lbl">OBSERVATION</span>
                        <p class="signal-box-txt">Overcrowding spike in visitors across ${firstEvent.location || firstEvent.loc || formattedStateName}.</p>
                    </div>
                    <div class="signal-box" style="background: #EFF6FF; border-color: #BFDBFE;">
                        <span class="signal-box-lbl" style="color: #1D4ED8;">MANAGEMENT CONSIDERATION</span>
                        <p class="signal-box-txt" style="color: #1E3A8A; font-weight: 500;">Review crowd-management arrangements, transport facilities, and waste-management for future event periods in ${formattedStateName}.</p>
                    </div>
                </div>
            </div>

            <div class="decision-signal-card" data-category="destination" style="border-left-color: #8B5CF6;">
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
                        <p class="signal-box-txt">Interest in ${dest1} increased during recent quarters.</p>
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

            <div class="decision-signal-card" data-category="visitor" style="border-left-color: var(--state-accent);">
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
                        <p class="signal-box-txt">Queries for ${dest2} up for the upcoming seasonal window.</p>
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
    initTopbarSharedFeatures();
    initManagerProfilePage();
});

/**
 * Shared Topbar Features Initialization (Across all 11 Manager Pages)
 */
function initTopbarSharedFeatures() {
    const topbar = document.querySelector('.app-topbar');
    if (!topbar) return;

    // Helper function to close all floating panels
    const closeAllTopbarPanels = () => {
        const searchPanel = document.getElementById('topbar-search-results');
        const notifPanel = document.getElementById('notification-dropdown-panel');
        const userPanel = document.getElementById('user-menu-dropdown-panel');
        const userBadge = document.getElementById('topbar-user-badge') || document.querySelector('.user-profile-badge');

        if (searchPanel) searchPanel.classList.remove('show');
        if (notifPanel) notifPanel.classList.remove('show');
        if (userPanel) userPanel.classList.remove('show');
        if (userBadge) userBadge.classList.remove('active');
    };

    // 1. Mobile Sidebar Toggle
    const sidebarToggleBtn = document.getElementById('sidebar-toggle-btn') || document.querySelector('.mobile-menu-toggle');
    const appSidebar = document.getElementById('app-sidebar') || document.querySelector('.app-sidebar');

    if (sidebarToggleBtn && appSidebar) {
        sidebarToggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            appSidebar.classList.toggle('show');
            appSidebar.classList.toggle('drawer-open');
        });
    }

    // 2. Sync Topbar Profile Name & Avatar + Floating Profile Menu
    const profile = (window.YatraSetuManagerData && window.YatraSetuManagerData.profile) ? window.YatraSetuManagerData.profile : {
        name: 'Ambika Ambekar',
        avatar_initials: 'AA',
        manager_type: 'State Manager'
    };

    const userBadge = document.getElementById('topbar-user-badge') || document.querySelector('.user-profile-badge');
    if (userBadge) {
        const userAvatarEl = userBadge.querySelector('.user-avatar') || document.getElementById('topbar-user-avatar');
        const userNameEl = userBadge.querySelector('.user-name') || document.getElementById('topbar-user-name');
        const userRoleSubEl = userBadge.querySelector('.user-role-sub');

        const initials = profile.avatar_initials || (profile.name ? profile.name.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase() : 'AA');
        if (userAvatarEl) userAvatarEl.textContent = initials;
        if (userNameEl) userNameEl.textContent = profile.name;
        if (userRoleSubEl) userRoleSubEl.textContent = profile.manager_type || 'State Manager';

        let userPanel = document.getElementById('user-menu-dropdown-panel');
        if (!userPanel) {
            userPanel = document.createElement('div');
            userPanel.id = 'user-menu-dropdown-panel';
            userPanel.className = 'topbar-dropdown-panel';
            userPanel.innerHTML = `
                <a href="profile.html" class="dropdown-menu-item">
                    <span>👤</span> <span>View Profile</span>
                </a>
                <a href="profile.html?action=edit" class="dropdown-menu-item">
                    <span>✏️</span> <span>Edit Profile</span>
                </a>
                <a href="profile.html?tab=security" class="dropdown-menu-item">
                    <span>🔐</span> <span>Account Security</span>
                </a>
                <div class="dropdown-divider"></div>
                <button type="button" class="dropdown-menu-item logout-item" id="topbar-btn-logout">
                    <span>🚪</span> <span>Logout</span>
                </button>
            `;
            const topbarRight = document.querySelector('.topbar-right');
            if (topbarRight) {
                topbarRight.appendChild(userPanel);
            } else {
                userBadge.parentElement.appendChild(userPanel);
            }

            const logoutBtn = userPanel.querySelector('#topbar-btn-logout');
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
            const isOpen = userPanel.classList.contains('show');
            closeAllTopbarPanels();
            if (!isOpen) {
                userPanel.classList.add('show');
                userBadge.classList.add('active');
            }
        };
    }

    // 3. Floating Notifications Bell Dropdown
    const notifBtn = document.getElementById('topbar-notification-btn') || document.querySelector('.notification-btn');
    if (notifBtn) {
        const notifBadge = notifBtn.querySelector('.notification-badge') || document.getElementById('topbar-notif-badge');

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
            notifPanel.className = 'topbar-dropdown-panel';
            notifPanel.innerHTML = `
                <div class="topbar-dropdown-header">
                    <span>Notifications</span>
                    <button type="button" id="btn-mark-all-read" style="background:none; border:none; color: var(--state-accent); font-size: 0.75rem; font-weight: 700; cursor: pointer;">Mark all read</button>
                </div>
                <div class="topbar-dropdown-body" id="notification-list-body"></div>
                <div class="topbar-dropdown-footer">
                    <span style="color: var(--text-muted); font-size: 0.75rem;">YatraSetu Real-time Updates</span>
                </div>
            `;
            const topbarRight = document.querySelector('.topbar-right');
            if (topbarRight) {
                topbarRight.appendChild(notifPanel);
            } else {
                notifBtn.parentElement.appendChild(notifPanel);
            }
        }

        const renderNotifList = () => {
            const listBody = document.getElementById('notification-list-body');
            if (!listBody) return;

            const notifications = (window.YatraSetuManagerData && window.YatraSetuManagerData.notifications) ? window.YatraSetuManagerData.notifications : [];
            if (notifications.length === 0) {
                listBody.innerHTML = `<div style="padding: 1.5rem; text-align: center; color: var(--text-muted); font-size: 0.85rem;">No new notifications</div>`;
                return;
            }

            listBody.innerHTML = notifications.map(n => `
                <div class="notification-item ${n.read ? '' : 'unread'}" data-notif-id="${n.id}">
                    <div class="notification-title">${n.title}</div>
                    <div class="notification-msg">${n.message}</div>
                    <div class="notification-time">${n.time}</div>
                </div>
            `).join('');
        };

        const markAllReadBtn = document.getElementById('btn-mark-all-read');
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

        notifBtn.onclick = (e) => {
            e.stopPropagation();
            const isOpen = notifPanel.classList.contains('show');
            closeAllTopbarPanels();
            if (!isOpen) {
                renderNotifList();
                notifPanel.classList.add('show');
            }
        };
    }

    // 4. Floating Topbar Global Search Functionality
    const searchBox = document.querySelector('.topbar-left .search-box') || document.querySelector('.search-box');
    const searchInput = searchBox ? (searchBox.querySelector('.search-input') || document.getElementById('topbar-search-input')) : null;

    if (searchBox && searchInput) {
        searchInput.placeholder = "Search destinations, attractions, events...";

        let searchResultsPanel = document.getElementById('topbar-search-results');
        if (!searchResultsPanel) {
            searchResultsPanel = document.createElement('div');
            searchResultsPanel.id = 'topbar-search-results';
            searchResultsPanel.className = 'topbar-dropdown-panel';
            searchBox.appendChild(searchResultsPanel);
        }

        searchInput.addEventListener('focus', () => {
            if (searchInput.value.trim().length >= 2) {
                const isOpen = searchResultsPanel.classList.contains('show');
                if (!isOpen) {
                    closeAllTopbarPanels();
                    searchResultsPanel.classList.add('show');
                }
            }
        });

        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim().toLowerCase();
            if (query.length < 2) {
                searchResultsPanel.classList.remove('show');
                return;
            }

            closeAllTopbarPanels();

            const data = window.YatraSetuManagerData || {};
            const dests = (data.destinations || []).filter(d => d.name.toLowerCase().includes(query)).slice(0, 3);
            const attrs = (data.attractions || []).filter(a => a.name.toLowerCase().includes(query)).slice(0, 3);
            const evts = (data.events || []).filter(ev => (ev.title || '').toLowerCase().includes(query)).slice(0, 3);
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
                item.addEventListener('click', (ev) => {
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
                });
            });
        });
    }

    // 5. Global Click Outside & Escape Key Listeners
    document.addEventListener('click', () => {
        closeAllTopbarPanels();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAllTopbarPanels();
        }
    });
}

/**
 * Manager Profile Page Functionality
 */
function initManagerProfilePage() {
    const isProfilePage = window.location.pathname.includes('profile.html');
    const profileBannerName = document.getElementById('profile-banner-name');

    if (!isProfilePage && !profileBannerName) return;

    const data = window.YatraSetuManagerData || {};
    const profile = data.profile || {
        id: 'MGR-MH-40192',
        name: 'Rajesh Patil',
        email: 'rajesh.patil@mahatourism.gov.in',
        phone: '+91 98230 41092',
        manager_type: 'State Manager',
        scope: 'STATE',
        state_id: 'maharashtra',
        state_name: 'Maharashtra',
        destination: 'All destinations in Maharashtra',
        status: 'Active',
        avatar_initials: 'RP'
    };

    // Render profile values to DOM
    const renderProfileDOM = () => {
        const initials = profile.avatar_initials || (profile.name ? profile.name.split(' ').map(n=>n[0]).join('').toUpperCase() : 'AA');

        // Banner Elements
        const bannerAvatar = document.getElementById('profile-banner-avatar');
        const bannerName = document.getElementById('profile-banner-name');
        const bannerRole = document.getElementById('profile-banner-role');
        const bannerStatus = document.getElementById('profile-banner-status');

        if (bannerAvatar) bannerAvatar.textContent = initials;
        if (bannerName) bannerName.textContent = profile.name;
        if (bannerRole) bannerRole.innerHTML = `${profile.manager_type} — ${profile.state_name || 'Maharashtra'} • ID: <strong style="color: var(--text-primary);">${profile.id}</strong>`;
        if (bannerStatus) bannerStatus.textContent = `${profile.status || 'Active'} / Verified`;

        // Card Text Elements
        const valName = document.getElementById('prof-val-name');
        const valEmail = document.getElementById('prof-val-email');
        const valPhone = document.getElementById('prof-val-phone');
        const valId = document.getElementById('prof-val-id');
        const valRole = document.getElementById('prof-val-role');
        const valType = document.getElementById('prof-val-type');
        const valState = document.getElementById('prof-val-state');
        const valDest = document.getElementById('prof-val-dest-scope');

        if (valName) valName.textContent = profile.name;
        if (valEmail) valEmail.textContent = profile.email;
        if (valPhone) valPhone.textContent = profile.phone;
        if (valId) valId.textContent = profile.id;
        if (valRole) valRole.textContent = profile.manager_type || 'Destination Manager';
        if (valType) valType.textContent = profile.manager_type || 'State Manager';
        if (valState) valState.textContent = profile.state_name || 'Maharashtra';
        if (valDest) valDest.textContent = profile.destination || 'All Destinations';
    };

    renderProfileDOM();

    // Open Edit Profile Modal Handlers
    const openEditBtn = document.getElementById('btn-open-edit-profile');
    const editInfoCardBtn = document.getElementById('btn-edit-info-card');
    const editModal = document.getElementById('editProfileModal');

    const openProfileModal = () => {
        if (!editModal) return;
        const nameInput = document.getElementById('edit-prof-name');
        const emailInput = document.getElementById('edit-prof-email');
        const phoneInput = document.getElementById('edit-prof-phone');

        if (nameInput) nameInput.value = profile.name;
        if (emailInput) emailInput.value = profile.email;
        if (phoneInput) phoneInput.value = profile.phone;

        editModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    };

    if (openEditBtn) openEditBtn.onclick = openProfileModal;
    if (editInfoCardBtn) editInfoCardBtn.onclick = openProfileModal;

    // Check URL parameters for direct modal trigger e.g. profile.html?action=edit
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('action') === 'edit') {
        openProfileModal();
    }

    // Close Edit Modal Handlers
    const closeEditBtn = document.getElementById('btn-close-edit-profile');
    const cancelEditBtn = document.getElementById('btn-cancel-edit-profile');
    const closeEditModal = () => {
        if (editModal) {
            editModal.classList.remove('active');
            document.body.style.overflow = '';
        }
    };
    if (closeEditBtn) closeEditBtn.onclick = closeEditModal;
    if (cancelEditBtn) cancelEditBtn.onclick = closeEditModal;

    // Save Profile Changes
    const saveProfileBtn = document.getElementById('btn-save-profile');
    if (saveProfileBtn) {
        saveProfileBtn.onclick = () => {
            const nameInput = document.getElementById('edit-prof-name');
            const emailInput = document.getElementById('edit-prof-email');
            const phoneInput = document.getElementById('edit-prof-phone');

            const newName = nameInput ? nameInput.value.trim() : '';
            const newEmail = emailInput ? emailInput.value.trim() : '';
            const newPhone = phoneInput ? phoneInput.value.trim() : '';

            if (!newName) {
                alert('Please enter your full name.');
                return;
            }

            profile.name = newName;
            if (newEmail) profile.email = newEmail;
            if (newPhone) profile.phone = newPhone;
            profile.avatar_initials = newName.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase();

            renderProfileDOM();

            // Sync Topbar Avatar & Name
            const userAvatarEl = document.querySelector('.user-profile-badge .user-avatar');
            const userNameEl = document.querySelector('.user-profile-badge .user-name');
            if (userAvatarEl) userAvatarEl.textContent = profile.avatar_initials;
            if (userNameEl) userNameEl.textContent = profile.name;

            closeEditModal();
        };
    }

    // Change Password Modal Handlers
    const changePassCardBtn = document.getElementById('btn-change-password-card');
    const passModal = document.getElementById('changePasswordModal');

    const openPassModal = () => {
        if (!passModal) return;
        document.getElementById('pass-current').value = '';
        document.getElementById('pass-new').value = '';
        document.getElementById('pass-confirm').value = '';
        passModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    };

    if (changePassCardBtn) changePassCardBtn.onclick = openPassModal;
    if (urlParams.get('tab') === 'security') {
        openPassModal();
    }

    const closePassBtn = document.getElementById('btn-close-change-pass');
    const cancelPassBtn = document.getElementById('btn-cancel-pass');
    const closePassModal = () => {
        if (passModal) {
            passModal.classList.remove('active');
            document.body.style.overflow = '';
        }
    };
    if (closePassBtn) closePassBtn.onclick = closePassModal;
    if (cancelPassBtn) cancelPassBtn.onclick = closePassModal;

    const savePassBtn = document.getElementById('btn-save-pass');
    if (savePassBtn) {
        savePassBtn.onclick = () => {
            const current = document.getElementById('pass-current').value;
            const newP = document.getElementById('pass-new').value;
            const confP = document.getElementById('pass-confirm').value;

            if (!current) { alert('Please enter your current password.'); return; }
            if (!newP || newP.length < 6) { alert('New password must be at least 6 characters.'); return; }
            if (newP !== confP) { alert('New password and confirmation do not match.'); return; }

            alert('Password updated successfully!');
            closePassModal();
        };
    }

    // Logout from Security Card
    const logoutSessionBtn = document.getElementById('btn-logout-session');
    if (logoutSessionBtn) {
        logoutSessionBtn.onclick = () => {
            if (confirm('Are you sure you want to log out of your session?')) {
                sessionStorage.clear();
                window.location.href = '../login.html';
            }
        };
    }
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

/**
 * Table Search & Filtering Logic
 */
function initTableSearchAndFilters() {
    const searchInputs = document.querySelectorAll('.table-search-input, .topbar-search-input-rounded, .search-input');
    const filterSelects = document.querySelectorAll('.table-filter-select, .filter-select');
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
            const bar = pill.closest('.filter-pill-bar');
            if (bar) bar.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
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
    const searchInput = document.querySelector('.table-search-input') || document.querySelector('.topbar-search-input-rounded') || document.querySelector('.search-input');
    const filterCategorySelect = document.querySelector('[data-filter="category"]');
    const activePill = document.querySelector('.filter-pill-bar .filter-pill.active');
    const pillText = activePill ? activePill.textContent.trim().toLowerCase() : 'all';
    const pillCategory = activePill ? (activePill.getAttribute('data-category') || pillText).toLowerCase() : 'all';
    const selectCategory = filterCategorySelect ? filterCategorySelect.value.toLowerCase() : 'all';
    const categoryTerm = pillCategory !== 'all' ? pillCategory : selectCategory;

    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';

    // 1. Table rows
    const tables = document.querySelectorAll('.app-table');
    tables.forEach(table => {
        const rows = table.querySelectorAll('tbody tr');
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            const rowCategory = row.getAttribute('data-category')?.toLowerCase() || '';
            const matchesSearch = text.includes(searchTerm);
            let matchesCategory = true;
            if (categoryTerm !== 'all' && !categoryTerm.includes('all')) {
                matchesCategory = rowCategory.includes(categoryTerm) || text.includes(categoryTerm);
            }
            row.style.display = (matchesSearch && matchesCategory) ? '' : 'none';
        });
    });

    // 2. Event cards on events.html
    const eventCards = document.querySelectorAll('.event-timeline-card');
    eventCards.forEach(card => {
        const text = card.textContent.toLowerCase();
        const matchesSearch = text.includes(searchTerm);
        let matchesCategory = true;
        if (categoryTerm !== 'all' && !categoryTerm.includes('all')) {
            matchesCategory = text.includes(categoryTerm) || (card.getAttribute('data-category') || '').includes(categoryTerm);
        }
        card.style.display = (matchesSearch && matchesCategory) ? 'flex' : 'none';
    });

    // 3. Feedback cards on feedback.html
    const feedbackCards = document.querySelectorAll('.feedback-item-card');
    feedbackCards.forEach(card => {
        const text = card.textContent.toLowerCase();
        const matchesSearch = text.includes(searchTerm);
        let matchesCategory = true;
        if (categoryTerm !== 'all' && !categoryTerm.includes('all')) {
            matchesCategory = text.includes(categoryTerm) || (card.getAttribute('data-category') || '').includes(categoryTerm);
        }
        card.style.display = (matchesSearch && matchesCategory) ? 'block' : 'none';
    });

    // 4. Decision signal cards on decision-support.html
    const signalCards = document.querySelectorAll('.decision-signal-card');
    signalCards.forEach(card => {
        const text = card.textContent.toLowerCase();
        const matchesSearch = text.includes(searchTerm);
        let matchesCategory = true;
        if (categoryTerm !== 'all' && !categoryTerm.includes('all') && !categoryTerm.includes('key insights')) {
            matchesCategory = text.includes(categoryTerm) || (card.getAttribute('data-category') || '').includes(categoryTerm);
        }
        card.style.display = (matchesSearch && matchesCategory) ? 'block' : 'none';
    });

    // 5. Analytics tab switching on analytics.html
    const chartTitle = document.querySelector('.chart-title');
    if (chartTitle && window.location.pathname.includes('analytics.html')) {
        const titleMap = {
            'visitor trends': 'Visitor Trends & Comparison',
            'destination popularity': 'Destination Footfall & Ranking Analysis',
            'attraction interest': 'Attraction Interest & Visitor Preferences',
            'event impact': 'Event Attendance & Cultural Impact Analysis',
            'seasonal analysis': 'Seasonal Visitor Movement & Peak Trends'
        };
        const activePillName = activePill ? activePill.textContent.trim().toLowerCase() : 'visitor trends';
        if (titleMap[activePillName]) {
            chartTitle.textContent = titleMap[activePillName];
        }
    }
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

    const handleGenerate = (reportName = 'Tourism Report') => {
        const typeSelect = document.getElementById('report-type-select');
        const periodSelect = document.getElementById('report-period-select');
        const reportTitle = document.getElementById('preview-report-title');
        const reportDate = document.getElementById('preview-report-date');

        const typeName = typeSelect ? typeSelect.options[typeSelect.selectedIndex].text : reportName;
        const periodName = periodSelect ? periodSelect.options[periodSelect.selectedIndex].text : 'Last 3 Months';

        const ctx = window.YatraSetuManagerStore ? window.YatraSetuManagerStore.getActiveContext() : { activeStateId: 'maharashtra', activeDestinationId: 'all' };
        const data = window.YatraSetuManagerData || {};

        const destinations = (data.destinations || []).filter(d => !ctx.activeStateId || ctx.activeStateId === 'all' || d.state_id === ctx.activeStateId);
        const attractions = (data.attractions || []).filter(a => (!ctx.activeStateId || ctx.activeStateId === 'all' || a.state_id === ctx.activeStateId) && (ctx.activeDestinationId === 'all' || a.destination_id === ctx.activeDestinationId));
        const events = (data.events || []).filter(e => (!ctx.activeStateId || ctx.activeStateId === 'all' || e.state_id === ctx.activeStateId) && (ctx.activeDestinationId === 'all' || e.destination_id === ctx.activeDestinationId));
        const stakeholders = (data.stakeholders || []).filter(s => (!ctx.activeStateId || ctx.activeStateId === 'all' || s.state_id === ctx.activeStateId) && (ctx.activeDestinationId === 'all' || s.destination_id === ctx.activeDestinationId));

        const stateName = ctx.activeStateId ? ctx.activeStateId.toUpperCase() : 'MAHARASHTRA';
        const destName = ctx.activeDestinationId !== 'all' ? ctx.activeDestinationId.toUpperCase() : 'ALL DESTINATIONS';

        if (reportTitle) reportTitle.textContent = `${typeName} — ${stateName} (${destName})`;
        if (reportDate) reportDate.textContent = `Period: ${periodName} • Generated: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`;

        if (reportPreview) {
            reportPreview.style.display = 'block';
            const bodyEl = reportPreview.querySelector('.preview-body') || reportPreview;
            if (bodyEl) {
                bodyEl.innerHTML = `
                    <div style="background: #fff; border: 1px solid var(--card-border); border-radius: 10px; padding: 1.5rem; margin-top: 1rem;">
                        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid var(--state-accent); padding-bottom: 0.75rem; margin-bottom: 1rem;">
                            <h3 style="margin: 0; font-size: 1.1rem; color: var(--text-primary);">${typeName}</h3>
                            <button type="button" class="btn-primary" id="btn-export-download-txt" style="padding: 0.35rem 0.85rem; font-size: 0.8rem;">📥 Export Report Data</button>
                        </div>
                        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.25rem; background: var(--surface-subtle); padding: 1rem; border-radius: 8px;">
                            <div><span style="font-size: 0.75rem; color: var(--text-muted);">Destinations</span><br><strong style="font-size: 1.2rem;">${destinations.length}</strong></div>
                            <div><span style="font-size: 0.75rem; color: var(--text-muted);">Attractions</span><br><strong style="font-size: 1.2rem;">${attractions.length}</strong></div>
                            <div><span style="font-size: 0.75rem; color: var(--text-muted);">Upcoming Events</span><br><strong style="font-size: 1.2rem;">${events.length}</strong></div>
                            <div><span style="font-size: 0.75rem; color: var(--text-muted);">Partners / Stakeholders</span><br><strong style="font-size: 1.2rem;">${stakeholders.length}</strong></div>
                        </div>
                        <h4 style="font-size: 0.9rem; font-weight: 700; margin-bottom: 0.5rem;">Key Executive Summary</h4>
                        <p style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.6;">
                            This report covers active destination management records for <strong>${stateName}</strong> (Scope: <strong>${destName}</strong>). 
                            Total verified attractions stand at <strong>${attractions.length}</strong>, supported by <strong>${events.length}</strong> registered festival/cultural events and <strong>${stakeholders.length}</strong> verified ecosystem service partners.
                        </p>
                    </div>
                `;

                const exportBtn = document.getElementById('btn-export-download-txt');
                if (exportBtn) {
                    exportBtn.onclick = () => {
                        const reportText = `==================================================\nYATRASETU SMART DESTINATION MANAGEMENT PLATFORM\nEXECUTIVE TOURISM REPORT\n==================================================\n\nReport Type: ${typeName}\nState Context: ${stateName}\nDestination Context: ${destName}\nReporting Period: ${periodName}\nGenerated Date: ${new Date().toLocaleString()}\n\nSUMMARY METRICS:\n- Total Destinations: ${destinations.length}\n- Total Attractions: ${attractions.length}\n- Upcoming Events: ${events.length}\n- Verified Stakeholders: ${stakeholders.length}\n\nDESTINATION LIST:\n${destinations.map(d => `* ${d.name} (${d.category || 'General'})`).join('\n')}\n\nATTRACTIONS LIST:\n${attractions.map(a => `* ${a.name} [Status: ${a.status || 'Open'}]`).join('\n')}\n\nUPCOMING EVENTS:\n${events.map(e => `* ${e.title} (${e.dateNum} ${e.dateMonth}) - ${e.location}`).join('\n')}\n\n==================================================\nEnd of Report.\n`;
                        const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
                        const link = document.createElement('a');
                        link.href = URL.createObjectURL(blob);
                        link.download = `YatraSetu_${typeName.replace(/\s+/g, '_')}_${stateName}.txt`;
                        link.click();
                    };
                }
            }
            reportPreview.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    if (generateBtn) {
        generateBtn.addEventListener('click', (e) => {
            e.preventDefault();
            handleGenerate();
        });
    }

    document.querySelectorAll('#reports-card-grid .report-item-card').forEach(card => {
        const titleEl = card.querySelector('h4');
        const titleText = titleEl ? titleEl.textContent : 'Tourism Report';
        const genBtn = card.querySelector('button.btn-secondary');
        const dlBtn = card.querySelector('button.btn-primary');

        if (genBtn) {
            genBtn.onclick = (e) => {
                e.preventDefault();
                handleGenerate(titleText);
            };
        }
        if (dlBtn) {
            dlBtn.onclick = (e) => {
                e.preventDefault();
                handleGenerate(titleText);
                setTimeout(() => {
                    const exportBtn = document.getElementById('btn-export-download-txt');
                    if (exportBtn) exportBtn.click();
                }, 200);
            };
        }
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

/**
 * Attraction Details & Actions Modal Functionality
 */
function openAttractionDetailModal(attrId, mode = 'view') {
    if (!attrId || !window.YatraSetuManagerData || !window.YatraSetuManagerData.attractions) return;
    const attr = window.YatraSetuManagerData.attractions.find(a => a.id === attrId);
    if (!attr) return;

    const modal = document.getElementById('attractionDetailModal');
    const titleEl = document.getElementById('attr-detail-modal-title');
    const bodyEl = document.getElementById('attr-detail-modal-body');
    const footerEl = document.getElementById('attr-detail-modal-footer');
    const closeBtn = document.getElementById('btn-close-attr-detail-modal');

    if (!modal || !bodyEl || !footerEl) return;

    const allDest = window.YatraSetuManagerData.destinations || [];
    const destObj = allDest.find(d => d.id === attr.destination_id);
    const destName = destObj ? destObj.name : attr.destination_id;

    if (mode === 'view') {
        if (titleEl) titleEl.textContent = `${attr.name} — Attraction Details`;

        bodyEl.innerHTML = `
            <div style="display: flex; gap: 1rem; flex-wrap: wrap; margin-bottom: 1rem;">
                <img src="${attr.img}" alt="${attr.name}" style="width: 100%; max-height: 200px; object-fit: cover; border-radius: 8px;">
            </div>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; margin-bottom: 1rem; font-size: 0.88rem;">
                <div><strong>Attraction Name:</strong> <span>${attr.name}</span></div>
                <div><strong>Destination:</strong> <span>${destName}</span></div>
                <div><strong>Category:</strong> <span>${attr.category || 'Attraction'}</span></div>
                <div><strong>State:</strong> <span>${attr.state_id ? attr.state_id.toUpperCase() : 'MAHARASHTRA'}</span></div>
                <div><strong>Rating:</strong> <span style="color: #F59E0B; font-weight: 700;">⭐ ${attr.rating || '4.8'}</span></div>
                <div><strong>Status:</strong> <span class="badge badge-${attr.status === 'Closed' ? 'danger' : (attr.status === 'Maintenance' ? 'warning' : 'success')}">${attr.status || 'Open'}</span></div>
            </div>
        `;

        footerEl.innerHTML = `
            <div style="display: flex; gap: 0.5rem;">
                <button type="button" class="btn-primary" id="btn-edit-attr-modal" style="padding: 0.45rem 0.9rem; font-size: 0.82rem;">Edit Details</button>
                <button type="button" class="btn-secondary" id="btn-delete-attr-modal" style="padding: 0.45rem 0.9rem; font-size: 0.82rem; color: #DC2626; border-color: #FECACA;">Delete</button>
            </div>
            <button type="button" class="btn-secondary" id="btn-close-attr-modal-action" style="padding: 0.45rem 0.9rem; font-size: 0.82rem;">Close</button>
        `;

        const editBtn = document.getElementById('btn-edit-attr-modal');
        if (editBtn) editBtn.onclick = () => openAttractionDetailModal(attrId, 'edit');

        const deleteBtn = document.getElementById('btn-delete-attr-modal');
        if (deleteBtn) {
            deleteBtn.onclick = async () => {
                if (confirm(`Are you sure you want to delete attraction "${attr.name}"?`)) {
                    const idx = window.YatraSetuManagerData.attractions.findIndex(a => a.id === attrId);
                    if (idx !== -1) window.YatraSetuManagerData.attractions.splice(idx, 1);
                    modal.classList.remove('active');
                    document.body.style.overflow = '';
                    await renderConnectedViews(window.YatraSetuManagerStore.getActiveContext());
                }
            };
        }

        const closeActionBtn = document.getElementById('btn-close-attr-modal-action');
        if (closeActionBtn) closeActionBtn.onclick = () => { modal.classList.remove('active'); document.body.style.overflow = ''; };

    } else if (mode === 'edit') {
        if (titleEl) titleEl.textContent = `Edit Attraction — ${attr.name}`;

        bodyEl.innerHTML = `
            <div class="form-group" style="margin-bottom: 0.75rem;">
                <label style="font-weight: 600; font-size: 0.85rem;">Attraction Name</label>
                <input type="text" id="edit-attr-name-input" class="form-control" value="${attr.name}">
            </div>
            <div class="form-group" style="margin-bottom: 0.75rem;">
                <label style="font-weight: 600; font-size: 0.85rem;">Category</label>
                <input type="text" id="edit-attr-cat-input" class="form-control" value="${attr.category || ''}">
            </div>
            <div class="form-group" style="margin-bottom: 0.75rem;">
                <label style="font-weight: 600; font-size: 0.85rem;">Status</label>
                <select id="edit-attr-status-select" class="form-control">
                    <option value="Open" ${attr.status === 'Open' ? 'selected' : ''}>Open</option>
                    <option value="Maintenance" ${attr.status === 'Maintenance' ? 'selected' : ''}>Maintenance</option>
                    <option value="Closed" ${attr.status === 'Closed' ? 'selected' : ''}>Closed</option>
                </select>
            </div>
            <div class="form-group" style="margin-bottom: 0.75rem;">
                <label style="font-weight: 600; font-size: 0.85rem;">Image URL</label>
                <input type="text" id="edit-attr-img-input" class="form-control" value="${attr.img || ''}">
            </div>
        `;

        footerEl.innerHTML = `
            <button type="button" class="btn-secondary" id="btn-cancel-edit-attr" style="padding: 0.45rem 0.9rem; font-size: 0.82rem;">Cancel</button>
            <button type="button" class="btn-primary" id="btn-save-edit-attr" style="padding: 0.45rem 1.1rem; font-size: 0.82rem;">Save Changes</button>
        `;

        const cancelBtn = document.getElementById('btn-cancel-edit-attr');
        if (cancelBtn) cancelBtn.onclick = () => openAttractionDetailModal(attrId, 'view');

        const saveBtn = document.getElementById('btn-save-edit-attr');
        if (saveBtn) {
            saveBtn.onclick = async () => {
                const nameVal = document.getElementById('edit-attr-name-input').value.trim();
                const catVal = document.getElementById('edit-attr-cat-input').value.trim();
                const statusVal = document.getElementById('edit-attr-status-select').value;
                const imgVal = document.getElementById('edit-attr-img-input').value.trim();

                if (!nameVal) { alert('Please enter attraction name.'); return; }
                attr.name = nameVal;
                attr.category = catVal || 'Attraction';
                attr.status = statusVal;
                if (imgVal) attr.img = imgVal;

                await renderConnectedViews(window.YatraSetuManagerStore.getActiveContext());
                openAttractionDetailModal(attrId, 'view');
            };
        }
    }

    if (closeBtn) {
        closeBtn.onclick = () => { modal.classList.remove('active'); document.body.style.overflow = ''; };
    }

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

/**
 * Event Details & Actions Modal Functionality
 */
function openEventDetailModal(eventId, mode = 'view') {
    if (!eventId || !window.YatraSetuManagerData || !window.YatraSetuManagerData.events) return;
    const ev = window.YatraSetuManagerData.events.find(e => e.id === eventId);
    if (!ev) return;

    const modal = document.getElementById('eventDetailModal');
    const titleEl = document.getElementById('event-detail-modal-title');
    const bodyEl = document.getElementById('event-detail-modal-body');
    const footerEl = document.getElementById('event-detail-modal-footer');
    const closeBtn = document.getElementById('btn-close-event-detail-modal');

    if (!modal || !bodyEl || !footerEl) return;

    const allDest = window.YatraSetuManagerData.destinations || [];
    const destObj = allDest.find(d => d.id === ev.destination_id);
    const destName = destObj ? destObj.name : ev.destination_id;

    if (mode === 'view') {
        if (titleEl) titleEl.textContent = `${ev.title} — Event Details`;

        bodyEl.innerHTML = `
            <div style="display: flex; gap: 1rem; flex-wrap: wrap; margin-bottom: 1rem;">
                <img src="${ev.img}" alt="${ev.title}" style="width: 100%; max-height: 200px; object-fit: cover; border-radius: 8px;">
            </div>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; margin-bottom: 1rem; font-size: 0.88rem;">
                <div><strong>Event Title:</strong> <span>${ev.title}</span></div>
                <div><strong>Date:</strong> <span>${ev.dateNum} ${ev.dateMonth}</span></div>
                <div><strong>Location:</strong> <span>${ev.location}</span></div>
                <div><strong>Destination:</strong> <span>${destName}</span></div>
                <div><strong>Status:</strong> <span class="status-pill ${ev.statusClass}">${ev.status}</span></div>
                <div><strong>State:</strong> <span>${ev.state_id ? ev.state_id.toUpperCase() : 'MAHARASHTRA'}</span></div>
            </div>
        `;

        footerEl.innerHTML = `
            <div style="display: flex; gap: 0.5rem;">
                <button type="button" class="btn-primary" id="btn-edit-event-modal" style="padding: 0.45rem 0.9rem; font-size: 0.82rem;">Edit Details</button>
                <button type="button" class="btn-secondary" id="btn-delete-event-modal" style="padding: 0.45rem 0.9rem; font-size: 0.82rem; color: #DC2626; border-color: #FECACA;">Delete</button>
            </div>
            <button type="button" class="btn-secondary" id="btn-close-event-modal-action" style="padding: 0.45rem 0.9rem; font-size: 0.82rem;">Close</button>
        `;

        const editBtn = document.getElementById('btn-edit-event-modal');
        if (editBtn) editBtn.onclick = () => openEventDetailModal(eventId, 'edit');

        const deleteBtn = document.getElementById('btn-delete-event-modal');
        if (deleteBtn) {
            deleteBtn.onclick = async () => {
                if (confirm(`Are you sure you want to delete event "${ev.title}"?`)) {
                    const idx = window.YatraSetuManagerData.events.findIndex(e => e.id === eventId);
                    if (idx !== -1) window.YatraSetuManagerData.events.splice(idx, 1);
                    modal.classList.remove('active');
                    document.body.style.overflow = '';
                    await renderConnectedViews(window.YatraSetuManagerStore.getActiveContext());
                }
            };
        }

        const closeActionBtn = document.getElementById('btn-close-event-modal-action');
        if (closeActionBtn) closeActionBtn.onclick = () => { modal.classList.remove('active'); document.body.style.overflow = ''; };

    } else if (mode === 'edit') {
        if (titleEl) titleEl.textContent = `Edit Event — ${ev.title}`;

        bodyEl.innerHTML = `
            <div class="form-group" style="margin-bottom: 0.75rem;">
                <label style="font-weight: 600; font-size: 0.85rem;">Event Title</label>
                <input type="text" id="edit-event-title-input" class="form-control" value="${ev.title}">
            </div>
            <div class="form-group" style="margin-bottom: 0.75rem;">
                <label style="font-weight: 600; font-size: 0.85rem;">Date (e.g., 15 OCT)</label>
                <input type="text" id="edit-event-date-input" class="form-control" value="${ev.dateNum} ${ev.dateMonth}">
            </div>
            <div class="form-group" style="margin-bottom: 0.75rem;">
                <label style="font-weight: 600; font-size: 0.85rem;">Location</label>
                <input type="text" id="edit-event-loc-input" class="form-control" value="${ev.location}">
            </div>
            <div class="form-group" style="margin-bottom: 0.75rem;">
                <label style="font-weight: 600; font-size: 0.85rem;">Status</label>
                <select id="edit-event-status-select" class="form-control">
                    <option value="Upcoming" ${ev.status === 'Upcoming' ? 'selected' : ''}>Upcoming</option>
                    <option value="Ongoing" ${ev.status === 'Ongoing' ? 'selected' : ''}>Ongoing</option>
                    <option value="Completed" ${ev.status === 'Completed' ? 'selected' : ''}>Completed</option>
                </select>
            </div>
            <div class="form-group" style="margin-bottom: 0.75rem;">
                <label style="font-weight: 600; font-size: 0.85rem;">Image URL</label>
                <input type="text" id="edit-event-img-input" class="form-control" value="${ev.img || ''}">
            </div>
        `;

        footerEl.innerHTML = `
            <button type="button" class="btn-secondary" id="btn-cancel-edit-event" style="padding: 0.45rem 0.9rem; font-size: 0.82rem;">Cancel</button>
            <button type="button" class="btn-primary" id="btn-save-edit-event" style="padding: 0.45rem 1.1rem; font-size: 0.82rem;">Save Changes</button>
        `;

        const cancelBtn = document.getElementById('btn-cancel-edit-event');
        if (cancelBtn) cancelBtn.onclick = () => openEventDetailModal(eventId, 'view');

        const saveBtn = document.getElementById('btn-save-edit-event');
        if (saveBtn) {
            saveBtn.onclick = async () => {
                const titleVal = document.getElementById('edit-event-title-input').value.trim();
                const dateVal = document.getElementById('edit-event-date-input').value.trim();
                const locVal = document.getElementById('edit-event-loc-input').value.trim();
                const statusVal = document.getElementById('edit-event-status-select').value;
                const imgVal = document.getElementById('edit-event-img-input').value.trim();

                if (!titleVal) { alert('Please enter event title.'); return; }
                ev.title = titleVal;
                if (dateVal) {
                    const parts = dateVal.split(' ');
                    ev.dateNum = parts[0] || '15';
                    ev.dateMonth = (parts[1] || 'OCT').toUpperCase();
                }
                ev.location = locVal || ev.location;
                ev.status = statusVal;
                ev.statusClass = statusVal === 'Upcoming' ? 'active' : (statusVal === 'Ongoing' ? 'warning' : 'neutral');
                if (imgVal) ev.img = imgVal;

                await renderConnectedViews(window.YatraSetuManagerStore.getActiveContext());
                openEventDetailModal(eventId, 'view');
            };
        }
    }

    if (closeBtn) {
        closeBtn.onclick = () => { modal.classList.remove('active'); document.body.style.overflow = ''; };
    }

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

/**
 * Stakeholder Details & Actions Modal Functionality
 */
function openStakeholderDetailModal(shId, mode = 'view') {
    if (!shId || !window.YatraSetuManagerData || !window.YatraSetuManagerData.stakeholders) return;
    const sh = window.YatraSetuManagerData.stakeholders.find(s => s.id === shId);
    if (!sh) return;

    const modal = document.getElementById('stakeholderDetailModal');
    const titleEl = document.getElementById('sh-detail-modal-title');
    const bodyEl = document.getElementById('sh-detail-modal-body');
    const footerEl = document.getElementById('sh-detail-modal-footer');
    const closeBtn = document.getElementById('btn-close-sh-detail-modal');

    if (!modal || !bodyEl || !footerEl) return;

    if (mode === 'view') {
        if (titleEl) titleEl.textContent = `${sh.name} — Partner Profile`;

        bodyEl.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; margin-bottom: 1rem; font-size: 0.88rem;">
                <div><strong>Stakeholder Name:</strong> <span>${sh.name}</span></div>
                <div><strong>Category:</strong> <span>${sh.category}</span></div>
                <div><strong>Destination/Scope:</strong> <span>${sh.destination || 'State-wide'}</span></div>
                <div><strong>Contact Info:</strong> <span>${sh.contact}</span></div>
                <div><strong>Status:</strong> <span class="status-pill active">${sh.status || 'Verified'}</span></div>
                <div><strong>State:</strong> <span>${sh.state_id ? sh.state_id.toUpperCase() : 'MAHARASHTRA'}</span></div>
            </div>
        `;

        footerEl.innerHTML = `
            <div style="display: flex; gap: 0.5rem;">
                <button type="button" class="btn-primary" id="btn-edit-sh-modal" style="padding: 0.45rem 0.9rem; font-size: 0.82rem;">Edit Details</button>
                <button type="button" class="btn-secondary" id="btn-delete-sh-modal" style="padding: 0.45rem 0.9rem; font-size: 0.82rem; color: #DC2626; border-color: #FECACA;">Delete</button>
            </div>
            <button type="button" class="btn-secondary" id="btn-close-sh-modal-action" style="padding: 0.45rem 0.9rem; font-size: 0.82rem;">Close</button>
        `;

        const editBtn = document.getElementById('btn-edit-sh-modal');
        if (editBtn) editBtn.onclick = () => openStakeholderDetailModal(shId, 'edit');

        const deleteBtn = document.getElementById('btn-delete-sh-modal');
        if (deleteBtn) {
            deleteBtn.onclick = async () => {
                if (confirm(`Are you sure you want to delete stakeholder "${sh.name}"?`)) {
                    const idx = window.YatraSetuManagerData.stakeholders.findIndex(s => s.id === shId);
                    if (idx !== -1) window.YatraSetuManagerData.stakeholders.splice(idx, 1);
                    modal.classList.remove('active');
                    document.body.style.overflow = '';
                    await renderConnectedViews(window.YatraSetuManagerStore.getActiveContext());
                }
            };
        }

        const closeActionBtn = document.getElementById('btn-close-sh-modal-action');
        if (closeActionBtn) closeActionBtn.onclick = () => { modal.classList.remove('active'); document.body.style.overflow = ''; };

    } else if (mode === 'edit') {
        if (titleEl) titleEl.textContent = `Edit Partner — ${sh.name}`;

        bodyEl.innerHTML = `
            <div class="form-group" style="margin-bottom: 0.75rem;">
                <label style="font-weight: 600; font-size: 0.85rem;">Partner / Organization Name</label>
                <input type="text" id="edit-sh-name-input" class="form-control" value="${sh.name}">
            </div>
            <div class="form-group" style="margin-bottom: 0.75rem;">
                <label style="font-weight: 600; font-size: 0.85rem;">Category</label>
                <select id="edit-sh-cat-select" class="form-control">
                    <option value="Guides" ${sh.category === 'Guides' ? 'selected' : ''}>Guide / Escort</option>
                    <option value="Homestays" ${sh.category === 'Homestays' ? 'selected' : ''}>Homestay / Resort</option>
                    <option value="Transport" ${sh.category === 'Transport' ? 'selected' : ''}>Transport Service</option>
                    <option value="Handicrafts" ${sh.category === 'Handicrafts' ? 'selected' : ''}>Handicraft Artisan</option>
                    <option value="Tourism Services" ${sh.category === 'Tourism Services' ? 'selected' : ''}>Tourism Operator</option>
                </select>
            </div>
            <div class="form-group" style="margin-bottom: 0.75rem;">
                <label style="font-weight: 600; font-size: 0.85rem;">Contact Information</label>
                <input type="text" id="edit-sh-contact-input" class="form-control" value="${sh.contact}">
            </div>
        `;

        footerEl.innerHTML = `
            <button type="button" class="btn-secondary" id="btn-cancel-edit-sh" style="padding: 0.45rem 0.9rem; font-size: 0.82rem;">Cancel</button>
            <button type="button" class="btn-primary" id="btn-save-edit-sh" style="padding: 0.45rem 1.1rem; font-size: 0.82rem;">Save Changes</button>
        `;

        const cancelBtn = document.getElementById('btn-cancel-edit-sh');
        if (cancelBtn) cancelBtn.onclick = () => openStakeholderDetailModal(shId, 'view');

        const saveBtn = document.getElementById('btn-save-edit-sh');
        if (saveBtn) {
            saveBtn.onclick = async () => {
                const nameVal = document.getElementById('edit-sh-name-input').value.trim();
                const catVal = document.getElementById('edit-sh-cat-select').value;
                const contactVal = document.getElementById('edit-sh-contact-input').value.trim();

                if (!nameVal) { alert('Please enter partner name.'); return; }
                sh.name = nameVal;
                sh.category = catVal;
                sh.contact = contactVal || sh.contact;

                await renderConnectedViews(window.YatraSetuManagerStore.getActiveContext());
                openStakeholderDetailModal(shId, 'view');
            };
        }
    }

    if (closeBtn) {
        closeBtn.onclick = () => { modal.classList.remove('active'); document.body.style.overflow = ''; };
    }

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

/**
 * Feedback Details Modal Functionality
 */
function openFeedbackDetailModal(fbId) {
    if (!fbId || !window.YatraSetuManagerData || !window.YatraSetuManagerData.feedback) return;
    const fb = window.YatraSetuManagerData.feedback.find(f => f.id === fbId);
    if (!fb) return;

    const modal = document.getElementById('feedbackDetailModal');
    const titleEl = document.getElementById('fb-detail-modal-title');
    const bodyEl = document.getElementById('fb-detail-modal-body');
    const footerEl = document.getElementById('fb-detail-modal-footer');
    const closeBtn = document.getElementById('btn-close-fb-detail-modal');

    if (!modal || !bodyEl || !footerEl) return;

    if (titleEl) titleEl.textContent = `Feedback from ${fb.author || 'Visitor'}`;

    bodyEl.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; margin-bottom: 1rem; font-size: 0.88rem;">
            <div><strong>Visitor Name:</strong> <span>${fb.author || 'Anonymous'}</span></div>
            <div><strong>Date:</strong> <span>${fb.date || 'Recent'}</span></div>
            <div><strong>Destination:</strong> <span>${fb.destination || 'State-wide'}</span></div>
            <div><strong>Rating:</strong> <span style="color: #F59E0B;">${'★'.repeat(fb.rating || 5)} (${fb.rating || 5}/5)</span></div>
        </div>
        <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 1rem; font-size: 0.9rem; color: #334155; line-height: 1.6;">
            <strong>Comment:</strong><br>
            "${fb.text}"
        </div>
    `;

    footerEl.innerHTML = `
        <button type="button" class="btn-secondary" id="btn-delete-fb-modal" style="padding: 0.45rem 0.9rem; font-size: 0.82rem; color: #DC2626; border-color: #FECACA;">Delete Record</button>
        <button type="button" class="btn-secondary" id="btn-close-fb-modal-action" style="padding: 0.45rem 0.9rem; font-size: 0.82rem;">Close</button>
    `;

    const deleteBtn = document.getElementById('btn-delete-fb-modal');
    if (deleteBtn) {
        deleteBtn.onclick = async () => {
            if (confirm('Are you sure you want to delete this feedback record?')) {
                const idx = window.YatraSetuManagerData.feedback.findIndex(f => f.id === fbId);
                if (idx !== -1) window.YatraSetuManagerData.feedback.splice(idx, 1);
                modal.classList.remove('active');
                document.body.style.overflow = '';
                await renderConnectedViews(window.YatraSetuManagerStore.getActiveContext());
            }
        };
    }

    const closeActionBtn = document.getElementById('btn-close-fb-modal-action');
    if (closeActionBtn) closeActionBtn.onclick = () => { modal.classList.remove('active'); document.body.style.overflow = ''; };

    if (closeBtn) {
        closeBtn.onclick = () => { modal.classList.remove('active'); document.body.style.overflow = ''; };
    }

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}
