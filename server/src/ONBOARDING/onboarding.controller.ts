import { Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { OnboardingService } from './onboarding.service';
import { UserId } from '../shared/decorator/user.decorator';
import { TenantId } from '../shared/decorator/tenant.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../shared/guards/tenant.guard';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Onboarding')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('onboarding')
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Get('status')
  @ApiOperation({ summary: 'Get current user onboarding status' })
  async getStatus(@UserId() userId: string, @TenantId() tenantId: string) {
    return this.onboardingService.getOnboardingStatus(userId, tenantId);
  }

  @Patch('complete')
  @ApiOperation({ summary: 'Mark onboarding as completed for current user' })
  async completeOnboarding(@UserId() userId: string, @TenantId() tenantId: string) {
    return this.onboardingService.completeOnboarding(userId, tenantId);
  }
}
