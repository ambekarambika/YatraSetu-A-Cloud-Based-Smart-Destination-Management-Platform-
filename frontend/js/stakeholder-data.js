/**
 * YatraSetu — Stakeholder Prototype Data Layer (stakeholder-data.js)
 * Isolated prototype data store for Tourism Stakeholder profile, destination-scoped announcements,
 * manager update suggestions, recent manager updates, and sample tourist reviews.
 * Dependencies: manager-data.js (for shared destination/attraction catalog lookup)
 *
 * NOTE: All records in this file are in-memory prototype demonstrations.
 * No real backend or database persistence is currently connected.
 */

window.YatraSetuStakeholderData = {
    // Prototype Metadata Disclaimer
    isPrototype: true,
    dataSource: 'Prototype In-Memory Store (Non-Persistent / Phase 7 Demonstration)',

    // Current Stakeholder Profile Identity (In-Memory Prototype)
    profile: {
        id: 'sh-101',
        userName: 'Suresh Deshmukh',
        organizationName: 'Sahyadri Trekking Guides Co-op',
        type: 'visitor-facing', // 'visitor-facing' | 'info-contributor'
        category: 'Tour & Trekking Guides',
        contactPerson: 'Suresh Deshmukh',
        phone: '+91 98220 11223',
        email: 'sahyadri.guides@gmail.com',
        destinationId: 'raigad-fort', // Default prototype destination; can be switched in Profile
        destinationName: 'Rajgad Fort',
        stateName: 'Maharashtra',
        destinationImg: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Rajgad_Fort_(64283).jpg',
        hours: 'Mon - Sun (06:00 - 18:00)',
        address: 'Base Camp Office, Gunjavane Village, Velhe, Pune - 412213',
        priceRange: '500 - 1,500 per group',
        status: 'Approved',
        isBusinessApproved: true,
        avatarInitials: 'SD'
    },

    // Destination-Scoped Official Announcements (Prototype Sample Records Only)
    announcements: [
        {
            id: 'anc-1',
            destination_id: 'raigad-fort',
            title: 'Monsoon Trekking Advisory',
            date: '10 Oct 2026',
            category: 'Prototype Advisory',
            icon: '🚨',
            content: 'Trekking trails to Sanjivani Machi are partially closed due to heavy rainfall. Please follow safety guidelines.',
            guidance: 'All registered guides must equip groups with waterproof trail maps, ensure descent before 15:00, and strictly avoid unmarked ridge crossings.'
        },
        {
            id: 'anc-2',
            destination_id: 'raigad-fort',
            title: 'Fort Cleanliness Drive',
            date: '5 Oct 2026',
            category: 'Prototype Notice',
            icon: '📣',
            content: 'A cleanliness drive will be conducted this Sunday. All local partners are requested to support.',
            guidance: 'Assembly at Gunjavane Base Camp office at 07:30 AM. Reusable gloves and waste collection sacks provided by local administration.'
        },
        {
            id: 'anc-3',
            destination_id: 'ajanta-caves',
            title: 'UNESCO Cave Conservation Maintenance',
            date: '8 Oct 2026',
            category: 'Prototype Notice',
            icon: '🏛️',
            content: 'Routine lighting maintenance scheduled in Cave 1 & 2 between 08:00 - 10:00 AM.',
            guidance: 'Eco-bus shuttles operate with a 15-minute detour via Cave 3 viewpoint during morning maintenance. Advise visitor groups accordingly.'
        },
        {
            id: 'anc-4',
            destination_id: 'munnar-hills',
            title: 'Tea Estate Eco-Trail Guidelines',
            date: '6 Oct 2026',
            category: 'Prototype Advisory',
            icon: '🌿',
            content: 'Eco-trail permits are required for groups larger than 10 visitors.',
            guidance: 'Group permits must be verified at the tea estate check-post prior to entering conservation zone trails.'
        }
    ],

    // Manager Coordination — Stakeholder Messages & Suggestions (Synchronized Prototype Data)
    suggestions: [
        {
            id: 'sh-msg-1',
            stakeholder_id: 'sh-101',
            stakeholder_name: 'Suresh Deshmukh',
            business_name: 'Sahyadri Trekking Guides Co-op',
            state_id: 'maharashtra',
            destination_id: 'raigad-fort',
            destination_name: 'Rajgad Fort',
            topic: 'Trail Safety / Water Point',
            message: 'Requesting potable water station installation near the Gunjavane base trail junction before the upcoming weekend influx.',
            suggestionText: 'Requesting potable water station installation near the Gunjavane base trail junction before the upcoming weekend influx.',
            submitted_at: '08 Oct 2026, 10:30 AM',
            submittedAt: '08 Oct 2026, 10:30 AM',
            status: 'In Review',
            statusClass: 'review',
            manager_response: 'Forest department liaison has been initiated. Site inspection scheduled for Wednesday.',
            managerNote: 'Forest department liaison has been initiated. Site inspection scheduled for Wednesday.',
            responded_by: 'Rajesh Patil (Destination Manager)',
            responded_at: '09 Oct 2026, 02:15 PM'
        },
        {
            id: 'sh-msg-2',
            stakeholder_id: 'sh-101',
            stakeholder_name: 'Suresh Deshmukh',
            business_name: 'Sahyadri Trekking Guides Co-op',
            state_id: 'maharashtra',
            destination_id: 'raigad-fort',
            destination_name: 'Rajgad Fort',
            topic: 'Emergency Contact Board',
            message: 'Requesting updated emergency rescue contact boards at Padmavati Machi as older numbers are disconnected.',
            suggestionText: 'Requesting updated emergency rescue contact boards at Padmavati Machi as older numbers are disconnected.',
            submitted_at: '11 Oct 2026, 09:15 AM',
            submittedAt: '11 Oct 2026, 09:15 AM',
            status: 'Pending',
            statusClass: 'pending',
            manager_response: null,
            managerNote: 'Awaiting Manager Review',
            responded_by: null,
            responded_at: null
        }
    ],

    // Recent Manager Updates for Stakeholders (Prototype Sample Records Only)
    managerUpdates: [
        {
            id: 'mup-1',
            destination_id: 'raigad-fort',
            title: 'New Signage Installation (Sample)',
            date: '27 Sep 2026',
            content: 'New directional signage has been installed on the Gunjavane trail route.'
        },
        {
            id: 'mup-2',
            destination_id: 'raigad-fort',
            title: 'Visitor Guidelines Update (Sample)',
            date: '20 Sep 2026',
            content: 'Please inform your guests about the updated waste disposal guidelines.'
        },
        {
            id: 'mup-3',
            destination_id: 'ajanta-caves',
            title: 'Eco-Shuttle Timetable Revised (Sample)',
            date: '25 Sep 2026',
            content: 'Electric shuttle operating hours from T-Point to Cave entrance are now 08:30 - 17:30.'
        }
    ],

    // Tourist Reviews for Stakeholder\'s Service (Prototype Sample Records Only)
    reviews: [
        {
            id: 'rev-1',
            destination_id: 'raigad-fort',
            author: 'Anjali Patil',
            authorInitials: 'A',
            rating: 5,
            date: '28 Sep 2026',
            content: 'Amazing experience! The guide was knowledgeable and ensured our safety throughout the trek. Highly recommended!',
            response: '',
            isSampleReview: true
        }
    ],

    // Tourism Stakeholder Prototype Notifications
    notifications: [
        { id: 'notif-sh-1', title: '🚨 Weather & Trail Advisory (Prototype)', message: 'Monsoon trail guidelines updated for Rajgad Fort.', time: '2 hours ago', read: false },
        { id: 'notif-sh-2', title: '💬 Manager Suggestion Review (Prototype)', message: 'Manager reviewed your trail water point suggestion.', time: '1 day ago', read: false },
        { id: 'notif-sh-3', title: '⭐ Tourist Review (Prototype)', message: 'Anjali Patil left a 5-star sample review for your trekking guide service.', time: '3 days ago', read: true }
    ],

    // Tourism Stakeholder Listings (Initial state: empty until created by stakeholder)
    listings: [],

    // Tourism Stakeholder Photos & Videos Gallery (Initial state: empty until uploaded by stakeholder)
    media: [],

    // Tourism Stakeholder Posts & Updates (Initial state: empty until published by stakeholder)
    posts: []
};
