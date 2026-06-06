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
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { WorkOrdersService } from './work_orders.service';
import { CreateWorkOrderDto } from './dto/work_orders_create.dto';
import { UpdateWorkOrderDto } from './dto/work_orders_update.dto';
import { UpdateWorkOrderStatusDto } from './dto/work_orders_update_status.dto';
import { PageOptionsDto } from '../shared/dto/page-options.dto';
import { DataResponseDto } from '../shared/dto/data-response.dto';
import { TenantId } from '../shared/decorator/tenant.decorator';
import { UserId } from '../shared/decorator/user.decorator';
import { Permissions } from '../shared/decorator/permission.decorator';
import { AutoInvoiceService } from '../INVOICES/auto_invoice.service';
import { DocumentApprovalsService } from '../WORKFLOW/WORKFLOW_DOCUMENT_APPROVALS/document_approvals.service';
import { ApprovalActionEnum } from '../shared/enums/workflow.enum';

@ApiTags('Work Orders')
@ApiBearerAuth()
@Controller('work-orders')
export class WorkOrdersController {
  constructor(
    private readonly workOrdersService: WorkOrdersService,
    private readonly autoInvoiceService: AutoInvoiceService,
    private readonly documentApprovalsService: DocumentApprovalsService,
  ) {}

  @Get()
  @Permissions('work_orders:read')
  @ApiOperation({ summary: 'Get all work orders (paginated)' })
  async findAll(@TenantId() tenantId: string, @Query() pageOptionsDto: PageOptionsDto) {
    const result = await this.workOrdersService.findAllPaginated(tenantId, pageOptionsDto);
    return DataResponseDto.success(result.data, 'Work orders fetched successfully', {
      ...result.meta,
    } as unknown as Record<string, unknown>);
  }

  @Get('all')
  @Permissions('work_orders:read')
  @ApiOperation({ summary: 'Get all work orders (non-paginated)' })
  async findAllNonPaginated(@TenantId() tenantId: string) {
    const workOrders = await this.workOrdersService.findAll(tenantId);
    return DataResponseDto.success(workOrders, 'Work orders fetched successfully');
  }

  @Get('my')
  @Permissions('work_orders:read')
  @ApiOperation({ summary: 'Get work orders assigned to the current user (paginated)' })
  async findMy(
    @UserId() userId: string,
    @TenantId() tenantId: string,
    @Query() pageOptionsDto: PageOptionsDto,
  ) {
    const result = await this.workOrdersService.findByAssignedUser(userId, tenantId, pageOptionsDto);
    return DataResponseDto.success(result.data, 'My work orders fetched successfully', {
      ...result.meta,
    } as unknown as Record<string, unknown>);
  }

  @Get('my-approvals')
  @Permissions('work_orders:read')
  @ApiOperation({ summary: 'Get work orders pending my approval (only those where it is my turn)' })
  async findMyPendingApprovals(
    @TenantId() tenantId: string,
    @UserId() userId: string,
    @Query() pageOptionsDto: PageOptionsDto,
  ) {
    const result = await this.workOrdersService.findMyPendingApprovals(
      tenantId,
      userId,
      pageOptionsDto,
    );
    return DataResponseDto.success(
      result.data,
      'Pending approval work orders fetched successfully',
      { ...result.meta } as unknown as Record<string, unknown>,
    );
  }

  @Get('my-jobs')
  @Permissions('work_orders:read')
  @ApiOperation({ summary: 'Get work orders assigned to the current technician, with optional status filter, sorted by scheduled date' })
  async findMyJobs(
    @UserId() userId: string,
    @TenantId() tenantId: string,
    @Query() pageOptionsDto: PageOptionsDto,
    @Query('status') status?: string,
  ) {
    const result = await this.workOrdersService.findMyJobsPaginated(userId, tenantId, pageOptionsDto, status);
    return DataResponseDto.success(result.data, 'My jobs fetched successfully', {
      ...result.meta,
    } as unknown as Record<string, unknown>);
  }

  @Get(':id/approvals')
  @Permissions('work_orders:read')
  @ApiOperation({ summary: 'Get approval chain for a work order' })
  async getApprovals(@Param('id') id: string, @TenantId() tenantId: string) {
    const approvals = await this.documentApprovalsService.getApprovalsByDocument(
      id,
      tenantId,
    );
    return DataResponseDto.success(approvals, 'Approvals fetched successfully');
  }

  @Post(':id/approvals/:approvalId/process')
  @Permissions('work_orders:read')
  @ApiOperation({ summary: 'Process an approval (approve/reject) for a work order' })
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
  @Permissions('work_orders:read')
  @ApiOperation({ summary: 'Get work order by ID' })
  async findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    const workOrder = await this.workOrdersService.findById(id, tenantId);
    return DataResponseDto.success(workOrder);
  }

  @Post()
  @Permissions('work_orders:create')
  @ApiOperation({ summary: 'Create a new work order' })
  async create(@TenantId() tenantId: string, @Body() dto: CreateWorkOrderDto) {
    const workOrder = await this.workOrdersService.create(tenantId, dto);
    return DataResponseDto.created(workOrder, 'Work order created successfully');
  }

  @Put(':id')
  @Permissions('work_orders:update')
  @ApiOperation({ summary: 'Update a work order' })
  async update(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Body() dto: UpdateWorkOrderDto,
  ) {
    const workOrder = await this.workOrdersService.update(id, tenantId, dto);
    return DataResponseDto.success(workOrder, 'Work order updated successfully');
  }

  @Patch(':id/status')
  @Permissions('work_orders:update')
  @ApiOperation({ summary: 'Update work order status with transition validation' })
  async updateStatus(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Body() dto: UpdateWorkOrderStatusDto,
  ) {
    const workOrder = await this.workOrdersService.updateStatus(id, tenantId, dto);
    return DataResponseDto.success(workOrder, 'Work order status updated successfully');
  }

  @Post(':id/accept')
  @Permissions('work_orders:update')
  @ApiOperation({ summary: 'Technician accepts an assigned work order (transitions to scheduled)' })
  async acceptJob(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @UserId() userId: string,
  ) {
    const workOrder = await this.workOrdersService.acceptJob(id, tenantId, userId);
    return DataResponseDto.success(workOrder, 'Work order accepted successfully');
  }

  @Post(':id/decline')
  @Permissions('work_orders:update')
  @ApiOperation({ summary: 'Technician declines an assigned work order (unassigns and resets to new)' })
  async declineJob(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @UserId() userId: string,
    @Body('reason') reason: string,
  ) {
    if (!reason?.trim()) {
      throw new BadRequestException('Reason is required to decline a work order');
    }
    const workOrder = await this.workOrdersService.declineJob(id, tenantId, userId, reason.trim());
    return DataResponseDto.success(workOrder, 'Work order declined successfully');
  }

  @Delete(':id')
  @Permissions('work_orders:delete')
  @ApiOperation({ summary: 'Delete a work order (soft delete)' })
  async remove(@Param('id') id: string, @TenantId() tenantId: string) {
    await this.workOrdersService.delete(id, tenantId);
    return DataResponseDto.success(null, 'Work order deleted successfully');
  }

  @Post(':id/generate-invoice')
  @Permissions('invoices:create', 'scheduling:update')
  @ApiOperation({ summary: 'Generate invoice from work order' })
  async generateInvoice(@Param('id') id: string, @TenantId() tenantId: string) {
    const invoice = await this.autoInvoiceService.createInvoiceFromWorkOrder(id, tenantId);
    return DataResponseDto.created(invoice, 'Invoice generated successfully from work order');
  }

  @Post(':id/submit-for-approval')
  @Permissions('work_orders:update')
  @ApiOperation({ summary: 'Submit work order for internal approval workflow' })
  async submitForApproval(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Body() dto: { workflow_id: string; due_date?: string },
  ) {
    const approvals = await this.workOrdersService.submitForApproval(id, tenantId, dto);
    return DataResponseDto.created(approvals, 'Work order submitted for approval successfully');
  }
}
