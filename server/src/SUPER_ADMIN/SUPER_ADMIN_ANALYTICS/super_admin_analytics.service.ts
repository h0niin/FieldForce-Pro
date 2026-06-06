import { Injectable, Inject } from '@nestjs/common';
import { REPOSITORY } from '../../shared/constants/keynames';
import { Tenant } from '../../TENANTS/tenants.entity';
import { User } from '../../USERS/users.entity';
import { Invoice } from '../../INVOICES/invoices.entity';
import { WorkOrder } from '../../WORK_ORDERS/work_orders.entity';
import { Sequelize } from 'sequelize-typescript';

@Injectable()
export class SuperAdminAnalyticsService {
  constructor(
    @Inject(REPOSITORY.TENANTS) private readonly tenantRepository: typeof Tenant,
    @Inject(REPOSITORY.USERS) private readonly userRepository: typeof User,
    @Inject(REPOSITORY.INVOICES) private readonly invoiceRepository: typeof Invoice,
    @Inject(REPOSITORY.WORK_ORDERS) private readonly workOrderRepository: typeof WorkOrder,
  ) {}

  async getOverviewMetrics() {
    const [
      totalTenants,
      activeTenants,
      totalUsers,
      totalWorkOrders,
      totalRevenueData,
    ] = await Promise.all([
      this.tenantRepository.count(),
      this.tenantRepository.count({ where: { is_active: true } }),
      this.userRepository.count({ where: { is_deleted: false, is_active: true } }),
      this.workOrderRepository.count({ where: { is_deleted: false } }),
      this.invoiceRepository.findAll({
        where: { is_deleted: false, status: 'paid' },
        attributes: [
          [Sequelize.fn('sum', Sequelize.col('total')), 'total'],
        ],
        raw: true,
      }),
    ]);

    const totalRevenue = totalRevenueData[0] ? Number((totalRevenueData[0] as any).total) || 0 : 0;

    return {
      tenants: {
        total: totalTenants,
        active: activeTenants,
      },
      users: {
        active: totalUsers,
      },
      work_orders: {
        total: totalWorkOrders,
      },
      revenue: {
        total: totalRevenue,
        mrr: totalRevenue / 12, // Simplistic MRR calculation for overview
      },
    };
  }

  async getRevenueTrends(period: 'monthly' | 'yearly') {
    const format = period === 'monthly' ? 'YYYY-MM' : 'YYYY';
    
    const trends = await this.invoiceRepository.findAll({
      where: { is_deleted: false, status: 'paid' },
      attributes: [
        [Sequelize.fn('to_char', Sequelize.col('created_at'), format), 'date'],
        [Sequelize.fn('sum', Sequelize.col('total')), 'revenue'],
      ],
      group: [Sequelize.fn('to_char', Sequelize.col('created_at'), format)],
      order: [[Sequelize.fn('to_char', Sequelize.col('created_at'), format), 'ASC']],
      raw: true,
    });

    return trends.map((t: any) => ({
      date: t.date,
      revenue: Number(t.revenue) || 0,
    }));
  }

  async getAdoptionMetrics() {
    const tenantsByPlan = await this.tenantRepository.findAll({
      attributes: [
        'subscription_plan',
        [Sequelize.fn('count', Sequelize.col('id')), 'count'],
      ],
      group: ['subscription_plan'],
      raw: true,
    });

    return {
      by_plan: tenantsByPlan,
    };
  }
}
