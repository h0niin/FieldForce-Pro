import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  GoneException,
  Logger,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Invoice } from './invoices.entity';
import { CreateInvoiceDto } from './dto/invoices_create.dto';
import { UpdateInvoiceDto } from './dto/invoices_update.dto';
import { PageOptionsDto } from '../shared/dto/page-options.dto';
import { InvoiceQueryDto } from './dto/invoices_query.dto';
import { PageDto } from '../shared/dto/page.dto';
import { PageMetaDto } from '../shared/dto/page-meta.dto';
import { KEYNAMES } from '../shared/constants/keynames';
import { Op } from 'sequelize';
import { Contact } from '../CONTACTS/contacts.entity';
import { DocumentApprovalsService } from '../WORKFLOW/WORKFLOW_DOCUMENT_APPROVALS/document_approvals.service';
import { DocumentTypeEnum } from '../shared/enums/workflow.enum';
import { ActivityLogsService } from '../ACTIVITY_LOGS/activity_logs.service';

const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  draft: ['pending_approval', 'sent', 'void'],
  pending_approval: ['approved', 'rejected', 'draft'],
  approved: ['sent', 'partially_paid', 'paid', 'void'],
  rejected: ['draft', 'void'],
  sent: ['viewed', 'partially_paid', 'paid', 'overdue', 'void'],
  viewed: ['partially_paid', 'paid', 'overdue', 'void'],
  partially_paid: ['paid'],
  paid: [],
  overdue: ['partially_paid', 'paid'],
  void: [],
};

@Injectable()
export class InvoicesService {
  private readonly logger = new Logger(InvoicesService.name);

  constructor(
    @Inject(KEYNAMES.INVOICES)
    private readonly invoiceRepository: typeof Invoice,
    private readonly documentApprovalsService: DocumentApprovalsService,
    private readonly activityLogsService: ActivityLogsService,
  ) { }

  async findAllPaginated(
    tenantId: string,
    pageOptionsDto: InvoiceQueryDto,
  ): Promise<PageDto<Invoice>> {
    const where: Record<string, unknown> = {
      tenant_id: tenantId,
      is_deleted: false,
    };

    if (pageOptionsDto.company_id) {
      where.company_id = pageOptionsDto.company_id;
    }
    if (pageOptionsDto.contact_id) {
      where.contact_id = pageOptionsDto.contact_id;
    }

    if (pageOptionsDto.search) {
      where[Op.or as unknown as string] = [
        { invoice_number: { [Op.iLike]: `%${pageOptionsDto.search}%` } },
        { notes: { [Op.iLike]: `%${pageOptionsDto.search}%` } },
      ];
    }

    const { count, rows } = await this.invoiceRepository.findAndCountAll({
      where,
      include: [
        {
          model: Contact,
          attributes: ['id', 'first_name', 'last_name'],
        },
      ],
      order: [['created_at', pageOptionsDto.order]],
      limit: pageOptionsDto.take,
      offset: pageOptionsDto.skip,
    });

    const meta = new PageMetaDto({ pageOptionsDto, itemCount: count });
    return new PageDto(rows, meta);
  }

  async findAll(tenantId: string): Promise<Invoice[]> {
    return this.invoiceRepository.findAll({
      where: { tenant_id: tenantId, is_deleted: false },
      include: [
        {
          model: Contact,
          attributes: ['id', 'first_name', 'last_name'],
        },
      ],
      order: [['created_at', 'DESC']],
    });
  }

  async findByWorkOrderId(workOrderId: string, tenantId: string): Promise<Invoice[]> {
    return this.invoiceRepository.findAll({
      where: {
        work_order_id: workOrderId,
        tenant_id: tenantId,
        is_deleted: false,
      },
      order: [['created_at', 'DESC']],
    });
  }

  async findById(id: string, tenantId: string): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findOne({
      where: { id, tenant_id: tenantId, is_deleted: false },
    });
    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }
    return invoice;
  }

  async create(tenantId: string, dto: CreateInvoiceDto): Promise<Invoice> {
    if (!dto.invoice_number) {
      dto.invoice_number = await this.generateInvoiceNumber(tenantId);
    }

    const invoice = await this.invoiceRepository.create({
      tenant_id: tenantId,
      ...dto,
    });

    if (invoice.contact_id) {
      this.activityLogsService.logActivity(tenantId, 'Contact', invoice.contact_id, 'CREATED', `Invoice #${invoice.invoice_number} was generated.`).catch(err => this.logger.warn(err.message));
    }
    if (invoice.company_id) {
      this.activityLogsService.logActivity(tenantId, 'Company', invoice.company_id, 'CREATED', `Invoice #${invoice.invoice_number} was generated for this company.`).catch(err => this.logger.warn(err.message));
    }

    return invoice;
  }

  async update(
    id: string,
    tenantId: string,
    dto: UpdateInvoiceDto,
  ): Promise<Invoice> {
    const invoice = await this.findById(id, tenantId);
    await invoice.update(dto);

    if (invoice.contact_id) {
      this.activityLogsService.logActivity(tenantId, 'Contact', invoice.contact_id, 'UPDATED', `Invoice #${invoice.invoice_number} was updated.`).catch(err => this.logger.warn(err.message));
    }
    if (invoice.company_id) {
      this.activityLogsService.logActivity(tenantId, 'Company', invoice.company_id, 'UPDATED', `Invoice #${invoice.invoice_number} was updated.`).catch(err => this.logger.warn(err.message));
    }

    return invoice;
  }

  /** Persist a customer's digital signature captured on the technician's device. */
  async recordSignature(
    id: string,
    tenantId: string,
    signatureUrl: string,
    signedByName?: string,
  ): Promise<Invoice> {
    const invoice = await this.findById(id, tenantId);
    await invoice.update({
      signature_url: signatureUrl,
      signed_by_name: signedByName || null,
      signed_at: new Date(),
    });
    return invoice;
  }

  /**
   * Submit a draft invoice into the tenant's multi-step approval chain (Step 8).
   * Creates DocumentApproval steps from the active INVOICE workflow template and
   * marks the invoice pending_approval. The chain advances via the workflow
   * engine, which flips the invoice to approved/rejected on completion.
   */
  async submitForApproval(
    id: string,
    tenantId: string,
    submittedBy?: string,
  ): Promise<Invoice> {
    const invoice = await this.findById(id, tenantId);
    if (invoice.status !== 'draft') {
      throw new BadRequestException('Only draft invoices can be submitted for approval');
    }

    await this.documentApprovalsService.submitByDocumentType(tenantId, {
      document_id: invoice.id,
      document_type: DocumentTypeEnum.INVOICE,
      amount: Number(invoice.total) || 0,
    });

    await invoice.update({
      status: 'pending_approval',
      custom_fields: { ...(invoice.custom_fields || {}), submitted_by: submittedBy || null },
    });
    return invoice;
  }

  async updateStatus(
    id: string,
    tenantId: string,
    newStatus: string,
  ): Promise<Invoice> {
    const invoice = await this.findById(id, tenantId);
    const currentStatus = invoice.status;

    const allowedTransitions = VALID_STATUS_TRANSITIONS[currentStatus];
    if (!allowedTransitions) {
      throw new BadRequestException(
        `No transitions allowed from status '${currentStatus}'`,
      );
    }

    if (!allowedTransitions.includes(newStatus)) {
      throw new BadRequestException(
        `Invalid status transition from '${currentStatus}' to '${newStatus}'. Allowed transitions: ${allowedTransitions.join(', ')}`,
      );
    }

    await invoice.update({ status: newStatus });
    return invoice;
  }

  async recordPayment(
    id: string,
    tenantId: string,
    amount: number,
  ): Promise<Invoice> {
    const invoice = await this.findById(id, tenantId);

    const newPaidAmount = Number(invoice.paid_amount) + Number(amount);
    let newStatus = invoice.status;

    if (newPaidAmount >= Number(invoice.total)) {
      newStatus = 'paid';
    } else if (newPaidAmount > 0) {
      newStatus = 'partially_paid';
    }

    await invoice.update({
      paid_amount: newPaidAmount,
      status: newStatus,
    });

    return invoice;
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const invoice = await this.findById(id, tenantId);

    if (invoice.contact_id) {
      this.activityLogsService.logActivity(tenantId, 'Contact', invoice.contact_id, 'DELETED', `Invoice #${invoice.invoice_number} was deleted.`).catch(err => this.logger.warn(err.message));
    }
    if (invoice.company_id) {
      this.activityLogsService.logActivity(tenantId, 'Company', invoice.company_id, 'DELETED', `Invoice #${invoice.invoice_number} was deleted.`).catch(err => this.logger.warn(err.message));
    }

    await invoice.update({ is_deleted: true });
  }

  async recalculatePaidAmount(invoiceId: string, tenantId: string): Promise<void> {
    const invoice = await this.findById(invoiceId, tenantId);
    // Sum only confirmed payments
    const { Payment } = await import('../PAYMENTS/payments.entity');
    const result = await Payment.sum('amount', {
      where: { invoice_id: invoiceId, tenant_id: tenantId, status: 'confirmed', is_deleted: false },
    });
    const paidAmount = Number(result) || 0;
    let newStatus = invoice.status;
    if (paidAmount >= Number(invoice.total)) newStatus = 'paid';
    else if (paidAmount > 0) newStatus = 'partially_paid';
    else if (['paid', 'partially_paid'].includes(invoice.status)) newStatus = 'sent';
    await invoice.update({ paid_amount: paidAmount, status: newStatus });
  }

  async generatePublicToken(id: string, tenantId: string): Promise<Invoice> {
    const invoice = await this.findById(id, tenantId);
    const token = randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    await invoice.update({ public_token: token, public_token_expires_at: expiresAt });
    return invoice;
  }

  async getByPublicToken(token: string): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findOne({
      where: { public_token: token, is_deleted: false },
      include: [{ model: Contact, attributes: ['id', 'first_name', 'last_name', 'email', 'phone'] }],
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    if (invoice.public_token_expires_at && new Date(invoice.public_token_expires_at) < new Date()) {
      throw new GoneException('This invoice link has expired');
    }
    return invoice;
  }

  private async generateInvoiceNumber(tenantId: string): Promise<string> {
    const lastInvoice = await this.invoiceRepository.findOne({
      where: { tenant_id: tenantId },
      order: [['created_at', 'DESC']],
      attributes: ['invoice_number'],
    });

    let nextNumber = 1;
    if (lastInvoice?.invoice_number) {
      const match = lastInvoice.invoice_number.match(/INV-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }

    return `INV-${nextNumber.toString().padStart(6, '0')}`;
  }
}
