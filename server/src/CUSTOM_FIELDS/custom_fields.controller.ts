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
import { CustomFieldsService } from './custom_fields.service';
import { CreateCustomFieldDto } from './dto/custom_fields_create.dto';
import { UpdateCustomFieldDto } from './dto/custom_fields_update.dto';
import { PageOptionsDto } from '../shared/dto/page-options.dto';
import { DataResponseDto } from '../shared/dto/data-response.dto';
import { TenantId } from '../shared/decorator/tenant.decorator';
import { Permissions } from '../shared/decorator/permission.decorator';

@ApiTags('Custom Fields')
@ApiBearerAuth()
@Controller('custom-fields')
export class CustomFieldsController {
  constructor(private readonly customFieldsService: CustomFieldsService) {}

  @Get()
  @Permissions('custom_fields:read')
  @ApiOperation({ summary: 'Get all custom fields (paginated)' })
  async findAll(@TenantId() tenantId: string, @Query() pageOptionsDto: PageOptionsDto) {
    const result = await this.customFieldsService.findAllPaginated(tenantId, pageOptionsDto);
    return DataResponseDto.success(result.data, 'Custom fields fetched successfully', {
      ...result.meta,
    } as unknown as Record<string, unknown>);
  }

  @Get('all')
  @Permissions('custom_fields:read')
  @ApiOperation({ summary: 'Get all custom fields (non-paginated)' })
  async findAllNonPaginated(@TenantId() tenantId: string) {
    const fields = await this.customFieldsService.findAll(tenantId);
    return DataResponseDto.success(fields, 'Custom fields fetched successfully');
  }

  @Get('module/:module')
  @Permissions('custom_fields:read')
  @ApiOperation({ summary: 'Get custom fields by module' })
  async findByModule(
    @Param('module') module: string,
    @TenantId() tenantId: string,
  ) {
    const fields = await this.customFieldsService.findByModule(module, tenantId);
    return DataResponseDto.success(fields, 'Custom fields fetched successfully');
  }

  @Get(':id')
  @Permissions('custom_fields:read')
  @ApiOperation({ summary: 'Get custom field by ID' })
  async findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    const field = await this.customFieldsService.findById(id, tenantId);
    return DataResponseDto.success(field);
  }

  @Post()
  @Permissions('custom_fields:create')
  @ApiOperation({ summary: 'Create a new custom field' })
  async create(@TenantId() tenantId: string, @Body() dto: CreateCustomFieldDto) {
    const field = await this.customFieldsService.create(tenantId, dto);
    return DataResponseDto.created(field, 'Custom field created successfully');
  }

  @Put(':id')
  @Permissions('custom_fields:update')
  @ApiOperation({ summary: 'Update a custom field' })
  async update(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Body() dto: UpdateCustomFieldDto,
  ) {
    const field = await this.customFieldsService.update(id, tenantId, dto);
    return DataResponseDto.success(field, 'Custom field updated successfully');
  }

  @Delete(':id')
  @Permissions('custom_fields:delete')
  @ApiOperation({ summary: 'Delete a custom field (soft delete)' })
  async remove(@Param('id') id: string, @TenantId() tenantId: string) {
    await this.customFieldsService.delete(id, tenantId);
    return DataResponseDto.success(null, 'Custom field deleted successfully');
  }
}
