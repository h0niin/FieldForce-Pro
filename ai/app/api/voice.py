from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, UploadFile

from app.dependencies import get_current_user
from app.schemas.common import ApiResponse, CurrentUser
from app.schemas.responses import LanguageDetectionResponse, VoiceTranscribeResponse

router = APIRouter()


def _get_transcriber():
    from app.models.voice.transcriber import VoiceTranscriber
    return VoiceTranscriber()


@router.post("/transcribe", response_model=ApiResponse[VoiceTranscribeResponse])
async def transcribe_audio(
    file: Annotated[UploadFile, File(description="Audio file to transcribe")],
    user: Annotated[CurrentUser, Depends(get_current_user)],
    language: str = Form("en"),
    task: str = Form("transcribe"),
) -> ApiResponse[VoiceTranscribeResponse]:
    transcriber = _get_transcriber()
    audio_bytes = await file.read()
    result_dict = transcriber.transcribe(audio_bytes, language=language, task=task)
    result = VoiceTranscribeResponse(
        text=result_dict.get("text", ""),
        language=result_dict.get("language", ""),
        duration_seconds=result_dict.get("duration_seconds", 0.0),
        segments=result_dict.get("segments", []),
    )
    return ApiResponse.success(result, message="Transcription completed")


@router.post("/detect-language", response_model=ApiResponse[LanguageDetectionResponse])
async def detect_language(
    file: Annotated[UploadFile, File(description="Audio file for language detection")],
    user: Annotated[CurrentUser, Depends(get_current_user)],
) -> ApiResponse[LanguageDetectionResponse]:
    transcriber = _get_transcriber()
    audio_bytes = await file.read()
    result_dict = transcriber.detect_language(audio_bytes)
    result = LanguageDetectionResponse(
        language=result_dict.get("language", ""),
        confidence=result_dict.get("confidence", 0.0),
        top_languages=result_dict.get("top_languages", {}),
    )
    return ApiResponse.success(result, message="Language detection completed")
