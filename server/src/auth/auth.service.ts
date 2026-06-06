import {
  Injectable,
  Inject,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Op } from 'sequelize';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { REPOSITORY } from '../shared/constants/keynames';
import { AppConfigService } from '../shared/config/config.service';
import { JwtPayload } from '../shared/interfaces/jwt-payload.interface';
import { User } from '../USERS/users.entity';
import { Tenant } from '../TENANTS/tenants.entity';
import { Role } from '../ROLES/roles.entity';
import { Permission } from '../PERMISSIONS/permissions.entity';
import { RolePermission } from '../ROLE_PERMISSION/role_permission.entity';
import { UserRole } from '../USER_ROLES/user_roles.entity';
import { LoginSession } from '../LOGIN_SESSIONS/login_sessions.entity';
import { SubscriptionPlan } from '../SUBSCRIPTION_PLANS/subscription_plans.entity';
import { UsersService } from '../USERS/users.service';
import { TenantsService } from '../TENANTS/tenants.service';
import { UserRolesService } from '../USER_ROLES/user_roles.service';
import {
  RegisterDto,
  LoginDto,
  RefreshTokenDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ChangePasswordDto,
  VerifyMFALoginDto,
  RequestMagicLinkDto,
  RegisterMagicLinkDto,
  VerifyMagicLinkDto,
} from './dto/auth.dto';
import { MFAService } from '../MFA/mfa.service';
import { EmailService } from '../shared/services/email.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: AppConfigService,
    private readonly usersService: UsersService,
    private readonly tenantsService: TenantsService,
    private readonly userRolesService: UserRolesService,
    private readonly mfaService: MFAService,
    private readonly emailService: EmailService,
    @Inject(REPOSITORY.LOGIN_SESSIONS)
    private readonly loginSessionRepository: typeof LoginSession,
    @Inject(REPOSITORY.ROLES)
    private readonly roleRepository: typeof Role,
    @Inject(REPOSITORY.PERMISSIONS)
    private readonly permissionRepository: typeof Permission,
    @Inject(REPOSITORY.ROLE_PERMISSION)
    private readonly rolePermissionRepository: typeof RolePermission,
    @Inject(REPOSITORY.SUBSCRIPTION_PLANS)
    private readonly subscriptionPlanRepository: typeof SubscriptionPlan,
  ) { }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      return null;
    }

    // Check if account is locked
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      throw new UnauthorizedException(
        'Account is temporarily locked due to too many failed login attempts. Please try again later.',
      );
    }

    // Check if account is active
    if (!user.is_active) {
      throw new UnauthorizedException('Account is deactivated. Please contact your administrator.');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      // Increment failed attempts
      await this.usersService.incrementFailedAttempts(user.id);

      const newAttempts = user.failed_login_attempts + 1;
      if (newAttempts >= this.configService.maxFailedLoginAttempts) {
        await this.usersService.lockAccount(
          user.id,
          this.configService.accountLockDurationMinutes,
        );
        throw new UnauthorizedException(
          'Account locked due to too many failed login attempts. Please try again later.',
        );
      }

      return null;
    }

    // Reset failed attempts on successful login
    if (user.failed_login_attempts > 0) {
      await this.usersService.resetFailedAttempts(user.id);
    }

    return user;
  }

  async register(dto: RegisterDto, ip: string, userAgent: string) {
    // Check if user already exists
    const existingUser = await this.usersService.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Resolve subscription plan (default: Basic)
    const planSlug = dto.plan_slug ?? 'basic';
    const planNameMap: Record<string, string> = {
      basic: 'Basic',
      professional: 'Professional',
      enterprise: 'Enterprise',
    };
    const planName = planNameMap[planSlug] ?? 'Basic';
    const plan = await this.subscriptionPlanRepository.findOne({ where: { name: planName } });

    // Create tenant
    const tenant = await this.tenantsService.create({ name: dto.company_name });

    // Wire up subscription: 15-day free trial
    const now = new Date();
    const trialEnd = new Date(now);
    trialEnd.setDate(trialEnd.getDate() + 15);

    await tenant.update({
      subscription_plan: planName,
      subscription_plan_id: plan?.id ?? null,
      subscription_status: 'trial',
      subscription_start: now,
      subscription_end: trialEnd,
      max_users: plan?.max_total_users ?? 10,
    });

    // Create user
    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await User.create({
      tenant_id: tenant.id,
      email: dto.email,
      password_hash: passwordHash,
      first_name: dto.first_name,
      last_name: dto.last_name,
      phone: dto.phone,
    });

    // Create default admin role for tenant
    const adminRole = await this.roleRepository.create({
      tenant_id: tenant.id,
      name: 'Admin',
      description: 'Full system administrator',
      is_system: true,
    });

    // Assign ALL existing permissions to the Admin role
    const allPermissions = await this.permissionRepository.findAll();
    for (const permission of allPermissions) {
      await this.rolePermissionRepository.create({
        role_id: adminRole.id,
        permission_id: permission.id,
      });
    }

    // Create default Technician role for tenant
    const technicianPermissionNames = new Set([
      'service_requests:read', 'work_orders:read', 'work_orders:update',
      'service_appointments:read', 'job_sheets:read', 'job_sheets:update',
      'timesheets:read', 'timesheets:create', 'timesheets:update',
      'trips:read', 'trips:create', 'dashboard:read', 'notifications:read',
      'documents:read', 'documents:create', 'contacts:read',
      'service_locations:read', 'parts_catalog:read', 'services_catalog:read',
      'scheduling:read', 'reviews:read', 'reviews:create',
      'agent_locations:read', 'agent_locations:update',
    ]);
    const technicianRole = await this.roleRepository.create({
      tenant_id: tenant.id,
      name: 'Technician',
      description: 'Field technician - performs on-site work orders',
      is_system: false,
    });
    for (const permission of allPermissions) {
      if (technicianPermissionNames.has(permission.name)) {
        await this.rolePermissionRepository.create({
          role_id: technicianRole.id,
          permission_id: permission.id,
        });
      }
    }

    // Create default Dispatcher role for tenant
    const dispatcherPermissionNames = new Set([
      'dashboard:read', 'notifications:read',
      'service_requests:read', 'service_requests:create', 'service_requests:update',
      'work_orders:read', 'work_orders:create', 'work_orders:update',
      'scheduling:read', 'scheduling:create', 'scheduling:update',
      'service_appointments:read', 'service_appointments:create', 'service_appointments:update',
      'estimates:read', 'estimates:create', 'estimates:update',
      'invoices:read', 'invoices:create', 'invoices:update',
      'contacts:read', 'companies:read', 'service_locations:read',
      'agent_locations:read',
      'work_order_line_items:read', 'work_order_line_items:create', 'work_order_line_items:update',
      'documents:read', 'documents:create',
      'reports:read',
    ]);
    const dispatcherRole = await this.roleRepository.create({
      tenant_id: tenant.id,
      name: 'Dispatcher',
      description: 'Dispatch coordinator - reviews service requests, assigns technicians, manages work orders',
      is_system: false,
    });
    for (const permission of allPermissions) {
      if (dispatcherPermissionNames.has(permission.name)) {
        await this.rolePermissionRepository.create({
          role_id: dispatcherRole.id,
          permission_id: permission.id,
        });
      }
    }

    // Assign admin role to user
    await this.userRolesService.assignRole(user.id, adminRole.id);

    // Auto-login: complete login process (same as successful login)
    const userWithRoles = await this.usersService.findById(user.id);
    const loginDto: LoginDto = {
      email: dto.email,
      password: '',
      device_type: 'web',
    };
    const session = await this.completeLogin(userWithRoles, loginDto, ip, userAgent);

    return {
      ...session,
      tenant: tenant.toJSON(),
    };
  }

  async login(user: User, loginDto: LoginDto, ip: string, userAgent: string) {
    // Check if MFA is enabled for this user
    if (user.mfa_enabled) {
      const mfaMethod = user.mfa_method || 'email';

      if (mfaMethod === 'email') {
        // Email MFA: generate code, send email, get token — all from one method
        const { mfa_token } = await this.mfaService.generateAndSendMFACode(user.id, user.tenant_id);
        return {
          mfa_required: true,
          mfa_token,
          mfa_method: mfaMethod,
        };
      }

      // TOTP MFA: no code to send, just generate a token
      const mfaToken = this.jwtService.sign(
        { sub: user.id, tenant_id: user.tenant_id, type: 'mfa' },
        { expiresIn: '10m' },
      );
      return {
        mfa_required: true,
        mfa_token: mfaToken,
        mfa_method: mfaMethod,
      };
    }

    return this.completeLogin(user, loginDto, ip, userAgent);
  }

  async verifyMFALogin(dto: VerifyMFALoginDto, ip: string, userAgent: string) {
    // Single token verification for both email and TOTP login
    const decoded = this.mfaService.verifyMFAToken(dto.mfa_token);

    const user = await this.usersService.findByIdWithPassword(decoded.sub);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Check if this is a recovery code (format: XXXX-XXXX)
    const isRecoveryCode = /^[A-Za-z0-9]{4}-[A-Za-z0-9]{4}$/.test(dto.code.trim());

    let valid: boolean;

    if (isRecoveryCode) {
      valid = await this.mfaService.verifyRecoveryCode(user.id, dto.code);
    } else {
      // Verify based on the user's configured MFA method
      const mfaMethod = user.mfa_method || 'email';
      if (mfaMethod === 'totp') {
        valid = await this.mfaService.verifyTOTP(user.id, dto.code);
      } else {
        valid = await this.mfaService.verifyMFACode(user.id, dto.code);
      }
    }

    if (!valid) {
      throw new BadRequestException('Invalid verification code');
    }

    const loginDto: LoginDto = {
      email: user.email,
      password: '',
      device_name: dto.device_name,
      device_type: dto.device_type,
    };

    return this.completeLogin(user, loginDto, ip, userAgent);
  }

  async requestMagicLink(dto: RequestMagicLinkDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      // Return generic success to prevent email enumeration
      return { message: 'If an account exists, a magic link has been sent to your email.' };
    }

    if (!user.is_active) {
      throw new UnauthorizedException('Account is deactivated. Please contact your administrator.');
    }

    const token = uuidv4();
    const tokenHash = await bcrypt.hash(token, 10);
    const expires = new Date();
    expires.setMinutes(expires.getMinutes() + 15); // 15 mins expiry

    await user.update({
      magic_link_token: tokenHash,
      magic_link_expires: expires,
    });

    const userName = user.first_name || 'User';
    await this.emailService.sendMagicLinkEmail(user.email, userName, token);

    return { message: 'If an account exists, a magic link has been sent to your email.' };
  }

  async requestMagicLinkRegister(dto: RegisterMagicLinkDto) {
    const existingUser = await this.usersService.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Create tenant
    const tenant = await this.tenantsService.create({ name: dto.company_name });

    // Create user (inactive until they click the link, optional but good practice, keeping it active for simplicity based on original flow)
    const user = await User.create({
      tenant_id: tenant.id,
      email: dto.email,
      password_hash: null, // No password for magic link
      first_name: dto.first_name,
      last_name: dto.last_name,
      phone: dto.phone,
    });

    // Create default admin role for tenant
    const adminRole = await this.roleRepository.create({
      tenant_id: tenant.id,
      name: 'Admin',
      description: 'Full system administrator',
      is_system: true,
    });

    // Assign ALL existing permissions to the Admin role
    const allPermissions = await this.permissionRepository.findAll();
    for (const permission of allPermissions) {
      await this.rolePermissionRepository.create({
        role_id: adminRole.id,
        permission_id: permission.id,
      });
    }

    // Create default Technician role for tenant
    const technicianPermissionNames = new Set([
      'service_requests:read', 'work_orders:read', 'work_orders:update',
      'service_appointments:read', 'job_sheets:read', 'job_sheets:update',
      'timesheets:read', 'timesheets:create', 'timesheets:update',
      'trips:read', 'trips:create', 'dashboard:read', 'notifications:read',
      'documents:read', 'documents:create', 'contacts:read',
      'service_locations:read', 'parts_catalog:read', 'services_catalog:read',
      'scheduling:read', 'reviews:read', 'reviews:create',
      'agent_locations:read', 'agent_locations:update',
    ]);
    const technicianRole = await this.roleRepository.create({
      tenant_id: tenant.id,
      name: 'Technician',
      description: 'Field technician - performs on-site work orders',
      is_system: false,
    });
    for (const permission of allPermissions) {
      if (technicianPermissionNames.has(permission.name)) {
        await this.rolePermissionRepository.create({
          role_id: technicianRole.id,
          permission_id: permission.id,
        });
      }
    }

    // Create default Dispatcher role for tenant
    const dispatcherPermissionNames = new Set([
      'dashboard:read', 'notifications:read',
      'service_requests:read', 'service_requests:create', 'service_requests:update',
      'work_orders:read', 'work_orders:create', 'work_orders:update',
      'scheduling:read', 'scheduling:create', 'scheduling:update',
      'service_appointments:read', 'service_appointments:create', 'service_appointments:update',
      'estimates:read', 'estimates:create', 'estimates:update',
      'invoices:read', 'invoices:create', 'invoices:update',
      'contacts:read', 'companies:read', 'service_locations:read',
      'agent_locations:read',
      'work_order_line_items:read', 'work_order_line_items:create', 'work_order_line_items:update',
      'documents:read', 'documents:create',
      'reports:read',
    ]);
    const dispatcherRole = await this.roleRepository.create({
      tenant_id: tenant.id,
      name: 'Dispatcher',
      description: 'Dispatch coordinator - reviews service requests, assigns technicians, manages work orders',
      is_system: false,
    });
    for (const permission of allPermissions) {
      if (dispatcherPermissionNames.has(permission.name)) {
        await this.rolePermissionRepository.create({
          role_id: dispatcherRole.id,
          permission_id: permission.id,
        });
      }
    }

    // Assign admin role to user
    await this.userRolesService.assignRole(user.id, adminRole.id);

    const token = uuidv4();
    const tokenHash = await bcrypt.hash(token, 10);
    const expires = new Date();
    expires.setMinutes(expires.getMinutes() + 15);

    await user.update({
      magic_link_token: tokenHash,
      magic_link_expires: expires,
    });

    const userName = user.first_name || 'User';
    await this.emailService.sendMagicLinkEmail(user.email, userName, token);

    return { message: 'A magic link has been sent to your email to complete registration.' };
  }

  async verifyMagicLink(dto: VerifyMagicLinkDto, ip: string, userAgent: string) {
    // Find users with non-expired magic link tokens and check bcrypt match
    const users = await User.findAll({
      where: {
        magic_link_token: { [require('sequelize').Op.ne]: null },
      },
    });

    let matchedUser: User | null = null;
    for (const user of users) {
      if (user.magic_link_token) {
        const isMatch = await bcrypt.compare(dto.token, user.magic_link_token);
        if (isMatch && user.magic_link_expires && new Date(user.magic_link_expires) > new Date()) {
          matchedUser = user;
          break;
        }
      }
    }

    if (!matchedUser) {
      throw new BadRequestException('Invalid or expired magic link');
    }

    if (!matchedUser.is_active) {
      throw new UnauthorizedException('Account is deactivated. Please contact your administrator.');
    }

    // Clear the token
    await matchedUser.update({
      magic_link_token: null,
      magic_link_expires: null,
    });

    const loginDto: LoginDto = {
      email: matchedUser.email,
      password: '',
      device_name: dto.device_name,
      device_type: dto.device_type,
    };

    return this.completeLogin(matchedUser, loginDto, ip, userAgent);
  }

  private async completeLogin(user: User, loginDto: LoginDto, ip: string, userAgent: string) {
    // Get user roles and permissions
    const userWithRoles = await this.usersService.findById(user.id);
    const roles = userWithRoles.roles || [];
    const roleNames = roles.map((r: Role) => r.name);

    const allPermissions: string[] = [];
    for (const role of roles) {
      if (role.permissions) {
        for (const perm of role.permissions) {
          if (!allPermissions.includes(perm.name)) {
            allPermissions.push(perm.name);
          }
        }
      }
    }

    // Create session
    const sessionId = uuidv4();
    const refreshToken = uuidv4();
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

    // Parse device info from user agent
    const deviceInfo = this.parseUserAgent(userAgent);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days refresh token expiry

    await this.loginSessionRepository.create({
      id: sessionId,
      user_id: user.id,
      refresh_token_hash: refreshTokenHash,
      device_name: loginDto.device_name || deviceInfo.browser,
      device_type: loginDto.device_type || 'web',
      ip_address: ip,
      user_agent: userAgent,
      os: deviceInfo.os,
      browser: deviceInfo.browser,
      is_active: true,
      last_activity_at: new Date(),
      expires_at: expiresAt,
    });

    // Update last login
    await this.usersService.updateLastLogin(user.id);

    // Generate tokens
    // Keep JWT payload minimal to avoid cookie size limits (4KB)
    // Roles and permissions are fetched via /auth/me endpoint instead
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      tenant_id: user.tenant_id ?? null,
      session_id: sessionId,
      is_super_admin: user.is_super_admin ?? false,
      primary_role: roleNames[0] ?? null,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshJwt = this.jwtService.sign(
      { sub: user.id, session_id: sessionId, refresh_token: refreshToken },
      {
        secret: this.configService.jwtRefreshSecret,
        expiresIn: this.configService.jwtRefreshExpiresIn,
      },
    );

    const { password_hash, password_reset_token, password_reset_expires, ...safeUser } =
      user.toJSON();

    return {
      access_token: accessToken,
      refresh_token: refreshJwt,
      user: { ...safeUser, roles: roleNames, permissions: allPermissions },
    };
  }

  async refreshTokens(dto: RefreshTokenDto) {
    // Ensure refresh token is provided
    if (!dto.refresh_token) {
      throw new UnauthorizedException('Refresh token is required');
    }

    // Verify the refresh JWT
    let decoded: { sub: string; session_id: string; refresh_token: string };
    try {
      decoded = this.jwtService.verify(dto.refresh_token, {
        secret: this.configService.jwtRefreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Find the session
    const session = await this.loginSessionRepository.findOne({
      where: { id: decoded.session_id, user_id: decoded.sub, is_active: true },
    });

    if (!session) {
      throw new UnauthorizedException('Session not found or has been terminated');
    }

    if (new Date(session.expires_at) < new Date()) {
      await session.update({ is_active: false });
      throw new UnauthorizedException('Session expired');
    }

    // Verify refresh token hash
    const isValidToken = await bcrypt.compare(decoded.refresh_token, session.refresh_token_hash);
    if (!isValidToken) {
      // Potential token reuse - invalidate session
      await session.update({ is_active: false });
      throw new UnauthorizedException('Invalid refresh token - session terminated for security');
    }

    // Rotate: Generate new refresh token
    const newRefreshToken = uuidv4();
    const newRefreshTokenHash = await bcrypt.hash(newRefreshToken, 10);

    await session.update({
      refresh_token_hash: newRefreshTokenHash,
      last_activity_at: new Date(),
    });

    // Get user with roles
    const user = await this.usersService.findById(decoded.sub);
    const roles = user.roles || [];
    const roleNames = roles.map((r: Role) => r.name);

    const allPermissions: string[] = [];
    for (const role of roles) {
      if (role.permissions) {
        for (const perm of role.permissions) {
          if (!allPermissions.includes(perm.name)) {
            allPermissions.push(perm.name);
          }
        }
      }
    }

    // Generate new access token
    // Keep JWT payload minimal to avoid cookie size limits (4KB)
    // Roles and permissions are fetched via /auth/me endpoint instead
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      tenant_id: user.tenant_id ?? null,
      session_id: session.id,
      is_super_admin: user.is_super_admin ?? false,
      primary_role: (roles[0] as Role)?.name ?? null,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshJwt = this.jwtService.sign(
      { sub: user.id, session_id: session.id, refresh_token: newRefreshToken },
      {
        secret: this.configService.jwtRefreshSecret,
        expiresIn: this.configService.jwtRefreshExpiresIn,
      },
    );

    return {
      access_token: accessToken,
      refresh_token: refreshJwt,
    };
  }

  async logout(userId: string, sessionId: string) {
    await this.loginSessionRepository.update(
      { is_active: false },
      { where: { id: sessionId, user_id: userId } },
    );

    // Clear push token so the device stops receiving notifications for this user
    await this.usersService.update(userId, { fcm_token: null } as any);

    return { message: 'Logged out successfully' };
  }

  async logoutAll(userId: string) {
    await this.loginSessionRepository.update(
      { is_active: false },
      { where: { user_id: userId, is_active: true } },
    );
    return { message: 'All sessions terminated successfully' };
  }

  async terminateSession(userId: string, sessionId: string) {
    const session = await this.loginSessionRepository.findOne({
      where: { id: sessionId, user_id: userId },
    });

    if (!session) {
      throw new BadRequestException('Session not found');
    }

    await session.update({ is_active: false });
    return { message: 'Session terminated successfully' };
  }

  async getActiveSessions(userId: string) {
    const sessions = await this.loginSessionRepository.findAll({
      where: { user_id: userId, is_active: true },
      attributes: [
        'id',
        'device_name',
        'device_type',
        'ip_address',
        'os',
        'browser',
        'location',
        'last_activity_at',
        'created_at',
      ],
      order: [['last_activity_at', 'DESC']],
    });
    return sessions;
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.usersService.findByEmail(dto.email);

    if (!user) {
      throw new BadRequestException('No account found with this email address');
    }

    const resetToken = uuidv4();
    const hashedToken = await bcrypt.hash(resetToken, 10);
    const expires = new Date();
    expires.setMinutes(
      expires.getMinutes() + this.configService.passwordResetTokenExpiresMinutes,
    );

    await this.usersService.setPasswordResetToken(user.id, hashedToken, expires);

    // Send password reset email
    const userName = user.first_name || 'User';
    await this.emailService.sendPasswordResetEmail(user.email, userName, resetToken);

    return { message: 'Password reset link has been sent to your email' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    // Find users with non-expired reset tokens and check bcrypt match
    const users = await User.findAll({
      where: {
        password_reset_token: { [require('sequelize').Op.ne]: null },
      },
    });

    let matchedUser: User | null = null;
    for (const user of users) {
      if (user.password_reset_token) {
        const isMatch = await bcrypt.compare(dto.token, user.password_reset_token);
        if (isMatch && user.password_reset_expires && new Date(user.password_reset_expires) > new Date()) {
          matchedUser = user;
          break;
        }
      }
    }

    if (!matchedUser) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const newPasswordHash = await bcrypt.hash(dto.new_password, 12);
    await this.usersService.updatePassword(matchedUser.id, newPasswordHash);

    // Invalidate all sessions for security
    await this.logoutAll(matchedUser.id);

    return { message: 'Password reset successfully. Please login with your new password.' };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.usersService.findByIdWithPassword(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const isOldPasswordValid = await bcrypt.compare(dto.old_password, user.password_hash);
    if (!isOldPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    const newPasswordHash = await bcrypt.hash(dto.new_password, 12);
    await this.usersService.updatePassword(userId, newPasswordHash);

    // Invalidate all sessions for security — forces re-login on all devices
    await this.logoutAll(userId);

    return { message: 'Password changed successfully. All sessions have been terminated.' };
  }

  async getMe(userId: string) {
    const user = await this.usersService.findById(userId);
    const roles = user.roles || [];
    const roleNames = roles.map((r: Role) => r.name);

    const allPermissions: string[] = [];
    for (const role of roles) {
      if (role.permissions) {
        for (const perm of role.permissions) {
          if (!allPermissions.includes(perm.name)) {
            allPermissions.push(perm.name);
          }
        }
      }
    }

    const userData = user.toJSON();
    const { password_hash, password_reset_token, password_reset_expires, ...safeUser } = userData;

    return {
      ...safeUser,
      roles: roleNames,
      permissions: allPermissions,
    };
  }

  async updateMe(userId: string, dto: Partial<typeof RegisterDto.prototype>) {
    return this.usersService.update(userId, dto as any);
  }

  private parseUserAgent(userAgent: string): { os: string; browser: string } {
    let os = 'Unknown';
    let browser = 'Unknown';

    if (!userAgent) return { os, browser };

    // OS detection
    if (userAgent.includes('Windows')) os = 'Windows';
    else if (userAgent.includes('Mac OS')) os = 'macOS';
    else if (userAgent.includes('Linux')) os = 'Linux';
    else if (userAgent.includes('Android')) os = 'Android';
    else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) os = 'iOS';

    // Browser detection
    if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Edg/')) browser = 'Edge';
    else if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Safari')) browser = 'Safari';
    else if (userAgent.includes('Opera') || userAgent.includes('OPR')) browser = 'Opera';

    return { os, browser };
  }

  /**
   * Runs every night at midnight.
   * Suspends any tenant whose trial period has ended
   * (subscription_status = 'trial' AND subscription_end < NOW()).
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async suspendExpiredTrials() {
    this.logger.log('[Cron] Checking for expired trial tenants...');
    try {
      const [affected] = await Tenant.update(
        { subscription_status: 'expired', is_active: false },
        {
          where: {
            subscription_status: 'trial',
            subscription_end: { [Op.lt]: new Date() },
          },
        },
      );
      if (affected > 0) {
        this.logger.log(`[Cron] Suspended ${affected} expired trial tenant(s).`);
      } else {
        this.logger.debug('[Cron] No expired trials found.');
      }
    } catch (err) {
      this.logger.error('[Cron] Failed to suspend expired trials', err);
    }
  }

  async listSubscriptionPlans() {
    return this.subscriptionPlanRepository.findAll({
      where: { is_active: true },
      order: [['price_monthly', 'ASC']],
      attributes: ['id', 'name', 'max_total_users', 'max_appointments_monthly', 'price_monthly', 'price_yearly', 'currency', 'features'],
    });
  }
}