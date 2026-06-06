import { Injectable, Inject, Logger } from '@nestjs/common';
import { WhatsAppChannel } from './whatsapp_channels.entity';
import { WhatsAppConversation } from './whatsapp_conversations.entity';
import { WhatsAppAiService, WhatsAppAiResponse } from './whatsapp_ai.service';
import { WhatsAppChannelsService } from './whatsapp_channels.service';
import { TwilioWebhookPayload, MetaWebhookPayload } from './dto/whatsapp-webhook.dto';
import { ServiceRequest } from '../SERVICE_REQUESTS/service_requests.entity';
import { Contact } from '../CONTACTS/contacts.entity';
import { KEYNAMES } from '../shared/constants/keynames';
import { Op } from 'sequelize';

@Injectable()
export class WhatsAppWebhookService {
  private readonly logger = new Logger(WhatsAppWebhookService.name);

  constructor(
    @Inject('WHATSAPP_CHANNELS_REPOSITORY')
    private readonly channelRepo: typeof WhatsAppChannel,
    @Inject('WHATSAPP_CONVERSATIONS_REPOSITORY')
    private readonly conversationRepo: typeof WhatsAppConversation,
    @Inject(KEYNAMES.SERVICE_REQUESTS)
    private readonly serviceRequestRepo: typeof ServiceRequest,
    @Inject(KEYNAMES.CONTACTS)
    private readonly contactRepo: typeof Contact,
    private readonly aiService: WhatsAppAiService,
    private readonly channelsService: WhatsAppChannelsService,
  ) {}

  // ─── Twilio webhook handler ───────────────────────────────────────────────────

  async handleTwilioWebhook(payload: TwilioWebhookPayload): Promise<string> {
    const from = payload.From?.replace('whatsapp:', '') || '';
    const to = payload.To?.replace('whatsapp:', '') || '';
    const body = payload.Body || '';
    const profileName = payload.ProfileName || '';
    const mediaUrl = payload.MediaUrl0 || null;

    this.logger.log(`Twilio webhook: from=${from}, to=${to}, body="${body.substring(0, 50)}..."`);

    // Find the channel by the Twilio number (the "To" number)
    const channel = await this.channelsService.findChannelByPhoneNumber(to);
    if (!channel) {
      this.logger.warn(`No WhatsApp channel configured for number ${to}`);
      return 'No channel configured';
    }

    // Check blocked numbers
    if (this.isBlocked(channel, from)) {
      this.logger.warn(`Blocked number ${from} attempted to message tenant ${channel.tenant_id}`);
      return 'Blocked';
    }

    // Process the message
    const aiResponse = await this.processIncomingMessage(channel, from, body, profileName, mediaUrl);

    // Send the reply via Twilio
    await this.sendTwilioMessage(channel, from, aiResponse.reply);

    return aiResponse.reply;
  }

  // ─── Meta webhook handler ────────────────────────────────────────────────────

  async handleMetaWebhook(payload: MetaWebhookPayload): Promise<void> {
    if (!payload.entry) return;

    for (const entry of payload.entry) {
      for (const change of entry.changes || []) {
        const value = change.value;
        if (!value?.messages) continue;

        const phoneNumberId = value.metadata?.phone_number_id;
        const channel = await this.findChannelByMetaPhoneId(phoneNumberId);
        if (!channel) {
          this.logger.warn(`No channel for Meta phone_number_id: ${phoneNumberId}`);
          continue;
        }

        for (const msg of value.messages) {
          const from = msg.from;
          const profileName = value.contacts?.[0]?.profile?.name || '';
          let body = '';
          let mediaUrl: string | null = null;

          if (msg.type === 'text' && msg.text) {
            body = msg.text.body;
          } else if (msg.type === 'image' && msg.image) {
            body = msg.image.caption || '[Image sent]';
            mediaUrl = msg.image.id; // We'd need to download via Meta API
          } else if (msg.type === 'location' && msg.location) {
            body = `📍 Location: ${msg.location.name || ''} ${msg.location.address || ''} (${msg.location.latitude}, ${msg.location.longitude})`;
          } else {
            body = `[${msg.type} message received]`;
          }

          if (this.isBlocked(channel, from)) continue;

          const aiResponse = await this.processIncomingMessage(channel, from, body, profileName, mediaUrl);
          await this.sendMetaMessage(channel, from, aiResponse.reply);
        }
      }
    }
  }

  // ─── Core message processing ──────────────────────────────────────────────────

  private async processIncomingMessage(
    channel: WhatsAppChannel,
    customerPhone: string,
    messageBody: string,
    profileName: string,
    mediaUrl: string | null,
  ): Promise<WhatsAppAiResponse> {
    // Find or create conversation
    let conversation = await this.channelsService.findActiveConversation(
      channel.tenant_id,
      customerPhone,
    );

    if (!conversation) {
      // Try to find an existing contact by phone number
      const contact = await this.contactRepo.findOne({
        where: {
          tenant_id: channel.tenant_id,
          phone: { [Op.like]: `%${customerPhone.slice(-10)}%` },
        },
      });

      conversation = await this.conversationRepo.create({
        tenant_id: channel.tenant_id,
        channel_id: channel.id,
        customer_phone: customerPhone,
        contact_id: contact?.id || null,
        status: 'active',
        messages: [],
        collected_data: contact
          ? { customer_name: `${contact.first_name} ${contact.last_name}`.trim() }
          : {},
        reminder_sent: false,
        is_deleted: false,
      });
    }

    // Add customer message to history
    const messages = conversation.messages || [];
    const now = new Date().toISOString();
    messages.push({
      role: 'customer',
      content: messageBody,
      timestamp: now,
      media_url: mediaUrl || undefined,
    });

    // Build conversation history for AI (last 20 messages for context window)
    const aiHistory = messages.slice(-20).map((m) => ({
      role: m.role === 'customer' ? 'user' : 'model',
      content: m.content,
    }));
    // Remove the last one (the current message) since we pass it separately
    const historyForAi = aiHistory.slice(0, -1);

    // Call AI engine
    const aiResponse = await this.aiService.processMessage(
      messageBody,
      historyForAi,
      {
        displayName: channel.display_name || 'Support',
        greeting: channel.greeting_message || '',
        requiredFields: (channel.required_fields as Record<string, boolean>) || {},
        languages: (channel.languages as string[]) || ['en'],
        defaultPriority: channel.default_priority || 'MEDIUM',
      },
      (conversation.collected_data as Record<string, unknown>) || {},
    );

    // Add AI reply to history
    messages.push({
      role: 'ai',
      content: aiResponse.reply,
      timestamp: new Date().toISOString(),
    });

    // Update conversation
    const updateData: Record<string, unknown> = {
      messages,
      collected_data: aiResponse.collected_fields,
      last_customer_message_at: new Date(),
    };

    // Handle human handoff
    if (aiResponse.wants_human) {
      updateData.status = 'handed_off';
    }

    // Handle ticket creation
    if (aiResponse.should_create_ticket) {
      try {
        const sr = await this.createServiceRequest(channel, conversation, aiResponse, profileName);
        updateData.service_request_id = sr.id;
        updateData.status = 'completed';

        // Override the AI reply with the confirmation message including ticket number
        const confirmation = (channel.confirmation_message || '✅ Your service request has been created.')
          .replace('{ticket_number}', sr.request_number || sr.id);
        aiResponse.reply = `${confirmation} Your ticket number is **${sr.request_number}**. Our team will contact you shortly.`;

        // Update the last message in history with the actual confirmation
        messages[messages.length - 1].content = aiResponse.reply;
        updateData.messages = messages;
      } catch (error) {
        this.logger.error(`Failed to create service request: ${error.message}`);
        aiResponse.reply = "I'm sorry, there was an issue creating your service request. Please try again or contact our support line.";
        messages[messages.length - 1].content = aiResponse.reply;
        updateData.messages = messages;
      }
    }

    await conversation.update(updateData);

    return aiResponse;
  }

  // ─── Service Request creation from AI collected data ─────────────────────────

  private async createServiceRequest(
    channel: WhatsAppChannel,
    conversation: WhatsAppConversation,
    aiResponse: WhatsAppAiResponse,
    profileName: string,
  ): Promise<ServiceRequest> {
    const data = aiResponse.collected_fields;
    const tenantId = channel.tenant_id;

    // Find or create contact
    let contactId = conversation.contact_id;
    if (!contactId) {
      const customerName = (data.customer_name as string) || profileName || 'WhatsApp Customer';
      const nameParts = customerName.split(' ');
      const firstName = nameParts[0] || 'WhatsApp';
      const lastName = nameParts.slice(1).join(' ') || 'Customer';

      const contact = await this.contactRepo.create({
        tenant_id: tenantId,
        first_name: firstName,
        last_name: lastName,
        phone: conversation.customer_phone,
        email: '',
      });
      contactId = contact.id;

      // Update conversation with the linked contact
      await conversation.update({ contact_id: contactId });
    }

    // Generate request_number
    const today = new Date();
    const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    const todayCount = await this.serviceRequestRepo.count({
      where: {
        tenant_id: tenantId,
        created_at: { [Op.gte]: todayStart, [Op.lt]: todayEnd },
      },
    });
    const shortTenant = tenantId.split('-')[0].toUpperCase();
    const requestNumber = `SR-${shortTenant}-${dateStr}-${String(todayCount + 1).padStart(3, '0')}`;

    // Map priority
    const priority = (aiResponse.inferred_priority || data.priority || channel.default_priority || 'MEDIUM') as string;

    // Create the service request
    const serviceRequest = await this.serviceRequestRepo.create({
      tenant_id: tenantId,
      request_number: requestNumber,
      contact_id: contactId,
      subject: (data.issue_description as string)?.substring(0, 300) || 'WhatsApp Service Request',
      description: this.buildDescription(data, conversation),
      priority: priority.toUpperCase(),
      category: (aiResponse.inferred_category || data.category || 'General') as string,
      status: 'new',
      channel: 'whatsapp',
      custom_fields: {
        whatsapp_conversation_id: conversation.id,
        customer_phone: conversation.customer_phone,
        source: 'whatsapp_ai',
      },
    });

    this.logger.log(`Service Request ${requestNumber} created from WhatsApp conversation ${conversation.id}`);
    return serviceRequest;
  }

  private buildDescription(
    data: Record<string, unknown>,
    conversation: WhatsAppConversation,
  ): string {
    const lines: string[] = ['[Created via WhatsApp AI]', ''];

    if (data.issue_description) lines.push(`Issue: ${data.issue_description}`);
    if (data.category) lines.push(`Category: ${data.category}`);
    if (data.sub_category) lines.push(`Sub-category: ${data.sub_category}`);
    if (data.location) lines.push(`Location: ${data.location}`);
    if (data.preferred_time) lines.push(`Preferred time: ${data.preferred_time}`);
    if (data.customer_name) lines.push(`Customer: ${data.customer_name}`);
    lines.push(`Phone: ${conversation.customer_phone}`);

    return lines.join('\n');
  }

  // ─── Outbound messaging ───────────────────────────────────────────────────────

  private async sendTwilioMessage(
    channel: WhatsAppChannel,
    to: string,
    body: string,
  ): Promise<void> {
    const config = channel.twilio_config as Record<string, string>;
    if (!config?.account_sid || !config?.auth_token) {
      this.logger.warn('Twilio not configured, skipping outbound message');
      return;
    }

    try {
      const twilioModule = await import('twilio');
      const twilioInit = twilioModule.default || twilioModule;
      const client = (twilioInit as any)(config.account_sid, config.auth_token);
      const fromNumber = config.twilio_number || '+14155238886';

      await client.messages.create({
        body,
        from: `whatsapp:${fromNumber}`,
        to: `whatsapp:${to}`,
      });

      this.logger.log(`Twilio message sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send Twilio message: ${error.message}`);
    }
  }

  private async sendMetaMessage(
    channel: WhatsAppChannel,
    to: string,
    body: string,
  ): Promise<void> {
    const config = channel.meta_config as Record<string, string>;
    if (!config?.access_token || !config?.phone_number_id) {
      this.logger.warn('Meta API not configured, skipping outbound message');
      return;
    }

    try {
      const axios = (await import('axios')).default;
      await axios.post(
        `https://graph.facebook.com/v18.0/${config.phone_number_id}/messages`,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to,
          type: 'text',
          text: { body },
        },
        {
          headers: {
            Authorization: `Bearer ${config.access_token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      this.logger.log(`Meta API message sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send Meta API message: ${error.message}`);
    }
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────────

  private isBlocked(channel: WhatsAppChannel, phone: string): boolean {
    const blockedList = (channel.blocked_numbers as string[]) || [];
    return blockedList.some((b) => phone.includes(b));
  }

  private async findChannelByMetaPhoneId(phoneNumberId: string): Promise<WhatsAppChannel | null> {
    if (!phoneNumberId) return null;

    const channels = await this.channelRepo.findAll({
      where: { connection_method: 'business_api', is_active: true },
    });

    for (const ch of channels) {
      const config = ch.meta_config as Record<string, string>;
      if (config?.phone_number_id === phoneNumberId) {
        return ch;
      }
    }

    return null;
  }
}
