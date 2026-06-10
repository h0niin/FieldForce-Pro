import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ServiceLocation } from './service_locations.entity';
import { CreateServiceLocationDto } from './dto/service_locations_create.dto';
import { UpdateServiceLocationDto } from './dto/service_locations_update.dto';
import { PageOptionsDto } from '../shared/dto/page-options.dto';
import { PageDto } from '../shared/dto/page.dto';
import { PageMetaDto } from '../shared/dto/page-meta.dto';
import { KEYNAMES } from '../shared/constants/keynames';
import { Op } from 'sequelize';
import { ActivityLogsService } from '../ACTIVITY_LOGS/activity_logs.service';

@Injectable()
export class ServiceLocationsService {
  constructor(
    @Inject(KEYNAMES.SERVICE_LOCATIONS)
    private readonly serviceLocationRepository: typeof ServiceLocation,
    private readonly activityLogsService: ActivityLogsService,
  ) {}

  async findAllPaginated(
    tenantId: string,
    pageOptionsDto: PageOptionsDto,
  ): Promise<PageDto<ServiceLocation>> {
    const where: Record<string, unknown> = {
      tenant_id: tenantId,
      is_deleted: false,
    };

    if (pageOptionsDto.search) {
      where[Op.or as unknown as string] = [
        { address: { [Op.iLike]: `%${pageOptionsDto.search}%` } },
        { access_notes: { [Op.iLike]: `%${pageOptionsDto.search}%` } },
        { gate_code: { [Op.iLike]: `%${pageOptionsDto.search}%` } },
      ];
    }

    const { count, rows } = await this.serviceLocationRepository.findAndCountAll({
      where,
      order: [['created_at', pageOptionsDto.order]],
      limit: pageOptionsDto.take,
      offset: pageOptionsDto.skip,
    });

    const meta = new PageMetaDto({ pageOptionsDto, itemCount: count });
    return new PageDto(rows, meta);
  }

  async findAll(tenantId: string): Promise<ServiceLocation[]> {
    return this.serviceLocationRepository.findAll({
      where: { tenant_id: tenantId, is_deleted: false },
      order: [['address', 'ASC']],
    });
  }

  async findByContact(contactId: string, tenantId: string): Promise<ServiceLocation[]> {
    return this.serviceLocationRepository.findAll({
      where: {
        contact_id: contactId,
        tenant_id: tenantId,
        is_deleted: false,
      },
      order: [['created_at', 'DESC']],
    });
  }

  async findByCompany(companyId: string, tenantId: string): Promise<ServiceLocation[]> {
    return this.serviceLocationRepository.findAll({
      where: {
        company_id: companyId,
        tenant_id: tenantId,
        is_deleted: false,
      },
      order: [['created_at', 'DESC']],
    });
  }

  async findById(id: string, tenantId: string): Promise<ServiceLocation> {
    const serviceLocation = await this.serviceLocationRepository.findOne({
      where: { id, tenant_id: tenantId, is_deleted: false },
    });
    if (!serviceLocation) {
      throw new NotFoundException('Service location not found');
    }
    return serviceLocation;
  }

  async create(tenantId: string, dto: CreateServiceLocationDto): Promise<ServiceLocation> {
    const location = await this.serviceLocationRepository.create({
      tenant_id: tenantId,
      ...dto,
    });
    
    if (location.contact_id) {
      await this.activityLogsService.logActivity(tenantId, 'Contact', location.contact_id, 'LOCATION_ADDED', 'A new service location was added.');
    }
    if (location.company_id) {
      await this.activityLogsService.logActivity(tenantId, 'Company', location.company_id, 'LOCATION_ADDED', 'A new service location was added.');
    }

    return location;
  }

  async update(
    id: string,
    tenantId: string,
    dto: UpdateServiceLocationDto,
  ): Promise<ServiceLocation> {
    const serviceLocation = await this.findById(id, tenantId);
    await serviceLocation.update(dto);

    if (serviceLocation.contact_id) {
      await this.activityLogsService.logActivity(tenantId, 'Contact', serviceLocation.contact_id, 'UPDATED', 'A service location was updated.');
    }
    if (serviceLocation.company_id) {
      await this.activityLogsService.logActivity(tenantId, 'Company', serviceLocation.company_id, 'UPDATED', 'A service location was updated.');
    }

    return serviceLocation;
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const serviceLocation = await this.findById(id, tenantId);
    await serviceLocation.update({ is_deleted: true });
  }
}
