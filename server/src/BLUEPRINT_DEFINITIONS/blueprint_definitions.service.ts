import {
  Injectable,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import { BlueprintDefinition } from './blueprint_definitions.entity';
import { CreateBlueprintDefinitionDto } from './dto/blueprint_definitions_create.dto';
import { UpdateBlueprintDefinitionDto } from './dto/blueprint_definitions_update.dto';
import { PageOptionsDto } from '../shared/dto/page-options.dto';
import { PageDto } from '../shared/dto/page.dto';
import { PageMetaDto } from '../shared/dto/page-meta.dto';
import { KEYNAMES } from '../shared/constants/keynames';
import { Op } from 'sequelize';

@Injectable()
export class BlueprintDefinitionsService {
  constructor(
    @Inject(KEYNAMES.BLUEPRINT_DEFINITIONS)
    private readonly blueprintDefinitionRepository: typeof BlueprintDefinition,
  ) {}

  async findAllPaginated(
    tenantId: string,
    pageOptionsDto: PageOptionsDto,
  ): Promise<PageDto<BlueprintDefinition>> {
    const where: Record<string, unknown> = {
      tenant_id: tenantId,
      is_deleted: false,
    };

    if (pageOptionsDto.search) {
      where[Op.or as unknown as string] = [
        { name: { [Op.iLike]: `%${pageOptionsDto.search}%` } },
      ];
    }

    const { count, rows } = await this.blueprintDefinitionRepository.findAndCountAll({
      where,
      order: [['created_at', pageOptionsDto.order]],
      limit: pageOptionsDto.take,
      offset: pageOptionsDto.skip,
    });

    const meta = new PageMetaDto({ pageOptionsDto, itemCount: count });
    return new PageDto(rows, meta);
  }

  async findAll(tenantId: string): Promise<BlueprintDefinition[]> {
    return this.blueprintDefinitionRepository.findAll({
      where: { tenant_id: tenantId, is_deleted: false },
      order: [['created_at', 'DESC']],
    });
  }

  async findById(id: string, tenantId: string): Promise<BlueprintDefinition> {
    const blueprint = await this.blueprintDefinitionRepository.findOne({
      where: { id, tenant_id: tenantId, is_deleted: false },
    });
    if (!blueprint) {
      throw new NotFoundException('Blueprint definition not found');
    }
    return blueprint;
  }

  async create(tenantId: string, dto: CreateBlueprintDefinitionDto): Promise<BlueprintDefinition> {
    return this.blueprintDefinitionRepository.create({
      tenant_id: tenantId,
      ...dto,
    });
  }

  async update(
    id: string,
    tenantId: string,
    dto: UpdateBlueprintDefinitionDto,
  ): Promise<BlueprintDefinition> {
    const blueprint = await this.findById(id, tenantId);
    await blueprint.update(dto);
    return blueprint;
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const blueprint = await this.findById(id, tenantId);
    await blueprint.update({ is_deleted: true });
  }
}
