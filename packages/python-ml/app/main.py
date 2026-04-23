import time
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.dependencies import get_model_manager
from app.routers import camera, evaluation, explainability, health, interviewer, resume, tts, voice

_start_time: float = 0.0


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application startup and shutdown lifecycle."""
    global _start_time
    _start_time = time.time()

    # Load models on startup
    model_manager = get_model_manager()
    model_manager.load_model("whisper")
    model_manager.load_model("sentence_transformer")

    yield


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="ML microservice for the AI Interview Platform",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(resume.router)
app.include_router(voice.router)
app.include_router(camera.router)
app.include_router(evaluation.router)
app.include_router(interviewer.router)
app.include_router(tts.router)
app.include_router(explainability.router)


@app.get("/")
async def root():
    """Return basic service information."""
    return {
        "service": settings.app_name,
        "version": settings.app_version,
        "docs": "/docs",
    }
