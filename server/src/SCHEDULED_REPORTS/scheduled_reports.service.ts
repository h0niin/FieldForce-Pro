import {
  Injectable,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import { ScheduledReport } from './scheduled_reports.entity';
import { CreateScheduledReportDto } from './dto/scheduled_reports_create.dto';
import { UpdateScheduledReportDto } from './dto/scheduled_reports_update.dto';
import { PageOptionsDto } from '../shared/dto/page-options.dto';
import { PageDto } from '../shared/dto/page.dto';
import { PageMetaDto } from '../shared/dto/page-meta.dto';
import { KEYNAMES } from '../shared/constants/keynames';
import { Op } from 'sequelize';

@Injectable()
export class ScheduledReportsService {
  constructor(
    @Inject(KEYNAMES.SCHEDULED_REPORTS)
    private readonly scheduledReportRepository: typeof ScheduledReport,
  ) {}

  async findAllPaginated(
    tenantId: string,
    pageOptionsDto: PageOptionsDto,
  ): Promise<PageDto<ScheduledReport>> {
    const where: Record<string, unknown> = {
      tenant_id: tenantId,
      is_deleted: false,
    };

    if (pageOptionsDto.search) {
      where[Op.or as unknown as string] = [
        { report_name: { [Op.iLike]: `%${pageOptionsDto.search}%` } },
      ];
    }

    const { count, rows } = await this.scheduledReportRepository.findAndCountAll({
      where,
      order: [['created_at', pageOptionsDto.order]],
      limit: pageOptionsDto.take,
      offset: pageOptionsDto.skip,
    });

    const meta = new PageMetaDto({ pageOptionsDto, itemCount: count });
    return new PageDto(rows, meta);
  }

  async findAll(tenantId: string): Promise<ScheduledReport[]> {
    return this.scheduledReportRepository.findAll({
      where: { tenant_id: tenantId, is_deleted: false },
      order: [['created_at', 'DESC']],
    });
  }

  async findById(id: string, tenantId: string): Promise<ScheduledReport> {
    const report = await this.scheduledReportRepository.findOne({
      where: { id, tenant_id: tenantId, is_deleted: false },
    });
    if (!report) {
      throw new NotFoundException('Scheduled Report not found');
    }
    return report;
  }

  async create(tenantId: string, dto: CreateScheduledReportDto): Promise<ScheduledReport> {
    return this.scheduledReportRepository.create({
      tenant_id: tenantId,
      ...dto,
    });
  }

  async update(
    id: string,
    tenantId: string,
    dto: UpdateScheduledReportDto,
  ): Promise<ScheduledReport> {
    const report = await this.findById(id, tenantId);
    await report.update(dto);
    return report;
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const report = await this.findById(id, tenantId);
    await report.update({ is_deleted: true });
  }
}
