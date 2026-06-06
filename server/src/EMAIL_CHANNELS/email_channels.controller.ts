import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiExcludeEndpoint } from '@nestjs/swagger';
import { EmailChannelsService } from './email_channels.service';
import { EmailProcessingService } from './email_processing.service';
import { UpsertEmailChannelDto } from './dto/upsert-email-channel.dto';
import { InboundEmailPayload } from './dto/email-webhook.dto';
import { DataResponseDto } from '../shared/dto/data-response.dto';
import { PageOptionsDto } from '../shared/dto/page-options.dto';
import { TenantId } from '../shared/decorator/tenant.decorator';
import { Permissions } from '../shared/decorator/permission.decorator';
import { Public } from '../shared/decorator/public.decorator';

@ApiTags('Email Channel')
@Controller('email-channel')
export class EmailChannelsController {
  private readonly logger = new Logger(EmailChannelsController.name);

  constructor(
    private readonly channelsService: EmailChannelsService,
    private readonly processingService: EmailProcessingService,
  ) {}

  // ─── Channel Config Endpoints (authenticated) ─────────────────────────────────

  @Get('channel')
  @ApiBearerAuth()
  @Permissions('settings:read')
  @ApiOperation({ summary: 'Get email channel config for tenant' })
  async getChannel(@TenantId() tenantId: string) {
    const channel = await this.channelsService.getChannel(tenantId);
    return DataResponseDto.success(channel, 'Email channel fetched');
  }

  @Put('channel')
  @ApiBearerAuth()
  @Permissions('settings:update')
  @ApiOperation({ summary: 'Create or update email channel config' })
  async upsertChannel(
    @TenantId() tenantId: string,
    @Body() dto: UpsertEmailChannelDto,
  ) {
    const channel = await this.channelsService.upsertChannel(tenantId, dto);
    return DataResponseDto.success(channel, 'Email channel saved');
  }

  @Post('channel/test')
  @ApiBearerAuth()
  @Permissions('settings:update')
  @ApiOperation({ summary: 'Test email channel connection' })
  async testConnection(@TenantId() tenantId: string) {
    const result = await this.channelsService.testConnection(tenantId);
    return DataResponseDto.success(
      result,
      result.success ? 'Connection successful' : 'Connection failed',
    );
  }

  @Post('channel/disconnect')
  @ApiBearerAuth()
  @Permissions('settings:update')
  @ApiOperation({ summary: 'Disconnect email channel' })
  async disconnect(@TenantId() tenantId: string) {
    const channel = await this.channelsService.disconnect(tenantId);
    return DataResponseDto.success(channel, 'Email channel disconnected');
  }

  // ─── Thread Endpoints (authenticated) ─────────────────────────────────────────

  @Get('threads')
  @ApiBearerAuth()
  @Permissions('settings:read')
  @ApiOperation({ summary: 'List email threads (paginated)' })
  async getThreads(
    @TenantId() tenantId: string,
    @Query() pageOptions: PageOptionsDto,
  ) {
    const result = await this.channelsService.getThreads(tenantId, pageOptions);
    return DataResponseDto.success(result, 'Email threads fetched');
  }

  @Get('threads/:id')
  @ApiBearerAuth()
  @Permissions('settings:read')
  @ApiOperation({ summary: 'Get a single email thread with full message history' })
  async getThread(
    @Param('id') id: string,
    @TenantId() tenantId: string,
  ) {
    const thread = await this.channelsService.getThreadById(id, tenantId);
    return DataResponseDto.success(thread, 'Email thread fetched');
  }

  // ─── Webhook Endpoints (public — validated internally) ────────────────────────

  @Post('webhook/inbound')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiExcludeEndpoint()
  async inboundWebhook(@Body() body: InboundEmailPayload) {
    this.logger.log('Inbound email webhook received');

    try {
      const result = await this.processingService.processInboundEmail(body);
      return {
        status: 'ok',
        ...result,
      };
    } catch (error) {
      this.logger.error(`Inbound email webhook error: ${error.message}`);
      return { status: 'error', message: error.message };
    }
  }

  @Post('webhook/sendgrid')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiExcludeEndpoint()
  async sendgridWebhook(@Body() body: InboundEmailPayload) {
    this.logger.log('SendGrid Inbound Parse webhook received');

    try {
      // SendGrid sends form data; the DTO handles both JSON and form fields
      const result = await this.processingService.processInboundEmail(body);
      return {
        status: 'ok',
        ...result,
      };
    } catch (error) {
      this.logger.error(`SendGrid webhook error: ${error.message}`);
      return { status: 'error', message: error.message };
    }
  }
}
