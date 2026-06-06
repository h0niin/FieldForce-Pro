import { Estimate } from './estimates.entity';
import { KEYNAMES } from '../shared/constants/keynames';

export const estimatesProviders = [
  {
    provide: KEYNAMES.ESTIMATES,
    useValue: Estimate,
  },
];
