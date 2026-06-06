import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { AppConfigService } from '../../shared/config/config.service';
import { JwtPayload } from '../../shared/interfaces/jwt-payload.interface';
import { REPOSITORY } from '../../shared/constants/keynames';
import { LoginSession } from '../../LOGIN_SESSIONS/login_sessions.entity';
import { User } from '../../USERS/users.entity';
import { Role } from '../../ROLES/roles.entity';
import { Permission } from '../../PERMISSIONS/permissions.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: AppConfigService,
    @Inject(REPOSITORY.LOGIN_SESSIONS)
    private readonly loginSessionRepository: typeof LoginSession,
    @Inject(REPOSITORY.USERS)
    private readonly userRepository: typeof User,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(), // Check Authorization header first
        (request: Request) => {
          // Then check cookies
          return request?.cookies?.access_token;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.jwtSecret,
      passReqToCallback: false,
    });
  }

  async validate(payload: JwtPayload) {
    if (!payload.sub || !payload.email) {
      throw new UnauthorizedException('Invalid token payload');
    }

    // Verify the session is still active in the database
    if (payload.session_id) {
      try {
        const session = await this.loginSessionRepository.findOne({
          where: { id: payload.session_id, is_active: true },
          attributes: ['id'],
        });

        if (!session) {
          throw new UnauthorizedException('Session has been terminated');
        }
      } catch (error) {
        // If database timeout or connection error, log but allow request to proceed
        // The JWT token itself is still valid
        if (error.name === 'SequelizeConnectionError' ||
            error.name === 'SequelizeConnectionRefusedError' ||
            error.name === 'SequelizeTimeoutError' ||
            error.message?.includes('ETIMEDOUT')) {
          console.warn(`[JWT Strategy] Database connection issue during session validation: ${error.message}`);
          // Allow the request to proceed with JWT validation only
        } else if (error instanceof UnauthorizedException) {
          // Re-throw authorization errors
          throw error;
        } else {
          // Log unexpected errors but allow request to proceed
          console.error(`[JWT Strategy] Unexpected error during session validation:`, error);
        }
      }
    }

    // Roles and permissions are no longer in JWT to reduce cookie size
    // Fetch them from the database during validation
    let roles: string[] = [];
    let permissions: string[] = [];

    try {
      const user = await this.userRepository.findOne({
        where: { id: payload.sub, is_deleted: false },
        include: [
          {
            model: Role,
            through: { attributes: [] },
            include: [
              {
                model: Permission,
                through: { attributes: [] },
              },
            ],
          },
        ],
      });

      if (user && user.roles) {
        roles = user.roles.map((role: any) => role.name).filter(Boolean);

        const permissionSet = new Set<string>();
        user.roles.forEach((role: any) => {
          if (role.permissions && Array.isArray(role.permissions)) {
            role.permissions.forEach((perm: any) => {
              if (perm.name) {
                permissionSet.add(perm.name);
              }
            });
          }
        });
        permissions = Array.from(permissionSet);
      }
    } catch (error) {
      // If database error, log but allow request with empty roles/permissions
      console.warn(`[JWT Strategy] Error fetching user roles/permissions: ${error.message}`);
    }

    return {
      id: payload.sub,
      email: payload.email,
      tenant_id: payload.tenant_id,
      session_id: payload.session_id,
      is_super_admin: payload.is_super_admin ?? false,
      primary_role: payload.primary_role ?? null,
      roles,
      permissions,
    };
  }
}
