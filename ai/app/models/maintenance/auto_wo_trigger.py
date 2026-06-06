from __future__ import annotations

import logging
from datetime import datetime
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)


class AutoWOTrigger:
    """Evaluates prediction results and generates work order creation payloads."""

    def __init__(
        self,
        health_threshold: float = 40.0,
        failure_probability_threshold: float = 0.7,
    ) -> None:
        self.health_threshold = health_threshold
        self.failure_probability_threshold = failure_probability_threshold

    def evaluate(
        self,
        prediction: dict,
        equipment_info: dict | None = None,
    ) -> dict:
        """
        Evaluate a prediction result and determine if a WO should be created.

        Args:
            prediction: Result from LSTM/Prophet/health scorer
            equipment_info: Optional equipment details (name, location, etc.)

        Returns:
            Dict with should_create_wo flag and optional wo_payload
        """
        health_score = prediction.get("health_score", 100.0)
        failure_prob = prediction.get("failure_probability", 0.0)
        risk_level = prediction.get("risk_level", "low")
        equipment_id = prediction.get("equipment_id", "")

        should_create = (
            health_score < self.health_threshold
            or failure_prob > self.failure_probability_threshold
            or risk_level == "critical"
        )

        if not should_create:
            return {
                "should_create_wo": False,
                "reason": "Equipment within acceptable parameters",
                "health_score": health_score,
                "failure_probability": failure_prob,
            }

        # Determine priority
        priority = "medium"
        if health_score < 20 or failure_prob > 0.9:
            priority = "urgent"
        elif health_score < 40 or failure_prob > 0.7:
            priority = "high"

        # Build WO creation payload matching server's CreateWorkOrderDto
        wo_payload = {
            "title": f"Predictive Maintenance - {equipment_info.get('name', equipment_id) if equipment_info else equipment_id}",
            "description": self._build_description(prediction, equipment_info),
            "priority": priority,
            "category": "preventive_maintenance",
            "asset_id": equipment_id,
            "status": "new",
            "source": "ai_predictive_maintenance",
            "scheduled_start": prediction.get("predicted_failure_date"),
            "custom_fields": {
                "health_score": health_score,
                "failure_probability": failure_prob,
                "risk_level": risk_level,
                "model_type": prediction.get("model_type", "unknown"),
                "auto_generated": True,
            },
        }

        if equipment_info:
            if equipment_info.get("location_id"):
                wo_payload["location_id"] = equipment_info["location_id"]
            if equipment_info.get("contact_id"):
                wo_payload["contact_id"] = equipment_info["contact_id"]

        return {
            "should_create_wo": True,
            "reason": self._build_reason(health_score, failure_prob, risk_level),
            "priority": priority,
            "wo_payload": wo_payload,
            "health_score": health_score,
            "failure_probability": failure_prob,
        }

    def evaluate_batch(
        self,
        predictions: list[dict],
        equipment_map: dict[str, dict] | None = None,
    ) -> dict:
        """Evaluate multiple predictions and return WO creation candidates."""
        results = []
        wo_candidates = []

        for prediction in predictions:
            eq_id = prediction.get("equipment_id", "")
            eq_info = equipment_map.get(eq_id) if equipment_map else None
            result = self.evaluate(prediction, eq_info)
            results.append(result)
            if result["should_create_wo"]:
                wo_candidates.append(result)

        return {
            "total_evaluated": len(predictions),
            "total_wo_candidates": len(wo_candidates),
            "wo_candidates": wo_candidates,
            "evaluated_at": datetime.now().isoformat(),
        }

    def _build_description(self, prediction: dict, equipment_info: dict | None) -> str:
        """Build a detailed WO description from prediction results."""
        lines = ["Auto-generated work order from AI predictive maintenance system.", ""]

        eq_name = equipment_info.get("name", prediction.get("equipment_id", "Unknown")) if equipment_info else prediction.get("equipment_id", "Unknown")
        lines.append(f"Equipment: {eq_name}")
        lines.append(f"Health Score: {prediction.get('health_score', 'N/A')}/100")
        lines.append(f"Failure Probability: {prediction.get('failure_probability', 0) * 100:.1f}%")
        lines.append(f"Risk Level: {prediction.get('risk_level', 'unknown').upper()}")

        if prediction.get("predicted_failure_date"):
            lines.append(f"Predicted Failure Date: {prediction['predicted_failure_date']}")

        if prediction.get("recommended_action"):
            lines.append(f"\nRecommended Action: {prediction['recommended_action']}")

        factors = prediction.get("factors", [])
        if factors:
            lines.append("\nContributing Factors:")
            for factor in factors[:5]:
                if isinstance(factor, dict):
                    lines.append(f"  - {factor.get('factor', '')}: {factor.get('details', '')}")
                else:
                    lines.append(f"  - {factor}")

        return "\n".join(lines)

    def _build_reason(self, health_score: float, failure_prob: float, risk_level: str) -> str:
        """Build a human-readable reason for WO creation."""
        reasons = []
        if health_score < self.health_threshold:
            reasons.append(f"health score ({health_score:.1f}) below threshold ({self.health_threshold})")
        if failure_prob > self.failure_probability_threshold:
            reasons.append(f"failure probability ({failure_prob:.1%}) above threshold ({self.failure_probability_threshold:.0%})")
        if risk_level == "critical":
            reasons.append("critical risk level")
        return "WO triggered: " + "; ".join(reasons)
