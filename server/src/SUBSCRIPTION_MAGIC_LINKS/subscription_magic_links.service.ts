import {
  Injectable, Inject, NotFoundException, BadRequestException, GoneException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';
import { REPOSITORY } from '../shared/constants/keynames';
import { SubscriptionMagicLink } from './subscription_magic_links.entity';
import { SubscriptionPlan } from '../SUBSCRIPTION_PLANS/subscription_plans.entity';
import { User } from '../USERS/users.entity';
import { SuperAdminAuditLogsService } from '../SUPER_ADMIN/SUPER_ADMIN_AUDIT_LOGS/super_admin_audit_logs.service';

@Injectable()
export class SubscriptionMagicLinksService {
  constructor(
    @Inject(REPOSITORY.SUBSCRIPTION_MAGIC_LINKS)
    private readonly repo: typeof SubscriptionMagicLink,
    @Inject(REPOSITORY.SUBSCRIPTION_PLANS)
    private readonly planRepo: typeof SubscriptionPlan,
    private readonly auditLogs: SuperAdminAuditLogsService,
  ) {}

  async create(superAdminId: string, dto: {
    plan_id: string;
    max_uses?: number;
    expires_in_days?: number;
    notes?: string;
  }): Promise<{ link: SubscriptionMagicLink; token: string }> {
    const plan = await this.planRepo.findOne({ where: { id: dto.plan_id, is_active: true } });
    if (!plan) throw new NotFoundException('Subscription plan not found or inactive');

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = await bcrypt.hash(rawToken, 10);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (dto.expires_in_days ?? 7));

    const link = await this.repo.create({
      token: rawToken,
      token_hash: tokenHash,
      plan_id: dto.plan_id,
      created_by: superAdminId,
      status: 'active',
      expires_at: expiresAt,
      max_uses: dto.max_uses ?? 1,
      used_count: 0,
      notes: dto.notes ?? null,
    } as any);

    await this.auditLogs.logAction(
      superAdminId,
      'subscription_magic_link_generated',
      'subscription_magic_links',
      link.id,
      { plan_name: plan.name, expires_at: expiresAt },
    );

    return { link, token: rawToken };
  }

  async findAll(): Promise<SubscriptionMagicLink[]> {
    return this.repo.findAll({
      include: [
        { model: SubscriptionPlan, attributes: ['id', 'name', 'price_monthly'] },
        { model: User, as: 'creator', attributes: ['id', 'email', 'first_name', 'last_name'] },
      ],
      order: [['created_at', 'DESC']],
    });
  }

  async findById(id: string): Promise<SubscriptionMagicLink> {
    const link = await this.repo.findOne({
      where: { id },
      include: [
        { model: SubscriptionPlan, attributes: ['id', 'name', 'price_monthly', 'features'] },
        { model: User, as: 'creator', attributes: ['id', 'email', 'first_name', 'last_name'] },
      ],
    });
    if (!link) throw new NotFoundException('Magic link not found');
    return link;
  }

  async validate(token: string): Promise<{ valid: boolean; plan: SubscriptionPlan; link: SubscriptionMagicLink }> {
    const link = await this.repo.findOne({
      where: { token },
      include: [{ model: SubscriptionPlan }],
    });

    if (!link) throw new NotFoundException('Invalid or unknown magic link');
    if (link.status !== 'active') throw new GoneException('This link has been disabled or already used');
    if (new Date() > new Date(link.expires_at)) {
      await link.update({ status: 'expired' });
      throw new GoneException('This link has expired');
    }
    if (link.used_count >= link.max_uses) {
      await link.update({ status: 'used' });
      throw new GoneException('This link has already been used the maximum number of times');
    }

    await this.auditLogs.logAction(
      link.created_by,
      'subscription_magic_link_viewed',
      'subscription_magic_links',
      link.id,
      { plan_name: (link as any).plan?.name },
    );

    return { valid: true, plan: (link as any).plan, link };
  }

  async consume(token: string, superAdminId: string, tenantName: string): Promise<{ plan: SubscriptionPlan; planId: string }> {
    const link = await this.repo.findOne({
      where: { token },
      include: [{ model: SubscriptionPlan }],
    });

    if (!link) throw new NotFoundException('Invalid magic link');
    if (link.status !== 'active') throw new GoneException('This link has already been used or disabled');
    if (new Date() > new Date(link.expires_at)) throw new GoneException('This link has expired');
    if (link.used_count >= link.max_uses) throw new GoneException('This link has reached its maximum uses');

    const newCount = link.used_count + 1;
    const newStatus = newCount >= link.max_uses ? 'used' : 'active';
    await link.update({ used_count: newCount, status: newStatus });

    await this.auditLogs.logAction(
      link.created_by,
      'subscription_magic_link_redeemed',
      'subscription_magic_links',
      link.id,
      { plan_name: (link as any).plan?.name, tenant_name: tenantName, used_count: newCount },
    );

    return { plan: (link as any).plan, planId: link.plan_id };
  }

  async disable(id: string, superAdminId: string): Promise<SubscriptionMagicLink> {
    const link = await this.findById(id);
    if (link.status === 'used') throw new BadRequestException('Cannot disable a used link');
    await link.update({ status: 'disabled' });

    await this.auditLogs.logAction(superAdminId, 'subscription_magic_link_disabled', 'subscription_magic_links', id);
    return link;
  }

  async remove(id: string, superAdminId: string): Promise<void> {
    const link = await this.findById(id);
    if (link.status === 'used') throw new BadRequestException('Cannot delete a used link — it is part of audit history');
    await link.destroy();
    await this.auditLogs.logAction(superAdminId, 'subscription_magic_link_deleted', 'subscription_magic_links', id);
  }

  async expireStale(): Promise<void> {
    const stale = await this.repo.findAll({ where: { status: 'active' } });
    for (const link of stale) {
      if (new Date() > new Date(link.expires_at)) {
        await link.update({ status: 'expired' });
      }
    }
  }
}
