import { Injectable, Inject, Logger } from '@nestjs/common';
import { Webhook } from './webhooks.entity';
import { KEYNAMES } from '../shared/constants/keynames';
import axios from 'axios';
import * as crypto from 'crypto';

export interface WebhookPayload {
  event: string;
  data: Record<string, unknown>;
  timestamp: string;
}

@Injectable()
export class WebhookDeliveryService {
  private readonly logger = new Logger(WebhookDeliveryService.name);
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAYS = [1000, 5000, 15000]; // 1s, 5s, 15s

  constructor(
    @Inject(KEYNAMES.WEBHOOKS)
    private readonly webhookRepository: typeof Webhook,
  ) {}

  /**
   * Deliver a webhook event to a specific webhook
   */
  async deliverWebhook(
    webhookId: string,
    event: string,
    payload: Record<string, unknown>,
  ): Promise<boolean> {
    try {
      const webhook = await this.webhookRepository.findByPk(webhookId);
      if (!webhook || !webhook.is_active || webhook.is_deleted) {
        this.logger.warn(`Webhook ${webhookId} not found or inactive`);
        return false;
      }

      // Check if webhook is subscribed to this event
      if (webhook.events && webhook.events.length > 0) {
        const isSubscribed = webhook.events.some((subscribedEvent) => {
          // Support wildcard matching (e.g., "work_order.*")
          if (subscribedEvent.endsWith('.*')) {
            const prefix = subscribedEvent.slice(0, -2);
            return event.startsWith(prefix);
          }
          return subscribedEvent === event;
        });

        if (!isSubscribed) {
          this.logger.debug(`Webhook ${webhookId} not subscribed to event: ${event}`);
          return false;
        }
      }

      const webhookPayload: WebhookPayload = {
        event,
        data: payload,
        timestamp: new Date().toISOString(),
      };

      // Attempt delivery with retries
      const success = await this.attemptDelivery(webhook, webhookPayload);

      // Update last_triggered_at on successful delivery
      if (success) {
        await this.updateLastTriggered(webhookId);
      }

      return success;
    } catch (error) {
      this.logger.error(
        `Error delivering webhook ${webhookId}: ${error.message}`,
        error.stack,
      );
      return false;
    }
  }

  /**
   * Attempt delivery with retry logic
   */
  private async attemptDelivery(
    webhook: Webhook,
    payload: WebhookPayload,
    attempt: number = 0,
  ): Promise<boolean> {
    try {
      const signature = this.signPayload(payload, webhook.secret || '');

      const response = await axios.post(webhook.url, payload, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'FieldForce-Webhook-Delivery/1.0',
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': payload.event,
          'X-Webhook-Delivery-ID': crypto.randomUUID(),
          'X-Webhook-Timestamp': payload.timestamp,
        },
        timeout: 30000, // 30 second timeout
        validateStatus: (status: number) => status >= 200 && status < 300,
      });

      this.logger.log(
        `Webhook delivered successfully to ${webhook.url} (status: ${response.status})`,
      );
      return true;
    } catch (error) {
      this.logger.warn(
        `Webhook delivery failed (attempt ${attempt + 1}/${this.MAX_RETRIES}): ${error.message}`,
      );

      // Retry with exponential backoff
      if (attempt < this.MAX_RETRIES - 1) {
        await this.retryFailedWebhook(webhook, payload, attempt);
        return false;
      }

      this.logger.error(
        `Webhook delivery failed after ${this.MAX_RETRIES} attempts: ${webhook.url}`,
      );
      return false;
    }
  }

  /**
   * Sign the payload with HMAC-SHA256
   */
  signPayload(payload: WebhookPayload, secret: string): string {
    if (!secret) {
      return '';
    }

    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(JSON.stringify(payload));
    return `sha256=${hmac.digest('hex')}`;
  }

  /**
   * Retry failed webhook with exponential backoff
   */
  async retryFailedWebhook(
    webhook: Webhook,
    payload: WebhookPayload,
    attempt: number,
  ): Promise<void> {
    const delay = this.RETRY_DELAYS[attempt];

    this.logger.log(
      `Scheduling retry for webhook ${webhook.id} in ${delay}ms`,
    );

    setTimeout(async () => {
      await this.attemptDelivery(webhook, payload, attempt + 1);
    }, delay);
  }

  /**
   * Update last_triggered_at timestamp
   */
  async updateLastTriggered(webhookId: string): Promise<void> {
    try {
      await this.webhookRepository.update(
        { last_triggered_at: new Date() },
        { where: { id: webhookId } },
      );
    } catch (error) {
      this.logger.error(
        `Error updating last_triggered_at for webhook ${webhookId}: ${error.message}`,
      );
    }
  }

  /**
   * Deliver event to all matching webhooks for a tenant
   */
  async deliverToTenantWebhooks(
    tenantId: string,
    event: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    try {
      const webhooks = await this.webhookRepository.findAll({
        where: {
          tenant_id: tenantId,
          is_active: true,
          is_deleted: false,
        },
      });

      if (webhooks.length === 0) {
        this.logger.debug(`No active webhooks found for tenant ${tenantId}`);
        return;
      }

      this.logger.log(
        `Delivering event ${event} to ${webhooks.length} webhooks`,
      );

      // Deliver to all webhooks in parallel (fire and forget)
      const deliveryPromises = webhooks.map((webhook) =>
        this.deliverWebhook(webhook.id, event, payload),
      );

      await Promise.allSettled(deliveryPromises);
    } catch (error) {
      this.logger.error(
        `Error delivering to tenant webhooks: ${error.message}`,
        error.stack,
      );
    }
  }
}
