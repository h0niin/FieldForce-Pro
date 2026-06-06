"""Tests for voice transcription API endpoints and models."""
import io


def test_transcribe_unauthorized(client):
    response = client.post("/api/voice/transcribe")
    assert response.status_code in (401, 403, 422)


def test_transcribe_success(client, auth_headers):
    """Transcribe with fake audio — will return placeholder since Whisper isn't installed."""
    fake_audio = io.BytesIO(b"\x00" * 1000)
    response = client.post(
        "/api/voice/transcribe",
        headers=auth_headers,
        files={"file": ("test.wav", fake_audio, "audio/wav")},
        data={"language": "en"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] is True
    assert "text" in data["data"]
    assert "language" in data["data"]
    assert "duration_seconds" in data["data"]
    assert "segments" in data["data"]


def test_detect_language_unauthorized(client):
    response = client.post("/api/voice/detect-language")
    assert response.status_code in (401, 403, 422)


def test_detect_language_success(client, auth_headers):
    fake_audio = io.BytesIO(b"\x00" * 1000)
    response = client.post(
        "/api/voice/detect-language",
        headers=auth_headers,
        files={"file": ("test.wav", fake_audio, "audio/wav")},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] is True
    assert "language" in data["data"]


# --- Model unit tests ---

def test_voice_transcriber_no_whisper():
    from app.models.voice.transcriber import VoiceTranscriber
    transcriber = VoiceTranscriber()
    result = transcriber.transcribe(b"fake audio")
    assert result["text"] == ""
    assert "message" in result


def test_voice_transcriber_detect_language_no_whisper():
    from app.models.voice.transcriber import VoiceTranscriber
    transcriber = VoiceTranscriber()
    result = transcriber.detect_language(b"fake audio")
    assert result["language"] == "unknown"
