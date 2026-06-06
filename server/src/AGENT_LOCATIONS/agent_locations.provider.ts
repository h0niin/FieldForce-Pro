import { AgentLocation } from './agent_locations.entity';
import { KEYNAMES } from '../shared/constants/keynames';

export const agentLocationsProviders = [
  {
    provide: KEYNAMES.AGENT_LOCATIONS,
    useValue: AgentLocation,
  },
];
