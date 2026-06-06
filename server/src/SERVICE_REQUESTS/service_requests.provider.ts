import { ServiceRequest } from './service_requests.entity';
import { KEYNAMES } from '../shared/constants/keynames';

import { RequestAuditLog } from './request_audit_log.entity';

export const serviceRequestsProviders = [
  {
    provide: KEYNAMES.SERVICE_REQUESTS,
    useValue: ServiceRequest,
  },
  {
    provide: KEYNAMES.REQUEST_AUDIT_LOGS,
    useValue: RequestAuditLog,
  },
];
