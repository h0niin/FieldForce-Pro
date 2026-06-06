import { REPOSITORY } from '../shared/constants/keynames';
import { Permission } from './permissions.entity';

export const permissionsProviders = [
  {
    provide: REPOSITORY.PERMISSIONS,
    useValue: Permission,
  },
];
