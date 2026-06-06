import { Notification } from './notifications.entity';
import { KEYNAMES } from '../shared/constants/keynames';

export const notificationsProviders = [
  {
    provide: KEYNAMES.NOTIFICATIONS,
    useValue: Notification,
  },
];
