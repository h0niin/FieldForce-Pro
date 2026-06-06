import { Module } from '@nestjs/common';
import { AuditLogsController } from './audit_logs.controller';
import { AuditLogsService } from './audit_logs.service';
import { auditLogsProviders } from './audit_logs.provider';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [AuditLogsController],
  providers: [AuditLogsService, ...auditLogsProviders],
  exports: [AuditLogsService, ...auditLogsProviders],
})
export class AuditLogsModule { }
