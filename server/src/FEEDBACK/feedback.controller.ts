import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { UserId } from '../shared/decorator/user.decorator';
import { TenantId } from '../shared/decorator/tenant.decorator';
import { TenantGuard } from '../shared/guards/tenant.guard';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Feedback')
@ApiBearerAuth()
@UseGuards(TenantGuard)
@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post('technician')
  @ApiOperation({ summary: 'Submit technician feedback and close ticket' })
  async submitTechnicianFeedback(
    @Body() dto: any,
    @UserId() userId: string,
    @TenantId() tenantId: string,
  ) {
    return this.feedbackService.submitTechnicianFeedback(dto, userId, tenantId);
  }

  @Post('customer')
  @ApiOperation({ summary: 'Submit customer satisfaction survey' })
  async submitCustomerFeedback(
    @Body() dto: any,
    @UserId() userId: string,
    @TenantId() tenantId: string,
  ) {
    return this.feedbackService.submitCustomerFeedback(dto, userId, tenantId);
  }

  @Get('request/:id')
  @ApiOperation({ summary: 'Get feedback for a specific request' })
  async getRequestFeedback(
    @Param('id') requestId: string,
    @TenantId() tenantId: string,
  ) {
    return this.feedbackService.getRequestFeedback(requestId, tenantId);
  }

  @Get('technician/:id/stats')
  @ApiOperation({ summary: 'Get feedback stats for a technician' })
  async getTechnicianStats(
    @Param('id') technicianId: string,
    @TenantId() tenantId: string,
  ) {
    return this.feedbackService.getTechnicianStats(technicianId, tenantId);
  }
}
