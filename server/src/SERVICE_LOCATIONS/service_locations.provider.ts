import { ServiceLocation } from './service_locations.entity';
import { KEYNAMES } from '../shared/constants/keynames';

export const serviceLocationsProviders = [
  {
    provide: KEYNAMES.SERVICE_LOCATIONS,
    useValue: ServiceLocation,
  },
];
