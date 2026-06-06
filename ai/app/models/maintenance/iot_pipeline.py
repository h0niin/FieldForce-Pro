from __future__ import annotations

import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)

try:
    import numpy as np
    NUMPY_AVAILABLE = True
except ImportError:
    NUMPY_AVAILABLE = False
    logger.warning("numpy not installed — IoT pipeline will use basic calculations")


VALID_SENSOR_TYPES = {
    "temperature", "vibration", "pressure", "humidity",
    "current", "voltage", "rpm", "flow_rate", "noise_level",
}


class IoTPipeline:
    """IoT sensor data ingestion and processing pipeline."""

    def __init__(self) -> None:
        self.numpy_available = NUMPY_AVAILABLE

    def ingest(self, sensor_readings: list[dict]) -> dict:
        """Validate, normalize, and process sensor readings."""
        valid_readings = []
        errors = []

        for i, reading in enumerate(sensor_readings):
            validation = self._validate_reading(reading, i)
            if validation["valid"]:
                normalized = self._normalize_reading(reading)
                valid_readings.append(normalized)
            else:
                errors.append(validation["error"])

        return {
            "total_received": len(sensor_readings),
            "total_accepted": len(valid_readings),
            "total_rejected": len(errors),
            "readings": valid_readings,
            "errors": errors[:50],
            "processed_at": datetime.now().isoformat(),
        }

    def _validate_reading(self, reading: dict, index: int) -> dict:
        """Validate a single sensor reading."""
        if not isinstance(reading, dict):
            return {"valid": False, "error": f"Reading {index}: not a dict"}

        required_fields = ["sensor_type", "value"]
        for field in required_fields:
            if field not in reading:
                return {"valid": False, "error": f"Reading {index}: missing '{field}'"}

        sensor_type = reading.get("sensor_type", "")
        if sensor_type not in VALID_SENSOR_TYPES:
            return {"valid": False, "error": f"Reading {index}: invalid sensor_type '{sensor_type}'"}

        try:
            float(reading["value"])
        except (ValueError, TypeError):
            return {"valid": False, "error": f"Reading {index}: value is not numeric"}

        return {"valid": True, "error": None}

    def _normalize_reading(self, reading: dict) -> dict:
        """Normalize a sensor reading to standard format."""
        return {
            "equipment_id": reading.get("equipment_id", ""),
            "sensor_type": reading["sensor_type"],
            "value": float(reading["value"]),
            "unit": reading.get("unit", self._default_unit(reading["sensor_type"])),
            "recorded_at": reading.get("recorded_at", datetime.now().isoformat()),
            "metadata": reading.get("metadata", {}),
        }

    def _default_unit(self, sensor_type: str) -> str:
        """Return default unit for a sensor type."""
        units = {
            "temperature": "°C",
            "vibration": "mm/s",
            "pressure": "bar",
            "humidity": "%",
            "current": "A",
            "voltage": "V",
            "rpm": "RPM",
            "flow_rate": "L/min",
            "noise_level": "dB",
        }
        return units.get(sensor_type, "")

    def detect_anomalies(self, readings: list[dict], z_threshold: float = 2.5) -> dict:
        """Detect anomalies in sensor readings using z-score and IQR methods."""
        if not readings:
            return {"anomalies": [], "total_anomalies": 0, "method": "none"}

        # Group readings by sensor type
        grouped: Dict[str, list[float]] = {}
        reading_map: Dict[str, list[dict]] = {}
        for r in readings:
            st = r.get("sensor_type", "unknown")
            val = r.get("value")
            if val is not None:
                try:
                    val = float(val)
                except (ValueError, TypeError):
                    continue
                grouped.setdefault(st, []).append(val)
                reading_map.setdefault(st, []).append(r)

        anomalies = []

        for sensor_type, values in grouped.items():
            if len(values) < 3:
                continue

            if self.numpy_available:
                import numpy as np
                arr = np.array(values)
                mean = float(np.mean(arr))
                std = float(np.std(arr))

                # Z-score method
                if std > 0:
                    z_scores = (arr - mean) / std
                    for i, z in enumerate(z_scores):
                        if abs(z) > z_threshold:
                            anomalies.append({
                                "sensor_type": sensor_type,
                                "value": values[i],
                                "z_score": round(float(z), 3),
                                "mean": round(mean, 3),
                                "std": round(std, 3),
                                "method": "z_score",
                                "reading": reading_map[sensor_type][i],
                            })

                # IQR method
                q1 = float(np.percentile(arr, 25))
                q3 = float(np.percentile(arr, 75))
                iqr = q3 - q1
                lower_bound = q1 - 1.5 * iqr
                upper_bound = q3 + 1.5 * iqr

                for i, v in enumerate(values):
                    if v < lower_bound or v > upper_bound:
                        already_flagged = any(
                            a["value"] == v and a["sensor_type"] == sensor_type and a["method"] == "z_score"
                            for a in anomalies
                        )
                        if not already_flagged:
                            anomalies.append({
                                "sensor_type": sensor_type,
                                "value": v,
                                "lower_bound": round(lower_bound, 3),
                                "upper_bound": round(upper_bound, 3),
                                "method": "iqr",
                                "reading": reading_map[sensor_type][i],
                            })
            else:
                # Basic fallback without numpy
                mean = sum(values) / len(values)
                variance = sum((v - mean) ** 2 for v in values) / len(values)
                std = variance ** 0.5

                if std > 0:
                    for i, v in enumerate(values):
                        z = (v - mean) / std
                        if abs(z) > z_threshold:
                            anomalies.append({
                                "sensor_type": sensor_type,
                                "value": v,
                                "z_score": round(z, 3),
                                "mean": round(mean, 3),
                                "std": round(std, 3),
                                "method": "z_score",
                                "reading": reading_map[sensor_type][i],
                            })

        return {
            "anomalies": anomalies,
            "total_anomalies": len(anomalies),
            "sensors_analyzed": list(grouped.keys()),
            "method": "z_score+iqr" if self.numpy_available else "z_score",
        }

    def aggregate(
        self,
        readings: list[dict],
        window_minutes: int = 60,
    ) -> dict:
        """Aggregate sensor readings by time window."""
        if not readings:
            return {"aggregations": [], "window_minutes": window_minutes}

        # Group by sensor type
        grouped: Dict[str, list[dict]] = {}
        for r in readings:
            st = r.get("sensor_type", "unknown")
            grouped.setdefault(st, []).append(r)

        aggregations = []

        for sensor_type, type_readings in grouped.items():
            values = []
            for r in type_readings:
                try:
                    values.append(float(r.get("value", 0)))
                except (ValueError, TypeError):
                    continue

            if not values:
                continue

            if self.numpy_available:
                import numpy as np
                arr = np.array(values)
                agg = {
                    "sensor_type": sensor_type,
                    "count": len(values),
                    "min": round(float(np.min(arr)), 3),
                    "max": round(float(np.max(arr)), 3),
                    "mean": round(float(np.mean(arr)), 3),
                    "std": round(float(np.std(arr)), 3),
                    "median": round(float(np.median(arr)), 3),
                    "window_minutes": window_minutes,
                }
            else:
                sorted_vals = sorted(values)
                n = len(sorted_vals)
                mean = sum(sorted_vals) / n
                variance = sum((v - mean) ** 2 for v in sorted_vals) / n
                median = sorted_vals[n // 2] if n % 2 else (sorted_vals[n // 2 - 1] + sorted_vals[n // 2]) / 2
                agg = {
                    "sensor_type": sensor_type,
                    "count": n,
                    "min": round(min(sorted_vals), 3),
                    "max": round(max(sorted_vals), 3),
                    "mean": round(mean, 3),
                    "std": round(variance ** 0.5, 3),
                    "median": round(median, 3),
                    "window_minutes": window_minutes,
                }

            aggregations.append(agg)

        return {
            "aggregations": aggregations,
            "window_minutes": window_minutes,
            "total_readings": len(readings),
        }
