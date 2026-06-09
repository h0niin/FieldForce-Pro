import { FieldPermission } from './field_permissions.entity';
import { KEYNAMES } from '../shared/constants/keynames';

export const fieldPermissionsProviders = [
  {
    provide: KEYNAMES.FIELD_PERMISSIONS,
    useValue: FieldPermission,
  },
];
