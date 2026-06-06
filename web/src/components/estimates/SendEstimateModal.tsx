import { useState } from 'react';
import {
  Modal, Button, Space, Alert, Tooltip, Input, Typography, message,
} from 'antd';
import {
  SendOutlined, WhatsAppOutlined, MailOutlined, CopyOutlined, LinkOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useEstimate, useGenerateEstimateLink } from '@/hooks/use-estimates';

interface SendEstimateModalProps {
  estimateId: string | null;
  onClose: () => void;
}

export default function SendEstimateModal({ estimateId, onClose }: SendEstimateModalProps) {
  const { t } = useTranslation();
  const { data: estimate } = useEstimate(estimateId || '');
  const generateLink = useGenerateEstimateLink();

  const [emailModalVisible, setEmailModalVisible] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');

  const contactPhone = (estimate?.contact as Record<string, unknown> | undefined)?.phone as string | undefined;
  const contactEmail = (estimate?.contact as Record<string, unknown> | undefined)?.email as string | undefined;
  const contactFirstName = (estimate?.contact as Record<string, unknown> | undefined)?.first_name as string | undefined;

  const getMagicLink = async (): Promise<string | null> => {
    if (!estimateId) return null;
    try {
      const resp = await generateLink.mutateAsync(estimateId);
      const token = resp.data?.data?.public_token;
      if (token) return `${window.location.origin}/estimate/sign/${token}`;
      return null;
    } catch { return null; }
  };

  const handleSendWhatsApp = async () => {
    if (!contactPhone) { Modal.warning({ title: t('sendEstimateModal.noPhoneNumber'), content: t('sendEstimateModal.noPhoneOnRecord') }); return; }
    const phone = contactPhone.replace(/\D/g, '');
    if (!phone) { Modal.warning({ title: t('sendEstimateModal.invalidPhoneNumber'), content: t('sendEstimateModal.noDigits') }); return; }
    const link = await getMagicLink();
    const firstName = contactFirstName || t('sendEstimateModal.there');
    const total = Number(estimate?.total || 0).toFixed(2);
    const ref = estimate?.estimate_number || estimateId?.slice(0, 8) || '';
    const expiryLine = estimate?.expiry_date ? `\n${t('sendEstimateModal.validUntil')}: ${estimate.expiry_date}` : '';
    const msg = encodeURIComponent(`${t('sendEstimateModal.hi')} ${firstName},\n\n${t('sendEstimateModal.estimate')} *${ref}* ${t('sendEstimateModal.isReady')}.\n*${t('sendEstimateModal.total')}: $${total}*${expiryLine}\n\n${t('sendEstimateModal.pleaseReview')}:\n${link ?? ''}\n\n${t('sendEstimateModal.linkExpires')}`);
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
    onClose();
  };

  const handleSendEmail = async () => {
    const link = await getMagicLink();
    setGeneratedLink(link || '');
    setEmailModalVisible(true);
  };

  const handleCopyLink = async () => {
    const link = await getMagicLink();
    if (link) {
      navigator.clipboard.writeText(link).then(() => { void message.success(t('sendEstimateModal.linkCopied')); });
    } else {
      void message.error(t('sendEstimateModal.failedToGenerate'));
    }
    onClose();
  };

  const handleEmailModalClose = () => {
    setEmailModalVisible(false);
    onClose();
  };

  return (
    <>
      {/* ── Main Send Modal ── */}
      <Modal
        title={
          <Space>
            <SendOutlined style={{ color: '#1677ff' }} />
            <span>{t('sendEstimateModal.title')}</span>
          </Space>
        }
        open={!!estimateId && !emailModalVisible}
        onCancel={onClose}
        footer={null}
        width={440}
      >
        <Alert
          message={t('sendEstimateModal.alertMessage')}
          description={t('sendEstimateModal.alertDescription')}
          type="success"
          showIcon
          style={{ marginBottom: 20 }}
        />

        <Space direction="vertical" style={{ width: '100%' }} size={10}>
          {/* WhatsApp */}
          <Tooltip title={!contactPhone ? t('sendEstimateModal.noPhoneTooltip') : ''}>
            <Button
              block
              icon={<WhatsAppOutlined />}
              style={{
                background: contactPhone ? '#25D366' : undefined,
                borderColor: contactPhone ? '#25D366' : undefined,
                color: contactPhone ? '#fff' : undefined,
                height: 44,
                fontWeight: 500,
                fontSize: 14,
              }}
              onClick={() => void handleSendWhatsApp()}
              loading={generateLink.isPending}
              disabled={!contactPhone}
            >
              {t('sendEstimateModal.sendWhatsApp')}
            </Button>
          </Tooltip>
          {contactPhone && <div style={{ fontSize: 11, color: '#aaa', marginTop: -6, paddingLeft: 2 }}>{contactPhone}</div>}

          {/* Email */}
          <Tooltip title={!contactEmail ? t('sendEstimateModal.noEmailTooltip') : ''}>
            <Button
              block
              icon={<MailOutlined />}
              style={{ height: 44, fontWeight: 500, fontSize: 14 }}
              onClick={() => void handleSendEmail()}
              loading={generateLink.isPending}
              disabled={!contactEmail}
            >
              {t('sendEstimateModal.sendEmail')}
            </Button>
          </Tooltip>
          {contactEmail && <div style={{ fontSize: 11, color: '#aaa', marginTop: -6, paddingLeft: 2 }}>{contactEmail}</div>}

          {/* Copy Link */}
          <Button
            block
            icon={<CopyOutlined />}
            style={{ height: 44, fontWeight: 500, fontSize: 14 }}
            onClick={() => void handleCopyLink()}
            loading={generateLink.isPending}
          >
            {t('sendEstimateModal.copyLink')}
          </Button>

          {/* Skip */}
          <Button
            block
            type="text"
            style={{ height: 36, color: '#999' }}
            onClick={onClose}
          >
            {t('sendEstimateModal.skip')}
          </Button>
        </Space>
      </Modal>

      {/* ── Email Link Modal ── */}
      <Modal
        title={<Space><MailOutlined /><span>{t('sendEstimateModal.sendViaEmail')}</span></Space>}
        open={emailModalVisible}
        onCancel={handleEmailModalClose}
        footer={[
          <Button key="close" onClick={handleEmailModalClose}>{t('sendEstimateModal.close')}</Button>,
          generatedLink && (
            <Button key="mailto" type="primary" icon={<MailOutlined />} onClick={() => {
              const subject = encodeURIComponent(`${t('sendEstimateModal.estimate')} ${estimate?.estimate_number || estimateId?.slice(0, 8) || ''} — ${t('sendEstimateModal.reviewAndSign')}`);
              const body = encodeURIComponent(`${t('sendEstimateModal.hello')},\n\n${t('sendEstimateModal.pleaseReviewAndSign')}:\n${generatedLink}\n\n${t('sendEstimateModal.thankYou')}.`);
              window.open(`mailto:${contactEmail || ''}?subject=${subject}&body=${body}`, '_blank');
            }}>{t('sendEstimateModal.openInMail')}</Button>
          ),
        ]}
      >
        {generatedLink ? (
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <Alert message={t('sendEstimateModal.linkGenerated')} description={t('sendEstimateModal.shareLink')} type="success" showIcon icon={<LinkOutlined />} />
            <div>
              <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 6 }}>{t('sendEstimateModal.signLink')}:</Typography.Text>
              <Input.Group compact>
                <Input value={generatedLink} readOnly style={{ width: 'calc(100% - 110px)' }} />
                <Button icon={<CopyOutlined />} onClick={() => { navigator.clipboard.writeText(generatedLink).then(() => { void message.success(t('sendEstimateModal.linkCopied')); }); }} style={{ width: 110 }}>{t('sendEstimateModal.copyLink')}</Button>
              </Input.Group>
            </div>
          </Space>
        ) : (
          <Alert message={t('sendEstimateModal.errorGeneration')} type="error" showIcon />
        )}
      </Modal>
    </>
  );
}