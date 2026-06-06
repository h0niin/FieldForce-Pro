from __future__ import annotations

from celery import Celery

from app.config import Settings

settings = Settings()

celery_app = Celery(
    "fieldforce_ai",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_routes={
        "app.tasks.scheduling_tasks.*": {"queue": "scheduling"},
        "app.tasks.training_tasks.*": {"queue": "training"},
        "app.tasks.analysis_tasks.*": {"queue": "analysis"},
        "app.tasks.prediction_tasks.*": {"queue": "predictions"},
    },
    task_default_queue="default",
)
