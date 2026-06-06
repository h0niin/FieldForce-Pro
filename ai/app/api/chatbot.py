from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends

from app.dependencies import get_current_user
from app.schemas.common import ApiResponse, CurrentUser
from app.schemas.requests import ChatMessageRequest, ChatSessionRequest, KnowledgeIngestRequest
from app.schemas.responses import ChatMessageResponse, ChatSessionResponse, KnowledgeIngestResponse

router = APIRouter()


def _get_engine():
    from app.models.nlp.chatbot_engine import ChatbotEngine
    return ChatbotEngine()


@router.post("/message", response_model=ApiResponse[ChatMessageResponse])
async def send_message(
    request: ChatMessageRequest,
    user: Annotated[CurrentUser, Depends(get_current_user)],
) -> ApiResponse[ChatMessageResponse]:
    engine = _get_engine()
    session_id = request.session_id or str(uuid.uuid4())
    result_dict = await engine.chat(
        message=request.message,
        session_id=session_id,
        context=request.context,
    )
    result = ChatMessageResponse(**result_dict)
    return ApiResponse.success(result, message="Chat response generated")


@router.get("/history/{session_id}", response_model=ApiResponse[ChatSessionResponse])
async def get_chat_history(
    session_id: str,
    user: Annotated[CurrentUser, Depends(get_current_user)],
) -> ApiResponse[ChatSessionResponse]:
    engine = _get_engine()
    history = engine.get_session_history(session_id)
    result = ChatSessionResponse(
        session_id=session_id,
        history=history,
        message_count=len(history),
    )
    return ApiResponse.success(result, message="Chat history retrieved")


@router.delete("/session/{session_id}", response_model=ApiResponse[dict])
async def clear_session(
    session_id: str,
    user: Annotated[CurrentUser, Depends(get_current_user)],
) -> ApiResponse[dict]:
    engine = _get_engine()
    engine.clear_session(session_id)
    return ApiResponse.success(
        {"session_id": session_id, "cleared": True},
        message="Session cleared",
    )


@router.post("/knowledge/ingest", response_model=ApiResponse[KnowledgeIngestResponse])
async def ingest_knowledge(
    request: KnowledgeIngestRequest,
    user: Annotated[CurrentUser, Depends(get_current_user)],
) -> ApiResponse[KnowledgeIngestResponse]:
    engine = _get_engine()
    result_dict = await engine.ingest_knowledge(
        documents=request.documents,
        collection=request.collection,
    )
    result = KnowledgeIngestResponse(
        ingested=result_dict.get("ingested", 0),
        total=result_dict.get("total", len(request.documents)),
        collection=request.collection,
    )
    return ApiResponse.success(result, message="Knowledge base updated")
