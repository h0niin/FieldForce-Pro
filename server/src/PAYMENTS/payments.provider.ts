import { Payment } from './payments.entity';
import { KEYNAMES } from '../shared/constants/keynames';

export const paymentsProviders = [
  {
    provide: KEYNAMES.PAYMENTS,
    useValue: Payment,
  },
];
