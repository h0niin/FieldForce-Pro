import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Param,
  Query,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiExcludeEndpoint } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { WhatsAppChannelsService } from './whatsapp_channels.service';
import { WhatsAppWebhookService } from './whatsapp_webhook.service';
import { UpsertWhatsAppChannelDto, TestConnectionDto } from './dto/upsert-channel.dto';
import { TwilioWebhookPayload, MetaWebhookPayload, MetaWebhookVerifyQuery } from './dto/whatsapp-webhook.dto';
import { DataResponseDto } from '../shared/dto/data-response.dto';
import { PageOptionsDto } from '../shared/dto/page-options.dto';
import { TenantId } from '../shared/decorator/tenant.decorator';
import { Permissions } from '../shared/decorator/permission.decorator';
import { Public } from '../shared/decorator/public.decorator';

@ApiTags('WhatsApp')
@Controller('whatsapp')
export class WhatsAppChannelsController {
  private readonly logger = new Logger(WhatsAppChannelsController.name);

  constructor(
    private readonly channelsService: WhatsAppChannelsService,
    private readonly webhookService: WhatsAppWebhookService,
  ) {}

  // ─── Channel Config Endpoints (authenticated) ─────────────────────────────────

  @Get('channel')
  @ApiBearerAuth()
  @Permissions('settings:read')
  @ApiOperation({ summary: 'Get WhatsApp channel config for tenant' })
  async getChannel(@TenantId() tenantId: string) {
    const channel = await this.channelsService.getChannel(tenantId);
    return DataResponseDto.success(channel, 'WhatsApp channel fetched');
  }

  @Put('channel')
  @ApiBearerAuth()
  @Permissions('settings:update')
  @ApiOperation({ summary: 'Create or update WhatsApp channel config' })
  async upsertChannel(
    @TenantId() tenantId: string,
    @Body() dto: UpsertWhatsAppChannelDto,
  ) {
    const channel = await this.channelsService.upsertChannel(tenantId, dto);
    return DataResponseDto.success(channel, 'WhatsApp channel saved');
  }

  @Post('channel/test')
  @ApiBearerAuth()
  @Permissions('settings:update')
  @ApiOperation({ summary: 'Test WhatsApp connection' })
  async testConnection(@TenantId() tenantId: string) {
    const result = await this.channelsService.testConnection(tenantId);
    return DataResponseDto.success(result, result.success ? 'Connection successful' : 'Connection failed');
  }

  @Post('channel/disconnect')
  @ApiBearerAuth()
  @Permissions('settings:update')
  @ApiOperation({ summary: 'Disconnect WhatsApp channel' })
  async disconnect(@TenantId() tenantId: string) {
    const channel = await this.channelsService.disconnect(tenantId);
    return DataResponseDto.success(channel, 'WhatsApp channel disconnected');
  }

  @Get('channel/qr-code')
  @ApiBearerAuth()
  @Permissions('settings:read')
  @ApiOperation({ summary: 'Get Twilio QR code info for customer scanning' })
  async getQrCode(@TenantId() tenantId: string) {
    const qrInfo = await this.channelsService.getQrCodeInfo(tenantId);
    return DataResponseDto.success(qrInfo, 'QR code info fetched');
  }

  // ─── Conversation Endpoints (authenticated) ──────────────────────────────────

  @Get('conversations')
  @ApiBearerAuth()
  @Permissions('settings:read')
  @ApiOperation({ summary: 'List WhatsApp conversations (paginated)' })
  async getConversations(
    @TenantId() tenantId: string,
    @Query() pageOptions: PageOptionsDto,
  ) {
    const result = await this.channelsService.getConversations(tenantId, pageOptions);
    return DataResponseDto.success(result, 'Conversations fetched');
  }

  @Get('conversations/:id')
  @ApiBearerAuth()
  @Permissions('settings:read')
  @ApiOperation({ summary: 'Get a single WhatsApp conversation with full message history' })
  async getConversation(
    @Param('id') id: string,
    @TenantId() tenantId: string,
  ) {
    const conversation = await this.channelsService.getConversationById(id, tenantId);
    return DataResponseDto.success(conversation, 'Conversation fetched');
  }

  // ─── Webhook Endpoints (public — validated internally) ───────────────────────

  @Post('webhook/twilio')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiExcludeEndpoint()
  async twilioWebhook(@Body() body: TwilioWebhookPayload, @Res() res: Response) {
    this.logger.log('Twilio webhook received');

    try {
      const reply = await this.webhookService.handleTwilioWebhook(body);

      // Twilio expects TwiML response
      res.set('Content-Type', 'text/xml');
      res.send(`<?xml version="1.0" encoding="UTF-8"?><Response><Message>${this.escapeXml(reply)}</Message></Response>`);
    } catch (error) {
      this.logger.error(`Twilio webhook error: ${error.message}`);
      res.set('Content-Type', 'text/xml');
      res.send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
    }
  }

  @Get('webhook/meta')
  @Public()
  @ApiExcludeEndpoint()
  async metaWebhookVerify(@Query() query: MetaWebhookVerifyQuery, @Res() res: Response) {
    // Meta webhook verification challenge
    const mode = query['hub.mode'];
    const token = query['hub.verify_token'];
    const challenge = query['hub.challenge'];

    this.logger.log(`Meta webhook verification: mode=${mode}`);

    if (mode === 'subscribe' && token) {
      // Verify against stored verify_token — check all active business_api channels
      const channels = await this.channelsService['channelRepo'].findAll({
        where: { connection_method: 'business_api', is_active: true },
      });

      const isValid = channels.some((ch) => {
        const config = ch.meta_config as Record<string, string>;
        return config?.verify_token === token;
      });

      if (isValid) {
        this.logger.log('Meta webhook verification successful');
        return res.status(200).send(challenge);
      }
    }

    this.logger.warn('Meta webhook verification failed');
    return res.sendStatus(403);
  }

  @Post('webhook/meta')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiExcludeEndpoint()
  async metaWebhook(@Body() body: MetaWebhookPayload) {
    this.logger.log('Meta webhook received');

    try {
      await this.webhookService.handleMetaWebhook(body);
    } catch (error) {
      this.logger.error(`Meta webhook error: ${error.message}`);
    }

    // Meta expects 200 OK quickly
    return 'EVENT_RECEIVED';
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────────

  private escapeXml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}
