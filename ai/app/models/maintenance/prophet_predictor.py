from __future__ import annotations

import logging
import math
from datetime import datetime, timedelta
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)

try:
    from prophet import Prophet
    PROPHET_AVAILABLE = True
except ImportError:
    PROPHET_AVAILABLE = False
    logger.warning("prophet not installed — Prophet predictor will use exponential decay fallback")

try:
    import pandas as pd
    PANDAS_AVAILABLE = True
except ImportError:
    PANDAS_AVAILABLE = False

try:
    import numpy as np
    NUMPY_AVAILABLE = True
except ImportError:
    NUMPY_AVAILABLE = False


class ProphetPredictor:
    """Prophet-based equipment failure prediction using time-series analysis."""

    def __init__(self) -> None:
        self.available = PROPHET_AVAILABLE and PANDAS_AVAILABLE
        self.models: Dict[str, object] = {}

    def _exponential_decay_fallback(
        self,
        equipment_id: str,
        historical_data: list[dict] | None,
        horizon_days: int = 90,
    ) -> dict:
        """Simple exponential decay model when Prophet is unavailable."""
        base_failure_rate = 0.1
        decay_factor = 0.02

        if historical_data:
            failures = [r for r in historical_data if r.get("type") in ("failure", "breakdown", "issue")]
            maintenance = [r for r in historical_data if r.get("type") == "maintenance"]

            failure_count = len(failures)
            maintenance_count = len(maintenance)

            base_failure_rate = min(0.9, 0.1 + failure_count * 0.08)

            if maintenance_count > 0:
                try:
                    last_maint = max(
                        maintenance,
                        key=lambda x: x.get("date", "1970-01-01"),
                    )
                    last_date = datetime.fromisoformat(
                        last_maint.get("date", "").replace("Z", "+00:00")
                    )
                    days_since = (datetime.now() - last_date).days
                    decay_factor = 0.005 + (days_since / 365.0) * 0.03
                except (ValueError, TypeError):
                    pass

        forecast = []
        for day in range(1, horizon_days + 1):
            prob = min(1.0, base_failure_rate * (1 + decay_factor * day))
            date = (datetime.now() + timedelta(days=day)).strftime("%Y-%m-%d")
            forecast.append({
                "date": date,
                "failure_probability": round(prob, 4),
                "lower_bound": round(max(0.0, prob - 0.1), 4),
                "upper_bound": round(min(1.0, prob + 0.1), 4),
            })

        current_prob = forecast[0]["failure_probability"] if forecast else base_failure_rate
        health_score = max(0.0, min(100.0, (1.0 - current_prob) * 100.0))

        predicted_failure_date = None
        for entry in forecast:
            if entry["failure_probability"] > 0.7:
                predicted_failure_date = entry["date"]
                break

        recommended_action = "Continue monitoring"
        if current_prob > 0.7:
            recommended_action = "URGENT: Schedule immediate inspection"
        elif current_prob > 0.5:
            recommended_action = "Schedule preventive maintenance"
        elif current_prob > 0.3:
            recommended_action = "Plan maintenance in next window"

        return {
            "equipment_id": equipment_id,
            "failure_probability": round(current_prob, 4),
            "predicted_failure_date": predicted_failure_date,
            "recommended_action": recommended_action,
            "health_score": round(health_score, 2),
            "model_type": "exponential_decay_fallback",
            "confidence": 0.5,
            "forecast": forecast[:30],
            "seasonal_components": {},
        }

    def predict(
        self,
        equipment_id: str = "",
        historical_data: list[dict] | None = None,
        horizon_days: int = 90,
    ) -> dict:
        """Predict equipment failure using Prophet time-series analysis."""
        if not self.available or not historical_data:
            return self._exponential_decay_fallback(equipment_id, historical_data, horizon_days)

        try:
            import pandas as pd

            records = []
            for record in historical_data:
                date_str = record.get("date", "")
                if not date_str:
                    continue
                try:
                    dt = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
                except (ValueError, TypeError):
                    continue

                severity = 0.0
                rec_type = record.get("type", "")
                if rec_type in ("failure", "breakdown"):
                    severity = 1.0
                elif rec_type == "issue":
                    severity = 0.6
                elif rec_type == "maintenance":
                    severity = -0.3
                else:
                    severity = 0.1

                records.append({"ds": dt, "y": severity})

            if len(records) < 5:
                return self._exponential_decay_fallback(equipment_id, historical_data, horizon_days)

            df = pd.DataFrame(records)
            df = df.sort_values("ds").reset_index(drop=True)

            model = Prophet(
                changepoint_prior_scale=0.05,
                seasonality_prior_scale=10,
                yearly_seasonality=True,
                weekly_seasonality=True,
                daily_seasonality=False,
            )
            model.fit(df)

            future = model.make_future_dataframe(periods=horizon_days)
            forecast_df = model.predict(future)

            future_forecast = forecast_df.tail(horizon_days)
            forecast = []
            for _, row in future_forecast.iterrows():
                prob = max(0.0, min(1.0, row["yhat"]))
                forecast.append({
                    "date": row["ds"].strftime("%Y-%m-%d"),
                    "failure_probability": round(prob, 4),
                    "lower_bound": round(max(0.0, row["yhat_lower"]), 4),
                    "upper_bound": round(min(1.0, row["yhat_upper"]), 4),
                })

            current_prob = forecast[0]["failure_probability"] if forecast else 0.0
            health_score = max(0.0, min(100.0, (1.0 - current_prob) * 100.0))

            predicted_failure_date = None
            for entry in forecast:
                if entry["failure_probability"] > 0.7:
                    predicted_failure_date = entry["date"]
                    break

            recommended_action = "Continue monitoring"
            if current_prob > 0.7:
                recommended_action = "URGENT: Schedule immediate inspection"
            elif current_prob > 0.5:
                recommended_action = "Schedule preventive maintenance"
            elif current_prob > 0.3:
                recommended_action = "Plan maintenance in next window"

            seasonal_components = {}
            try:
                components = forecast_df[["ds", "trend", "weekly", "yearly"]].tail(horizon_days)
                seasonal_components = {
                    "trend": "increasing" if components["trend"].iloc[-1] > components["trend"].iloc[0] else "decreasing",
                    "weekly_pattern": True,
                    "yearly_pattern": True,
                }
            except Exception:
                pass

            self.models[equipment_id] = model

            return {
                "equipment_id": equipment_id,
                "failure_probability": round(current_prob, 4),
                "predicted_failure_date": predicted_failure_date,
                "recommended_action": recommended_action,
                "health_score": round(health_score, 2),
                "model_type": "prophet",
                "confidence": 0.75,
                "forecast": forecast[:30],
                "seasonal_components": seasonal_components,
            }

        except Exception as e:
            logger.error("Prophet prediction failed: %s", e)
            return self._exponential_decay_fallback(equipment_id, historical_data, horizon_days)
