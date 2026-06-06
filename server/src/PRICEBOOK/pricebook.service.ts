import {
  Injectable,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import { Pricebook } from './pricebook.entity';
import { CreatePricebookDto } from './dto/pricebook_create.dto';
import { UpdatePricebookDto } from './dto/pricebook_update.dto';
import { PageOptionsDto } from '../shared/dto/page-options.dto';
import { PageDto } from '../shared/dto/page.dto';
import { PageMetaDto } from '../shared/dto/page-meta.dto';
import { KEYNAMES } from '../shared/constants/keynames';
import { Op } from 'sequelize';

@Injectable()
export class PricebookService {
  constructor(
    @Inject(KEYNAMES.PRICEBOOK)
    private readonly pricebookRepository: typeof Pricebook,
  ) {}

  async findAllPaginated(
    tenantId: string,
    pageOptionsDto: PageOptionsDto,
  ): Promise<PageDto<Pricebook>> {
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

    const { count, rows } = await this.pricebookRepository.findAndCountAll({
      where,
      order: [['created_at', pageOptionsDto.order]],
      limit: pageOptionsDto.take,
      offset: pageOptionsDto.skip,
    });

    const meta = new PageMetaDto({ pageOptionsDto, itemCount: count });
    return new PageDto(rows, meta);
  }

  async findAll(tenantId: string): Promise<Pricebook[]> {
    return this.pricebookRepository.findAll({
      where: { tenant_id: tenantId, is_deleted: false },
      order: [['created_at', 'DESC']],
    });
  }

  async findById(id: string, tenantId: string): Promise<Pricebook> {
    const pricebook = await this.pricebookRepository.findOne({
      where: { id, tenant_id: tenantId, is_deleted: false },
    });
    if (!pricebook) {
      throw new NotFoundException('Pricebook entry not found');
    }
    return pricebook;
  }

  async create(tenantId: string, dto: CreatePricebookDto): Promise<Pricebook> {
    return this.pricebookRepository.create({
      tenant_id: tenantId,
      ...dto,
    });
  }

  async update(
    id: string,
    tenantId: string,
    dto: UpdatePricebookDto,
  ): Promise<Pricebook> {
    const pricebook = await this.findById(id, tenantId);
    await pricebook.update(dto);
    return pricebook;
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const pricebook = await this.findById(id, tenantId);
    await pricebook.update({ is_deleted: true });
  }
}
