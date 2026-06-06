import { Dashboard } from './dashboards.entity';
import { KEYNAMES } from '../shared/constants/keynames';
import { ServiceRequest } from '../SERVICE_REQUESTS/service_requests.entity';
import { RequestAuditLog } from '../SERVICE_REQUESTS/request_audit_log.entity';

export const dashboardsProviders = [
  {
    provide: KEYNAMES.DASHBOARDS,
    useValue: Dashboard,
  },
  {
    provide: KEYNAMES.SERVICE_REQUESTS,
    useValue: ServiceRequest,
  },
  {
    provide: KEYNAMES.REQUEST_AUDIT_LOGS,
    useValue: RequestAuditLog,
  },
];
