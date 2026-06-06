import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { WebformSubmission } from './webform-submissions.entity';
import { Webform } from './webforms.entity';
import { ServiceRequest } from '../SERVICE_REQUESTS/service_requests.entity';
import { v4 as uuidv4 } from 'uuid';

export interface SubmitWebformDto {
  webform_id: string;
  form_data: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  referrer_url?: string;
}

export interface ProcessSubmissionDto {
  submission_id: string;
  create_service_request: boolean;
  auto_assign?: boolean;
}

@Injectable()
export class WebformSubmissionsService {
  constructor(
    @Inject('WebformSubmissionsRepository')
    private webformSubmissionsRepository: typeof WebformSubmission,
    @Inject('WebformsRepository')
    private webformsRepository: typeof Webform,
    @Inject('SERVICE_REQUESTS')
    private serviceRequestsRepository: typeof ServiceRequest,
  ) {}

  async submitWebform(tenantId: string, dto: SubmitWebformDto): Promise<WebformSubmission> {
    // Validate webform exists and is active
    const webform = await this.webformsRepository.findOne({
      where: {
        id: dto.webform_id,
        tenant_id: tenantId,
        is_active: true,
        is_deleted: false,
      },
    });

    if (!webform) {
      throw new NotFoundException('Webform not found or inactive');
    }

    // Validate required fields
    const requiredFields = (webform.fields as any[])
      .filter((field: any) => field.required)
      .map((field: any) => field.name);

    for (const field of requiredFields) {
      if (!dto.form_data[field]) {
        throw new BadRequestException(`Required field missing: ${field}`);
      }
    }

    // Create submission
    const submission = await this.webformSubmissionsRepository.create({
      tenant_id: tenantId,
      webform_id: dto.webform_id,
      form_data: dto.form_data,
      ip_address: dto.ip_address,
      user_agent: dto.user_agent,
      referrer_url: dto.referrer_url,
      status: 'pending',
    });

    // Auto-process if configured
    if (webform.styling && (webform.styling as any).auto_create_request) {
      await this.processSubmission(tenantId, {
        submission_id: submission.id,
        create_service_request: true,
        auto_assign: (webform.styling as any).auto_assign || false,
      });
    }

    return submission;
  }

  async processSubmission(tenantId: string, dto: ProcessSubmissionDto): Promise<WebformSubmission> {
    const submission = await this.webformSubmissionsRepository.findOne({
      where: {
        id: dto.submission_id,
        tenant_id: tenantId,
        is_deleted: false,
      },
      include: [{ model: Webform }],
    });

    if (!submission) {
      throw new NotFoundException('Submission not found');
    }

    if (submission.status !== 'pending') {
      throw new BadRequestException('Submission already processed');
    }

    try {
      if (dto.create_service_request) {
        // Extract relevant data from form submission
        const formData = submission.form_data as any;

        // Create service request
        const serviceRequest = await this.serviceRequestsRepository.create({
          id: uuidv4(),
          tenant_id: tenantId,
          title: formData.subject || formData.title || 'Web Form Submission',
          description: formData.description || formData.message || JSON.stringify(formData),
          status: 'New',
          priority: formData.priority || 'medium',
          source: 'webform',
          contact_name: formData.name || formData.contact_name,
          contact_email: formData.email || formData.contact_email,
          contact_phone: formData.phone || formData.contact_phone,
          custom_fields: {
            webform_id: submission.webform_id,
            submission_id: submission.id,
            ...formData,
          },
          is_deleted: false,
        });

        // Update submission with service request ID
        submission.service_request_id = serviceRequest.id;
        submission.status = 'processed';
        await submission.save();

        // If auto-assign is enabled, trigger assignment
        if (dto.auto_assign) {
          // This will be implemented with auto-assignment rules
          // For now, just set a flag in custom_fields
          serviceRequest.custom_fields = {
            ...serviceRequest.custom_fields,
            auto_assign_pending: true,
          };
          await serviceRequest.save();
        }
      } else {
        submission.status = 'processed';
        await submission.save();
      }

      return submission;
    } catch (error) {
      submission.status = 'failed';
      submission.error_message = error.message;
      await submission.save();
      throw error;
    }
  }

  async getSubmissions(tenantId: string, webformId?: string) {
    const where: any = {
      tenant_id: tenantId,
      is_deleted: false,
    };

    if (webformId) {
      where.webform_id = webformId;
    }

    return this.webformSubmissionsRepository.findAll({
      where,
      include: [
        { model: Webform },
        { model: ServiceRequest },
      ],
      order: [['created_at', 'DESC']],
    });
  }

  async getSubmissionById(tenantId: string, id: string) {
    const submission = await this.webformSubmissionsRepository.findOne({
      where: {
        id,
        tenant_id: tenantId,
        is_deleted: false,
      },
      include: [
        { model: Webform },
        { model: ServiceRequest },
      ],
    });

    if (!submission) {
      throw new NotFoundException('Submission not found');
    }

    return submission;
  }

  async markAsSpam(tenantId: string, id: string) {
    const submission = await this.webformSubmissionsRepository.findOne({
      where: {
        id,
        tenant_id: tenantId,
        is_deleted: false,
      },
    });

    if (!submission) {
      throw new NotFoundException('Submission not found');
    }

    submission.status = 'spam';
    await submission.save();

    return submission;
  }
}