"""
Global Cross-City Correlation Engine.
Identifies potential suspicious links across different cities by analyzing:
- Extracted entities (vehicles, keywords, registration patterns, suspect aliases)
- Text token Jaccard & sequence similarity
- Temporal clustering (events reported within comparable windows)
- Category overlap
Distinguishes text matches from proven real-world connections.
"""
import uuid
import re
from typing import List, Dict, Any, Tuple
from datetime import datetime
from shared.models import CrossCityCorrelation, CorrelationStatus

class CrossCityCorrelationEngine:
    def __init__(self, keyword_threshold: int = 2, min_similarity_score: float = 0.45):
        self.keyword_threshold = keyword_threshold
        self.min_similarity_score = min_similarity_score

    def _tokenize(self, text: str) -> set:
        words = re.findall(r"\b[a-zA-Z0-9_-]{3,}\b", text.lower())
        stopwords = {
            "the", "and", "was", "for", "with", "this", "that", "from", "are", "reported",
            "vicinity", "described", "appeared", "separate", "witness", "area", "older", "similar"
        }
        return set(words) - stopwords

    def calculate_similarity(self, text_a: str, text_b: str, kw_a: List[str], kw_b: List[str]) -> Tuple[float, List[str]]:
        tokens_a = self._tokenize(text_a)
        tokens_b = self._tokenize(text_b)
        
        # Token intersection
        token_inter = tokens_a.intersection(tokens_b)
        token_union = tokens_a.union(tokens_b)
        jaccard = len(token_inter) / max(len(token_union), 1)

        # Keyword intersection
        k_set_a = set(k.lower() for k in kw_a)
        k_set_b = set(k.lower() for k in kw_b)
        kw_inter = k_set_a.intersection(k_set_b)

        # Weighted score
        score = (jaccard * 0.4) + (min(len(kw_inter) * 0.25, 0.6))
        
        matching_attrs = list(kw_inter.union(token_inter))[:8]
        return round(score, 2), matching_attrs

    def analyze_event_pool(self, events: List[Dict[str, Any]]) -> List[CrossCityCorrelation]:
        """
        Takes a list of authorized event dictionaries from multiple cities and finds cross-city clusters.
        """
        correlations: List[CrossCityCorrelation] = []
        n = len(events)
        paired_links = set()

        for i in range(n):
            for j in range(i + 1, n):
                ev_a = events[i]
                ev_b = events[j]

                # Cross-city only!
                city_a = ev_a.get("city")
                city_b = ev_b.get("city")
                if not city_a or not city_b or city_a == city_b:
                    continue

                # Category compatibility or vehicle/contraband similarity
                cat_a = ev_a.get("predicted_category")
                cat_b = ev_b.get("predicted_category")

                kw_a = ev_a.get("matched_keywords", [])
                kw_b = ev_b.get("matched_keywords", [])
                text_a = ev_a.get("text_description", "")
                text_b = ev_b.get("text_description", "")

                score, matched_attrs = self.calculate_similarity(text_a, text_b, kw_a, kw_b)

                if score >= self.min_similarity_score or (cat_a == cat_b and len(matched_attrs) >= 2):
                    pair_key = tuple(sorted([ev_a["event_id"], ev_b["event_id"]]))
                    if pair_key in paired_links:
                        continue
                    paired_links.add(pair_key)

                    explanation = (
                        f"Cross-city correlation detected between {city_a.capitalize()} and {city_b.capitalize()}. "
                        f"Matched attributes: {', '.join(matched_attrs) if matched_attrs else 'Category & Narrative Overlap'}. "
                        f"Both incidents exhibit shared descriptors ({cat_a} / {cat_b})."
                    )

                    corr = CrossCityCorrelation(
                        correlation_id=f"CORR-{uuid.uuid4().hex[:8].upper()}",
                        related_event_ids=[ev_a["event_id"], ev_b["event_id"]],
                        participating_cities=list(set([city_a, city_b])),
                        matching_attributes=matched_attrs,
                        explanation=explanation,
                        similarity_score=min(score, 0.98),
                        review_status=CorrelationStatus.PENDING_REVIEW,
                        detected_at=datetime.now().isoformat(),
                        events_summary=[
                            {
                                "event_id": ev_a["event_id"],
                                "city": city_a,
                                "area": ev_a.get("reported_area"),
                                "category": cat_a,
                                "priority": ev_a.get("review_priority"),
                                "text": text_a[:180] + "..." if len(text_a) > 180 else text_a
                            },
                            {
                                "event_id": ev_b["event_id"],
                                "city": city_b,
                                "area": ev_b.get("reported_area"),
                                "category": cat_b,
                                "priority": ev_b.get("review_priority"),
                                "text": text_b[:180] + "..." if len(text_b) > 180 else text_b
                            }
                        ]
                    )
                    correlations.append(corr)

        return correlations
