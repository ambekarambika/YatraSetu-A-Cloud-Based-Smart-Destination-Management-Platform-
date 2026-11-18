"""
YatraSetu Platform — Verified Reference Data Seeder
Seeds ONLY official, non-fabricated reference lookup records:
1. The 4 Platform Roles (admin, manager, stakeholder, tourist)
2. The 8 Cultural Context States (Maharashtra, Kerala, Kashmir, Rajasthan, Goa, Tamil Nadu, Uttarakhand, Assam)

Separated strictly from schema migrations and run explicitly.
"""

from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.identity import Role
from app.models.destination import State

# Agreed official reference roles
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

# Agreed official reference states (8 Cultural Context States)
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


def seed_reference_data(db: Session = None) -> Dict[str, Any]:
    """
    Idempotently seeds official roles and states.
    Does not insert synthetic users, reviews, or private records.
    """
    should_close = False
    if db is None:
        db = SessionLocal()
        should_close = True

    roles_created = 0
    roles_existing = 0
    states_created = 0
    states_existing = 0

    try:
        # 1. Seed Roles
        for role_data in OFFICIAL_ROLES:
            existing = db.query(Role).filter(Role.id == role_data["id"]).first()
            if not existing:
                role = Role(
                    id=role_data["id"],
                    name=role_data["name"],
                    description=role_data["description"],
                )
                db.add(role)
                roles_created += 1
            else:
                roles_existing += 1

        # 2. Seed States
        for state_data in OFFICIAL_STATES:
            existing = db.query(State).filter(State.id == state_data["id"]).first()
            if not existing:
                state = State(
                    id=state_data["id"],
                    name=state_data["name"],
                    theme_code=state_data["theme_code"],
                    badge_label=state_data["badge_label"],
                    tagline=state_data["tagline"],
                    description=state_data["description"],
                    hero_image_url=state_data["hero_image_url"],
                )
                db.add(state)
                states_created += 1
            else:
                states_existing += 1

        db.commit()
        return {
            "success": True,
            "roles_created": roles_created,
            "roles_existing": roles_existing,
            "states_created": states_created,
            "states_existing": states_existing,
        }
    except Exception as exc:
        db.rollback()
        return {
            "success": False,
            "error": str(exc),
        }
    finally:
        if should_close:
            db.close()


if __name__ == "__main__":
    import json
    result = seed_reference_data()
    print("Seed execution result:", json.dumps(result, indent=2))
