import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { Op } from 'sequelize';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { REPOSITORY } from '../shared/constants/keynames';
import { User } from './users.entity';
import { CreateUserDto } from './dto/users_create.dto';
import { UpdateUserDto } from './dto/users_update.dto';
import { InviteUserDto } from './dto/invite_user.dto';
import { PageOptionsDto } from '../shared/dto/page-options.dto';
import { PageMetaDto } from '../shared/dto/page-meta.dto';
import { PageDto } from '../shared/dto/page.dto';
import { Role } from '../ROLES/roles.entity';
import { Permission } from '../PERMISSIONS/permissions.entity';
import { Tenant } from '../TENANTS/tenants.entity';
import { SubscriptionPlan } from '../SUBSCRIPTION_PLANS/subscription_plans.entity';
import { MagicLink } from '../MAGIC_LINKS/magic_links.entity';
import { UserRole } from '../USER_ROLES/user_roles.entity';

@Injectable()
export class UsersService {
  constructor(
    @Inject(REPOSITORY.USERS)
    private readonly userRepository: typeof User,
    @Inject(REPOSITORY.TENANTS)
    private readonly tenantRepository: typeof Tenant,
    @Inject(REPOSITORY.SUBSCRIPTION_PLANS)
    private readonly subscriptionPlanRepository: typeof SubscriptionPlan,
    @Inject(REPOSITORY.MAGIC_LINKS)
    private readonly magicLinkRepository: typeof MagicLink,
    @Inject(REPOSITORY.USER_ROLES)
    private readonly userRoleRepository: typeof UserRole,
  ) {}

  async findAllPaginated(tenantId: string, pageOptionsDto: PageOptionsDto): Promise<PageDto<User>> {
    const where: Record<string, unknown> = {
      tenant_id: tenantId,
      is_deleted: false,
    };

    if (pageOptionsDto.search) {
      where[Op.or as unknown as string] = [
        { first_name: { [Op.iLike]: `%${pageOptionsDto.search}%` } },
        { last_name: { [Op.iLike]: `%${pageOptionsDto.search}%` } },
        { email: { [Op.iLike]: `%${pageOptionsDto.search}%` } },
      ];
    }

    const { count, rows } = await this.userRepository.findAndCountAll({
      where,
      order: [['created_at', pageOptionsDto.order]],
      limit: pageOptionsDto.take,
      offset: pageOptionsDto.skip,
      distinct: true,
      attributes: { exclude: ['password_hash', 'password_reset_token', 'password_reset_expires'] },
      include: [
        {
          model: Role,
          through: { attributes: [] },
        },
      ],
    });

    const meta = new PageMetaDto({ pageOptionsDto, itemCount: count });
    return new PageDto(rows, meta);
  }

  async findAgents(tenantId: string): Promise<User[]> {
    return this.userRepository.findAll({
      where: { tenant_id: tenantId, is_deleted: false, is_active: true },
      attributes: ['id', 'first_name', 'last_name', 'email'],
      include: [
        {
          model: Role,
          through: { attributes: [] },
          where: { name: { [Op.iLike]: '%technician%' } },
          required: true,
        },
      ],
      order: [['first_name', 'ASC']],
    });
  }

  async findAdmins(tenantId: string): Promise<User[]> {
    return this.userRepository.findAll({
      where: { tenant_id: tenantId, is_deleted: false, is_active: true },
      attributes: ['id', 'first_name', 'last_name', 'email'],
      include: [
        {
          model: Role,
          through: { attributes: [] },
          where: { name: { [Op.iLike]: '%admin%' } },
          required: true,
        },
      ],
      order: [['first_name', 'ASC']],
    });
  }

  async findAdminsAndDispatchers(tenantId: string): Promise<User[]> {
    return this.userRepository.findAll({
      where: { tenant_id: tenantId, is_deleted: false, is_active: true },
      attributes: ['id', 'first_name', 'last_name', 'email'],
      include: [
        {
          model: Role,
          through: { attributes: [] },
          where: {
            [Op.or]: [
              { name: { [Op.iLike]: '%admin%' } },
              { name: { [Op.iLike]: '%dispatcher%' } },
            ],
          },
          required: true,
        },
      ],
      order: [['first_name', 'ASC']],
    });
  }

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id, is_deleted: false },
      attributes: { exclude: ['password_hash', 'password_reset_token', 'password_reset_expires'] },
      include: [
        {
          model: Role,
          through: { attributes: [] },
          include: [{ model: Permission, through: { attributes: [] } }],
        },
      ],
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email, is_deleted: false },
      include: [
        {
          model: Role,
          through: { attributes: [] },
          include: [{ model: Permission, through: { attributes: [] } }],
        },
      ],
    });
  }

  async findByIdWithPassword(id: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id, is_deleted: false },
    });
  }

  async create(tenantId: string, dto: CreateUserDto): Promise<User> {
    // Check if the tenant has exceeded the maximum number of users allowed by their plan
    await this.checkUserLimit(tenantId);

    const existing = await this.userRepository.findOne({
      where: { email: dto.email, tenant_id: tenantId, is_deleted: false },
    });
    if (existing) {
      throw new ConflictException('User with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.userRepository.create({
      tenant_id: tenantId,
      email: dto.email,
      password_hash: passwordHash,
      first_name: dto.first_name,
      last_name: dto.last_name,
      phone: dto.phone,
      timezone: dto.timezone || 'UTC',
      language: dto.language || 'en',
    });

    // Return without password
    const { password_hash, ...result } = user.toJSON();
    return result as User;
  }

  // ── 2A: User limit check ────────────────────────────────────────────────
  async checkUserLimit(tenantId: string): Promise<void> {
    const tenant = await this.tenantRepository.findByPk(tenantId);
    if (!tenant) throw new NotFoundException('Tenant not found');

    // custom_limits takes precedence over subscription plan. Defaults to 200.
    const customMax = (tenant.custom_limits as Record<string, number | null> | null)?.max_total_users ?? null;
    let limit: number | null = customMax;

    if (limit === null && tenant.subscription_plan_id) {
      const plan = await this.subscriptionPlanRepository.findByPk(tenant.subscription_plan_id);
      limit = plan?.max_total_users ?? 200;
    } else if (limit === null) {
      limit = 200;
    }

    const currentCount = await this.userRepository.count({
      where: { tenant_id: tenantId, is_deleted: false },
    });

    if (currentCount >= limit) {
      throw new ForbiddenException(
        `User limit reached (${currentCount}/${limit}). Please contact your administrator to upgrade your plan.`,
      );
    }
  }

  // ── 2B: Invite user ─────────────────────────────────────────────────────
  async invite(
    tenantId: string,
    invitorId: string,
    dto: InviteUserDto,
  ): Promise<{ user: Partial<User>; magic_link: string; expires_at: Date }> {
    await this.checkUserLimit(tenantId);

    const existing = await this.userRepository.findOne({
      where: { email: dto.email, is_deleted: false },
    });
    if (existing) {
      if (!existing.is_active) {
        // Resend: regenerate magic link for pending (inactive) invited user
        await this.magicLinkRepository.update(
          { is_used: true },
          { where: { user_id: existing.id, is_used: false } },
        );
        const rawToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = await bcrypt.hash(rawToken, 10);
        const expires_at = new Date(Date.now() + 48 * 60 * 60 * 1000);
        await this.magicLinkRepository.create({
          user_id: existing.id,
          token_hash: tokenHash,
          purpose: 'user_onboarding' as any,
          is_used: false,
          expires_at,
          created_by: invitorId,
        });
        const frontendBase = process.env.FRONTEND_URL || 'http://localhost:5173';
        return {
          user: { id: existing.id, email: existing.email, first_name: existing.first_name, last_name: existing.last_name },
          magic_link: `${frontendBase}/auth/magic?token=${rawToken}`,
          expires_at,
        };
      }
      throw new ConflictException('User with this email already exists');
    }

    const user = await this.userRepository.create({
      tenant_id: tenantId,
      email: dto.email,
      password_hash: null,
      first_name: dto.first_name,
      last_name: dto.last_name,
      is_active: false,
    } as any);

    await this.userRoleRepository.create({ user_id: user.id, role_id: dto.role_id });

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = await bcrypt.hash(rawToken, 10);
    const expires_at = new Date(Date.now() + 48 * 60 * 60 * 1000);

    await this.magicLinkRepository.create({
      user_id: user.id,
      token_hash: tokenHash,
      purpose: 'user_onboarding' as any,
      is_used: false,
      expires_at,
      created_by: invitorId,
    });

    const frontendBase = process.env.FRONTEND_URL || 'http://localhost:5173';
    const magic_link = `${frontendBase}/auth/magic?token=${rawToken}`;

    return {
      user: { id: user.id, email: user.email, first_name: user.first_name, last_name: user.last_name },
      magic_link,
      expires_at,
    };
  }

  // ── 3B: Company admin usage summary ────────────────────────────────────
  async getUsageSummary(tenantId: string) {
    const tenant = await this.tenantRepository.findByPk(tenantId);
    if (!tenant) throw new NotFoundException('Tenant not found');

    let plan = null;
    if (tenant.subscription_plan_id) {
      plan = await this.subscriptionPlanRepository.findByPk(tenant.subscription_plan_id);
    }

    const customMax = (tenant.custom_limits as Record<string, number | null> | null)?.max_total_users ?? null;
    const limit: number | null = customMax ?? plan?.max_total_users ?? 200;

    const current = await this.userRepository.count({
      where: { tenant_id: tenantId, is_deleted: false },
    });

    return {
      plan_name: plan?.name ?? (tenant.subscription_plan || 'Unknown'),
      subscription_status: tenant.subscription_status,
      subscription_end: tenant.subscription_end,
      usage: { total_users: { current, limit } },
    };
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id, is_deleted: false },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await user.update(dto);

    const { password_hash, password_reset_token, password_reset_expires, ...result } =
      user.toJSON();
    return result as User;
  }

  async softDelete(id: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id, is_deleted: false },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    await user.update({ is_deleted: true, is_active: false });
  }

  async activate(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    await user.update({ is_active: true });
    return user;
  }

  async deactivate(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    await user.update({ is_active: false });
    return user;
  }

  async updateAvatar(id: string, avatarUrl: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id, is_deleted: false },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    await user.update({ avatar_url: avatarUrl });
    return user;
  }

  async incrementFailedAttempts(userId: string): Promise<void> {
    const user = await this.userRepository.findByPk(userId);
    if (user) {
      await user.update({
        failed_login_attempts: user.failed_login_attempts + 1,
      });
    }
  }

  async resetFailedAttempts(userId: string): Promise<void> {
    await this.userRepository.update(
      { failed_login_attempts: 0, locked_until: null },
      { where: { id: userId } },
    );
  }

  async lockAccount(userId: string, lockDurationMinutes: number): Promise<void> {
    const lockedUntil = new Date();
    lockedUntil.setMinutes(lockedUntil.getMinutes() + lockDurationMinutes);
    await this.userRepository.update(
      { locked_until: lockedUntil },
      { where: { id: userId } },
    );
  }

  async updateLastLogin(userId: string): Promise<void> {
    await this.userRepository.update(
      { last_login_at: new Date() },
      { where: { id: userId } },
    );
  }

  async updatePassword(userId: string, newPasswordHash: string): Promise<void> {
    await this.userRepository.update(
      {
        password_hash: newPasswordHash,
        password_changed_at: new Date(),
        password_reset_token: null,
        password_reset_expires: null,
      },
      { where: { id: userId } },
    );
  }

  async setPasswordResetToken(userId: string, token: string, expires: Date): Promise<void> {
    await this.userRepository.update(
      { password_reset_token: token, password_reset_expires: expires },
      { where: { id: userId } },
    );
  }

  async findByResetToken(token: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: {
        password_reset_token: token,
        password_reset_expires: { [Op.gt]: new Date() },
        is_deleted: false,
      },
    });
  }
}
