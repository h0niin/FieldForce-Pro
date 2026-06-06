import { BlueprintState } from './blueprint_states.entity';
import { KEYNAMES } from '../shared/constants/keynames';

export const blueprintStatesProviders = [
  {
    provide: KEYNAMES.BLUEPRINT_STATES,
    useValue: BlueprintState,
  },
];
