import { Company } from './companies.entity';
import { KEYNAMES } from '../shared/constants/keynames';

export const companiesProviders = [
  {
    provide: KEYNAMES.COMPANIES,
    useValue: Company,
  },
];
