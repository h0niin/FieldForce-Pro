from __future__ import annotations

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api import analytics, chatbot, documents, estimates, predictions, scheduling, service_requests, vision, voice, nlp
from app.config import Settings


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    # Startup
    settings = Settings()
    app.state.settings = settings
    yield
    # Shutdown


def create_app() -> FastAPI:
    application = FastAPI(
        title="FieldForce Pro AI Service",
        description="ML-powered microservice for scheduling, predictions, chatbot, document AI, analytics, vision, and voice.",
        version="0.1.0",
        docs_url="/api/docs",
        openapi_url="/api/openapi.json",
        lifespan=lifespan,
    )

    settings = Settings()

    application.add_middleware(
        CORSMiddleware,
        allow_origins=[settings.FRONTEND_URL],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    application.include_router(scheduling.router, prefix="/api/schedule", tags=["Scheduling"])
    application.include_router(predictions.router, prefix="/api/predict", tags=["Predictions"])
    application.include_router(chatbot.router, prefix="/api/chat", tags=["Chatbot"])
    application.include_router(documents.router, prefix="/api/documents", tags=["Documents"])
    application.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])
    application.include_router(vision.router, prefix="/api/vision", tags=["Vision"])
    application.include_router(voice.router, prefix="/api/voice", tags=["Voice"])
    application.include_router(service_requests.router, prefix="/api/service-requests", tags=["Service Requests"])
    application.include_router(estimates.router, prefix="/api/estimates", tags=["Estimates"])
    application.include_router(nlp.router, prefix="/nlp", tags=["NLP"])

    @application.get("/health")
    async def health_check() -> dict[str, str]:
        return {"status": "ok"}

    @application.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        return JSONResponse(
            status_code=500,
            content={
                "statusCode": 500,
                "status": False,
                "message": str(exc) if settings.APP_ENV == "development" else "Internal server error",
            },
        )

    return application


app = create_app()
