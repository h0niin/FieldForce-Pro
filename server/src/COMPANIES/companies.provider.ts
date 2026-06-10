import { Company } from './companies.entity';
import { CompanyType } from '../COMPANY_TYPES/company_types.entity';
import { KEYNAMES } from '../shared/constants/keynames';

export const companiesProviders = [
  {
    provide: KEYNAMES.COMPANIES,
    useValue: Company,
  },
  {
    provide: KEYNAMES.COMPANY_TYPES,
    useValue: CompanyType,
  },
];
