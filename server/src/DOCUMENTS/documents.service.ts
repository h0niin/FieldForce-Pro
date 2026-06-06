import { Injectable, Inject, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ParsedDocument } from './documents.entity';
import { UploadDocumentDto, UpdateDocumentDto, QueryDocumentsDto } from './dto/documents.dto';
import { PageOptionsDto } from '../shared/dto/page-options.dto';
import { PageDto } from '../shared/dto/page.dto';
import { PageMetaDto } from '../shared/dto/page-meta.dto';
import { Op } from 'sequelize';
import axios, { AxiosInstance } from 'axios';
import { ConfigService } from '@nestjs/config';
import * as FormData from 'form-data';

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);
  private aiServiceClient: AxiosInstance;

  constructor(
    @Inject('DOCUMENTS_REPOSITORY')
    private documentsRepository: typeof ParsedDocument,
    private configService: ConfigService,
  ) {
    const aiServiceUrl = this.configService.get<string>('AI_SERVICE_URL', 'http://localhost:8000');
    this.aiServiceClient = axios.create({
      baseURL: aiServiceUrl,
      timeout: 60000,
    });
  }

  async uploadAndParse(
    file: Express.Multer.File,
    dto: UploadDocumentDto,
    tenantId: string,
    userId: string,
  ): Promise<ParsedDocument> {
    const document = await this.documentsRepository.create({
      tenant_id: tenantId,
      uploaded_by: userId,
      file_name: file.originalname,
      file_type: file.mimetype,
      file_size: file.size,
      document_type: dto.document_type,
      status: 'processing',
      metadata: dto.metadata || {},
      is_deleted: false,
    });

    try {
      const formData = new FormData();
      formData.append('file', file.buffer, {
        filename: file.originalname,
        contentType: file.mimetype,
      });

      const parseEndpoint = dto.document_type === 'invoice'
        ? '/api/documents/parse/invoice'
        : '/api/documents/parse';

      const response = await this.aiServiceClient.post(parseEndpoint, formData, {
        headers: {
          ...formData.getHeaders(),
          Authorization: `Bearer ${this.generateToken(tenantId)}`,
        },
      });

      const result = response.data.data;

      await document.update({
        extracted_text: result.extracted_text || '',
        extracted_fields: result.fields || {},
        confidence: result.confidence || 0,
        pages: result.pages || 0,
        status: 'completed',
      });

    } catch (aiError) {
      this.logger.error('Document parsing error:', aiError);
      await document.update({
        status: 'failed',
        error_message: aiError.message || 'Document parsing failed',
      });
    }

    return document.reload();
  }

  async getDocuments(
    dto: QueryDocumentsDto,
    pageOptions: PageOptionsDto,
    tenantId: string,
  ): Promise<PageDto<ParsedDocument>> {
    const whereClause: any = {
      tenant_id: tenantId,
      is_deleted: false,
    };

    if (dto.document_type) whereClause.document_type = dto.document_type;
    if (dto.status) whereClause.status = dto.status;
    if (dto.search) {
      whereClause.file_name = { [Op.iLike]: `%${dto.search}%` };
    }

    const { rows, count } = await this.documentsRepository.findAndCountAll({
      where: whereClause,
      limit: pageOptions.take,
      offset: pageOptions.skip,
      order: [['created_at', pageOptions.order]],
    });

    const pageMeta = new PageMetaDto({
      itemCount: count,
      pageOptionsDto: pageOptions,
    });

    return new PageDto(rows, pageMeta);
  }

  async getDocumentById(id: string, tenantId: string): Promise<ParsedDocument> {
    const document = await this.documentsRepository.findOne({
      where: {
        id,
        tenant_id: tenantId,
        is_deleted: false,
      },
    });

    if (!document) {
      throw new HttpException('Document not found', HttpStatus.NOT_FOUND);
    }

    return document;
  }

  async updateDocument(
    id: string,
    dto: UpdateDocumentDto,
    tenantId: string,
  ): Promise<ParsedDocument> {
    const document = await this.getDocumentById(id, tenantId);

    const updateData: any = {};
    if (dto.corrections) updateData.corrections = dto.corrections;
    if (dto.status) updateData.status = dto.status;

    await document.update(updateData);
    return document;
  }

  async deleteDocument(id: string, tenantId: string): Promise<void> {
    const document = await this.getDocumentById(id, tenantId);
    await document.update({ is_deleted: true });
  }

  private generateToken(tenantId: string): string {
    return `mock_token_${tenantId}`;
  }
}
