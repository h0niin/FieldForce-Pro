import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { Invoice } from './invoices.entity';
import { InvoiceLineItem } from '../INVOICE_LINE_ITEMS/invoice_line_items.entity';
import { WorkOrder } from '../WORK_ORDERS/work_orders.entity';
import { WorkOrderLineItem } from '../WORK_ORDER_LINE_ITEMS/work_order_line_items.entity';
import { Estimate } from '../ESTIMATES/estimates.entity';
import { EstimateLineItem } from '../ESTIMATE_LINE_ITEMS/estimate_line_items.entity';
import { KEYNAMES } from '../shared/constants/keynames';

@Injectable()
export class AutoInvoiceService {
  constructor(
    @Inject(KEYNAMES.INVOICES)
    private readonly invoiceRepository: typeof Invoice,
    @Inject(KEYNAMES.INVOICE_LINE_ITEMS)
    private readonly invoiceLineItemRepository: typeof InvoiceLineItem,
    @Inject(KEYNAMES.WORK_ORDERS)
    private readonly workOrderRepository: typeof WorkOrder,
    @Inject(KEYNAMES.WORK_ORDER_LINE_ITEMS)
    private readonly workOrderLineItemRepository: typeof WorkOrderLineItem,
  ) { }

  /**
   * Create an invoice from a work order.
   * Uses WO line items first; falls back to estimate line items if WO has none.
   * Returns existing invoice if one already exists for this work order.
   */
  async createInvoiceFromWorkOrder(
    workOrderId: string,
    tenantId: string,
  ): Promise<Invoice> {
    const workOrder = await this.workOrderRepository.findOne({
      where: { id: workOrderId, tenant_id: tenantId, is_deleted: false },
    });

    if (!workOrder) {
      throw new NotFoundException('Work order not found');
    }

    if (workOrder.status === 'cancelled') {
      throw new BadRequestException('Cancelled work orders cannot be invoiced');
    }

    // Return existing invoice if one already exists
    const existingInvoice = await this.invoiceRepository.findOne({
      where: { work_order_id: workOrderId, tenant_id: tenantId, is_deleted: false },
    });

    if (existingInvoice) {
      return existingInvoice;
    }

    // Try WO line items first
    const woLineItems = await this.workOrderLineItemRepository.findAll({
      where: { work_order_id: workOrderId, is_deleted: false },
    });

    let lineItems: Array<{
      type: string;
      name: string;
      description: string | null;
      quantity: number;
      unit_price: number;
      tax_rate: number;
      discount_type: string;
      discount: number;
      total: number;
    }> = [];

    if (woLineItems.length > 0) {
      lineItems = woLineItems.map((item: any) => ({
        type: item.type || 'service',
        name: item.name,
        description: item.description || null,
        quantity: Number(item.quantity) || 1,
        unit_price: Number(item.unit_price) || 0,
        tax_rate: Number(item.tax_rate) || 0,
        discount_type: item.discount_type || 'fixed',
        discount: Number(item.discount) || 0,
        total: Number(item.total) || 0,
      }));
    } else if (workOrder.estimate_id) {
      // Fall back to estimate line items
      const estimateLineItems = await EstimateLineItem.findAll({
        where: { estimate_id: workOrder.estimate_id, is_deleted: false },
        order: [['sort_order', 'ASC']],
      });
      lineItems = estimateLineItems.map((item) => ({
        type: item.type || 'service',
        name: item.name,
        description: item.description || null,
        quantity: Number(item.quantity) || 1,
        unit_price: Number(item.unit_price) || 0,
        tax_rate: Number(item.tax_rate) || 0,
        discount_type: item.discount_type || 'fixed',
        discount: Number(item.discount) || 0,
        total: Number(item.total) || 0,
      }));
    }

    // Calculate totals from line items
    let subtotal = 0;
    let taxTotal = 0;
    let discountTotal = 0;
    for (const item of lineItems) {
      subtotal += item.total;
      taxTotal += (item.unit_price * item.quantity) * (item.tax_rate / 100);
      discountTotal += item.discount;
    }

    // If still no line items, try to get totals from the estimate itself
    if (lineItems.length === 0 && workOrder.estimate_id) {
      const estimate = await Estimate.findOne({
        where: { id: workOrder.estimate_id, is_deleted: false },
      });
      if (estimate) {
        subtotal = Number(estimate.subtotal) || 0;
        taxTotal = Number(estimate.tax) || 0;
        discountTotal = Number(estimate.discount) || 0;
      }
    }

    const totalAmount = subtotal + taxTotal - discountTotal;

    const invoiceNumber = await this.generateInvoiceNumber(tenantId);

    const invoice = await this.invoiceRepository.create({
      tenant_id: tenantId,
      work_order_id: workOrderId,
      contact_id: workOrder.contact_id,
      invoice_number: invoiceNumber,
      due_date: this.calculateDueDate(new Date(), 30).toISOString().split('T')[0],
      status: 'draft',
      subtotal,
      tax: taxTotal,
      discount: discountTotal,
      total: totalAmount > 0 ? totalAmount : subtotal,
      paid_amount: 0,
      currency: 'INR',
      notes: `Auto-generated from Work Order ${workOrder.wo_number || workOrderId.slice(0, 8)}`,
    });

    // Create invoice line items
    for (const item of lineItems) {
      await this.invoiceLineItemRepository.create({
        tenant_id: tenantId,
        invoice_id: invoice.id,
        type: item.type,
        name: item.name,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        tax_rate: item.tax_rate,
        discount_type: item.discount_type,
        discount: item.discount,
        total: item.total,
      });
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

  private calculateDueDate(fromDate: Date, daysToAdd: number): Date {
    const dueDate = new Date(fromDate);
    dueDate.setDate(dueDate.getDate() + daysToAdd);
    return dueDate;
  }
}
