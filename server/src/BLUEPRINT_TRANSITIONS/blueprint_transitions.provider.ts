import { BlueprintTransition } from './blueprint_transitions.entity';
import { KEYNAMES } from '../shared/constants/keynames';

export const blueprintTransitionsProviders = [
  {
    provide: KEYNAMES.BLUEPRINT_TRANSITIONS,
    useValue: BlueprintTransition,
  },
];
