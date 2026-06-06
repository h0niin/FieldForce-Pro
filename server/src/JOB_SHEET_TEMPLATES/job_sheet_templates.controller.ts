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
import { JobSheetTemplatesService } from './job_sheet_templates.service';
import { CreateJobSheetTemplateDto } from './dto/job_sheet_templates_create.dto';
import { UpdateJobSheetTemplateDto } from './dto/job_sheet_templates_update.dto';
import { PageOptionsDto } from '../shared/dto/page-options.dto';
import { DataResponseDto } from '../shared/dto/data-response.dto';
import { TenantId } from '../shared/decorator/tenant.decorator';
import { Permissions } from '../shared/decorator/permission.decorator';

@ApiTags('Job Sheet Templates')
@ApiBearerAuth()
@Controller('job-sheet-templates')
export class JobSheetTemplatesController {
  constructor(private readonly jobSheetTemplatesService: JobSheetTemplatesService) {}

  @Get()
  @Permissions('job_sheets:read')
  @ApiOperation({ summary: 'Get all job sheet templates (paginated)' })
  async findAll(@TenantId() tenantId: string, @Query() pageOptionsDto: PageOptionsDto) {
    const result = await this.jobSheetTemplatesService.findAllPaginated(tenantId, pageOptionsDto);
    return DataResponseDto.success(result.data, 'Job sheet templates fetched successfully', {
      ...result.meta,
    } as unknown as Record<string, unknown>);
  }

  @Get('all')
  @Permissions('job_sheets:read')
  @ApiOperation({ summary: 'Get all job sheet templates (non-paginated)' })
  async findAllNonPaginated(@TenantId() tenantId: string) {
    const templates = await this.jobSheetTemplatesService.findAll(tenantId);
    return DataResponseDto.success(templates, 'Job sheet templates fetched successfully');
  }

  @Get(':id')
  @Permissions('job_sheets:read')
  @ApiOperation({ summary: 'Get job sheet template by ID' })
  async findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    const template = await this.jobSheetTemplatesService.findById(id, tenantId);
    return DataResponseDto.success(template);
  }

  @Post()
  @Permissions('job_sheets:create')
  @ApiOperation({ summary: 'Create a new job sheet template' })
  async create(@TenantId() tenantId: string, @Body() dto: CreateJobSheetTemplateDto) {
    const template = await this.jobSheetTemplatesService.create(tenantId, dto);
    return DataResponseDto.created(template, 'Job sheet template created successfully');
  }

  @Put(':id')
  @Permissions('job_sheets:update')
  @ApiOperation({ summary: 'Update a job sheet template' })
  async update(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Body() dto: UpdateJobSheetTemplateDto,
  ) {
    const template = await this.jobSheetTemplatesService.update(id, tenantId, dto);
    return DataResponseDto.success(template, 'Job sheet template updated successfully');
  }

  @Delete(':id')
  @Permissions('job_sheets:delete')
  @ApiOperation({ summary: 'Delete a job sheet template (soft delete)' })
  async remove(@Param('id') id: string, @TenantId() tenantId: string) {
    await this.jobSheetTemplatesService.delete(id, tenantId);
    return DataResponseDto.success(null, 'Job sheet template deleted successfully');
  }
}
