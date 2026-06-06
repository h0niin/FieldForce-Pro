import { REPOSITORY } from '../shared/constants/keynames';
import { UserRole } from './user_roles.entity';

export const userRolesProviders = [
  {
    provide: REPOSITORY.USER_ROLES,
    useValue: UserRole,
  },
];
