import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { Op } from 'sequelize';
import { REPOSITORY } from '../shared/constants/keynames';
import { RolePermission } from './role_permission.entity';
import { Permission } from '../PERMISSIONS/permissions.entity';
import { Role } from '../ROLES/roles.entity';

@Injectable()
export class RolePermissionService {
  constructor(
    @Inject(REPOSITORY.ROLE_PERMISSION)
    private readonly rolePermissionRepository: typeof RolePermission,
    @Inject(REPOSITORY.PERMISSIONS)
    private readonly permissionRepository: typeof Permission,
    @Inject(REPOSITORY.ROLES)
    private readonly roleRepository: typeof Role,
  ) {}

  async assignPermissionToRole(roleId: string, permissionId: string): Promise<RolePermission> {
    // Validate role exists
    const role = await this.roleRepository.findByPk(roleId);
    if (!role) {
      throw new BadRequestException('Role not found');
    }

    // Validate permission exists
    const permission = await this.permissionRepository.findByPk(permissionId);
    if (!permission) {
      throw new BadRequestException('Permission not found');
    }

    // Check if mapping already exists
    const existing = await this.rolePermissionRepository.findOne({
      where: { role_id: roleId, permission_id: permissionId },
    });
    if (existing) {
      return existing;
    }

    // Create mapping
    return this.rolePermissionRepository.create({
      role_id: roleId,
      permission_id: permissionId,
    });
  }

  async assignPermissionsToRole(roleId: string, permissionIds: string[]): Promise<RolePermission[]> {
    // Validate role exists
    const role = await this.roleRepository.findByPk(roleId);
    if (!role) {
      throw new BadRequestException('Role not found');
    }

    // Validate all permissions exist
    const permissions = await this.permissionRepository.findAll({
      where: { id: { [Op.in]: permissionIds } },
    });
    if (permissions.length !== permissionIds.length) {
      throw new BadRequestException('One or more permission IDs are invalid');
    }

    const results: RolePermission[] = [];
    for (const permissionId of permissionIds) {
      const mapping = await this.assignPermissionToRole(roleId, permissionId);
      results.push(mapping);
    }
    return results;
  }

  async removePermissionFromRole(roleId: string, permissionId: string): Promise<void> {
    await this.rolePermissionRepository.destroy({
      where: { role_id: roleId, permission_id: permissionId },
    });
  }

  async removePermissionsFromRole(roleId: string, permissionIds: string[]): Promise<void> {
    await this.rolePermissionRepository.destroy({
      where: {
        role_id: roleId,
        permission_id: { [Op.in]: permissionIds },
      },
    });
  }

  async removeAllPermissionsFromRole(roleId: string): Promise<void> {
    await this.rolePermissionRepository.destroy({
      where: { role_id: roleId },
    });
  }

  async getPermissionsForRole(roleId: string): Promise<Permission[]> {
    const mappings = await this.rolePermissionRepository.findAll({
      where: { role_id: roleId },
      include: [Permission],
    });
    return mappings.map((m) => (m as any).permission).filter(Boolean);
  }

  async getRolesForPermission(permissionId: string): Promise<Role[]> {
    const mappings = await this.rolePermissionRepository.findAll({
      where: { permission_id: permissionId },
      include: [Role],
    });
    return mappings.map((m) => (m as any).role).filter(Boolean);
  }

  async hasPermission(roleId: string, permissionId: string): Promise<boolean> {
    const mapping = await this.rolePermissionRepository.findOne({
      where: { role_id: roleId, permission_id: permissionId },
    });
    return !!mapping;
  }

  async replaceRolePermissions(roleId: string, permissionIds: string[]): Promise<RolePermission[]> {
    // Remove all existing permissions
    await this.removeAllPermissionsFromRole(roleId);

    // Assign new permissions
    if (permissionIds.length > 0) {
      return this.assignPermissionsToRole(roleId, permissionIds);
    }
    return [];
  }
}
