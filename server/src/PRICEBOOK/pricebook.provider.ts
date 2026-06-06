import { Pricebook } from './pricebook.entity';
import { KEYNAMES } from '../shared/constants/keynames';

export const pricebookProviders = [
  {
    provide: KEYNAMES.PRICEBOOK,
    useValue: Pricebook,
  },
];
