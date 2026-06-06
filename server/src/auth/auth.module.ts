import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { UsersModule } from '../USERS/users.module';
import { TenantsModule } from '../TENANTS/tenants.module';
import { UserRolesModule } from '../USER_ROLES/user_roles.module';
import { LoginSessionsModule } from '../LOGIN_SESSIONS/login_sessions.module';
import { REPOSITORY } from '../shared/constants/keynames';
import { Role } from '../ROLES/roles.entity';
import { Permission } from '../PERMISSIONS/permissions.entity';
import { RolePermission } from '../ROLE_PERMISSION/role_permission.entity';
import { SubscriptionPlan } from '../SUBSCRIPTION_PLANS/subscription_plans.entity';
import { MFAModule } from '../MFA/mfa.module';
import { SuperAdminModule } from '../SUPER_ADMIN/super_admin.module';

const roleProviders = [
  { provide: REPOSITORY.ROLES, useValue: Role },
  { provide: REPOSITORY.PERMISSIONS, useValue: Permission },
  { provide: REPOSITORY.ROLE_PERMISSION, useValue: RolePermission },
  { provide: REPOSITORY.SUBSCRIPTION_PLANS, useValue: SubscriptionPlan },
];

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    UsersModule,
    TenantsModule,
    UserRolesModule,
    LoginSessionsModule,
    MFAModule,
    SuperAdminModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, LocalStrategy, ...roleProviders],
  exports: [AuthService, ...roleProviders],
})
export class AuthModule {}
