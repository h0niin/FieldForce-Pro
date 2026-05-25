import {
  Injectable,
  Inject,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { Op } from 'sequelize';
import { KEYNAMES } from '../shared/constants/keynames';
import { Contact } from '../CONTACTS/contacts.entity';
import { ServiceRequest } from '../SERVICE_REQUESTS/service_requests.entity';
import { Invoice } from '../INVOICES/invoices.entity';
import { Payment } from '../PAYMENTS/payments.entity';
import { WorkOrder } from '../WORK_ORDERS/work_orders.entity';
import { ServiceLocation } from '../SERVICE_LOCATIONS/service_locations.entity';
import { ServiceAppointment } from '../SERVICE_APPOINTMENTS/service_appointments.entity';
import { WorkOrderLineItem } from '../WORK_ORDER_LINE_ITEMS/work_order_line_items.entity';
import { WorkOrderNote } from '../WORK_ORDER_NOTES/work_order_notes.entity';
import { WorkOrderAttachment } from '../WORK_ORDER_ATTACHMENTS/work_order_attachments.entity';
import { WorkOrderTechnicianSession } from '../WORK_ORDER_TECHNICIAN_SESSIONS/work_order_technician_sessions.entity';
import { Review } from '../REVIEWS/reviews.entity';
import { User } from '../USERS/users.entity';
import {
  PortalAuthDto,
  PortalMakePaymentDto,
  PortalCreateServiceRequestDto,
} from './dto/customer-portal.dto';

interface PortalTokenPayload {
  contact_id: string;
  tenant_id: string;
  email: string;
  expires_at: number;
}

// In-memory token store (in production, use Redis)
const tokenStore = new Map<string, PortalTokenPayload>();

// Token validity: 24 hours
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class CustomerPortalService {
  constructor(
    @Inject(KEYNAMES.CONTACTS)
    private readonly contactRepository: typeof Contact,
    @Inject(KEYNAMES.SERVICE_REQUESTS)
    private readonly serviceRequestRepository: typeof ServiceRequest,
    @Inject(KEYNAMES.INVOICES)
    private readonly invoiceRepository: typeof Invoice,
    @Inject(KEYNAMES.PAYMENTS)
    private readonly paymentRepository: typeof Payment,
    @Inject(KEYNAMES.WORK_ORDERS)
    private readonly workOrderRepository: typeof WorkOrder,
    @Inject(KEYNAMES.SERVICE_LOCATIONS)
    private readonly serviceLocationRepository: typeof ServiceLocation,
    @Inject(KEYNAMES.SERVICE_APPOINTMENTS)
    private readonly serviceAppointmentRepository: typeof ServiceAppointment,
    @Inject(KEYNAMES.WORK_ORDER_LINE_ITEMS)
    private readonly lineItemRepository: typeof WorkOrderLineItem,
    @Inject(KEYNAMES.WORK_ORDER_NOTES)
    private readonly noteRepository: typeof WorkOrderNote,
    @Inject(KEYNAMES.WORK_ORDER_ATTACHMENTS)
    private readonly attachmentRepository: typeof WorkOrderAttachment,
    @Inject(KEYNAMES.WORK_ORDER_TECHNICIAN_SESSIONS)
    private readonly techSessionRepository: typeof WorkOrderTechnicianSession,
    @Inject(KEYNAMES.REVIEWS)
    private readonly reviewRepository: typeof Review,
  ) {}

  /**
   * Get all service locations (public — for guest service request form).
   * Returns only id and address to avoid leaking sensitive data.
   */
  async getServiceLocations() {
    return this.serviceLocationRepository.findAll({
      where: { is_deleted: false },
      attributes: ['id', 'address', 'lat', 'lng'],
      order: [['address', 'ASC']],
    });
  }

  /**
   * Authenticate a customer using email + reference number.
   * Returns a portal access token.
   */
  async authenticate(dto: PortalAuthDto): Promise<{ token: string; expires_at: string }> {
    // Find contact by email
    const contact = await this.contactRepository.findOne({
      where: {
        email: dto.email,
        is_deleted: false,
      },
    });

    if (!contact) {
      throw new UnauthorizedException('Invalid email or reference number');
    }

    // Verify reference number matches a service request, work order, or invoice for this contact
    const refNumber = dto.reference_number.trim();
    const contactId = contact.id;
    const tenantId = contact.tenant_id;

    const [serviceRequest, workOrder, invoice] = await Promise.all([
      this.serviceRequestRepository.findOne({
        where: {
          contact_id: contactId,
          tenant_id: tenantId,
          id: refNumber,
          is_deleted: false,
        },
      }),
      this.workOrderRepository.findOne({
        where: {
          contact_id: contactId,
          tenant_id: tenantId,
          [Op.or]: [{ id: refNumber }, { wo_number: refNumber }],
          is_deleted: false,
        },
      }),
      this.invoiceRepository.findOne({
        where: {
          contact_id: contactId,
          tenant_id: tenantId,
          [Op.or]: [{ id: refNumber }, { invoice_number: refNumber }],
          is_deleted: false,
        },
      }),
    ]);

    if (!serviceRequest && !workOrder && !invoice) {
      throw new UnauthorizedException('Invalid email or reference number');
    }

    // Generate token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + TOKEN_TTL_MS;

    tokenStore.set(token, {
      contact_id: contactId,
      tenant_id: tenantId,
      email: dto.email,
      expires_at: expiresAt,
    });

    return {
      token,
      expires_at: new Date(expiresAt).toISOString(),
    };
  }

  /**
   * Validate a portal token and return the payload.
   */
  validateToken(token: string): PortalTokenPayload {
    const payload = tokenStore.get(token);
    if (!payload) {
      throw new UnauthorizedException('Invalid or expired portal token');
    }
    if (Date.now() > payload.expires_at) {
      tokenStore.delete(token);
      throw new UnauthorizedException('Portal token has expired');
    }
    return payload;
  }

  /**
   * Get service requests for the authenticated customer.
   */
  async getServiceRequests(token: string) {
    const { contact_id, tenant_id } = this.validateToken(token);

    const requests = await this.serviceRequestRepository.findAll({
      where: {
        contact_id,
        tenant_id,
        is_deleted: false,
      },
      attributes: [
        'id',
        'request_number',
        'subject',
        'description',
        'status',
        'priority',
        'category',
        'channel',
        'created_at',
        'updated_at',
      ],
      include: [
        {
          model: ServiceLocation,
          attributes: ['id', 'address'],
        },
      ],
      order: [['created_at', 'DESC']],
    });

    return requests;
  }

  /**
   * Track a specific service request by ID.
   */
  async trackServiceRequest(token: string, requestId: string) {
    const { contact_id, tenant_id } = this.validateToken(token);

    const request = await this.serviceRequestRepository.findOne({
      where: {
        id: requestId,
        contact_id,
        tenant_id,
        is_deleted: false,
      },
      attributes: [
        'id',
        'request_number',
        'subject',
        'description',
        'status',
        'priority',
        'category',
        'channel',
        'created_at',
        'updated_at',
      ],
      include: [
        {
          model: ServiceLocation,
          attributes: ['id', 'address'],
        },
      ],
    });

    if (!request) {
      throw new NotFoundException('Service request not found');
    }

    // Also find related work orders
    const workOrders = await this.workOrderRepository.findAll({
      where: {
        request_id: requestId,
        tenant_id,
        is_deleted: false,
      },
      attributes: [
        'id',
        'wo_number',
        'status',
        'summary',
        'scheduled_start',
        'scheduled_end',
        'actual_start',
        'actual_end',
        'created_at',
      ],
      order: [['created_at', 'DESC']],
    });

    return {
      service_request: request,
      work_orders: workOrders,
    };
  }

  /**
   * Get payment history for the authenticated customer.
   */
  async getPaymentHistory(token: string) {
    const { contact_id, tenant_id } = this.validateToken(token);

    // Get invoices for this contact
    const invoices = await this.invoiceRepository.findAll({
      where: {
        contact_id,
        tenant_id,
        is_deleted: false,
      },
      attributes: [
        'id',
        'invoice_number',
        'status',
        'subtotal',
        'tax',
        'discount',
        'total',
        'paid_amount',
        'due_date',
        'currency',
        'created_at',
      ],
      order: [['created_at', 'DESC']],
    });

    const invoiceIds = invoices.map((inv) => inv.id);

    // Get payments for those invoices
    const payments = await this.paymentRepository.findAll({
      where: {
        invoice_id: { [Op.in]: invoiceIds },
        tenant_id,
        is_deleted: false,
      },
      attributes: [
        'id',
        'invoice_id',
        'amount',
        'method',
        'status',
        'paid_at',
        'created_at',
      ],
      order: [['created_at', 'DESC']],
    });

    return {
      invoices,
      payments,
    };
  }

  /**
   * Get service history (completed work orders) for the authenticated customer.
   */
  async getServiceHistory(token: string) {
    const { contact_id, tenant_id } = this.validateToken(token);

    const workOrders = await this.workOrderRepository.findAll({
      where: {
        contact_id,
        tenant_id,
        is_deleted: false,
      },
      attributes: [
        'id',
        'wo_number',
        'status',
        'priority',
        'category',
        'summary',
        'description',
        'scheduled_start',
        'scheduled_end',
        'actual_start',
        'actual_end',
        'created_at',
        'updated_at',
      ],
      include: [
        {
          model: ServiceLocation,
          attributes: ['id', 'address'],
        },
      ],
      order: [['created_at', 'DESC']],
    });

    return workOrders;
  }

  /**
   * Get full work order details by wo_number (public — no auth needed).
   */
  async getWorkOrderByNumber(woNumber: string) {
    // Only include id in search if the input looks like a valid UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const whereClause: Record<string, unknown> = { is_deleted: false };
    if (uuidRegex.test(woNumber)) {
      whereClause[Op.or as unknown as string] = [{ wo_number: woNumber }, { id: woNumber }];
    } else {
      whereClause.wo_number = woNumber;
    }

    const workOrder = await this.workOrderRepository.findOne({
      where: whereClause,
      include: [
        {
          model: Contact,
          attributes: ['id', 'first_name', 'last_name', 'email', 'phone'],
        },
        {
          model: ServiceLocation,
          attributes: ['id', 'address', 'lat', 'lng'],
        },
      ],
    });

    if (!workOrder) {
      throw new NotFoundException('Work order not found. Please check your Work Order ID.');
    }

    // Fetch service appointments for this work order
    const appointments = await this.serviceAppointmentRepository.findAll({
      where: {
        work_order_id: workOrder.id,
        tenant_id: workOrder.tenant_id,
        is_deleted: false,
      },
      attributes: [
        'id',
        'agent_id',
        'status',
        'scheduled_start',
        'scheduled_end',
        'actual_start',
        'actual_end',
        'notes',
        'created_at',
      ],
      order: [['created_at', 'DESC']],
    });

    // Fetch technician names for appointments
    const agentIds = [...new Set(appointments.map((a) => a.agent_id).filter(Boolean))];
    let agents: Record<string, { first_name: string; last_name: string }> = {};
    if (agentIds.length > 0) {
      const users = await User.findAll({
        where: { id: { [Op.in]: agentIds } },
        attributes: ['id', 'first_name', 'last_name'],
      });
      agents = Object.fromEntries(users.map((u) => [u.id, { first_name: u.first_name, last_name: u.last_name }]));
    }

    // Fetch linked service request info
    let serviceRequest = null;
    if (workOrder.request_id) {
      serviceRequest = await this.serviceRequestRepository.findOne({
        where: { id: workOrder.request_id, is_deleted: false },
        attributes: ['id', 'request_number', 'subject', 'status'],
      });
    }

    // Fetch line items
    const lineItems = await this.lineItemRepository.findAll({
      where: {
        work_order_id: workOrder.id,
        is_deleted: false,
      },
      attributes: [
        'id', 'type', 'name', 'description', 'quantity',
        'unit_price', 'tax_rate', 'discount', 'total', 'sort_order',
      ],
      order: [['sort_order', 'ASC'], ['created_at', 'ASC']],
    });

    // Fetch customer-visible notes only (is_internal = false)
    const notes = await this.noteRepository.findAll({
      where: {
        work_order_id: workOrder.id,
        is_deleted: false,
        is_internal: false,
      },
      attributes: ['id', 'content', 'created_at'],
      order: [['created_at', 'DESC']],
    });

    // Resolve note author names
    const noteUserIds = [...new Set(
      (await this.noteRepository.findAll({
        where: { work_order_id: workOrder.id, is_deleted: false, is_internal: false },
        attributes: ['id', 'user_id'],
      })).map((n) => n.user_id).filter(Boolean),
    )];
    let noteAuthors: Record<string, string> = {};
    if (noteUserIds.length > 0) {
      const noteUsers = await User.findAll({
        where: { id: { [Op.in]: noteUserIds } },
        attributes: ['id', 'first_name', 'last_name'],
      });
      noteAuthors = Object.fromEntries(
        noteUsers.map((u) => [u.id, `${u.first_name} ${u.last_name}`]),
      );
    }

    // Fetch raw notes again with user_id for author mapping
    const notesWithUser = await this.noteRepository.findAll({
      where: {
        work_order_id: workOrder.id,
        is_deleted: false,
        is_internal: false,
      },
      attributes: ['id', 'user_id', 'content', 'created_at'],
      order: [['created_at', 'DESC']],
    });

    // Fetch attachments
    const attachments = await this.attachmentRepository.findAll({
      where: {
        work_order_id: workOrder.id,
        is_deleted: false,
      },
      attributes: [
        'id', 'file_url', 'file_name', 'file_type', 'file_size',
        'photo_type', 'created_at',
      ],
      order: [['created_at', 'DESC']],
    });

    // Fetch technician session (field progress)
    const techSession = await this.techSessionRepository.findOne({
      where: {
        work_order_id: workOrder.id,
        is_deleted: false,
      },
      attributes: [
        'id', 'step', 'created_at', 'approved_at', 'rejected_at',
        'rejection_reason', 'trip_started_at', 'reached_at',
        'items_confirmed_at', 'call_confirmed_at', 'work_started_at',
        'paused_at', 'resumed_at', 'before_photos_at', 'after_photos_at',
        'customer_rating', 'customer_feedback', 'finished_at',
      ],
    });

    // Fetch existing review if any
    const existingReview = await this.reviewRepository.findOne({
      where: {
        work_order_id: workOrder.id,
        is_deleted: false,
      },
      attributes: ['id', 'rating', 'comment', 'created_at'],
    });

    return {
      work_order: {
        id: workOrder.id,
        wo_number: workOrder.wo_number,
        status: workOrder.status,
        priority: workOrder.priority,
        category: workOrder.category,
        summary: workOrder.summary,
        description: workOrder.description,
        scheduled_start: workOrder.scheduled_start,
        scheduled_end: workOrder.scheduled_end,
        actual_start: workOrder.actual_start,
        actual_end: workOrder.actual_end,
        tags: workOrder.tags,
        contact: workOrder.contact,
        location: workOrder.location,
        created_at: workOrder.created_at,
        updated_at: workOrder.updated_at,
      },
      service_request: serviceRequest,
      appointments: appointments.map((a) => ({
        id: a.id,
        status: a.status,
        technician: agents[a.agent_id]
          ? `${agents[a.agent_id].first_name} ${agents[a.agent_id].last_name}`
          : null,
        scheduled_start: a.scheduled_start,
        scheduled_end: a.scheduled_end,
        actual_start: a.actual_start,
        actual_end: a.actual_end,
        notes: a.notes,
        created_at: a.created_at,
      })),
      line_items: lineItems.map((li) => ({
        id: li.id,
        type: li.type,
        name: li.name,
        description: li.description,
        quantity: Number(li.quantity),
        unit_price: Number(li.unit_price),
        tax_rate: Number(li.tax_rate),
        discount: Number(li.discount),
        total: Number(li.total),
      })),
      notes: notesWithUser.map((n) => ({
        id: n.id,
        content: n.content,
        author: noteAuthors[n.user_id] || 'System',
        created_at: n.created_at,
      })),
      attachments: attachments.map((att) => ({
        id: att.id,
        file_url: att.file_url,
        file_name: att.file_name,
        file_type: att.file_type,
        file_size: att.file_size,
        photo_type: att.photo_type,
        created_at: att.created_at,
      })),
      technician_session: techSession ? {
        step: techSession.step,
        created_at: techSession.created_at,
        approved_at: techSession.approved_at,
        rejected_at: techSession.rejected_at,
        rejection_reason: techSession.rejection_reason,
        trip_started_at: techSession.trip_started_at,
        reached_at: techSession.reached_at,
        items_confirmed_at: techSession.items_confirmed_at,
        call_confirmed_at: techSession.call_confirmed_at,
        work_started_at: techSession.work_started_at,
        paused_at: techSession.paused_at,
        resumed_at: techSession.resumed_at,
        before_photos_at: techSession.before_photos_at,
        after_photos_at: techSession.after_photos_at,
        customer_rating: techSession.customer_rating,
        customer_feedback: techSession.customer_feedback,
        finished_at: techSession.finished_at,
      } : null,
      review: existingReview ? {
        id: existingReview.id,
        rating: existingReview.rating,
        comment: existingReview.comment,
        created_at: existingReview.created_at,
      } : null,
    };
  }

  /**
   * Submit customer feedback/review for a work order (public).
   */
  async submitFeedback(woNumber: string, dto: { rating: number; comment?: string; contact_email?: string }) {
    // Look up work order
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const whereClause: Record<string, unknown> = { is_deleted: false };
    if (uuidRegex.test(woNumber)) {
      whereClause[Op.or as unknown as string] = [{ wo_number: woNumber }, { id: woNumber }];
    } else {
      whereClause.wo_number = woNumber;
    }

    const workOrder = await this.workOrderRepository.findOne({ where: whereClause });
    if (!workOrder) {
      throw new NotFoundException('Work order not found.');
    }

    // Check if review already exists
    const existing = await this.reviewRepository.findOne({
      where: { work_order_id: workOrder.id, is_deleted: false },
    });
    if (existing) {
      throw new BadRequestException('Feedback has already been submitted for this work order.');
    }

    // Validate rating
    if (!dto.rating || dto.rating < 1 || dto.rating > 5) {
      throw new BadRequestException('Rating must be between 1 and 5.');
    }

    // Create review
    const review = await this.reviewRepository.create({
      tenant_id: workOrder.tenant_id,
      work_order_id: workOrder.id,
      contact_id: workOrder.contact_id || null,
      rating: dto.rating,
      comment: dto.comment || null,
      platform: 'internal',
    });

    // Update technician session step to "finished" so the progress bar reaches 100%
    const techSession = await this.techSessionRepository.findOne({
      where: { work_order_id: workOrder.id, is_deleted: false },
    });
    if (techSession && techSession.step !== 'finished') {
      await techSession.update({
        step: 'finished',
        finished_at: new Date(),
      });
    }

    return {
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      new_wo_status: workOrder.status,
      created_at: review.created_at,
    };
  }

  /**
   * Track a service request by its request_number (public — no auth needed).
   */
  async trackByRequestNumber(requestNumber: string) {
    const request = await this.serviceRequestRepository.findOne({
      where: {
        request_number: requestNumber,
        is_deleted: false,
      },
      attributes: [
        'id',
        'tenant_id',
        'request_number',
        'subject',
        'description',
        'status',
        'priority',
        'category',
        'channel',
        'lat',
        'lng',
        'created_at',
        'updated_at',
      ],
      include: [
        {
          model: Contact,
          attributes: ['id', 'first_name', 'last_name', 'email', 'phone'],
        },
        {
          model: ServiceLocation,
          attributes: ['id', 'address'],
        },
      ],
    });

    if (!request) {
      throw new NotFoundException('Service request not found. Please check your Request ID.');
    }

    // Find related work orders
    const workOrders = await this.workOrderRepository.findAll({
      where: {
        request_id: request.id,
        tenant_id: request.tenant_id,
        is_deleted: false,
      },
      attributes: [
        'id',
        'wo_number',
        'status',
        'summary',
        'scheduled_start',
        'scheduled_end',
        'actual_start',
        'actual_end',
        'created_at',
      ],
      order: [['created_at', 'DESC']],
    });

    return {
      service_request: request,
      work_orders: workOrders,
    };
  }

  /**
   * Create a guest service request from the public portal.
   * - Finds or creates the contact by email
   * - Resolves tenant_id from the nearest service location
   * - Creates the service request
   */
  async createGuestServiceRequest(dto: PortalCreateServiceRequestDto) {
    // 1. Resolve tenant_id — find closest service location to get tenant
    let tenantId: string | null = null;
    let locationId: string | null = dto.location_id || null;

    if (dto.location_id) {
      const location = await this.serviceLocationRepository.findOne({
        where: { id: dto.location_id, is_deleted: false },
      });
      if (location) {
        tenantId = location.tenant_id;
        locationId = location.id;
      }
    }

    // Fallback: find the nearest service location by lat/lng
    if (!tenantId) {
      const allLocations = await this.serviceLocationRepository.findAll({
        where: { is_deleted: false },
        attributes: ['id', 'lat', 'lng', 'tenant_id'],
      });

      if (allLocations.length === 0) {
        throw new BadRequestException('No service locations are configured');
      }

      // Find closest location
      let minDist = Infinity;
      for (const loc of allLocations) {
        if (!loc.lat || !loc.lng) continue;
        const dist = Math.pow(Number(loc.lat) - dto.lat, 2) + Math.pow(Number(loc.lng) - dto.lng, 2);
        if (dist < minDist) {
          minDist = dist;
          tenantId = loc.tenant_id;
          if (!locationId) locationId = loc.id;
        }
      }

      if (!tenantId) {
        tenantId = allLocations[0].tenant_id;
      }
    }

    // 2. Find or create the contact by email
    const nameParts = dto.contact_name.trim().split(/\s+/);
    const firstName = nameParts[0];
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

    let contact = await this.contactRepository.findOne({
      where: {
        email: dto.contact_email,
        tenant_id: tenantId,
        is_deleted: false,
      },
    });

    if (!contact) {
      contact = await this.contactRepository.create({
        tenant_id: tenantId,
        first_name: firstName,
        last_name: lastName || firstName,
        email: dto.contact_email,
        phone: dto.contact_phone,
        address: dto.address || null,
      });
    } else {
      // Update phone/address if the existing contact doesn't have them
      const updates: Record<string, unknown> = {};
      if (!contact.phone && dto.contact_phone) updates.phone = dto.contact_phone;
      if (!contact.address && dto.address) updates.address = dto.address;
      if (Object.keys(updates).length > 0) {
        await contact.update(updates);
      }
    }

    // 3. Auto-generate request_number: SR-YYYYMMDD-001 (resets daily)
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
    const requestNumber = `SR-${dateStr}-${String(todayCount + 1).padStart(3, '0')}`;

    // 4. Create the service request
    const serviceRequest = await this.serviceRequestRepository.create({
      tenant_id: tenantId,
      request_number: requestNumber,
      contact_id: contact.id,
      location_id: locationId,
      subject: dto.subject,
      description: dto.description || null,
      category: dto.category,
      priority: dto.priority || 'medium',
      status: 'new',
      channel: 'portal',
      lat: dto.lat,
      lng: dto.lng,
      custom_fields: dto.custom_fields || {},
    });

    return {
      id: serviceRequest.id,
      request_number: serviceRequest.request_number,
      subject: serviceRequest.subject,
      status: serviceRequest.status,
      contact_id: contact.id,
      created_at: serviceRequest.created_at,
    };
  }

  /**
   * Make a payment on an invoice.
   */
  async makePayment(dto: PortalMakePaymentDto) {
    const { contact_id, tenant_id } = this.validateToken(dto.token);

    // Verify invoice belongs to this contact
    const invoice = await this.invoiceRepository.findOne({
      where: {
        id: dto.invoice_id,
        contact_id,
        tenant_id,
        is_deleted: false,
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    // Validate invoice is payable
    const payableStatuses = ['sent', 'viewed', 'partially_paid', 'overdue'];
    if (!payableStatuses.includes(invoice.status)) {
      throw new BadRequestException(
        `Invoice with status '${invoice.status}' cannot accept payments`,
      );
    }

    // Validate amount doesn't exceed remaining balance
    const remainingBalance =
      Number(invoice.total) - Number(invoice.paid_amount);
    if (dto.amount > remainingBalance) {
      throw new BadRequestException(
        `Payment amount (${dto.amount}) exceeds remaining balance (${remainingBalance.toFixed(2)})`,
      );
    }

    // Create payment record
    const payment = await this.paymentRepository.create({
      tenant_id,
      invoice_id: dto.invoice_id,
      amount: dto.amount,
      method: dto.method,
      gateway_transaction_id: dto.gateway_transaction_id || null,
      status: 'completed',
      paid_at: new Date(),
      notes: dto.notes || null,
    });

    // Update invoice paid_amount and status
    const newPaidAmount = Number(invoice.paid_amount) + dto.amount;
    const updateData: Record<string, unknown> = {
      paid_amount: newPaidAmount,
    };

    if (newPaidAmount >= Number(invoice.total)) {
      updateData.status = 'paid';
    } else if (newPaidAmount > 0) {
      updateData.status = 'partially_paid';
    }

    await invoice.update(updateData);

    return {
      payment_id: payment.id,
      amount: dto.amount,
      invoice_id: dto.invoice_id,
      new_paid_amount: newPaidAmount,
      remaining_balance: Number(invoice.total) - newPaidAmount,
      invoice_status: updateData.status || invoice.status,
    };
  }
}
