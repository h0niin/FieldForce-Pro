import { CustomField } from './custom_fields.entity';
import { KEYNAMES } from '../shared/constants/keynames';

export const customFieldsProviders = [
  {
    provide: KEYNAMES.CUSTOM_FIELDS,
    useValue: CustomField,
  },
];
