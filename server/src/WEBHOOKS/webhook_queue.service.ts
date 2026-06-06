import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { WebhookDeliveryService } from './webhook_delivery.service';
import { Webhook } from './webhooks.entity';

interface QueuedWebhook {
  webhook: Webhook;
  event: string;
  payload: Record<string, unknown>;
  timestamp: Date;
}

@Injectable()
export class WebhookQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WebhookQueueService.name);
  private queue: QueuedWebhook[] = [];
  private processingInterval: NodeJS.Timeout | null = null;
  private readonly PROCESS_INTERVAL_MS = 1000; // Process queue every 1 second
  private readonly MAX_QUEUE_SIZE = 1000;
  private isProcessing = false;

  constructor(private readonly webhookDeliveryService: WebhookDeliveryService) {}

  onModuleInit() {
    this.startQueueProcessor();
    this.logger.log('Webhook queue processor started');
  }

  onModuleDestroy() {
    this.stopQueueProcessor();
    this.logger.log('Webhook queue processor stopped');
  }

  /**
   * Add a webhook to the queue
   */
  queueWebhook(
    webhook: Webhook,
    event: string,
    payload: Record<string, unknown>,
  ): boolean {
    if (this.queue.length >= this.MAX_QUEUE_SIZE) {
      this.logger.warn(`Queue is full (${this.MAX_QUEUE_SIZE} items), dropping webhook`);
      return false;
    }

    this.queue.push({
      webhook,
      event,
      payload,
      timestamp: new Date(),
    });

    this.logger.debug(`Queued webhook for ${webhook.url} (queue size: ${this.queue.length})`);
    return true;
  }

  /**
   * Start the background queue processor
   */
  startQueueProcessor(): void {
    if (this.processingInterval) {
      this.logger.warn('Queue processor already running');
      return;
    }

    this.processingInterval = setInterval(() => {
      this.processQueue();
    }, this.PROCESS_INTERVAL_MS);
  }

  /**
   * Stop the background queue processor
   */
  stopQueueProcessor(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
  }

  /**
   * Process the queue
   */
  async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      // Process up to 10 webhooks at a time
      const batch = this.queue.splice(0, 10);

      this.logger.debug(`Processing batch of ${batch.length} webhooks`);

      const deliveryPromises = batch.map((item) =>
        this.webhookDeliveryService.deliverWebhook(
          item.webhook.id,
          item.event,
          item.payload,
        ),
      );

      await Promise.allSettled(deliveryPromises);
    } catch (error) {
      this.logger.error(`Error processing queue: ${error.message}`, error.stack);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Get queue size
   */
  getQueueSize(): number {
    return this.queue.length;
  }

  /**
   * Clear the queue
   */
  clearQueue(): void {
    const size = this.queue.length;
    this.queue = [];
    this.logger.log(`Cleared ${size} items from queue`);
  }
}
