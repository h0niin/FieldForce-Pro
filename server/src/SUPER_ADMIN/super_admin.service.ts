import { Injectable, Inject, NotFoundException, UnauthorizedException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Op } from 'sequelize';
import { REPOSITORY } from '../shared/constants/keynames';
import { Tenant } from '../TENANTS/tenants.entity';
import { User } from '../USERS/users.entity';
import { ServiceRequest } from '../SERVICE_REQUESTS/service_requests.entity';
import { WorkOrder } from '../WORK_ORDERS/work_orders.entity';
import { Invoice } from '../INVOICES/invoices.entity';
import { SubscriptionPlan } from '../SUBSCRIPTION_PLANS/subscription_plans.entity';
import { ServiceAppointment } from '../SERVICE_APPOINTMENTS/service_appointments.entity';
import { TenantsService } from '../TENANTS/tenants.service';
import { UpdateTenantSubscriptionDto } from './dto/update_tenant_subscription.dto';
import { UpdateSubscriptionPlanDto } from './dto/update_subscription_plan.dto';


// Note: USERS and SERVICE_REQUESTS repositories are provided locally in SuperAdminModule
// to enable cross-tenant queries without being constrained by tenant-scoped services.

@Injectable()
export class SuperAdminService {
  constructor(
    private readonly tenantsService: TenantsService,
    @Inject(REPOSITORY.TENANTS)
    private readonly tenantRepository: typeof Tenant,
    @Inject(REPOSITORY.USERS)
    private readonly userRepository: typeof User,
    @Inject(REPOSITORY.SERVICE_REQUESTS)
    private readonly serviceRequestRepository: typeof ServiceRequest,
    @Inject(REPOSITORY.WORK_ORDERS)
    private readonly workOrderRepository: typeof WorkOrder,
    @Inject(REPOSITORY.INVOICES)
    private readonly invoiceRepository: typeof Invoice,
    @Inject(REPOSITORY.SUBSCRIPTION_PLANS)
    private readonly subscriptionPlanRepository: typeof SubscriptionPlan,
    @Inject(REPOSITORY.SERVICE_APPOINTMENTS)
    private readonly serviceAppointmentRepository: typeof ServiceAppointment,
  ) {}

  async listTenants() {
    const tenants = await this.tenantRepository.findAll({
      attributes: ['id', 'name', 'slug', 'subscription_plan', 'max_users', 'is_active', 'created_at'],
      order: [['created_at', 'DESC']],
    });

    // Attach counts and admin email to each tenant
    const results = await Promise.all(
      tenants.map(async (tenant) => {
        const [userCount, srCount, adminUser] = await Promise.all([
          this.userRepository.count({ where: { tenant_id: tenant.id, is_deleted: false } }),
          this.serviceRequestRepository.count({ where: { tenant_id: tenant.id, is_deleted: false } }),
          this.userRepository.findOne({
            where: { tenant_id: tenant.id, is_deleted: false, is_active: true },
            attributes: ['id', 'email'],
            order: [['created_at', 'ASC']],
          }),
        ]);
        return {
          ...tenant.toJSON(),
          user_count: userCount,
          service_request_count: srCount,
          admin_email: adminUser?.email ?? null,
          admin_user_id: adminUser?.id ?? null,
        };
      }),
    );

    return results;
  }

  async getTenant(id: string) {
    const tenant = await this.tenantsService.findById(id);
    const userCount = await this.userRepository.count({
      where: { tenant_id: id, is_deleted: false },
    });
    const srCount = await this.serviceRequestRepository.count({
      where: { tenant_id: id, is_deleted: false },
    });
    return { ...tenant.toJSON(), user_count: userCount, service_request_count: srCount };
  }

  async getTenantOverview(id: string) {
    const tenant = await this.tenantsService.findById(id);
    const adminUser = await this.userRepository.findOne({
      where: { tenant_id: id, is_deleted: false, is_active: true },
      attributes: ['email', 'first_name', 'last_name'],
      order: [['created_at', 'ASC']],
    });

    const [userCount, srCount, woCount, invoiceCount] = await Promise.all([
      this.userRepository.count({ where: { tenant_id: id, is_deleted: false } }),
      this.serviceRequestRepository.count({ where: { tenant_id: id, is_deleted: false } }),
      this.workOrderRepository.count({ where: { tenant_id: id, is_deleted: false } }),
      this.invoiceRepository.count({ where: { tenant_id: id, is_deleted: false } }),
    ]);

    return {
      ...tenant.toJSON(),
      admin_email: adminUser?.email ?? null,
      admin_name: adminUser ? `${adminUser.first_name} ${adminUser.last_name}` : null,
      user_count: userCount,
      service_request_count: srCount,
      work_order_count: woCount,
      invoice_count: invoiceCount,
    };
  }

  async suspendTenant(id: string) {
    const tenant = await this.tenantsService.findById(id);
    await tenant.update({ is_active: false });
    return tenant;
  }

  async activateTenant(id: string) {
    const tenant = await this.tenantsService.findById(id);
    await tenant.update({ is_active: true });
    return tenant;
  }

  async getPlatformHealth() {
    const [totalTenants, activeTenants, totalUsers, totalServiceRequests] = await Promise.all([
      this.tenantRepository.count(),
      this.tenantRepository.count({ where: { is_active: true } }),
      this.userRepository.count({ where: { is_deleted: false } }),
      this.serviceRequestRepository.count({ where: { is_deleted: false } }),
    ]);

    return {
      tenants: { total: totalTenants, active: activeTenants, suspended: totalTenants - activeTenants },
      users: { total: totalUsers },
      service_requests: { total: totalServiceRequests },
      timestamp: new Date().toISOString(),
    };
  }

  async listSubscriptionPlans() {
    return this.subscriptionPlanRepository.findAll({
      where: { is_active: true },
      order: [['price_monthly', 'ASC']],
      attributes: ['id', 'name', 'max_total_users', 'max_appointments_monthly', 'price_monthly', 'price_yearly', 'currency', 'features'],
    });
  }

  async updateSubscriptionPlan(id: string, dto: UpdateSubscriptionPlanDto) {
    const plan = await this.subscriptionPlanRepository.findByPk(id);
    if (!plan) {
      throw new NotFoundException('Subscription plan not found');
    }
    await plan.update(dto);
    return plan;
  }


  async updateTenantSubscription(tenantId: string, dto: UpdateTenantSubscriptionDto) {
    const tenant = await this.tenantsService.findById(tenantId);

    const updates: Record<string, unknown> = {};
    if (dto.plan_id !== undefined) updates.subscription_plan_id = dto.plan_id;
    if (dto.subscription_status !== undefined) updates.subscription_status = dto.subscription_status;
    if (dto.subscription_end !== undefined) updates.subscription_end = dto.subscription_end ? new Date(dto.subscription_end) : null;
    const customLimits = (tenant.custom_limits as Record<string, number | null> | null) || {};
    let hasLimitsChanges = false;
    const newLimits = { ...customLimits };

    if (dto.max_users_override !== undefined) {
      if (dto.max_users_override === null) {
        delete newLimits.max_total_users;
      } else {
        newLimits.max_total_users = dto.max_users_override;
      }
      hasLimitsChanges = true;
    }

    if (dto.max_appointments_override !== undefined) {
      if (dto.max_appointments_override === null) {
        delete newLimits.max_appointments_monthly;
      } else {
        newLimits.max_appointments_monthly = dto.max_appointments_override;
      }
      hasLimitsChanges = true;
    }

    if (hasLimitsChanges) {
      updates.custom_limits = Object.keys(newLimits).length > 0 ? newLimits : null;
    }

    await tenant.update(updates);
    return tenant.toJSON();
  }

  async getTenantUsage(tenantId: string) {
    const tenant = await this.tenantsService.findById(tenantId);

    let plan: SubscriptionPlan | null = null;
    if (tenant.subscription_plan_id) {
      plan = await this.subscriptionPlanRepository.findByPk(tenant.subscription_plan_id);
    }

    const customMaxUsers = (tenant.custom_limits as Record<string, number | null> | null)?.max_total_users ?? null;
    const totalUsersLimit: number | null = customMaxUsers ?? plan?.max_total_users ?? 200;

    const currentUsers = await this.userRepository.count({
      where: { tenant_id: tenantId, is_deleted: false },
    });

    const customMaxAppts = (tenant.custom_limits as Record<string, number | null> | null)?.max_appointments_monthly ?? null;
    const appointmentsLimit: number | null = customMaxAppts ?? plan?.max_appointments_monthly ?? null;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentAppointments = await this.serviceAppointmentRepository.count({
      where: { tenant_id: tenantId, is_deleted: false, created_at: { [Op.gte]: startOfMonth } },
    });

    return {
      plan_name: plan?.name ?? (tenant.subscription_plan || 'Unknown'),
      subscription_status: tenant.subscription_status,
      subscription_end: tenant.subscription_end,
      usage: {
        total_users: { current: currentUsers, limit: totalUsersLimit },
        appointments: { current: currentAppointments, limit: appointmentsLimit },
      },
    };
  }

  async updateProfile(userId: string, dto: { first_name?: string; last_name?: string }) {
    const user = await this.userRepository.findOne({ where: { id: userId, is_deleted: false } });
    if (!user) throw new NotFoundException('User not found');
    await user.update(dto);
    const { password_hash, password_reset_token, password_reset_expires, ...result } = user.toJSON() as any;
    return result;
  }

  async changeSuperAdminEmail(userId: string, currentPassword: string, newEmail: string) {
    const user = await this.userRepository.findOne({ where: { id: userId, is_deleted: false } });
    if (!user) throw new NotFoundException('User not found');

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isPasswordValid) throw new UnauthorizedException('Current password is incorrect');

    const existing = await this.userRepository.findOne({ where: { email: newEmail, is_deleted: false } });
    if (existing && existing.id !== userId) throw new ConflictException('Email address is already in use');

    await user.update({ email: newEmail });
    return { email: newEmail };
  }
}
