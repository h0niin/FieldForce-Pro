import {
  Injectable,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import { Webhook } from './webhooks.entity';
import { CreateWebhookDto } from './dto/webhooks_create.dto';
import { UpdateWebhookDto } from './dto/webhooks_update.dto';
import { PageOptionsDto } from '../shared/dto/page-options.dto';
import { PageDto } from '../shared/dto/page.dto';
import { PageMetaDto } from '../shared/dto/page-meta.dto';
import { KEYNAMES } from '../shared/constants/keynames';
import { Op } from 'sequelize';

@Injectable()
export class WebhooksService {
  constructor(
    @Inject(KEYNAMES.WEBHOOKS)
    private readonly webhookRepository: typeof Webhook,
  ) {}

  async findAllPaginated(
    tenantId: string,
    pageOptionsDto: PageOptionsDto,
  ): Promise<PageDto<Webhook>> {
    const where: Record<string, unknown> = {
      tenant_id: tenantId,
      is_deleted: false,
    };

    if (pageOptionsDto.search) {
      where[Op.or as unknown as string] = [
        { name: { [Op.iLike]: `%${pageOptionsDto.search}%` } },
        { url: { [Op.iLike]: `%${pageOptionsDto.search}%` } },
      ];
    }

    const { count, rows } = await this.webhookRepository.findAndCountAll({
      where,
      order: [['created_at', pageOptionsDto.order]],
      limit: pageOptionsDto.take,
      offset: pageOptionsDto.skip,
    });

    const meta = new PageMetaDto({ pageOptionsDto, itemCount: count });
    return new PageDto(rows, meta);
  }

  async findAll(tenantId: string): Promise<Webhook[]> {
    return this.webhookRepository.findAll({
      where: { tenant_id: tenantId, is_deleted: false },
      order: [['created_at', 'DESC']],
    });
  }

  async findById(id: string, tenantId: string): Promise<Webhook> {
    const webhook = await this.webhookRepository.findOne({
      where: { id, tenant_id: tenantId, is_deleted: false },
    });
    if (!webhook) {
      throw new NotFoundException('Webhook not found');
    }
    return webhook;
  }

  async create(tenantId: string, dto: CreateWebhookDto): Promise<Webhook> {
    return this.webhookRepository.create({
      tenant_id: tenantId,
      ...dto,
    });
  }

  async update(
    id: string,
    tenantId: string,
    dto: UpdateWebhookDto,
  ): Promise<Webhook> {
    const webhook = await this.findById(id, tenantId);
    await webhook.update(dto);
    return webhook;
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const webhook = await this.findById(id, tenantId);
    await webhook.update({ is_deleted: true });
  }
}
