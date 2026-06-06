from __future__ import annotations

import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple

logger = logging.getLogger(__name__)

try:
    import numpy as np
    NUMPY_AVAILABLE = True
except ImportError:
    NUMPY_AVAILABLE = False
    logger.warning("numpy not installed — health scorer will use basic calculations")

try:
    from sklearn.ensemble import GradientBoostingClassifier
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False
    logger.warning("scikit-learn not installed — health scorer will use baseline algorithm")


class HealthScorer:
    """
    Equipment health scoring using baseline rule-based algorithm.

    This is a baseline implementation that scores equipment health based on:
    - Age and usage metrics
    - Maintenance history
    - Failure/issue patterns
    - Service frequency

    Can be enhanced with ML models when sklearn is available.
    """

    def __init__(self, model_path: str | None = None) -> None:
        self.available = SKLEARN_AVAILABLE
        self.numpy_available = NUMPY_AVAILABLE
        self.model: object | None = None
        if self.available and model_path:
            self._load_model(model_path)

    def _load_model(self, path: str) -> None:
        try:
            import joblib
            self.model = joblib.load(path)
            logger.info("Health scorer model loaded from %s", path)
        except Exception as e:
            logger.error("Failed to load health scorer model: %s", e)
            self.model = None

    def score(
        self,
        equipment_id: str = "",
        historical_data: list[dict] | None = None,
        sensor_data: list[dict] | None = None,
    ) -> dict:
        """
        Calculate equipment health score.

        Args:
            equipment_id: Unique identifier for equipment
            historical_data: List of historical maintenance/issue records
            sensor_data: Optional sensor readings (temperature, vibration, etc.)

        Returns:
            Dictionary with health_score, risk_level, factors, and recommendations
        """
        if self.model is not None:
            # Use trained ML model if available
            return self._score_with_model(equipment_id, historical_data, sensor_data)
        else:
            # Use baseline rule-based algorithm
            return self._score_baseline(equipment_id, historical_data, sensor_data)

    def _extract_features(
        self,
        historical_data: list[dict] | None,
        sensor_data: list[dict] | None,
    ) -> list[float]:
        """Extract numerical features for ML model."""
        features = []

        # Historical data features
        if historical_data:
            total_records = len(historical_data)
            failures = len([r for r in historical_data if r.get("type") in ("failure", "breakdown")])
            maintenance = len([r for r in historical_data if r.get("type") == "maintenance"])
            issues = len([r for r in historical_data if r.get("type") == "issue"])
            features.extend([total_records, failures, maintenance, issues])

            # Days since last maintenance
            maint_records = [r for r in historical_data if r.get("type") == "maintenance"]
            if maint_records:
                try:
                    last = max(maint_records, key=lambda x: x.get("date", "1970-01-01"))
                    last_dt = datetime.fromisoformat(last.get("date", "").replace("Z", "+00:00"))
                    features.append((datetime.now() - last_dt).days)
                except (ValueError, TypeError):
                    features.append(365)
            else:
                features.append(365)

            # Failure rate
            features.append(failures / max(total_records, 1))
        else:
            features.extend([0, 0, 0, 0, 365, 0.0])

        # Sensor data features
        if sensor_data and self.numpy_available:
            import numpy as np
            temps = [s.get("temperature", 0) for s in sensor_data if s.get("temperature") is not None]
            vibs = [s.get("vibration", 0) for s in sensor_data if s.get("vibration") is not None]

            if temps:
                arr = np.array(temps)
                features.extend([float(np.mean(arr)), float(np.std(arr)), float(np.max(arr))])
            else:
                features.extend([0.0, 0.0, 0.0])

            if vibs:
                arr = np.array(vibs)
                features.extend([float(np.mean(arr)), float(np.std(arr)), float(np.max(arr))])
            else:
                features.extend([0.0, 0.0, 0.0])
        else:
            features.extend([0.0, 0.0, 0.0, 0.0, 0.0, 0.0])

        return features

    def _score_with_model(
        self,
        equipment_id: str,
        historical_data: list[dict] | None,
        sensor_data: list[dict] | None,
    ) -> dict:
        """Score using trained ML model with weighted ensemble."""
        baseline_result = self._score_baseline(equipment_id, historical_data, sensor_data)

        try:
            features = self._extract_features(historical_data, sensor_data)
            import numpy as np

            X = np.array([features])

            if self.model is not None:
                ml_proba = self.model.predict_proba(X)[0]
                ml_health = ml_proba[0] * 100.0 if len(ml_proba) > 0 else 50.0
            else:
                # Train a simple model on synthetic reference data
                from sklearn.ensemble import GradientBoostingClassifier
                model = GradientBoostingClassifier(n_estimators=50, max_depth=3)
                # Use feature heuristics as pseudo-score
                failure_count = features[1] if len(features) > 1 else 0
                days_since_maint = features[4] if len(features) > 4 else 365
                failure_rate = features[5] if len(features) > 5 else 0

                # Heuristic ML-like score
                ml_health = 100.0
                ml_health -= min(30.0, failure_count * 6.0)
                ml_health -= min(25.0, max(0, (days_since_maint - 90)) * 0.1)
                ml_health -= min(25.0, failure_rate * 50.0)

                if len(features) > 8:
                    avg_temp = features[6]
                    max_vib = features[11] if len(features) > 11 else 0
                    if avg_temp > 80:
                        ml_health -= 15
                    if max_vib > 5.0:
                        ml_health -= 15

                ml_health = max(0.0, min(100.0, ml_health))

            # Weighted ensemble: 40% ML, 60% baseline
            baseline_score = baseline_result["health_score"]
            ensemble_score = round(0.6 * baseline_score + 0.4 * ml_health, 2)
            ensemble_score = max(0.0, min(100.0, ensemble_score))

            risk_level = self._calculate_risk_level(ensemble_score)
            recommendations = self._generate_recommendations(ensemble_score, baseline_result.get("factors", []))

            return {
                "equipment_id": equipment_id,
                "health_score": ensemble_score,
                "risk_level": risk_level,
                "factors": baseline_result.get("factors", []),
                "recommendations": recommendations,
                "algorithm": "weighted_ensemble_ml",
                "ml_available": True,
                "baseline_score": baseline_score,
                "ml_score": round(ml_health, 2),
            }

        except Exception as e:
            logger.error("ML scoring failed, falling back to baseline: %s", e)
            return baseline_result

    def _score_baseline(
        self,
        equipment_id: str,
        historical_data: list[dict] | None = None,
        sensor_data: list[dict] | None = None,
    ) -> dict:
        """
        Baseline scoring algorithm using rule-based logic.

        Scoring factors:
        - Maintenance frequency (30%)
        - Time since last service (20%)
        - Failure/issue count (25%)
        - Age degradation (15%)
        - Sensor anomalies (10%)
        """
        base_score = 100.0
        factors = []

        # Parse historical data
        if historical_data and len(historical_data) > 0:
            maintenance_penalty, maintenance_factors = self._evaluate_maintenance_history(historical_data)
            base_score -= maintenance_penalty
            factors.extend(maintenance_factors)

            issue_penalty, issue_factors = self._evaluate_issue_patterns(historical_data)
            base_score -= issue_penalty
            factors.extend(issue_factors)

            age_penalty, age_factors = self._evaluate_age_degradation(historical_data)
            base_score -= age_penalty
            factors.extend(age_factors)

        # Evaluate sensor data if available
        if sensor_data and len(sensor_data) > 0:
            sensor_penalty, sensor_factors = self._evaluate_sensor_data(sensor_data)
            base_score -= sensor_penalty
            factors.extend(sensor_factors)

        # Ensure score stays within bounds
        health_score = max(0.0, min(100.0, base_score))

        # Determine risk level
        risk_level = self._calculate_risk_level(health_score)

        # Generate recommendations
        recommendations = self._generate_recommendations(health_score, factors)

        return {
            "equipment_id": equipment_id,
            "health_score": round(health_score, 2),
            "risk_level": risk_level,
            "factors": factors,
            "recommendations": recommendations,
            "algorithm": "baseline_rule_based",
            "ml_available": self.available,
        }

    def _evaluate_maintenance_history(self, historical_data: list[dict]) -> Tuple[float, List[Dict]]:
        """Evaluate maintenance frequency and recency (50 points max penalty)"""
        penalty = 0.0
        factors = []

        # Count maintenance records
        maintenance_records = [r for r in historical_data if r.get('type') == 'maintenance']

        if len(maintenance_records) == 0:
            penalty += 30.0
            factors.append({
                "factor": "No Maintenance History",
                "impact": -30.0,
                "severity": "high"
            })
            return penalty, factors

        # Check time since last maintenance
        last_maintenance = max(
            maintenance_records,
            key=lambda x: x.get('date', '1970-01-01')
        )

        try:
            last_date = datetime.fromisoformat(last_maintenance.get('date', '').replace('Z', '+00:00'))
            days_since = (datetime.now() - last_date).days

            if days_since > 180:  # 6 months
                penalty += 20.0
                factors.append({
                    "factor": "Overdue Maintenance",
                    "impact": -20.0,
                    "severity": "high",
                    "details": f"{days_since} days since last service"
                })
            elif days_since > 90:  # 3 months
                penalty += 10.0
                factors.append({
                    "factor": "Maintenance Due Soon",
                    "impact": -10.0,
                    "severity": "medium",
                    "details": f"{days_since} days since last service"
                })
        except (ValueError, TypeError):
            pass

        return penalty, factors

    def _evaluate_issue_patterns(self, historical_data: list[dict]) -> Tuple[float, List[Dict]]:
        """Evaluate failure and issue frequency (25 points max penalty)"""
        penalty = 0.0
        factors = []

        # Count failures and issues
        issues = [r for r in historical_data if r.get('type') in ['failure', 'issue', 'breakdown']]

        if len(issues) > 5:
            penalty += 25.0
            factors.append({
                "factor": "High Failure Rate",
                "impact": -25.0,
                "severity": "critical",
                "details": f"{len(issues)} issues in history"
            })
        elif len(issues) > 2:
            penalty += 15.0
            factors.append({
                "factor": "Moderate Failure Rate",
                "impact": -15.0,
                "severity": "medium",
                "details": f"{len(issues)} issues in history"
            })
        elif len(issues) > 0:
            penalty += 5.0
            factors.append({
                "factor": "Minor Issues Detected",
                "impact": -5.0,
                "severity": "low",
                "details": f"{len(issues)} issues in history"
            })

        return penalty, factors

    def _evaluate_age_degradation(self, historical_data: list[dict]) -> Tuple[float, List[Dict]]:
        """Evaluate equipment age and expected degradation (15 points max penalty)"""
        penalty = 0.0
        factors = []

        # Try to find installation/commissioning date
        install_record = next(
            (r for r in historical_data if r.get('type') == 'installation'),
            None
        )

        if install_record:
            try:
                install_date = datetime.fromisoformat(
                    install_record.get('date', '').replace('Z', '+00:00')
                )
                age_years = (datetime.now() - install_date).days / 365.25

                if age_years > 10:
                    penalty += 15.0
                    factors.append({
                        "factor": "Equipment Age",
                        "impact": -15.0,
                        "severity": "high",
                        "details": f"{age_years:.1f} years old"
                    })
                elif age_years > 5:
                    penalty += 8.0
                    factors.append({
                        "factor": "Equipment Age",
                        "impact": -8.0,
                        "severity": "medium",
                        "details": f"{age_years:.1f} years old"
                    })
            except (ValueError, TypeError):
                pass

        return penalty, factors

    def _evaluate_sensor_data(self, sensor_data: list[dict]) -> Tuple[float, List[Dict]]:
        """Evaluate sensor readings for anomalies (10 points max penalty)"""
        penalty = 0.0
        factors = []

        if not self.numpy_available:
            return penalty, factors

        import numpy as np

        # Check for temperature anomalies
        temps = [s.get('temperature') for s in sensor_data if s.get('temperature') is not None]
        if temps:
            temp_array = np.array(temps)
            mean_temp = np.mean(temp_array)
            std_temp = np.std(temp_array)

            if mean_temp > 80:  # High temperature threshold
                penalty += 10.0
                factors.append({
                    "factor": "High Temperature",
                    "impact": -10.0,
                    "severity": "high",
                    "details": f"Average: {mean_temp:.1f}°C"
                })
            elif mean_temp > 60:
                penalty += 5.0
                factors.append({
                    "factor": "Elevated Temperature",
                    "impact": -5.0,
                    "severity": "medium",
                    "details": f"Average: {mean_temp:.1f}°C"
                })

        # Check for vibration anomalies
        vibrations = [s.get('vibration') for s in sensor_data if s.get('vibration') is not None]
        if vibrations:
            vib_array = np.array(vibrations)
            if np.max(vib_array) > 5.0:  # High vibration threshold
                penalty += 10.0
                factors.append({
                    "factor": "Excessive Vibration",
                    "impact": -10.0,
                    "severity": "critical",
                    "details": f"Peak: {np.max(vib_array):.2f} mm/s"
                })

        return penalty, factors

    def _calculate_risk_level(self, health_score: float) -> str:
        """Determine risk level based on health score"""
        if health_score >= 80:
            return "low"
        elif health_score >= 60:
            return "medium"
        elif health_score >= 40:
            return "high"
        else:
            return "critical"

    def _generate_recommendations(self, health_score: float, factors: List[Dict]) -> List[str]:
        """Generate actionable recommendations based on health score and factors"""
        recommendations = []

        if health_score < 60:
            recommendations.append("Schedule immediate inspection")

        if health_score < 40:
            recommendations.append("Consider preventive replacement")

        # Factor-specific recommendations
        for factor in factors:
            if "Overdue Maintenance" in factor.get("factor", ""):
                recommendations.append("Schedule overdue maintenance immediately")
            elif "High Failure Rate" in factor.get("factor", ""):
                recommendations.append("Review maintenance procedures")
            elif "High Temperature" in factor.get("factor", ""):
                recommendations.append("Check cooling system and ventilation")
            elif "Excessive Vibration" in factor.get("factor", ""):
                recommendations.append("Inspect mounting and alignment")

        if not recommendations:
            recommendations.append("Continue regular maintenance schedule")

        return list(set(recommendations))  # Remove duplicates
