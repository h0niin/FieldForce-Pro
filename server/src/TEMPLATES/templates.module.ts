import { Module } from '@nestjs/common';
import { TemplatesController } from './templates.controller';
import { TemplatesService } from './templates.service';
import { templatesProviders } from './templates.provider';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [TemplatesController],
  providers: [TemplatesService, ...templatesProviders],
  exports: [TemplatesService],
})
export class TemplatesModule {}
