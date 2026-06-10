import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ActivityLog } from './activity_logs.entity';

@Injectable()
export class ActivityLogsService {
  constructor(
    @InjectModel(ActivityLog)
    private readonly activityLogModel: typeof ActivityLog,
  ) {}

  async logActivity(
    tenantId: string,
    entityType: string,
    entityId: string,
    action: string,
    description: string,
  ) {
    return this.activityLogModel.create({
      tenant_id: tenantId,
      entity_type: entityType,
      entity_id: entityId,
      action,
      description,
    } as any);
  }

  async findByEntity(tenantId: string, entityType: string, entityId: string) {
    return this.activityLogModel.findAll({
      where: {
        tenant_id: tenantId,
        entity_type: entityType,
        entity_id: entityId,
      },
      order: [['created_at', 'DESC']],
    });
  }
}
