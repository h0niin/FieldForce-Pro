import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  Optional,
} from '@nestjs/common';
import { Payment } from './payments.entity';
import { CreatePaymentDto } from './dto/payments_create.dto';
import { UpdatePaymentDto } from './dto/payments_update.dto';
import { PageOptionsDto } from '../shared/dto/page-options.dto';
import { PageDto } from '../shared/dto/page.dto';
import { PageMetaDto } from '../shared/dto/page-meta.dto';
import { KEYNAMES } from '../shared/constants/keynames';
import { Op } from 'sequelize';
import { Invoice } from '../INVOICES/invoices.entity';
import { InvoicesService } from '../INVOICES/invoices.service';
import { Contact } from '../CONTACTS/contacts.entity';
import { NotificationsService } from '../NOTIFICATIONS/notifications.service';

@Injectable()
export class PaymentsService {
  constructor(
    @Inject(KEYNAMES.PAYMENTS)
    private readonly paymentRepository: typeof Payment,
    private readonly invoicesService: InvoicesService,
    @Optional() private readonly notificationsService: NotificationsService,
  ) { }

  async findAllPaginated(
    tenantId: string,
    pageOptionsDto: PageOptionsDto,
  ): Promise<PageDto<Payment>> {
    const where: Record<string, unknown> = {
      tenant_id: tenantId,
      is_deleted: false,
    };

    if (pageOptionsDto.search) {
      where[Op.or as unknown as string] = [
        { gateway_transaction_id: { [Op.iLike]: `%${pageOptionsDto.search}%` } },
        { notes: { [Op.iLike]: `%${pageOptionsDto.search}%` } },
      ];
    }

    const { count, rows } = await this.paymentRepository.findAndCountAll({
      where,
      include: [
        {
          model: Invoice,
          attributes: ['id', 'invoice_number', 'contact_id'],
          include: [
            {
              model: Contact,
              attributes: ['id', 'first_name', 'last_name'],
            },
          ],
        },
      ],
      order: [['created_at', pageOptionsDto.order]],
      limit: pageOptionsDto.take,
      offset: pageOptionsDto.skip,
    });

    const meta = new PageMetaDto({ pageOptionsDto, itemCount: count });
    return new PageDto(rows, meta);
  }

  async findAll(tenantId: string): Promise<Payment[]> {
    return this.paymentRepository.findAll({
      where: { tenant_id: tenantId, is_deleted: false },
      include: [
        {
          model: Invoice,
          attributes: ['id', 'invoice_number', 'contact_id'],
        },
      ],
      order: [['created_at', 'DESC']],
    });
  }

  async findById(id: string, tenantId: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id, tenant_id: tenantId, is_deleted: false },
    });
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }
    return payment;
  }

  async findByInvoiceId(invoiceId: string, tenantId: string): Promise<Payment[]> {
    return this.paymentRepository.findAll({
      where: {
        invoice_id: invoiceId,
        tenant_id: tenantId,
        is_deleted: false,
      },
      order: [['created_at', 'ASC']],
    });
  }

  async create(tenantId: string, dto: CreatePaymentDto & { received_by?: string; source?: string }): Promise<Payment> {
    const payment = await this.paymentRepository.create({
      tenant_id: tenantId,
      status: 'confirmed',
      source: dto.source || 'manual',
      received_by: dto.received_by,
      ...dto,
    });

    // Recalculate invoice balance from all confirmed payments
    if (dto.invoice_id) {
      await this.invoicesService.recalculatePaidAmount(dto.invoice_id, tenantId);
    }

    return payment;
  }

  async getPendingVerification(tenantId: string): Promise<Payment[]> {
    return this.paymentRepository.findAll({
      where: { tenant_id: tenantId, status: 'pending_verification', is_deleted: false },
      include: [
        {
          model: Invoice,
          attributes: ['id', 'invoice_number', 'total', 'contact_id'],
          include: [{ model: Contact, attributes: ['id', 'first_name', 'last_name'] }],
        },
      ],
      order: [['created_at', 'ASC']],
    });
  }

  async createFromPortal(invoicePublicToken: string, dto: {
    amount: number;
    method: string;
    reference?: string;
    notes?: string;
    screenshot_url?: string;
  }): Promise<Payment> {
    const invoice = await this.invoicesService.getByPublicToken(invoicePublicToken);

    const payment = await this.paymentRepository.create({
      tenant_id: invoice.tenant_id,
      invoice_id: invoice.id,
      amount: dto.amount,
      method: dto.method,
      gateway_transaction_id: dto.reference,
      notes: dto.notes,
      screenshot_url: dto.screenshot_url,
      source: 'portal',
      status: 'pending_verification',
      paid_at: new Date(),
    } as any);

    // Notify all admins/dispatchers in this tenant
    if (this.notificationsService) {
      const customerName = invoice.contact
        ? `${(invoice.contact as any).first_name} ${(invoice.contact as any).last_name}`
        : 'Customer';
      await this.notifyTenantUsers(
        invoice.tenant_id,
        `New payment of ${dto.amount} submitted by ${customerName} for Invoice ${invoice.invoice_number || invoice.id} — pending your verification`,
        'payment_pending_verification',
        { payment_id: payment.id, invoice_id: invoice.id },
      );
    }

    return payment;
  }

  async confirmPayment(id: string, tenantId: string): Promise<Payment> {
    const payment = await this.findById(id, tenantId);
    if (payment.status !== 'pending_verification') {
      throw new BadRequestException('Payment is not pending verification');
    }
    await payment.update({ status: 'confirmed' });
    await this.invoicesService.recalculatePaidAmount(payment.invoice_id, tenantId);

    // Notify customer via portal notification (best-effort)
    return payment;
  }

  async rejectPayment(id: string, tenantId: string, reason: string): Promise<Payment> {
    const payment = await this.findById(id, tenantId);
    if (payment.status !== 'pending_verification') {
      throw new BadRequestException('Payment is not pending verification');
    }
    await payment.update({ status: 'rejected', rejection_reason: reason });
    return payment;
  }

  private async notifyTenantUsers(tenantId: string, message: string, type: string, data: any): Promise<void> {
    if (!this.notificationsService) return;
    try {
      const { User } = await import('../USERS/users.entity');
      const admins = await User.findAll({
        where: { tenant_id: tenantId, is_deleted: false, is_active: true },
        attributes: ['id'],
      });
      for (const admin of admins) {
        await this.notificationsService.create(tenantId, {
          user_id: admin.id,
          type,
          title: 'Payment Pending Verification',
          body: message,
          data,
          channel: 'in_app',
        });
      }
    } catch (e) {
      // Best-effort
    }
  }

  async update(
    id: string,
    tenantId: string,
    dto: UpdatePaymentDto,
  ): Promise<Payment> {
    const payment = await this.findById(id, tenantId);
    await payment.update(dto);
    return payment;
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const payment = await this.findById(id, tenantId);
    await payment.update({ is_deleted: true });
  }
}
