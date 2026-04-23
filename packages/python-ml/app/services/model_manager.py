from typing import Any

from app.config import settings


class ModelManager:
    """Service for loading, caching, and managing ML models."""

    def __init__(self) -> None:
        self._models: dict[str, Any] = {}

    def load_model(self, name: str) -> Any:
        """Load a model by name and cache it."""
        if name in self._models:
            return self._models[name]

        model = None
        try:
            if name == "whisper":
                import whisper
                model = whisper.load_model(settings.whisper_model)
            elif name == "sentence_transformer":
                from sentence_transformers import SentenceTransformer
                model = SentenceTransformer("all-MiniLM-L6-v2")
            elif name == "spacy":
                import spacy
                model = spacy.load("en_core_web_trf")
            else:
                # Generic placeholder for unknown models
                model = {"name": name, "status": "mock"}
        except (ImportError, OSError):
            model = {"name": name, "status": "unavailable"}

        self._models[name] = model
        return model

    def get_model(self, name: str) -> Any:
        """Retrieve a previously loaded model."""
        if name not in self._models:
            raise KeyError(f"Model '{name}' has not been loaded")
        return self._models[name]

    def list_models(self) -> list[str]:
        """List names of all currently loaded models."""
        return list(self._models.keys())

    def unload_model(self, name: str) -> None:
        """Unload a model and free its resources."""
        if name in self._models:
            del self._models[name]
