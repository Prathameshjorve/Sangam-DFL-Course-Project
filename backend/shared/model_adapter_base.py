"""
Abstract Base Class for Text Model Adapters in SANGAM.
Ensures mock models and future real machine learning models share identical contracts.
"""
from abc import ABC, abstractmethod
from typing import Dict, Any, List
from shared.models import ModelPredictionResult, EventCategory, ReviewPriority

class BaseModelAdapter(ABC):
    def __init__(self, city_name: str, model_name: str, model_version: str):
        self.city_name = city_name
        self.model_name = model_name
        self.model_version = model_version
        self.is_loaded = False

    @abstractmethod
    def load_model(self) -> bool:
        """Loads model weights or serialized artifacts into memory."""
        pass

    @abstractmethod
    def predict(self, text: str, area: str = "", metadata: Dict[str, Any] = None) -> ModelPredictionResult:
        """Performs text inference and returns standardized prediction results."""
        pass

    @abstractmethod
    def get_model_status(self) -> Dict[str, Any]:
        """Returns model health, readiness, and runtime metadata."""
        pass
