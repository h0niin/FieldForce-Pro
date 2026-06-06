import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { AgentLocation } from './agent_locations.entity';
import { CreateAgentLocationDto, BatchCreateAgentLocationDto } from './dto/agent_locations_create.dto';
import { PageOptionsDto } from '../shared/dto/page-options.dto';
import { PageDto } from '../shared/dto/page.dto';
import { PageMetaDto } from '../shared/dto/page-meta.dto';
import { KEYNAMES } from '../shared/constants/keynames';
import { Op } from 'sequelize';

@Injectable()
export class AgentLocationsService {
  constructor(
    @Inject(KEYNAMES.AGENT_LOCATIONS)
    private readonly agentLocationRepository: typeof AgentLocation,
  ) {}

  async findAllPaginated(
    tenantId: string,
    pageOptionsDto: PageOptionsDto,
  ): Promise<PageDto<AgentLocation>> {
    const where: Record<string, unknown> = {
      tenant_id: tenantId,
      is_deleted: false,
    };

    const { count, rows } = await this.agentLocationRepository.findAndCountAll({
      where,
      order: [['recorded_at', pageOptionsDto.order]],
      limit: pageOptionsDto.take,
      offset: pageOptionsDto.skip,
    });

    const meta = new PageMetaDto({ pageOptionsDto, itemCount: count });
    return new PageDto(rows, meta);
  }

  async findAll(tenantId: string): Promise<AgentLocation[]> {
    return this.agentLocationRepository.findAll({
      where: { tenant_id: tenantId, is_deleted: false },
      order: [['recorded_at', 'DESC']],
    });
  }

  async findById(id: string, tenantId: string): Promise<AgentLocation> {
    const location = await this.agentLocationRepository.findOne({
      where: { id, tenant_id: tenantId, is_deleted: false },
    });
    if (!location) {
      throw new NotFoundException('Agent location not found');
    }
    return location;
  }

  async findLatestByUserId(
    userId: string,
    tenantId: string,
  ): Promise<AgentLocation> {
    const location = await this.agentLocationRepository.findOne({
      where: {
        tenant_id: tenantId,
        user_id: userId,
        is_deleted: false,
      },
      order: [['recorded_at', 'DESC']],
    });
    if (!location) {
      throw new NotFoundException('No location found for this user');
    }
    return location;
  }

  async findByUserIdInRange(
    userId: string,
    tenantId: string,
    startDate: string,
    endDate: string,
    pageOptionsDto: PageOptionsDto,
  ): Promise<PageDto<AgentLocation>> {
    const where: Record<string, unknown> = {
      tenant_id: tenantId,
      user_id: userId,
      is_deleted: false,
      recorded_at: {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      },
    };

    const { count, rows } = await this.agentLocationRepository.findAndCountAll({
      where,
      order: [['recorded_at', pageOptionsDto.order]],
      limit: pageOptionsDto.take,
      offset: pageOptionsDto.skip,
    });

    const meta = new PageMetaDto({ pageOptionsDto, itemCount: count });
    return new PageDto(rows, meta);
  }

  async create(
    tenantId: string,
    dto: CreateAgentLocationDto,
  ): Promise<AgentLocation> {
    return this.agentLocationRepository.create({
      tenant_id: tenantId,
      ...dto,
    });
  }

  async createBatch(
    tenantId: string,
    dto: BatchCreateAgentLocationDto,
  ): Promise<AgentLocation[]> {
    const records = dto.locations.map((location) => ({
      tenant_id: tenantId,
      ...location,
    }));
    return this.agentLocationRepository.bulkCreate(records);
  }
}
