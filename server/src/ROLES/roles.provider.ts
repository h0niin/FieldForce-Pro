import { REPOSITORY } from '../shared/constants/keynames';
import { Role } from './roles.entity';

export const rolesProviders = [
  {
    provide: REPOSITORY.ROLES,
    useValue: Role,
  },
];
