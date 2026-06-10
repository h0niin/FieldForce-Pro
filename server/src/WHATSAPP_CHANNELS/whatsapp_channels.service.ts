import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WhatsAppChannel } from './whatsapp_channels.entity';
import { WhatsAppConversation } from './whatsapp_conversations.entity';
import { UpsertWhatsAppChannelDto } from './dto/upsert-channel.dto';
import { PageOptionsDto } from '../shared/dto/page-options.dto';
import { PageDto } from '../shared/dto/page.dto';
import { PageMetaDto } from '../shared/dto/page-meta.dto';
import { WhatsAppWebJsService } from './whatsapp_webjs.service';

@Injectable()
export class WhatsAppChannelsService {
  private readonly logger = new Logger(WhatsAppChannelsService.name);

  constructor(
    @Inject('WHATSAPP_CHANNELS_REPOSITORY')
    private readonly channelRepo: typeof WhatsAppChannel,
    @Inject('WHATSAPP_CONVERSATIONS_REPOSITORY')
    private readonly conversationRepo: typeof WhatsAppConversation,
    private readonly configService: ConfigService,
    private readonly webJsService: WhatsAppWebJsService,
  ) {}

  // ─── Channel Config ───────────────────────────────────────────────────────────

  async getChannel(tenantId: string): Promise<WhatsAppChannel | null> {
    return this.channelRepo.findOne({ where: { tenant_id: tenantId } });
  }

  async upsertChannel(
    tenantId: string,
    dto: UpsertWhatsAppChannelDto,
  ): Promise<WhatsAppChannel> {
    const existing = await this.channelRepo.findOne({
      where: { tenant_id: tenantId },
    });

    if (existing) {
      const updateData: Record<string, unknown> = {};
      if (dto.connection_method !== undefined) updateData.connection_method = dto.connection_method;
      if (dto.phone_number !== undefined) updateData.phone_number = dto.phone_number;
      if (dto.display_name !== undefined) updateData.display_name = dto.display_name;
      if (dto.meta_config !== undefined) updateData.meta_config = dto.meta_config;
      if (dto.greeting_message !== undefined) updateData.greeting_message = dto.greeting_message;
      if (dto.confirmation_message !== undefined) updateData.confirmation_message = dto.confirmation_message;
      if (dto.working_hours_mode !== undefined) updateData.working_hours_mode = dto.working_hours_mode;
      if (dto.office_hours !== undefined) updateData.office_hours = dto.office_hours;
      if (dto.languages !== undefined) updateData.languages = dto.languages;
      if (dto.required_fields !== undefined) updateData.required_fields = dto.required_fields;
      if (dto.default_priority !== undefined) updateData.default_priority = dto.default_priority;
      if (dto.handoff_team !== undefined) updateData.handoff_team = dto.handoff_team;
      if (dto.blocked_numbers !== undefined) updateData.blocked_numbers = dto.blocked_numbers;
      if (dto.is_active !== undefined) updateData.is_active = dto.is_active;

      await existing.update(updateData);
      return existing;
    }

    return this.channelRepo.create({
      tenant_id: tenantId,
      ...dto,
    });
  }

  async testConnection(tenantId: string): Promise<{ success: boolean; message: string }> {
    const channel = await this.getChannel(tenantId);
    if (!channel) {
      throw new NotFoundException('WhatsApp channel not configured');
    }

    try {
      if (channel.connection_method === 'web_js') {
        return this.testWebJsConnection(channel);
      }
      return this.testMetaConnection(channel);
    } catch (error) {
      this.logger.error(`Connection test failed: ${error.message}`);
      await channel.update({ status: 'disconnected' });
      return { success: false, message: error.message };
    }
  }

  async disconnect(tenantId: string): Promise<WhatsAppChannel> {
    const channel = await this.getChannel(tenantId);
    if (!channel) {
      throw new NotFoundException('WhatsApp channel not configured');
    }
    await channel.update({ status: 'disconnected', is_active: false });
    return channel;
  }


  // ─── Conversations ────────────────────────────────────────────────────────────

  async getConversations(
    tenantId: string,
    pageOptions: PageOptionsDto,
  ): Promise<PageDto<WhatsAppConversation>> {
    const { count, rows } = await this.conversationRepo.findAndCountAll({
      where: { tenant_id: tenantId, is_deleted: false },
      order: [['updated_at', 'DESC']],
      limit: pageOptions.take,
      offset: pageOptions.skip,
      attributes: { exclude: ['messages'] },
    });

    const meta = new PageMetaDto({ pageOptionsDto: pageOptions, itemCount: count });
    return new PageDto(rows, meta);
  }

  async getConversationById(
    id: string,
    tenantId: string,
  ): Promise<WhatsAppConversation> {
    const conv = await this.conversationRepo.findOne({
      where: { id, tenant_id: tenantId, is_deleted: false },
    });
    if (!conv) {
      throw new NotFoundException('Conversation not found');
    }
    return conv;
  }

  /**
   * Find active conversation for a phone number + tenant, or return null.
   */
  async findActiveConversation(
    tenantId: string,
    customerPhone: string,
  ): Promise<WhatsAppConversation | null> {
    return this.conversationRepo.findOne({
      where: {
        tenant_id: tenantId,
        customer_phone: customerPhone,
        status: 'active',
        is_deleted: false,
      },
    });
  }

  /**
   * Finds the tenant by matching the Twilio/Meta phone number to a channel config.
   */
  async findChannelByPhoneNumber(phoneNumber: string): Promise<WhatsAppChannel | null> {
    // Normalize: strip "whatsapp:" prefix and spaces
    const normalized = phoneNumber.replace('whatsapp:', '').replace(/\s/g, '');

    // Try direct phone_number match
    let channel = await this.channelRepo.findOne({
      where: { phone_number: normalized, is_active: true },
    });
    if (channel) return channel;


    return null;
  }

  // ─── Private helpers ──────────────────────────────────────────────────────────

  private testWebJsConnection(channel: WhatsAppChannel): { success: boolean; message: string } {
    const isConnected = this.webJsService.isConnected(channel.tenant_id);
    if (isConnected) {
      return { success: true, message: 'WhatsApp Web JS client is connected' };
    }
    const status = this.webJsService.getStatus(channel.tenant_id);
    return { success: false, message: `Web JS client status: ${status}` };
  }


  private async testMetaConnection(channel: WhatsAppChannel): Promise<{ success: boolean; message: string }> {
    const config = channel.meta_config as Record<string, string>;
    if (!config?.access_token || !config?.phone_number_id) {
      throw new BadRequestException('Meta Access Token and Phone Number ID are required');
    }

    try {
      const axios = (await import('axios')).default;
      const response = await axios.get(
        `https://graph.facebook.com/v18.0/${config.phone_number_id}`,
        { headers: { Authorization: `Bearer ${config.access_token}` } },
      );

      if (response.data?.id) {
        await channel.update({
          status: 'connected',
          phone_number: response.data.display_phone_number || channel.phone_number,
        });
        return { success: true, message: 'Meta Business API connection verified' };
      }
      await channel.update({ status: 'pending' });
      return { success: false, message: 'Could not verify Meta API connection' };
    } catch (err) {
      this.logger.error(`Meta API test failed: ${err.message}`);
      await channel.update({ status: 'disconnected' });
      return { success: false, message: `Meta API authentication failed: ${err.message}` };
    }
  }
}
