import { BlueprintDefinition } from './blueprint_definitions.entity';
import { KEYNAMES } from '../shared/constants/keynames';

export const blueprintDefinitionsProviders = [
  {
    provide: KEYNAMES.BLUEPRINT_DEFINITIONS,
    useValue: BlueprintDefinition,
  },
];
