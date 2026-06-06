import { SetMetadata } from '@nestjs/common';

export const WORKFLOW_EVENT_KEY = 'workflow_event';

export interface WorkflowEventMetadata {
  eventName: string;
  module: string;
}

/**
 * Decorator to trigger workflow rules when a controller method completes
 *
 * Usage:
 * @WorkflowEvent('work_order.created', 'work_orders')
 * async create(@TenantId() tenantId: string, @Body() dto: CreateWorkOrderDto) {
 *   // ... create work order
 * }
 */
export const WorkflowEvent = (eventName: string, module: string) =>
  SetMetadata(WORKFLOW_EVENT_KEY, { eventName, module } as WorkflowEventMetadata);
