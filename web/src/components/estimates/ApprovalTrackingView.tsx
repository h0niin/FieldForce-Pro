import { useState } from 'react';
import {
  Collapse,
  Tag,
  Button,
  Space,
  Modal,
  Input,
  Alert,
  Typography,
  Tooltip,
  message,
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  SendOutlined,
  EyeOutlined,
  FileTextOutlined,
  SignatureOutlined,
  WhatsAppOutlined,
  MailOutlined,
  CopyOutlined,
  LinkOutlined,
  RollbackOutlined,
  SafetyCertificateOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { formatDateTime } from '@/utils/format-date';
import type { Estimate } from '@/types/models.types';
import {
  useSendEstimate,
  useApproveEstimate,
  useRejectEstimate,
  useConvertEstimateToWorkOrder,
  useGenerateEstimateLink,
  useRevertEstimateToDraft,
} from '@/hooks/use-estimates';
import { useApprovalsByDocument } from '@/hooks/use-workflow';
import { useTranslation } from 'react-i18next';

const { TextArea } = Input;
const { Text } = Typography;

interface ApprovalTrackingViewProps {
  estimate: Estimate;
}

export default function ApprovalTrackingView({ estimate }: ApprovalTrackingViewProps) {
  const { t } = useTranslation();

  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [convertModalVisible, setConvertModalVisible] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [emailLinkModalVisible, setEmailLinkModalVisible] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');
  const [revertModalVisible, setRevertModalVisible] = useState(false);

  const sendEstimate = useSendEstimate();
  const generateLink = useGenerateEstimateLink();
  const revertToDraft = useRevertEstimateToDraft();
  const approveEstimate = useApproveEstimate();
  const rejectEstimate = useRejectEstimate();
  const convertToWorkOrder = useConvertEstimateToWorkOrder();

  const { data: internalApprovals } = useApprovalsByDocument(estimate.id);

  const contactPhone = (estimate.contact as Record<string, unknown> | undefined)?.phone as string | undefined;
  const contactEmail = (estimate.contact as Record<string, unknown> | undefined)?.email as string | undefined;

  const hasInternalApprovals = (internalApprovals?.length ?? 0) > 0;
  const allInternalApproved = hasInternalApprovals && internalApprovals!.every((a) => ['APPROVED', 'SKIPPED'].includes(a.status));
  const anyInternalRejected = internalApprovals?.some((a) => a.status === 'REJECTED');
  const currentPendingApprover = internalApprovals?.find((a) => a.status === 'PENDING');
  const internalStage2Unlocked = !hasInternalApprovals || allInternalApproved;

  const isExpired = estimate.expiry_date && new Date(estimate.expiry_date) < new Date();
  const cf = estimate.custom_fields as Record<string, unknown> | undefined;
  const isCustomerSigned = !!(cf?.signed_at);
  const signedAt = cf?.signed_at as string | undefined;
  const canRevertToDraft = ['sent', 'viewed', 'approved', 'rejected'].includes(estimate.status);

  // ── Status helpers ──
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft': return t('approvalTrackingView.statusDraft');
      case 'sent': return t('approvalTrackingView.statusSent');
      case 'viewed': return t('approvalTrackingView.statusViewed');
      case 'approved': return isCustomerSigned ? t('approvalTrackingView.statusCustomerApprovedTag') : t('approvalTrackingView.statusApproved');
      case 'rejected': return t('approvalTrackingView.statusRejected');
      case 'expired': return t('approvalTrackingView.statusExpired');
      case 'converted_to_wo': return t('approvalTrackingView.statusConvertedToWo');
      default: return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
    }
  };

  const getStatusColor = (status: string): string => ({
    draft: 'default', sent: 'processing', viewed: 'blue',
    approved: 'success', rejected: 'error', expired: 'warning', converted_to_wo: 'purple',
  } as Record<string, string>)[status] || 'default';

  const getStatusDotColor = (status: string): string => ({
    draft: '#d9d9d9', sent: '#1677ff', viewed: '#13c2c2',
    approved: '#52c41a', rejected: '#ff4d4f', expired: '#fa8c16', converted_to_wo: '#722ed1',
  } as Record<string, string>)[status] || '#d9d9d9';

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return <SendOutlined />;
      case 'viewed': return <EyeOutlined />;
      case 'approved': return isCustomerSigned ? <SafetyCertificateOutlined /> : <CheckCircleOutlined />;
      case 'rejected': return <CloseCircleOutlined />;
      case 'expired': return <ClockCircleOutlined />;
      default: return <FileTextOutlined />;
    }
  };


  const getMagicLink = async (): Promise<string | null> => {
    try {
      const resp = await generateLink.mutateAsync(estimate.id);
      const token = resp.data?.data?.public_token;
      if (token) return `${window.location.origin}/estimate/sign/${token}`;
      return null;
    } catch { return null; }
  };

  const handleSendWhatsApp = async () => {
    if (!contactPhone) { Modal.warning({ title: t('approvalTrackingView.noPhoneNumberTitle'), content: t('approvalTrackingView.noPhoneNumberContent') }); return; }
    const phone = contactPhone.replace(/\D/g, '');
    if (!phone) { Modal.warning({ title: t('approvalTrackingView.invalidPhoneNumberTitle'), content: t('approvalTrackingView.invalidPhoneNumberContent') }); return; }
    const link = await getMagicLink();
    const firstName = (estimate.contact as Record<string, unknown> | undefined)?.first_name as string || t('common.there');
    const total = Number(estimate.total || 0).toFixed(2);
    const ref = estimate.estimate_number || estimate.id.slice(0, 8);
    const expiryLine = estimate.expiry_date ? `\n${t('approvalTrackingView.validUntil', { date: estimate.expiry_date })}` : '';
    const msg = encodeURIComponent(
      t('approvalTrackingView.whatsAppMessage', {
        firstName,
        ref,
        total,
        expiryLine,
        link: link ?? '',
        // escapeValue: false is important if expiryLine contains already formatted content.
        // For basic string interpolation, it defaults to true and is fine.
        // It's safer to not set it explicitly unless absolutely necessary.
      })
    );
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
  };

  const handleSendEmail = async () => {
    const link = await getMagicLink();
    setGeneratedLink(link || '');
    setEmailLinkModalVisible(true);
  };

  const handleCopyLink = (link: string) => {
    navigator.clipboard.writeText(link).then(() => { void message.success(t('approvalTrackingView.linkCopiedToClipboard')); });
  };

  const handleApprove = () => {
    Modal.confirm({
      title: t('approvalTrackingView.approveEstimateTitle'),
      content: t('approvalTrackingView.approveEstimateContent'),
      icon: <CheckCircleOutlined />,
      okText: t('common.approve'),
      onOk: async () => { await approveEstimate.mutateAsync({ id: estimate.id }); },
    });
  };

  const handleRejectConfirm = async () => {
    await rejectEstimate.mutateAsync({ id: estimate.id, reason: rejectionReason });
    setRejectModalVisible(false);
    setRejectionReason('');
  };

  const handleConvertConfirm = async () => {
    await convertToWorkOrder.mutateAsync({ id: estimate.id });
    setConvertModalVisible(false);
  };

  const openSignatureModal = () => {
    Modal.info({
      title: t('approvalTrackingView.customerSignatureTitle'),
      width: 480,
      icon: <SignatureOutlined />,
      okText: t('common.close'),
      content: (
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <div style={{ border: '1px solid var(--border-color)', borderRadius: 8, background: 'var(--bg-color)', padding: 12, display: 'inline-block' }}>
            <img src={estimate.signature_url!} alt={t('approvalTrackingView.customerSignatureAlt')} style={{ maxWidth: 380, maxHeight: 160, display: 'block' }} />
          </div>
          {isCustomerSigned && signedAt && <div style={{ marginTop: 12, opacity: 0.5, fontSize: 13 }}>{t('approvalTrackingView.signedOnDisplay', { date: formatDateTime(signedAt) })}</div>}
          {estimate.contact && <div style={{ marginTop: 4, fontWeight: 600, fontSize: 13 }}>{estimate.contact.first_name} {estimate.contact.last_name}</div>}
        </div>
      ),
    });
  };

  // ── Panel style shared ──
  const panelStyle: React.CSSProperties = {
    marginBottom: 8,
    borderRadius: 8,
    border: '1px solid var(--border-color)',
    background: 'var(--card-bg)',
    overflow: 'hidden',
  };

  // ── Default open panels ──
  const defaultOpen = ['status', 'send'];

  return (
    <>
      <Collapse
        bordered={false}
        defaultActiveKey={defaultOpen}
        expandIconPosition="end"
        style={{ background: 'transparent' }}
        items={[

          /* ══════════════════════════════════════════
             Panel 1 — Current Status
             ══════════════════════════════════════════ */
          {
            key: 'status',
            style: panelStyle,
            label: (
              <Space size={8} style={{ flexWrap: 'wrap' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: getStatusDotColor(estimate.status), flexShrink: 0 }} />
                <span style={{ fontWeight: 600, fontSize: 13 }}>{t('approvalTrackingView.currentStatus')}</span>
                <Tag color={getStatusColor(estimate.status)} icon={getStatusIcon(estimate.status)} style={{ margin: 0, borderRadius: 20 }}>
                  {getStatusLabel(estimate.status)}
                </Tag>
                {isCustomerSigned && (
                  <Tag color="success" icon={<SafetyCertificateOutlined />} style={{ margin: 0, borderRadius: 20 }}>{t('approvalTrackingView.tagSigned')}</Tag>
                )}
              </Space>
            ),
            children: (
              <div style={{ padding: '4px 0 8px' }}>
                {/* Expiry row */}
                {estimate.expiry_date && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, padding: '6px 10px', background: 'var(--bg-color)', borderRadius: 6 }}>
                    <span style={{ fontSize: 12, opacity: 0.5 }}>{t('approvalTrackingView.expiryDateLabel')}</span>
                    <span style={{ fontSize: 12, fontWeight: 500, color: isExpired ? '#ff4d4f' : 'inherit' }}>
                      {isExpired && t('approvalTrackingView.expiredWarningIcon')}{formatDateTime(estimate.expiry_date)}
                    </span>
                  </div>
                )}
                {/* Signed row */}
                {isCustomerSigned && signedAt && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, padding: '6px 10px', background: 'rgba(82, 196, 26, 0.1)', borderRadius: 6 }}>
                    <span style={{ fontSize: 12, opacity: 0.5 }}>{t('approvalTrackingView.signedOnLabel')}</span>
                    <span style={{ fontSize: 12, fontWeight: 500, color: '#52c41a' }}>{formatDateTime(signedAt)}</span>
                  </div>
                )}
                {/* Expired alert */}
                {isExpired && !['approved', 'converted_to_wo'].includes(estimate.status) && (
                  <Alert
                    message={t('approvalTrackingView.estimateExpiredAlertMessage')}
                    description={t('approvalTrackingView.estimateExpiredAlertDescription', { date: formatDateTime(estimate.expiry_date!) })}
                    type="warning"
                    showIcon
                    style={{ marginBottom: 8 }}
                  />
                )}
                {/* Signature thumbnail */}
                {estimate.signature_url && (
                  <div style={{ border: '1px solid var(--border-color)', borderRadius: 8, overflow: 'hidden', cursor: 'pointer' }} onClick={openSignatureModal}>
                    <div style={{ padding: '7px 12px', background: 'var(--bg-color)', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'inherit' }}>
                      <SignatureOutlined /><span>{t('approvalTrackingView.customerSignatureSectionTitle')}</span>
                      <span style={{ marginLeft: 'auto', color: '#1677ff', fontSize: 11 }}>{t('common.view')} →</span>
                    </div>
                    <div style={{ padding: '8px 12px', background: 'var(--card-bg)', display: 'flex', justifyContent: 'center' }}>
                      <img src={estimate.signature_url} alt={t('approvalTrackingView.signatureThumbnailAlt')} style={{ maxWidth: '100%', maxHeight: 48, display: 'block' }} />
                    </div>
                  </div>
                )}
              </div>
            ),
          },

          /* ════════��═════════════════════════════════
             Panel 2 — Send to Customer
             ══════════════════════════════════════════ */
          {
            key: 'send',
            style: { ...panelStyle, marginBottom: 0 },
            label: (
              <Space size={8} style={{ flexWrap: 'wrap' }}>
                <SendOutlined style={{ color: '#1677ff' }} />
                <span style={{ fontWeight: 600, fontSize: 13 }}>{t('approvalTrackingView.sendToCustomer')}</span>
                {['sent', 'viewed', 'approved'].includes(estimate.status) && (
                  <Tag color="success" style={{ margin: 0, fontSize: 11 }}>{t('approvalTrackingView.tagSent')}</Tag>
                )}
                {!internalStage2Unlocked && hasInternalApprovals && (
                  <Tag color="default" style={{ margin: 0, fontSize: 11 }}>{t('common.locked')}</Tag>
                )}
                {estimate.status === 'approved' && (
                  <Tag color="purple" style={{ margin: 0, fontSize: 11 }}>{t('approvalTrackingView.tagReadyToConvert')}</Tag>
                )}
              </Space>
            ),
            children: (
              <div style={{ padding: '4px 0 8px' }}>
                <Space direction="vertical" style={{ width: '100%' }} size={10}>

                  {/* Context banners */}
                  {estimate.status === 'draft' && internalStage2Unlocked && (
                    <div style={{ background: '#e6f4ff', border: '1px solid #91caff', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#003eb3' }}>
                      <strong>{t('approvalTrackingView.readyToSendStrong')}</strong> {t('approvalTrackingView.readyToSendDescription')}
                    </div>
                  )}
                  {['sent', 'viewed'].includes(estimate.status) && (
                    <div style={{ background: '#fff7e6', border: '1px solid #ffd591', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#873800' }}>
                      <strong>{t('approvalTrackingView.waitingForCustomerStrong')}</strong> {t('approvalTrackingView.waitingForCustomerDescription')}
                    </div>
                  )}

                  {/* Locked */}
                  {!internalStage2Unlocked && hasInternalApprovals && (
                    <Alert
                      message={anyInternalRejected ? t('approvalTrackingView.internalReviewRejectedMessage') : t('approvalTrackingView.awaitingInternalApprovalMessage')}
                      description={
                        anyInternalRejected
                          ? t('approvalTrackingView.reviseEstimateDescription')
                          : t('approvalTrackingView.waitingForApproversDescription', {
                              approverName: currentPendingApprover
                                ? `${(currentPendingApprover.approver as Record<string, unknown>)?.first_name} ${(currentPendingApprover.approver as Record<string, unknown>)?.last_name}`
                                : t('common.approvers'),
                            })
                      }
                      type={anyInternalRejected ? 'error' : 'warning'}
                      showIcon
                    />
                  )}

                  {/* Send buttons */}
                  {internalStage2Unlocked && ['draft', 'sent', 'viewed', 'approved'].includes(estimate.status) && (
                    <Space direction="vertical" style={{ width: '100%' }} size={8}>
                      <div>
                        <Tooltip title={!contactPhone ? t('approvalTrackingView.noPhoneNumberTooltip') : ''}>
                          <Button block icon={<WhatsAppOutlined />} style={{ background: contactPhone ? '#25D366' : undefined, borderColor: contactPhone ? '#25D366' : undefined, color: contactPhone ? '#fff' : undefined, height: 38, fontWeight: 500 }} onClick={() => void handleSendWhatsApp()} loading={generateLink.isPending} disabled={!contactPhone}>
                            {t('approvalTrackingView.sendViaWhatsApp')}
                          </Button>
                        </Tooltip>
                        {contactPhone && <div style={{ fontSize: 11, color: '#aaa', marginTop: 2, paddingLeft: 2 }}>{contactPhone}</div>}
                      </div>
                      <div>
                        <Tooltip title={!contactEmail ? t('approvalTrackingView.noEmailTooltip') : ''}>
                          <Button block icon={<MailOutlined />} style={{ height: 38, fontWeight: 500 }} onClick={() => void handleSendEmail()} loading={generateLink.isPending} disabled={!contactEmail}>
                            {t('approvalTrackingView.sendViaEmail')}
                          </Button>
                        </Tooltip>
                        {contactEmail && <div style={{ fontSize: 11, color: '#aaa', marginTop: 2, paddingLeft: 2 }}>{contactEmail}</div>}
                      </div>
                      {estimate.public_token && (
                        <Button block icon={<CopyOutlined />} style={{ height: 38 }} onClick={() => handleCopyLink(`${window.location.origin}/estimate/sign/${estimate.public_token}`)}>
                          {t('approvalTrackingView.copySignLink')}
                        </Button>
                      )}
                    </Space>
                  )}

                  {/* Record decision */}
                  {['sent', 'viewed'].includes(estimate.status) && (
                    <div style={{ background: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: 8, padding: '12px 14px' }}>
                      <Text strong style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>{t('approvalTrackingView.recordCustomerDecision')}</Text>
                      <Space wrap size={8}>
                        {!isCustomerSigned && (
                          <Button type="primary" size="small" icon={<CheckCircleOutlined />} onClick={handleApprove} loading={approveEstimate.isPending} style={{ background: '#52c41a', borderColor: '#52c41a' }}>
                            {t('common.approved')}
                          </Button>
                        )}
                        <Button danger size="small" icon={<CloseCircleOutlined />} onClick={() => setRejectModalVisible(true)} loading={rejectEstimate.isPending}>
                          {t('common.rejected')}
                        </Button>
                      </Space>
                    </div>
                  )}

                  {/* Approved state */}
                  {estimate.status === 'approved' && (
                    <Space direction="vertical" style={{ width: '100%' }} size={8}>
                      <div style={{ background: 'rgba(82, 196, 26, 0.1)', border: '1px solid rgba(82, 196, 26, 0.25)', borderRadius: 8, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#52c41a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {isCustomerSigned ? <SafetyCertificateOutlined style={{ color: '#fff', fontSize: 16 }} /> : <CheckCircleOutlined style={{ color: '#fff', fontSize: 16 }} />}
                        </div>
                        <div>
                          <Text strong style={{ fontSize: 13, color: '#52c41a', display: 'block' }}>{isCustomerSigned ? t('approvalTrackingView.digitallySignedApproved') : t('approvalTrackingView.customerApprovedStatus')}</Text>
                          <Text style={{ fontSize: 11, color: '#52c41a', opacity: 0.8 }}>{isCustomerSigned && signedAt ? t('approvalTrackingView.signedOnDescription', { date: formatDateTime(signedAt) }) : t('approvalTrackingView.readyToConvertWO')}</Text>
                        </div>
                      </div>
                      <Button type="primary" icon={<FileTextOutlined />} onClick={() => setConvertModalVisible(true)} loading={convertToWorkOrder.isPending} block style={{ height: 40, fontWeight: 600 }}>
                        {t('approvalTrackingView.convertToWorkOrderButton')}
                      </Button>
                    </Space>
                  )}

                  {/* Rejected state */}
                  {estimate.status === 'rejected' && (
                    <div style={{ background: 'rgba(255, 77, 79, 0.1)', border: '1px solid rgba(255, 77, 79, 0.25)', borderRadius: 8, padding: '12px 14px', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: 16, marginTop: 2, flexShrink: 0 }} />
                      <div>
                        <Text strong style={{ color: '#ff4d4f', display: 'block', marginBottom: 2, fontSize: 13 }}>{t('approvalTrackingView.customerRejectedStatus')}</Text>
                        <Text style={{ fontSize: 12, opacity: 0.5 }}>
                          {cf?.rejection_reason
                            ? t('approvalTrackingView.rejectionReasonDisplay', { reason: String(cf.rejection_reason) })
                            : t('approvalTrackingView.revertToDraftToRevise')}
                        </Text>
                      </div>
                    </div>
                  )}

                  {/* Converted state */}
                  {estimate.status === 'converted_to_wo' && (
                    <div style={{ background: 'rgba(114, 46, 209, 0.1)', border: '1px solid rgba(114, 46, 209, 0.25)', borderRadius: 8, padding: '12px 14px', display: 'flex', gap: 8, alignItems: 'center' }}>
                      <FileTextOutlined style={{ color: '#9254de', fontSize: 16, flexShrink: 0 }} />
                      <div>
                        <Text strong style={{ color: '#9254de', display: 'block', marginBottom: 2, fontSize: 13 }}>{t('approvalTrackingView.convertedToWorkOrder')}</Text>
                        <Text style={{ fontSize: 12, opacity: 0.5 }}>{t('approvalTrackingView.successfullyConverted')}</Text>
                      </div>
                    </div>
                  )}

                  {/* Revert to Draft */}
                  {canRevertToDraft && estimate.status !== 'converted_to_wo' && (
                    <div style={{ background: 'rgba(250, 173, 20, 0.1)', border: '1px solid rgba(250, 173, 20, 0.25)', borderRadius: 8, padding: '10px 14px' }}>
                      <Text strong style={{ fontSize: 12, color: '#faad14', display: 'block', marginBottom: 6 }}>{t('approvalTrackingView.needToReviseEstimate')}</Text>
                      <Button icon={<RollbackOutlined />} size="small" onClick={() => setRevertModalVisible(true)} loading={revertToDraft.isPending}>
                        {t('approvalTrackingView.revertToDraftButton')}
                      </Button>
                    </div>
                  )}
                </Space>
              </div>
            ),
          },

        ]}
      />

      {/* ── Reject Modal ── */}
      <Modal
        title={t('approvalTrackingView.rejectEstimateTitle')}
        open={rejectModalVisible}
        onOk={handleRejectConfirm}
        onCancel={() => { setRejectModalVisible(false); setRejectionReason(''); }}
        okText={t('approvalTrackingView.confirmRejection')}
        okButtonProps={{ danger: true }}
        confirmLoading={rejectEstimate.isPending}
      >
        <Alert message={t('approvalTrackingView.rejectEstimateAlertMessage')} type="warning" showIcon style={{ marginBottom: 16 }} />
        <Text type="secondary">{t('approvalTrackingView.rejectionReasonLabel')}</Text>
        <TextArea
          rows={4}
          value={rejectionReason}
          onChange={(e) => setRejectionReason(e.target.value)}
          placeholder={t('approvalTrackingView.rejectionReasonPlaceholder')}
          style={{ marginTop: 8 }}
        />
      </Modal>

      {/* ── Convert Modal ── */}
      <Modal
        title={t('approvalTrackingView.convertToWorkOrderTitle')}
        open={convertModalVisible}
        onOk={handleConvertConfirm}
        onCancel={() => setConvertModalVisible(false)}
        okText={t('common.convert')}
        confirmLoading={convertToWorkOrder.isPending}
      >
        <Alert
          message={t('approvalTrackingView.convertToWorkOrderAlertMessage', { estimateNumber: estimate.estimate_number || estimate.id.slice(0, 8) })}
          description={t('approvalTrackingView.convertToWorkOrderAlertDescription')}
          type="info"
          showIcon
        />
      </Modal>

      {/* ── Email Link Modal ── */}
      <Modal
        title={<Space><MailOutlined /><span>{t('approvalTrackingView.sendEstimateViaEmailTitle')}</span></Space>}
        open={emailLinkModalVisible}
        onCancel={() => setEmailLinkModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setEmailLinkModalVisible(false)}>{t('common.close')}</Button>,
          generatedLink && (
            <Button key="mailto" type="primary" icon={<MailOutlined />} onClick={() => {
              const subject = encodeURIComponent(t('approvalTrackingView.emailSubject', { estimateNumber: estimate.estimate_number || estimate.id.slice(0, 8) }));
              const body = encodeURIComponent(t('approvalTrackingView.emailBody', { link: generatedLink }));
              window.open(`mailto:${contactEmail || ''}?subject=${subject}&body=${body}`, '_blank');
            }}>{t('approvalTrackingView.openInMailApp')}</Button>
          ),
        ]}
      >
        {generatedLink ? (
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <Alert
              message={t('approvalTrackingView.magicLinkGenerated')}
              description={t('approvalTrackingView.magicLinkDescription')}
              type="success"
              showIcon
              icon={<LinkOutlined />}
            />
            <div>
              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 6 }}>{t('approvalTrackingView.signLink')}</Text>
              <Input.Group compact>
                <Input value={generatedLink} readOnly style={{ width: 'calc(100% - 110px)' }} />
                <Button icon={<CopyOutlined />} onClick={() => handleCopyLink(generatedLink)} style={{ width: 110 }}>{t('common.copyLink')}</Button>
              </Input.Group>
            </div>
          </Space>
        ) : (
          <Alert message={t('approvalTrackingView.couldNotGenerateLink')} type="error" showIcon />
        )}
      </Modal>

      {/* ── Revert to Draft Modal ── */}
      <Modal
        title={<Space><RollbackOutlined style={{ color: '#faad14' }} /><span>{t('approvalTrackingView.revertEstimateToDraftTitle')}</span></Space>}
        open={revertModalVisible}
        onOk={async () => { await revertToDraft.mutateAsync(estimate.id); setRevertModalVisible(false); }}
        onCancel={() => setRevertModalVisible(false)}
        okText={t('approvalTrackingView.yesRevertToDraft')}
        okButtonProps={{ danger: true }}
        confirmLoading={revertToDraft.isPending}
      >
        <Alert
          message={t('approvalTrackingView.revertToDraftAlertMessage')}
          description={
            isCustomerSigned
              ? t('approvalTrackingView.revertToDraftDescriptionSigned')
              : t('approvalTrackingView.revertToDraftDescriptionNotSigned')
          }
          type="warning"
          showIcon
          style={{ marginBottom: 0 }}
        />
      </Modal>

    </>
  );
}