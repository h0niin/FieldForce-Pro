from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, UploadFile

from app.dependencies import get_current_user
from app.schemas.common import ApiResponse, CurrentUser
from app.schemas.responses import (
    BeforeAfterCompareResponse,
    EquipmentDetectionResponse,
    WorkVerificationResponse,
)

router = APIRouter()


def _get_verifier():
    from app.models.vision.work_verifier import WorkVerifier
    return WorkVerifier()


def _get_detector():
    from app.models.vision.equipment_detector import EquipmentDetector
    return EquipmentDetector()


def _get_comparator():
    from app.models.vision.before_after import BeforeAfterComparator
    return BeforeAfterComparator()


@router.post("/verify-work", response_model=ApiResponse[WorkVerificationResponse])
async def verify_work(
    file: Annotated[UploadFile, File(description="Photo for work verification")],
    user: Annotated[CurrentUser, Depends(get_current_user)],
    work_order_id: str = Form(""),
    verification_type: str = Form(""),
) -> ApiResponse[WorkVerificationResponse]:
    verifier = _get_verifier()
    image_bytes = await file.read()
    result_dict = verifier.verify(image_bytes, work_order_id=work_order_id, verification_type=verification_type)
    result = WorkVerificationResponse(
        verified=result_dict.get("verified", False),
        confidence=result_dict.get("confidence", 0.0),
        findings=result_dict.get("findings", []),
        issues=result_dict.get("issues", []),
    )
    return ApiResponse.success(result, message="Work verification completed")


@router.post("/identify-equipment", response_model=ApiResponse[EquipmentDetectionResponse])
async def identify_equipment(
    file: Annotated[UploadFile, File(description="Photo for equipment identification")],
    user: Annotated[CurrentUser, Depends(get_current_user)],
    equipment_type: str = Form(""),
) -> ApiResponse[EquipmentDetectionResponse]:
    detector = _get_detector()
    image_bytes = await file.read()
    result_dict = detector.detect(image_bytes, equipment_type=equipment_type or None)
    result = EquipmentDetectionResponse(
        detections=result_dict.get("detections", []),
        equipment_count=result_dict.get("equipment_count", 0),
        labels=result_dict.get("labels", []),
    )
    return ApiResponse.success(result, message="Equipment identification completed")


@router.post("/compare-before-after", response_model=ApiResponse[BeforeAfterCompareResponse])
async def compare_before_after(
    before: Annotated[UploadFile, File(description="Before photo")],
    after: Annotated[UploadFile, File(description="After photo")],
    user: Annotated[CurrentUser, Depends(get_current_user)],
    work_order_id: str = Form(""),
) -> ApiResponse[BeforeAfterCompareResponse]:
    comparator = _get_comparator()
    before_bytes = await before.read()
    after_bytes = await after.read()
    result_dict = comparator.compare(before_bytes, after_bytes, work_order_id=work_order_id)
    result = BeforeAfterCompareResponse(
        work_order_id=work_order_id,
        significant_change=result_dict.get("significant_change", False),
        change_percentage=result_dict.get("change_percentage", 0.0),
        similarity_score=result_dict.get("similarity_score", 0.0),
        ssim_score=result_dict.get("ssim_score"),
        color_similarity=result_dict.get("color_similarity", 0.0),
        changed_regions=result_dict.get("changed_regions", []),
        analysis=result_dict.get("analysis", ""),
    )
    return ApiResponse.success(result, message="Before/after comparison completed")
