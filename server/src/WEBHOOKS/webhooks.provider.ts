import { Webhook } from './webhooks.entity';
import { KEYNAMES } from '../shared/constants/keynames';

export const webhooksProviders = [
  {
    provide: KEYNAMES.WEBHOOKS,
    useValue: Webhook,
  },
];
