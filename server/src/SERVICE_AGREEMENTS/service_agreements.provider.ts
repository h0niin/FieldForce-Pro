import { ServiceAgreement } from './service_agreements.entity';
import { KEYNAMES } from '../shared/constants/keynames';

export const serviceAgreementsProviders = [
  {
    provide: KEYNAMES.SERVICE_AGREEMENTS,
    useValue: ServiceAgreement,
  },
];
