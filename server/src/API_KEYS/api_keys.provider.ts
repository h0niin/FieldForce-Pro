import { ApiKey } from './api_keys.entity';
import { REPOSITORY } from '../shared/constants/keynames';

export const apiKeysProviders = [
  {
    provide: REPOSITORY.API_KEYS,
    useValue: ApiKey,
  },
];
