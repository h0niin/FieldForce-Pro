from __future__ import annotations

import io
import logging
from typing import Any

logger = logging.getLogger(__name__)

try:
    from ultralytics import YOLO
    ULTRALYTICS_AVAILABLE = True
except ImportError:
    ULTRALYTICS_AVAILABLE = False
    logger.warning("ultralytics not installed — work verifier will return placeholder results")

try:
    from PIL import Image
    import numpy as np
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False


# Default classes for work verification
WORK_VERIFICATION_CLASSES = [
    "clean_area", "dirty_area", "repaired_equipment", "damaged_equipment",
    "installed_part", "missing_part", "tool_left_behind", "safety_hazard",
    "completed_work", "incomplete_work",
]

# Confidence thresholds
VERIFICATION_THRESHOLD = 0.5
HIGH_CONFIDENCE_THRESHOLD = 0.8


class WorkVerifier:
    """Computer vision work verification using YOLOv8."""

    def __init__(self, model_path: str | None = None) -> None:
        self.available = ULTRALYTICS_AVAILABLE and PIL_AVAILABLE
        self.model: Any = None
        if self.available and model_path:
            self._load_model(model_path)

    def _load_model(self, path: str) -> None:
        try:
            self.model = YOLO(path)
            logger.info("Work verifier model loaded from %s", path)
        except Exception as e:
            logger.error("Failed to load work verifier model: %s", e)
            self.model = None

    def verify(self, image_bytes: bytes, work_order_id: str = "", verification_type: str | None = None) -> dict:
        """Verify work completion from a photo."""
        if not self.available or not PIL_AVAILABLE:
            return self._placeholder_result("Vision libraries not available (ultralytics/PIL)")

        if self.model is None:
            return self._rule_based_verification(image_bytes, work_order_id)

        try:
            image = Image.open(io.BytesIO(image_bytes))
            img_array = np.array(image)

            results = self.model(img_array, verbose=False)

            findings = []
            issues = []
            max_confidence = 0.0

            for result in results:
                if result.boxes is None:
                    continue
                for box in result.boxes:
                    cls_id = int(box.cls[0])
                    conf = float(box.conf[0])
                    class_name = result.names.get(cls_id, f"class_{cls_id}")
                    bbox = box.xyxy[0].tolist()

                    finding = {
                        "class": class_name,
                        "confidence": round(conf, 3),
                        "bbox": [round(c, 1) for c in bbox],
                    }
                    findings.append(finding)

                    if conf > max_confidence:
                        max_confidence = conf

                    # Flag issues
                    if class_name in ("damaged_equipment", "missing_part", "tool_left_behind", "safety_hazard", "incomplete_work"):
                        issues.append(f"{class_name} detected (confidence: {conf:.1%})")

            # Determine verification
            positive_findings = [f for f in findings if f["class"] in ("clean_area", "repaired_equipment", "installed_part", "completed_work")]
            verified = len(positive_findings) > 0 and len(issues) == 0

            return {
                "verified": verified,
                "confidence": round(max_confidence, 3),
                "findings": findings,
                "issues": issues,
                "work_order_id": work_order_id,
                "total_detections": len(findings),
            }

        except Exception as e:
            logger.error("Work verification error: %s", e)
            return self._placeholder_result(f"Verification error: {str(e)}")

    def _rule_based_verification(self, image_bytes: bytes, work_order_id: str) -> dict:
        """Basic verification when YOLO model is not loaded."""
        try:
            image = Image.open(io.BytesIO(image_bytes))
            width, height = image.size
            img_array = np.array(image)

            # Basic image quality checks
            findings = []
            issues = []

            # Check image isn't too dark or too bright
            mean_brightness = float(np.mean(img_array))
            if mean_brightness < 30:
                issues.append("Image too dark — please retake in better lighting")
            elif mean_brightness > 240:
                issues.append("Image overexposed — please retake")

            # Check image resolution
            if width < 200 or height < 200:
                issues.append("Image resolution too low for verification")

            # Check if image is blurry (using Laplacian variance)
            if len(img_array.shape) == 3:
                gray = np.mean(img_array, axis=2)
            else:
                gray = img_array.astype(float)

            laplacian_var = float(np.var(np.diff(np.diff(gray, axis=0), axis=1)))
            if laplacian_var < 50:
                issues.append("Image appears blurry — please retake")
            else:
                findings.append({
                    "class": "image_quality",
                    "confidence": min(1.0, laplacian_var / 500),
                    "details": "Image quality acceptable",
                })

            findings.append({
                "class": "image_metadata",
                "confidence": 0.5,
                "details": f"Resolution: {width}x{height}, Brightness: {mean_brightness:.0f}",
            })

            return {
                "verified": len(issues) == 0,
                "confidence": 0.5 if len(issues) == 0 else 0.2,
                "findings": findings,
                "issues": issues if issues else ["YOLO model not loaded — rule-based quality check only"],
                "work_order_id": work_order_id,
                "total_detections": len(findings),
                "method": "rule_based",
            }
        except Exception as e:
            return self._placeholder_result(f"Rule-based verification failed: {str(e)}")

    def train(self, data_yaml: str, epochs: int = 50, imgsz: int = 640) -> dict:
        """Train the work verification model."""
        if not ULTRALYTICS_AVAILABLE:
            return {"success": False, "message": "ultralytics not installed"}

        try:
            model = YOLO("yolov8n.pt")
            results = model.train(data=data_yaml, epochs=epochs, imgsz=imgsz, project="work_verification")
            self.model = model
            return {
                "success": True,
                "epochs": epochs,
                "model_path": str(results.save_dir) if hasattr(results, "save_dir") else "",
            }
        except Exception as e:
            logger.error("Training error: %s", e)
            return {"success": False, "message": str(e)}

    def _placeholder_result(self, message: str) -> dict:
        return {
            "verified": False,
            "confidence": 0.0,
            "findings": [],
            "issues": [message],
            "total_detections": 0,
        }
