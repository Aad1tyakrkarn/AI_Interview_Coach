from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
import os

router = APIRouter(prefix="/ml/tts", tags=["tts"])
_engine = None


def get_engine():
    global _engine
    if _engine is None:
        from app.services.tts_engine import TTSEngine
        _engine = TTSEngine()
    return _engine


@router.post("/synthesize")
async def synthesize(request: dict):
    """Generate speech from text. Returns audio file URL and duration."""
    text = request.get("text", "")
    voice = request.get("voice", "sarah")
    rate = request.get("rate", "-5%")

    if not text:
        raise HTTPException(400, "Text is required")

    engine = get_engine()
    file_path, duration = await engine.synthesize_async(text, voice, rate)
    filename = os.path.basename(file_path)

    return {
        "audio_url": f"/ml/tts/audio/{filename}",
        "duration": duration,
        "voice": voice,
        "filename": filename
    }


@router.get("/audio/{filename}")
async def get_audio(filename: str):
    """Serve generated audio file."""
    engine = get_engine()
    file_path = os.path.join(engine._output_dir, filename)
    if not os.path.exists(file_path):
        raise HTTPException(404, "Audio file not found")
    return FileResponse(file_path, media_type="audio/mpeg", filename=filename)


@router.get("/voices")
async def list_voices():
    """List available voice options."""
    engine = get_engine()
    return {"voices": engine.list_voices()}
