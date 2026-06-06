import {
  Injectable,
  Inject,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { EmailChannel } from './email_channels.entity';
import { EmailThread } from './email_threads.entity';
import { UpsertEmailChannelDto } from './dto/upsert-email-channel.dto';
import { EmailService } from '../shared/services/email.service';
import { PageOptionsDto } from '../shared/dto/page-options.dto';
import { PageDto } from '../shared/dto/page.dto';
import { PageMetaDto } from '../shared/dto/page-meta.dto';
import { Op } from 'sequelize';

@Injectable()
export class EmailChannelsService {
  private readonly logger = new Logger(EmailChannelsService.name);

  constructor(
    @Inject('EMAIL_CHANNELS_REPOSITORY')
    private readonly channelRepo: typeof EmailChannel,
    @Inject('EMAIL_THREADS_REPOSITORY')
    private readonly threadRepo: typeof EmailThread,
    private readonly emailService: EmailService,
  ) {}

  // ─── Channel Config ───────────────────────────────────────────────────────────

  async getChannel(tenantId: string): Promise<EmailChannel | null> {
    return this.channelRepo.findOne({ where: { tenant_id: tenantId } });
  }

  async upsertChannel(
    tenantId: string,
    dto: UpsertEmailChannelDto,
  ): Promise<EmailChannel> {
    const existing = await this.channelRepo.findOne({
      where: { tenant_id: tenantId },
    });

    if (existing) {
      const updateData: Record<string, unknown> = {};
      if (dto.connection_method !== undefined) updateData.connection_method = dto.connection_method;
      if (dto.support_email !== undefined) updateData.support_email = dto.support_email;
      if (dto.platform_email !== undefined) updateData.platform_email = dto.platform_email;
      if (dto.reply_from_name !== undefined) updateData.reply_from_name = dto.reply_from_name;
      if (dto.reply_from_email !== undefined) updateData.reply_from_email = dto.reply_from_email;
      if (dto.acknowledgement_template !== undefined) updateData.acknowledgement_template = dto.acknowledgement_template;
      if (dto.clarification_template !== undefined) updateData.clarification_template = dto.clarification_template;
      if (dto.category_mapping !== undefined) updateData.category_mapping = dto.category_mapping;
      if (dto.priority_rules !== undefined) updateData.priority_rules = dto.priority_rules;
      if (dto.default_category !== undefined) updateData.default_category = dto.default_category;
      if (dto.default_priority !== undefined) updateData.default_priority = dto.default_priority;
      if (dto.allowed_senders !== undefined) updateData.allowed_senders = dto.allowed_senders;
      if (dto.blocked_senders !== undefined) updateData.blocked_senders = dto.blocked_senders;
      if (dto.spam_filter_enabled !== undefined) updateData.spam_filter_enabled = dto.spam_filter_enabled;
      if (dto.human_handoff_keywords !== undefined) updateData.human_handoff_keywords = dto.human_handoff_keywords;
      if (dto.handoff_team !== undefined) updateData.handoff_team = dto.handoff_team;
      if (dto.is_active !== undefined) updateData.is_active = dto.is_active;
      if (dto.imap_config !== undefined) updateData.imap_config = dto.imap_config;
      if (dto.smtp_config !== undefined) updateData.smtp_config = dto.smtp_config;
      if (dto.webhook_secret !== undefined) updateData.webhook_secret = dto.webhook_secret;

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
      throw new NotFoundException('Email channel not configured');
    }

    try {
      // Send a test email to verify the outbound email config works
      const testEmail = channel.support_email || channel.reply_from_email;
      if (!testEmail) {
        return { success: false, message: 'No support email or reply-from email configured' };
      }

      const sent = await this.emailService.sendEmail(
        testEmail,
        'FieldForce Pro — Email Channel Test',
        `This is a test email from FieldForce Pro to verify your Email AI channel is configured correctly.\n\nIf you received this email, your outbound email configuration is working.\n\nTimestamp: ${new Date().toISOString()}`,
      );

      if (sent) {
        await channel.update({ status: 'receiving' });
        return { success: true, message: 'Test email sent successfully. Check your inbox.' };
      }

      return { success: false, message: 'Failed to send test email. Check your mail configuration.' };
    } catch (error) {
      this.logger.error(`Email channel test failed: ${error.message}`);
      await channel.update({ status: 'error' });
      return { success: false, message: error.message };
    }
  }

  async disconnect(tenantId: string): Promise<EmailChannel> {
    const channel = await this.getChannel(tenantId);
    if (!channel) {
      throw new NotFoundException('Email channel not configured');
    }
    await channel.update({ status: 'not_receiving', is_active: false });
    return channel;
  }

  // ─── Channel lookup by email ──────────────────────────────────────────────────

  /**
   * Find the channel by matching the recipient email address.
   * Checks both support_email and platform_email fields.
   */
  async findChannelByEmail(recipientEmail: string): Promise<EmailChannel | null> {
    const normalized = recipientEmail.toLowerCase().trim();

    // Try support_email match
    let channel = await this.channelRepo.findOne({
      where: {
        support_email: { [Op.iLike]: normalized },
        is_active: true,
      },
    });
    if (channel) return channel;

    // Try platform_email match
    channel = await this.channelRepo.findOne({
      where: {
        platform_email: { [Op.iLike]: normalized },
        is_active: true,
      },
    });
    if (channel) return channel;

    // Fallback: check if only one active channel exists (for forwarding setups
    // where the "to" address might not exactly match the stored email)
    const allActive = await this.channelRepo.findAll({
      where: { is_active: true },
    });
    if (allActive.length === 1) {
      return allActive[0];
    }

    return null;
  }

  // ─── Email Threads ────────────────────────────────────────────────────────────

  async getThreads(
    tenantId: string,
    pageOptions: PageOptionsDto,
  ): Promise<PageDto<EmailThread>> {
    const { count, rows } = await this.threadRepo.findAndCountAll({
      where: { tenant_id: tenantId, is_deleted: false },
      order: [['updated_at', 'DESC']],
      limit: pageOptions.take,
      offset: pageOptions.skip,
      attributes: { exclude: ['messages'] },
    });

    const meta = new PageMetaDto({ pageOptionsDto: pageOptions, itemCount: count });
    return new PageDto(rows, meta);
  }

  async getThreadById(
    id: string,
    tenantId: string,
  ): Promise<EmailThread> {
    const thread = await this.threadRepo.findOne({
      where: { id, tenant_id: tenantId, is_deleted: false },
    });
    if (!thread) {
      throw new NotFoundException('Email thread not found');
    }
    return thread;
  }
}
