import { EmailChannel } from './email_channels.entity';
import { EmailThread } from './email_threads.entity';

export const emailChannelsProviders = [
  {
    provide: 'EMAIL_CHANNELS_REPOSITORY',
    useValue: EmailChannel,
  },
  {
    provide: 'EMAIL_THREADS_REPOSITORY',
    useValue: EmailThread,
  },
];
