import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { Timesheet } from './timesheets.entity';
import { CreateTimesheetDto } from './dto/timesheets_create.dto';
import { UpdateTimesheetDto } from './dto/timesheets_update.dto';
import { PageOptionsDto } from '../shared/dto/page-options.dto';
import { PageDto } from '../shared/dto/page.dto';
import { PageMetaDto } from '../shared/dto/page-meta.dto';
import { KEYNAMES } from '../shared/constants/keynames';
import { Op } from 'sequelize';

@Injectable()
export class TimesheetsService {
  constructor(
    @Inject(KEYNAMES.TIMESHEETS)
    private readonly timesheetRepository: typeof Timesheet,
  ) {}

  async findAllPaginated(
    tenantId: string,
    pageOptionsDto: PageOptionsDto,
  ): Promise<PageDto<Timesheet>> {
    const where: Record<string, unknown> = {
      tenant_id: tenantId,
      is_deleted: false,
    };

    if (pageOptionsDto.search) {
      where[Op.or as unknown as string] = [
        { notes: { [Op.iLike]: `%${pageOptionsDto.search}%` } },
        { status: { [Op.iLike]: `%${pageOptionsDto.search}%` } },
      ];
    }

    const { count, rows } = await this.timesheetRepository.findAndCountAll({
      where,
      order: [['created_at', pageOptionsDto.order]],
      limit: pageOptionsDto.take,
      offset: pageOptionsDto.skip,
    });

    const meta = new PageMetaDto({ pageOptionsDto, itemCount: count });
    return new PageDto(rows, meta);
  }

  async findAll(tenantId: string): Promise<Timesheet[]> {
    return this.timesheetRepository.findAll({
      where: { tenant_id: tenantId, is_deleted: false },
      order: [['created_at', 'DESC']],
    });
  }

  async findById(id: string, tenantId: string): Promise<Timesheet> {
    const timesheet = await this.timesheetRepository.findOne({
      where: { id, tenant_id: tenantId, is_deleted: false },
    });
    if (!timesheet) {
      throw new NotFoundException('Timesheet not found');
    }
    return timesheet;
  }

  async findByUserId(
    userId: string,
    tenantId: string,
    pageOptionsDto: PageOptionsDto,
  ): Promise<PageDto<Timesheet>> {
    const where: Record<string, unknown> = {
      tenant_id: tenantId,
      user_id: userId,
      is_deleted: false,
    };

    const { count, rows } = await this.timesheetRepository.findAndCountAll({
      where,
      order: [['created_at', pageOptionsDto.order]],
      limit: pageOptionsDto.take,
      offset: pageOptionsDto.skip,
    });

    const meta = new PageMetaDto({ pageOptionsDto, itemCount: count });
    return new PageDto(rows, meta);
  }

  async create(tenantId: string, dto: CreateTimesheetDto): Promise<Timesheet> {
    return this.timesheetRepository.create({
      tenant_id: tenantId,
      ...dto,
    });
  }

  async update(
    id: string,
    tenantId: string,
    dto: UpdateTimesheetDto,
  ): Promise<Timesheet> {
    const timesheet = await this.findById(id, tenantId);
    await timesheet.update(dto);
    return timesheet;
  }

  async approve(
    id: string,
    tenantId: string,
    approvedBy: string,
  ): Promise<Timesheet> {
    const timesheet = await this.findById(id, tenantId);

    if (timesheet.status !== 'pending') {
      throw new BadRequestException(
        `Cannot approve timesheet with status '${timesheet.status}'. Only pending timesheets can be approved.`,
      );
    }

    await timesheet.update({
      status: 'approved',
      approved_by: approvedBy,
    });
    return timesheet;
  }

  async reject(
    id: string,
    tenantId: string,
    approvedBy: string,
  ): Promise<Timesheet> {
    const timesheet = await this.findById(id, tenantId);

    if (timesheet.status !== 'pending') {
      throw new BadRequestException(
        `Cannot reject timesheet with status '${timesheet.status}'. Only pending timesheets can be rejected.`,
      );
    }

    await timesheet.update({
      status: 'rejected',
      approved_by: approvedBy,
    });
    return timesheet;
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const timesheet = await this.findById(id, tenantId);
    await timesheet.update({ is_deleted: true });
  }
}
