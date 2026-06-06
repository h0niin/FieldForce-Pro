import { Communication } from './communication.entity';
import { KEYNAMES } from '../shared/constants/keynames';

export const communicationProviders = [
  {
    provide: KEYNAMES.COMMUNICATION,
    useValue: Communication,
  },
];
