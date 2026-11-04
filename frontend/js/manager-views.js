/**
 * YatraSetu — Destination Manager Subpage View Renderers & Detail Modals (manager-views.js)
 * Handles connected view rendering across state/destination context changes,
 * profile page controller, and entity detail/edit overlay modals.
 * Dependencies: manager-data.js, manager-core.js
 */

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
        if (!p.hasAttribute('data-template')) {
            p.setAttribute('data-template', (p.textContent || '').trim());
        }
        const baseTemplate = p.getAttribute('data-template');
        if (baseTemplate.match(/(in|across|for)\s+[\w\s&]+/i)) {
            p.textContent = baseTemplate.replace(/(in|across|for)\s+[\w\s&]+/i, `$1 ${destLabel}`);
        } else {
            p.textContent = `${baseTemplate} for ${destLabel}`;
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

    // 1B. DESTINATION INFORMATION VIDEOS VIEW (destinations.html — FR-15)
    await renderDestinationVideos(context);

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
        if (typeof filterTableRows === 'function') filterTableRows();
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
        // Retrieve stakeholders for active state and destination context (fallback to state-wide if destination has 0 records)
        let stakeholders = await window.YatraSetuManagerStore.getStakeholders(activeStateId, activeDestinationId);
        if ((!stakeholders || stakeholders.length === 0) && activeDestinationId !== 'all') {
            stakeholders = await window.YatraSetuManagerStore.getStakeholders(activeStateId, 'all');
        }

        // Dynamic Category Card Counts
        const categoryCounts = {
            all: stakeholders.length,
            guides: 0,
            transport: 0,
            homestays: 0,
            food: 0,
            crafts: 0,
            operators: 0,
            accommodation: 0,
            other: 0
        };

        // Status Counts
        const statusCounts = {
            all: stakeholders.length,
            pending: 0,
            review: 0,
            approved: 0,
            rejected: 0
        };

        stakeholders.forEach(sh => {
            const cat = (sh.category || '').toLowerCase();
            if (cat.includes('guide')) categoryCounts.guides++;
            else if (cat.includes('transport') || cat.includes('cab') || cat.includes('jeep') || cat.includes('shikara')) categoryCounts.transport++;
            else if (cat.includes('homestay') || cat.includes('rural stay')) categoryCounts.homestays++;
            else if (cat.includes('food') || cat.includes('dining') || cat.includes('chikki') || cat.includes('restaurant')) categoryCounts.food++;
            else if (cat.includes('handicraft') || cat.includes('weaver') || cat.includes('artisan') || cat.includes('craft')) categoryCounts.crafts++;
            else if (cat.includes('tour') || cat.includes('operator')) categoryCounts.operators++;
            else if (cat.includes('accommodat') || cat.includes('hotel') || cat.includes('resort')) categoryCounts.accommodation++;
            else categoryCounts.other++;

            const st = (sh.status || '').toLowerCase();
            if (st.includes('pending')) statusCounts.pending++;
            else if (st.includes('review')) statusCounts.review++;
            else if (st.includes('reject')) statusCounts.rejected++;
            else statusCounts.approved++;
        });

        // Update Category Grid Numbers
        for (const [key, count] of Object.entries(categoryCounts)) {
            const el = document.getElementById(`sh-cat-count-${key}`);
            if (el) el.textContent = count;
        }

        // Update Status Filter Numbers
        const countAllEl = document.getElementById('count-sh-all');
        const countPendingEl = document.getElementById('count-sh-pending');
        const countReviewEl = document.getElementById('count-sh-review');
        const countApprovedEl = document.getElementById('count-sh-approved');
        const countRejectedEl = document.getElementById('count-sh-rejected');
        if (countAllEl) countAllEl.textContent = statusCounts.all;
        if (countPendingEl) countPendingEl.textContent = statusCounts.pending;
        if (countReviewEl) countReviewEl.textContent = statusCounts.review;
        if (countApprovedEl) countApprovedEl.textContent = statusCounts.approved;
        if (countRejectedEl) countRejectedEl.textContent = statusCounts.rejected;

        // Update Manager Scope Badge
        const mgrScopeText = document.getElementById('manager-scope-text');
        const profile = (typeof syncActiveManagerProfile === 'function' ? syncActiveManagerProfile() : null) || window.YatraSetuManagerData?.profile || {};
        const isStateScope = (profile.scope || 'STATE') === 'STATE';
        if (mgrScopeText) {
            const isOutOfJurisdiction = isStateScope
                ? (activeStateId !== profile.state_id)
                : (activeStateId !== profile.state_id || (activeDestinationId !== 'all' && activeDestinationId !== profile.destination_id));

            const scopeDesc = isStateScope
                ? `State Manager (${profile.state_name || 'Maharashtra'}) • Review & approve registrations across all ${profile.state_name || 'Maharashtra'} destinations`
                : `Destination Manager • Assigned to: <strong>${profile.destination || (profile.destination_ids || []).join(', ') || 'Rajgad Fort'}</strong>`;

            mgrScopeText.innerHTML = `<strong>Authorized Scope:</strong> ${scopeDesc}${isOutOfJurisdiction ? ` <span style="color:#B45309; font-weight:700;">(Viewing ${formattedStateName} — Read-Only Mode)</span>` : ''}`;
        }

        // Setup filter card click listeners
        const catCards = document.querySelectorAll('.category-card-grid .category-card');
        catCards.forEach(card => {
            card.onclick = (e) => {
                e.preventDefault();
                catCards.forEach(c => c.classList.remove('active'));
                card.classList.add('active');
                if (typeof filterTableRows === 'function') filterTableRows();
            };
        });

        // Setup status filter pill click listeners
        const statusPills = document.querySelectorAll('#sh-status-filter-pills .filter-pill');
        statusPills.forEach(pill => {
            pill.onclick = (e) => {
                e.preventDefault();
                statusPills.forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                if (typeof filterTableRows === 'function') filterTableRows();
            };
        });

        if (stakeholders && stakeholders.length > 0) {
            stakeholdersTableBody.innerHTML = stakeholders.map(sh => {
                const st = sh.status || 'Approved';
                let pillHtml = '';
                if (st === 'Pending Approval') {
                    pillHtml = `<span class="status-pill pending" style="background:#FEF3C7; color:#B45309; border:1px solid #FCD34D; font-weight:700; font-size:0.73rem; padding:0.2rem 0.55rem; border-radius:12px;">⏳ Pending Approval</span>`;
                } else if (st === 'Under Review') {
                    pillHtml = `<span class="status-pill review" style="background:#EFF6FF; color:#1D4ED8; border:1px solid #BFDBFE; font-weight:700; font-size:0.73rem; padding:0.2rem 0.55rem; border-radius:12px;">🔍 Under Review</span>`;
                } else if (st === 'Rejected') {
                    pillHtml = `<span class="status-pill rejected" style="background:#FEE2E2; color:#B91C1C; border:1px solid #FECACA; font-weight:700; font-size:0.73rem; padding:0.2rem 0.55rem; border-radius:12px;">✕ Rejected</span>`;
                } else {
                    pillHtml = `<span class="status-pill active" style="background:#ECFDF5; color:#065F46; border:1px solid #A7F3D0; font-weight:700; font-size:0.73rem; padding:0.2rem 0.55rem; border-radius:12px;">✓ Approved</span>`;
                }

                const isActionNeeded = st === 'Pending Approval' || st === 'Under Review';
                const actionBtn = isActionNeeded
                    ? `<button type="button" class="btn-primary btn-sh-review" data-sh-id="${sh.id}" style="padding: 0.35rem 0.75rem; font-size: 0.76rem; font-weight: 700; border-radius: 6px;">Review & Decide</button>`
                    : `<button type="button" class="btn-secondary btn-sh-review" data-sh-id="${sh.id}" style="padding: 0.35rem 0.75rem; font-size: 0.76rem; font-weight: 600; border-radius: 6px;">View Details</button>`;

                const typeBadge = sh.type === 'info-contributor'
                    ? `<span style="font-size: 0.68rem; color: #475569; background: #F1F5F9; padding: 0.15rem 0.4rem; border-radius: 4px; margin-left: 0.35rem;">Info Partner</span>`
                    : `<span style="font-size: 0.68rem; color: #0284C7; background: #E0F2FE; padding: 0.15rem 0.4rem; border-radius: 4px; margin-left: 0.35rem;">Visitor Service</span>`;

                return `
                    <tr data-category="${(sh.category || '').toLowerCase()}" data-status="${st.toLowerCase()}">
                        <td>
                            <strong style="color: var(--text-primary); font-size: 0.9rem;">${sh.name}</strong>
                            ${sh.contact_person ? `<div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 0.1rem;">👤 ${sh.contact_person}</div>` : ''}
                        </td>
                        <td>
                            <span style="font-weight: 600;">${sh.category}</span>${typeBadge}
                        </td>
                        <td>
                            <span title="Assigned Destination (Managed by administration)" style="font-weight: 600;">📍 ${sh.destination || 'State-wide'}</span>
                        </td>
                        <td>
                            <div style="font-size: 0.8rem; color: var(--text-secondary);">${sh.contact || 'N/A'}</div>
                            ${sh.email ? `<div style="font-size: 0.72rem; color: var(--text-muted);">${sh.email}</div>` : ''}
                        </td>
                        <td>${pillHtml}</td>
                        <td style="text-align: right; white-space: nowrap;">
                            ${actionBtn}
                        </td>
                    </tr>
                `;
            }).join('');

            stakeholdersTableBody.querySelectorAll('.btn-sh-review').forEach(btn => {
                btn.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    openStakeholderDetailModal(btn.getAttribute('data-sh-id'));
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

    // 6B. STAKEHOLDER MESSAGES (feedback.html)
    const shMsgTbody = document.querySelector('#stakeholder-messages-tbody');
    const shMsgScopeBadge = document.querySelector('#sh-msg-scope-badge');
    if (shMsgTbody) {
        let messages = await window.YatraSetuManagerStore.getStakeholderMessages(activeStateId, activeDestinationId);

        // Fallback: If destination filtering yields 0 messages, show all messages for the active state so directory isn't empty
        if ((!messages || messages.length === 0) && activeDestinationId !== 'all') {
            const stateMessages = await window.YatraSetuManagerStore.getStakeholderMessages(activeStateId, 'all');
            if (stateMessages && stateMessages.length > 0) {
                messages = stateMessages;
            }
        }

        // Update Scope Badge
        if (shMsgScopeBadge) {
            shMsgScopeBadge.textContent = activeDestinationId !== 'all' ? `📍 Scope: ${destLabel}` : `📍 Scope: All Destinations (${formattedStateName})`;
        }

        // Update Status Filter Pill Counts
        const countAll = document.querySelector('#count-sh-msg-all');
        const countPending = document.querySelector('#count-sh-msg-pending');
        const countReview = document.querySelector('#count-sh-msg-review');
        const countResponded = document.querySelector('#count-sh-msg-responded');

        const pendingCount = messages.filter(m => m.status === 'Pending').length;
        const reviewCount = messages.filter(m => m.status === 'In Review').length;
        const respondedCount = messages.filter(m => m.status === 'Responded').length;

        if (countAll) countAll.textContent = messages.length;
        if (countPending) countPending.textContent = pendingCount;
        if (countReview) countReview.textContent = reviewCount;
        if (countResponded) countResponded.textContent = respondedCount;

        // Check active status filter pill if any
        const activeFilterBtn = document.querySelector('#sh-msg-status-filter-pills button.filter-pill.active');
        const activeStatusFilter = activeFilterBtn ? activeFilterBtn.getAttribute('data-msg-status') : 'all';

        let displayedMessages = messages;
        if (activeStatusFilter && activeStatusFilter !== 'all') {
            displayedMessages = messages.filter(m => m.status === activeStatusFilter);
        }

        if (displayedMessages.length > 0) {
            shMsgTbody.innerHTML = displayedMessages.map(m => {
                let statusBadgeClass = 'badge-warning';
                if (m.status === 'In Review') statusBadgeClass = 'badge-info';
                else if (m.status === 'Responded') statusBadgeClass = 'badge-success';

                const responsePreview = m.manager_response
                    ? `<div style="font-size: 0.82rem; color: #166534; max-width: 260px; line-height: 1.35;">
                         <strong>${m.responded_by || 'Manager'}:</strong> "${m.manager_response.length > 55 ? m.manager_response.slice(0, 55) + '…' : m.manager_response}"
                         <div style="font-size: 0.7rem; color: #64748B; margin-top: 2px;">${m.responded_at || ''}</div>
                       </div>`
                    : (m.status === 'In Review'
                        ? `<span style="font-size: 0.8rem; color: #2563EB; font-style: italic;">Under Active Review</span>`
                        : `<span style="font-size: 0.8rem; color: var(--text-muted); font-style: italic;">Awaiting Response</span>`);

                return `
                    <tr class="sh-msg-row" data-msg-status="${m.status}" style="border-bottom: 1px solid var(--border-color, #E2E8F0); font-size: 0.85rem; transition: background 0.15s ease;">
                        <td style="padding: 0.9rem 1rem;">
                            <div style="display: flex; align-items: center; gap: 0.65rem;">
                                <div style="width: 32px; height: 32px; border-radius: 50%; background: rgba(234, 88, 12, 0.12); color: #EA580C; font-weight: 700; font-size: 0.8rem; display: flex; align-items: center; justify-content: center;">
                                    ${(m.stakeholder_name || 'SH').slice(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <strong style="color: var(--text-primary); display: block; font-size: 0.88rem;">${m.stakeholder_name}</strong>
                                    <span style="font-size: 0.76rem; color: var(--text-muted);">${m.business_name}</span>
                                </div>
                            </div>
                        </td>
                        <td style="padding: 0.9rem 1rem; color: var(--text-secondary); font-weight: 600;">
                            📍 ${m.destination_name || m.destination_id}
                        </td>
                        <td style="padding: 0.9rem 1rem; max-width: 280px;">
                            <strong style="display: block; font-size: 0.84rem; color: var(--text-primary); margin-bottom: 0.2rem;">${m.topic || 'General Inquiry'}</strong>
                            <p style="margin: 0; font-size: 0.8rem; color: var(--text-secondary); line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                                "${m.message}"
                            </p>
                        </td>
                        <td style="padding: 0.9rem 1rem; color: var(--text-muted); font-size: 0.78rem; white-space: nowrap;">
                            ${m.submitted_at || 'Recently'}
                        </td>
                        <td style="padding: 0.9rem 1rem;">
                            <span class="badge ${statusBadgeClass}">${m.status}</span>
                        </td>
                        <td style="padding: 0.9rem 1rem;">
                            ${responsePreview}
                        </td>
                        <td style="padding: 0.9rem 1rem; text-align: right; white-space: nowrap;">
                            <button type="button" class="btn-secondary btn-sh-msg-open" data-msg-id="${m.id}" style="padding: 0.35rem 0.75rem; font-size: 0.78rem; font-weight: 600; cursor: pointer;">
                                ${m.status === 'Responded' ? 'View Thread' : 'Review & Reply'}
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');

            // Attach open modal click handlers
            shMsgTbody.querySelectorAll('.btn-sh-msg-open').forEach(btn => {
                btn.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const msgId = btn.getAttribute('data-msg-id');
                    openStakeholderMessageModal(msgId);
                };
            });
        } else {
            shMsgTbody.innerHTML = `
                <tr>
                    <td colspan="7" style="padding: 2.5rem; text-align: center; color: #64748B; font-weight: 500;">
                        No stakeholder messages found for this filter in ${destLabel}.
                    </td>
                </tr>
            `;
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

/**
 * Manager Profile Page Functionality
 */
function initManagerProfilePage() {
    const isProfilePage = window.location.pathname.includes('profile.html');
    const profileBannerName = document.getElementById('profile-banner-name');

    if (!isProfilePage && !profileBannerName) return;

    const profile = (typeof syncActiveManagerProfile === 'function' ? syncActiveManagerProfile() : null) || window.YatraSetuManagerData.profile || {
        id: 'usr-mgr-01',
        name: 'Rajesh Patil',
        email: 'manager.maharashtra@yatrasetu.in',
        phone: '+91 98230 41092',
        manager_type: 'State Manager',
        access_level: 'State Manager',
        scope: 'STATE',
        state_id: 'maharashtra',
        state_name: 'Maharashtra',
        destination: 'Maharashtra (All Destinations)',
        destination_name: 'Maharashtra (All Destinations)',
        status: 'Active',
        avatar_initials: 'RP'
    };

    // Render profile values to DOM
    const renderProfileDOM = () => {
        const initials = profile.avatar_initials || (profile.name ? profile.name.split(' ').map(n=>n[0]).join('').toUpperCase() : 'RP');
        const isState = (profile.access_level === 'State Manager' || profile.scope === 'STATE');

        // Banner Elements
        const bannerAvatar = document.getElementById('profile-banner-avatar');
        const bannerName = document.getElementById('profile-banner-name');
        const bannerRole = document.getElementById('profile-banner-role');
        const bannerStatus = document.getElementById('profile-banner-status');
        const bannerScope = document.getElementById('profile-banner-scope');

        if (bannerAvatar) bannerAvatar.textContent = initials;
        if (bannerName) bannerName.textContent = profile.name;
        if (bannerRole) bannerRole.innerHTML = `${profile.manager_type || profile.access_level || 'Destination Manager'} — ${profile.destination || profile.state_name || 'Maharashtra'} • ID: <strong style="color: var(--text-primary);">${profile.id}</strong>`;
        if (bannerStatus) bannerStatus.textContent = `${profile.account_status || profile.status || 'Active'} / Verified`;
        if (bannerScope) bannerScope.textContent = `${isState ? 'STATE' : 'DESTINATION'} SCOPE`;

        // Card Text Elements
        const valName = document.getElementById('prof-val-name');
        const valEmail = document.getElementById('prof-val-email');
        const valPhone = document.getElementById('prof-val-phone');
        const valId = document.getElementById('prof-val-id');
        const valRole = document.getElementById('prof-val-role');
        const valType = document.getElementById('prof-val-type');
        const valState = document.getElementById('prof-val-state');
        const valDest = document.getElementById('prof-val-dest-scope');
        const valAccess = document.getElementById('prof-val-access');
        const scopeBadge = document.querySelector('.chart-card .badge.badge-info');

        if (valName) valName.textContent = profile.name;
        if (valEmail) valEmail.textContent = profile.email;
        if (valPhone) valPhone.textContent = profile.phone;
        if (valId) valId.textContent = profile.id;
        if (valRole) valRole.textContent = profile.manager_type || profile.access_level || 'Destination Manager';
        if (valType) valType.textContent = profile.access_level || profile.manager_type || (isState ? 'State Manager' : 'Destination Manager');
        if (valState) valState.textContent = profile.state_name || 'Maharashtra';
        if (valDest) valDest.textContent = isState ? `All Destinations in ${profile.state_name || 'Maharashtra'}` : (profile.destination || profile.destination_name || profile.destination_id);
        if (valAccess) valAccess.textContent = isState ? 'Full State Administrative Access' : 'Destination-specific approvals & local curation';
        if (scopeBadge) scopeBadge.textContent = isState ? 'State Authority' : 'Destination Authority';
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
 * Stakeholder Registration Review, Approval & Detail Modal
 * Enforces role-based permissions: Destination Managers review & approve business registrations
 * only for destinations within their authorized scope. Account deletion/deactivation is restricted to Administrator.
 */
function openStakeholderDetailModal(shId) {
    if (!shId || !window.YatraSetuManagerData || !window.YatraSetuManagerData.stakeholders) return;
    const sh = window.YatraSetuManagerData.stakeholders.find(s => s.id === shId);
    if (!sh) return;

    const modal = document.getElementById('stakeholderDetailModal');
    const titleEl = document.getElementById('sh-detail-modal-title');
    const bodyEl = document.getElementById('sh-detail-modal-body');
    const footerEl = document.getElementById('sh-detail-modal-footer');
    const closeBtn = document.getElementById('btn-close-sh-detail-modal');

    if (!modal || !bodyEl || !footerEl) return;

    const profile = (typeof syncActiveManagerProfile === 'function' ? syncActiveManagerProfile() : null) || window.YatraSetuManagerData.profile || {};
    const isStateScope = (profile.scope || 'STATE') === 'STATE';

    // Authorization Check:
    // State Manager can approve destinations within their assigned state territory.
    // Destination Manager can only approve if destination_id matches their assigned destination.
    let isAuthorized = false;
    let authMessage = '';

    if (profile.account_status === 'Deactivated' || profile.status === 'Deactivated') {
        isAuthorized = false;
        authMessage = 'Account Suspended: This Destination Manager account has been deactivated by the Platform Administrator. All approval actions are locked.';
    } else if (isStateScope) {
        if (sh.state_id === profile.state_id) {
            isAuthorized = true;
            authMessage = `Authorized: State Manager jurisdiction for ${profile.state_name || 'Maharashtra'}.`;
        } else {
            isAuthorized = false;
            authMessage = `Unauthorized: This stakeholder is registered in ${sh.state_id ? sh.state_id.toUpperCase() : 'OTHER STATE'}. You are assigned to ${profile.state_id ? profile.state_id.toUpperCase() : 'MAHARASHTRA'}.`;
        }
    } else {
        if (sh.state_id !== profile.state_id) {
            isAuthorized = false;
            authMessage = `Unauthorized: This stakeholder is registered in ${sh.state_id ? sh.state_id.toUpperCase() : 'OTHER STATE'}. Your jurisdiction is limited to ${profile.destination || 'assigned destination'}.`;
        } else {
            const allowedDests = (profile.destination_ids && profile.destination_ids.length > 0)
                ? profile.destination_ids
                : (profile.destination_id ? [profile.destination_id] : ['raigad-fort']);
            if (allowedDests.includes(sh.destination_id)) {
                isAuthorized = true;
                authMessage = `Authorized: You are the designated Destination Manager for ${sh.destination}.`;
            } else {
                isAuthorized = false;
                authMessage = `Unauthorized: Your management jurisdiction is limited to: ${profile.destination || allowedDests.join(', ')}. You cannot approve registrations for ${sh.destination}.`;
            }
        }
    }

    if (titleEl) {
        titleEl.textContent = `Review Registration — ${sh.name}`;
    }

    const currentStatus = sh.status || 'Pending Approval';
    let statusBadgeHtml = '';
    if (currentStatus === 'Approved') {
        statusBadgeHtml = `<span class="status-pill active" style="background:#ECFDF5; color:#065F46; border:1px solid #A7F3D0; font-weight:700; padding:0.25rem 0.65rem; border-radius:12px;">✓ Approved</span>`;
    } else if (currentStatus === 'Under Review') {
        statusBadgeHtml = `<span class="status-pill review" style="background:#EFF6FF; color:#1D4ED8; border:1px solid #BFDBFE; font-weight:700; padding:0.25rem 0.65rem; border-radius:12px;">🔍 Under Review</span>`;
    } else if (currentStatus === 'Rejected') {
        statusBadgeHtml = `<span class="status-pill rejected" style="background:#FEE2E2; color:#B91C1C; border:1px solid #FECACA; font-weight:700; padding:0.25rem 0.65rem; border-radius:12px;">✕ Rejected</span>`;
    } else {
        statusBadgeHtml = `<span class="status-pill pending" style="background:#FEF3C7; color:#B45309; border:1px solid #FCD34D; font-weight:700; padding:0.25rem 0.65rem; border-radius:12px;">⏳ Pending Approval</span>`;
    }

    const typeDesc = sh.type === 'info-contributor'
        ? 'Information Contributor (Coordinates event & heritage info, not direct booking)'
        : 'Visitor-Facing Service (Direct service provider discovered by tourists)';

    bodyEl.innerHTML = `
        <!-- Scope & Authorization Banner -->
        <div style="background: ${isAuthorized ? '#F0FDF4' : '#FEF2F2'}; border: 1px solid ${isAuthorized ? '#BBF7D0' : '#FECACA'}; border-radius: 8px; padding: 0.75rem 1rem; margin-bottom: 1.15rem; display: flex; align-items: center; justify-content: space-between;">
            <div>
                <strong style="color: ${isAuthorized ? '#166534' : '#991B1B'}; font-size: 0.82rem; display: block;">
                    ${isAuthorized ? '✓ Authorized Manager Jurisdiction' : '⚠️ Restricted Management Scope'}
                </strong>
                <span style="font-size: 0.76rem; color: ${isAuthorized ? '#15803D' : '#B91C1C'};">${authMessage}</span>
            </div>
            <div>${statusBadgeHtml}</div>
        </div>

        <!-- Stakeholder Identity & Location Details -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.85rem; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 1rem; margin-bottom: 1.15rem; font-size: 0.85rem;">
            <div>
                <span style="color: var(--text-muted); font-size: 0.75rem; display: block;">Business / Entity Name</span>
                <strong style="color: var(--text-primary); font-size: 0.95rem;">${sh.name}</strong>
            </div>
            <div>
                <span style="color: var(--text-muted); font-size: 0.75rem; display: block;">Ecosystem Category</span>
                <strong style="color: var(--text-primary);">${sh.category}</strong>
            </div>
            <div>
                <span style="color: var(--text-muted); font-size: 0.75rem; display: block;">Assigned Destination Context</span>
                <span style="font-weight: 700; color: #1E293B;">🔒 ${sh.destination || 'Rajgad Fort'}</span>
                <span style="font-size: 0.68rem; color: #64748B; display: block; margin-top: 0.1rem;">(Protected: Stakeholders cannot change approved destination assignment)</span>
            </div>
            <div>
                <span style="color: var(--text-muted); font-size: 0.75rem; display: block;">Service Model</span>
                <span style="font-weight: 600; color: #334155;">${typeDesc}</span>
            </div>
            <div>
                <span style="color: var(--text-muted); font-size: 0.75rem; display: block;">Contact Person & Details</span>
                <span style="color: var(--text-secondary);">${sh.contact_person || 'Authorized Representative'} • ${sh.contact || 'N/A'}</span>
                ${sh.email ? `<div style="font-size: 0.75rem; color: var(--text-muted);">${sh.email}</div>` : ''}
            </div>
            <div>
                <span style="color: var(--text-muted); font-size: 0.75rem; display: block;">Hours & Tariff Range</span>
                <span style="color: var(--text-secondary);">${sh.hours || 'Standard Hours'} • ${sh.price_range || 'Inquire'}</span>
            </div>
            <div style="grid-column: 1 / -1; border-top: 1px dashed #CBD5E1; padding-top: 0.5rem; margin-top: 0.25rem;">
                <span style="color: var(--text-muted); font-size: 0.75rem; display: block;">Base Location / Trailhead Address</span>
                <span style="color: var(--text-secondary); font-size: 0.82rem;">${sh.address || 'Local Destination Hub'}</span>
            </div>
        </div>

        <!-- Description & Offerings -->
        <div style="margin-bottom: 1.15rem;">
            <label style="font-weight: 700; font-size: 0.8rem; color: var(--text-secondary); display: block; margin-bottom: 0.35rem;">Service Description & Tourist Guidance</label>
            <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 6px; padding: 0.75rem; font-size: 0.84rem; color: var(--text-secondary); line-height: 1.5;">
                ${sh.description || 'Verified local service partner.'}
            </div>
        </div>

        <!-- Prior Review History (if present) -->
        ${sh.reviewed_by ? `
            <div style="background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 6px; padding: 0.75rem; margin-bottom: 1.15rem; font-size: 0.8rem;">
                <div style="font-weight: 700; color: #1E40AF; margin-bottom: 0.2rem;">Previous Manager Decision</div>
                <div style="color: #1E3A8A;">Decision: <strong>${sh.status}</strong> • Reviewed by ${sh.reviewed_by} on ${sh.reviewed_date || 'Earlier'}</div>
                ${sh.manager_note ? `<div style="color: #3B82F6; margin-top: 0.25rem; font-style: italic;">"${sh.manager_note}"</div>` : ''}
            </div>
        ` : ''}

        <!-- Manager Decision Form Controls (Only active if authorized) -->
        <div style="margin-bottom: 0.75rem;">
            <label for="manager-review-decision-note" style="font-weight: 700; font-size: 0.82rem; color: var(--text-primary); display: flex; justify-content: space-between;">
                <span>Manager Decision Remarks & Verification Notes</span>
                <span style="font-size: 0.72rem; color: var(--text-muted); font-weight: 400;">Visible in coordination logs</span>
            </label>
            <textarea id="manager-review-decision-note" class="form-control" rows="3" placeholder="${isAuthorized ? 'e.g. Verified commercial permits, guide credentials, and health/safety adherence.' : 'Review controls disabled (out of authorized management scope).'}" ${isAuthorized ? '' : 'disabled'} style="font-size: 0.85rem; width: 100%; margin-top: 0.35rem;">${sh.manager_note || ''}</textarea>
        </div>

        <!-- Platform RBAC Disclaimers -->
        <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px; padding: 0.65rem 0.85rem; font-size: 0.74rem; color: #64748B; line-height: 1.4;">
            🛡️ <strong>Platform RBAC Rule (FR-02):</strong> Destination Managers review and approve business registrations for their authorized destination. Account activation, deactivation, and permanent account deletion are strictly reserved for Platform Administrators.
        </div>
    `;

    footerEl.innerHTML = `
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
            ${isAuthorized ? `
                ${currentStatus !== 'Approved' ? `
                    <button type="button" class="btn-primary" id="btn-approve-sh-action" style="padding: 0.45rem 1rem; font-size: 0.82rem; background: #059669; border-color: #059669;">
                        ✓ Approve Registration
                    </button>
                    <button type="button" class="btn-secondary" id="btn-review-sh-action" style="padding: 0.45rem 0.9rem; font-size: 0.82rem; color: #2563EB; border-color: #BFDBFE;">
                        🔍 Mark Under Review
                    </button>
                    <button type="button" class="btn-secondary" id="btn-reject-sh-action" style="padding: 0.45rem 0.9rem; font-size: 0.82rem; color: #DC2626; border-color: #FECACA;">
                        ✕ Reject Registration
                    </button>
                ` : `
                    ${isStateScope ? `
                        <button type="button" class="btn-secondary" id="btn-reassign-sh-dest" style="padding: 0.45rem 0.9rem; font-size: 0.82rem; color: #0284C7; border-color: #BAE6FD; font-weight: 700;">
                            🔄 Reassign Destination (Controlled)
                        </button>
                    ` : `
                        <button type="button" class="btn-secondary" id="btn-reassign-sh-dest" style="padding: 0.45rem 0.9rem; font-size: 0.82rem; color: #94A3B8; border-color: #E2E8F0; font-weight: 600; cursor: not-allowed;" title="Destination Managers cannot reassign operating destinations. Reassigning businesses across destinations requires State Manager or Administrator authority." disabled>
                            🔒 Reassignment Locked (Destination Scope)
                        </button>
                    `}
                    <button type="button" class="btn-secondary" id="btn-review-sh-action" style="padding: 0.45rem 0.9rem; font-size: 0.82rem; color: #2563EB; border-color: #BFDBFE;">
                        🔍 Re-evaluate Under Review
                    </button>
                `}
            ` : `
                <span style="font-size: 0.75rem; color: #DC2626; font-weight: 600; padding: 0.4rem 0;">Approval actions locked (Out of assigned destination scope)</span>
            `}
        </div>
        <button type="button" class="btn-secondary" id="btn-close-sh-modal-action" style="padding: 0.45rem 1rem; font-size: 0.82rem;">Close</button>
    `;

    const closeActionBtn = document.getElementById('btn-close-sh-modal-action');
    if (closeActionBtn) closeActionBtn.onclick = () => { modal.classList.remove('active'); document.body.style.overflow = ''; };

    if (isAuthorized) {
        const approveBtn = document.getElementById('btn-approve-sh-action');
        const reviewBtn = document.getElementById('btn-review-sh-action');
        const rejectBtn = document.getElementById('btn-reject-sh-action');
        const reassignBtn = document.getElementById('btn-reassign-sh-dest');

        const updateStatus = async (newStatus) => {
            const noteInput = document.getElementById('manager-review-decision-note');
            const noteVal = noteInput ? noteInput.value.trim() : '';

            if (newStatus === 'Rejected' && !noteVal) {
                alert('Please provide a decision note explaining the reason for rejection so the partner can resolve the discrepancy.');
                if (noteInput) noteInput.focus();
                return;
            }

            const prevStatus = sh.status || 'Pending Approval';
            sh.status = newStatus;
            sh.manager_note = noteVal || (newStatus === 'Approved' ? 'Verified partner business registration.' : 'Under evaluation.');
            sh.reviewed_by = `${profile.name || 'Rajesh Patil'} (Destination Manager)`;
            sh.reviewed_date = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

            // Persist changes in prototype store & sync
            window.YatraSetuManagerStore.saveStakeholders(window.YatraSetuManagerData.stakeholders);

            // Audit Trail Logging
            if (window.YatraSetuAdminStore && typeof window.YatraSetuAdminStore.logAuditEvent === 'function') {
                window.YatraSetuAdminStore.logAuditEvent({
                    action: newStatus === 'Approved' ? 'BUSINESS_REGISTRATION_APPROVED' : (newStatus === 'Rejected' ? 'BUSINESS_REGISTRATION_REJECTED' : 'REGISTRATION_MARKED_UNDER_REVIEW'),
                    stakeholder_id: sh.id,
                    stakeholder_name: sh.name,
                    actor_name: profile.name || 'Rajesh Patil',
                    actor_role: `Destination Manager (${isStateScope ? 'State Scope' : 'Destination Scope'})`,
                    details: `Decision: marked as "${newStatus}". Note: ${sh.manager_note}`,
                    previous_value: prevStatus,
                    new_value: newStatus
                });
            }

            alert(`Registration for "${sh.name}" has been marked as "${newStatus}". (Saved with audit log)`);
            modal.classList.remove('active');
            document.body.style.overflow = '';

            await renderConnectedViews(window.YatraSetuManagerStore.getActiveContext());
        };

        if (approveBtn) approveBtn.onclick = () => updateStatus('Approved');
        if (reviewBtn) reviewBtn.onclick = () => updateStatus('Under Review');
        if (rejectBtn) rejectBtn.onclick = () => {
            if (confirm(`Are you sure you want to reject the registration for "${sh.name}"?`)) {
                updateStatus('Rejected');
            }
        };

        // Controlled Destination Reassignment Handler (Rule 4)
        if (reassignBtn) {
            reassignBtn.onclick = () => {
                if (!isStateScope) {
                    alert('Restricted Scope: Destination Managers cannot transfer businesses across destinations. Reassigning operating destinations requires State Manager or Platform Administrator authority.');
                    return;
                }
                const managerData = window.YatraSetuManagerData || {};
                const destinations = (managerData.destinations || []).filter(d => isStateScope ? d.state_id === profile.state_id : (profile.destination_ids || []).includes(d.id));

                const destOptionsText = destinations.map(d => `${d.id} : ${d.name}`).join('\n');
                const chosenDestId = prompt(`Controlled Destination Reassignment (Jurisdiction: ${profile.state_name || 'Maharashtra'})\n\nEnter destination ID from available list:\n${destOptionsText}\n\nCurrent: ${sh.destination_id}`);

                if (!chosenDestId) return;
                const destObj = destinations.find(d => d.id === chosenDestId.trim());
                if (!destObj) {
                    alert(`Invalid destination ID "${chosenDestId}". Reassignment aborted.`);
                    return;
                }

                if (destObj.id === sh.destination_id) {
                    alert(`"${destObj.name}" is already the assigned destination.`);
                    return;
                }

                const reason = prompt(`Enter official administrative justification for reassigning "${sh.name}" to "${destObj.name}" (Mandatory for audit trail):`);
                if (!reason || reason.trim().length < 6) {
                    alert('Official justification (minimum 6 characters) is mandatory. Reassignment aborted.');
                    return;
                }

                const prevDest = `${sh.destination} (${sh.destination_id})`;
                sh.destination_id = destObj.id;
                sh.destination = destObj.name;
                sh.state_id = destObj.state_id;

                window.YatraSetuManagerStore.saveStakeholders(window.YatraSetuManagerData.stakeholders);

                if (window.YatraSetuAdminStore && typeof window.YatraSetuAdminStore.logAuditEvent === 'function') {
                    window.YatraSetuAdminStore.logAuditEvent({
                        action: 'CONTROLLED_DESTINATION_REASSIGNMENT',
                        stakeholder_id: sh.id,
                        stakeholder_name: sh.name,
                        actor_name: profile.name || 'Rajesh Patil',
                        actor_role: `Destination Manager (${isStateScope ? 'State Scope' : 'Destination Scope'})`,
                        details: `Destination reassigned from "${prevDest}" to "${destObj.name}". Official Reason: ${reason.trim()}`,
                        previous_value: prevDest,
                        new_value: `${destObj.name} (${destObj.id})`
                    });
                }

                alert(`✓ Controlled reassignment completed!\nNew Destination: ${destObj.name}\nLogged to administrative audit trail.`);
                modal.classList.remove('active');
                document.body.style.overflow = '';
                renderConnectedViews(window.YatraSetuManagerStore.getActiveContext());
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

/**
 * Stakeholder Message Review & Response Modal
 * Supports destination scope checks, status transitions (In Review), and sending non-empty manager responses.
 */
async function openStakeholderMessageModal(msgId) {
    if (!msgId) return;
    const allMessages = (await window.YatraSetuManagerStore.getStakeholderMessages('all', 'all')) || [];
    const msg = allMessages.find(m => m.id === msgId);
    if (!msg) {
        alert('Stakeholder message not found.');
        return;
    }

    const modal = document.getElementById('stakeholderMessageModal');
    const titleEl = document.getElementById('sh-msg-modal-title');
    const statusBadgeEl = document.getElementById('sh-msg-modal-status-badge');
    const bodyEl = document.getElementById('sh-msg-modal-body');
    const footerEl = document.getElementById('sh-msg-modal-footer');
    const closeBtn = document.getElementById('btn-close-sh-msg-modal');

    if (!modal || !bodyEl || !footerEl) return;

    // Check manager authorization scope
    const profile = (typeof syncActiveManagerProfile === 'function' ? syncActiveManagerProfile() : null) || window.YatraSetuManagerData?.profile || {};
    const isStateScope = (profile.scope || 'STATE') === 'STATE';
    const isAuthorized = (profile.account_status !== 'Deactivated') && (isStateScope
        ? (msg.state_id === profile.state_id)
        : (msg.state_id === profile.state_id && (msg.destination_id === profile.destination_id || (profile.destination_ids || []).includes(msg.destination_id))));

    if (titleEl) titleEl.textContent = `Message from ${msg.stakeholder_name}`;
    if (statusBadgeEl) {
        statusBadgeEl.textContent = msg.status;
        statusBadgeEl.className = 'badge ' + (msg.status === 'Responded' ? 'badge-success' : (msg.status === 'In Review' ? 'badge-info' : 'badge-warning'));
    }

    const authBanner = isAuthorized
        ? `<div style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: 8px; padding: 0.5rem 0.75rem; font-size: 0.78rem; color: #065F46; display: flex; align-items: center; gap: 0.5rem;">
             <span>✓</span> <strong>Authorized Destination Jurisdiction:</strong> You have authority to review and respond for <em>${msg.destination_name}</em>.
           </div>`
        : `<div style="background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.25); border-radius: 8px; padding: 0.5rem 0.75rem; font-size: 0.78rem; color: #92400E; display: flex; align-items: center; gap: 0.5rem;">
             <span>🔒</span> <strong>Outside Jurisdiction:</strong> You are viewing this record outside your authorized territory. Action buttons are disabled.
           </div>`;

    const previousResponseSection = msg.manager_response ? `
        <div style="background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 8px; padding: 0.85rem; font-size: 0.85rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
                <strong style="color: #166534; font-size: 0.82rem;">Official Manager Response:</strong>
                <span style="font-size: 0.72rem; color: #64748B;">${msg.responded_at || ''}</span>
            </div>
            <p style="margin: 0; color: #166534; line-height: 1.5; font-style: italic;">
                "${msg.manager_response}"
            </p>
            <div style="font-size: 0.74rem; color: #15803D; margin-top: 0.4rem; font-weight: 600;">
                Responded by: ${msg.responded_by || 'Destination Manager'}
            </div>
        </div>
    ` : '';

    bodyEl.innerHTML = `
        ${authBanner}

        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 0.85rem; font-size: 0.82rem;">
            <div><span style="color: var(--text-muted); display: block; font-size: 0.72rem; text-transform: uppercase;">Stakeholder</span><strong>${msg.stakeholder_name}</strong></div>
            <div><span style="color: var(--text-muted); display: block; font-size: 0.72rem; text-transform: uppercase;">Business Entity</span><strong>${msg.business_name}</strong></div>
            <div><span style="color: var(--text-muted); display: block; font-size: 0.72rem; text-transform: uppercase;">Operating Destination</span><strong>📍 ${msg.destination_name}</strong></div>
            <div><span style="color: var(--text-muted); display: block; font-size: 0.72rem; text-transform: uppercase;">Submitted Timestamp</span><strong>${msg.submitted_at}</strong></div>
        </div>

        <div style="background: #fff; border: 1px solid #E2E8F0; border-radius: 8px; padding: 1rem;">
            <span style="font-size: 0.72rem; text-transform: uppercase; font-weight: 700; color: var(--text-muted); display: block; margin-bottom: 0.25rem;">
                Topic: ${msg.topic}
            </span>
            <p style="font-size: 0.9rem; color: var(--text-primary); line-height: 1.6; margin: 0; font-weight: 500;">
                "${msg.message}"
            </p>
        </div>

        ${previousResponseSection}

        ${isAuthorized ? `
            <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <label for="sh-msg-modal-reply-input" style="font-weight: 700; font-size: 0.82rem; color: var(--text-primary);">
                        ${msg.manager_response ? 'Update Official Response' : 'Draft Official Response *'}
                    </label>
                    ${msg.status === 'Pending' ? `
                        <button type="button" id="btn-modal-mark-in-review" class="btn-secondary" style="padding: 0.25rem 0.65rem; font-size: 0.75rem; color: #1E40AF; border-color: #BFDBFE; background: #EFF6FF; cursor: pointer;">
                            ⏱️ Mark In Review
                        </button>
                    ` : ''}
                </div>
                <textarea id="sh-msg-modal-reply-input" rows="3" class="form-control" style="width: 100%; border: 1px solid #CBD5E1; border-radius: 8px; padding: 0.65rem; font-size: 0.85rem;" placeholder="Type official response, trail status confirmation, or operational advice...">${msg.manager_response || ''}</textarea>
            </div>
        ` : ''}
    `;

    footerEl.innerHTML = `
        <button type="button" class="btn-secondary" id="btn-close-sh-msg-modal-action" style="padding: 0.45rem 0.9rem; font-size: 0.82rem;">Close</button>
        ${isAuthorized ? `
            <button type="button" class="btn-primary" id="btn-submit-sh-msg-reply" style="padding: 0.45rem 1rem; font-size: 0.82rem; font-weight: 700;">
                ${msg.manager_response ? 'Update Response' : 'Send Official Response'}
            </button>
        ` : ''}
    `;

    // Handler: Mark In Review
    const markReviewBtn = document.getElementById('btn-modal-mark-in-review');
    if (markReviewBtn) {
        markReviewBtn.onclick = async () => {
            msg.status = 'In Review';
            window.YatraSetuManagerStore.updateStakeholderMessage(msg.id, { status: 'In Review' });
            if (statusBadgeEl) {
                statusBadgeEl.textContent = 'In Review';
                statusBadgeEl.className = 'badge badge-info';
            }
            markReviewBtn.style.display = 'none';
            if (typeof showManagerToast === 'function') {
                showManagerToast('Message status updated to In Review.');
            }
            await renderConnectedViews(window.YatraSetuManagerStore.getActiveContext());
        };
    }

    // Handler: Submit Response
    const submitReplyBtn = document.getElementById('btn-submit-sh-msg-reply');
    if (submitReplyBtn) {
        submitReplyBtn.onclick = async () => {
            const replyInput = document.getElementById('sh-msg-modal-reply-input');
            const replyText = replyInput ? replyInput.value.trim() : '';

            if (!replyText) {
                alert('Please enter a non-empty response before sending.');
                if (replyInput) replyInput.focus();
                return;
            }

            const nowFormatted = new Date().toLocaleString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });

            const respondingManager = (window.YatraSetuManagerData && window.YatraSetuManagerData.profile && window.YatraSetuManagerData.profile.name)
                ? `${window.YatraSetuManagerData.profile.name} (Destination Manager)`
                : 'Rajesh Patil (Destination Manager)';

            window.YatraSetuManagerStore.updateStakeholderMessage(msg.id, {
                status: 'Responded',
                manager_response: replyText,
                responded_by: respondingManager,
                responded_at: nowFormatted
            });

            modal.classList.remove('active');
            document.body.style.overflow = '';

            if (typeof showManagerToast === 'function') {
                showManagerToast(`Official response recorded and sent to ${msg.stakeholder_name}!`);
            } else {
                alert('Official response recorded and sent!');
            }

            await renderConnectedViews(window.YatraSetuManagerStore.getActiveContext());
        };
    }

    const closeActionBtn = document.getElementById('btn-close-sh-msg-modal-action');
    if (closeActionBtn) closeActionBtn.onclick = () => { modal.classList.remove('active'); document.body.style.overflow = ''; };
    if (closeBtn) closeBtn.onclick = () => { modal.classList.remove('active'); document.body.style.overflow = ''; };

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

/**
 * --------------------------------------------------------------------------
 * FR-15: Destination Information Videos View & Modal Controllers
 * --------------------------------------------------------------------------
 */

const NEUTRAL_VIDEO_PLACEHOLDER = "data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20480%20270%22%20width%3D%22480%22%20height%3D%22270%22%3E%3Crect%20width%3D%22480%22%20height%3D%22270%22%20fill%3D%22%231E293B%22%2F%3E%3Cpath%20d%3D%22M210%20105%20L285%20135%20L210%20165%20Z%22%20fill%3D%22%2364748B%22%2F%3E%3Crect%20x%3D%2240%22%20y%3D%22210%22%20width%3D%22400%22%20height%3D%226%22%20rx%3D%223%22%20fill%3D%22%23334155%22%2F%3E%3Ctext%20x%3D%22240%22%20y%3D%22195%22%20fill%3D%22%2394A3B8%22%20font-family%3D%22system-ui%2C%20sans-serif%22%20font-size%3D%2213%22%20font-weight%3D%22600%22%20text-anchor%3D%22middle%22%3E%F0%9F%8E%AC%20Pending%20Verified%20Asset%3C%2Ftext%3E%3C%2Fsvg%3E";

/**
 * Render Destination Information Videos Grid & Metrics
 */
async function renderDestinationVideos(context) {
    const videoGrid = document.getElementById('destination-videos-grid');
    if (!videoGrid || typeof window.YatraSetuManagerStore === 'undefined') return;

    const { activeStateId, activeDestinationId } = context || window.YatraSetuManagerStore.getActiveContext();
    const config = STATE_CONFIGS[activeStateId] || STATE_CONFIGS['maharashtra'];
    const formattedStateName = config.badge ? config.badge.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ') : 'Maharashtra';

    // Scope check: verified against active manager profile
    const profile = (typeof syncActiveManagerProfile === 'function' ? syncActiveManagerProfile() : null) || window.YatraSetuManagerData?.profile || {};
    const isStateScope = (profile.scope || 'STATE') === 'STATE';
    const isStateAuthorized = (profile.account_status !== 'Deactivated') && (isStateScope
        ? (activeStateId === profile.state_id)
        : (activeStateId === profile.state_id && (activeDestinationId === 'all' || activeDestinationId === profile.destination_id)));

    // Fetch videos for active context
    const videos = await window.YatraSetuManagerStore.getDestinationVideos(activeStateId, activeDestinationId);

    // Update Tab count badge
    const tabBadge = document.getElementById('dest-videos-tab-badge');
    if (tabBadge) tabBadge.textContent = videos.length;

    // Update Metrics Strip
    const totalMetric = document.getElementById('metric-video-total');
    const pubMetric = document.getElementById('metric-video-published');
    const draftMetric = document.getElementById('metric-video-draft');
    const jurisMetric = document.getElementById('metric-video-jurisdiction');
    const jurisSub = document.getElementById('metric-video-jurisdiction-sub');

    if (totalMetric) totalMetric.textContent = videos.length;
    if (pubMetric) pubMetric.textContent = videos.filter(v => v.status === 'Published').length;
    if (draftMetric) draftMetric.textContent = videos.filter(v => v.status === 'Draft').length;
    if (jurisMetric) {
        jurisMetric.textContent = formattedStateName;
        jurisMetric.style.color = isStateAuthorized ? 'var(--state-accent)' : '#B45309';
    }
    if (jurisSub) {
        jurisSub.textContent = isStateAuthorized ? 'Authorized Jurisdiction' : 'Outside Jurisdiction (View Only)';
    }

    // Populate video form destination select with active state destinations
    const destSelect = document.getElementById('video-form-dest');
    if (destSelect) {
        const stateDests = await window.YatraSetuManagerStore.getDestinations(activeStateId);
        destSelect.innerHTML = stateDests.map(d => `<option value="${d.id}">${d.name}</option>`).join('');
        if (activeDestinationId !== 'all') {
            destSelect.value = activeDestinationId;
        }
    }

    // Add Video button jurisdiction enforcement
    const addVideoBtn = document.getElementById('btn-open-add-video-modal');
    if (addVideoBtn) {
        if (!isStateAuthorized) {
            addVideoBtn.setAttribute('disabled', 'true');
            addVideoBtn.style.opacity = '0.55';
            addVideoBtn.style.cursor = 'not-allowed';
            addVideoBtn.title = `Video management for ${formattedStateName} is restricted to authorized state managers.`;
        } else {
            addVideoBtn.removeAttribute('disabled');
            addVideoBtn.style.opacity = '1';
            addVideoBtn.style.cursor = 'pointer';
            addVideoBtn.title = 'Add ~30-second informative destination video';
        }
    }

    // Render Video Cards
    if (videos && videos.length > 0) {
        videoGrid.innerHTML = videos.map(v => {
            const isPub = v.status === 'Published';
            const statusClass = isPub ? 'published' : 'draft';
            const statusText = isPub ? 'Published' : 'Draft';

            // Distinguish the 3 verification states cleanly
            let protoBadge = '';
            if (v.verification_state === 'official_source') {
                protoBadge = `<span class="video-prototype-badge official-source">🏛️ Official Source</span>`;
            } else if (v.verification_state === 'verified_media') {
                protoBadge = `<span class="video-prototype-badge verified-media">✓ Verified Media</span>`;
            } else {
                protoBadge = `<span class="video-prototype-badge prototype-meta">📋 Prototype Metadata</span>`;
            }

            const thumbSrc = v.thumbnail_url || NEUTRAL_VIDEO_PLACEHOLDER;

            const actionButtons = isStateAuthorized ? `
                <div class="video-entry-actions">
                    <button type="button" class="btn-sm btn-secondary btn-edit-video" data-video-id="${v.id}" title="Edit metadata">✏️ Edit</button>
                    <button type="button" class="btn-sm btn-publish-toggle" data-video-id="${v.id}" data-current-status="${v.status}" title="${isPub ? 'Unpublish to Draft' : 'Publish for Tourists'}">
                        ${isPub ? '📥 Unpublish' : '🚀 Publish'}
                    </button>
                    <button type="button" class="btn-sm btn-delete-video" data-video-id="${v.id}" title="Remove entry">🗑️ Delete</button>
                </div>
            ` : `
                <div class="video-entry-actions">
                    <span style="font-size: 0.72rem; color: #94A3B8; font-style: italic;">🔒 View Only (Outside Jurisdiction)</span>
                </div>
            `;

            return `
                <div class="video-entry-card" data-video-id="${v.id}" data-category="${v.category || ''}" data-status="${v.status || ''}">
                    <div class="video-thumb-container" data-video-id="${v.id}">
                        <img src="${thumbSrc}" alt="${(v.title || '').replace(/"/g, '&quot;')}" class="video-thumb-img" onerror="this.onerror=null; this.src=NEUTRAL_VIDEO_PLACEHOLDER;">
                        <button type="button" class="video-play-overlay-btn" data-video-id="${v.id}" title="Preview Video">▶</button>
                        ${protoBadge}
                        <span class="video-status-badge ${statusClass}">${statusText}</span>
                        <span class="video-duration-badge">⏱️ ${v.duration || '0:30'}</span>
                    </div>
                    <div class="video-entry-body">
                        <div class="video-entry-cat-tag">${v.category || 'General'}</div>
                        <h3 class="video-entry-title">${v.title}</h3>
                        <p class="video-entry-desc">${v.description}</p>
                        <div class="video-entry-meta-row">
                            <span>📍 <strong>${v.destination_name || 'Destination'}</strong></span>
                            <span>${v.publisher ? `🏛️ ${v.publisher}` : (v.created_at || 'Recently added')}</span>
                        </div>
                        ${actionButtons}
                    </div>
                </div>
            `;
        }).join('');

        // Wire click for Play/Preview
        videoGrid.querySelectorAll('.video-thumb-container, .video-play-overlay-btn').forEach(el => {
            el.onclick = (e) => {
                if (e.target.closest('.video-entry-actions')) return;
                const vId = el.getAttribute('data-video-id');
                if (vId) openVideoPlayerModal(vId);
            };
        });

        // Wire Edit buttons
        videoGrid.querySelectorAll('.btn-edit-video').forEach(btn => {
            btn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                const vId = btn.getAttribute('data-video-id');
                openVideoModal(vId);
            };
        });

        // Wire Publish Toggle buttons with Publication Integrity Enforcement
        videoGrid.querySelectorAll('.btn-publish-toggle').forEach(btn => {
            btn.onclick = async (e) => {
                e.preventDefault();
                e.stopPropagation();
                const vId = btn.getAttribute('data-video-id');
                const currStatus = btn.getAttribute('data-current-status');
                const targetVideo = videos.find(v => v.id === vId);

                if (currStatus !== 'Published') {
                    // Manager is attempting to publish
                    const isProto = !targetVideo || !targetVideo.is_verified_asset || targetVideo.verification_state === 'prototype_metadata' || (targetVideo.video_url && targetVideo.video_url.includes('prototype'));
                    if (isProto) {
                        const alertMsg = 'Cannot publish prototype metadata. A confirmed, playable media asset from an authorized source is required before publishing for tourists.';
                        if (typeof showManagerToast === 'function') {
                            showManagerToast(alertMsg, 'warning');
                        } else {
                            alert(alertMsg);
                        }
                        return;
                    }
                }

                const nextStatus = currStatus === 'Published' ? 'Draft' : 'Published';

                window.YatraSetuManagerStore.updateDestinationVideo(vId, {
                    status: nextStatus,
                    updated_at: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                });

                if (typeof showManagerToast === 'function') {
                    showManagerToast(`Video status updated to "${nextStatus}".`);
                }
                await renderDestinationVideos(window.YatraSetuManagerStore.getActiveContext());
            };
        });

        // Wire Delete buttons
        videoGrid.querySelectorAll('.btn-delete-video').forEach(btn => {
            btn.onclick = async (e) => {
                e.preventDefault();
                e.stopPropagation();
                const vId = btn.getAttribute('data-video-id');
                const targetVideo = videos.find(v => v.id === vId);
                const confirmTitle = targetVideo ? targetVideo.title : 'this video entry';

                if (confirm(`Are you sure you want to remove "${confirmTitle}"? This action cannot be undone.`)) {
                    window.YatraSetuManagerStore.deleteDestinationVideo(vId);
                    if (typeof showManagerToast === 'function') {
                        showManagerToast(`Video entry "${confirmTitle}" was deleted.`);
                    }
                    await renderDestinationVideos(window.YatraSetuManagerStore.getActiveContext());
                }
            };
        });

    } else {
        videoGrid.innerHTML = `
            <div style="grid-column: 1 / -1; padding: 3rem 1.5rem; text-align: center; background: #FFFFFF; border: 1px dashed var(--card-border); border-radius: 8px;">
                <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🎬</div>
                <h4 style="font-size: 1rem; font-weight: 700; color: var(--text-primary); margin: 0 0 0.35rem 0;">No Video Entries Found</h4>
                <p style="font-size: 0.84rem; color: var(--text-muted); margin: 0 0 1rem 0;">No destination information videos match the current selection in ${formattedStateName}.</p>
                ${isStateAuthorized ? `<button type="button" class="btn-primary" onclick="openVideoModal()">+ Add First Video Entry</button>` : ''}
            </div>
        `;
    }
}

/**
 * Open Video Modal (Add or Edit)
 */
async function openVideoModal(videoId = null) {
    const modal = document.getElementById('videoModal');
    if (!modal) return;

    const modalTitle = document.getElementById('video-modal-title');
    const formId = document.getElementById('video-form-id');
    const formStateId = document.getElementById('video-form-state-id');
    const formDest = document.getElementById('video-form-dest');
    const formCat = document.getElementById('video-form-category');
    const formTitle = document.getElementById('video-form-title');
    const formDesc = document.getElementById('video-form-desc');
    const formUrl = document.getElementById('video-form-url');
    const formDuration = document.getElementById('video-form-duration');
    const formThumb = document.getElementById('video-form-thumb');
    const formStatus = document.getElementById('video-form-status');
    const formProtoCheck = document.getElementById('video-form-prototype-check');
    const alertBox = document.getElementById('video-form-alert');

    if (alertBox) alertBox.style.display = 'none';

    const activeCtx = window.YatraSetuManagerStore.getActiveContext();
    const activeStateId = activeCtx.activeStateId || 'maharashtra';

    // Populate destination dropdown preserving the record's actual destination
    const destinations = await window.YatraSetuManagerStore.getDestinations(activeStateId);
    let targetV = null;
    if (videoId) {
        const allVideos = await window.YatraSetuManagerStore.getDestinationVideos('all', 'all');
        targetV = allVideos.find(item => item.id === videoId);
    }

    if (formDest && destinations) {
        let options = destinations.map(d => `<option value="${d.id}">${d.name}</option>`);
        if (targetV && targetV.destination_id && !destinations.some(d => d.id === targetV.destination_id)) {
            options.push(`<option value="${targetV.destination_id}">${targetV.destination_name || targetV.destination_id}</option>`);
        }
        formDest.innerHTML = options.join('');
    }

    if (videoId && targetV) {
        const v = targetV;
        if (modalTitle) modalTitle.textContent = 'Edit Video Entry';
        if (formId) formId.value = v.id;
        if (formStateId) formStateId.value = v.state_id || activeStateId;
        if (formDest) formDest.value = v.destination_id;
        if (formCat) formCat.value = v.category || 'Heritage & Architecture';
        if (formTitle) formTitle.value = v.title || '';
        if (formDesc) formDesc.value = v.description || '';
        if (formUrl) formUrl.value = v.video_url || '';
        if (formDuration) formDuration.value = v.duration || '0:30';
        if (formThumb) formThumb.value = v.thumbnail_url || '';
        if (formStatus) formStatus.value = v.status || 'Draft';
        if (formProtoCheck) formProtoCheck.checked = !v.is_verified_asset;
    } else {
        // Add mode
        if (modalTitle) modalTitle.textContent = 'Add Destination Information Video (~30s)';
        if (formId) formId.value = '';
        if (formStateId) formStateId.value = activeStateId;
        if (formDest && activeCtx.activeDestinationId !== 'all') {
            formDest.value = activeCtx.activeDestinationId;
        }
        if (formCat) formCat.selectedIndex = 0;
        if (formTitle) formTitle.value = '';
        if (formDesc) formDesc.value = '';
        if (formUrl) formUrl.value = 'https://assets.yatrasetu.org/media/videos/prototype/' + activeStateId + '-clip.mp4';
        if (formDuration) formDuration.value = '0:30';
        if (formThumb) formThumb.value = NEUTRAL_VIDEO_PLACEHOLDER;
        if (formStatus) formStatus.value = 'Draft';
        if (formProtoCheck) formProtoCheck.checked = true;
    }

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

/**
 * Open Video Player Preview Modal (Interactive YouTube player / Prototype Screen)
 */
async function openVideoPlayerModal(videoId) {
    if (!videoId) return;
    const modal = document.getElementById('videoPlayerModal');
    if (!modal) return;

    const allVideos = await window.YatraSetuManagerStore.getDestinationVideos('all', 'all');
    const v = allVideos.find(item => item.id === videoId);
    if (!v) return;

    const titleEl = document.getElementById('player-modal-title');
    const statusBadge = document.getElementById('player-modal-status-badge');
    const playerContainer = document.getElementById('player-container');
    const infoTitle = document.getElementById('player-info-title');
    const infoDesc = document.getElementById('player-info-desc');
    const infoDest = document.getElementById('player-info-dest');
    const infoCat = document.getElementById('player-info-cat');
    const infoDuration = document.getElementById('player-info-duration');
    const infoPublisher = document.getElementById('player-info-publisher');
    const infoPermissions = document.getElementById('player-info-permissions');
    const infoLink = document.getElementById('player-info-link');
    const infoAssetFlag = document.getElementById('player-info-asset-flag');
    const infoUpdated = document.getElementById('player-info-updated');
    const authStatus = document.getElementById('player-modal-auth-status');
    const editBtn = document.getElementById('btn-player-edit-action');

    const activeProfile = (window.YatraSetuManagerCore && window.YatraSetuManagerCore.syncActiveManagerProfile)
        ? window.YatraSetuManagerCore.syncActiveManagerProfile()
        : (window.YatraSetuManagerData ? window.YatraSetuManagerData.profile : null);

    const isSuspended = activeProfile && (activeProfile.status === 'Suspended' || activeProfile.account_status === 'Suspended' || activeProfile.status === 'Inactive' || activeProfile.account_status === 'Inactive');

    let isAuthorized = false;
    if (!isSuspended && activeProfile) {
        if (activeProfile.scope === 'STATE' || activeProfile.manager_type === 'State Manager' || activeProfile.access_level === 'State Manager') {
            isAuthorized = (v.state_id === activeProfile.state_id);
        } else {
            isAuthorized = (v.state_id === activeProfile.state_id && (v.destination_id === activeProfile.destination_id || (activeProfile.destination_ids || []).includes(v.destination_id)));
        }
    }

    if (titleEl) titleEl.textContent = `Video Preview: ${v.title}`;
    if (statusBadge) {
        statusBadge.textContent = v.status || 'Draft';
        statusBadge.className = 'badge ' + (v.status === 'Published' ? 'badge-success' : 'badge-warning');
    }

    // Embed genuine video player if verified YouTube asset, otherwise show animated prototype screen
    if (playerContainer) {
        const ytMatch = (v.video_url || '').match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/)|&v=)([\w-]{11})/);
        if (v.is_verified_asset && ytMatch && ytMatch[1]) {
            playerContainer.innerHTML = `
                <iframe id="active-yt-player" width="100%" height="100%"
                    src="https://www.youtube-nocookie.com/embed/${ytMatch[1]}?autoplay=1&rel=0"
                    frameborder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerpolicy="strict-origin-when-cross-origin"
                    allowfullscreen
                    title="${(v.title || '').replace(/"/g, '&quot;')}"
                    style="position: absolute; inset: 0; width: 100%; height: 100%; border: none;">
                </iframe>
            `;
        } else {
            playerContainer.innerHTML = `
                <div class="video-prototype-screen" id="player-screen">
                    <div class="video-screen-play-icon">▶</div>
                    <div style="font-weight: 800; font-size: 1.1rem; margin-bottom: 0.35rem;" id="player-screen-title">${v.title}</div>
                    <div style="font-size: 0.82rem; opacity: 0.9;" id="player-screen-dest">${v.destination_name || 'Destination'} • Prototype Metadata Simulation</div>
                    <div style="margin-top: 0.85rem; font-size: 0.72rem; background: rgba(0,0,0,0.4); padding: 0.25rem 0.65rem; border-radius: 4px; border: 1px solid rgba(255,255,255,0.2);">
                        Official Destination Audio-Visual Orientation • YatraSetu FR-15
                    </div>
                </div>
            `;
        }
    }

    if (infoTitle) infoTitle.textContent = v.title;
    if (infoDesc) infoDesc.textContent = v.description;
    if (infoDest) infoDest.textContent = v.destination_name || v.destination_id;
    if (infoCat) infoCat.textContent = v.category;
    if (infoDuration) infoDuration.textContent = `${v.duration || '0:30'} (${v.is_verified_asset ? 'actual duration' : '~30s prototype'})`;
    if (infoPublisher) infoPublisher.textContent = v.publisher || 'Official Tourism Source';
    if (infoPermissions) infoPermissions.textContent = v.embed_permission || (v.is_verified_asset ? 'YouTube Standard Player Embedding' : 'Prototype Media Record');

    if (infoLink) {
        if (v.video_url && v.video_url.startsWith('http')) {
            infoLink.href = v.video_url;
            infoLink.style.display = 'inline';
            infoLink.textContent = v.is_verified_asset ? 'View Official Source ↗' : 'View Prototype Reference ↗';
        } else {
            infoLink.style.display = 'none';
        }
    }

    if (infoAssetFlag) {
        if (v.verification_state === 'official_source') {
            infoAssetFlag.innerHTML = '🏛️ <strong>Official Tourism Source</strong> (Verified Authority Asset)';
        } else if (v.verification_state === 'verified_media') {
            infoAssetFlag.innerHTML = '✓ <strong>Verified Media Asset</strong> (Confirmed Playable Creator Stream)';
        } else {
            infoAssetFlag.innerHTML = '📋 <strong>Prototype Metadata Record</strong> (~30s simulation, awaiting confirmed media)';
        }
    }
    if (infoUpdated) infoUpdated.textContent = `Updated: ${v.updated_at || v.created_at || '12 Oct 2026'}`;

    if (authStatus) {
        authStatus.textContent = isAuthorized ? 'Authorized Manager' : 'Outside Jurisdiction (Read-Only)';
    }

    if (editBtn) {
        if (isAuthorized) {
            editBtn.style.display = 'inline-block';
            editBtn.onclick = () => {
                modal.classList.remove('active');
                document.body.style.overflow = '';
                if (playerContainer) playerContainer.innerHTML = '';
                openVideoModal(v.id);
            };
        } else {
            editBtn.style.display = 'none';
        }
    }

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}
