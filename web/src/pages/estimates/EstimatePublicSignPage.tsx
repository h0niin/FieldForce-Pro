import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Card,
  Button,
  Skeleton,
  Alert,
  Table,
  Typography,
  Space,
  Tag,
  Row,
  Col,
  Divider,
  Result,
  Input,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  CheckCircleOutlined,
  ClearOutlined,
  EditOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { estimatesPublicApi } from '@/api/estimates.api';
import type { Estimate, EstimateLineItem } from '@/types/models.types';
import { formatCurrency } from '@/utils/format-currency';
import { formatDateTime } from '@/utils/format-date';

const { Text, Title } = Typography;
const { TextArea } = Input;

type PageState = 'loading' | 'loadError' | 'idle' | 'signed' | 'declined';

export default function EstimatePublicSignPage() {
  const { t } = useTranslation();
  const { token } = useParams<{ token: string }>();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);

  const [pageState, setPageState] = useState<PageState>('loading');
  const [loadErrorMsg, setLoadErrorMsg] = useState('');
  const [submitError, setSubmitError] = useState('');

  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Decline flow
  const [showDeclineForm, setShowDeclineForm] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [declining, setDeclining] = useState(false);

  useEffect(() => {
    if (!token) return;
    estimatesPublicApi
      .getByToken(token)
      .then((res) => {
        setEstimate(res.data.data);
        setPageState('idle');
      })
      .catch((err) => {
        const status = err?.response?.status;
        if (status === 410) {
          setLoadErrorMsg(t('estimatePublicSign.error.linkExpired'));
        } else if (status === 404) {
          setLoadErrorMsg(t('estimatePublicSign.error.linkNotFound'));
        } else {
          setLoadErrorMsg(t('estimatePublicSign.error.loadFailed'));
        }
        setPageState('loadError');
      });
  }, [token, t]);

  // Non-passive touch listeners for canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || pageState !== 'idle') return;

    const getPos = (touch: Touch) => {
      const rect = canvas.getBoundingClientRect();
      return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
    };

    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      const { x, y } = getPos(e.touches[0]);
      isDrawingRef.current = true;
      const ctx = canvas.getContext('2d')!;
      ctx.beginPath();
      ctx.moveTo(x, y);
    };

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (!isDrawingRef.current) return;
      const { x, y } = getPos(e.touches[0]);
      const ctx = canvas.getContext('2d')!;
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#1a1a2e';
      ctx.lineTo(x, y);
      ctx.stroke();
      setHasDrawn(true);
    };

    const onTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      isDrawingRef.current = false;
    };

    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchend', onTouchEnd, { passive: false });

    return () => {
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove', onTouchMove);
      canvas.removeEventListener('touchend', onTouchEnd);
    };
  }, [pageState]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    isDrawingRef.current = true;
    const ctx = canvas.getContext('2d')!;
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d')!;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1a1a2e';
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
    setHasDrawn(true);
  };

  const handleMouseUp = () => {
    isDrawingRef.current = false;
  };

  const handleClear = () => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleSign = async () => {
    if (!canvasRef.current || !token) return;
    const dataUrl = canvasRef.current.toDataURL('image/png');
    setSubmitError('');
    setSubmitting(true);
    try {
      await estimatesPublicApi.sign(token, dataUrl);
      setPageState('signed');
    } catch (err) {
      setSubmitError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          t('estimatePublicSign.error.submitSignatureFailed'),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDecline = async () => {
    if (!token) return;
    setSubmitError('');
    setDeclining(true);
    try {
      await estimatesPublicApi.reject(token, declineReason || undefined);
      setPageState('declined');
    } catch (err) {
      setSubmitError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          t('estimatePublicSign.error.declineFailed'),
      );
    } finally {
      setDeclining(false);
    }
  };

  const lineItemColumns: ColumnsType<EstimateLineItem> = [
    {
      title: t('estimatePublicSign.lineItems.type'),
      dataIndex: 'type',
      key: 'type',
      render: (t: string) => <Tag>{t.charAt(0).toUpperCase() + t.slice(1)}</Tag>,
    },
    {
      title: t('estimatePublicSign.lineItems.name'),
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => <span style={{ fontWeight: 500 }}>{name}</span>,
    },
    {
      title: t('estimatePublicSign.lineItems.qty'),
      dataIndex: 'quantity',
      key: 'quantity',
    },
    {
      title: t('estimatePublicSign.lineItems.unitPrice'),
      dataIndex: 'unit_price',
      key: 'unit_price',
      render: (p: number) => formatCurrency(p),
    },
    {
      title: t('estimatePublicSign.lineItems.tax'),
      dataIndex: 'tax_rate',
      key: 'tax_rate',
      render: (r: number) => `${r || 0}%`,
    },
    {
      title: t('estimatePublicSign.lineItems.discount'),
      dataIndex: 'discount',
      key: 'discount',
      render: (d: number) => formatCurrency(d || 0),
    },
    {
      title: t('estimatePublicSign.lineItems.total'),
      dataIndex: 'total',
      key: 'total',
      render: (t: number) => <span style={{ fontWeight: 500 }}>{formatCurrency(t)}</span>,
    },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      {/* Branding header */}
      <div
        style={{
          background: '#1a1a2e',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <div style={{ color: '#fff', fontWeight: 700, fontSize: 18 }}>FieldForce Pro</div>
        <Tag color="blue" style={{ marginLeft: 'auto' }}>
          {t('estimatePublicSign.header.reviewSignTag')}
        </Tag>
      </div>

      <div style={{ maxWidth: 900, margin: '32px auto', padding: '0 16px 64px' }}>
        {/* ── Loading ── */}
        {pageState === 'loading' && (
          <Card>
            <Skeleton active paragraph={{ rows: 8 }} />
          </Card>
        )}

        {/* ── Load error ── */}
        {pageState === 'loadError' && (
          <Result status="error" title={t('estimatePublicSign.loadError.title')} subTitle={loadErrorMsg} />
        )}

        {/* ── Signed success ── */}
        {pageState === 'signed' && (
          <Result
            status="success"
            icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
            title={t('estimatePublicSign.signedSuccess.title')}
            subTitle={t('estimatePublicSign.signedSuccess.subTitle')}
          />
        )}

        {/* ── Declined success ── */}
        {pageState === 'declined' && (
          <Result
            status="info"
            icon={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
            title={t('estimatePublicSign.declinedSuccess.title')}
            subTitle={t('estimatePublicSign.declinedSuccess.subTitle')}
          />
        )}

        {/* ── Main content ── */}
        {pageState === 'idle' && estimate && (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {/* Estimate info card */}
            <Card
              title={
                <Space>
                  <span style={{ fontWeight: 600 }}>{t('estimatePublicSign.estimateInfo.title')}</span>
                  <Tag color="blue">{estimate.estimate_number || estimate.id.slice(0, 8)}</Tag>
                  <Tag color={estimate.status === 'approved' ? 'green' : estimate.status === 'rejected' ? 'red' : 'processing'}>
                    {t(`estimatePublicSign.status.${estimate.status}`)}
                  </Tag>
                </Space>
              }
            >
              <Row gutter={[16, 12]}>
                <Col xs={24} sm={12}>
                  <Text type="secondary" style={{ fontSize: 12 }}>{t('estimatePublicSign.estimateInfo.customer')}</Text>
                  <div style={{ fontWeight: 600, marginTop: 2 }}>
                    {estimate.contact
                      ? `${estimate.contact.first_name} ${estimate.contact.last_name}`
                      : t('estimatePublicSign.common.notApplicable')}
                  </div>
                </Col>
                <Col xs={24} sm={12}>
                  <Text type="secondary" style={{ fontSize: 12 }}>{t('estimatePublicSign.estimateInfo.totalAmount')}</Text>
                  <div style={{ fontWeight: 700, fontSize: 18, color: '#1a1a2e', marginTop: 2 }}>
                    {formatCurrency(estimate.total || 0)}
                  </div>
                </Col>
                {estimate.expiry_date && (
                  <Col xs={24} sm={12}>
                    <Text type="secondary" style={{ fontSize: 12 }}>{t('estimatePublicSign.estimateInfo.validUntil')}</Text>
                    <div style={{ marginTop: 2 }}>{formatDateTime(estimate.expiry_date)}</div>
                  </Col>
                )}
                {estimate.public_token_expires_at && (
                  <Col xs={24} sm={12}>
                    <Text type="secondary" style={{ fontSize: 12 }}>{t('estimatePublicSign.estimateInfo.signLinkExpires')}</Text>
                    <div style={{ marginTop: 2 }}>{formatDateTime(estimate.public_token_expires_at)}</div>
                  </Col>
                )}
                {estimate.notes && (
                  <Col xs={24}>
                    <Text type="secondary" style={{ fontSize: 12 }}>{t('estimatePublicSign.estimateInfo.notes')}</Text>
                    <div style={{ marginTop: 2 }}>{estimate.notes}</div>
                  </Col>
                )}
              </Row>
            </Card>

            {/* Line items */}
            <Card title={t('estimatePublicSign.itemsPricing.title')}>
              <Table
                columns={lineItemColumns}
                dataSource={estimate.line_items || []}
                rowKey="id"
                pagination={false}
                scroll={{ x: 600 }}
                locale={{ emptyText: t('estimatePublicSign.itemsPricing.noItems') }}
                summary={() => (
                  <Table.Summary>
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={6} align="right">
                        <strong>{t('estimatePublicSign.itemsPricing.subtotal')}</strong>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1}>
                        <strong>{formatCurrency(estimate.subtotal || 0)}</strong>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={6} align="right">{t('estimatePublicSign.itemsPricing.tax')}</Table.Summary.Cell>
                      <Table.Summary.Cell index={1}>{formatCurrency(estimate.tax || 0)}</Table.Summary.Cell>
                    </Table.Summary.Row>
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={6} align="right">{t('estimatePublicSign.itemsPricing.discount')}</Table.Summary.Cell>
                      <Table.Summary.Cell index={1}>-{formatCurrency(estimate.discount || 0)}</Table.Summary.Cell>
                    </Table.Summary.Row>
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={6} align="right">
                        <strong style={{ fontSize: 15 }}>{t('estimatePublicSign.itemsPricing.total')}</strong>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1}>
                        <strong style={{ fontSize: 15, color: '#1a1a2e' }}>{formatCurrency(estimate.total || 0)}</strong>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  </Table.Summary>
                )}
              />
            </Card>

            {/* Action section */}
            {estimate.status === 'approved' && estimate.signature_url ? (
              <Alert
                message={t('estimatePublicSign.alert.alreadySignedMessage')}
                type="success"
                showIcon
                icon={<CheckCircleOutlined />}
              />
            ) : estimate.status === 'rejected' ? (
              <Alert
                message={t('estimatePublicSign.alert.alreadyDeclinedMessage')}
                type="error"
                showIcon
                icon={<CloseCircleOutlined />}
              />
            ) : (
              <>
                {/* Submit error (shown inline, doesn't hide the form) */}
                {submitError && (
                  <Alert message={submitError} type="error" showIcon closable onClose={() => setSubmitError('')} />
                )}

                {/* Digital signature card */}
                <Card
                  title={
                    <Space>
                      <EditOutlined />
                      <span>{t('estimatePublicSign.digitalSignature.title')}</span>
                    </Space>
                  }
                >
                  <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
                    {t('estimatePublicSign.digitalSignature.description', { acceptAndSign: <strong>{t('estimatePublicSign.digitalSignature.acceptAndSignButton')}</strong> })}
                  </Text>

                  <div
                    style={{
                      border: '2px dashed #d9d9d9',
                      borderRadius: 8,
                      background: '#fafafa',
                      marginBottom: 8,
                      overflow: 'hidden',
                      cursor: 'crosshair',
                      userSelect: 'none',
                      position: 'relative',
                    }}
                  >
                    <canvas
                      ref={canvasRef}
                      width={800}
                      height={200}
                      style={{ display: 'block', width: '100%', height: 200, touchAction: 'none' }}
                      onMouseDown={handleMouseDown}
                      onMouseMove={handleMouseMove}
                      onMouseUp={handleMouseUp}
                      onMouseLeave={handleMouseUp}
                    />
                    {!hasDrawn && (
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          pointerEvents: 'none',
                          color: '#bfbfbf',
                          fontSize: 14,
                        }}
                      >
                        {t('estimatePublicSign.digitalSignature.signHerePlaceholder')}
                      </div>
                    )}
                  </div>

                  <Space style={{ marginBottom: 16 }}>
                    <Button size="small" icon={<ClearOutlined />} onClick={handleClear} disabled={!hasDrawn}>
                      {t('estimatePublicSign.digitalSignature.clearButton')}
                    </Button>
                  </Space>

                  <Divider style={{ margin: '12px 0' }} />

                  <Space size="middle">
                    <Button
                      type="primary"
                      size="large"
                      icon={<CheckCircleOutlined />}
                      disabled={!hasDrawn}
                      loading={submitting}
                      onClick={() => void handleSign()}
                    >
                      {t('estimatePublicSign.digitalSignature.acceptAndSignButton')}
                    </Button>
                  </Space>
                </Card>

                {/* Decline section */}
                <Card
                  size="small"
                  style={{ borderColor: showDeclineForm ? '#ff4d4f' : '#f0f0f0' }}
                  title={
                    <Space>
                      <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
                      <Title level={5} style={{ margin: 0, color: '#ff4d4f' }}>
                        {t('estimatePublicSign.declineSection.title')}
                      </Title>
                    </Space>
                  }
                >
                  {!showDeclineForm ? (
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Text type="secondary" style={{ fontSize: 13 }}>
                        {t('estimatePublicSign.declineSection.description')}
                      </Text>
                      <Button
                        danger
                        icon={<CloseCircleOutlined />}
                        onClick={() => setShowDeclineForm(true)}
                      >
                        {t('estimatePublicSign.declineSection.declineEstimateButton')}
                      </Button>
                    </Space>
                  ) : (
                    <Space direction="vertical" style={{ width: '100%' }} size="middle">
                      <Alert
                        message={t('estimatePublicSign.declineSection.alertMessage')}
                        description={t('estimatePublicSign.declineSection.alertDescription')}
                        type="warning"
                        showIcon
                      />
                      <div>
                        <Text type="secondary" style={{ fontSize: 13 }}>
                          {t('estimatePublicSign.declineSection.reasonLabel')}
                        </Text>
                        <TextArea
                          rows={3}
                          value={declineReason}
                          onChange={(e) => setDeclineReason(e.target.value)}
                          placeholder={t('estimatePublicSign.declineSection.reasonPlaceholder')}
                          style={{ marginTop: 6 }}
                        />
                      </div>
                      <Space>
                        <Button
                          danger
                          loading={declining}
                          icon={<CloseCircleOutlined />}
                          onClick={() => void handleDecline()}
                        >
                          {t('estimatePublicSign.declineSection.confirmDeclineButton')}
                        </Button>
                        <Button onClick={() => { setShowDeclineForm(false); setDeclineReason(''); }}>
                          {t('estimatePublicSign.declineSection.cancelButton')}
                        </Button>
                      </Space>
                    </Space>
                  )}
                </Card>
              </>
            )}
          </Space>
        )}
      </div>
    </div>
  );
}