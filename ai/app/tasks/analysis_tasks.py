from __future__ import annotations

import logging

from app.tasks.celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(name="app.tasks.analysis_tasks.run_anomaly_detection")
def run_anomaly_detection(
    metric: str,
    data_points: list[dict] | None = None,
    sensitivity: float = 0.5,
) -> dict:
    logger.info("Running anomaly detection for metric: %s", metric)
    return {
        "anomalies": [],
        "total_anomalies": 0,
        "severity_distribution": {},
        "message": "Anomaly detection placeholder",
    }


@celery_app.task(name="app.tasks.analysis_tasks.run_forecast_batch")
def run_forecast_batch(
    metrics: list[str],
    horizon_days: int = 30,
) -> dict:
    logger.info("Running batch forecast for %d metrics", len(metrics))
    return {
        "forecasts": {m: [] for m in metrics},
        "message": "Batch forecast placeholder",
    }


@celery_app.task(name="app.tasks.analysis_tasks.run_sentiment_batch")
def run_sentiment_batch(texts: list[str]) -> dict:
    logger.info("Running batch sentiment analysis for %d texts", len(texts))
    from app.models.nlp.sentiment import SentimentAnalyzer

    analyzer = SentimentAnalyzer()
    results = [analyzer.analyze(t) for t in texts]
    return {"results": results, "total": len(results)}


@celery_app.task(name="app.tasks.analysis_tasks.run_batch_health_scoring")
def run_batch_health_scoring(
    equipment_list: list[dict],
    tenant_id: str = "",
) -> dict:
    """Score all equipment health for a tenant."""
    logger.info("Running batch health scoring for tenant: %s, %d equipment", tenant_id, len(equipment_list))
    from app.models.maintenance.health_scorer import HealthScorer

    scorer = HealthScorer()
    results = []
    for equipment in equipment_list:
        result = scorer.score(
            equipment_id=equipment.get("equipment_id", ""),
            historical_data=equipment.get("historical_data"),
            sensor_data=equipment.get("sensor_data"),
        )
        results.append(result)

    return {
        "results": results,
        "total_scored": len(results),
        "tenant_id": tenant_id,
    }


@celery_app.task(name="app.tasks.analysis_tasks.run_failure_prediction_batch")
def run_failure_prediction_batch(
    equipment_list: list[dict],
    tenant_id: str = "",
) -> dict:
    """Run failure predictions for all equipment."""
    logger.info("Running failure prediction batch for tenant: %s, %d equipment", tenant_id, len(equipment_list))
    from app.models.maintenance.lstm_predictor import LSTMPredictor
    from app.models.maintenance.auto_wo_trigger import AutoWOTrigger

    predictor = LSTMPredictor()
    trigger = AutoWOTrigger()
    predictions = []
    wo_candidates = []

    for equipment in equipment_list:
        prediction = predictor.predict(
            sensor_data=equipment.get("sensor_data"),
            equipment_id=equipment.get("equipment_id", ""),
            historical_data=equipment.get("historical_data"),
        )
        predictions.append(prediction)

        wo_eval = trigger.evaluate(prediction, equipment)
        if wo_eval.get("should_create_wo"):
            wo_candidates.append(wo_eval)

    return {
        "predictions": predictions,
        "total_predicted": len(predictions),
        "wo_candidates": wo_candidates,
        "tenant_id": tenant_id,
    }


@celery_app.task(name="app.tasks.analysis_tasks.process_iot_data_batch")
def process_iot_data_batch(
    sensor_readings: list[dict],
    tenant_id: str = "",
) -> dict:
    """Process large IoT data batches."""
    logger.info("Processing IoT batch for tenant: %s, %d readings", tenant_id, len(sensor_readings))
    from app.models.maintenance.iot_pipeline import IoTPipeline

    pipeline = IoTPipeline()
    ingest_result = pipeline.ingest(sensor_readings)
    anomaly_result = pipeline.detect_anomalies(ingest_result.get("readings", []))
    aggregation_result = pipeline.aggregate(ingest_result.get("readings", []))

    return {
        "ingest": ingest_result,
        "anomalies": anomaly_result,
        "aggregation": aggregation_result,
        "tenant_id": tenant_id,
    }


@celery_app.task(name="app.tasks.analysis_tasks.run_document_parse_batch")
def run_document_parse_batch(
    file_paths: list[str],
    document_type: str = "general",
) -> dict:
    """Parse multiple documents in batch."""
    logger.info("Parsing batch of %d documents", len(file_paths))
    from app.models.nlp.document_parser import DocumentParser

    parser = DocumentParser()
    results = []
    for path in file_paths:
        try:
            with open(path, "rb") as f:
                file_bytes = f.read()
            file_type = "pdf" if path.lower().endswith(".pdf") else "image"
            if document_type == "invoice":
                result = parser.parse_invoice(file_bytes, file_type=file_type)
            else:
                result = parser.parse_general(file_bytes, file_type=file_type)
            results.append({"path": path, "status": "success", **result})
        except Exception as e:
            results.append({"path": path, "status": "error", "error": str(e)})

    return {"results": results, "total": len(results)}


@celery_app.task(name="app.tasks.analysis_tasks.run_nl_query")
def run_nl_query(
    query: str,
    tenant_id: str = "",
) -> dict:
    """Run NL-to-SQL query (async)."""
    logger.info("Running NL query: %s", query[:50])
    import asyncio
    from app.models.nlp.nl_query import NLQueryEngine

    engine = NLQueryEngine()
    loop = asyncio.new_event_loop()
    try:
        result = loop.run_until_complete(
            engine.query(query, context={"tenant_id": tenant_id})
        )
    finally:
        loop.close()
    return result
