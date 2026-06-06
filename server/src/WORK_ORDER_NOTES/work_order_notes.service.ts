import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { WorkOrderNote } from './work_order_notes.entity';
import { CreateWorkOrderNoteDto } from './dto/work_order_notes_create.dto';
import { UpdateWorkOrderNoteDto } from './dto/work_order_notes_update.dto';
import { PageOptionsDto } from '../shared/dto/page-options.dto';
import { WorkOrderNotesQueryDto } from './dto/work_order_notes_query.dto';
import { PageDto } from '../shared/dto/page.dto';
import { PageMetaDto } from '../shared/dto/page-meta.dto';
import { KEYNAMES } from '../shared/constants/keynames';
import { Op } from 'sequelize';

@Injectable()
export class WorkOrderNotesService {
  constructor(
    @Inject(KEYNAMES.WORK_ORDER_NOTES)
    private readonly workOrderNoteRepository: typeof WorkOrderNote,
  ) {}

  async findAllPaginated(
    tenantId: string,
    queryDto: WorkOrderNotesQueryDto,
  ): Promise<PageDto<WorkOrderNote>> {
    const where: Record<string, unknown> = {
      tenant_id: tenantId,
      is_deleted: false,
    };

    // Filter by work_order_id if provided
    if (queryDto.work_order_id) {
      where.work_order_id = queryDto.work_order_id;
    }

    if (queryDto.search) {
      where[Op.or as unknown as string] = [
        { content: { [Op.iLike]: `%${queryDto.search}%` } },
      ];
    }

    const { count, rows } = await this.workOrderNoteRepository.findAndCountAll({
      where,
      order: [['created_at', queryDto.order]],
      limit: queryDto.take,
      offset: queryDto.skip,
    });

    const meta = new PageMetaDto({ pageOptionsDto: queryDto, itemCount: count });
    return new PageDto(rows, meta);
  }

  async findAll(tenantId: string): Promise<WorkOrderNote[]> {
    return this.workOrderNoteRepository.findAll({
      where: { tenant_id: tenantId, is_deleted: false },
      order: [['created_at', 'DESC']],
    });
  }

  async findByWorkOrderId(workOrderId: string, tenantId: string): Promise<WorkOrderNote[]> {
    return this.workOrderNoteRepository.findAll({
      where: { work_order_id: workOrderId, tenant_id: tenantId, is_deleted: false },
      order: [['created_at', 'DESC']],
    });
  }

  async findById(id: string, tenantId: string): Promise<WorkOrderNote> {
    const note = await this.workOrderNoteRepository.findOne({
      where: { id, tenant_id: tenantId, is_deleted: false },
    });
    if (!note) {
      throw new NotFoundException('Work order note not found');
    }
    return note;
  }

  async create(tenantId: string, dto: CreateWorkOrderNoteDto): Promise<WorkOrderNote> {
    return this.workOrderNoteRepository.create({
      tenant_id: tenantId,
      ...dto,
    });
  }

  async update(
    id: string,
    tenantId: string,
    dto: UpdateWorkOrderNoteDto,
  ): Promise<WorkOrderNote> {
    const note = await this.findById(id, tenantId);
    await note.update(dto);
    return note;
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const note = await this.findById(id, tenantId);
    await note.update({ is_deleted: true });
  }
}
