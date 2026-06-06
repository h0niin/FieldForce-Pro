import { Module } from '@nestjs/common';
import { OnboardingController } from './onboarding.controller';
import { OnboardingService } from './onboarding.service';
import { databaseProviders } from '../database/database.providers';

@Module({
  controllers: [OnboardingController],
  providers: [
    OnboardingService,
    ...databaseProviders,
  ],
})
export class OnboardingModule {}
