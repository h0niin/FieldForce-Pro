import { Webform } from './webforms.entity';
import { KEYNAMES } from '../shared/constants/keynames';

export const webformsProviders = [
  {
    provide: KEYNAMES.WEBFORMS,
    useValue: Webform,
  },
];
