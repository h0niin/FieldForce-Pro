from __future__ import annotations

import io
import logging
from typing import Any

logger = logging.getLogger(__name__)

try:
    from paddleocr import PaddleOCR
    PADDLEOCR_AVAILABLE = True
except ImportError:
    PADDLEOCR_AVAILABLE = False
    logger.warning("paddleocr not installed — OCR features will be unavailable")

try:
    from PIL import Image
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False

try:
    import fitz  # PyMuPDF
    PYMUPDF_AVAILABLE = True
except ImportError:
    PYMUPDF_AVAILABLE = False


# Common field patterns for invoice parsing
INVOICE_FIELD_PATTERNS = {
    "invoice_number": ["invoice #", "invoice no", "inv #", "invoice number", "bill no"],
    "date": ["date", "invoice date", "bill date", "issued"],
    "due_date": ["due date", "payment due", "due"],
    "total": ["total", "amount due", "grand total", "balance due", "total due"],
    "subtotal": ["subtotal", "sub total", "net amount"],
    "tax": ["tax", "vat", "gst", "sales tax"],
    "vendor": ["from", "vendor", "seller", "billed by", "company"],
    "customer": ["to", "bill to", "customer", "billed to", "client"],
    "po_number": ["po #", "po number", "purchase order"],
}


class DocumentParser:
    """Document parsing using PaddleOCR for text extraction."""

    def __init__(self) -> None:
        self.ocr: Any = None
        if PADDLEOCR_AVAILABLE:
            try:
                self.ocr = PaddleOCR(use_angle_cls=True, lang="en", show_log=False)
                logger.info("PaddleOCR initialized successfully")
            except Exception as e:
                logger.error("Failed to initialize PaddleOCR: %s", e)

    def parse_image(self, image_bytes: bytes) -> dict:
        """Parse text from an image using OCR."""
        if not self.ocr:
            return self._placeholder_result("OCR not available — PaddleOCR not installed")

        try:
            if PIL_AVAILABLE:
                image = Image.open(io.BytesIO(image_bytes))
                import numpy as np
                img_array = np.array(image)
            else:
                return self._placeholder_result("PIL not available for image processing")

            result = self.ocr.ocr(img_array, cls=True)

            extracted_lines: list[str] = []
            confidence_scores: list[float] = []

            if result and result[0]:
                for line in result[0]:
                    text = line[1][0]
                    conf = line[1][1]
                    extracted_lines.append(text)
                    confidence_scores.append(conf)

            full_text = "\n".join(extracted_lines)
            avg_confidence = sum(confidence_scores) / len(confidence_scores) if confidence_scores else 0.0

            return {
                "extracted_text": full_text,
                "lines": extracted_lines,
                "confidence": round(avg_confidence, 3),
                "total_lines": len(extracted_lines),
            }
        except Exception as e:
            logger.error("OCR processing error: %s", e)
            return self._placeholder_result(f"OCR processing failed: {str(e)}")

    def parse_pdf(self, pdf_bytes: bytes) -> dict:
        """Parse text from a PDF file."""
        if PYMUPDF_AVAILABLE:
            try:
                doc = fitz.open(stream=pdf_bytes, filetype="pdf")
                pages_text: list[str] = []
                for page in doc:
                    pages_text.append(page.get_text())
                doc.close()

                full_text = "\n".join(pages_text)
                return {
                    "extracted_text": full_text,
                    "pages": len(pages_text),
                    "confidence": 0.95,
                    "lines": full_text.split("\n"),
                    "total_lines": len(full_text.split("\n")),
                }
            except Exception as e:
                logger.error("PDF processing error: %s", e)

        # Fallback: try OCR on first page if PaddleOCR available
        if self.ocr and PYMUPDF_AVAILABLE:
            try:
                doc = fitz.open(stream=pdf_bytes, filetype="pdf")
                page = doc[0]
                pix = page.get_pixmap()
                img_bytes = pix.tobytes("png")
                doc.close()
                return self.parse_image(img_bytes)
            except Exception as e:
                logger.error("PDF OCR fallback error: %s", e)

        return self._placeholder_result("PDF parsing not available — PyMuPDF not installed")

    def parse_invoice(self, file_bytes: bytes, file_type: str = "image") -> dict:
        """Parse an invoice document and extract structured fields."""
        if file_type == "pdf":
            raw = self.parse_pdf(file_bytes)
        else:
            raw = self.parse_image(file_bytes)

        text = raw.get("extracted_text", "")
        lines = raw.get("lines", [])

        if not text:
            return {
                "extracted_text": "",
                "fields": {},
                "confidence": 0.0,
                "pages": 0,
            }

        fields = self._extract_invoice_fields(text, lines)

        return {
            "extracted_text": text,
            "fields": fields,
            "confidence": raw.get("confidence", 0.0),
            "pages": raw.get("pages", 1),
            "raw_lines": lines,
        }

    def parse_general(self, file_bytes: bytes, file_type: str = "image", extract_fields: list[str] | None = None) -> dict:
        """Parse any document and optionally extract specific fields."""
        if file_type == "pdf":
            raw = self.parse_pdf(file_bytes)
        else:
            raw = self.parse_image(file_bytes)

        result = {
            "extracted_text": raw.get("extracted_text", ""),
            "confidence": raw.get("confidence", 0.0),
            "pages": raw.get("pages", 1),
            "fields": {},
        }

        if extract_fields and raw.get("extracted_text"):
            result["fields"] = self._extract_custom_fields(
                raw["extracted_text"],
                raw.get("lines", []),
                extract_fields,
            )

        return result

    def _extract_invoice_fields(self, text: str, lines: list[str]) -> dict:
        """Extract invoice fields from text using pattern matching."""
        fields: dict[str, str] = {}
        text_lower = text.lower()

        for field_name, patterns in INVOICE_FIELD_PATTERNS.items():
            for pattern in patterns:
                idx = text_lower.find(pattern)
                if idx != -1:
                    # Get text after the pattern on the same or next line
                    remaining = text[idx + len(pattern):].strip()
                    # Take first meaningful value (up to newline or 100 chars)
                    value = remaining.split("\n")[0].strip()
                    # Clean up separators
                    value = value.lstrip(":").lstrip("#").strip()
                    if value and len(value) < 100:
                        fields[field_name] = value
                        break

        return fields

    def _extract_custom_fields(self, text: str, lines: list[str], field_names: list[str]) -> dict:
        """Extract custom-named fields from text."""
        fields: dict[str, str] = {}
        text_lower = text.lower()

        for field in field_names:
            idx = text_lower.find(field.lower())
            if idx != -1:
                remaining = text[idx + len(field):].strip()
                value = remaining.split("\n")[0].strip().lstrip(":").strip()
                if value and len(value) < 200:
                    fields[field] = value

        return fields

    def _placeholder_result(self, message: str) -> dict:
        return {
            "extracted_text": "",
            "lines": [],
            "confidence": 0.0,
            "total_lines": 0,
            "message": message,
        }
