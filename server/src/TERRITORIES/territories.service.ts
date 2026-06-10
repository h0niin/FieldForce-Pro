import { Injectable, NotFoundException } from '@nestjs/common';
import { Op } from 'sequelize';
import { InjectModel } from '@nestjs/sequelize';
import { Territory } from './territories.entity';
import { CreateTerritoryDto } from './dto/territories_create.dto';
import { UpdateTerritoryDto } from './dto/territories_update.dto';

@Injectable()
export class TerritoriesService {
  constructor(
    @InjectModel(Territory)
    private readonly territoryModel: typeof Territory,
  ) {}

  async findAll(tenantId: string, page = 1, limit = 10, search = '') {
    const offset = (page - 1) * limit;
    
    const where: any = { tenant_id: tenantId, is_deleted: false };
    if (search) {
      where.name = { [Op.iLike]: `%${search}%` };
    }

    const { rows, count } = await this.territoryModel.findAndCountAll({
      where,
      limit,
      offset,
      order: [['created_at', 'DESC']],
    });

    return {
      data: rows,
      meta: {
        itemCount: count,
        page,
        pageCount: Math.ceil(count / limit),
      },
    };
  }

  async findAllNonPaginated(tenantId: string) {
    return this.territoryModel.findAll({
      where: { tenant_id: tenantId, is_deleted: false },
      order: [['name', 'ASC']],
    });
  }

  async findOne(id: string, tenantId: string) {
    const territory = await this.territoryModel.findOne({
      where: { id, tenant_id: tenantId, is_deleted: false },
    });
    if (!territory) {
      throw new NotFoundException('Territory not found');
    }
    return territory;
  }

  async create(tenantId: string, createDto: CreateTerritoryDto) {
    return this.territoryModel.create({
      ...createDto,
      tenant_id: tenantId,
    } as any);
  }

  async update(id: string, tenantId: string, updateDto: UpdateTerritoryDto) {
    const territory = await this.findOne(id, tenantId);
    return territory.update(updateDto);
  }

  async remove(id: string, tenantId: string) {
    const territory = await this.findOne(id, tenantId);
    return territory.update({ is_deleted: true });
  }
}
