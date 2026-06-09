import { ModuleMapping } from './module_mappings.entity';
import { KEYNAMES } from '../shared/constants/keynames';

export const moduleMappingsProviders = [
  {
    provide: KEYNAMES.MODULE_MAPPINGS,
    useValue: ModuleMapping,
  },
];
