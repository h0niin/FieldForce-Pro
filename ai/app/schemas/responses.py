from __future__ import annotations

from pydantic import BaseModel


# --- Scheduling ---

class ScheduleOptimizeResponse(BaseModel):
    schedule: list[dict] = []
    cost: float = 0.0
    unassigned: list[str] = []
    optimization_score: float = 0.0


class RouteOptimizeResponse(BaseModel):
    route: list[dict] = []
    total_distance_km: float = 0.0
    total_duration_minutes: float = 0.0
    waypoints: list[dict] = []


# --- Predictions ---

class FailurePrediction(BaseModel):
    equipment_id: str = ""
    failure_probability: float = 0.0
    predicted_failure_date: str | None = None
    recommended_action: str = ""
    health_score: float = 100.0


class DemandForecastResponse(BaseModel):
    forecast: list[dict] = []
    confidence_interval: dict = {}
    trend: str = "stable"
    seasonality: dict = {}
    capacity_recommendations: dict = {}
    metrics: dict = {}


class LSTMPredictionResponse(BaseModel):
    equipment_id: str = ""
    failure_probability: float = 0.0
    predicted_failure_date: str | None = None
    recommended_action: str = ""
    health_score: float = 100.0
    model_type: str = "lstm"
    confidence: float = 0.0
    factors: list[str] = []


class ProphetPredictionResponse(BaseModel):
    equipment_id: str = ""
    failure_probability: float = 0.0
    predicted_failure_date: str | None = None
    recommended_action: str = ""
    health_score: float = 100.0
    model_type: str = "prophet"
    confidence: float = 0.0
    forecast: list[dict] = []
    seasonal_components: dict = {}


class EnsemblePredictionResponse(BaseModel):
    equipment_id: str = ""
    failure_probability: float = 0.0
    predicted_failure_date: str | None = None
    recommended_action: str = ""
    health_score: float = 100.0
    model_type: str = "ensemble"
    confidence: float = 0.0
    lstm_result: dict = {}
    prophet_result: dict = {}


class HealthScoreBatchResponse(BaseModel):
    results: list[dict] = []
    total_scored: int = 0
    average_health: float = 0.0
    risk_distribution: dict = {}


class IoTIngestResponse(BaseModel):
    total_received: int = 0
    total_accepted: int = 0
    total_rejected: int = 0
    errors: list[str] = []
    processed_at: str = ""


class IoTAnomalyResponse(BaseModel):
    anomalies: list[dict] = []
    total_anomalies: int = 0
    sensors_analyzed: list[str] = []
    method: str = ""


class IoTStatusResponse(BaseModel):
    equipment_id: str = ""
    latest_readings: list[dict] = []
    health_score: float = 100.0
    anomaly_count: int = 0
    last_updated: str = ""


# --- Chatbot ---

class ChatMessageResponse(BaseModel):
    reply: str = ""
    session_id: str = ""
    sources: list[dict] = []
    suggested_actions: list[str] = []


# --- Documents ---

class DocumentParseResponse(BaseModel):
    extracted_text: str = ""
    fields: dict = {}
    confidence: float = 0.0
    pages: int = 0


class ReportGenerateResponse(BaseModel):
    report_url: str = ""
    report_type: str = ""
    generated_at: str = ""


# --- Analytics ---

class ForecastResponse(BaseModel):
    predictions: list[dict] = []
    confidence_interval: dict = {}
    model_accuracy: float = 0.0


class AnomalyDetectionResponse(BaseModel):
    anomalies: list[dict] = []
    total_anomalies: int = 0
    severity_distribution: dict = {}


class NLQueryResponse(BaseModel):
    sql_query: str = ""
    results: list[dict] = []
    explanation: str = ""
    visualization_hint: str | None = None


# --- Chatbot Extended ---

class ChatSessionResponse(BaseModel):
    session_id: str = ""
    history: list[dict] = []
    message_count: int = 0

class KnowledgeIngestResponse(BaseModel):
    ingested: int = 0
    total: int = 0
    collection: str = ""

# --- Documents Extended ---

class InvoiceParseResponse(BaseModel):
    extracted_text: str = ""
    fields: dict = {}
    confidence: float = 0.0
    pages: int = 0
    raw_lines: list[str] = []

# --- Analytics Extended ---

class SentimentAnalysisResponse(BaseModel):
    text: str = ""
    sentiment: str = "neutral"
    confidence: float = 0.0
    scores: dict = {}
    method: str = ""

class SentimentBatchResponse(BaseModel):
    results: list[dict] = []
    total: int = 0
    average_sentiment: dict = {}


# --- Vision ---

class WorkVerificationResponse(BaseModel):
    verified: bool = False
    confidence: float = 0.0
    findings: list[dict] = []
    issues: list[str] = []


class EquipmentDetectionResponse(BaseModel):
    detections: list[dict] = []
    equipment_count: int = 0
    labels: list[str] = []


# --- Voice ---

class VoiceTranscribeResponse(BaseModel):
    text: str = ""
    language: str = ""
    duration_seconds: float = 0.0
    segments: list[dict] = []


class BeforeAfterCompareResponse(BaseModel):
    work_order_id: str = ""
    significant_change: bool = False
    change_percentage: float = 0.0
    similarity_score: float = 0.0
    ssim_score: float | None = None
    color_similarity: float = 0.0
    changed_regions: list[dict] = []
    analysis: str = ""


class LanguageDetectionResponse(BaseModel):
    language: str = ""
    confidence: float = 0.0
    top_languages: dict = {}


# --- Service Requests NLP ---

class CategorizationResponse(BaseModel):
    text: str = ""
    category: str = "General"
    confidence: float = 0.0
    all_scores: dict = {}
    method: str = ""


class CategorizationBatchResponse(BaseModel):
    results: list[dict] = []
    total: int = 0


class PrioritySuggestionResponse(BaseModel):
    text: str = ""
    suggested_priority: str = "medium"
    confidence: float = 0.0
    sentiment: str = "neutral"
    urgency_detected: bool = False
    reasoning: str = ""


class PrioritySuggestionBatchResponse(BaseModel):
    results: list[dict] = []
    total: int = 0


class ServiceRequestAnalysisResponse(BaseModel):
    categorization: CategorizationResponse = CategorizationResponse()
    priority_suggestion: PrioritySuggestionResponse = PrioritySuggestionResponse()


# --- Estimate Generation ---

class EstimateLineItemResponse(BaseModel):
    type: str = "service"
    name: str = ""
    description: str = ""
    quantity: int | float = 1
    unit_price: float = 0.0
    tax_rate: float = 0.0
    discount: float = 0.0
    total: float = 0.0
    sort_order: int = 1
    duration_minutes: int = 0


class EstimateGenerationResponse(BaseModel):
    description: str = ""
    category: str = "General"
    priority: str = "low"
    line_items: list[dict] = []
    subtotal: float = 0.0
    tax: float = 0.0
    total: float = 0.0
    confidence: float = 0.0
    reasoning: str = ""
    estimated_duration_minutes: int = 0


class EstimateGenerationBatchResponse(BaseModel):
    results: list[dict] = []
    total: int = 0


# --- Travel Time ---

class TravelTimeResponse(BaseModel):
    origin: dict = {}
    destination: dict = {}
    straight_line_distance_km: float = 0.0
    road_distance_km: float = 0.0
    duration_minutes: float = 0.0
    speed_kmh: float = 0.0
    traffic: str = "moderate"
    traffic_multiplier: float = 1.0
    period: str = ""
    road_type: str = ""
    departure_time: str = ""
    method: str = ""


class TravelTimeBatchResponse(BaseModel):
    results: list[dict] = []
    total: int = 0


class TravelTimeMatrixResponse(BaseModel):
    matrix: list[list[float]] = []
    distances: list[list[float]] = []
    locations_count: int = 0
    traffic: str = "moderate"
    method: str = ""
