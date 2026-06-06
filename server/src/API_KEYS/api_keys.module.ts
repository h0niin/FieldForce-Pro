import { Module } from '@nestjs/common';
import { ApiKeysController } from './api_keys.controller';
import { ApiKeysService } from './api_keys.service';
import { apiKeysProviders } from './api_keys.provider';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [ApiKeysController],
  providers: [ApiKeysService, ...apiKeysProviders],
  exports: [ApiKeysService],
})
export class ApiKeysModule {}
