import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common';
import { REPOSITORY } from '../shared/constants/keynames';
import { Tenant } from './tenants.entity';
import { CreateTenantDto, UpdateTenantDto } from './dto/tenants.dto';

@Injectable()
export class TenantsService {
  constructor(
    @Inject(REPOSITORY.TENANTS)
    private readonly tenantRepository: typeof Tenant,
  ) {}

  async create(dto: CreateTenantDto): Promise<Tenant> {
    const slug = dto.slug || this.generateSlug(dto.name);

    const existing = await this.tenantRepository.findOne({ where: { slug } });
    if (existing) {
      throw new ConflictException('Tenant with this slug already exists');
    }

    return this.tenantRepository.create({ ...dto, slug });
  }

  async findAll(): Promise<Tenant[]> {
    return this.tenantRepository.findAll({ where: { is_active: true } });
  }

  async findById(id: string): Promise<Tenant> {
    const tenant = await this.tenantRepository.findByPk(id);
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }
    return tenant;
  }

  async findBySlug(slug: string): Promise<Tenant | null> {
    return this.tenantRepository.findOne({ where: { slug } });
  }

  async update(id: string, dto: UpdateTenantDto): Promise<Tenant> {
    const tenant = await this.findById(id);
    await tenant.update(dto);
    return tenant;
  }

  async remove(id: string): Promise<void> {
    const tenant = await this.findById(id);
    await tenant.update({ is_active: false });
  }

  /** Payment config the technician app shows to the customer (Step 12). */
  async getPaymentSettings(tenantId: string): Promise<Record<string, unknown>> {
    const tenant = await this.findById(tenantId);
    const settings = (tenant.settings as Record<string, unknown>) || {};
    return (settings.payment_config as Record<string, unknown>) || {};
  }

  async updatePaymentSettings(
    tenantId: string,
    paymentConfig: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const tenant = await this.findById(tenantId);
    const settings = { ...((tenant.settings as Record<string, unknown>) || {}) };
    settings.payment_config = { ...((settings.payment_config as Record<string, unknown>) || {}), ...paymentConfig };
    await tenant.update({ settings });
    return settings.payment_config as Record<string, unknown>;
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
}
