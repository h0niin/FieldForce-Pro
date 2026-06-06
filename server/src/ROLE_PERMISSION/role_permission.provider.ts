import { REPOSITORY } from '../shared/constants/keynames';
import { RolePermission } from './role_permission.entity';

export const rolePermissionProviders = [
  {
    provide: REPOSITORY.ROLE_PERMISSION,
    useValue: RolePermission,
  },
];
