from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends

from app.dependencies import get_current_user
from app.schemas.common import ApiResponse, CurrentUser
from app.schemas.requests import (
    CategorizationBatchRequest,
    CategorizationRequest,
    PrioritySuggestionBatchRequest,
    PrioritySuggestionRequest,
)
from app.schemas.responses import (
    CategorizationBatchResponse,
    CategorizationResponse,
    PrioritySuggestionBatchResponse,
    PrioritySuggestionResponse,
    ServiceRequestAnalysisResponse,
)

router = APIRouter()


@router.post("/categorize", response_model=ApiResponse[CategorizationResponse])
async def categorize_request(
    request: CategorizationRequest,
    user: Annotated[CurrentUser, Depends(get_current_user)],
) -> ApiResponse[CategorizationResponse]:
    """Auto-categorize a service request description."""
    from app.models.nlp.categorizer import RequestCategorizer

    categorizer = RequestCategorizer()
    result_dict = categorizer.categorize(request.text)
    result = CategorizationResponse(**result_dict)
    return ApiResponse.success(result, message="Categorization completed")


@router.post("/categorize/batch", response_model=ApiResponse[CategorizationBatchResponse])
async def categorize_request_batch(
    request: CategorizationBatchRequest,
    user: Annotated[CurrentUser, Depends(get_current_user)],
) -> ApiResponse[CategorizationBatchResponse]:
    """Auto-categorize multiple service request descriptions."""
    from app.models.nlp.categorizer import RequestCategorizer

    categorizer = RequestCategorizer()
    results = categorizer.categorize_batch(request.texts)
    result = CategorizationBatchResponse(results=results, total=len(results))
    return ApiResponse.success(result, message="Batch categorization completed")


@router.post("/suggest-priority", response_model=ApiResponse[PrioritySuggestionResponse])
async def suggest_priority(
    request: PrioritySuggestionRequest,
    user: Annotated[CurrentUser, Depends(get_current_user)],
) -> ApiResponse[PrioritySuggestionResponse]:
    """Suggest priority for a service request based on sentiment and urgency."""
    from app.models.nlp.priority_suggester import PrioritySuggester

    suggester = PrioritySuggester()
    result_dict = suggester.suggest(request.text)
    result = PrioritySuggestionResponse(**result_dict)
    return ApiResponse.success(result, message="Priority suggestion completed")


@router.post("/suggest-priority/batch", response_model=ApiResponse[PrioritySuggestionBatchResponse])
async def suggest_priority_batch(
    request: PrioritySuggestionBatchRequest,
    user: Annotated[CurrentUser, Depends(get_current_user)],
) -> ApiResponse[PrioritySuggestionBatchResponse]:
    """Suggest priority for multiple service requests."""
    from app.models.nlp.priority_suggester import PrioritySuggester

    suggester = PrioritySuggester()
    results = suggester.suggest_batch(request.texts)
    result = PrioritySuggestionBatchResponse(results=results, total=len(results))
    return ApiResponse.success(result, message="Batch priority suggestion completed")


@router.post("/analyze", response_model=ApiResponse[ServiceRequestAnalysisResponse])
async def analyze_request(
    request: CategorizationRequest,
    user: Annotated[CurrentUser, Depends(get_current_user)],
) -> ApiResponse[ServiceRequestAnalysisResponse]:
    """Combined analysis: categorize and suggest priority in one call."""
    from app.models.nlp.categorizer import RequestCategorizer
    from app.models.nlp.priority_suggester import PrioritySuggester

    categorizer = RequestCategorizer()
    suggester = PrioritySuggester()

    cat_dict = categorizer.categorize(request.text)
    pri_dict = suggester.suggest(request.text)

    result = ServiceRequestAnalysisResponse(
        categorization=CategorizationResponse(**cat_dict),
        priority_suggestion=PrioritySuggestionResponse(**pri_dict),
    )
    return ApiResponse.success(result, message="Service request analysis completed")
