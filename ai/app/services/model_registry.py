from __future__ import annotations

import logging
import os
from typing import Any

logger = logging.getLogger(__name__)


class ModelRegistry:
    """Registry for tracking ML model versions and paths."""

    def __init__(self, model_dir: str = "data/models") -> None:
        self.model_dir = model_dir
        self._registry: dict[str, list[dict[str, Any]]] = {}

    def register(
        self,
        name: str,
        version: str,
        path: str,
        metadata: dict | None = None,
    ) -> None:
        if name not in self._registry:
            self._registry[name] = []
        self._registry[name].append({
            "version": version,
            "path": path,
            "metadata": metadata or {},
        })
        logger.info("Registered model %s v%s at %s", name, version, path)

    def get_latest(self, name: str) -> dict[str, Any] | None:
        versions = self._registry.get(name, [])
        if not versions:
            return None
        return versions[-1]

    def load_model(self, name: str) -> Any:
        entry = self.get_latest(name)
        if entry is None:
            logger.warning("No model registered for %s", name)
            return None

        path = entry["path"]
        if not os.path.exists(path):
            logger.warning("Model file not found: %s", path)
            return None

        # Delegate loading to the appropriate framework based on extension
        if path.endswith(".pt") or path.endswith(".pth"):
            try:
                import torch
                return torch.load(path, map_location="cpu", weights_only=True)
            except ImportError:
                logger.error("torch not available to load %s", path)
                return None
        elif path.endswith(".pkl"):
            try:
                import joblib
                return joblib.load(path)
            except ImportError:
                logger.error("joblib not available to load %s", path)
                return None

        logger.warning("Unknown model format: %s", path)
        return None

    def list_models(self) -> dict[str, list[dict[str, Any]]]:
        return dict(self._registry)
