import base64

import numpy as np

try:
    import cv2
    HAS_CV2 = True
except ImportError:
    HAS_CV2 = False


def extract_frames(video_path: str, fps: int = 1) -> list[np.ndarray]:
    """Extract frames from a video file at the specified frame rate.

    Args:
        video_path: Path to the video file.
        fps: Frames per second to extract.

    Returns:
        List of frames as numpy arrays. Returns empty list if cv2 is unavailable.
    """
    if not HAS_CV2:
        return []

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise ValueError(f"Cannot open video file: {video_path}")

    video_fps = cap.get(cv2.CAP_PROP_FPS)
    if video_fps <= 0:
        video_fps = 30.0  # sensible default

    frame_interval = max(1, int(video_fps / fps))
    frames: list[np.ndarray] = []
    frame_idx = 0

    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            if frame_idx % frame_interval == 0:
                frames.append(frame)
            frame_idx += 1
    finally:
        cap.release()

    return frames


def preprocess_frame(
    frame: np.ndarray,
    target_size: tuple[int, int] = (224, 224),
) -> np.ndarray:
    """Preprocess a video frame for model input.

    Resizes to target dimensions and normalises pixel values to [0, 1].

    Args:
        frame: Raw frame as a numpy array (BGR uint8).
        target_size: Target dimensions (width, height).

    Returns:
        Preprocessed frame as float32 array with values in [0, 1].
        If cv2 is unavailable, returns a zero array of the target shape.
    """
    if not HAS_CV2:
        return np.zeros((*target_size, 3), dtype=np.float32)

    resized = cv2.resize(frame, target_size, interpolation=cv2.INTER_AREA)
    normalized = resized.astype(np.float32) / 255.0
    return normalized


def frames_to_base64(frames: list[np.ndarray]) -> list[str]:
    """Convert a list of numpy frames to base64-encoded PNG strings.

    Useful for converting extract_frames output into the format expected
    by CameraAnalyzer.analyze_frames.

    Args:
        frames: List of BGR uint8 numpy arrays.

    Returns:
        List of base64-encoded strings. Returns empty list if cv2 is unavailable.
    """
    if not HAS_CV2:
        return []

    result: list[str] = []
    for frame in frames:
        success, buffer = cv2.imencode(".png", frame)
        if success:
            result.append(base64.b64encode(buffer.tobytes()).decode("utf-8"))
    return result
