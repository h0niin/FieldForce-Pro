import { Injectable, Inject, Logger } from '@nestjs/common';
import { EmailChannel } from './email_channels.entity';
import { EmailThread } from './email_threads.entity';
import { EmailAiService, EmailAiResponse, ExtractedIssue } from './email_ai.service';
import { EmailChannelsService } from './email_channels.service';
import { InboundEmailPayload } from './dto/email-webhook.dto';
import { ServiceRequest } from '../SERVICE_REQUESTS/service_requests.entity';
import { Contact } from '../CONTACTS/contacts.entity';
import { EmailService } from '../shared/services/email.service';
import { KEYNAMES } from '../shared/constants/keynames';
import { Op } from 'sequelize';

@Injectable()
export class EmailProcessingService {
  private readonly logger = new Logger(EmailProcessingService.name);

  constructor(
    @Inject('EMAIL_CHANNELS_REPOSITORY')
    private readonly channelRepo: typeof EmailChannel,
    @Inject('EMAIL_THREADS_REPOSITORY')
    private readonly threadRepo: typeof EmailThread,
    @Inject(KEYNAMES.SERVICE_REQUESTS)
    private readonly serviceRequestRepo: typeof ServiceRequest,
    @Inject(KEYNAMES.CONTACTS)
    private readonly contactRepo: typeof Contact,
    private readonly aiService: EmailAiService,
    private readonly channelsService: EmailChannelsService,
    private readonly emailService: EmailService,
  ) {}

  // ─── Main entry point ─────────────────────────────────────────────────────────

  async processInboundEmail(payload: InboundEmailPayload): Promise<{
    processed: boolean;
    action: string;
    thread_id?: string;
    service_request_ids?: string[];
  }> {
    // Parse sender info
    const { email: senderEmail, name: senderName } = this.parseSender(
      payload.from || '',
      payload.sender_email,
      payload.sender_name,
    );

    const recipientEmail = this.parseRecipientEmail(payload.to || '');
    const subject = payload.subject || '';
    const textBody = payload.text || this.stripHtml(payload.html || '');

    this.logger.log(
      `Inbound email: from=${senderEmail}, to=${recipientEmail}, subject="${subject.substring(0, 60)}..."`,
    );

    // 1. Find the channel by recipient address
    const channel = await this.channelsService.findChannelByEmail(recipientEmail);
    if (!channel) {
      this.logger.warn(`No email channel configured for address ${recipientEmail}`);
      return { processed: false, action: 'no_channel' };
    }

    if (!channel.is_active) {
      this.logger.warn(`Email channel for ${recipientEmail} is inactive`);
      return { processed: false, action: 'channel_inactive' };
    }

    // 2. Check blocked senders
    if (this.isBlocked(channel, senderEmail)) {
      this.logger.warn(`Blocked sender ${senderEmail} for tenant ${channel.tenant_id}`);
      return { processed: false, action: 'blocked_sender' };
    }

    // 3. Check allowed senders (if allowlist is configured)
    if (!this.isAllowed(channel, senderEmail)) {
      this.logger.warn(`Sender ${senderEmail} not in allowlist for tenant ${channel.tenant_id}`);
      return { processed: false, action: 'not_allowed' };
    }

    // 4. Check for existing thread (reply to existing ticket)
    const existingThread = await this.findExistingThread(
      subject,
      payload.in_reply_to,
      payload.references,
      channel.tenant_id,
    );

    if (existingThread) {
      await this.attachReplyToTicket(existingThread, payload, senderEmail, senderName);
      return {
        processed: true,
        action: 'reply_attached',
        thread_id: existingThread.id,
        service_request_ids: existingThread.service_request_id
          ? [existingThread.service_request_id]
          : [],
      };
    }

    // 5. Call AI to classify and extract
    const attachmentsSummary = (payload.attachments || [])
      .map((a) => `${a.filename} (${a.content_type})`)
      .join(', ');

    const aiResponse = await this.aiService.classifyEmail(
      subject,
      textBody,
      senderEmail,
      senderName,
      attachmentsSummary,
      {
        companyName: channel.reply_from_name || 'Support',
        categories: (channel.category_mapping as string[]) || [],
        priorityRules: (channel.priority_rules as Record<string, unknown>) || {},
        defaultCategory: channel.default_category || 'General',
        defaultPriority: channel.default_priority || 'MEDIUM',
        humanHandoffKeywords: (channel.human_handoff_keywords as string[]) || [],
      },
    );

    // 6. Process based on classification
    return this.handleClassification(
      channel,
      aiResponse,
      payload,
      senderEmail,
      senderName,
      subject,
      textBody,
    );
  }

  // ─── Classification handler ───────────────────────────────────────────────────

  private async handleClassification(
    channel: EmailChannel,
    aiResponse: EmailAiResponse,
    payload: InboundEmailPayload,
    senderEmail: string,
    senderName: string,
    subject: string,
    textBody: string,
  ): Promise<{
    processed: boolean;
    action: string;
    thread_id?: string;
    service_request_ids?: string[];
  }> {
    const classification = aiResponse.classification;

    // Spam, auto-reply, newsletter → ignore
    if (['spam', 'auto_reply', 'newsletter'].includes(classification)) {
      const thread = await this.createThread(
        channel,
        senderEmail,
        senderName,
        subject,
        payload,
        classification as 'spam' | 'ignored',
        aiResponse,
      );

      this.logger.log(`Email classified as ${classification}, no ticket created.`);
      return { processed: true, action: classification, thread_id: thread.id };
    }

    // Find or create contact
    const contactId = await this.findOrCreateContact(
      channel.tenant_id,
      senderEmail,
      senderName,
      aiResponse.issues[0]?.extracted_fields,
    );

    // Create thread
    const thread = await this.createThread(
      channel,
      senderEmail,
      senderName,
      subject,
      payload,
      'processing',
      aiResponse,
      contactId,
    );

    // Sensitive → create ticket flagged for human review
    if (classification === 'sensitive') {
      const sr = await this.createServiceRequest(
        channel,
        thread,
        aiResponse.issues[0] || this.emptyIssue(subject),
        aiResponse,
        senderName,
        contactId,
        true, // flagForReview
      );

      await thread.update({
        status: 'needs_review',
        service_request_id: sr.id,
        ticket_tag: `[Ticket #${sr.request_number}]`,
      });

      // Send neutral ack
      await this.sendAcknowledgement(
        channel,
        senderEmail,
        sr.request_number,
        subject,
        'Thank you for reaching out. Your message has been received and a member of our team will review it shortly.',
      );

      return {
        processed: true,
        action: 'sensitive_review',
        thread_id: thread.id,
        service_request_ids: [sr.id],
      };
    }

    // Service request or unclear → create ticket(s)
    const serviceRequestIds: string[] = [];
    const ticketNumbers: string[] = [];

    // Create a service request for each distinct issue
    for (const issue of aiResponse.issues) {
      try {
        const sr = await this.createServiceRequest(
          channel,
          thread,
          issue,
          aiResponse,
          senderName,
          contactId,
          classification === 'unclear',
        );
        serviceRequestIds.push(sr.id);
        ticketNumbers.push(sr.request_number);
      } catch (error) {
        this.logger.error(`Failed to create service request: ${error.message}`);
      }
    }

    if (serviceRequestIds.length === 0) {
      return { processed: false, action: 'creation_failed', thread_id: thread.id };
    }

    // Update thread with first SR (primary)
    await thread.update({
      status: aiResponse.needs_clarification ? 'needs_review' : 'ticket_created',
      service_request_id: serviceRequestIds[0],
      ticket_tag: `[Ticket #${ticketNumbers[0]}]`,
      ai_confidence: aiResponse.confidence,
    });

    // Send reply email
    if (aiResponse.needs_clarification) {
      await this.sendClarification(channel, senderEmail, ticketNumbers, subject);
    } else {
      const issueSummaries = aiResponse.issues.map((i) => i.summary);
      await this.sendAcknowledgement(
        channel,
        senderEmail,
        ticketNumbers.join(', '),
        subject,
        undefined,
        issueSummaries,
        aiResponse.issues[0]?.category,
      );
    }

    return {
      processed: true,
      action: aiResponse.needs_clarification ? 'ticket_needs_clarification' : 'ticket_created',
      thread_id: thread.id,
      service_request_ids: serviceRequestIds,
    };
  }

  // ─── Thread matching (reply detection) ────────────────────────────────────────

  private async findExistingThread(
    subject: string,
    inReplyTo?: string,
    references?: string,
    tenantId?: string,
  ): Promise<EmailThread | null> {
    if (!tenantId) return null;

    // Method 1: Look for [Ticket #SR-xxxx] tag in subject
    const ticketMatch = subject.match(/\[Ticket\s*#(SR-[A-Z0-9\-]+)\]/i);
    if (ticketMatch) {
      const ticketTag = `[Ticket #${ticketMatch[1]}]`;
      const thread = await this.threadRepo.findOne({
        where: {
          tenant_id: tenantId,
          ticket_tag: ticketTag,
          is_deleted: false,
        },
      });
      if (thread) {
        this.logger.log(`Found existing thread by ticket tag: ${ticketTag}`);
        return thread;
      }
    }

    // Method 2: Match by In-Reply-To / References header
    if (inReplyTo) {
      const thread = await this.threadRepo.findOne({
        where: {
          tenant_id: tenantId,
          thread_reference: inReplyTo,
          is_deleted: false,
        },
      });
      if (thread) {
        this.logger.log(`Found existing thread by In-Reply-To: ${inReplyTo}`);
        return thread;
      }
    }

    return null;
  }

  // ─── Attach reply to existing ticket ──────────────────────────────────────────

  private async attachReplyToTicket(
    thread: EmailThread,
    payload: InboundEmailPayload,
    senderEmail: string,
    senderName: string,
  ): Promise<void> {
    const messages = thread.messages || [];
    messages.push({
      direction: 'inbound',
      from: senderEmail,
      to: payload.to || '',
      subject: payload.subject || '',
      text_body: payload.text || this.stripHtml(payload.html || ''),
      html_body: payload.html,
      timestamp: new Date().toISOString(),
      attachments: (payload.attachments || []).map((a) => ({
        filename: a.filename,
        content_type: a.content_type,
        size: a.size,
      })),
      message_id: payload.message_id,
    });

    await thread.update({ messages, updated_at: new Date() });

    // If the ticket was closed, re-open it
    if (thread.service_request_id) {
      const sr = await this.serviceRequestRepo.findOne({
        where: { id: thread.service_request_id },
      });
      if (sr && sr.status === 'closed') {
        await sr.update({ status: 'new' });
        this.logger.log(
          `Re-opened service request ${sr.request_number} due to customer reply`,
        );
      }
    }

    this.logger.log(
      `Reply from ${senderEmail} attached to thread ${thread.id} (ticket ${thread.ticket_tag})`,
    );
  }

  // ─── Service Request creation ─────────────────────────────────────────────────

  private async createServiceRequest(
    channel: EmailChannel,
    thread: EmailThread,
    issue: ExtractedIssue,
    aiResponse: EmailAiResponse,
    senderName: string,
    contactId: string | null,
    flagForReview: boolean,
  ): Promise<ServiceRequest> {
    const tenantId = channel.tenant_id;

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
    const priority = (
      issue.priority ||
      channel.default_priority ||
      'MEDIUM'
    ).toUpperCase();

    // Build description
    const description = this.buildDescription(
      issue,
      aiResponse,
      thread,
    );

    const serviceRequest = await this.serviceRequestRepo.create({
      tenant_id: tenantId,
      request_number: requestNumber,
      contact_id: contactId,
      subject: (issue.summary || 'Email Service Request').substring(0, 300),
      description,
      priority,
      category: (issue.category || channel.default_category || 'General'),
      status: flagForReview ? 'new' : 'new',
      channel: 'email',
      custom_fields: {
        email_thread_id: thread.id,
        sender_email: thread.sender_email,
        source: 'email_ai',
        ai_confidence: aiResponse.confidence,
        sentiment: aiResponse.sentiment,
        language: aiResponse.language_detected,
        sub_category: issue.sub_category,
        needs_review: flagForReview,
      },
    });

    this.logger.log(
      `Service Request ${requestNumber} created from email thread ${thread.id}`,
    );
    return serviceRequest;
  }

  private buildDescription(
    issue: ExtractedIssue,
    aiResponse: EmailAiResponse,
    thread: EmailThread,
  ): string {
    const lines: string[] = ['[Created via Email AI]', ''];

    if (issue.summary) lines.push(`Issue: ${issue.summary}`);
    if (issue.category) lines.push(`Category: ${issue.category}`);
    if (issue.sub_category) lines.push(`Sub-category: ${issue.sub_category}`);
    if (issue.location) lines.push(`Location: ${issue.location}`);
    if (issue.reference_numbers?.length) {
      lines.push(`Reference numbers: ${issue.reference_numbers.join(', ')}`);
    }
    if (thread.sender_name) lines.push(`Customer: ${thread.sender_name}`);
    lines.push(`Email: ${thread.sender_email}`);
    if (aiResponse.sentiment !== 'neutral') {
      lines.push(`Sentiment: ${aiResponse.sentiment}`);
    }
    if (aiResponse.language_detected !== 'en') {
      lines.push(`Language: ${aiResponse.language_detected}`);
    }

    // Include the original email body (truncated)
    const firstMessage = thread.messages?.[0];
    if (firstMessage?.text_body) {
      lines.push('');
      lines.push('--- Original Email ---');
      lines.push(firstMessage.text_body.substring(0, 2000));
    }

    return lines.join('\n');
  }

  // ─── Contact management ───────────────────────────────────────────────────────

  private async findOrCreateContact(
    tenantId: string,
    senderEmail: string,
    senderName: string,
    extractedFields?: Record<string, unknown>,
  ): Promise<string | null> {
    // Try to find by email
    let contact = await this.contactRepo.findOne({
      where: {
        tenant_id: tenantId,
        email: { [Op.iLike]: senderEmail },
      },
    });

    if (contact) return contact.id;

    // Create new contact
    const customerName = (extractedFields?.customer_name as string) || senderName || 'Email Customer';
    const nameParts = customerName.split(' ');
    const firstName = nameParts[0] || 'Email';
    const lastName = nameParts.slice(1).join(' ') || 'Customer';

    try {
      contact = await this.contactRepo.create({
        tenant_id: tenantId,
        first_name: firstName,
        last_name: lastName,
        email: senderEmail,
        phone: '',
      });
      return contact.id;
    } catch (error) {
      this.logger.error(`Failed to create contact for ${senderEmail}: ${error.message}`);
      return null;
    }
  }

  // ─── Outbound emails ──────────────────────────────────────────────────────────

  private async sendAcknowledgement(
    channel: EmailChannel,
    toEmail: string,
    ticketNumbers: string,
    originalSubject: string,
    customBody?: string,
    issueSummaries?: string[],
    category?: string | null,
  ): Promise<void> {
    const subject = `Re: ${originalSubject} - [Ticket #${ticketNumbers.split(',')[0].trim()}]`;

    let body: string;
    if (customBody) {
      body = customBody;
    } else {
      const template = channel.acknowledgement_template ||
        "Thanks for contacting us. We've logged your request as {ticket_number}.";

      body = template
        .replace(/{ticket_number}/g, ticketNumbers)
        .replace(/{summary}/g, issueSummaries?.[0] || 'your request')
        .replace(/{category}/g, category || 'General');

      // If multiple tickets were created, list them
      if (issueSummaries && issueSummaries.length > 1) {
        body += '\n\nWe identified multiple issues in your email and created separate requests:\n';
        const ticketList = ticketNumbers.split(',').map((t) => t.trim());
        issueSummaries.forEach((summary, i) => {
          const num = ticketList[i] || ticketList[0];
          body += `• ${num}: ${summary}\n`;
        });
      }
    }

    const fromName = channel.reply_from_name || 'Support';
    body += `\n\n— ${fromName}`;

    await this.emailService.sendEmail(toEmail, subject, body);
    this.logger.log(`Acknowledgement email sent to ${toEmail} for ${ticketNumbers}`);
  }

  private async sendClarification(
    channel: EmailChannel,
    toEmail: string,
    ticketNumbers: string[],
    originalSubject: string,
  ): Promise<void> {
    const primaryTicket = ticketNumbers[0];
    const subject = `Re: ${originalSubject} - [Ticket #${primaryTicket}]`;

    const template = channel.clarification_template ||
      "Thanks for reaching out. So we can help quickly, could you tell us more about what's happening?\n\nWe've logged this as {ticket_number} in the meantime.";

    const body = template.replace(/{ticket_number}/g, primaryTicket);
    const fromName = channel.reply_from_name || 'Support';

    await this.emailService.sendEmail(
      toEmail,
      subject,
      `${body}\n\n— ${fromName}`,
    );
    this.logger.log(`Clarification email sent to ${toEmail} for ${primaryTicket}`);
  }

  // ─── Thread creation ──────────────────────────────────────────────────────────

  private async createThread(
    channel: EmailChannel,
    senderEmail: string,
    senderName: string,
    subject: string,
    payload: InboundEmailPayload,
    status: string,
    aiResponse: EmailAiResponse,
    contactId?: string | null,
  ): Promise<EmailThread> {
    const messages = [
      {
        direction: 'inbound' as const,
        from: senderEmail,
        to: payload.to || '',
        subject: subject,
        text_body: payload.text || this.stripHtml(payload.html || ''),
        html_body: payload.html,
        timestamp: payload.date || new Date().toISOString(),
        attachments: (payload.attachments || []).map((a) => ({
          filename: a.filename,
          content_type: a.content_type,
          size: a.size,
        })),
        message_id: payload.message_id,
      },
    ];

    return this.threadRepo.create({
      tenant_id: channel.tenant_id,
      channel_id: channel.id,
      sender_email: senderEmail,
      sender_name: senderName,
      contact_id: contactId || null,
      original_subject: subject,
      thread_reference: payload.message_id || null,
      status,
      messages,
      extracted_data: aiResponse.issues[0]?.extracted_fields || {},
      ai_confidence: aiResponse.confidence,
      is_deleted: false,
    });
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────────

  private parseSender(
    fromHeader: string,
    senderEmail?: string,
    senderName?: string,
  ): { email: string; name: string } {
    if (senderEmail) {
      return { email: senderEmail.toLowerCase().trim(), name: senderName || '' };
    }

    // Parse "Name <email@example.com>" format
    const match = fromHeader.match(/^(.*?)\s*<([^>]+)>/);
    if (match) {
      return {
        name: match[1].replace(/"/g, '').trim(),
        email: match[2].toLowerCase().trim(),
      };
    }

    // Plain email
    return { email: fromHeader.toLowerCase().trim(), name: '' };
  }

  private parseRecipientEmail(toHeader: string): string {
    // Parse "Name <email>" or just "email"
    const match = toHeader.match(/<([^>]+)>/);
    return (match ? match[1] : toHeader).toLowerCase().trim();
  }

  private isBlocked(channel: EmailChannel, senderEmail: string): boolean {
    const blockedList = (channel.blocked_senders as string[]) || [];
    const email = senderEmail.toLowerCase();
    return blockedList.some((pattern) => {
      const p = pattern.toLowerCase();
      if (p.endsWith('*')) {
        return email.startsWith(p.slice(0, -1));
      }
      return email.includes(p);
    });
  }

  private isAllowed(channel: EmailChannel, senderEmail: string): boolean {
    const allowedList = (channel.allowed_senders as string[]) || [];
    if (allowedList.length === 0) return true; // No allowlist = allow all

    const email = senderEmail.toLowerCase();
    return allowedList.some((pattern) => {
      const p = pattern.toLowerCase();
      return email.includes(p);
    });
  }

  private stripHtml(html: string): string {
    return html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<\/div>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  private emptyIssue(subject: string): ExtractedIssue {
    return {
      summary: subject || 'Email service request',
      category: null,
      sub_category: null,
      priority: null,
      location: null,
      reference_numbers: [],
      extracted_fields: {},
    };
  }
}
