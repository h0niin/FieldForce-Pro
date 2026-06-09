import { Module } from '@nestjs/common';
import { ModuleMappingsController } from './module_mappings.controller';
import { ModuleMappingsService } from './module_mappings.service';
import { moduleMappingsProviders } from './module_mappings.provider';
import { customFieldsProviders } from '../CUSTOM_FIELDS/custom_fields.provider';

@Module({
  controllers: [ModuleMappingsController],
  providers: [
    ModuleMappingsService,
    ...moduleMappingsProviders,
    ...customFieldsProviders,
  ],
  exports: [ModuleMappingsService],
})
export class ModuleMappingsModule {}
