import { WorkOrderLineItem } from './work_order_line_items.entity';
import { KEYNAMES } from '../shared/constants/keynames';

export const workOrderLineItemsProviders = [
  {
    provide: KEYNAMES.WORK_ORDER_LINE_ITEMS,
    useValue: WorkOrderLineItem,
  },
];
