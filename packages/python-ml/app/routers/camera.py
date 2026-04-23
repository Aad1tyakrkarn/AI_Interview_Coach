from fastapi import APIRouter, HTTPException

from app.schemas.camera import (
    CameraAnalyzeRequest,
    CameraAnalyzeResponse,
    DetectFaceRequest,
    DetectFaceResponse,
    LightingRequest,
    LightingResponse,
    QualityRequest,
    QualityResponse,
    BackgroundRequest,
    BackgroundResponse,
)
from app.services.camera_analyzer import CameraAnalyzer

router = APIRouter(prefix="/ml/camera", tags=["camera"])

_analyzer = CameraAnalyzer()


@router.post("/analyze", response_model=CameraAnalyzeResponse)
async def analyze_camera(request: CameraAnalyzeRequest):
    """Analyze video frames for body language and facial expressions."""
    if not request.frames:
        raise HTTPException(status_code=400, detail="No frames provided")

    try:
        metrics = _analyzer.analyze_frames(request.frames)
        return CameraAnalyzeResponse(
            eye_contact_percentage=metrics.eye_contact_percentage,
            avg_posture_score=metrics.avg_posture_score,
            dominant_expression=metrics.dominant_expression,
            avg_tension_score=metrics.avg_tension_score,
            lighting_quality=metrics.lighting_quality,
            background_quality=metrics.background_quality,
            blink_rate=metrics.blink_rate,
            face_detected=metrics.face_detected,
            frames_analyzed=metrics.frames_analyzed,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@router.post("/detect-face", response_model=DetectFaceResponse)
async def detect_face(request: DetectFaceRequest):
    """Detect whether a face is present in a single frame."""
    try:
        detected = _analyzer.detect_face(request.frame)
        return DetectFaceResponse(face_detected=detected)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Face detection failed: {str(e)}")


@router.post("/lighting", response_model=LightingResponse)
async def assess_lighting(request: LightingRequest):
    """Assess lighting quality of a single frame."""
    try:
        quality = _analyzer.assess_lighting(request.frame)
        return LightingResponse(lighting_quality=quality)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lighting assessment failed: {str(e)}")


@router.post("/quality", response_model=QualityResponse)
async def check_quality(request: QualityRequest):
    """Check frame quality including blur, brightness, and face presence."""
    try:
        result = _analyzer.check_frame_quality(request.frame)
        return QualityResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Quality check failed: {str(e)}")


@router.post("/background", response_model=BackgroundResponse)
async def assess_background(request: BackgroundRequest):
    """Assess background quality of a single frame."""
    try:
        quality = _analyzer.assess_background(request.frame)
        return BackgroundResponse(background_quality=quality)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Background assessment failed: {str(e)}")
