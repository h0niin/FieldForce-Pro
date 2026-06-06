import { Module } from '@nestjs/common';
import { UserRolesService } from './user_roles.service';
import { UserRolesController } from './user_roles.controller';
import { userRolesProviders } from './user_roles.provider';

@Module({
  controllers: [UserRolesController],
  providers: [UserRolesService, ...userRolesProviders],
  exports: [UserRolesService, ...userRolesProviders],
})
export class UserRolesModule {}
