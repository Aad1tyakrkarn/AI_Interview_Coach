import asyncio
import os
import tempfile
import uuid
from concurrent.futures import ThreadPoolExecutor

import edge_tts

_executor = ThreadPoolExecutor(max_workers=4)


class TTSEngine:
    """Neural TTS using Microsoft Edge voices via the edge_tts Python API."""

    VOICES = {
        'sarah': 'en-US-AriaNeural',
        'sarah-uk': 'en-GB-SoniaNeural',
        'sarah-au': 'en-AU-NatashaNeural',
        'sarah-in': 'en-IN-NeerjaExpressiveNeural',
    }

    def __init__(self):
        self._output_dir = os.path.join(tempfile.gettempdir(), "tts_output")
        os.makedirs(self._output_dir, exist_ok=True)

    def _synthesize_sync(self, text: str, voice: str, rate: str, pitch: str) -> tuple[str, float]:
        """Run edge_tts directly in a new event loop (called from thread pool).

        This avoids spawning a subprocess for each TTS request, which eliminates
        the ~1-2s process startup overhead.
        """
        voice_name = self.VOICES.get(voice, self.VOICES['sarah-in'])
        output_path = os.path.join(self._output_dir, f"{uuid.uuid4()}.mp3")

        # Run edge_tts async API in a dedicated event loop for this thread
        loop = asyncio.new_event_loop()
        try:
            communicate = edge_tts.Communicate(
                text,
                voice=voice_name,
                rate=rate,
                pitch=pitch,
            )
            loop.run_until_complete(communicate.save(output_path))
        finally:
            loop.close()

        if not os.path.exists(output_path):
            raise RuntimeError("edge_tts failed to produce output file")

        # Estimate duration from file size and word count
        file_size = os.path.getsize(output_path)
        # MP3 at ~48kbps
        duration_from_size = file_size / (48 * 1024 / 8)
        word_count = len(text.split())
        duration_from_words = word_count * 0.38
        final_duration = max(duration_from_size, duration_from_words)

        return output_path, round(final_duration, 2)

    async def synthesize_async(self, text: str, voice: str = 'sarah-in', rate: str = '-5%', pitch: str = '+0Hz') -> tuple[str, float]:
        """Generate speech audio. Runs edge_tts in thread pool to avoid blocking uvicorn's event loop."""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            _executor,
            self._synthesize_sync,
            text, voice, rate, pitch
        )

    def list_voices(self) -> list[dict]:
        return [
            {"id": "sarah", "name": "Sarah (US)", "locale": "en-US", "description": "Warm, professional American voice"},
            {"id": "sarah-uk", "name": "Sarah (UK)", "locale": "en-GB", "description": "British professional voice"},
            {"id": "sarah-au", "name": "Sarah (AU)", "locale": "en-AU", "description": "Australian professional voice"},
            {"id": "sarah-in", "name": "Sarah (IN)", "locale": "en-IN", "description": "Indian expressive voice"},
        ]
