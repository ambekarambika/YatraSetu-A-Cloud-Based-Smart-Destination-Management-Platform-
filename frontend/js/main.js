/**
 * YatraSetu — Smart Destination Management Platform
 * Main JavaScript (Sprint 1 — Vanilla JS)
 */

document.addEventListener('DOMContentLoaded', () => {
    // ----------------------------------------------------------------------
    // 1. Sticky Navbar Listener
    // ----------------------------------------------------------------------
    const navbar = document.getElementById('navbar');
    
    const handleScroll = () => {
        if (window.scrollY > 20) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    };
    
    window.addEventListener('scroll', handleScroll);

    // ----------------------------------------------------------------------
    // 2. Mobile Menu Toggle
    // ----------------------------------------------------------------------
    const mobileToggle = document.getElementById('mobileToggle');
    const navMenu = document.getElementById('navMenu');

    if (mobileToggle && navMenu) {
        mobileToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            const icon = mobileToggle.querySelector('i');
            if (icon) {
                if (navMenu.classList.contains('active')) {
                    icon.className = 'fa-solid fa-xmark';
                } else {
                    icon.className = 'fa-solid fa-bars';
                }
            }
        });

        // Close menu when clicking outside or clicking a nav link
        document.addEventListener('click', (e) => {
            if (!navbar.contains(e.target) && navMenu.classList.contains('active')) {
                navMenu.classList.remove('active');
                const icon = mobileToggle.querySelector('i');
                if (icon) icon.className = 'fa-solid fa-bars';
            }
        });
    }

    // ----------------------------------------------------------------------
    // 3. Destination Category Filter
    // ----------------------------------------------------------------------
    const filterButtons = document.querySelectorAll('.filter-btn');
    const destinationCards = document.querySelectorAll('.dest-card');

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            button.classList.add('active');

            const filterValue = button.getAttribute('data-filter');

            destinationCards.forEach(card => {
                const category = card.getAttribute('data-category');
                if (filterValue === 'all' || category === filterValue) {
                    card.style.display = 'block';
                    card.style.animation = 'fadeIn 0.4s ease';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });

    // ----------------------------------------------------------------------
    // 4. "How It Works" Role Tab Switcher
    // ----------------------------------------------------------------------
    const roleTabButtons = document.querySelectorAll('.role-tab-btn');
    const stepsContainer = document.getElementById('stepsContainer');

    const roleStepsData = {
        tourist: [
            {
                step: "01",
                title: "Explore & Search",
                desc: "Discover verified heritage, cultural, and nature destinations with real-time attraction information and event schedules."
            },
            {
                step: "02",
                title: "Plan Your Itinerary",
                desc: "Select attractions, upcoming tourism events, and local services to build a personalized, interactive trip plan."
            },
            {
                step: "03",
                title: "Experience & Review",
                desc: "Visit destinations with confidence and submit authentic feedback to help improve tourism management."
            }
        ],
        manager: [
            {
                step: "01",
                title: "Onboard Destination",
                desc: "Add comprehensive destination profiles, geo-location, guidelines, and manage public accessibility features."
            },
            {
                step: "02",
                title: "Manage Attractions & Events",
                desc: "Publish points of interest, coordinate festival schedules, and push announcements directly to tourists."
            },
            {
                step: "03",
                title: "Analyze & Support Decisions",
                desc: "Review real-time visitor trends, tourist ratings, and generate management reports for sustainable tourism."
            }
        ],
        stakeholder: [
            {
                step: "01",
                title: "Register & Verify Entity",
                desc: "Create a verified stakeholder profile representing local hospitality, transport, or guide services."
            },
            {
                step: "02",
                title: "Share Facility Updates",
                desc: "Keep local operating hours, safety guidelines, and service availability synchronized across the platform."
            },
            {
                step: "03",
                title: "Coordinate with Managers",
                desc: "Communicate directly with destination authorities to support crowd management and emergency readiness."
            }
        ]
    };

    const renderSteps = (roleKey) => {
        const steps = roleStepsData[roleKey] || roleStepsData.tourist;
        stepsContainer.innerHTML = steps.map(s => `
            <div class="step-card">
                <div class="step-number">${s.step}</div>
                <h3>${s.title}</h3>
                <p>${s.desc}</p>
            </div>
        `).join('');
    };

    roleTabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            roleTabButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const role = btn.getAttribute('data-role');
            renderSteps(role);
        });
    });

    // ----------------------------------------------------------------------
    // 5. Destination Preview Modal Dialog
    // ----------------------------------------------------------------------
    const modalOverlay = document.getElementById('modalOverlay');
    const modalTitle = document.getElementById('modalTitle');
    const modalSubtitle = document.getElementById('modalSubtitle');
    const modalBody = document.getElementById('modalBody');
    const modalClose = document.getElementById('modalClose');

    const destinationDetails = {
        varanasi: {
            title: "Varanasi Heritage Hub",
            subtitle: "Uttar Pradesh • Spiritual & Cultural Realm",
            body: "Varanasi is one of the world's oldest continually inhabited cities. YatraSetu connects tourists with live Ghat event schedules, guided heritage walks, evening Ganga Aarti alerts, and local stakeholder coordination."
        },
        manali: {
            title: "Manali Alpine Sanctuary",
            subtitle: "Himachal Pradesh • Adventure & Mountain Retreat",
            body: "Nestled in the Himalayas, Manali offers adventure sports, Solang Valley excursions, and serene old-town charm. Destination managers track seasonal visitor spikes and manage eco-tourism guidelines."
        },
        goa: {
            title: "Goa Coastal Ecosystem",
            subtitle: "Goa • Sun, Sand & Portuguese Heritage",
            body: "Explore pristine beaches, historic churches, and vibrant coastal festivals. Tourism stakeholders sync local water sports timings, safety flags, and beach cleanup initiatives."
        },
        hampi: {
            title: "Hampi UNESCO Realm",
            subtitle: "Karnataka • Vijayanagara Empire Ruins",
            body: "A surreal landscape of boulder-strewn hills and ancient stone temples. YatraSetu provides monument access schedules, local guide verification, and conservation feedback."
        },
        munnar: {
            title: "Munnar Tea Estates",
            subtitle: "Kerala • Western Ghats Flora & Fauna",
            body: "Famous for rolling tea plantations, mist-covered hills, and rare Neelakurinji blooms. Destination managers publish eco-trail maps and visitor density updates."
        },
        jaipur: {
            title: "Jaipur Pink City Realm",
            subtitle: "Rajasthan • Royal Forts & Architecture",
            body: "Home to Amer Fort, Hawa Mahal, and bustling bazaars. The platform connects city heritage managers, handicraft stakeholders, and tourists for seamless exploration."
        }
    };

    const openModal = (destKey) => {
        const data = destinationDetails[destKey] || {
            title: "Destination Information",
            subtitle: "YatraSetu Smart Destination",
            body: "Comprehensive destination details, attractions, and real-time tourism info available via YatraSetu platform."
        };

        modalTitle.textContent = data.title;
        modalSubtitle.textContent = data.subtitle;
        modalBody.textContent = data.body;
        modalOverlay.classList.add('active');
    };

    const closeModal = () => {
        modalOverlay.classList.remove('active');
    };

    if (modalClose) {
        modalClose.addEventListener('click', closeModal);
    }

    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) closeModal();
        });
    }

    document.querySelectorAll('.dest-preview-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const key = btn.getAttribute('data-dest');
            openModal(key);
        });
    });

    // ----------------------------------------------------------------------
    // 6. Hero Quick Search Handler
    // ----------------------------------------------------------------------
    const heroSearchBtn = document.getElementById('heroSearchBtn');
    const heroSearchInput = document.getElementById('heroSearchInput');
    const heroSearchSelect = document.getElementById('heroSearchSelect');

    if (heroSearchBtn && heroSearchInput) {
        heroSearchBtn.addEventListener('click', () => {
            const query = heroSearchInput.value.trim().toLowerCase();
            const category = heroSearchSelect.value;

            // Scroll down to destination section & highlight match
            const destSection = document.getElementById('destinations');
            if (destSection) {
                destSection.scrollIntoView({ behavior: 'smooth' });
            }

            if (query) {
                destinationCards.forEach(card => {
                    const text = card.textContent.toLowerCase();
                    const categoryMatch = category === 'all' || card.getAttribute('data-category') === category;
                    if (text.includes(query) && categoryMatch) {
                        card.style.display = 'block';
                        card.style.border = '2px solid var(--accent-teal)';
                    } else {
                        card.style.display = 'none';
                        card.style.border = '1px solid var(--border-color)';
                    }
                });
            }
        });
    }

    // ----------------------------------------------------------------------
    // 7. Hero Popular Trending Tags Click Handler
    // ----------------------------------------------------------------------
    const trendingTags = document.querySelectorAll('.trending-tag');
    trendingTags.forEach(tag => {
        tag.addEventListener('click', () => {
            const tagValue = tag.getAttribute('data-tag');
            if (heroSearchInput) {
                heroSearchInput.value = tagValue;
                if (heroSearchBtn) heroSearchBtn.click();
            }
        });
    });

    console.log("YatraSetu Landing Page Script Initialized Successfully.");
});

