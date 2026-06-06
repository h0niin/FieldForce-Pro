import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { AuditLog } from './audit_logs.entity';
import { CreateAuditLogDto } from './dto/audit_logs_create.dto';
import { AuditLogQueryDto } from './dto/audit_logs_query.dto';
import { PageOptionsDto } from '../shared/dto/page-options.dto';
import { PageDto } from '../shared/dto/page.dto';
import { PageMetaDto } from '../shared/dto/page-meta.dto';
import { KEYNAMES } from '../shared/constants/keynames';
import { Op } from 'sequelize';

@Injectable()
export class AuditLogsService {
  constructor(
    @Inject(KEYNAMES.AUDIT_LOGS)
    private readonly auditLogRepository: typeof AuditLog,
  ) { }

  async findAllPaginated(
    tenantId: string,
    pageOptionsDto: PageOptionsDto,
    queryDto: AuditLogQueryDto,
  ): Promise<PageDto<AuditLog>> {
    try {
      const where: Record<string, unknown> = {
        tenant_id: tenantId,
      };

      if (queryDto.module) {
        where.module = queryDto.module;
      }

      if (queryDto.action) {
        where.action = queryDto.action;
      }

      if (queryDto.user_id) {
        where.user_id = queryDto.user_id;
      }

      if (queryDto.start_date || queryDto.end_date) {
        const dateFilter: Record<string, unknown> = {};
        if (queryDto.start_date) {
          dateFilter[Op.gte as unknown as string] = new Date(queryDto.start_date);
        }
        if (queryDto.end_date) {
          dateFilter[Op.lte as unknown as string] = new Date(queryDto.end_date);
        }
        where.created_at = dateFilter;
      }

      if (pageOptionsDto.search) {
        where[Op.or as unknown as string] = [
          { action: { [Op.iLike]: `%${pageOptionsDto.search}%` } },
          { module: { [Op.iLike]: `%${pageOptionsDto.search}%` } },
        ];
      }

      const { count, rows } = await this.auditLogRepository.findAndCountAll({
        where,
        order: [['created_at', pageOptionsDto.order]],
        limit: pageOptionsDto.take,
        offset: pageOptionsDto.skip,
      });

      const meta = new PageMetaDto({ pageOptionsDto, itemCount: count });
      return new PageDto(rows, meta);
    } catch (error) {
      console.error('[AuditLogsService] findAllPaginated error:', error);
      throw error;
    }
  }

  async findById(id: string, tenantId: string): Promise<AuditLog> {
    const auditLog = await this.auditLogRepository.findOne({
      where: { id, tenant_id: tenantId },
    });
    if (!auditLog) {
      throw new NotFoundException('Audit log not found');
    }
    return auditLog;
  }

  async create(
    tenantId: string,
    dto: Omit<CreateAuditLogDto, 'record_id'> & { record_id?: string | null },
  ): Promise<AuditLog> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.auditLogRepository.create({ tenant_id: tenantId, ...dto } as any);
  }
}
