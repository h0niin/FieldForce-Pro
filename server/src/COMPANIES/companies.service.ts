import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common';
import { Company } from './companies.entity';
import { CreateCompanyDto } from './dto/companies_create.dto';
import { UpdateCompanyDto } from './dto/companies_update.dto';
import { PageOptionsDto } from '../shared/dto/page-options.dto';
import { PageDto } from '../shared/dto/page.dto';
import { PageMetaDto } from '../shared/dto/page-meta.dto';
import { KEYNAMES } from '../shared/constants/keynames';
import { Op } from 'sequelize';

@Injectable()
export class CompaniesService {
  constructor(
    @Inject(KEYNAMES.COMPANIES)
    private readonly companyRepository: typeof Company,
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

    return this.companyRepository.create({
      tenant_id: tenantId,
      ...dto,
    });
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

    await company.update(dto);
    return company;
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const company = await this.findById(id, tenantId);
    await company.update({ is_deleted: true });
  }
}
