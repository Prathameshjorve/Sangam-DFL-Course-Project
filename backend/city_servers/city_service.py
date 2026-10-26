"""
Factory and City Service Engine for Autonomous City Nodes.
Provides endpoints:
- GET /api/v1/health
- GET /api/v1/city
- GET /api/v1/events
- POST /api/v1/events
- GET /api/v1/events/{event_id}
- POST /api/v1/predict
- GET /api/v1/model/status
- GET /api/v1/analytics/summary
- PATCH /api/v1/events/{event_id}/review
"""
import os
import sys
import uuid
from datetime import datetime
from typing import Optional, List
from fastapi import FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from shared.models import (
    CityEnum, EventRecord, EventCreateRequest, ModelPredictionResult,
    VerificationStatus, ReviewPriority, EventCategory
)
from shared.mock_model_adapter import MockCityTextModelAdapter
from database.connection import get_database, verify_mongo_connection

def create_city_app(city_name: str, port: int) -> FastAPI:
    city_name = city_name.lower()
    app = FastAPI(
        title=f"SANGAM Local Server — {city_name.capitalize()}",
        description=f"Autonomous tactical edge node for {city_name.capitalize()} intelligence data collection and text inference.",
        version="1.0.0"
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    model_adapter = MockCityTextModelAdapter(city_name=city_name)
    collection_name = f"events_{city_name}"

    @app.get("/api/v1/health")
    async def health_check():
        mongo_up = verify_mongo_connection()
        return {
            "status": "healthy",
            "city": city_name,
            "port": port,
            "timestamp": datetime.now().isoformat(),
            "database_connected": mongo_up,
            "model_status": model_adapter.get_model_status()
        }

    @app.post("/api/v1/auth/login")
    async def city_login(payload: dict):
        username = payload.get("username", "").lower()
        password = payload.get("password", "")
        expected_user = f"{city_name}_op"
        expected_pass = f"{city_name}@123"
        
        # Also allow global admin
        if (username == expected_user and password == expected_pass) or (username == "admin" and password == "sangam_admin2026"):
            return {
                "status": "authenticated",
                "city": city_name,
                "username": username,
                "role": f"{city_name.capitalize()} Operator" if username != "admin" else "Administrator"
            }
        raise HTTPException(status_code=401, detail=f"Invalid credentials for {city_name.capitalize()} node terminal.")

    @app.get("/api/v1/city")
    async def get_city_profile():
        return {
            "city_id": city_name,
            "city_name": city_name.capitalize(),
            "port": port,
            "jurisdiction": f"Metropolitan Sector — {city_name.capitalize()}",
            "model_assigned": model_adapter.model_name,
            "model_version": model_adapter.model_version,
            "is_mock": True
        }

    @app.get("/api/v1/model/status")
    async def model_status():
        return model_adapter.get_model_status()

    @app.post("/api/v1/predict", response_model=ModelPredictionResult)
    async def run_prediction(payload: EventCreateRequest):
        res = model_adapter.predict(text=payload.text_description, area=payload.reported_area)
        return res

    @app.post("/api/v1/events", response_model=EventRecord, status_code=status.HTTP_201_CREATED)
    async def submit_event(payload: EventCreateRequest):
        # 1. Run local model adapter
        pred = model_adapter.predict(text=payload.text_description, area=payload.reported_area)
        
        now_iso = datetime.now().isoformat()
        report_date = payload.report_date or pred.event_date
        report_time = payload.report_time or pred.event_time

        record = EventRecord(
            event_id=pred.event_id,
            city=city_name,
            reported_area=payload.reported_area,
            text_description=payload.text_description,
            source_category=payload.source_category or "Field Intelligence Report",
            predicted_category=pred.predicted_category,
            review_priority=pred.review_priority,
            model_confidence=pred.model_confidence,
            matched_keywords=pred.matched_keywords,
            extracted_entities=pred.extracted_entities,
            verification_status=VerificationStatus.PENDING_REVIEW,
            report_date=report_date,
            report_time=report_time,
            model_name=pred.model_name,
            model_version=pred.model_version,
            is_mock=True,
            created_at=now_iso,
            updated_at=now_iso
        )

        db = get_database()
        try:
            await db[collection_name].insert_one(record.dict())
        except Exception as e:
            # If MongoDB collection insert failed, raise 500
            raise HTTPException(status_code=500, detail=f"Database insert error: {str(e)}")

        return record

    @app.get("/api/v1/events")
    async def list_events(
        skip: int = Query(0, ge=0),
        limit: int = Query(50, ge=1, le=200),
        priority: Optional[ReviewPriority] = None,
        verification_status: Optional[VerificationStatus] = None,
        category: Optional[EventCategory] = None,
        search: Optional[str] = None
    ):
        db = get_database()
        query = {}
        if priority:
            query["review_priority"] = priority
        if verification_status:
            query["verification_status"] = verification_status
        if category:
            query["predicted_category"] = category
        if search:
            query["$or"] = [
                {"text_description": {"$regex": search, "$options": "i"}},
                {"reported_area": {"$regex": search, "$options": "i"}},
                {"matched_keywords": {"$regex": search, "$options": "i"}}
            ]

        cursor = db[collection_name].find(query).sort("created_at", -1).skip(skip).limit(limit)
        events = await cursor.to_list(length=limit)
        total_count = await db[collection_name].count_documents(query)

        for e in events:
            if "_id" in e:
                del e["_id"]

        return {
            "city": city_name,
            "total": total_count,
            "skip": skip,
            "limit": limit,
            "events": events
        }

    @app.get("/api/v1/events/{event_id}", response_model=EventRecord)
    async def get_event_by_id(event_id: str):
        db = get_database()
        event = await db[collection_name].find_one({"event_id": event_id})
        if not event:
            raise HTTPException(status_code=404, detail=f"Event {event_id} not found in {city_name} node.")
        if "_id" in event:
            del event["_id"]
        return event

    class ReviewUpdatePayload(BaseModel):
        verification_status: VerificationStatus

    @app.patch("/api/v1/events/{event_id}/review")
    async def update_event_review(event_id: str, payload: ReviewUpdatePayload):
        db = get_database()
        now_iso = datetime.now().isoformat()
        res = await db[collection_name].update_one(
            {"event_id": event_id},
            {"$set": {"verification_status": payload.verification_status, "updated_at": now_iso}}
        )
        if res.matched_count == 0:
            raise HTTPException(status_code=404, detail="Event not found")
        return {"status": "success", "event_id": event_id, "new_verification_status": payload.verification_status}

    @app.get("/api/v1/analytics/summary")
    async def city_analytics_summary():
        db = get_database()
        total_reports = await db[collection_name].count_documents({})
        pending_review = await db[collection_name].count_documents({"verification_status": VerificationStatus.PENDING_REVIEW})
        high_priority = await db[collection_name].count_documents({"review_priority": ReviewPriority.HIGH})
        verified = await db[collection_name].count_documents({"verification_status": VerificationStatus.VERIFIED})

        # Category breakdown
        pipeline = [
            {"$group": {"_id": "$predicted_category", "count": {"$sum": 1}}}
        ]
        cat_cursor = db[collection_name].aggregate(pipeline)
        categories = await cat_cursor.to_list(length=50)

        return {
            "city": city_name,
            "total_reports": total_reports,
            "pending_review": pending_review,
            "high_priority": high_priority,
            "verified": verified,
            "category_distribution": {c["_id"]: c["count"] for c in categories if c["_id"]}
        }

    return app
