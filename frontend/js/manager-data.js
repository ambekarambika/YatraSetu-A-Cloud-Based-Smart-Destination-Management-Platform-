/**
 * YatraSetu — Centralized Manager Prototype Data Repository
 * Single Source of Truth for frontend prototype records.
 * Relational schema: State -> Destination -> Attraction / Event
 */

window.YatraSetuManagerData = {
    states: [
        { id: 'maharashtra', name: 'Maharashtra', theme: 'maharashtra', badge: 'MAHARASHTRA' },
        { id: 'kerala', name: 'Kerala', theme: 'kerala', badge: 'KERALA' },
        { id: 'kashmir', name: 'Jammu & Kashmir', theme: 'kashmir', badge: 'JAMMU & KASHMIR' },
        { id: 'rajasthan', name: 'Rajasthan', theme: 'rajasthan', badge: 'RAJASTHAN' },
        { id: 'goa', name: 'Goa', theme: 'goa', badge: 'GOA' },
        { id: 'tamilnadu', name: 'Tamil Nadu', theme: 'tamilnadu', badge: 'TAMIL NADU' },
        { id: 'uttarakhand', name: 'Uttarakhand', theme: 'uttarakhand', badge: 'UTTARAKHAND' },
        { id: 'assam', name: 'Assam', theme: 'assam', badge: 'ASSAM' }
    ],

    stateConfigs: {
        maharashtra: {
            theme: 'maharashtra',
            badge: 'MAHARASHTRA',
            tagline: 'MAHARASHTRA DESTINATION MANAGEMENT',
            title: 'Maharashtra Workspace',
            subtitle: 'Manage tourism activity, monitor visitor influx, and coordinate destination stakeholders efficiently.',
            quote: '"From our forts to our festivals, Maharashtra inspires every journey." — YatraSetu',
            weather: '☀️ 26°C | Pune, Maharashtra',
            location: '📍 Rajgad Fort | Maharashtra',
            heroImg: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Rajgad_Fort_(64283).jpg',
            topDestinations: [
                { num: 1, name: 'Rajgad Fort', img: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Rajgad_Fort_(64283).jpg', category: 'Heritage Fort' },
                { num: 2, name: 'Ajanta Caves', img: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Ajanta_Caves_from_Maharashtra_state_of_India.jpg', category: 'UNESCO Cave' },
                { num: 3, name: 'Ellora Caves', img: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Ellora_Caves,_India.jpg', category: 'UNESCO Cave' },
                { num: 4, name: 'Lonavala', img: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/34/Tiger_Point_Lonavala.jpg/960px-Tiger_Point_Lonavala.jpg?utm_source=en.wikipedia.org&utm_campaign=imageinfo&utm_content=thumbnail', category: 'Hill Station' },
                { num: 5, name: 'Shirdi', img: 'https://upload.wikimedia.org/wikipedia/commons/e/e4/Sai_baba_samadhi_mandir_.jpg?utm_source=en.wikipedia.org&utm_campaign=imageinfo&utm_content=thumbnail_unscaled', category: 'Pilgrimage' }
            ],
            exploreText: 'Explore Maharashtra — Heritage • Culture • Nature • People',
            events: [
                { title: 'Monsoon Rajgad Trekking Festival', dateNum: '28', dateMonth: 'SEP', loc: 'Rajgad Fort, Maharashtra', status: 'Open', statusClass: 'active', img: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Mountaineous_trail_of_the_Rajgad_Fort.jpg' }
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
            heroImg: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/09/Munnar_-_Tea_Plantations.jpg/960px-Munnar_-_Tea_Plantations.jpg?utm_source=en.wikipedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
            topDestinations: [
                { num: 1, name: 'Munnar', img: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/09/Munnar_-_Tea_Plantations.jpg/960px-Munnar_-_Tea_Plantations.jpg?utm_source=en.wikipedia.org&utm_campaign=imageinfo&utm_content=thumbnail', category: 'Hill Station' },
                { num: 2, name: 'Alappuzha Backwaters', img: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/ee/House_Boat_DSW.jpg/500px-House_Boat_DSW.jpg?utm_source=en.wikipedia.org&utm_campaign=imageinfo&utm_content=thumbnail', category: 'Backwaters' },
                { num: 3, name: 'Wayanad Wildlife', img: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Kerala-wayanad.jpg', category: 'Wildlife' },
                { num: 4, name: 'Fort Kochi', img: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Fort_kochi.jpg', category: 'Heritage Port' },
                { num: 5, name: 'Varkala', img: 'https://upload.wikimedia.org/wikipedia/commons/4/49/Varkala_Beach%2C_Varkala%2C_Kerala.jpg?utm_source=en.wikipedia.org&utm_campaign=imageinfo&utm_content=original', category: 'Coastal Cliff' }
            ],
            exploreText: 'Explore Kerala — Nature • Backwaters • Wellness • People',
            events: [
                { title: 'Nehru Trophy Boat Race', dateNum: '14', dateMonth: 'AUG', loc: 'Alappuzha, Kerala', status: 'Open', statusClass: 'active', img: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Nehru_Trophy_Boat_Race_Kerala.jpg' }
            ]
        },
        kashmir: {
            theme: 'kashmir',
            badge: 'JAMMU & KASHMIR',
            tagline: 'JAMMU & KASHMIR DESTINATION MANAGEMENT',
            title: 'Jammu & Kashmir Workspace',
            subtitle: 'Promote paradise on earth, manage alpine valleys, houseboats, and sustainable high-altitude tourism.',
            quote: '"Gar firdaus bar roo-e zameen ast — Paradise on Earth." — YatraSetu',
            weather: '❄️ 14°C | Srinagar, Jammu & Kashmir',
            location: '📍 Dal Lake | Srinagar',
            heroImg: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e1/Dal_Lake_Hazratbal_Srinagar.jpg/960px-Dal_Lake_Hazratbal_Srinagar.jpg?utm_source=en.wikipedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
            topDestinations: [
                { num: 1, name: 'Dal Lake', img: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e1/Dal_Lake_Hazratbal_Srinagar.jpg/960px-Dal_Lake_Hazratbal_Srinagar.jpg?utm_source=en.wikipedia.org&utm_campaign=imageinfo&utm_content=thumbnail', category: 'Alpine Lake' },
                { num: 2, name: 'Gulmarg', img: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/GulMarg_Kashmir.jpg', category: 'Ski Resort' },
                { num: 3, name: 'Pahalgam', img: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a3/LiddarRiverJhelum.jpeg/960px-LiddarRiverJhelum.jpeg?utm_source=en.wikipedia.org&utm_campaign=imageinfo&utm_content=thumbnail', category: 'Valley' },
                { num: 4, name: 'Sonamarg', img: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Sonmarg,_Kashmir.jpg', category: 'Glacier' },
                { num: 5, name: 'Shankaracharya Temple', img: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/9b/The_Ancient_Shankaracharya_Temple_%28Srinagar%2C_Jammu_and_Kashmir%29_%28cropped%29.jpg/960px-The_Ancient_Shankaracharya_Temple_%28Srinagar%2C_Jammu_and_Kashmir%29_%28cropped%29.jpg?utm_source=en.wikipedia.org&utm_campaign=imageinfo&utm_content=thumbnail', category: 'Pilgrimage' }
            ],
            exploreText: 'Explore Jammu & Kashmir — Lakes • Valleys • Snow Slopes • Crafts',
            events: [
                { title: 'Shikara Spring Light Festival', dateNum: '10', dateMonth: 'MAY', loc: 'Dal Lake, Srinagar', status: 'Registration', statusClass: 'pending', img: 'https://www.snowlandhotelsandresorts.com/wp-content/uploads/2025/02/shikara-race-in-dal-lake.jpg' }
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
            location: '📍 Amer Fort | Jaipur, Rajasthan',
            heroImg: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Amer_Fort_-_Jaipur_India.jpg',
            topDestinations: [
                { num: 1, name: 'Amer Fort', img: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Amer_Fort_-_Jaipur_India.jpg', category: 'Royal Fort' },
                { num: 2, name: 'Jaisalmer', img: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Jaisalmer,_India,_Jaisalmer_Fort.jpg', category: 'Desert' },
                { num: 3, name: 'Udaipur City Palace', img: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/City_Palace_of_Udaipur.jpg', category: 'Palace' },
                { num: 4, name: 'Mehrangarh Fort', img: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Mehrangarh_Fort,_India.jpg', category: 'Fort' },
                { num: 5, name: 'Pushkar Lake', img: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Pushkar_Lake_India.jpg', category: 'Sacred Lake' }
            ],
            exploreText: 'Explore Rajasthan — Royal Heritage • Forts • Deserts • Culture',
            events: [
                { title: 'Amer Fort Light & Sound Show', dateNum: '05', dateMonth: 'NOV', loc: 'Amer Fort, Jaipur', status: 'Upcoming', statusClass: 'draft', img: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Light_Show_at_Amer_Fort,_Rajasthan.JPG' }
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
            heroImg: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Old_Goa_Churches.jpg',
            topDestinations: [
                { num: 1, name: 'Old Goa Churches', img: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Old_Goa_Churches.jpg', category: 'UNESCO Heritage' },
                { num: 2, name: 'Calangute Beach', img: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Calangute_beach_Goa.jpg', category: 'Beach' },
                { num: 3, name: 'Dudhsagar Waterfalls', img: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Dudhsagar_falls.jpg', category: 'Waterfall' },
                { num: 4, name: 'Fort Aguada', img: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Fort_Aguada,_Goa,_India.jpg', category: 'Coastal Fort' },
                { num: 5, name: 'Palolem Beach', img: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Palolem_Beach.jpg', category: 'Beach' }
            ],
            exploreText: 'Explore Goa — Beaches • Heritage • Waterfalls • Festivities',
            events: [
                { title: 'Sunburn Festival Goa', dateNum: '28', dateMonth: 'DEC', loc: 'Goa', status: 'Open', statusClass: 'active', img: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Sunburn_Festival,_Goa,_Visuals.jpg' }
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
            heroImg: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Meenakshi_Amman_Temple,_Madurai.jpg',
            topDestinations: [
                { num: 1, name: 'Meenakshi Amman Temple', img: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Meenakshi_Amman_Temple,_Madurai.jpg', category: 'Temple' },
                { num: 2, name: 'Ooty', img: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/db/Ooty_lake.jpg/960px-Ooty_lake.jpg?utm_source=en.wikipedia.org&utm_campaign=imageinfo&utm_content=thumbnail', category: 'Hill Station' },
                { num: 3, name: 'Mahabalipuram Shore Temple', img: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Shore_Temple,_Mahabalipuram,_Tamil_Nadu.jpg', category: 'UNESCO Heritage' },
                { num: 4, name: 'Brihadisvara Temple, Thanjavur', img: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/dd/Brihadisvara_Temple_during_Maha_Shivaratri-WUS03611_%28edit%29.jpg/960px-Brihadisvara_Temple_during_Maha_Shivaratri-WUS03611_%28edit%29.jpg?utm_source=en.wikipedia.org&utm_campaign=imageinfo&utm_content=thumbnail', category: 'Chola Temple' },
                { num: 5, name: 'Kanyakumari', img: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5b/Vivekananda_Rock_Memorial%2C_Kanyakumari.jpg/960px-Vivekananda_Rock_Memorial%2C_Kanyakumari.jpg?utm_source=en.wikipedia.org&utm_campaign=imageinfo&utm_content=thumbnail', category: 'Coastal Point' }
            ],
            exploreText: 'Explore Tamil Nadu — Temples • Nilgiri Hills • Architecture',
            events: [
                { title: 'Chithirai Chariot Festival', dateNum: '18', dateMonth: 'APR', loc: 'Madurai, Tamil Nadu', status: 'Open', statusClass: 'active', img: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Chithirai_Car_Festival_%40_Madurai.jpg' }
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
            heroImg: 'https://upload.wikimedia.org/wikipedia/commons/3/32/Temples_on_the_banks_of_river_Ganges.jpg?utm_source=en.wikipedia.org&utm_campaign=imageinfo&utm_content=original',
            topDestinations: [
                { num: 1, name: 'Rishikesh', img: 'https://upload.wikimedia.org/wikipedia/commons/3/32/Temples_on_the_banks_of_river_Ganges.jpg?utm_source=en.wikipedia.org&utm_campaign=imageinfo&utm_content=original', category: 'Sacred River' },
                { num: 2, name: 'Nainital Lake', img: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Nainital_lake_uttarakhand.jpg', category: 'Lake Town' },
                { num: 3, name: 'Mussoorie', img: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e0/Mussoorie_Snow_Over_Dehradun_%2814831297545%29.jpg/960px-Mussoorie_Snow_Over_Dehradun_%2814831297545%29.jpg?utm_source=en.wikipedia.org&utm_campaign=imageinfo&utm_content=thumbnail', category: 'Hill Station' },
                { num: 4, name: 'Valley of Flowers', img: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Valley_of_flowers,_Uttarakhand.jpg', category: 'National Park' },
                { num: 5, name: 'Jim Corbett National Park', img: 'https://upload.wikimedia.org/wikipedia/commons/6/6b/Beautiful_Corbett_Park.jpg?utm_source=en.wikipedia.org&utm_campaign=imageinfo&utm_content=thumbnail_unscaled', category: 'Tiger Reserve' }
            ],
            exploreText: 'Explore Uttarakhand — Sacred Rivers • Himalayas • Wildlife',
            events: [
                { title: 'International Yoga Festival', dateNum: '01', dateMonth: 'MAR', loc: 'Rishikesh, Uttarakhand', status: 'Open', statusClass: 'active', img: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/The_Vice_President,_Shri_M._Venkaiah_Naidu_at_the_International_Yoga_Festival,_at_Parmarth_Niketan,_Rishikesh,_in_Uttarakhand_.jpg' }
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
            heroImg: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Kaziranga_Assam.jpg',
            topDestinations: [
                { num: 1, name: 'Kaziranga National Park', img: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Kaziranga_Assam.jpg', category: 'UNESCO Wildlife' },
                { num: 2, name: 'Majuli', img: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/82/Majuli_-_The_largest_river_island.jpg/960px-Majuli_-_The_largest_river_island.jpg?utm_source=en.wikipedia.org&utm_campaign=imageinfo&utm_content=thumbnail', category: 'River Island' },
                { num: 3, name: 'Kamakhya Temple', img: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/48/Kamakhya_Temple_-_DEV_8829.jpg/960px-Kamakhya_Temple_-_DEV_8829.jpg?utm_source=en.wikipedia.org&utm_campaign=imageinfo&utm_content=thumbnail', category: 'Pilgrimage' },
                { num: 4, name: 'Jorhat Tea Estates', img: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b6/Keyhung_tea_garden.jpg/960px-Keyhung_tea_garden.jpg?utm_source=en.wikipedia.org&utm_campaign=imageinfo&utm_content=thumbnail', category: 'Tea Tourism' },
                { num: 5, name: 'Haflong', img: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/61/Synod_view_point%2C_Haflong.jpg/960px-Synod_view_point%2C_Haflong.jpg?utm_source=en.wikipedia.org&utm_campaign=imageinfo&utm_content=thumbnail', category: 'Hill Station' }
            ],
            exploreText: 'Explore Assam — Wildlife • Tea Gardens • Brahmaputra • Culture',
            events: [
                { title: 'Rongali Bihu Festival', dateNum: '14', dateMonth: 'APR', loc: 'Kaziranga, Assam', status: 'Upcoming', statusClass: 'draft', img: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Rongali_Bihu_of_Assam.jpg' }
            ]
        }
    },

    // Exactly 40 Destinations (5 for each of the 8 states) with finalized display names & approved image URLs
    destinations: [
        // Maharashtra (5)
        { id: 'raigad-fort', state_id: 'maharashtra', name: 'Rajgad Fort', rank: 1, img: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Rajgad_Fort_(64283).jpg', category: 'Heritage Fort' },
        { id: 'ajanta-caves', state_id: 'maharashtra', name: 'Ajanta Caves', rank: 2, img: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Ajanta_Caves_from_Maharashtra_state_of_India.jpg', category: 'UNESCO Cave' },
        { id: 'ellora-caves', state_id: 'maharashtra', name: 'Ellora Caves', rank: 3, img: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Ellora_Caves,_India.jpg', category: 'UNESCO Cave' },
        { id: 'lonavala', state_id: 'maharashtra', name: 'Lonavala', rank: 4, img: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/34/Tiger_Point_Lonavala.jpg/960px-Tiger_Point_Lonavala.jpg?utm_source=en.wikipedia.org&utm_campaign=imageinfo&utm_content=thumbnail', category: 'Hill Station' },
        { id: 'shirdi', state_id: 'maharashtra', name: 'Shirdi', rank: 5, img: 'https://upload.wikimedia.org/wikipedia/commons/e/e4/Sai_baba_samadhi_mandir_.jpg?utm_source=en.wikipedia.org&utm_campaign=imageinfo&utm_content=thumbnail_unscaled', category: 'Pilgrimage' },

        // Kerala (5)
        { id: 'munnar-hills', state_id: 'kerala', name: 'Munnar', rank: 1, img: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/09/Munnar_-_Tea_Plantations.jpg/960px-Munnar_-_Tea_Plantations.jpg?utm_source=en.wikipedia.org&utm_campaign=imageinfo&utm_content=thumbnail', category: 'Hill Station' },
        { id: 'alleppey-backwaters', state_id: 'kerala', name: 'Alappuzha Backwaters', rank: 2, img: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/ee/House_Boat_DSW.jpg/500px-House_Boat_DSW.jpg?utm_source=en.wikipedia.org&utm_campaign=imageinfo&utm_content=thumbnail', category: 'Backwaters' },
        { id: 'wayanad-wildlife', state_id: 'kerala', name: 'Wayanad Wildlife', rank: 3, img: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Kerala-wayanad.jpg', category: 'Wildlife' },
        { id: 'fort-kochi', state_id: 'kerala', name: 'Fort Kochi', rank: 4, img: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Fort_kochi.jpg', category: 'Heritage Port' },
        { id: 'varkala-cliff', state_id: 'kerala', name: 'Varkala', rank: 5, img: 'https://upload.wikimedia.org/wikipedia/commons/4/49/Varkala_Beach%2C_Varkala%2C_Kerala.jpg?utm_source=en.wikipedia.org&utm_campaign=imageinfo&utm_content=original', category: 'Coastal Cliff' },

        // Jammu & Kashmir (5)
        { id: 'dal-lake-srinagar', state_id: 'kashmir', name: 'Dal Lake', rank: 1, img: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e1/Dal_Lake_Hazratbal_Srinagar.jpg/960px-Dal_Lake_Hazratbal_Srinagar.jpg?utm_source=en.wikipedia.org&utm_campaign=imageinfo&utm_content=thumbnail', category: 'Alpine Lake' },
        { id: 'gulmarg-snow-slopes', state_id: 'kashmir', name: 'Gulmarg', rank: 2, img: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/GulMarg_Kashmir.jpg', category: 'Ski Resort' },
        { id: 'pahalgam-valley', state_id: 'kashmir', name: 'Pahalgam', rank: 3, img: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a3/LiddarRiverJhelum.jpeg/960px-LiddarRiverJhelum.jpeg?utm_source=en.wikipedia.org&utm_campaign=imageinfo&utm_content=thumbnail', category: 'Valley' },
        { id: 'sonamarg-glaciers', state_id: 'kashmir', name: 'Sonamarg', rank: 4, img: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Sonmarg,_Kashmir.jpg', category: 'Glacier' },
        { id: 'shankaracharya-temple', state_id: 'kashmir', name: 'Shankaracharya Temple', rank: 5, img: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/9b/The_Ancient_Shankaracharya_Temple_%28Srinagar%2C_Jammu_and_Kashmir%29_%28cropped%29.jpg/960px-The_Ancient_Shankaracharya_Temple_%28Srinagar%2C_Jammu_and_Kashmir%29_%28cropped%29.jpg?utm_source=en.wikipedia.org&utm_campaign=imageinfo&utm_content=thumbnail', category: 'Pilgrimage' },

        // Rajasthan (5)
        { id: 'amber-fort', state_id: 'rajasthan', name: 'Amer Fort', rank: 1, img: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Amer_Fort_-_Jaipur_India.jpg', category: 'Royal Fort' },
        { id: 'jaisalmer-desert', state_id: 'rajasthan', name: 'Jaisalmer', rank: 2, img: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Jaisalmer,_India,_Jaisalmer_Fort.jpg', category: 'Desert' },
        { id: 'udaipur-city-palace', state_id: 'rajasthan', name: 'Udaipur City Palace', rank: 3, img: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/City_Palace_of_Udaipur.jpg', category: 'Palace' },
        { id: 'mehrangarh-fort', state_id: 'rajasthan', name: 'Mehrangarh Fort', rank: 4, img: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Mehrangarh_Fort,_India.jpg', category: 'Fort' },
        { id: 'pushkar-lake', state_id: 'rajasthan', name: 'Pushkar Lake', rank: 5, img: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Pushkar_Lake_India.jpg', category: 'Sacred Lake' },

        // Goa (5)
        { id: 'old-goa-churches', state_id: 'goa', name: 'Old Goa Churches', rank: 1, img: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Old_Goa_Churches.jpg', category: 'UNESCO Heritage' },
        { id: 'calangute-coast', state_id: 'goa', name: 'Calangute Beach', rank: 2, img: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Calangute_beach_Goa.jpg', category: 'Beach' },
        { id: 'dudhsagar-falls', state_id: 'goa', name: 'Dudhsagar Waterfalls', rank: 3, img: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Dudhsagar_falls.jpg', category: 'Waterfall' },
        { id: 'fort-aguada', state_id: 'goa', name: 'Fort Aguada', rank: 4, img: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Fort_Aguada,_Goa,_India.jpg', category: 'Coastal Fort' },
        { id: 'palolem-beach', state_id: 'goa', name: 'Palolem Beach', rank: 5, img: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Palolem_Beach.jpg', category: 'Beach' },

        // Tamil Nadu (5)
        { id: 'meenakshi-amman-temple', state_id: 'tamilnadu', name: 'Meenakshi Amman Temple', rank: 1, img: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Meenakshi_Amman_Temple,_Madurai.jpg', category: 'Temple' },
        { id: 'ooty-nilgiri-hills', state_id: 'tamilnadu', name: 'Ooty', rank: 2, img: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/db/Ooty_lake.jpg/960px-Ooty_lake.jpg?utm_source=en.wikipedia.org&utm_campaign=imageinfo&utm_content=thumbnail', category: 'Hill Station' },
        { id: 'mahabalipuram-reliefs', state_id: 'tamilnadu', name: 'Mahabalipuram Shore Temple', rank: 3, img: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Shore_Temple,_Mahabalipuram,_Tamil_Nadu.jpg', category: 'UNESCO Heritage' },
        { id: 'tanjore-brihadisvara', state_id: 'tamilnadu', name: 'Brihadisvara Temple, Thanjavur', rank: 4, img: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/dd/Brihadisvara_Temple_during_Maha_Shivaratri-WUS03611_%28edit%29.jpg/960px-Brihadisvara_Temple_during_Maha_Shivaratri-WUS03611_%28edit%29.jpg?utm_source=en.wikipedia.org&utm_campaign=imageinfo&utm_content=thumbnail', category: 'Chola Temple' },
        { id: 'kanyakumari-point', state_id: 'tamilnadu', name: 'Kanyakumari', rank: 5, img: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5b/Vivekananda_Rock_Memorial%2C_Kanyakumari.jpg/960px-Vivekananda_Rock_Memorial%2C_Kanyakumari.jpg?utm_source=en.wikipedia.org&utm_campaign=imageinfo&utm_content=thumbnail', category: 'Coastal Point' },

        // Uttarakhand (5)
        { id: 'rishikesh-ganga-ghats', state_id: 'uttarakhand', name: 'Rishikesh', rank: 1, img: 'https://upload.wikimedia.org/wikipedia/commons/3/32/Temples_on_the_banks_of_river_Ganges.jpg?utm_source=en.wikipedia.org&utm_campaign=imageinfo&utm_content=original', category: 'Sacred River' },
        { id: 'nainital-lake-corridor', state_id: 'uttarakhand', name: 'Nainital Lake', rank: 2, img: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Nainital_lake_uttarakhand.jpg', category: 'Lake Town' },
        { id: 'mussoorie-queen-of-hills', state_id: 'uttarakhand', name: 'Mussoorie', rank: 3, img: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e0/Mussoorie_Snow_Over_Dehradun_%2814831297545%29.jpg/960px-Mussoorie_Snow_Over_Dehradun_%2814831297545%29.jpg?utm_source=en.wikipedia.org&utm_campaign=imageinfo&utm_content=thumbnail', category: 'Hill Station' },
        { id: 'valley-of-flowers', state_id: 'uttarakhand', name: 'Valley of Flowers', rank: 4, img: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Valley_of_flowers,_Uttarakhand.jpg', category: 'National Park' },
        { id: 'jim-corbett-reserve', state_id: 'uttarakhand', name: 'Jim Corbett National Park', rank: 5, img: 'https://upload.wikimedia.org/wikipedia/commons/6/6b/Beautiful_Corbett_Park.jpg?utm_source=en.wikipedia.org&utm_campaign=imageinfo&utm_content=thumbnail_unscaled', category: 'Tiger Reserve' },

        // Assam (5)
        { id: 'kaziranga-national-park', state_id: 'assam', name: 'Kaziranga National Park', rank: 1, img: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Kaziranga_Assam.jpg', category: 'UNESCO Wildlife' },
        { id: 'majuli-island', state_id: 'assam', name: 'Majuli', rank: 2, img: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/82/Majuli_-_The_largest_river_island.jpg/960px-Majuli_-_The_largest_river_island.jpg?utm_source=en.wikipedia.org&utm_campaign=imageinfo&utm_content=thumbnail', category: 'River Island' },
        { id: 'kamakhya-temple', state_id: 'assam', name: 'Kamakhya Temple', rank: 3, img: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/48/Kamakhya_Temple_-_DEV_8829.jpg/960px-Kamakhya_Temple_-_DEV_8829.jpg?utm_source=en.wikipedia.org&utm_campaign=imageinfo&utm_content=thumbnail', category: 'Pilgrimage' },
        { id: 'jorhat-tea-estates', state_id: 'assam', name: 'Jorhat Tea Estates', rank: 4, img: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b6/Keyhung_tea_garden.jpg/960px-Keyhung_tea_garden.jpg?utm_source=en.wikipedia.org&utm_campaign=imageinfo&utm_content=thumbnail', category: 'Tea Tourism' },
        { id: 'haflong-hill-station', state_id: 'assam', name: 'Haflong', rank: 5, img: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/61/Synod_view_point%2C_Haflong.jpg/960px-Synod_view_point%2C_Haflong.jpg?utm_source=en.wikipedia.org&utm_campaign=imageinfo&utm_content=thumbnail', category: 'Hill Station' }
    ],

    // Exactly 10 Finalized Attraction Records with destination_id, state_id and approved images
    attractions: [
        { id: 'attr-padmavati-temple', state_id: 'maharashtra', destination_id: 'raigad-fort', name: 'Padmavati Temple, Rajgad', category: 'Fort Shrine', img: 'https://upload.wikimedia.org/wikipedia/commons/4/49/Padmawati_temple_rajgad.jpg', rating: '4.8', status: 'Open' },
        { id: 'attr-tigers-leap', state_id: 'maharashtra', destination_id: 'lonavala', name: "Tiger's Leap Point", category: 'Scenic Viewpoint', img: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Tiger%27s_Point.jpg', rating: '4.7', status: 'Open' },
        { id: 'attr-vembanad-houseboats', state_id: 'kerala', destination_id: 'alleppey-backwaters', name: 'Vembanad Lake Houseboats', category: 'Backwater Cruises', img: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Houseboats_on_Vembanad_Lake.jpg', rating: '4.9', status: 'Open' },
        { id: 'attr-eravikulam-np', state_id: 'kerala', destination_id: 'munnar-hills', name: 'Eravikulam National Park', category: 'National Park', img: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Eravikulam_National_Park-WUS07189.jpg', rating: '4.8', status: 'Open' },
        { id: 'attr-char-chinar', state_id: 'kashmir', destination_id: 'dal-lake-srinagar', name: 'Char Chinar', category: 'Island Landmark', img: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Char_Chinar-_Dal_Lake.jpg', rating: '4.8', status: 'Open' },
        { id: 'attr-sheesh-mahal', state_id: 'rajasthan', destination_id: 'amber-fort', name: 'Sheesh Mahal', category: 'Royal Pavilion', img: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Sheesh_Mahal_%2C_Amer_Fort.jpg', rating: '4.9', status: 'Open' },
        { id: 'attr-baga-water-sports', state_id: 'goa', destination_id: 'calangute-coast', name: 'Baga Water Sports', category: 'Beach Adventure', img: 'https://res.klook.com/image/upload/c_crop,h_1005,w_1608,x_0,y_24,z_0.5/w_1265,h_791,c_fill,q_85/w_80,x_15,y_15,g_south_west,l_Klook_water_br_trans_yhcmh3/activities/naiismlps38ana3v6tqc.webp', rating: '4.6', status: 'Open' },
        { id: 'attr-thousand-pillar-hall', state_id: 'tamilnadu', destination_id: 'meenakshi-amman-temple', name: 'Thousand Pillar Hall', category: 'Temple Architecture', img: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Thousand-Pillared_Hall%2C_16th_century%2C_Meenakshi_Temple_at_Madurai_%283%29_%2836817476384%29.jpg', rating: '4.9', status: 'Open' },
        { id: 'attr-triveni-ghat-aarti', state_id: 'uttarakhand', destination_id: 'rishikesh-ganga-ghats', name: 'Triveni Ghat Ganga Aarti', category: 'Sacred Ceremony', img: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Ganga_Arti_At_Triveni_Ghat_In_Rishikesh.jpg', rating: '4.9', status: 'Open' },
        { id: 'attr-kaziranga-elephant-safari', state_id: 'assam', destination_id: 'kaziranga-national-park', name: 'Elephant Safari, Kaziranga', category: 'Wildlife Safari', img: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Kaziranga_Elephant_Safari.jpg', rating: '4.8', status: 'Open' }
    ],

    // Exactly 8 Finalized Event Records with destination_id, state_id and approved images
    events: [
        { id: 'event-rajgad-trekking', state_id: 'maharashtra', destination_id: 'raigad-fort', title: 'Monsoon Rajgad Trekking Festival', dateNum: '28', dateMonth: 'SEP', location: 'Rajgad Fort, Maharashtra', status: 'Open', statusClass: 'active', img: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Mountaineous_trail_of_the_Rajgad_Fort.jpg' },
        { id: 'event-nehru-trophy', state_id: 'kerala', destination_id: 'alleppey-backwaters', title: 'Nehru Trophy Boat Race', dateNum: '14', dateMonth: 'AUG', location: 'Alappuzha, Kerala', status: 'Open', statusClass: 'active', img: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Nehru_Trophy_Boat_Race_Kerala.jpg' },
        { id: 'event-shikara-spring', state_id: 'kashmir', destination_id: 'dal-lake-srinagar', title: 'Shikara Spring Light Festival', dateNum: '10', dateMonth: 'MAY', location: 'Dal Lake, Srinagar', status: 'Registration', statusClass: 'pending', img: 'https://www.snowlandhotelsandresorts.com/wp-content/uploads/2025/02/shikara-race-in-dal-lake.jpg' },
        { id: 'event-amer-light-show', state_id: 'rajasthan', destination_id: 'amber-fort', title: 'Amer Fort Light & Sound Show', dateNum: '05', dateMonth: 'NOV', location: 'Amer Fort, Jaipur', status: 'Upcoming', statusClass: 'draft', img: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Light_Show_at_Amer_Fort,_Rajasthan.JPG' },
        { id: 'event-sunburn-goa', state_id: 'goa', destination_id: 'calangute-coast', title: 'Sunburn Festival Goa', dateNum: '28', dateMonth: 'DEC', location: 'Goa', status: 'Open', statusClass: 'active', img: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Sunburn_Festival,_Goa,_Visuals.jpg' },
        { id: 'event-chithirai', state_id: 'tamilnadu', destination_id: 'meenakshi-amman-temple', title: 'Chithirai Chariot Festival', dateNum: '18', dateMonth: 'APR', location: 'Madurai, Tamil Nadu', status: 'Open', statusClass: 'active', img: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Chithirai_Car_Festival_%40_Madurai.jpg' },
        { id: 'event-yoga-rishikesh', state_id: 'uttarakhand', destination_id: 'rishikesh-ganga-ghats', title: 'International Yoga Festival', dateNum: '01', dateMonth: 'MAR', location: 'Rishikesh, Uttarakhand', status: 'Open', statusClass: 'active', img: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/The_Vice_President,_Shri_M._Venkaiah_Naidu_at_the_International_Yoga_Festival,_at_Parmarth_Niketan,_Rishikesh,_in_Uttarakhand_.jpg' },
        { id: 'event-rongali-bihu', state_id: 'assam', destination_id: 'kaziranga-national-park', title: 'Rongali Bihu Festival', dateNum: '14', dateMonth: 'APR', location: 'Kaziranga, Assam', status: 'Upcoming', statusClass: 'draft', img: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Rongali_Bihu_of_Assam.jpg' }
    ],

    stakeholders: [],
    visitorStats: [],
    feedback: [],

    profile: {
        id: 'MGR-MH-40192',
        name: 'Rajesh Patil',
        email: 'rajesh.patil@mahatourism.gov.in',
        phone: '+91 98230 41092',
        manager_type: 'State Manager',
        scope: 'STATE',
        state_id: 'maharashtra',
        state_name: 'Maharashtra',
        destination: 'All destinations in Maharashtra',
        destination_ids: ['raigad-fort', 'ajanta-caves', 'ellora-caves', 'lonavala', 'shirdi'],
        assigned_date: '15 Jan 2024',
        status: 'Active',
        avatar_initials: 'RP'
    },

    notifications: [
        {
            id: 'notif-1',
            title: 'High Influx Alert: Rajgad Fort',
            message: 'Visitor turnout exceeded safety threshold by 18% during weekend trek.',
            time: '2 hours ago',
            read: false,
            type: 'alert'
        },
        {
            id: 'notif-2',
            title: 'Pending Stakeholder Verification',
            message: 'Mahanagar Travel Co. requested official accreditation approval.',
            time: '5 hours ago',
            read: false,
            type: 'pending'
        },
        {
            id: 'notif-3',
            title: 'Monthly Q3 Tourism Report Ready',
            message: 'Analytical summary report for Maharashtra state is now generated.',
            time: '1 day ago',
            read: true,
            type: 'info'
        }
    ]
};
