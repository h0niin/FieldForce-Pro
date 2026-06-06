import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Review } from './reviews.entity';
import { WorkOrder } from '../WORK_ORDERS/work_orders.entity';
import { Contact } from '../CONTACTS/contacts.entity';
import { WorkOrderTechnicianSession } from '../WORK_ORDER_TECHNICIAN_SESSIONS/work_order_technician_sessions.entity';
import { CreateReviewDto } from './dto/reviews_create.dto';
import { UpdateReviewDto } from './dto/reviews_update.dto';
import { PageOptionsDto } from '../shared/dto/page-options.dto';
import { PageDto } from '../shared/dto/page.dto';
import { PageMetaDto } from '../shared/dto/page-meta.dto';
import { KEYNAMES } from '../shared/constants/keynames';
import { Op } from 'sequelize';

@Injectable()
export class ReviewsService {
  constructor(
    @Inject(KEYNAMES.REVIEWS)
    private readonly reviewRepository: typeof Review,
    @Inject(KEYNAMES.WORK_ORDERS)
    private readonly workOrderRepository: typeof WorkOrder,
    @Inject(KEYNAMES.WORK_ORDER_TECHNICIAN_SESSIONS)
    private readonly techSessionRepository: typeof WorkOrderTechnicianSession,
  ) {}

  async findAllPaginated(
    tenantId: string,
    pageOptionsDto: PageOptionsDto,
  ): Promise<PageDto<Review>> {
    const where: Record<string, unknown> = {
      tenant_id: tenantId,
      is_deleted: false,
    };

    if (pageOptionsDto.search) {
      where[Op.or as unknown as string] = [
        { comment: { [Op.iLike]: `%${pageOptionsDto.search}%` } },
        { platform: { [Op.iLike]: `%${pageOptionsDto.search}%` } },
      ];
    }

    const { count, rows } = await this.reviewRepository.findAndCountAll({
      where,
      include: [
        {
          model: WorkOrder,
          attributes: ['id', 'wo_number', 'summary'],
        },
        {
          model: Contact,
          attributes: ['id', 'first_name', 'last_name'],
        },
      ],
      order: [['created_at', pageOptionsDto.order]],
      limit: pageOptionsDto.take,
      offset: pageOptionsDto.skip,
    });

    const meta = new PageMetaDto({ pageOptionsDto, itemCount: count });
    return new PageDto(rows, meta);
  }

  async findById(id: string, tenantId: string): Promise<Review> {
    const review = await this.reviewRepository.findOne({
      where: { id, tenant_id: tenantId, is_deleted: false },
    });
    if (!review) {
      throw new NotFoundException('Review not found');
    }
    return review;
  }

  async findByWorkOrderId(workOrderId: string, tenantId: string): Promise<Review[]> {
    return this.reviewRepository.findAll({
      where: { work_order_id: workOrderId, tenant_id: tenantId, is_deleted: false },
      order: [['created_at', 'DESC']],
    });
  }

  async create(tenantId: string, dto: CreateReviewDto): Promise<Review> {
    const review = await this.reviewRepository.create({
      tenant_id: tenantId,
      ...dto,
    });

    // Update work order status to "completed" if currently in progress
    if (dto.work_order_id) {
      const workOrder = await this.workOrderRepository.findOne({
        where: { id: dto.work_order_id, tenant_id: tenantId, is_deleted: false },
      });
      if (workOrder) {
        const completableStatuses = ['in_progress', 'on_hold', 'scheduled'];
        if (completableStatuses.includes(workOrder.status)) {
          await workOrder.update({ status: 'completed' });
        }

        // Update technician session step to "finished" so the progress bar reaches 100%
        const techSession = await this.techSessionRepository.findOne({
          where: { work_order_id: dto.work_order_id, is_deleted: false },
        });
        if (techSession && techSession.step !== 'finished') {
          await techSession.update({
            step: 'finished',
            finished_at: new Date(),
          });
        }
      }
    }

    return review;
  }

  async update(
    id: string,
    tenantId: string,
    dto: UpdateReviewDto,
  ): Promise<Review> {
    const review = await this.findById(id, tenantId);
    await review.update(dto);
    return review;
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const review = await this.findById(id, tenantId);
    await review.update({ is_deleted: true });
  }
}
