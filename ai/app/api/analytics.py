from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends

from app.dependencies import get_current_user
from app.schemas.common import ApiResponse, CurrentUser
from app.schemas.requests import (
    AnomalyDetectionRequest,
    ForecastRequest,
    NLQueryRequest,
    SentimentAnalysisRequest,
    SentimentBatchRequest,
)
from app.schemas.responses import (
    AnomalyDetectionResponse,
    ForecastResponse,
    NLQueryResponse,
    SentimentAnalysisResponse,
    SentimentBatchResponse,
)

router = APIRouter()


@router.post("/forecast", response_model=ApiResponse[ForecastResponse])
async def run_forecast(
    request: ForecastRequest,
    user: Annotated[CurrentUser, Depends(get_current_user)],
) -> ApiResponse[ForecastResponse]:
    result = ForecastResponse(
        predictions=[],
        confidence_interval={},
        model_accuracy=0.0,
    )
    return ApiResponse.success(result, message="Forecast placeholder")


@router.post("/anomaly", response_model=ApiResponse[AnomalyDetectionResponse])
async def detect_anomalies(
    request: AnomalyDetectionRequest,
    user: Annotated[CurrentUser, Depends(get_current_user)],
) -> ApiResponse[AnomalyDetectionResponse]:
    result = AnomalyDetectionResponse(
        anomalies=[],
        total_anomalies=0,
        severity_distribution={},
    )
    return ApiResponse.success(result, message="Anomaly detection placeholder")


@router.post("/nl-query", response_model=ApiResponse[NLQueryResponse])
async def natural_language_query(
    request: NLQueryRequest,
    user: Annotated[CurrentUser, Depends(get_current_user)],
) -> ApiResponse[NLQueryResponse]:
    from app.models.nlp.nl_query import NLQueryEngine

    engine = NLQueryEngine()
    result_dict = await engine.query(
        natural_language=request.query,
        context=request.context,
    )
    result = NLQueryResponse(**result_dict)
    return ApiResponse.success(result, message="NL query processed")


@router.post("/sentiment", response_model=ApiResponse[SentimentAnalysisResponse])
async def analyze_sentiment(
    request: SentimentAnalysisRequest,
    user: Annotated[CurrentUser, Depends(get_current_user)],
) -> ApiResponse[SentimentAnalysisResponse]:
    from app.models.nlp.sentiment import SentimentAnalyzer

    analyzer = SentimentAnalyzer()
    result_dict = analyzer.analyze(request.text)
    result = SentimentAnalysisResponse(**result_dict)
    return ApiResponse.success(result, message="Sentiment analysis completed")


@router.post("/sentiment/batch", response_model=ApiResponse[SentimentBatchResponse])
async def analyze_sentiment_batch(
    request: SentimentBatchRequest,
    user: Annotated[CurrentUser, Depends(get_current_user)],
) -> ApiResponse[SentimentBatchResponse]:
    from app.models.nlp.sentiment import SentimentAnalyzer

    analyzer = SentimentAnalyzer()
    results = analyzer.analyze_batch(request.texts)

    # Calculate average scores
    avg_scores: dict[str, float] = {"positive": 0.0, "neutral": 0.0, "negative": 0.0}
    for r in results:
        for k, v in r.get("scores", {}).items():
            avg_scores[k] = avg_scores.get(k, 0.0) + v
    if results:
        avg_scores = {k: round(v / len(results), 3) for k, v in avg_scores.items()}

    result = SentimentBatchResponse(
        results=results,
        total=len(results),
        average_sentiment=avg_scores,
    )
    return ApiResponse.success(result, message="Batch sentiment analysis completed")
