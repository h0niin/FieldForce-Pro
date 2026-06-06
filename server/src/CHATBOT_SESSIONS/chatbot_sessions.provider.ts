import { ChatbotSession } from './chatbot_sessions.entity';

export const CHATBOT_SESSIONS_PROVIDERS = [
  {
    provide: 'CHATBOT_SESSIONS_REPOSITORY',
    useValue: ChatbotSession,
  },
];
