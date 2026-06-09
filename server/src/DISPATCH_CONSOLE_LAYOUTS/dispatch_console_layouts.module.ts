import { Module } from '@nestjs/common';
import { DispatchConsoleLayoutsController } from './dispatch_console_layouts.controller';
import { DispatchConsoleLayoutsService } from './dispatch_console_layouts.service';
import { dispatchConsoleLayoutsProviders } from './dispatch_console_layouts.provider';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [DispatchConsoleLayoutsController],
  providers: [DispatchConsoleLayoutsService, ...dispatchConsoleLayoutsProviders],
  exports: [DispatchConsoleLayoutsService],
})
export class DispatchConsoleLayoutsModule {}
