import { REPOSITORY } from '../shared/constants/keynames';
import { TenantModule } from './tenant_modules.entity';

export const tenantModulesProviders = [
  {
    provide: REPOSITORY.TENANT_MODULES,
    useValue: TenantModule,
  },
];
