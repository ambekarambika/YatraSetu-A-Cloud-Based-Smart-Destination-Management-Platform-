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
    if (typeof initManagerProfilePage === 'function') {
        initManagerProfilePage();
    }
});

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

