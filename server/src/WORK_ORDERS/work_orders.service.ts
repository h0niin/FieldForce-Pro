import { Injectable, Inject, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { WorkOrder } from './work_orders.entity';
import { Contact } from '../CONTACTS/contacts.entity';
import { ServiceLocation } from '../SERVICE_LOCATIONS/service_locations.entity';
import { User } from '../USERS/users.entity';
import { CreateWorkOrderDto } from './dto/work_orders_create.dto';
import { UpdateWorkOrderDto } from './dto/work_orders_update.dto';
import { UpdateWorkOrderStatusDto } from './dto/work_orders_update_status.dto';
import { PageOptionsDto } from '../shared/dto/page-options.dto';
import { PageDto } from '../shared/dto/page.dto';
import { PageMetaDto } from '../shared/dto/page-meta.dto';
import { KEYNAMES } from '../shared/constants/keynames';
import { Op } from 'sequelize';
import { DocumentApprovalsService } from '../WORKFLOW/WORKFLOW_DOCUMENT_APPROVALS/document_approvals.service';
import { DocumentTypeEnum } from '../shared/enums/workflow.enum';

// Valid status transitions for work orders
const STATUS_TRANSITIONS: Record<string, string[]> = {
  new: ['estimated', 'approved', 'scheduled', 'cancelled'],
  estimated: ['approved', 'cancelled'],
  approved: ['scheduled', 'cancelled'],
  scheduled: ['in_progress', 'cancelled'],
  in_progress: ['on_hold', 'completed', 'cancelled'],
  on_hold: ['in_progress', 'cancelled'],
  completed: ['closed'],
  closed: [],
  cancelled: [],
};

@Injectable()
export class WorkOrdersService {
  private readonly logger = new Logger(WorkOrdersService.name);

  constructor(
    @Inject(KEYNAMES.WORK_ORDERS)
    private readonly workOrderRepository: typeof WorkOrder,
    private readonly documentApprovalsService: DocumentApprovalsService,
  ) { }

  async findAllPaginated(
    tenantId: string,
    pageOptionsDto: PageOptionsDto,
  ): Promise<PageDto<WorkOrder>> {
    const where: Record<string, unknown> = {
      tenant_id: tenantId,
      is_deleted: false,
    };

    if (pageOptionsDto.search) {
      where[Op.or as unknown as string] = [
        { wo_number: { [Op.iLike]: `%${pageOptionsDto.search}%` } },
        { summary: { [Op.iLike]: `%${pageOptionsDto.search}%` } },
        { description: { [Op.iLike]: `%${pageOptionsDto.search}%` } },
        { category: { [Op.iLike]: `%${pageOptionsDto.search}%` } },
      ];
    }

    const { count, rows } = await this.workOrderRepository.findAndCountAll({
      where,
      order: [['created_at', pageOptionsDto.order]],
      limit: pageOptionsDto.take,
      offset: pageOptionsDto.skip,
      include: [
        {
          model: Contact,
          as: 'contact',
          attributes: ['id', 'first_name', 'last_name', 'email', 'phone'],
        },
        {
          model: ServiceLocation,
          as: 'location',
          attributes: ['id', 'address', 'lat', 'lng', 'access_notes', 'gate_code'],
        },
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'first_name', 'last_name'],
          required: false,
        },
      ],
    });

    const meta = new PageMetaDto({ pageOptionsDto, itemCount: count });
    return new PageDto(rows, meta);
  }

  async findAll(tenantId: string): Promise<WorkOrder[]> {
    return this.workOrderRepository.findAll({
      where: { tenant_id: tenantId, is_deleted: false },
      order: [['created_at', 'DESC']],
      include: [
        {
          model: Contact,
          as: 'contact',
          attributes: ['id', 'first_name', 'last_name', 'email', 'phone'],
        },
        {
          model: ServiceLocation,
          as: 'location',
          attributes: ['id', 'address', 'lat', 'lng', 'access_notes', 'gate_code'],
        },
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'first_name', 'last_name'],
          required: false,
        },
      ],
    });
  }

  async findByAssignedUser(
    userId: string,
    tenantId: string,
    pageOptionsDto: PageOptionsDto,
  ): Promise<PageDto<WorkOrder>> {
    const where: Record<string, unknown> = {
      tenant_id: tenantId,
      assigned_to: userId,
      is_deleted: false,
    };

    if (pageOptionsDto.search) {
      where[Op.or as unknown as string] = [
        { wo_number: { [Op.iLike]: `%${pageOptionsDto.search}%` } },
        { summary: { [Op.iLike]: `%${pageOptionsDto.search}%` } },
        { description: { [Op.iLike]: `%${pageOptionsDto.search}%` } },
        { category: { [Op.iLike]: `%${pageOptionsDto.search}%` } },
      ];
    }

    const { count, rows } = await this.workOrderRepository.findAndCountAll({
      where,
      order: [['created_at', pageOptionsDto.order]],
      limit: pageOptionsDto.take,
      offset: pageOptionsDto.skip,
      include: [
        {
          model: Contact,
          as: 'contact',
          attributes: ['id', 'first_name', 'last_name', 'email', 'phone'],
        },
        {
          model: ServiceLocation,
          as: 'location',
          attributes: ['id', 'address', 'lat', 'lng', 'access_notes', 'gate_code'],
        },
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'first_name', 'last_name'],
          required: false,
        },
      ],
    });

    const meta = new PageMetaDto({ pageOptionsDto, itemCount: count });
    return new PageDto(rows, meta);
  }

  async findMyPendingApprovals(
    tenantId: string,
    userId: string,
    pageOptionsDto: PageOptionsDto,
  ): Promise<PageDto<WorkOrder>> {
    const documentIds = await this.workOrderRepository.sequelize!.query(
      `SELECT DISTINCT da.document_id
       FROM workflow_document_approvals da
       WHERE da.tenant_id = :tenantId
         AND da.approver_id = :userId
         AND da.is_deleted = false
         AND da.document_type = 'WORK_ORDER'
         AND da.status = 'PENDING'
         AND NOT EXISTS (
           SELECT 1 FROM workflow_document_approvals prev
           WHERE prev.document_id = da.document_id
             AND prev.tenant_id = da.tenant_id
             AND prev.order_no < da.order_no
             AND prev.status = 'PENDING'
             AND prev.is_deleted = false
         )`,
      {
        replacements: { tenantId, userId },
        type: 'SELECT' as unknown as undefined,
      },
    ) as unknown as Array<{ document_id: string }>;

    const ids = documentIds.map((r) => r.document_id);

    if (ids.length === 0) {
      const meta = new PageMetaDto({ pageOptionsDto, itemCount: 0 });
      return new PageDto([], meta);
    }

    const where: Record<string, unknown> = {
      id: { [Op.in]: ids },
      tenant_id: tenantId,
      is_deleted: false,
    };

    if (pageOptionsDto.search) {
      where[Op.or as unknown as string] = [
        { wo_number: { [Op.iLike]: `%${pageOptionsDto.search}%` } },
        { summary: { [Op.iLike]: `%${pageOptionsDto.search}%` } },
        { description: { [Op.iLike]: `%${pageOptionsDto.search}%` } },
      ];
    }

    const { count, rows } = await this.workOrderRepository.findAndCountAll({
      where,
      include: [
        {
          model: Contact,
          as: 'contact',
          attributes: ['id', 'first_name', 'last_name', 'email', 'phone'],
        },
        {
          model: ServiceLocation,
          as: 'location',
          attributes: ['id', 'address', 'lat', 'lng', 'access_notes', 'gate_code'],
        },
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'first_name', 'last_name'],
          required: false,
        },
      ],
      order: [['created_at', pageOptionsDto.order]],
      limit: pageOptionsDto.take,
      offset: pageOptionsDto.skip,
    });

    const meta = new PageMetaDto({ pageOptionsDto, itemCount: count });
    return new PageDto(rows, meta);
  }

  async findById(id: string, tenantId: string): Promise<WorkOrder> {
    const workOrder = await this.workOrderRepository.findOne({
      where: { id, tenant_id: tenantId, is_deleted: false },
      include: [
        {
          model: Contact,
          as: 'contact',
          attributes: ['id', 'first_name', 'last_name', 'email', 'phone'],
        },
        {
          model: ServiceLocation,
          as: 'location',
          attributes: ['id', 'address', 'lat', 'lng', 'access_notes', 'gate_code'],
        },
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'first_name', 'last_name'],
          required: false,
        },
      ],
    });
    if (!workOrder) {
      throw new NotFoundException('Work order not found');
    }
    return workOrder;
  }

  async create(tenantId: string, dto: CreateWorkOrderDto): Promise<WorkOrder> {
    // Auto-generate wo_number
    const count = await this.workOrderRepository.count({
      where: { tenant_id: tenantId },
    });
    const woNumber = `WO-${String(count + 1).padStart(6, '0')}`;

    const workOrder = await this.workOrderRepository.create({
      tenant_id: tenantId,
      wo_number: woNumber,
      ...dto,
    });

    // Fetch the created work order with includes
    return this.findById(workOrder.id, tenantId);
  }

  async update(
    id: string,
    tenantId: string,
    dto: UpdateWorkOrderDto,
  ): Promise<WorkOrder> {
    const workOrder = await this.findById(id, tenantId);
    await workOrder.update(dto);
    return workOrder;
  }

  async updateStatus(
    id: string,
    tenantId: string,
    dto: UpdateWorkOrderStatusDto,
  ): Promise<WorkOrder> {
    const workOrder = await this.findById(id, tenantId);

    const allowedTransitions = STATUS_TRANSITIONS[workOrder.status] || [];
    if (!allowedTransitions.includes(dto.status)) {
      throw new BadRequestException(
        `Cannot transition from '${workOrder.status}' to '${dto.status}'. Allowed transitions: ${allowedTransitions.join(', ') || 'none (terminal state)'}`,
      );
    }

    await workOrder.update({ status: dto.status });
    return workOrder;
  }

  async setStatus(id: string, tenantId: string, status: string): Promise<WorkOrder> {
    const workOrder = await this.findById(id, tenantId);
    await workOrder.update({ status });
    return workOrder;
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const workOrder = await this.findById(id, tenantId);
    await workOrder.update({ is_deleted: true });
  }

  async submitForApproval(
    id: string,
    tenantId: string,
    dto: { workflow_id: string; due_date?: string },
  ) {
    const workOrder = await this.findById(id, tenantId);

    if (!['new', 'estimated'].includes(workOrder.status)) {
      throw new BadRequestException(
        `Work order with status '${workOrder.status}' cannot be submitted for approval`,
      );
    }

    const approvals = await this.documentApprovalsService.createDocumentApprovals(tenantId, {
      document_id: workOrder.id,
      document_type: DocumentTypeEnum.WORK_ORDER,
      workflow_id: dto.workflow_id,
      due_date: dto.due_date,
    });

    // Move WO to 'estimated' to indicate it's pending internal approval
    await workOrder.update({ status: 'estimated' });

    return approvals;
  }
}
