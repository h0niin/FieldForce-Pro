import { Module, OnModuleInit, Logger } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { PermissionsController } from './permissions.controller';
import { permissionsProviders } from './permissions.provider';

@Module({
  controllers: [PermissionsController],
  providers: [PermissionsService, ...permissionsProviders],
  exports: [PermissionsService, ...permissionsProviders],
})
export class PermissionsModule implements OnModuleInit {
  private readonly logger = new Logger(PermissionsModule.name);

  constructor(private readonly permissionsService: PermissionsService) {}

  async onModuleInit() {
    try {
      const result = await this.permissionsService.seedAll();
      if (result.created > 0) {
        this.logger.log(
          `Permissions seeded: ${result.created} created, ${result.skipped} skipped, ${result.total} total`,
        );
      }
    } catch (error) {
      this.logger.warn(`Failed to auto-seed permissions: ${error.message}`);
    }
  }
}
