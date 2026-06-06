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
import { JobSheetInstancesService } from './job_sheet_instances.service';
import { CreateJobSheetInstanceDto } from './dto/job_sheet_instances_create.dto';
import { UpdateJobSheetInstanceDto } from './dto/job_sheet_instances_update.dto';
import { PageOptionsDto } from '../shared/dto/page-options.dto';
import { DataResponseDto } from '../shared/dto/data-response.dto';
import { TenantId } from '../shared/decorator/tenant.decorator';
import { UserId } from '../shared/decorator/user.decorator';
import { Permissions } from '../shared/decorator/permission.decorator';

@ApiTags('Job Sheet Instances')
@ApiBearerAuth()
@Controller('job-sheet-instances')
export class JobSheetInstancesController {
  constructor(private readonly jobSheetInstancesService: JobSheetInstancesService) {}

  @Get()
  @Permissions('job_sheets:read')
  @ApiOperation({ summary: 'Get all job sheet instances (paginated)' })
  async findAll(@TenantId() tenantId: string, @Query() pageOptionsDto: PageOptionsDto) {
    const result = await this.jobSheetInstancesService.findAllPaginated(tenantId, pageOptionsDto);
    return DataResponseDto.success(result.data, 'Job sheet instances fetched successfully', {
      ...result.meta,
    } as unknown as Record<string, unknown>);
  }

  @Get('all')
  @Permissions('job_sheets:read')
  @ApiOperation({ summary: 'Get all job sheet instances (non-paginated)' })
  async findAllNonPaginated(@TenantId() tenantId: string) {
    const instances = await this.jobSheetInstancesService.findAll(tenantId);
    return DataResponseDto.success(instances, 'Job sheet instances fetched successfully');
  }

  @Get('my-drafts')
  @Permissions('job_sheets:read')
  @ApiOperation({ summary: 'Get draft job sheets assigned to the current user (via workflow)' })
  async findMyDrafts(
    @TenantId() tenantId: string,
    @UserId() userId: string,
    @Query() pageOptionsDto: PageOptionsDto,
  ) {
    const result = await this.jobSheetInstancesService.findMyDrafts(tenantId, userId, pageOptionsDto);
    return DataResponseDto.success(
      result.data,
      'My draft job sheets fetched successfully',
      { ...result.meta } as unknown as Record<string, unknown>,
    );
  }

  @Get('my-approvals')
  @Permissions('job_sheets:read')
  @ApiOperation({ summary: 'Get job sheets pending my approval (only those where it is my turn)' })
  async findMyPendingApprovals(
    @TenantId() tenantId: string,
    @UserId() userId: string,
    @Query() pageOptionsDto: PageOptionsDto,
  ) {
    const result = await this.jobSheetInstancesService.findMyPendingApprovals(tenantId, userId, pageOptionsDto);
    return DataResponseDto.success(
      result.data,
      'Pending job sheet approvals fetched successfully',
      { ...result.meta } as unknown as Record<string, unknown>,
    );
  }

  @Get('appointment/:appointmentId')
  @Permissions('job_sheets:read', 'scheduling:read')
  @ApiOperation({ summary: 'Get all job sheet instances for a service appointment' })
  async findByAppointmentId(
    @Param('appointmentId') appointmentId: string,
    @TenantId() tenantId: string,
  ) {
    const instances = await this.jobSheetInstancesService.findByAppointmentId(appointmentId, tenantId);
    return DataResponseDto.success(instances, 'Job sheet instances fetched successfully');
  }

  @Get('work-order/:workOrderId')
  @Permissions('job_sheets:read', 'scheduling:read')
  @ApiOperation({ summary: 'Get all job sheet instances for a work order' })
  async findByWorkOrderId(
    @Param('workOrderId') workOrderId: string,
    @TenantId() tenantId: string,
  ) {
    const instances = await this.jobSheetInstancesService.findByWorkOrderId(workOrderId, tenantId);
    return DataResponseDto.success(instances, 'Job sheet instances fetched successfully');
  }

  @Get(':id')
  @Permissions('job_sheets:read', 'scheduling:read')
  @ApiOperation({ summary: 'Get job sheet instance by ID' })
  async findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    const instance = await this.jobSheetInstancesService.findById(id, tenantId);
    return DataResponseDto.success(instance);
  }

  @Post()
  @Permissions('job_sheets:create')
  @ApiOperation({ summary: 'Create a new job sheet instance' })
  async create(@TenantId() tenantId: string, @Body() dto: CreateJobSheetInstanceDto) {
    const instance = await this.jobSheetInstancesService.create(tenantId, dto);
    return DataResponseDto.created(instance, 'Job sheet instance created successfully');
  }

  @Put(':id')
  @Permissions('job_sheets:update', 'scheduling:read')
  @ApiOperation({ summary: 'Update a job sheet instance' })
  async update(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @UserId() userId: string,
    @Body() dto: UpdateJobSheetInstanceDto,
  ) {
    const instance = await this.jobSheetInstancesService.update(id, tenantId, dto, userId);
    return DataResponseDto.success(instance, 'Job sheet instance updated successfully');
  }

  @Delete(':id')
  @Permissions('job_sheets:delete')
  @ApiOperation({ summary: 'Delete a job sheet instance (soft delete)' })
  async remove(@Param('id') id: string, @TenantId() tenantId: string) {
    await this.jobSheetInstancesService.delete(id, tenantId);
    return DataResponseDto.success(null, 'Job sheet instance deleted successfully');
  }
}
