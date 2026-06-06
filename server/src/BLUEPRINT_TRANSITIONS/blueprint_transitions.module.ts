import { Module } from '@nestjs/common';
import { BlueprintTransitionsController } from './blueprint_transitions.controller';
import { BlueprintTransitionsService } from './blueprint_transitions.service';
import { blueprintTransitionsProviders } from './blueprint_transitions.provider';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [BlueprintTransitionsController],
  providers: [BlueprintTransitionsService, ...blueprintTransitionsProviders],
  exports: [BlueprintTransitionsService],
})
export class BlueprintTransitionsModule {}
