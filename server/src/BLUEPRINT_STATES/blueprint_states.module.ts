import { Module } from '@nestjs/common';
import { BlueprintStatesController } from './blueprint_states.controller';
import { BlueprintStatesService } from './blueprint_states.service';
import { blueprintStatesProviders } from './blueprint_states.provider';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [BlueprintStatesController],
  providers: [BlueprintStatesService, ...blueprintStatesProviders],
  exports: [BlueprintStatesService],
})
export class BlueprintStatesModule {}
