import {
  Injectable,
  Inject,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { Op } from 'sequelize';
import { REPOSITORY } from '../shared/constants/keynames';
import { MagicLink } from './magic_links.entity';
import { User } from '../USERS/users.entity';
import { LoginSession } from '../LOGIN_SESSIONS/login_sessions.entity';
import { Role } from '../ROLES/roles.entity';
import { AppConfigService } from '../shared/config/config.service';
import { JwtPayload } from '../shared/interfaces/jwt-payload.interface';
import { GenerateMagicLinkDto, CompleteOnboardingDto } from './dto/magic_links.dto';

const EXPIRY_MINUTES: Record<string, number> = {
  super_admin_access: 15,
  admin_onboarding: 30 * 24 * 60,  // 30 days — valid until admin completes setup
  user_access: 15,
  user_onboarding: 30 * 24 * 60,   // 30 days — valid until user accepts or resend replaces it
};

const RATE_LIMIT_PER_HOUR = 5;

@Injectable()
export class MagicLinksService {
  constructor(
    @Inject(REPOSITORY.MAGIC_LINKS)
    private readonly magicLinkRepository: typeof MagicLink,
    @Inject(REPOSITORY.USERS)
    private readonly userRepository: typeof User,
    @Inject(REPOSITORY.LOGIN_SESSIONS)
    private readonly loginSessionRepository: typeof LoginSession,
    private readonly jwtService: JwtService,
    private readonly configService: AppConfigService,
  ) {}

  async generateLink(
    generatorUser: { id: string; tenant_id: string | null; is_super_admin: boolean; primary_role: string | null },
    dto: GenerateMagicLinkDto,
  ): Promise<{ link: string; expires_at: Date; purpose: string }> {
    await this.checkPermissions(generatorUser, dto.target_user_id, dto.purpose);
    await this.checkRateLimit(generatorUser.id);

    // Invalidate any previous unused tokens for same user+purpose
    await this.magicLinkRepository.update(
      { is_used: true },
      {
        where: {
          user_id: dto.target_user_id,
          purpose: dto.purpose,
          is_used: false,
        },
      },
    );

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = await bcrypt.hash(rawToken, 10);

    const expiryMs = EXPIRY_MINUTES[dto.purpose] * 60 * 1000;
    const expires_at = new Date(Date.now() + expiryMs);

    await this.magicLinkRepository.create({
      user_id: dto.target_user_id,
      token_hash: tokenHash,
      purpose: dto.purpose,
      is_used: false,
      expires_at,
      created_by: generatorUser.id,
    });

    const frontendBase = process.env.FRONTEND_URL || 'http://localhost:5173';
    const link = `${frontendBase}/auth/magic?token=${rawToken}`;

    return { link, expires_at, purpose: dto.purpose };
  }

  async validateAndConsume(
    rawToken: string,
    ip: string,
    userAgent: string,
  ): Promise<{ access_token: string; refresh_token: string; user: Record<string, unknown>; purpose: string }> {
    // Fetch all unexpired, unused records (we must bcrypt.compare each)
    // To avoid a full table scan, we limit to recent records
    const candidates = await this.magicLinkRepository.findAll({
      where: {
        is_used: false,
        expires_at: { [Op.gt]: new Date() },
      },
      order: [['created_at', 'DESC']],
      limit: 100,
    });

    let matched: MagicLink | null = null;
    for (const record of candidates) {
      const ok = await bcrypt.compare(rawToken, record.token_hash);
      if (ok) {
        matched = record;
        break;
      }
    }

    if (!matched) {
      // Secondary scan of recently expired/used records to give a more helpful error message.
      // Limited to 30 records to avoid excessive bcrypt work on the error path.
      const recentExpiredOrUsed = await this.magicLinkRepository.findAll({
        where: {
          [Op.or]: [
            { is_used: true },
            { expires_at: { [Op.lte]: new Date() } },
          ],
        },
        order: [['created_at', 'DESC']],
        limit: 30,
      });

      for (const record of recentExpiredOrUsed) {
        const ok = await bcrypt.compare(rawToken, record.token_hash);
        if (ok) {
          if (record.is_used) {
            throw new UnauthorizedException('This link has already been used. Please contact your administrator for a new link.');
          }
          throw new UnauthorizedException('This link has expired. Please contact your administrator for a new link.');
        }
      }

      throw new UnauthorizedException('Invalid link. Please check the URL and try again.');
    }

    // Mark as used (atomic-ish: re-fetch and check)
    const [updatedCount] = await this.magicLinkRepository.update(
      { is_used: true },
      { where: { id: matched.id, is_used: false } },
    );

    if (updatedCount === 0) {
      throw new UnauthorizedException('Link expired or already used');
    }

    const user = await this.userRepository.findOne({
      where: { id: matched.user_id, is_deleted: false },
      include: [{ model: Role, through: { attributes: [] } }],
    });

    if (!user) {
      throw new UnauthorizedException('User account not found or has been deleted. Please contact your administrator.');
    }

    // Activate invited users on first magic link use
    if (!user.is_active) {
      await user.update({ is_active: true });
    }

    return this.issueTokensForUser(user, matched.purpose, ip, userAgent);
  }

  async completeOnboarding(userId: string, dto: CompleteOnboardingDto): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId, is_deleted: false },
    });

    if (!user) throw new NotFoundException('User not found');

    if (
      !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])/.test(
        dto.new_password,
      )
    ) {
      throw new BadRequestException(
        'Password must contain uppercase, lowercase, number, and special character',
      );
    }

    const passwordHash = await bcrypt.hash(dto.new_password, 12);
    await user.update({
      first_name: dto.first_name,
      last_name: dto.last_name,
      password_hash: passwordHash,
      ...(dto.phone ? { phone: dto.phone } : {}),
      onboarding_completed: true,
    });
  }

  private async checkPermissions(
    generator: { id: string; tenant_id: string | null; is_super_admin: boolean; primary_role: string | null },
    targetUserId: string,
    purpose: string,
  ): Promise<void> {
    const target = await this.userRepository.findOne({
      where: { id: targetUserId, is_deleted: false },
    });

    if (!target) throw new NotFoundException('Target user not found');

    if (generator.is_super_admin) {
      // Super admin can generate:
      // - super_admin_access for other super admins
      // - admin_onboarding for any company admin (tenant_id not null, is_super_admin false)
      if (purpose === 'super_admin_access') {
        if (!target.is_super_admin) {
          throw new ForbiddenException('super_admin_access links can only target super admins');
        }
      } else if (purpose === 'admin_onboarding') {
        if (target.is_super_admin || !target.tenant_id) {
          throw new ForbiddenException('admin_onboarding links can only target company admins');
        }
      } else {
        throw new ForbiddenException('Super admins can only generate super_admin_access or admin_onboarding links');
      }
      return;
    }

    // Company admin: can generate user_access or user_onboarding for their own tenant's non-admin users
    const primaryRole = generator.primary_role?.toLowerCase() ?? '';
    if (primaryRole !== 'admin') {
      throw new ForbiddenException('Only admins can generate magic links');
    }

    if (purpose !== 'user_access' && purpose !== 'user_onboarding') {
      throw new ForbiddenException('Company admins can only generate user_access or user_onboarding links');
    }

    if (target.tenant_id !== generator.tenant_id) {
      throw new ForbiddenException('Cannot generate links for users outside your tenant');
    }

    // Check target is not an admin
    const targetWithRoles = await this.userRepository.findOne({
      where: { id: targetUserId, is_deleted: false },
      include: [{ model: Role, through: { attributes: [] } }],
    });

    if (targetWithRoles?.is_super_admin) {
      throw new ForbiddenException('Cannot generate links for super admins');
    }

    const targetRoles = (targetWithRoles?.roles as Role[]) || [];
    const isTargetAdmin = targetRoles.some((r) => r.name.toLowerCase() === 'admin');
    if (isTargetAdmin) {
      throw new ForbiddenException('Cannot generate magic links for admin users');
    }
  }

  private async checkRateLimit(generatorId: string): Promise<void> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const count = await this.magicLinkRepository.count({
      where: {
        created_by: generatorId,
        created_at: { [Op.gte]: oneHourAgo },
      },
    });

    if (count >= RATE_LIMIT_PER_HOUR) {
      throw new ForbiddenException('Rate limit exceeded. Maximum 5 magic links per hour.');
    }
  }

  private async issueTokensForUser(
    user: User,
    purpose: string,
    ip: string,
    userAgent: string,
  ): Promise<{ access_token: string; refresh_token: string; user: Record<string, unknown>; purpose: string }> {
    const roles = (user.roles as Role[]) || [];
    const roleNames = roles.map((r: Role) => r.name);

    const sessionId = uuidv4();
    const refreshToken = uuidv4();
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.loginSessionRepository.create({
      id: sessionId,
      user_id: user.id,
      refresh_token_hash: refreshTokenHash,
      device_name: 'Magic Link',
      device_type: 'web',
      ip_address: ip,
      user_agent: userAgent,
      is_active: true,
      last_activity_at: new Date(),
      expires_at: expiresAt,
    });

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      tenant_id: user.tenant_id ?? null,
      session_id: sessionId,
      is_super_admin: user.is_super_admin ?? false,
      primary_role: roleNames[0] ?? null,
    };

    const access_token = this.jwtService.sign(payload);
    const refresh_token = this.jwtService.sign(
      { sub: user.id, session_id: sessionId, refresh_token: refreshToken },
      {
        secret: this.configService.jwtRefreshSecret,
        expiresIn: this.configService.jwtRefreshExpiresIn,
      },
    );

    const { password_hash: _ph, password_reset_token: _prt, password_reset_expires: _pre, ...safeUser } =
      user.toJSON() as Record<string, unknown>;

    return {
      access_token,
      refresh_token,
      user: { ...safeUser, roles: roleNames },
      purpose,
    };
  }
}
