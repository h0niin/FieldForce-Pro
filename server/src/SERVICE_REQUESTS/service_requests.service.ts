import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ServiceRequest } from './service_requests.entity';
import { CreateServiceRequestDto } from './dto/service_requests_create.dto';
import { UpdateServiceRequestDto } from './dto/service_requests_update.dto';
import { TriageServiceRequestDto } from './dto/service_requests_triage.dto';
import { PageOptionsDto } from '../shared/dto/page-options.dto';
import { PageDto } from '../shared/dto/page.dto';
import { PageMetaDto } from '../shared/dto/page-meta.dto';
import { KEYNAMES } from '../shared/constants/keynames';
import { Op, Sequelize } from 'sequelize';
import { Contact } from '../CONTACTS/contacts.entity';
import { ServiceLocation } from '../SERVICE_LOCATIONS/service_locations.entity';
import { DocumentApprovalsService } from '../WORKFLOW/WORKFLOW_DOCUMENT_APPROVALS/document_approvals.service';
import { WorkflowTemplate } from '../WORKFLOW/WORKFLOW_TEMPLATES/workflow_templates.entity';
import { WorkflowApprover } from '../WORKFLOW/WORKFLOW_APPROVERS/workflow_approvers.entity';
import { DocumentTypeEnum } from '../shared/enums/workflow.enum';
import { RequestAuditLog } from './request_audit_log.entity';
import { User } from '../USERS/users.entity';
import { NotificationsService } from '../NOTIFICATIONS/notifications.service';
import { WorkOrder } from '../WORK_ORDERS/work_orders.entity';
import axios from 'axios';
import { SlaService } from '../SLA_MODULE/sla.service';
import { ServiceRequestSla } from '../SLA_MODULE/service_request_slas.entity';

const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  new: ['triaged', 'rejected', 'closed', 'spam'],
  triaged: ['estimated', 'approved', 'rejected', 'closed', 'spam'],
  estimated: ['approved', 'rejected', 'closed'],
  approved: ['converted_to_wo', 'closed'],
  rejected: ['new', 'closed'],
  converted_to_wo: ['closed'],
  closed: [],
  spam: [],
};

@Injectable()
export class ServiceRequestsService {
  private readonly logger = new Logger(ServiceRequestsService.name);

  constructor(
    @Inject(KEYNAMES.SERVICE_REQUESTS)
    private readonly serviceRequestRepository: typeof ServiceRequest,
    @Inject(KEYNAMES.WORKFLOW_TEMPLATES)
    private readonly templateRepository: typeof WorkflowTemplate,
    @Inject(KEYNAMES.REQUEST_AUDIT_LOGS)
    private readonly requestAuditLogRepository: typeof RequestAuditLog,
    @Inject(KEYNAMES.WORK_ORDERS)
    private readonly workOrderRepository: typeof WorkOrder,
    @Inject(KEYNAMES.SERVICE_LOCATIONS)
    private readonly serviceLocationRepository: typeof ServiceLocation,
    private readonly documentApprovalsService: DocumentApprovalsService,
    private readonly notificationsService: NotificationsService,
    private readonly slaService: SlaService,
  ) {}

  async findAllPaginated(
    tenantId: string,
    pageOptionsDto: PageOptionsDto,
    status?: string,
  ): Promise<PageDto<ServiceRequest>> {
    const where: Record<string, unknown> = {
      tenant_id: tenantId,
      is_deleted: false,
    };

    if (status) {
      where.status = status;
    }

    if (pageOptionsDto.search) {
      where[Op.or as unknown as string] = [
        { request_number: { [Op.iLike]: `%${pageOptionsDto.search}%` } },
        { subject: { [Op.iLike]: `%${pageOptionsDto.search}%` } },
        { description: { [Op.iLike]: `%${pageOptionsDto.search}%` } },
        { category: { [Op.iLike]: `%${pageOptionsDto.search}%` } },
      ];
    }

    const { count, rows } = await this.serviceRequestRepository.findAndCountAll({
      where,
      include: [
        {
          model: Contact,
          attributes: ['id', 'first_name', 'last_name', 'email', 'phone'],
        },
        {
          model: ServiceLocation,
          attributes: ['id', 'address', 'lat', 'lng'],
        },
        {
          model: User,
          as: 'technicians',
          attributes: ['id', 'first_name', 'last_name', 'email'],
          through: { attributes: [] },
        },
        {
          model: ServiceRequestSla,
          as: 'sla',
        },
      ],
      order: [['created_at', pageOptionsDto.order]],
      limit: pageOptionsDto.take,
      offset: pageOptionsDto.skip,
    });

    const meta = new PageMetaDto({ pageOptionsDto, itemCount: count });
    return new PageDto(rows, meta);
  }

  async findAll(tenantId: string): Promise<ServiceRequest[]> {
    return this.serviceRequestRepository.findAll({
      where: { tenant_id: tenantId, is_deleted: false },
      include: [{ model: ServiceRequestSla, as: 'sla' }],
      order: [['created_at', 'DESC']],
    });
  }

  async findMyPendingApprovals(
    tenantId: string,
    userId: string,
    pageOptionsDto: PageOptionsDto,
  ): Promise<PageDto<ServiceRequest>> {
    // Find service request IDs where the user has a PENDING approval and it's their turn
    const documentIds = await this.serviceRequestRepository.sequelize!.query(
      `SELECT DISTINCT da.document_id
       FROM workflow_document_approvals da
       WHERE da.tenant_id = :tenantId
         AND da.approver_id = :userId
         AND da.is_deleted = false
         AND da.document_type = 'SERVICE_REQUEST'
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
        { subject: { [Op.iLike]: `%${pageOptionsDto.search}%` } },
        { description: { [Op.iLike]: `%${pageOptionsDto.search}%` } },
      ];
    }

    const { count, rows } = await this.serviceRequestRepository.findAndCountAll({
      where,
      include: [
        { model: Contact, attributes: ['id', 'first_name', 'last_name'] },
        { model: ServiceLocation, attributes: ['id', 'address'] },
      ],
      order: [['created_at', pageOptionsDto.order]],
      limit: pageOptionsDto.take,
      offset: pageOptionsDto.skip,
    });

    const meta = new PageMetaDto({ pageOptionsDto, itemCount: count });
    return new PageDto(rows, meta);
  }

  async findById(id: string, tenantId: string): Promise<ServiceRequest> {
    const serviceRequest = await this.serviceRequestRepository.findOne({
      where: { id, tenant_id: tenantId, is_deleted: false },
      include: [
        {
          model: Contact,
          attributes: ['id', 'first_name', 'last_name', 'email', 'phone'],
        },
        {
          model: ServiceLocation,
          attributes: ['id', 'address', 'lat', 'lng'],
        },
        {
          model: User,
          as: 'technicians',
          attributes: ['id', 'first_name', 'last_name', 'email'],
          through: { attributes: [] },
        },
        {
          model: ServiceRequestSla,
          as: 'sla',
        },
      ],
    });
    if (!serviceRequest) {
      throw new NotFoundException('Service request not found');
    }
    return serviceRequest;
  }

  async create(
    tenantId: string,
    dto: CreateServiceRequestDto,
    creatorUserId?: string,
  ): Promise<ServiceRequest> {
    // Spam / Duplicate Detection
    let isSpamFlagged = false;
    let spamReason = null;
    let finalStatus = 'new';
    
    try {
      const response = await axios.post(`${process.env.AI_ENGINE_URL || 'http://localhost:8000'}/nlp/similarity`, {
        tenant_id: tenantId,
        subject: dto.subject,
        description: dto.description || '',
      });
      
      if (response.data.is_duplicate) {
        isSpamFlagged = true;
        spamReason = `High similarity (${(response.data.similarity_score * 100).toFixed(1)}%) with recent request.`;
        finalStatus = 'spam';
      }
    } catch (error) {
      this.logger.warn(`Failed to call AI engine for spam detection: ${error.message}`);
    }

    // Auto-generate request_number: SR-YYYYMMDD-001 (resets daily)
    const today = new Date();
    const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    const todayCount = await this.serviceRequestRepository.count({
      where: {
        tenant_id: tenantId,
        created_at: { [Op.gte]: todayStart, [Op.lt]: todayEnd },
      },
    });
    const shortTenant = tenantId.split('-')[0].toUpperCase();
    const requestNumber = `SR-${shortTenant}-${dateStr}-${String(todayCount + 1).padStart(3, '0')}`;

    let primaryAssignee = dto.assigned_to;
    if (dto.technician_ids && dto.technician_ids.length > 0) {
      primaryAssignee = dto.technician_ids[0];
    }

    // Destructure technician_ids out so it is NOT passed to Sequelize .create()
    // (it is not a DB column — it is handled separately via $set below)
    const { technician_ids: technicianIds, ...createDto } = dto;

    let serviceRequest;
    try {
      serviceRequest = await this.serviceRequestRepository.create({
        tenant_id: tenantId,
        request_number: requestNumber,
        status: finalStatus,
        is_spam_flagged: isSpamFlagged,
        spam_reason: spamReason,
        ...createDto,
        assigned_to: primaryAssignee,
      });

      if (technicianIds && technicianIds.length > 0) {
        await serviceRequest.$set('technicians', technicianIds, { through: { tenant_id: tenantId } });
      }
    } catch (error: any) {
      this.logger.error('Full Error during creation:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
      if (error.errors) {
        this.logger.error('Error Details:', JSON.stringify(error.errors, null, 2));
      }
      throw error;
    }

    // Create ServiceLocation if GPS coordinates were provided
    if (dto.lat !== undefined && dto.lng !== undefined) {
      try {
        const address = (dto.custom_fields?.service_address as string) || 'Location from GPS';
        const location = await this.serviceLocationRepository.create({
          tenant_id: tenantId,
          address,
          lat: dto.lat,
          lng: dto.lng,
        });
        await serviceRequest.update({ location_id: location.id });
      } catch (error) {
        this.logger.warn(`Failed to create ServiceLocation for SR ${serviceRequest.id}: ${(error as Error).message}`);
      }
    }

    // Auto-trigger approval chain if an active template exists for SERVICE_REQUEST
    try {
      await this.triggerApprovalChain(tenantId, serviceRequest);
    } catch (error) {
      this.logger.error(
        `Failed to trigger approval chain for SR ${serviceRequest.id}: ${error.message}`,
        error.stack,
      );
    }

    try {
      await this.slaService.attachSlaToServiceRequest(tenantId, serviceRequest);
    } catch (error) {
      this.logger.error(`Failed to attach SLA for SR ${serviceRequest.id}: ${(error as Error).message}`);
    }

    return this.findById(serviceRequest.id, tenantId);
  }

  private async triggerApprovalChain(
    tenantId: string,
    serviceRequest: ServiceRequest,
  ): Promise<void> {
    // Find active template for SERVICE_REQUEST
    this.logger.log(`Looking for active SERVICE_REQUEST template for tenant ${tenantId}`);
    const template = await this.templateRepository.findOne({
      where: {
        tenant_id: tenantId,
        document_type: DocumentTypeEnum.SERVICE_REQUEST,
        is_active: true,
        is_deleted: false,
      },
      include: [
        {
          model: WorkflowApprover,
          where: { is_deleted: false, is_active: true },
          required: false,
        },
      ],
    });

    if (!template) {
      this.logger.log('No active SERVICE_REQUEST template found — skipping approval chain');
      return;
    }

    if (!template.approvers || template.approvers.length === 0) {
      this.logger.log(`Template "${template.name}" found but has no active approvers — skipping`);
      return;
    }

    this.logger.log(`Found template "${template.name}" with ${template.approvers.length} approvers`);

    // Create document approval records from the template
    // createDocumentApprovals() automatically notifies the first approver
    await this.documentApprovalsService.createDocumentApprovals(
      tenantId,
      {
        document_id: serviceRequest.id,
        document_type: DocumentTypeEnum.SERVICE_REQUEST,
        workflow_id: template.id,
      },
    );
  }

  async update(
    id: string,
    tenantId: string,
    dto: UpdateServiceRequestDto,
  ): Promise<ServiceRequest> {
    const serviceRequest = await this.findById(id, tenantId);
    
    // Destructure technician_ids to prevent Sequelize from trying to write to a non-existent column
    const { technician_ids: technicianIds, ...updateDto } = dto;

    let primaryAssignee: string | null | undefined = updateDto.assigned_to;
    if (technicianIds !== undefined) {
      primaryAssignee = technicianIds.length > 0 ? technicianIds[0] : null;
    }

    await serviceRequest.update({ ...updateDto, assigned_to: primaryAssignee });

    if (technicianIds !== undefined) {
      await serviceRequest.$set('technicians', technicianIds, { through: { tenant_id: tenantId } });
    } else if (updateDto.assigned_to !== undefined) {
      await serviceRequest.$set('technicians', updateDto.assigned_to ? [updateDto.assigned_to] : [], { through: { tenant_id: tenantId } });
    }

    return serviceRequest;
  }

  async assignTechnician(
    id: string,
    tenantId: string,
    technicianId: string,
    technicianName: string,
  ): Promise<ServiceRequest> {
    const serviceRequest = await this.findById(id, tenantId);
    await serviceRequest.update({ assigned_to: technicianId });
    // Use $add to append the technician without removing existing ones
    await serviceRequest.$add('technicians', [technicianId], { through: { tenant_id: tenantId } });

    try {
      await this.notificationsService.create(tenantId, {
        user_id: technicianId,
        type: 'service_request_assigned',
        title: 'Service Request Assigned',
        body: `You have been assigned to Service Request ${serviceRequest.request_number}`,
        data: { service_request_id: id, navigate_to: 'service_request' },
        channel: 'in_app',
      });
    } catch (err) {
      this.logger.warn(`Failed to notify technician ${technicianName} for SR ${id}: ${(err as Error).message}`);
    }

    return serviceRequest;
  }

  async updateStatus(
    id: string,
    tenantId: string,
    dto: TriageServiceRequestDto,
  ): Promise<ServiceRequest> {
    const serviceRequest = await this.findById(id, tenantId);
    const currentStatus = serviceRequest.status;
    const newStatus = dto.status;

    const allowedTransitions = VALID_STATUS_TRANSITIONS[currentStatus];
    if (!allowedTransitions || !allowedTransitions.includes(newStatus)) {
      throw new BadRequestException(
        `Invalid status transition from '${currentStatus}' to '${newStatus}'. Allowed transitions: ${allowedTransitions?.join(', ') || 'none (terminal state)'}`,
      );
    }

    const updateData: Record<string, unknown> = { status: newStatus };
    if (dto.priority !== undefined) {
      updateData.priority = dto.priority;
    }
    if (dto.category !== undefined) {
      updateData.category = dto.category;
    }
    
    if (dto.technician_ids !== undefined) {
      updateData.assigned_to = dto.technician_ids.length > 0 ? dto.technician_ids[0] : null;
    } else if (dto.assigned_to !== undefined) {
      updateData.assigned_to = dto.assigned_to;
    }

    await serviceRequest.update(updateData);

    if (dto.technician_ids !== undefined) {
      await serviceRequest.$set('technicians', dto.technician_ids);
    } else if (dto.assigned_to !== undefined) {
      await serviceRequest.$set('technicians', dto.assigned_to ? [dto.assigned_to] : []);
    }

    return serviceRequest;
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const serviceRequest = await this.findById(id, tenantId);
    await serviceRequest.update({ is_deleted: true });
  }

  async convertToWorkOrder(
    id: string,
    tenantId: string,
    managerId: string,
  ): Promise<{ workOrder: WorkOrder; serviceRequest: ServiceRequest }> {
    const serviceRequest = await this.findById(id, tenantId);

    if (serviceRequest.status === 'converted_to_wo') {
      throw new BadRequestException('This service request has already been converted to a work order');
    }
    if (['closed', 'spam'].includes(serviceRequest.status)) {
      throw new BadRequestException(`Cannot convert a service request with status '${serviceRequest.status}' to a work order`);
    }

    // Auto-generate wo_number
    const count = await this.workOrderRepository.count({ where: { tenant_id: tenantId } });
    const woNumber = `WO-${String(count + 1).padStart(6, '0')}`;

    const workOrder = await this.workOrderRepository.create({
      tenant_id: tenantId,
      wo_number: woNumber,
      request_id: serviceRequest.id,
      contact_id: serviceRequest.contact_id,
      location_id: serviceRequest.location_id,
      summary: serviceRequest.subject,
      description: serviceRequest.description,
      priority: serviceRequest.priority === 'CRITICAL' ? 'urgent' : (serviceRequest.priority?.toLowerCase() || 'medium'),
      status: 'new',
      assigned_to: serviceRequest.assigned_to || null,
    });

    await serviceRequest.update({ status: 'converted_to_wo' });

    try {
      if (serviceRequest.assigned_to && serviceRequest.assigned_to !== managerId) {
        await this.notificationsService.create(tenantId, {
          user_id: serviceRequest.assigned_to,
          type: 'work_order_created',
          title: 'Work Order Created',
          body: `Service Request ${serviceRequest.request_number} has been converted to Work Order ${woNumber}`,
          data: { work_order_id: workOrder.id, service_request_id: id, navigate_to: 'work_order' },
          channel: 'in_app',
        });
      }
    } catch (err) {
      this.logger.warn(`Failed to notify about SR-to-WO conversion for SR ${id}: ${(err as Error).message}`);
    }

    return { workOrder, serviceRequest };
  }

  async approveAndConvert(
    id: string,
    tenantId: string,
    managerId: string,
  ): Promise<{ workOrder: WorkOrder; serviceRequest: ServiceRequest }> {
    const serviceRequest = await this.findById(id, tenantId);

    if (['converted_to_wo', 'closed', 'spam'].includes(serviceRequest.status)) {
      throw new BadRequestException(
        `Cannot approve a service request with status '${serviceRequest.status}'`,
      );
    }

    const count = await this.workOrderRepository.count({ where: { tenant_id: tenantId } });
    const woNumber = `WO-${String(count + 1).padStart(6, '0')}`;

    const workOrder = await this.workOrderRepository.create({
      tenant_id: tenantId,
      wo_number: woNumber,
      request_id: serviceRequest.id,
      contact_id: serviceRequest.contact_id,
      location_id: serviceRequest.location_id,
      summary: serviceRequest.subject,
      description: serviceRequest.description,
      priority: serviceRequest.priority === 'CRITICAL' ? 'urgent' : (serviceRequest.priority?.toLowerCase() || 'medium'),
      status: 'new',
      assigned_to: serviceRequest.assigned_to || null,
    });

    await serviceRequest.update({ status: 'converted_to_wo' });

    try {
      if (serviceRequest.assigned_to && serviceRequest.assigned_to !== managerId) {
        await this.notificationsService.create(tenantId, {
          user_id: serviceRequest.assigned_to,
          type: 'work_order_created',
          title: 'Work Order Created',
          body: `Service Request ${serviceRequest.request_number} has been approved and converted to Work Order ${woNumber}`,
          data: { work_order_id: workOrder.id, service_request_id: id, navigate_to: 'work_order' },
          channel: 'in_app',
        });
      }
    } catch (err) {
      this.logger.warn(`Failed to notify about SR approval+convert for SR ${id}: ${(err as Error).message}`);
    }

    return { workOrder, serviceRequest };
  }

  async getQueue(tenantId: string): Promise<ServiceRequest[]> {
    // Custom sort: CRITICAL > HIGH > MEDIUM > LOW, then by created_at DESC
    return this.serviceRequestRepository.findAll({
      where: {
        tenant_id: tenantId,
        is_deleted: false,
        status: { [Op.notIn]: ['closed', 'rejected', 'spam'] },
      },
      order: [
        [
          Sequelize.literal(`
            CASE priority 
              WHEN 'CRITICAL' THEN 1 
              WHEN 'HIGH' THEN 2 
              WHEN 'MEDIUM' THEN 3 
              WHEN 'LOW' THEN 4 
              ELSE 5 
            END
          `),
          'ASC',
        ],
        ['created_at', 'ASC'],
      ],
      include: [
        { model: Contact, attributes: ['id', 'first_name', 'last_name'] },
        { model: ServiceLocation, attributes: ['id', 'address'] },
        { model: ServiceRequestSla, as: 'sla' },
      ],
    });
  }

  async updatePriority(
    id: string,
    tenantId: string,
    userId: string,
    priority: string,
  ): Promise<ServiceRequest> {
    const request = await this.findById(id, tenantId);
    const oldPriority = request.priority;

    if (oldPriority === priority) {
      return request;
    }

    const transaction = await this.serviceRequestRepository.sequelize!.transaction();
    try {
      await request.update({ priority }, { transaction });

      await this.requestAuditLogRepository.create(
        {
          request_id: id,
          tenant_id: tenantId,
          changed_by: userId,
          field_changed: 'priority',
          old_value: oldPriority,
          new_value: priority,
        },
        { transaction },
      );

      await transaction.commit();
      return request;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}
