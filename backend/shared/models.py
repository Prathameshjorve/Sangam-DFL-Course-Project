"""
Common data models, schemas, and enums for SANGAM Distributed System.
"""
from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime
import uuid

class CityEnum(str, Enum):
    MUMBAI = "mumbai"
    BENGALURU = "bengaluru"
    KOLKATA = "kolkata"
    CHENNAI = "chennai"

class ReviewPriority(str, Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"

class VerificationStatus(str, Enum):
    PENDING_REVIEW = "Pending Review"
    UNDER_REVIEW = "Under Review"
    VERIFIED = "Verified"
    DISMISSED = "Dismissed"

class EventCategory(str, Enum):
    SUSPICIOUS_VEHICLE = "Suspicious Vehicle"
    CONTRABAND_TRANSIT = "Contraband Transit"
    UNIDENTIFIED_SURVEILLANCE = "Unidentified Surveillance"
    FORGED_CREDENTIALS = "Forged Credentials"
    UNUSUAL_GATHERING = "Unusual Gathering"
    FACILITY_TRESPASS = "Facility Trespass"
    ANOMALOUS_COMMUNICATION = "Anomalous Communication"
    OTHER = "Other"

class UserRole(str, Enum):
    ADMIN = "Administrator"
    ANALYST = "Analyst"
    REVIEWER = "Reviewer"
    MUMBAI_OPERATOR = "Mumbai Operator"
    BENGALURU_OPERATOR = "Bengaluru Operator"
    KOLKATA_OPERATOR = "Kolkata Operator"
    CHENNAI_OPERATOR = "Chennai Operator"

class CorrelationStatus(str, Enum):
    PENDING_REVIEW = "Pending Review"
    CONFIRMED = "Confirmed"
    REJECTED = "Rejected"

class EventCreateRequest(BaseModel):
    reported_area: str = Field(..., min_length=2, max_length=150)
    text_description: str = Field(..., min_length=10, max_length=5000)
    source_category: Optional[str] = "Field Report"
    report_date: Optional[str] = None
    report_time: Optional[str] = None
    uploaded_by: Optional[str] = None

class ModelPredictionResult(BaseModel):
    event_id: str
    city: str
    original_report_text: str
    predicted_category: EventCategory
    review_priority: ReviewPriority
    model_confidence: float = Field(..., ge=0.0, le=1.0)
    matched_keywords: List[str] = []
    extracted_entities: Dict[str, List[str]] = {}
    event_date: str
    event_time: str
    reported_area: str
    model_name: str
    model_version: str
    is_mock: bool = True
    prediction_timestamp: str

class EventRecord(BaseModel):
    event_id: str
    city: str
    reported_area: str
    text_description: str
    source_category: str
    predicted_category: EventCategory
    review_priority: ReviewPriority
    model_confidence: float
    matched_keywords: List[str] = []
    extracted_entities: Dict[str, List[str]] = {}
    verification_status: VerificationStatus = VerificationStatus.PENDING_REVIEW
    report_date: str
    report_time: str
    model_name: str
    model_version: str
    is_mock: bool = True
    created_at: str
    updated_at: str

class CityServerStatus(BaseModel):
    city: str
    display_name: str
    endpoint: str
    port: int
    is_online: bool = False
    last_sync_timestamp: Optional[str] = None
    total_events: int = 0
    pending_review_count: int = 0
    model_loaded: bool = False
    model_name: str = "Mock Model"
    model_version: str = "v1.0.0-mock"
    last_error: Optional[str] = None
    response_time_ms: Optional[float] = None

class CrossCityCorrelation(BaseModel):
    correlation_id: str
    related_event_ids: List[str]
    participating_cities: List[str]
    matching_attributes: List[str]
    explanation: str
    similarity_score: float
    review_status: CorrelationStatus = CorrelationStatus.PENDING_REVIEW
    detected_at: str
    events_summary: List[Dict[str, Any]] = []
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[str] = None
    reviewer_notes: Optional[str] = None

class SyncAuditLog(BaseModel):
    sync_id: str
    initiated_at: str
    completed_at: str
    cities_queried: List[str]
    cities_successful: List[str]
    cities_failed: List[str]
    total_events_synced: int
    new_events_added: int
    correlations_identified: int
    status: str
    details: Dict[str, Any] = {}

class TokenData(BaseModel):
    username: str
    role: UserRole

class UserLogin(BaseModel):
    username: str
    password: str
