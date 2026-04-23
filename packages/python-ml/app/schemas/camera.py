from pydantic import BaseModel, Field


# --- Analyze endpoint ---

class CameraAnalyzeRequest(BaseModel):
    frames: list[str] = Field(..., description="List of base64-encoded image frames")
    interview_id: str | None = Field(None, description="ID of the interview session")
    question_index: int | None = Field(None, ge=0, description="Index of the current question")


class ExpressionMetrics(BaseModel):
    dominant: str = Field(..., description="Dominant expression: neutral, happy, focused, etc.")
    confidence: float = Field(..., ge=0.0, le=1.0)
    distribution: dict[str, float] = Field(default_factory=dict)


class CameraAnalyzeResponse(BaseModel):
    eye_contact_percentage: float = Field(..., ge=0.0, le=100.0, description="Eye contact percentage")
    avg_posture_score: float = Field(..., ge=0.0, le=1.0, description="Average posture score")
    dominant_expression: str = Field(..., description="Dominant facial expression")
    avg_tension_score: float = Field(..., ge=0.0, le=1.0, description="Average tension level")
    lighting_quality: str = Field(..., description="Lighting quality: good, dim, bright, uneven")
    background_quality: str = Field(..., description="Background quality: clean, acceptable, busy")
    blink_rate: float = Field(..., ge=0.0, description="Blinks per minute")
    face_detected: bool = Field(..., description="Whether a face was detected in frames")
    frames_analyzed: int = Field(..., ge=0, description="Number of frames analyzed")


# --- Detect face endpoint ---

class DetectFaceRequest(BaseModel):
    frame: str = Field(..., description="Base64-encoded image frame")


class DetectFaceResponse(BaseModel):
    face_detected: bool = Field(..., description="Whether a face was detected")


# --- Lighting endpoint ---

class LightingRequest(BaseModel):
    frame: str = Field(..., description="Base64-encoded image frame")


class LightingResponse(BaseModel):
    lighting_quality: str = Field(..., description="Lighting quality: good, dim, bright, uneven, unknown")


# --- Quality endpoint ---

class QualityRequest(BaseModel):
    frame: str = Field(..., description="Base64-encoded image frame")


class QualityResponse(BaseModel):
    blur_score: float = Field(..., description="Laplacian variance blur score (higher = sharper)")
    brightness: float = Field(..., description="Mean brightness 0-255")
    face_detected: bool = Field(..., description="Whether a face was detected")
    quality: str = Field(..., description="Overall quality: good, blurry, too_dark, too_bright, no_face, error")


# --- Background endpoint ---

class BackgroundRequest(BaseModel):
    frame: str = Field(..., description="Base64-encoded image frame")


class BackgroundResponse(BaseModel):
    background_quality: str = Field(..., description="Background quality: clean, acceptable, busy, unknown")
