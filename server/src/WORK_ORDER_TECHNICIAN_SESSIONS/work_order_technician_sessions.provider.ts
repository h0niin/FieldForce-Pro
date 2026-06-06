import { WorkOrderTechnicianSession } from './work_order_technician_sessions.entity';
import { KEYNAMES } from '../shared/constants/keynames';

export const workOrderTechnicianSessionsProviders = [
  {
    provide: KEYNAMES.WORK_ORDER_TECHNICIAN_SESSIONS,
    useValue: WorkOrderTechnicianSession,
  },
];
