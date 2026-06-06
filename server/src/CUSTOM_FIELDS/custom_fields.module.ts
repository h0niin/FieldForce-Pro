import { Module } from '@nestjs/common';
import { CustomFieldsController } from './custom_fields.controller';
import { CustomFieldsService } from './custom_fields.service';
import { customFieldsProviders } from './custom_fields.provider';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [CustomFieldsController],
  providers: [CustomFieldsService, ...customFieldsProviders],
  exports: [CustomFieldsService],
})
export class CustomFieldsModule {}
