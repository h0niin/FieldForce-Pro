import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DocumentApprovalsService } from './document_approvals.service';
import {
  CreateDocumentApprovalsDto,
  ProcessApprovalDto,
  BulkProcessApprovalDto,
  DelegateApprovalDto,
  QueryApprovalsDto,
} from './dto/document_approvals.dto';
import { PageOptionsDto } from '../../shared/dto/page-options.dto';
import { DataResponseDto } from '../../shared/dto/data-response.dto';
import { TenantId } from '../../shared/decorator/tenant.decorator';
import { Permissions } from '../../shared/decorator/permission.decorator';

@ApiTags('Document Approvals')
@ApiBearerAuth()
@Controller('document-approvals')
export class DocumentApprovalsController {
  constructor(
    private readonly documentApprovalsService: DocumentApprovalsService,
  ) {}

  @Get()
  @Permissions('workflow_approvals:read')
  @ApiOperation({ summary: 'Get all document approvals (paginated with filters)' })
  async findAll(
    @TenantId() tenantId: string,
    @Query() queryDto: QueryApprovalsDto,
  ) {
    const result = await this.documentApprovalsService.findAllPaginated(
      tenantId,
      queryDto,
      {
        document_type: queryDto.document_type,
        status: queryDto.status,
        approver_id: queryDto.approver_id,
        document_id: queryDto.document_id,
      },
    );
    return DataResponseDto.success(result.data, 'Document approvals fetched successfully', {
      ...result.meta,
    } as unknown as Record<string, unknown>);
  }

  @Get('my-pending')
  @ApiOperation({ summary: 'Get my pending approvals' })
  async getMyPending(
    @TenantId() tenantId: string,
    @Req() req: { user?: { id?: string } },
    @Query() pageOptionsDto: PageOptionsDto,
  ) {
    const userId = req.user?.id;
    if (!userId) {
      return DataResponseDto.error('User not found', 401);
    }
    const result = await this.documentApprovalsService.getMyPendingApprovals(
      tenantId,
      userId,
      pageOptionsDto,
    );
    return DataResponseDto.success(result.data, 'Pending approvals fetched successfully', {
      ...result.meta,
    } as unknown as Record<string, unknown>);
  }

  @Get('sent-to-me')
  @ApiOperation({ summary: 'Get all approvals sent to me (any status)' })
  async getSentToMe(
    @TenantId() tenantId: string,
    @Req() req: { user?: { id?: string } },
    @Query() pageOptionsDto: PageOptionsDto,
  ) {
    const userId = req.user?.id;
    if (!userId) {
      return DataResponseDto.error('User not found', 401);
    }
    const result = await this.documentApprovalsService.getMyApprovals(
      tenantId,
      userId,
      pageOptionsDto,
    );
    return DataResponseDto.success(result.data, 'Approvals fetched successfully', {
      ...result.meta,
    } as unknown as Record<string, unknown>);
  }

  @Get('dashboard')
  @Permissions('workflow_approvals:read')
  @ApiOperation({ summary: 'Get approval dashboard statistics' })
  async getDashboard(
    @TenantId() tenantId: string,
    @Query('approver_id') approverId?: string,
  ) {
    const stats = await this.documentApprovalsService.getDashboardStats(tenantId, approverId);
    return DataResponseDto.success(stats, 'Dashboard stats fetched successfully');
  }

  @Get('document/:documentId')
  @ApiOperation({ summary: 'Get all approvals for a specific document' })
  async getByDocument(
    @Param('documentId') documentId: string,
    @TenantId() tenantId: string,
  ) {
    const approvals = await this.documentApprovalsService.getApprovalsByDocument(
      documentId,
      tenantId,
    );
    return DataResponseDto.success(approvals, 'Document approvals fetched successfully');
  }

  @Get('document/:documentId/history')
  @ApiOperation({ summary: 'Get all approval history events for a specific document' })
  async getHistoryByDocument(
    @Param('documentId') documentId: string,
    @TenantId() tenantId: string,
  ) {
    const history = await this.documentApprovalsService.getHistoryByDocument(
      documentId,
      tenantId,
    );
    return DataResponseDto.success(history, 'Document approval history fetched successfully');
  }

  @Get(':id')
  @Permissions('workflow_approvals:read')
  @ApiOperation({ summary: 'Get document approval by ID' })
  async findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    const approval = await this.documentApprovalsService.findById(id, tenantId);
    return DataResponseDto.success(approval);
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Get approval history for a specific approval' })
  async getHistory(@Param('id') id: string, @TenantId() tenantId: string) {
    const history = await this.documentApprovalsService.getApprovalHistory(id, tenantId);
    return DataResponseDto.success(history, 'Approval history fetched successfully');
  }

  @Post()
  @Permissions('workflow_approvals:create')
  @ApiOperation({ summary: 'Create document approvals from workflow template' })
  async create(@TenantId() tenantId: string, @Body() dto: CreateDocumentApprovalsDto) {
    const approvals = await this.documentApprovalsService.createDocumentApprovals(tenantId, dto);
    return DataResponseDto.created(approvals, 'Document approvals created successfully');
  }

  @Post(':id/process')
  @ApiOperation({ summary: 'Process an approval (approve/reject/etc)' })
  async processApproval(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Req() req: { user?: { id?: string } },
    @Body() dto: ProcessApprovalDto,
  ) {
    const actorId = req.user?.id;
    if (!actorId) {
      return DataResponseDto.error('User not found', 401);
    }
    const approval = await this.documentApprovalsService.processApproval(
      id,
      tenantId,
      actorId,
      dto,
    );
    return DataResponseDto.success(approval, 'Approval processed successfully');
  }

  @Post('bulk-process')
  @Permissions('workflow_approvals:update')
  @ApiOperation({ summary: 'Bulk process multiple approvals' })
  async bulkProcess(
    @TenantId() tenantId: string,
    @Req() req: { user?: { id?: string } },
    @Body() dto: BulkProcessApprovalDto,
  ) {
    const actorId = req.user?.id;
    if (!actorId) {
      return DataResponseDto.error('User not found', 401);
    }
    const result = await this.documentApprovalsService.bulkProcessApproval(
      tenantId,
      actorId,
      dto,
    );
    return DataResponseDto.success(result, 'Bulk approval processing complete');
  }

  @Post(':id/delegate')
  @Permissions('workflow_approvals:update')
  @ApiOperation({ summary: 'Delegate an approval to another user' })
  async delegate(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Req() req: { user?: { id?: string } },
    @Body() dto: DelegateApprovalDto,
  ) {
    const actorId = req.user?.id;
    if (!actorId) {
      return DataResponseDto.error('User not found', 401);
    }
    const approval = await this.documentApprovalsService.delegateApproval(
      id,
      tenantId,
      actorId,
      dto,
    );
    return DataResponseDto.success(approval, 'Approval delegated successfully');
  }

  @Delete(':id')
  @Permissions('workflow_approvals:delete')
  @ApiOperation({ summary: 'Delete a document approval (soft delete)' })
  async remove(@Param('id') id: string, @TenantId() tenantId: string) {
    await this.documentApprovalsService.delete(id, tenantId);
    return DataResponseDto.success(null, 'Document approval deleted successfully');
  }
}
