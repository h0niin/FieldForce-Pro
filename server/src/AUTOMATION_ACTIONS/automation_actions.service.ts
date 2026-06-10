import {
  Injectable,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import { AutomationAction } from './automation_actions.entity';
import { CreateAutomationActionDto } from './dto/automation_actions_create.dto';
import { UpdateAutomationActionDto } from './dto/automation_actions_update.dto';
import { PageOptionsDto } from '../shared/dto/page-options.dto';
import { PageDto } from '../shared/dto/page.dto';
import { PageMetaDto } from '../shared/dto/page-meta.dto';
import { KEYNAMES } from '../shared/constants/keynames';
import { Op } from 'sequelize';

@Injectable()
export class AutomationActionsService {
  constructor(
    @Inject(KEYNAMES.AUTOMATION_ACTIONS)
    private readonly automationActionRepository: typeof AutomationAction,
  ) {}

  async findAllPaginated(
    tenantId: string,
    pageOptionsDto: PageOptionsDto,
  ): Promise<PageDto<AutomationAction>> {
    const where: Record<string, unknown> = {
      tenant_id: tenantId,
      is_deleted: false,
    };

    if (pageOptionsDto.search) {
      where[Op.or as unknown as string] = [
        { name: { [Op.iLike]: `%${pageOptionsDto.search}%` } },
        { description: { [Op.iLike]: `%${pageOptionsDto.search}%` } },
      ];
    }

    const { count, rows } = await this.automationActionRepository.findAndCountAll({
      where,
      order: [['created_at', pageOptionsDto.order]],
      limit: pageOptionsDto.take,
      offset: pageOptionsDto.skip,
    });

    const meta = new PageMetaDto({ pageOptionsDto, itemCount: count });
    return new PageDto(rows, meta);
  }

  async findAll(tenantId: string): Promise<AutomationAction[]> {
    return this.automationActionRepository.findAll({
      where: { tenant_id: tenantId, is_deleted: false },
      order: [['created_at', 'DESC']],
    });
  }

  async findById(id: string, tenantId: string): Promise<AutomationAction> {
    const action = await this.automationActionRepository.findOne({
      where: { id, tenant_id: tenantId, is_deleted: false },
    });
    if (!action) {
      throw new NotFoundException('Automation Action not found');
    }
    return action;
  }

  async create(tenantId: string, dto: CreateAutomationActionDto): Promise<AutomationAction> {
    return this.automationActionRepository.create({
      tenant_id: tenantId,
      ...dto,
    });
  }

  async update(
    id: string,
    tenantId: string,
    dto: UpdateAutomationActionDto,
  ): Promise<AutomationAction> {
    const action = await this.findById(id, tenantId);
    await action.update(dto);
    return action;
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const action = await this.findById(id, tenantId);
    await action.update({ is_deleted: true });
  }
}
