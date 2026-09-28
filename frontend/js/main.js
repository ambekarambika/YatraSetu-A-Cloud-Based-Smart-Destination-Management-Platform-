/**
 * YatraSetu — Smart Destination Management Platform
 * Main JavaScript (State-Dynamic Cultural Palette & Realistic UI System)
 */

document.addEventListener('DOMContentLoaded', () => {
    // ----------------------------------------------------------------------
    // 1. Sticky Navbar Listener
    // ----------------------------------------------------------------------
    const navbar = document.getElementById('navbar');
    
    const handleScroll = () => {
        if (navbar) {
            if (window.scrollY > 20) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
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

        document.addEventListener('click', (e) => {
            if (!navbar.contains(e.target) && navMenu.classList.contains('active')) {
                navMenu.classList.remove('active');
                const icon = mobileToggle.querySelector('i');
                if (icon) icon.className = 'fa-solid fa-bars';
            }
        });
    }

    // ----------------------------------------------------------------------
    // 3. Destination Category Filter (Clean Photography Grid)
    // ----------------------------------------------------------------------
    const filterButtons = document.querySelectorAll('.filter-btn');
    const destinationCards = document.querySelectorAll('.clean-card');

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            const filterValue = button.getAttribute('data-filter');

            destinationCards.forEach(card => {
                const category = card.getAttribute('data-category');
                if (filterValue === 'all' || category === filterValue) {
                    card.style.display = 'flex';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });

    // ----------------------------------------------------------------------
    // 4. Destination Preview Modal Dialog
    // ----------------------------------------------------------------------
    const modalOverlay = document.getElementById('modalOverlay');
    const modalTitle = document.getElementById('modalTitle');
    const modalSubtitle = document.getElementById('modalSubtitle');
    const modalBody = document.getElementById('modalBody');
    const modalClose = document.getElementById('modalClose');

    const destinationDetails = {
        rajgad: {
            title: "Sahyadri Forts & Rajgad Citadel",
            subtitle: "Maharashtra • Maratha Empire Heritage",
            body: "Rajgad was the historic capital of the Maratha Empire under Chhatrapati Shivaji Maharaj. YatraSetu integrates fort preservation updates, trekking guidelines, and local stakeholder coordination."
        },
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
        if (!modalOverlay || !modalTitle || !modalSubtitle || !modalBody) return;
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
        if (modalOverlay) modalOverlay.classList.remove('active');
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
    // 5. Hero Quick Search Handler
    // ----------------------------------------------------------------------
    const heroSearchBtn = document.getElementById('heroSearchBtn');
    const heroSearchInput = document.getElementById('heroSearchInput');
    const heroSearchSelect = document.getElementById('heroSearchSelect');
    const heroSearchCategory = document.getElementById('heroSearchCategory');

    if (heroSearchBtn && heroSearchInput) {
        heroSearchBtn.addEventListener('click', () => {
            const query = heroSearchInput.value.trim().toLowerCase();
            const locationCategory = heroSearchSelect ? heroSearchSelect.value : 'all';
            const mainCategory = heroSearchCategory ? heroSearchCategory.value : 'all';

            const destSection = document.getElementById('destinations');
            if (destSection) {
                destSection.scrollIntoView({ behavior: 'smooth' });
            }

            destinationCards.forEach(card => {
                const text = card.textContent.toLowerCase();
                const cardCat = card.getAttribute('data-category');
                const queryMatch = !query || text.includes(query);
                const locMatch = locationCategory === 'all' || cardCat === locationCategory;
                const catMatch = mainCategory === 'all' || cardCat === mainCategory;

                if (queryMatch && locMatch && catMatch) {
                    card.style.display = 'flex';
                    card.style.border = '2px solid var(--state-accent)';
                } else {
                    card.style.display = 'none';
                    card.style.border = '1px solid var(--border-light)';
                }
            });
        });
    }

    // ----------------------------------------------------------------------
    // 6. Hero Cinematic Slider & STATE-DYNAMIC CULTURAL PALETTE SYSTEM
    // ----------------------------------------------------------------------
    const heroSection = document.querySelector('.hero-cinematic');
    const heroTitle = document.querySelector('.hero-main-title');
    const heroDescription = document.querySelector('.hero-description');
    const ctaPrimary = document.querySelector('.cta-primary');
    const slideIndicators = document.querySelectorAll('.slide-indicator-item');
    const thumbnailStrip = document.querySelector('.bottom-thumbnail-strip');
    const workspaceTitle = document.querySelector('.window-title');

    const heroSlides = [
        {
            state: "Maharashtra",
            tagline: "Land of Forts, Festivals & Endless Discoveries",
            desc: "Explore majestic Sahyadri hill citadels, vibrant cultural heritage, ancient cave architecture, and pristine Konkan coastlines in a single connected platform.",
            bg: "assets/images/hero-maharashtra.jpg",
            cta: 'Explore Maharashtra <i class="fa-solid fa-arrow-right"></i>',
            thumbnails: [
                { title: "Rajgad Fort", sub: "Sahyadri Citadel", img: "assets/images/thumb-rajgad.jpg", key: "rajgad" },
                { title: "Mumbai", sub: "Coastal Gateway", img: "assets/images/thumb-mumbai.jpg", key: "mumbai" },
                { title: "Lonavala", sub: "Western Ghats", img: "assets/images/thumb-lonavala.jpg", key: "lonavala" },
                { title: "Ajanta Caves", sub: "UNESCO Heritage", img: "assets/images/thumb-ajanta.jpg", key: "ajanta" },
                { title: "Konkan Coast", sub: "Pristine Beaches", img: "assets/images/thumb-konkan.jpg", key: "konkan" }
            ]
        },
        {
            state: "Kerala",
            tagline: "God's Own Country • Backwaters, Hills & Culture",
            desc: "Discover tranquil emerald backwaters, lush Munnar tea estates, ancient Ayurveda sanctuaries, and pristine coastal ecosystems.",
            bg: "assets/images/hero-kerala.jpg",
            cta: 'Explore Kerala <i class="fa-solid fa-arrow-right"></i>',
            thumbnails: [
                { title: "Munnar", sub: "Tea Estate Hills", img: "assets/images/dest-munnar.jpg", key: "munnar" },
                { title: "Alleppey", sub: "Emerald Backwaters", img: "assets/images/hero-kerala.jpg", key: "alleppey" },
                { title: "Wayanad", sub: "Mist & Wildlife", img: "assets/images/dest-munnar.jpg", key: "wayanad" },
                { title: "Kovalam", sub: "Golden Coastline", img: "assets/images/dest-goa.jpg", key: "kovalam" },
                { title: "Kochi", sub: "Colonial Port", img: "assets/images/dest-varanasi.jpg", key: "kochi" }
            ]
        },
        {
            state: "Kashmir",
            tagline: "Paradise on Earth • Dal Lake & Alpine Valleys",
            desc: "Immerse in tranquil Shikara rides on Dal Lake, snow-laden slopes of Gulmarg, and majestic pine valleys of Pahalgam.",
            bg: "assets/images/dest-manali.jpg",
            cta: 'Explore Kashmir <i class="fa-solid fa-arrow-right"></i>',
            thumbnails: [
                { title: "Srinagar", sub: "Dal Lake Shikaras", img: "assets/images/dest-manali.jpg", key: "srinagar" },
                { title: "Gulmarg", sub: "Alpine Snow Slopes", img: "assets/images/dest-manali.jpg", key: "gulmarg" },
                { title: "Pahalgam", sub: "Lidder Pine Valley", img: "assets/images/dest-manali.jpg", key: "pahalgam" },
                { title: "Sonamarg", sub: "Meadow of Gold", img: "assets/images/dest-manali.jpg", key: "sonamarg" },
                { title: "Shalimar", sub: "Mughal Gardens", img: "assets/images/dest-varanasi.jpg", key: "shalimar" }
            ]
        },
        {
            state: "Rajasthan",
            tagline: "Land of Kings • Royal Palaces & Desert Heritage",
            desc: "Uncover grand forts of Jaipur, golden desert dunes of Jaisalmer, romantic lake palaces of Udaipur, and vibrant folk heritage.",
            bg: "assets/images/dest-jaipur.jpg",
            cta: 'Explore Rajasthan <i class="fa-solid fa-arrow-right"></i>',
            thumbnails: [
                { title: "Jaipur", sub: "Amer Fort Realm", img: "assets/images/dest-jaipur.jpg", key: "jaipur" },
                { title: "Udaipur", sub: "City of Lakes", img: "assets/images/dest-jaipur.jpg", key: "udaipur" },
                { title: "Jaisalmer", sub: "Golden Sand Dunes", img: "assets/images/dest-jaipur.jpg", key: "jaisalmer" },
                { title: "Jodhpur", sub: "Blue Fort Citadel", img: "assets/images/dest-jaipur.jpg", key: "jodhpur" },
                { title: "Pushkar", sub: "Sacred Ghats & Fair", img: "assets/images/dest-varanasi.jpg", key: "pushkar" }
            ]
        },
        {
            state: "Goa",
            tagline: "Pearl of the Orient • Sun, Sand & Coastal Heritage",
            desc: "Immerse in pristine palm-lined coastlines, colonial heritage churches, thrilling water sports, and vibrant seafood festivals.",
            bg: "assets/images/dest-goa.jpg",
            cta: 'Explore Goa <i class="fa-solid fa-arrow-right"></i>',
            thumbnails: [
                { title: "Calangute", sub: "Vibrant Beach Hub", img: "assets/images/dest-goa.jpg", key: "goa" },
                { title: "Panaji", sub: "Fontainhas Quarters", img: "assets/images/dest-goa.jpg", key: "panaji" },
                { title: "Dudhsagar", sub: "Cascade Waterfalls", img: "assets/images/dest-munnar.jpg", key: "dudhsagar" },
                { title: "Old Goa", sub: "Basilica Heritage", img: "assets/images/dest-hampi.jpg", key: "oldgoa" },
                { title: "Palolem", sub: "Tranquil South Coast", img: "assets/images/dest-goa.jpg", key: "palolem" }
            ]
        },
        {
            state: "Tamil Nadu",
            tagline: "Land of Temples • Dravidian Heritage & Nilgiri Hills",
            desc: "Explore towering Gopuram architectural marvels of Madurai, misty tea slopes of Ooty, and historic coastal temples of Mahabalipuram.",
            bg: "assets/images/dest-hampi.jpg",
            cta: 'Explore Tamil Nadu <i class="fa-solid fa-arrow-right"></i>',
            thumbnails: [
                { title: "Madurai", sub: "Meenakshi Gopuram", img: "assets/images/dest-varanasi.jpg", key: "madurai" },
                { title: "Mahabalipuram", sub: "Shore Temples", img: "assets/images/dest-hampi.jpg", key: "mahabalipuram" },
                { title: "Ooty", sub: "Nilgiri Hill Queen", img: "assets/images/dest-munnar.jpg", key: "ooty" },
                { title: "Rameswaram", sub: "Corridor of Pillars", img: "assets/images/dest-hampi.jpg", key: "rameswaram" },
                { title: "Tanjore", sub: "Brihadisvara Temple", img: "assets/images/dest-hampi.jpg", key: "tanjore" }
            ]
        },
        {
            state: "Uttarakhand",
            tagline: "Simply Heaven • Sacred Peaks & River Rafting",
            desc: "Discover holy Ganga Aarti at Rishikesh, high-altitude alpine lakes of Nainital, and majestic Himalayan trekking wilderness.",
            bg: "assets/images/dest-manali.jpg",
            cta: 'Explore Uttarakhand <i class="fa-solid fa-arrow-right"></i>',
            thumbnails: [
                { title: "Rishikesh", sub: "Ganga Yoga Realm", img: "assets/images/dest-varanasi.jpg", key: "rishikesh" },
                { title: "Nainital", sub: "Naini Emerald Lake", img: "assets/images/dest-manali.jpg", key: "nainital" },
                { title: "Kedarnath", sub: "Himalayan Shrine", img: "assets/images/dest-manali.jpg", key: "kedarnath" },
                { title: "Mussoorie", sub: "Queen of Hills", img: "assets/images/dest-manali.jpg", key: "mussoorie" },
                { title: "Auli", sub: "Alpine Ski Resort", img: "assets/images/dest-manali.jpg", key: "auli" }
            ]
        },
        {
            state: "Assam",
            tagline: "Land of Red River & Blue Hills • Kaziranga & Brahmaputra",
            desc: "Experience one-horned rhino sanctuaries at Kaziranga, sprawling Brahmaputra tea gardens, and rich Ahom kingdom monuments.",
            bg: "assets/images/dest-munnar.jpg",
            cta: 'Explore Assam <i class="fa-solid fa-arrow-right"></i>',
            thumbnails: [
                { title: "Kaziranga", sub: "Rhino Sanctuary", img: "assets/images/dest-munnar.jpg", key: "kaziranga" },
                { title: "Majuli", sub: "River Island Culture", img: "assets/images/hero-kerala.jpg", key: "majuli" },
                { title: "Guwahati", sub: "Kamakhya Temple", img: "assets/images/dest-varanasi.jpg", key: "guwahati" },
                { title: "Jorhat", sub: "Brahmaputra Tea Hub", img: "assets/images/dest-munnar.jpg", key: "jorhat" },
                { title: "Sivasagar", sub: "Ahom Monuments", img: "assets/images/dest-hampi.jpg", key: "sivasagar" }
            ]
        }
    ];

    let currentSlideIndex = 0;
    let slideTimer = null;

    const renderThumbnails = (thumbnails) => {
        if (!thumbnailStrip) return;
        thumbnailStrip.innerHTML = thumbnails.map((t, idx) => `
            <div class="thumbnail-item ${idx === 0 ? 'active' : ''}" data-dest="${t.key}">
                <img src="${t.img}" alt="${t.title}" class="thumb-img">
                <div class="thumb-info">
                    <span class="thumb-title">${t.title}</span>
                    <span class="thumb-sub">${t.sub}</span>
                </div>
            </div>
        `).join('');

        document.querySelectorAll('.thumbnail-item').forEach(item => {
            item.addEventListener('click', () => {
                document.querySelectorAll('.thumbnail-item').forEach(t => t.classList.remove('active'));
                item.classList.add('active');

                const destKey = item.getAttribute('data-dest');
                const previewBtn = document.querySelector(`.dest-preview-btn[data-dest="${destKey}"]`);
                if (previewBtn) {
                    previewBtn.click();
                } else {
                    const destSection = document.getElementById('destinations');
                    if (destSection) destSection.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });
    };

    const goToSlide = (index) => {
        currentSlideIndex = index % heroSlides.length;
        const slide = heroSlides[currentSlideIndex];
        const stateNameLower = slide.state.toLowerCase();

        // 1. DYNAMIC CULTURAL PALETTE SWITCH
        document.body.setAttribute('data-theme', stateNameLower);

        // 2. HERO CONTENT UPDATES
        if (heroSection) {
            heroSection.style.backgroundImage = `url('${slide.bg}')`;
        }

        if (heroTitle) {
            heroTitle.innerHTML = `${slide.state} <span class="hero-subheading">${slide.tagline}</span>`;
        }

        if (heroDescription) {
            heroDescription.textContent = slide.desc;
        }

        if (ctaPrimary) {
            ctaPrimary.innerHTML = slide.cta;
        }

        if (workspaceTitle) {
            workspaceTitle.textContent = `${slide.state.toUpperCase()} WORKSPACE`;
        }

        renderThumbnails(slide.thumbnails);

        slideIndicators.forEach((ind, i) => {
            if (i === currentSlideIndex) {
                ind.classList.add('active');
            } else {
                ind.classList.remove('active');
            }
        });

        const pills = document.querySelectorAll('.dest-pill');
        pills.forEach(p => {
            if (p.getAttribute('data-tag').toLowerCase() === stateNameLower) {
                p.classList.add('active');
            } else {
                p.classList.remove('active');
            }
        });
    };

    const startAutoSlide = () => {
        if (slideTimer) clearInterval(slideTimer);
        slideTimer = setInterval(() => {
            goToSlide(currentSlideIndex + 1);
        }, 20000);
    };

    slideIndicators.forEach((ind, idx) => {
        ind.addEventListener('click', () => {
            goToSlide(idx);
            startAutoSlide();
        });
    });

    const destPillsList = document.querySelectorAll('.dest-pill');
    destPillsList.forEach(pill => {
        pill.addEventListener('click', () => {
            const tagValue = pill.getAttribute('data-tag');
            const stateIndex = heroSlides.findIndex(s => s.state.toLowerCase() === tagValue.toLowerCase());
            if (stateIndex !== -1) {
                goToSlide(stateIndex);
                startAutoSlide();
            }
        });
    });

    if (heroSection) {
        goToSlide(0);
        startAutoSlide();
    }

    console.log("YatraSetu State-Dynamic Cultural Palette System Initialized Successfully.");
});
