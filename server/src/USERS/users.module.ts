import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { usersProviders } from './users.provider';
import { TenantsModule } from '../TENANTS/tenants.module';
import { SubscriptionPlansModule } from '../SUBSCRIPTION_PLANS/subscription_plans.module';
import { UserRolesModule } from '../USER_ROLES/user_roles.module';
import { REPOSITORY } from '../shared/constants/keynames';
import { MagicLink } from '../MAGIC_LINKS/magic_links.entity';

@Module({
  imports: [TenantsModule, SubscriptionPlansModule, UserRolesModule],
  controllers: [UsersController],
  providers: [
    UsersService,
    ...usersProviders,
    { provide: REPOSITORY.MAGIC_LINKS, useValue: MagicLink },
  ],
  exports: [UsersService, ...usersProviders],
})
export class UsersModule {}
