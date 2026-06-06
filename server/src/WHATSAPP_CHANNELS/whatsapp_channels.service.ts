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

@Injectable()
export class WhatsAppChannelsService {
  private readonly logger = new Logger(WhatsAppChannelsService.name);

  constructor(
    @Inject('WHATSAPP_CHANNELS_REPOSITORY')
    private readonly channelRepo: typeof WhatsAppChannel,
    @Inject('WHATSAPP_CONVERSATIONS_REPOSITORY')
    private readonly conversationRepo: typeof WhatsAppConversation,
    private readonly configService: ConfigService,
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
      if (dto.twilio_config !== undefined) updateData.twilio_config = dto.twilio_config;
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
      if (channel.connection_method === 'twilio_qr') {
        return this.testTwilioConnection(channel);
      } else {
        return this.testMetaConnection(channel);
      }
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

  /**
   * Returns the Twilio sandbox QR code info for the tenant.
   * Twilio provisions a virtual number per sandbox; the QR lets customers
   * start messaging that number.
   */
  async getQrCodeInfo(tenantId: string): Promise<{
    qr_url: string;
    sandbox_number: string;
    join_code: string;
  }> {
    const channel = await this.getChannel(tenantId);
    const config = (channel?.twilio_config as Record<string, string>) || {};
    const twilioNumber = config.twilio_number || '+14155238886'; // Twilio sandbox default
    const displayName = channel?.display_name || 'fieldforce';
    const joinCode = config.join_code || `join ${displayName.toLowerCase().replace(/\s+/g, '-')}`;

    // Twilio sandbox join link → encoded as QR data
    const qrData = `https://wa.me/${twilioNumber.replace('+', '')}?text=${encodeURIComponent(joinCode)}`;
    // Use a public QR generator API for the QR image
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}`;

    return {
      qr_url: qrUrl,
      sandbox_number: twilioNumber,
      join_code: joinCode,
    };
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

    // Try Twilio default sandbox number match — look in twilio_config
    const allTwilioChannels = await this.channelRepo.findAll({
      where: { connection_method: 'twilio_qr', is_active: true },
    });
    for (const ch of allTwilioChannels) {
      const config = ch.twilio_config as Record<string, string>;
      const twilioNum = (config?.twilio_number || '').replace(/\s/g, '');
      if (twilioNum === normalized || normalized.includes('14155238886')) {
        return ch;
      }
    }

    return null;
  }

  // ─── Private helpers ──────────────────────────────────────────────────────────

  private async testTwilioConnection(channel: WhatsAppChannel): Promise<{ success: boolean; message: string }> {
    const config = channel.twilio_config as Record<string, string>;
    if (!config?.account_sid || !config?.auth_token) {
      throw new BadRequestException('Twilio Account SID and Auth Token are required');
    }

    try {
      // Lazy-load Twilio SDK
      const twilioModule = await import('twilio');
      const twilioInit = twilioModule.default || twilioModule;
      const client = (twilioInit as any)(config.account_sid, config.auth_token);
      // Verify account by fetching account info
      const account = await client.api.accounts(config.account_sid).fetch();
      if (account.status === 'active') {
        await channel.update({ status: 'connected' });
        return { success: true, message: 'Twilio connection verified successfully' };
      }
      await channel.update({ status: 'pending' });
      return { success: false, message: `Twilio account status: ${account.status}` };
    } catch (err) {
      this.logger.error(`Twilio test failed: ${err.message}`);
      await channel.update({ status: 'disconnected' });
      return { success: false, message: `Twilio authentication failed: ${err.message}` };
    }
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
