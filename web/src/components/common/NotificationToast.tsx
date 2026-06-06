import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import { useNotificationStore, AppNotification } from '@/store/notification.store';
import { useUiStore } from '@/store/ui.store';

const LIGHT_THEME = {
  success: {
    bg: '#f0fdf4',
    border: '#86efac',
    iconBg: '#dcfce7',
    iconColor: '#16a34a',
    title: '#15803d',
    desc: '#4b5563',
    close: '#6b7280',
  },
  error: {
    bg: '#fef2f2',
    border: '#fca5a5',
    iconBg: '#fee2e2',
    iconColor: '#dc2626',
    title: '#b91c1c',
    desc: '#4b5563',
    close: '#6b7280',
  },
  warning: {
    bg: '#fffbeb',
    border: '#fcd34d',
    iconBg: '#fef3c7',
    iconColor: '#d97706',
    title: '#b45309',
    desc: '#4b5563',
    close: '#6b7280',
  },
  info: {
    bg: '#eff6ff',
    border: '#93c5fd',
    iconBg: '#dbeafe',
    iconColor: '#2563eb',
    title: '#1d4ed8',
    desc: '#4b5563',
    close: '#6b7280',
  },
};

const DARK_THEME = {
  success: {
    bg: '#052e16',
    border: '#166534',
    iconBg: '#14532d',
    iconColor: '#4ade80',
    title: '#86efac',
    desc: '#9ca3af',
    close: '#9ca3af',
  },
  error: {
    bg: '#350a0a',
    border: '#991b1b',
    iconBg: '#450a0a',
    iconColor: '#f87171',
    title: '#fca5a5',
    desc: '#9ca3af',
    close: '#9ca3af',
  },
  warning: {
    bg: '#351c05',
    border: '#92400e',
    iconBg: '#451a03',
    iconColor: '#fbbf24',
    title: '#fcd34d',
    desc: '#9ca3af',
    close: '#9ca3af',
  },
  info: {
    bg: '#0a1e3d',
    border: '#1e40af',
    iconBg: '#0c1f3d',
    iconColor: '#60a5fa',
    title: '#93c5fd',
    desc: '#9ca3af',
    close: '#9ca3af',
  },
};

const ICONS: Record<AppNotification['type'], typeof CheckCircleOutlined> = {
  success: CheckCircleOutlined,
  error: ExclamationCircleOutlined,
  warning: WarningOutlined,
  info: InfoCircleOutlined,
};

interface ToastItemProps {
  notification: AppNotification;
  onClose: (id: string) => void;
  isDark: boolean;
}

function ToastItem({ notification, onClose, isDark }: ToastItemProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const colors = isDark
    ? DARK_THEME[notification.type]
    : LIGHT_THEME[notification.type];
  const Icon = ICONS[notification.type];
  const hasDescription = !!notification.description;

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => onClose(notification.id), 250);
  };

  return (
    <div
      style={{
        width: 380,
        background: colors.bg,
        border: `1.5px solid ${colors.border}`,
        borderRadius: 12,
        padding: hasDescription ? '16px 16px 16px 16px' : '12px 16px',
        marginBottom: 12,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        boxShadow: isDark
          ? '0 8px 24px rgba(0,0,0,0.4)'
          : '0 8px 24px rgba(0,0,0,0.08)',
        transform: visible ? 'translateX(0)' : 'translateX(120%)',
        opacity: visible ? 1 : 0,
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease',
        pointerEvents: 'auto',
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: 36,
          height: 36,
          minWidth: 36,
          borderRadius: '50%',
          background: colors.iconBg,
          border: `2px solid ${colors.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: hasDescription ? 0 : 0,
        }}
      >
        <Icon style={{ fontSize: 18, color: colors.iconColor }} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontWeight: 600,
            fontSize: 14,
            color: colors.title,
            lineHeight: '20px',
            marginBottom: hasDescription ? 4 : 0,
          }}
        >
          {notification.message}
        </div>
        {hasDescription && (
          <div
            style={{
              fontSize: 13,
              color: colors.desc,
              lineHeight: '18px',
            }}
          >
            {notification.description}
          </div>
        )}
      </div>

      {/* Close */}
      <div
        onClick={handleClose}
        style={{
          cursor: 'pointer',
          color: colors.close,
          fontSize: 14,
          padding: 2,
          lineHeight: 1,
          flexShrink: 0,
        }}
      >
        <CloseOutlined />
      </div>
    </div>
  );
}

export default function NotificationToast() {
  const notifications = useNotificationStore((s) => s.notifications);
  const removeNotification = useNotificationStore((s) => s.remove);
  const isDark = useUiStore((s) => s.theme) === 'dark';

  if (notifications.length === 0) return null;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: 24,
        right: 24,
        zIndex: 9999,
        pointerEvents: 'none',
      }}
    >
      {notifications.map((n) => (
        <ToastItem
          key={n.id}
          notification={n}
          onClose={removeNotification}
          isDark={isDark}
        />
      ))}
    </div>,
    document.body,
  );
}
