import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ServiceAgreement } from './service_agreements.entity';
import { CreateServiceAgreementDto } from './dto/service_agreements_create.dto';
import { UpdateServiceAgreementDto } from './dto/service_agreements_update.dto';
import { PageOptionsDto } from '../shared/dto/page-options.dto';
import { PageDto } from '../shared/dto/page.dto';
import { PageMetaDto } from '../shared/dto/page-meta.dto';
import { KEYNAMES } from '../shared/constants/keynames';
import { Op } from 'sequelize';

const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  draft: ['active', 'cancelled'],
  active: ['expired', 'cancelled', 'renewed'],
  expired: ['renewed'],
  renewed: ['active'],
  cancelled: [],
};

@Injectable()
export class ServiceAgreementsService {
  constructor(
    @Inject(KEYNAMES.SERVICE_AGREEMENTS)
    private readonly serviceAgreementRepository: typeof ServiceAgreement,
  ) {}

  async findAllPaginated(
    tenantId: string,
    pageOptionsDto: PageOptionsDto,
  ): Promise<PageDto<ServiceAgreement>> {
    const where: Record<string, unknown> = {
      tenant_id: tenantId,
      is_deleted: false,
    };

    if (pageOptionsDto.search) {
      where[Op.or as unknown as string] = [
        { name: { [Op.iLike]: `%${pageOptionsDto.search}%` } },
        { description: { [Op.iLike]: `%${pageOptionsDto.search}%` } },
      ];
    }

    const { count, rows } = await this.serviceAgreementRepository.findAndCountAll({
      where,
      order: [['created_at', pageOptionsDto.order]],
      limit: pageOptionsDto.take,
      offset: pageOptionsDto.skip,
    });

    const meta = new PageMetaDto({ pageOptionsDto, itemCount: count });
    return new PageDto(rows, meta);
  }

  async findAll(tenantId: string): Promise<ServiceAgreement[]> {
    return this.serviceAgreementRepository.findAll({
      where: { tenant_id: tenantId, is_deleted: false },
      order: [['created_at', 'DESC']],
    });
  }

  async findById(id: string, tenantId: string): Promise<ServiceAgreement> {
    const agreement = await this.serviceAgreementRepository.findOne({
      where: { id, tenant_id: tenantId, is_deleted: false },
    });
    if (!agreement) {
      throw new NotFoundException('Service agreement not found');
    }
    return agreement;
  }

  async create(tenantId: string, dto: CreateServiceAgreementDto): Promise<ServiceAgreement> {
    return this.serviceAgreementRepository.create({
      tenant_id: tenantId,
      ...dto,
    });
  }

  async update(
    id: string,
    tenantId: string,
    dto: UpdateServiceAgreementDto,
  ): Promise<ServiceAgreement> {
    const agreement = await this.findById(id, tenantId);
    await agreement.update(dto);
    return agreement;
  }

  async updateStatus(
    id: string,
    tenantId: string,
    newStatus: string,
  ): Promise<ServiceAgreement> {
    const agreement = await this.findById(id, tenantId);
    const currentStatus = agreement.status;

    const allowedTransitions = VALID_STATUS_TRANSITIONS[currentStatus];
    if (!allowedTransitions) {
      throw new BadRequestException(
        `No transitions allowed from status '${currentStatus}'`,
      );
    }

    if (!allowedTransitions.includes(newStatus)) {
      throw new BadRequestException(
        `Invalid status transition from '${currentStatus}' to '${newStatus}'. Allowed transitions: ${allowedTransitions.join(', ')}`,
      );
    }

    await agreement.update({ status: newStatus });
    return agreement;
  }

  async renew(
    id: string,
    tenantId: string,
  ): Promise<ServiceAgreement> {
    const agreement = await this.findById(id, tenantId);
    const currentStatus = agreement.status;

    if (!['active', 'expired'].includes(currentStatus)) {
      throw new BadRequestException(
        `Cannot renew agreement with status '${currentStatus}'. Only active or expired agreements can be renewed.`,
      );
    }

    await agreement.update({ status: 'renewed' });
    return agreement;
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const agreement = await this.findById(id, tenantId);
    await agreement.update({ is_deleted: true });
  }
}
