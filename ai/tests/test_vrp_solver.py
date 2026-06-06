"""Tests for VRP solver and route optimization."""

from datetime import datetime, timedelta

from app.models.scheduler.vrp_solver import VRPSolver, optimize_route, _haversine


# ─── Haversine distance ──────────────────────────────────────────────

def test_haversine_same_point():
    assert _haversine((40.7128, -74.0060), (40.7128, -74.0060)) == 0.0


def test_haversine_known_distance():
    # NYC to LA ~ 3940 km (rough)
    dist = _haversine((40.7128, -74.0060), (34.0522, -118.2437))
    assert 3900 < dist < 4000


def test_haversine_short_distance():
    # Two nearby points in Manhattan
    dist = _haversine((40.7128, -74.0060), (40.7228, -74.0060))
    assert 0 < dist < 5  # should be ~ 1.1 km


# ─── VRPSolver.solve ─────────────────────────────────────────────────

def test_vrp_solver_empty_inputs():
    solver = VRPSolver()
    result = solver.solve([], [])
    assert result["optimization_score"] == 1.0
    assert result["schedule"] == []
    assert result["unassigned"] == []


def test_vrp_solver_no_technicians():
    solver = VRPSolver()
    work_orders = [{"id": "wo1", "service_location": {"latitude": 40.71, "longitude": -74.00, "address": "A"},
                    "estimated_duration": 60,
                    "time_window_start": datetime.now().isoformat(),
                    "time_window_end": (datetime.now() + timedelta(hours=4)).isoformat()}]
    result = solver.solve(work_orders, [])
    assert result["schedule"] == []


def test_vrp_solver_with_data():
    solver = VRPSolver()
    now = datetime.now()
    work_orders = [
        {
            "id": f"wo_{i}",
            "service_location": {"latitude": 40.71 + i * 0.01, "longitude": -74.00 + i * 0.01, "address": f"Addr {i}"},
            "estimated_duration": 60,
            "time_window_start": now.isoformat(),
            "time_window_end": (now + timedelta(hours=6)).isoformat(),
            "required_skills": ["plumbing"],
            "territory": "north",
            "priority": 2,
        }
        for i in range(3)
    ]
    technicians = [
        {
            "id": "tech_1",
            "name": "Alice",
            "start_lat": 40.71,
            "start_lng": -74.00,
            "skills": ["plumbing", "electrical"],
            "territories": ["north"],
            "shift_start": now.isoformat(),
            "shift_end": (now + timedelta(hours=8)).isoformat(),
            "max_jobs": 5,
        }
    ]
    result = solver.solve(work_orders, technicians)
    assert "schedule" in result
    assert "unassigned" in result
    assert "optimization_score" in result
    assert 0 <= result["optimization_score"] <= 1


def test_vrp_solver_result_structure():
    solver = VRPSolver()
    now = datetime.now()
    wo = [{
        "id": "wo_x",
        "service_location": {"latitude": 40.72, "longitude": -74.01, "address": "Test"},
        "estimated_duration": 30,
        "time_window_start": now.isoformat(),
        "time_window_end": (now + timedelta(hours=4)).isoformat(),
    }]
    tech = [{
        "id": "t1", "name": "Bob",
        "start_lat": 40.71, "start_lng": -74.00,
        "skills": [], "territories": [],
        "shift_start": now.isoformat(),
        "shift_end": (now + timedelta(hours=8)).isoformat(),
    }]
    result = solver.solve(wo, tech)
    assert isinstance(result["cost"], (int, float))
    assert isinstance(result["unassigned"], list)


# ─── optimize_route (TSP) ────────────────────────────────────────────

def test_optimize_route_empty():
    result = optimize_route([])
    assert result["route"] == []
    assert result["total_distance_km"] == 0.0


def test_optimize_route_single_location():
    result = optimize_route([{"id": "a", "latitude": 40.71, "longitude": -74.00, "address": "A"}])
    assert len(result["route"]) <= 1


def test_optimize_route_multiple_locations():
    locations = [
        {"id": "a", "latitude": 40.71, "longitude": -74.00, "address": "A", "duration": 30},
        {"id": "b", "latitude": 40.72, "longitude": -74.01, "address": "B", "duration": 30},
        {"id": "c", "latitude": 40.73, "longitude": -74.02, "address": "C", "duration": 30},
        {"id": "d", "latitude": 40.74, "longitude": -74.03, "address": "D", "duration": 30},
    ]
    result = optimize_route(locations)
    assert len(result["route"]) == 4
    assert result["total_distance_km"] > 0
    assert result["total_duration_minutes"] > 0


def test_optimize_route_with_start_location():
    locations = [
        {"id": "a", "latitude": 40.72, "longitude": -74.01, "address": "A"},
        {"id": "b", "latitude": 40.73, "longitude": -74.02, "address": "B"},
    ]
    result = optimize_route(locations, start_location={"latitude": 40.71, "longitude": -74.00})
    assert len(result["route"]) == 2
    assert result["total_distance_km"] > 0


def test_optimize_route_sequence_numbers():
    locations = [
        {"id": "a", "latitude": 40.71, "longitude": -74.00, "address": "A"},
        {"id": "b", "latitude": 40.72, "longitude": -74.01, "address": "B"},
        {"id": "c", "latitude": 40.73, "longitude": -74.02, "address": "C"},
    ]
    result = optimize_route(locations)
    sequences = [stop["sequence"] for stop in result["route"]]
    assert sequences == sorted(sequences)


def test_optimize_route_duration_includes_service_time():
    locations = [
        {"id": "a", "latitude": 40.71, "longitude": -74.00, "address": "A", "duration": 60},
        {"id": "b", "latitude": 40.72, "longitude": -74.01, "address": "B", "duration": 60},
    ]
    result = optimize_route(locations)
    # Total duration must be at least 120 minutes (service time alone)
    assert result["total_duration_minutes"] >= 120


def test_optimize_route_message():
    locations = [
        {"id": "a", "latitude": 40.71, "longitude": -74.00, "address": "A"},
    ]
    result = optimize_route(locations)
    assert "message" in result
