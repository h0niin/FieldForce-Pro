import { Injectable, Inject } from '@nestjs/common';
import { REPOSITORY } from '../../shared/constants/keynames';
import { SuperAdminAuditLog } from './super_admin_audit_logs.entity';

@Injectable()
export class SuperAdminAuditLogsService {
  constructor(
    @Inject(REPOSITORY.SUPER_ADMIN_AUDIT_LOGS)
    private readonly auditLogRepository: typeof SuperAdminAuditLog,
  ) {}

  async logAction(superAdminId: string, action: string, resource: string, targetId?: string, details?: any, ipAddress?: string) {
    return this.auditLogRepository.create({
      super_admin_id: superAdminId,
      action,
      resource,
      target_id: targetId,
      details,
      ip_address: ipAddress,
    } as any);
  }

  async getLogs(page = 1, limit = 50, filters?: any) {
    const offset = (page - 1) * limit;
    const whereClause: any = {};
    
    if (filters?.action) {
      whereClause.action = filters.action;
    }

    const { rows, count } = await this.auditLogRepository.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [['created_at', 'DESC']],
    });

    return {
      data: rows,
      meta: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  async getAllLogsForExport() {
    return this.auditLogRepository.findAll({
      order: [['created_at', 'DESC']],
      raw: true,
    });
  }
}
