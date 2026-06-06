import { Injectable, Inject, Logger, NotFoundException } from '@nestjs/common';
import { Estimate } from '../../ESTIMATES/estimates.entity';
import { Invoice } from '../../INVOICES/invoices.entity';
import { WorkOrder } from '../../WORK_ORDERS/work_orders.entity';
import { KEYNAMES } from '../constants/keynames';

@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);

  constructor(
    @Inject(KEYNAMES.ESTIMATES)
    private readonly estimateRepository: typeof Estimate,
    @Inject(KEYNAMES.INVOICES)
    private readonly invoiceRepository: typeof Invoice,
    @Inject(KEYNAMES.WORK_ORDERS)
    private readonly workOrderRepository: typeof WorkOrder,
  ) {}

  /**
   * Generate estimate PDF
   * TODO: Replace with real PDF generation using Puppeteer or similar
   */
  async generateEstimatePDF(estimateId: string, tenantId: string): Promise<string> {
    try {
      const estimate = await this.estimateRepository.findOne({
        where: { id: estimateId, tenant_id: tenantId, is_deleted: false },
      });

      if (!estimate) {
        throw new NotFoundException('Estimate not found');
      }

      // Generate simple HTML that can be converted to PDF later
      const html = this.generateEstimateHTML(estimate);

      this.logger.log(`Generated PDF HTML for estimate ${estimateId}`);

      // TODO: Convert HTML to PDF using Puppeteer
      // const browser = await puppeteer.launch();
      // const page = await browser.newPage();
      // await page.setContent(html);
      // const pdf = await page.pdf({ format: 'A4' });
      // await browser.close();
      // return pdf;

      return html;
    } catch (error) {
      this.logger.error(
        `Error generating estimate PDF: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Generate invoice PDF
   * TODO: Replace with real PDF generation using Puppeteer or similar
   */
  async generateInvoicePDF(invoiceId: string, tenantId: string): Promise<string> {
    try {
      const invoice = await this.invoiceRepository.findOne({
        where: { id: invoiceId, tenant_id: tenantId, is_deleted: false },
      });

      if (!invoice) {
        throw new NotFoundException('Invoice not found');
      }

      // Generate simple HTML that can be converted to PDF later
      const html = this.generateInvoiceHTML(invoice);

      this.logger.log(`Generated PDF HTML for invoice ${invoiceId}`);

      return html;
    } catch (error) {
      this.logger.error(
        `Error generating invoice PDF: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Generate work order PDF
   * TODO: Replace with real PDF generation using Puppeteer or similar
   */
  async generateWorkOrderPDF(workOrderId: string, tenantId: string): Promise<string> {
    try {
      const workOrder = await this.workOrderRepository.findOne({
        where: { id: workOrderId, tenant_id: tenantId, is_deleted: false },
      });

      if (!workOrder) {
        throw new NotFoundException('Work order not found');
      }

      // Generate simple HTML that can be converted to PDF later
      const html = this.generateWorkOrderHTML(workOrder);

      this.logger.log(`Generated PDF HTML for work order ${workOrderId}`);

      return html;
    } catch (error) {
      this.logger.error(
        `Error generating work order PDF: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Generate report PDF
   * TODO: Replace with real PDF generation using Puppeteer or similar
   */
  async generateReportPDF(
    reportTitle: string,
    reportData: Record<string, unknown>,
  ): Promise<string> {
    try {
      // Generate simple HTML that can be converted to PDF later
      const html = this.generateReportHTML(reportTitle, reportData);

      this.logger.log(`Generated PDF HTML for report: ${reportTitle}`);

      return html;
    } catch (error) {
      this.logger.error(`Error generating report PDF: ${error.message}`, error.stack);
      throw error;
    }
  }

  // HTML Generation Methods (Placeholder implementations)

  private generateEstimateHTML(estimate: Estimate): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Estimate ${estimate.estimate_number}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    .header { text-align: center; margin-bottom: 30px; }
    .info-section { margin-bottom: 20px; }
    .label { font-weight: bold; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
    .total { text-align: right; font-weight: bold; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>ESTIMATE</h1>
    <h2>${estimate.estimate_number}</h2>
  </div>

  <div class="info-section">
    <p><span class="label">Date:</span> ${new Date(estimate.created_at).toLocaleDateString()}</p>
    <p><span class="label">Status:</span> ${estimate.status}</p>
  </div>

  <div class="info-section">
    <p><span class="label">Notes:</span></p>
    <p>${estimate.notes || 'No notes'}</p>
  </div>

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th>Quantity</th>
        <th>Unit Price</th>
        <th>Total</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td colspan="4">Line items would be loaded from estimate_line_items table</td>
      </tr>
    </tbody>
  </table>

  <div class="total">
    <p>Total: $0.00</p>
  </div>
</body>
</html>
    `;
  }

  private generateInvoiceHTML(invoice: Invoice): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Invoice ${invoice.invoice_number}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    .header { text-align: center; margin-bottom: 30px; }
    .info-section { margin-bottom: 20px; }
    .label { font-weight: bold; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
    .total { text-align: right; font-weight: bold; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>INVOICE</h1>
    <h2>${invoice.invoice_number}</h2>
  </div>

  <div class="info-section">
    <p><span class="label">Invoice Date:</span> ${new Date(invoice.created_at).toLocaleDateString()}</p>
    <p><span class="label">Due Date:</span> ${invoice.due_date || 'N/A'}</p>
    <p><span class="label">Status:</span> ${invoice.status}</p>
  </div>

  <div class="info-section">
    <p><span class="label">Notes:</span></p>
    <p>${invoice.notes || 'No notes'}</p>
  </div>

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th>Quantity</th>
        <th>Unit Price</th>
        <th>Total</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td colspan="4">Line items would be loaded from invoice_line_items table</td>
      </tr>
    </tbody>
  </table>

  <div class="total">
    <p>Subtotal: $${invoice.subtotal || 0}</p>
    <p>Tax: $${invoice.tax || 0}</p>
    <p>Discount: $${invoice.discount || 0}</p>
    <p>Total: $${invoice.total || 0}</p>
    <p>Amount Paid: $${invoice.paid_amount || 0}</p>
    <p>Balance Due: $${(invoice.total || 0) - (invoice.paid_amount || 0)}</p>
  </div>
</body>
</html>
    `;
  }

  private generateWorkOrderHTML(workOrder: WorkOrder): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Work Order ${workOrder.wo_number}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    .header { text-align: center; margin-bottom: 30px; }
    .info-section { margin-bottom: 20px; }
    .label { font-weight: bold; }
  </style>
</head>
<body>
  <div class="header">
    <h1>WORK ORDER</h1>
    <h2>${workOrder.wo_number}</h2>
  </div>

  <div class="info-section">
    <p><span class="label">Status:</span> ${workOrder.status}</p>
    <p><span class="label">Priority:</span> ${workOrder.priority}</p>
    <p><span class="label">Category:</span> ${workOrder.category || 'N/A'}</p>
  </div>

  <div class="info-section">
    <p><span class="label">Summary:</span></p>
    <p>${workOrder.summary}</p>
  </div>

  <div class="info-section">
    <p><span class="label">Description:</span></p>
    <p>${workOrder.description || 'No description'}</p>
  </div>

  <div class="info-section">
    <p><span class="label">Scheduled Start:</span> ${workOrder.scheduled_start ? new Date(workOrder.scheduled_start).toLocaleString() : 'Not scheduled'}</p>
    <p><span class="label">Scheduled End:</span> ${workOrder.scheduled_end ? new Date(workOrder.scheduled_end).toLocaleString() : 'Not scheduled'}</p>
  </div>
</body>
</html>
    `;
  }

  private generateReportHTML(
    title: string,
    data: Record<string, unknown>,
  ): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    .header { text-align: center; margin-bottom: 30px; }
    pre { background-color: #f5f5f5; padding: 15px; border-radius: 5px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${title}</h1>
    <p>Generated: ${new Date().toLocaleString()}</p>
  </div>

  <pre>${JSON.stringify(data, null, 2)}</pre>
</body>
</html>
    `;
  }
}
