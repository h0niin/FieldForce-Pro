from __future__ import annotations

import logging

logger = logging.getLogger(__name__)

try:
    from paddleocr import PaddleOCR
    PADDLEOCR_AVAILABLE = True
except ImportError:
    PADDLEOCR_AVAILABLE = False
    logger.warning("paddleocr not installed — OCR engine will return placeholder results")


class OCREngine:
    """Document OCR using PaddleOCR."""

    def __init__(self) -> None:
        self.available = PADDLEOCR_AVAILABLE
        self.engine: object | None = None
        if self.available:
            try:
                self.engine = PaddleOCR(use_angle_cls=True, lang="en", show_log=False)
            except Exception as e:
                logger.error("Failed to initialize PaddleOCR: %s", e)
                self.engine = None

    def extract(self, image_bytes: bytes, document_type: str | None = None) -> dict:
        if not self.available or self.engine is None:
            return {
                "extracted_text": "",
                "fields": {},
                "confidence": 0.0,
                "pages": 0,
                "message": "PaddleOCR not available — placeholder result",
            }

        # Placeholder for real OCR extraction
        return {
            "extracted_text": "",
            "fields": {},
            "confidence": 0.0,
            "pages": 0,
            "message": "OCR engine ready — implementation pending",
        }
