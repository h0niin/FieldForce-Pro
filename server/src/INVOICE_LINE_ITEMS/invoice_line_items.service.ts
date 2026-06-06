import {
  Injectable,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import { InvoiceLineItem } from './invoice_line_items.entity';
import { CreateInvoiceLineItemDto } from './dto/invoice_line_items_create.dto';
import { UpdateInvoiceLineItemDto } from './dto/invoice_line_items_update.dto';
import { PageOptionsDto } from '../shared/dto/page-options.dto';
import { PageDto } from '../shared/dto/page.dto';
import { PageMetaDto } from '../shared/dto/page-meta.dto';
import { KEYNAMES } from '../shared/constants/keynames';
import { Op } from 'sequelize';

@Injectable()
export class InvoiceLineItemsService {
  constructor(
    @Inject(KEYNAMES.INVOICE_LINE_ITEMS)
    private readonly invoiceLineItemRepository: typeof InvoiceLineItem,
  ) {}

  async findAllPaginated(
    tenantId: string,
    pageOptionsDto: PageOptionsDto,
  ): Promise<PageDto<InvoiceLineItem>> {
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

    const { count, rows } = await this.invoiceLineItemRepository.findAndCountAll({
      where,
      order: [['created_at', pageOptionsDto.order]],
      limit: pageOptionsDto.take,
      offset: pageOptionsDto.skip,
    });

    const meta = new PageMetaDto({ pageOptionsDto, itemCount: count });
    return new PageDto(rows, meta);
  }

  async findAll(tenantId: string): Promise<InvoiceLineItem[]> {
    return this.invoiceLineItemRepository.findAll({
      where: { tenant_id: tenantId, is_deleted: false },
      order: [['created_at', 'DESC']],
    });
  }

  async findById(id: string, tenantId: string): Promise<InvoiceLineItem> {
    const lineItem = await this.invoiceLineItemRepository.findOne({
      where: { id, tenant_id: tenantId, is_deleted: false },
    });
    if (!lineItem) {
      throw new NotFoundException('Invoice line item not found');
    }
    return lineItem;
  }

  async findByInvoiceId(invoiceId: string, tenantId: string): Promise<InvoiceLineItem[]> {
    return this.invoiceLineItemRepository.findAll({
      where: {
        invoice_id: invoiceId,
        tenant_id: tenantId,
        is_deleted: false,
      },
      order: [['created_at', 'ASC']],
    });
  }

  async create(tenantId: string, dto: CreateInvoiceLineItemDto): Promise<InvoiceLineItem> {
    return this.invoiceLineItemRepository.create({
      tenant_id: tenantId,
      ...dto,
    });
  }

  async update(
    id: string,
    tenantId: string,
    dto: UpdateInvoiceLineItemDto,
  ): Promise<InvoiceLineItem> {
    const lineItem = await this.findById(id, tenantId);
    await lineItem.update(dto);
    return lineItem;
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const lineItem = await this.findById(id, tenantId);
    await lineItem.update({ is_deleted: true });
  }
}
