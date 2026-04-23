import time

from fastapi import APIRouter

from app.dependencies import get_model_manager

router = APIRouter(prefix="/ml", tags=["health"])

_start_time = time.time()


@router.get("/health")
async def health_check():
    """Return service health status."""
    manager = get_model_manager()
    loaded_models = manager.list_models()

    gpu_available = False
    try:
        import torch
        gpu_available = torch.cuda.is_available()
    except ImportError:
        pass

    return {
        "status": "healthy",
        "uptime_seconds": round(time.time() - _start_time, 1),
        "models_loaded": loaded_models,
        "gpu_available": gpu_available,
    }
