import {
  Injectable,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import { Communication } from './communication.entity';
import { CreateCommunicationDto } from './dto/communication_create.dto';
import { UpdateCommunicationDto } from './dto/communication_update.dto';
import { PageOptionsDto } from '../shared/dto/page-options.dto';
import { PageDto } from '../shared/dto/page.dto';
import { PageMetaDto } from '../shared/dto/page-meta.dto';
import { KEYNAMES } from '../shared/constants/keynames';
import { Op } from 'sequelize';

@Injectable()
export class CommunicationService {
  constructor(
    @Inject(KEYNAMES.COMMUNICATION)
    private readonly communicationRepository: typeof Communication,
  ) {}

  async findAllPaginated(
    tenantId: string,
    pageOptionsDto: PageOptionsDto,
  ): Promise<PageDto<Communication>> {
    const where: Record<string, unknown> = {
      tenant_id: tenantId,
      is_deleted: false,
    };

    if (pageOptionsDto.search) {
      where[Op.or as unknown as string] = [
        { subject: { [Op.iLike]: `%${pageOptionsDto.search}%` } },
        { body: { [Op.iLike]: `%${pageOptionsDto.search}%` } },
      ];
    }

    const { count, rows } = await this.communicationRepository.findAndCountAll({
      where,
      order: [['created_at', pageOptionsDto.order]],
      limit: pageOptionsDto.take,
      offset: pageOptionsDto.skip,
    });

    const meta = new PageMetaDto({ pageOptionsDto, itemCount: count });
    return new PageDto(rows, meta);
  }

  async findAll(tenantId: string): Promise<Communication[]> {
    return this.communicationRepository.findAll({
      where: { tenant_id: tenantId, is_deleted: false },
      order: [['created_at', 'DESC']],
    });
  }

  async findById(id: string, tenantId: string): Promise<Communication> {
    const communication = await this.communicationRepository.findOne({
      where: { id, tenant_id: tenantId, is_deleted: false },
    });
    if (!communication) {
      throw new NotFoundException('Communication not found');
    }
    return communication;
  }

  async findByContactId(contactId: string, tenantId: string): Promise<Communication[]> {
    return this.communicationRepository.findAll({
      where: {
        contact_id: contactId,
        tenant_id: tenantId,
        is_deleted: false,
      },
      order: [['created_at', 'DESC']],
    });
  }

  async create(tenantId: string, dto: CreateCommunicationDto): Promise<Communication> {
    return this.communicationRepository.create({
      tenant_id: tenantId,
      ...dto,
    });
  }

  async update(
    id: string,
    tenantId: string,
    dto: UpdateCommunicationDto,
  ): Promise<Communication> {
    const communication = await this.findById(id, tenantId);
    await communication.update(dto);
    return communication;
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const communication = await this.findById(id, tenantId);
    await communication.update({ is_deleted: true });
  }
}
