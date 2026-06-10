import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Note } from './notes.entity';
import { CreateNoteDto } from './dto/create-note.dto';
import { QueryNotesDto } from './dto/query-notes.dto';
import { User } from '../USERS/users.entity';
import { PageDto } from '../shared/dto/page.dto';
import { PageMetaDto } from '../shared/dto/page-meta.dto';
import { KEYNAMES } from '../shared/constants/keynames';

import { ActivityLogsService } from '../ACTIVITY_LOGS/activity_logs.service';

@Injectable()
export class NotesService {
  constructor(
    @Inject(KEYNAMES.NOTES)
    private readonly notesRepository: typeof Note,
    private readonly activityLogsService: ActivityLogsService,
  ) {}

  async create(tenantId: string, userId: string, dto: CreateNoteDto): Promise<Note> {
    const note = await this.notesRepository.create({
      tenant_id: tenantId,
      created_by: userId,
      ...dto,
      entity_type: dto.entity_type,
    } as any);

    await this.activityLogsService.logActivity(
      tenantId,
      note.entity_type,
      note.entity_id,
      'NOTE_ADDED',
      `Added a note: "${note.content.substring(0, 50)}${note.content.length > 50 ? '...' : ''}"`
    );

    return this.findById(note.id, tenantId);
  }

  async update(id: string, tenantId: string, content: string): Promise<Note> {
    const note = await this.findById(id, tenantId);
    await note.update({ content });

    await this.activityLogsService.logActivity(
      tenantId,
      note.entity_type,
      note.entity_id,
      'NOTE_UPDATED',
      `Updated a note: "${note.content.substring(0, 50)}${note.content.length > 50 ? '...' : ''}"`
    );

    return this.findById(note.id, tenantId);
  }

  async findById(id: string, tenantId: string): Promise<Note> {
    const note = await this.notesRepository.findOne({
      where: { id, tenant_id: tenantId, is_deleted: false },
      include: [{ model: User, as: 'author', attributes: ['id', 'first_name', 'last_name', 'email'] }],
    });
    if (!note) {
      throw new NotFoundException('Note not found');
    }
    return note;
  }

  async findAllPaginated(tenantId: string, query: QueryNotesDto): Promise<PageDto<Note>> {
    const where: any = { tenant_id: tenantId, is_deleted: false };
    if (query.entity_type) {
      where.entity_type = query.entity_type;
    }
    if (query.entity_id) {
      where.entity_id = query.entity_id;
    }

    const { rows, count } = await this.notesRepository.findAndCountAll({
      where,
      include: [{ model: User, as: 'author', attributes: ['id', 'first_name', 'last_name', 'email'] }],
      order: [['created_at', query.order]],
      limit: query.take,
      offset: query.skip,
    });

    const meta = new PageMetaDto({ pageOptionsDto: query, itemCount: count });
    return new PageDto(rows, meta);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const note = await this.findById(id, tenantId);
    await note.update({ is_deleted: true });

    await this.activityLogsService.logActivity(
      tenantId,
      note.entity_type,
      note.entity_id,
      'NOTE_DELETED',
      `Deleted a note`
    );
  }
}
