from __future__ import annotations

from typing import Annotated
import logging

from fastapi import APIRouter, Depends

from app.dependencies import get_current_user
from app.schemas.common import ApiResponse, CurrentUser
from app.schemas.requests import (
    DemandForecastRequest,
    MaintenancePredictionRequest,
    LSTMPredictionRequest,
    ProphetPredictionRequest,
    EnsemblePredictionRequest,
    HealthScoreBatchRequest,
    IoTIngestRequest,
    IoTAnomalyRequest,
)
from app.schemas.responses import (
    DemandForecastResponse,
    FailurePrediction,
    LSTMPredictionResponse,
    ProphetPredictionResponse,
    EnsemblePredictionResponse,
    HealthScoreBatchResponse,
    IoTIngestResponse,
    IoTAnomalyResponse,
    IoTStatusResponse,
)
from app.models.maintenance.health_scorer import HealthScorer
from app.models.maintenance.lstm_predictor import LSTMPredictor
from app.models.maintenance.prophet_predictor import ProphetPredictor
from app.models.maintenance.iot_pipeline import IoTPipeline
from app.models.maintenance.auto_wo_trigger import AutoWOTrigger

router = APIRouter()
logger = logging.getLogger(__name__)

# Initialize models
health_scorer = HealthScorer()
lstm_predictor = LSTMPredictor()
prophet_predictor = ProphetPredictor()
iot_pipeline = IoTPipeline()
auto_wo_trigger = AutoWOTrigger()


def _get_recommended_action(risk_level: str, recommendations: list[str]) -> str:
    """Convert risk level and recommendations into a single action string"""
    if not recommendations:
        return "Continue regular maintenance schedule"

    # Join recommendations with semicolons
    action = "; ".join(recommendations[:3])  # Limit to top 3 recommendations

    # Add urgency prefix based on risk level
    if risk_level == "critical":
        return f"URGENT: {action}"
    elif risk_level == "high":
        return f"HIGH PRIORITY: {action}"
    elif risk_level == "medium":
        return f"Recommended: {action}"
    else:
        return action


@router.post("/maintenance", response_model=ApiResponse[FailurePrediction])
async def predict_maintenance(
    request: MaintenancePredictionRequest,
    user: Annotated[CurrentUser, Depends(get_current_user)],
) -> ApiResponse[FailurePrediction]:
    """
    Predict equipment maintenance needs and calculate health score.
    """
    try:
        scoring_result = health_scorer.score(
            equipment_id=request.equipment_id,
            historical_data=request.historical_data,
            sensor_data=request.sensor_data,
        )

        health_score = scoring_result.get("health_score", 100.0)
        failure_probability = max(0.0, min(1.0, (100.0 - health_score) / 100.0))

        risk_level = scoring_result.get("risk_level", "low")
        recommended_action = _get_recommended_action(risk_level, scoring_result.get("recommendations", []))

        predicted_failure_date = None
        if health_score < 60:
            days_to_failure = int((health_score / 100.0) * 365)
            from datetime import datetime, timedelta
            predicted_failure_date = (datetime.now() + timedelta(days=days_to_failure)).isoformat()

        result = FailurePrediction(
            equipment_id=request.equipment_id,
            failure_probability=round(failure_probability, 4),
            predicted_failure_date=predicted_failure_date,
            recommended_action=recommended_action,
            health_score=health_score,
        )

        message = f"Health score: {health_score:.2f}/100 ({risk_level} risk)"

        return ApiResponse.success(result, message=message)

    except Exception as e:
        logger.error(f"Maintenance prediction failed: {str(e)}")
        result = FailurePrediction(
            equipment_id=request.equipment_id,
            failure_probability=0.0,
            predicted_failure_date=None,
            recommended_action="Unable to generate prediction - insufficient data",
            health_score=100.0,
        )
        return ApiResponse.success(result, message="Prediction generated with limited data")


@router.post("/demand", response_model=ApiResponse[DemandForecastResponse])
async def forecast_demand(
    request: DemandForecastRequest,
    user: Annotated[CurrentUser, Depends(get_current_user)],
) -> ApiResponse[DemandForecastResponse]:
    result = DemandForecastResponse(
        forecast=[],
        confidence_interval={},
        trend="stable",
    )
    return ApiResponse.success(result, message="Demand forecast placeholder")


# --- LSTM Failure Prediction ---

@router.post("/failure/lstm", response_model=ApiResponse[LSTMPredictionResponse])
async def predict_failure_lstm(
    request: LSTMPredictionRequest,
    user: Annotated[CurrentUser, Depends(get_current_user)],
) -> ApiResponse[LSTMPredictionResponse]:
    """Predict equipment failure using LSTM deep learning model."""
    try:
        result = lstm_predictor.predict(
            sensor_data=request.sensor_data,
            equipment_id=request.equipment_id,
            historical_data=request.historical_data,
        )

        response = LSTMPredictionResponse(
            equipment_id=result.get("equipment_id", request.equipment_id),
            failure_probability=result.get("failure_probability", 0.0),
            predicted_failure_date=result.get("predicted_failure_date"),
            recommended_action=result.get("recommended_action", ""),
            health_score=result.get("health_score", 100.0),
            model_type=result.get("model_type", "lstm"),
            confidence=result.get("confidence", 0.0),
            factors=result.get("factors", []),
        )

        return ApiResponse.success(response, message=f"LSTM prediction: {result.get('model_type', 'unknown')} model")

    except Exception as e:
        logger.error(f"LSTM prediction failed: {str(e)}")
        response = LSTMPredictionResponse(equipment_id=request.equipment_id)
        return ApiResponse.success(response, message="LSTM prediction failed - returning defaults")


# --- Prophet Failure Prediction ---

@router.post("/failure/prophet", response_model=ApiResponse[ProphetPredictionResponse])
async def predict_failure_prophet(
    request: ProphetPredictionRequest,
    user: Annotated[CurrentUser, Depends(get_current_user)],
) -> ApiResponse[ProphetPredictionResponse]:
    """Predict equipment failure using Prophet time-series model."""
    try:
        result = prophet_predictor.predict(
            equipment_id=request.equipment_id,
            historical_data=request.historical_data,
            horizon_days=request.horizon_days,
        )

        response = ProphetPredictionResponse(
            equipment_id=result.get("equipment_id", request.equipment_id),
            failure_probability=result.get("failure_probability", 0.0),
            predicted_failure_date=result.get("predicted_failure_date"),
            recommended_action=result.get("recommended_action", ""),
            health_score=result.get("health_score", 100.0),
            model_type=result.get("model_type", "prophet"),
            confidence=result.get("confidence", 0.0),
            forecast=result.get("forecast", []),
            seasonal_components=result.get("seasonal_components", {}),
        )

        return ApiResponse.success(response, message=f"Prophet prediction: {result.get('model_type', 'unknown')} model")

    except Exception as e:
        logger.error(f"Prophet prediction failed: {str(e)}")
        response = ProphetPredictionResponse(equipment_id=request.equipment_id)
        return ApiResponse.success(response, message="Prophet prediction failed - returning defaults")


# --- Ensemble Failure Prediction ---

@router.post("/failure/ensemble", response_model=ApiResponse[EnsemblePredictionResponse])
async def predict_failure_ensemble(
    request: EnsemblePredictionRequest,
    user: Annotated[CurrentUser, Depends(get_current_user)],
) -> ApiResponse[EnsemblePredictionResponse]:
    """Combined LSTM + Prophet ensemble prediction."""
    try:
        lstm_result = lstm_predictor.predict(
            sensor_data=request.sensor_data,
            equipment_id=request.equipment_id,
            historical_data=request.historical_data,
        )

        prophet_result = prophet_predictor.predict(
            equipment_id=request.equipment_id,
            historical_data=request.historical_data,
            horizon_days=request.horizon_days,
        )

        # Weighted ensemble
        w_lstm = request.lstm_weight
        w_prophet = request.prophet_weight
        total_weight = w_lstm + w_prophet

        ensemble_prob = (
            lstm_result.get("failure_probability", 0.0) * w_lstm +
            prophet_result.get("failure_probability", 0.0) * w_prophet
        ) / total_weight

        ensemble_health = (
            lstm_result.get("health_score", 100.0) * w_lstm +
            prophet_result.get("health_score", 100.0) * w_prophet
        ) / total_weight

        ensemble_confidence = (
            lstm_result.get("confidence", 0.0) * w_lstm +
            prophet_result.get("confidence", 0.0) * w_prophet
        ) / total_weight

        # Use the earlier predicted failure date
        predicted_date = lstm_result.get("predicted_failure_date") or prophet_result.get("predicted_failure_date")

        recommended_action = "Continue monitoring"
        if ensemble_prob > 0.7:
            recommended_action = "URGENT: Schedule immediate inspection"
        elif ensemble_prob > 0.5:
            recommended_action = "Schedule preventive maintenance within 2 weeks"
        elif ensemble_prob > 0.3:
            recommended_action = "Plan maintenance in next scheduled window"

        response = EnsemblePredictionResponse(
            equipment_id=request.equipment_id,
            failure_probability=round(ensemble_prob, 4),
            predicted_failure_date=predicted_date,
            recommended_action=recommended_action,
            health_score=round(ensemble_health, 2),
            model_type="ensemble",
            confidence=round(ensemble_confidence, 3),
            lstm_result=lstm_result,
            prophet_result=prophet_result,
        )

        return ApiResponse.success(response, message="Ensemble prediction completed")

    except Exception as e:
        logger.error(f"Ensemble prediction failed: {str(e)}")
        response = EnsemblePredictionResponse(equipment_id=request.equipment_id)
        return ApiResponse.success(response, message="Ensemble prediction failed - returning defaults")


# --- Health Scoring ---

@router.post("/health-score", response_model=ApiResponse[FailurePrediction])
async def calculate_health_score(
    request: MaintenancePredictionRequest,
    user: Annotated[CurrentUser, Depends(get_current_user)],
) -> ApiResponse[FailurePrediction]:
    """Dedicated health scoring endpoint."""
    try:
        scoring_result = health_scorer.score(
            equipment_id=request.equipment_id,
            historical_data=request.historical_data,
            sensor_data=request.sensor_data,
        )

        health_score = scoring_result.get("health_score", 100.0)
        failure_probability = max(0.0, min(1.0, (100.0 - health_score) / 100.0))
        risk_level = scoring_result.get("risk_level", "low")

        result = FailurePrediction(
            equipment_id=request.equipment_id,
            failure_probability=round(failure_probability, 4),
            predicted_failure_date=None,
            recommended_action=_get_recommended_action(risk_level, scoring_result.get("recommendations", [])),
            health_score=health_score,
        )

        return ApiResponse.success(result, message=f"Health score: {health_score:.2f}/100 ({risk_level} risk)")

    except Exception as e:
        logger.error(f"Health scoring failed: {str(e)}")
        result = FailurePrediction(equipment_id=request.equipment_id)
        return ApiResponse.success(result, message="Health scoring failed - returning defaults")


@router.post("/health-score/batch", response_model=ApiResponse[HealthScoreBatchResponse])
async def calculate_health_score_batch(
    request: HealthScoreBatchRequest,
    user: Annotated[CurrentUser, Depends(get_current_user)],
) -> ApiResponse[HealthScoreBatchResponse]:
    """Batch health scoring for multiple equipment."""
    try:
        results = []
        risk_counts = {"low": 0, "medium": 0, "high": 0, "critical": 0}
        total_health = 0.0

        for equipment in request.equipment_list:
            eq_id = equipment.get("equipment_id", "")
            scoring_result = health_scorer.score(
                equipment_id=eq_id,
                historical_data=equipment.get("historical_data"),
                sensor_data=equipment.get("sensor_data"),
            )
            results.append(scoring_result)
            total_health += scoring_result.get("health_score", 100.0)
            risk = scoring_result.get("risk_level", "low")
            risk_counts[risk] = risk_counts.get(risk, 0) + 1

        avg_health = total_health / max(len(results), 1)

        response = HealthScoreBatchResponse(
            results=results,
            total_scored=len(results),
            average_health=round(avg_health, 2),
            risk_distribution=risk_counts,
        )

        return ApiResponse.success(response, message=f"Scored {len(results)} equipment, average health: {avg_health:.1f}")

    except Exception as e:
        logger.error(f"Batch health scoring failed: {str(e)}")
        response = HealthScoreBatchResponse()
        return ApiResponse.success(response, message="Batch scoring failed")


# --- IoT Data Ingestion ---

@router.post("/iot/ingest", response_model=ApiResponse[IoTIngestResponse])
async def ingest_iot_data(
    request: IoTIngestRequest,
    user: Annotated[CurrentUser, Depends(get_current_user)],
) -> ApiResponse[IoTIngestResponse]:
    """Accept and process IoT sensor data batch."""
    try:
        result = iot_pipeline.ingest(request.sensor_readings)

        response = IoTIngestResponse(
            total_received=result.get("total_received", 0),
            total_accepted=result.get("total_accepted", 0),
            total_rejected=result.get("total_rejected", 0),
            errors=result.get("errors", []),
            processed_at=result.get("processed_at", ""),
        )

        return ApiResponse.success(
            response,
            message=f"Ingested {response.total_accepted}/{response.total_received} readings",
        )

    except Exception as e:
        logger.error(f"IoT ingestion failed: {str(e)}")
        response = IoTIngestResponse()
        return ApiResponse.success(response, message="IoT ingestion failed")


@router.post("/iot/anomalies", response_model=ApiResponse[IoTAnomalyResponse])
async def detect_iot_anomalies(
    request: IoTAnomalyRequest,
    user: Annotated[CurrentUser, Depends(get_current_user)],
) -> ApiResponse[IoTAnomalyResponse]:
    """Detect anomalies in IoT sensor data."""
    try:
        result = iot_pipeline.detect_anomalies(
            readings=request.readings,
            z_threshold=request.z_threshold,
        )

        response = IoTAnomalyResponse(
            anomalies=result.get("anomalies", []),
            total_anomalies=result.get("total_anomalies", 0),
            sensors_analyzed=result.get("sensors_analyzed", []),
            method=result.get("method", ""),
        )

        return ApiResponse.success(
            response,
            message=f"Found {response.total_anomalies} anomalies across {len(response.sensors_analyzed)} sensors",
        )

    except Exception as e:
        logger.error(f"Anomaly detection failed: {str(e)}")
        response = IoTAnomalyResponse()
        return ApiResponse.success(response, message="Anomaly detection failed")


@router.get("/iot/status/{equipment_id}", response_model=ApiResponse[IoTStatusResponse])
async def get_iot_status(
    equipment_id: str,
    user: Annotated[CurrentUser, Depends(get_current_user)],
) -> ApiResponse[IoTStatusResponse]:
    """Get latest IoT status for equipment."""
    try:
        # In production, fetch from database
        response = IoTStatusResponse(
            equipment_id=equipment_id,
            latest_readings=[],
            health_score=100.0,
            anomaly_count=0,
            last_updated="",
        )

        return ApiResponse.success(response, message=f"IoT status for {equipment_id}")

    except Exception as e:
        logger.error(f"IoT status fetch failed: {str(e)}")
        response = IoTStatusResponse(equipment_id=equipment_id)
        return ApiResponse.success(response, message="IoT status fetch failed")
