import { PaymentGateway } from './payment_gateways.entity';
import { KEYNAMES } from '../shared/constants/keynames';

export const paymentGatewaysProviders = [
  {
    provide: KEYNAMES.PAYMENT_GATEWAYS,
    useValue: PaymentGateway,
  },
];
