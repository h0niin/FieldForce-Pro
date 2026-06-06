import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Twilio incoming message webhook payload (relevant fields).
 * @see https://www.twilio.com/docs/messaging/guides/webhook-request
 */
export class TwilioWebhookPayload {
  MessageSid?: string;
  AccountSid?: string;
  From?: string;       // e.g. "whatsapp:+971501234567"
  To?: string;         // e.g. "whatsapp:+14155238886"
  Body?: string;
  NumMedia?: string;
  MediaUrl0?: string;
  MediaContentType0?: string;
  ProfileName?: string;
}

/**
 * Meta (WhatsApp Cloud API) incoming webhook payload.
 * @see https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/payload-examples
 */
export class MetaWebhookPayload {
  object?: string;
  entry?: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        contacts?: Array<{
          profile: { name: string };
          wa_id: string;
        }>;
        messages?: Array<{
          from: string;
          id: string;
          timestamp: string;
          type: string;
          text?: { body: string };
          image?: { id: string; mime_type: string; sha256: string; caption?: string };
          document?: { id: string; mime_type: string; sha256: string; filename?: string };
          audio?: { id: string; mime_type: string; sha256: string };
          video?: { id: string; mime_type: string; sha256: string };
          location?: { latitude: number; longitude: number; name?: string; address?: string };
        }>;
        statuses?: Array<{
          id: string;
          status: string;
          timestamp: string;
          recipient_id: string;
        }>;
      };
      field: string;
    }>;
  }>;
}

/**
 * Meta webhook verification query params.
 */
export class MetaWebhookVerifyQuery {
  @ApiPropertyOptional()
  'hub.mode'?: string;

  @ApiPropertyOptional()
  'hub.verify_token'?: string;

  @ApiPropertyOptional()
  'hub.challenge'?: string;
}
