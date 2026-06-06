import pytest
from datetime import datetime, timedelta
import json


def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_optimize_schedule_unauthorized(client):
    response = client.post("/api/v1/scheduling/optimize", json={
        "work_orders": [],
        "technicians": [],
    })
    assert response.status_code in (401, 403)


def test_optimize_schedule_success(client, auth_headers):
    response = client.post(
        "/api/v1/scheduling/optimize",
        json={"work_orders": [], "technicians": []},
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["statusCode"] == 200
    assert "data" in data
    assert "schedule" in data["data"]


def test_optimize_schedule_with_full_data(client, auth_headers):
    """Test VRP solver with complete work orders and technicians"""
    now = datetime.now()
    work_orders = [
        {
            "id": f"wo_{i}",
            "service_location": {
                "latitude": 40.7128 + (i * 0.01),
                "longitude": -74.0060 + (i * 0.01),
                "address": f"Address {i}"
            },
            "estimated_duration": 60,
            "time_window_start": now.isoformat(),
            "time_window_end": (now + timedelta(hours=4)).isoformat(),
            "required_skills": ["plumbing"] if i % 2 == 0 else ["electrical"],
            "territory": "north" if i < 3 else "south",
            "priority": 2
        }
        for i in range(5)
    ]

    technicians = [
        {
            "id": "tech_1",
            "name": "John Doe",
            "start_lat": 40.7128,
            "start_lng": -74.0060,
            "skills": ["plumbing", "electrical"],
            "territories": ["north", "south"],
            "shift_start": now.isoformat(),
            "shift_end": (now + timedelta(hours=8)).isoformat(),
            "max_jobs": 4
        },
        {
            "id": "tech_2",
            "name": "Jane Smith",
            "start_lat": 40.7300,
            "start_lng": -74.0100,
            "skills": ["electrical"],
            "territories": ["south"],
            "shift_start": now.isoformat(),
            "shift_end": (now + timedelta(hours=8)).isoformat(),
            "max_jobs": 3
        }
    ]

    response = client.post(
        "/api/v1/scheduling/optimize",
        json={
            "work_orders": work_orders,
            "technicians": technicians,
            "constraints": {
                "optimization_time_limit": 10,
                "use_traffic_data": False
            }
        },
        headers=auth_headers,
    )

    assert response.status_code == 200
    data = response.json()["data"]

    # Verify response structure
    assert "schedule" in data
    assert "unassigned" in data
    assert "optimization_score" in data
    assert isinstance(data["schedule"], list)

    # Verify optimization metrics
    assert data["optimization_score"] >= 0
    assert data["optimization_score"] <= 1

    # Verify schedule structure if jobs were assigned
    if data["schedule"]:
        schedule = data["schedule"][0]
        assert "technician_id" in schedule
        assert "technician_name" in schedule
        assert "route" in schedule
        assert isinstance(schedule["route"], list)


def test_optimize_route_unauthorized(client):
    response = client.post("/api/v1/scheduling/route", json={
        "locations": [],
    })
    assert response.status_code in (401, 403)


def test_optimize_route_success(client, auth_headers):
    locations = [
        {
            "id": f"loc_{i}",
            "latitude": 40.7128 + (i * 0.01),
            "longitude": -74.0060 + (i * 0.01),
            "address": f"Address {i}",
            "duration": 30
        }
        for i in range(4)
    ]

    response = client.post(
        "/api/v1/scheduling/route",
        json={
            "locations": locations,
            "start_location": {"latitude": 40.7128, "longitude": -74.0060},
            "use_traffic": False
        },
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "data" in data

    route_data = data["data"]
    assert "route" in route_data
    assert "total_distance_km" in route_data
    assert "total_duration_minutes" in route_data
    assert len(route_data["route"]) == len(locations)


def test_demand_forecast_success(client, auth_headers):
    """Test demand forecasting with historical data"""
    historical_data = [
        {
            "date": (datetime.now() - timedelta(days=30-i)).isoformat(),
            "demand": 40 + (i % 10)
        }
        for i in range(30)
    ]

    response = client.post(
        "/api/v1/scheduling/forecast/demand",
        json={
            "historical_data": historical_data,
            "horizon_days": 7,
            "service_type": "maintenance",
            "include_seasonality": True
        },
        headers=auth_headers,
    )

    assert response.status_code == 200
    data = response.json()["data"]

    # Verify forecast structure
    assert "forecast" in data
    assert "trend" in data
    assert "seasonality" in data
    assert "capacity_recommendations" in data

    # Verify forecast data
    assert len(data["forecast"]) == 7
    assert data["trend"] in ["increasing", "decreasing", "stable"]

    # Verify capacity recommendations
    capacity = data["capacity_recommendations"]
    assert "average_daily_capacity" in capacity
    assert "peak_capacity" in capacity
    assert "minimum_technicians" in capacity
    assert capacity["minimum_technicians"] > 0


def test_scheduling_recommendations(client, auth_headers):
    """Test AI scheduling recommendations"""
    now = datetime.now()
    response = client.get(
        "/api/v1/scheduling/recommendations",
        params={
            "start_date": now.isoformat(),
            "end_date": (now + timedelta(days=7)).isoformat()
        },
        headers=auth_headers,
    )

    assert response.status_code == 200
    data = response.json()["data"]
    assert "schedule_recommendations" in data
    assert "optimization_metrics" in data
    assert "alerts" in data


def test_realtime_optimization(client, auth_headers):
    """Test real-time route optimization with current locations"""
    response = client.post(
        "/api/v1/scheduling/optimize/realtime",
        json={
            "current_locations": [
                {
                    "technician_id": "tech_1",
                    "current_position": {"latitude": 40.7128, "longitude": -74.0060}
                }
            ],
            "pending_jobs": [
                {
                    "technician_id": "tech_1",
                    "id": "job_1",
                    "latitude": 40.7200,
                    "longitude": -74.0100,
                    "address": "123 Main St"
                },
                {
                    "technician_id": "tech_1",
                    "id": "job_2",
                    "latitude": 40.7300,
                    "longitude": -74.0200,
                    "address": "456 Oak Ave"
                }
            ],
            "use_traffic": True
        },
        headers=auth_headers,
    )

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "realtime_routes" in data["data"]


def test_expired_token_rejected(client, expired_headers):
    response = client.post(
        "/api/v1/scheduling/optimize",
        json={"work_orders": [], "technicians": []},
        headers=expired_headers,
    )
    assert response.status_code in (401, 403)


def test_large_schedule_optimization(client, auth_headers):
    """Test background processing for large schedules"""
    # Create 150 work orders to trigger background processing
    work_orders = [
        {
            "id": f"wo_{i}",
            "service_location": {
                "latitude": 40.7128 + (i * 0.001),
                "longitude": -74.0060 + (i * 0.001),
                "address": f"Address {i}"
            },
            "estimated_duration": 45,
            "time_window_start": datetime.now().isoformat(),
            "time_window_end": (datetime.now() + timedelta(hours=8)).isoformat()
        }
        for i in range(150)
    ]

    response = client.post(
        "/api/v1/scheduling/optimize",
        json={
            "work_orders": work_orders,
            "technicians": [
                {
                    "id": f"tech_{i}",
                    "name": f"Tech {i}",
                    "start_lat": 40.7128,
                    "start_lng": -74.0060,
                    "max_jobs": 15
                }
                for i in range(10)
            ]
        },
        headers=auth_headers,
    )

    assert response.status_code == 200
    data = response.json()

    # Should return task_id for background processing
    if "task_id" in data["data"]:
        assert data["data"]["task_id"] is not None
        assert "Large schedule optimization started" in data["message"]
