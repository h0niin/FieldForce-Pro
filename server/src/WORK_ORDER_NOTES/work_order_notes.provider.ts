import { WorkOrderNote } from './work_order_notes.entity';
import { KEYNAMES } from '../shared/constants/keynames';

export const workOrderNotesProviders = [
  {
    provide: KEYNAMES.WORK_ORDER_NOTES,
    useValue: WorkOrderNote,
  },
];
