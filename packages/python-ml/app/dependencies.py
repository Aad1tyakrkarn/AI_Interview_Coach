from app.services.model_manager import ModelManager

_model_manager: ModelManager | None = None


def get_model_manager() -> ModelManager:
    """Return a shared ModelManager instance."""
    global _model_manager
    if _model_manager is None:
        _model_manager = ModelManager()
    return _model_manager
