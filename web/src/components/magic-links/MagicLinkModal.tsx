import { Modal, Typography, Alert, Space, Button, Tooltip } from 'antd';
import { CopyOutlined, CheckOutlined, LinkOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const { Text, Paragraph } = Typography;

interface MagicLinkModalProps {
  open: boolean;
  onClose: () => void;
  link: string;
  expiresAt: string;
  purpose: string;
}

const PURPOSE_LABELS: Record<string, string> = {
  super_admin_access: 'magicLinkModal.purposes.superAdminAccess',
  admin_onboarding: 'magicLinkModal.purposes.adminOnboarding',
  user_access: 'magicLinkModal.purposes.userAccess',
  user_onboarding: 'magicLinkModal.purposes.userInvitation',
};

export default function MagicLinkModal({ open, onClose, link, expiresAt, purpose }: MagicLinkModalProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const expiresDate = new Date(expiresAt);
  const expiresFormatted = expiresDate.toLocaleString();

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={
        <Space>
          <LinkOutlined />
          <span>{t('magicLinkModal.title')}</span>
        </Space>
      }
      footer={
        <Button type="primary" onClick={onClose}>
          {t('magicLinkModal.done')}
        </Button>
      }
      width={560}
    >
      <Space direction="vertical" style={{ width: '100%' }} size={16}>
        <Alert
          message={t('magicLinkModal.alertMessage')}
          description={t('magicLinkModal.alertDescription')}
          type="warning"
          showIcon
        />

        <div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {t('magicLinkModal.purpose')}: <strong>{PURPOSE_LABELS[purpose] ? t(PURPOSE_LABELS[purpose]) : purpose}</strong>
          </Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {t('magicLinkModal.expires')}: <strong>{expiresFormatted}</strong>
          </Text>
        </div>

        <div>
          <Text strong style={{ display: 'block', marginBottom: 8 }}>
            {t('magicLinkModal.magicLink')}
          </Text>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: '#f5f5f5',
              borderRadius: 6,
              padding: '8px 12px',
              border: '1px solid #d9d9d9',
            }}
          >
            <Paragraph
              style={{ flex: 1, margin: 0, fontSize: 12, wordBreak: 'break-all', color: '#1677ff' }}
              ellipsis={{ rows: 2, expandable: true }}
            >
              {link}
            </Paragraph>
            <Tooltip title={copied ? t('magicLinkModal.copied') : t('magicLinkModal.copyLink')}>
              <Button
                type="text"
                icon={copied ? <CheckOutlined style={{ color: '#52c41a' }} /> : <CopyOutlined />}
                onClick={handleCopy}
                size="small"
              />
            </Tooltip>
          </div>
        </div>
      </Space>
    </Modal>
  );
}