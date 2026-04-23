import os
import tempfile
from fastapi import APIRouter, HTTPException
import httpx

from app.schemas.voice import (
    VoiceAnalyzeRequest, VoiceAnalyzeResponse,
    VoiceTranscribeRequest, VoiceTranscribeResponse, FillerWord,
)
from app.services.voice_analyzer import VoiceAnalyzer

router = APIRouter(prefix="/ml/voice", tags=["voice"])
analyzer = VoiceAnalyzer()


async def _download_audio(url: str) -> str:
    """Download audio from URL to temp file."""
    async with httpx.AsyncClient() as client:
        response = await client.get(url)
        response.raise_for_status()
    suffix = ".wav"
    if ".mp3" in url:
        suffix = ".mp3"
    elif ".webm" in url:
        suffix = ".webm"
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
    tmp.write(response.content)
    tmp.close()
    return tmp.name


@router.post("/analyze", response_model=VoiceAnalyzeResponse)
async def analyze_voice(request: VoiceAnalyzeRequest):
    """Analyze voice metrics from an audio recording."""
    try:
        tmp_path = await _download_audio(request.audio_url)
        try:
            metrics = analyzer.analyze(tmp_path)
            filler_results = []  # Need transcript for filler detection
            return VoiceAnalyzeResponse(
                speaking_rate=metrics.speaking_rate,
                pauses=metrics.pauses,
                pitch_mean=metrics.pitch_mean,
                pitch_std=metrics.pitch_std,
                tone=metrics.tone,
                filler_words=[],
                total_duration=metrics.total_duration,
            )
        finally:
            os.unlink(tmp_path)
    except httpx.HTTPError:
        raise HTTPException(status_code=400, detail="Failed to download audio")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@router.post("/analyze-with-text")
async def analyze_voice_with_text(request: VoiceAnalyzeRequest, transcript: str = ""):
    """Analyze voice with transcript for complete metrics including fillers."""
    try:
        tmp_path = await _download_audio(request.audio_url)
        try:
            metrics = analyzer.analyze_with_text(tmp_path, transcript)
            fillers = analyzer.detect_fillers(transcript) if transcript else []
            return VoiceAnalyzeResponse(
                speaking_rate=metrics.speaking_rate,
                pauses=metrics.pauses,
                pitch_mean=metrics.pitch_mean,
                pitch_std=metrics.pitch_std,
                tone=metrics.tone,
                filler_words=[FillerWord(word=f.word, count=f.count, timestamps=f.timestamps) for f in fillers],
                total_duration=metrics.total_duration,
            )
        finally:
            os.unlink(tmp_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@router.post("/detect-fillers")
async def detect_fillers(text: str):
    """Detect filler words in text."""
    fillers = analyzer.detect_fillers(text)
    return {
        "fillers": [{"word": f.word, "count": f.count, "timestamps": f.timestamps} for f in fillers],
        "total_filler_count": sum(f.count for f in fillers),
    }


@router.post("/transcribe", response_model=VoiceTranscribeResponse)
async def transcribe_audio(request: VoiceTranscribeRequest):
    """Transcribe audio to text using Whisper."""
    try:
        tmp_path = await _download_audio(request.audio_url)
        try:
            # Try using whisper if available
            try:
                import whisper
                model = whisper.load_model("base")
                result = model.transcribe(tmp_path)
                segments = [
                    {"text": seg["text"].strip(), "start": seg["start"], "end": seg["end"]}
                    for seg in result.get("segments", [])
                ]
                return VoiceTranscribeResponse(
                    text=result["text"].strip(),
                    segments=segments,
                    language=result.get("language"),
                    confidence=None,
                )
            except ImportError:
                # Whisper not installed - return mock
                return VoiceTranscribeResponse(
                    text="[Whisper not installed - mock transcription]",
                    segments=[],
                    language="en",
                    confidence=0.0,
                )
        finally:
            os.unlink(tmp_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")
