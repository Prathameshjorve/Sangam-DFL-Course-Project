"""
Central Global Coordination & Cross-City Correlation Server.
Runs on Port 8000.
Endpoints:
- GET /api/v1/health
- GET /api/v1/servers
- POST /api/v1/sync
- GET /api/v1/events
- GET /api/v1/events/{event_id}
- GET /api/v1/correlations
- GET /api/v1/correlations/{correlation_id}
- PATCH /api/v1/correlations/{correlation_id}
- GET /api/v1/dashboard/summary
- GET /api/v1/analytics/cities
- GET /api/v1/sync/history
- POST /api/v1/auth/login
- GET /api/v1/auth/me
"""
import os
import sys
import uuid
import asyncio
from datetime import datetime
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, HTTPException, Query, status, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from shared.models import (
    CityEnum, EventRecord, ReviewPriority, VerificationStatus,
    EventCategory, CrossCityCorrelation, CorrelationStatus, SyncAuditLog,
    UserLogin, UserRole
)
from shared.auth import create_access_token, get_current_user, require_role, hash_password
from database.connection import get_database, verify_mongo_connection
from global_server.service_client import CityServiceClient, CITY_ENDPOINTS
from global_server.correlation_engine import CrossCityCorrelationEngine

app = FastAPI(
    title="SANGAM Central Global Coordinator",
    description="Distributed Multi-City Text Intelligence & Cross-City Correlation Platform Aggregator",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

city_client = CityServiceClient(timeout_seconds=3.0)
corr_engine = CrossCityCorrelationEngine()

@app.on_event("startup")
async def startup_event():
    db = get_database()
    # Create indexes for deduplication and performance
    try:
        await db["global_events"].create_index("event_id", unique=True)
        await db["correlations"].create_index("correlation_id", unique=True)
        await db["sync_history"].create_index("sync_id", unique=True)
    except Exception as e:
        print(f"Index creation note: {e}")

@app.get("/api/v1/health")
async def health():
    mongo_ok = verify_mongo_connection()
    return {
        "status": "online",
        "service": "SANGAM Central Coordinator",
        "port": 8000,
        "database_connected": mongo_ok,
        "timestamp": datetime.now().isoformat()
    }

@app.post("/api/v1/auth/login")
async def login(payload: UserLogin):
    # Accounts: Global Admin/Analyst plus distinct credentials for each city node
    accounts = {
        # Global Central Accounts
        "admin": ("sangam_admin2026", UserRole.ADMIN, "all", "Central Command"),
        "analyst": ("analyst_intel", UserRole.ANALYST, "all", "Intelligence Directorate"),
        "reviewer": ("reviewer_pass", UserRole.REVIEWER, "all", "Review Board"),
        # City-Specific Operator Accounts
        "mumbai_op": ("mumbai@123", UserRole.MUMBAI_OPERATOR, "mumbai", "Mumbai Sector Command"),
        "bengaluru_op": ("bengaluru@123", UserRole.BENGALURU_OPERATOR, "bengaluru", "Bengaluru Tech Command"),
        "kolkata_op": ("kolkata@123", UserRole.KOLKATA_OPERATOR, "kolkata", "Kolkata Port Command"),
        "chennai_op": ("chennai@123", UserRole.CHENNAI_OPERATOR, "chennai", "Chennai Coastal Command")
    }
    user_cred = accounts.get(payload.username.lower())
    if not user_cred or user_cred[0] != payload.password:
        raise HTTPException(status_code=401, detail="Invalid username or security credentials.")
    
    password, role, assigned_city, department = user_cred
    token = create_access_token({
        "sub": payload.username,
        "role": role.value,
        "city": assigned_city,
        "department": department
    })
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "username": payload.username,
            "role": role.value,
            "city": assigned_city,
            "department": department,
            "is_global": assigned_city == "all",
            "permissions": ["upload", "view", "sync"] if assigned_city != "all" else ["all", "admin", "review", "sync"]
        }
    }

@app.get("/api/v1/auth/me")
async def auth_me(user = Depends(get_current_user)):
    return user

@app.get("/api/v1/servers")
async def get_servers_status():
    """Pings all 4 independent city nodes via HTTP and returns status & sync timestamps."""
    db = get_database()
    statuses = await city_client.check_all_cities()
    
    # Enrich with latest synchronization timestamps and record counts from global index
    for s in statuses:
        city_name = s["city"]
        event_count = await db["global_events"].count_documents({"city": city_name})
        pending_count = await db["global_events"].count_documents({"city": city_name, "verification_status": VerificationStatus.PENDING_REVIEW})
        
        last_sync = await db["sync_history"].find_one(
            {"cities_successful": city_name},
            sort=[("completed_at", -1)]
        )
        s["total_events"] = event_count
        s["pending_review_count"] = pending_count
        s["last_sync_timestamp"] = last_sync.get("completed_at") if last_sync else None

    return statuses

@app.post("/api/v1/sync")
async def trigger_synchronization():
    """
    Genuine distributed sync:
    1. HTTP calls to Mumbai, Bengaluru, Kolkata, Chennai.
    2. Collects authorized event records.
    3. Idempotently merges into global index using event_id deduplication.
    4. Triggers cross-city correlation engine.
    5. Records sync audit log.
    Handles offline nodes gracefully without crashing.
    """
    start_time = datetime.now()
    db = get_database()
    
    queried = list(CITY_ENDPOINTS.keys())
    successful = []
    failed = []
    new_added = 0
    total_fetched = 0

    # Fetch from all cities concurrently
    city_fetch_tasks = [city_client.fetch_city_events(city) for city in queried]
    fetched_results = await asyncio.gather(*city_fetch_tasks, return_exceptions=True)

    for city, events in zip(queried, fetched_results):
        if events is None or isinstance(events, Exception):
            failed.append(city)
        else:
            successful.append(city)
            for ev in events:
                total_fetched += 1
                ev_id = ev.get("event_id")
                if not ev_id: continue
                
                # Check if exists
                existing = await db["global_events"].find_one({"event_id": ev_id})
                if not existing:
                    new_added += 1
                    await db["global_events"].insert_one(ev)
                else:
                    # Update status in case local node reviewed it
                    await db["global_events"].update_one(
                        {"event_id": ev_id},
                        {"$set": {
                            "verification_status": ev.get("verification_status"),
                            "updated_at": ev.get("updated_at")
                        }}
                    )

    # Now run correlation engine over all stored global events
    cursor = db["global_events"].find({})
    all_events = await cursor.to_list(length=1000)
    for ev in all_events:
        if "_id" in ev: del ev["_id"]

    new_correlations = corr_engine.analyze_event_pool(all_events)
    correlations_identified = 0

    for corr in new_correlations:
        # Check if already present by related_event_ids
        pair_key = sorted(corr.related_event_ids)
        existing_corr = await db["correlations"].find_one({"related_event_ids": {"$all": pair_key}})
        if not existing_corr:
            correlations_identified += 1
            await db["correlations"].insert_one(corr.dict())

    end_time = datetime.now()
    sync_id = f"SYNC-{uuid.uuid4().hex[:8].upper()}"
    log = SyncAuditLog(
        sync_id=sync_id,
        initiated_at=start_time.isoformat(),
        completed_at=end_time.isoformat(),
        cities_queried=queried,
        cities_successful=successful,
        cities_failed=failed,
        total_events_synced=total_fetched,
        new_events_added=new_added,
        correlations_identified=correlations_identified,
        status="completed" if len(failed) == 0 else "partial_success",
        details={"duration_ms": round((end_time - start_time).total_seconds() * 1000, 1)}
    )
    await db["sync_history"].insert_one(log.dict())

    return {
        "sync_id": sync_id,
        "status": log.status,
        "successful_cities": successful,
        "failed_cities": failed,
        "new_events_added": new_added,
        "total_records_synchronized": total_fetched,
        "correlations_generated": correlations_identified,
        "duration_ms": log.details["duration_ms"]
    }

@app.get("/api/v1/sync/history")
async def get_sync_history(limit: int = 15):
    db = get_database()
    cursor = db["sync_history"].find({}).sort("initiated_at", -1).limit(limit)
    logs = await cursor.to_list(length=limit)
    for l in logs:
        if "_id" in l: del l["_id"]
    return logs

@app.get("/api/v1/events")
async def list_global_events(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    city: Optional[str] = None,
    priority: Optional[ReviewPriority] = None,
    verification_status: Optional[VerificationStatus] = None,
    category: Optional[EventCategory] = None,
    search: Optional[str] = None
):
    db = get_database()
    query = {}
    if city and city.lower() != "all":
        query["city"] = city.lower()
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
            {"matched_keywords": {"$regex": search, "$options": "i"}},
            {"event_id": {"$regex": search, "$options": "i"}}
        ]

    cursor = db["global_events"].find(query).sort("created_at", -1).skip(skip).limit(limit)
    events = await cursor.to_list(length=limit)
    total_count = await db["global_events"].count_documents(query)

    for e in events:
        if "_id" in e: del e["_id"]

    return {
        "total": total_count,
        "skip": skip,
        "limit": limit,
        "events": events
    }

@app.get("/api/v1/events/{event_id}")
async def get_single_event(event_id: str):
    db = get_database()
    ev = await db["global_events"].find_one({"event_id": event_id})
    if not ev:
        raise HTTPException(status_code=404, detail="Event not found in central registry.")
    if "_id" in ev: del ev["_id"]
    return ev

@app.get("/api/v1/correlations")
async def list_correlations(
    status_filter: Optional[CorrelationStatus] = None,
    city: Optional[str] = None
):
    db = get_database()
    query = {}
    if status_filter:
        query["review_status"] = status_filter
    if city and city.lower() != "all":
        query["participating_cities"] = city.lower()

    cursor = db["correlations"].find(query).sort("similarity_score", -1)
    corrs = await cursor.to_list(length=100)
    for c in corrs:
        if "_id" in c: del c["_id"]
    return corrs

@app.get("/api/v1/correlations/{correlation_id}")
async def get_single_correlation(correlation_id: str):
    db = get_database()
    c = await db["correlations"].find_one({"correlation_id": correlation_id})
    if not c:
        raise HTTPException(status_code=404, detail="Correlation record not found")
    if "_id" in c: del c["_id"]
    return c

class CorrelationReviewPayload(BaseModel):
    review_status: CorrelationStatus
    reviewer_notes: Optional[str] = None

@app.patch("/api/v1/correlations/{correlation_id}")
async def update_correlation_status(correlation_id: str, payload: CorrelationReviewPayload):
    db = get_database()
    now_iso = datetime.now().isoformat()
    res = await db["correlations"].update_one(
        {"correlation_id": correlation_id},
        {"$set": {
            "review_status": payload.review_status,
            "reviewer_notes": payload.reviewer_notes,
            "reviewed_at": now_iso
        }}
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Correlation not found")
    return {"status": "success", "correlation_id": correlation_id, "review_status": payload.review_status}

@app.get("/api/v1/dashboard/summary")
async def dashboard_summary():
    db = get_database()
    total_events = await db["global_events"].count_documents({})
    pending_review = await db["global_events"].count_documents({"verification_status": VerificationStatus.PENDING_REVIEW})
    high_priority = await db["global_events"].count_documents({"review_priority": ReviewPriority.HIGH})
    total_correlations = await db["correlations"].count_documents({})
    pending_correlations = await db["correlations"].count_documents({"review_status": CorrelationStatus.PENDING_REVIEW})

    # By city
    city_counts = {}
    for c in ["mumbai", "bengaluru", "kolkata", "chennai"]:
        city_counts[c] = await db["global_events"].count_documents({"city": c})

    # Servers online count
    servers = await city_client.check_all_cities()
    online_count = sum(1 for s in servers if s.get("is_online"))

    # Recent sync
    last_sync = await db["sync_history"].find_one({}, sort=[("completed_at", -1)])
    last_sync_time = last_sync.get("completed_at") if last_sync else None

    # Recent 5 activities
    recent_cursor = db["global_events"].find({}).sort("created_at", -1).limit(5)
    recent_events = await recent_cursor.to_list(length=5)
    for r in recent_events:
        if "_id" in r: del r["_id"]

    return {
        "total_reports": total_events,
        "reports_by_city": city_counts,
        "reports_awaiting_review": pending_review,
        "high_priority_reports": high_priority,
        "potential_correlations": total_correlations,
        "pending_correlations": pending_correlations,
        "servers_online": online_count,
        "servers_total": len(CITY_ENDPOINTS),
        "last_sync_timestamp": last_sync_time,
        "recent_activity": recent_events
    }

@app.get("/api/v1/analytics/cities")
async def analytics_cities():
    db = get_database()
    # Aggregation by category and city
    pipeline = [
        {"$group": {
            "_id": {"city": "$city", "category": "$predicted_category"},
            "count": {"$sum": 1}
        }}
    ]
    cursor = db["global_events"].aggregate(pipeline)
    raw = await cursor.to_list(length=100)
    
    # Priority breakdown
    prio_pipeline = [
        {"$group": {
            "_id": "$review_priority",
            "count": {"$sum": 1}
        }}
    ]
    prio_cursor = db["global_events"].aggregate(prio_pipeline)
    prio_raw = await prio_cursor.to_list(length=10)

    return {
        "category_distribution": raw,
        "priority_distribution": {p["_id"]: p["count"] for p in prio_raw if p["_id"]},
        "cities": ["mumbai", "bengaluru", "kolkata", "chennai"]
    }
