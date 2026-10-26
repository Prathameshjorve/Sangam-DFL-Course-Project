"""
Mock Text Model Adapter for SANGAM City Nodes.
Simulates text processing, entity extraction, category prediction, and confidence scoring
without hardcoding single outcomes. Inspects keywords dynamically.
"""
import re
import uuid
from datetime import datetime
from typing import Dict, Any, List
from shared.model_adapter_base import BaseModelAdapter
from shared.models import ModelPredictionResult, EventCategory, ReviewPriority

KEYWORD_CATEGORY_MAP = {
    r"\b(vehicle|car|hatchback|sedan|suv|van|truck|plate|registration|number plate|tinted|bumper)\b": (
        EventCategory.SUSPICIOUS_VEHICLE, ["vehicle", "registration plate", "hatchback", "tinted windows"]
    ),
    r"\b(package|contraband|crate|smuggle|consignment|narcotic|arms|weapon|cache|shipment|docks)\b": (
        EventCategory.CONTRABAND_TRANSIT, ["contraband", "unmarked crate", "transit shipment"]
    ),
    r"\b(loiter|camera|surveillance|recording|drone|perimeter|recon|scouting|photographing)\b": (
        EventCategory.UNIDENTIFIED_SURVEILLANCE, ["surveillance", "perimeter recon", "camera recording"]
    ),
    r"\b(badge|id|credentials|forged|fake|pass|uniform|impersonat|access card)\b": (
        EventCategory.FORGED_CREDENTIALS, ["forged badge", "unauthorized pass", "credential spoofing"]
    ),
    r"\b(crowd|assembly|clandestine|meeting|conspiracy|gathering|warehouse meeting)\b": (
        EventCategory.UNUSUAL_GATHERING, ["unusual gathering", "covert meeting"]
    ),
    r"\b(trespass|fence|breach|intruder|gate|ladder|climb|secure zone)\b": (
        EventCategory.FACILITY_TRESPASS, ["perimeter breach", "facility intrusion"]
    ),
    r"\b(radio|encrypted|frequency|jammer|signal|beacon|transmission|intercept)\b": (
        EventCategory.ANOMALOUS_COMMUNICATION, ["frequency spike", "encrypted transmission", "rf anomaly"]
    )
}

ENTITY_PATTERNS = {
    "vehicles": r"\b(white|black|silver|red|blue|older|grey|gray)?\s*(hatchback|sedan|suv|motorcycle|van|truck|car)\b",
    "identifiers": r"\b([A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}|plate\s*#?[0-9A-Za-z]+|missing\s*(?:registration|plate|number))\b",
    "locations": r"\b(Sector\s*[0-9A-Z]+|Gate\s*[0-9]+|Terminal\s*[0-9]+|Warehouse\s*[0-9A-Z]+|Area\s*[A-Z0-9]+|Junction|Flyover|Port|Dock)\b"
}

class MockCityTextModelAdapter(BaseModelAdapter):
    def __init__(self, city_name: str, model_version: str = "v1.2.0-neural-mock"):
        super().__init__(city_name=city_name, model_name=f"{city_name.capitalize()} NLP Tactical Classifier", model_version=model_version)
        self.total_inferences = 0
        self.last_inference_time = None
        self.last_predicted_category = None
        self.load_model()

    def load_model(self) -> bool:
        # Simulate loading transformer weights into memory
        self.is_loaded = True
        return True

    def predict(self, text: str, area: str = "", metadata: Dict[str, Any] = None) -> ModelPredictionResult:
        lower_text = text.lower()
        matched_category = EventCategory.OTHER
        matched_keywords: List[str] = []

        category_scores = {}
        for pattern, (cat, sample_kw) in KEYWORD_CATEGORY_MAP.items():
            found = re.findall(pattern, lower_text)
            if found:
                category_scores[cat] = category_scores.get(cat, 0) + len(found)
                matched_keywords.extend(list(set(found)))

        if category_scores:
            # Select category with highest match count
            matched_category = max(category_scores.items(), key=lambda x: x[1])[0]

        # Extract entities
        extracted_entities = {}
        for entity_key, pat in ENTITY_PATTERNS.items():
            matches = re.findall(pat, text, re.IGNORECASE)
            if matches:
                # flatten if tuple
                flat = []
                for m in matches:
                    if isinstance(m, tuple):
                        val = " ".join([x for x in m if x]).strip()
                        if val: flat.append(val)
                    elif m:
                        flat.append(m.strip())
                if flat:
                    extracted_entities[entity_key] = list(set(flat))

        # Assign confidence & priority based on keywords & match depth
        keyword_count = len(matched_keywords)
        if keyword_count >= 3:
            confidence = 0.88 + min(0.09, keyword_count * 0.02)
            priority = ReviewPriority.HIGH
        elif keyword_count >= 1:
            confidence = 0.72 + (keyword_count * 0.05)
            priority = ReviewPriority.MEDIUM
        else:
            confidence = 0.45
            priority = ReviewPriority.LOW
            matched_keywords = ["unclassified narrative"]

        now = datetime.now()
        event_id = f"EVT-{self.city_name[:3].upper()}-{now.strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"

        self.total_inferences += 1
        self.last_inference_time = now.isoformat()
        self.last_predicted_category = matched_category.value

        return ModelPredictionResult(
            event_id=event_id,
            city=self.city_name.lower(),
            original_report_text=text,
            predicted_category=matched_category,
            review_priority=priority,
            model_confidence=round(confidence, 2),
            matched_keywords=list(set(matched_keywords)),
            extracted_entities=extracted_entities,
            event_date=now.strftime("%Y-%m-%d"),
            event_time=now.strftime("%H:%M:%S"),
            reported_area=area or f"{self.city_name.capitalize()} Central Grid",
            model_name=self.model_name,
            model_version=self.model_version,
            is_mock=True,
            prediction_timestamp=now.isoformat()
        )

    def get_model_status(self) -> Dict[str, Any]:
        return {
            "city": self.city_name,
            "model_name": self.model_name,
            "model_version": self.model_version,
            "is_loaded": self.is_loaded,
            "is_mock": True,
            "architecture": "Tactical Multi-Head Keyword-Attention & Entity Extractor (Simulated NLP Engine)",
            "status": "ONLINE & READY",
            "device": "CPU / Neural Engine",
            "total_inferences_processed": self.total_inferences,
            "last_inference_time": self.last_inference_time,
            "last_predicted_category": self.last_predicted_category,
            "supported_categories": [cat.value for cat in EventCategory],
            "adapter_type": "MockCityTextModelAdapter (Active Edge Inference Engine)"
        }
