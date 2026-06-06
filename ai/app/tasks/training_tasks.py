from __future__ import annotations

import logging

from app.tasks.celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(name="app.tasks.training_tasks.retrain_demand_model")
def retrain_demand_model(training_data_path: str | None = None) -> dict:
    logger.info("Retraining demand model with data from: %s", training_data_path)
    # Placeholder: load data, train Prophet model, save to model registry
    return {"status": "placeholder", "message": "Demand model retraining not implemented"}


@celery_app.task(name="app.tasks.training_tasks.retrain_lstm_model")
def retrain_lstm_model(training_data_path: str | None = None) -> dict:
    logger.info("Retraining LSTM model with data from: %s", training_data_path)
    # Placeholder: load sensor data, train LSTM, save weights
    return {"status": "placeholder", "message": "LSTM model retraining not implemented"}


@celery_app.task(name="app.tasks.training_tasks.retrain_health_scorer")
def retrain_health_scorer(training_data_path: str | None = None) -> dict:
    logger.info("Retraining health scorer with data from: %s", training_data_path)
    # Placeholder: load maintenance records, train sklearn model, save
    return {"status": "placeholder", "message": "Health scorer retraining not implemented"}
