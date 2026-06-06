import { Button, Card, Empty, List, Spin, Tag, Typography } from 'antd';
import {
  BellOutlined,
  CheckOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useTranslation } from 'react-i18next';
import {
  useNotifications,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
  useDeleteNotification,
} from '@/hooks/use-notifications';
import PageHeader from '@/components/common/PageHeader';
import type { Notification } from '@/types/models.types';

dayjs.extend(relativeTime);

const { Text } = Typography;

function NotificationItem({
  notification,
  onMarkRead,
  onDelete,
}: {
  notification: Notification;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const { t } = useTranslation();

  return (
    <List.Item
      style={{
        background: notification.is_read ? 'transparent' : '#f0f5ff',
        borderRadius: 8,
        marginBottom: 8,
        padding: '12px 16px',
        border: '1px solid',
        borderColor: notification.is_read ? '#f0f0f0' : '#adc6ff',
      }}
      actions={[
        !notification.is_read && (
          <Button
            key="read"
            type="text"
            icon={<CheckOutlined />}
            size="small"
            onClick={() => onMarkRead(notification.id)}
            title={t('notifications.markAsRead')}
          />
        ),
        <Button
          key="delete"
          type="text"
          icon={<DeleteOutlined />}
          size="small"
          danger
          onClick={() => onDelete(notification.id)}
          title={t('notifications.delete')}
        />,
      ].filter(Boolean)}
    >
      <List.Item.Meta
        avatar={
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: notification.is_read ? '#f5f5f5' : '#e6f0ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: notification.is_read ? '#8c8c8c' : '#2563eb',
              flexShrink: 0,
            }}
          >
            <BellOutlined style={{ fontSize: 16 }} />
          </div>
        }
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Text strong style={{ fontSize: 14 }}>
              {notification.title}
            </Text>
            {!notification.is_read && (
              <Tag color="blue" style={{ margin: 0, fontSize: 11 }}>
                {t('notifications.new')}
              </Tag>
            )}
          </div>
        }
        description={
          <div>
            <Text type="secondary" style={{ fontSize: 13, display: 'block' }}>
              {notification.body}
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {dayjs(notification.created_at).fromNow()}
            </Text>
          </div>
        }
      />
    </List.Item>
  );
}

export default function NotificationsPage() {
  const { t } = useTranslation();
  const { data, isLoading } = useNotifications({ take: 100 });
  const markAsRead = useMarkNotificationAsRead();
  const markAllRead = useMarkAllNotificationsAsRead();
  const deleteNotification = useDeleteNotification();

  const notifications = data?.data ?? [];
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const sorted = [...notifications].sort((a, b) => {
    if (a.is_read === b.is_read) return dayjs(b.created_at).diff(dayjs(a.created_at));
    return a.is_read ? 1 : -1;
  });

  return (
    <div style={{ padding: '24px' }}>
      <PageHeader
        title={t('notifications.title')}
        subtitle={unreadCount > 0 ? t('notifications.unreadCount', { count: unreadCount }) : t('notifications.allCaughtUp')}
        extra={
          unreadCount > 0 ? (
            <Button
              icon={<CheckCircleOutlined />}
              onClick={() => markAllRead.mutate()}
              loading={markAllRead.isPending}
            >
              {t('notifications.markAllAsRead')}
            </Button>
          ) : undefined
        }
      />

      <Card bodyStyle={{ padding: isLoading || sorted.length === 0 ? undefined : 0 }}>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <Spin size="large" />
          </div>
        ) : sorted.length === 0 ? (
          <Empty
            description={t('notifications.noNotifications')}
            style={{ padding: '60px 0' }}
          />
        ) : (
          <List
            dataSource={sorted}
            renderItem={(notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkRead={(id) => markAsRead.mutate(id)}
                onDelete={(id) => deleteNotification.mutate(id)}
              />
            )}
            style={{ padding: '8px 16px' }}
          />
        )}
      </Card>
    </div>
  );
}