from pydantic import BaseModel, Field
from typing import Optional


class TTSSynthesizeRequest(BaseModel):
    text: str = Field(..., description="Text to synthesize into speech")
    voice: str = Field(default="sarah", description="Voice profile to use (sarah, sarah-uk, sarah-au, sarah-in)")
    rate: str = Field(default="-5%", description="Speech rate adjustment (e.g. '-5%', '+10%')")
    pitch: str = Field(default="+0Hz", description="Pitch adjustment (e.g. '+0Hz', '-2Hz')")


class TTSSynthesizeResponse(BaseModel):
    audio_url: str = Field(..., description="URL path to the generated audio file")
    duration: float = Field(..., ge=0.0, description="Audio duration in seconds")
    voice: str = Field(..., description="Voice profile used")
    filename: str = Field(..., description="Audio filename")


class TTSVoice(BaseModel):
    id: str
    name: str
    locale: str
    description: str


class TTSVoicesResponse(BaseModel):
    voices: list[TTSVoice]
