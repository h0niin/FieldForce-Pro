from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, File, UploadFile

from app.dependencies import get_current_user
from app.schemas.common import ApiResponse, CurrentUser
from app.schemas.requests import ReportGenerateRequest
from app.schemas.responses import DocumentParseResponse, InvoiceParseResponse, ReportGenerateResponse

router = APIRouter()


def _get_parser():
    from app.models.nlp.document_parser import DocumentParser
    return DocumentParser()


def _get_report_generator():
    from app.models.nlp.report_generator import ReportGenerator
    return ReportGenerator()


@router.post("/parse", response_model=ApiResponse[DocumentParseResponse])
async def parse_document(
    file: Annotated[UploadFile, File(description="Document file to parse")],
    user: Annotated[CurrentUser, Depends(get_current_user)],
) -> ApiResponse[DocumentParseResponse]:
    parser = _get_parser()
    file_bytes = await file.read()
    filename = file.filename or "unknown"

    file_type = "pdf" if filename.lower().endswith(".pdf") else "image"
    result_dict = parser.parse_general(file_bytes, file_type=file_type)

    result = DocumentParseResponse(
        extracted_text=result_dict.get("extracted_text", ""),
        fields=result_dict.get("fields", {}),
        confidence=result_dict.get("confidence", 0.0),
        pages=result_dict.get("pages", 0),
    )
    return ApiResponse.success(result, message=f"Document parsed: {filename}")


@router.post("/parse/invoice", response_model=ApiResponse[InvoiceParseResponse])
async def parse_invoice(
    file: Annotated[UploadFile, File(description="Invoice file to parse")],
    user: Annotated[CurrentUser, Depends(get_current_user)],
) -> ApiResponse[InvoiceParseResponse]:
    parser = _get_parser()
    file_bytes = await file.read()
    filename = file.filename or "unknown"

    file_type = "pdf" if filename.lower().endswith(".pdf") else "image"
    result_dict = parser.parse_invoice(file_bytes, file_type=file_type)

    result = InvoiceParseResponse(
        extracted_text=result_dict.get("extracted_text", ""),
        fields=result_dict.get("fields", {}),
        confidence=result_dict.get("confidence", 0.0),
        pages=result_dict.get("pages", 0),
        raw_lines=result_dict.get("raw_lines", []),
    )
    return ApiResponse.success(result, message=f"Invoice parsed: {filename}")


@router.post("/generate", response_model=ApiResponse[ReportGenerateResponse])
async def generate_report(
    request: ReportGenerateRequest,
    user: Annotated[CurrentUser, Depends(get_current_user)],
) -> ApiResponse[ReportGenerateResponse]:
    generator = _get_report_generator()
    result_dict = await generator.generate(
        report_type=request.report_type,
        parameters={
            "date_range": request.date_range,
            "format": request.format,
        },
    )
    result = ReportGenerateResponse(
        report_url="",
        report_type=result_dict.get("report_type", request.report_type),
        generated_at=result_dict.get("generated_at", ""),
    )
    return ApiResponse.success(result, message="Report generated")
