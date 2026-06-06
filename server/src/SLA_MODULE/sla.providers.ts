import { KEYNAMES } from '../shared/constants/keynames';
import { SlaPolicy } from './sla_policies.entity';
import { ServiceRequestSla } from './service_request_slas.entity';
import { SlaAuditLog } from './sla_audit_logs.entity';
import { WorkingCalendar } from './working_calendars.entity';
import { SlaEscalation } from './sla_escalations.entity';
import { SlaPauseTrigger } from './sla_pause_triggers.entity';

export const slaProviders = [
  {
    provide: KEYNAMES.SLA_POLICIES,
    useValue: SlaPolicy,
  },
  {
    provide: KEYNAMES.SERVICE_REQUEST_SLAS,
    useValue: ServiceRequestSla,
  },
  {
    provide: KEYNAMES.SLA_AUDIT_LOGS,
    useValue: SlaAuditLog,
  },
  {
    provide: KEYNAMES.WORKING_CALENDARS,
    useValue: WorkingCalendar,
  },
  {
    provide: KEYNAMES.SLA_ESCALATIONS,
    useValue: SlaEscalation,
  },
  {
    provide: KEYNAMES.SLA_PAUSE_TRIGGERS,
    useValue: SlaPauseTrigger,
  },
];
