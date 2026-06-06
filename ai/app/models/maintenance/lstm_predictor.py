from __future__ import annotations

import logging
import math
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

try:
    import torch
    import torch.nn as nn
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False
    logger.warning("torch not installed — LSTM predictor will return rule-based fallback results")

try:
    import numpy as np
    NUMPY_AVAILABLE = True
except ImportError:
    NUMPY_AVAILABLE = False


class FailureLSTM(nn.Module if TORCH_AVAILABLE else object):
    """LSTM neural network for equipment failure prediction."""

    def __init__(self, input_size: int = 6, hidden_size: int = 64, num_layers: int = 2, dropout: float = 0.2) -> None:
        if not TORCH_AVAILABLE:
            return
        super().__init__()
        self.hidden_size = hidden_size
        self.num_layers = num_layers
        self.lstm = nn.LSTM(input_size, hidden_size, num_layers, batch_first=True, dropout=dropout)
        self.fc = nn.Sequential(
            nn.Linear(hidden_size, 32),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(32, 1),
            nn.Sigmoid(),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        lstm_out, _ = self.lstm(x)
        out = self.fc(lstm_out[:, -1, :])
        return out


class LSTMPredictor:
    """LSTM-based equipment failure predictor."""

    def __init__(self, model_path: str | None = None) -> None:
        self.available = TORCH_AVAILABLE
        self.numpy_available = NUMPY_AVAILABLE
        self.model: object | None = None
        if self.available and model_path:
            self._load_model(model_path)

    def _load_model(self, path: str) -> None:
        try:
            self.model = torch.load(path, map_location="cpu", weights_only=True)
            logger.info("LSTM model loaded from %s", path)
        except Exception as e:
            logger.error("Failed to load LSTM model: %s", e)
            self.model = None

    def extract_features(self, sensor_data: list[dict]) -> list[list[float]]:
        """Extract numerical features from sensor data for LSTM input."""
        features = []
        for reading in sensor_data:
            feature_vector = [
                float(reading.get("temperature", 0.0)),
                float(reading.get("vibration", 0.0)),
                float(reading.get("pressure", 0.0)),
                float(reading.get("humidity", 0.0)),
                float(reading.get("current", 0.0)),
                float(reading.get("rpm", 0.0)),
            ]
            features.append(feature_vector)
        return features

    def _rule_based_prediction(
        self,
        equipment_id: str,
        sensor_data: list[dict] | None,
        historical_data: list[dict] | None,
    ) -> dict:
        """Rule-based fallback when LSTM model is not available."""
        failure_probability = 0.0
        health_score = 100.0
        factors = []

        if sensor_data:
            temps = [s.get("temperature", 0) for s in sensor_data if s.get("temperature") is not None]
            vibs = [s.get("vibration", 0) for s in sensor_data if s.get("vibration") is not None]

            if temps:
                avg_temp = sum(temps) / len(temps)
                if avg_temp > 80:
                    failure_probability += 0.3
                    health_score -= 25
                    factors.append(f"High temperature: {avg_temp:.1f}°C")
                elif avg_temp > 60:
                    failure_probability += 0.1
                    health_score -= 10
                    factors.append(f"Elevated temperature: {avg_temp:.1f}°C")

            if vibs:
                max_vib = max(vibs)
                if max_vib > 5.0:
                    failure_probability += 0.3
                    health_score -= 25
                    factors.append(f"Excessive vibration: {max_vib:.2f} mm/s")
                elif max_vib > 3.0:
                    failure_probability += 0.15
                    health_score -= 10
                    factors.append(f"Elevated vibration: {max_vib:.2f} mm/s")

        if historical_data:
            failures = [r for r in historical_data if r.get("type") in ("failure", "breakdown")]
            if len(failures) > 3:
                failure_probability += 0.2
                health_score -= 15
                factors.append(f"{len(failures)} past failures")

        failure_probability = min(1.0, max(0.0, failure_probability))
        health_score = max(0.0, min(100.0, health_score))

        predicted_failure_date = None
        if failure_probability > 0.5:
            days = int((1.0 - failure_probability) * 90)
            predicted_failure_date = (datetime.now() + timedelta(days=max(1, days))).isoformat()

        recommended_action = "Continue monitoring"
        if failure_probability > 0.7:
            recommended_action = "URGENT: Schedule immediate inspection"
        elif failure_probability > 0.5:
            recommended_action = "Schedule preventive maintenance within 2 weeks"
        elif failure_probability > 0.3:
            recommended_action = "Plan maintenance in next scheduled window"

        return {
            "equipment_id": equipment_id,
            "failure_probability": round(failure_probability, 4),
            "predicted_failure_date": predicted_failure_date,
            "recommended_action": recommended_action,
            "health_score": round(health_score, 2),
            "model_type": "rule_based_fallback",
            "confidence": 0.6,
            "factors": factors,
        }

    def predict(
        self,
        sensor_data: list[dict] | None = None,
        equipment_id: str = "",
        historical_data: list[dict] | None = None,
    ) -> dict:
        """Predict equipment failure probability."""
        if not self.available or self.model is None:
            return self._rule_based_prediction(equipment_id, sensor_data, historical_data)

        try:
            features = self.extract_features(sensor_data or [])
            if not features:
                return self._rule_based_prediction(equipment_id, sensor_data, historical_data)

            import numpy as np
            input_tensor = torch.FloatTensor(np.array([features]))

            self.model.eval()
            with torch.no_grad():
                output = self.model(input_tensor)
                failure_prob = output.item()

            health_score = max(0.0, min(100.0, (1.0 - failure_prob) * 100.0))

            predicted_failure_date = None
            if failure_prob > 0.5:
                days = int((1.0 - failure_prob) * 90)
                predicted_failure_date = (datetime.now() + timedelta(days=max(1, days))).isoformat()

            recommended_action = "Continue monitoring"
            if failure_prob > 0.7:
                recommended_action = "URGENT: Schedule immediate inspection"
            elif failure_prob > 0.5:
                recommended_action = "Schedule preventive maintenance within 2 weeks"
            elif failure_prob > 0.3:
                recommended_action = "Plan maintenance in next scheduled window"

            return {
                "equipment_id": equipment_id,
                "failure_probability": round(failure_prob, 4),
                "predicted_failure_date": predicted_failure_date,
                "recommended_action": recommended_action,
                "health_score": round(health_score, 2),
                "model_type": "lstm",
                "confidence": 0.85,
                "factors": [],
            }

        except Exception as e:
            logger.error("LSTM prediction failed: %s", e)
            return self._rule_based_prediction(equipment_id, sensor_data, historical_data)

    def train(
        self,
        training_data: list[dict],
        epochs: int = 50,
        learning_rate: float = 0.001,
    ) -> dict:
        """Train LSTM model on historical sensor data with failure labels."""
        if not self.available:
            return {"status": "skipped", "reason": "torch not available"}

        try:
            import numpy as np

            model = FailureLSTM()
            optimizer = torch.optim.Adam(model.parameters(), lr=learning_rate)
            criterion = nn.BCELoss()

            # Extract features and labels from training data
            X_data = []
            y_data = []
            for record in training_data:
                features = self.extract_features(record.get("sensor_readings", []))
                if features:
                    X_data.append(features)
                    y_data.append(float(record.get("failure_occurred", 0)))

            if not X_data:
                return {"status": "error", "reason": "No valid training data"}

            # Pad sequences to same length
            max_len = max(len(seq) for seq in X_data)
            X_padded = [seq + [[0.0] * 6] * (max_len - len(seq)) for seq in X_data]

            X_tensor = torch.FloatTensor(np.array(X_padded))
            y_tensor = torch.FloatTensor(np.array(y_data)).unsqueeze(1)

            model.train()
            losses = []
            for epoch in range(epochs):
                optimizer.zero_grad()
                outputs = model(X_tensor)
                loss = criterion(outputs, y_tensor)
                loss.backward()
                optimizer.step()
                losses.append(loss.item())

            self.model = model
            return {
                "status": "completed",
                "epochs": epochs,
                "final_loss": round(losses[-1], 6),
                "samples": len(X_data),
            }

        except Exception as e:
            logger.error("LSTM training failed: %s", e)
            return {"status": "error", "reason": str(e)}
