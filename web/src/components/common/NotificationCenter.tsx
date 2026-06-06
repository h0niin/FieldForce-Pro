import { useState } from 'react';
import { Badge, Button, Drawer, List, Empty, Tag, Space, Tooltip } from 'antd';
import {
  BellOutlined,
  CheckOutlined,
  DeleteOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useUnreadNotifications, useMarkNotificationAsRead, useMarkAllNotificationsAsRead, useDeleteNotification } from '@/hooks/use-notifications';
import { formatRelative } from '@/utils/format-date';
import type { Notification } from '@/types/models.types';

const notificationTypeColors: Record<string, string> = {
  info: 'blue',
  success: 'green',
  warning: 'orange',
  error: 'red',
  mention: 'purple',
};

const notificationTypeIcons: Record<string, string> = {
  work_order: '📋',
  appointment: '📅',
  invoice: '💰',
  payment: '💳',
  service_request: '🔧',
  estimate: '📊',
  message: '💬',
  system: '⚙️',
};

export default function NotificationCenter() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [drawerVisible, setDrawerVisible] = useState(false);

  const { data: notifications = [], isLoading } = useUnreadNotifications();
  const markAsRead = useMarkNotificationAsRead();
  const markAllAsRead = useMarkAllNotificationsAsRead();
  const deleteNotification = useDeleteNotification();

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead.mutate(notification.id);
    }

    let data: Record<string, unknown> = {};
    if (notification.data) {
      if (typeof notification.data === 'string') {
        try { data = JSON.parse(notification.data); } catch { data = {}; }
      } else if (typeof notification.data === 'object' && !Array.isArray(notification.data)) {
        data = notification.data as Record<string, unknown>;
      }
    }

    const docTypeToEntityType: Record<string, string> = {
      WORK_ORDER: 'work_order',
      SERVICE_REQUEST: 'service_request',
      ESTIMATE: 'estimate',
      ESTIMATE_APPROVAL: 'estimate',
      INVOICE: 'invoice',
      PAYMENT: 'payment',
      SCHEDULE: 'schedule',
      FIELD_WORKFLOW: 'field_workflow',
    };

    const entityType =
      (data.entity_type as string) ||
      docTypeToEntityType[data.document_type as string] ||
      null;

    const entityId =
      (data.entity_id as string) ||
      (data.document_id as string) ||
      null;

    if (data.navigate_to === 'view_appointment' && data.appointment_id) {
      setDrawerVisible(false);
      navigate(`/scheduling?appointment_id=${data.appointment_id as string}`);
      return;
    }
    if (data.navigate_to === 'field_workflow' && data.work_order_id) {
      setDrawerVisible(false);
      navigate(`/work-orders?wo_id=${data.work_order_id as string}#field-workflow`);
      return;
    }
    if (data.navigate_to === 'create_schedule') {
      setDrawerVisible(false);
      navigate('/scheduling?tab=new');
      return;
    }
    if (notification.type === 'approval_required' && data.document_type === 'SCHEDULE') {
      setDrawerVisible(false);
      navigate('/workflow/document-approvals');
      return;
    }
    if (notification.type === 'approval_required' && data.document_type === 'ESTIMATE_APPROVAL') {
      setDrawerVisible(false);
      navigate('/estimates?tab=review');
      return;
    }
    if (data.navigate_to === 'edit_estimate' && data.estimate_id) {
      setDrawerVisible(false);
      navigate(`/estimates/${data.estimate_id}/edit`);
      return;
    }
    if (data.navigate_to === 'create_estimate' && data.service_request_id) {
      setDrawerVisible(false);
      navigate(`/estimates/new?service_request_id=${data.service_request_id}`);
      return;
    }

    if (entityType && entityId) {
      const routeMap: Record<string, string> = {
        work_order: `/work-orders/${entityId}#approvals`,
        field_workflow: `/work-orders?wo_id=${entityId}#field-workflow`,
        schedule: `/scheduling?tab=review&appointment_id=${entityId}`,
        service_appointment: `/scheduling?tab=review&appointment_id=${entityId}`,
        invoice: `/invoices/${entityId}`,
        payment: `/payments`,
        service_request: `/service-requests/${entityId}`,
        estimate: `/estimates/${entityId}`,
      };

      const route = routeMap[entityType];
      if (route) {
        setDrawerVisible(false);
        navigate(route);
      }
    }
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead.mutate();
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteNotification.mutate(id);
  };

  return (
    <>
      <Badge count={unreadCount} size="small" offset={[-2, 2]}>
        <BellOutlined
          style={{ fontSize: 18, cursor: 'pointer' }}
          onClick={() => setDrawerVisible(true)}
        />
      </Badge>

      <Drawer
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{t('notificationCenter.notifications')}</span>
            {unreadCount > 0 && (
              <Button
                type="link"
                size="small"
                icon={<CheckOutlined />}
                onClick={handleMarkAllAsRead}
                loading={markAllAsRead.isPending}
              >
                {t('notificationCenter.markAllAsRead')}
              </Button>
            )}
          </div>
        }
        placement="right"
        width={400}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        closeIcon={<CloseOutlined />}
      >
        {notifications.length === 0 ? (
          <Empty
            description={t('notificationCenter.noNotifications')}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            style={{ marginTop: 50 }}
          />
        ) : (
          <List
            loading={isLoading}
            dataSource={notifications}
            renderItem={(notification) => (
              <List.Item
                key={notification.id}
                style={{
                  cursor: 'pointer',
                  backgroundColor: notification.is_read ? 'transparent' : '#f0f7ff',
                  padding: '12px',
                  borderRadius: 8,
                  marginBottom: 8,
                  border: notification.is_read ? 'none' : '1px solid #d6e4ff',
                }}
                onClick={() => handleNotificationClick(notification)}
                actions={[
                  <Tooltip title={t('notificationCenter.delete')}>
                    <Button
                      type="text"
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={(e) => handleDelete(notification.id, e)}
                      loading={deleteNotification.isPending}
                    />
                  </Tooltip>,
                ]}
              >
                <List.Item.Meta
                  avatar={
                    <span style={{ fontSize: 24 }}>
                      {notificationTypeIcons[notification.type] || '📢'}
                    </span>
                  }
                  title={
                    <Space>
                      <span style={{ fontWeight: notification.is_read ? 400 : 600 }}>
                        {notification.title}
                      </span>
                      {!notification.is_read && <Tag color="blue">{t('notificationCenter.new')}</Tag>}
                    </Space>
                  }
                  description={
                    <div>
                      <div style={{ marginBottom: 4, fontSize: 13 }}>{notification.body}</div>
                      <div style={{ fontSize: 11, color: '#999' }}>
                        {formatRelative(notification.created_at)}
                      </div>
                      {notification.type && (
                        <Tag
                          color={notificationTypeColors[notification.type] || 'default'}
                          style={{ marginTop: 4, fontSize: 11 }}
                        >
                          {notification.type.toUpperCase()}
                        </Tag>
                      )}
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Drawer>
    </>
  );
}