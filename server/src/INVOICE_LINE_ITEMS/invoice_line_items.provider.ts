import { InvoiceLineItem } from './invoice_line_items.entity';
import { KEYNAMES } from '../shared/constants/keynames';

export const invoiceLineItemsProviders = [
  {
    provide: KEYNAMES.INVOICE_LINE_ITEMS,
    useValue: InvoiceLineItem,
  },
];
