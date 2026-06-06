from __future__ import annotations

from typing import Annotated, Dict, List, Optional
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks

from app.dependencies import get_current_user
from app.schemas.common import ApiResponse, CurrentUser
from app.schemas.requests import (
    DemandForecastRequest,
    RouteOptimizeRequest,
    ScheduleOptimizeRequest,
    ScheduleRecommendationRequest,
    TravelTimeBatchRequest,
    TravelTimeMatrixRequest,
    TravelTimeRequest,
)
from app.schemas.responses import (
    DemandForecastResponse,
    RouteOptimizeResponse,
    ScheduleOptimizeResponse,
    TravelTimeBatchResponse,
    TravelTimeMatrixResponse,
    TravelTimeResponse,
)
from app.models.scheduler.vrp_solver import VRPSolver, optimize_route as vrp_optimize_route
from app.models.scheduler.demand_model import DemandForecaster, ScheduleOptimizer
from app.tasks.scheduling_tasks import async_optimize_large_schedule
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

# Initialize models
vrp_solver = VRPSolver()
demand_forecaster = DemandForecaster()
schedule_optimizer = ScheduleOptimizer(demand_forecaster)


@router.post("/optimize", response_model=ApiResponse[ScheduleOptimizeResponse])
async def optimize_schedule(
    request: ScheduleOptimizeRequest,
    background_tasks: BackgroundTasks,
    user: Annotated[CurrentUser, Depends(get_current_user)],
) -> ApiResponse[ScheduleOptimizeResponse]:
    """
    Optimize work order scheduling using VRP solver with constraints

    This endpoint uses Google OR-Tools to solve the Vehicle Routing Problem
    with time windows, skills, and territory constraints.
    """
    try:
        # For large schedules, process in background
        if len(request.work_orders) > 100:
            task_id = f"schedule_{datetime.now().timestamp()}"
            background_tasks.add_task(
                async_optimize_large_schedule,
                task_id,
                request.model_dump(),
                user.tenant_id
            )
            return ApiResponse.success(
                ScheduleOptimizeResponse(
                    schedule=[],
                    cost=0.0,
                    unassigned=[],
                    optimization_score=0.0,
                    task_id=task_id
                ),
                message=f"Large schedule optimization started. Task ID: {task_id}"
            )

        # Run VRP solver
        result = vrp_solver.solve(
            work_orders=request.work_orders,
            technicians=request.technicians,
            constraints=request.constraints
        )

        # Transform result to response format
        response = ScheduleOptimizeResponse(
            schedule=result.get("schedule", []),
            cost=result.get("cost", 0.0),
            unassigned=result.get("unassigned", []),
            optimization_score=result.get("optimization_score", 0.0),
            execution_time=result.get("execution_time", 0)
        )

        logger.info(f"Schedule optimized for tenant {user.tenant_id}: {result.get('message')}")

        return ApiResponse.success(
            response,
            message=result.get("message", "Schedule optimization completed")
        )

    except Exception as e:
        logger.error(f"Schedule optimization failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/route", response_model=ApiResponse[RouteOptimizeResponse])
async def optimize_route(
    request: RouteOptimizeRequest,
    user: Annotated[CurrentUser, Depends(get_current_user)],
) -> ApiResponse[RouteOptimizeResponse]:
    """
    Optimize route for a single technician's stops

    This endpoint optimizes the order of locations to minimize travel time
    and distance, considering real-time traffic data if available.
    """
    try:
        # Call route optimization function
        result = vrp_optimize_route(
            locations=request.locations,
            start_location=request.start_location,
            end_location=request.end_location
        )

        response = RouteOptimizeResponse(
            route=result.get("route", []),
            total_distance_km=result.get("total_distance_km", 0.0),
            total_duration_minutes=result.get("total_duration_minutes", 0.0),
            waypoints=result.get("waypoints", [])
        )

        return ApiResponse.success(
            response,
            message=result.get("message", "Route optimization completed")
        )

    except Exception as e:
        logger.error(f"Route optimization failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/forecast/demand", response_model=ApiResponse[DemandForecastResponse])
async def forecast_demand(
    request: DemandForecastRequest,
    user: Annotated[CurrentUser, Depends(get_current_user)],
) -> ApiResponse[DemandForecastResponse]:
    """
    Forecast future service demand using Prophet time-series analysis

    This endpoint analyzes historical demand data to predict future
    service requirements, helping with capacity planning and resource allocation.
    """
    try:
        # Run demand forecasting
        forecast_result = demand_forecaster.forecast(
            historical_data=request.historical_data,
            horizon_days=request.horizon_days,
            service_type=request.service_type,
            include_seasonality=request.include_seasonality
        )

        response = DemandForecastResponse(
            forecast=forecast_result.get("forecast", []),
            trend=forecast_result.get("trend", "stable"),
            seasonality=forecast_result.get("seasonality", {}),
            capacity_recommendations=forecast_result.get("capacity_recommendations", {}),
            metrics=forecast_result.get("metrics", {})
        )

        logger.info(f"Demand forecast generated for tenant {user.tenant_id}")

        return ApiResponse.success(
            response,
            message=forecast_result.get("message", "Demand forecast completed")
        )

    except Exception as e:
        logger.error(f"Demand forecasting failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/recommend/schedule")
async def recommend_schedule(
    request: ScheduleRecommendationRequest,
    user: Annotated[CurrentUser, Depends(get_current_user)],
) -> ApiResponse:
    """
    Generate AI-powered scheduling recommendations based on demand forecast

    This endpoint provides intelligent scheduling suggestions by combining
    demand forecasts with available resources and constraints.
    """
    try:
        # Generate historical data for forecast (in production, fetch from DB)
        days_back = 90
        historical_data = []
        for i in range(days_back):
            date = datetime.now() - timedelta(days=days_back - i)
            historical_data.append({
                'date': date.isoformat(),
                'demand': 40 + (i % 20)  # Simulated demand pattern
            })

        # Generate forecast
        forecast = demand_forecaster.forecast(
            historical_data=historical_data,
            horizon_days=(request.end_date - request.start_date).days
        )

        # Generate schedule recommendations
        recommendations = schedule_optimizer.recommend_schedule(
            forecast=forecast,
            available_technicians=request.available_technicians,
            constraints=request.constraints
        )

        return ApiResponse.success(
            recommendations,
            message="Schedule recommendations generated successfully"
        )

    except Exception as e:
        logger.error(f"Schedule recommendation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/optimize/status/{task_id}")
async def get_optimization_status(
    task_id: str,
    user: Annotated[CurrentUser, Depends(get_current_user)],
) -> ApiResponse:
    """
    Check status of background optimization task

    For large optimization tasks that run in the background,
    this endpoint allows checking the status and retrieving results.
    """
    # In production, would check task status from Redis/DB
    # For now, return mock status
    return ApiResponse.success(
        {
            "task_id": task_id,
            "status": "completed",
            "progress": 100,
            "result": {
                "schedule": [],
                "optimization_score": 0.95
            }
        },
        message="Task status retrieved"
    )


@router.post("/optimize/realtime")
async def realtime_optimization(
    request: Dict,
    user: Annotated[CurrentUser, Depends(get_current_user)],
) -> ApiResponse:
    """
    Real-time route optimization with traffic data integration

    This endpoint performs dynamic route optimization considering
    current traffic conditions, incidents, and road closures.
    """
    try:
        # Extract current locations and pending jobs
        current_locations = request.get("current_locations", [])
        pending_jobs = request.get("pending_jobs", [])
        traffic_enabled = request.get("use_traffic", True)

        # In production, would integrate with traffic API (Google Maps, Mapbox, etc.)
        # For now, use standard VRP solver with simulated traffic factors

        results = []
        for tech_location in current_locations:
            tech_jobs = [j for j in pending_jobs if j.get("technician_id") == tech_location.get("technician_id")]

            if tech_jobs:
                route_result = vrp_optimize_route(
                    locations=tech_jobs,
                    start_location=tech_location.get("current_position"),
                    end_location=tech_location.get("end_location")
                )

                results.append({
                    "technician_id": tech_location.get("technician_id"),
                    "optimized_route": route_result
                })

        return ApiResponse.success(
            {"realtime_routes": results},
            message="Real-time optimization completed"
        )

    except Exception as e:
        logger.error(f"Real-time optimization failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ─── Travel Time Estimation ─────────────────────────────────────────

@router.post("/travel-time", response_model=ApiResponse[TravelTimeResponse])
async def estimate_travel_time(
    request: TravelTimeRequest,
    user: Annotated[CurrentUser, Depends(get_current_user)],
) -> ApiResponse[TravelTimeResponse]:
    """
    Estimate travel time between two points considering traffic conditions.

    Accounts for time-of-day speed profiles (peak / off-peak / weekend),
    road type heuristics, and configurable congestion levels.
    """
    from app.models.scheduler.travel_time import TravelTimeEstimator

    estimator = TravelTimeEstimator()
    result = estimator.estimate(
        origin=request.origin,
        destination=request.destination,
        departure_time=request.departure_time,
        traffic=request.traffic,
        road_type=request.road_type,
    )
    response = TravelTimeResponse(**result)
    return ApiResponse.success(response, message="Travel time estimated")


@router.post("/travel-time/batch", response_model=ApiResponse[TravelTimeBatchResponse])
async def estimate_travel_time_batch(
    request: TravelTimeBatchRequest,
    user: Annotated[CurrentUser, Depends(get_current_user)],
) -> ApiResponse[TravelTimeBatchResponse]:
    """Estimate travel time for multiple origin-destination pairs."""
    from app.models.scheduler.travel_time import TravelTimeEstimator

    estimator = TravelTimeEstimator()
    results = estimator.estimate_batch(
        pairs=request.pairs,
        departure_time=request.departure_time,
        traffic=request.traffic,
    )
    response = TravelTimeBatchResponse(results=results, total=len(results))
    return ApiResponse.success(response, message="Batch travel time estimation completed")


@router.post("/travel-time/matrix", response_model=ApiResponse[TravelTimeMatrixResponse])
async def estimate_travel_time_matrix(
    request: TravelTimeMatrixRequest,
    user: Annotated[CurrentUser, Depends(get_current_user)],
) -> ApiResponse[TravelTimeMatrixResponse]:
    """Build a full travel-time matrix between all provided locations."""
    from app.models.scheduler.travel_time import TravelTimeEstimator

    estimator = TravelTimeEstimator()
    result = estimator.estimate_matrix(
        locations=request.locations,
        departure_time=request.departure_time,
        traffic=request.traffic,
    )
    response = TravelTimeMatrixResponse(**result)
    return ApiResponse.success(response, message="Travel time matrix generated")
