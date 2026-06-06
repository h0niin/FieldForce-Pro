import { Module } from '@nestjs/common';
import { RolesService } from './roles.service';
import { RolesController } from './roles.controller';
import { rolesProviders } from './roles.provider';
import { permissionsProviders } from '../PERMISSIONS/permissions.provider';
import { rolePermissionProviders } from '../ROLE_PERMISSION/role_permission.provider';

@Module({
  controllers: [RolesController],
  providers: [
    RolesService,
    ...rolesProviders,
    ...permissionsProviders,
    ...rolePermissionProviders,
  ],
  exports: [RolesService, ...rolesProviders],
})
export class RolesModule {}
