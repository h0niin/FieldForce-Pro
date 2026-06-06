from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends

from app.dependencies import get_current_user
from app.schemas.common import ApiResponse, CurrentUser
from app.schemas.requests import (
    EstimateGenerationBatchRequest,
    EstimateGenerationRequest,
)
from app.schemas.responses import (
    EstimateGenerationBatchResponse,
    EstimateGenerationResponse,
)

router = APIRouter()


@router.post("/generate", response_model=ApiResponse[EstimateGenerationResponse])
async def generate_estimate(
    request: EstimateGenerationRequest,
    user: Annotated[CurrentUser, Depends(get_current_user)],
) -> ApiResponse[EstimateGenerationResponse]:
    """Generate an estimate from a service request description using AI."""
    from app.models.nlp.estimate_generator import EstimateGenerator

    generator = EstimateGenerator()
    result_dict = generator.generate(request.description, include_travel=request.include_travel)
    result = EstimateGenerationResponse(**result_dict)
    return ApiResponse.success(result, message="Estimate generated successfully")


@router.post("/generate/batch", response_model=ApiResponse[EstimateGenerationBatchResponse])
async def generate_estimate_batch(
    request: EstimateGenerationBatchRequest,
    user: Annotated[CurrentUser, Depends(get_current_user)],
) -> ApiResponse[EstimateGenerationBatchResponse]:
    """Generate estimates for multiple service request descriptions."""
    from app.models.nlp.estimate_generator import EstimateGenerator

    generator = EstimateGenerator()
    results = generator.generate_batch(request.descriptions, include_travel=request.include_travel)
    result = EstimateGenerationBatchResponse(results=results, total=len(results))
    return ApiResponse.success(result, message="Batch estimate generation completed")
