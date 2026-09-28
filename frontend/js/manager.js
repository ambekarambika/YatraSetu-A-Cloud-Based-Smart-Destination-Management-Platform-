/**
 * YatraSetu — Destination Manager Workspace JavaScript
 * Handles state-dynamic theme switching (Maharashtra, Rajasthan, Kerala),
 * table search/filter controls, modal popups, and report generation.
 */

document.addEventListener('DOMContentLoaded', () => {
    initDestinationStateContext();
    initManagerModals();
    initTableSearchAndFilters();
    initReportGenerator();
});

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
    const stateBtn = document.getElementById('topbar-state-btn');
    const stateSelect = document.getElementById('destination-context-select');

    if (stateBtn) {
        stateBtn.addEventListener('click', () => {
            cycleStateTheme();
        });
    }

    if (stateSelect) {
        stateSelect.addEventListener('change', (e) => {
            applyStateTheme(e.target.value);
        });
    }

    // Load initial state theme from session if saved
    const savedState = sessionStorage.getItem('yatrasetu_state_theme') || 'maharashtra';
    applyStateTheme(savedState);
}

function cycleStateTheme() {
    currentStateIdx = (currentStateIdx + 1) % currentStateList.length;
    applyStateTheme(currentStateList[currentStateIdx]);
}

function applyStateTheme(stateKey) {
    const config = STATE_CONFIGS[stateKey] || STATE_CONFIGS['maharashtra'];
    sessionStorage.setItem('yatrasetu_state_theme', stateKey);

    // Apply data-theme to body
    document.body.setAttribute('data-theme', config.theme);

    // Update Topbar State Button Text if present
    const stateBtnLabel = document.getElementById('topbar-state-label');
    if (stateBtnLabel) {
        stateBtnLabel.textContent = config.badge.charAt(0) + config.badge.slice(1).toLowerCase();
    }

    // Update Topbar Select Dropdown if present
    const stateSelect = document.getElementById('destination-context-select');
    if (stateSelect) {
        stateSelect.value = stateKey;
    }

    // Update Sidebar Context Label
    const sidebarRoleState = document.getElementById('sidebar-role-state');
    if (sidebarRoleState) sidebarRoleState.textContent = config.badge;

    // Update Hero Image Background
    const heroBg = document.querySelector('.destination-hero-bg');
    if (heroBg && config.heroImg) {
        heroBg.style.backgroundImage = `url('${config.heroImg}')`;
    }

    // Update Hero Card Elements
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

    // Update Top Destinations Ranking List
    const topDestList = document.getElementById('top-destinations-list');
    if (topDestList && config.topDestinations) {
        topDestList.innerHTML = config.topDestinations.map(item => `
            <div class="ranking-item">
                <div class="ranking-num">${item.num}</div>
                <span>${item.name}</span>
            </div>
        `).join('');
    }

    // Update Explore Banner Title
    const exploreBannerText = document.getElementById('explore-banner-text');
    if (exploreBannerText) exploreBannerText.textContent = config.exploreText;

    // Update Upcoming Events Cards List
    const eventsList = document.getElementById('upcoming-events-list');
    if (eventsList && config.events) {
        eventsList.innerHTML = config.events.map(ev => `
            <div class="event-card-item">
                <img src="${ev.img}" class="event-thumb-img" alt="${ev.title}">
                <div class="event-date-badge">
                    <span class="event-date-num">${ev.dateNum}</span>
                    <span class="event-date-month">${ev.dateMonth}</span>
                </div>
                <div class="event-info-body">
                    <div class="event-item-title">${ev.title}</div>
                    <div class="event-item-location">${ev.loc}</div>
                </div>
                <span class="status-pill ${ev.statusClass}">${ev.status}</span>
            </div>
        `).join('');
    }
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
