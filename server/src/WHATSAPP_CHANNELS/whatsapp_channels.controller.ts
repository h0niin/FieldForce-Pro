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
import { WhatsAppWebJsService } from './whatsapp_webjs.service';
import { UpsertWhatsAppChannelDto, TestConnectionDto } from './dto/upsert-channel.dto';
import { MetaWebhookPayload, MetaWebhookVerifyQuery } from './dto/whatsapp-webhook.dto';
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
    private readonly webJsService: WhatsAppWebJsService,
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

  // ─── Web JS Endpoints (authenticated) ─────────────────────────────────────────

  @Post('webjs/initialize')
  @ApiBearerAuth()
  @Permissions('settings:update')
  @ApiOperation({ summary: 'Initialize whatsapp-web.js client and start QR code generation' })
  async initializeWebJs(@TenantId() tenantId: string) {
    const channel = await this.channelsService.getChannel(tenantId);

    const result = await this.webJsService.initializeClient(
      tenantId,
      // onConnected callback — update channel status in DB
      async (phoneNumber: string) => {
        await this.channelsService.upsertChannel(tenantId, {
          connection_method: 'web_js',
          phone_number: phoneNumber,
          is_active: true,
        } as any);
        // Update status directly
        const ch = await this.channelsService.getChannel(tenantId);
        if (ch) await ch.update({ status: 'connected' });
      },
      // onMessage callback — process incoming messages through AI
      async (from: string, body: string, profileName: string, mediaUrl: string | null) => {
        const ch = await this.channelsService.getChannel(tenantId);
        if (!ch) return 'Channel not configured';
        const response = await this.webhookService.processWebJsMessage(ch, from, body, profileName, mediaUrl);
        return response;
      },
    );

    return DataResponseDto.success(result, result.message);
  }

  @Get('webjs/qr')
  @ApiBearerAuth()
  @Permissions('settings:read')
  @ApiOperation({ summary: 'Get the latest QR code or connection status for Web JS' })
  async getWebJsQr(@TenantId() tenantId: string) {
    const result = this.webJsService.getQrStatus(tenantId);
    return DataResponseDto.success(result, 'QR status fetched');
  }

  @Post('webjs/disconnect')
  @ApiBearerAuth()
  @Permissions('settings:update')
  @ApiOperation({ summary: 'Disconnect and destroy whatsapp-web.js client' })
  async disconnectWebJs(@TenantId() tenantId: string) {
    await this.webJsService.destroyClient(tenantId);
    const channel = await this.channelsService.getChannel(tenantId);
    if (channel) {
      await channel.update({ status: 'disconnected', is_active: false });
    }
    return DataResponseDto.success(null, 'Web JS client disconnected');
  }


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
        where: { is_active: true },
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

}
