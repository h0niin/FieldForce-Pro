from __future__ import annotations

import logging
from datetime import datetime
from typing import Tuple

import numpy as np

logger = logging.getLogger(__name__)

# Average speed profiles (km/h) by time-of-day and road type
SPEED_PROFILES: dict[str, dict[str, float]] = {
    "peak_morning": {       # 07:00 - 09:00
        "highway": 45,
        "urban": 20,
        "suburban": 35,
        "default": 25,
    },
    "peak_evening": {       # 16:00 - 18:30
        "highway": 40,
        "urban": 18,
        "suburban": 30,
        "default": 22,
    },
    "midday": {             # 09:00 - 16:00
        "highway": 80,
        "urban": 35,
        "suburban": 55,
        "default": 40,
    },
    "off_peak": {           # 18:30 - 07:00
        "highway": 90,
        "urban": 45,
        "suburban": 60,
        "default": 50,
    },
    "weekend": {
        "highway": 85,
        "urban": 40,
        "suburban": 55,
        "default": 45,
    },
}

# Traffic multipliers for congestion simulation
TRAFFIC_MULTIPLIERS: dict[str, float] = {
    "none": 1.0,
    "light": 1.15,
    "moderate": 1.35,
    "heavy": 1.6,
    "severe": 2.0,
}


def _haversine(coord1: Tuple[float, float], coord2: Tuple[float, float]) -> float:
    """Haversine distance in km."""
    lat1, lon1 = coord1
    lat2, lon2 = coord2
    R = 6371
    dlat = np.radians(lat2 - lat1)
    dlon = np.radians(lon2 - lon1)
    a = (
        np.sin(dlat / 2) ** 2
        + np.cos(np.radians(lat1)) * np.cos(np.radians(lat2)) * np.sin(dlon / 2) ** 2
    )
    c = 2 * np.arctan2(np.sqrt(a), np.sqrt(1 - a))
    return float(R * c)


def _get_time_period(dt: datetime) -> str:
    """Classify a datetime into a traffic time period."""
    if dt.weekday() >= 5:
        return "weekend"
    hour = dt.hour + dt.minute / 60
    if 7 <= hour < 9:
        return "peak_morning"
    if 16 <= hour < 18.5:
        return "peak_evening"
    if 9 <= hour < 16:
        return "midday"
    return "off_peak"


def _estimate_road_type(distance_km: float) -> str:
    """Heuristic: longer distances more likely to use highways."""
    if distance_km > 30:
        return "highway"
    if distance_km > 10:
        return "suburban"
    return "urban"


class TravelTimeEstimator:
    """
    Estimate travel time between two points, considering:
    - Haversine (straight-line) distance with road-factor correction
    - Time-of-day speed profiles (peak/off-peak/weekend)
    - Configurable traffic congestion level
    - Road-type heuristic (urban/suburban/highway)

    In production, this would integrate with a real traffic API
    (Google Maps Directions, Mapbox, HERE). The rule-based model
    provides a reasonable fallback.
    """

    ROAD_FACTOR = 1.3  # straight-line → road distance multiplier

    def estimate(
        self,
        origin: dict,
        destination: dict,
        departure_time: str | None = None,
        traffic: str = "moderate",
        road_type: str | None = None,
    ) -> dict:
        """
        Estimate travel time between two points.

        Args:
            origin: {"latitude": float, "longitude": float}
            destination: {"latitude": float, "longitude": float}
            departure_time: ISO datetime string (defaults to now)
            traffic: "none" | "light" | "moderate" | "heavy" | "severe"
            road_type: "highway" | "urban" | "suburban" | None (auto)

        Returns:
            dict with distance_km, duration_minutes, speed_kmh, traffic, period, etc.
        """
        olat = origin.get("latitude", 0)
        olng = origin.get("longitude", 0)
        dlat = destination.get("latitude", 0)
        dlng = destination.get("longitude", 0)

        straight_distance = _haversine((olat, olng), (dlat, dlng))
        road_distance = straight_distance * self.ROAD_FACTOR

        dt = datetime.fromisoformat(departure_time) if departure_time else datetime.now()
        period = _get_time_period(dt)

        rt = road_type or _estimate_road_type(road_distance)
        profile = SPEED_PROFILES.get(period, SPEED_PROFILES["midday"])
        base_speed = profile.get(rt, profile["default"])

        traffic_mult = TRAFFIC_MULTIPLIERS.get(traffic, 1.0)
        effective_speed = max(base_speed / traffic_mult, 5)  # never below 5 km/h

        duration_minutes = (road_distance / effective_speed) * 60

        return {
            "origin": origin,
            "destination": destination,
            "straight_line_distance_km": round(straight_distance, 3),
            "road_distance_km": round(road_distance, 3),
            "duration_minutes": round(duration_minutes, 2),
            "speed_kmh": round(effective_speed, 1),
            "traffic": traffic,
            "traffic_multiplier": traffic_mult,
            "period": period,
            "road_type": rt,
            "departure_time": dt.isoformat(),
            "method": "rule_based",
        }

    def estimate_batch(
        self,
        pairs: list[dict],
        departure_time: str | None = None,
        traffic: str = "moderate",
    ) -> list[dict]:
        """
        Estimate travel time for multiple origin-destination pairs.

        Args:
            pairs: [{"origin": {...}, "destination": {...}}, ...]
        """
        return [
            self.estimate(
                origin=p["origin"],
                destination=p["destination"],
                departure_time=departure_time,
                traffic=traffic,
            )
            for p in pairs
        ]

    def estimate_matrix(
        self,
        locations: list[dict],
        departure_time: str | None = None,
        traffic: str = "moderate",
    ) -> dict:
        """
        Build a full travel-time matrix between all locations.

        Args:
            locations: [{"latitude": float, "longitude": float}, ...]

        Returns:
            {"matrix": [[minutes]], "distances": [[km]], "locations_count": int}
        """
        n = len(locations)
        time_matrix: list[list[float]] = []
        dist_matrix: list[list[float]] = []

        for i in range(n):
            time_row: list[float] = []
            dist_row: list[float] = []
            for j in range(n):
                if i == j:
                    time_row.append(0.0)
                    dist_row.append(0.0)
                else:
                    est = self.estimate(
                        origin=locations[i],
                        destination=locations[j],
                        departure_time=departure_time,
                        traffic=traffic,
                    )
                    time_row.append(est["duration_minutes"])
                    dist_row.append(est["road_distance_km"])
            time_matrix.append(time_row)
            dist_matrix.append(dist_row)

        return {
            "matrix": time_matrix,
            "distances": dist_matrix,
            "locations_count": n,
            "traffic": traffic,
            "method": "rule_based",
        }
