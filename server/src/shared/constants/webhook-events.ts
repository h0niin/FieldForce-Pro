export const WEBHOOK_EVENTS = {
  SERVICE_REQUEST_RECEIVED: 'service_request.received',
  SERVICE_REQUEST_ASSIGNED: 'service_request.assigned',
  TECHNICIAN_DISPATCHED: 'technician.dispatched',
  JOB_STARTED: 'job.started',
  JOB_COMPLETED: 'job.completed',
  JOB_CANCELLED: 'job.cancelled',
  INVOICE_CREATED: 'invoice.created',
} as const;

export type WebhookEvent = (typeof WEBHOOK_EVENTS)[keyof typeof WEBHOOK_EVENTS];
