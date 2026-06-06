import {
  Injectable,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import { Webform } from './webforms.entity';
import { CreateWebformDto } from './dto/webforms_create.dto';
import { UpdateWebformDto } from './dto/webforms_update.dto';
import { PageOptionsDto } from '../shared/dto/page-options.dto';
import { PageDto } from '../shared/dto/page.dto';
import { PageMetaDto } from '../shared/dto/page-meta.dto';
import { KEYNAMES } from '../shared/constants/keynames';
import { Op } from 'sequelize';

@Injectable()
export class WebformsService {
  constructor(
    @Inject(KEYNAMES.WEBFORMS)
    private readonly webformRepository: typeof Webform,
  ) {}

  async findAllPaginated(
    tenantId: string,
    pageOptionsDto: PageOptionsDto,
  ): Promise<PageDto<Webform>> {
    const where: Record<string, unknown> = {
      tenant_id: tenantId,
      is_deleted: false,
    };

    if (pageOptionsDto.search) {
      where[Op.or as unknown as string] = [
        { name: { [Op.iLike]: `%${pageOptionsDto.search}%` } },
      ];
    }

    const { count, rows } = await this.webformRepository.findAndCountAll({
      where,
      order: [['created_at', pageOptionsDto.order]],
      limit: pageOptionsDto.take,
      offset: pageOptionsDto.skip,
    });

    const meta = new PageMetaDto({ pageOptionsDto, itemCount: count });
    return new PageDto(rows, meta);
  }

  async findAll(tenantId: string): Promise<Webform[]> {
    return this.webformRepository.findAll({
      where: { tenant_id: tenantId, is_deleted: false },
      order: [['created_at', 'DESC']],
    });
  }

  async findById(id: string, tenantId: string): Promise<Webform> {
    const webform = await this.webformRepository.findOne({
      where: { id, tenant_id: tenantId, is_deleted: false },
    });
    if (!webform) {
      throw new NotFoundException('Webform not found');
    }
    return webform;
  }

  async create(tenantId: string, dto: CreateWebformDto): Promise<Webform> {
    return this.webformRepository.create({
      tenant_id: tenantId,
      ...dto,
    });
  }

  async update(
    id: string,
    tenantId: string,
    dto: UpdateWebformDto,
  ): Promise<Webform> {
    const webform = await this.findById(id, tenantId);
    await webform.update(dto);
    return webform;
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const webform = await this.findById(id, tenantId);
    await webform.update({ is_deleted: true });
  }
}
