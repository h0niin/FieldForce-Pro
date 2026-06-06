import { Setting } from './settings.entity';
import { KEYNAMES } from '../shared/constants/keynames';

export const settingsProviders = [
  {
    provide: KEYNAMES.SETTINGS,
    useValue: Setting,
  },
];
