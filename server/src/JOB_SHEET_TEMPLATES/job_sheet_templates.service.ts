import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { JobSheetTemplate } from './job_sheet_templates.entity';
import { CreateJobSheetTemplateDto } from './dto/job_sheet_templates_create.dto';
import { UpdateJobSheetTemplateDto } from './dto/job_sheet_templates_update.dto';
import { PageOptionsDto } from '../shared/dto/page-options.dto';
import { PageDto } from '../shared/dto/page.dto';
import { PageMetaDto } from '../shared/dto/page-meta.dto';
import { KEYNAMES } from '../shared/constants/keynames';
import { Op } from 'sequelize';

@Injectable()
export class JobSheetTemplatesService {
  constructor(
    @Inject(KEYNAMES.JOB_SHEET_TEMPLATES)
    private readonly jobSheetTemplateRepository: typeof JobSheetTemplate,
  ) {}

  async findAllPaginated(
    tenantId: string,
    pageOptionsDto: PageOptionsDto,
  ): Promise<PageDto<JobSheetTemplate>> {
    const where: Record<string, unknown> = {
      tenant_id: tenantId,
      is_deleted: false,
    };

    if (pageOptionsDto.search) {
      where[Op.or as unknown as string] = [
        { name: { [Op.iLike]: `%${pageOptionsDto.search}%` } },
        { description: { [Op.iLike]: `%${pageOptionsDto.search}%` } },
        { category: { [Op.iLike]: `%${pageOptionsDto.search}%` } },
      ];
    }

    const { count, rows } = await this.jobSheetTemplateRepository.findAndCountAll({
      where,
      order: [['created_at', pageOptionsDto.order]],
      limit: pageOptionsDto.take,
      offset: pageOptionsDto.skip,
    });

    const meta = new PageMetaDto({ pageOptionsDto, itemCount: count });
    return new PageDto(rows, meta);
  }

  async findAll(tenantId: string): Promise<JobSheetTemplate[]> {
    return this.jobSheetTemplateRepository.findAll({
      where: { tenant_id: tenantId, is_deleted: false },
      order: [['name', 'ASC']],
    });
  }

  async findById(id: string, tenantId: string): Promise<JobSheetTemplate> {
    const template = await this.jobSheetTemplateRepository.findOne({
      where: { id, tenant_id: tenantId, is_deleted: false },
    });
    if (!template) {
      throw new NotFoundException('Job sheet template not found');
    }
    return template;
  }

  async create(tenantId: string, dto: CreateJobSheetTemplateDto): Promise<JobSheetTemplate> {
    return this.jobSheetTemplateRepository.create({
      tenant_id: tenantId,
      ...dto,
    });
  }

  async update(
    id: string,
    tenantId: string,
    dto: UpdateJobSheetTemplateDto,
  ): Promise<JobSheetTemplate> {
    const template = await this.findById(id, tenantId);
    await template.update(dto);
    return template;
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const template = await this.findById(id, tenantId);
    await template.update({ is_deleted: true });
  }
}
