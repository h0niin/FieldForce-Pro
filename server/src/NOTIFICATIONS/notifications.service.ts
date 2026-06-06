import {
  Injectable,
  Inject,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Notification } from './notifications.entity';
import { User } from '../USERS/users.entity';
import { CreateNotificationDto } from './dto/notifications_create.dto';
import { UpdateNotificationDto } from './dto/notifications_update.dto';
import { PageOptionsDto } from '../shared/dto/page-options.dto';
import { PageDto } from '../shared/dto/page.dto';
import { PageMetaDto } from '../shared/dto/page-meta.dto';
import { KEYNAMES } from '../shared/constants/keynames';
import { PushNotificationService } from '../shared/services/push-notification.service';
import { Op } from 'sequelize';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @Inject(KEYNAMES.NOTIFICATIONS)
    private readonly notificationRepository: typeof Notification,
    @Inject(KEYNAMES.USERS)
    private readonly userRepository: typeof User,
    private readonly pushService: PushNotificationService,
  ) { }

  async findAllPaginated(
    tenantId: string,
    userId: string,
    pageOptionsDto: PageOptionsDto,
  ): Promise<PageDto<Notification>> {
    const where: Record<string, unknown> = {
      tenant_id: tenantId,
      user_id: userId,
      is_deleted: false,
    };

    if (pageOptionsDto.search) {
      where[Op.or as unknown as string] = [
        { title: { [Op.iLike]: `%${pageOptionsDto.search}%` } },
        { body: { [Op.iLike]: `%${pageOptionsDto.search}%` } },
        { type: { [Op.iLike]: `%${pageOptionsDto.search}%` } },
      ];
    }

    const { count, rows } = await this.notificationRepository.findAndCountAll({
      where,
      order: [['created_at', pageOptionsDto.order]],
      limit: pageOptionsDto.take,
      offset: pageOptionsDto.skip,
    });

    const meta = new PageMetaDto({ pageOptionsDto, itemCount: count });
    return new PageDto(rows, meta);
  }

  async findAll(tenantId: string, userId: string): Promise<Notification[]> {
    return this.notificationRepository.findAll({
      where: { tenant_id: tenantId, user_id: userId, is_deleted: false },
      order: [['created_at', 'DESC']],
    });
  }

  async findById(id: string, tenantId: string, userId?: string): Promise<Notification> {
    const whereClause: any = { id, tenant_id: tenantId, is_deleted: false };
    if (userId) {
      whereClause.user_id = userId;
    }
    const notification = await this.notificationRepository.findOne({
      where: whereClause,
    });
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }
    return notification;
  }

  async create(tenantId: string, dto: CreateNotificationDto): Promise<Notification> {
    this.logger.log(`[CREATE] Notification for user ${dto.user_id}: "${dto.title}"`);

    const notification = await this.notificationRepository.create({
      tenant_id: tenantId,
      ...dto,
    });

    // Send push notification in background — never blocks or throws
    this.sendPushForUser(dto.user_id, dto.title, dto.body, dto.data);

    return notification;
  }

  /**
   * Look up the user's push token and send a push notification.
   * Runs async and never throws — push failure is non-fatal.
   */
  private async sendPushForUser(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, unknown>,
  ): Promise<void> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId, is_deleted: false },
        attributes: ['fcm_token'],
      });

      if (user?.fcm_token) {
        await this.pushService.sendPush([user.fcm_token], title, body, data);
      }
    } catch (error) {
      this.logger.warn(`Failed to send push to user ${userId}: ${error}`);
    }
  }

  async update(
    id: string,
    tenantId: string,
    dto: UpdateNotificationDto,
  ): Promise<Notification> {
    const notification = await this.findById(id, tenantId);
    await notification.update(dto);
    return notification;
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const notification = await this.findById(id, tenantId);
    await notification.update({ is_deleted: true });
  }

  async findUnreadByUser(userId: string, tenantId: string): Promise<Notification[]> {
    return this.notificationRepository.findAll({
      where: {
        user_id: userId,
        tenant_id: tenantId,
        is_read: false,
        is_deleted: false,
      },
      order: [['created_at', 'DESC']],
      limit: 20,
    });
  }

  async markAsRead(id: string, tenantId: string, userId: string): Promise<Notification> {
    const notification = await this.findById(id, tenantId, userId);
    await notification.update({ is_read: true });
    return notification;
  }

  async markAllAsRead(userId: string, tenantId: string): Promise<void> {
    await this.notificationRepository.update(
      { is_read: true },
      {
        where: {
          user_id: userId,
          tenant_id: tenantId,
          is_deleted: false,
          is_read: false,
        },
      },
    );
  }
}
