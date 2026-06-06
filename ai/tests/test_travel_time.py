"""Tests for travel time estimation with traffic data."""

from datetime import datetime

from app.models.scheduler.travel_time import TravelTimeEstimator, _get_time_period, _haversine


# ─── Utility functions ────────────────────────────────────────────────

def test_haversine_zero():
    assert _haversine((0, 0), (0, 0)) == 0.0


def test_haversine_positive():
    dist = _haversine((40.71, -74.00), (40.72, -74.01))
    assert dist > 0


def test_get_time_period_morning_peak():
    dt = datetime(2026, 2, 20, 8, 0)  # Friday 8am
    assert _get_time_period(dt) == "peak_morning"


def test_get_time_period_evening_peak():
    dt = datetime(2026, 2, 20, 17, 0)  # Friday 5pm
    assert _get_time_period(dt) == "peak_evening"


def test_get_time_period_midday():
    dt = datetime(2026, 2, 20, 12, 0)  # Friday noon
    assert _get_time_period(dt) == "midday"


def test_get_time_period_off_peak():
    dt = datetime(2026, 2, 20, 22, 0)  # Friday 10pm
    assert _get_time_period(dt) == "off_peak"


def test_get_time_period_weekend():
    dt = datetime(2026, 2, 21, 12, 0)  # Saturday noon
    assert _get_time_period(dt) == "weekend"


# ─── Single estimate ─────────────────────────────────────────────────

def test_estimate_basic():
    est = TravelTimeEstimator()
    result = est.estimate(
        origin={"latitude": 40.7128, "longitude": -74.0060},
        destination={"latitude": 40.7580, "longitude": -73.9855},
    )
    assert result["road_distance_km"] > 0
    assert result["duration_minutes"] > 0
    assert result["speed_kmh"] > 0
    assert result["method"] == "rule_based"


def test_estimate_same_point():
    est = TravelTimeEstimator()
    result = est.estimate(
        origin={"latitude": 40.71, "longitude": -74.00},
        destination={"latitude": 40.71, "longitude": -74.00},
    )
    assert result["road_distance_km"] == 0.0
    assert result["duration_minutes"] == 0.0


def test_estimate_with_departure_time():
    est = TravelTimeEstimator()
    # Morning peak should be slower
    morning = est.estimate(
        origin={"latitude": 40.71, "longitude": -74.00},
        destination={"latitude": 40.75, "longitude": -73.99},
        departure_time="2026-02-20T08:00:00",
    )
    assert morning["period"] == "peak_morning"

    # Midday should be faster
    midday = est.estimate(
        origin={"latitude": 40.71, "longitude": -74.00},
        destination={"latitude": 40.75, "longitude": -73.99},
        departure_time="2026-02-20T12:00:00",
    )
    assert midday["period"] == "midday"
    assert midday["duration_minutes"] < morning["duration_minutes"]


def test_estimate_traffic_levels():
    est = TravelTimeEstimator()
    origin = {"latitude": 40.71, "longitude": -74.00}
    dest = {"latitude": 40.75, "longitude": -73.99}

    none_traffic = est.estimate(origin, dest, traffic="none")
    heavy_traffic = est.estimate(origin, dest, traffic="heavy")

    assert heavy_traffic["duration_minutes"] > none_traffic["duration_minutes"]
    assert heavy_traffic["traffic_multiplier"] > none_traffic["traffic_multiplier"]


def test_estimate_severe_traffic():
    est = TravelTimeEstimator()
    result = est.estimate(
        origin={"latitude": 40.71, "longitude": -74.00},
        destination={"latitude": 40.75, "longitude": -73.99},
        traffic="severe",
    )
    assert result["traffic_multiplier"] == 2.0
    assert result["speed_kmh"] >= 5  # never below minimum


def test_estimate_explicit_road_type():
    est = TravelTimeEstimator()
    origin = {"latitude": 40.71, "longitude": -74.00}
    dest = {"latitude": 40.75, "longitude": -73.99}

    highway = est.estimate(origin, dest, road_type="highway")
    urban = est.estimate(origin, dest, road_type="urban")

    assert highway["road_type"] == "highway"
    assert urban["road_type"] == "urban"
    # Highway should be faster (shorter duration)
    assert highway["duration_minutes"] < urban["duration_minutes"]


def test_estimate_result_fields():
    est = TravelTimeEstimator()
    result = est.estimate(
        origin={"latitude": 40.71, "longitude": -74.00},
        destination={"latitude": 40.75, "longitude": -73.99},
    )
    required_fields = [
        "origin", "destination", "straight_line_distance_km", "road_distance_km",
        "duration_minutes", "speed_kmh", "traffic", "traffic_multiplier",
        "period", "road_type", "departure_time", "method",
    ]
    for field in required_fields:
        assert field in result, f"Missing field: {field}"


def test_road_factor_applied():
    est = TravelTimeEstimator()
    result = est.estimate(
        origin={"latitude": 40.71, "longitude": -74.00},
        destination={"latitude": 40.75, "longitude": -73.99},
    )
    assert result["road_distance_km"] > result["straight_line_distance_km"]


# ─── Batch estimation ─────────────────────────────────────────────────

def test_estimate_batch():
    est = TravelTimeEstimator()
    pairs = [
        {"origin": {"latitude": 40.71, "longitude": -74.00}, "destination": {"latitude": 40.72, "longitude": -74.01}},
        {"origin": {"latitude": 40.73, "longitude": -74.02}, "destination": {"latitude": 40.74, "longitude": -74.03}},
    ]
    results = est.estimate_batch(pairs)
    assert len(results) == 2
    assert all(r["duration_minutes"] > 0 for r in results)


def test_estimate_batch_empty():
    est = TravelTimeEstimator()
    results = est.estimate_batch([])
    assert results == []


# ─── Matrix estimation ────────────────────────────────────────────────

def test_estimate_matrix():
    est = TravelTimeEstimator()
    locations = [
        {"latitude": 40.71, "longitude": -74.00},
        {"latitude": 40.72, "longitude": -74.01},
        {"latitude": 40.73, "longitude": -74.02},
    ]
    result = est.estimate_matrix(locations)
    assert result["locations_count"] == 3
    assert len(result["matrix"]) == 3
    assert len(result["matrix"][0]) == 3
    assert len(result["distances"]) == 3
    # Diagonal should be zero
    for i in range(3):
        assert result["matrix"][i][i] == 0.0
        assert result["distances"][i][i] == 0.0
    # Off-diagonal should be positive
    assert result["matrix"][0][1] > 0
    assert result["distances"][0][1] > 0


def test_estimate_matrix_symmetric():
    est = TravelTimeEstimator()
    locations = [
        {"latitude": 40.71, "longitude": -74.00},
        {"latitude": 40.75, "longitude": -73.99},
    ]
    result = est.estimate_matrix(locations, traffic="none")
    # Distance should be symmetric
    assert abs(result["distances"][0][1] - result["distances"][1][0]) < 0.01


def test_estimate_matrix_single_location():
    est = TravelTimeEstimator()
    result = est.estimate_matrix([{"latitude": 40.71, "longitude": -74.00}])
    assert result["locations_count"] == 1
    assert result["matrix"] == [[0.0]]


def test_estimate_matrix_with_traffic():
    est = TravelTimeEstimator()
    locations = [
        {"latitude": 40.71, "longitude": -74.00},
        {"latitude": 40.75, "longitude": -73.99},
    ]
    none_result = est.estimate_matrix(locations, traffic="none")
    heavy_result = est.estimate_matrix(locations, traffic="heavy")
    # Heavy traffic should produce longer travel times
    assert heavy_result["matrix"][0][1] > none_result["matrix"][0][1]
