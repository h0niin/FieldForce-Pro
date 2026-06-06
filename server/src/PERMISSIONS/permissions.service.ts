import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Op } from 'sequelize';
import { REPOSITORY } from '../shared/constants/keynames';
import { Permission } from './permissions.entity';
import { CreatePermissionDto } from './dto/permissions_create.dto';
import { UpdatePermissionDto } from './dto/permissions_update.dto';
import { PageOptionsDto } from '../shared/dto/page-options.dto';
import { PageMetaDto } from '../shared/dto/page-meta.dto';
import { PageDto } from '../shared/dto/page.dto';
import { SEED_PERMISSIONS } from './permissions.seed';

@Injectable()
export class PermissionsService {
  constructor(
    @Inject(REPOSITORY.PERMISSIONS)
    private readonly permissionRepository: typeof Permission,
  ) {}

  async findAllPaginated(pageOptionsDto: PageOptionsDto): Promise<PageDto<Permission>> {
    const where: Record<string, unknown> = {};

    if (pageOptionsDto.search) {
      where[Op.or as unknown as string] = [
        { name: { [Op.iLike]: `%${pageOptionsDto.search}%` } },
        { module: { [Op.iLike]: `%${pageOptionsDto.search}%` } },
        { description: { [Op.iLike]: `%${pageOptionsDto.search}%` } },
      ];
    }

    const { count, rows } = await this.permissionRepository.findAndCountAll({
      where,
      order: [['module', 'ASC'], ['action', 'ASC']],
      limit: pageOptionsDto.take,
      offset: pageOptionsDto.skip,
    });

    const meta = new PageMetaDto({ pageOptionsDto, itemCount: count });
    return new PageDto(rows, meta);
  }

  async findAll(): Promise<Permission[]> {
    return this.permissionRepository.findAll({
      order: [['module', 'ASC'], ['action', 'ASC']],
    });
  }

  async findByModule(module: string): Promise<Permission[]> {
    return this.permissionRepository.findAll({
      where: { module },
      order: [['action', 'ASC']],
    });
  }

  async findById(id: string): Promise<Permission> {
    const permission = await this.permissionRepository.findOne({
      where: { id },
    });
    if (!permission) {
      throw new NotFoundException('Permission not found');
    }
    return permission;
  }

  async findByName(name: string): Promise<Permission | null> {
    return this.permissionRepository.findOne({
      where: { name },
    });
  }

  async create(dto: CreatePermissionDto): Promise<Permission> {
    // Normalize: always use underscores, never hyphens
    const normalizedName = dto.name.toLowerCase().replace(/-/g, '_');
    const normalizedModule = dto.module.toLowerCase().replace(/-/g, '_');

    const existing = await this.permissionRepository.findOne({
      where: { name: normalizedName },
    });
    if (existing) {
      throw new ConflictException('Permission with this name already exists');
    }

    return this.permissionRepository.create({
      name: normalizedName,
      module: normalizedModule,
      action: dto.action,
      description: dto.description,
    });
  }

  async update(id: string, dto: UpdatePermissionDto): Promise<Permission> {
    const permission = await this.permissionRepository.findOne({
      where: { id },
    });
    if (!permission) {
      throw new NotFoundException('Permission not found');
    }

    // Normalize: always use underscores, never hyphens
    const updateData = { ...dto };
    if (updateData.name) {
      updateData.name = updateData.name.toLowerCase().replace(/-/g, '_');
    }
    if (updateData.module) {
      updateData.module = updateData.module.toLowerCase().replace(/-/g, '_');
    }

    // Check if name is being changed and if it conflicts
    if (updateData.name && updateData.name !== permission.name) {
      const existing = await this.permissionRepository.findOne({
        where: { name: updateData.name },
      });
      if (existing) {
        throw new ConflictException('Permission with this name already exists');
      }
    }

    await permission.update(updateData);
    return permission;
  }

  async delete(id: string): Promise<void> {
    const permission = await this.permissionRepository.findOne({
      where: { id },
    });
    if (!permission) {
      throw new NotFoundException('Permission not found');
    }
    await permission.destroy();
  }

  async bulkCreate(permissions: CreatePermissionDto[]): Promise<Permission[]> {
    const created: Permission[] = [];
    for (const dto of permissions) {
      const existing = await this.findByName(dto.name);
      if (!existing) {
        const permission = await this.create(dto);
        created.push(permission);
      }
    }
    return created;
  }

  async seedAll(): Promise<{ created: number; skipped: number; total: number }> {
    // Fetch all existing permission names in one query instead of N individual SELECTs
    const existing = await this.permissionRepository.findAll({
      attributes: ['name'],
    });
    const existingNames = new Set(existing.map((p) => p.name));

    const toCreate = SEED_PERMISSIONS.filter((s) => !existingNames.has(s.name));
    if (toCreate.length > 0) {
      await this.permissionRepository.bulkCreate(
        toCreate.map((s) => ({
          name: s.name,
          module: s.module,
          action: s.action,
          description: s.description,
        })),
      );
    }

    return {
      created: toCreate.length,
      skipped: SEED_PERMISSIONS.length - toCreate.length,
      total: SEED_PERMISSIONS.length,
    };
  }
}
