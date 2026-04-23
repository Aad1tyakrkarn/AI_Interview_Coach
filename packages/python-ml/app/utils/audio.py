import io
import os
import tempfile

import numpy as np

def load_audio(path: str, sr: int = 22050) -> tuple[np.ndarray, int]:
    """Load audio file, returns (audio_data, sample_rate)."""
    try:
        import librosa
        y, sr_out = librosa.load(path, sr=sr)
        return y, sr_out
    except ImportError:
        return np.zeros(sr * 5), sr  # 5s silence fallback

def preprocess_audio(y: np.ndarray, sr: int) -> np.ndarray:
    """Normalize and trim silence from audio."""
    try:
        import librosa
        y_trimmed, _ = librosa.effects.trim(y, top_db=20)
        y_normalized = librosa.util.normalize(y_trimmed)
        return y_normalized
    except ImportError:
        return y

def extract_features(y: np.ndarray, sr: int) -> dict:
    """Extract audio features for ML analysis."""
    try:
        import librosa
        mfccs = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
        chroma = librosa.feature.chroma_stft(y=y, sr=sr)
        spec_cent = librosa.feature.spectral_centroid(y=y, sr=sr)
        return {
            "mfccs_mean": np.mean(mfccs, axis=1).tolist(),
            "chroma_mean": np.mean(chroma, axis=1).tolist(),
            "spectral_centroid_mean": float(np.mean(spec_cent)),
            "duration": float(len(y) / sr),
        }
    except ImportError:
        return {"mfccs_mean": [], "chroma_mean": [], "spectral_centroid_mean": 0.0, "duration": float(len(y) / sr)}

def audio_to_wav_bytes(y: np.ndarray, sr: int) -> bytes:
    """Convert numpy audio to WAV bytes."""
    try:
        import soundfile as sf
        buffer = io.BytesIO()
        sf.write(buffer, y, sr, format='WAV')
        return buffer.getvalue()
    except ImportError:
        return b''
