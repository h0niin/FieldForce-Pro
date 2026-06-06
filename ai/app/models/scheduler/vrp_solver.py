from __future__ import annotations

import logging
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass, field
import numpy as np

logger = logging.getLogger(__name__)

try:
    from ortools.constraint_solver import pywrapcp, routing_enums_pb2
    ORTOOLS_AVAILABLE = True
except ImportError:
    ORTOOLS_AVAILABLE = False
    logger.warning("ortools not installed — VRP solver will return placeholder results")


@dataclass
class Location:
    """Represents a service location"""
    id: str
    latitude: float
    longitude: float
    address: str
    service_duration: int  # minutes
    time_window_start: datetime
    time_window_end: datetime
    required_skills: List[str] = field(default_factory=list)
    territory: str = None
    priority: int = 1


@dataclass
class Technician:
    """Represents a field technician"""
    id: str
    name: str
    start_location: Tuple[float, float]
    end_location: Optional[Tuple[float, float]] = None
    skills: List[str] = field(default_factory=list)
    territories: List[str] = field(default_factory=list)
    shift_start: datetime = None
    shift_end: datetime = None
    max_distance: float = 100.0  # km
    max_jobs: int = 10
    current_location: Optional[Tuple[float, float]] = None


class VRPSolver:
    """Vehicle Routing Problem solver using Google OR-Tools with advanced constraints."""

    def __init__(self) -> None:
        self.available = ORTOOLS_AVAILABLE
        self.distance_cache = {}

    def solve(
        self,
        work_orders: list[dict],
        technicians: list[dict],
        constraints: dict | None = None,
    ) -> dict:
        """
        Solve VRP with time windows, skills, and territory constraints

        Args:
            work_orders: List of work orders with location, time windows, skills
            technicians: List of technicians with skills, territories, availability
            constraints: Additional constraints (max_distance, optimization_time_limit)

        Returns:
            Optimized schedule with route assignments
        """
        if not self.available:
            return {
                "schedule": [],
                "cost": 0.0,
                "unassigned": [wo.get("id", "") for wo in work_orders],
                "optimization_score": 0.0,
                "message": "ortools not available — placeholder result",
            }

        if not work_orders or not technicians:
            return {
                "schedule": [],
                "cost": 0.0,
                "unassigned": [],
                "optimization_score": 1.0,
                "message": "No work orders or technicians to optimize",
            }

        # Convert input data to internal format
        locations = self._create_locations(work_orders)
        techs = self._create_technicians(technicians)

        # Create distance matrix
        distance_matrix = self._create_distance_matrix(locations, techs)
        time_matrix = self._create_time_matrix(distance_matrix, locations)

        # Setup OR-Tools routing model
        num_vehicles = len(techs)
        num_locations = len(locations) + 1  # +1 for depot
        depot = 0

        manager = pywrapcp.RoutingIndexManager(
            num_locations,
            num_vehicles,
            [0] * num_vehicles,  # All start from depot
            [0] * num_vehicles   # All end at depot
        )

        routing = pywrapcp.RoutingModel(manager)

        # Register time callback
        def time_callback(from_index, to_index):
            from_node = manager.IndexToNode(from_index)
            to_node = manager.IndexToNode(to_index)
            return int(time_matrix[from_node][to_node])

        transit_callback_index = routing.RegisterTransitCallback(time_callback)
        routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)

        # Add time dimension with time windows
        routing.AddDimension(
            transit_callback_index,
            30,  # allow waiting time
            480,  # maximum 8 hours per vehicle
            False,  # Don't force start cumul to zero
            'Time'
        )

        time_dimension = routing.GetDimensionOrDie('Time')

        # Add time window constraints for each location
        for idx, location in enumerate(locations, start=1):
            index = manager.NodeToIndex(idx)
            start_minutes = self._datetime_to_minutes(location.time_window_start)
            end_minutes = self._datetime_to_minutes(location.time_window_end)
            time_dimension.CumulVar(index).SetRange(start_minutes, end_minutes)

        # Add skills and territory constraints
        self._add_constraints(routing, manager, locations, techs)

        # Set search parameters
        search_parameters = pywrapcp.DefaultRoutingSearchParameters()
        search_parameters.first_solution_strategy = (
            routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
        )
        search_parameters.local_search_metaheuristic = (
            routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
        )
        search_parameters.time_limit.FromSeconds(
            constraints.get('optimization_time_limit', 30) if constraints else 30
        )

        # Solve the problem
        solution = routing.SolveWithParameters(search_parameters)

        if solution:
            return self._extract_solution(routing, manager, solution, locations, techs, work_orders)
        else:
            return {
                "schedule": [],
                "cost": 0.0,
                "unassigned": [wo.get("id", "") for wo in work_orders],
                "optimization_score": 0.0,
                "message": "No feasible solution found",
            }

    def _create_locations(self, work_orders: list[dict]) -> list[Location]:
        """Convert work orders to Location objects"""
        locations = []
        for wo in work_orders:
            loc_data = wo.get('service_location', {})
            locations.append(Location(
                id=wo.get('id', ''),
                latitude=loc_data.get('latitude', 0),
                longitude=loc_data.get('longitude', 0),
                address=loc_data.get('address', ''),
                service_duration=wo.get('estimated_duration', 60),
                time_window_start=datetime.fromisoformat(wo.get('time_window_start', datetime.now().isoformat())),
                time_window_end=datetime.fromisoformat(wo.get('time_window_end', (datetime.now() + timedelta(hours=8)).isoformat())),
                required_skills=wo.get('required_skills', []),
                territory=wo.get('territory', ''),
                priority=wo.get('priority', 1)
            ))
        return locations

    def _create_technicians(self, technicians: list[dict]) -> list[Technician]:
        """Convert technician data to Technician objects"""
        techs = []
        for tech in technicians:
            techs.append(Technician(
                id=tech.get('id', ''),
                name=tech.get('name', ''),
                start_location=(tech.get('start_lat', 0), tech.get('start_lng', 0)),
                end_location=(tech.get('end_lat'), tech.get('end_lng')) if tech.get('end_lat') else None,
                skills=tech.get('skills', []),
                territories=tech.get('territories', []),
                shift_start=datetime.fromisoformat(tech.get('shift_start', datetime.now().isoformat())),
                shift_end=datetime.fromisoformat(tech.get('shift_end', (datetime.now() + timedelta(hours=8)).isoformat())),
                max_jobs=tech.get('max_jobs', 10),
                max_distance=tech.get('max_distance', 100)
            ))
        return techs

    def _create_distance_matrix(self, locations: list[Location], techs: list[Technician]) -> np.ndarray:
        """Create distance matrix between all locations"""
        all_points = [(0, 0)]  # Depot
        all_points.extend([(loc.latitude, loc.longitude) for loc in locations])

        n = len(all_points)
        matrix = np.zeros((n, n))

        for i in range(n):
            for j in range(n):
                if i != j:
                    matrix[i][j] = self._haversine_distance(all_points[i], all_points[j])

        return matrix

    def _create_time_matrix(self, distance_matrix: np.ndarray, locations: list[Location]) -> np.ndarray:
        """Convert distance to time matrix (minutes)"""
        avg_speed_kmh = 40
        time_matrix = (distance_matrix / avg_speed_kmh) * 60

        # Add service duration
        for i, location in enumerate(locations, start=1):
            for j in range(len(time_matrix)):
                if j != i:
                    time_matrix[j][i] += location.service_duration

        return time_matrix

    def _add_constraints(self, routing, manager, locations: list[Location], techs: list[Technician]):
        """Add skills and territory constraints"""
        for loc_idx, location in enumerate(locations, start=1):
            allowed_vehicles = []

            for tech_idx, tech in enumerate(techs):
                # Check skills match
                skills_match = True
                if location.required_skills:
                    skills_match = all(skill in (tech.skills or []) for skill in location.required_skills)

                # Check territory match
                territory_match = True
                if location.territory:
                    territory_match = location.territory in (tech.territories or [])

                if skills_match and territory_match:
                    allowed_vehicles.append(tech_idx)

            if allowed_vehicles:
                index = manager.NodeToIndex(loc_idx)
                routing.SetAllowedVehiclesForIndex(allowed_vehicles, index)

    def _extract_solution(self, routing, manager, solution, locations: list[Location],
                         techs: list[Technician], original_work_orders: list[dict]) -> dict:
        """Extract optimized solution"""
        schedule = []
        total_cost = 0
        assigned_jobs = set()

        time_dimension = routing.GetDimensionOrDie('Time')

        for vehicle_id in range(len(techs)):
            tech = techs[vehicle_id]
            route = []
            index = routing.Start(vehicle_id)

            while not routing.IsEnd(index):
                node = manager.IndexToNode(index)
                if node > 0:  # Not depot
                    location = locations[node - 1]
                    time_var = time_dimension.CumulVar(index)

                    route.append({
                        'work_order_id': location.id,
                        'address': location.address,
                        'arrival_time': self._minutes_to_datetime(solution.Min(time_var)).isoformat(),
                        'duration': location.service_duration,
                        'sequence': len(route) + 1
                    })
                    assigned_jobs.add(location.id)

                index = solution.Value(routing.NextVar(index))

            if route:
                schedule.append({
                    'technician_id': tech.id,
                    'technician_name': tech.name,
                    'route': route,
                    'total_stops': len(route),
                    'estimated_duration': sum(stop['duration'] for stop in route)
                })

        # Find unassigned jobs
        all_jobs = {loc.id for loc in locations}
        unassigned = list(all_jobs - assigned_jobs)

        optimization_score = len(assigned_jobs) / len(all_jobs) if all_jobs else 1.0

        return {
            "schedule": schedule,
            "cost": solution.ObjectiveValue() if solution else 0,
            "unassigned": unassigned,
            "optimization_score": optimization_score,
            "message": f"Optimized {len(assigned_jobs)} of {len(all_jobs)} jobs",
        }

    def _haversine_distance(self, coord1: Tuple[float, float], coord2: Tuple[float, float]) -> float:
        """Calculate Haversine distance in km"""
        lat1, lon1 = coord1
        lat2, lon2 = coord2

        R = 6371  # Earth's radius in km
        dlat = np.radians(lat2 - lat1)
        dlon = np.radians(lon2 - lon1)
        a = np.sin(dlat/2)**2 + np.cos(np.radians(lat1)) * np.cos(np.radians(lat2)) * np.sin(dlon/2)**2
        c = 2 * np.arctan2(np.sqrt(a), np.sqrt(1-a))

        return R * c

    def _datetime_to_minutes(self, dt: datetime) -> int:
        """Convert datetime to minutes since midnight"""
        return dt.hour * 60 + dt.minute

    def _minutes_to_datetime(self, minutes: int) -> datetime:
        """Convert minutes to datetime"""
        today = datetime.now().date()
        return datetime.combine(today, datetime.min.time()) + timedelta(minutes=minutes)


def _haversine(coord1: Tuple[float, float], coord2: Tuple[float, float]) -> float:
    """Standalone haversine distance in km."""
    lat1, lon1 = coord1
    lat2, lon2 = coord2
    R = 6371
    dlat = np.radians(lat2 - lat1)
    dlon = np.radians(lon2 - lon1)
    a = np.sin(dlat / 2) ** 2 + np.cos(np.radians(lat1)) * np.cos(np.radians(lat2)) * np.sin(dlon / 2) ** 2
    c = 2 * np.arctan2(np.sqrt(a), np.sqrt(1 - a))
    return R * c


def optimize_route(
    locations: list[dict],
    start_location: dict | None = None,
    end_location: dict | None = None,
) -> dict:
    """
    Optimize the visit order for a single technician using TSP.

    Uses OR-Tools TSP solver when available, otherwise applies a nearest-neighbour
    greedy heuristic as fallback.
    """
    if not locations:
        return {
            "route": [],
            "total_distance_km": 0.0,
            "total_duration_minutes": 0.0,
            "message": "No locations to optimize",
        }

    # Build coordinate list: [start] + locations + [end]
    points: list[Tuple[float, float]] = []
    loc_indices: list[int] = []  # maps point index → locations index (-1 for start/end)

    if start_location:
        points.append((start_location.get("latitude", 0), start_location.get("longitude", 0)))
        loc_indices.append(-1)
    else:
        points.append((locations[0].get("latitude", 0), locations[0].get("longitude", 0)))
        loc_indices.append(0)

    for i, loc in enumerate(locations):
        if not start_location and i == 0:
            continue  # already used as start
        points.append((loc.get("latitude", 0), loc.get("longitude", 0)))
        loc_indices.append(i)

    if end_location:
        points.append((end_location.get("latitude", 0), end_location.get("longitude", 0)))
        loc_indices.append(-2)

    n = len(points)

    # Build distance matrix
    dist_matrix = np.zeros((n, n))
    for i in range(n):
        for j in range(n):
            if i != j:
                dist_matrix[i][j] = _haversine(points[i], points[j])

    if ORTOOLS_AVAILABLE and n > 2:
        order = _solve_tsp_ortools(dist_matrix)
    else:
        order = _solve_tsp_greedy(dist_matrix)

    # Build ordered result
    ordered_locations: list[dict] = []
    total_distance = 0.0
    for seq, idx in enumerate(order):
        li = loc_indices[idx]
        if li >= 0:
            loc = dict(locations[li])
            loc["sequence"] = seq + 1
            ordered_locations.append(loc)
        if seq > 0:
            total_distance += dist_matrix[order[seq - 1]][idx]

    avg_speed_kmh = 40
    total_duration = (total_distance / avg_speed_kmh) * 60
    total_duration += sum(loc.get("duration", 0) for loc in ordered_locations)

    return {
        "route": ordered_locations,
        "total_distance_km": round(total_distance, 2),
        "total_duration_minutes": round(total_duration, 2),
        "message": f"Route optimized for {len(ordered_locations)} stops",
    }


def _solve_tsp_ortools(dist_matrix: np.ndarray) -> list[int]:
    """Solve TSP using OR-Tools."""
    n = len(dist_matrix)
    manager = pywrapcp.RoutingIndexManager(n, 1, 0)
    routing = pywrapcp.RoutingModel(manager)

    int_matrix = (dist_matrix * 1000).astype(int)  # convert to metres for int precision

    def distance_callback(from_index, to_index):
        from_node = manager.IndexToNode(from_index)
        to_node = manager.IndexToNode(to_index)
        return int_matrix[from_node][to_node]

    transit_idx = routing.RegisterTransitCallback(distance_callback)
    routing.SetArcCostEvaluatorOfAllVehicles(transit_idx)

    search_params = pywrapcp.DefaultRoutingSearchParameters()
    search_params.first_solution_strategy = routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
    search_params.local_search_metaheuristic = routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
    search_params.time_limit.FromSeconds(5)

    solution = routing.SolveWithParameters(search_params)
    if solution:
        order: list[int] = []
        index = routing.Start(0)
        while not routing.IsEnd(index):
            order.append(manager.IndexToNode(index))
            index = solution.Value(routing.NextVar(index))
        return order

    # Fallback to greedy if solver fails
    return _solve_tsp_greedy(dist_matrix)


def _solve_tsp_greedy(dist_matrix: np.ndarray) -> list[int]:
    """Nearest-neighbour greedy TSP heuristic."""
    n = len(dist_matrix)
    visited = {0}
    order = [0]
    current = 0

    while len(visited) < n:
        nearest = -1
        nearest_dist = float("inf")
        for j in range(n):
            if j not in visited and dist_matrix[current][j] < nearest_dist:
                nearest = j
                nearest_dist = dist_matrix[current][j]
        if nearest == -1:
            break
        visited.add(nearest)
        order.append(nearest)
        current = nearest

    return order
