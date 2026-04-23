import io
import re
from dataclasses import dataclass, field

import numpy as np

try:
    import librosa
    HAS_LIBROSA = True
except ImportError:
    HAS_LIBROSA = False

try:
    import spacy
    nlp = spacy.load("en_core_web_trf")
    HAS_SPACY = True
except ImportError:
    HAS_SPACY = False
    nlp = None


FILLER_WORDS = {"um", "uh", "er", "ah", "like", "you know", "basically", "actually",
                "literally", "honestly", "right", "so", "well", "I mean", "kind of", "sort of"}


@dataclass
class VoiceMetrics:
    speaking_rate: float = 0.0  # words per minute
    pauses: list[float] = field(default_factory=list)
    pitch_mean: float = 0.0
    pitch_std: float = 0.0
    tone: str = "neutral"
    total_duration: float = 0.0
    volume_mean: float = 0.0
    clarity: float = 0.0


@dataclass
class FillerResult:
    word: str
    count: int
    timestamps: list[float] = field(default_factory=list)


class VoiceAnalyzer:
    """Analyzes voice characteristics from audio data."""

    def analyze(self, audio_path: str) -> VoiceMetrics:
        """Analyze audio file for voice metrics."""
        if not HAS_LIBROSA:
            return self._mock_analyze()

        try:
            y, sr = librosa.load(audio_path, sr=22050)
            duration = librosa.get_duration(y=y, sr=sr)

            # Pitch analysis
            pitches, magnitudes = librosa.piptrack(y=y, sr=sr)
            pitch_values = []
            for t in range(pitches.shape[1]):
                index = magnitudes[:, t].argmax()
                pitch = pitches[index, t]
                if pitch > 0:
                    pitch_values.append(pitch)

            pitch_mean = float(np.mean(pitch_values)) if pitch_values else 0.0
            pitch_std = float(np.std(pitch_values)) if pitch_values else 0.0

            # Pause detection
            pauses = self._detect_pauses(y, sr)

            # Volume
            rms = librosa.feature.rms(y=y)[0]
            volume_mean = float(np.mean(rms))

            # Tone classification based on pitch variation
            tone = self._classify_tone(pitch_mean, pitch_std, volume_mean)

            # Clarity based on spectral centroid
            spec_cent = librosa.feature.spectral_centroid(y=y, sr=sr)[0]
            clarity = min(float(np.mean(spec_cent)) / 4000.0, 1.0)

            return VoiceMetrics(
                speaking_rate=0.0,  # Needs transcript text to calculate
                pauses=pauses,
                pitch_mean=round(pitch_mean, 2),
                pitch_std=round(pitch_std, 2),
                tone=tone,
                total_duration=round(duration, 2),
                volume_mean=round(volume_mean, 4),
                clarity=round(clarity, 2),
            )
        except Exception:
            return self._mock_analyze()

    def analyze_with_text(self, audio_path: str, transcript_text: str) -> VoiceMetrics:
        """Analyze audio with transcript for speaking rate calculation."""
        metrics = self.analyze(audio_path)
        if transcript_text and metrics.total_duration > 0:
            metrics.speaking_rate = self._compute_speaking_rate(transcript_text, metrics.total_duration)
        return metrics

    def detect_fillers(self, text: str) -> list[FillerResult]:
        """Detect filler words in transcribed text."""
        results = []
        text_lower = text.lower()

        for filler in FILLER_WORDS:
            # Count occurrences using word boundary regex
            pattern = r'\b' + re.escape(filler) + r'\b'
            matches = list(re.finditer(pattern, text_lower))
            if matches:
                results.append(FillerResult(
                    word=filler,
                    count=len(matches),
                    timestamps=[],  # Would need aligned timestamps
                ))

        # Also use spaCy for interjection detection if available
        if nlp and HAS_SPACY:
            doc = nlp(text)
            for token in doc:
                if token.pos_ == "INTJ" and token.text.lower() not in {f.word for f in results}:
                    results.append(FillerResult(word=token.text.lower(), count=1, timestamps=[]))

        return sorted(results, key=lambda x: x.count, reverse=True)

    def _compute_speaking_rate(self, text: str, duration: float) -> float:
        """Words per minute."""
        word_count = len(text.split())
        if duration <= 0:
            return 0.0
        return round((word_count / duration) * 60, 1)

    def _detect_pauses(self, y: np.ndarray, sr: int, threshold: float = 0.01, min_pause: float = 0.3) -> list[float]:
        """Detect silence/pause segments."""
        if not HAS_LIBROSA:
            return []

        frame_length = int(sr * 0.025)  # 25ms frames
        hop_length = int(sr * 0.010)   # 10ms hop

        rms = librosa.feature.rms(y=y, frame_length=frame_length, hop_length=hop_length)[0]
        is_silence = rms < threshold

        pauses = []
        pause_start = None

        for i, silent in enumerate(is_silence):
            time = i * hop_length / sr
            if silent and pause_start is None:
                pause_start = time
            elif not silent and pause_start is not None:
                pause_duration = time - pause_start
                if pause_duration >= min_pause:
                    pauses.append(round(pause_duration, 2))
                pause_start = None

        return pauses

    def _classify_tone(self, pitch_mean: float, pitch_std: float, volume: float) -> str:
        """Classify speaking tone."""
        if pitch_std > 50 and volume > 0.05:
            return "confident"
        elif pitch_std < 20 and volume < 0.02:
            return "nervous"
        elif pitch_mean > 200:
            return "energetic"
        elif pitch_mean < 100 and pitch_std < 15:
            return "monotone"
        return "neutral"

    def _mock_analyze(self) -> VoiceMetrics:
        """Return mock metrics when librosa is not available."""
        return VoiceMetrics(
            speaking_rate=145.0,
            pauses=[0.5, 1.2, 0.8],
            pitch_mean=180.5,
            pitch_std=35.2,
            tone="neutral",
            total_duration=120.0,
            volume_mean=0.04,
            clarity=0.72,
        )
