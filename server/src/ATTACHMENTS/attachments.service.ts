import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { REPOSITORY } from '../shared/constants/keynames';
import { RequestAttachment } from './request_attachments.entity';
import { EstimateAttachment } from './estimate_attachments.entity';
import { ServiceRequest } from '../SERVICE_REQUESTS/service_requests.entity';
import { Estimate } from '../ESTIMATES/estimates.entity';

@Injectable()
export class AttachmentsService {
  constructor(
    @Inject(REPOSITORY.REQUEST_ATTACHMENTS)
    private readonly attachmentsRepository: typeof RequestAttachment,
    @Inject(REPOSITORY.ESTIMATE_ATTACHMENTS)
    private readonly estimateAttachmentsRepository: typeof EstimateAttachment,
    @Inject(REPOSITORY.SERVICE_REQUESTS)
    private readonly serviceRequestRepository: typeof ServiceRequest,
    @Inject(REPOSITORY.ESTIMATES)
    private readonly estimateRepository: typeof Estimate,
  ) {}

  async saveAttachments(
    requestId: string,
    tenantId: string,
    userId: string,
    filesData: any[],
  ): Promise<RequestAttachment[]> {
    const request = await this.serviceRequestRepository.findOne({
      where: { id: requestId, tenant_id: tenantId },
    });

    if (!request) {
      throw new NotFoundException('Service Request not found');
    }

    const attachments = filesData.map(file => ({
      request_id: requestId,
      tenant_id: tenantId,
      uploaded_by: userId,
      file_name: file.fileName,
      file_url: file.fileUrl,
      file_type: file.fileType,
      file_size: file.fileSize,
    }));

    return this.attachmentsRepository.bulkCreate(attachments);
  }

  async getAttachments(requestId: string, tenantId: string): Promise<RequestAttachment[]> {
    return this.attachmentsRepository.findAll({
      where: { request_id: requestId, tenant_id: tenantId },
      order: [['created_at', 'DESC']],
    });
  }

  async saveEstimateAttachments(
    estimateId: string,
    tenantId: string,
    userId: string,
    filesData: any[],
  ): Promise<EstimateAttachment[]> {
    const estimate = await this.estimateRepository.findOne({
      where: { id: estimateId, tenant_id: tenantId, is_deleted: false },
    });
    if (!estimate) {
      throw new NotFoundException('Estimate not found');
    }

    const attachments = filesData.map(file => ({
      estimate_id: estimateId,
      tenant_id: tenantId,
      uploaded_by: userId,
      file_name: file.fileName,
      file_url: file.fileUrl,
      file_type: file.fileType,
      file_size: file.fileSize,
    }));

    return this.estimateAttachmentsRepository.bulkCreate(attachments);
  }

  async getEstimateAttachments(estimateId: string, tenantId: string): Promise<EstimateAttachment[]> {
    return this.estimateAttachmentsRepository.findAll({
      where: { estimate_id: estimateId, tenant_id: tenantId },
      order: [['created_at', 'DESC']],
    });
  }

  async getEstimateAttachmentsPublic(estimateId: string): Promise<EstimateAttachment[]> {
    return this.estimateAttachmentsRepository.findAll({
      where: { estimate_id: estimateId },
      order: [['created_at', 'DESC']],
    });
  }
}
