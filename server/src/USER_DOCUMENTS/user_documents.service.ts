import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Op } from 'sequelize';
import { REPOSITORY } from '../shared/constants/keynames';
import { UserDocument } from './user_documents.entity';
import { CreateUserDocumentDto } from './dto/user_documents_create.dto';
import { UpdateUserDocumentDto } from './dto/user_documents_update.dto';
import { PageOptionsDto } from '../shared/dto/page-options.dto';
import { PageMetaDto } from '../shared/dto/page-meta.dto';
import { PageDto } from '../shared/dto/page.dto';

@Injectable()
export class UserDocumentsService {
  constructor(
    @Inject(REPOSITORY.USER_DOCUMENTS)
    private readonly userDocumentRepository: typeof UserDocument,
  ) {}

  async findAllPaginated(
    tenantId: string,
    pageOptionsDto: PageOptionsDto,
  ): Promise<PageDto<UserDocument>> {
    const where: Record<string, unknown> = {
      tenant_id: tenantId,
      is_deleted: false,
    };

    if (pageOptionsDto.search) {
      where[Op.or as unknown as string] = [
        { document_name: { [Op.iLike]: `%${pageOptionsDto.search}%` } },
        { document_number: { [Op.iLike]: `%${pageOptionsDto.search}%` } },
        { issuing_authority: { [Op.iLike]: `%${pageOptionsDto.search}%` } },
      ];
    }

    const { count, rows } = await this.userDocumentRepository.findAndCountAll({
      where,
      order: [['created_at', pageOptionsDto.order]],
      limit: pageOptionsDto.take,
      offset: pageOptionsDto.skip,
    });

    const meta = new PageMetaDto({ pageOptionsDto, itemCount: count });
    return new PageDto(rows, meta);
  }

  async findByUserId(userId: string, tenantId: string): Promise<UserDocument[]> {
    return this.userDocumentRepository.findAll({
      where: {
        user_id: userId,
        tenant_id: tenantId,
        is_deleted: false,
      },
      order: [['created_at', 'DESC']],
    });
  }

  async findById(id: string, tenantId: string): Promise<UserDocument> {
    const document = await this.userDocumentRepository.findOne({
      where: { id, tenant_id: tenantId, is_deleted: false },
    });
    if (!document) {
      throw new NotFoundException('Document not found');
    }
    return document;
  }

  async findByIdAndUserId(id: string, userId: string, tenantId: string): Promise<UserDocument> {
    const document = await this.userDocumentRepository.findOne({
      where: { id, user_id: userId, tenant_id: tenantId, is_deleted: false },
    });
    if (!document) {
      throw new NotFoundException('Document not found');
    }
    return document;
  }

  async deleteOwn(id: string, userId: string, tenantId: string): Promise<void> {
    const document = await this.userDocumentRepository.findOne({
      where: { id, user_id: userId, tenant_id: tenantId, is_deleted: false },
    });
    if (!document) {
      throw new NotFoundException('Document not found');
    }
    await document.update({ is_deleted: true });
  }

  async findExpiringDocuments(
    tenantId: string,
    daysThreshold: number,
  ): Promise<UserDocument[]> {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);

    return this.userDocumentRepository.findAll({
      where: {
        tenant_id: tenantId,
        is_deleted: false,
        expiry_date: {
          [Op.lte]: thresholdDate,
          [Op.gte]: new Date(),
        },
      },
      order: [['expiry_date', 'ASC']],
    });
  }

  async create(tenantId: string, dto: CreateUserDocumentDto): Promise<UserDocument> {
    return this.userDocumentRepository.create({
      tenant_id: tenantId,
      user_id: dto.user_id,
      document_type: dto.document_type,
      document_name: dto.document_name,
      file_url: dto.file_url,
      file_type: dto.file_type,
      file_size: dto.file_size,
      issue_date: dto.issue_date ? new Date(dto.issue_date) : null,
      expiry_date: dto.expiry_date ? new Date(dto.expiry_date) : null,
      issuing_authority: dto.issuing_authority,
      document_number: dto.document_number,
      notes: dto.notes,
      is_verified: false,
    });
  }

  async update(id: string, tenantId: string, dto: UpdateUserDocumentDto): Promise<UserDocument> {
    const document = await this.userDocumentRepository.findOne({
      where: { id, tenant_id: tenantId, is_deleted: false },
    });
    if (!document) {
      throw new NotFoundException('Document not found');
    }

    const updateData: Record<string, unknown> = { ...dto };
    if (dto.issue_date) {
      updateData.issue_date = new Date(dto.issue_date);
    }
    if (dto.expiry_date) {
      updateData.expiry_date = new Date(dto.expiry_date);
    }

    await document.update(updateData);
    return document;
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const document = await this.userDocumentRepository.findOne({
      where: { id, tenant_id: tenantId, is_deleted: false },
    });
    if (!document) {
      throw new NotFoundException('Document not found');
    }
    await document.update({ is_deleted: true });
  }

  async verify(id: string, tenantId: string, verifiedBy: string): Promise<UserDocument> {
    const document = await this.userDocumentRepository.findOne({
      where: { id, tenant_id: tenantId, is_deleted: false },
    });
    if (!document) {
      throw new NotFoundException('Document not found');
    }

    await document.update({
      is_verified: true,
      verified_at: new Date(),
      verified_by: verifiedBy,
    });

    return document;
  }

  async unverify(id: string, tenantId: string): Promise<UserDocument> {
    const document = await this.userDocumentRepository.findOne({
      where: { id, tenant_id: tenantId, is_deleted: false },
    });
    if (!document) {
      throw new NotFoundException('Document not found');
    }

    await document.update({
      is_verified: false,
      verified_at: null,
      verified_by: null,
    });

    return document;
  }
}
