import { Injectable, Inject } from '@nestjs/common';
import { KEYNAMES } from '../shared/constants/keynames';
import { DispatchConsoleLayout } from './dispatch_console_layouts.entity';
import { SaveDispatchConsoleLayoutDto } from './dto/dispatch_console_layouts.dto';
import { User } from '../USERS/users.entity';

export const DEFAULT_LAYOUTS = [
  {
    view_type: 'gantt',
    layout_mode: 'classic',
    visible_fields: ['subject', 'status', 'scheduled_date', 'assigned_to', 'priority'],
  },
  {
    view_type: 'grid',
    layout_mode: 'classic',
    visible_fields: ['work_order_number', 'subject', 'status', 'priority', 'scheduled_date', 'assigned_to'],
  },
  {
    view_type: 'calendar',
    layout_mode: 'classic',
    visible_fields: ['subject', 'status', 'scheduled_date', 'priority'],
  },
];

@Injectable()
export class DispatchConsoleLayoutsService {
  constructor(
    @Inject(KEYNAMES.DISPATCH_CONSOLE_LAYOUTS)
    private readonly layoutRepository: typeof DispatchConsoleLayout,
  ) {}

  /**
   * Finds all layout configurations for a tenant. Auto-seeds missing views.
   */
  async findAll(tenantId: string): Promise<DispatchConsoleLayout[]> {
    const existing = await this.layoutRepository.findAll({
      where: { tenant_id: tenantId },
      include: [{ model: User, as: 'modifier', attributes: ['id', 'first_name', 'last_name', 'email'] }],
    });

    const existingViews = new Set(existing.map((l) => l.view_type));
    const missing = DEFAULT_LAYOUTS.filter((def) => !existingViews.has(def.view_type));

    if (missing.length > 0) {
      await this.layoutRepository.bulkCreate(
        missing.map((def) => ({
          tenant_id: tenantId,
          view_type: def.view_type,
          layout_mode: def.layout_mode,
          visible_fields: def.visible_fields,
        })),
        { ignoreDuplicates: true },
      );

      return this.layoutRepository.findAll({
        where: { tenant_id: tenantId },
        include: [{ model: User, as: 'modifier', attributes: ['id', 'first_name', 'last_name', 'email'] }],
        order: [['view_type', 'ASC']],
      });
    }

    return existing.sort(
      (a, b) =>
        DEFAULT_LAYOUTS.findIndex((def) => def.view_type === a.view_type) -
        DEFAULT_LAYOUTS.findIndex((def) => def.view_type === b.view_type),
    );
  }

  /**
   * Saves or updates layout preferences
   */
  async saveLayout(
    tenantId: string,
    userId: string,
    dto: SaveDispatchConsoleLayoutDto,
  ): Promise<DispatchConsoleLayout> {
    const [record] = await this.layoutRepository.findOrCreate({
      where: { tenant_id: tenantId, view_type: dto.view_type },
      defaults: {
        tenant_id: tenantId,
        view_type: dto.view_type,
        layout_mode: dto.layout_mode,
        visible_fields: dto.visible_fields,
        last_modified_by: userId,
      },
    });

    await record.update({
      layout_mode: dto.layout_mode,
      visible_fields: dto.visible_fields,
      last_modified_by: userId,
    });

    await record.reload({
      include: [{ model: User, as: 'modifier', attributes: ['id', 'first_name', 'last_name', 'email'] }],
    });

    return record;
  }
}
