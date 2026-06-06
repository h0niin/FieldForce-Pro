import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes, ApiQuery } from '@nestjs/swagger';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ServiceAppointmentsService } from './service_appointments.service';
import { CreateServiceAppointmentDto } from './dto/service_appointments_create.dto';
import { UpdateServiceAppointmentDto } from './dto/service_appointments_update.dto';
import { UpdateServiceAppointmentStatusDto } from './dto/service_appointments_update_status.dto';
import { PageOptionsDto } from '../shared/dto/page-options.dto';
import { DataResponseDto } from '../shared/dto/data-response.dto';
import { TenantId } from '../shared/decorator/tenant.decorator';
import { UserId } from '../shared/decorator/user.decorator';
import { Permissions } from '../shared/decorator/permission.decorator';
import { DocumentApprovalsService } from '../WORKFLOW/WORKFLOW_DOCUMENT_APPROVALS/document_approvals.service';
import { ApprovalActionEnum } from '../shared/enums/workflow.enum';

export class AppointmentPageOptionsDto extends PageOptionsDto {
  @ApiPropertyOptional({ description: 'Filter by status (comma-separated)' })
  @IsString()
  @IsOptional()
  readonly status?: string;

  @ApiPropertyOptional({ description: 'Exclude statuses (comma-separated)' })
  @IsString()
  @IsOptional()
  readonly excludeStatus?: string;

  @ApiPropertyOptional({ description: 'Only return appointments that have a pending SCHEDULE approval' })
  @IsString()
  @IsOptional()
  readonly hasPendingApproval?: string;

  @ApiPropertyOptional({ description: 'Only return appointments with no technician assigned (agent_id IS NULL)' })
  @IsString()
  @IsOptional()
  readonly unassigned?: string;
}

@ApiTags('Service Appointments')
@ApiBearerAuth()
@Controller('service-appointments')
export class ServiceAppointmentsController {
  constructor(
    private readonly serviceAppointmentsService: ServiceAppointmentsService,
    private readonly documentApprovalsService: DocumentApprovalsService,
  ) { }

  @Get()
  @Permissions('service_appointments:read', 'scheduling:read')
  @ApiOperation({ summary: 'Get all service appointments (paginated)' })
  async findAll(@TenantId() tenantId: string, @Query() query: AppointmentPageOptionsDto) {
    const result = await this.serviceAppointmentsService.findAllPaginated(
      tenantId,
      query,
      query.status,
      query.excludeStatus,
      query.hasPendingApproval === 'true',
      query.unassigned === 'true',
    );
    return DataResponseDto.success(result.data, 'Service appointments fetched successfully', {
      ...result.meta,
    } as unknown as Record<string, unknown>);
  }

  @Get('schedule-assigner')
  @Permissions('service_appointments:read', 'scheduling:read')
  @ApiOperation({ summary: 'Get the designated schedule assigner (first approver in active SCHEDULE workflow)' })
  async getScheduleAssigner(@TenantId() tenantId: string) {
    const assignerId = await this.serviceAppointmentsService.getScheduleAssignerId(tenantId);
    return DataResponseDto.success({ assigner_id: assignerId }, 'Schedule assigner fetched');
  }

  @Get('all')
  @Permissions('service_appointments:read', 'scheduling:read')
  @ApiOperation({ summary: 'Get all service appointments (non-paginated)' })
  async findAllNonPaginated(@TenantId() tenantId: string) {
    const appointments = await this.serviceAppointmentsService.findAll(tenantId);
    return DataResponseDto.success(appointments, 'Service appointments fetched successfully');
  }

  @Get('work-order/:workOrderId')
  @Permissions('service_appointments:read', 'scheduling:read')
  @ApiOperation({ summary: 'Get service appointments by work order ID' })
  async findByWorkOrder(
    @Param('workOrderId') workOrderId: string,
    @TenantId() tenantId: string,
  ) {
    const appointments = await this.serviceAppointmentsService.findByWorkOrderId(workOrderId, tenantId);
    return DataResponseDto.success(appointments, 'Service appointments fetched successfully');
  }

  @Get('my')
  @Permissions('service_appointments:read', 'scheduling:read')
  @ApiOperation({ summary: 'Get appointments assigned to the current user' })
  @ApiQuery({ name: 'date', required: false, type: String, description: 'Filter by date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'has_job_sheet', required: false, type: String, description: 'Only return appointments that have job sheet instances (true/false)' })
  async findMine(
    @TenantId() tenantId: string,
    @UserId() userId: string,
    @Query('date') date?: string,
    @Query('has_job_sheet') hasJobSheet?: string,
  ) {
    const appointments = await this.serviceAppointmentsService.findByAgent(userId, tenantId, date, hasJobSheet === 'true');
    return DataResponseDto.success(appointments, 'My appointments fetched successfully');
  }

  @Get('my-approvals')
  @Permissions('service_appointments:read', 'scheduling:read')
  @ApiOperation({ summary: 'Get service appointments pending my approval (only those where it is my turn)' })
  async findMyPendingApprovals(
    @TenantId() tenantId: string,
    @UserId() userId: string,
    @Query() pageOptionsDto: PageOptionsDto,
  ) {
    const result = await this.serviceAppointmentsService.findMyPendingApprovals(
      tenantId,
      userId,
      pageOptionsDto,
    );
    return DataResponseDto.success(
      result.data,
      'Pending approval appointments fetched successfully',
      { ...result.meta } as unknown as Record<string, unknown>,
    );
  }

  @Get(':id/approvals')
  @Permissions('service_appointments:read', 'scheduling:read')
  @ApiOperation({ summary: 'Get approval chain for a service appointment' })
  async getApprovals(@Param('id') id: string, @TenantId() tenantId: string) {
    const approvals = await this.documentApprovalsService.getApprovalsByDocument(
      id,
      tenantId,
    );
    return DataResponseDto.success(approvals, 'Approvals fetched successfully');
  }

  @Post(':id/approvals/:approvalId/process')
  @Permissions('service_appointments:read', 'scheduling:read')
  @ApiOperation({ summary: 'Process an approval (approve/reject) for a service appointment' })
  async processApproval(
    @Param('id') _id: string,
    @Param('approvalId') approvalId: string,
    @TenantId() tenantId: string,
    @UserId() userId: string,
    @Body() dto: { action: string; comments?: string },
  ) {
    const approval = await this.documentApprovalsService.processApproval(
      approvalId,
      tenantId,
      userId,
      { action: dto.action as ApprovalActionEnum, comments: dto.comments },
    );
    return DataResponseDto.success(approval, 'Approval processed successfully');
  }

  @Get(':id')
  @Permissions('service_appointments:read', 'scheduling:read')
  @ApiOperation({ summary: 'Get service appointment by ID' })
  async findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    const appointment = await this.serviceAppointmentsService.findById(id, tenantId);
    return DataResponseDto.success(appointment);
  }

  @Post()
  @Permissions('service_appointments:create', 'scheduling:create')
  @ApiOperation({ summary: 'Create a new service appointment' })
  async create(@TenantId() tenantId: string, @Body() dto: CreateServiceAppointmentDto) {
    const appointment = await this.serviceAppointmentsService.create(tenantId, dto);
    return DataResponseDto.created(appointment, 'Service appointment created successfully');
  }

  @Put(':id')
  @Permissions('service_appointments:update', 'scheduling:update')
  @ApiOperation({ summary: 'Update a service appointment' })
  async update(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Body() dto: UpdateServiceAppointmentDto,
  ) {
    const appointment = await this.serviceAppointmentsService.update(id, tenantId, dto);
    return DataResponseDto.success(appointment, 'Service appointment updated successfully');
  }

  @Patch(':id/assign')
  @Permissions('service_appointments:update', 'scheduling:update')
  @ApiOperation({ summary: 'Assign a technician to a scheduled appointment' })
  async assignTechnician(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @UserId() userId: string,
    @Body('agent_id') agentId: string,
  ) {
    if (!agentId) {
      throw new BadRequestException('agent_id is required');
    }

    // Only the designated schedule assigner can assign technicians
    const designatedAssignerId = await this.serviceAppointmentsService.getScheduleAssignerId(tenantId);
    if (!designatedAssignerId) {
      throw new BadRequestException('No SCHEDULE workflow is configured. Please create one in Workflow Settings first.');
    }
    if (userId !== designatedAssignerId) {
      throw new ForbiddenException('Only the designated schedule assigner can assign technicians.');
    }

    const appointment = await this.serviceAppointmentsService.assignTechnician(id, tenantId, agentId, userId);
    return DataResponseDto.success(appointment, 'Technician assigned successfully');
  }

  @Patch(':id/status')
  @Permissions('service_appointments:update', 'scheduling:update', 'scheduling:read')
  @ApiOperation({ summary: 'Update service appointment status with transition validation' })
  async updateStatus(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Body() dto: UpdateServiceAppointmentStatusDto,
  ) {
    const appointment = await this.serviceAppointmentsService.updateStatus(id, tenantId, dto);
    return DataResponseDto.success(appointment, 'Service appointment status updated successfully');
  }

  @Post(':id/signature')
  @Permissions('service_appointments:update', 'scheduling:update')
  @ApiOperation({ summary: 'Upload customer signature for a service appointment' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('signature', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = join(process.cwd(), 'uploads', 'signatures');
          if (!existsSync(uploadPath)) {
            mkdirSync(uploadPath, { recursive: true });
          }
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async uploadSignature(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Signature file is required');
    }
    const appUrl = process.env.APP_URL || `http://localhost:${process.env.APP_PORT || 3000}`;
    const fileUrl = `${appUrl}/uploads/signatures/${file.filename}`;
    const appointment = await this.serviceAppointmentsService.saveSignatureUrl(id, tenantId, fileUrl);
    return DataResponseDto.success(appointment, 'Signature uploaded successfully');
  }

  @Post(':id/photos')
  @Permissions('service_appointments:update', 'scheduling:update')
  @ApiOperation({ summary: 'Upload site photos for a service appointment' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FilesInterceptor('photos', 20, {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = join(process.cwd(), 'uploads', 'appointment-photos');
          if (!existsSync(uploadPath)) {
            mkdirSync(uploadPath, { recursive: true });
          }
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async uploadPhotos(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('At least one photo is required');
    }
    const appUrl = process.env.APP_URL || `http://localhost:${process.env.APP_PORT || 3000}`;
    const photoUrls = files.map(f => `${appUrl}/uploads/appointment-photos/${f.filename}`);
    const appointment = await this.serviceAppointmentsService.addPhotos(id, tenantId, photoUrls);
    return DataResponseDto.success(appointment, 'Photos uploaded successfully');
  }

  @Delete(':id')
  @Permissions('service_appointments:delete', 'scheduling:delete')
  @ApiOperation({ summary: 'Delete a service appointment (soft delete)' })
  async remove(@Param('id') id: string, @TenantId() tenantId: string) {
    await this.serviceAppointmentsService.delete(id, tenantId);
    return DataResponseDto.success(null, 'Service appointment deleted successfully');
  }
}
