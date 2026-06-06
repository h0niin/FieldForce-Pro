import { Module } from '@nestjs/common';
import { AgentLocationsController } from './agent_locations.controller';
import { AgentLocationsService } from './agent_locations.service';
import { agentLocationsProviders } from './agent_locations.provider';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [AgentLocationsController],
  providers: [AgentLocationsService, ...agentLocationsProviders],
  exports: [AgentLocationsService],
})
export class AgentLocationsModule {}
