"""
AI Route Optimization API Endpoints
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import List, Optional, Tuple
from datetime import datetime

from app.services.route_optimizer import route_optimizer
from app.schemas.common import ApiResponse

router = APIRouter(prefix="/api/routes", tags=["Route Optimization"])


class LocationModel(BaseModel):
    """Location coordinates"""
    lat: float = Field(..., description="Latitude")
    lng: float = Field(..., description="Longitude")
    address: Optional[str] = Field(None, description="Address string")


class AgentModel(BaseModel):
    """Agent information for route optimization"""
    id: str = Field(..., description="Agent ID")
    name: str = Field(..., description="Agent name")
    location: LocationModel = Field(..., description="Current location")
    available: bool = Field(True, description="Agent availability")
    max_appointments: int = Field(8, description="Max appointments per day")


class AppointmentModel(BaseModel):
    """Appointment information for route optimization"""
    id: str = Field(..., description="Appointment ID")
    location: LocationModel = Field(..., description="Service location")
    agent_id: Optional[str] = Field(None, description="Assigned agent ID")
    scheduled_start: datetime = Field(..., description="Scheduled start time")
    scheduled_end: datetime = Field(..., description="Scheduled end time")
    priority: str = Field("normal", description="Priority: low, normal, high, urgent")
    duration_minutes: int = Field(60, description="Estimated duration")
    distance: Optional[float] = Field(None, description="Distance from previous location")


class OptimizeRoutesRequest(BaseModel):
    """Request for route optimization"""
    agents: List[AgentModel] = Field(..., description="List of agents")
    appointments: List[AppointmentModel] = Field(..., description="List of appointments")
    start_location: Optional[LocationModel] = Field(None, description="Depot/office location")
    optimize_for: str = Field("time", description="Optimization goal: time, distance, or balanced")


class TripAnalysisRequest(BaseModel):
    """Request for trip analysis"""
    trip_id: str = Field(..., description="Trip ID")
    distance_km: float = Field(..., description="Actual distance traveled")
    duration_minutes: float = Field(..., description="Actual duration")
    route_points: Optional[List[LocationModel]] = Field(None, description="GPS route points")


class TravelTimeRequest(BaseModel):
    """Request for travel time prediction"""
    origin: LocationModel = Field(..., description="Start location")
    destination: LocationModel = Field(..., description="End location")
    departure_time: Optional[datetime] = Field(None, description="Departure time")


@router.post("/optimize", response_model=ApiResponse)
async def optimize_routes(request: OptimizeRoutesRequest):
    """
    Optimize routes for multiple agents and appointments using AI

    This endpoint uses advanced algorithms (OR-Tools VRP) to:
    - Minimize total travel distance
    - Minimize total travel time
    - Respect time windows and agent availability
    - Balance workload across agents
    - Consider traffic patterns

    Returns optimized routes with estimated savings and recommendations.
    """
    try:
        # Convert Pydantic models to dicts
        agents_data = [agent.model_dump() for agent in request.agents]
        appointments_data = [apt.model_dump() for apt in request.appointments]

        start_loc = None
        if request.start_location:
            start_loc = (request.start_location.lat, request.start_location.lng)

        result = await route_optimizer.optimize_routes(
            agents=agents_data,
            appointments=appointments_data,
            start_location=start_loc
        )

        if result.get("status") == "error":
            raise HTTPException(status_code=500, detail=result.get("error", "Optimization failed"))

        return ApiResponse(
            statusCode=200,
            status="success",
            message="Routes optimized successfully",
            data=result
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Route optimization failed: {str(e)}")


@router.post("/analyze-trip", response_model=ApiResponse)
async def analyze_trip(request: TripAnalysisRequest):
    """
    Analyze a completed trip and provide efficiency insights

    Provides:
    - Route efficiency score
    - Comparison with optimal route
    - Fuel efficiency analysis
    - Traffic impact assessment
    - Recommendations for future trips
    """
    try:
        trip_data = request.model_dump()
        result = await route_optimizer.analyze_route_efficiency(trip_data)

        if result.get("status") == "error":
            raise HTTPException(status_code=500, detail=result.get("error", "Analysis failed"))

        return ApiResponse(
            statusCode=200,
            status="success",
            message="Trip analyzed successfully",
            data=result
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Trip analysis failed: {str(e)}")


@router.post("/predict-travel-time", response_model=ApiResponse)
async def predict_travel_time(request: TravelTimeRequest):
    """
    Predict travel time between two locations

    Uses:
    - Historical travel data
    - Current traffic conditions
    - Time-of-day patterns
    - Weather conditions (if available)

    Returns predicted time with confidence interval.
    """
    try:
        origin = (request.origin.lat, request.origin.lng)
        destination = (request.destination.lat, request.destination.lng)

        result = await route_optimizer.predict_travel_time(
            origin=origin,
            destination=destination,
            departure_time=request.departure_time
        )

        if result.get("status") == "error":
            raise HTTPException(status_code=500, detail=result.get("error", "Prediction failed"))

        return ApiResponse(
            statusCode=200,
            status="success",
            message="Travel time predicted successfully",
            data=result
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Travel time prediction failed: {str(e)}")


@router.get("/health", response_model=ApiResponse)
async def route_optimizer_health():
    """Check route optimization service health and capabilities"""
    capabilities = {
        "optimization_enabled": route_optimizer.optimization_enabled,
        "libraries": {
            "ortools": "available" if route_optimizer.optimization_enabled else "not_available",
            "numpy": "available"
        },
        "features": {
            "multi_agent_optimization": route_optimizer.optimization_enabled,
            "time_window_constraints": route_optimizer.optimization_enabled,
            "traffic_aware_routing": True,
            "route_analysis": True,
            "travel_time_prediction": True
        }
    }

    return ApiResponse(
        statusCode=200,
        status="success",
        message="Route optimization service is healthy",
        data=capabilities
    )
