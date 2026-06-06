import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Param,
  Body,
  Query,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/notifications_create.dto';
import { UpdateNotificationDto } from './dto/notifications_update.dto';
import { PageOptionsDto } from '../shared/dto/page-options.dto';
import { DataResponseDto } from '../shared/dto/data-response.dto';
import { TenantId } from '../shared/decorator/tenant.decorator';
import { UserId } from '../shared/decorator/user.decorator';
import { Permissions } from '../shared/decorator/permission.decorator';
import { Request } from 'express';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) { }

  @Get()
  @ApiOperation({ summary: 'Get all notifications (paginated)' })
  async findAll(
    @TenantId() tenantId: string,
    @UserId() userId: string,
    @Query() pageOptionsDto: PageOptionsDto,
  ) {
    const result = await this.notificationsService.findAllPaginated(tenantId, userId, pageOptionsDto);
    return DataResponseDto.success(result.data, 'Notifications fetched successfully', {
      ...result.meta,
    } as unknown as Record<string, unknown>);
  }

  @Get('all')
  @ApiOperation({ summary: 'Get all notifications (non-paginated)' })
  async findAllNonPaginated(@TenantId() tenantId: string, @UserId() userId: string) {
    const notifications = await this.notificationsService.findAll(tenantId, userId);
    return DataResponseDto.success(notifications, 'Notifications fetched successfully');
  }

  @Get('unread')
  @ApiOperation({ summary: 'Get unread notifications for the current user' })
  async findUnread(@TenantId() tenantId: string, @UserId() userId: string) {
    const notifications = await this.notificationsService.findUnreadByUser(userId, tenantId);
    return DataResponseDto.success(notifications, 'Unread notifications fetched successfully');
  }

  @Patch('mark-all-read')
  @ApiOperation({ summary: 'Mark all notifications as read for the current user' })
  async markAllAsRead(@TenantId() tenantId: string, @UserId() userId: string) {
    await this.notificationsService.markAllAsRead(userId, tenantId);
    return DataResponseDto.success(null, 'All notifications marked as read');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get notification by ID' })
  async findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    const notification = await this.notificationsService.findById(id, tenantId);
    return DataResponseDto.success(notification);
  }

  @Post()
  @Permissions('notifications:create')
  @ApiOperation({ summary: 'Create a new notification' })
  async create(@TenantId() tenantId: string, @Body() dto: CreateNotificationDto) {
    const notification = await this.notificationsService.create(tenantId, dto);
    return DataResponseDto.created(notification, 'Notification created successfully');
  }

  @Put(':id')
  @Permissions('notifications:update')
  @ApiOperation({ summary: 'Update a notification' })
  async update(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Body() dto: UpdateNotificationDto,
  ) {
    const notification = await this.notificationsService.update(id, tenantId, dto);
    return DataResponseDto.success(notification, 'Notification updated successfully');
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  async markAsRead(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @UserId() userId: string,
  ) {
    const notification = await this.notificationsService.markAsRead(id, tenantId, userId);
    return DataResponseDto.success(notification, 'Notification marked as read');
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a notification (soft delete)' })
  async remove(@Param('id') id: string, @TenantId() tenantId: string) {
    await this.notificationsService.delete(id, tenantId);
    return DataResponseDto.success(null, 'Notification deleted successfully');
  }
}
