/* ==========================================================================
   YatraSetu — Smart Destination Management Platform
   Tourist Workspace Travel Companion Controller (tourist.js)
   Integrates single source of truth (window.YatraSetuManagerData),
   multi-dimensional search & filtering, wishlist, role session handling,
   and responsive destination discovery.
   ========================================================================== */

(function () {
    'use strict';

    // LocalStorage key for tourist wishlist/favorites
    const FAVORITES_STORAGE_KEY = 'yatrasetu_tourist_favorites';

    /**
     * Category grouping mapping: maps user-friendly mockup categories
     * to underlying destination categories in window.YatraSetuManagerData.
     */
    const CATEGORY_GROUPS = {
        'forts-heritage': {
            label: 'Forts & Heritage',
            matches: ['heritage fort', 'royal fort', 'fort', 'unesco cave', 'unesco heritage', 'palace', 'heritage port', 'temple', 'chola temple']
        },
        'beaches-islands': {
            label: 'Beaches & Islands',
            matches: ['beach', 'coastal cliff', 'coastal fort', 'coastal point', 'river island', 'backwaters']
        },
        'nature-wildlife': {
            label: 'Nature & Wildlife',
            matches: ['wildlife', 'unesco wildlife', 'national park', 'tiger reserve', 'valley', 'glacier', 'waterfall', 'tea tourism']
        },
        'spiritual-pilgrimage': {
            label: 'Spiritual & Pilgrimage',
            matches: ['pilgrimage', 'temple', 'chola temple', 'sacred lake', 'sacred river']
        },
        'cultural-historical': {
            label: 'Cultural & Historical',
            matches: ['unesco cave', 'unesco heritage', 'palace', 'heritage fort', 'heritage port', 'temple']
        },
        'adventure-outdoor': {
            label: 'Adventure & Outdoor',
            matches: ['ski resort', 'alpine lake', 'lake town', 'hill station', 'desert', 'waterfall', 'trekking']
        }
    };

    /**
     * Curated Editorial Metadata for Destinations
     * Enriches destinations with authentic highlights, suitability, and descriptions
     * while preserving sample data distinction.
     */
    const DESTINATION_EDITORIAL = {
        'raigad-fort': {
            subtitle: 'Historic capital of the Maratha Empire under Chhatrapati Shivaji Maharaj',
            location: 'Pune / Raigad, Maharashtra',
            description: 'Perched at 2,700 feet above sea level in the Sahyadri mountains, Rajgad Fort served as the capital of the Maratha Empire for over 26 years. Known for its strategic architecture, Padmavati Machi, and panoramic mountain ridges, it offers some of India\'s finest heritage trekking trails.',
            highlights: [
                'Historic Maratha citadel with rich royal architecture',
                'Scenic trekking trails with Padmavati and Suvela Machi viewpoints',
                'Panoramic 360° views across Western Ghats mountain ridges',
                'Ideal for weekend heritage treks and history photography'
            ],
            tags: ['Heritage', 'Trekking', 'Fort', 'Historical'],
            suitable_for: ['Adventure Seekers', 'Solo Travel', 'Group Travel'],
            season: ['Winter (Nov - Feb)', 'Monsoon (Jul - Oct)'],
            best_time: 'October to March (for pleasant treks) and July to September (for monsoon lush greenery)'
        },
        'lonavala': {
            subtitle: 'Misty Western Ghats hill station celebrated for waterfalls and fort lookouts',
            location: 'Pune District, Maharashtra',
            description: 'A popular hill station in the Sahyadris, Lonavala is surrounded by green valleys, cascading seasonal waterfalls, Buddhist rock-cut caves at Karla and Bhaja, and vantage points like Tiger\'s Leap.',
            highlights: [
                'Spectacular valley viewpoints including Tiger\'s Leap',
                'Historic rock-cut Karla & Bhaja Caves nearby',
                'Lush monsoon waterfalls and trekking routes',
                'Family-friendly retreat with famous regional chikki and local delicacies'
            ],
            tags: ['Nature', 'Hill Station', 'Waterfalls', 'Adventure'],
            suitable_for: ['Family', 'Solo Travel', 'Group Travel', 'Adventure Seekers'],
            season: ['Monsoon (Jul - Oct)', 'Winter (Nov - Feb)'],
            best_time: 'July to February'
        },
        'ajanta-caves': {
            subtitle: 'UNESCO World Heritage rock-cut Buddhist monument caves with ancient murals',
            location: 'Chhatrapati Sambhajinagar, Maharashtra',
            description: 'Masterpieces of Buddhist religious art dating from the 2nd century BCE to about 480 CE. The 30 rock-cut cave monuments feature ancient paintings and expressive stone sculptures.',
            highlights: [
                'World-renowned UNESCO Buddhist rock-cut cave architecture',
                'Ancient Fresco paintings and intricate stone sculptures',
                'Deep river gorge setting overlooking the Waghur River',
                'Essential cultural trail for art, architecture, and heritage travelers'
            ],
            tags: ['UNESCO Heritage', 'Cave Art', 'Cultural', 'History'],
            suitable_for: ['Family', 'Solo Travel', 'Group Travel'],
            season: ['Winter (Nov - Feb)'],
            best_time: 'November to March'
        },
        'ellora-caves': {
            subtitle: 'Monumental rock-cut temples celebrating Buddhist, Hindu, and Jain traditions',
            location: 'Chhatrapati Sambhajinagar, Maharashtra',
            description: 'Famous for the Kailash Temple (Cave 16), the largest monolithic rock excavation in the world, carved from a single basalt rock face.',
            highlights: [
                'Kailash Temple: World\'s largest monolithic rock excavation',
                '34 rock-hewn temples spanning three major Indian religions',
                'Unmatched ancient stone masonry and sculpture engineering',
                'Monumental UNESCO World Heritage experience'
            ],
            tags: ['UNESCO Heritage', 'Architecture', 'Temple', 'Monolithic'],
            suitable_for: ['Family', 'Solo Travel', 'Group Travel'],
            season: ['Winter (Nov - Feb)'],
            best_time: 'October to March'
        },
        'shirdi': {
            subtitle: 'World-renowned sacred pilgrimage town honoring Sai Baba',
            location: 'Ahmednagar District, Maharashtra',
            description: 'One of the most visited pilgrimage centers in India, Shirdi draws millions of devotees to the holy Samadhi Mandir of Sai Baba.',
            highlights: [
                'Sacred Sai Baba Samadhi Mandir and Dwarkamai complex',
                'Peaceful spiritual ambiance and daily prayer ceremonies',
                'Well-developed visitor reception and pilgrimage facilities',
                'Accessible family pilgrimage destination'
            ],
            tags: ['Spiritual & Pilgrimage', 'Temple', 'Devotion'],
            suitable_for: ['Family', 'Group Travel', 'Solo Travel'],
            season: ['Winter (Nov - Feb)', 'Summer (Mar - Jun)'],
            best_time: 'October to March'
        },
        'munnar-hills': {
            subtitle: 'Rolling tea plantations, mist-draped peaks, and rare Western Ghats flora',
            location: 'Idukki District, Kerala',
            description: 'Situated at 1,600 meters in the Western Ghats, Munnar was once the summer resort of the British Raj. It is renowned for emerald-green tea estates, cool mountain air, and Eravikulam National Park.',
            highlights: [
                'Vast rolling tea estates and historic tea museum',
                'Home of the endangered Nilgiri Tahr at Eravikulam',
                'Trekking to Anamudi, the highest peak in South India',
                'Crisp mountain climate and serene nature walks'
            ],
            tags: ['Nature & Wildlife', 'Hill Station', 'Tea Tourism', 'Western Ghats'],
            suitable_for: ['Family', 'Solo Travel', 'Group Travel', 'Adventure Seekers'],
            season: ['Winter (Nov - Feb)', 'Summer (Mar - Jun)'],
            best_time: 'September to March'
        },
        'alleppey-backwaters': {
            subtitle: 'Serene palm-fringed waterways, traditional kettuvallam houseboats, and lagoons',
            location: 'Alappuzha, Kerala',
            description: 'Known as the Venice of the East, Alappuzha is famous for its intricate network of tranquil canals, paddy fields, lagoons, and overnight houseboat journeys.',
            highlights: [
                'Overnight luxury and traditional kettuvallam houseboat cruises',
                'Scenic labyrinth of canals, Vembanad Lake, and rural life',
                'Authentic Kerala coastal and seafood cuisine',
                'World-famous Nehru Trophy Snake Boat Race venue'
            ],
            tags: ['Beaches & Islands', 'Backwaters', 'Lagoon', 'Wellness'],
            suitable_for: ['Family', 'Solo Travel', 'Group Travel'],
            season: ['Winter (Nov - Feb)', 'Monsoon (Jul - Oct)'],
            best_time: 'October to February'
        },
        'amber-fort': {
            subtitle: 'Opulent red sandstone and marble fortress overlooking Maota Lake',
            location: 'Jaipur, Rajasthan',
            description: 'Constructed by Raja Man Singh I, Amer Fort is a grand hilltop stronghold showcasing a fusion of Rajput and Mughal architecture, Sheesh Mahal (Mirror Palace), and courtyards.',
            highlights: [
                'Sheesh Mahal: Breathtaking hall of thousand mirrors',
                'Magnificent Rajput-Mughal fortress overlooking Maota Lake',
                'Evening light & sound show depicting royal history',
                'Gateway to Jaipur\'s Royal Pink City heritage'
            ],
            tags: ['Forts & Heritage', 'Royal Fort', 'Palace', 'Architecture'],
            suitable_for: ['Family', 'Solo Travel', 'Group Travel'],
            season: ['Winter (Nov - Feb)'],
            best_time: 'October to March'
        },
        'old-goa-churches': {
            subtitle: 'Centuries-old Portuguese colonial architecture and historic cathedrals',
            location: 'Velha Goa, Goa',
            description: 'UNESCO World Heritage site preserving monuments from the 16th and 17th centuries, including the Basilica of Bom Jesus and Se Cathedral.',
            highlights: [
                'Basilica of Bom Jesus housing the sacred relics of St. Francis Xavier',
                'Se Cathedral: One of the largest churches in Asia',
                'Magnificent Manueline and Baroque colonial architecture',
                'Historic museums and tranquil riverside setting'
            ],
            tags: ['Forts & Heritage', 'UNESCO Heritage', 'Architecture', 'Colonial'],
            suitable_for: ['Family', 'Solo Travel', 'Group Travel'],
            season: ['Winter (Nov - Feb)'],
            best_time: 'November to February'
        },
        'calangute-coast': {
            subtitle: 'Vibrant golden shoreline known as the Queen of Goa Beaches',
            location: 'North Goa, Goa',
            description: 'Calangute is one of Goa\'s most famous coastal stretches, offering water sports, beach shacks, lively coastal culture, and golden sunsets.',
            highlights: [
                'Expansive golden sand beach with calm waters',
                'Water sports including parasailing, jet skiing, and boat rides',
                'Beachside dining, fresh seafood, and Goan music',
                'Vibrant coastal markets and beach leisure'
            ],
            tags: ['Beaches & Islands', 'Beach', 'Coastal', 'Water Sports'],
            suitable_for: ['Group Travel', 'Solo Travel', 'Adventure Seekers', 'Family'],
            season: ['Winter (Nov - Feb)'],
            best_time: 'October to March'
        },
        'meenakshi-amman-temple': {
            subtitle: 'Towering sculpted gopurams and millennia of Dravidian architectural mastery',
            location: 'Madurai, Tamil Nadu',
            description: 'A historic Hindu temple on the southern bank of the Vaigai River, dedicated to Goddess Meenakshi. It features 14 towering gopurams adorned with thousands of colorful mythological sculptures.',
            highlights: [
                '14 magnificent multi-tiered painted gopurams',
                'Aayiram Kaal Mandapam: Thousand Pillar Hall of stone art',
                'Sacred Golden Lotus Tank and ancient temple rituals',
                'Living center of Tamil cultural and spiritual heritage'
            ],
            tags: ['Spiritual & Pilgrimage', 'Temple', 'Dravidian', 'Architecture'],
            suitable_for: ['Family', 'Solo Travel', 'Group Travel'],
            season: ['Winter (Nov - Feb)'],
            best_time: 'October to March'
        },
        'rishikesh-ganga-ghats': {
            subtitle: 'Yoga capital of the world nestled where the holy Ganges emerges from the Himalayas',
            location: 'Rishikesh, Uttarakhand',
            description: 'Renowned worldwide for yoga, meditation, river rafting, and the sacred evening Ganga Aarti at Triveni Ghat and Parmarth Niketan.',
            highlights: [
                'Mesmerizing evening Ganga Aarti ceremony at Triveni Ghat',
                'Iconic suspension bridges: Lakshman Jhula and Ram Jhula',
                'White-water river rafting on the Himalayan Ganges',
                'World center for authentic yoga, meditation, and ashram stays'
            ],
            tags: ['Spiritual & Pilgrimage', 'Adventure & Outdoor', 'Sacred River', 'Yoga'],
            suitable_for: ['Solo Travel', 'Adventure Seekers', 'Group Travel', 'Family'],
            season: ['Winter (Nov - Feb)', 'Summer (Mar - Jun)'],
            best_time: 'September to November and March to May'
        },
        'kaziranga-national-park': {
            subtitle: 'UNESCO World Heritage sanctuary harboring the world\'s largest one-horned rhino population',
            location: 'Golaghat & Nagaon, Assam',
            description: 'Located in the floodplains of the Brahmaputra River, Kaziranga is home to two-thirds of the world\'s great one-horned rhinoceroses, wild water buffalo, elephants, and tigers.',
            highlights: [
                'High density of great Indian one-horned rhinoceroses',
                'Guided morning elephant and jeep safaris across tall elephant grass',
                'Breathtaking biodiversity across Brahmaputra wetland plains',
                'Protected UNESCO World Heritage wildlife haven'
            ],
            tags: ['Nature & Wildlife', 'UNESCO Wildlife', 'Safari', 'Rhino'],
            suitable_for: ['Family', 'Adventure Seekers', 'Group Travel', 'Solo Travel'],
            season: ['Winter (Nov - Feb)'],
            best_time: 'November to April'
        },
        'dal-lake-srinagar': {
            subtitle: 'Jewel in the crown of Kashmir featuring iconic wooden shikaras and houseboats',
            location: 'Srinagar, Jammu & Kashmir',
            description: 'Encircled by the snow-capped Pir Panjal mountains and Mughal gardens, Dal Lake is famous for its hand-carved cedar houseboats, floating vegetable markets, and serene shikara rides.',
            highlights: [
                'Traditional hand-carved cedar wooden houseboats',
                'Peaceful sunrise and sunset shikara boat cruises',
                'Unique morning floating vegetable market on the waterways',
                'Surrounded by historic Mughal gardens: Nishat and Shalimar'
            ],
            tags: ['Adventure & Outdoor', 'Alpine Lake', 'Houseboats', 'Nature'],
            suitable_for: ['Family', 'Solo Travel', 'Group Travel'],
            season: ['Summer (Mar - Jun)', 'Winter (Nov - Feb)'],
            best_time: 'April to October'
        }
    };

    /**
     * Authoritative Geographic Coordinates Dictionary
     * Validated against India national bounding box:
     * Lat: [6.0° N to 38.0° N], Lng: [68.0° E to 98.0° E]
     * Exactly 40 destinations (5 per state across 8 states)
     */
    const DESTINATION_COORDINATES = {
        // Maharashtra
        'raigad-fort': { lat: 18.2458, lng: 73.6822 },
        'ajanta-caves': { lat: 20.5519, lng: 75.7033 },
        'ellora-caves': { lat: 20.0268, lng: 75.1780 },
        'lonavala': { lat: 18.7546, lng: 73.4062 },
        'shirdi': { lat: 19.7667, lng: 74.4762 },

        // Kerala
        'munnar-hills': { lat: 10.0889, lng: 77.0595 },
        'alleppey-backwaters': { lat: 9.4981, lng: 76.3388 },
        'wayanad-wildlife': { lat: 11.6854, lng: 76.1320 },
        'fort-kochi': { lat: 9.9658, lng: 76.2421 },
        'varkala-cliff': { lat: 8.7379, lng: 76.7163 },

        // Jammu & Kashmir
        'dal-lake-srinagar': { lat: 34.1130, lng: 74.8698 },
        'gulmarg-snow-slopes': { lat: 34.0484, lng: 74.3805 },
        'pahalgam-valley': { lat: 34.0161, lng: 75.1950 },
        'sonamarg-glaciers': { lat: 34.3100, lng: 75.2938 },
        'shankaracharya-temple': { lat: 34.0722, lng: 74.8458 },

        // Rajasthan
        'amber-fort': { lat: 26.9855, lng: 75.8513 },
        'jaisalmer-desert': { lat: 26.9157, lng: 70.9083 },
        'udaipur-city-palace': { lat: 24.5764, lng: 73.6835 },
        'mehrangarh-fort': { lat: 26.2978, lng: 73.0185 },
        'pushkar-lake': { lat: 26.4883, lng: 74.5539 },

        // Goa
        'old-goa-churches': { lat: 15.5009, lng: 73.9116 },
        'calangute-coast': { lat: 15.5439, lng: 73.7553 },
        'dudhsagar-falls': { lat: 15.3144, lng: 74.3143 },
        'fort-aguada': { lat: 15.4925, lng: 73.7736 },
        'palolem-beach': { lat: 15.0100, lng: 74.0232 },

        // Tamil Nadu
        'meenakshi-amman-temple': { lat: 9.9195, lng: 78.1193 },
        'ooty-nilgiri-hills': { lat: 11.4102, lng: 76.6950 },
        'mahabalipuram-reliefs': { lat: 12.6172, lng: 80.1927 },
        'tanjore-brihadisvara': { lat: 10.7828, lng: 79.1318 },
        'kanyakumari-point': { lat: 8.0883, lng: 77.5385 },

        // Uttarakhand
        'rishikesh-ganga-ghats': { lat: 30.0869, lng: 78.2676 },
        'nainital-lake-corridor': { lat: 29.3919, lng: 79.4542 },
        'mussoorie-queen-of-hills': { lat: 30.4598, lng: 78.0644 },
        'valley-of-flowers': { lat: 30.7280, lng: 79.6053 },
        'jim-corbett-reserve': { lat: 29.5300, lng: 78.7747 },

        // Assam
        'kaziranga-national-park': { lat: 26.5775, lng: 93.1711 },
        'majuli-island': { lat: 26.9535, lng: 94.2183 },
        'kamakhya-temple': { lat: 26.1664, lng: 91.7054 },
        'jorhat-tea-estates': { lat: 26.7509, lng: 94.2037 },
        'haflong-hill-station': { lat: 25.1764, lng: 93.0205 }
    };

    /**
     * Tourist Store & Controller
     */
    const TouristApp = {
        destinations: [],
        favorites: new Set(),
        currentFilters: {
            search: '',
            state: 'all',
            categories: [],
            suitable: [],
            seasons: [],
            sortBy: 'popularity'
        },

        init() {
            this.loadFavorites();
            this.enrichDestinations();
            this.initUserSession();
            this.initHeaderNav();
            this.initWishlistDrawer();

            // Page-specific initialization
            const path = window.location.pathname;
            if (path.includes('destinations.html')) {
                this.initExploreDestinationsPage();
            } else if (path.includes('destination-detail.html')) {
                this.initDestinationDetailPage();
            } else if (path.includes('dashboard.html')) {
                this.initTouristDashboard();
            }
        },

        /**
         * 1. Enrich Destinations Single Source of Truth
         */
        enrichDestinations() {
            const rawDestinations = (window.YatraSetuManagerData && window.YatraSetuManagerData.destinations) || [];
            const states = (window.YatraSetuManagerData && window.YatraSetuManagerData.states) || [];

            this.destinations = rawDestinations.map(d => {
                const editorial = DESTINATION_EDITORIAL[d.id] || {};
                const coords = DESTINATION_COORDINATES[d.id] || null;
                const stateObj = states.find(s => s.id === d.state_id) || { name: d.state_id || 'India' };
                const catLower = (d.category || '').toLowerCase();

                // Compute tags
                let tags = editorial.tags || [];
                if (!tags.length) {
                    tags = [d.category || 'Destination'];
                    if (catLower.includes('fort')) tags.push('Heritage');
                    if (catLower.includes('cave')) tags.push('Caves');
                    if (catLower.includes('hill')) tags.push('Nature');
                    if (catLower.includes('beach')) tags.push('Coastal');
                    if (catLower.includes('wildlife')) tags.push('Safari');
                    if (catLower.includes('temple') || catLower.includes('pilgrim')) tags.push('Spiritual');
                }

                // Default suitability
                const suitable = editorial.suitable_for || ['Family', 'Solo Travel', 'Group Travel'];
                if (catLower.includes('fort') || catLower.includes('ski') || catLower.includes('waterfall') || catLower.includes('rafting')) {
                    if (!suitable.includes('Adventure Seekers')) suitable.push('Adventure Seekers');
                }

                // Default seasons
                let seasons = editorial.season || [];
                if (!seasons.length) {
                    if (catLower.includes('ski') || d.state_id === 'kashmir' || d.state_id === 'uttarakhand') {
                        seasons = ['Winter (Nov - Feb)', 'Summer (Mar - Jun)'];
                    } else if (d.state_id === 'goa' || d.state_id === 'rajasthan') {
                        seasons = ['Winter (Nov - Feb)'];
                    } else if (d.state_id === 'kerala' || d.state_id === 'maharashtra') {
                        seasons = ['Winter (Nov - Feb)', 'Monsoon (Jul - Oct)'];
                    } else {
                        seasons = ['Winter (Nov - Feb)', 'Summer (Mar - Jun)'];
                    }
                }

                // Formatted rating and reviews count
                const baseRating = 4.5 + ((d.rank % 5) * 0.1);
                const rating = editorial.rating || baseRating.toFixed(1);
                const reviewsCount = editorial.reviews_count || `${(1.2 - (d.rank * 0.1)).toFixed(1)}k`;

                return {
                    id: d.id,
                    name: d.name,
                    state_id: d.state_id,
                    state_name: stateObj.name,
                    category: d.category,
                    rank: d.rank || 99,
                    img: d.img,
                    location: editorial.location || `${d.name}, ${stateObj.name}`,
                    subtitle: editorial.subtitle || `${d.category} in ${stateObj.name}`,
                    description: editorial.description || `Discover ${d.name}, a prominent ${d.category} in ${stateObj.name}. Integrated into YatraSetu's destination network for visitor orientation and travel guidance.`,
                    highlights: editorial.highlights || [
                        `Prominent ${d.category} in ${stateObj.name}`,
                        `Curated travel route with verified local attractions`,
                        `Supported by active destination management coordination`,
                        `Authentic cultural, nature, and heritage experience`
                    ],
                    tags: tags,
                    suitable_for: suitable,
                    season: seasons,
                    best_time: editorial.best_time || 'October to March',
                    rating: rating,
                    reviewsCount: reviewsCount,
                    coordinates: coords
                };
            });
        },

        /**
         * 2. Load & Persist Favorites / Wishlist in LocalStorage
         */
        loadFavorites() {
            try {
                const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
                if (stored) {
                    const parsed = JSON.parse(stored);
                    this.favorites = new Set(Array.isArray(parsed) ? parsed : []);
                }
            } catch (e) {
                this.favorites = new Set();
            }
            this.updateFavoritesBadge();
        },

        toggleFavorite(destId) {
            if (!destId) return false;
            let isNowFav = false;
            if (this.favorites.has(destId)) {
                this.favorites.delete(destId);
                isNowFav = false;
            } else {
                this.favorites.add(destId);
                isNowFav = true;
            }

            try {
                localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify([...this.favorites]));
            } catch (e) {}

            this.updateFavoritesBadge();
            this.renderWishlistDrawerItems();

            // Sync all favorite heart buttons on the page with this ID
            document.querySelectorAll(`.dest-card-fav-btn[data-dest-id="${destId}"], .detail-fav-btn[data-dest-id="${destId}"]`).forEach(btn => {
                if (isNowFav) {
                    btn.classList.add('favorited');
                    btn.setAttribute('aria-label', 'Remove from Saved Wishlist');
                } else {
                    btn.classList.remove('favorited');
                    btn.setAttribute('aria-label', 'Save to Wishlist');
                }
            });

            return isNowFav;
        },

        updateFavoritesBadge() {
            const count = this.favorites.size;
            document.querySelectorAll('.tourist-fav-badge').forEach(badge => {
                badge.textContent = count;
                badge.style.display = count > 0 ? 'flex' : 'none';
            });
        },

        /**
         * 3. User Identity & Session Integration
         */
        initUserSession() {
            const role = sessionStorage.getItem('yatrasetu_role');
            const email = sessionStorage.getItem('yatrasetu_email');
            const storedName = sessionStorage.getItem('yatrasetu_name');

            const userBadgeEl = document.getElementById('tourist-user-badge');
            const userDropdownEl = document.getElementById('tourist-user-dropdown');
            if (!userBadgeEl || !userDropdownEl) return;

            let userName = 'Guest Explorer';
            let userRoleLabel = 'Plan My Journey';
            let initials = 'GE';
            let isGuest = !role;

            if (role === 'tourist') {
                userName = storedName || 'Ananya Sharma';
                userRoleLabel = 'Tourist Member';
                initials = userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'TM';
            } else if (role === 'manager') {
                userName = storedName || 'Rajesh Patil';
                userRoleLabel = 'Destination Manager';
                initials = 'RP';
            } else if (role === 'stakeholder') {
                userName = storedName || 'Suresh Deshmukh';
                userRoleLabel = 'Tourism Stakeholder';
                initials = 'SD';
            } else if (role === 'admin') {
                userName = storedName || 'Rajesh Verma';
                userRoleLabel = 'Platform Administrator';
                initials = 'RV';
            }

            // Update badge DOM
            const nameEl = userBadgeEl.querySelector('.tourist-user-name');
            const roleEl = userBadgeEl.querySelector('.tourist-user-role');
            const avatarEl = userBadgeEl.querySelector('.tourist-avatar');

            if (nameEl) nameEl.textContent = isGuest ? 'Hi, Guest' : `Hi, ${userName.split(' ')[0]}`;
            if (roleEl) roleEl.textContent = userRoleLabel;
            if (avatarEl) avatarEl.textContent = initials;

            // Render Dropdown Content
            if (isGuest) {
                userDropdownEl.innerHTML = `
                    <div class="tourist-dropdown-header">
                        <div class="tourist-dropdown-name">Welcome, Traveler!</div>
                        <div class="tourist-dropdown-email">Explore India's destinations freely</div>
                    </div>
                    <a href="../login.html" class="tourist-dropdown-item">
                        <span>🔐</span> Sign In to Save Trips
                    </a>
                    <a href="../register.html" class="tourist-dropdown-item">
                        <span>📝</span> Create Tourist Account
                    </a>
                    <button type="button" class="tourist-dropdown-item" id="btn-quick-tourist-demo">
                        <span>✨</span> Demo Tourist Session
                    </button>
                    <div style="border-top: 1px solid var(--tourist-border-subtle); margin: 0.35rem 0;"></div>
                    <a href="../manager/dashboard.html" class="tourist-dropdown-item" style="font-size:0.75rem; color:var(--tourist-text-light);">
                        <span>🏛️</span> Destination Manager Portal
                    </a>
                `;

                const demoBtn = userDropdownEl.querySelector('#btn-quick-tourist-demo');
                if (demoBtn) {
                    demoBtn.onclick = () => {
                        sessionStorage.setItem('yatrasetu_role', 'tourist');
                        sessionStorage.setItem('yatrasetu_email', 'tourist.demo@yatrasetu.in');
                        sessionStorage.setItem('yatrasetu_name', 'Ananya Sharma');
                        window.location.reload();
                    };
                }
            } else {
                userDropdownEl.innerHTML = `
                    <div class="tourist-dropdown-header">
                        <div class="tourist-dropdown-name">${userName}</div>
                        <div class="tourist-dropdown-email">${email || 'Authenticated User'}</div>
                    </div>
                    <a href="dashboard.html" class="tourist-dropdown-item">
                        <span>🧭</span> Tourist Discover
                    </a>
                    <a href="destinations.html" class="tourist-dropdown-item">
                        <span>🗺️</span> Explore Destinations
                    </a>
                    <button type="button" class="tourist-dropdown-item" id="btn-open-wishlist-from-menu">
                        <span>❤️</span> My Saved Places (<span class="tourist-fav-badge">${this.favorites.size}</span>)
                    </button>
                    ${role !== 'tourist' ? `
                    <div style="border-top: 1px solid var(--tourist-border-subtle); margin: 0.35rem 0;"></div>
                    <a href="../${role}/dashboard.html" class="tourist-dropdown-item" style="color:var(--tourist-saffron); font-weight:700;">
                        <span>↩️</span> Return to ${role.toUpperCase()} Workspace
                    </a>
                    ` : ''}
                    <div style="border-top: 1px solid var(--tourist-border-subtle); margin: 0.35rem 0;"></div>
                    <button type="button" class="tourist-dropdown-item danger" id="tourist-logout-btn">
                        <span>🚪</span> Sign Out
                    </button>
                `;

                const logoutBtn = userDropdownEl.querySelector('#tourist-logout-btn');
                if (logoutBtn) {
                    logoutBtn.onclick = () => {
                        sessionStorage.removeItem('yatrasetu_role');
                        sessionStorage.removeItem('yatrasetu_email');
                        sessionStorage.removeItem('yatrasetu_name');
                        window.location.href = '../login.html';
                    };
                }

                const wishlistBtn = userDropdownEl.querySelector('#btn-open-wishlist-from-menu');
                if (wishlistBtn) {
                    wishlistBtn.onclick = () => {
                        userDropdownEl.classList.remove('show');
                        this.openWishlistDrawer();
                    };
                }
            }

            // Dropdown Toggle
            userBadgeEl.onclick = (e) => {
                e.stopPropagation();
                userDropdownEl.classList.toggle('show');
            };

            document.addEventListener('click', (e) => {
                if (!userBadgeEl.contains(e.target) && !userDropdownEl.contains(e.target)) {
                    userDropdownEl.classList.remove('show');
                }
            });
        },

        /**
         * 4. Top Navigation & Mobile Drawer
         */
        initHeaderNav() {
            // Mobile Menu Toggle
            const toggleBtn = document.getElementById('tourist-mobile-toggle');
            const mobileDrawer = document.getElementById('tourist-mobile-nav');
            if (toggleBtn && mobileDrawer) {
                toggleBtn.onclick = (e) => {
                    e.stopPropagation();
                    mobileDrawer.classList.toggle('show');
                };
                document.addEventListener('click', (e) => {
                    if (!toggleBtn.contains(e.target) && !mobileDrawer.contains(e.target)) {
                        mobileDrawer.classList.remove('show');
                    }
                });
            }

            // Topbar Search Icon button (opens search modal or focuses search)
            const searchBtn = document.getElementById('tourist-nav-search-btn');
            if (searchBtn) {
                searchBtn.onclick = (e) => {
                    e.preventDefault();
                    const existingInput = document.getElementById('dest-search-input') || document.getElementById('hero-search-input');
                    if (existingInput) {
                        existingInput.focus();
                        existingInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    } else {
                        window.location.href = 'destinations.html';
                    }
                };
            }

            // Wishlist Button in Topbar
            const favBtn = document.getElementById('tourist-nav-fav-btn');
            if (favBtn) {
                favBtn.onclick = (e) => {
                    e.preventDefault();
                    this.openWishlistDrawer();
                };
            }
        },

        /**
         * 5. Wishlist Slide-Over Drawer
         */
        initWishlistDrawer() {
            let drawer = document.getElementById('tourist-wishlist-drawer');
            if (!drawer) {
                drawer = document.createElement('div');
                drawer.id = 'tourist-wishlist-drawer';
                drawer.className = 'tourist-drawer';
                drawer.innerHTML = `
                    <div class="tourist-drawer-header">
                        <div style="display:flex; align-items:center; gap:0.5rem;">
                            <span style="font-size:1.3rem;">❤️</span>
                            <h3 style="margin:0; font-size:1.15rem; color:var(--tourist-forest);">Saved Destinations</h3>
                        </div>
                        <button type="button" class="tourist-modal-close" id="btn-close-wishlist-drawer" style="position:static;">×</button>
                    </div>
                    <div class="tourist-drawer-body" id="wishlist-drawer-items"></div>
                `;
                document.body.appendChild(drawer);

                const closeBtn = drawer.querySelector('#btn-close-wishlist-drawer');
                if (closeBtn) closeBtn.onclick = () => drawer.classList.remove('show');
            }
        },

        openWishlistDrawer() {
            const drawer = document.getElementById('tourist-wishlist-drawer');
            if (!drawer) return;
            this.renderWishlistDrawerItems();
            drawer.classList.add('show');
        },

        renderWishlistDrawerItems() {
            const container = document.getElementById('wishlist-drawer-items');
            if (!container) return;

            const favList = [...this.favorites];
            if (!favList.length) {
                container.innerHTML = `
                    <div style="text-align:center; padding:3rem 1rem; color:var(--tourist-text-muted);">
                        <div style="font-size:2.5rem; margin-bottom:0.75rem;">🤍</div>
                        <h4 style="margin:0 0 0.35rem 0; color:var(--tourist-text-heading);">No Saved Destinations Yet</h4>
                        <p style="font-size:0.85rem; margin:0 0 1.25rem 0;">Click the heart icon on any destination card to curate your personal trip wishlist.</p>
                        <a href="destinations.html" class="tourist-btn-primary" style="justify-content:center; align-self:center;">Explore Destinations</a>
                    </div>
                `;
                return;
            }

            const favDestinations = this.destinations.filter(d => this.favorites.has(d.id));

            container.innerHTML = favDestinations.map(dest => `
                <div style="display:flex; gap:0.85rem; align-items:center; padding:0.75rem; border:1px solid var(--tourist-border); border-radius:12px; background:var(--tourist-bg-surface);">
                    <img src="${dest.img}" alt="${dest.name}" style="width:68px; height:68px; object-fit:cover; border-radius:8px; flex-shrink:0;">
                    <div style="flex:1; min-width:0;">
                        <h5 style="margin:0 0 0.2rem 0; font-size:0.95rem; font-weight:700; color:var(--tourist-text-heading); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${dest.name}</h5>
                        <div style="font-size:0.75rem; color:var(--tourist-text-light);">${dest.state_name} • ${dest.category}</div>
                        <div style="font-size:0.75rem; color:#D97706; font-weight:700; margin-top:0.2rem;">⭐ ${dest.rating}</div>
                    </div>
                    <div style="display:flex; flex-direction:column; gap:0.35rem; align-items:flex-end;">
                        <a href="destination-detail.html?id=${dest.id}" class="tourist-link-arrow" style="font-size:0.78rem;">View →</a>
                        <button type="button" class="dest-remove-fav-btn" data-dest-id="${dest.id}" style="background:transparent; border:none; color:#EF4444; font-size:0.72rem; cursor:pointer; padding:0;">Remove</button>
                    </div>
                </div>
            `).join('');

            container.querySelectorAll('.dest-remove-fav-btn').forEach(btn => {
                btn.onclick = () => {
                    const id = btn.getAttribute('data-dest-id');
                    this.toggleFavorite(id);
                };
            });
        },

        /**
         * ----------------------------------------------------------------------
         * 6. Tourist Dashboard (Home) View Controller
         * ----------------------------------------------------------------------
         */
        initTouristDashboard() {
            // Hero Search Form
            const heroForm = document.getElementById('hero-search-form');
            const heroInput = document.getElementById('hero-search-input');
            if (heroForm && heroInput) {
                heroForm.onsubmit = (e) => {
                    e.preventDefault();
                    const q = heroInput.value.trim();
                    window.location.href = `destinations.html${q ? `?q=${encodeURIComponent(q)}` : ''}`;
                };
            }

            // Hero Category Chips (clicks navigate to destinations.html with pre-selected category)
            document.querySelectorAll('.hero-category-chip').forEach(chip => {
                chip.onclick = (e) => {
                    e.preventDefault();
                    const cat = chip.getAttribute('data-category');
                    window.location.href = `destinations.html?category=${encodeURIComponent(cat)}`;
                };
            });

            // State Cards Click Handlers
            document.querySelectorAll('.tourist-state-card').forEach(card => {
                card.onclick = (e) => {
                    e.preventDefault();
                    const stateId = card.getAttribute('data-state-id');
                    window.location.href = `destinations.html?state=${encodeURIComponent(stateId)}`;
                };
            });
        },

        /**
         * ----------------------------------------------------------------------
         * 7. Explore Destinations Page Controller (Mockup 2)
         * ----------------------------------------------------------------------
         */
        initExploreDestinationsPage() {
            // Read URL Params (e.g. ?q=fort, ?state=maharashtra, ?category=forts-heritage)
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.has('q')) {
                this.currentFilters.search = urlParams.get('q');
            }
            if (urlParams.has('state')) {
                this.currentFilters.state = urlParams.get('state');
            }
            if (urlParams.has('category')) {
                const catParam = urlParams.get('category');
                this.currentFilters.categories = [catParam];
            }

            // Sync Search Input DOM
            const searchInput = document.getElementById('dest-search-input');
            if (searchInput) {
                searchInput.value = this.currentFilters.search;
                searchInput.addEventListener('input', (e) => {
                    this.currentFilters.search = e.target.value.trim();
                    this.renderFilteredDestinations();
                });
            }

            // Search Form Submit
            const searchForm = document.getElementById('dest-search-form');
            if (searchForm) {
                searchForm.onsubmit = (e) => {
                    e.preventDefault();
                    this.renderFilteredDestinations();
                };
            }

            // State Filter Pills
            const statePills = document.querySelectorAll('.dest-state-pill');
            statePills.forEach(pill => {
                const state = pill.getAttribute('data-state') || 'all';
                if (state === this.currentFilters.state) {
                    statePills.forEach(p => p.classList.remove('active'));
                    pill.classList.add('active');
                }

                pill.onclick = (e) => {
                    e.preventDefault();
                    statePills.forEach(p => p.classList.remove('active'));
                    pill.classList.add('active');
                    this.currentFilters.state = state;
                    this.renderFilteredDestinations();
                };
            });

            // Checkbox Filter Groups
            this.bindCheckboxGroup('category-filter-checkbox', 'categories');
            this.bindCheckboxGroup('suitable-filter-checkbox', 'suitable');
            this.bindCheckboxGroup('season-filter-checkbox', 'seasons');

            // Sort Dropdown
            const sortSelect = document.getElementById('dest-sort-select');
            if (sortSelect) {
                sortSelect.value = this.currentFilters.sortBy;
                sortSelect.onchange = (e) => {
                    this.currentFilters.sortBy = e.target.value;
                    this.renderFilteredDestinations();
                };
            }

            // Clear All Filters Button
            const clearBtn = document.getElementById('dest-clear-filters-btn');
            if (clearBtn) {
                clearBtn.onclick = () => {
                    this.resetAllFilters();
                };
            }

            // Mobile Filter Drawer Toggle
            const mobileFilterBtn = document.getElementById('dest-mobile-filter-btn');
            const sidebar = document.getElementById('dest-filters-sidebar');
            const closeSidebarBtn = document.getElementById('dest-close-sidebar-btn');
            if (mobileFilterBtn && sidebar) {
                mobileFilterBtn.onclick = () => sidebar.classList.add('mobile-open');
            }
            if (closeSidebarBtn && sidebar) {
                closeSidebarBtn.onclick = () => sidebar.classList.remove('mobile-open');
            }

            // Initial Render
            this.renderFilteredDestinations();
        },

        bindCheckboxGroup(className, filterKey) {
            const checkboxes = document.querySelectorAll(`.${className}`);
            checkboxes.forEach(cb => {
                if (this.currentFilters[filterKey].includes(cb.value)) {
                    cb.checked = true;
                }

                cb.onchange = () => {
                    const selected = [];
                    checkboxes.forEach(c => {
                        if (c.checked) selected.push(c.value);
                    });
                    this.currentFilters[filterKey] = selected;
                    this.renderFilteredDestinations();
                };
            });
        },

        resetAllFilters() {
            this.currentFilters = {
                search: '',
                state: 'all',
                categories: [],
                suitable: [],
                seasons: [],
                sortBy: 'popularity'
            };

            const searchInput = document.getElementById('dest-search-input');
            if (searchInput) searchInput.value = '';

            document.querySelectorAll('.dest-state-pill').forEach(p => {
                if (p.getAttribute('data-state') === 'all') p.classList.add('active');
                else p.classList.remove('active');
            });

            document.querySelectorAll('input[type="checkbox"]').forEach(c => {
                c.checked = false;
            });

            const sortSelect = document.getElementById('dest-sort-select');
            if (sortSelect) sortSelect.value = 'popularity';

            this.renderFilteredDestinations();
        },

        /**
         * Multi-Dimensional Filtering & Sorting Engine
         */
        renderFilteredDestinations() {
            const grid = document.getElementById('dest-cards-grid');
            const countLabel = document.getElementById('dest-results-count');
            const activeTagsBar = document.getElementById('dest-active-tags-bar');
            if (!grid) return;

            // Show Loading State Briefly for Smooth Transition
            grid.innerHTML = `
                <div class="dest-state-panel">
                    <span class="dest-state-icon">⏳</span>
                    <h3 class="dest-state-title">Filtering Destinations...</h3>
                    <p class="dest-state-desc">Scanning verified smart destination records across India.</p>
                </div>
            `;

            setTimeout(() => {
                const filtered = this.getFilteredDestinations();

                // Update Results Count Label
                if (countLabel) {
                    countLabel.textContent = `${filtered.length} Destination${filtered.length === 1 ? '' : 's'}`;
                }

                // Render Active Filter Badges Bar
                if (activeTagsBar) {
                    this.renderActiveFilterTags(activeTagsBar);
                }

                // Empty State Check
                if (!filtered.length) {
                    grid.innerHTML = `
                        <div class="dest-state-panel">
                            <span class="dest-state-icon">🔍</span>
                            <h3 class="dest-state-title">No Destinations Found</h3>
                            <p class="dest-state-desc">We couldn't find any destinations matching your current search or filter combination.</p>
                            <button type="button" class="tourist-btn-primary" id="btn-empty-reset-filters">Reset All Filters</button>
                        </div>
                    `;
                    const resetBtn = grid.querySelector('#btn-empty-reset-filters');
                    if (resetBtn) resetBtn.onclick = () => this.resetAllFilters();
                    return;
                }

                // Render Destination Cards Grid
                grid.innerHTML = filtered.map(dest => {
                    const isFav = this.favorites.has(dest.id);
                    return `
                        <div class="dest-card" data-dest-id="${dest.id}">
                            <div class="dest-card-media">
                                <img src="${dest.img}" alt="${dest.name}" class="dest-card-media-img" loading="lazy">
                                <button type="button" class="dest-card-fav-btn ${isFav ? 'favorited' : ''}" 
                                        data-dest-id="${dest.id}" 
                                        title="${isFav ? 'Remove from Saved' : 'Save to Favorites'}"
                                        aria-label="${isFav ? 'Remove from Saved' : 'Save to Favorites'}">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="${isFav ? '#EF4444' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                                    </svg>
                                </button>
                            </div>
                            <div class="dest-card-body">
                                <div class="dest-card-title-row">
                                    <h3 class="dest-card-name">${dest.name}</h3>
                                </div>
                                <div class="dest-card-loc">📍 ${dest.location}</div>
                                <div class="dest-card-tags">
                                    ${dest.tags.slice(0, 3).map(tag => `<span class="dest-card-tag">${tag}</span>`).join('')}
                                </div>
                                <div class="dest-card-footer">
                                    <div class="dest-card-rating">
                                        <span>★ ${dest.rating}</span>
                                        <span class="dest-card-reviews">(${dest.reviewsCount})</span>
                                    </div>
                                    <a href="destination-detail.html?id=${dest.id}" class="dest-card-link">
                                        Explore <span>→</span>
                                    </a>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('');

                // Wire Favorite Buttons on Cards
                grid.querySelectorAll('.dest-card-fav-btn').forEach(btn => {
                    btn.onclick = (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const id = btn.getAttribute('data-dest-id');
                        this.toggleFavorite(id);
                    };
                });
            }, 80);
        },

        getFilteredDestinations() {
            let list = [...this.destinations];
            const { search, state, categories, suitable, seasons, sortBy } = this.currentFilters;

            // 1. Text Search Filter
            if (search) {
                const q = search.toLowerCase();
                list = list.filter(d => 
                    d.name.toLowerCase().includes(q) ||
                    d.state_name.toLowerCase().includes(q) ||
                    d.category.toLowerCase().includes(q) ||
                    d.tags.some(t => t.toLowerCase().includes(q)) ||
                    d.description.toLowerCase().includes(q)
                );
            }

            // 2. State Filter
            if (state && state !== 'all') {
                list = list.filter(d => d.state_id === state);
            }

            // 3. Category Groups Filter
            if (categories && categories.length > 0) {
                list = list.filter(d => {
                    const catLower = d.category.toLowerCase();
                    return categories.some(catKey => {
                        const group = CATEGORY_GROUPS[catKey];
                        if (group) {
                            return group.matches.some(m => catLower.includes(m));
                        }
                        return catLower.includes(catKey.toLowerCase());
                    });
                });
            }

            // 4. Suitable For Filter
            if (suitable && suitable.length > 0) {
                list = list.filter(d => 
                    suitable.some(s => d.suitable_for.includes(s))
                );
            }

            // 5. Seasons Filter
            if (seasons && seasons.length > 0) {
                list = list.filter(d => 
                    seasons.some(s => d.season.includes(s))
                );
            }

            // 6. Sorting
            if (sortBy === 'popularity') {
                list.sort((a, b) => a.rank - b.rank);
            } else if (sortBy === 'rating') {
                list.sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));
            } else if (sortBy === 'name-asc') {
                list.sort((a, b) => a.name.localeCompare(b.name));
            } else if (sortBy === 'name-desc') {
                list.sort((a, b) => b.name.localeCompare(a.name));
            }

            return list;
        },

        renderActiveFilterTags(container) {
            const badges = [];
            const { search, state, categories, suitable, seasons } = this.currentFilters;

            if (search) {
                badges.push({ label: `Search: "${search}"`, onRemove: () => { this.currentFilters.search = ''; const i = document.getElementById('dest-search-input'); if (i) i.value = ''; this.renderFilteredDestinations(); } });
            }
            if (state && state !== 'all') {
                const sObj = (window.YatraSetuManagerData.states || []).find(s => s.id === state);
                badges.push({ label: `State: ${sObj ? sObj.name : state}`, onRemove: () => {
                    this.currentFilters.state = 'all';
                    document.querySelectorAll('.dest-state-pill').forEach(p => {
                        if (p.getAttribute('data-state') === 'all') p.classList.add('active');
                        else p.classList.remove('active');
                    });
                    this.renderFilteredDestinations();
                }});
            }
            categories.forEach(catKey => {
                const group = CATEGORY_GROUPS[catKey];
                badges.push({ label: group ? group.label : catKey, onRemove: () => {
                    this.currentFilters.categories = this.currentFilters.categories.filter(c => c !== catKey);
                    document.querySelectorAll('.category-filter-checkbox').forEach(cb => {
                        if (cb.value === catKey) cb.checked = false;
                    });
                    this.renderFilteredDestinations();
                }});
            });
            suitable.forEach(s => {
                badges.push({ label: `For: ${s}`, onRemove: () => {
                    this.currentFilters.suitable = this.currentFilters.suitable.filter(item => item !== s);
                    document.querySelectorAll('.suitable-filter-checkbox').forEach(cb => {
                        if (cb.value === s) cb.checked = false;
                    });
                    this.renderFilteredDestinations();
                }});
            });
            seasons.forEach(sea => {
                badges.push({ label: `Season: ${sea.split(' ')[0]}`, onRemove: () => {
                    this.currentFilters.seasons = this.currentFilters.seasons.filter(item => item !== sea);
                    document.querySelectorAll('.season-filter-checkbox').forEach(cb => {
                        if (cb.value === sea) cb.checked = false;
                    });
                    this.renderFilteredDestinations();
                }});
            });

            if (!badges.length) {
                container.innerHTML = '';
                return;
            }

            container.innerHTML = badges.map((b, idx) => `
                <span class="dest-tag-badge">
                    ${b.label}
                    <button type="button" data-tag-idx="${idx}">×</button>
                </span>
            `).join('');

            container.querySelectorAll('button').forEach(btn => {
                btn.onclick = () => {
                    const idx = parseInt(btn.getAttribute('data-tag-idx'), 10);
                    if (badges[idx] && badges[idx].onRemove) {
                        badges[idx].onRemove();
                    }
                };
            });
        },

        /**
         * ----------------------------------------------------------------------
         * Helper Methods for Destination Integration & Relationship Integrity
         * ----------------------------------------------------------------------
         */
        validateCoordinates(coords) {
            if (!coords || typeof coords.lat !== 'number' || typeof coords.lng !== 'number') {
                return { valid: false, reason: 'Official GPS survey pending Destination Manager verification' };
            }
            let lat = coords.lat;
            let lng = coords.lng;

            // Detect and correct accidental lat/lng transposition
            if (lat > 68.0 && lat <= 98.0 && lng >= 6.0 && lng <= 38.0) {
                const temp = lat;
                lat = lng;
                lng = temp;
            }

            // India national geographic bounding box check (6.0° N - 38.0° N, 68.0° E - 98.0° E)
            if (lat < 6.0 || lat > 38.0 || lng < 68.0 || lng > 98.0) {
                return { valid: false, reason: 'Coordinates outside India national territory' };
            }

            return { valid: true, lat, lng };
        },

        extractYouTubeId(url) {
            if (!url) return null;
            const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
            return match ? match[1] : null;
        },

        getDestinationAttractions(destId) {
            const attractions = (window.YatraSetuManagerData && window.YatraSetuManagerData.attractions) || [];
            // Strict relationship: only attractions explicitly tagged with this destination_id
            return attractions.filter(a => a.destination_id === destId);
        },

        getDestinationVideos(destId) {
            const videos = (window.YatraSetuManagerData && window.YatraSetuManagerData.destinationVideos) || [];
            // Official published videos explicitly tagged with this destination_id
            return videos.filter(v => v.destination_id === destId && v.status === 'Published');
        },

        getApprovedStakeholders(destId) {
            const shList = (window.YatraSetuManagerData && window.YatraSetuManagerData.stakeholders) || [];
            // Strict role privacy & publication boundary:
            // 1. Must match destination_id
            // 2. Must be Approved
            // 3. Must not be Deactivated
            // 4. Strip private internal manager_note to prevent leak of administrative data
            return shList
                .filter(s => s.destination_id === destId && s.status === 'Approved' && s.account_status !== 'Deactivated')
                .map(s => ({
                    id: s.id,
                    destination_id: s.destination_id,
                    destination: s.destination,
                    name: s.name,
                    category: s.category,
                    type: s.type,
                    contact: s.contact,
                    email: s.email,
                    contact_person: s.contact_person,
                    address: s.address,
                    hours: s.hours,
                    price_range: s.price_range,
                    description: s.description,
                    status: s.status
                }));
        },

        getDestinationEvents(destId) {
            const events = (window.YatraSetuManagerData && window.YatraSetuManagerData.events) || [];
            return events.filter(e => e.destination_id === destId);
        },

        getDestinationAnnouncements(destId) {
            const advisories = (window.YatraSetuStakeholderData && window.YatraSetuStakeholderData.announcements) || [];
            return advisories.filter(a => a.destination_id === destId);
        },

        getDestinationFeedback(destId) {
            const defaultFeedback = (window.YatraSetuManagerData && window.YatraSetuManagerData.feedback) || [];
            const matched = defaultFeedback.filter(f => f.destination_id === destId);
            try {
                const stored = sessionStorage.getItem('yatrasetu_tourist_feedback');
                if (stored) {
                    const parsed = JSON.parse(stored);
                    const userForDest = parsed.filter(f => f.destination_id === destId);
                    return [...userForDest, ...matched];
                }
            } catch (err) {
                console.warn('Could not read user feedback storage:', err);
            }
            return matched;
        },

        getNearbyDestinations(dest) {
            // Truthful regional circuit: other destinations in same administrative state
            return this.destinations.filter(d => d.state_id === dest.state_id && d.id !== dest.id);
        },

        /**
         * ----------------------------------------------------------------------
         * 8. Destination Detail Page Controller (Mockup 3 + Live Integrations)
         * ----------------------------------------------------------------------
         */
        initDestinationDetailPage() {
            const urlParams = new URLSearchParams(window.location.search);
            const destId = urlParams.get('id') || 'raigad-fort';
            const dest = this.destinations.find(d => d.id === destId) || this.destinations[0];

            if (!dest) {
                const contentEl = document.getElementById('detail-main-content');
                if (contentEl) {
                    contentEl.innerHTML = `
                        <div class="dest-state-panel" style="margin: 3rem 0;">
                            <span class="dest-state-icon">⚠️</span>
                            <h3 class="dest-state-title">Destination Record Not Found</h3>
                            <p class="dest-state-desc">The requested destination identifier does not exist in the active catalogue.</p>
                            <a href="destinations.html" class="tourist-btn-primary">Browse All Destinations</a>
                        </div>
                    `;
                }
                return;
            }

            // Populate Page Title & Meta
            document.title = `${dest.name} — YatraSetu Tourist Discovery`;

            // Populate Breadcrumb
            const breadcrumbState = document.getElementById('detail-breadcrumb-state');
            if (breadcrumbState) {
                breadcrumbState.textContent = `${dest.state_name || 'India'} / ${dest.name}`;
            }

            // Populate Hero Elements
            const heroEl = document.getElementById('detail-hero');
            if (heroEl) {
                heroEl.style.backgroundImage = `url('${dest.img}')`;
            }
            const nameEl = document.getElementById('detail-dest-name');
            if (nameEl) nameEl.textContent = dest.name;

            const locEl = document.getElementById('detail-dest-location');
            if (locEl) locEl.textContent = `📍 ${dest.location}`;

            const ratingEl = document.getElementById('detail-dest-rating');
            if (ratingEl) ratingEl.textContent = `★ ${dest.rating} (${dest.reviewsCount} reviews)`;

            const subEl = document.getElementById('detail-dest-subtitle');
            if (subEl) subEl.textContent = dest.subtitle;

            const tagsContainer = document.getElementById('detail-dest-tags');
            if (tagsContainer) {
                tagsContainer.innerHTML = dest.tags.map(t => `<span class="detail-hero-tag">${t}</span>`).join('');
            }

            // Wire Favorite Button in Detail Hero & Quick Save Card
            const favBtn = document.getElementById('detail-fav-btn');
            const quickSaveBtn = document.getElementById('btn-quick-save-detail');

            const updateFavUI = (isFav) => {
                if (favBtn) {
                    favBtn.classList.toggle('favorited', isFav);
                    const svg = favBtn.querySelector('svg');
                    if (svg) svg.setAttribute('fill', isFav ? '#EF4444' : 'none');
                }
                if (quickSaveBtn) {
                    quickSaveBtn.innerHTML = isFav 
                        ? '<span>❤️</span> Saved in My Wishlist' 
                        : '<span>🤍</span> Save to My Wishlist';
                }
            };

            const isFavInitial = this.favorites.has(dest.id);
            updateFavUI(isFavInitial);

            const handleToggleFav = () => {
                const isNowFav = this.toggleFavorite(dest.id);
                updateFavUI(isNowFav);
            };

            if (favBtn) favBtn.onclick = handleToggleFav;
            if (quickSaveBtn) quickSaveBtn.onclick = handleToggleFav;

            // Retrieve Explicitly Associated Datasets
            const attractions = this.getDestinationAttractions(dest.id);
            const videos = this.getDestinationVideos(dest.id);
            const stakeholders = this.getApprovedStakeholders(dest.id);
            const events = this.getDestinationEvents(dest.id);
            const advisories = this.getDestinationAnnouncements(dest.id);
            let feedbackList = this.getDestinationFeedback(dest.id);
            const nearbyDestinations = this.getNearbyDestinations(dest);
            const coordValidation = this.validateCoordinates(dest.coordinates);

            // Populate Tab Badge Counters
            const tabAttrCount = document.getElementById('tab-attr-count');
            if (tabAttrCount) tabAttrCount.textContent = attractions.length;

            const tabVideoCount = document.getElementById('tab-video-count');
            if (tabVideoCount) tabVideoCount.textContent = videos.length;

            const tabShCount = document.getElementById('tab-sh-count');
            if (tabShCount) tabShCount.textContent = stakeholders.length;

            const tabEventCount = document.getElementById('tab-event-count');
            if (tabEventCount) tabEventCount.textContent = events.length;

            const tabReviewCount = document.getElementById('tab-review-count');
            if (tabReviewCount) tabReviewCount.textContent = feedbackList.length;

            // =================================================================
            // TAB 1: OVERVIEW PANE POPULATION
            // =================================================================
            const descEl = document.getElementById('detail-dest-description');
            if (descEl) descEl.textContent = dest.description;

            const highlightsEl = document.getElementById('detail-highlights-list');
            if (highlightsEl) {
                const icons = ['🏛️', '🥾', '🌄', '✨'];
                highlightsEl.innerHTML = dest.highlights.map((h, i) => `
                    <li class="detail-highlight-item">
                        <span class="detail-highlight-icon">${icons[i % icons.length]}</span>
                        <span>${h}</span>
                    </li>
                `).join('');
            }

            // Overview Attractions Preview (Up to 4)
            const attrPreviewGrid = document.getElementById('detail-attractions-grid');
            if (attrPreviewGrid) {
                if (attractions.length > 0) {
                    attrPreviewGrid.innerHTML = attractions.slice(0, 4).map(attr => `
                        <div class="detail-attr-item">
                            <div class="detail-attr-thumb" style="background-image: url('${attr.img}');"></div>
                            <div class="detail-attr-body">
                                <h4 class="detail-attr-name">${attr.name}</h4>
                                <div class="detail-attr-cat">${attr.category} • ⭐ ${attr.rating || '4.8'}</div>
                            </div>
                        </div>
                    `).join('');
                } else {
                    attrPreviewGrid.innerHTML = `
                        <div style="grid-column: 1 / -1; padding: 1.25rem; background: var(--tourist-bg-subtle); border-radius: 8px; font-size: 0.85rem; color: var(--tourist-text-muted);">
                            Associated attractions are currently curated by the regional Destination Manager. Check back soon for localized updates.
                        </div>
                    `;
                }
            }

            // Quick switch to Attractions tab
            const btnQuickViewAllAttr = document.getElementById('btn-quick-view-all-attr');
            if (btnQuickViewAllAttr) {
                btnQuickViewAllAttr.onclick = () => {
                    const attrTabBtn = document.querySelector('.detail-tab-btn[data-tab="attractions"]');
                    if (attrTabBtn) attrTabBtn.click();
                };
            }

            // Location & OpenStreetMap Section
            const mapContainer = document.getElementById('detail-map-container');
            const coordsBadge = document.getElementById('detail-coords-badge');
            const sidebarLoc = document.getElementById('detail-sidebar-loc');
            const directionsBtn = document.getElementById('detail-directions-btn');

            if (sidebarLoc) {
                sidebarLoc.textContent = `${dest.name}, ${dest.state_name || dest.location}`;
            }

            if (coordValidation.valid) {
                const { lat, lng } = coordValidation;
                if (coordsBadge) {
                    coordsBadge.innerHTML = `
                        <span>GPS: <strong>${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E</strong></span>
                        <span style="font-weight:700; color:var(--tourist-forest);">India Grid Verified</span>
                    `;
                }
                if (mapContainer) {
                    // Embed OpenStreetMap using bounded box
                    const bbox = `${(lng - 0.04).toFixed(4)}%2C${(lat - 0.03).toFixed(4)}%2C${(lng + 0.04).toFixed(4)}%2C${(lat + 0.03).toFixed(4)}`;
                    mapContainer.innerHTML = `
                        <iframe 
                            src="https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat.toFixed(4)}%2C${lng.toFixed(4)}" 
                            title="Interactive map of ${dest.name}"
                            loading="lazy"
                            style="width: 100%; height: 100%; border: none;">
                        </iframe>
                    `;
                }
                if (directionsBtn) {
                    directionsBtn.href = `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=%3B${lat.toFixed(5)}%2C${lng.toFixed(5)}`;
                    directionsBtn.removeAttribute('disabled');
                }
            } else {
                if (coordsBadge) {
                    coordsBadge.innerHTML = `
                        <span style="color:#D97706;">⚠️ ${coordValidation.reason}</span>
                    `;
                }
                if (mapContainer) {
                    mapContainer.innerHTML = `
                        <div style="height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding:1.5rem; background:var(--tourist-bg-subtle); color:var(--tourist-text-muted);">
                            <span style="font-size:2rem; margin-bottom:0.5rem;">🗺️</span>
                            <strong style="color:var(--tourist-text-heading); font-size:0.9rem;">Map Location Pending Survey</strong>
                            <p style="font-size:0.8rem; margin:0.35rem 0 0 0;">Official GPS coordinates are being surveyed by the Destination Management Team.</p>
                        </div>
                    `;
                }
                if (directionsBtn) {
                    directionsBtn.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(dest.location + ' ' + dest.name)}`;
                }
            }

            // =================================================================
            // TAB 2: ATTRACTIONS FULL PANE
            // =================================================================
            const attractionsCardsContainer = document.getElementById('tab-attractions-cards');
            if (attractionsCardsContainer) {
                if (attractions.length > 0) {
                    attractionsCardsContainer.innerHTML = attractions.map(attr => `
                        <div class="tourist-video-card">
                            <div class="video-thumb-wrap" style="background-image: url('${attr.img}');">
                                <span class="video-duration-tag">⭐ ${attr.rating || '4.8'}</span>
                            </div>
                            <div class="video-card-body">
                                <h4 class="video-card-title">${attr.name}</h4>
                                <p class="video-card-desc">Category: ${attr.category} • Status: ${attr.status || 'Open to Visitors'}</p>
                                <div class="video-card-meta">
                                    <span style="font-size:0.75rem; color:var(--tourist-forest); font-weight:700;">✓ Verified Destination Attraction</span>
                                </div>
                            </div>
                        </div>
                    `).join('');
                } else {
                    attractionsCardsContainer.innerHTML = `
                        <div style="grid-column: 1 / -1; padding: 2.5rem; text-align: center; background: var(--tourist-bg-subtle); border-radius: 12px;">
                            <span style="font-size: 2.5rem; display: block; margin-bottom: 0.75rem;">🏛️</span>
                            <h4 style="font-size: 1.1rem; color: var(--tourist-text-heading); margin: 0 0 0.5rem 0;">No Associated Attractions Listed</h4>
                            <p style="font-size: 0.88rem; color: var(--tourist-text-muted); max-width: 480px; margin: 0 auto;">
                                The Destination Manager for this region has not yet cataloged secondary monuments or viewpoints under this destination record.
                            </p>
                        </div>
                    `;
                }
            }

            // =================================================================
            // TAB 3: VIDEOS FULL PANE (FR-15 MANDATORY INTEGRATION)
            // =================================================================
            const videosGrid = document.getElementById('detail-videos-grid');
            if (videosGrid) {
                if (videos.length > 0) {
                    videosGrid.innerHTML = videos.map(vid => `
                        <div class="tourist-video-card" data-video-id="${vid.id}" style="cursor: pointer;">
                            <div class="video-thumb-wrap" style="background-image: url('${vid.thumbnail_url}');">
                                <div class="video-play-btn" aria-label="Play orientation video">▶</div>
                                <span class="video-duration-tag">⏱ ${vid.duration || '0:30'}</span>
                            </div>
                            <div class="video-card-body">
                                <h4 class="video-card-title">${vid.title}</h4>
                                <p class="video-card-desc">${vid.description}</p>
                                <div class="video-card-meta">
                                    <span>${vid.publisher || 'Department of Tourism'}</span>
                                    <span style="color:var(--tourist-forest); font-weight:700;">● Official Media</span>
                                </div>
                            </div>
                        </div>
                    `).join('');

                    videosGrid.querySelectorAll('.tourist-video-card').forEach(card => {
                        card.onclick = () => {
                            const vidId = card.getAttribute('data-video-id');
                            const video = videos.find(v => v.id === vidId);
                            if (video) this.openVideoModal(video);
                        };
                    });
                } else {
                    videosGrid.innerHTML = `
                        <div style="grid-column: 1 / -1; padding: 2.5rem; text-align: center; background: var(--tourist-bg-subtle); border-radius: 12px;">
                            <span style="font-size: 2.5rem; display: block; margin-bottom: 0.75rem;">🎬</span>
                            <h4 style="font-size: 1.1rem; color: var(--tourist-text-heading); margin: 0 0 0.5rem 0;">No Official Videos Published Yet</h4>
                            <p style="font-size: 0.88rem; color: var(--tourist-text-muted); max-width: 480px; margin: 0 auto;">
                                Short 30-second audiovisual orientation guides for this destination are currently under production or pending Destination Manager review.
                            </p>
                        </div>
                    `;
                }
            }

            // =================================================================
            // TAB 4: STAKEHOLDER EXPERIENCES & SERVICES
            // =================================================================
            const stakeholdersGrid = document.getElementById('detail-stakeholders-grid');
            if (stakeholdersGrid) {
                if (stakeholders.length > 0) {
                    stakeholdersGrid.innerHTML = stakeholders.map(sh => `
                        <div class="tourist-stakeholder-card">
                            <div class="stakeholder-card-header">
                                <span class="stakeholder-cat-badge">${sh.category}</span>
                                <span class="stakeholder-verified-pill">✓ Verified Partner</span>
                            </div>
                            <h4 class="stakeholder-name">${sh.name}</h4>
                            <p class="stakeholder-desc">${sh.description}</p>
                            <div class="stakeholder-meta-grid">
                                <div><strong>📍 Base:</strong> ${sh.address || 'Local Hub'}</div>
                                <div><strong>🕒 Hours:</strong> ${sh.hours || 'Standard Hours'}</div>
                                <div><strong>💰 Guide Rate:</strong> ${sh.price_range || 'Contact Partner'}</div>
                            </div>
                            <div class="stakeholder-card-actions">
                                <button type="button" class="tourist-btn-primary btn-view-stakeholder" data-sh-id="${sh.id}" style="font-size:0.82rem; padding:0.5rem 1rem;">
                                    View Details & Enquire
                                </button>
                            </div>
                        </div>
                    `).join('');

                    stakeholdersGrid.querySelectorAll('.btn-view-stakeholder').forEach(btn => {
                        btn.onclick = () => {
                            const shId = btn.getAttribute('data-sh-id');
                            const sh = stakeholders.find(s => s.id === shId);
                            if (sh) this.openStakeholderModal(sh);
                        };
                    });
                } else {
                    stakeholdersGrid.innerHTML = `
                        <div style="grid-column: 1 / -1; padding: 2.5rem; text-align: center; background: var(--tourist-bg-subtle); border-radius: 12px;">
                            <span style="font-size: 2.5rem; display: block; margin-bottom: 0.75rem;">🤝</span>
                            <h4 style="font-size: 1.1rem; color: var(--tourist-text-heading); margin: 0 0 0.5rem 0;">No Active Local Services Listed</h4>
                            <p style="font-size: 0.88rem; color: var(--tourist-text-muted); max-width: 480px; margin: 0 auto;">
                                Local tourism operators and guides in this destination are currently undergoing official registration and verification by the regional Destination Manager.
                            </p>
                        </div>
                    `;
                }
            }

            // =================================================================
            // TAB 5: EVENTS & FESTIVALS
            // =================================================================
            const eventsGrid = document.getElementById('detail-events-grid');
            if (eventsGrid) {
                if (events.length > 0) {
                    eventsGrid.innerHTML = events.map(ev => `
                        <div class="tourist-event-card">
                            <div class="event-date-box">
                                <span class="event-date-num">${ev.dateNum || '15'}</span>
                                <span class="event-date-month">${ev.dateMonth || 'OCT'}</span>
                            </div>
                            <div class="event-details">
                                <h4 class="event-title">${ev.title}</h4>
                                <div class="event-loc">📍 ${ev.location}</div>
                            </div>
                            <div>
                                <span class="event-status-pill ${ev.statusClass || 'active'}">${ev.status || 'Active'}</span>
                            </div>
                        </div>
                    `).join('');
                } else {
                    eventsGrid.innerHTML = `
                        <div style="grid-column: 1 / -1; padding: 2.5rem; text-align: center; background: var(--tourist-bg-subtle); border-radius: 12px;">
                            <span style="font-size: 2.5rem; display: block; margin-bottom: 0.75rem;">📅</span>
                            <h4 style="font-size: 1.1rem; color: var(--tourist-text-heading); margin: 0 0 0.5rem 0;">No Scheduled Events Active</h4>
                            <p style="font-size: 0.88rem; color: var(--tourist-text-muted); max-width: 480px; margin: 0 auto;">
                                There are no seasonal festivals or community events scheduled for this destination at present.
                            </p>
                        </div>
                    `;
                }
            }

            // =================================================================
            // TAB 6: GUIDELINES & ADVISORIES
            // =================================================================
            const advisoriesContainer = document.getElementById('detail-advisories-container');
            if (advisoriesContainer) {
                if (advisories.length > 0) {
                    advisoriesContainer.innerHTML = advisories.map(adv => `
                        <div class="tourist-advisory-card">
                            <div class="advisory-header">
                                <span class="advisory-icon">${adv.icon || '🚨'}</span>
                                <div>
                                    <h4 class="advisory-title">${adv.title}</h4>
                                    <div class="advisory-date">Published: ${adv.date} • ${adv.category || 'Official Advisory'}</div>
                                </div>
                            </div>
                            <p class="advisory-content">${adv.content}</p>
                            ${adv.guidance ? `
                                <div class="advisory-guidance-box">
                                    <strong style="color:var(--tourist-text-heading); display:block; margin-bottom:0.25rem;">Authorized Guidance:</strong>
                                    <span>${adv.guidance}</span>
                                </div>
                            ` : ''}
                        </div>
                    `).join('');
                } else {
                    advisoriesContainer.innerHTML = `
                        <div class="tourist-advisory-card">
                            <div class="advisory-header">
                                <span class="advisory-icon">🌿</span>
                                <div>
                                    <h4 class="advisory-title">General Visitor Code & Eco-Preservation</h4>
                                    <div class="advisory-date">Standard Operating Protocol • YatraSetu Destination Network</div>
                                </div>
                            </div>
                            <p class="advisory-content">
                                Please respect local cultural customs, keep to designated trails, avoid littering, and refrain from using single-use plastic bottles.
                            </p>
                            <div class="advisory-guidance-box">
                                <strong style="color:var(--tourist-text-heading); display:block; margin-bottom:0.25rem;">Responsible Travel:</strong>
                                <span>Support certified local guides, pack out all personal waste, and observe high-altitude wildlife conservation rules.</span>
                            </div>
                        </div>
                    `;
                }
            }

            // =================================================================
            // TAB 7: REGIONAL CIRCUIT (NEARBY DESTINATIONS IN STATE)
            // =================================================================
            const nearbyGrid = document.getElementById('detail-nearby-grid');
            if (nearbyGrid) {
                if (nearbyDestinations.length > 0) {
                    nearbyGrid.innerHTML = nearbyDestinations.map(d => `
                        <a href="destination-detail.html?id=${d.id}" class="dest-state-card" style="text-decoration:none; display:block;">
                            <div class="dest-state-thumb" style="background-image: url('${d.img}'); height:140px; border-radius:10px; position:relative; background-size:cover; background-position:center;">
                                <span style="position:absolute; top:8px; left:8px; background:rgba(0,0,0,0.6); color:#fff; font-size:0.75rem; padding:2px 8px; border-radius:4px; font-weight:700;">#${d.rank || 1} in State</span>
                            </div>
                            <div style="padding: 0.75rem 0.25rem;">
                                <h4 style="font-size:0.95rem; font-weight:800; color:var(--tourist-text-heading); margin:0 0 0.25rem 0;">${d.name}</h4>
                                <div style="font-size:0.8rem; color:var(--tourist-text-muted);">${d.category}</div>
                            </div>
                        </a>
                    `).join('');
                } else {
                    nearbyGrid.innerHTML = `
                        <div style="grid-column: 1 / -1; padding: 2rem; text-align: center; background: var(--tourist-bg-subtle); border-radius: 10px; color: var(--tourist-text-muted); font-size: 0.88rem;">
                            No additional destinations in this regional circuit are registered in the current catalogue.
                        </div>
                    `;
                }
            }

            // =================================================================
            // TAB 8: REVIEWS & FEEDBACK
            // =================================================================
            const reviewsContainer = document.getElementById('detail-reviews-container');
            const renderReviewsList = () => {
                feedbackList = this.getDestinationFeedback(dest.id);
                if (tabReviewCount) tabReviewCount.textContent = feedbackList.length;

                if (!reviewsContainer) return;

                if (feedbackList.length > 0) {
                    reviewsContainer.innerHTML = feedbackList.map(item => `
                        <div class="tourist-review-card">
                            <div class="review-header">
                                <div class="review-author-wrap">
                                    <div class="review-avatar">${(item.author || 'T').charAt(0).toUpperCase()}</div>
                                    <div>
                                        <div class="review-author-name">${item.author}</div>
                                        <div class="review-date">${item.date} • Category: ${item.category || 'General'}</div>
                                    </div>
                                </div>
                                <div class="review-stars">${'★'.repeat(item.rating || 5)}${'☆'.repeat(5 - (item.rating || 5))}</div>
                            </div>
                            <p class="review-text">${item.text}</p>
                            ${item.is_user_submission ? `
                                <div style="display:inline-block; font-size:0.72rem; background:#D1FAE5; color:#065F46; padding:2px 8px; border-radius:4px; font-weight:700; margin-top:0.5rem;">
                                    ✓ Submitted by You (Persisted for session)
                                </div>
                            ` : `
                                <div style="display:inline-block; font-size:0.72rem; background:var(--tourist-bg-subtle); color:var(--tourist-forest); padding:2px 8px; border-radius:4px; font-weight:700; margin-top:0.5rem;">
                                    ✓ Verified Destination Manager Review Record
                                </div>
                            `}
                        </div>
                    `).join('');
                } else {
                    reviewsContainer.innerHTML = `
                        <div style="padding: 2.5rem; text-align: center; background: var(--tourist-bg-subtle); border-radius: 12px;">
                            <span style="font-size: 2.5rem; display: block; margin-bottom: 0.75rem;">✍️</span>
                            <h4 style="font-size: 1.1rem; color: var(--tourist-text-heading); margin: 0 0 0.5rem 0;">No Reviews Submitted Yet</h4>
                            <p style="font-size: 0.88rem; color: var(--tourist-text-muted); max-width: 480px; margin: 0 auto 1.25rem auto;">
                                Be the first traveler to share feedback, trail observations, and recommendations for ${dest.name}.
                            </p>
                            <button type="button" class="tourist-btn-primary" id="btn-empty-feedback" style="font-size:0.85rem;">Write First Review</button>
                        </div>
                    `;
                    const emptyBtn = reviewsContainer.querySelector('#btn-empty-feedback');
                    if (emptyBtn) emptyBtn.onclick = () => this.openFeedbackModal();
                }
            };

            renderReviewsList();

            // Wire Modals Event Listeners
            this.initModals(dest, () => renderReviewsList());

            // Tab Switching Logic
            const tabs = document.querySelectorAll('.detail-tab-btn');
            tabs.forEach(tab => {
                tab.onclick = () => {
                    tabs.forEach(t => t.classList.remove('active'));
                    tab.classList.add('active');
                    const tabKey = tab.getAttribute('data-tab');
                    document.querySelectorAll('.detail-tab-pane').forEach(p => {
                        p.style.display = p.getAttribute('data-pane') === tabKey ? 'block' : 'none';
                    });
                };
            });
        },

        /**
         * ----------------------------------------------------------------------
         * Modals Controller (Video, Stakeholder, Feedback)
         * ----------------------------------------------------------------------
         */
        openVideoModal(video) {
            const modal = document.getElementById('touristVideoModal');
            if (!modal) return;

            const titleEl = document.getElementById('video-modal-title');
            const pubEl = document.getElementById('video-modal-publisher');
            const descEl = document.getElementById('video-modal-desc');
            const durEl = document.getElementById('video-modal-duration');
            const extLink = document.getElementById('video-modal-external-link');
            const frameContainer = document.getElementById('video-player-frame-container');

            if (titleEl) titleEl.textContent = video.title;
            if (pubEl) pubEl.textContent = `Publisher: ${video.publisher || 'Department of Tourism'} (${video.category || 'Orientation'})`;
            if (descEl) descEl.textContent = video.description;
            if (durEl) durEl.textContent = `Duration: ~${video.duration || '0:30'}`;
            if (extLink) extLink.href = video.video_url;

            const ytId = this.extractYouTubeId(video.video_url);
            if (frameContainer && ytId) {
                frameContainer.innerHTML = `
                    <iframe 
                        src="https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&rel=0" 
                        title="${video.title}" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowfullscreen 
                        style="width: 100%; height: 100%; border: none;">
                    </iframe>
                `;
            }

            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        },

        closeVideoModal() {
            const modal = document.getElementById('touristVideoModal');
            if (!modal) return;
            const frameContainer = document.getElementById('video-player-frame-container');
            // Clear iframe to immediately stop video & audio playback
            if (frameContainer) frameContainer.innerHTML = '';
            modal.classList.remove('active');
            document.body.style.overflow = '';
        },

        openStakeholderModal(sh) {
            const modal = document.getElementById('touristStakeholderModal');
            if (!modal) return;

            const titleEl = document.getElementById('sh-modal-title');
            const catEl = document.getElementById('sh-modal-category');
            const descEl = document.getElementById('sh-modal-desc');
            const addrEl = document.getElementById('sh-modal-address');
            const hoursEl = document.getElementById('sh-modal-hours');
            const priceEl = document.getElementById('sh-modal-price');
            const contactEl = document.getElementById('sh-modal-contact');

            if (titleEl) titleEl.textContent = sh.name;
            if (catEl) catEl.textContent = `${sh.category} • Authorized Destination Partner`;
            if (descEl) descEl.textContent = sh.description;
            if (addrEl) addrEl.textContent = sh.address || 'Local Hub Office';
            if (hoursEl) hoursEl.textContent = sh.hours || '08:00 – 18:00';
            if (priceEl) priceEl.textContent = sh.price_range || 'Contact directly for quotes';
            if (contactEl) {
                contactEl.textContent = sh.contact || sh.email || 'Contact through Base Camp';
                contactEl.href = sh.contact ? `tel:${sh.contact.replace(/\s+/g, '')}` : `mailto:${sh.email || ''}`;
            }

            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        },

        closeStakeholderModal() {
            const modal = document.getElementById('touristStakeholderModal');
            if (!modal) return;
            modal.classList.remove('active');
            document.body.style.overflow = '';
        },

        openFeedbackModal() {
            const modal = document.getElementById('touristFeedbackModal');
            if (!modal) return;
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
            const nameInput = document.getElementById('fb-author-name');
            if (nameInput) nameInput.focus();
        },

        closeFeedbackModal() {
            const modal = document.getElementById('touristFeedbackModal');
            if (!modal) return;
            modal.classList.remove('active');
            document.body.style.overflow = '';
        },

        initModals(dest, onFeedbackAdded) {
            // Video Modal Closers
            const btnCloseVideo = document.getElementById('btn-close-video-modal');
            const videoModal = document.getElementById('touristVideoModal');
            if (btnCloseVideo) btnCloseVideo.onclick = () => this.closeVideoModal();
            if (videoModal) {
                videoModal.onclick = (e) => {
                    if (e.target === videoModal) this.closeVideoModal();
                };
            }

            // Stakeholder Modal Closers
            const btnCloseSh = document.getElementById('btn-close-sh-modal');
            const btnCloseShFooter = document.getElementById('btn-close-sh-modal-footer');
            const shModal = document.getElementById('touristStakeholderModal');
            if (btnCloseSh) btnCloseSh.onclick = () => this.closeStakeholderModal();
            if (btnCloseShFooter) btnCloseShFooter.onclick = () => this.closeStakeholderModal();
            if (shModal) {
                shModal.onclick = (e) => {
                    if (e.target === shModal) this.closeStakeholderModal();
                };
            }

            // Feedback Modal
            const btnOpenFb = document.getElementById('btn-open-feedback-modal');
            const btnCloseFb = document.getElementById('btn-close-fb-modal');
            const btnCancelFb = document.getElementById('btn-cancel-fb-modal');
            const fbModal = document.getElementById('touristFeedbackModal');
            const fbForm = document.getElementById('tourist-feedback-form');

            if (btnOpenFb) btnOpenFb.onclick = () => this.openFeedbackModal();
            if (btnCloseFb) btnCloseFb.onclick = () => this.closeFeedbackModal();
            if (btnCancelFb) btnCancelFb.onclick = () => this.closeFeedbackModal();
            if (fbModal) {
                fbModal.onclick = (e) => {
                    if (e.target === fbModal) this.closeFeedbackModal();
                };
            }

            // Handle Feedback Form Submission
            if (fbForm) {
                fbForm.onsubmit = (e) => {
                    e.preventDefault();
                    const name = (document.getElementById('fb-author-name') || {}).value || 'Guest Traveler';
                    const rating = parseInt((document.getElementById('fb-rating-select') || {}).value || '5', 10);
                    const category = (document.getElementById('fb-category-select') || {}).value || 'reviews';
                    const comments = (document.getElementById('fb-comments') || {}).value || '';

                    if (comments.trim().length < 10) {
                        alert('Please provide at least 10 characters of descriptive feedback to assist Destination Managers.');
                        return;
                    }

                    const newFeedbackItem = {
                        id: `fb-user-${Date.now()}`,
                        state_id: dest.state_id,
                        destination_id: dest.id,
                        destination: dest.name,
                        author: name.trim(),
                        rating: rating,
                        date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
                        category: category,
                        text: comments.trim(),
                        is_user_submission: true
                    };

                    // Persist to sessionStorage
                    try {
                        let existing = [];
                        const stored = sessionStorage.getItem('yatrasetu_tourist_feedback');
                        if (stored) existing = JSON.parse(stored);
                        existing.unshift(newFeedbackItem);
                        sessionStorage.setItem('yatrasetu_tourist_feedback', JSON.stringify(existing));
                    } catch (err) {
                        console.warn('Could not persist tourist feedback to sessionStorage:', err);
                    }

                    fbForm.reset();
                    this.closeFeedbackModal();
                    if (onFeedbackAdded) onFeedbackAdded();
                    this.showToast('Feedback submitted successfully! Thank you for supporting destination stewardship.');
                };
            }

            // Global ESC key closes active modal
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    this.closeVideoModal();
                    this.closeStakeholderModal();
                    this.closeFeedbackModal();
                }
            });
        }
    };

    // Expose globally for testing and interactive browser usage
    window.YatraSetuTouristApp = TouristApp;

    document.addEventListener('DOMContentLoaded', () => {
        TouristApp.init();
    });

})();

