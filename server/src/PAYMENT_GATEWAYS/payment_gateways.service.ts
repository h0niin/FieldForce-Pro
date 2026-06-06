import {
  Injectable,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import { PaymentGateway } from './payment_gateways.entity';
import { CreatePaymentGatewayDto } from './dto/payment_gateways_create.dto';
import { UpdatePaymentGatewayDto } from './dto/payment_gateways_update.dto';
import { PageOptionsDto } from '../shared/dto/page-options.dto';
import { PageDto } from '../shared/dto/page.dto';
import { PageMetaDto } from '../shared/dto/page-meta.dto';
import { KEYNAMES } from '../shared/constants/keynames';
import { Op } from 'sequelize';

@Injectable()
export class PaymentGatewaysService {
  constructor(
    @Inject(KEYNAMES.PAYMENT_GATEWAYS)
    private readonly paymentGatewayRepository: typeof PaymentGateway,
  ) {}

  async findAllPaginated(
    tenantId: string,
    pageOptionsDto: PageOptionsDto,
  ): Promise<PageDto<PaymentGateway>> {
    const where: Record<string, unknown> = {
      tenant_id: tenantId,
      is_deleted: false,
    };

    if (pageOptionsDto.search) {
      where[Op.or as unknown as string] = [
        { gateway_name: { [Op.iLike]: `%${pageOptionsDto.search}%` } },
      ];
    }

    const { count, rows } = await this.paymentGatewayRepository.findAndCountAll({
      where,
      order: [['created_at', pageOptionsDto.order]],
      limit: pageOptionsDto.take,
      offset: pageOptionsDto.skip,
    });

    const meta = new PageMetaDto({ pageOptionsDto, itemCount: count });
    return new PageDto(rows, meta);
  }

  async findAll(tenantId: string): Promise<PaymentGateway[]> {
    return this.paymentGatewayRepository.findAll({
      where: { tenant_id: tenantId, is_deleted: false },
      order: [['created_at', 'DESC']],
    });
  }

  async findById(id: string, tenantId: string): Promise<PaymentGateway> {
    const gateway = await this.paymentGatewayRepository.findOne({
      where: { id, tenant_id: tenantId, is_deleted: false },
    });
    if (!gateway) {
      throw new NotFoundException('Payment gateway not found');
    }
    return gateway;
  }

  async create(tenantId: string, dto: CreatePaymentGatewayDto): Promise<PaymentGateway> {
    return this.paymentGatewayRepository.create({
      tenant_id: tenantId,
      ...dto,
    });
  }

  async update(
    id: string,
    tenantId: string,
    dto: UpdatePaymentGatewayDto,
  ): Promise<PaymentGateway> {
    const gateway = await this.findById(id, tenantId);
    await gateway.update(dto);
    return gateway;
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const gateway = await this.findById(id, tenantId);
    await gateway.update({ is_deleted: true });
  }
}
