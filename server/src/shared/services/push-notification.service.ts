import { Injectable, Logger } from '@nestjs/common';

// expo-server-sdk v6+ is ESM-only; use a lazy dynamic import so NestJS
// CommonJS output doesn't try to require() it at module load time.
type ExpoType = import('expo-server-sdk').default;
type ExpoPushMessage = import('expo-server-sdk').ExpoPushMessage;
type ExpoPushTicket = import('expo-server-sdk').ExpoPushTicket;

@Injectable()
export class PushNotificationService {
  private readonly logger = new Logger(PushNotificationService.name);
  private expoInstance: ExpoType | null = null;

  private async getExpo(): Promise<ExpoType> {
    if (!this.expoInstance) {
      const { default: Expo } = await import('expo-server-sdk');
      this.expoInstance = new Expo();
    }
    return this.expoInstance;
  }

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
    const { default: Expo } = await import('expo-server-sdk');

    // Filter to valid Expo push tokens only
    const validTokens = pushTokens.filter((token) => Expo.isExpoPushToken(token));

    if (validTokens.length === 0) {
      this.logger.debug('No valid Expo push tokens to send to');
      return;
    }

    const expo = await this.getExpo();

    const messages: ExpoPushMessage[] = validTokens.map((token) => ({
      to: token,
      sound: 'default' as const,
      title,
      body,
      data: data ?? {},
    }));

    const chunks = expo.chunkPushNotifications(messages);

    for (const chunk of chunks) {
      try {
        const tickets: ExpoPushTicket[] = await expo.sendPushNotificationsAsync(chunk);

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
