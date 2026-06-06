import { REPOSITORY } from '../shared/constants/keynames';
import { Tenant } from './tenants.entity';

export const tenantsProviders = [
  {
    provide: REPOSITORY.TENANTS,
    useValue: Tenant,
  },
];
