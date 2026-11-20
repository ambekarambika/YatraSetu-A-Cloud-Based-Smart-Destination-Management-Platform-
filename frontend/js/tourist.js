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
            history_background: 'Originating in medieval antiquity under the Bahmani rulers as Murumdev, the fort was captured by Chhatrapati Shivaji Maharaj in 1646 at the age of 16. Recognizing its supreme natural elevation, he extensively fortified it, renamed it Rajgad (The King of Forts), and established it as the primary capital of the Maratha sovereign state (Swarajya) for over 26 years before the coronation at Raigad. The citadel served as the strategic command center during the consolidation of the Western Ghats and witnessed pivotal Maratha treaties.',
            heritage_architecture: 'Engineered as an impregnable triangular hill citadel perched at 2,700 feet above sea level, Rajgad is celebrated for its three expansive fortified sub-plateaus (machis): Padmavati Machi, Sanjivani Machi, and Suvela Machi. The construction features double-walled curtain bastions (chilkhati buruj), concealed sally ports (Chor Darwaza), and the iconic natural rock eyelet (Nedhe) perforated through a towering volcanic ridge on Suvela Machi.',
            cultural_significance: 'Revered across Maharashtra as a sacred temple of Maratha sovereignty. It enshrines the consecrated Padmavati Temple, houses the historic memorial Samadhi of Maharani Saibai, and remains the primary pilgrimage destination for annual trekking festivals, Shiv Jayanti rallies, and historical preservation summits.',
            geography_landmarks: 'Situated on a soaring volcanic spur in the Sahyadri ranges of the Western Ghats, bounded by the Kaal, Velvandi, and Gandhari river valleys. Prominent topographic landmarks include Padmavati Lake, the monumental Maha Darwaza, the Gunjavane approach stairs, Balekilla (the high royal citadel), and the sheer vertical drop of Takmak Tok.',
            traditions_culture: 'Sustained by local Mavala villager cooperatives from Gunjavane, Pali, and Sakhar. Traditions include community-led heritage trail maintenance, traditional pithla-bhakri and thecha rustic cuisine, and vocal povada ballad singing honoring Sahyadri history.',
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
            history_background: 'Dating back to the 2nd century BCE, the Lonavala-Khandala plateau was an essential arterial trade corridor linking the Arabian Sea ports of Kalyan and Chaul to the interior Deccan plateau. The trade route was fortified with hill redoubts such as Lohagad and Visapur and consecrated by ancient Buddhist monastic cave sanctuaries at Karla and Bhaja.',
            heritage_architecture: 'Features pristine rock-cut Buddhist architecture at Karla and Bhaja caves, showcasing colossal Chaitya halls with arched teakwood ribbing that has survived over 2,200 years, monolithic Ashokan stupas, and ancient vihara monk cells carved directly into basalt cliff faces.',
            cultural_significance: 'Celebrated as the heart of Sahyadri monsoon tourism and outdoor trekking culture, harmonizing ancient Buddhist contemplative heritage with Maharashtra’s celebrated mountain trail ethos.',
            geography_landmarks: 'Located along the crest of the Western Ghats at 2,047 feet, flanked by the Indrayani river basin, Duke\'s Nose (Nagphani) monolith, Tiger\'s Leap sheer precipice, and Bushi Lake cascading overflow.',
            traditions_culture: 'Famous for its traditional cottage candy industry (Lonavala Chikki, crushed peanut and jaggery fudge), artisanal fudge confectioneries, and seasonal farmer markets offering Western Ghats wild honey and berries.',
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
            history_background: 'Developed in the late 18th century by Raja Kesavadas, the Prime Minister of Travancore, who constructed the pier, canals, and warehousing infrastructure to establish a flourishing global coir and spice trading port connecting the Arabian Sea to the interior backwater network.',
            heritage_architecture: 'Distinguished by traditional Kettuvallam architecture—wooden cargo barges assembled from Anjili (wild jackfruit) wood planks tied securely with coir rope without a single iron nail, coated with boiled black resin and curved bamboo canopies.',
            cultural_significance: 'Epicenter of Kerala backwater folklore and the historic Nehru Trophy Snake Boat Race (Vallam Kali), which draws thousands of rhythmic rowers singing Vanchipattu boat songs on Punnamada Lake every monsoon.',
            geography_landmarks: 'Set within the unique Kuttanad delta system, one of the few places in the world where farming is practiced 1 to 3 meters below sea level, crisscrossed by Vembanad Lake, Pamba River, and vast emerald paddy wetlands.',
            traditions_culture: 'Rich riparian culture centered around toddy tapping, coir fiber spinning, duck farming, and the preparation of spicy freshwater Karimeen Pollichathu wrapped in banana leaves.',
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
            history_background: 'Founded in 967 CE by the Chanda clan of Meenas and later established by Raja Man Singh I in 1592 as the formidable royal seat of the Kachwaha Rajputs. Amer served as Rajasthan’s foremost strategic capital until Sawai Jai Singh II founded Jaipur in 1727.',
            heritage_architecture: 'A masterwork of Rajput-Mughal military and palace architecture, featuring yellow and pink sandstone battlements, marble courtyards, the world-famous Sheesh Mahal (Hall of Mirrors) inlaid with concave Belgian convex glass, and ancient Persian-wheel water lifting mechanisms.',
            cultural_significance: 'A UNESCO World Heritage Hill Fort embodying centuries of Rajput chivalry, ceremonial royal pageantry, and classical Dhundhar court traditions, home to the revered Shila Devi Temple.',
            geography_landmarks: 'Perched on the rugged Aravalli hill ranges overlooking Maota Lake and the Sun Gate (Suraj Pol), connected to the higher fortress of Jaigarh via subterranean defensive rampart corridors.',
            traditions_culture: 'Living artisanal heritage of blue pottery, Sanganeri block printing, Kathputli puppet chronicles, and Jaipur court classical music performances under the desert moonlight.',
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
    DESTINATION_EDITORIAL['rajgad-fort'] = DESTINATION_EDITORIAL['raigad-fort'];
    DESTINATION_EDITORIAL['amer-fort'] = DESTINATION_EDITORIAL['amber-fort'];

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
    DESTINATION_COORDINATES['rajgad-fort'] = DESTINATION_COORDINATES['raigad-fort'];
    DESTINATION_COORDINATES['amer-fort'] = DESTINATION_COORDINATES['amber-fort'];

    /**
     * Curated Multi-Image Visual Galleries
     * Verified photographs with perspectives, titles, and captions
     */
    const DESTINATION_GALLERIES = {
        'raigad-fort': [
            { url: '../assets/images/thumb-rajgad.jpg', title: 'Padmavati Machi Panoramic Ramparts', tag: 'Landscape Ridge', caption: 'Sweeping view across the vast fortifications of Padmavati Machi facing the Sahyadris.' },
            { url: '../assets/images/hero-maharashtra.jpg', title: 'Balekilla Highest Citadel Ascent', tag: 'Citadel Peak', caption: 'Steep stone steps ascending to the royal throne residence at Balekilla.' },
            { url: '../assets/images/thumb-rajgad.jpg', title: 'Mountaineous Trekking Route', tag: 'Trek Trail', caption: 'The rugged forest ascent from Gunjavane base village leading to Chor Darwaja.' },
            { url: '../assets/images/thumb-rajgad.jpg', title: 'Padmavati Temple Complex', tag: 'Sacred Heritage', caption: 'Historic stone shrine dedicated to Goddess Padmavati, offering shelter to heritage trekkers.' },
            { url: '../assets/images/hero-maharashtra.jpg', title: 'Sanjeevani Machi Triple Ramparts', tag: 'Military Architecture', caption: 'Massive multi-tiered defensive bastions engineered to protect the southern ridge.' },
            { url: '../assets/images/thumb-rajgad.jpg', title: 'Suvela Machi & Natural Needle Rock', tag: 'Natural Wonder', caption: 'The iconic natural rock arch (Nedhe) perforated through the sheer basalt ridge.' }
        ],
        'lonavala': [
            { url: '../assets/images/thumb-lonavala.jpg', title: "Tiger's Leap Cliff Viewpoint", tag: 'Scenic Valley', caption: 'Sheer 650-meter drop into the emerald valleys of Khandala and the Western Ghats.' },
            { url: '../assets/images/thumb-lonavala.jpg', title: 'Tiger Point Sunset Lookout', tag: 'Golden Hour', caption: 'Panoramic twilight view across winding mountain ghat roads and mist.' },
            { url: '../assets/images/thumb-ajanta.jpg', title: 'Karla Rock-Cut Buddhist Chaitya', tag: 'Ancient Caves', caption: 'Magnificent 2nd-century BC rock-cut vaulted prayer hall with ribbed teak ceilings.' },
            { url: '../assets/images/thumb-ajanta.jpg', title: 'Bhaja Caves Monolithic Stupas', tag: 'Monolithic Art', caption: 'Ancient Buddhist relic stupas sculpted into sheer Sahyadri cliff rock.' },
            { url: '../assets/images/thumb-lonavala.jpg', title: "Duke's Nose (Nagphani) Peak", tag: 'Adventure Trek', caption: 'Dramatic pointed cliff resembling a cobra hood, popular for rappelling.' },
            { url: '../assets/images/thumb-lonavala.jpg', title: 'Bhushi Dam Overflow Steps', tag: 'Monsoon Stream', caption: 'Gentle stepped water cascades active during peak July–August monsoon rainfall.' }
        ],
        'alleppey-backwaters': [
            { url: '../assets/images/hero-kerala.jpg', title: 'Traditional Kettuvallam Houseboat', tag: 'Waterway Cruise', caption: 'Handcrafted wooden houseboat thatched with coir and bamboo gliding on Vembanad Lake.' },
            { url: '../assets/images/hero-kerala.jpg', title: 'Vembanad Lake Horizon', tag: 'Serene Lagoon', caption: 'Tranquil sunset over India’s longest freshwater backwater lake network.' },
            { url: '../assets/images/hero-kerala.jpg', title: 'Snake Boat Regatta Racing', tag: 'Cultural Festival', caption: 'Chundan Vallams powered by 100 synchronized oarsmen battling in the annual trophy race.' },
            { url: '../assets/images/hero-kerala.jpg', title: 'Emerald Canal Pathways', tag: 'Canal Village', caption: 'Quiet palm-fringed channels connecting secluded island hamlets and coir weavers.' },
            { url: '../assets/images/hero-kerala.jpg', title: 'Kuttanad Below-Sea-Level Farms', tag: 'Bio-Heritage', caption: 'Unique UNESCO-recognized agricultural delta farmed 2 meters below sea level.' },
            { url: '../assets/images/hero-kerala.jpg', title: 'Marari Secluded Beach Coast', tag: 'Golden Shore', caption: 'Pristine fishing village beach lined with coconut palms and traditional kattumarams.' }
        ],
        'munnar-hills': [
            { url: '../assets/images/dest-munnar.jpg', title: 'Endless Rolling Tea Slopes', tag: 'Tea Plantations', caption: 'Manicured tea carpets stretching across the misty high ranges of Idukki.' },
            { url: '../assets/images/dest-munnar.jpg', title: 'Munnar Morning Mist Valleys', tag: 'Cloud Cover', caption: 'Cool mountain air hovering over plantation trails at dawn.' },
            { url: '../assets/images/hero-kerala.jpg', title: 'Eravikulam Nilgiri Tahr Habitat', tag: 'High-Altitude Wildlife', caption: 'Protected shola-grassland sanctuary preserving the endangered mountain ungulate.' },
            { url: '../assets/images/dest-munnar.jpg', title: 'Mattupetty Storage Dam & Lake', tag: 'Mountain Lake', caption: 'Peaceful reservoir cradled by evergreen hills and grazing elephants.' },
            { url: '../assets/images/dest-munnar.jpg', title: 'Anamudi Peak Summit Ridge', tag: 'Highest Peak', caption: 'The pinnacle of South India rising to 2,695 meters in the Western Ghats.' },
            { url: '../assets/images/dest-munnar.jpg', title: 'Attukal Cascading Falls', tag: 'Water Cascade', caption: 'Rushing mountain stream crashing through boulders and jungle greenery.' }
        ],
        'dal-lake-srinagar': [
            { url: '../assets/images/dest-manali.jpg', title: 'Dal Lake & Pir Panjal Mountains', tag: 'Alpine Mirror', caption: 'Mirror-still waters reflecting the snow-clad peaks of the Kashmir valley.' },
            { url: '../assets/images/dest-manali.jpg', title: 'Char Chinar Island Grove', tag: 'Historic Island', caption: 'Four century-old chinar trees planted on a royal island pavilion by Prince Murad Baksh.' },
            { url: '../assets/images/dest-manali.jpg', title: 'Canopied Wooden Shikara', tag: 'Traditional Boat', caption: 'Carved cedar-wood gondola floating through water lily pads and floating gardens.' },
            { url: '../assets/images/dest-manali.jpg', title: 'Dawn Floating Vegetable Market', tag: 'Living Heritage', caption: 'Centuries-old dawn trading conducted on boats amidst misty lake channels.' },
            { url: '../assets/images/dest-manali.jpg', title: 'Nishat Bagh Mughal Terraces', tag: 'Mughal Garden', caption: 'Twelve tiered terraces of water cascades, fountains, and vibrant flowerbeds.' },
            { url: '../assets/images/dest-manali.jpg', title: 'Heritage Houseboats in Sunset Glow', tag: 'Twilight Serenity', caption: 'Handcrafted walnut-wood houseboats bathed in amber evening illumination.' }
        ],
        'amber-fort': [
            { url: '../assets/images/dest-jaipur.jpg', title: 'Amer Fort Citadel & Maota Lake', tag: 'Royal Fort', caption: 'Imposing red sandstone and marble ramparts reflected in the calm waters of Maota Lake.' },
            { url: '../assets/images/dest-jaipur.jpg', title: 'Sheesh Mahal (Palace of Mirrors)', tag: 'Intricate Craft', caption: 'Convex Belgian glass mirrors embedded into floral plaster walls to capture candlelight.' },
            { url: '../assets/images/dest-jaipur.jpg', title: 'Ganesh Pol Royal Gate & Frescoes', tag: 'Rajput Murals', caption: 'Stunning three-story gateway adorned with classical vegetable-dye Rajput paintings.' },
            { url: '../assets/images/dest-jaipur.jpg', title: 'Diwan-e-Khas Marble Pavilion', tag: 'Hall of Audience', caption: 'Pillar hall designed for private royal councils with alabaster latticework.' },
            { url: '../assets/images/dest-jaipur.jpg', title: 'Kesar Kyari Floating Garden', tag: 'Mughal Garden', caption: 'Star-shaped geometric garden beds constructed in the center of Maota Lake.' },
            { url: '../assets/images/dest-jaipur.jpg', title: 'Evening Illumination & Sound Show', tag: 'Night Heritage', caption: 'Vibrant amber and crimson lighting highlighting fort ramparts against the night sky.' }
        ]
    };
    DESTINATION_GALLERIES['rajgad-fort'] = DESTINATION_GALLERIES['raigad-fort'];
    DESTINATION_GALLERIES['amer-fort'] = DESTINATION_GALLERIES['amber-fort'];

    const DESTINATION_ID_ALIASES = {
        'raigad-fort': ['raigad-fort', 'rajgad-fort'],
        'rajgad-fort': ['rajgad-fort', 'raigad-fort'],
        'amber-fort': ['amber-fort', 'amer-fort'],
        'amer-fort': ['amer-fort', 'amber-fort']
    };

    function matchesDestId(id1, id2) {
        if (!id1 || !id2) return false;
        if (id1 === id2) return true;
        const a1 = DESTINATION_ID_ALIASES[id1];
        if (a1 && a1.includes(id2)) return true;
        const a2 = DESTINATION_ID_ALIASES[id2];
        if (a2 && a2.includes(id1)) return true;
        return false;
    }

    /**
     * Curated Editorial Details for Verified Attractions
     */
    const ATTRACTION_EDITORIAL = {
        'attr-padmavati-temple': {
            timings: '06:00 AM – 06:30 PM (Daily)',
            duration: '45 – 60 Minutes',
            bestTime: 'Sunrise or early morning during temple aarti',
            guidelines: 'Remove footwear before stepping onto the inner stone sabhamandap. Maintain quiet reverence.',
            description: 'A stone shrine dedicated to Goddess Padmavati, the guardian deity of Rajgad Fort. Built during the era of Chhatrapati Shivaji Maharaj, the temple features a traditional sabhamandap and stone pillars. Trekkers often rest in its courtyard before making the final push to Balekilla.'
        },
        'attr-tigers-leap': {
            timings: '06:00 AM – 06:30 PM (Daily)',
            duration: '1 – 2 Hours',
            bestTime: 'Early morning to catch valleys clearing or late sunset',
            guidelines: 'Stay behind designated safety railings. Sheer vertical drop into the valley below.',
            description: 'A cliff-top viewpoint with a sheer drop of over 650 meters that resembles a leaping tiger when viewed from the valley. It provides sweeping views of the Western Ghats, seasonal waterfalls, and the curving railway tracks through the Khandala Ghat pass.'
        },
        'attr-vembanad-houseboats': {
            timings: 'Day Cruise: 11:30 AM – 05:30 PM | Overnight Check-in: 12:30 PM',
            duration: 'Half-Day to Overnight Stay',
            bestTime: 'September to March for pleasant breeze and calm waters',
            guidelines: 'Ensure houseboats carry valid government tourism safety certification and life jackets.',
            description: 'Traditional kettuvallams converted into luxurious eco-friendly floating residences. Powered through palm-shaded canals and the open expanse of Vembanad Lake, providing freshly cooked Kuttanad cuisine and views of rural backwater village life.'
        },
        'attr-eravikulam-np': {
            timings: '07:30 AM – 04:00 PM (Closed Feb–Mar for calving season)',
            duration: '2.5 – 3.5 Hours',
            bestTime: '08:00 AM – 10:30 AM for active Nilgiri Tahr sightings',
            guidelines: 'Book forest department safari bus entry online in advance. Plastic-free zone.',
            description: 'Kerala’s first national park, set across rolling high-altitude shola grasslands. It is home to the largest surviving population of the endangered Nilgiri Tahr (mountain goat) and blooms with the rare purple Neelakurinji flowers once every twelve years.'
        },
        'attr-char-chinar': {
            timings: '07:00 AM – 07:00 PM (Accessible via Shikara)',
            duration: '1 Hour',
            bestTime: 'Late afternoon when the Pir Panjal mountains turn golden',
            guidelines: 'Do not disembark on the fragile root systems of the historic chinar trees.',
            description: 'A picturesque island located in the Ropa Lank basin of Dal Lake, famous for four magnificent Chinar trees planted symmetrically by Murad Baksh, brother of Mughal Emperor Aurangzeb. A quintessential postcard view of Srinagar.'
        },
        'attr-sheesh-mahal': {
            timings: '09:00 AM – 05:00 PM | Night Show: 06:30 PM – 09:00 PM',
            duration: '1 – 1.5 Hours',
            bestTime: 'Morning for optimal sunlight reflection or during evening illumination',
            guidelines: 'Touching the mirror inlays is prohibited to preserve fragile historic plasterwork.',
            description: 'The Hall of Mirrors within Amer Fort, designed with intricate Belgian convex mirror mosaics and colored glass set into carved marble and lime plaster. When illuminated by a single candle at night, the entire hall glitters like a starry night sky.'
        },
        'attr-baga-water-sports': {
            timings: '08:30 AM – 06:00 PM (Subject to sea conditions)',
            duration: '2 – 3 Hours',
            bestTime: 'October to May (Operations suspend during monsoon rough seas)',
            guidelines: 'Wear approved life jackets at all times. Use certified operators carrying department badges.',
            description: 'A bustling shoreline adventure hub offering parasailing with bird’s-eye views of Baga Beach, jet-ski circuits, banana boat rides, and bumper rides monitored by certified local water safety supervisors.'
        },
        'attr-thousand-pillar-hall': {
            timings: '05:00 AM – 12:30 PM | 04:00 PM – 09:30 PM',
            duration: '1.5 – 2 Hours',
            bestTime: 'Morning hours for quiet contemplation of architectural details',
            guidelines: 'Dress code: Shoulders and knees must be covered. Photography permits strictly required.',
            description: 'An architectural wonder built in 1569 by Ariyanatha Mudaliar inside Meenakshi Amman Temple. Features 985 exquisitely carved stone pillars portraying mythical yalis, gods, and musicians, along with musical pillars that emit distinct notes when tapped.'
        },
        'attr-triveni-ghat-aarti': {
            timings: 'Maha Aarti starts at 06:00 PM (Winter) / 06:45 PM (Summer)',
            duration: '1.5 Hours',
            bestTime: 'Arrive by 05:30 PM to secure seating near the river steps',
            guidelines: 'Remove footwear before stepping onto the paved ghat steps. Dispose of leaf diya lamps responsibly.',
            description: 'The sacred confluence of the Ganges, Yamuna, and Saraswati rivers where the daily evening Maha Aarti is conducted with chanting Vedic hymns, rhythmic drums, and multi-tiered brass oil lamps floated on the flowing river.'
        },
        'attr-kaziranga-elephant-safari': {
            timings: '05:30 AM – 07:30 AM (Two early morning batches)',
            duration: '1 Hour',
            bestTime: 'First morning slot at 05:30 AM for misty encounters with rhinos',
            guidelines: 'Pre-book at Western (Bagori) or Central (Kohora) range offices. Maintain absolute silence.',
            description: 'An early-morning guided wildlife safari that allows visitors to traverse high elephant-grass floodplains quietly and observe the prehistoric Great Indian One-Horned Rhinoceros, swamp deer, and wild water buffalo up close.'
        }
    };

    /**
     * Curated Experiences & Outdoor Trails Catalog (Single Source of Truth)
     */
    const EXPERIENCES_DATA = [
        {
            id: 'exp-rajgad-trek',
            state_id: 'maharashtra',
            destination_id: 'raigad-fort',
            title: 'Monsoon Rajgad Fort Citadel Trek',
            category: 'trekking',
            category_label: 'Trekking & Hiking',
            location: 'Pune / Raigad, Maharashtra',
            duration: '5 - 6 Hours',
            difficulty: 'Moderate - Difficult',
            season: 'Jul – Feb',
            guide: 'Certified Guide Recommended',
            img: '../assets/images/thumb-rajgad.jpg',
            desc: 'High-ridge mountain ascent starting from Gunjavane village to Padmavati Machi and the supreme royal citadel of Balekilla with panoramic Sahyadri views.',
            gear: 'Ankle-support trekking boots, 2.5L water, windcheater in monsoon, and hiking pole.'
        },
        {
            id: 'exp-padmavati-machhi',
            state_id: 'maharashtra',
            destination_id: 'raigad-fort',
            title: 'Padmavati Machi Heritage Bastion Exploration',
            category: 'heritage',
            category_label: 'Heritage & Architecture',
            location: 'Rajgad Fort, Maharashtra',
            duration: '3 Hours',
            difficulty: 'Moderate',
            season: 'Oct – Mar',
            guide: 'Heritage Guide Recommended',
            img: '../assets/images/thumb-rajgad.jpg',
            desc: 'In-depth historical exploration of the royal court grounds, ancient Padmavati temple, water tanks, and the monumental sally-ports of the Maratha capital.',
            gear: 'Comfortable walking shoes, wide-brim hat, camera, and hydration pack.'
        },
        {
            id: 'exp-suvela-nedhe',
            state_id: 'maharashtra',
            destination_id: 'raigad-fort',
            title: 'Suvela Machi Nedhe Rock-Eyelet Ridge Walk',
            category: 'nature',
            category_label: 'Nature & Wildlife',
            location: 'Rajgad Fort, Maharashtra',
            duration: '3 - 4 Hours',
            difficulty: 'Difficult',
            season: 'Oct – Feb',
            guide: 'Mandatory Certified Guide',
            img: '../assets/images/thumb-rajgad.jpg',
            desc: 'Trek along the narrow volcanic spine of Suvela Machi to reach the colossal natural rock hole (Nedhe) perforated through the sheer basalt mountain edge.',
            gear: 'Grip shoes, safety tether, headlamp, and high energy snacks.'
        },
        {
            id: 'exp-lonavala-karla',
            state_id: 'maharashtra',
            destination_id: 'lonavala',
            title: 'Karla & Bhaja Rock-Cut Buddhist Cave Exploration',
            category: 'heritage',
            category_label: 'Heritage & Architecture',
            location: 'Lonavala, Maharashtra',
            duration: '3 Hours',
            difficulty: 'Easy - Moderate',
            season: 'Oct – Mar',
            guide: 'Archaeological Guide Available',
            img: '../assets/images/thumb-lonavala.jpg',
            desc: 'Discover 2,200-year-old Buddhist Chaitya halls, monolithic stone stupas, and ancient Ashokan inscriptions carved into the Western Ghats cliffs.',
            gear: 'Comfortable footwear for stone stairs, sun protection, and camera.'
        },
        {
            id: 'exp-tigers-leap-hike',
            state_id: 'maharashtra',
            destination_id: 'lonavala',
            title: 'Khandala Valley & Tiger’s Leap Sunrise Hike',
            category: 'trekking',
            category_label: 'Trekking & Hiking',
            location: 'Khandala / Lonavala, Maharashtra',
            duration: '2.5 Hours',
            difficulty: 'Moderate',
            season: 'Jul – Mar',
            guide: 'Local Guide Available',
            img: '../assets/images/dest-manali.jpg',
            desc: 'Early morning hike along the Khandala ridge with views overlooking 650-meter vertical sheer cliffs, seasonal waterfalls, and misty mountain passes.',
            gear: 'Trekking shoes, warm light jacket for dawn breeze, and water bottle.'
        },
        {
            id: 'exp-alleppey-houseboat',
            state_id: 'kerala',
            destination_id: 'alleppey-backwaters',
            title: 'Vembanad Heritage Houseboat Cruise',
            category: 'water',
            category_label: 'Water & Coastal',
            location: 'Alappuzha, Kerala',
            duration: 'Half-Day / Overnight',
            difficulty: 'Leisure / Easy',
            season: 'Sep – Mar',
            guide: 'Licensed Captain & Crew',
            img: '../assets/images/hero-kerala.jpg',
            desc: 'Cruise along the tranquil palm-shaded canals of Vembanad Lake on a traditional coir-tied Kettuvallam, accompanied by authentic freshly cooked Kuttanad meals.',
            gear: 'Sun hat, sunglasses, cotton attire, and mosquito repellent.'
        },
        {
            id: 'exp-alleppey-canoe',
            state_id: 'kerala',
            destination_id: 'alleppey-backwaters',
            title: 'Kuttanad Village Coir Weaving & Canoe Tour',
            category: 'spiritual',
            category_label: 'Cultural & Spiritual',
            location: 'Alappuzha, Kerala',
            duration: '3 Hours',
            difficulty: 'Easy',
            season: 'Oct – Apr',
            guide: 'Community Eco-Guide',
            img: '../assets/images/hero-kerala.jpg',
            desc: 'Navigate narrow shallow village canals by traditional hand-paddled country canoe to meet local coir spinning artisans and learn about below-sea-level paddy farming.',
            gear: 'Light clothing, rain poncho, and cash for village handicraft stalls.'
        },
        {
            id: 'exp-munnar-tea-trek',
            state_id: 'kerala',
            destination_id: 'munnar-hills',
            title: 'Kolukkumalai High-Altitude Tea Estate Trail',
            category: 'trekking',
            category_label: 'Trekking & Hiking',
            location: 'Munnar, Kerala',
            duration: '4 Hours',
            difficulty: 'Moderate',
            season: 'Sep – Apr',
            guide: 'Certified Plantation Guide',
            img: '../assets/images/dest-munnar.jpg',
            desc: 'Traverse the world’s highest organic tea plantations at 7,900 feet with cloud-covered valley vistas and visit an authentic century-old orthodox tea factory.',
            gear: 'Light woolens, hiking boots, camera, and hydration pack.'
        },
        {
            id: 'exp-eravikulam-tahr',
            state_id: 'kerala',
            destination_id: 'munnar-hills',
            title: 'Eravikulam Nilgiri Tahr & Shola Grassland Walk',
            category: 'nature',
            category_label: 'Nature & Wildlife',
            location: 'Eravikulam National Park, Munnar',
            duration: '3 Hours',
            difficulty: 'Moderate',
            season: 'Sep – Feb',
            guide: 'Forest Warden Escorted',
            img: '../assets/images/dest-munnar.jpg',
            desc: 'Observe the rare and endangered Nilgiri Tahr in their native montane grassland habitat beneath the soaring granite slopes of Anamudi Peak.',
            gear: 'Warm layer, binoculars, camera with zoom lens, and zero-plastic bottles.'
        },
        {
            id: 'exp-amer-sheesh',
            state_id: 'rajasthan',
            destination_id: 'amber-fort',
            title: 'Amer Fort Sheesh Mahal & Royal Courts Walk',
            category: 'heritage',
            category_label: 'Heritage & Architecture',
            location: 'Amer, Jaipur, Rajasthan',
            duration: '3 Hours',
            difficulty: 'Easy Walking',
            season: 'Oct – Mar',
            guide: 'Certified Heritage Guide',
            img: '../assets/images/dest-jaipur.jpg',
            desc: 'Explore Rajput-Mughal architectural synthesis, intricate Belgian glass inlay mosaics at Sheesh Mahal, Diwan-e-Khas courtyards, and ancient Persian waterwheels.',
            gear: 'Comfortable walking shoes, sun hat, and camera.'
        },
        {
            id: 'exp-amer-light-sound',
            state_id: 'rajasthan',
            destination_id: 'amber-fort',
            title: 'Amer Fort Ramparts Light & Sound Evening Show',
            category: 'spiritual',
            category_label: 'Cultural & Spiritual',
            location: 'Amer Fort, Jaipur, Rajasthan',
            duration: '1.5 Hours',
            difficulty: 'Leisure / Seated',
            season: 'Oct – Mar',
            guide: 'Narrated Historical Soundscape',
            img: '../assets/images/dest-jaipur.jpg',
            desc: 'A vivid evening historical chronicle illuminating the 600-year history of the Kachwaha dynasty against the dramatic backdrop of Amer’s sandstone battlements.',
            gear: 'Warm evening shawl or jacket during winter months.'
        },
        {
            id: 'exp-dal-lake-shikara',
            state_id: 'kashmir',
            destination_id: 'dal-lake-srinagar',
            title: 'Dawn Shikara Floating Market & Lotus Garden Cruise',
            category: 'water',
            category_label: 'Water & Coastal',
            location: 'Dal Lake, Srinagar, Kashmir',
            duration: '2.5 Hours',
            difficulty: 'Leisure / Easy',
            season: 'Apr – Nov',
            guide: 'Traditional Shikara Boatman',
            img: '../assets/images/dest-manali.jpg',
            desc: 'Glide through morning mist on Dal Lake to observe traditional vegetable bartering among lakeside growers, drifting past blooming lotus pods and Char Chinar island.',
            gear: 'Warm morning jacket, camera, and cash for floating flower vendors.'
        },
        {
            id: 'exp-hazratbal-walk',
            state_id: 'kashmir',
            destination_id: 'dal-lake-srinagar',
            title: 'Hazratbal Promenade & Chinar Heritage Walk',
            category: 'spiritual',
            category_label: 'Cultural & Spiritual',
            location: 'Srinagar, Jammu & Kashmir',
            duration: '2 Hours',
            difficulty: 'Easy',
            season: 'Apr – Oct',
            guide: 'Local Cultural Guide',
            img: '../assets/images/dest-manali.jpg',
            desc: 'Stroll along the historic waterfront promenade facing the white marble dome of Hazratbal, surrounded by ancient Mughal chinar groves and artisan woodcarvers.',
            gear: 'Modest respectful attire covering shoulders and headscarf for shrines.'
        },
        {
            id: 'exp-old-goa-walk',
            state_id: 'goa',
            destination_id: 'old-goa-churches',
            title: 'UNESCO Basilicas & Portuguese Baroque Heritage Walk',
            category: 'heritage',
            category_label: 'Heritage & Architecture',
            location: 'Old Goa, Goa',
            duration: '2.5 Hours',
            difficulty: 'Easy Walking',
            season: 'Oct – Apr',
            guide: 'Historian Led Walk',
            img: '../assets/images/dest-goa.jpg',
            desc: 'Walk through the Basilica of Bom Jesus, Sé Cathedral, and Church of St. Francis of Assisi, exploring 16th-century Manueline and Baroque stone craftsmanship.',
            gear: 'Respectful attire for religious shrines and comfortable sandals.'
        },
        {
            id: 'exp-calangute-water',
            state_id: 'goa',
            destination_id: 'calangute-coast',
            title: 'Calangute Coastal Catamaran & Dolphin Sighting Cruise',
            category: 'water',
            category_label: 'Water & Coastal',
            location: 'Calangute / Baga Coast, Goa',
            duration: '2 Hours',
            difficulty: 'Easy',
            season: 'Oct – May',
            guide: 'Certified Coastal Skipper',
            img: '../assets/images/dest-goa.jpg',
            desc: 'Sail on an open-sea catamaran along North Goa’s golden coast to spot Indo-Pacific humpback dolphins playing in the Arabian Sea waves.',
            gear: 'Life jacket (provided), sunglasses, sunscreen, and water-resistant bag.'
        },
        {
            id: 'exp-meenakshi-heritage',
            state_id: 'tamilnadu',
            destination_id: 'meenakshi-amman-temple',
            title: 'Madurai Meenakshi Thousand Pillar Hall Heritage Tour',
            category: 'spiritual',
            category_label: 'Cultural & Spiritual',
            location: 'Madurai, Tamil Nadu',
            duration: '2.5 Hours',
            difficulty: 'Easy Walking',
            season: 'Oct – Mar',
            guide: 'Temple Certified Guide',
            img: '../assets/images/dest-hampi.jpg',
            desc: 'Marvel at 985 sculpted granite pillars, musical acoustic columns, Dravidian temple gopurams soaring over 50 meters, and sacred golden lotus pond precincts.',
            gear: 'Strict traditional modest dress code (no shorts/sleeveless), socks for warm stone.'
        },
        {
            id: 'exp-kaziranga-safari',
            state_id: 'assam',
            destination_id: 'kaziranga-national-park',
            title: 'Kaziranga Central Range Rhino Jeep Safari',
            category: 'nature',
            category_label: 'Nature & Wildlife',
            location: 'Kohora, Kaziranga, Assam',
            duration: '3.5 Hours',
            difficulty: 'Moderate Ride',
            season: 'Nov – Apr',
            guide: 'Government Forest Naturalist',
            img: '../assets/images/hero-india.jpg',
            desc: 'Traverse elephant-grass marshes and water hyacinth swamps to track the prehistoric Great Indian One-Horned Rhino, wild elephants, and migratory water birds.',
            gear: 'Binoculars, telephoto camera, neutral-toned clothing (khaki/green), and dust mask.'
        },
        {
            id: 'exp-rishikesh-aarti',
            state_id: 'uttarakhand',
            destination_id: 'rishikesh-ganga-ghats',
            title: 'Triveni Ghat Evening Ganga Aarti & Sacred Chants',
            category: 'spiritual',
            category_label: 'Cultural & Spiritual',
            location: 'Rishikesh, Uttarakhand',
            duration: '2 Hours',
            difficulty: 'Leisure / Easy',
            season: 'All Year',
            guide: 'Ashram Coordinator',
            img: '../assets/images/dest-varanasi.jpg',
            desc: 'Experience the mystical evening prayers on the banks of the sacred Ganges river with multi-tiered brass lamps, conch shells, and floating flower diyas.',
            gear: 'Comfortable footwear (removed at ghat steps), modest attire, and coin offerings.'
        }
    ];

    /**
     * Curated Multi-Day Regional Travel Circuits
     */
    const CURATED_ITINERARIES = {
        mh: {
            title: 'Maharashtra Maratha Fort & Western Ghats Trail',
            duration: '3 Days / 2 Nights',
            theme: 'Heritage Forts & Mountain Treks',
            days: [
                {
                    day: 1,
                    dest: 'Rajgad Fort',
                    destId: 'raigad-fort',
                    loc: 'Velhe, Pune District',
                    time: '06:00 AM – 05:00 PM',
                    highlight: 'Historical citadel climb, Padmavati Machi, and royal palace ruins.',
                    desc: 'Begin at dawn from Gunjavane base village. Ascend via Chor Darwaja to Padmavati plateau. Explore the temple, water tanks, and hike up to the supreme citadel of Balekilla for 360° Sahyadri views.'
                },
                {
                    day: 2,
                    dest: 'Torna Fort & Sahyadri Valleys',
                    destId: 'raigad-fort',
                    loc: 'Velhe, Maharashtra',
                    time: '07:00 AM – 04:30 PM',
                    highlight: 'Highest hill fort in Pune district, Zunjar Machi, and alpine ridge traverse.',
                    desc: 'Embark on the dramatic ridge trail between Rajgad and Torna. Traverse massive stone ramparts and examine the bastion architecture of the first fort captured by Shivaji Maharaj in 1646.'
                },
                {
                    day: 3,
                    dest: 'Lonavala & Karla Caves',
                    destId: 'lonavala',
                    loc: 'Western Ghats, Maharashtra',
                    time: '08:30 AM – 06:00 PM',
                    highlight: 'Ancient Buddhist rock-cut monasteries and dramatic valley viewpoints.',
                    desc: 'Descend to Lonavala hill station. Explore the monolithic 2nd-century BC Karla and Bhaja caves, visit Tiger’s Leap lookout for valley panoramas, and taste local artisanal chikki sweets.'
                }
            ]
        },
        kl: {
            title: 'Kerala Backwaters & Western Ghats Nature Circuit',
            duration: '4 Days / 3 Nights',
            theme: 'Backwaters, Tea Valleys & Eco-Tourism',
            days: [
                {
                    day: 1,
                    dest: 'Fort Kochi Heritage Port',
                    destId: 'fort-kochi',
                    loc: 'Kochi, Kerala',
                    time: '08:00 AM – 06:00 PM',
                    highlight: 'Chinese fishing nets, colonial spice warehouses, and Kathakali cultural theater.',
                    desc: 'Walk along the historic Fort Kochi harbor. Witness the counterweight-operated Chinese fishing nets, explore Jew Town and spice markets, and conclude with an evening Kathakali classical dance recital.'
                },
                {
                    day: 2,
                    dest: 'Munnar Tea Plantations',
                    destId: 'munnar-hills',
                    loc: 'Idukki, Kerala',
                    time: '07:30 AM – 05:30 PM',
                    highlight: 'Scenic ghat ascent, century-old tea estates, and Tata Tea Museum.',
                    desc: 'Drive through misty mountain passes into Munnar. Tour organic tea gardens, understand artisanal tea manufacturing at the Tea Museum, and take an evening walk through scented cardamom groves.'
                },
                {
                    day: 3,
                    dest: 'Eravikulam National Park',
                    destId: 'munnar-hills',
                    loc: 'Munnar, Kerala',
                    time: '07:00 AM – 03:00 PM',
                    highlight: 'High-altitude shola grasslands, Nilgiri Tahr sightings, and Anamudi peak views.',
                    desc: 'Board the national park safari bus to the high-altitude plateau of Eravikulam. Observe the endangered Nilgiri Tahr grazing on steep grassy slopes beneath South India’s highest mountain.'
                },
                {
                    day: 4,
                    dest: 'Alappuzha Backwaters',
                    destId: 'alleppey-backwaters',
                    loc: 'Alappuzha, Kerala',
                    time: '11:00 AM – 06:00 PM',
                    highlight: 'Kettuvallam houseboat cruise along palm-fringed lagoons and Vembanad Lake.',
                    desc: 'Embark on a traditional thatch-roofed houseboat from Punnamada jetty. Glide through peaceful palm-lined canals, observe village duck farming, and enjoy a fresh traditional banana-leaf Karimeen meal.'
                }
            ]
        },
        rj: {
            title: 'Rajasthan Royal Fortresses & Desert Trail',
            duration: '5 Days / 4 Nights',
            theme: 'Imperial Palaces, Forts & Desert Culture',
            days: [
                {
                    day: 1,
                    dest: 'Amer Fort & Jaipur Heritage',
                    destId: 'amber-fort',
                    loc: 'Jaipur, Rajasthan',
                    time: '08:00 AM – 06:30 PM',
                    highlight: 'Sheesh Mahal mirror mosaics, royal courtyards, and Maota Lake views.',
                    desc: 'Explore the monumental hilltop palace-fort of Amer. Walk through Ganesh Pol, marvel at the optical wonders of Sheesh Mahal, and view the pink-hued cityscape from fort ramparts.'
                },
                {
                    day: 2,
                    dest: 'Mehrangarh Fort',
                    destId: 'mehrangarh-fort',
                    loc: 'Jodhpur, Rajasthan',
                    time: '09:00 AM – 05:00 PM',
                    highlight: 'Basalt cliff citadel, royal palanquin gallery, and blue city panoramas.',
                    desc: 'Travel to the Blue City. Ascend to Mehrangarh Fort towering 400 feet above the city on a sheer cliff. Admire carved red sandstone latticework, historic cannon bastions, and armory.'
                },
                {
                    day: 3,
                    dest: 'Jaisalmer Living Fort',
                    destId: 'jaisalmer-desert',
                    loc: 'Jaisalmer, Rajasthan',
                    time: '08:30 AM – 06:00 PM',
                    highlight: 'Golden sandstone ramparts, medieval havelis, and Jain temple carvings.',
                    desc: 'Arrive in the golden city. Walk inside Sonar Qila—one of the world’s few living forts where thousands still reside. Admire the intricate stone filigree of Patwon Ki Haveli.'
                },
                {
                    day: 4,
                    dest: 'Thar Desert Sam Sand Dunes',
                    destId: 'jaisalmer-desert',
                    loc: 'Thar Desert, Rajasthan',
                    time: '04:00 PM – 10:00 PM',
                    highlight: 'Sunset camel ride, golden sand ridges, and folk Kalbelia music under the stars.',
                    desc: 'Head out into the rolling desert dunes of Sam. Experience golden sunset across shifting sand ripples followed by an authentic desert camp featuring Manganiyar musical chronicles.'
                },
                {
                    day: 5,
                    dest: 'Udaipur City Palace & Lake Pichola',
                    destId: 'udaipur-city-palace',
                    loc: 'Udaipur, Rajasthan',
                    time: '09:00 AM – 05:00 PM',
                    highlight: 'Mewar royal palace complex, crystal gallery, and sunset boat cruise.',
                    desc: 'Conclude in the City of Lakes. Wander through the four-century-old City Palace complex with panoramic views of the Lake Palace floating gracefully on azure waters of Lake Pichola.'
                }
            ]
        },
        goa: {
            title: 'Goa Coastal Heritage & Waterfall Circuit',
            duration: '3 Days / 2 Nights',
            theme: 'Churches, Forts & Ocean Horizons',
            days: [
                {
                    day: 1,
                    dest: 'Old Goa UNESCO Basilicas',
                    destId: 'old-goa-churches',
                    loc: 'Old Goa, Goa',
                    time: '08:30 AM – 04:30 PM',
                    highlight: 'Baroque architecture, Basilica of Bom Jesus, and Sé Cathedral.',
                    desc: 'Begin exploration of Old Goa’s 16th-century religious architecture. Tour the sacred relics of St. Francis Xavier, observe gilded wood altars, and stroll through historic monastic courtyards.'
                },
                {
                    day: 2,
                    dest: 'Fort Aguada & Coastal Lighthouse',
                    destId: 'calangute-coast',
                    loc: 'Sinquerim, Goa',
                    time: '09:00 AM – 06:00 PM',
                    highlight: '17th-century Portuguese fortress, giant freshwater cistern, and Arabian Sea views.',
                    desc: 'Explore the coastal artillery ramparts overlooking the mouth of the Mandovi River. Walk along the upper fort battlement walls and view the historic four-story lighthouse built in 1864.'
                },
                {
                    day: 3,
                    dest: 'Dudhsagar Waterfalls & Spice Plantation',
                    destId: 'calangute-coast',
                    loc: 'Mollem, Goa',
                    time: '07:00 AM – 04:00 PM',
                    highlight: 'Four-tiered milky waterfall, Bhagwan Mahavir Wildlife Sanctuary, and organic spice trail.',
                    desc: 'Embark on a morning 4x4 jungle jeep safari through Western Ghats forests to witness the roaring Dudhsagar falls cascading 310 meters down sheer rock cliffs.'
                }
            ]
        },
        jk: {
            title: 'Kashmir Alpine Valleys & Dal Lake Circuit',
            duration: '4 Days / 3 Nights',
            theme: 'Lakes, Meadows & Himalayan Panoramas',
            days: [
                {
                    day: 1,
                    dest: 'Dal Lake & Mughal Terraced Gardens',
                    destId: 'dal-lake-srinagar',
                    loc: 'Srinagar, Jammu & Kashmir',
                    time: '07:00 AM – 06:00 PM',
                    highlight: 'Dawn Shikara ride, Char Chinar island, Shalimar Bagh, and Nishat Bagh.',
                    desc: 'Start with a morning glide past floating lotus gardens. Disembark at Nishat Bagh and Shalimar Bagh to explore cascading water channels and centuries-old chinar tree avenues.'
                },
                {
                    day: 2,
                    dest: 'Gulmarg Meadow of Flowers & Gondola',
                    destId: 'dal-lake-srinagar',
                    loc: 'Gulmarg, Kashmir',
                    time: '08:00 AM – 05:00 PM',
                    highlight: 'High-altitude gondola ascent to Apharwat Peak at 13,780 ft and alpine meadows.',
                    desc: 'Drive to Gulmarg through pine-covered slopes. Board the two-stage Gulmarg Gondola for panoramic views of snow-clad peaks and alpine skiing slopes.'
                },
                {
                    day: 3,
                    dest: 'Pahalgam & Lidder River Valley',
                    destId: 'dal-lake-srinagar',
                    loc: 'Pahalgam, Kashmir',
                    time: '08:30 AM – 05:30 PM',
                    highlight: 'Glacial river trails, Betaab Valley, and saffron fields of Pampore.',
                    desc: 'Follow the rushing crystal-clear Lidder River to the scenic meadows of Betaab Valley and Aru. Stop along the highway to experience traditional saffron cultivation.'
                },
                {
                    day: 4,
                    dest: 'Old Srinagar Artisans & Jamia Masjid',
                    destId: 'dal-lake-srinagar',
                    loc: 'Old City, Srinagar',
                    time: '09:00 AM – 04:00 PM',
                    highlight: 'Wooden Deodar architecture, walnut woodcraft workshops, and Pashmina weaving.',
                    desc: 'Walk through the historical Downtown Srinagar along the Jhelum river. Tour the 378 deodar-columned Jamia Masjid and watch master artisans handcraft papier-mâché and carpets.'
                }
            ]
        }
    };

    /**
     * Curated Travel Stories & Chronicles
     */
    const TRAVEL_STORIES = [
        {
            id: 'story-rajgad-sunrise',
            title: 'Conquering Padmavati Machi at Sunrise: A Trekker’s Chronicle of Rajgad Fort',
            author: 'Ananya Sharma',
            readTime: '4 min read',
            category: 'Heritage & Trekking',
            destId: 'raigad-fort',
            img: '../assets/images/thumb-rajgad.jpg',
            excerpt: 'Scaling the sheer basalt rock steps in pre-dawn darkness to watch the golden sunrise spill across the misty Sahyadri valleys from the ramparts of Rajgad.',
            content: `
                <p>There is an unspoken reverence in the Sahyadris at 05:00 AM. Starting from Gunjavane village, our flashlights swept over dewy grass and loose shale as the trail climbed steeply toward the Chor Darwaja of Rajgad Fort.</p>
                <p>As we reached the crest of Padmavati Machi, the eastern horizon cracked open in brilliant gradients of saffron and gold. The sheer scale of Chhatrapati Shivaji Maharaj's capital became breathtakingly apparent: kilometers of three-tiered stone ramparts hugging mountain contours like the spine of a sleeping dragon.</p>
                <p>Standing on the edge of Balekilla, looking down at the clouds rolling beneath our feet, one understands why Rajgad was deemed unconquerable. For sustainable heritage travelers, this fort is not merely a weekend trek—it is an enduring sanctuary of resilience, biodiversity, and Maratha engineering.</p>
            `
        },
        {
            id: 'story-munnar-tea',
            title: 'Munnar’s Mist & Cloud Trails: Walking through Century-Old Tea Sanctuaries',
            author: 'Rohan Mehra',
            readTime: '3 min read',
            category: 'Nature & Wellness',
            destId: 'munnar-hills',
            img: '../assets/images/dest-munnar.jpg',
            excerpt: 'Navigating the emerald green plantation trails of Idukki, learning the rhythm of artisanal tea pluckers and the quiet beauty of high-altitude shola forests.',
            content: `
                <p>In Munnar, morning does not arrive with sudden sunlight. It drifts in silently as tendrils of mist rise from deep mountain gorges, weaving through endless velvet-green terraces of tea bushes.</p>
                <p>Walking with a local certified guide through the Lockhart Estate, we observed the precise rhythm of the estate workers plucking 'two leaves and a bud' with practiced grace. The crisp aroma of crushed tea leaves and wild eucalyptus filled the mountain air.</p>
                <p>Later in the day, a short hike into the shola forest fringe of Eravikulam brought an unexpected encounter: a pair of Nilgiri Tahrs calmly grazing on sheer granite ledges, completely at peace in their protected sanctuary.</p>
            `
        },
        {
            id: 'story-jaisalmer-living-fort',
            title: 'Echoes of the Golden Fortress: Living Culture Inside Jaisalmer',
            author: 'Kavita Nair',
            readTime: '5 min read',
            category: 'Living Culture',
            destId: 'jaisalmer-desert',
            img: '../assets/images/dest-jaipur.jpg',
            excerpt: 'Wandering through the inhabited labyrinth of Sonar Qila, where four generations of families, artisans, and musicians breathe daily life into golden medieval sandstone.',
            content: `
                <p>Unlike monuments sealed behind museum ropes, Jaisalmer’s Sonar Qila is an astonishing living organism. As morning dawns over the Thar Desert, the yellow sandstone ramparts glow like burnished gold, and temple bells mingle with the call of chai-walas inside the bastions.</p>
                <p>Stepping through the Suraj Pol gateway, the stone alleys reveal families who have occupied the same carved havelis for centuries. Intricate jali stone screens cast delicate geometric shadows across cobblestones, and children run down streets that once echoed with Rajput cavalry.</p>
                <p>As evening settled, we sat on the fort ramparts watching the sun sink into the desert horizon while an elder played the ravanahatha—a timeless melody suspended between stone and sand.</p>
            `
        },
        {
            id: 'story-rishikesh-ganga',
            title: 'The Sacred Bells of Triveni Ghat: An Evening on the Banks of the Ganga',
            author: 'Amitabh Sen',
            readTime: '4 min read',
            category: 'Spiritual Heritage',
            destId: 'rishikesh-ganga-ghats',
            img: '../assets/images/dest-varanasi.jpg',
            excerpt: 'The transformative peace of the dusk Maha Aarti in Rishikesh, where rhythmic bells, Vedic chants, and floating leaf lamps illuminate the emerald river.',
            content: `
                <p>As twilight settles over the Shivalik foothills, crowds gather in quiet unison on the broad stone steps of Triveni Ghat in Rishikesh. The river Ganges flows swift, cold, and emerald-green from the higher Himalayas.</p>
                <p>When the conch shells sound, the priests elevate heavy brass multi-tiered aarti lamps in sweeping circular arcs. The chanting of Vedic mantras vibrates through the gathering crowd, accompanied by rhythmic brass bells and drums.</p>
                <p>Hundreds of tourists and pilgrims gently place leaf cups containing marigold blossoms and flickering camphor into the river. Watching the constellations of floating lamps drift down the holy current is a deeply humbling reminder of spiritual continuity.</p>
            `
        }
    ];

    /**
     * Tourist Store & Controller
     */
    const TouristApp = {
        destinations: [],
        favorites: new Set(),
        currentLightboxIndex: 0,
        currentLightboxGallery: [],
        currentLightboxDest: 'Destination',
        currentFilters: {
            search: '',
            state: 'all',
            categories: [],
            suitable: [],
            seasons: [],
            sortBy: 'popularity'
        },

        getDestinationGallery(dest) {
            const gallery = [];
            const seenUrls = new Set();

            const addImg = (url, title, tag, caption) => {
                if (!url || typeof url !== 'string' || !url.trim() || seenUrls.has(url.trim())) return;
                seenUrls.add(url.trim());
                gallery.push({
                    url: url.trim(),
                    title: title || `${dest.name} Perspective`,
                    tag: tag || 'Curated Perspective',
                    caption: caption || `Visual vista of ${dest.name}.`
                });
            };

            // 1. Authoritative Hero & Banner Images
            if (dest.hero_image_url) {
                addImg(dest.hero_image_url, `${dest.name} Panoramic Landscape`, 'Primary Vista', `Curated perspective highlighting the geography and monument of ${dest.name}.`);
            }
            if (dest.banner_image && dest.banner_image !== dest.hero_image_url) {
                addImg(dest.banner_image, `${dest.name} Topographical View`, 'Landscape Panorama', `Topographical perspective highlighting the regional landscape of ${dest.name}.`);
            }

            // 2. Custom Metadata Gallery Images saved by Manager
            const meta = dest.metadata || dest.metadata_json;
            if (meta && Array.isArray(meta.gallery_images)) {
                meta.gallery_images.forEach((imgItem, idx) => {
                    const url = typeof imgItem === 'string' ? imgItem : (imgItem && imgItem.url);
                    const title = (typeof imgItem === 'object' && imgItem.title) || `${dest.name} Perspective ${idx + 1}`;
                    const tag = (typeof imgItem === 'object' && imgItem.tag) || 'Curated Perspective';
                    const caption = (typeof imgItem === 'object' && imgItem.caption) || `Architectural and cultural vista of ${dest.name}.`;
                    addImg(url, title, tag, caption);
                });
            }

            // 3. Associated Local Attractions Images
            if (typeof this.getDestinationAttractions === 'function') {
                const attractions = this.getDestinationAttractions(dest.id);
                if (Array.isArray(attractions)) {
                    attractions.forEach(attr => {
                        const attrImg = attr.img || attr.image_url;
                        addImg(attrImg, attr.name, attr.category || 'Local Attraction', attr.description || `Key landmark at ${dest.name}.`);
                    });
                }
            }

            // 4. Curated Heritage Gallery Perspectives
            if (DESTINATION_GALLERIES[dest.id]) {
                DESTINATION_GALLERIES[dest.id].forEach(g => {
                    addImg(g.url, g.title, g.tag, g.caption);
                });
            }

            // 5. Fallback if still empty
            if (gallery.length === 0) {
                const fallbackImg = dest.img || this.resolveDestinationImage(dest);
                return [
                    { url: fallbackImg, title: `${dest.name} Panoramic Landscape`, tag: 'Landscape Panorama', caption: `Sweeping perspective highlighting the distinct topography and regional setting of ${dest.name}.` },
                    { url: fallbackImg, title: `${dest.name} Cultural Monument`, tag: 'Heritage Architecture', caption: `Architectural craftsmanship and historical masonry preserved at ${dest.name}.` },
                    { url: fallbackImg, title: `Scenic Trail Lookout`, tag: 'Scenic Viewpoint', caption: `Natural viewpoints and panoramic ridge vistas accessible to visiting travelers.` },
                    { url: fallbackImg, title: `Visitor Approach Trail`, tag: 'Visitor Trail', caption: `Approved access pathway maintained under Destination Manager coordination.` },
                    { url: fallbackImg, title: `Twilight Atmosphere`, tag: 'Golden Hour', caption: `Evening light settling across the landscape and monuments of ${dest.name}.` },
                    { url: fallbackImg, title: `Regional Conservation Zone`, tag: 'Regional Ecology', caption: `Protected natural habitat and community surrounds in the vicinity of ${dest.name}.` }
                ];
            }

            return gallery;
        },

        openLightbox(index, gallery, destTitle) {
            const modal = document.getElementById('touristLightboxModal');
            if (!modal || !gallery || !gallery.length) return;
            this.currentLightboxGallery = gallery;
            this.currentLightboxIndex = index || 0;
            this.currentLightboxDest = destTitle || 'Destination';

            this.renderLightboxImage(this.currentLightboxIndex);
            modal.classList.add('active', 'show');
            document.body.style.overflow = 'hidden';
        },

        renderLightboxImage(idx) {
            const gallery = this.currentLightboxGallery;
            if (!gallery || !gallery[idx]) return;
            const item = gallery[idx];

            const titleEl = document.getElementById('lightbox-dest-title');
            const counterEl = document.getElementById('lightbox-counter');
            const mainImg = document.getElementById('lightbox-main-img');
            const captionEl = document.getElementById('lightbox-caption');
            const subcaptionEl = document.getElementById('lightbox-subcaption');
            const thumbsContainer = document.getElementById('lightbox-thumbs-strip');

            if (titleEl) titleEl.textContent = this.currentLightboxDest;
            if (counterEl) counterEl.textContent = `Photo ${idx + 1} of ${gallery.length}`;
            if (mainImg) {
                mainImg.src = item.url;
                mainImg.alt = item.title;
            }
            if (captionEl) captionEl.textContent = item.title;
            if (subcaptionEl) subcaptionEl.textContent = `Perspective: ${item.tag} • ${item.caption}`;

            if (thumbsContainer) {
                thumbsContainer.innerHTML = gallery.map((g, gIdx) => `
                    <button type="button" class="lightbox-thumb-btn ${gIdx === idx ? 'active' : ''}" data-thumb-idx="${gIdx}" aria-label="Jump to photo ${gIdx + 1}">
                        <img src="${g.url}" alt="${g.title}">
                    </button>
                `).join('');

                thumbsContainer.querySelectorAll('.lightbox-thumb-btn').forEach(btn => {
                    btn.onclick = () => {
                        const targetIdx = parseInt(btn.getAttribute('data-thumb-idx'), 10);
                        this.currentLightboxIndex = targetIdx;
                        this.renderLightboxImage(targetIdx);
                    };
                });
            }
        },

        nextLightbox() {
            if (!this.currentLightboxGallery || !this.currentLightboxGallery.length) return;
            this.currentLightboxIndex = (this.currentLightboxIndex + 1) % this.currentLightboxGallery.length;
            this.renderLightboxImage(this.currentLightboxIndex);
        },

        prevLightbox() {
            if (!this.currentLightboxGallery || !this.currentLightboxGallery.length) return;
            this.currentLightboxIndex = (this.currentLightboxIndex - 1 + this.currentLightboxGallery.length) % this.currentLightboxGallery.length;
            this.renderLightboxImage(this.currentLightboxIndex);
        },

        closeLightbox() {
            const modal = document.getElementById('touristLightboxModal');
            if (!modal) return;
            modal.classList.remove('active', 'show');
            document.body.style.overflow = '';
        },

        openAttractionModal(attr) {
            const modal = document.getElementById('touristAttractionModal');
            if (!modal || !attr) return;

            const editorial = ATTRACTION_EDITORIAL[attr.id] || {
                timings: '06:00 AM – 06:00 PM (Daily)',
                duration: '1.5 – 2 Hours',
                bestTime: 'Morning or late afternoon for scenic lighting',
                guidelines: 'Follow verified trail signs, carry drinking water, and respect heritage guidelines.',
                description: `A verified destination attraction under ${attr.name}. Cataloged by Destination Managers for visitor orientation, historical interpretation, and regional discovery.`
            };

            const imgEl = document.getElementById('attr-modal-img');
            const catEl = document.getElementById('attr-modal-category');
            const statusEl = document.getElementById('attr-modal-status');
            const ratingEl = document.getElementById('attr-modal-rating');
            const titleEl = document.getElementById('attr-modal-title');
            const descEl = document.getElementById('attr-modal-desc');
            const timingsEl = document.getElementById('attr-modal-timings');
            const durationEl = document.getElementById('attr-modal-duration');
            const bestTimeEl = document.getElementById('attr-modal-best-time');
            const guidelinesEl = document.getElementById('attr-modal-guidelines');

            if (imgEl) {
                imgEl.src = attr.img;
                imgEl.alt = attr.name;
            }
            if (catEl) catEl.textContent = attr.category || 'Attraction';
            if (statusEl) statusEl.textContent = `✓ ${attr.status || 'Verified Attraction'}`;
            if (ratingEl) ratingEl.textContent = `★ ${attr.rating || '4.8'}`;
            if (titleEl) titleEl.textContent = attr.name;
            if (descEl) descEl.textContent = editorial.description;
            if (timingsEl) timingsEl.textContent = editorial.timings;
            if (durationEl) durationEl.textContent = editorial.duration;
            if (bestTimeEl) bestTimeEl.textContent = editorial.bestTime;
            if (guidelinesEl) guidelinesEl.textContent = editorial.guidelines;

            modal.classList.add('active', 'show');
            document.body.style.overflow = 'hidden';
        },

        closeAttractionModal() {
            const modal = document.getElementById('touristAttractionModal');
            if (!modal) return;
            modal.classList.remove('active', 'show');
            document.body.style.overflow = '';
        },

        openStoryModal(story) {
            const modal = document.getElementById('touristStoryModal');
            if (!modal || !story) return;

            const tagEl = document.getElementById('story-modal-tag');
            const titleEl = document.getElementById('story-modal-title');
            const metaEl = document.getElementById('story-modal-meta');
            const authorEl = document.getElementById('story-modal-author');
            const dateEl = document.getElementById('story-modal-date');
            const imgEl = document.getElementById('story-modal-img');
            const contentEl = document.getElementById('story-modal-content') || document.getElementById('story-modal-body');
            const takeawaysEl = document.getElementById('story-modal-takeaways');
            const linkEl = document.getElementById('story-modal-dest-link');

            if (tagEl) tagEl.textContent = story.category || 'Travel Chronicle';
            if (titleEl) titleEl.textContent = story.title;
            if (metaEl) metaEl.textContent = `By ${story.author} • ${story.readTime}`;
            if (authorEl) authorEl.textContent = story.author;
            if (dateEl) dateEl.textContent = story.date || 'Verified Expedition';
            if (imgEl) {
                if (imgEl.tagName === 'IMG') {
                    imgEl.src = story.img;
                } else {
                    imgEl.style.backgroundImage = `url('${story.img}')`;
                }
            }
            if (contentEl) contentEl.innerHTML = story.content;
            if (takeawaysEl) {
                const takeaways = story.takeaways || [
                    'Engage certified local village guides for steep mountain and forest approaches.',
                    'Carry reusable water containers to maintain zero-plastic heritage zones.',
                    'Observe sunrise or golden hour for panoramic photography across the ramparts.'
                ];
                takeawaysEl.innerHTML = takeaways.map(t => `<li>${t}</li>`).join('');
            }
            if (linkEl) {
                linkEl.href = `destination-detail.html?id=${story.destId}`;
            }

            modal.classList.add('active', 'show');
            document.body.style.overflow = 'hidden';
        },

        closeStoryModal() {
            const modal = document.getElementById('touristStoryModal');
            if (!modal) return;
            modal.classList.remove('active', 'show');
            document.body.style.overflow = '';
        },

        getDestinationExperiences(destId) {
            const expPool = (this.apiExperiences && this.apiExperiences.length > 0)
                ? this.apiExperiences.map(e => ({
                    id: e.id,
                    title: e.title,
                    state_id: e.state_id || 'maharashtra',
                    destination_id: e.destination_id,
                    category: e.category,
                    category_label: e.category,
                    difficulty: e.difficulty,
                    duration: e.duration,
                    season: e.season,
                    guide: e.guide_requirement || 'Local Guide Recommended',
                    location: e.location || (e.destination_name ? `${e.destination_name}, India` : 'India'),
                    desc: e.description,
                    img: e.img || '../assets/images/thumb-rajgad.jpg'
                }))
                : EXPERIENCES_DATA;
            const matches = expPool.filter(e => matchesDestId(e.destination_id, destId));
            if (matches.length > 0) return matches;
            const dest = this.destinations.find(d => d.id === destId);
            if (dest) {
                const stateMatches = expPool.filter(e => e.state_id === dest.state_id);
                if (stateMatches.length > 0) return stateMatches;
            }
            return expPool.slice(0, 3);
        },

        openEventModal(ev) {
            const modal = document.getElementById('touristEventModal');
            if (!modal || !ev) return;

            const imgEl = document.getElementById('event-modal-img');
            const dateEl = document.getElementById('event-modal-date');
            const statusEl = document.getElementById('event-modal-status');
            const titleEl = document.getElementById('event-modal-title');
            const locEl = document.getElementById('event-modal-loc');
            const descEl = document.getElementById('event-modal-desc');
            const timingEl = document.getElementById('event-modal-timing');
            const orgEl = document.getElementById('event-modal-organizer');
            const entryEl = document.getElementById('event-modal-entry');
            const guideEl = document.getElementById('event-modal-guidelines');

            if (imgEl) imgEl.src = ev.img || '../assets/images/thumb-rajgad.jpg';
            if (dateEl) dateEl.textContent = `📅 ${ev.dateNum || '15'} ${ev.dateMonth || 'OCT'} 2026`;
            if (statusEl) {
                statusEl.textContent = ev.status || 'Active';
                statusEl.className = `event-status-pill ${ev.statusClass || 'active'}`;
            }
            if (titleEl) titleEl.textContent = ev.title;
            if (locEl) locEl.textContent = `📍 ${ev.location || ev.loc || 'Destination'}`;
            if (descEl) descEl.textContent = ev.description || `A curated tourism festivity organized under Destination Manager supervision. Bringing together certified eco-guides, local cultural performers, and visitors for sustainable heritage exploration and regional community celebration.`;
            if (timingEl) timingEl.textContent = ev.timing || '08:00 AM – 06:00 PM (Scheduled Program)';
            if (orgEl) orgEl.textContent = ev.organizer || 'State Department of Tourism & Village Committee';
            if (entryEl) entryEl.textContent = ev.entry || 'Open to All Verified Visitors (Free Entry)';
            if (guideEl) guideEl.textContent = ev.guidelines || 'Carry valid photo ID. Respect monument heritage rules and dispose of all waste in municipal base camp bins.';

            modal.classList.add('active', 'show');
            document.body.style.overflow = 'hidden';
        },

        closeEventModal() {
            const modal = document.getElementById('touristEventModal');
            if (!modal) return;
            modal.classList.remove('active', 'show');
            document.body.style.overflow = '';
        },

        openExperienceModal(exp) {
            const modal = document.getElementById('touristExperienceModal');
            if (!modal) return;
            if (!exp) {
                console.warn('Experience details not available.');
                return;
            }

            const imgEl = document.getElementById('exp-modal-img');
            const catEl = document.getElementById('exp-modal-category');
            const stateEl = document.getElementById('exp-modal-state');
            const titleEl = document.getElementById('exp-modal-title');
            const locEl = document.getElementById('exp-modal-loc');
            const descEl = document.getElementById('exp-modal-desc');
            const durEl = document.getElementById('exp-modal-duration');
            const diffEl = document.getElementById('exp-modal-difficulty');
            const seasonEl = document.getElementById('exp-modal-season');
            const guideEl = document.getElementById('exp-modal-guide');
            const gearEl = document.getElementById('exp-modal-gear');
            const linkEl = document.getElementById('exp-modal-dest-link');

            if (imgEl) {
                imgEl.src = exp.img || '../assets/images/hero-india.jpg';
                imgEl.alt = exp.title || 'Experience Photo';
            }
            if (catEl) catEl.textContent = exp.category_label || exp.category || 'Curated Experience';
            if (stateEl) stateEl.textContent = (exp.state_id || 'India').toUpperCase();
            if (titleEl) titleEl.textContent = exp.title || 'Experience Overview';
            if (locEl) locEl.textContent = exp.location ? `📍 ${exp.location}` : '';
            if (descEl) descEl.textContent = exp.desc || 'Experience details curated by certified regional guides.';
            if (durEl) durEl.textContent = exp.duration || 'Flexible';
            if (diffEl) diffEl.textContent = exp.difficulty || 'Moderate';
            if (seasonEl) seasonEl.textContent = exp.season || 'All Seasons';
            if (guideEl) guideEl.textContent = exp.guide || 'Available on request';
            if (gearEl) gearEl.textContent = exp.gear || 'Comfortable footwear, hydration, and weather-appropriate gear.';
            if (linkEl) {
                if (exp.destination_id) {
                    linkEl.href = `destination-detail.html?id=${encodeURIComponent(exp.destination_id)}`;
                    linkEl.style.display = 'inline-flex';
                    linkEl.onclick = (e) => {
                        const urlParams = new URLSearchParams(window.location.search);
                        if (urlParams.get('id') === exp.destination_id) {
                            e.preventDefault();
                            this.closeExperienceModal();
                            const overviewTabBtn = document.querySelector('.detail-tab-btn[data-tab="overview"]');
                            if (overviewTabBtn) overviewTabBtn.click();
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                    };
                } else {
                    linkEl.style.display = 'none';
                }
            }

            modal.classList.add('active', 'show');
            document.body.style.overflow = 'hidden';
        },

        closeExperienceModal() {
            const modal = document.getElementById('touristExperienceModal');
            if (!modal) return;
            modal.classList.remove('active', 'show');
            document.body.style.overflow = '';
        },

        renderCuratedItinerary(circuitKey) {
            const container = document.getElementById('itinerary-days-display');
            if (!container) return;

            let circuit = null;
            if (this.apiCircuits && this.apiCircuits.length > 0) {
                const matchedApiCircuit = this.apiCircuits.find(c => c.id === circuitKey || c.state_id === circuitKey);
                if (matchedApiCircuit && matchedApiCircuit.stops && matchedApiCircuit.stops.length > 0) {
                    circuit = {
                        title: matchedApiCircuit.title,
                        duration: matchedApiCircuit.duration || 'Curated Circuit',
                        theme: matchedApiCircuit.theme || 'Heritage & Nature',
                        days: matchedApiCircuit.stops.map((s, idx) => ({
                            day: s.day_number || (idx + 1),
                            dest: s.destination_name || s.destination_id,
                            destId: s.destination_id,
                            loc: s.destination_name || 'India',
                            time: s.time_schedule || '08:00 AM – 05:00 PM',
                            highlight: s.highlight || 'Featured Stop',
                            desc: s.description || 'Guided circuit exploration stop.'
                        }))
                    };
                }
            }

            if (!circuit) {
                circuit = CURATED_ITINERARIES[circuitKey] || CURATED_ITINERARIES.mh;
            }

            container.innerHTML = `
                <div style="background:var(--tourist-bg-surface); border:1px solid var(--tourist-border); border-radius:10px; padding:1.25rem 1.5rem; margin-bottom:1.25rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.75rem;">
                    <div>
                        <h3 style="font-size:1.15rem; font-weight:800; color:var(--tourist-text-heading); margin:0 0 0.25rem 0;">${circuit.title}</h3>
                        <div style="font-size:0.8rem; color:var(--tourist-text-muted);">Duration: ${circuit.duration} • Focus: ${circuit.theme}</div>
                    </div>
                    <span style="font-size:0.75rem; background:var(--tourist-forest-light); color:var(--tourist-forest); padding:0.3rem 0.75rem; border-radius:9999px; font-weight:700;">
                        ✓ Manager Verified Circuit
                    </span>
                </div>
                ${circuit.days.map(d => `
                    <div class="itinerary-day-card">
                        <div class="itinerary-day-badge">
                            <div class="itinerary-day-badge-num">Day ${d.day}</div>
                            <div class="itinerary-day-badge-lbl">Stop ${d.day}</div>
                        </div>
                        <div>
                            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.35rem; flex-wrap:wrap; gap:0.5rem;">
                                <h4 style="font-size:1.05rem; font-weight:800; color:var(--tourist-text-heading); margin:0;">
                                    ${d.dest} <span style="font-size:0.78rem; color:var(--tourist-text-light); font-weight:500;">(${d.loc})</span>
                                </h4>
                                <a href="destination-detail.html?id=${d.destId}" class="tourist-link-arrow" style="font-size:0.82rem;">
                                    View Destination Guide →
                                </a>
                            </div>
                            <div style="font-size:0.78rem; color:var(--tourist-forest); font-weight:700; margin-bottom:0.45rem;">
                                ⏱️ Schedule: ${d.time} • ⭐ Highlight: ${d.highlight}
                            </div>
                            <p style="font-size:0.88rem; color:var(--tourist-text-muted); line-height:1.6; margin:0;">
                                ${d.desc}
                            </p>
                        </div>
                    </div>
                `).join('')}
            `;
        },

        generateCustomItinerary(stateId, days, style) {
            const container = document.getElementById('custom-itinerary-output');
            if (!container) return;

            const stateDestinations = this.destinations.filter(d => d.state_id === stateId);
            const stateObj = (window.YatraSetuManagerData.states || []).find(s => s.id === stateId) || { name: stateId };

            if (!stateDestinations.length) {
                container.innerHTML = `<div style="padding:1.5rem; text-align:center; color:var(--tourist-text-muted);">No destinations found for ${stateObj.name}.</div>`;
                return;
            }

            const planDays = [];
            for (let i = 0; i < days; i++) {
                const dest = stateDestinations[i % stateDestinations.length];
                const dayNum = i + 1;
                planDays.push({
                    day: dayNum,
                    destName: dest.name,
                    destId: dest.id,
                    loc: dest.location,
                    category: dest.category,
                    time: `Day ${dayNum} • 07:30 AM – 05:00 PM`,
                    highlight: `Explore ${dest.name} highlights, local craft hubs, and scenic view ridges.`,
                    desc: `Immerse in ${dest.name} (${dest.category}). Visit cataloged attractions, follow local conservation advisories, and connect with authorized ${stateObj.name} guides.`
                });
            }

            container.innerHTML = `
                <div style="background:var(--tourist-forest-light); border:1px solid rgba(26,61,50,0.15); border-radius:10px; padding:1.25rem 1.5rem; margin-bottom:1.25rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.75rem;">
                    <div>
                        <h4 style="font-size:1.1rem; font-weight:800; color:var(--tourist-forest); margin:0 0 0.25rem 0;">
                            Custom ${days}-Day ${stateObj.name} Journey Plan
                        </h4>
                        <div style="font-size:0.8rem; color:var(--tourist-text-muted);">Theme: ${style.toUpperCase()} • Generated with authentic destination records</div>
                    </div>
                    <div style="display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap;">
                        <span style="font-size:0.75rem; background:#FFF; color:var(--tourist-forest); padding:0.35rem 0.85rem; border-radius:9999px; font-weight:800;">
                            ${days} Curated Stop${days > 1 ? 's' : ''}
                        </span>
                        <button type="button" class="tourist-btn-primary" id="btn-save-custom-itinerary-to-db" style="font-size:0.78rem; padding:0.35rem 0.85rem;">
                            💾 Save to My Trips
                        </button>
                    </div>
                </div>
                ${planDays.map(d => `
                    <div class="itinerary-day-card">
                        <div class="itinerary-day-badge">
                            <div class="itinerary-day-badge-num">Day ${d.day}</div>
                            <div class="itinerary-day-badge-lbl">Custom Stop</div>
                        </div>
                        <div>
                            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.35rem; flex-wrap:wrap; gap:0.5rem;">
                                <h4 style="font-size:1.05rem; font-weight:800; color:var(--tourist-text-heading); margin:0;">
                                    ${d.destName} <span style="font-size:0.78rem; color:var(--tourist-text-light); font-weight:500;">(${d.loc})</span>
                                </h4>
                                <a href="destination-detail.html?id=${d.destId}" class="tourist-link-arrow" style="font-size:0.82rem;">
                                    View Destination Guide →
                                </a>
                            </div>
                            <div style="font-size:0.78rem; color:var(--tourist-forest); font-weight:700; margin-bottom:0.45rem;">
                                ⏱️ ${d.time} • ⭐ Category: ${d.category}
                            </div>
                            <p style="font-size:0.88rem; color:var(--tourist-text-muted); line-height:1.6; margin:0;">
                                ${d.desc}
                            </p>
                        </div>
                    </div>
                `).join('')}
            `;

            const saveBtn = container.querySelector('#btn-save-custom-itinerary-to-db');
            if (saveBtn) {
                saveBtn.onclick = async () => {
                    if (typeof window !== 'undefined' && window.YatraSetuApi && typeof window.YatraSetuApi.hasToken === 'function' && window.YatraSetuApi.hasToken()) {
                        try {
                            const items = planDays.map((d, idx) => ({
                                destination_id: d.destId,
                                day_number: d.day,
                                order_index: idx + 1,
                                time_slot: d.time,
                                notes: d.highlight
                            }));
                            await window.YatraSetuApi.createTouristItinerary({
                                title: `Custom ${days}-Day ${stateObj.name} Journey Plan`,
                                notes: `Theme: ${style.toUpperCase()}. Generated via YatraSetu itinerary builder.`,
                                items: items
                            });
                            this.showToast('Itinerary saved to your account successfully!');
                        } catch (err) {
                            console.warn('Could not save custom itinerary to backend:', err);
                            this.showToast('Could not save itinerary. Please check connection.');
                        }
                    } else {
                        this.showToast('Sign in with a Tourist account to save itineraries to your cloud profile.');
                    }
                };
            }
        },

        renderTravelStories() {
            const grid = document.getElementById('tourist-stories-grid');
            if (!grid) return;

            grid.innerHTML = TRAVEL_STORIES.map(story => `
                <div class="tourist-story-card">
                    <div class="tourist-story-thumb" style="background-image: url('${story.img}');">
                        <span class="tourist-story-badge">${story.category}</span>
                    </div>
                    <div class="tourist-story-body">
                        <h4 class="tourist-story-title">${story.title}</h4>
                        <p class="tourist-story-excerpt">${story.excerpt}</p>
                        <div class="tourist-story-meta">
                            <span>By ${story.author} • ${story.readTime}</span>
                            <button type="button" class="tourist-link-arrow btn-read-story" data-story-id="${story.id}" style="background:none; border:none; cursor:pointer; font-weight:700; color:var(--tourist-forest); padding:0;">
                                Read Story →
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');

            grid.querySelectorAll('.btn-read-story').forEach(btn => {
                btn.onclick = () => {
                    const id = btn.getAttribute('data-story-id');
                    const story = TRAVEL_STORIES.find(s => s.id === id);
                    if (story) this.openStoryModal(story);
                };
            });
        },

        init() {
            console.log('[DEBUG INIT] TouristApp.init called, path:', window.location.pathname);
            this.loadFavorites();
            this.enrichDestinations();
            this.initUserSession();
            this.initHeaderNav();
            this.initWishlistDrawer();

            // Page-specific initialization
            const path = window.location.pathname;
            if (path.includes('destination-advisories.html')) {
                this.initDestinationAdvisoriesPage();
            } else if (path.includes('destination-detail.html')) {
                console.log('[DEBUG DETAIL] Calling initDestinationDetailPage from init()');
                this.initDestinationDetailPage();
            } else if (path.includes('destinations.html')) {
                this.initExploreDestinationsPage();
            } else if (path.includes('experiences.html')) {
                this.initExperiencesPage();
            } else if (path.includes('plan-trip.html')) {
                this.initPlanTripPage();
            } else if (path.includes('stories.html')) {
                this.initStoriesPage();
            } else if (path.includes('travel-guidance.html')) {
                this.initTravelGuidancePage();
            } else if (path.includes('dashboard.html')) {
                this.initTouristDashboard();
            }

            // Asynchronously synchronize live catalogue data from REST API
            this.loadCatalogueFromApi();
        },

        /**
         * Resolve Authentic Local Destination Images
         */
        resolveDestinationImage(dest) {
            if (!dest) return '../assets/images/hero-india.jpg';
            // 1. Authoritative: configured database hero or banner image URL
            if (dest.hero_image_url && typeof dest.hero_image_url === 'string' && dest.hero_image_url.trim()) {
                return dest.hero_image_url.trim();
            }
            if (dest.banner_image && typeof dest.banner_image === 'string' && dest.banner_image.trim()) {
                return dest.banner_image.trim();
            }
            if (dest.img && typeof dest.img === 'string' && dest.img.trim()) {
                return dest.img.trim();
            }

            // 2. Contextual fallback based on destination identifier and region
            const id = (dest.id || '').toLowerCase();
            const state = (dest.state_id || '').toLowerCase();
            const name = (dest.name || '').toLowerCase();

            if (id.includes('rajgad') || name.includes('rajgad')) return '../assets/images/thumb-rajgad.jpg';
            if (id.includes('ajanta') || name.includes('ajanta') || id.includes('ellora') || name.includes('ellora')) return '../assets/images/thumb-ajanta.jpg';
            if (id.includes('lonavala') || name.includes('lonavala') || id.includes('khandala')) return '../assets/images/thumb-lonavala.jpg';
            if (id.includes('mumbai') || name.includes('mumbai')) return '../assets/images/thumb-mumbai.jpg';
            if (id.includes('konkan') || id.includes('tarkarli') || id.includes('alibaug')) return '../assets/images/thumb-konkan.jpg';
            if (id.includes('munnar') || name.includes('munnar')) return '../assets/images/dest-munnar.jpg';
            if (id.includes('goa') || state === 'goa') return '../assets/images/dest-goa.jpg';
            if (id.includes('jaipur') || id.includes('amer') || id.includes('jaisalmer') || id.includes('udaipur') || state === 'rajasthan') return '../assets/images/dest-jaipur.jpg';
            if (id.includes('manali') || id.includes('gulmarg') || id.includes('pahalgam') || id.includes('sonamarg') || state === 'kashmir') return '../assets/images/dest-manali.jpg';
            if (id.includes('varanasi') || id.includes('rishikesh') || id.includes('haridwar') || state === 'uttarakhand') return '../assets/images/dest-varanasi.jpg';
            if (id.includes('hampi') || id.includes('madurai') || id.includes('thanjavur') || id.includes('mahabalipuram') || state === 'tamil-nadu') return '../assets/images/dest-hampi.jpg';
            if (state === 'kerala' || id.includes('alappuzha') || id.includes('kochi') || id.includes('wayanad') || id.includes('varkala')) return '../assets/images/hero-kerala.jpg';
            if (state === 'maharashtra') return '../assets/images/hero-maharashtra.jpg';

            return '../assets/images/hero-india.jpg';
        },

        resolveAttractionImage(attr, dest) {
            if (!attr) return this.resolveDestinationImage(dest);
            const id = (attr.id || '').toLowerCase();
            const name = (attr.name || '').toLowerCase();
            if (id.includes('padmavati') || name.includes('padmavati') || id.includes('balekilla') || id.includes('suvela') || id.includes('sanjeevani')) {
                return '../assets/images/thumb-rajgad.jpg';
            }
            if (id.includes('tiger') || name.includes('tiger')) return '../assets/images/thumb-lonavala.jpg';
            if (attr.img && attr.img.startsWith('../assets/')) return attr.img;
            return this.resolveDestinationImage(dest);
        },

        /**
         * Asynchronously synchronize live catalogue data from REST API using Promise.all parallelization
         * and sessionStorage caching with automatic cross-tab invalidation detection.
         */
        async loadCatalogueFromApi(forceRefresh = false) {
            if (typeof window === 'undefined' || !window.YatraSetuApi) return;
            try {
                // 1. Check if catalogue was invalidated by Manager operations in another tab/session
                let isInvalidated = false;
                try {
                    const lastInvalidated = localStorage.getItem('yatrasetu_catalogue_invalidated_at');
                    const cacheTs = sessionStorage.getItem('yatrasetu_tourist_catalogue_ts');
                    if (lastInvalidated && cacheTs && parseInt(lastInvalidated, 10) > parseInt(cacheTs, 10)) {
                        isInvalidated = true;
                    }
                } catch (e) {}

                // 2. Check sessionStorage cache unless forceRefresh or invalidated
                if (!forceRefresh && !isInvalidated) {
                    try {
                        const cachedRaw = sessionStorage.getItem('yatrasetu_tourist_catalogue');
                        if (cachedRaw) {
                            const cached = JSON.parse(cachedRaw);
                            if (cached && Array.isArray(cached.destinations) && cached.destinations.length > 0) {
                                this.apiStates = cached.states || [];
                                this.apiAttractions = cached.attractions || [];
                                this.apiExperiences = cached.experiences || [];
                                this.apiEvents = cached.events || [];
                                this.apiCircuits = cached.circuits || [];
                                this.apiVideos = cached.videos || [];
                                this.isUsingLiveDestinations = true;
                                this.enrichDestinations(cached.destinations, this.apiStates);

                                // Re-render current page immediately from session cache
                                const path = window.location.pathname;
                                if (path.includes('destinations.html')) {
                                    this.renderFilteredDestinations();
                                } else if (path.includes('destination-detail.html')) {
                                    this.initDestinationDetailPage();
                                } else if (path.includes('experiences.html')) {
                                    this.initExperiencesPage();
                                }
                                return;
                            }
                        }
                    } catch (cacheErr) {
                        console.warn('[YatraSetu Tourist] Session cache parse note:', cacheErr);
                    }
                }

                // 3. Concurrent parallel fetch of all 7 catalogue entities via Promise.all
                const [statesData, destData, attrData, expData, evtData, circuitData, videoData] = await Promise.all([
                    window.YatraSetuApi.getStates().catch(() => null),
                    window.YatraSetuApi.getDestinations({ limit: 100 }).catch(() => null),
                    window.YatraSetuApi.getAttractions({ limit: 100 }).catch(() => null),
                    window.YatraSetuApi.getExperiences({ limit: 100 }).catch(() => null),
                    window.YatraSetuApi.getEvents({ limit: 100 }).catch(() => null),
                    window.YatraSetuApi.getCircuits({ limit: 100 }).catch(() => null),
                    window.YatraSetuApi.getVideos({ limit: 100 }).catch(() => null)
                ]);

                // 3.1 Process live states
                if (statesData && Array.isArray(statesData)) {
                    this.apiStates = statesData;
                }

                // 3.2 Process live destinations
                let hasLiveDestinations = false;
                let rawDestList = [];
                if (destData && Array.isArray(destData.items) && destData.items.length > 0) {
                    hasLiveDestinations = true;
                    rawDestList = destData.items;
                    this.isUsingLiveDestinations = true;
                    this.enrichDestinations(rawDestList, this.apiStates);

                    // Re-render current page with live database data
                    const path = window.location.pathname;
                    if (path.includes('destinations.html')) {
                        this.renderFilteredDestinations();
                    } else if (path.includes('destination-detail.html')) {
                        this.initDestinationDetailPage();
                    }
                }

                // 3.3 Process live attractions
                if (attrData && Array.isArray(attrData.items) && attrData.items.length > 0) {
                    this.apiAttractions = attrData.items;
                    if (window.location.pathname.includes('destination-detail.html')) {
                        const urlParams = new URLSearchParams(window.location.search);
                        const destId = urlParams.get('id') || 'raigad-fort';
                        const attrContainer = document.getElementById('detail-attractions-grid');
                        if (attrContainer) {
                            const attractions = this.getDestinationAttractions(destId);
                            if (attractions.length > 0) {
                                attrContainer.innerHTML = attractions.map(attr => `
                                    <div class="tourist-attraction-card">
                                        <div class="attraction-img" style="background-image: url('${attr.img || '../assets/images/thumb-rajgad.jpg'}');">
                                            <span class="attraction-badge">${attr.category || 'Point of Interest'}</span>
                                        </div>
                                        <div class="attraction-content">
                                            <h4 class="attraction-name">${attr.name}</h4>
                                            <p class="attraction-desc">${attr.description || ''}</p>
                                            <div class="attraction-meta-row">
                                                <span>⏱️ ${attr.timings || 'Sunrise – Sunset'}</span>
                                                <span>🎟️ ${attr.entry_fee || 'Free Entry'}</span>
                                            </div>
                                        </div>
                                    </div>
                                `).join('');
                            }
                        }
                    }
                }

                // 3.4 Process live experiences
                if (expData && Array.isArray(expData.items) && expData.items.length > 0) {
                    this.apiExperiences = expData.items;
                    if (window.location.pathname.includes('experiences.html')) {
                        this.initExperiencesPage();
                    }
                }

                // 3.5 Process live events
                if (evtData && Array.isArray(evtData.items) && evtData.items.length > 0) {
                    this.apiEvents = evtData.items;
                    if (window.location.pathname.includes('destination-detail.html')) {
                        const urlParams = new URLSearchParams(window.location.search);
                        const destId = urlParams.get('id') || 'raigad-fort';
                        const eventsContainer = document.getElementById('detail-events-grid');
                        if (eventsContainer) {
                            const events = this.getDestinationEvents(destId);
                            if (events.length > 0) {
                                eventsContainer.innerHTML = events.map(ev => `
                                    <div class="tourist-event-card">
                                        <div class="event-card-date-badge">
                                            <div class="event-date-month">${new Date(ev.start_date).toLocaleString('default', { month: 'short' }).toUpperCase()}</div>
                                            <div class="event-date-day">${new Date(ev.start_date).getDate()}</div>
                                        </div>
                                        <div class="event-card-body">
                                            <h4 class="event-card-title">${ev.title}</h4>
                                            <p class="event-card-desc">${ev.description || ''}</p>
                                            <div class="event-card-status">Status: <strong>${ev.status}</strong></div>
                                        </div>
                                    </div>
                                `).join('');
                            }
                        }
                    }
                }

                // 3.6 Process live circuits
                if (circuitData && Array.isArray(circuitData.items) && circuitData.items.length > 0) {
                    this.apiCircuits = circuitData.items;
                }

                // 3.7 Process live orientation videos
                try {
                    if (videoData && Array.isArray(videoData.items) && videoData.items.length > 0) {
                        this.apiVideos = videoData.items;
                    } else if (Array.isArray(videoData)) {
                        this.apiVideos = videoData;
                    }
                    if (window.location.pathname.includes('destination-detail.html')) {
                        const urlParams = new URLSearchParams(window.location.search);
                        const currentDestId = urlParams.get('id') || 'raigad-fort';
                        this.renderDestinationVideosTab(currentDestId);
                    }
                } catch (vErr) {
                    console.warn('[YatraSetu Tourist] Live video sync note:', vErr);
                }

                // 4. Save clean snapshot to sessionStorage ONLY when live data was successfully fetched
                if (hasLiveDestinations) {
                    try {
                        const cacheSnapshot = {
                            states: this.apiStates || [],
                            destinations: rawDestList,
                            attractions: this.apiAttractions || [],
                            experiences: this.apiExperiences || [],
                            events: this.apiEvents || [],
                            circuits: this.apiCircuits || [],
                            videos: this.apiVideos || []
                        };
                        sessionStorage.setItem('yatrasetu_tourist_catalogue', JSON.stringify(cacheSnapshot));
                        sessionStorage.setItem('yatrasetu_tourist_catalogue_ts', Date.now().toString());
                    } catch (sErr) {
                        console.warn('[YatraSetu Tourist] Session cache store note:', sErr);
                    }
                }
            } catch (err) {
                console.warn('[YatraSetu Tourist] Live catalogue API sync note:', err);
            }
        },

        /**
         * 1. Enrich Destinations Single Source of Truth
         */
        enrichDestinations(customRawDestinations = null, customStates = null) {
            const rawDestinations = customRawDestinations || (window.YatraSetuManagerData && window.YatraSetuManagerData.destinations) || [];
            const states = customStates || (this.apiStates && this.apiStates.length > 0 ? this.apiStates : (window.YatraSetuManagerData && window.YatraSetuManagerData.states)) || [];

            this.destinations = rawDestinations.map(d => {
                const editorial = DESTINATION_EDITORIAL[d.id] || {};
                const coords = DESTINATION_COORDINATES[d.id] || (d.latitude && d.longitude ? { lat: d.latitude, lng: d.longitude } : null);
                const stateObj = states.find(s => s.id === d.state_id) || { name: d.state_name || d.state_id || 'India' };
                const catLower = (d.category || '').toLowerCase();
                const meta = d.metadata || d.metadata_json || {};

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
                const baseRating = d.rank ? (4.5 + ((d.rank % 5) * 0.1)).toFixed(1) : '4.8';
                const rating = d.rating || editorial.rating || baseRating;
                const reviewsCount = editorial.reviews_count || (d.rank ? `${(1.2 - (d.rank * 0.1)).toFixed(1)}k` : '1.2k');

                return {
                    id: d.id,
                    name: d.name,
                    state_id: d.state_id,
                    state_name: stateObj.name,
                    category: d.category,
                    rank: d.rank || 99,
                    img: this.resolveDestinationImage(d),
                    hero_image_url: d.hero_image_url,
                    banner_image: d.banner_image,
                    metadata: meta,
                    metadata_json: meta,
                    ideal_duration: d.ideal_duration || editorial.ideal_duration,
                    max_daily_capacity: d.max_daily_capacity,
                    elevation: meta.elevation || editorial.elevation,
                    difficulty: meta.difficulty || editorial.difficulty,
                    location: d.location_label || editorial.location || `${d.name}, ${stateObj.name}`,
                    subtitle: d.subtitle || editorial.subtitle || `${d.category} in ${stateObj.name}`,
                    description: d.description || editorial.description || `Discover ${d.name}, a prominent ${d.category} in ${stateObj.name}. Integrated into YatraSetu's destination network for visitor orientation and travel guidance.`,
                    highlights: (meta && Array.isArray(meta.highlights) && meta.highlights.length) ? meta.highlights : (editorial.highlights || [
                        `Prominent ${d.category} in ${stateObj.name}`,
                        `Curated travel route with verified local attractions`,
                        `Supported by active destination management coordination`,
                        `Authentic cultural, nature, and heritage experience`
                    ]),
                    history_background: meta.history_background || editorial.history_background || `Originating in the regional chronicles of ${stateObj.name}, ${d.name} represents an essential monument in regional cultural geography. Historical records document continuous settlement, strategic fortification, and community heritage patronage.`,
                    heritage_architecture: meta.heritage_architecture || editorial.heritage_architecture || `Constructed in traditional regional architecture, ${d.name} demonstrates indigenous engineering adapted to the local topography and climate, featuring monumental entryways, stone ramparts, and specialized rainwater harvesting systems.`,
                    cultural_significance: meta.cultural_significance || editorial.cultural_significance || `Deeply rooted in the living traditions of ${stateObj.name}, ${d.name} serves as a cultural landmark celebrated in regional folklore, seasonal festivities, and community heritage gatherings.`,
                    geography_landmarks: meta.geography_landmarks || editorial.geography_landmarks || `Occupying a prominent terrain vantage point overlooking regional valleys, ${d.name} is surrounded by natural buffer zones, panoramic lookouts, and regional nature corridors.`,
                    traditions_culture: meta.traditions_culture || editorial.traditions_culture || `Local communities and village cooperatives surrounding ${d.name} uphold authentic handicraft, culinary hospitality, and seasonal ceremonies welcoming respectful travelers.`,
                    tags: tags,
                    suitable_for: suitable,
                    season: seasons,
                    best_time: d.best_time || editorial.best_time || 'October to March',
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
                } else {
                    this.favorites = new Set();
                }
            } catch (e) {
                this.favorites = new Set();
            }
            this.updateFavoritesBadge();

            // Synchronize with backend if authenticated
            if (typeof window !== 'undefined' && window.YatraSetuApi && typeof window.YatraSetuApi.hasToken === 'function' && window.YatraSetuApi.hasToken()) {
                window.YatraSetuApi.getTouristFavorites().then(favs => {
                    if (Array.isArray(favs)) {
                        favs.forEach(f => this.favorites.add(f.destination_id));
                        try {
                            localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify([...this.favorites]));
                        } catch (e) {}
                        this.updateFavoritesBadge();
                        this.renderWishlistDrawerItems();
                        this.favorites.forEach(id => {
                            document.querySelectorAll(`.dest-card-fav-btn[data-dest-id="${id}"], .detail-fav-btn[data-dest-id="${id}"]`).forEach(btn => {
                                btn.classList.add('favorited');
                                const svg = btn.querySelector('svg');
                                if (svg) svg.setAttribute('fill', '#EF4444');
                            });
                        });
                    }
                }).catch(err => console.warn('Could not sync favorites from backend:', err));
            }
        },

        toggleFavorite(destId) {
            if (!destId) return false;
            let isNowFav = false;
            if (this.favorites.has(destId)) {
                this.favorites.delete(destId);
                isNowFav = false;
                if (typeof window !== 'undefined' && window.YatraSetuApi && typeof window.YatraSetuApi.hasToken === 'function' && window.YatraSetuApi.hasToken()) {
                    window.YatraSetuApi.removeTouristFavorite(destId).catch(err => console.warn('Backend remove favorite error:', err));
                }
            } else {
                this.favorites.add(destId);
                isNowFav = true;
                if (typeof window !== 'undefined' && window.YatraSetuApi && typeof window.YatraSetuApi.hasToken === 'function' && window.YatraSetuApi.hasToken()) {
                    window.YatraSetuApi.addTouristFavorite(destId).catch(err => console.warn('Backend add favorite error:', err));
                }
            }

            try {
                localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify([...this.favorites]));
            } catch (e) {}

            this.updateFavoritesBadge();
            this.renderWishlistDrawerItems();

            // Sync all favorite heart buttons on the page with this ID
            document.querySelectorAll(`.dest-card-fav-btn[data-dest-id="${destId}"], .detail-fav-btn[data-dest-id="${destId}"]`).forEach(btn => {
                const svg = btn.querySelector('svg');
                if (isNowFav) {
                    btn.classList.add('favorited');
                    btn.setAttribute('aria-label', 'Remove from Saved Wishlist');
                    btn.setAttribute('title', 'Remove from Saved');
                    if (svg) svg.setAttribute('fill', '#EF4444');
                } else {
                    btn.classList.remove('favorited');
                    btn.setAttribute('aria-label', 'Save to Wishlist');
                    btn.setAttribute('title', 'Save to Favorites');
                    if (svg) svg.setAttribute('fill', 'none');
                }
            });

            // Also sync quickSaveBtn if on destination-detail.html
            const quickSaveBtn = document.getElementById('btn-quick-save-detail');
            if (quickSaveBtn) {
                const urlParams = new URLSearchParams(window.location.search);
                if (urlParams.get('id') === destId) {
                    quickSaveBtn.innerHTML = isNowFav 
                        ? '<span>❤️</span> Saved in My Wishlist' 
                        : '<span>🤍</span> Save to My Wishlist';
                }
            }

            this.showToast(isNowFav ? 'Destination saved to your wishlist!' : 'Destination removed from your wishlist.');

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

            // Fetch live verified profile from backend if tourist token exists
            if (role === 'tourist' && typeof window !== 'undefined' && window.YatraSetuApi && typeof window.YatraSetuApi.hasToken === 'function' && window.YatraSetuApi.hasToken()) {
                window.YatraSetuApi.getTouristProfile().then(profile => {
                    if (profile && profile.full_name) {
                        userName = profile.full_name;
                        const dynInitials = userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'TM';
                        if (nameEl) nameEl.textContent = `Hi, ${userName.split(' ')[0]}`;
                        if (avatarEl) avatarEl.textContent = dynInitials;
                        const ddName = userDropdownEl.querySelector('.tourist-dropdown-name');
                        const ddEmail = userDropdownEl.querySelector('.tourist-dropdown-email');
                        if (ddName) ddName.textContent = userName;
                        if (ddEmail) ddEmail.textContent = profile.email || email;
                    }
                }).catch(err => console.warn('Could not fetch tourist profile:', err));
            }

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
                        sessionStorage.setItem('yatrasetu_email', 'tourist.demo@gmail.com');
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
                    logoutBtn.onclick = async () => {
                        if (window.YatraSetuApi && typeof window.YatraSetuApi.logout === 'function') {
                            await window.YatraSetuApi.logout().catch(() => {});
                        }
                        sessionStorage.removeItem('yatrasetu_role');
                        sessionStorage.removeItem('yatrasetu_email');
                        sessionStorage.removeItem('yatrasetu_name');
                        localStorage.removeItem('yatrasetu_access_token');
                        localStorage.removeItem('yatrasetu_refresh_token');
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
            let backdrop = document.getElementById('tourist-drawer-backdrop');
            if (!backdrop) {
                backdrop = document.createElement('div');
                backdrop.id = 'tourist-drawer-backdrop';
                backdrop.className = 'tourist-drawer-backdrop';
                document.body.appendChild(backdrop);
            }
            backdrop.onclick = () => this.closeWishlistDrawer();

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
            }

            const closeBtn = drawer.querySelector('#btn-close-wishlist-drawer');
            if (closeBtn) closeBtn.onclick = () => this.closeWishlistDrawer();
        },

        openWishlistDrawer() {
            const drawer = document.getElementById('tourist-wishlist-drawer');
            const backdrop = document.getElementById('tourist-drawer-backdrop');
            if (!drawer) return;
            this.renderWishlistDrawerItems();
            drawer.classList.add('show', 'active', 'open');
            if (backdrop) backdrop.classList.add('show', 'active', 'open');
            document.body.style.overflow = 'hidden';
        },

        closeWishlistDrawer() {
            const drawer = document.getElementById('tourist-wishlist-drawer');
            const backdrop = document.getElementById('tourist-drawer-backdrop');
            if (drawer) drawer.classList.remove('show', 'active', 'open');
            if (backdrop) backdrop.classList.remove('show', 'active', 'open');
            document.body.style.overflow = '';
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
         * Dedicated Experiences Page Controller
         */
        initExperiencesPage() {
            const expList = (this.apiExperiences && this.apiExperiences.length > 0)
                ? this.apiExperiences.map(e => ({
                    id: e.id,
                    title: e.title,
                    state_id: e.state_id || 'maharashtra',
                    destination_id: e.destination_id,
                    category: e.category,
                    category_label: e.category,
                    difficulty: e.difficulty,
                    duration: e.duration,
                    season: e.season,
                    guide: e.guide_requirement || 'Local Guide Required',
                    location: e.location || (e.destination_name ? `${e.destination_name}, India` : 'India'),
                    desc: e.description,
                    img: e.img || '../assets/images/thumb-rajgad.jpg'
                }))
                : EXPERIENCES_DATA;

            const countAllEl = document.getElementById('count-exp-all');
            if (countAllEl) countAllEl.textContent = expList.length;

            let activeCategory = 'all';
            let activeState = 'all';
            let searchQuery = '';

            const grid = document.getElementById('experiences-grid');
            const renderExperiences = () => {
                if (!grid) return;
                const filtered = expList.filter(exp => {
                    const matchCat = activeCategory === 'all' || exp.category === activeCategory;
                    const matchState = activeState === 'all' || exp.state_id === activeState;
                    const qLower = searchQuery.toLowerCase();
                    const matchSearch = !searchQuery || 
                        exp.title.toLowerCase().includes(qLower) || 
                        exp.location.toLowerCase().includes(qLower) || 
                        exp.desc.toLowerCase().includes(qLower);
                    return matchCat && matchState && matchSearch;
                });

                if (filtered.length > 0) {
                    grid.innerHTML = filtered.map(exp => `
                        <div class="experience-full-card">
                            <div class="exp-full-img" style="background-image: url('${exp.img}');">
                                <span class="exp-full-badge">${exp.category_label || exp.category}</span>
                            </div>
                            <div class="exp-full-content">
                                <h3 class="exp-full-title">${exp.title}</h3>
                                <div class="exp-full-loc">📍 ${exp.location}</div>
                                <p class="exp-full-desc">${exp.desc}</p>
                                <div class="exp-full-meta-grid">
                                    <div><strong>⏱️ Duration:</strong> ${exp.duration}</div>
                                    <div><strong>💪 Difficulty:</strong> ${exp.difficulty}</div>
                                    <div><strong>☀️ Best Season:</strong> ${exp.season}</div>
                                    <div><strong>🧭 Guide:</strong> ${exp.guide}</div>
                                </div>
                                <button type="button" class="tourist-btn-primary btn-view-exp" data-exp-id="${exp.id}" style="width:100%; justify-content:center;">
                                    View Experience Details <span>→</span>
                                </button>
                            </div>
                        </div>
                    `).join('');

                    grid.querySelectorAll('.btn-view-exp').forEach(btn => {
                        btn.onclick = () => {
                            const expId = btn.getAttribute('data-exp-id');
                            const exp = expList.find(e => e.id === expId);
                            if (exp) this.openExperienceModal(exp);
                        };
                    });
                } else {
                    grid.innerHTML = `
                        <div style="grid-column: 1 / -1; padding: 3rem; text-align: center; background: var(--tourist-bg-subtle); border-radius: 12px;">
                            <span style="font-size: 2.5rem; display: block; margin-bottom: 0.75rem;">🔍</span>
                            <h4 style="font-size: 1.15rem; color: var(--tourist-text-heading); margin: 0 0 0.5rem 0;">No Experiences Match Your Filter</h4>
                            <p style="font-size: 0.88rem; color: var(--tourist-text-muted); max-width: 440px; margin: 0 auto 1.25rem auto;">
                                Try resetting your search terms or selecting 'All Experiences' to view our complete regional catalog.
                            </p>
                        </div>
                    `;
                }
            };

            // Initial render
            renderExperiences();

            // Category Chips
            document.querySelectorAll('#exp-category-chips button').forEach(btn => {
                btn.onclick = () => {
                    document.querySelectorAll('#exp-category-chips button').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    activeCategory = btn.getAttribute('data-exp-cat') || 'all';
                    renderExperiences();
                };
            });

            // Search Input
            const searchInput = document.getElementById('exp-search-input');
            if (searchInput) {
                searchInput.addEventListener('input', (e) => {
                    searchQuery = e.target.value.trim();
                    renderExperiences();
                });
            }

            // State Selector
            const stateSelect = document.getElementById('exp-state-select');
            if (stateSelect) {
                stateSelect.addEventListener('change', (e) => {
                    activeState = e.target.value;
                    renderExperiences();
                });
            }

            // Modal Closers
            const btnCloseExp = document.getElementById('btn-close-exp-modal');
            const btnCloseExpFooter = document.getElementById('btn-close-exp-modal-footer');
            const expModal = document.getElementById('touristExperienceModal');
            if (btnCloseExp) btnCloseExp.onclick = () => this.closeExperienceModal();
            if (btnCloseExpFooter) btnCloseExpFooter.onclick = () => this.closeExperienceModal();
            if (expModal) {
                expModal.onclick = (e) => {
                    if (e.target === expModal) this.closeExperienceModal();
                };
            }
        },

        /**
         * Dedicated Plan Your Trip Page Controller
         */
        initPlanTripPage() {
            // Tabs switching (Curated, Builder, Wishlist)
            const tabs = document.querySelectorAll('.itinerary-nav-tab');
            const paneCurated = document.getElementById('itinerary-pane-curated');
            const paneBuilder = document.getElementById('itinerary-pane-builder');
            const paneWishlist = document.getElementById('itinerary-pane-wishlist');

            tabs.forEach(tab => {
                tab.onclick = () => {
                    tabs.forEach(t => t.classList.remove('active'));
                    tab.classList.add('active');
                    const tabKey = tab.getAttribute('data-itinerary-tab');
                    if (paneCurated) paneCurated.style.display = tabKey === 'curated' ? 'block' : 'none';
                    if (paneBuilder) paneBuilder.style.display = tabKey === 'builder' ? 'block' : 'none';
                    if (paneWishlist) {
                        paneWishlist.style.display = tabKey === 'wishlist' ? 'block' : 'none';
                        if (tabKey === 'wishlist') this.renderWishlistPlanner();
                    }
                };
            });

            // Curated Circuits Buttons
            const btnMh = document.getElementById('btn-circuit-mh');
            const btnKl = document.getElementById('btn-circuit-kl');
            const btnRj = document.getElementById('btn-circuit-rj');
            const btnGoa = document.getElementById('btn-circuit-goa');
            const btnJk = document.getElementById('btn-circuit-jk');
            const circuitBtns = [btnMh, btnKl, btnRj, btnGoa, btnJk].filter(Boolean);

            const setCircuitActive = (btn, key) => {
                circuitBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.renderCuratedItinerary(key);
            };

            if (btnMh) btnMh.onclick = () => setCircuitActive(btnMh, 'mh');
            if (btnKl) btnKl.onclick = () => setCircuitActive(btnKl, 'kl');
            if (btnRj) btnRj.onclick = () => setCircuitActive(btnRj, 'rj');
            if (btnGoa) btnGoa.onclick = () => setCircuitActive(btnGoa, 'goa');
            if (btnJk) btnJk.onclick = () => setCircuitActive(btnJk, 'jk');

            // Render Default Curated Circuit
            this.renderCuratedItinerary('mh');

            // Custom Trip Builder Generator
            const btnGenerate = document.getElementById('btn-generate-custom-itinerary');
            if (btnGenerate) {
                btnGenerate.onclick = () => {
                    const state = (document.getElementById('builder-state-select') || {}).value || 'maharashtra';
                    const days = parseInt((document.getElementById('builder-duration-select') || {}).value || '3', 10);
                    const style = (document.getElementById('builder-style-select') || {}).value || 'heritage';
                    this.generateCustomItinerary(state, days, style);
                };
                // Initial default render
                this.generateCustomItinerary('maharashtra', 3, 'heritage');
            }

            // Update Wishlist Tab Counter
            const countEl = document.getElementById('plan-wishlist-count');
            if (countEl) countEl.textContent = this.favorites.size;
        },

        renderWishlistPlanner() {
            const grid = document.getElementById('wishlist-planner-grid');
            const countEl = document.getElementById('plan-wishlist-count');
            if (countEl) countEl.textContent = this.favorites.size;
            if (!grid) return;

            const favDestinations = this.destinations.filter(d => this.favorites.has(d.id));
            if (favDestinations.length > 0) {
                grid.innerHTML = favDestinations.map(dest => `
                    <div class="dest-card" style="box-shadow:var(--tourist-shadow-sm);">
                        <div class="dest-card-img-wrap" style="background-image: url('${dest.img}'); height: 160px;">
                            <span class="dest-card-badge">${dest.category}</span>
                            <span style="position:absolute; bottom:8px; left:8px; background:rgba(0,0,0,0.65); color:#fff; font-size:0.75rem; padding:2px 8px; border-radius:4px; font-weight:700;">
                                📍 ${dest.location}
                            </span>
                        </div>
                        <div class="dest-card-content" style="padding: 1.25rem;">
                            <h3 class="dest-card-name" style="font-size: 1.1rem; margin: 0 0 0.35rem 0;">${dest.name}</h3>
                            <p style="font-size:0.84rem; color:var(--tourist-text-muted); line-height:1.5; margin:0 0 1rem 0;">${dest.description.slice(0, 110)}...</p>
                            <a href="destination-detail.html?id=${dest.id}" class="tourist-btn-primary" style="width:100%; justify-content:center; box-sizing:border-box; font-size:0.85rem;">
                                View Destination Circuit →
                            </a>
                        </div>
                    </div>
                `).join('');
            } else {
                grid.innerHTML = `
                    <div style="grid-column: 1 / -1; padding: 3rem; text-align: center; background: var(--tourist-bg-subtle); border-radius: 12px;">
                        <span style="font-size: 2.5rem; display: block; margin-bottom: 0.75rem;">🤍</span>
                        <h4 style="font-size: 1.15rem; color: var(--tourist-text-heading); margin: 0 0 0.5rem 0;">Your Travel Wishlist is Empty</h4>
                        <p style="font-size: 0.88rem; color: var(--tourist-text-muted); max-width: 440px; margin: 0 auto 1.25rem auto;">
                            Click the heart icon on any destination or experience to build your personalized multi-day trip plan.
                        </p>
                        <a href="destinations.html" class="tourist-btn-primary">Browse Destinations</a>
                    </div>
                `;
            }

            // Asynchronously load saved custom itineraries from backend
            if (typeof window !== 'undefined' && window.YatraSetuApi && typeof window.YatraSetuApi.hasToken === 'function' && window.YatraSetuApi.hasToken()) {
                window.YatraSetuApi.getTouristItineraries().then(plans => {
                    let itinContainer = document.getElementById('saved-itineraries-container');
                    let itinHeader = document.getElementById('saved-itineraries-header');
                    if (Array.isArray(plans) && plans.length > 0) {
                        if (!itinContainer) {
                            itinHeader = document.createElement('div');
                            itinHeader.id = 'saved-itineraries-header';
                            itinHeader.style.cssText = 'grid-column: 1 / -1; margin-top: 2rem; margin-bottom: 0.75rem;';
                            itinHeader.innerHTML = `
                                <h3 style="font-size: 1.2rem; font-weight: 800; color: var(--tourist-forest); margin: 0 0 0.25rem 0;">
                                    🎒 Saved Cloud Itineraries (${plans.length})
                                </h3>
                                <p style="font-size: 0.85rem; color: var(--tourist-text-muted); margin: 0;">
                                    Custom trip plans saved to your verified tourist account.
                                </p>
                            `;
                            itinContainer = document.createElement('div');
                            itinContainer.id = 'saved-itineraries-container';
                            itinContainer.style.cssText = 'grid-column: 1 / -1; display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1.5rem;';
                            grid.parentNode.insertBefore(itinHeader, grid);
                            grid.parentNode.insertBefore(itinContainer, grid);
                        }
                        itinContainer.innerHTML = plans.map(p => `
                            <div style="background: #FFF; border: 1px solid var(--tourist-border); border-radius: 10px; padding: 1.25rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem; box-shadow: var(--tourist-shadow-sm);">
                                <div>
                                    <h4 style="font-size: 1.05rem; font-weight: 800; color: var(--tourist-text-heading); margin: 0 0 0.25rem 0;">${p.title}</h4>
                                    <div style="font-size: 0.8rem; color: var(--tourist-text-muted);">
                                        Created: ${new Date(p.created_at).toLocaleDateString('en-GB')} • ${p.items ? p.items.length : 0} Stop(s) • ${p.notes ? p.notes.slice(0, 80) : ''}
                                    </div>
                                </div>
                                <button type="button" class="tourist-btn-outline btn-delete-saved-itinerary" data-plan-id="${p.id}" style="color: #DC2626; border-color: #FCA5A5; font-size: 0.78rem; padding: 0.35rem 0.85rem;">
                                    🗑️ Delete Itinerary
                                </button>
                            </div>
                        `).join('');

                        itinContainer.querySelectorAll('.btn-delete-saved-itinerary').forEach(btn => {
                            btn.onclick = async () => {
                                const pid = btn.getAttribute('data-plan-id');
                                if (confirm('Are you sure you want to delete this saved itinerary?')) {
                                    try {
                                        await window.YatraSetuApi.deleteTouristItinerary(pid);
                                        this.showToast('Itinerary deleted.');
                                        this.renderWishlistPlanner();
                                    } catch (e) {
                                        console.warn('Error deleting itinerary:', e);
                                    }
                                }
                            };
                        });
                    } else if (itinContainer) {
                        itinContainer.innerHTML = '';
                        if (itinHeader) itinHeader.remove();
                        itinContainer.remove();
                    }
                }).catch(e => console.warn('Could not load saved itineraries:', e));
            }
        },

        /**
         * Dedicated Stories Page Controller
         */
        initStoriesPage() {
            let activeFilter = 'all';
            const grid = document.getElementById('tourist-stories-grid');

            const renderFilteredStories = () => {
                if (!grid) return;
                const filtered = TRAVEL_STORIES.filter(s => {
                    if (activeFilter === 'all') return true;
                    if (activeFilter === 'forts') return s.category.toLowerCase().includes('fort') || s.category.toLowerCase().includes('heritage');
                    if (activeFilter === 'treks') return s.category.toLowerCase().includes('trek') || s.category.toLowerCase().includes('mountain');
                    if (activeFilter === 'backwaters') return s.category.toLowerCase().includes('backwater') || s.category.toLowerCase().includes('water');
                    if (activeFilter === 'culture') return s.category.toLowerCase().includes('spiritual') || s.category.toLowerCase().includes('culture');
                    return true;
                });

                grid.innerHTML = filtered.map(story => `
                    <div class="tourist-story-card">
                        <div class="tourist-story-thumb" style="background-image: url('${story.img}');">
                            <span class="tourist-story-badge">${story.category}</span>
                        </div>
                        <div class="tourist-story-body">
                            <h4 class="tourist-story-title">${story.title}</h4>
                            <p class="tourist-story-excerpt">${story.excerpt}</p>
                            <div class="tourist-story-meta">
                                <span>By ${story.author} • ${story.readTime}</span>
                                <button type="button" class="tourist-link-arrow btn-read-story" data-story-id="${story.id}" style="background:none; border:none; cursor:pointer; font-weight:700; color:var(--tourist-forest); padding:0;">
                                    Read Story →
                                </button>
                            </div>
                        </div>
                    </div>
                `).join('');

                grid.querySelectorAll('.btn-read-story').forEach(btn => {
                    btn.onclick = () => {
                        const id = btn.getAttribute('data-story-id');
                        const story = TRAVEL_STORIES.find(s => s.id === id);
                        if (story) this.openStoryModal(story);
                    };
                });
            };

            renderFilteredStories();

            // Filter Chips
            document.querySelectorAll('#story-filter-chips button').forEach(chip => {
                chip.onclick = () => {
                    document.querySelectorAll('#story-filter-chips button').forEach(c => c.classList.remove('active'));
                    chip.classList.add('active');
                    activeFilter = chip.getAttribute('data-story-filter') || 'all';
                    renderFilteredStories();
                };
            });

            // Modal Closers
            const btnCloseStory = document.getElementById('btn-close-story-modal');
            const btnCloseStoryFooter = document.getElementById('btn-close-story-modal-footer');
            const storyModal = document.getElementById('touristStoryModal');
            if (btnCloseStory) btnCloseStory.onclick = () => this.closeStoryModal();
            if (btnCloseStoryFooter) btnCloseStoryFooter.onclick = () => this.closeStoryModal();
            if (storyModal) {
                storyModal.onclick = (e) => {
                    if (e.target === storyModal) this.closeStoryModal();
                };
            }
        },

        /**
         * Dedicated Travel Guidance Page Controller
         */
        initTravelGuidancePage() {
            // Static structured guidance page is ready upon load
        },

        /**
         * Dedicated Destination Advisories Page Controller
         */
        initDestinationAdvisoriesPage() {
            const urlParams = new URLSearchParams(window.location.search);
            const destId = urlParams.get('id') || 'raigad-fort';
            const dest = this.destinations.find(d => d.id === destId) || this.destinations[0];

            if (!dest) return;

            const nameEl = document.getElementById('adv-dest-name');
            const locEl = document.getElementById('adv-dest-location');
            const backLink = document.getElementById('adv-back-dest-link');
            const sidebarDestBtn = document.getElementById('adv-sidebar-dest-btn');
            const authorityEl = document.getElementById('adv-authority-name');
            const basecampEl = document.getElementById('adv-basecamp-name');
            const listEl = document.getElementById('adv-bulletins-list');

            if (nameEl) nameEl.textContent = `${dest.name} — Destination Advisories & Guidelines`;
            if (locEl) locEl.textContent = `📍 ${dest.location} • ${dest.state_name || 'India'}`;
            if (backLink) backLink.href = `destination-detail.html?id=${encodeURIComponent(dest.id)}`;
            if (sidebarDestBtn) sidebarDestBtn.href = `destination-detail.html?id=${encodeURIComponent(dest.id)}`;
            if (authorityEl) authorityEl.textContent = `${dest.state_name || 'State'} Tourism Development Corporation (STDC)`;
            if (basecampEl) basecampEl.textContent = `${dest.name} Base Checkpoint Station`;

            const renderAdvisoriesList = (bulletinsList) => {
                if (!listEl) return;
                if (bulletinsList.length > 0) {
                    listEl.innerHTML = bulletinsList.map(b => `
                        <div class="tourist-advisory-card" style="margin-bottom:1.25rem;">
                            <div class="advisory-header">
                                <span class="advisory-icon">${b.icon || '🚨'}</span>
                                <div>
                                    <h4 class="advisory-title">${b.title}</h4>
                                    <div class="advisory-date">Published: ${b.date} • ${b.category || 'Safety Advisory Directive'}</div>
                                </div>
                            </div>
                            <p class="advisory-content">${b.content}</p>
                            ${b.guidance ? `
                                <div class="advisory-guidance-box">
                                    <strong style="color:var(--tourist-text-heading); display:block; margin-bottom:0.25rem;">Mandatory Visitor Directive:</strong>
                                    <span>${b.guidance}</span>
                                </div>
                            ` : ''}
                        </div>
                    `).join('');
                } else {
                    listEl.innerHTML = `
                        <div class="tourist-advisory-card">
                            <div class="advisory-header">
                                <span class="advisory-icon">🌿</span>
                                <div>
                                    <h4 class="advisory-title">Standard Trail Conditions & Safety Protocols Active</h4>
                                    <div class="advisory-date">All routes open for verified visitor exploration</div>
                                </div>
                            </div>
                            <p class="advisory-content">
                                Trails, heritage bastions, and visitor approaches are reported clear by Destination Managers. Normal daylight visiting hours (06:00 AM – 06:00 PM) apply.
                            </p>
                            <div class="advisory-guidance-box">
                                <strong style="color:var(--tourist-text-heading); display:block; margin-bottom:0.25rem;">Zero-Plastic Code:</strong>
                                <span>Carry all personal waste back to base camp disposal points. Do not discard plastic wrappers or containers on heritage trails.</span>
                            </div>
                        </div>
                    `;
                }
            };

            const defaultBulletins = this.getDestinationAnnouncements(dest.id);
            renderAdvisoriesList(defaultBulletins);

            // Fetch live advisories from backend if available
            if (typeof window !== 'undefined' && window.YatraSetuApi && typeof window.YatraSetuApi.getTouristAdvisories === 'function') {
                window.YatraSetuApi.getTouristAdvisories(dest.id).then(liveAdvs => {
                    if (Array.isArray(liveAdvs) && liveAdvs.length > 0) {
                        const mapped = liveAdvs.map(a => ({
                            id: a.id,
                            destination_id: a.destination_id,
                            icon: a.severity === 'critical' ? '🛑' : (a.severity === 'warning' ? '⚠️' : 'ℹ️'),
                            title: a.title,
                            date: new Date(a.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
                            category: `${a.severity.toUpperCase()} Directive`,
                            content: a.description,
                            guidance: a.valid_until ? `Valid until: ${new Date(a.valid_until).toLocaleDateString('en-GB')}` : 'Active advisory published by Destination Manager'
                        }));
                        renderAdvisoriesList(mapped);
                    }
                }).catch(err => console.warn('Could not fetch live destination advisories:', err));
            }
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

            // Intercept navigation links on destinations.html for smooth intra-page category switching
            document.querySelectorAll('a[href*="destinations.html?category="]').forEach(link => {
                link.onclick = (e) => {
                    e.preventDefault();
                    const href = link.getAttribute('href');
                    const match = href.match(/category=([\w-]+)/);
                    if (match && match[1]) {
                        const cat = match[1];
                        history.pushState(null, '', `destinations.html?category=${cat}`);
                        this.currentFilters.categories = [cat];
                        document.querySelectorAll('.category-filter-checkbox').forEach(cb => {
                            cb.checked = (cb.value === cat);
                        });
                        this.renderFilteredDestinations();
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                };
            });

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
                                <img src="${dest.img}" alt="${dest.name}" class="dest-card-media-img" loading="lazy" onerror="this.onerror=null; this.src='../assets/images/hero-india.jpg';">
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
                return { valid: false, reason: 'GPS survey pending Destination Manager verification' };
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
            let attractions = (this.apiAttractions && this.apiAttractions.length > 0)
                ? this.apiAttractions
                : ((window.YatraSetuManagerData && window.YatraSetuManagerData.attractions) || []);
            // Strict relationship: only attractions explicitly tagged with this destination_id (or alias)
            const matched = attractions.filter(a => matchesDestId(a.destination_id, destId));
            const dest = (this.destinations || []).find(d => matchesDestId(d.id, destId));
            return matched.map(a => ({
                ...a,
                img: this.resolveAttractionImage(a, dest)
            }));
        },

        getDestinationVideos(destId) {
            let videos = [];
            // 1. Live API videos if fetched
            if (this.apiVideos && Array.isArray(this.apiVideos)) {
                videos.push(...this.apiVideos);
            }
            // 2. Manager shared in-memory data
            if (window.YatraSetuManagerData && Array.isArray(window.YatraSetuManagerData.destinationVideos)) {
                window.YatraSetuManagerData.destinationVideos.forEach(v => {
                    if (!videos.some(ev => String(ev.id) === String(v.id))) {
                        videos.push(v);
                    }
                });
            }

            // 3. Restore manager-published videos from authoritative storage (localStorage / sessionStorage)
            try {
                const rawStored = localStorage.getItem('yatrasetu_destination_videos') || sessionStorage.getItem('yatrasetu_destination_videos');
                if (rawStored) {
                    const parsed = JSON.parse(rawStored);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        const map = new Map(videos.map(v => [String(v.id), v]));
                        parsed.forEach(item => {
                            const key = String(item.id);
                            if (map.has(key)) {
                                Object.assign(map.get(key), item);
                            } else {
                                videos.push(item);
                                map.set(key, item);
                            }
                        });
                    }
                }
            } catch (e) {
                console.warn('[tourist.js] Video storage read error:', e);
            }

            // Official published videos explicitly tagged with this destination_id (or alias)
            return videos.filter(v => matchesDestId(v.destination_id, destId) && (v.status === 'Published' || !v.status));
        },

        renderDestinationVideosTab(destId) {
            const videos = this.getDestinationVideos(destId);
            const tabVideoCount = document.getElementById('tab-video-count');
            if (tabVideoCount) tabVideoCount.textContent = videos.length;

            const videosGrid = document.getElementById('detail-videos-grid');
            if (videosGrid) {
                if (videos.length > 0) {
                    videosGrid.innerHTML = videos.map(vid => `
                        <div class="tourist-video-card" data-video-id="${vid.id}" style="cursor: pointer;">
                            <div class="video-thumb-wrap" style="background-image: url('${vid.thumbnail_url || '../assets/images/thumb-rajgad.jpg'}');">
                                <div class="video-play-btn" aria-label="Play orientation video">▶</div>
                                <span class="video-duration-tag">⏱ ${vid.duration || '0:30'}</span>
                            </div>
                            <div class="video-card-body">
                                <h4 class="video-card-title">${vid.title}</h4>
                                <p class="video-card-desc">${vid.description || ''}</p>
                                <div class="video-card-meta">
                                    <span>${vid.publisher || 'Department of Tourism'}</span>
                                    <span style="color:var(--tourist-forest); font-weight:700;">● Verified Media</span>
                                </div>
                            </div>
                        </div>
                    `).join('');

                    videosGrid.querySelectorAll('.tourist-video-card').forEach(card => {
                        card.onclick = () => {
                            const vidId = card.getAttribute('data-video-id');
                            const video = videos.find(v => String(v.id) === String(vidId));
                            if (video) this.openVideoModal(video);
                        };
                    });
                } else {
                    videosGrid.innerHTML = `
                        <div style="grid-column: 1 / -1; padding: 2.5rem; text-align: center; background: var(--tourist-bg-subtle); border-radius: 12px;">
                            <span style="font-size: 2.5rem; display: block; margin-bottom: 0.75rem;">🎬</span>
                            <h4 style="font-size: 1.1rem; color: var(--tourist-text-heading); margin: 0 0 0.5rem 0;">No Verified Videos Published Yet</h4>
                            <p style="font-size: 0.88rem; color: var(--tourist-text-muted); max-width: 480px; margin: 0 auto;">
                                Short 30-second audiovisual orientation guides for this destination are currently under production or pending Destination Manager review.
                            </p>
                        </div>
                    `;
                }
            }
        },

        getApprovedStakeholders(destId) {
            let shList = (window.YatraSetuManagerData && window.YatraSetuManagerData.stakeholders) ? [...window.YatraSetuManagerData.stakeholders] : [];

            // Restore manager-approved stakeholders from authoritative storage (localStorage / sessionStorage)
            try {
                const rawStored = localStorage.getItem('yatrasetu_manager_stakeholders') || sessionStorage.getItem('yatrasetu_manager_stakeholders');
                if (rawStored) {
                    const parsed = JSON.parse(rawStored);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        const map = new Map(shList.map(s => [s.id, s]));
                        parsed.forEach(item => {
                            if (map.has(item.id)) {
                                Object.assign(map.get(item.id), item);
                            } else {
                                shList.push(item);
                                map.set(item.id, item);
                            }
                        });
                    }
                }
            } catch (e) {
                console.warn('[tourist.js] Stakeholder storage read error:', e);
            }

            // Strict role privacy & publication boundary:
            // 1. Must match destination_id
            // 2. Must be Approved
            // 3. Must not be Deactivated
            // 4. Strip private internal manager_note to prevent leak of administrative data
            return shList
                .filter(s => matchesDestId(s.destination_id, destId) && s.status === 'Approved' && s.account_status !== 'Deactivated')
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
            const events = (this.apiEvents && this.apiEvents.length > 0)
                ? this.apiEvents
                : ((window.YatraSetuManagerData && window.YatraSetuManagerData.events) || []);
            return events.filter(e => matchesDestId(e.destination_id, destId));
        },

        getDestinationAnnouncements(destId) {
            const advisories = (window.YatraSetuStakeholderData && window.YatraSetuStakeholderData.announcements) || [];
            return advisories.filter(a => matchesDestId(a.destination_id, destId));
        },

        getDestinationFeedback(destId) {
            let deletedIds = new Set();
            try {
                const rawDeleted = localStorage.getItem('yatrasetu_deleted_feedback_ids');
                if (rawDeleted) {
                    const parsed = JSON.parse(rawDeleted);
                    if (Array.isArray(parsed)) deletedIds = new Set(parsed);
                }
            } catch (e) {}

            const defaultFeedback = ((window.YatraSetuManagerData && window.YatraSetuManagerData.feedback) || [])
                .filter(f => matchesDestId(f.destination_id, destId) && !deletedIds.has(f.id));

            try {
                // Single authoritative storage across tabs is localStorage
                const rawStored = localStorage.getItem('yatrasetu_tourist_feedback');
                if (rawStored) {
                    const parsed = JSON.parse(rawStored);
                    if (Array.isArray(parsed)) {
                        const validUserSubmissions = parsed.filter(f => !deletedIds.has(f.id));
                        // Keep sessionStorage strictly synchronized to avoid stale resurrection
                        sessionStorage.setItem('yatrasetu_tourist_feedback', JSON.stringify(validUserSubmissions));
                        const userForDest = validUserSubmissions.filter(f => matchesDestId(f.destination_id, destId));
                        return [...userForDest, ...defaultFeedback];
                    }
                }
            } catch (err) {
                console.warn('Could not read user feedback storage:', err);
            }
            return defaultFeedback;
        },

        getNearbyDestinations(dest) {
            // Truthful regional circuit: other destinations in same administrative state
            return this.destinations.filter(d => d.state_id === dest.state_id && !matchesDestId(d.id, dest.id));
        },

        /**
         * ----------------------------------------------------------------------
         * 8. Destination Detail Page Controller (Mockup 3 + Live Integrations)
         * ----------------------------------------------------------------------
         */
        async initDestinationDetailPage() {
            const urlParams = new URLSearchParams(window.location.search);
            const destId = urlParams.get('id') || 'rajgad-fort';
            console.log('[DEBUG DETAIL 1] Starting initDestinationDetailPage for:', destId);

            // 1. Authoritative: Fetch latest persisted detail from REST API
            if (typeof window !== 'undefined' && window.YatraSetuApi && typeof window.YatraSetuApi.getDestination === 'function') {
                try {
                    console.log('[DEBUG DETAIL 2] Calling api.getDestination...');
                    const apiDest = await window.YatraSetuApi.getDestination(destId).catch((err) => {
                        console.warn('[DEBUG DETAIL 2b] Fetch error:', err);
                        return null;
                    });
                    console.log('[DEBUG DETAIL 3] Got apiDest:', apiDest ? apiDest.id : null);
                    if (apiDest && apiDest.id) {
                        const existingList = this.destinations ? [...this.destinations.filter(d => !matchesDestId(d.id, apiDest.id))] : [];
                        this.enrichDestinations([apiDest, ...existingList]);
                    }
                } catch (e) {
                    console.warn('[tourist.js] Live destination detail fetch note:', e);
                }
            }

            console.log('[DEBUG DETAIL 4] Finding destination in list...');
            let dest = (this.destinations || []).find(d => matchesDestId(d.id, destId));
            console.log('[DEBUG DETAIL 5] Found dest:', dest ? dest.id : null);

            // 2. Fallback to manager shared data / local storage if API was unreachable
            if (!dest && window.YatraSetuManagerData && Array.isArray(window.YatraSetuManagerData.destinations)) {
                const foundRaw = window.YatraSetuManagerData.destinations.find(d => matchesDestId(d.id, destId));
                if (foundRaw) {
                    this.enrichDestinations([...(window.YatraSetuManagerData.destinations || [])]);
                    dest = (this.destinations || []).find(d => matchesDestId(d.id, destId));
                }
            }

            if (!dest) {
                dest = (this.destinations || [])[0];
            }

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

            // Apply State Theme Consistency
            if (dest.state_id) {
                document.documentElement.setAttribute('data-theme', dest.state_id);
                document.documentElement.setAttribute('data-state-theme', dest.state_id);
                if (document.body) {
                    document.body.setAttribute('data-theme', dest.state_id);
                    document.body.setAttribute('data-state-theme', dest.state_id);
                }
            }

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
            const destRating = dest.rating || '4.8';
            const rawRevCount = dest.reviewsCount || '1.2k';
            const revLabel = String(rawRevCount).toLowerCase().includes('review') ? rawRevCount : `${rawRevCount} reviews`;
            if (ratingEl) ratingEl.textContent = `★ ${destRating} (${revLabel})`;

            const subEl = document.getElementById('detail-dest-subtitle');
            if (subEl) subEl.textContent = dest.subtitle;

            const tagsContainer = document.getElementById('detail-dest-tags');
            if (tagsContainer) {
                tagsContainer.innerHTML = dest.tags.map(t => `<span class="detail-hero-tag">${t}</span>`).join('');
            }

            // Wire Favorite Button in Detail Hero & Quick Save Card
            const favBtn = document.getElementById('detail-fav-btn');
            const quickSaveBtn = document.getElementById('btn-quick-save-detail');
            if (favBtn) favBtn.setAttribute('data-dest-id', dest.id);

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

            const isFavInitial = this.favorites ? this.favorites.has(dest.id) : false;
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
            // Key Facts Sheet
            const factClass = document.getElementById('fact-classification');
            if (factClass) factClass.textContent = dest.category || 'Heritage Monument & Scenic Destination';

            const factDist = document.getElementById('fact-district');
            if (factDist) factDist.textContent = dest.location || (dest.state_name ? `${dest.state_name}, India` : 'India');

            const factElev = document.getElementById('fact-elevation');
            if (factElev) factElev.textContent = dest.elevation || (dest.id === 'raigad-fort' ? '1,376 m (4,514 ft) ASL' : (dest.id === 'lonavala' ? '624 m (2,047 ft) ASL' : (dest.id === 'munnar-hills' ? '1,532 m (5,026 ft) ASL' : 'Regional Plateau & Landscape')));

            const factSeas = document.getElementById('fact-season');
            if (factSeas) factSeas.textContent = dest.season || 'October to March (Winter / Post-Monsoon)';

            const factDur = document.getElementById('fact-duration');
            if (factDur) factDur.textContent = dest.ideal_duration || 'Full Day (5 – 7 Hours)';

            const factDiff = document.getElementById('fact-difficulty');
            if (factDiff) factDiff.textContent = dest.difficulty || (dest.category.includes('Fort') || dest.tags.includes('Trekking') ? 'Moderate to Strenuous Ridge Trek' : 'Accessible / Leisure Exploration');

            const descEl = document.getElementById('detail-dest-description');
            if (descEl) descEl.textContent = dest.description;

            const historyBgEl = document.getElementById('detail-history-bg');
            if (historyBgEl) historyBgEl.textContent = dest.history_background || `Originating in the regional chronicles of ${dest.state_name || 'India'}, ${dest.name} represents a foundational monument in local cultural geography. Historical records document continuous settlement, strategic fortification, and royal patronage over successive centuries.`;

            const archEl = document.getElementById('detail-heritage-arch');
            if (archEl) archEl.textContent = dest.heritage_architecture || `Constructed in traditional regional masonry, ${dest.name} demonstrates indigenous engineering adapted to the local topography and climate, featuring monumental entryways, stone ramparts, and specialized rainwater harvesting systems.`;

            const cultureEl = document.getElementById('detail-culture-trad');
            if (cultureEl) cultureEl.textContent = dest.cultural_significance || `Deeply rooted in the living traditions of ${dest.state_name || 'India'}, ${dest.name} serves as a cultural landmark celebrated in regional folklore, seasonal festivities, and community heritage gatherings.`;

            const geoEl = document.getElementById('detail-geography-landmarks');
            if (geoEl) geoEl.textContent = dest.geography_landmarks || `Occupying a prominent terrain vantage point overlooking arterial river valleys, ${dest.name} is surrounded by natural buffer zones, panoramic lookouts, and regional nature corridors.`;

            // Wire Official Advisories Button in Overview
            const advBtn = document.getElementById('btn-view-all-advisories');
            if (advBtn) {
                advBtn.href = `destination-advisories.html?id=${encodeURIComponent(dest.id)}`;
            }

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

            // Overview Attractions Preview (Up to 4) with Interactive Click Modal
            const attrPreviewGrid = document.getElementById('detail-attractions-grid');
            if (attrPreviewGrid) {
                if (attractions.length > 0) {
                    attrPreviewGrid.innerHTML = attractions.slice(0, 4).map(attr => `
                        <div class="detail-attr-item" data-attr-id="${attr.id}" style="cursor:pointer;" title="Click to view attraction details">
                            <div class="detail-attr-thumb" style="background-image: url('${attr.img}');"></div>
                            <div class="detail-attr-body">
                                <h4 class="detail-attr-name">${attr.name}</h4>
                                <div class="detail-attr-cat">${attr.category} • ⭐ ${attr.rating || '4.8'}</div>
                                <div style="font-size:0.72rem; color:var(--tourist-forest); font-weight:700; margin-top:3px;">View Details ↗</div>
                            </div>
                        </div>
                    `).join('');

                    attrPreviewGrid.querySelectorAll('.detail-attr-item').forEach(item => {
                        item.onclick = () => {
                            const id = item.getAttribute('data-attr-id');
                            const attr = attractions.find(a => a.id === id);
                            if (attr) this.openAttractionModal(attr);
                        };
                    });
                } else {
                    attrPreviewGrid.innerHTML = `
                        <div style="grid-column: 1 / -1; padding: 1.25rem; background: var(--tourist-bg-subtle); border-radius: 8px; font-size: 0.85rem; color: var(--tourist-text-muted);">
                            Associated attractions are currently curated by the regional Destination Manager. Check back soon for localized updates.
                        </div>
                    `;
                }
            }

            // Visual Gallery in Overview Tab & Hero Strip
            const gallery = this.getDestinationGallery(dest);
            const heroPhotoCount = document.getElementById('hero-photo-count');
            if (heroPhotoCount) heroPhotoCount.textContent = gallery.length;

            const btnHeroPhotos = document.getElementById('btn-hero-view-photos');
            if (btnHeroPhotos) {
                btnHeroPhotos.onclick = () => {
                    this.openLightbox(0, gallery, dest.name);
                };
            }

            const galleryGrid = document.getElementById('detail-gallery-grid');
            if (galleryGrid) {
                galleryGrid.innerHTML = gallery.map((item, idx) => `
                    <div class="detail-gallery-item" data-photo-idx="${idx}" title="${item.title}">
                        <img src="${item.url}" alt="${item.title}" loading="lazy" onerror="this.onerror=null; this.src='${dest.img}';">
                        <span class="detail-gallery-tag">${item.tag}</span>
                        <div class="detail-gallery-caption">${item.title}</div>
                    </div>
                `).join('');

                galleryGrid.querySelectorAll('.detail-gallery-item').forEach(el => {
                    el.onclick = () => {
                        const idx = parseInt(el.getAttribute('data-photo-idx'), 10);
                        this.openLightbox(idx, gallery, dest.name);
                    };
                });
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
                            <p style="font-size:0.8rem; margin:0.35rem 0 0 0;">GPS coordinates are being verified by the Destination Management Team.</p>
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
                        <div class="tourist-attraction-card" data-attr-id="${attr.id}" style="cursor:pointer;" title="Click to view attraction details">
                            <div class="attr-card-media" style="background-image: url('${attr.img}');">
                                <span class="attr-card-tag">${attr.category}</span>
                                <span class="attr-card-rating">★ ${attr.rating || '4.8'}</span>
                            </div>
                            <div class="attr-card-body">
                                <h4 class="attr-card-title">${attr.name}</h4>
                                <p class="attr-card-desc">${attr.description || 'Verified secondary attraction catalogued under destination jurisdiction.'}</p>
                                <div class="attr-card-meta">
                                    <span>🕒 ${attr.timings || '06:00 AM – 06:00 PM'}</span>
                                    <span>⏱️ ${attr.duration || '1.5 – 2.5 Hours'}</span>
                                </div>
                                <div class="attr-card-action">
                                    <span class="attr-verified-badge">✓ Verified Landmark</span>
                                    <span class="tourist-link-arrow">View Details →</span>
                                </div>
                            </div>
                        </div>
                    `).join('');

                    attractionsCardsContainer.querySelectorAll('.tourist-attraction-card').forEach(card => {
                        card.onclick = () => {
                            const id = card.getAttribute('data-attr-id');
                            const attr = attractions.find(a => a.id === id);
                            if (attr) this.openAttractionModal(attr);
                        };
                    });
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
            this.renderDestinationVideosTab(dest.id);

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
                                <div><strong>📍 Base Hub:</strong> ${sh.address || 'Local Hub'}</div>
                                <div><strong>🕒 Hours:</strong> ${sh.hours || 'Standard Hours'}</div>
                                <div><strong>💰 Indicative Guide Rate:</strong> ${sh.price_range || 'Contact Partner'}</div>
                            </div>
                            <div class="stakeholder-card-actions">
                                <a href="tel:${sh.contact_phone || '1800-233-7799'}" class="tourist-btn-outline" style="font-size:0.82rem; padding:0.5rem 0.85rem; text-decoration:none;">
                                    📞 Contact
                                </a>
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
                                Local tourism operators and guides in this destination are currently undergoing platform verification and community onboarding by the regional Destination Manager.
                            </p>
                        </div>
                    `;
                }
            }

            // =================================================================
            // TAB 4: EXPERIENCES PANE
            // =================================================================
            const destExpGrid = document.getElementById('detail-experiences-grid');
            const destExperiences = this.getDestinationExperiences(dest.id);
            const tabExpCount = document.getElementById('tab-exp-count');
            if (tabExpCount) tabExpCount.textContent = destExperiences.length;

            if (destExpGrid) {
                if (destExperiences.length > 0) {
                    destExpGrid.innerHTML = destExperiences.map(exp => `
                        <div class="experience-full-card">
                            <div class="exp-full-img" style="background-image: url('${exp.img}');">
                                <span class="exp-full-badge">${exp.category_label || exp.category}</span>
                            </div>
                            <div class="exp-full-content">
                                <h3 class="exp-full-title">${exp.title}</h3>
                                <div class="exp-full-loc">📍 ${exp.location}</div>
                                <p class="exp-full-desc">${exp.desc}</p>
                                <div class="exp-full-meta-grid">
                                    <div><strong>⏱️ Duration:</strong> ${exp.duration}</div>
                                    <div><strong>💪 Difficulty:</strong> ${exp.difficulty}</div>
                                    <div><strong>☀️ Best Season:</strong> ${exp.season}</div>
                                    <div><strong>🧭 Guide:</strong> ${exp.guide}</div>
                                </div>
                                <button type="button" class="tourist-btn-primary btn-view-dest-exp" data-exp-id="${exp.id}" style="width:100%; justify-content:center;">
                                    View Experience Details <span>→</span>
                                </button>
                            </div>
                        </div>
                    `).join('');

                    destExpGrid.querySelectorAll('.btn-view-dest-exp').forEach(btn => {
                        btn.onclick = () => {
                            const expId = btn.getAttribute('data-exp-id');
                            const exp = destExperiences.find(e => e.id === expId) || EXPERIENCES_DATA.find(e => e.id === expId);
                            if (exp) {
                                this.openExperienceModal(exp);
                            } else {
                                console.warn('Experience record not found for id:', expId);
                            }
                        };
                    });
                } else {
                    destExpGrid.innerHTML = `
                        <div style="grid-column: 1 / -1; padding: 2.5rem; text-align: center; background: var(--tourist-bg-subtle); border-radius: 12px;">
                            <span style="font-size: 2.5rem; display: block; margin-bottom: 0.75rem;">🧭</span>
                            <h4 style="font-size: 1.1rem; color: var(--tourist-text-heading); margin: 0 0 0.5rem 0;">No Dedicated Experiences Listed</h4>
                            <p style="font-size: 0.88rem; color: var(--tourist-text-muted); max-width: 480px; margin: 0 auto;">
                                Experience trails for this destination are currently being verified with regional eco-guides.
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
                    eventsGrid.innerHTML = events.map((ev, i) => `
                        <div class="tourist-event-card">
                            <div class="event-thumb" style="background-image:url('${ev.img || dest.img}');">
                                <div class="event-date-box">
                                    <span class="event-date-num">${ev.dateNum || '28'}</span>
                                    <span class="event-date-month">${ev.dateMonth || 'SEP'}</span>
                                </div>
                            </div>
                            <div class="event-body">
                                <div class="event-header-row">
                                    <span class="event-status-pill ${ev.statusClass || 'active'}">${ev.status || 'Active'}</span>
                                    <span class="event-cat-tag">Regional Festival</span>
                                </div>
                                <h4 class="event-title">${ev.title}</h4>
                                <div class="event-loc">📍 ${ev.location || ev.loc || dest.name}</div>
                                <p class="event-desc">${ev.description || 'Scheduled regional festival organized under local tourism coordination.'}</p>
                                <div class="event-meta-row">
                                    <span>🕒 ${ev.timings || 'Scheduled Program'}</span>
                                    <button type="button" class="tourist-btn-primary btn-view-event-detail" data-event-idx="${i}" style="font-size:0.75rem; padding:0.35rem 0.85rem;">
                                        View Details ↗
                                    </button>
                                </div>
                            </div>
                        </div>
                    `).join('');

                    eventsGrid.querySelectorAll('.btn-view-event-detail').forEach(btn => {
                        btn.onclick = () => {
                            const idx = parseInt(btn.getAttribute('data-event-idx'), 10);
                            const ev = events[idx];
                            if (ev) this.openEventModal(ev);
                        };
                    });
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

            // Event Modal Closers
            const btnCloseEvent = document.getElementById('btn-close-event-modal');
            const btnCloseEventFooter = document.getElementById('btn-close-event-modal-footer');
            const eventModal = document.getElementById('touristEventModal');
            if (btnCloseEvent) btnCloseEvent.onclick = () => this.closeEventModal();
            if (btnCloseEventFooter) btnCloseEventFooter.onclick = () => this.closeEventModal();
            if (eventModal) {
                eventModal.onclick = (e) => {
                    if (e.target === eventModal) this.closeEventModal();
                };
            }

            // =================================================================
            // TAB 7: REGIONAL CIRCUIT (NEARBY DESTINATIONS IN STATE)
            // =================================================================
            const nearbyGrid = document.getElementById('detail-nearby-grid');
            if (nearbyGrid) {
                if (nearbyDestinations.length > 0) {
                    nearbyGrid.innerHTML = nearbyDestinations.map(d => `
                        <div class="circuit-dest-card">
                            <div class="circuit-dest-thumb" style="background-image: url('${d.img}');">
                                <span class="circuit-rank-badge">#${d.rank || 1} in State</span>
                                <span class="circuit-cat-badge">${d.category}</span>
                            </div>
                            <div class="circuit-dest-body">
                                <h4 class="circuit-dest-name">${d.name}</h4>
                                <div class="circuit-dest-loc">📍 ${d.location}</div>
                                <p class="circuit-dest-desc">${(d.description || '').slice(0, 95)}...</p>
                                <a href="destination-detail.html?id=${d.id}" class="tourist-btn-primary" style="width:100%; justify-content:center; box-sizing:border-box; font-size:0.82rem; padding:0.5rem 0.85rem; text-decoration:none;">
                                    Explore Destination <span>→</span>
                                </a>
                            </div>
                        </div>
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
            const renderReviewsList = async () => {
                feedbackList = this.getDestinationFeedback(dest.id);

                // Asynchronously fetch authoritative reviews from backend if available
                if (typeof window !== 'undefined' && window.YatraSetuApi && typeof window.YatraSetuApi.getDestinationReviews === 'function') {
                    try {
                        const apiReviews = await window.YatraSetuApi.getDestinationReviews(dest.id);
                        if (Array.isArray(apiReviews) && apiReviews.length > 0) {
                            const mapped = apiReviews.map(r => ({
                                id: r.id,
                                destination_id: r.destination_id,
                                author: r.author_name,
                                rating: r.rating,
                                date: new Date(r.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
                                category: r.category || 'General',
                                text: r.comment,
                                status: r.review_status === 'approved' ? 'Approved' : 'Pending Review',
                                is_user_submission: r.is_own_review
                            }));
                            feedbackList = mapped;
                        }
                    } catch (e) {
                        console.warn('Could not fetch live destination reviews:', e);
                    }
                }

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
                                    ✓ Submitted by You (${item.status || 'Pending Review'})
                                </div>
                            ` : `
                                <div style="display:inline-block; font-size:0.72rem; background:var(--tourist-bg-subtle); color:var(--tourist-forest); padding:2px 8px; border-radius:4px; font-weight:700; margin-top:0.5rem;">
                                    ✓ Verified Destination Review Record
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

            modal.classList.add('active', 'show');
            document.body.style.overflow = 'hidden';
        },

        closeVideoModal() {
            const modal = document.getElementById('touristVideoModal');
            if (!modal) return;
            const frameContainer = document.getElementById('video-player-frame-container');
            // Clear iframe to immediately stop video & audio playback
            if (frameContainer) frameContainer.innerHTML = '';
            modal.classList.remove('active', 'show');
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

            modal.classList.add('active', 'show');
            document.body.style.overflow = 'hidden';
        },

        closeStakeholderModal() {
            const modal = document.getElementById('touristStakeholderModal');
            if (!modal) return;
            modal.classList.remove('active', 'show');
            document.body.style.overflow = '';
        },

        openFeedbackModal() {
            const modal = document.getElementById('touristFeedbackModal');
            if (!modal) return;
            modal.classList.add('active', 'show');
            document.body.style.overflow = 'hidden';
            const nameInput = document.getElementById('fb-author-name');
            if (nameInput) nameInput.focus();
        },

        closeFeedbackModal() {
            const modal = document.getElementById('touristFeedbackModal');
            if (!modal) return;
            modal.classList.remove('active', 'show');
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

            // Attraction Modal Closers
            const btnCloseAttr = document.getElementById('btn-close-attr-modal');
            const btnCloseAttrFooter = document.getElementById('btn-close-attr-modal-footer');
            const attrModal = document.getElementById('touristAttractionModal');
            if (btnCloseAttr) btnCloseAttr.onclick = () => this.closeAttractionModal();
            if (btnCloseAttrFooter) btnCloseAttrFooter.onclick = () => this.closeAttractionModal();
            if (attrModal) {
                attrModal.onclick = (e) => {
                    if (e.target === attrModal) this.closeAttractionModal();
                };
            }

            // Experience Modal Closers
            const btnCloseExp = document.getElementById('btn-close-exp-modal');
            const btnCloseExpFooter = document.getElementById('btn-close-exp-modal-footer');
            const expModal = document.getElementById('touristExperienceModal');
            if (btnCloseExp) btnCloseExp.onclick = () => this.closeExperienceModal();
            if (btnCloseExpFooter) btnCloseExpFooter.onclick = () => this.closeExperienceModal();
            if (expModal) {
                expModal.onclick = (e) => {
                    if (e.target === expModal) this.closeExperienceModal();
                };
            }

            // Lightbox Closers & Navigation
            const btnCloseLb = document.getElementById('btn-close-lightbox');
            const btnPrevLb = document.getElementById('btn-lightbox-prev');
            const btnNextLb = document.getElementById('btn-lightbox-next');
            const lbModal = document.getElementById('touristLightboxModal');

            if (btnCloseLb) btnCloseLb.onclick = () => this.closeLightbox();
            if (btnPrevLb) btnPrevLb.onclick = () => this.prevLightbox();
            if (btnNextLb) btnNextLb.onclick = () => this.nextLightbox();
            if (lbModal) {
                lbModal.onclick = (e) => {
                    if (e.target === lbModal || e.target.classList.contains('lightbox-stage') || e.target.classList.contains('lightbox-main-img-wrap')) {
                        this.closeLightbox();
                    }
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
                fbForm.onsubmit = async (e) => {
                    e.preventDefault();
                    const name = (document.getElementById('fb-author-name') || {}).value || 'Guest Traveler';
                    const rating = parseInt((document.getElementById('fb-rating-select') || {}).value || '5', 10);
                    const category = (document.getElementById('fb-category-select') || {}).value || 'reviews';
                    const comments = (document.getElementById('fb-comments') || {}).value || '';

                    if (comments.trim().length < 10) {
                        alert('Please provide at least 10 characters of descriptive feedback to assist Destination Managers.');
                        return;
                    }

                    // Try backend API submission if authenticated
                    if (typeof window !== 'undefined' && window.YatraSetuApi && typeof window.YatraSetuApi.hasToken === 'function' && window.YatraSetuApi.hasToken()) {
                        try {
                            await window.YatraSetuApi.submitDestinationReview({
                                destination_id: dest.id,
                                rating: rating,
                                category: category,
                                comment: comments.trim(),
                                guest_author_name: name.trim()
                            });
                            fbForm.reset();
                            this.closeFeedbackModal();
                            if (onFeedbackAdded) await onFeedbackAdded();
                            this.showToast('Review submitted successfully! Pending destination manager moderation.');
                            return;
                        } catch (err) {
                            console.warn('API review submission error, falling back to local storage:', err);
                        }
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
                        status: 'Pending Review',
                        is_user_submission: true
                    };

                    // Persist to authoritative localStorage and sync sessionStorage
                    try {
                        let existing = [];
                        const rawStored = localStorage.getItem('yatrasetu_tourist_feedback');
                        if (rawStored) {
                            try { existing = JSON.parse(rawStored); } catch (e) {}
                        }
                        if (Array.isArray(existing) && !existing.some(f => f.id === newFeedbackItem.id)) {
                            existing.unshift(newFeedbackItem);
                            localStorage.setItem('yatrasetu_tourist_feedback', JSON.stringify(existing));
                            sessionStorage.setItem('yatrasetu_tourist_feedback', JSON.stringify(existing));
                        }
                    } catch (err) {
                        console.warn('Could not persist tourist feedback to storage:', err);
                    }

                    fbForm.reset();
                    this.closeFeedbackModal();
                    if (onFeedbackAdded) onFeedbackAdded();
                    this.showToast('Feedback submitted successfully! Thank you for supporting destination stewardship.');
                };
            }

            // Global Keydown Handler (ESC, ArrowLeft, ArrowRight)
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    this.closeWishlistDrawer();
                    this.closeVideoModal();
                    this.closeStakeholderModal();
                    this.closeFeedbackModal();
                    this.closeAttractionModal();
                    this.closeLightbox();
                    this.closeStoryModal();
                    this.closeEventModal();
                    this.closeExperienceModal();
                } else if (e.key === 'ArrowRight') {
                    if (lbModal && lbModal.classList.contains('active')) {
                        this.nextLightbox();
                    }
                } else if (e.key === 'ArrowLeft') {
                    if (lbModal && lbModal.classList.contains('active')) {
                        this.prevLightbox();
                    }
                }
            });
        },

        showToast(msg) {
            let toast = document.getElementById('tourist-toast');
            if (!toast) {
                toast = document.createElement('div');
                toast.id = 'tourist-toast';
                toast.className = 'tourist-toast';
                toast.style.cssText = 'position:fixed; bottom:24px; left:50%; transform:translateX(-50%); background:rgba(18,44,36,0.92); color:#FFF; padding:10px 20px; border-radius:8px; font-size:0.88rem; font-weight:600; box-shadow:0 8px 24px rgba(0,0,0,0.2); z-index:9999; transition:opacity 0.3s ease; opacity:0; pointer-events:none;';
                document.body.appendChild(toast);
            }
            toast.textContent = msg;
            toast.style.opacity = '1';
            clearTimeout(this._toastTimer);
            this._toastTimer = setTimeout(() => {
                if (toast) toast.style.opacity = '0';
            }, 3000);
        }
    };

    // Expose globally for testing and interactive browser usage
    window.YatraSetuTouristApp = TouristApp;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            TouristApp.init();
        });
    } else {
        TouristApp.init();
    }

})();

