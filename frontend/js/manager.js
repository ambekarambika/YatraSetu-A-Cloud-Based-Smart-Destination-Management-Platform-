/**
 * YatraSetu — Connected View Renderers & Subpage Interactivity Engine
 * Dependencies: manager-data.js, manager-core.js (YatraSetuManagerStore, YatraSetuManagerContext)
 */

/**
 * Connected View Renderer Engine for Manager Subpages
 */
document.addEventListener('DOMContentLoaded', () => {
    initTableSearchAndFilters();
    initReportGenerator();
    initAddAttractionForm();
    initAddDestinationForm();
    initAddEventForm();
    initAddStakeholderForm();
    initFeedbackTabs();
    initDestinationTabs();
    initDestinationVideoManager();
    if (typeof initManagerProfilePage === 'function') {
        initManagerProfilePage();
    }
});

/**
 * Destination Manager Feedback & Suggestions Dual Tabs Engine
 */
function initFeedbackTabs() {
    const tabBtnTourist = document.getElementById('tab-btn-tourist');
    const tabBtnStakeholder = document.getElementById('tab-btn-stakeholder');
    const tabContentTourist = document.getElementById('tab-content-tourist');
    const tabContentStakeholder = document.getElementById('tab-content-stakeholder');

    if (!tabBtnTourist || !tabBtnStakeholder || !tabContentTourist || !tabContentStakeholder) return;

    tabBtnTourist.addEventListener('click', (e) => {
        e.preventDefault();
        tabBtnTourist.classList.add('active');
        tabBtnStakeholder.classList.remove('active');
        tabContentTourist.style.display = 'block';
        tabContentStakeholder.style.display = 'none';
    });

    tabBtnStakeholder.addEventListener('click', (e) => {
        e.preventDefault();
        tabBtnStakeholder.classList.add('active');
        tabBtnTourist.classList.remove('active');
        tabContentTourist.style.display = 'none';
        tabContentStakeholder.style.display = 'block';
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

    // Check category card or category select
    const activeCatCard = document.querySelector('.category-card-grid .category-card.active');
    const catCardTerm = activeCatCard ? (activeCatCard.getAttribute('data-category') || '').toLowerCase() : '';
    const selectCategory = filterCategorySelect ? filterCategorySelect.value.toLowerCase() : '';

    // Check status pill
    const activeStatusPill = document.querySelector('#sh-status-filter-pills .filter-pill.active');
    const statusTerm = activeStatusPill ? (activeStatusPill.getAttribute('data-status') || '').toLowerCase() : 'all';

    // Check generic filter pill (for other pages like events, attractions, feedback)
    const activeGenericPill = document.querySelector('.filter-pill-bar:not(#sh-status-filter-pills):not(#sh-msg-status-filter-pills) .filter-pill.active');
    const genericPillCategory = activeGenericPill ? (activeGenericPill.getAttribute('data-category') || activeGenericPill.textContent.trim()).toLowerCase() : 'all';

    const categoryTerm = catCardTerm && catCardTerm !== 'all'
        ? catCardTerm
        : (selectCategory && selectCategory !== 'all'
            ? selectCategory
            : genericPillCategory);

    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';

    // 1. Table rows
    const tables = document.querySelectorAll('.app-table');
    tables.forEach(table => {
        const rows = table.querySelectorAll('tbody tr');
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            const rowCategory = (row.getAttribute('data-category') || '').toLowerCase();
            const rowStatus = (row.getAttribute('data-status') || '').toLowerCase();

            const matchesSearch = text.includes(searchTerm);

            let matchesCategory = true;
            if (categoryTerm && categoryTerm !== 'all') {
                matchesCategory = rowCategory.includes(categoryTerm) || text.includes(categoryTerm);
            }

            let matchesStatus = true;
            if (statusTerm && statusTerm !== 'all') {
                matchesStatus = rowStatus.includes(statusTerm);
            }

            row.style.display = (matchesSearch && matchesCategory && matchesStatus) ? '' : 'none';
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

    // 3B. Stakeholder message table rows (feedback.html)
    const activeMsgPill = document.querySelector('#sh-msg-status-filter-pills .filter-pill.active');
    const msgStatus = activeMsgPill ? (activeMsgPill.getAttribute('data-msg-status') || 'all') : 'all';
    const msgRows = document.querySelectorAll('#stakeholder-messages-tbody tr.sh-msg-row');
    msgRows.forEach(row => {
        const rowStatus = row.getAttribute('data-msg-status') || '';
        const rowText = row.textContent.toLowerCase();
        const matchesStatus = (msgStatus === 'all' || rowStatus.toLowerCase() === msgStatus.toLowerCase());
        const matchesSearch = (!searchTerm || rowText.includes(searchTerm));
        row.style.display = (matchesStatus && matchesSearch) ? '' : 'none';
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
        modalTargetBtn.onclick = async () => {
            const activeContext = window.YatraSetuManagerStore ? window.YatraSetuManagerStore.getActiveContext() : { activeStateId: 'maharashtra' };
            if (activeContext.managerScope === 'destination' && activeContext.assignedDestinationId) {
                const destName = activeContext.assignedDestinationName || activeContext.assignedDestinationId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                destSelect.innerHTML = `<option value="${activeContext.assignedDestinationId}" selected>${destName}</option>`;
                destSelect.disabled = true;
            } else {
                destSelect.disabled = false;
                let destinations = (window.YatraSetuManagerData && window.YatraSetuManagerData.destinations) || [];
                if ((!destinations || !destinations.length) && window.YatraSetuManagerStore) {
                    destinations = await window.YatraSetuManagerStore.getDestinations(activeContext.activeStateId);
                }
                const stateDests = destinations.filter(d => !activeContext.activeStateId || d.state_id === activeContext.activeStateId);
                destSelect.innerHTML = stateDests.map(d => `<option value="${d.id}">${d.name}</option>`).join('');
            }
        };
    }

    if (saveBtn) {
        saveBtn.onclick = async (e) => {
            e.preventDefault();
            const nameInput = document.getElementById('add-attr-name');
            const destSelect = document.getElementById('add-attr-dest');
            const catInput = document.getElementById('add-attr-category');
            const imgInput = document.getElementById('add-attr-img');

            const nameVal = nameInput ? nameInput.value.trim() : '';
            const catVal = catInput ? catInput.value.trim() : '';
            const imgVal = imgInput ? imgInput.value.trim() : '';

            if (!nameVal) {
                alert('Please enter an attraction name.');
                return;
            }
            if (nameVal.length > 180) {
                alert('Attraction name must not exceed 180 characters.');
                return;
            }
            if (catVal && catVal.length > 64) {
                alert('Attraction category must not exceed 64 characters.');
                return;
            }
            if (imgVal && imgVal.length > 500) {
                alert('Image URL must not exceed 500 characters.');
                return;
            }

            const activeContext = window.YatraSetuManagerStore ? window.YatraSetuManagerStore.getActiveContext() : { activeStateId: 'maharashtra' };

            // Determine target destination ID with jurisdiction validation
            let destVal = (activeContext.managerScope === 'destination' && activeContext.assignedDestinationId)
                ? activeContext.assignedDestinationId
                : (destSelect ? destSelect.value : '');

            if (!destVal) {
                destVal = (window.YatraSetuManagerData && window.YatraSetuManagerData.destinations)
                    ? (window.YatraSetuManagerData.destinations.find(d => d.state_id === activeContext.activeStateId)?.id || '')
                    : '';
            }

            if (!destVal) {
                alert('Please select a valid parent destination.');
                return;
            }

            if (activeContext.managerScope === 'destination' && activeContext.assignedDestinationId && destVal !== activeContext.assignedDestinationId) {
                alert('Permission denied: You can only add attractions to your assigned destination.');
                return;
            }

            const token = (typeof sessionStorage !== 'undefined')
                ? (sessionStorage.getItem('yatrasetu_access_token') || (window.YatraSetuApi && window.YatraSetuApi.getAccessToken()))
                : null;

            if (token && window.YatraSetuApi && typeof window.YatraSetuApi.createManagedAttraction === 'function') {
                const payload = {
                    destination_id: destVal,
                    name: nameVal,
                    category: catVal || 'Attraction',
                    status: 'Open'
                };
                if (imgVal) {
                    payload.image_url = imgVal;
                }

                saveBtn.disabled = true;
                const originalBtnText = saveBtn.textContent;
                saveBtn.textContent = 'Saving...';

                try {
                    const created = await window.YatraSetuApi.createManagedAttraction(payload);

                    // Reset inputs
                    if (nameInput) nameInput.value = '';
                    if (catInput) catInput.value = '';
                    if (imgInput) imgInput.value = '';

                    // Close modal
                    const modal = document.getElementById('addAttractionModal');
                    if (modal) modal.classList.remove('active');
                    document.body.style.overflow = '';

                    // Invalidate store cache and refresh views from backend
                    if (window.YatraSetuManagerStore && typeof window.YatraSetuManagerStore.invalidateCache === 'function') {
                        window.YatraSetuManagerStore.invalidateCache('attractions');
                    }
                    if (typeof renderConnectedViews === 'function' && window.YatraSetuManagerStore) {
                        await renderConnectedViews(window.YatraSetuManagerStore.getActiveContext());
                    }

                    if (window.YatraSetuManagerStore && typeof window.YatraSetuManagerStore.invalidateCache === 'function') {
                        window.YatraSetuManagerStore.invalidateCache('events');
                    }
                    if (typeof showManagerToast === 'function') {
                        showManagerToast(`Attraction "${nameVal}" created successfully!`);
                    } else {
                        alert(`Attraction "${nameVal}" created successfully!`);
                    }
                } catch (err) {
                    console.error('[initAddAttractionForm] Failed to create attraction:', err);
                    let errMsg = err.message || 'Failed to create attraction.';
                    if (err.status === 401) {
                        errMsg = 'Your session has expired. Please log in again.';
                    } else if (err.status === 403) {
                        errMsg = 'Permission denied: You cannot create an attraction outside your jurisdiction.';
                    } else if (err.status === 404) {
                        errMsg = 'Destination not found: The specified parent destination does not exist.';
                    } else if (err.status === 422) {
                        errMsg = `Validation error: ${err.message || 'Please check all required fields.'}`;
                    } else if (err.status === 0) {
                        errMsg = 'Network error: Unable to connect to the backend server.';
                    }
                    if (window.YatraSetuManagerStore && typeof window.YatraSetuManagerStore.invalidateCache === 'function') {
                        window.YatraSetuManagerStore.invalidateCache('events');
                    }
                    if (typeof showManagerToast === 'function') {
                        showManagerToast(errMsg, 'error');
                    }
                    alert(errMsg);
                } finally {
                    saveBtn.disabled = false;
                    saveBtn.textContent = originalBtnText;
                }
            } else {
                // Prototype preview mode ONLY (unauthenticated)
                const newAttr = {
                    id: 'attr-' + Date.now(),
                    state_id: activeContext.activeStateId,
                    destination_id: destVal,
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
            }
        };
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
            const capVal = parseInt(document.getElementById('add-dest-capacity')?.value || '4000', 10);

            const payload = {
                id: destId || ('dest-' + Date.now()),
                state_id: activeContext.activeStateId,
                name: nameVal,
                category: catVal,
                location_label: regionVal || `${nameVal}, ${activeContext.activeStateId}`,
                hero_image_url: imgVal || 'https://images.unsplash.com/photo-1600100397608-f010e423b963?auto=format&fit=crop&w=800&q=80',
                banner_image: imgVal || 'https://images.unsplash.com/photo-1600100397608-f010e423b963?auto=format&fit=crop&w=800&q=80',
                max_daily_capacity: capVal
            };

            const token = window.YatraSetuApi ? window.YatraSetuApi.getAccessToken() : null;
            if (token && window.YatraSetuApi && typeof window.YatraSetuApi.createManagedDestination === 'function') {
                saveBtn.disabled = true;
                saveBtn.textContent = 'Saving...';
                try {
                    const created = await window.YatraSetuApi.createManagedDestination(payload);
                    const newDest = {
                        id: created.id,
                        state_id: created.state_id,
                        name: created.name,
                        category: created.category,
                        rank: (window.YatraSetuManagerData.destinations ? window.YatraSetuManagerData.destinations.filter(d => d.state_id === activeContext.activeStateId).length + 1 : 1),
                        img: created.hero_image_url || payload.hero_image_url
                    };
                    if (window.YatraSetuManagerData && window.YatraSetuManagerData.destinations) {
                        const exists = window.YatraSetuManagerData.destinations.some(d => d.id === newDest.id);
                        if (!exists) window.YatraSetuManagerData.destinations.push(newDest);
                    }
                    try {
                        let custom = [];
                        const raw = localStorage.getItem('yatrasetu_manager_custom_destinations') || sessionStorage.getItem('yatrasetu_manager_custom_destinations');
                        if (raw) custom = JSON.parse(raw);
                        if (!Array.isArray(custom)) custom = [];
                        const existingIdx = custom.findIndex(d => d.id === newDest.id);
                        if (existingIdx >= 0) custom[existingIdx] = newDest;
                        else custom.push(newDest);
                        localStorage.setItem('yatrasetu_manager_custom_destinations', JSON.stringify(custom));
                        sessionStorage.setItem('yatrasetu_manager_custom_destinations', JSON.stringify(custom));
                        localStorage.setItem('yatrasetu_catalogue_invalidated_at', Date.now().toString());
                        sessionStorage.removeItem('yatrasetu_tourist_catalogue');
                    } catch (e) {}
                    if (window.YatraSetuManagerStore && typeof window.YatraSetuManagerStore.invalidateCache === 'function') {
                        window.YatraSetuManagerStore.invalidateCache('destinations');
                    }
                    if (window.YatraSetuManagerStore && typeof window.YatraSetuManagerStore.invalidateCache === 'function') {
                        window.YatraSetuManagerStore.invalidateCache('events');
                    }
                    if (typeof showManagerToast === 'function') {
                        showManagerToast(`Destination "${created.name}" created and published successfully!`);
                    }
                } catch (err) {
                    console.error('[initAddDestinationForm] Backend save error:', err);
                    alert(err.message || 'Failed to create destination on server.');
                    saveBtn.disabled = false;
                    saveBtn.textContent = 'Save Destination';
                    return;
                } finally {
                    saveBtn.disabled = false;
                    saveBtn.textContent = 'Save Destination';
                }
            } else {
                const newDest = {
                    id: payload.id,
                    state_id: payload.state_id,
                    name: payload.name,
                    category: payload.category,
                    rank: (window.YatraSetuManagerData.destinations ? window.YatraSetuManagerData.destinations.filter(d => d.state_id === activeContext.activeStateId).length + 1 : 1),
                    img: payload.hero_image_url
                };
                if (window.YatraSetuManagerData && window.YatraSetuManagerData.destinations) {
                    const exists = window.YatraSetuManagerData.destinations.some(d => d.id === newDest.id);
                    if (!exists) window.YatraSetuManagerData.destinations.push(newDest);
                }
                try {
                    let custom = [];
                    const raw = localStorage.getItem('yatrasetu_manager_custom_destinations') || sessionStorage.getItem('yatrasetu_manager_custom_destinations');
                    if (raw) custom = JSON.parse(raw);
                    if (!Array.isArray(custom)) custom = [];
                    const existingIdx = custom.findIndex(d => d.id === newDest.id);
                    if (existingIdx >= 0) custom[existingIdx] = newDest;
                    else custom.push(newDest);
                    localStorage.setItem('yatrasetu_manager_custom_destinations', JSON.stringify(custom));
                    sessionStorage.setItem('yatrasetu_manager_custom_destinations', JSON.stringify(custom));
                    localStorage.setItem('yatrasetu_catalogue_invalidated_at', Date.now().toString());
                    sessionStorage.removeItem('yatrasetu_tourist_catalogue');
                } catch (e) {}
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
        modalTargetBtn.onclick = async () => {
            const activeContext = window.YatraSetuManagerStore ? window.YatraSetuManagerStore.getActiveContext() : { activeStateId: 'maharashtra' };
            if (activeContext.managerScope === 'destination' && activeContext.assignedDestinationId) {
                const destName = activeContext.assignedDestinationName || activeContext.assignedDestinationId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                destSelect.innerHTML = `<option value="${activeContext.assignedDestinationId}" selected>${destName}</option>`;
                destSelect.disabled = true;
            } else {
                destSelect.disabled = false;
                let destinations = (window.YatraSetuManagerData && window.YatraSetuManagerData.destinations) || [];
                if ((!destinations || !destinations.length) && window.YatraSetuManagerStore) {
                    destinations = await window.YatraSetuManagerStore.getDestinations(activeContext.activeStateId);
                }
                const stateDests = destinations.filter(d => !activeContext.activeStateId || d.state_id === activeContext.activeStateId);
                destSelect.innerHTML = stateDests.map(d => `<option value="${d.id}">${d.name}</option>`).join('');
            }
        };
    }

    if (saveBtn) {
        saveBtn.onclick = async (e) => {
            e.preventDefault();
            const titleInput = document.getElementById('add-event-title');
            const destSelect = document.getElementById('add-event-dest');
            const locInput = document.getElementById('add-event-location');
            const dateInput = document.getElementById('add-event-date');
            const imgInput = document.getElementById('add-event-img');

            const titleVal = titleInput ? titleInput.value.trim() : '';
            const locVal = locInput ? locInput.value.trim() : '';
            const dateVal = dateInput ? dateInput.value.trim() : '';
            const imgVal = imgInput ? imgInput.value.trim() : '';

            if (!titleVal) {
                alert('Please enter an event title.');
                return;
            }
            if (titleVal.length > 180) {
                alert('Event title must not exceed 180 characters.');
                return;
            }
            if (!locVal) {
                alert('Please enter an event location or venue.');
                return;
            }
            if (locVal.length > 150) {
                alert('Location must not exceed 150 characters.');
                return;
            }
            if (!dateVal) {
                alert('Please enter an event date (e.g. 15 OCT).');
                return;
            }

            const dateParts = dateVal.split(/\s+/);
            const dateNum = dateParts[0] || '15';
            const dateMonth = (dateParts[1] || 'OCT').toUpperCase();

            if (dateNum.length > 10) {
                alert('Date day/range must not exceed 10 characters.');
                return;
            }
            if (dateMonth.length > 10) {
                alert('Date month must not exceed 10 characters.');
                return;
            }
            if (imgVal && imgVal.length > 500) {
                alert('Image URL must not exceed 500 characters.');
                return;
            }

            const activeContext = window.YatraSetuManagerStore ? window.YatraSetuManagerStore.getActiveContext() : { activeStateId: 'maharashtra' };

            // Determine target destination ID with jurisdiction validation
            let destVal = (activeContext.managerScope === 'destination' && activeContext.assignedDestinationId)
                ? activeContext.assignedDestinationId
                : (destSelect ? destSelect.value : '');

            if (!destVal) {
                destVal = (window.YatraSetuManagerData && window.YatraSetuManagerData.destinations)
                    ? (window.YatraSetuManagerData.destinations.find(d => d.state_id === activeContext.activeStateId)?.id || '')
                    : '';
            }

            if (!destVal) {
                alert('Please select a valid parent destination.');
                return;
            }

            if (activeContext.managerScope === 'destination' && activeContext.assignedDestinationId && destVal !== activeContext.assignedDestinationId) {
                alert('Permission denied: You can only schedule events in your assigned destination.');
                return;
            }

            const token = (typeof sessionStorage !== 'undefined')
                ? (sessionStorage.getItem('yatrasetu_access_token') || (window.YatraSetuApi && window.YatraSetuApi.getAccessToken()))
                : null;

            if (token && window.YatraSetuApi && typeof window.YatraSetuApi.createManagedEvent === 'function') {
                const payload = {
                    destination_id: destVal,
                    title: titleVal,
                    date_num: dateNum,
                    date_month: dateMonth,
                    location_label: locVal,
                    status: 'Upcoming',
                    status_class: 'active'
                };
                if (imgVal) {
                    payload.image_url = imgVal;
                }

                saveBtn.disabled = true;
                const originalBtnText = saveBtn.textContent;
                saveBtn.textContent = 'Scheduling...';

                try {
                    const created = await window.YatraSetuApi.createManagedEvent(payload);

                    // Reset inputs
                    if (titleInput) titleInput.value = '';
                    if (locInput) locInput.value = '';
                    if (dateInput) dateInput.value = '';
                    if (imgInput) imgInput.value = '';

                    // Close modal
                    const modal = document.getElementById('addEventModal');
                    if (modal) modal.classList.remove('active');
                    document.body.style.overflow = '';

                    // Invalidate store cache and refresh views from backend
                    if (window.YatraSetuManagerStore && typeof window.YatraSetuManagerStore.invalidateCache === 'function') {
                        window.YatraSetuManagerStore.invalidateCache('attractions');
                    }
                    if (typeof renderConnectedViews === 'function' && window.YatraSetuManagerStore) {
                        await renderConnectedViews(window.YatraSetuManagerStore.getActiveContext());
                    }

                    if (window.YatraSetuManagerStore && typeof window.YatraSetuManagerStore.invalidateCache === 'function') {
                        window.YatraSetuManagerStore.invalidateCache('events');
                    }
                    if (typeof showManagerToast === 'function') {
                        showManagerToast(`Event "${titleVal}" scheduled successfully!`);
                    } else {
                        alert(`Event "${titleVal}" scheduled successfully!`);
                    }
                } catch (err) {
                    console.error('[initAddEventForm] Failed to schedule event:', err);
                    let errMsg = err.message || 'Failed to schedule event.';
                    if (err.status === 401) {
                        errMsg = 'Your session has expired. Please log in again.';
                    } else if (err.status === 403) {
                        errMsg = 'Permission denied: You cannot create an event outside your jurisdiction.';
                    } else if (err.status === 404) {
                        errMsg = 'Destination not found: The specified parent destination does not exist.';
                    } else if (err.status === 422) {
                        errMsg = `Validation error: ${err.message || 'Please check all required fields.'}`;
                    } else if (err.status === 0) {
                        errMsg = 'Network error: Unable to connect to the backend server.';
                    }
                    if (window.YatraSetuManagerStore && typeof window.YatraSetuManagerStore.invalidateCache === 'function') {
                        window.YatraSetuManagerStore.invalidateCache('events');
                    }
                    if (typeof showManagerToast === 'function') {
                        showManagerToast(errMsg, 'error');
                    }
                    alert(errMsg);
                } finally {
                    saveBtn.disabled = false;
                    saveBtn.textContent = originalBtnText;
                }
            } else {
                // Prototype preview mode ONLY (unauthenticated)
                const newEvent = {
                    id: 'event-' + Date.now(),
                    state_id: activeContext.activeStateId,
                    destination_id: destVal,
                    title: titleVal,
                    dateNum: dateNum,
                    dateMonth: dateMonth,
                    location: locVal || 'Local Venue',
                    loc: locVal || 'Local Venue',
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
            }
        };
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
            const typeSelect = document.getElementById('add-sh-type');
            const destSelect = document.getElementById('add-sh-dest');
            const statusSelect = document.getElementById('add-sh-status');
            const contactInput = document.getElementById('add-sh-contact');
            const addressInput = document.getElementById('add-sh-address');

            const nameVal = nameInput ? nameInput.value.trim() : '';
            const catVal = catSelect ? catSelect.value : 'Guides';
            const typeVal = typeSelect ? typeSelect.value : 'visitor-facing';
            const destVal = destSelect ? destSelect.value : 'all';
            const statusVal = statusSelect ? statusSelect.value : 'Pending Approval';
            const contactVal = contactInput ? contactInput.value.trim() : '+91 98765 00000';
            const addressVal = addressInput ? addressInput.value.trim() : 'Local Destination Hub';

            if (!nameVal) {
                alert('Please enter a stakeholder/partner name.');
                if (nameInput) nameInput.focus();
                return;
            }

            const activeContext = window.YatraSetuManagerStore ? window.YatraSetuManagerStore.getActiveContext() : { activeStateId: 'maharashtra' };
            const profile = window.YatraSetuManagerData?.profile || {};

            const destName = destVal !== 'all'
                ? (window.YatraSetuManagerData?.destinations?.find(d => d.id === destVal)?.name || destVal)
                : 'State-wide';

            const newStakeholder = {
                id: 'sh-' + Date.now(),
                state_id: activeContext.activeStateId,
                destination_id: destVal,
                destination: destName,
                name: nameVal,
                category: catVal,
                type: typeVal,
                contact: contactVal,
                email: 'partner@tourism.org',
                contact_person: 'Registered Partner',
                address: addressVal,
                hours: 'Standard Hours',
                price_range: 'Inquire',
                description: `${catVal} provider registered for ${destName}.`,
                status: statusVal,
                registered_date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
                reviewed_by: statusVal === 'Approved' ? `${profile.name || 'Rajesh Patil'} (Destination Manager)` : '',
                reviewed_date: statusVal === 'Approved' ? new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '',
                manager_note: statusVal === 'Approved' ? 'Direct registration approved by Destination Manager.' : ''
            };

            if (window.YatraSetuManagerData) {
                if (!window.YatraSetuManagerData.stakeholders) window.YatraSetuManagerData.stakeholders = [];
                window.YatraSetuManagerData.stakeholders.push(newStakeholder);
                if (window.YatraSetuManagerStore && typeof window.YatraSetuManagerStore.saveStakeholders === 'function') {
                    window.YatraSetuManagerStore.saveStakeholders(window.YatraSetuManagerData.stakeholders);
                }
            }

            // Reset inputs
            if (nameInput) nameInput.value = '';
            if (contactInput) contactInput.value = '';
            if (addressInput) addressInput.value = '';

            // Close modal
            const modal = document.getElementById('addStakeholderModal');
            if (modal) modal.classList.remove('active');
            document.body.style.overflow = '';

            // Re-render connected view
            if (typeof renderConnectedViews === 'function' && window.YatraSetuManagerStore) {
                await renderConnectedViews(window.YatraSetuManagerStore.getActiveContext());
            }

            alert(`Stakeholder "${nameVal}" registered successfully with status "${statusVal}".`);
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
 * Destination Profiles & Videos Dual Horizontal Tabs (destinations.html)
 */
function initDestinationTabs() {
    const tabBtnProfiles = document.getElementById('tab-btn-dest-profiles');
    const tabBtnVideos = document.getElementById('tab-btn-dest-videos');
    const tabContentProfiles = document.getElementById('tab-content-dest-profiles');
    const tabContentVideos = document.getElementById('tab-content-dest-videos');

    if (!tabBtnProfiles || !tabBtnVideos || !tabContentProfiles || !tabContentVideos) return;

    tabBtnProfiles.addEventListener('click', (e) => {
        e.preventDefault();
        tabBtnProfiles.classList.add('active');
        tabBtnVideos.classList.remove('active');
        tabContentProfiles.style.display = 'block';
        tabContentVideos.style.display = 'none';
    });

    tabBtnVideos.addEventListener('click', (e) => {
        e.preventDefault();
        tabBtnVideos.classList.add('active');
        tabBtnProfiles.classList.remove('active');
        tabContentProfiles.style.display = 'none';
        tabContentVideos.style.display = 'block';
        if (typeof renderDestinationVideos === 'function' && window.YatraSetuManagerStore) {
            renderDestinationVideos(window.YatraSetuManagerStore.getActiveContext());
        }
    });
}

/**
 * FR-15 Destination Video Manager Controller (Form, Filters, Modals)
 */
function initDestinationVideoManager() {
    const openAddBtn = document.getElementById('btn-open-add-video-modal');
    const videoModal = document.getElementById('videoModal');
    const playerModal = document.getElementById('videoPlayerModal');
    const closeVideoBtn = document.getElementById('btn-close-video-modal');
    const cancelVideoBtn = document.getElementById('btn-cancel-video-modal');
    const closePlayerBtn = document.getElementById('btn-close-player-modal');
    const closePlayerAction = document.getElementById('btn-close-player-action');
    const saveVideoBtn = document.getElementById('btn-save-video-entry');

    // Open Add Modal
    if (openAddBtn) {
        openAddBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (openAddBtn.hasAttribute('disabled')) return;
            if (typeof openVideoModal === 'function') openVideoModal();
        });
    }

    // Modal Close triggers
    const closeVideoModal = () => {
        if (videoModal) {
            videoModal.classList.remove('active');
            document.body.style.overflow = '';
        }
    };
    if (closeVideoBtn) closeVideoBtn.addEventListener('click', closeVideoModal);
    if (cancelVideoBtn) cancelVideoBtn.addEventListener('click', closeVideoModal);

    const closePlayer = () => {
        if (playerModal) {
            playerModal.classList.remove('active');
            document.body.style.overflow = '';
            const playerContainer = document.getElementById('player-container');
            if (playerContainer) {
                playerContainer.innerHTML = '';
            }
        }
    };
    if (closePlayerBtn) closePlayerBtn.addEventListener('click', closePlayer);
    if (closePlayerAction) closePlayerAction.addEventListener('click', closePlayer);

    // Save Video with rigorous form validation
    if (saveVideoBtn) {
        saveVideoBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const alertBox = document.getElementById('video-form-alert');
            const formId = document.getElementById('video-form-id').value;
            const formStateId = document.getElementById('video-form-state-id').value;
            const formDestSelect = document.getElementById('video-form-dest');
            const formCatSelect = document.getElementById('video-form-category');
            const formTitleInput = document.getElementById('video-form-title');
            const formDescInput = document.getElementById('video-form-desc');
            const formUrlInput = document.getElementById('video-form-url');
            const formThumbInput = document.getElementById('video-form-thumb');
            const formStatusSelect = document.getElementById('video-form-status');
            const formProtoCheck = document.getElementById('video-form-prototype-check');

            const title = (formTitleInput.value || '').trim();
            const desc = (formDescInput.value || '').trim();
            const videoUrl = (formUrlInput.value || '').trim();
            const thumbUrl = (formThumbInput.value || '').trim();
            const destId = formDestSelect.value;
            const destName = formDestSelect.options[formDestSelect.selectedIndex]?.text || destId;
            const category = formCatSelect.value;
            const status = formStatusSelect.value;
            const isPrototype = formProtoCheck ? formProtoCheck.checked : true;

            const showAlert = (msg, isError = true) => {
                if (!alertBox) {
                    alert(msg);
                    return;
                }
                alertBox.textContent = msg;
                alertBox.style.display = 'block';
                alertBox.style.background = isError ? '#FEE2E2' : '#ECFDF5';
                alertBox.style.color = isError ? '#B91C1C' : '#065F46';
                alertBox.style.border = isError ? '1px solid #FECACA' : '1px solid #A7F3D0';
            };

            // Validation checks
            if (!title || title.length < 3) {
                showAlert('Please enter a valid descriptive title (at least 3 characters).');
                formTitleInput.focus();
                return;
            }
            if (!desc || desc.length < 10) {
                showAlert('Please provide a short orientation description (at least 10 characters).');
                formDescInput.focus();
                return;
            }
            if (!videoUrl) {
                showAlert('Please provide a hosted video URL or supported media reference.');
                formUrlInput.focus();
                return;
            }
            // Basic URL validation
            try {
                new URL(videoUrl);
            } catch (_) {
                showAlert('Please enter a valid HTTP/HTTPS URL for the video stream (e.g. https://www.youtube.com/watch?v=...).');
                formUrlInput.focus();
                return;
            }

            // Publication integrity check: prototype metadata cannot be published
            if (status === 'Published' && (isPrototype || videoUrl.includes('prototype'))) {
                showAlert('Prototype metadata records cannot be published for tourists. Please provide a verified playable media URL and uncheck "Prototype Metadata Record", or select status as "Draft".');
                formStatusSelect.focus();
                return;
            }

            const NEUTRAL_SVG_FALLBACK = "data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20480%20270%22%20width%3D%22480%22%20height%3D%22270%22%3E%3Crect%20width%3D%22480%22%20height%3D%22270%22%20fill%3D%22%231E293B%22%2F%3E%3Cpath%20d%3D%22M210%20105%20L285%20135%20L210%20165%20Z%22%20fill%3D%22%2364748B%22%2F%3E%3Crect%20x%3D%2240%22%20y%3D%22210%22%20width%3D%22400%22%20height%3D%226%22%20rx%3D%223%22%20fill%3D%22%23334155%22%2F%3E%3Ctext%20x%3D%22240%22%20y%3D%22195%22%20fill%3D%22%2394A3B8%22%20font-family%3D%22system-ui%2C%20sans-serif%22%20font-size%3D%2213%22%20font-weight%3D%22600%22%20text-anchor%3D%22middle%22%3E%F0%9F%8E%AC%20Pending%20Verified%20Asset%3C%2Ftext%3E%3C%2Fsvg%3E";

            const videoPayload = {
                state_id: formStateId || 'maharashtra',
                destination_id: destId,
                destination_name: destName,
                category: category,
                title: title,
                description: desc,
                video_url: videoUrl,
                thumbnail_url: thumbUrl || NEUTRAL_SVG_FALLBACK,
                duration: (document.getElementById('video-form-duration')?.value || '0:30').trim(),
                status: isPrototype ? 'Draft' : status,
                is_verified_asset: !isPrototype,
                verification_state: isPrototype ? 'prototype_metadata' : (videoUrl.includes('youtube') || videoUrl.includes('youtu.be') ? 'official_source' : 'verified_media'),
                updated_at: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
            };

            if (formId) {
                // Update
                window.YatraSetuManagerStore.updateDestinationVideo(formId, videoPayload);
                if (typeof showManagerToast === 'function') {
                    showManagerToast(`Video entry "${title}" successfully updated!`);
                }
            } else {
                // Add
                const created = window.YatraSetuManagerStore.addDestinationVideo(videoPayload);
                if (typeof showManagerToast === 'function') {
                    showManagerToast(`New video "${created.title}" added to destination catalogue!`);
                }
            }

            closeVideoModal();
            if (typeof renderDestinationVideos === 'function' && window.YatraSetuManagerStore) {
                await renderDestinationVideos(window.YatraSetuManagerStore.getActiveContext());
            }
        });
    }

    // Video Filtering & Live Search Engine
    const videoSearch = document.getElementById('video-search-input');
    const catFilter = document.getElementById('video-category-filter');
    const statusFilter = document.getElementById('video-status-filter');
    const resetBtn = document.getElementById('btn-reset-video-filters');

    const filterCards = () => {
        const query = (videoSearch?.value || '').toLowerCase().trim();
        const selectedCat = catFilter?.value || 'all';
        const selectedStatus = statusFilter?.value || 'all';

        const cards = document.querySelectorAll('#destination-videos-grid .video-entry-card');
        let visibleCount = 0;

        cards.forEach(card => {
            const cardCat = card.getAttribute('data-category') || '';
            const cardStatus = card.getAttribute('data-status') || '';
            const cardText = card.textContent.toLowerCase();

            const matchesQuery = !query || cardText.includes(query);
            const matchesCat = selectedCat === 'all' || cardCat.toLowerCase().includes(selectedCat.toLowerCase());
            const matchesStatus = selectedStatus === 'all' || cardStatus.toLowerCase() === selectedStatus.toLowerCase();

            if (matchesQuery && matchesCat && matchesStatus) {
                card.style.display = 'flex';
                visibleCount++;
            } else {
                card.style.display = 'none';
            }
        });
    };

    if (videoSearch) videoSearch.addEventListener('input', filterCards);
    if (catFilter) catFilter.addEventListener('change', filterCards);
    if (statusFilter) statusFilter.addEventListener('change', filterCards);

    if (resetBtn) {
        resetBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (videoSearch) videoSearch.value = '';
            if (catFilter) catFilter.value = 'all';
            if (statusFilter) statusFilter.value = 'all';
            filterCards();
        });
    }
}
