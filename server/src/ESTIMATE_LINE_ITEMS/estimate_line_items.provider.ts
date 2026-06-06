import { EstimateLineItem } from './estimate_line_items.entity';
import { KEYNAMES } from '../shared/constants/keynames';

export const estimateLineItemsProviders = [
  {
    provide: KEYNAMES.ESTIMATE_LINE_ITEMS,
    useValue: EstimateLineItem,
  },
];
