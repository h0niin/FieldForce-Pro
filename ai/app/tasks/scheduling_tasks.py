from __future__ import annotations

from app.tasks.celery_app import celery_app
import logging
from typing import Dict, Any
import json

logger = logging.getLogger(__name__)


@celery_app.task(name="app.tasks.scheduling_tasks.optimize_schedule_async")
def optimize_schedule_async(
    work_orders: list[dict],
    technicians: list[dict],
    constraints: dict | None = None,
) -> dict:
    from app.models.scheduler.vrp_solver import VRPSolver

    solver = VRPSolver()
    return solver.solve(work_orders, technicians, constraints)


@celery_app.task(name="app.tasks.scheduling_tasks.optimize_route_async")
def optimize_route_async(
    locations: list[dict],
    start_location: dict | None = None,
    end_location: dict | None = None,
) -> dict:
    from app.models.scheduler.vrp_solver import optimize_route

    return optimize_route(locations, start_location, end_location)


@celery_app.task(bind=True, name="app.tasks.scheduling_tasks.async_optimize_large_schedule", max_retries=3)
def async_optimize_large_schedule(
    self,
    task_id: str,
    request_data: Dict[str, Any],
    tenant_id: str
) -> Dict:
    """
    Asynchronously optimize large schedules (>100 work orders)
    """
    try:
        logger.info(f"Starting large schedule optimization for task {task_id}")

        from app.models.scheduler.vrp_solver import VRPSolver

        solver = VRPSolver()

        # Extract data
        work_orders = request_data.get('work_orders', [])
        technicians = request_data.get('technicians', [])
        constraints = request_data.get('constraints', {})

        # Set longer timeout for large problems
        if constraints is None:
            constraints = {}
        constraints['optimization_time_limit'] = 120  # 2 minutes for large problems

        # Run optimization
        result = solver.solve(
            work_orders=work_orders,
            technicians=technicians,
            constraints=constraints
        )

        logger.info(f"Large schedule optimization completed for task {task_id}")

        return result

    except Exception as e:
        logger.error(f"Error in large schedule optimization: {str(e)}")
        # Retry the task
        raise self.retry(exc=e, countdown=60)  # Retry after 1 minute
