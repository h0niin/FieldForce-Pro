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
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { EstimatesService } from './estimates.service';
import { CreateEstimateDto } from './dto/estimates_create.dto';
import { UpdateEstimateDto } from './dto/estimates_update.dto';
import { PageOptionsDto } from '../shared/dto/page-options.dto';
import { DataResponseDto } from '../shared/dto/data-response.dto';
import { TenantId } from '../shared/decorator/tenant.decorator';
import { UserId } from '../shared/decorator/user.decorator';
import { Permissions } from '../shared/decorator/permission.decorator';
import { Public } from '../shared/decorator/public.decorator';
import { PdfService } from '../shared/services/pdf.service';
import { DocumentApprovalsService } from '../WORKFLOW/WORKFLOW_DOCUMENT_APPROVALS/document_approvals.service';
import { ApprovalActionEnum } from '../shared/enums/workflow.enum';

export class SignEstimateDto {
  @IsString()
  @IsNotEmpty()
  signature_data_url: string;
}

export class RejectByTokenDto {
  @IsString()
  @IsOptional()
  reason?: string;
}

export class EstimatePageOptionsDto extends PageOptionsDto {
  @ApiPropertyOptional({ description: 'Filter by status (comma-separated)' })
  @IsString()
  @IsOptional()
  readonly status?: string;

  @ApiPropertyOptional({ description: 'Exclude statuses (comma-separated)' })
  @IsString()
  @IsOptional()
  readonly excludeStatus?: string;

  @ApiPropertyOptional({ description: 'Filter by creator user ID (for draft ownership)' })
  @IsString()
  @IsOptional()
  readonly createdBy?: string;

  @ApiPropertyOptional({ description: 'Filter by is_template flag' })
  @IsOptional()
  // Query params arrive as strings. With ValidationPipe's enableImplicitConversion,
  // implicit Boolean coercion runs BEFORE @Transform and turns the string 'false'
  // into boolean `true` (Boolean('false') === true). So `value` here is already the
  // corrupted boolean. We must read the RAW value from `obj` (the untransformed
  // source object) to parse it correctly. Preserve undefined when absent (no filter).
  @Transform(({ obj }) => {
    const raw = obj?.isTemplate;
    return raw === undefined ? undefined : raw === true || raw === 'true';
  })
  readonly isTemplate?: boolean;

  @ApiPropertyOptional({ description: 'Filter by asset ID' })
  @IsUUID()
  @IsOptional()
  readonly asset_id?: string;
}

@ApiTags('Estimates')
@ApiBearerAuth()
@Controller('estimates')
export class EstimatesController {
  constructor(
    private readonly estimatesService: EstimatesService,
    private readonly pdfService: PdfService,
    private readonly documentApprovalsService: DocumentApprovalsService,
  ) {}

  @Get()
  @Permissions('estimates:read')
  @ApiOperation({ summary: 'Get all estimates (paginated)' })
  async findAll(
    @TenantId() tenantId: string,
    @Query() query: EstimatePageOptionsDto,
  ) {
    const result = await this.estimatesService.findAllPaginated(tenantId, query, query.status, query.excludeStatus, query.createdBy, query.isTemplate);
    return DataResponseDto.success(result.data, 'Estimates fetched successfully', {
      ...result.meta,
    } as unknown as Record<string, unknown>);
  }

  @Get('assigned-creator')
  @Permissions('estimates:read')
  @ApiOperation({ summary: 'Get the designated estimate creator (first approver in active ESTIMATE workflow)' })
  async getAssignedCreator(@TenantId() tenantId: string) {
    const creatorId = await this.estimatesService.getAssignedCreatorId(tenantId);
    return DataResponseDto.success({ creator_id: creatorId }, 'Assigned creator fetched');
  }

  @Get('all')
  @Permissions('estimates:read')
  @ApiOperation({ summary: 'Get all estimates (non-paginated)' })
  async findAllNonPaginated(@TenantId() tenantId: string, @Query('isTemplate') isTemplate?: string) {
    const isTemplateBool = isTemplate ? isTemplate === 'true' : undefined;
    const estimates = await this.estimatesService.findAll(tenantId, isTemplateBool);
    return DataResponseDto.success(estimates, 'Estimates fetched successfully');
  }

  @Get('my-drafts')
  @Permissions('estimates:read')
  @ApiOperation({ summary: 'Get draft estimates assigned to the current user (via workflow or created_by)' })
  async findMyDrafts(
    @TenantId() tenantId: string,
    @UserId() userId: string,
    @Query() pageOptionsDto: PageOptionsDto,
  ) {
    const result = await this.estimatesService.findMyDrafts(
      tenantId,
      userId,
      pageOptionsDto,
    );
    return DataResponseDto.success(
      result.data,
      'My draft estimates fetched successfully',
      { ...result.meta } as unknown as Record<string, unknown>,
    );
  }

  @Get('my-approvals')
  @Permissions('estimates:read')
  @ApiOperation({ summary: 'Get estimates pending my approval (only those where it is my turn)' })
  async findMyPendingApprovals(
    @TenantId() tenantId: string,
    @UserId() userId: string,
    @Query() pageOptionsDto: PageOptionsDto,
  ) {
    const result = await this.estimatesService.findMyPendingApprovals(
      tenantId,
      userId,
      pageOptionsDto,
    );
    return DataResponseDto.success(
      result.data,
      'Pending approval estimates fetched successfully',
      { ...result.meta } as unknown as Record<string, unknown>,
    );
  }

  @Get(':id/approvals')
  @Permissions('estimates:read')
  @ApiOperation({ summary: 'Get approval chain for an estimate' })
  async getApprovals(@Param('id') id: string, @TenantId() tenantId: string) {
    const approvals = await this.documentApprovalsService.getApprovalsByDocument(
      id,
      tenantId,
    );
    return DataResponseDto.success(approvals, 'Approvals fetched successfully');
  }

  @Post(':id/approvals/:approvalId/process')
  @Permissions('estimates:read')
  @ApiOperation({ summary: 'Process an approval (approve/reject) for an estimate' })
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

  @Get('public/:token')
  @Public()
  @ApiOperation({ summary: 'Get estimate by public token (no auth)' })
  async getPublic(@Param('token') token: string) {
    const estimate = await this.estimatesService.getByPublicToken(token);
    return DataResponseDto.success(estimate, 'Estimate fetched');
  }

  @Post('public/:token/sign')
  @Public()
  @ApiOperation({ summary: 'Submit digital signature for estimate (no auth)' })
  async signPublic(@Param('token') token: string, @Body() dto: SignEstimateDto) {
    const estimate = await this.estimatesService.signByToken(token, dto.signature_data_url);
    return DataResponseDto.success(estimate, 'Signature recorded. Estimate approved.');
  }

  @Post('public/:token/reject')
  @Public()
  @ApiOperation({ summary: 'Decline estimate (no auth)' })
  async rejectPublic(@Param('token') token: string, @Body() dto: RejectByTokenDto) {
    const estimate = await this.estimatesService.rejectByToken(token, dto.reason);
    return DataResponseDto.success(estimate, 'Estimate declined.');
  }

  @Get('work-order/:workOrderId')
  @Permissions('estimates:read')
  @ApiOperation({ summary: 'Get all estimates for a work order' })
  async findByWorkOrder(@Param('workOrderId') workOrderId: string, @TenantId() tenantId: string) {
    const estimates = await this.estimatesService.findByWorkOrder(workOrderId, tenantId);
    return DataResponseDto.success(estimates, 'Work order estimates fetched successfully');
  }

  @Get('service-request/:requestId')
  @Permissions('estimates:read')
  @ApiOperation({ summary: 'Get all estimates for a service request' })
  async findByServiceRequest(@Param('requestId') requestId: string, @TenantId() tenantId: string) {
    const estimates = await this.estimatesService.findByServiceRequest(requestId, tenantId);
    return DataResponseDto.success(estimates, 'Service request estimates fetched successfully');
  }

  // ── On-site estimate approval flow ────────────────────────────────────────

  @Get('pending-internal')
  @Permissions('estimates:read')
  @ApiOperation({ summary: 'Get estimates pending internal (manager) approval' })
  async getPendingInternalApprovals(@TenantId() tenantId: string, @Query() pageOptionsDto: PageOptionsDto) {
    const result = await this.estimatesService.getPendingInternalApprovals(tenantId, pageOptionsDto);
    return DataResponseDto.success(result);
  }

  @Post(':id/submit-for-internal-approval')
  @Permissions('estimates:update')
  @ApiOperation({ summary: 'Technician submits on-site estimate for manager review' })
  async submitForInternalApproval(@Param('id') id: string, @TenantId() tenantId: string, @UserId() userId: string) {
    const estimate = await this.estimatesService.submitForInternalApproval(id, tenantId, userId);
    return DataResponseDto.success(estimate, 'Estimate submitted for manager review');
  }

  @Post(':id/internal-approve')
  @Permissions('estimates:update')
  @ApiOperation({ summary: 'Manager approves on-site estimate and sends to customer' })
  async internalApprove(@Param('id') id: string, @TenantId() tenantId: string, @UserId() userId: string) {
    const estimate = await this.estimatesService.internalApprove(id, tenantId, userId);
    return DataResponseDto.success(estimate, 'Estimate approved and sent to customer');
  }

  @Post(':id/internal-reject')
  @Permissions('estimates:update')
  @ApiOperation({ summary: 'Manager rejects on-site estimate and sends back for revision' })
  async internalReject(@Param('id') id: string, @TenantId() tenantId: string, @Body() body: { reason: string }) {
    const estimate = await this.estimatesService.internalReject(id, tenantId, body.reason);
    return DataResponseDto.success(estimate, 'Estimate rejected and sent back for revision');
  }

  @Public()
  @Post('public/:token/approve')
  @ApiOperation({ summary: 'Customer approves on-site estimate with signature (public, no auth)' })
  async customerApprove(
    @Param('token') token: string,
    @Body() body: { customer_name: string; signature: string },
  ) {
    const estimate = await this.estimatesService.customerApproveByToken(token, body.customer_name, body.signature);
    return DataResponseDto.success(estimate, 'Estimate approved successfully');
  }

  @Public()
  @Post('public/:token/customer-reject')
  @ApiOperation({ summary: 'Customer declines on-site estimate (public, no auth)' })
  async customerReject(@Param('token') token: string, @Body() body: { reason?: string }) {
    const estimate = await this.estimatesService.customerRejectByToken(token, body.reason || '');
    return DataResponseDto.success(estimate, 'Estimate declined');
  }

  @Get(':id')
  @Permissions('estimates:read')
  @ApiOperation({ summary: 'Get estimate by ID' })
  async findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    const estimate = await this.estimatesService.findById(id, tenantId);
    return DataResponseDto.success(estimate);
  }

  @Post()
  @Permissions('estimates:create')
  @ApiOperation({ summary: 'Create a new estimate' })
  async create(@TenantId() tenantId: string, @UserId() userId: string, @Body() dto: CreateEstimateDto) {
    const estimate = await this.estimatesService.create(tenantId, dto, userId);
    return DataResponseDto.created(estimate, 'Estimate created successfully');
  }

  @Put(':id')
  @Permissions('estimates:update')
  @ApiOperation({ summary: 'Update an estimate' })
  async update(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @UserId() userId: string,
    @Body() dto: UpdateEstimateDto,
  ) {
    const estimate = await this.estimatesService.update(id, tenantId, dto, userId);
    return DataResponseDto.success(estimate, 'Estimate updated successfully');
  }

  @Patch(':id/status')
  @Permissions('estimates:update')
  @ApiOperation({ summary: 'Update estimate status with transition validation' })
  async updateStatus(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Body('status') status: string,
  ) {
    const estimate = await this.estimatesService.updateStatus(id, tenantId, status);
    return DataResponseDto.success(estimate, 'Estimate status updated successfully');
  }

  @Delete(':id')
  @Permissions('estimates:delete')
  @ApiOperation({ summary: 'Delete an estimate (soft delete)' })
  async remove(@Param('id') id: string, @TenantId() tenantId: string) {
    await this.estimatesService.delete(id, tenantId);
    return DataResponseDto.success(null, 'Estimate deleted successfully');
  }

  @Post(':id/send')
  @Permissions('estimates:update')
  @ApiOperation({ summary: 'Send estimate to customer' })
  async sendToCustomer(@Param('id') id: string, @TenantId() tenantId: string) {
    const estimate = await this.estimatesService.sendToCustomer(id, tenantId);
    return DataResponseDto.success(estimate, 'Estimate sent to customer successfully');
  }

  @Post(':id/send-whatsapp')
  @Permissions('estimates:update')
  @ApiOperation({ summary: 'Send estimate to customer via WhatsApp' })
  async sendWhatsApp(@Param('id') id: string, @TenantId() tenantId: string) {
    const estimate = await this.estimatesService.sendWhatsApp(id, tenantId);
    return DataResponseDto.success(estimate, 'Estimate sent via WhatsApp successfully');
  }

  @Post('create-from-template/:templateId')
  @Permissions('estimates:create')
  @ApiOperation({ summary: 'Create estimate from a template' })
  async createFromTemplate(
    @Param('templateId') templateId: string,
    @TenantId() tenantId: string,
    @UserId() userId: string,
    @Body() dto: Partial<CreateEstimateDto>,
  ) {
    const estimate = await this.estimatesService.createFromTemplate(templateId, tenantId, userId, dto);
    return DataResponseDto.created(estimate, 'Estimate created from template successfully');
  }

  @Post(':id/generate-link')
  @Permissions('estimates:update')
  @ApiOperation({ summary: 'Generate or refresh the public sign link (works for draft/sent/viewed)' })
  async generateLink(@Param('id') id: string, @TenantId() tenantId: string) {
    const estimate = await this.estimatesService.generatePublicLink(id, tenantId);
    return DataResponseDto.success(estimate, 'Sign link generated');
  }

  @Post(':id/revert-to-draft')
  @Permissions('estimates:update')
  @ApiOperation({ summary: 'Revert estimate back to draft for revision (clears token and signature)' })
  async revertToDraft(@Param('id') id: string, @TenantId() tenantId: string) {
    const estimate = await this.estimatesService.revertToDraft(id, tenantId);
    return DataResponseDto.success(estimate, 'Estimate reverted to draft for revision');
  }

  @Post(':id/approve')
  @Permissions('estimates:update')
  @ApiOperation({ summary: 'Record customer approval' })
  async recordApproval(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Body('signature_url') signatureUrl?: string,
  ) {
    const estimate = await this.estimatesService.recordApproval(id, tenantId, signatureUrl);
    return DataResponseDto.success(estimate, 'Estimate approved successfully');
  }

  @Post(':id/reject')
  @Permissions('estimates:update')
  @ApiOperation({ summary: 'Record customer rejection' })
  async recordRejection(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Body('reason') reason?: string,
  ) {
    const estimate = await this.estimatesService.recordRejection(id, tenantId, reason);
    return DataResponseDto.success(estimate, 'Estimate rejected');
  }

  @Post(':id/convert-to-work-order')
  @Permissions('estimates:update')
  @ApiOperation({ summary: 'Convert approved estimate to work order' })
  async convertToWorkOrder(@Param('id') id: string, @TenantId() tenantId: string, @Body() options?: any) {
    const workOrder = await this.estimatesService.convertToWorkOrder(id, tenantId, options);
    return DataResponseDto.success(workOrder, 'Estimate converted to work order successfully');
  }

  @Post(':id/submit-for-approval')
  @Permissions('estimates:update')
  @ApiOperation({ summary: 'Submit a draft estimate for admin/dispatcher approval (technician flow)' })
  async submitForApproval(@Param('id') id: string, @TenantId() tenantId: string) {
    const estimate = await this.estimatesService.submitForApproval(id, tenantId);
    return DataResponseDto.success(estimate, 'Estimate submitted for approval');
  }

  @Post(':id/admin-approve')
  @Permissions('estimates:update')
  @ApiOperation({ summary: 'Admin/Dispatcher directly approves an estimate (draft or pending_approval)' })
  async adminApprove(@Param('id') id: string, @TenantId() tenantId: string) {
    const estimate = await this.estimatesService.adminApprove(id, tenantId);
    return DataResponseDto.success(estimate, 'Estimate approved successfully');
  }

  @Post(':id/admin-reject')
  @Permissions('estimates:update')
  @ApiOperation({ summary: 'Admin/Dispatcher rejects an estimate (draft or pending_approval)' })
  async adminReject(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Body('reason') reason?: string,
  ) {
    const estimate = await this.estimatesService.adminReject(id, tenantId, reason);
    return DataResponseDto.success(estimate, 'Estimate rejected');
  }

  @Post(':id/generate-invoice')
  @Permissions('estimates:update')
  @ApiOperation({ summary: 'Generate a draft invoice from an approved estimate' })
  async generateInvoice(@Param('id') id: string, @TenantId() tenantId: string) {
    const invoice = await this.estimatesService.generateInvoice(id, tenantId);
    return DataResponseDto.created(invoice, 'Invoice generated successfully');
  }

  @Get(':id/pdf')
  @Permissions('estimates:read')
  @ApiOperation({ summary: 'Download estimate as PDF' })
  async downloadPDF(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Res() res: Response,
  ) {
    const html = await this.pdfService.generateEstimatePDF(id, tenantId);

    // For now, return HTML with proper content type
    // TODO: Convert to actual PDF when Puppeteer is integrated
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `inline; filename="estimate-${id}.html"`);
    res.send(html);
  }
}
