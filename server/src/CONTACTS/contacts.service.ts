import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Op } from 'sequelize';
import { REPOSITORY } from '../shared/constants/keynames';
import { ActivityLogsService } from '../ACTIVITY_LOGS/activity_logs.service';
import { Contact } from './contacts.entity';
import { CreateContactDto } from './dto/contacts_create.dto';
import { UpdateContactDto } from './dto/contacts_update.dto';
import { PageOptionsDto } from '../shared/dto/page-options.dto';
import { PageMetaDto } from '../shared/dto/page-meta.dto';
import { PageDto } from '../shared/dto/page.dto';
import { generateEntityDiff } from '../utils/diff-logger.util';

@Injectable()
export class ContactsService {
  constructor(
    @Inject(REPOSITORY.CONTACTS)
    private readonly contactRepository: typeof Contact,
    private readonly activityLogsService: ActivityLogsService,
  ) { }

  async findAllPaginated(
    tenantId: string,
    pageOptionsDto: PageOptionsDto,
  ): Promise<PageDto<Contact>> {
    const where: Record<string, unknown> = {
      tenant_id: tenantId,
      is_deleted: false,
    };

    if (pageOptionsDto.company_id) {
      where.company_id = pageOptionsDto.company_id;
    }

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

  async findAll(tenantId: string, companyId?: string): Promise<Contact[]> {
    const where: any = { tenant_id: tenantId, is_deleted: false };
    if (companyId) {
      where.company_id = companyId;
    }
    return this.contactRepository.findAll({
      where,
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

    await this.activityLogsService.logActivity(
      tenantId,
      'Contact',
      contact.id,
      'CREATED',
      `Contact ${contact.first_name} ${contact.last_name} was created.`,
    );

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

    const diffArray = generateEntityDiff(contact, dto);
    const diffString = diffArray.join(', ');
    const description = diffString !== ''
      ? diffString
      : 'Contact details were updated.';

    await contact.update(dto);

    await this.activityLogsService.logActivity(
      tenantId,
      'Contact',
      contact.id,
      'UPDATED',
      description,
    );

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

  async getInsights(id: string, tenantId: string) {
    const { Asset } = await import('../ASSETS/assets.entity');
    const { WorkOrder } = await import('../WORK_ORDERS/work_orders.entity');
    const { Invoice } = await import('../INVOICES/invoices.entity');

    const activeAssets = await Asset.count({ where: { contact_id: id, tenant_id: tenantId, is_deleted: false, status: 'OPERATIONAL' } });
    const openWorkOrders = await WorkOrder.count({ where: { contact_id: id, tenant_id: tenantId, is_deleted: false, status: { [Op.notIn]: ['completed', 'cancelled'] } } });
    const unpaidInvoices = await Invoice.count({ where: { contact_id: id, tenant_id: tenantId, is_deleted: false, status: { [Op.notIn]: ['paid', 'void', 'draft'] } } });

    return {
      activeAssets,
      openWorkOrders,
      unpaidInvoices,
    };
  }
}
