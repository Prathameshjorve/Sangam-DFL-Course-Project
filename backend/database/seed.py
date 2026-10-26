"""
Database Seeding Script for SANGAM.
Populates realistic fictional tactical events across Mumbai, Bengaluru, Kolkata, and Chennai
with deliberate cross-city overlaps (e.g. matching older hatchback, missing registration plate,
clandestine transit) to test the correlation engine and populate the UI dashboard immediately.
"""
import asyncio
import os
import sys
from datetime import datetime

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from shared.models import (
    EventCategory, ReviewPriority, VerificationStatus
)
from shared.mock_model_adapter import MockCityTextModelAdapter
from database.connection import get_database

SEED_REPORTS = {
    "mumbai": [
        {
            "area": "Nhava Sheva Cargo Logistics Hub, Sector 4",
            "text": "An older white hatchback was reported idling near the secondary container terminal. The witness described a missing registration plate and dark tinted windows. Driver fled when dock patrol approached.",
            "date": "2026-10-14", "time": "08:30:00"
        },
        {
            "area": "Bandra Kurla Financial Complex",
            "text": "Security flag: Individual observed photographing access gates and surveillance perimeters using a long lens camera while wearing an outdated contractor uniform.",
            "date": "2026-10-14", "time": "14:15:00"
        },
        {
            "area": "Andheri West Transit Terminal",
            "text": "Unmarked wooden crate left unattended near commuter baggage zone. Label had forged credentials and non-existent logistics routing numbers.",
            "date": "2026-10-15", "time": "09:10:00"
        }
    ],
    "chennai": [
        {
            "area": "Ennore Port Logistics Approach, Gate 3",
            "text": "An older white hatchback was identified moving slowly along restricted perimeter fence. Multiple witnesses noted a missing registration plate and dented rear bumper matching transit alerts.",
            "date": "2026-10-14", "time": "22:45:00"
        },
        {
            "area": "Guindy Industrial Estate, Unit 12",
            "text": "Unusual gathering of six unidentified individuals in a closed warehouse after midnight. High frequency radio transmission detected nearby with signal jammer characteristics.",
            "date": "2026-10-15", "time": "01:20:00"
        }
    ],
    "kolkata": [
        {
            "area": "Kidderpore Docks Maritime Gate",
            "text": "Marine patrol alerted to a white hatchback vehicle with missing registration number plate observed transferring unmanifested consignment crates to a small motorized barge.",
            "date": "2026-10-15", "time": "04:10:00"
        },
        {
            "area": "Salt Lake Sector V Technology Hub",
            "text": "Attempted breach at back entrance of power substation. Intruder used forged credentials and duplicate keycard before escaping towards eastern bypass.",
            "date": "2026-10-14", "time": "19:50:00"
        }
    ],
    "bengaluru": [
        {
            "area": "Electronic City Phase II Logistics Zone",
            "text": "Anomalous communication beacon intercepted emitting short bursts on tactical frequency band near data center compound.",
            "date": "2026-10-15", "time": "06:40:00"
        },
        {
            "area": "Peenya Industrial Area 4th Phase",
            "text": "Report received regarding clandestine night transit of sealed metallic drums without chemical safety manifests or escort permits.",
            "date": "2026-10-14", "time": "23:05:00"
        }
    ]
}

async def seed():
    print("[+] Starting SANGAM database seeding...")
    db = get_database()
    
    # Clean previous demo data for clean state
    for city in ["mumbai", "bengaluru", "kolkata", "chennai"]:
        await db[f"events_{city}"].delete_many({})
    await db["global_events"].delete_many({})
    await db["correlations"].delete_many({})
    await db["sync_history"].delete_many({})

    adapters = {
        city: MockCityTextModelAdapter(city_name=city)
        for city in ["mumbai", "bengaluru", "kolkata", "chennai"]
    }

    all_seeded_records = []

    for city, reports in SEED_REPORTS.items():
        adapter = adapters[city]
        coll = db[f"events_{city}"]
        for r in reports:
            pred = adapter.predict(text=r["text"], area=r["area"])
            record = {
                "event_id": pred.event_id,
                "city": city,
                "reported_area": r["area"],
                "text_description": r["text"],
                "source_category": "Regional Field Report",
                "predicted_category": pred.predicted_category.value,
                "review_priority": pred.review_priority.value,
                "model_confidence": pred.model_confidence,
                "matched_keywords": pred.matched_keywords,
                "extracted_entities": pred.extracted_entities,
                "verification_status": VerificationStatus.PENDING_REVIEW.value,
                "report_date": r["date"],
                "report_time": r["time"],
                "model_name": pred.model_name,
                "model_version": pred.model_version,
                "is_mock": True,
                "created_at": f"{r['date']}T{r['time']}Z",
                "updated_at": f"{r['date']}T{r['time']}Z"
            }
            await coll.insert_one(record)
            # Also seed directly to global index for instant dashboard gratification
            global_record = record.copy()
            if "_id" in global_record: del global_record["_id"]
            await db["global_events"].insert_one(global_record)
            all_seeded_records.append(global_record)

        print(f"  [OK] Seeded {len(reports)} records for {city.capitalize()}")

    # Run correlation engine on the seeded events
    from global_server.correlation_engine import CrossCityCorrelationEngine
    engine = CrossCityCorrelationEngine()
    correlations = engine.analyze_event_pool(all_seeded_records)
    for c in correlations:
        await db["correlations"].insert_one(c.dict())

    print(f"  [OK] Generated {len(correlations)} cross-city correlations from seeded data.")
    print("[SUCCESS] Seeding complete successfully!")

if __name__ == "__main__":
    asyncio.run(seed())
