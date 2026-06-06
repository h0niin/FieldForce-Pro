import {
  Injectable,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import { BlueprintState } from './blueprint_states.entity';
import { CreateBlueprintStateDto } from './dto/blueprint_states_create.dto';
import { UpdateBlueprintStateDto } from './dto/blueprint_states_update.dto';
import { PageOptionsDto } from '../shared/dto/page-options.dto';
import { PageDto } from '../shared/dto/page.dto';
import { PageMetaDto } from '../shared/dto/page-meta.dto';
import { KEYNAMES } from '../shared/constants/keynames';
import { Op } from 'sequelize';

@Injectable()
export class BlueprintStatesService {
  constructor(
    @Inject(KEYNAMES.BLUEPRINT_STATES)
    private readonly blueprintStateRepository: typeof BlueprintState,
  ) {}

  async findAllPaginated(
    tenantId: string,
    pageOptionsDto: PageOptionsDto,
  ): Promise<PageDto<BlueprintState>> {
    const where: Record<string, unknown> = {
      tenant_id: tenantId,
      is_deleted: false,
    };

    if (pageOptionsDto.search) {
      where[Op.or as unknown as string] = [
        { name: { [Op.iLike]: `%${pageOptionsDto.search}%` } },
      ];
    }

    const { count, rows } = await this.blueprintStateRepository.findAndCountAll({
      where,
      order: [['sort_order', 'ASC'], ['created_at', pageOptionsDto.order]],
      limit: pageOptionsDto.take,
      offset: pageOptionsDto.skip,
    });

    const meta = new PageMetaDto({ pageOptionsDto, itemCount: count });
    return new PageDto(rows, meta);
  }

  async findAll(tenantId: string): Promise<BlueprintState[]> {
    return this.blueprintStateRepository.findAll({
      where: { tenant_id: tenantId, is_deleted: false },
      order: [['sort_order', 'ASC'], ['created_at', 'DESC']],
    });
  }

  async findByBlueprintId(blueprintId: string, tenantId: string): Promise<BlueprintState[]> {
    return this.blueprintStateRepository.findAll({
      where: { blueprint_id: blueprintId, tenant_id: tenantId, is_deleted: false },
      order: [['sort_order', 'ASC']],
    });
  }

  async findById(id: string, tenantId: string): Promise<BlueprintState> {
    const state = await this.blueprintStateRepository.findOne({
      where: { id, tenant_id: tenantId, is_deleted: false },
    });
    if (!state) {
      throw new NotFoundException('Blueprint state not found');
    }
    return state;
  }

  async create(tenantId: string, dto: CreateBlueprintStateDto): Promise<BlueprintState> {
    return this.blueprintStateRepository.create({
      tenant_id: tenantId,
      ...dto,
    });
  }

  async update(
    id: string,
    tenantId: string,
    dto: UpdateBlueprintStateDto,
  ): Promise<BlueprintState> {
    const state = await this.findById(id, tenantId);
    await state.update(dto);
    return state;
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const state = await this.findById(id, tenantId);
    await state.update({ is_deleted: true });
  }
}
