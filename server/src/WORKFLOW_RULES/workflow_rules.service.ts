import {
  Injectable,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import { WorkflowRule } from './workflow_rules.entity';
import { CreateWorkflowRuleDto } from './dto/workflow_rules_create.dto';
import { UpdateWorkflowRuleDto } from './dto/workflow_rules_update.dto';
import { PageOptionsDto } from '../shared/dto/page-options.dto';
import { PageDto } from '../shared/dto/page.dto';
import { PageMetaDto } from '../shared/dto/page-meta.dto';
import { KEYNAMES } from '../shared/constants/keynames';
import { Op } from 'sequelize';

@Injectable()
export class WorkflowRulesService {
  constructor(
    @Inject(KEYNAMES.WORKFLOW_RULES)
    private readonly workflowRuleRepository: typeof WorkflowRule,
  ) {}

  async findAllPaginated(
    tenantId: string,
    pageOptionsDto: PageOptionsDto,
  ): Promise<PageDto<WorkflowRule>> {
    const where: Record<string, unknown> = {
      tenant_id: tenantId,
      is_deleted: false,
    };

    if (pageOptionsDto.search) {
      where[Op.or as unknown as string] = [
        { name: { [Op.iLike]: `%${pageOptionsDto.search}%` } },
        { module: { [Op.iLike]: `%${pageOptionsDto.search}%` } },
        { trigger_event: { [Op.iLike]: `%${pageOptionsDto.search}%` } },
      ];
    }

    const { count, rows } = await this.workflowRuleRepository.findAndCountAll({
      where,
      order: [['created_at', pageOptionsDto.order]],
      limit: pageOptionsDto.take,
      offset: pageOptionsDto.skip,
    });

    const meta = new PageMetaDto({ pageOptionsDto, itemCount: count });
    return new PageDto(rows, meta);
  }

  async findAll(tenantId: string): Promise<WorkflowRule[]> {
    return this.workflowRuleRepository.findAll({
      where: { tenant_id: tenantId, is_deleted: false },
      order: [['created_at', 'DESC']],
    });
  }

  async findById(id: string, tenantId: string): Promise<WorkflowRule> {
    const rule = await this.workflowRuleRepository.findOne({
      where: { id, tenant_id: tenantId, is_deleted: false },
    });
    if (!rule) {
      throw new NotFoundException('Workflow rule not found');
    }
    return rule;
  }

  async create(tenantId: string, dto: CreateWorkflowRuleDto): Promise<WorkflowRule> {
    return this.workflowRuleRepository.create({
      tenant_id: tenantId,
      ...dto,
    });
  }

  async update(
    id: string,
    tenantId: string,
    dto: UpdateWorkflowRuleDto,
  ): Promise<WorkflowRule> {
    const rule = await this.findById(id, tenantId);
    await rule.update(dto);
    return rule;
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const rule = await this.findById(id, tenantId);
    await rule.update({ is_deleted: true });
  }
}
