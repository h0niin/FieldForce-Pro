import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import * as QRCode from 'qrcode';

/**
 * Manages whatsapp-web.js Client instances per tenant.
 * Each tenant gets their own client, QR code, and session persistence.
 */

interface ClientState {
  client: any; // whatsapp-web.js Client
  qrCode: string | null;
  status: 'initializing' | 'qr_ready' | 'authenticated' | 'connected' | 'disconnected' | 'error';
  error: string | null;
  phoneNumber: string | null;
}

@Injectable()
export class WhatsAppWebJsService implements OnModuleDestroy {
  private readonly logger = new Logger(WhatsAppWebJsService.name);
  private readonly clients = new Map<string, ClientState>();

  async onModuleDestroy() {
    // Gracefully destroy all clients on shutdown
    for (const [tenantId, state] of this.clients.entries()) {
      try {
        if (state.client) {
          await state.client.destroy();
          this.logger.log(`Destroyed Web JS client for tenant ${tenantId}`);
        }
      } catch (err) {
        this.logger.error(`Error destroying client for tenant ${tenantId}: ${err.message}`);
      }
    }
    this.clients.clear();
  }

  /**
   * Initialize a whatsapp-web.js Client for a tenant.
   * If one already exists and is connected, returns existing status.
   */
  async initializeClient(
    tenantId: string,
    onConnected?: (phoneNumber: string) => Promise<void>,
    onMessage?: (from: string, body: string, profileName: string, mediaUrl: string | null) => Promise<string>,
  ): Promise<{ status: string; message: string }> {
    const existing = this.clients.get(tenantId);

    // If already connected, skip re-initialization
    if (existing && (existing.status === 'connected' || existing.status === 'authenticated')) {
      return { status: existing.status, message: 'Client already connected' };
    }

    // If already initializing, skip
    if (existing && existing.status === 'initializing') {
      return { status: 'initializing', message: 'Client is already initializing, please wait for QR code' };
    }

    // Destroy any existing broken client
    if (existing?.client) {
      try {
        await existing.client.destroy();
      } catch {
        // ignore
      }
    }

    // Set initial state
    const state: ClientState = {
      client: null,
      qrCode: null,
      status: 'initializing',
      error: null,
      phoneNumber: null,
    };
    this.clients.set(tenantId, state);

    try {
      // Dynamic import to avoid crashing if whatsapp-web.js isn't installed
      const wwjs = await import('whatsapp-web.js');
      const Client = wwjs.Client;
      const LocalAuth = wwjs.LocalAuth;

      const client = new Client({
        authStrategy: new LocalAuth({ clientId: `tenant_${tenantId}` }),
        puppeteer: {
          headless: true,
          executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--single-process',
          ],
        },
      });

      state.client = client;

      // QR code event
      client.on('qr', async (qr: string) => {
        this.logger.log(`QR code received for tenant ${tenantId}`);
        try {
          // Convert QR string to data URL image
          const qrDataUrl = await QRCode.toDataURL(qr, {
            width: 300,
            margin: 2,
            color: { dark: '#000000', light: '#ffffff' },
          });
          state.qrCode = qrDataUrl;
          state.status = 'qr_ready';
          state.error = null;
        } catch (err) {
          this.logger.error(`QR generation error: ${err.message}`);
          state.error = 'Failed to generate QR code';
        }
      });

      // Authenticated event (QR scanned, before fully ready)
      client.on('authenticated', () => {
        this.logger.log(`Client authenticated for tenant ${tenantId}`);
        state.status = 'authenticated';
        state.qrCode = null;
        state.error = null;
      });

      // Ready event (fully connected)
      client.on('ready', async () => {
        this.logger.log(`Client ready for tenant ${tenantId}`);
        state.status = 'connected';
        state.qrCode = null;
        state.error = null;

        // Get the connected phone number
        try {
          const info = client.info;
          const wid = info?.wid;
          state.phoneNumber = wid ? `+${wid.user}` : null;
          this.logger.log(`Connected phone: ${state.phoneNumber} for tenant ${tenantId}`);

          if (onConnected && state.phoneNumber) {
            await onConnected(state.phoneNumber);
          }
        } catch (err) {
          this.logger.error(`Error getting phone info: ${err.message}`);
        }
      });

      // Incoming message handler
      client.on('message', async (msg: any) => {
        if (!onMessage) return;
        if (msg.fromMe) return; // Ignore own messages

        try {
          const from = msg.from.replace('@c.us', '').replace('@s.whatsapp.net', '');
          const body = msg.body || '';
          const contact = await msg.getContact();
          const profileName = contact?.pushname || contact?.name || '';
          let mediaUrl: string | null = null;

          if (msg.hasMedia) {
            try {
              const media = await msg.downloadMedia();
              if (media) {
                mediaUrl = `data:${media.mimetype};base64,${media.data}`;
              }
            } catch {
              // ignore media download failures
            }
          }

          const reply = await onMessage(from, body, profileName, mediaUrl);

          // Send the AI reply back via Web JS
          if (reply) {
            await msg.reply(reply);
          }
        } catch (err) {
          this.logger.error(`Error processing Web JS message: ${err.message}`);
        }
      });

      // Disconnected event
      client.on('disconnected', (reason: string) => {
        this.logger.warn(`Client disconnected for tenant ${tenantId}: ${reason}`);
        state.status = 'disconnected';
        state.qrCode = null;
        state.error = `Disconnected: ${reason}`;
        state.phoneNumber = null;
      });

      // Auth failure
      client.on('auth_failure', (msg: string) => {
        this.logger.error(`Auth failure for tenant ${tenantId}: ${msg}`);
        state.status = 'error';
        state.error = `Authentication failed: ${msg}`;
        state.qrCode = null;
      });

      // Start the client (non-blocking)
      client.initialize().catch((err: Error) => {
        this.logger.error(`Client initialization failed for tenant ${tenantId}: ${err.message}`);
        state.status = 'error';
        state.error = `Initialization failed: ${err.message}`;
      });

      return { status: 'initializing', message: 'Client initializing, QR code will be available shortly' };
    } catch (err) {
      state.status = 'error';
      state.error = err.message;
      this.logger.error(`Failed to create client for tenant ${tenantId}: ${err.message}`);
      return { status: 'error', message: err.message };
    }
  }

  /**
   * Get the current QR code data URL for a tenant, or connection status.
   */
  getQrStatus(tenantId: string): {
    status: string;
    qr_data_url: string | null;
    phone_number: string | null;
    error: string | null;
  } {
    const state = this.clients.get(tenantId);
    if (!state) {
      return { status: 'not_initialized', qr_data_url: null, phone_number: null, error: null };
    }

    return {
      status: state.status,
      qr_data_url: state.qrCode,
      phone_number: state.phoneNumber,
      error: state.error,
    };
  }

  /**
   * Get connection status for a tenant.
   */
  getStatus(tenantId: string): string {
    return this.clients.get(tenantId)?.status || 'not_initialized';
  }

  /**
   * Check if a tenant's Web JS client is connected.
   */
  isConnected(tenantId: string): boolean {
    return this.clients.get(tenantId)?.status === 'connected';
  }

  /**
   * Send a message via a tenant's Web JS client.
   */
  async sendMessage(tenantId: string, to: string, body: string): Promise<void> {
    const state = this.clients.get(tenantId);
    if (!state?.client || state.status !== 'connected') {
      this.logger.warn(`Cannot send message: client not connected for tenant ${tenantId}`);
      return;
    }

    try {
      const chatId = to.includes('@') ? to : `${to}@c.us`;
      await state.client.sendMessage(chatId, body);
      this.logger.log(`Web JS message sent to ${to} for tenant ${tenantId}`);
    } catch (err) {
      this.logger.error(`Failed to send Web JS message: ${err.message}`);
    }
  }

  /**
   * Destroy and disconnect a tenant's Web JS client.
   */
  async destroyClient(tenantId: string): Promise<void> {
    const state = this.clients.get(tenantId);
    if (state?.client) {
      try {
        await state.client.destroy();
      } catch (err) {
        this.logger.error(`Error destroying client: ${err.message}`);
      }
    }
    this.clients.delete(tenantId);
    this.logger.log(`Destroyed Web JS client for tenant ${tenantId}`);
  }
}
