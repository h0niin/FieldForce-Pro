import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { REPOSITORY } from '../shared/constants/keynames';
import { TechnicianFeedback } from './technician_feedback.entity';
import { CustomerSatisfaction } from './customer_satisfaction.entity';
import { ServiceRequest } from '../SERVICE_REQUESTS/service_requests.entity';
import { Sequelize } from 'sequelize-typescript';

@Injectable()
export class FeedbackService {
  constructor(
    @Inject(REPOSITORY.TECHNICIAN_FEEDBACK)
    private readonly techFeedbackRepo: typeof TechnicianFeedback,
    @Inject(REPOSITORY.CUSTOMER_SATISFACTION)
    private readonly custSatisfactionRepo: typeof CustomerSatisfaction,
    @Inject(REPOSITORY.SERVICE_REQUESTS)
    private readonly serviceRequestRepo: typeof ServiceRequest,
    private readonly sequelize: Sequelize,
  ) {}

  async submitTechnicianFeedback(dto: any, userId: string, tenantId: string) {
    const transaction = await this.sequelize.transaction();
    try {
      const request = await this.serviceRequestRepo.findOne({
        where: { id: dto.requestId, tenant_id: tenantId },
        transaction,
      });

      if (!request) {
        throw new NotFoundException('Service Request not found');
      }

      const feedback = await this.techFeedbackRepo.create(
        {
          request_id: dto.requestId,
          technician_id: userId,
          tenant_id: tenantId,
          difficulty_rating: dto.difficultyRating,
          time_taken_minutes: dto.timeTakenMinutes,
          work_summary: dto.workSummary,
          flags: dto.flags || [],
        },
        { transaction },
      );

      // Close the ticket
      await request.update({ status: 'closed' }, { transaction });

      await transaction.commit();
      return feedback;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async submitCustomerFeedback(dto: any, userId: string, tenantId: string) {
    const request = await this.serviceRequestRepo.findOne({
      where: { id: dto.requestId, tenant_id: tenantId },
    });

    if (!request) {
      throw new NotFoundException('Service Request not found');
    }

    return this.custSatisfactionRepo.create({
      request_id: dto.requestId,
      customer_id: userId,
      tenant_id: tenantId,
      rating: dto.rating,
      comment: dto.comment,
    });
  }

  async getRequestFeedback(requestId: string, tenantId: string) {
    const technicianFeedback = await this.techFeedbackRepo.findOne({
      where: { request_id: requestId, tenant_id: tenantId },
    });
    
    const customerSatisfaction = await this.custSatisfactionRepo.findOne({
      where: { request_id: requestId, tenant_id: tenantId },
    });

    return { technicianFeedback, customerSatisfaction };
  }

  async getTechnicianStats(technicianId: string, tenantId: string) {
    // Basic implementation for stats
    const feedbackList = await this.techFeedbackRepo.findAll({
      where: { technician_id: technicianId, tenant_id: tenantId },
    });

    const totalJobs = feedbackList.length;
    const avgRating = totalJobs > 0 
      ? feedbackList.reduce((acc, curr) => acc + (curr.difficulty_rating || 0), 0) / totalJobs 
      : 0;

    return { totalJobs, avgRating };
  }
}
