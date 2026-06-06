import { Injectable, Inject } from '@nestjs/common';
import { Op, fn, col, literal } from 'sequelize';
import { WorkOrder } from '../WORK_ORDERS/work_orders.entity';
import { Invoice } from '../INVOICES/invoices.entity';
import { ServiceAppointment } from '../SERVICE_APPOINTMENTS/service_appointments.entity';
import { ServiceRequest } from '../SERVICE_REQUESTS/service_requests.entity';
import { Payment } from '../PAYMENTS/payments.entity';
import { KEYNAMES } from '../shared/constants/keynames';
import { ReportQueryDto } from './dto/report_query.dto';

@Injectable()
export class ReportsService {
  constructor(
    @Inject(KEYNAMES.WORK_ORDERS)
    private readonly workOrderRepo: typeof WorkOrder,

    @Inject(KEYNAMES.INVOICES)
    private readonly invoiceRepo: typeof Invoice,

    @Inject(KEYNAMES.SERVICE_APPOINTMENTS)
    private readonly appointmentRepo: typeof ServiceAppointment,

    @Inject(KEYNAMES.SERVICE_REQUESTS)
    private readonly serviceRequestRepo: typeof ServiceRequest,

    @Inject(KEYNAMES.PAYMENTS)
    private readonly paymentRepo: typeof Payment,
  ) { }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  private buildDateWhere(queryDto: ReportQueryDto): Record<string, unknown> {
    const dateFilter: Record<string, unknown> = {};
    if (queryDto.start_date || queryDto.end_date) {
      dateFilter['created_at'] = {
        ...(queryDto.start_date ? { [Op.gte]: new Date(queryDto.start_date) } : {}),
        ...(queryDto.end_date ? { [Op.lte]: new Date(queryDto.end_date + 'T23:59:59') } : {}),
      };
    }
    return dateFilter;
  }

  private toNumber(val: any): number {
    return parseFloat(val) || 0;
  }

  // ─── Work Order Report ────────────────────────────────────────────────────────

  async getWorkOrderReport(tenantId: string, queryDto: ReportQueryDto): Promise<Record<string, unknown>> {
    const where = {
      tenant_id: tenantId,
      is_deleted: false,
      ...this.buildDateWhere(queryDto),
    };

    const statusCounts = await this.workOrderRepo.findAll({
      where,
      attributes: ['status', [fn('COUNT', col('id')), 'count']],
      group: ['status'],
      raw: true,
    }) as any[];

    const priorityCounts = await this.workOrderRepo.findAll({
      where,
      attributes: ['priority', [fn('COUNT', col('id')), 'count']],
      group: ['priority'],
      raw: true,
    }) as any[];

    const avgCompletion = await this.workOrderRepo.findOne({
      where: {
        ...where,
        actual_start: { [Op.ne]: null },
        actual_end: { [Op.ne]: null },
      },
      attributes: [
        [fn('AVG', literal("EXTRACT(EPOCH FROM (actual_end - actual_start)) / 3600")), 'avg_hours'],
      ],
      raw: true,
    }) as any;

    const byStatus: Record<string, number> = {};
    let total = 0;
    for (const row of statusCounts) {
      byStatus[row.status] = parseInt(row.count, 10);
      total += byStatus[row.status];
    }

    const byPriority: Record<string, number> = {};
    for (const row of priorityCounts) {
      byPriority[row.priority] = parseInt(row.count, 10);
    }

    return {
      total_work_orders: total,
      by_status: byStatus,
      by_priority: byPriority,
      average_completion_time_hours: parseFloat((this.toNumber(avgCompletion?.['avg_hours'])).toFixed(2)),
      date_range: {
        start: queryDto.start_date || null,
        end: queryDto.end_date || null,
      },
    };
  }

  // ─── Invoice Report ───────────────────────────────────────────────────────────

  async getInvoiceReport(tenantId: string, queryDto: ReportQueryDto): Promise<Record<string, unknown>> {
    const where = {
      tenant_id: tenantId,
      is_deleted: false,
      ...this.buildDateWhere(queryDto),
    };

    const statusCounts = await this.invoiceRepo.findAll({
      where,
      attributes: [
        'status',
        [fn('COUNT', col('id')), 'count'],
        [fn('SUM', col('total')), 'total_amount'],
      ],
      group: ['status'],
      raw: true,
    }) as any[];

    const byStatus: Record<string, number> = {};
    let totalInvoices = 0;
    let totalRevenue = 0;
    let paidTotal = 0;
    let invoiceTotal = 0;

    for (const row of statusCounts) {
      const cnt = parseInt(row.count, 10);
      byStatus[row.status] = cnt;
      totalInvoices += cnt;
      const rowTotal = this.toNumber(row.total_amount);
      totalRevenue += rowTotal;
      if (row.status === 'paid') paidTotal += rowTotal;
      invoiceTotal += rowTotal;
    }

    const avgInvoice = totalInvoices > 0 ? totalRevenue / totalInvoices : 0;
    const collectionRate = invoiceTotal > 0 ? (paidTotal / invoiceTotal) * 100 : 0;

    return {
      total_invoices: totalInvoices,
      total_revenue: parseFloat(totalRevenue.toFixed(2)),
      by_status: byStatus,
      average_invoice_amount: parseFloat(avgInvoice.toFixed(2)),
      collection_rate: parseFloat(collectionRate.toFixed(1)),
      date_range: {
        start: queryDto.start_date || null,
        end: queryDto.end_date || null,
      },
    };
  }

  // ─── Performance Report ───────────────────────────────────────────────────────

  async getPerformanceReport(tenantId: string, queryDto: ReportQueryDto): Promise<Record<string, unknown>> {
    const dateFilter = this.buildDateWhere(queryDto);
    const apptWhere = { tenant_id: tenantId, is_deleted: false, ...dateFilter };

    const completedAppts = await this.appointmentRepo.count({
      where: { ...apptWhere, status: 'completed' },
    });
    const totalAppts = await this.appointmentRepo.count({ where: apptWhere });

    const firstTimeFixRate = totalAppts > 0 ? (completedAppts / totalAppts) * 100 : 0;

    const avgResponseTime = await this.appointmentRepo.findOne({
      where: {
        ...apptWhere,
        actual_start: { [Op.ne]: null },
      },
      attributes: [
        [fn('AVG', literal("EXTRACT(EPOCH FROM (actual_start - scheduled_start)) / 3600")), 'avg_response_hours'],
      ],
      raw: true,
    }) as any;

    const avgResolutionTime = await this.appointmentRepo.findOne({
      where: {
        ...apptWhere,
        actual_start: { [Op.ne]: null },
        actual_end: { [Op.ne]: null },
      },
      attributes: [
        [fn('AVG', literal("EXTRACT(EPOCH FROM (actual_end - actual_start)) / 3600")), 'avg_resolution_hours'],
      ],
      raw: true,
    }) as any;

    const perTechnician = await this.appointmentRepo.findAll({
      where: apptWhere,
      attributes: ['agent_id', [fn('COUNT', col('id')), 'count']],
      group: ['agent_id'],
      raw: true,
    }) as any[];

    const topPerformers = perTechnician
      .sort((a: any, b: any) => parseInt(b.count) - parseInt(a.count))
      .slice(0, 5)
      .map((row: any) => ({ user_id: row.agent_id, appointments: parseInt(row.count, 10) }));

    const avgUtilization = perTechnician.length > 0
      ? perTechnician.reduce((sum: number, r: any) => sum + parseInt(r.count, 10), 0) / perTechnician.length
      : 0;

    return {
      first_time_fix_rate: parseFloat(firstTimeFixRate.toFixed(1)),
      average_response_time_hours: parseFloat(this.toNumber(avgResponseTime?.['avg_response_hours']).toFixed(2)),
      average_resolution_time_hours: parseFloat(this.toNumber(avgResolutionTime?.['avg_resolution_hours']).toFixed(2)),
      technician_utilization_rate: parseFloat(avgUtilization.toFixed(1)),
      top_performers: topPerformers,
      date_range: {
        start: queryDto.start_date || null,
        end: queryDto.end_date || null,
      },
    };
  }

  // ─── Service Requests Report ──────────────────────────────────────────────────

  async getServiceRequestReport(tenantId: string, queryDto: ReportQueryDto): Promise<Record<string, unknown>> {
    const where = {
      tenant_id: tenantId,
      is_deleted: false,
      ...this.buildDateWhere(queryDto),
    };

    const statusCounts = await this.serviceRequestRepo.findAll({
      where,
      attributes: ['status', [fn('COUNT', col('id')), 'count']],
      group: ['status'],
      raw: true,
    }) as any[];

    const priorityCounts = await this.serviceRequestRepo.findAll({
      where,
      attributes: ['priority', [fn('COUNT', col('id')), 'count']],
      group: ['priority'],
      raw: true,
    }) as any[];

    const byStatus: Record<string, number> = {};
    let total = 0;
    for (const row of statusCounts) {
      byStatus[row.status] = parseInt(row.count, 10);
      total += byStatus[row.status];
    }

    const byPriority: Record<string, number> = {};
    for (const row of priorityCounts) {
      byPriority[row.priority] = parseInt(row.count, 10);
    }

    const convertedCount = byStatus['converted_to_wo'] || 0;
    const conversionRate = total > 0 ? (convertedCount / total) * 100 : 0;

    return {
      total_requests: total,
      by_status: byStatus,
      by_priority: byPriority,
      conversion_rate: parseFloat(conversionRate.toFixed(1)),
      date_range: {
        start: queryDto.start_date || null,
        end: queryDto.end_date || null,
      },
    };
  }

  // ─── Payments Report ──────────────────────────────────────────────────────────

  async getPaymentReport(tenantId: string, queryDto: ReportQueryDto): Promise<Record<string, unknown>> {
    const where = {
      tenant_id: tenantId,
      is_deleted: false,
      ...this.buildDateWhere(queryDto),
    };

    const statusCounts = await this.paymentRepo.findAll({
      where,
      attributes: [
        'status',
        [fn('COUNT', col('id')), 'count'],
        [fn('SUM', col('amount')), 'total_amount'],
      ],
      group: ['status'],
      raw: true,
    }) as any[];

    const methodCounts = await this.paymentRepo.findAll({
      where,
      attributes: [
        'method',
        [fn('COUNT', col('id')), 'count'],
        [fn('SUM', col('amount')), 'total_amount'],
      ],
      group: ['method'],
      raw: true,
    }) as any[];

    const byStatus: Record<string, number> = {};
    let totalPayments = 0;
    let totalCollected = 0;
    let completedAmount = 0;

    for (const row of statusCounts) {
      const cnt = parseInt(row.count, 10);
      byStatus[row.status] = cnt;
      totalPayments += cnt;
      totalCollected += this.toNumber(row.total_amount);
      if (row.status === 'completed') completedAmount += this.toNumber(row.total_amount);
    }

    const byMethod: Record<string, { count: number; amount: number }> = {};
    for (const row of methodCounts) {
      byMethod[row.method] = {
        count: parseInt(row.count, 10),
        amount: parseFloat(this.toNumber(row.total_amount).toFixed(2)),
      };
    }

    const successRate = totalPayments > 0
      ? ((byStatus['completed'] || 0) / totalPayments) * 100
      : 0;

    return {
      total_payments: totalPayments,
      total_collected: parseFloat(totalCollected.toFixed(2)),
      completed_amount: parseFloat(completedAmount.toFixed(2)),
      success_rate: parseFloat(successRate.toFixed(1)),
      by_status: byStatus,
      by_method: byMethod,
      date_range: {
        start: queryDto.start_date || null,
        end: queryDto.end_date || null,
      },
    };
  }
}
