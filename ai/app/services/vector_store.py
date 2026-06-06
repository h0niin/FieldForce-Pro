from __future__ import annotations

import logging
from typing import Any

logger = logging.getLogger(__name__)

try:
    from qdrant_client import QdrantClient
    from qdrant_client.models import Distance, PointStruct, VectorParams
    QDRANT_AVAILABLE = True
except ImportError:
    QDRANT_AVAILABLE = False
    logger.warning("qdrant-client not installed — vector store will be unavailable")


class VectorStoreService:
    """Qdrant vector store wrapper for RAG and similarity search."""

    def __init__(self, host: str = "localhost", port: int = 6333) -> None:
        self.available = QDRANT_AVAILABLE
        self.client: Any = None
        if self.available:
            try:
                self.client = QdrantClient(host=host, port=port)
                logger.info("Connected to Qdrant at %s:%d", host, port)
            except Exception as e:
                logger.error("Failed to connect to Qdrant: %s", e)
                self.client = None

    def create_collection(
        self,
        name: str,
        vector_size: int = 1536,
        distance: str = "cosine",
    ) -> bool:
        if not self.client:
            return False
        try:
            dist = Distance.COSINE if distance == "cosine" else Distance.EUCLID
            self.client.create_collection(
                collection_name=name,
                vectors_config=VectorParams(size=vector_size, distance=dist),
            )
            return True
        except Exception as e:
            logger.error("Failed to create collection %s: %s", name, e)
            return False

    def upsert(
        self,
        collection: str,
        points: list[dict],
    ) -> bool:
        if not self.client:
            return False
        try:
            structs = [
                PointStruct(
                    id=p["id"],
                    vector=p["vector"],
                    payload=p.get("payload", {}),
                )
                for p in points
            ]
            self.client.upsert(collection_name=collection, points=structs)
            return True
        except Exception as e:
            logger.error("Failed to upsert to %s: %s", collection, e)
            return False

    def search(
        self,
        collection: str,
        query_vector: list[float],
        limit: int = 5,
    ) -> list[dict]:
        if not self.client:
            return []
        try:
            results = self.client.search(
                collection_name=collection,
                query_vector=query_vector,
                limit=limit,
            )
            return [
                {"id": r.id, "score": r.score, "payload": r.payload}
                for r in results
            ]
        except Exception as e:
            logger.error("Failed to search %s: %s", collection, e)
            return []
