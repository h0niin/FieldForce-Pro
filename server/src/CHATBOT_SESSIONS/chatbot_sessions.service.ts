import { Injectable, Inject, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ChatbotSession } from './chatbot_sessions.entity';
import { SendMessageDto, QuerySessionsDto } from './dto/chatbot_sessions.dto';
import { PageOptionsDto } from '../shared/dto/page-options.dto';
import { PageDto } from '../shared/dto/page.dto';
import { PageMetaDto } from '../shared/dto/page-meta.dto';
import axios, { AxiosInstance } from 'axios';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ChatbotSessionsService {
  private readonly logger = new Logger(ChatbotSessionsService.name);
  private aiServiceClient: AxiosInstance;

  constructor(
    @Inject('CHATBOT_SESSIONS_REPOSITORY')
    private sessionsRepository: typeof ChatbotSession,
    private configService: ConfigService,
  ) {
    const aiServiceUrl = this.configService.get<string>('AI_SERVICE_URL', 'http://localhost:8000');
    this.aiServiceClient = axios.create({
      baseURL: aiServiceUrl,
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  async sendMessage(dto: SendMessageDto, tenantId: string, userId: string): Promise<any> {
    try {
      let session: ChatbotSession;

      if (dto.session_id) {
        const found = await this.sessionsRepository.findOne({
          where: {
            id: dto.session_id,
            tenant_id: tenantId,
            user_id: userId,
            is_deleted: false,
          },
        });

        if (!found) {
          throw new HttpException('Session not found', HttpStatus.NOT_FOUND);
        }
        session = found;
      } else {
        session = await this.sessionsRepository.create({
          tenant_id: tenantId,
          user_id: userId,
          session_type: dto.session_type || 'internal',
          status: 'active',
          title: dto.message.substring(0, 100),
          messages: [],
          context: dto.context || {},
          message_count: 0,
          is_deleted: false,
        });
      }

      // Call AI chatbot service
      let aiReply: any;
      try {
        const response = await this.aiServiceClient.post(
          '/api/chat/message',
          {
            message: dto.message,
            session_id: session.id,
            context: dto.context,
          },
          {
            headers: {
              Authorization: `Bearer ${this.generateToken(tenantId)}`,
            },
          },
        );
        aiReply = response.data.data;
      } catch (aiError) {
        this.logger.warn('AI service unavailable, using placeholder: %s', aiError.message);
        aiReply = {
          reply:
            'I apologize, but I am currently unavailable. Please try again later or contact support.',
          session_id: session.id,
          sources: [],
          suggested_actions: [],
        };
      }

      // Save message to session
      const messages = session.messages || [];
      const now = new Date().toISOString();
      messages.push({ role: 'user', content: dto.message, timestamp: now });
      messages.push({
        role: 'assistant',
        content: aiReply.reply,
        timestamp: now,
        sources: aiReply.sources,
      });

      await session.update({
        messages,
        message_count: messages.length,
        last_message_at: new Date(),
      });

      return {
        session_id: session.id,
        reply: aiReply.reply,
        sources: aiReply.sources || [],
        suggested_actions: aiReply.suggested_actions || [],
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error('Chat message error:', error);
      throw new HttpException('Failed to process chat message', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getSessions(
    dto: QuerySessionsDto,
    pageOptions: PageOptionsDto,
    tenantId: string,
    userId: string,
  ): Promise<PageDto<ChatbotSession>> {
    const whereClause: any = {
      tenant_id: tenantId,
      user_id: userId,
      is_deleted: false,
    };

    if (dto.status) whereClause.status = dto.status;
    if (dto.session_type) whereClause.session_type = dto.session_type;

    const { rows, count } = await this.sessionsRepository.findAndCountAll({
      where: whereClause,
      limit: pageOptions.take,
      offset: pageOptions.skip,
      order: [['last_message_at', 'DESC']],
      attributes: { exclude: ['messages'] },
    });

    const pageMeta = new PageMetaDto({
      itemCount: count,
      pageOptionsDto: pageOptions,
    });

    return new PageDto(rows, pageMeta);
  }

  async getSessionById(id: string, tenantId: string, userId: string): Promise<ChatbotSession> {
    const session = await this.sessionsRepository.findOne({
      where: {
        id,
        tenant_id: tenantId,
        user_id: userId,
        is_deleted: false,
      },
    });

    if (!session) {
      throw new HttpException('Session not found', HttpStatus.NOT_FOUND);
    }

    return session;
  }

  async closeSession(id: string, tenantId: string, userId: string): Promise<ChatbotSession> {
    const session = await this.getSessionById(id, tenantId, userId);
    await session.update({ status: 'closed' });
    return session;
  }

  async deleteSession(id: string, tenantId: string, userId: string): Promise<void> {
    const session = await this.getSessionById(id, tenantId, userId);
    await session.update({ is_deleted: true });
  }

  private generateToken(tenantId: string): string {
    return `mock_token_${tenantId}`;
  }
}
