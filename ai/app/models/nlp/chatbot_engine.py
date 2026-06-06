from __future__ import annotations

import logging
import uuid
from typing import Any

from app.services.llm_client import LLMClient
from app.services.vector_store import VectorStoreService

logger = logging.getLogger(__name__)

# In-memory session store (production would use Redis)
_SESSION_STORE: dict[str, list[dict[str, str]]] = {}

SYSTEM_PROMPT = """You are FieldForce Pro AI Assistant, a helpful chatbot for field service management.
You help users with:
- Creating and managing work orders
- Scheduling service appointments
- Managing assets and equipment
- Understanding invoices and estimates
- Navigating the platform

Be concise, helpful, and professional. If you find relevant context from the knowledge base, use it.
If you don't know something, say so honestly."""

COLLECTION_NAME = "fieldforce_knowledge"


class ChatbotEngine:
    """RAG-based chatbot engine using LLM + vector store."""

    def __init__(
        self,
        llm_client: LLMClient | None = None,
        vector_store: VectorStoreService | None = None,
    ) -> None:
        self.llm = llm_client
        self.vector_store = vector_store

    async def chat(
        self,
        message: str,
        session_id: str = "",
        context: dict | None = None,
    ) -> dict:
        if not session_id:
            session_id = str(uuid.uuid4())

        # Get conversation history
        history = self.get_session_history(session_id)

        # RAG: retrieve relevant context from vector store
        rag_context = await self._retrieve_context(message)

        if self.llm is None:
            reply = self._rule_based_response(message)
            self._save_to_history(session_id, message, reply)
            return {
                "reply": reply,
                "session_id": session_id,
                "sources": [],
                "suggested_actions": self._get_suggested_actions(message),
            }

        # Build prompt with history and RAG context
        prompt = self._build_prompt(message, history, rag_context, context)

        try:
            reply = await self.llm.complete(
                prompt=prompt,
                system=SYSTEM_PROMPT,
                max_tokens=1024,
                temperature=0.7,
            )
        except Exception as e:
            logger.error("LLM error: %s", e)
            reply = self._rule_based_response(message)

        self._save_to_history(session_id, message, reply)

        sources = [
            {"title": s.get("payload", {}).get("title", ""), "score": s.get("score", 0)}
            for s in rag_context
        ] if rag_context else []

        return {
            "reply": reply,
            "session_id": session_id,
            "sources": sources,
            "suggested_actions": self._get_suggested_actions(message),
        }

    def get_session_history(self, session_id: str) -> list[dict[str, str]]:
        return _SESSION_STORE.get(session_id, [])

    def clear_session(self, session_id: str) -> None:
        _SESSION_STORE.pop(session_id, None)

    async def ingest_knowledge(
        self,
        documents: list[dict[str, Any]],
        collection: str = COLLECTION_NAME,
    ) -> dict:
        """Ingest documents into the vector store for RAG."""
        if not self.llm or not self.vector_store:
            return {"ingested": 0, "message": "LLM or vector store not available"}

        if not self.vector_store.available:
            return {"ingested": 0, "message": "Vector store not connected"}

        # Ensure collection exists
        self.vector_store.create_collection(collection)

        points = []
        for i, doc in enumerate(documents):
            text = doc.get("content", "")
            if not text:
                continue
            try:
                embedding = await self.llm.embed(text)
                if embedding:
                    points.append({
                        "id": doc.get("id", i),
                        "vector": embedding,
                        "payload": {
                            "title": doc.get("title", ""),
                            "content": text[:2000],
                            "source": doc.get("source", ""),
                            "doc_type": doc.get("doc_type", "general"),
                        },
                    })
            except Exception as e:
                logger.error("Failed to embed document %s: %s", doc.get("title"), e)

        if points:
            self.vector_store.upsert(collection, points)

        return {"ingested": len(points), "total": len(documents)}

    async def _retrieve_context(self, query: str, limit: int = 3) -> list[dict]:
        if not self.llm or not self.vector_store or not self.vector_store.available:
            return []
        try:
            embedding = await self.llm.embed(query)
            if not embedding:
                return []
            return self.vector_store.search(COLLECTION_NAME, embedding, limit=limit)
        except Exception as e:
            logger.error("RAG retrieval error: %s", e)
            return []

    def _build_prompt(
        self,
        message: str,
        history: list[dict[str, str]],
        rag_context: list[dict],
        user_context: dict | None = None,
    ) -> str:
        parts: list[str] = []

        if rag_context:
            parts.append("Relevant knowledge base context:")
            for ctx in rag_context:
                payload = ctx.get("payload", {})
                parts.append(f"- {payload.get('title', '')}: {payload.get('content', '')[:500]}")
            parts.append("")

        if user_context:
            parts.append(f"User context: {user_context}")
            parts.append("")

        if history:
            parts.append("Conversation history:")
            for msg in history[-6:]:  # Last 6 messages (3 turns)
                parts.append(f"{msg['role'].capitalize()}: {msg['content']}")
            parts.append("")

        parts.append(f"User: {message}")
        return "\n".join(parts)

    def _save_to_history(self, session_id: str, user_msg: str, assistant_msg: str) -> None:
        if session_id not in _SESSION_STORE:
            _SESSION_STORE[session_id] = []
        _SESSION_STORE[session_id].append({"role": "user", "content": user_msg})
        _SESSION_STORE[session_id].append({"role": "assistant", "content": assistant_msg})
        # Limit history to 20 messages
        if len(_SESSION_STORE[session_id]) > 20:
            _SESSION_STORE[session_id] = _SESSION_STORE[session_id][-20:]

    def _rule_based_response(self, message: str) -> str:
        msg = message.lower()
        if any(w in msg for w in ["work order", "wo", "job"]):
            return "To create a work order, go to Work Orders > New. You can assign technicians, set priority, and schedule appointments."
        if any(w in msg for w in ["schedule", "appointment", "dispatch"]):
            return "Use the Dispatch Board to schedule appointments. You can drag-and-drop work orders to technician time slots."
        if any(w in msg for w in ["invoice", "payment", "billing"]):
            return "Navigate to Invoices to create and manage billing. You can generate invoices from completed work orders."
        if any(w in msg for w in ["asset", "equipment", "maintenance"]):
            return "Manage your assets under Assets. You can track maintenance history, health scores, and set up maintenance plans."
        if any(w in msg for w in ["help", "how"]):
            return "I can help with work orders, scheduling, invoicing, asset management, and more. What would you like to know?"
        return "I'm the FieldForce Pro assistant. I can help with work orders, scheduling, invoicing, and asset management. How can I assist you?"

    def _get_suggested_actions(self, message: str) -> list[str]:
        msg = message.lower()
        if any(w in msg for w in ["work order", "wo"]):
            return ["Create Work Order", "View Work Orders", "Schedule Appointment"]
        if any(w in msg for w in ["schedule", "dispatch"]):
            return ["Open Dispatch Board", "View Calendar", "Create Appointment"]
        if any(w in msg for w in ["invoice", "payment"]):
            return ["Create Invoice", "View Payments", "Generate Report"]
        return ["Create Work Order", "Open Dispatch Board", "View Assets"]
