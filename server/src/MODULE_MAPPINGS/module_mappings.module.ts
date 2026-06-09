import { Module } from '@nestjs/common';
import { ModuleMappingsService } from './module_mappings.service';
import { ModuleMappingsController } from './module_mappings.controller';
import { DatabaseModule } from '../database/database.module';
import { moduleMappingsProviders } from './module_mappings.provider';
import { customFieldsProviders } from '../CUSTOM_FIELDS/custom_fields.provider';

@Module({
  imports: [DatabaseModule],
  providers: [
    ModuleMappingsService,
    ...moduleMappingsProviders,
    ...customFieldsProviders,
  ],
  controllers: [ModuleMappingsController],
  exports: [ModuleMappingsService],
})
export class ModuleMappingsModule {}
