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
import { TemplatesService } from './templates.service';
import { CreateTemplateDto } from './dto/templates_create.dto';
import { UpdateTemplateDto } from './dto/templates_update.dto';
import { PageOptionsDto } from '../shared/dto/page-options.dto';
import { DataResponseDto } from '../shared/dto/data-response.dto';
import { TenantId } from '../shared/decorator/tenant.decorator';
import { Permissions } from '../shared/decorator/permission.decorator';

@ApiTags('Templates')
@ApiBearerAuth()
@Controller('templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Get()
  @Permissions('templates:read')
  @ApiOperation({ summary: 'Get all templates (paginated)' })
  async findAll(@TenantId() tenantId: string, @Query() pageOptionsDto: PageOptionsDto) {
    const result = await this.templatesService.findAllPaginated(tenantId, pageOptionsDto);
    return DataResponseDto.success(result.data, 'Templates fetched successfully', {
      ...result.meta,
    } as unknown as Record<string, unknown>);
  }

  @Get('all')
  @Permissions('templates:read')
  @ApiOperation({ summary: 'Get all templates (non-paginated)' })
  async findAllNonPaginated(@TenantId() tenantId: string) {
    const templates = await this.templatesService.findAll(tenantId);
    return DataResponseDto.success(templates, 'Templates fetched successfully');
  }

  @Get('type/:type')
  @Permissions('templates:read')
  @ApiOperation({ summary: 'Get templates by type' })
  async findByType(
    @Param('type') type: string,
    @TenantId() tenantId: string,
  ) {
    const templates = await this.templatesService.findByType(type, tenantId);
    return DataResponseDto.success(templates, 'Templates fetched successfully');
  }

  @Get(':id')
  @Permissions('templates:read')
  @ApiOperation({ summary: 'Get template by ID' })
  async findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    const template = await this.templatesService.findById(id, tenantId);
    return DataResponseDto.success(template);
  }

  @Post()
  @Permissions('templates:create')
  @ApiOperation({ summary: 'Create a new template' })
  async create(@TenantId() tenantId: string, @Body() dto: CreateTemplateDto) {
    const template = await this.templatesService.create(tenantId, dto);
    return DataResponseDto.created(template, 'Template created successfully');
  }

  @Put(':id')
  @Permissions('templates:update')
  @ApiOperation({ summary: 'Update a template' })
  async update(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Body() dto: UpdateTemplateDto,
  ) {
    const template = await this.templatesService.update(id, tenantId, dto);
    return DataResponseDto.success(template, 'Template updated successfully');
  }

  @Delete(':id')
  @Permissions('templates:delete')
  @ApiOperation({ summary: 'Delete a template (soft delete)' })
  async remove(@Param('id') id: string, @TenantId() tenantId: string) {
    await this.templatesService.delete(id, tenantId);
    return DataResponseDto.success(null, 'Template deleted successfully');
  }
}
