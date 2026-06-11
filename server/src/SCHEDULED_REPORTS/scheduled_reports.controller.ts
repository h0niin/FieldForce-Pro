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
import { ScheduledReportsService } from './scheduled_reports.service';
import { CreateScheduledReportDto } from './dto/scheduled_reports_create.dto';
import { UpdateScheduledReportDto } from './dto/scheduled_reports_update.dto';
import { PageOptionsDto } from '../shared/dto/page-options.dto';
import { DataResponseDto } from '../shared/dto/data-response.dto';
import { TenantId } from '../shared/decorator/tenant.decorator';
import { Permissions } from '../shared/decorator/permission.decorator';

@ApiTags('Scheduled Reports')
@ApiBearerAuth()
@Controller('scheduled-reports')
export class ScheduledReportsController {
  constructor(private readonly scheduledReportsService: ScheduledReportsService) {}

  @Get()
  @Permissions('workflow_rules:read')
  @ApiOperation({ summary: 'Get all scheduled reports (paginated)' })
  async findAll(@TenantId() tenantId: string, @Query() pageOptionsDto: PageOptionsDto) {
    const result = await this.scheduledReportsService.findAllPaginated(tenantId, pageOptionsDto);
    return DataResponseDto.success(result.data, 'Scheduled reports fetched successfully', {
      ...result.meta,
    } as unknown as Record<string, unknown>);
  }

  @Get('all')
  @Permissions('workflow_rules:read')
  @ApiOperation({ summary: 'Get all scheduled reports (non-paginated)' })
  async findAllNonPaginated(@TenantId() tenantId: string) {
    const reports = await this.scheduledReportsService.findAll(tenantId);
    return DataResponseDto.success(reports, 'Scheduled reports fetched successfully');
  }

  @Get(':id')
  @Permissions('workflow_rules:read')
  @ApiOperation({ summary: 'Get scheduled report by ID' })
  async findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    const report = await this.scheduledReportsService.findById(id, tenantId);
    return DataResponseDto.success(report);
  }

  @Post()
  @Permissions('workflow_rules:create')
  @ApiOperation({ summary: 'Create a new scheduled report' })
  async create(@TenantId() tenantId: string, @Body() dto: CreateScheduledReportDto) {
    const report = await this.scheduledReportsService.create(tenantId, dto);
    return DataResponseDto.created(report, 'Scheduled report created successfully');
  }

  @Put(':id')
  @Permissions('workflow_rules:update')
  @ApiOperation({ summary: 'Update a scheduled report' })
  async update(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Body() dto: UpdateScheduledReportDto,
  ) {
    const report = await this.scheduledReportsService.update(id, tenantId, dto);
    return DataResponseDto.success(report, 'Scheduled report updated successfully');
  }

  @Delete(':id')
  @Permissions('workflow_rules:delete')
  @ApiOperation({ summary: 'Delete a scheduled report' })
  async remove(@Param('id') id: string, @TenantId() tenantId: string) {
    await this.scheduledReportsService.delete(id, tenantId);
    return DataResponseDto.success(null, 'Scheduled report deleted successfully');
  }
}
