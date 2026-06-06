import { WorkOrder } from './work_orders.entity';
import { KEYNAMES } from '../shared/constants/keynames';

export const workOrdersProviders = [
  {
    provide: KEYNAMES.WORK_ORDERS,
    useValue: WorkOrder,
  },
];
