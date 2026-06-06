from __future__ import annotations

from datetime import datetime
from pydantic import BaseModel


# --- Scheduling ---

class ScheduleOptimizeRequest(BaseModel):
    work_orders: list[dict]
    technicians: list[dict]
    constraints: dict | None = None
    date_range: dict | None = None


class RouteOptimizeRequest(BaseModel):
    technician_id: str
    locations: list[dict]
    start_location: dict | None = None
    end_location: dict | None = None
    time_windows: list[dict] | None = None


# --- Predictions ---

class MaintenancePredictionRequest(BaseModel):
    equipment_id: str
    sensor_data: list[dict] | None = None
    historical_data: list[dict] | None = None


class DemandForecastRequest(BaseModel):
    service_type: str | None = None
    region: str | None = None
    horizon_days: int = 30
    historical_data: list[dict] | None = None
    include_seasonality: bool = True


class ScheduleRecommendationRequest(BaseModel):
    forecast_id: str | None = None
    start_date: datetime
    end_date: datetime
    available_technicians: list[dict] = []
    constraints: dict | None = None


class LSTMPredictionRequest(BaseModel):
    equipment_id: str
    sensor_data: list[dict] | None = None
    historical_data: list[dict] | None = None


class ProphetPredictionRequest(BaseModel):
    equipment_id: str
    historical_data: list[dict] | None = None
    horizon_days: int = 90


class EnsemblePredictionRequest(BaseModel):
    equipment_id: str
    sensor_data: list[dict] | None = None
    historical_data: list[dict] | None = None
    horizon_days: int = 90
    lstm_weight: float = 0.5
    prophet_weight: float = 0.5


class HealthScoreBatchRequest(BaseModel):
    equipment_list: list[dict]


class IoTIngestRequest(BaseModel):
    sensor_readings: list[dict]
    equipment_id: str | None = None


class IoTAnomalyRequest(BaseModel):
    readings: list[dict]
    z_threshold: float = 2.5


# --- Chatbot ---

class ChatMessageRequest(BaseModel):
    message: str
    session_id: str | None = None
    context: dict | None = None


# --- Documents ---

class DocumentParseRequest(BaseModel):
    document_type: str | None = None
    extract_fields: list[str] | None = None


class ReportGenerateRequest(BaseModel):
    report_type: str
    parameters: dict | None = None
    date_range: dict | None = None
    format: str = "pdf"


# --- Analytics ---

class ForecastRequest(BaseModel):
    metric: str
    horizon_days: int = 30
    granularity: str = "daily"
    filters: dict | None = None


class AnomalyDetectionRequest(BaseModel):
    metric: str
    data_points: list[dict] | None = None
    sensitivity: float = 0.5
    lookback_days: int = 90


class NLQueryRequest(BaseModel):
    query: str
    context: dict | None = None


# --- Chatbot Extended ---

class ChatSessionRequest(BaseModel):
    session_id: str

class KnowledgeIngestRequest(BaseModel):
    documents: list[dict]
    collection: str = "fieldforce_knowledge"

# --- Documents Extended ---

class InvoiceParseRequest(BaseModel):
    document_type: str = "invoice"
    extract_fields: list[str] | None = None

# --- Analytics Extended ---

class SentimentAnalysisRequest(BaseModel):
    text: str

class SentimentBatchRequest(BaseModel):
    texts: list[str]

class NLQueryWithContextRequest(BaseModel):
    query: str
    tenant_id: str = ""
    context: dict | None = None


# --- Vision ---

class WorkVerificationRequest(BaseModel):
    work_order_id: str
    verification_type: str | None = None


class EquipmentDetectionRequest(BaseModel):
    equipment_type: str | None = None


# --- Voice ---

class VoiceTranscribeRequest(BaseModel):
    language: str = "en"
    task: str = "transcribe"


class BeforeAfterCompareRequest(BaseModel):
    work_order_id: str = ""


# --- Service Requests NLP ---

class CategorizationRequest(BaseModel):
    text: str


class CategorizationBatchRequest(BaseModel):
    texts: list[str]


class PrioritySuggestionRequest(BaseModel):
    text: str


class PrioritySuggestionBatchRequest(BaseModel):
    texts: list[str]


# --- Estimate Generation ---

class EstimateGenerationRequest(BaseModel):
    description: str
    include_travel: bool = True


class EstimateGenerationBatchRequest(BaseModel):
    descriptions: list[str]
    include_travel: bool = True


# --- Travel Time ---

class TravelTimeRequest(BaseModel):
    origin: dict
    destination: dict
    departure_time: str | None = None
    traffic: str = "moderate"
    road_type: str | None = None


class TravelTimeBatchRequest(BaseModel):
    pairs: list[dict]
    departure_time: str | None = None
    traffic: str = "moderate"


class TravelTimeMatrixRequest(BaseModel):
    locations: list[dict]
    departure_time: str | None = None
    traffic: str = "moderate"
