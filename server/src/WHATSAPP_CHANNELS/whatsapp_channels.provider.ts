import { WhatsAppChannel } from './whatsapp_channels.entity';
import { WhatsAppConversation } from './whatsapp_conversations.entity';

export const whatsappChannelsProviders = [
  {
    provide: 'WHATSAPP_CHANNELS_REPOSITORY',
    useValue: WhatsAppChannel,
  },
  {
    provide: 'WHATSAPP_CONVERSATIONS_REPOSITORY',
    useValue: WhatsAppConversation,
  },
];
