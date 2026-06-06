import { Module } from '@nestjs/common';
import { ChatbotSessionsController } from './chatbot_sessions.controller';
import { ChatbotSessionsService } from './chatbot_sessions.service';
import { CHATBOT_SESSIONS_PROVIDERS } from './chatbot_sessions.provider';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  controllers: [ChatbotSessionsController],
  providers: [ChatbotSessionsService, ...CHATBOT_SESSIONS_PROVIDERS],
  exports: [ChatbotSessionsService, ...CHATBOT_SESSIONS_PROVIDERS],
})
export class ChatbotSessionsModule {}
