import { Injectable, Logger } from '@nestjs/common';
import Expo, { ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';

@Injectable()
export class PushNotificationService {
  private readonly logger = new Logger(PushNotificationService.name);
  private readonly expo = new Expo();

  /**
   * Send a push notification to one or more Expo push tokens.
   * Silently fails if tokens are invalid or sending fails — never throws.
   */
  async sendPush(
    pushTokens: string[],
    title: string,
    body: string,
    data?: Record<string, unknown>,
  ): Promise<void> {
    // Filter to valid Expo push tokens only
    const validTokens = pushTokens.filter((token) => Expo.isExpoPushToken(token));

    if (validTokens.length === 0) {
      this.logger.debug('No valid Expo push tokens to send to');
      return;
    }

    const messages: ExpoPushMessage[] = validTokens.map((token) => ({
      to: token,
      sound: 'default' as const,
      title,
      body,
      data: data ?? {},
    }));

    const chunks = this.expo.chunkPushNotifications(messages);

    for (const chunk of chunks) {
      try {
        const tickets: ExpoPushTicket[] = await this.expo.sendPushNotificationsAsync(chunk);

        for (const ticket of tickets) {
          if (ticket.status === 'error') {
            this.logger.warn(
              `Push notification error: ${ticket.message} (detail: ${ticket.details?.error ?? 'none'})`,
            );
          }
        }
      } catch (error) {
        this.logger.error('Failed to send push notification chunk', error);
        // Silently continue — push failure should never break business logic
      }
    }
  }
}
