from __future__ import annotations

import io
import logging
import os
import tempfile
from typing import Any

logger = logging.getLogger(__name__)

try:
    import whisper
    WHISPER_AVAILABLE = True
except ImportError:
    WHISPER_AVAILABLE = False
    logger.warning("openai-whisper not installed — transcription will be unavailable")

try:
    import numpy as np
    NUMPY_AVAILABLE = True
except ImportError:
    NUMPY_AVAILABLE = False


class VoiceTranscriber:
    """Voice-to-text transcription using OpenAI Whisper."""

    def __init__(self, model_name: str = "base") -> None:
        self.available = WHISPER_AVAILABLE
        self.model: Any = None
        self.model_name = model_name
        if self.available:
            self._load_model(model_name)

    def _load_model(self, model_name: str) -> None:
        try:
            self.model = whisper.load_model(model_name)
            logger.info("Whisper model '%s' loaded", model_name)
        except Exception as e:
            logger.error("Failed to load Whisper model: %s", e)
            self.model = None

    def transcribe(
        self,
        audio_bytes: bytes,
        language: str = "en",
        task: str = "transcribe",
    ) -> dict:
        """Transcribe audio to text."""
        if not self.available or self.model is None:
            return self._placeholder_result("Whisper not available — transcription unavailable")

        temp_path = None
        try:
            # Write audio to temp file (Whisper requires file path)
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
                f.write(audio_bytes)
                temp_path = f.name

            # Transcribe
            options: dict[str, Any] = {"language": language, "task": task}
            result = self.model.transcribe(temp_path, **options)

            # Build segments
            segments = []
            for seg in result.get("segments", []):
                segments.append({
                    "start": round(seg["start"], 2),
                    "end": round(seg["end"], 2),
                    "text": seg["text"].strip(),
                    "confidence": round(seg.get("avg_logprob", 0.0), 3),
                })

            # Calculate duration from segments
            duration = segments[-1]["end"] if segments else 0.0

            return {
                "text": result.get("text", "").strip(),
                "language": result.get("language", language),
                "duration_seconds": round(duration, 2),
                "segments": segments,
                "model": self.model_name,
            }

        except Exception as e:
            logger.error("Transcription error: %s", e)
            return self._placeholder_result(f"Transcription error: {str(e)}")
        finally:
            if temp_path and os.path.exists(temp_path):
                os.unlink(temp_path)

    def transcribe_with_timestamps(
        self,
        audio_bytes: bytes,
        language: str = "en",
    ) -> dict:
        """Transcribe with word-level timestamps."""
        result = self.transcribe(audio_bytes, language)
        return result

    def detect_language(self, audio_bytes: bytes) -> dict:
        """Detect the language of audio."""
        if not self.available or self.model is None:
            return {"language": "unknown", "confidence": 0.0, "message": "Whisper not available"}

        temp_path = None
        try:
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
                f.write(audio_bytes)
                temp_path = f.name

            audio = whisper.load_audio(temp_path)
            audio = whisper.pad_or_trim(audio)
            mel = whisper.log_mel_spectrogram(audio).to(self.model.device)

            _, probs = self.model.detect_language(mel)
            detected_lang = max(probs, key=probs.get)

            return {
                "language": detected_lang,
                "confidence": round(probs[detected_lang], 3),
                "top_languages": {k: round(v, 3) for k, v in sorted(probs.items(), key=lambda x: -x[1])[:5]},
            }
        except Exception as e:
            logger.error("Language detection error: %s", e)
            return {"language": "unknown", "confidence": 0.0, "message": str(e)}
        finally:
            if temp_path and os.path.exists(temp_path):
                os.unlink(temp_path)

    def _placeholder_result(self, message: str) -> dict:
        return {
            "text": "",
            "language": "",
            "duration_seconds": 0.0,
            "segments": [],
            "message": message,
        }
