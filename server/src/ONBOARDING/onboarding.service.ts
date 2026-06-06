import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { REPOSITORY } from '../shared/constants/keynames';
import { User } from '../USERS/users.entity';

@Injectable()
export class OnboardingService {
  constructor(
    @Inject(REPOSITORY.USERS)
    private readonly userRepository: typeof User,
  ) {}

  async getOnboardingStatus(userId: string, tenantId: string): Promise<{ isComplete: boolean }> {
    const user = await this.userRepository.findOne({
      where: { id: userId, tenant_id: tenantId },
      attributes: ['onboarding_completed'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return { isComplete: user.onboarding_completed };
  }

  async completeOnboarding(userId: string, tenantId: string): Promise<{ success: boolean }> {
    const [affectedCount] = await this.userRepository.update(
      { onboarding_completed: true },
      { where: { id: userId, tenant_id: tenantId } },
    );

    if (affectedCount === 0) {
      throw new NotFoundException('User not found or update failed');
    }

    return { success: true };
  }
}
