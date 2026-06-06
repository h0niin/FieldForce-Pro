import {
  Injectable,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import { BlueprintTransition } from './blueprint_transitions.entity';
import { CreateBlueprintTransitionDto } from './dto/blueprint_transitions_create.dto';
import { UpdateBlueprintTransitionDto } from './dto/blueprint_transitions_update.dto';
import { PageOptionsDto } from '../shared/dto/page-options.dto';
import { PageDto } from '../shared/dto/page.dto';
import { PageMetaDto } from '../shared/dto/page-meta.dto';
import { KEYNAMES } from '../shared/constants/keynames';
import { Op } from 'sequelize';

@Injectable()
export class BlueprintTransitionsService {
  constructor(
    @Inject(KEYNAMES.BLUEPRINT_TRANSITIONS)
    private readonly blueprintTransitionRepository: typeof BlueprintTransition,
  ) {}

  async findAllPaginated(
    tenantId: string,
    pageOptionsDto: PageOptionsDto,
  ): Promise<PageDto<BlueprintTransition>> {
    const where: Record<string, unknown> = {
      tenant_id: tenantId,
      is_deleted: false,
    };

    if (pageOptionsDto.search) {
      where[Op.or as unknown as string] = [
        { name: { [Op.iLike]: `%${pageOptionsDto.search}%` } },
      ];
    }

    const { count, rows } = await this.blueprintTransitionRepository.findAndCountAll({
      where,
      order: [['created_at', pageOptionsDto.order]],
      limit: pageOptionsDto.take,
      offset: pageOptionsDto.skip,
    });

    const meta = new PageMetaDto({ pageOptionsDto, itemCount: count });
    return new PageDto(rows, meta);
  }

  async findAll(tenantId: string): Promise<BlueprintTransition[]> {
    return this.blueprintTransitionRepository.findAll({
      where: { tenant_id: tenantId, is_deleted: false },
      order: [['created_at', 'DESC']],
    });
  }

  async findByBlueprintId(blueprintId: string, tenantId: string): Promise<BlueprintTransition[]> {
    return this.blueprintTransitionRepository.findAll({
      where: { blueprint_id: blueprintId, tenant_id: tenantId, is_deleted: false },
      order: [['created_at', 'ASC']],
    });
  }

  async findById(id: string, tenantId: string): Promise<BlueprintTransition> {
    const transition = await this.blueprintTransitionRepository.findOne({
      where: { id, tenant_id: tenantId, is_deleted: false },
    });
    if (!transition) {
      throw new NotFoundException('Blueprint transition not found');
    }
    return transition;
  }

  async create(tenantId: string, dto: CreateBlueprintTransitionDto): Promise<BlueprintTransition> {
    return this.blueprintTransitionRepository.create({
      tenant_id: tenantId,
      ...dto,
    });
  }

  async update(
    id: string,
    tenantId: string,
    dto: UpdateBlueprintTransitionDto,
  ): Promise<BlueprintTransition> {
    const transition = await this.findById(id, tenantId);
    await transition.update(dto);
    return transition;
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const transition = await this.findById(id, tenantId);
    await transition.update({ is_deleted: true });
  }
}
