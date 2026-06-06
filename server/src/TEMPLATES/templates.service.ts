import {
  Injectable,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import { Template } from './templates.entity';
import { CreateTemplateDto } from './dto/templates_create.dto';
import { UpdateTemplateDto } from './dto/templates_update.dto';
import { PageOptionsDto } from '../shared/dto/page-options.dto';
import { PageDto } from '../shared/dto/page.dto';
import { PageMetaDto } from '../shared/dto/page-meta.dto';
import { KEYNAMES } from '../shared/constants/keynames';
import { Op } from 'sequelize';

@Injectable()
export class TemplatesService {
  constructor(
    @Inject(KEYNAMES.TEMPLATES)
    private readonly templateRepository: typeof Template,
  ) {}

  async findAllPaginated(
    tenantId: string,
    pageOptionsDto: PageOptionsDto,
  ): Promise<PageDto<Template>> {
    const where: Record<string, unknown> = {
      tenant_id: tenantId,
      is_deleted: false,
    };

    if (pageOptionsDto.search) {
      where[Op.or as unknown as string] = [
        { name: { [Op.iLike]: `%${pageOptionsDto.search}%` } },
      ];
    }

    const { count, rows } = await this.templateRepository.findAndCountAll({
      where,
      order: [['created_at', pageOptionsDto.order]],
      limit: pageOptionsDto.take,
      offset: pageOptionsDto.skip,
    });

    const meta = new PageMetaDto({ pageOptionsDto, itemCount: count });
    return new PageDto(rows, meta);
  }

  async findAll(tenantId: string): Promise<Template[]> {
    return this.templateRepository.findAll({
      where: { tenant_id: tenantId, is_deleted: false },
      order: [['created_at', 'DESC']],
    });
  }

  async findById(id: string, tenantId: string): Promise<Template> {
    const template = await this.templateRepository.findOne({
      where: { id, tenant_id: tenantId, is_deleted: false },
    });
    if (!template) {
      throw new NotFoundException('Template not found');
    }
    return template;
  }

  async findByType(type: string, tenantId: string): Promise<Template[]> {
    return this.templateRepository.findAll({
      where: {
        type,
        tenant_id: tenantId,
        is_deleted: false,
      },
      order: [['is_default', 'DESC'], ['created_at', 'DESC']],
    });
  }

  async create(tenantId: string, dto: CreateTemplateDto): Promise<Template> {
    return this.templateRepository.create({
      tenant_id: tenantId,
      ...dto,
    });
  }

  async update(
    id: string,
    tenantId: string,
    dto: UpdateTemplateDto,
  ): Promise<Template> {
    const template = await this.findById(id, tenantId);
    await template.update(dto);
    return template;
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const template = await this.findById(id, tenantId);
    await template.update({ is_deleted: true });
  }
}
