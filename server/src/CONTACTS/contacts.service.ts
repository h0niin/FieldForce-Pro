import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Op } from 'sequelize';
import { REPOSITORY } from '../shared/constants/keynames';
import { Contact } from './contacts.entity';
import { CreateContactDto } from './dto/contacts_create.dto';
import { UpdateContactDto } from './dto/contacts_update.dto';
import { PageOptionsDto } from '../shared/dto/page-options.dto';
import { PageMetaDto } from '../shared/dto/page-meta.dto';
import { PageDto } from '../shared/dto/page.dto';

@Injectable()
export class ContactsService {
  constructor(
    @Inject(REPOSITORY.CONTACTS)
    private readonly contactRepository: typeof Contact,
  ) {}

  async findAllPaginated(
    tenantId: string,
    pageOptionsDto: PageOptionsDto,
  ): Promise<PageDto<Contact>> {
    const where: Record<string, unknown> = {
      tenant_id: tenantId,
      is_deleted: false,
    };

    if (pageOptionsDto.search) {
      where[Op.or as unknown as string] = [
        { first_name: { [Op.iLike]: `%${pageOptionsDto.search}%` } },
        { last_name: { [Op.iLike]: `%${pageOptionsDto.search}%` } },
        { email: { [Op.iLike]: `%${pageOptionsDto.search}%` } },
        { phone: { [Op.iLike]: `%${pageOptionsDto.search}%` } },
      ];
    }

    const { count, rows } = await this.contactRepository.findAndCountAll({
      where,
      order: [['created_at', pageOptionsDto.order]],
      limit: pageOptionsDto.take,
      offset: pageOptionsDto.skip,
    });

    const meta = new PageMetaDto({ pageOptionsDto, itemCount: count });
    return new PageDto(rows, meta);
  }

  async findAll(tenantId: string): Promise<Contact[]> {
    return this.contactRepository.findAll({
      where: { tenant_id: tenantId, is_deleted: false },
      order: [['first_name', 'ASC'], ['last_name', 'ASC']],
    });
  }

  async findById(id: string, tenantId: string): Promise<Contact> {
    const contact = await this.contactRepository.findOne({
      where: { id, tenant_id: tenantId, is_deleted: false },
    });
    if (!contact) {
      throw new NotFoundException('Contact not found');
    }
    return contact;
  }

  async create(tenantId: string, dto: CreateContactDto): Promise<Contact> {
    // Check for duplicate email if provided
    if (dto.email) {
      const existing = await this.contactRepository.findOne({
        where: {
          email: dto.email,
          tenant_id: tenantId,
          is_deleted: false,
        },
      });
      if (existing) {
        throw new ConflictException('Contact with this email already exists');
      }
    }

    const contact = await this.contactRepository.create({
      tenant_id: tenantId,
      ...dto,
    });

    return this.findById(contact.id, tenantId);
  }

  async update(
    id: string,
    tenantId: string,
    dto: UpdateContactDto,
  ): Promise<Contact> {
    const contact = await this.contactRepository.findOne({
      where: { id, tenant_id: tenantId, is_deleted: false },
    });
    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    // Check for duplicate email if being updated
    if (dto.email && dto.email !== contact.email) {
      const existing = await this.contactRepository.findOne({
        where: {
          email: dto.email,
          tenant_id: tenantId,
          is_deleted: false,
          id: { [Op.ne]: id },
        },
      });
      if (existing) {
        throw new ConflictException('Contact with this email already exists');
      }
    }

    await contact.update(dto);
    return this.findById(contact.id, tenantId);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const contact = await this.contactRepository.findOne({
      where: { id, tenant_id: tenantId, is_deleted: false },
    });
    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    // Soft delete
    await contact.update({ is_deleted: true });
  }
}
