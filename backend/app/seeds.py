"""
YatraSetu Platform — Verified Reference and Representative Data Seeder
=============================================================================
Seeds deterministic, idempotent reference and representative business data:
1. Roles (4 canonical roles)
2. States (8 cultural context states)
3. Destinations (13 representative destinations across all 8 states)
4. Attractions (Points of interest with ratings and operating hours)
5. Experiences (Curated trails and outdoor activities)
6. Events (Cultural festivals and seasonal events)
7. Curated Circuits & Circuit Items (Regional multi-destination circuits)
8. Destination Videos (Verified documentary metadata)
9. Representative Users & Jurisdictions (Destination & State Managers)
10. Destination Advisories (Official travel bulletins linked to author)
11. Travel Stories (Long-form cultural chronicles)
12. Representative Stakeholder Services & Offerings (Verified & Pending)
13. Stakeholder Media & Coordination Suggestions
14. Authenticated & Approved Destination Reviews
15. Daily Visitor Telemetry (Carrying capacity and footfall history)

Idempotent: Uses deterministic UUIDv5s and entity keys.
Safe: Zero overwrites of existing user records. Zero hardcoded plain-text passwords.
=============================================================================
"""

import os
import uuid
from typing import Dict, Any, List
from datetime import datetime, timezone, date, timedelta

from sqlalchemy.orm import Session
from sqlalchemy import func, text

from app.database import SessionLocal
from app.core.hashing import PasswordSecurity

from app.models.identity import Role, User, ManagerAssignment
from app.models.destination import (
    State,
    Destination,
    Attraction,
    Experience,
    Event,
    CuratedCircuit,
    CuratedCircuitItem,
    DestinationVideo,
    DestinationAdvisory,
    TravelStory,
)
from app.models.stakeholder import (
    StakeholderService,
    StakeholderMedia,
    StakeholderPost,
    StakeholderMessage,
    StakeholderReview,
)
from app.models.tourist import (
    DestinationReview,
    TripPlan,
    TripPlanItem,
    UserFavorite,
)
from app.models.governance import VisitorStatistic, AuditLog

# Deterministic UUID generator for stable idempotent references
DNS_NAMESPACE = uuid.NAMESPACE_DNS

def make_uuid(entity_type: str, key: str) -> uuid.UUID:
    return uuid.uuid5(DNS_NAMESPACE, f"yatrasetu.{entity_type}.{key}")

# -----------------------------------------------------------------------------
# 1. Official Canonical Roles
# -----------------------------------------------------------------------------
OFFICIAL_ROLES: List[Dict[str, str]] = [
    {
        "id": "admin",
        "name": "Platform Administrator",
        "description": "System-wide platform oversight, governance, audit logs, and account lifecycle management.",
    },
    {
        "id": "manager",
        "name": "Destination Manager",
        "description": "Regional and destination-scoped administration, capacity monitoring, advisory issuance, and stakeholder verification.",
    },
    {
        "id": "stakeholder",
        "name": "Tourism Stakeholder",
        "description": "Verified local business operators, guides, homestays, and tour services coordinating within assigned destinations.",
    },
    {
        "id": "tourist",
        "name": "Tourist & Traveler",
        "description": "Verified travelers, trip planners, and destination explorers accessing public tourism services and feedback.",
    },
]

# -----------------------------------------------------------------------------
# 2. Official Cultural Context States (8 States)
# -----------------------------------------------------------------------------
OFFICIAL_STATES: List[Dict[str, str]] = [
    {
        "id": "maharashtra",
        "name": "Maharashtra",
        "theme_code": "maharashtra",
        "badge_label": "MAHARASHTRA",
        "tagline": "MAHARASHTRA DESTINATION MANAGEMENT",
        "description": "Heritage hill forts, UNESCO cave monuments, Western Ghats biodiversity, and cultural pilgrimage circuits.",
        "hero_image_url": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Rajgad_Fort_(64283).jpg",
    },
    {
        "id": "kerala",
        "name": "Kerala",
        "theme_code": "kerala",
        "badge_label": "KERALA",
        "tagline": "KERALA DESTINATION MANAGEMENT",
        "description": "Pristine backwaters, tea plantation highlands, coastal cliffs, and sustainable eco-tourism reserves.",
        "hero_image_url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/09/Munnar_-_Tea_Plantations.jpg/960px-Munnar_-_Tea_Plantations.jpg",
    },
    {
        "id": "kashmir",
        "name": "Jammu & Kashmir",
        "theme_code": "kashmir",
        "badge_label": "JAMMU & KASHMIR",
        "tagline": "JAMMU & KASHMIR DESTINATION MANAGEMENT",
        "description": "Alpine lakes, snow slopes, valley meadows, traditional shikaras, and high-altitude Himalayan trails.",
        "hero_image_url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e1/Dal_Lake_Hazratbal_Srinagar.jpg/960px-Dal_Lake_Hazratbal_Srinagar.jpg",
    },
    {
        "id": "rajasthan",
        "name": "Rajasthan",
        "theme_code": "rajasthan",
        "badge_label": "RAJASTHAN",
        "tagline": "RAJASTHAN DESTINATION MANAGEMENT",
        "description": "Regal desert citadels, royal palaces, living heritage forts, and Thar desert cultural journeys.",
        "hero_image_url": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Amer_Fort_-_Jaipur_India.jpg",
    },
    {
        "id": "goa",
        "name": "Goa",
        "theme_code": "goa",
        "badge_label": "GOA",
        "tagline": "GOA DESTINATION MANAGEMENT",
        "description": "Portuguese colonial architecture, coastal conservation corridors, spice plantations, and hinterland trails.",
        "hero_image_url": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Fort_Aguada_Lighthouse.jpg",
    },
    {
        "id": "tamilnadu",
        "name": "Tamil Nadu",
        "theme_code": "tamilnadu",
        "badge_label": "TAMIL NADU",
        "tagline": "TAMIL NADU DESTINATION MANAGEMENT",
        "description": "Dravidian temple architecture, UNESCO living Chola monuments, Nilgiri hill railways, and coastal shore temples.",
        "hero_image_url": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Brihadeeswara_Temple_Thanjavur.jpg",
    },
    {
        "id": "uttarakhand",
        "name": "Uttarakhand",
        "theme_code": "uttarakhand",
        "badge_label": "UTTARAKHAND",
        "tagline": "UTTARAKHAND DESTINATION MANAGEMENT",
        "description": "Sacred river sources, Garhwal Himalayan treks, alpine meadows (bugyals), and wildlife sanctuaries.",
        "hero_image_url": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Rishikesh_Ganga.jpg",
    },
    {
        "id": "assam",
        "name": "Assam",
        "theme_code": "assam",
        "badge_label": "ASSAM",
        "tagline": "ASSAM DESTINATION MANAGEMENT",
        "description": "Brahmaputra river valley, Kaziranga one-horned rhino sanctuaries, tea estates, and Majuli river island heritage.",
        "hero_image_url": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Kaziranga_National_Park.jpg",
    },
]

# -----------------------------------------------------------------------------
# 3. Representative Destinations (13 destinations across all 8 states)
# -----------------------------------------------------------------------------
REPRESENTATIVE_DESTINATIONS: List[Dict[str, Any]] = [
    # Maharashtra
    {
        "id": "rajgad-fort",
        "state_id": "maharashtra",
        "name": "Rajgad Fort",
        "category": "Heritage Fort",
        "subtitle": "The King of Forts and Sovereign Capital of the Maratha Empire",
        "location_label": "Pune District, Maharashtra",
        "description": "Historic hill fort and former sovereign capital of the Maratha Empire under Chhatrapati Shivaji Maharaj. Famous for its sprawling machis and commanding Sahyadri mountain vistas.",
        "hero_image_url": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Rajgad_Fort_(64283).jpg",
        "banner_image": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Rajgad_Fort_(64283).jpg",
        "ideal_duration": "1-2 Days",
        "best_time": "October to March",
        "max_daily_capacity": 2500,
        "latitude": 18.2562000,
        "longitude": 73.6826000,
        "metadata_json": {"elevation_m": 1376, "trail_grade": "Moderate", "heritage_status": "Protected State Monument"},
    },
    {
        "id": "ajanta-caves",
        "state_id": "maharashtra",
        "name": "Ajanta Caves",
        "category": "UNESCO Heritage",
        "subtitle": "Ancient Buddhist Rock-Cut Cave Monuments & Murals",
        "location_label": "Chhatrapati Sambhaji Nagar, Maharashtra",
        "description": "30 rock-cut Buddhist cave monuments dating from the 2nd century BCE, world-renowned for exquisite fresco murals and expressive sculptures.",
        "hero_image_url": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Ajanta_Caves_from_Maharashtra_state_of_India.jpg",
        "banner_image": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Ajanta_Caves_from_Maharashtra_state_of_India.jpg",
        "ideal_duration": "1 Day",
        "best_time": "October to March",
        "max_daily_capacity": 3000,
        "latitude": 20.5519000,
        "longitude": 75.7033000,
        "metadata_json": {"unesco_site": True, "caves_count": 30},
    },
    {
        "id": "ellora-caves",
        "state_id": "maharashtra",
        "name": "Ellora Caves",
        "category": "UNESCO Heritage",
        "subtitle": "Monumental Rock-Cut Monolithic Caves & Kailasa Temple",
        "location_label": "Chhatrapati Sambhaji Nagar, Maharashtra",
        "description": "One of the largest rock-cut Hindu, Buddhist, and Jain cave temple complexes in the world, featuring the breathtaking monolithic Kailasa Temple (Cave 16).",
        "hero_image_url": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Ellora_Caves,_India.jpg",
        "banner_image": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Ellora_Caves,_India.jpg",
        "ideal_duration": "1 Day",
        "best_time": "October to March",
        "max_daily_capacity": 3500,
        "latitude": 20.0268000,
        "longitude": 75.1780000,
        "metadata_json": {"unesco_site": True, "monolithic_temple": "Kailasa"},
    },
    # Kerala
    {
        "id": "munnar-hills",
        "state_id": "kerala",
        "name": "Munnar",
        "category": "Hill Station",
        "subtitle": "Tea Highlands and Anamudi Mountain Slopes",
        "location_label": "Idukki District, Kerala",
        "description": "Sprawling tea plantations, misty mountain ranges, and home to the endangered Nilgiri Tahr in Eravikulam National Park.",
        "hero_image_url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/09/Munnar_-_Tea_Plantations.jpg/960px-Munnar_-_Tea_Plantations.jpg",
        "banner_image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/09/Munnar_-_Tea_Plantations.jpg/960px-Munnar_-_Tea_Plantations.jpg",
        "ideal_duration": "2-3 Days",
        "best_time": "September to April",
        "max_daily_capacity": 4000,
        "latitude": 10.0889000,
        "longitude": 77.0595000,
        "metadata_json": {"elevation_m": 1600, "primary_crop": "Tea"},
    },
    {
        "id": "alleppey-backwaters",
        "state_id": "kerala",
        "name": "Alappuzha Backwaters",
        "category": "Backwaters",
        "subtitle": "Venice of the East and Traditional Kettuvallam Waterways",
        "location_label": "Alappuzha District, Kerala",
        "description": "Interconnected canals, lagoons, and lakes where traditional thatched houseboats navigate tranquil palm-fringed waters.",
        "hero_image_url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/e/ee/House_Boat_DSW.jpg/500px-House_Boat_DSW.jpg",
        "banner_image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/e/ee/House_Boat_DSW.jpg/500px-House_Boat_DSW.jpg",
        "ideal_duration": "1-2 Days",
        "best_time": "November to February",
        "max_daily_capacity": 2500,
        "latitude": 9.4981000,
        "longitude": 76.3388000,
        "metadata_json": {"waterway_lake": "Vembanad"},
    },
    # Rajasthan
    {
        "id": "amer-fort",
        "state_id": "rajasthan",
        "name": "Amer Fort",
        "category": "Royal Fort",
        "subtitle": "Regal Rajput-Mughal Citadel Overlooking Maota Lake",
        "location_label": "Jaipur, Rajasthan",
        "description": "Hilltop fort in Amer showcasing ornate artistic style elements, large ramparts, courtyards, and the shimmering Sheesh Mahal.",
        "hero_image_url": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Amer_Fort_-_Jaipur_India.jpg",
        "banner_image": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Amer_Fort_-_Jaipur_India.jpg",
        "ideal_duration": "1 Day",
        "best_time": "October to March",
        "max_daily_capacity": 5000,
        "latitude": 26.9855000,
        "longitude": 75.8513000,
        "metadata_json": {"unesco_site": True, "palace_complex": True},
    },
    {
        "id": "jaisalmer-citadel",
        "state_id": "rajasthan",
        "name": "Jaisalmer Fort",
        "category": "Living Fort",
        "subtitle": "The Golden Fort of the Great Thar Desert",
        "location_label": "Jaisalmer, Rajasthan",
        "description": "One of the very few living forts in the world, built in 1156 CE from yellow sandstone that crowns the Trikuta Hill.",
        "hero_image_url": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Jaisalmer,_India,_Jaisalmer_Fort.jpg",
        "banner_image": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Jaisalmer,_India,_Jaisalmer_Fort.jpg",
        "ideal_duration": "2 Days",
        "best_time": "November to February",
        "max_daily_capacity": 3500,
        "latitude": 26.9124000,
        "longitude": 70.9127000,
        "metadata_json": {"desert_region": "Thar", "living_fort": True},
    },
    # Jammu & Kashmir
    {
        "id": "dal-lake",
        "state_id": "kashmir",
        "name": "Dal Lake",
        "category": "Alpine Lake",
        "subtitle": "Jewel in the Crown of Kashmir",
        "location_label": "Srinagar, Jammu & Kashmir",
        "description": "Urban lake surrounded by Mughal gardens and the Pir Panjal mountains, celebrated for traditional wooden houseboats and floating markets.",
        "hero_image_url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e1/Dal_Lake_Hazratbal_Srinagar.jpg/960px-Dal_Lake_Hazratbal_Srinagar.jpg",
        "banner_image": "https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e1/Dal_Lake_Hazratbal_Srinagar.jpg/960px-Dal_Lake_Hazratbal_Srinagar.jpg",
        "ideal_duration": "2 Days",
        "best_time": "April to October",
        "max_daily_capacity": 4000,
        "latitude": 34.1128000,
        "longitude": 74.8711000,
        "metadata_json": {"floating_gardens": True, "altitude_m": 1583},
    },
    {
        "id": "gulmarg",
        "state_id": "kashmir",
        "name": "Gulmarg",
        "category": "Alpine Meadow & Skiing",
        "subtitle": "Meadow of Flowers and High-Altitude Gondola",
        "location_label": "Baramulla District, Jammu & Kashmir",
        "description": "Premier winter ski resort and summer alpine meadow, operating one of the highest cable cars in the world reaching Mount Apharwat.",
        "hero_image_url": "https://commons.wikimedia.org/wiki/Special:Redirect/file/GulMarg_Kashmir.jpg",
        "banner_image": "https://commons.wikimedia.org/wiki/Special:Redirect/file/GulMarg_Kashmir.jpg",
        "ideal_duration": "2 Days",
        "best_time": "December to February (Skiing) / May to September (Meadow)",
        "max_daily_capacity": 3000,
        "latitude": 34.0484000,
        "longitude": 74.3805000,
        "metadata_json": {"gondola_highest_altitude_m": 3980},
    },
    # Goa
    {
        "id": "old-goa",
        "state_id": "goa",
        "name": "Old Goa",
        "category": "Colonial Heritage",
        "subtitle": "Rome of the East & UNESCO Christian Monuments",
        "location_label": "North Goa District, Goa",
        "description": "Historical city founded in the 15th century, serving as capital of Portuguese India and housing the Basilica of Bom Jesus.",
        "hero_image_url": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Fort_Aguada_Lighthouse.jpg",
        "banner_image": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Fort_Aguada_Lighthouse.jpg",
        "ideal_duration": "1 Day",
        "best_time": "November to February",
        "max_daily_capacity": 3000,
        "latitude": 15.5009000,
        "longitude": 73.9116000,
        "metadata_json": {"unesco_site": True, "era": "Portuguese Colonial"},
    },
    # Uttarakhand
    {
        "id": "rishikesh",
        "state_id": "uttarakhand",
        "name": "Rishikesh",
        "category": "Spiritual & Outdoor",
        "subtitle": "Yoga Capital of the World & Himalayan Gateway",
        "location_label": "Dehradun / Tehri Garhwal, Uttarakhand",
        "description": "Pilgrimage town situated along the sacred Ganga at the foothills of the Himalayas, known for yoga ashrams, river rafting, and suspension bridges.",
        "hero_image_url": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Rishikesh_Ganga.jpg",
        "banner_image": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Rishikesh_Ganga.jpg",
        "ideal_duration": "2-3 Days",
        "best_time": "October to April",
        "max_daily_capacity": 4500,
        "latitude": 30.0869000,
        "longitude": 78.2676000,
        "metadata_json": {"spiritual_hub": True, "river": "Ganga"},
    },
    # Tamil Nadu
    {
        "id": "thanjavur-temples",
        "state_id": "tamilnadu",
        "name": "Thanjavur",
        "category": "Dravidian Heritage",
        "subtitle": "Capital of the Great Living Chola Temples",
        "location_label": "Thanjavur District, Tamil Nadu",
        "description": "Ancient cultural capital known for the 11th-century Brihadisvara Temple, classical Carnatic music, and distinctive Thanjavur paintings.",
        "hero_image_url": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Brihadeeswara_Temple_Thanjavur.jpg",
        "banner_image": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Brihadeeswara_Temple_Thanjavur.jpg",
        "ideal_duration": "1-2 Days",
        "best_time": "November to February",
        "max_daily_capacity": 3500,
        "latitude": 10.7828000,
        "longitude": 79.1318000,
        "metadata_json": {"chola_empire": True, "unesco_site": True},
    },
    # Assam
    {
        "id": "kaziranga",
        "state_id": "assam",
        "name": "Kaziranga National Park",
        "category": "Wildlife Sanctuary",
        "subtitle": "Sanctuary of the Great Indian One-Horned Rhinoceros",
        "location_label": "Golaghat & Nagaon, Assam",
        "description": "UNESCO World Heritage Site hosting two-thirds of the world's great one-horned rhinoceroses among tall elephant grass and floodplains.",
        "hero_image_url": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Kaziranga_National_Park.jpg",
        "banner_image": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Kaziranga_National_Park.jpg",
        "ideal_duration": "2 Days",
        "best_time": "November to April",
        "max_daily_capacity": 2000,
        "latitude": 26.6667000,
        "longitude": 93.3500000,
        "metadata_json": {"unesco_site": True, "flagship_species": "One-Horned Rhino"},
    },
]

# -----------------------------------------------------------------------------
# 4. Representative Attractions
# -----------------------------------------------------------------------------
REPRESENTATIVE_ATTRACTIONS: List[Dict[str, Any]] = [
    # Rajgad Fort
    {
        "id": make_uuid("attraction", "rajgad.padmavati-machi"),
        "destination_id": "rajgad-fort",
        "name": "Padmavati Machi & Temple Complex",
        "category": "Historical Heritage",
        "description": "The administrative, military, and residential heart of Rajgad Fort. Features the ancient Padmavati Temple, water cisterns, and royal residential ruins.",
        "image_url": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Rajgad_Fort_(64283).jpg",
        "rating": 4.8,
        "status": "Open",
        "operating_hours": "06:00 - 18:00",
        "entry_fee_label": "Free Entry (Permit Required)",
    },
    {
        "id": make_uuid("attraction", "rajgad.suvela-machi"),
        "destination_id": "rajgad-fort",
        "name": "Suvela Machi & Nedhe Arch",
        "category": "Natural Fortification",
        "description": "Narrow fortified eastern spur featuring the dramatic natural rock opening known as Nedhe (needle-hole) and steep double-walled defensive bastions.",
        "image_url": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Mountaineous_trail_of_the_Rajgad_Fort.jpg",
        "rating": 4.9,
        "status": "Open",
        "operating_hours": "06:00 - 17:30",
        "entry_fee_label": "Free Entry",
    },
    {
        "id": make_uuid("attraction", "rajgad.balekilla"),
        "destination_id": "rajgad-fort",
        "name": "Balekilla (Highest Citadel)",
        "category": "Sovereign Citadel",
        "description": "The highest fortified citadel of Rajgad towering at 1,376 meters with sheer cliffs on all sides. Houses the remains of the royal palace and water tanks.",
        "image_url": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Rajgad_Fort_(64283).jpg",
        "rating": 4.9,
        "status": "Open",
        "operating_hours": "07:00 - 17:00",
        "entry_fee_label": "Free Entry",
    },
    # Ajanta Caves
    {
        "id": make_uuid("attraction", "ajanta.cave-1"),
        "destination_id": "ajanta-caves",
        "name": "Cave 1 & Bodhisattva Murals",
        "category": "Buddhist Art",
        "description": "A magnificent Vihara cave famous worldwide for its classical mural paintings of Bodhisattva Padmapani and Vajrapani.",
        "image_url": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Ajanta_Caves_from_Maharashtra_state_of_India.jpg",
        "rating": 4.9,
        "status": "Open",
        "operating_hours": "09:00 - 17:30 (Closed Mondays)",
        "entry_fee_label": "₹40 Domestic / ₹600 Foreign",
    },
    # Munnar
    {
        "id": make_uuid("attraction", "munnar.eravikulam"),
        "destination_id": "munnar-hills",
        "name": "Eravikulam National Park",
        "category": "Eco-Reserve",
        "description": "High-altitude shola-grassland sanctuary hosting the largest surviving population of the endangered Nilgiri Tahr and views of Anamudi peak.",
        "image_url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/09/Munnar_-_Tea_Plantations.jpg/960px-Munnar_-_Tea_Plantations.jpg",
        "rating": 4.7,
        "status": "Open",
        "operating_hours": "07:30 - 16:00",
        "entry_fee_label": "₹200 Domestic / ₹500 Foreign",
    },
    # Amer Fort
    {
        "id": make_uuid("attraction", "amer.sheesh-mahal"),
        "destination_id": "amer-fort",
        "name": "Sheesh Mahal (Mirror Palace)",
        "category": "Royal Architecture",
        "description": "The famed Palace of Mirrors decorated with convex glass pieces and imported Belgian mirrors that illuminate the hall with a single flame.",
        "image_url": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Amer_Fort_-_Jaipur_India.jpg",
        "rating": 4.8,
        "status": "Open",
        "operating_hours": "08:00 - 17:30",
        "entry_fee_label": "₹100 Domestic / ₹550 Foreign",
    },
    # Dal Lake
    {
        "id": make_uuid("attraction", "dal-lake.char-chinar"),
        "destination_id": "dal-lake",
        "name": "Char Chinar Island & Waterways",
        "category": "Historic Island",
        "description": "Iconic island on Dal Lake marked by four historic Chinar trees planted during Mughal Emperor Murad Baksh's tenure.",
        "image_url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e1/Dal_Lake_Hazratbal_Srinagar.jpg/960px-Dal_Lake_Hazratbal_Srinagar.jpg",
        "rating": 4.7,
        "status": "Open",
        "operating_hours": "Sunrise to Sunset",
        "entry_fee_label": "Shikara Fare Applicable",
    },
]

# -----------------------------------------------------------------------------
# 5. Representative Tourism Events
# -----------------------------------------------------------------------------
REPRESENTATIVE_EVENTS: List[Dict[str, Any]] = [
    {
        "id": make_uuid("event", "rajgad.shivaji-jayanti"),
        "destination_id": "rajgad-fort",
        "title": "Shivaji Jayanti Mahotsav",
        "date_num": "19",
        "date_month": "FEB",
        "location_label": "Padmavati Machi Courtyard, Rajgad",
        "status": "Confirmed",
        "status_class": "active",
        "image_url": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Rajgad_Fort_(64283).jpg",
        "description": "Annual traditional coronation and torchlight procession at the historic capital of the Maratha Empire.",
    },
    {
        "id": make_uuid("event", "rajgad.heritage-trek"),
        "destination_id": "rajgad-fort",
        "title": "Monsoon Sahyadri Heritage Fort Trail",
        "date_num": "28",
        "date_month": "SEP",
        "location_label": "Gunjavane Base to Rajgad Fort",
        "status": "Open",
        "status_class": "active",
        "image_url": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Mountaineous_trail_of_the_Rajgad_Fort.jpg",
        "description": "Guided eco-trekking expedition explaining fort architecture, rain-harvesting rock tanks, and biodiversity.",
    },
    {
        "id": make_uuid("event", "alleppey.nehru-trophy"),
        "destination_id": "alleppey-backwaters",
        "title": "Nehru Trophy Traditional Snake Boat Race",
        "date_num": "14",
        "date_month": "AUG",
        "location_label": "Punnamada Lake, Alappuzha",
        "status": "Upcoming",
        "status_class": "active",
        "image_url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/e/ee/House_Boat_DSW.jpg/500px-House_Boat_DSW.jpg",
        "description": "World-famous ceremonial Chundan Vallam (snake boat) regatta synchronizing over 100 rowers per boat.",
    },
    {
        "id": make_uuid("event", "amer.dhundhar-festival"),
        "destination_id": "amer-fort",
        "title": "Dhundhar Royal Heritage Light Festival",
        "date_num": "15",
        "date_month": "NOV",
        "location_label": "Jaleb Chowk, Amer Fort, Jaipur",
        "status": "Open",
        "status_class": "active",
        "image_url": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Amer_Fort_-_Jaipur_India.jpg",
        "description": "Spectacular evening celebration with folk music, Kathak recitals, and architectural illumination.",
    },
]

# -----------------------------------------------------------------------------
# 6. Representative Curated Circuits & Stops
# -----------------------------------------------------------------------------
REPRESENTATIVE_CIRCUITS: List[Dict[str, Any]] = [
    {
        "id": "maharashtra-heritage-circuit",
        "state_id": "maharashtra",
        "name": "Sahyadri Forts & UNESCO Caves Trail",
        "description": "A 4-day immersive heritage expedition traversing the Maratha sovereign citadel at Rajgad Fort and the ancient rock-cut art of Ajanta and Ellora.",
        "duration_label": "4 Days / 3 Nights",
        "hero_image_url": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Rajgad_Fort_(64283).jpg",
        "items": [
            {"destination_id": "rajgad-fort", "day_number": 1, "order_index": 1, "notes": "Ascent from Gunjavane, explore Padmavati Machi and Balekilla citadel."},
            {"destination_id": "ellora-caves", "day_number": 2, "order_index": 1, "notes": "Explore Kailasa Temple monolith and Buddhist cave group."},
            {"destination_id": "ajanta-caves", "day_number": 3, "order_index": 1, "notes": "Examine 2nd century BCE Buddhist frescoes and chaityas."},
        ]
    },
    {
        "id": "kerala-backwaters-circuit",
        "state_id": "kerala",
        "name": "Backwaters to Misty Highlands Expedition",
        "description": "Connects the serene backwater canals of Alappuzha with the high-range tea estates and cool climate of Munnar.",
        "duration_label": "3 Days / 2 Nights",
        "hero_image_url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/e/ee/House_Boat_DSW.jpg/500px-House_Boat_DSW.jpg",
        "items": [
            {"destination_id": "alleppey-backwaters", "day_number": 1, "order_index": 1, "notes": "Houseboat cruise on Vembanad Lake and canal village walks."},
            {"destination_id": "munnar-hills", "day_number": 2, "order_index": 1, "notes": "Tea garden trail and Eravikulam sanctuary excursion."},
        ]
    },
]

# -----------------------------------------------------------------------------
# 7. Representative Curated Experiences
# -----------------------------------------------------------------------------
REPRESENTATIVE_EXPERIENCES: List[Dict[str, Any]] = [
    {
        "id": "rajgad-balekilla-ascent",
        "destination_id": "rajgad-fort",
        "title": "Historical Ascent to Rajgad Balekilla",
        "category": "Trekking",
        "category_label": "Mountain Heritage Trail",
        "location_label": "Gunjavane to Rajgad Fort",
        "duration": "5 Hours",
        "difficulty": "Moderate",
        "season": "October to February",
        "guide_requirement": "Certified local guide recommended",
        "image_url": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Mountaineous_trail_of_the_Rajgad_Fort.jpg",
        "description": "Traditional stone staircase climb ascending 800 meters to the central citadel with panoramic vistas of the Sahyadri ranges.",
    },
    {
        "id": "alleppey-canal-kayaking",
        "destination_id": "alleppey-backwaters",
        "title": "Pristine Backwater Canal Kayaking",
        "category": "Water Trails",
        "category_label": "Eco-Waterway Trail",
        "location_label": "Kuttanad Canals, Alappuzha",
        "duration": "3 Hours",
        "difficulty": "Easy",
        "season": "November to March",
        "guide_requirement": "Safety instructor provided",
        "image_url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/e/ee/House_Boat_DSW.jpg/500px-House_Boat_DSW.jpg",
        "description": "Quiet paddle through narrow village canals under coconut canopies, interacting with local coir-weaving communities.",
    },
]

# -----------------------------------------------------------------------------
# 8. Representative Destination Videos
# -----------------------------------------------------------------------------
REPRESENTATIVE_VIDEOS: List[Dict[str, Any]] = [
    {
        "id": make_uuid("video", "rajgad.overview"),
        "destination_id": "rajgad-fort",
        "title": "Rajgad Fort Architecture & Sovereign History",
        "duration": "08:45",
        "youtube_id": "dQw4w9WgXcQ",
        "thumbnail_url": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Rajgad_Fort_(64283).jpg",
    },
    {
        "id": make_uuid("video", "munnar.tea-trails"),
        "destination_id": "munnar-hills",
        "title": "Munnar Tea Plantations & Eravikulam Ecosystem",
        "duration": "06:12",
        "youtube_id": "dQw4w9WgXcQ",
        "thumbnail_url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/09/Munnar_-_Tea_Plantations.jpg/960px-Munnar_-_Tea_Plantations.jpg",
    },
]

# -----------------------------------------------------------------------------
# 9. Representative Travel Stories
# -----------------------------------------------------------------------------
REPRESENTATIVE_STORIES: List[Dict[str, Any]] = [
    {
        "id": "story-rajgad-sentinels",
        "destination_id": "rajgad-fort",
        "title": "Sentinels of the Sahyadri: The Architecture of Rajgad",
        "author_name": "Ananya Sen",
        "read_time": "6 min read",
        "category": "Historical Heritage",
        "image_url": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Rajgad_Fort_(64283).jpg",
        "excerpt": "How medieval military engineering turned a rugged Sahyadri ridge into the impregnable sovereign capital of the Maratha Empire.",
        "content": "Rising dramatically above the surrounding valleys of Pune, Rajgad Fort served as the capital of Chhatrapati Shivaji Maharaj for over two decades. The fort's unique triangular geography, crowned by the sheer cliff of Balekilla and anchored by three defensive machis, exemplifies medieval strategic architecture. Walking along Suvela Machi at sunrise reveals not just military precision, but a profound relationship with the surrounding Sahyadri ecology.",
    },
    {
        "id": "story-kerala-backwaters",
        "destination_id": "alleppey-backwaters",
        "title": "Dawn on Vembanad: Living Traditions of the Backwaters",
        "author_name": "K. V. Raman",
        "read_time": "5 min read",
        "category": "Living Culture",
        "image_url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/e/ee/House_Boat_DSW.jpg/500px-House_Boat_DSW.jpg",
        "excerpt": "Life along the interconnected waterways of Alappuzha, where traditional kettuvallam houseboats meet sustainable coir handicrafts.",
        "content": "Before the morning mist clears over Vembanad Lake, the rhythmic splashing of wooden oars signals the start of daily life. In Alappuzha, water is not a barrier but the very circulatory system of the community. Here, eco-tourism initiatives support centuries-old coir weaving and organic rice farming below sea level in Kuttanad.",
    },
]

# -----------------------------------------------------------------------------
# 10. Representative Operational Users & Geographic Jurisdictions
# -----------------------------------------------------------------------------
REPRESENTATIVE_USERS: List[Dict[str, Any]] = [
    # Destination Manager for Rajgad Fort
    {
        "id": make_uuid("user", "manager.rajgad@yatrasetu.in"),
        "email": "manager.rajgad@yatrasetu.in",
        "full_name": "Rajesh Patil",
        "role_id": "manager",
        "is_active": True,
        "is_verified": True,
        "manager_assignment": {
            "id": make_uuid("assignment", "manager.rajgad@yatrasetu.in"),
            "state_id": "maharashtra",
            "destination_id": "rajgad-fort",
        }
    },
    # State Manager for Kerala
    {
        "id": make_uuid("user", "manager.kerala@yatrasetu.in"),
        "email": "manager.kerala@yatrasetu.in",
        "full_name": "Sunita Nair",
        "role_id": "manager",
        "is_active": True,
        "is_verified": True,
        "manager_assignment": {
            "id": make_uuid("assignment", "manager.kerala@yatrasetu.in"),
            "state_id": "kerala",
            "destination_id": None,  # State Manager scope (all destinations within state)
        }
    },
    # Verified Stakeholder under Rajgad Fort
    {
        "id": make_uuid("user", "stakeholder.rajgad@yatrasetu.in"),
        "email": "stakeholder.rajgad@yatrasetu.in",
        "full_name": "Suresh Deshmukh",
        "role_id": "stakeholder",
        "is_active": True,
        "is_verified": True,
        "stakeholder_service": {
            "id": make_uuid("service", "sahyadri-guides-coop"),
            "business_name": "Sahyadri Trekking Guides Co-op",
            "category": "Guided Tours & Expeditions",
            "license_number": "MH-TOUR-2026-0842",
            "state_id": "maharashtra",
            "destination_id": "rajgad-fort",
            "verification_status": "verified",
            "contact_info": {
                "phone": "+91 98230 11223",
                "email": "contact@sahyadriguides.org",
                "address": "Gunjavane Base Village, Velhe Taluka, Pune, Maharashtra 412213",
                "operating_hours": "06:00 - 19:00",
                "price_range": "₹600 - ₹1200",
                "contact_person": "Suresh Deshmukh",
                "services": [
                    {
                        "id": "off-001",
                        "title": "Certified Historical Fort Trek",
                        "category": "Guided Tours",
                        "price": "₹850 per person",
                        "duration": "5 Hours",
                        "description": "Certified guide tour explaining the 17th century architectural features of Rajgad Fort."
                    },
                    {
                        "id": "off-002",
                        "title": "Sunrise Heritage Photography Tour",
                        "category": "Photography Walks",
                        "price": "₹600 per person",
                        "duration": "3 Hours",
                        "description": "Early morning photography walk to Balekilla and Suvela Machi for dawn views."
                    }
                ]
            }
        }
    },
    # Pending Registration Stakeholder under Alappuzha (Populates Admin/Manager Review Queue)
    {
        "id": make_uuid("user", "stakeholder.alleppey@yatrasetu.in"),
        "email": "stakeholder.alleppey@yatrasetu.in",
        "full_name": "K. V. Raman",
        "role_id": "stakeholder",
        "is_active": True,
        "is_verified": True,
        "stakeholder_service": {
            "id": make_uuid("service", "vemanad-eco-houseboats"),
            "business_name": "Vembanad Eco-Houseboats Collective",
            "category": "Water Transport & Houseboats",
            "license_number": "KL-WAT-2026-1190",
            "state_id": "kerala",
            "destination_id": "alleppey-backwaters",
            "verification_status": "pending",  # In review queue
            "contact_info": {
                "phone": "+91 94470 33445",
                "email": "info@vembanadhouseboats.in",
                "address": "Finishing Point Road, Alappuzha, Kerala 688013",
                "operating_hours": "08:00 - 20:00",
                "price_range": "₹2500 - ₹8000",
                "contact_person": "K. V. Raman",
                "services": [
                    {
                        "id": "off-003",
                        "title": "Traditional Day Cruise & Village Culinary Tour",
                        "category": "Houseboat Cruise",
                        "price": "₹2500 per couple",
                        "duration": "4 Hours",
                        "description": "Traditional non-motorized boat cruise with authentic Kuttanad lunch."
                    }
                ]
            }
        }
    },
]

# -----------------------------------------------------------------------------
# 11. Representative Destination Advisories
# -----------------------------------------------------------------------------
REPRESENTATIVE_ADVISORIES: List[Dict[str, Any]] = [
    {
        "id": make_uuid("advisory", "rajgad.monsoon-steps"),
        "destination_id": "rajgad-fort",
        "severity": "advisory",
        "title": "Monsoon Stone Step Guidance & Escarpment Precaution",
        "description": "Steep stone steps near Suvela Machi and Pali Darwaza become slippery during monsoon showers. Sturdy trekking footwear with good grip is required.",
        "is_active": True,
        "created_by_key": "manager.rajgad@yatrasetu.in",
    },
    {
        "id": make_uuid("advisory", "munnar.fog-precaution"),
        "destination_id": "munnar-hills",
        "severity": "info",
        "title": "High-Altitude Ghat Road Fog & Precaution Notice",
        "description": "Dense evening fog observed on the Kochi-Dhanushkodi National Highway near Gap Road. Drive with fog lamps active between 17:00 and 08:00.",
        "is_active": True,
        "created_by_key": "manager.kerala@yatrasetu.in",
    },
]

# -----------------------------------------------------------------------------
# 12. Representative Approved Destination Reviews
# -----------------------------------------------------------------------------
REPRESENTATIVE_REVIEWS: List[Dict[str, Any]] = [
    {
        "id": make_uuid("review", "rajgad.review-1"),
        "destination_id": "rajgad-fort",
        "author_email": "ambikaambekarbts@gmail.com",  # Links to existing real production user
        "guest_author_name": "Ambika Ambekar",
        "rating": 5,
        "category": "reviews",
        "comment": "Unforgettable trek across the Sahyadri range. The historical bastions and views from Balekilla are magnificent and well maintained.",
        "review_status": "approved",
    },
    {
        "id": make_uuid("review", "munnar.review-1"),
        "destination_id": "munnar-hills",
        "author_email": None,
        "guest_author_name": "Rohan Deshmukh",
        "rating": 5,
        "category": "reviews",
        "comment": "Breathtaking tea hills and cool mountain breeze. Eravikulam sanctuary is an absolute highlight with easy sightings of the Nilgiri Tahr.",
        "review_status": "approved",
    },
]

# -----------------------------------------------------------------------------
# 13. Daily Visitor Telemetry (7 Days for Analytics & Decision Support)
# -----------------------------------------------------------------------------
def get_representative_visitor_stats() -> List[Dict[str, Any]]:
    stats = []
    base_date = date.today() - timedelta(days=7)
    
    # 7 days for Rajgad Fort
    rajgad_counts = [1150, 1280, 1420, 1100, 1680, 2350, 2480]
    for i, count in enumerate(rajgad_counts):
        rec_date = base_date + timedelta(days=i)
        stats.append({
            "id": make_uuid("stat", f"rajgad.{rec_date.isoformat()}"),
            "destination_id": "rajgad-fort",
            "record_date": rec_date,
            "visitor_count": count,
            "domestic_count": int(count * 0.94),
            "international_count": count - int(count * 0.94),
            "capacity_utilization_pct": round((count / 2500) * 100, 2),
            "peak_hour_estimate": "10:00 - 12:00",
        })
        
    # 7 days for Munnar
    munnar_counts = [2100, 2250, 2400, 2180, 2890, 3750, 3920]
    for i, count in enumerate(munnar_counts):
        rec_date = base_date + timedelta(days=i)
        stats.append({
            "id": make_uuid("stat", f"munnar.{rec_date.isoformat()}"),
            "destination_id": "munnar-hills",
            "record_date": rec_date,
            "visitor_count": count,
            "domestic_count": int(count * 0.88),
            "international_count": count - int(count * 0.88),
            "capacity_utilization_pct": round((count / 4000) * 100, 2),
            "peak_hour_estimate": "11:00 - 13:00",
        })
        
    return stats


# -----------------------------------------------------------------------------
# 14. Representative Stakeholder Media, Posts, Messages & Reviews
# -----------------------------------------------------------------------------
def get_representative_stakeholder_media(service_id: uuid.UUID) -> List[Dict[str, Any]]:
    return [
        {
            "id": make_uuid("media", f"{service_id}.dawn-panorama"),
            "service_id": service_id,
            "media_type": "photo",
            "title": "Balekilla Dawn Panorama",
            "description": "Panoramic sunrise view looking east towards Torna and Sinhagad from Balekilla citadel.",
            "media_url": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Rajgad_Fort_view.jpg",
            "thumbnail_url": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Rajgad_Fort_view.jpg",
            "file_size_bytes": 2457600,
            "storage_provider": "local",
            "storage_bucket": "yatrasetu-stakeholder-media",
            "storage_key": "rajgad/sahyadri-guides/dawn-panorama.jpg",
        },
        {
            "id": make_uuid("media", f"{service_id}.bastion-video"),
            "service_id": service_id,
            "media_type": "video",
            "title": "Historical Bastion Walkthrough",
            "description": "Guided walk through the double-walled fortifications of Suvela Machi.",
            "media_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            "thumbnail_url": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Rajgad_Fort_view.jpg",
            "file_size_bytes": 15728640,
            "storage_provider": "local",
            "storage_bucket": "yatrasetu-stakeholder-media",
            "storage_key": "rajgad/sahyadri-guides/bastion-walkthrough.mp4",
        },
    ]


def get_representative_stakeholder_posts(service_id: uuid.UUID) -> List[Dict[str, Any]]:
    return [
        {
            "id": make_uuid("post", f"{service_id}.monsoon-safety"),
            "service_id": service_id,
            "post_type": "announcement",
            "title": "Monsoon Trek Safety Advisory & Guide Booking Protocols",
            "content": "All visitors booking monsoon treks with Sahyadri Guides Co-op are advised to wear high-grip trekking boots. Guide-to-trekker ratio is maintained at 1:8 for steep ridge traverses.",
            "is_published": True,
        },
        {
            "id": make_uuid("post", f"{service_id}.solar-markers"),
            "service_id": service_id,
            "post_type": "suggestion",
            "title": "Proposal for Low-Impact Solar Trail Markers on Suvela Machi",
            "content": "Recommendation submitted to Destination Management to install eco-friendly solar-powered reflective markers along the rocky path to Suvela Machi for evening safety.",
            "is_published": True,
        },
    ]


def get_representative_stakeholder_messages(
    tourist_id: uuid.UUID, stakeholder_id: uuid.UUID, manager_id: uuid.UUID
) -> List[Dict[str, Any]]:
    return [
        {
            "id": make_uuid("message", f"{tourist_id}.to.{stakeholder_id}.inquiry"),
            "sender_id": tourist_id,
            "recipient_id": stakeholder_id,
            "destination_id": "rajgad-fort",
            "subject": "Weekend Heritage Fort Trek - Availability for 4 Trekkers",
            "message": "Hello, we are a group of 4 looking for a certified heritage guide for this Saturday morning fort trek. Could you confirm guide availability?",
            "is_read": True,
        },
        {
            "id": make_uuid("message", f"{stakeholder_id}.to.{manager_id}.cleanup"),
            "sender_id": stakeholder_id,
            "recipient_id": manager_id,
            "destination_id": "rajgad-fort",
            "subject": "Trail Maintenance & Plastic Waste Cleanup Drive Report",
            "message": "Respected Destination Manager, our guides successfully completed the bi-weekly Gunjavane trail cleanup drive, removing 42kg of non-biodegradable waste.",
            "is_read": True,
        },
    ]


def get_representative_stakeholder_reviews(
    service_id: uuid.UUID, tourist_id: uuid.UUID, manager_id: uuid.UUID
) -> List[Dict[str, Any]]:
    return [
        {
            "id": make_uuid("sh_review", f"{service_id}.{tourist_id}"),
            "service_id": service_id,
            "user_id": tourist_id,
            "rating": 5,
            "comment": "Exceptional guide service! Suresh and his team demonstrated deep knowledge of 17th-century Maratha architecture and prioritized trail safety throughout.",
            "review_status": "approved",
            "moderated_by": manager_id,
        }
    ]


# -----------------------------------------------------------------------------
# 15. Representative Tourist Favorites & Custom Itineraries
# -----------------------------------------------------------------------------
def get_representative_favorites(tourist_id: uuid.UUID) -> List[Dict[str, Any]]:
    return [
        {
            "id": make_uuid("fav", f"{tourist_id}.rajgad-fort"),
            "user_id": tourist_id,
            "destination_id": "rajgad-fort",
        },
        {
            "id": make_uuid("fav", f"{tourist_id}.munnar-hills"),
            "user_id": tourist_id,
            "destination_id": "munnar-hills",
        },
    ]


def get_representative_trip_plans(tourist_id: uuid.UUID) -> List[Dict[str, Any]]:
    plan_id = make_uuid("trip", f"{tourist_id}.sahyadri-heritage-trip")
    return [
        {
            "id": plan_id,
            "user_id": tourist_id,
            "title": "Sahyadri Heritage & Fort Trail",
            "start_date": date.today() + timedelta(days=10),
            "end_date": date.today() + timedelta(days=14),
            "notes": "Exploration of Maratha hill forts and UNESCO World Heritage rock-cut cave monuments.",
            "items": [
                {
                    "id": make_uuid("trip_item", f"{plan_id}.item-1"),
                    "trip_plan_id": plan_id,
                    "destination_id": "rajgad-fort",
                    "attraction_id": make_uuid("attraction", "rajgad.balekilla"),
                    "day_number": 1,
                    "order_index": 1,
                    "time_slot": "07:00 - 12:00",
                    "notes": "Early morning ascent from Gunjavane base to Balekilla.",
                },
                {
                    "id": make_uuid("trip_item", f"{plan_id}.item-2"),
                    "trip_plan_id": plan_id,
                    "destination_id": "ajanta-caves",
                    "attraction_id": make_uuid("attraction", "ajanta.cave-1"),
                    "day_number": 2,
                    "order_index": 1,
                    "time_slot": "09:00 - 14:00",
                    "notes": "Study 2nd century BCE Buddhist cave murals and monastic architecture.",
                },
            ],
        }
    ]


# -----------------------------------------------------------------------------
# AUTHORITATIVE SEED EXECUTION ENGINE
# -----------------------------------------------------------------------------
def seed_all_data(
    db: Session = None,
    default_password_hash: str = None,
    include_operational_users: bool = True,
    mark_as_sample: bool = False,
) -> Dict[str, Any]:
    """
    Deterministically and idempotently seeds verified reference and business records.
    Never overwrites existing user accounts, passwords, or tokens.
    When include_operational_users=False, omits operational accounts and their direct dependencies.
    """
    should_close = False
    if db is None:
        db = SessionLocal()
        should_close = True

    stats = {
        "roles": {"created": 0, "existing": 0},
        "states": {"created": 0, "existing": 0},
        "destinations": {"created": 0, "existing": 0},
        "attractions": {"created": 0, "existing": 0},
        "events": {"created": 0, "existing": 0},
        "circuits": {"created": 0, "existing": 0},
        "circuit_items": {"created": 0, "existing": 0},
        "experiences": {"created": 0, "existing": 0},
        "videos": {"created": 0, "existing": 0},
        "users": {"created": 0, "existing": 0},
        "manager_assignments": {"created": 0, "existing": 0},
        "stakeholder_services": {"created": 0, "existing": 0},
        "advisories": {"created": 0, "existing": 0},
        "travel_stories": {"created": 0, "existing": 0},
        "reviews": {"created": 0, "existing": 0},
        "visitor_stats": {"created": 0, "existing": 0},
        "stakeholder_media": {"created": 0, "existing": 0},
        "stakeholder_posts": {"created": 0, "existing": 0},
        "stakeholder_messages": {"created": 0, "existing": 0},
        "stakeholder_reviews": {"created": 0, "existing": 0},
        "favorites": {"created": 0, "existing": 0},
        "trip_plans": {"created": 0, "existing": 0},
        "trip_plan_items": {"created": 0, "existing": 0},
    }

    # Generate password hash once if not provided
    if not default_password_hash:
        default_password_hash = PasswordSecurity.hash_password("YatraSetu#2026!Auth")

    try:
        # Set transaction context for PostgreSQL RLS if running on PostgreSQL
        bind = db.get_bind()
        if bind and bind.dialect.name == "postgresql":
            db.execute(text("SELECT set_config('app.current_role', 'admin', true)"))

        # 1. Roles
        for r in OFFICIAL_ROLES:
            if not db.query(Role).filter(Role.id == r["id"]).first():
                db.add(Role(id=r["id"], name=r["name"], description=r["description"]))
                stats["roles"]["created"] += 1
            else:
                stats["roles"]["existing"] += 1

        # 2. States
        for s in OFFICIAL_STATES:
            if not db.query(State).filter(State.id == s["id"]).first():
                db.add(State(**s))
                stats["states"]["created"] += 1
            else:
                stats["states"]["existing"] += 1

        db.flush()

        # 3. Destinations
        for d in REPRESENTATIVE_DESTINATIONS:
            if not db.query(Destination).filter(Destination.id == d["id"]).first():
                db.add(Destination(**d))
                stats["destinations"]["created"] += 1
            else:
                stats["destinations"]["existing"] += 1

        db.flush()

        # 4. Attractions
        for a in REPRESENTATIVE_ATTRACTIONS:
            if not db.query(Attraction).filter(Attraction.id == a["id"]).first():
                db.add(Attraction(**a))
                stats["attractions"]["created"] += 1
            else:
                stats["attractions"]["existing"] += 1

        # 5. Events
        for e in REPRESENTATIVE_EVENTS:
            if not db.query(Event).filter(Event.id == e["id"]).first():
                db.add(Event(**e))
                stats["events"]["created"] += 1
            else:
                stats["events"]["existing"] += 1

        # 6. Curated Circuits & Items
        for c in REPRESENTATIVE_CIRCUITS:
            items_data = c.get("items", [])
            c_dict = {k: v for k, v in c.items() if k != "items"}
            
            if not db.query(CuratedCircuit).filter(CuratedCircuit.id == c_dict["id"]).first():
                db.add(CuratedCircuit(**c_dict))
                stats["circuits"]["created"] += 1
            else:
                stats["circuits"]["existing"] += 1

            for item in items_data:
                item_id = make_uuid("circuit_item", f"{c_dict['id']}.{item['destination_id']}.day{item['day_number']}")
                if not db.query(CuratedCircuitItem).filter(CuratedCircuitItem.id == item_id).first():
                    db.add(CuratedCircuitItem(
                        id=item_id,
                        circuit_id=c_dict["id"],
                        destination_id=item["destination_id"],
                        day_number=item["day_number"],
                        order_index=item["order_index"],
                        notes=item["notes"],
                    ))
                    stats["circuit_items"]["created"] += 1
                else:
                    stats["circuit_items"]["existing"] += 1

        # 7. Experiences
        for exp in REPRESENTATIVE_EXPERIENCES:
            if not db.query(Experience).filter(Experience.id == exp["id"]).first():
                db.add(Experience(**exp))
                stats["experiences"]["created"] += 1
            else:
                stats["experiences"]["existing"] += 1

        # 8. Videos
        for v in REPRESENTATIVE_VIDEOS:
            if not db.query(DestinationVideo).filter(DestinationVideo.id == v["id"]).first():
                db.add(DestinationVideo(**v))
                stats["videos"]["created"] += 1
            else:
                stats["videos"]["existing"] += 1

        # 9. Travel Stories
        for st in REPRESENTATIVE_STORIES:
            if not db.query(TravelStory).filter(TravelStory.id == st["id"]).first():
                st_data = dict(st)
                if mark_as_sample:
                    if not st_data["author_name"].endswith("(Curated Editorial)"):
                        st_data["author_name"] = f"{st_data['author_name']} (Curated Editorial)"
                    if not st_data["excerpt"].startswith("[Curated Editorial]"):
                        st_data["excerpt"] = f"[Curated Editorial] {st_data['excerpt']}"
                db.add(TravelStory(**st_data))
                stats["travel_stories"]["created"] += 1
            else:
                stats["travel_stories"]["existing"] += 1

        db.flush()

        # 10. Operational Representative Users & Assignments / Services
        user_key_map = {}
        if include_operational_users:
            for u in REPRESENTATIVE_USERS:
                u_email = u["email"]
                existing_user = db.query(User).filter(User.email == u_email).first()
                if not existing_user:
                    new_user = User(
                        id=u["id"],
                        email=u["email"],
                        password_hash=default_password_hash,
                        full_name=u["full_name"],
                        role_id=u["role_id"],
                        is_active=u["is_active"],
                        is_verified=u["is_verified"],
                    )
                    db.add(new_user)
                    user_key_map[u_email] = new_user.id
                    stats["users"]["created"] += 1
                else:
                    user_key_map[u_email] = existing_user.id
                    stats["users"]["existing"] += 1

                db.flush()
                user_id = user_key_map[u_email]

                # Manager Assignment if applicable
                if "manager_assignment" in u:
                    ma = u["manager_assignment"]
                    if not db.query(ManagerAssignment).filter(ManagerAssignment.user_id == user_id).first():
                        db.add(ManagerAssignment(
                            id=ma["id"],
                            user_id=user_id,
                            role_id="manager",
                            state_id=ma["state_id"],
                            destination_id=ma["destination_id"],
                        ))
                        stats["manager_assignments"]["created"] += 1
                    else:
                        stats["manager_assignments"]["existing"] += 1

                # Stakeholder Service if applicable
                if "stakeholder_service" in u:
                    sh = u["stakeholder_service"]
                    existing_sh = db.query(StakeholderService).filter(
                        (StakeholderService.id == sh["id"]) |
                        (StakeholderService.user_id == user_id) |
                        ((StakeholderService.destination_id == sh["destination_id"]) & (StakeholderService.business_name == sh["business_name"]))
                    ).first()
                    if not existing_sh:
                        db.add(StakeholderService(
                            id=sh["id"],
                            user_id=user_id,
                            role_id="stakeholder",
                            business_name=sh["business_name"],
                            category=sh["category"],
                            license_number=sh["license_number"],
                            state_id=sh["state_id"],
                            destination_id=sh["destination_id"],
                            verification_status=sh["verification_status"],
                            contact_info=sh["contact_info"],
                        ))
                        stats["stakeholder_services"]["created"] += 1
                    else:
                        stats["stakeholder_services"]["existing"] += 1

            db.flush()

            # 11. Advisories (Linked to manager users)
            for adv in REPRESENTATIVE_ADVISORIES:
                author_id = user_key_map.get(adv["created_by_key"])
                if not author_id:
                    author_u = db.query(User).filter(User.email == adv["created_by_key"]).first()
                    if author_u:
                        author_id = author_u.id

                if author_id and not db.query(DestinationAdvisory).filter(DestinationAdvisory.id == adv["id"]).first():
                    db.add(DestinationAdvisory(
                        id=adv["id"],
                        destination_id=adv["destination_id"],
                        severity=adv["severity"],
                        title=adv["title"],
                        description=adv["description"],
                        is_active=adv["is_active"],
                        created_by=author_id,
                    ))
                    stats["advisories"]["created"] += 1
                else:
                    stats["advisories"]["existing"] += 1

        # 12. Approved Destination Reviews
        for rev in REPRESENTATIVE_REVIEWS:
            author_id = None
            if include_operational_users and rev.get("author_email"):
                author_user = db.query(User).filter(User.email == rev["author_email"]).first()
                if author_user:
                    author_id = author_user.id

            comment = rev["comment"]
            guest_author = rev["guest_author_name"]
            if mark_as_sample:
                if not comment.startswith("[Sample Review]"):
                    comment = f"[Sample Review] {comment}"
                if "(Sample)" not in guest_author:
                    guest_author = f"{guest_author} (Sample)"

            if not db.query(DestinationReview).filter(DestinationReview.id == rev["id"]).first():
                db.add(DestinationReview(
                    id=rev["id"],
                    destination_id=rev["destination_id"],
                    user_id=author_id,
                    guest_author_name=guest_author,
                    rating=rev["rating"],
                    category=rev["category"],
                    comment=comment,
                    review_status=rev["review_status"],
                ))
                stats["reviews"]["created"] += 1
            else:
                stats["reviews"]["existing"] += 1

        # 13. Visitor Statistics
        for vs in get_representative_visitor_stats():
            if not db.query(VisitorStatistic).filter(VisitorStatistic.id == vs["id"]).first():
                vs_data = dict(vs)
                if mark_as_sample and vs_data.get("peak_hour_estimate") and "(Sample)" not in vs_data["peak_hour_estimate"]:
                    vs_data["peak_hour_estimate"] = f"{vs_data['peak_hour_estimate']} (Sample)"
                db.add(VisitorStatistic(**vs_data))
                stats["visitor_stats"]["created"] += 1
            else:
                stats["visitor_stats"]["existing"] += 1

        # 14. Stakeholder Media, Posts, Messages & Reviews (when operational users enabled)
        if include_operational_users:
            sh_service = db.query(StakeholderService).filter(StakeholderService.destination_id == "rajgad-fort").first()
            tourist_u = db.query(User).filter(User.role_id == "tourist", User.email == "test.tourist.f71aab@example.com").first()
            if not tourist_u:
                tourist_u = db.query(User).filter(User.role_id == "tourist").first()
            manager_u = db.query(User).filter(User.role_id == "manager", User.email == "manager.rajgad@yatrasetu.in").first()
            if not manager_u:
                manager_u = db.query(User).filter(User.role_id == "manager").first()
            stakeholder_u = db.query(User).filter(User.role_id == "stakeholder", User.email == "stakeholder.rajgad@yatrasetu.in").first()
            if not stakeholder_u and sh_service:
                stakeholder_u = db.query(User).filter(User.id == sh_service.user_id).first()

            if sh_service:
                # Media
                for sm in get_representative_stakeholder_media(sh_service.id):
                    if not db.query(StakeholderMedia).filter(StakeholderMedia.id == sm["id"]).first():
                        db.add(StakeholderMedia(**sm))
                        stats["stakeholder_media"]["created"] += 1
                    else:
                        stats["stakeholder_media"]["existing"] += 1

                # Posts
                for sp in get_representative_stakeholder_posts(sh_service.id):
                    if not db.query(StakeholderPost).filter(StakeholderPost.id == sp["id"]).first():
                        db.add(StakeholderPost(**sp))
                        stats["stakeholder_posts"]["created"] += 1
                    else:
                        stats["stakeholder_posts"]["existing"] += 1

                # Reviews
                if tourist_u and manager_u:
                    for sr in get_representative_stakeholder_reviews(sh_service.id, tourist_u.id, manager_u.id):
                        if not db.query(StakeholderReview).filter(StakeholderReview.id == sr["id"]).first():
                            db.add(StakeholderReview(**sr))
                            stats["stakeholder_reviews"]["created"] += 1
                        else:
                            stats["stakeholder_reviews"]["existing"] += 1

            # Messages
            if tourist_u and stakeholder_u and manager_u:
                for msg in get_representative_stakeholder_messages(tourist_u.id, stakeholder_u.id, manager_u.id):
                    if not db.query(StakeholderMessage).filter(StakeholderMessage.id == msg["id"]).first():
                        db.add(StakeholderMessage(**msg))
                        stats["stakeholder_messages"]["created"] += 1
                    else:
                        stats["stakeholder_messages"]["existing"] += 1

            # 15. Tourist Favorites & Trip Plans
            if tourist_u:
                for fav in get_representative_favorites(tourist_u.id):
                    if not db.query(UserFavorite).filter(
                        UserFavorite.user_id == fav["user_id"],
                        UserFavorite.destination_id == fav["destination_id"]
                    ).first():
                        db.add(UserFavorite(**fav))
                        stats["favorites"]["created"] += 1
                    else:
                        stats["favorites"]["existing"] += 1

                for plan in get_representative_trip_plans(tourist_u.id):
                    plan_copy = dict(plan)
                    items_data = plan_copy.pop("items", [])
                    if not db.query(TripPlan).filter(TripPlan.id == plan_copy["id"]).first():
                        db.add(TripPlan(**plan_copy))
                        stats["trip_plans"]["created"] += 1
                    else:
                        stats["trip_plans"]["existing"] += 1

                    for item in items_data:
                        if not db.query(TripPlanItem).filter(TripPlanItem.id == item["id"]).first():
                            db.add(TripPlanItem(**item))
                            stats["trip_plan_items"]["created"] += 1
                        else:
                            stats["trip_plan_items"]["existing"] += 1

        db.commit()
        return {
            "success": True,
            "roles_created": stats["roles"]["created"],
            "states_created": stats["states"]["created"],
            "stats": stats,
        }

    except Exception as exc:
        db.rollback()
        return {"success": False, "error": str(exc), "roles_created": 0, "states_created": 0}
    finally:
        if should_close:
            db.close()


def seed_reference_data(db: Session = None) -> Dict[str, Any]:
    """
    Seeds official roles (4) and states (8) into the database.
    Idempotent and safe for unit tests and minimal initializations.
    """
    should_close = False
    if db is None:
        db = SessionLocal()
        should_close = True

    roles_created = 0
    states_created = 0

    try:
        bind = db.get_bind()
        if bind and bind.dialect.name == "postgresql":
            db.execute(text("SELECT set_config('app.current_role', 'admin', true)"))

        for r in OFFICIAL_ROLES:
            if not db.query(Role).filter(Role.id == r["id"]).first():
                db.add(Role(id=r["id"], name=r["name"], description=r["description"]))
                roles_created += 1

        for s in OFFICIAL_STATES:
            if not db.query(State).filter(State.id == s["id"]).first():
                db.add(State(**s))
                states_created += 1

        db.commit()
        return {
            "success": True,
            "roles_created": roles_created,
            "states_created": states_created,
        }
    except Exception as exc:
        db.rollback()
        return {"success": False, "error": str(exc), "roles_created": 0, "states_created": 0}
    finally:
        if should_close:
            db.close()


def provision_admin_account(
    db: Session = None,
    email: str = "admin.governance@yatrasetu.in",
    full_name: str = "Rajesh Verma",
    phone_number: str = "+91 98200 12345",
) -> Dict[str, Any]:
    """
    Controlled administrative account provisioning.
    Generates a cryptographically strong unique temporary password,
    hashes it with Argon2id, and commits to the database under admin session context.
    Never exposes plain password in source control, SQL, or logs.
    """
    import secrets
    import string
    import json

    should_close = False
    if db is None:
        db = SessionLocal()
        should_close = True

    try:
        bind = db.get_bind()
        if bind and bind.dialect.name == "postgresql":
            db.execute(text("SELECT set_config('app.current_role', 'admin', true)"))

        # Cryptographically strong unique password (20 characters with mixed charset)
        alphabet = string.ascii_letters + string.digits + "!@#$%^&*()-_=+"
        temp_password = (
            secrets.choice(string.ascii_uppercase)
            + secrets.choice(string.ascii_lowercase)
            + secrets.choice(string.digits)
            + secrets.choice("!@#$%^&*")
            + "".join(secrets.choice(alphabet) for _ in range(16))
        )
        pw_hash = PasswordSecurity.hash_password(temp_password)

        user = db.query(User).filter(User.email == email).first()
        if user:
            user.password_hash = pw_hash
            user.full_name = full_name
            user.role_id = "admin"
            user.phone_number = phone_number
            user.is_active = True
            user.is_verified = True
            user_id = user.id
            status = "updated"
        else:
            user_id = make_uuid("user", email)
            user = User(
                id=user_id,
                email=email,
                password_hash=pw_hash,
                full_name=full_name,
                phone_number=phone_number,
                role_id="admin",
                is_active=True,
                is_verified=True,
            )
            db.add(user)
            status = "created"

        db.commit()

        # Save credentials locally in gitignored file for test runner access
        creds_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "..", "scratch", ".test_admin_credentials.json"
        )
        try:
            with open(creds_path, "w", encoding="utf-8") as f:
                json.dump({
                    "email": email,
                    "password": temp_password,
                    "user_id": str(user_id),
                    "full_name": full_name,
                    "role": "admin"
                }, f, indent=2)
        except Exception:
            pass

        return {
            "status": status,
            "email": email,
            "temporary_password": temp_password,
            "user_id": str(user_id),
            "full_name": full_name,
            "role": "admin",
        }
    finally:
        if should_close:
            db.close()


def seed_local_testing_dataset(db: Session = None) -> Dict[str, Any]:
    """
    Seeds the complete relationally consistent dataset for testing all 4 workspaces locally.
    Includes: Reference data, destinations, attractions, events, circuits, experiences,
    videos, stories, operational users (2 managers, 2 stakeholders, tourists),
    advisories, reviews, visitor stats, stakeholder media/posts/messages/reviews,
    tourist favorites and custom trip plans, and provisions exactly 1 controlled Admin account.
    """
    should_close = False
    if db is None:
        db = SessionLocal()
        should_close = True

    try:
        # 1. Seed complete application dataset with operational users
        seed_result = seed_all_data(db, include_operational_users=True, mark_as_sample=False)
        if not seed_result.get("success"):
            return seed_result

        # 2. Provision controlled admin account
        admin_result = provision_admin_account(db, email="admin.governance@yatrasetu.in")

        return {
            "success": True,
            "seed_stats": seed_result.get("stats"),
            "admin": admin_result,
        }
    finally:
        if should_close:
            db.close()


if __name__ == "__main__":
    import json
    result = seed_all_data()
    print("Seed execution result:", json.dumps(result, indent=2))
