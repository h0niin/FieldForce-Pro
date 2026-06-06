import { Invoice } from './invoices.entity';
import { KEYNAMES } from '../shared/constants/keynames';

export const invoicesProviders = [
  {
    provide: KEYNAMES.INVOICES,
    useValue: Invoice,
  },
];
