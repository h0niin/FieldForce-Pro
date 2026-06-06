import { Trip } from './trips.entity';
import { KEYNAMES } from '../shared/constants/keynames';

export const tripsProviders = [
  {
    provide: KEYNAMES.TRIPS,
    useValue: Trip,
  },
];
