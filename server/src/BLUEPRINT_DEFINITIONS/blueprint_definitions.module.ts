import { Module } from '@nestjs/common';
import { BlueprintDefinitionsController } from './blueprint_definitions.controller';
import { BlueprintDefinitionsService } from './blueprint_definitions.service';
import { BlueprintEngineService } from './blueprint_engine.service';
import { blueprintDefinitionsProviders } from './blueprint_definitions.provider';
import { blueprintStatesProviders } from '../BLUEPRINT_STATES/blueprint_states.provider';
import { blueprintTransitionsProviders } from '../BLUEPRINT_TRANSITIONS/blueprint_transitions.provider';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [BlueprintDefinitionsController],
  providers: [
    BlueprintDefinitionsService,
    BlueprintEngineService,
    ...blueprintDefinitionsProviders,
    ...blueprintStatesProviders,
    ...blueprintTransitionsProviders,
  ],
  exports: [BlueprintDefinitionsService, BlueprintEngineService],
})
export class BlueprintDefinitionsModule {}
