import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common';
import { Company } from './companies.entity';
import { CreateCompanyDto } from './dto/companies_create.dto';
import { UpdateCompanyDto } from './dto/companies_update.dto';
import { PageOptionsDto } from '../shared/dto/page-options.dto';
import { PageDto } from '../shared/dto/page.dto';
import { PageMetaDto } from '../shared/dto/page-meta.dto';
import { KEYNAMES } from '../shared/constants/keynames';
import { Op } from 'sequelize';
import { ActivityLogsService } from '../ACTIVITY_LOGS/activity_logs.service';
import { generateEntityDiff } from '../utils/diff-logger.util';

@Injectable()
export class CompaniesService {
  constructor(
    @Inject(KEYNAMES.COMPANIES)
    private readonly companyRepository: typeof Company,
    private readonly activityLogsService: ActivityLogsService,
  ) {}

  async findAllPaginated(
    tenantId: string,
    pageOptionsDto: PageOptionsDto,
  ): Promise<PageDto<Company>> {
    const where: Record<string, unknown> = {
      tenant_id: tenantId,
      is_deleted: false,
    };

    if (pageOptionsDto.search) {
      where[Op.or as unknown as string] = [
        { name: { [Op.iLike]: `%${pageOptionsDto.search}%` } },
        { industry: { [Op.iLike]: `%${pageOptionsDto.search}%` } },
        { tax_id: { [Op.iLike]: `%${pageOptionsDto.search}%` } },
      ];
    }

    const { count, rows } = await this.companyRepository.findAndCountAll({
      where,
      order: [['created_at', pageOptionsDto.order]],
      limit: pageOptionsDto.take,
      offset: pageOptionsDto.skip,
    });

    const meta = new PageMetaDto({ pageOptionsDto, itemCount: count });
    return new PageDto(rows, meta);
  }

  async findAll(tenantId: string): Promise<Company[]> {
    return this.companyRepository.findAll({
      where: { tenant_id: tenantId, is_deleted: false },
      order: [['name', 'ASC']],
    });
  }

  async findById(id: string, tenantId: string): Promise<Company> {
    const company = await this.companyRepository.findOne({
      where: { id, tenant_id: tenantId, is_deleted: false },
    });
    if (!company) {
      throw new NotFoundException('Company not found');
    }
    return company;
  }

  async create(tenantId: string, dto: CreateCompanyDto): Promise<Company> {
    // Check for duplicate company name
    const existing = await this.companyRepository.findOne({
      where: {
        name: dto.name,
        tenant_id: tenantId,
        is_deleted: false,
      },
    });

    if (existing) {
      throw new ConflictException('Company with this name already exists');
    }

    const company = await this.companyRepository.create({
      tenant_id: tenantId,
      ...dto,
    });

    await this.activityLogsService.logActivity(
      tenantId,
      'Company',
      company.id,
      'CREATED',
      `Company ${company.name} was created.`,
    );

    return company;
  }

  async update(
    id: string,
    tenantId: string,
    dto: UpdateCompanyDto,
  ): Promise<Company> {
    const company = await this.findById(id, tenantId);

    // If updating name, check for duplicates
    if (dto.name && dto.name !== company.name) {
      const existing = await this.companyRepository.findOne({
        where: {
          name: dto.name,
          tenant_id: tenantId,
          is_deleted: false,
          id: { [Op.ne]: id },
        },
      });

      if (existing) {
        throw new ConflictException('Company with this name already exists');
      }
    }

    const diffArray = generateEntityDiff(company, dto);
    const diffString = diffArray.join(', ');
    const description = diffString !== '' 
      ? diffString
      : 'Company details were updated.';

    await company.update(dto);

    await this.activityLogsService.logActivity(
      tenantId,
      'Company',
      company.id,
      'UPDATED',
      description,
    );

    return company;
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const company = await this.findById(id, tenantId);
    await company.update({ is_deleted: true });
  }

  async getInsights(id: string, tenantId: string) {
    const { Asset } = await import('../ASSETS/assets.entity');
    const { WorkOrder } = await import('../WORK_ORDERS/work_orders.entity');
    const { Invoice } = await import('../INVOICES/invoices.entity');

    const activeAssets = await Asset.count({ where: { company_id: id, tenant_id: tenantId, is_deleted: false, status: 'OPERATIONAL' } });
    
    const { Contact } = await import('../CONTACTS/contacts.entity');
    const contacts = await Contact.findAll({ where: { company_id: id, tenant_id: tenantId }, attributes: ['id'] });
    const assets = await Asset.findAll({ where: { company_id: id, tenant_id: tenantId }, attributes: ['id'] });
    
    const contactIds = contacts.map(c => c.id);
    const assetIds = assets.map(a => a.id);
    
    let openWorkOrders = 0;
    if (contactIds.length > 0 || assetIds.length > 0) {
      openWorkOrders = await WorkOrder.count({ 
        where: { 
          tenant_id: tenantId, 
          is_deleted: false, 
          status: { [Op.notIn]: ['completed', 'cancelled', 'closed'] },
          [Op.or]: [
            ...(contactIds.length > 0 ? [{ contact_id: { [Op.in]: contactIds } }] : []),
            ...(assetIds.length > 0 ? [{ asset_id: { [Op.in]: assetIds } }] : [])
          ]
        } 
      });
    }

    const unpaidInvoices = await Invoice.count({ where: { company_id: id, tenant_id: tenantId, is_deleted: false, status: { [Op.notIn]: ['paid', 'void', 'draft'] } } });

    return {
      activeAssets,
      openWorkOrders,
      unpaidInvoices,
    };
  }
}
