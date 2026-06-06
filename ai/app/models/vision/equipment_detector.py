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
    logger.warning("ultralytics not installed — equipment detector will return placeholder results")

try:
    from PIL import Image
    import numpy as np
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False


# Common equipment categories for FSM
EQUIPMENT_CATEGORIES = {
    "hvac": ["air_conditioner", "furnace", "heat_pump", "thermostat", "ductwork", "compressor"],
    "plumbing": ["water_heater", "pipe", "valve", "faucet", "toilet", "drain"],
    "electrical": ["panel", "breaker", "outlet", "switch", "transformer", "generator"],
    "appliance": ["refrigerator", "washer", "dryer", "dishwasher", "oven", "microwave"],
    "industrial": ["pump", "motor", "conveyor", "boiler", "chiller", "compressor"],
}


class EquipmentDetector:
    """Equipment detection and identification using YOLOv8."""

    def __init__(self, model_path: str | None = None) -> None:
        self.available = ULTRALYTICS_AVAILABLE and PIL_AVAILABLE
        self.model: Any = None
        if self.available and model_path:
            self._load_model(model_path)

    def _load_model(self, path: str) -> None:
        try:
            self.model = YOLO(path)
            logger.info("Equipment detector model loaded from %s", path)
        except Exception as e:
            logger.error("Failed to load equipment detector model: %s", e)
            self.model = None

    def detect(self, image_bytes: bytes, equipment_type: str | None = None) -> dict:
        """Detect and identify equipment in an image."""
        if not self.available or not PIL_AVAILABLE:
            return self._placeholder_result("Vision libraries not available")

        if self.model is None:
            return self._rule_based_detection(image_bytes, equipment_type)

        try:
            image = Image.open(io.BytesIO(image_bytes))
            img_array = np.array(image)

            results = self.model(img_array, verbose=False)

            detections = []
            labels = set()

            for result in results:
                if result.boxes is None:
                    continue
                for box in result.boxes:
                    cls_id = int(box.cls[0])
                    conf = float(box.conf[0])
                    class_name = result.names.get(cls_id, f"class_{cls_id}")
                    bbox = box.xyxy[0].tolist()

                    # Filter by equipment type if specified
                    if equipment_type:
                        category_items = EQUIPMENT_CATEGORIES.get(equipment_type, [])
                        if category_items and class_name not in category_items:
                            continue

                    detection = {
                        "label": class_name,
                        "confidence": round(conf, 3),
                        "bbox": [round(c, 1) for c in bbox],
                        "category": self._get_category(class_name),
                    }
                    detections.append(detection)
                    labels.add(class_name)

            return {
                "detections": detections,
                "equipment_count": len(detections),
                "labels": sorted(labels),
                "image_size": {"width": image.width, "height": image.height},
            }

        except Exception as e:
            logger.error("Equipment detection error: %s", e)
            return self._placeholder_result(f"Detection error: {str(e)}")

    def _get_category(self, label: str) -> str:
        """Get the equipment category for a label."""
        for category, items in EQUIPMENT_CATEGORIES.items():
            if label in items:
                return category
        return "unknown"

    def _rule_based_detection(self, image_bytes: bytes, equipment_type: str | None) -> dict:
        """Basic detection metadata when YOLO model is not loaded."""
        try:
            image = Image.open(io.BytesIO(image_bytes))
            img_array = np.array(image)

            return {
                "detections": [],
                "equipment_count": 0,
                "labels": [],
                "image_size": {"width": image.width, "height": image.height},
                "image_stats": {
                    "mean_brightness": float(np.mean(img_array)),
                    "channels": img_array.shape[2] if len(img_array.shape) == 3 else 1,
                },
                "message": "YOLO model not loaded — image metadata only",
                "method": "rule_based",
            }
        except Exception as e:
            return self._placeholder_result(f"Image analysis failed: {str(e)}")

    def train(self, data_yaml: str, epochs: int = 50, imgsz: int = 640) -> dict:
        """Train the equipment detection model."""
        if not ULTRALYTICS_AVAILABLE:
            return {"success": False, "message": "ultralytics not installed"}

        try:
            model = YOLO("yolov8n.pt")
            results = model.train(data=data_yaml, epochs=epochs, imgsz=imgsz, project="equipment_detection")
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
            "detections": [],
            "equipment_count": 0,
            "labels": [],
            "message": message,
        }
