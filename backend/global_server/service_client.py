"""
HTTP-based Inter-Service Communication Client for SANGAM Global Coordinator.
Connects with Mumbai (8001), Bengaluru (8002), Kolkata (8003), Chennai (8004)
with timeouts, health-checks, error recovery, and status tracking.
"""
import httpx
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime

logger = logging.getLogger("sangam.http_client")

CITY_ENDPOINTS = {
    "mumbai": {"url": "http://127.0.0.1:8001", "port": 8001, "name": "Mumbai"},
    "bengaluru": {"url": "http://127.0.0.1:8002", "port": 8002, "name": "Bengaluru"},
    "kolkata": {"url": "http://127.0.0.1:8003", "port": 8003, "name": "Kolkata"},
    "chennai": {"url": "http://127.0.0.1:8004", "port": 8004, "name": "Chennai"},
}

class CityServiceClient:
    def __init__(self, timeout_seconds: float = 3.0):
        self.timeout = timeout_seconds

    async def check_city_health(self, city_key: str) -> Dict[str, Any]:
        info = CITY_ENDPOINTS.get(city_key)
        if not info:
            return {"city": city_key, "is_online": False, "error": "Unknown city"}

        url = f"{info['url']}/api/v1/health"
        start_time = datetime.now()
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.get(url)
                elapsed_ms = (datetime.now() - start_time).total_seconds() * 1000
                if resp.status_code == 200:
                    data = resp.json()
                    model_stat = data.get("model_status", {})
                    return {
                        "city": city_key,
                        "display_name": info["name"],
                        "endpoint": info["url"],
                        "port": info["port"],
                        "is_online": True,
                        "model_loaded": model_stat.get("is_loaded", False),
                        "model_name": model_stat.get("model_name", "Mock NLP"),
                        "model_version": model_stat.get("model_version", "v1.0.0-mock"),
                        "response_time_ms": round(elapsed_ms, 1),
                        "last_error": None
                    }
                else:
                    return {
                        "city": city_key,
                        "display_name": info["name"],
                        "endpoint": info["url"],
                        "port": info["port"],
                        "is_online": False,
                        "last_error": f"HTTP {resp.status_code}",
                        "response_time_ms": round(elapsed_ms, 1)
                    }
        except Exception as e:
            return {
                "city": city_key,
                "display_name": info["name"],
                "endpoint": info["url"],
                "port": info["port"],
                "is_online": False,
                "last_error": str(e),
                "response_time_ms": None
            }

    async def fetch_city_events(self, city_key: str, limit: int = 100) -> Optional[List[Dict[str, Any]]]:
        info = CITY_ENDPOINTS.get(city_key)
        if not info:
            return None
        url = f"{info['url']}/api/v1/events?limit={limit}"
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.get(url)
                if resp.status_code == 200:
                    payload = resp.json()
                    return payload.get("events", [])
        except Exception as e:
            logger.warning(f"Failed fetching events from {city_key}: {e}")
            return None

    async def forward_event_to_city(self, city_key: str, event_data: dict) -> Optional[Dict[str, Any]]:
        info = CITY_ENDPOINTS.get(city_key)
        if not info:
            return None
        url = f"{info['url']}/api/v1/events"
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.post(url, json=event_data)
                if resp.status_code in [200, 201]:
                    return resp.json()
                else:
                    raise Exception(f"HTTP {resp.status_code}: {resp.text}")
        except Exception as e:
            logger.error(f"Error submitting event to {city_key}: {e}")
            raise e

    async def check_all_cities(self) -> List[Dict[str, Any]]:
        import asyncio
        tasks = [self.check_city_health(city_key) for city_key in CITY_ENDPOINTS.keys()]
        results = await asyncio.gather(*tasks)
        return list(results)
