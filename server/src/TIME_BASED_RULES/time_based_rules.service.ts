import {
  Injectable,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import { TimeBasedRule } from './time_based_rules.entity';
import { CreateTimeBasedRuleDto } from './dto/time_based_rules_create.dto';
import { UpdateTimeBasedRuleDto } from './dto/time_based_rules_update.dto';
import { PageOptionsDto } from '../shared/dto/page-options.dto';
import { PageDto } from '../shared/dto/page.dto';
import { PageMetaDto } from '../shared/dto/page-meta.dto';
import { KEYNAMES } from '../shared/constants/keynames';
import { Op } from 'sequelize';

@Injectable()
export class TimeBasedRulesService {
  constructor(
    @Inject(KEYNAMES.TIME_BASED_RULES)
    private readonly timeBasedRuleRepository: typeof TimeBasedRule,
  ) {}

  async findAllPaginated(
    tenantId: string,
    pageOptionsDto: PageOptionsDto,
  ): Promise<PageDto<TimeBasedRule>> {
    const where: Record<string, unknown> = {
      tenant_id: tenantId,
      is_deleted: false,
    };

    if (pageOptionsDto.search) {
      where[Op.or as unknown as string] = [
        { name: { [Op.iLike]: `%${pageOptionsDto.search}%` } },
        { module: { [Op.iLike]: `%${pageOptionsDto.search}%` } },
      ];
    }

    const { count, rows } = await this.timeBasedRuleRepository.findAndCountAll({
      where,
      order: [['created_at', pageOptionsDto.order]],
      limit: pageOptionsDto.take,
      offset: pageOptionsDto.skip,
    });

    const meta = new PageMetaDto({ pageOptionsDto, itemCount: count });
    return new PageDto(rows, meta);
  }

  async findAll(tenantId: string): Promise<TimeBasedRule[]> {
    return this.timeBasedRuleRepository.findAll({
      where: { tenant_id: tenantId, is_deleted: false },
      order: [['created_at', 'DESC']],
    });
  }

  async findById(id: string, tenantId: string): Promise<TimeBasedRule> {
    const rule = await this.timeBasedRuleRepository.findOne({
      where: { id, tenant_id: tenantId, is_deleted: false },
    });
    if (!rule) {
      throw new NotFoundException('Time Based Rule not found');
    }
    return rule;
  }

  async create(tenantId: string, dto: CreateTimeBasedRuleDto): Promise<TimeBasedRule> {
    return this.timeBasedRuleRepository.create({
      tenant_id: tenantId,
      ...dto,
    });
  }

  async update(
    id: string,
    tenantId: string,
    dto: UpdateTimeBasedRuleDto,
  ): Promise<TimeBasedRule> {
    const rule = await this.findById(id, tenantId);
    await rule.update(dto);
    return rule;
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const rule = await this.findById(id, tenantId);
    await rule.update({ is_deleted: true });
  }
}
