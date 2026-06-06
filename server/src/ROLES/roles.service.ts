import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { Op } from 'sequelize';
import { REPOSITORY } from '../shared/constants/keynames';
import { Role } from './roles.entity';
import { Permission } from '../PERMISSIONS/permissions.entity';
import { RolePermission } from '../ROLE_PERMISSION/role_permission.entity';
import { UserRole } from '../USER_ROLES/user_roles.entity';
import { CreateRoleDto } from './dto/roles_create.dto';
import { UpdateRoleDto } from './dto/roles_update.dto';
import { PageOptionsDto } from '../shared/dto/page-options.dto';
import { PageMetaDto } from '../shared/dto/page-meta.dto';
import { PageDto } from '../shared/dto/page.dto';

@Injectable()
export class RolesService {
  constructor(
    @Inject(REPOSITORY.ROLES)
    private readonly roleRepository: typeof Role,
    @Inject(REPOSITORY.PERMISSIONS)
    private readonly permissionRepository: typeof Permission,
    @Inject(REPOSITORY.ROLE_PERMISSION)
    private readonly rolePermissionRepository: typeof RolePermission,
  ) {}

  async findAllPaginated(
    tenantId: string,
    pageOptionsDto: PageOptionsDto,
  ): Promise<PageDto<Role>> {
    const where: Record<string, unknown> = {
      tenant_id: tenantId,
    };

    if (pageOptionsDto.search) {
      where[Op.or as unknown as string] = [
        { name: { [Op.iLike]: `%${pageOptionsDto.search}%` } },
        { description: { [Op.iLike]: `%${pageOptionsDto.search}%` } },
      ];
    }

    const { count, rows } = await this.roleRepository.findAndCountAll({
      where,
      order: [['created_at', pageOptionsDto.order]],
      limit: pageOptionsDto.take,
      offset: pageOptionsDto.skip,
      distinct: true,
      include: [
        {
          model: Permission,
          through: { attributes: [] },
        },
      ],
    });

    const meta = new PageMetaDto({ pageOptionsDto, itemCount: count });
    return new PageDto(rows, meta);
  }

  async findAll(tenantId: string): Promise<Role[]> {
    return this.roleRepository.findAll({
      where: { tenant_id: tenantId },
      order: [['name', 'ASC']],
      include: [
        {
          model: Permission,
          through: { attributes: [] },
        },
      ],
    });
  }

  async findById(id: string, tenantId: string): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { id, tenant_id: tenantId },
      include: [
        {
          model: Permission,
          through: { attributes: [] },
        },
      ],
    });
    if (!role) {
      throw new NotFoundException('Role not found');
    }
    return role;
  }

  async findByName(name: string, tenantId: string): Promise<Role | null> {
    return this.roleRepository.findOne({
      where: { name, tenant_id: tenantId },
      include: [
        {
          model: Permission,
          through: { attributes: [] },
        },
      ],
    });
  }

  async create(tenantId: string, dto: CreateRoleDto): Promise<Role> {
    if (!tenantId) {
      throw new BadRequestException('Tenant context is required to create a role');
    }
    const existing = await this.roleRepository.findOne({
      where: { name: dto.name, tenant_id: tenantId },
    });
    if (existing) {
      throw new ConflictException('Role with this name already exists');
    }

    // Create the role
    const role = await this.roleRepository.create({
      tenant_id: tenantId,
      name: dto.name,
      description: dto.description,
      is_system: false,
    });

    // Assign permissions if provided
    if (dto.permission_ids && dto.permission_ids.length > 0) {
      await this.assignPermissions(role.id, dto.permission_ids);
    }

    // Return role with permissions
    return this.findById(role.id, tenantId);
  }

  async update(id: string, tenantId: string, dto: UpdateRoleDto): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { id, tenant_id: tenantId },
    });
    if (!role) {
      throw new NotFoundException('Role not found');
    }

    // Prevent modification of system role name and description, but allow permission updates
    if (role.is_system && (dto.name || dto.description)) {
      throw new BadRequestException('Cannot modify system role name or description');
    }

    // Check if name is being changed and if it conflicts
    if (dto.name && dto.name !== role.name) {
      const existing = await this.roleRepository.findOne({
        where: { name: dto.name, tenant_id: tenantId },
      });
      if (existing) {
        throw new ConflictException('Role with this name already exists');
      }
    }

    // Update basic fields (only for non-system roles)
    if (!role.is_system && (dto.name || dto.description)) {
      await role.update({
        name: dto.name,
        description: dto.description,
      });
    }

    // Update permissions if provided (allowed for both system and non-system roles)
    if (dto.permission_ids !== undefined) {
      // Remove all existing permissions
      await this.rolePermissionRepository.destroy({
        where: { role_id: role.id },
      });

      // Assign new permissions
      if (dto.permission_ids.length > 0) {
        await this.assignPermissions(role.id, dto.permission_ids);
      }
    }

    // Return updated role with permissions
    return this.findById(role.id, tenantId);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const role = await this.roleRepository.findOne({
      where: { id, tenant_id: tenantId },
    });
    if (!role) {
      throw new NotFoundException('Role not found');
    }

    // Prevent deletion of system roles
    if (role.is_system) {
      throw new BadRequestException('Cannot delete system roles');
    }

    // Remove junction table records first (FK constraints prevent direct role deletion)
    await this.rolePermissionRepository.destroy({ where: { role_id: id } });
    await UserRole.destroy({ where: { role_id: id } });

    // Now delete the role itself
    await role.destroy();
  }

  async assignPermissions(roleId: string, permissionIds: string[]): Promise<void> {
    // Validate that all permission IDs exist
    const permissions = await this.permissionRepository.findAll({
      where: { id: { [Op.in]: permissionIds } },
    });

    if (permissions.length !== permissionIds.length) {
      throw new BadRequestException('One or more permission IDs are invalid');
    }

    // Create role-permission mappings
    const mappings = permissionIds.map((permissionId) => ({
      role_id: roleId,
      permission_id: permissionId,
    }));

    await this.rolePermissionRepository.bulkCreate(mappings);
  }

  async removePermissions(roleId: string, permissionIds: string[]): Promise<void> {
    await this.rolePermissionRepository.destroy({
      where: {
        role_id: roleId,
        permission_id: { [Op.in]: permissionIds },
      },
    });
  }

  async getPermissions(roleId: string): Promise<Permission[]> {
    const role = await this.roleRepository.findByPk(roleId, {
      include: [
        {
          model: Permission,
          through: { attributes: [] },
        },
      ],
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return role.permissions || [];
  }
}
