import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Territory } from './territories.entity';
import { TerritoriesController } from './territories.controller';
import { TerritoriesService } from './territories.service';

@Module({
  imports: [SequelizeModule.forFeature([Territory])],
  controllers: [TerritoriesController],
  providers: [TerritoriesService],
  exports: [TerritoriesService],
})
export class TerritoriesModule {}
