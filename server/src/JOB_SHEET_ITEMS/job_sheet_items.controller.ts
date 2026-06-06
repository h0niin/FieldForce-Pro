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
import { JobSheetItemsService } from './job_sheet_items.service';
import { CreateJobSheetItemDto } from './dto/job_sheet_items_create.dto';
import { UpdateJobSheetItemDto } from './dto/job_sheet_items_update.dto';
import { PageOptionsDto } from '../shared/dto/page-options.dto';
import { DataResponseDto } from '../shared/dto/data-response.dto';
import { TenantId } from '../shared/decorator/tenant.decorator';
import { Permissions } from '../shared/decorator/permission.decorator';

@ApiTags('Job Sheet Items')
@ApiBearerAuth()
@Controller('job-sheet-items')
export class JobSheetItemsController {
  constructor(private readonly jobSheetItemsService: JobSheetItemsService) {}

  @Get()
  @Permissions('job_sheets:read')
  @ApiOperation({ summary: 'Get all job sheet items (paginated)' })
  async findAll(@TenantId() tenantId: string, @Query() pageOptionsDto: PageOptionsDto) {
    const result = await this.jobSheetItemsService.findAllPaginated(tenantId, pageOptionsDto);
    return DataResponseDto.success(result.data, 'Job sheet items fetched successfully', {
      ...result.meta,
    } as unknown as Record<string, unknown>);
  }

  @Get('all')
  @Permissions('job_sheets:read')
  @ApiOperation({ summary: 'Get all job sheet items (non-paginated)' })
  async findAllNonPaginated(@TenantId() tenantId: string) {
    const items = await this.jobSheetItemsService.findAll(tenantId);
    return DataResponseDto.success(items, 'Job sheet items fetched successfully');
  }

  @Get('instance/:instanceId')
  @Permissions('job_sheets:read', 'scheduling:read')
  @ApiOperation({ summary: 'Get all job sheet items for an instance' })
  async findByInstanceId(
    @Param('instanceId') instanceId: string,
    @TenantId() tenantId: string,
  ) {
    const items = await this.jobSheetItemsService.findByInstanceId(instanceId, tenantId);
    return DataResponseDto.success(items, 'Job sheet items fetched successfully');
  }

  @Get(':id')
  @Permissions('job_sheets:read')
  @ApiOperation({ summary: 'Get job sheet item by ID' })
  async findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    const item = await this.jobSheetItemsService.findById(id, tenantId);
    return DataResponseDto.success(item);
  }

  @Post()
  @Permissions('job_sheets:create')
  @ApiOperation({ summary: 'Create a new job sheet item' })
  async create(@TenantId() tenantId: string, @Body() dto: CreateJobSheetItemDto) {
    const item = await this.jobSheetItemsService.create(tenantId, dto);
    return DataResponseDto.created(item, 'Job sheet item created successfully');
  }

  @Put(':id')
  @Permissions('job_sheets:update', 'scheduling:read')
  @ApiOperation({ summary: 'Update a job sheet item' })
  async update(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Body() dto: UpdateJobSheetItemDto,
  ) {
    const item = await this.jobSheetItemsService.update(id, tenantId, dto);
    return DataResponseDto.success(item, 'Job sheet item updated successfully');
  }

  @Delete(':id')
  @Permissions('job_sheets:delete')
  @ApiOperation({ summary: 'Delete a job sheet item (soft delete)' })
  async remove(@Param('id') id: string, @TenantId() tenantId: string) {
    await this.jobSheetItemsService.delete(id, tenantId);
    return DataResponseDto.success(null, 'Job sheet item deleted successfully');
  }
}
