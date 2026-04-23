from pydantic import BaseModel, Field


class VoiceAnalyzeRequest(BaseModel):
    audio_url: str = Field(..., description="URL of the audio file to analyze")
    interview_id: str = Field(..., description="ID of the interview session")
    question_index: int = Field(..., ge=0, description="Index of the current question")


class FillerWord(BaseModel):
    word: str
    count: int
    timestamps: list[float] = Field(default_factory=list)


class VoiceAnalyzeResponse(BaseModel):
    speaking_rate: float = Field(..., description="Words per minute")
    pauses: list[float] = Field(default_factory=list, description="Pause durations in seconds")
    pitch_mean: float = Field(..., description="Mean pitch in Hz")
    pitch_std: float = Field(..., description="Pitch standard deviation")
    tone: str = Field(..., description="Detected tone: confident, nervous, neutral, etc.")
    filler_words: list[FillerWord] = Field(default_factory=list)
    total_duration: float = Field(..., description="Total audio duration in seconds")


class TimestampedSegment(BaseModel):
    text: str
    start: float
    end: float


class VoiceTranscribeRequest(BaseModel):
    audio_url: str = Field(..., description="URL of the audio file to transcribe")


class VoiceTranscribeResponse(BaseModel):
    text: str = Field(..., description="Full transcript text")
    segments: list[TimestampedSegment] = Field(default_factory=list)
    language: str | None = None
    confidence: float | None = Field(None, ge=0.0, le=1.0)
