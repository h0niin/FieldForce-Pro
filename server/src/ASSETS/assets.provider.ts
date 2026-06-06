import { Asset } from './assets.entity';
import { KEYNAMES } from '../shared/constants/keynames';

export const assetsProviders = [
  {
    provide: KEYNAMES.ASSETS,
    useValue: Asset,
  },
];
