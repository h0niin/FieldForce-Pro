import { AuditLog } from './audit_logs.entity';
import { KEYNAMES } from '../shared/constants/keynames';

export const auditLogsProviders = [
  {
    provide: KEYNAMES.AUDIT_LOGS,
    useValue: AuditLog,
  },
];
