import { Module } from '@nestjs/common';
import { RolePermissionService } from './role_permission.service';
import { rolePermissionProviders } from './role_permission.provider';
import { permissionsProviders } from '../PERMISSIONS/permissions.provider';
import { rolesProviders } from '../ROLES/roles.provider';

@Module({
  providers: [
    RolePermissionService,
    ...rolePermissionProviders,
    ...permissionsProviders,
    ...rolesProviders,
  ],
  exports: [RolePermissionService, ...rolePermissionProviders],
})
export class RolePermissionModule {}
