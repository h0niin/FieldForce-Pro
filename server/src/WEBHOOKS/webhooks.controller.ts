import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { WebhooksService } from './webhooks.service';
import { CreateWebhookDto } from './dto/webhooks_create.dto';
import { UpdateWebhookDto } from './dto/webhooks_update.dto';
import { PageOptionsDto } from '../shared/dto/page-options.dto';
import { DataResponseDto } from '../shared/dto/data-response.dto';
import { TenantId } from '../shared/decorator/tenant.decorator';
import { Permissions } from '../shared/decorator/permission.decorator';

@ApiTags('Webhooks')
@ApiBearerAuth()
@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Get()
  @Permissions('webhooks:read')
  @ApiOperation({ summary: 'Get all webhooks (paginated)' })
  async findAll(@TenantId() tenantId: string, @Query() pageOptionsDto: PageOptionsDto) {
    const result = await this.webhooksService.findAllPaginated(tenantId, pageOptionsDto);
    return DataResponseDto.success(result.data, 'Webhooks fetched successfully', {
      ...result.meta,
    } as unknown as Record<string, unknown>);
  }

  @Get('all')
  @Permissions('webhooks:read')
  @ApiOperation({ summary: 'Get all webhooks (non-paginated)' })
  async findAllNonPaginated(@TenantId() tenantId: string) {
    const webhooks = await this.webhooksService.findAll(tenantId);
    return DataResponseDto.success(webhooks, 'Webhooks fetched successfully');
  }

  @Get(':id')
  @Permissions('webhooks:read')
  @ApiOperation({ summary: 'Get webhook by ID' })
  async findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    const webhook = await this.webhooksService.findById(id, tenantId);
    return DataResponseDto.success(webhook);
  }

  @Post()
  @Permissions('webhooks:create')
  @ApiOperation({ summary: 'Create a new webhook' })
  async create(@TenantId() tenantId: string, @Body() dto: CreateWebhookDto) {
    const webhook = await this.webhooksService.create(tenantId, dto);
    return DataResponseDto.created(webhook, 'Webhook created successfully');
  }

  @Put(':id')
  @Permissions('webhooks:update')
  @ApiOperation({ summary: 'Update a webhook' })
  async update(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Body() dto: UpdateWebhookDto,
  ) {
    const webhook = await this.webhooksService.update(id, tenantId, dto);
    return DataResponseDto.success(webhook, 'Webhook updated successfully');
  }

  @Delete(':id')
  @Permissions('webhooks:delete')
  @ApiOperation({ summary: 'Delete a webhook (soft delete)' })
  async remove(@Param('id') id: string, @TenantId() tenantId: string) {
    await this.webhooksService.delete(id, tenantId);
    return DataResponseDto.success(null, 'Webhook deleted successfully');
  }
}
