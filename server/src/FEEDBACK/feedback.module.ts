import { Module } from '@nestjs/common';
import { FeedbackController } from './feedback.controller';
import { FeedbackService } from './feedback.service';
import { databaseProviders } from '../database/database.providers';

@Module({
  controllers: [FeedbackController],
  providers: [
    FeedbackService,
    ...databaseProviders,
  ],
})
export class FeedbackModule {}
