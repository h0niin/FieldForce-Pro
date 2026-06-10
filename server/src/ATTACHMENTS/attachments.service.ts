import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { REPOSITORY } from '../shared/constants/keynames';
import * as fs from 'fs';
import * as path from 'path';
import { RequestAttachment } from './request_attachments.entity';
import { EstimateAttachment } from './estimate_attachments.entity';
import { GlobalAttachment } from './global_attachments.entity';
import { ServiceRequest } from '../SERVICE_REQUESTS/service_requests.entity';
import { Estimate } from '../ESTIMATES/estimates.entity';
import { ActivityLogsService } from '../ACTIVITY_LOGS/activity_logs.service';

@Injectable()
export class AttachmentsService {
  constructor(
    @Inject(REPOSITORY.REQUEST_ATTACHMENTS)
    private readonly attachmentsRepository: typeof RequestAttachment,
    @Inject(REPOSITORY.ESTIMATE_ATTACHMENTS)
    private readonly estimateAttachmentsRepository: typeof EstimateAttachment,
    @Inject(REPOSITORY.GLOBAL_ATTACHMENTS)
    private readonly globalAttachmentsRepository: typeof GlobalAttachment,
    @Inject(REPOSITORY.SERVICE_REQUESTS)
    private readonly serviceRequestRepository: typeof ServiceRequest,
    @Inject(REPOSITORY.ESTIMATES)
    private readonly estimateRepository: typeof Estimate,
    private readonly activityLogsService: ActivityLogsService,
  ) {}

  // ... existing methods ...
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

  async saveGlobalAttachments(
    entityType: string,
    entityId: string,
    tenantId: string,
    userId: string,
    filesData: any[],
  ): Promise<GlobalAttachment[]> {
    const attachments = filesData.map(file => ({
      entity_type: entityType,
      entity_id: entityId,
      tenant_id: tenantId,
      uploaded_by: userId,
      file_name: file.fileName,
      file_url: file.fileUrl,
      file_type: file.fileType,
      file_size: file.fileSize,
    }));

    const created = await this.globalAttachmentsRepository.bulkCreate(attachments as any);

    for (const file of filesData) {
      await this.activityLogsService.logActivity(
        tenantId,
        entityType,
        entityId,
        'ATTACHMENT_ADDED',
        `Uploaded attachment: "${file.fileName}"`
      );
    }

    return created;
  }

  async getGlobalAttachments(entityType: string, entityId: string, tenantId: string): Promise<GlobalAttachment[]> {
    return this.globalAttachmentsRepository.findAll({
      where: { entity_type: entityType, entity_id: entityId, tenant_id: tenantId },
      order: [['created_at', 'DESC']],
    });
  }

  async deleteGlobalAttachment(id: string, tenantId: string): Promise<void> {
    const attachment = await this.globalAttachmentsRepository.findOne({
      where: { id, tenant_id: tenantId },
    });

    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }

    const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
    // file_url is /api/attachments/download/... -> we need to strip /api/attachments/download/ to get the relative path
    const relativePath = attachment.file_url.replace('/api/attachments/download/', '');
    const filePath = path.join(UPLOADS_DIR, relativePath);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await attachment.destroy();

    await this.activityLogsService.logActivity(
      tenantId,
      attachment.entity_type,
      attachment.entity_id,
      'ATTACHMENT_DELETED',
      `Deleted attachment: "${attachment.file_name}"`
    );
  }
}
