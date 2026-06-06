import { Injectable, Inject } from '@nestjs/common';
import { REPOSITORY } from '../shared/constants/keynames';
import { UserRole } from './user_roles.entity';

@Injectable()
export class UserRolesService {
  constructor(
    @Inject(REPOSITORY.USER_ROLES)
    private readonly userRoleRepository: typeof UserRole,
  ) {}

  async assignRole(userId: string, roleId: string): Promise<UserRole> {
    const existing = await this.userRoleRepository.findOne({
      where: { user_id: userId, role_id: roleId },
    });
    if (existing) {
      return existing;
    }
    return this.userRoleRepository.create({ user_id: userId, role_id: roleId });
  }

  async assignRoles(userId: string, roleIds: string[]): Promise<UserRole[]> {
    // Get current roles
    const currentRoles = await this.userRoleRepository.findAll({
      where: { user_id: userId },
    });
    const currentRoleIds = currentRoles.map((ur) => ur.role_id);

    // Remove roles that are no longer in the new list
    const toRemove = currentRoleIds.filter((id) => !roleIds.includes(id));
    if (toRemove.length > 0) {
      await this.userRoleRepository.destroy({
        where: { user_id: userId, role_id: toRemove },
      });
    }

    // Add roles that are new
    const toAdd = roleIds.filter((id) => !currentRoleIds.includes(id));
    const results: UserRole[] = [];
    for (const roleId of toAdd) {
      const ur = await this.userRoleRepository.create({ user_id: userId, role_id: roleId });
      results.push(ur);
    }

    return results;
  }

  async unassignRole(userId: string, roleId: string): Promise<void> {
    await this.userRoleRepository.destroy({
      where: { user_id: userId, role_id: roleId },
    });
  }

  async unassignAllRoles(userId: string): Promise<void> {
    await this.userRoleRepository.destroy({ where: { user_id: userId } });
  }

  async getUserRoles(userId: string): Promise<UserRole[]> {
    return this.userRoleRepository.findAll({ where: { user_id: userId } });
  }
}
