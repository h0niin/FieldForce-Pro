import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Card, Button, Skeleton, Alert, Table, Typography, Space, Tag, Row, Col,
  Divider, Result, Input, Checkbox,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  CheckCircleOutlined, ClearOutlined, EditOutlined,
  CloseCircleOutlined, ExclamationCircleOutlined,
} from '@ant-design/icons';
import { estimatesPublicApi } from '@/api/estimates.api';
import type { Estimate, EstimateLineItem } from '@/types/models.types';
import { formatCurrency } from '@/utils/format-currency';
import { formatDateTime } from '@/utils/format-date';

const { Text, Title } = Typography;
const { TextArea } = Input;

type PageState = 'loading' | 'loadError' | 'idle' | 'approved' | 'declined';

export default function EstimateApprovalPage() {
  const { token } = useParams<{ token: string }>();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);

  const [pageState, setPageState] = useState<PageState>('loading');
  const [loadErrorMsg, setLoadErrorMsg] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [showDeclineForm, setShowDeclineForm] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [declining, setDeclining] = useState(false);

  useEffect(() => {
    if (!token) return;
    estimatesPublicApi
      .getByToken(token)
      .then((res) => {
        const est = res.data.data ?? null;
        setEstimate(est);
        // Pre-fill customer name if contact info available
        if (est?.contact) {
          setCustomerName(`${est.contact.first_name || ''} ${est.contact.last_name || ''}`.trim());
        }
        setPageState('idle');
      })
      .catch((err) => {
        const status = err?.response?.status;
        if (status === 410) setLoadErrorMsg('This approval link has expired. Please contact the service provider.');
        else if (status === 404) setLoadErrorMsg('This link is invalid or could not be found.');
        else setLoadErrorMsg('Unable to load the estimate. Please try again later.');
        setPageState('loadError');
      });
  }, [token]);

  // Non-passive touch listeners for signature canvas
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
      ctx.beginPath(); ctx.moveTo(x, y);
    };
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (!isDrawingRef.current) return;
      const { x, y } = getPos(e.touches[0]);
      const ctx = canvas.getContext('2d')!;
      ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.strokeStyle = '#1a1a2e';
      ctx.lineTo(x, y); ctx.stroke(); setHasDrawn(true);
    };
    const onTouchEnd = (e: TouchEvent) => { e.preventDefault(); isDrawingRef.current = false; };
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
    ctx.beginPath(); ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d')!;
    ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.strokeStyle = '#1a1a2e';
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke(); setHasDrawn(true);
  };
  const handleMouseUp = () => { isDrawingRef.current = false; };

  const handleClear = () => {
    const canvas = canvasRef.current!;
    canvas.getContext('2d')!.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleApprove = async () => {
    if (!canvasRef.current || !token) return;
    if (!customerName.trim()) { setSubmitError('Please enter your name'); return; }
    if (!hasDrawn) { setSubmitError('Please draw your signature'); return; }
    if (!agreed) { setSubmitError('Please check the agreement checkbox'); return; }
    const signature = canvasRef.current.toDataURL('image/png');
    setSubmitError('');
    setSubmitting(true);
    try {
      await estimatesPublicApi.customerApprove(token, customerName.trim(), signature);
      setPageState('approved');
    } catch (err) {
      setSubmitError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Failed to submit approval. Please try again.',
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
      await estimatesPublicApi.customerReject(token, declineReason || undefined);
      setPageState('declined');
    } catch (err) {
      setSubmitError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Failed to decline. Please try again.',
      );
    } finally {
      setDeclining(false);
    }
  };

  const lineItemColumns: ColumnsType<EstimateLineItem> = [
    { title: 'Type', dataIndex: 'type', key: 'type', render: (t: string) => <Tag>{t.charAt(0).toUpperCase() + t.slice(1)}</Tag> },
    { title: 'Description', dataIndex: 'name', key: 'name', render: (name: string, row: EstimateLineItem) => (
      <div>
        <div style={{ fontWeight: 500 }}>{name}</div>
        {row.description && <div style={{ fontSize: 12, color: '#888' }}>{row.description}</div>}
      </div>
    )},
    { title: 'Qty', dataIndex: 'quantity', key: 'quantity', width: 70 },
    { title: 'Unit Price', dataIndex: 'unit_price', key: 'unit_price', render: (p: number) => formatCurrency(p), align: 'right' as const },
    { title: 'Total', dataIndex: 'total', key: 'total', render: (t: number) => <strong>{formatCurrency(t)}</strong>, align: 'right' as const },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      {/* Branding header */}
      <div style={{ background: '#1a1a2e', padding: '16px 24px', display: 'flex', alignItems: 'center' }}>
        <div style={{ color: '#fff', fontWeight: 700, fontSize: 18 }}>FieldForce Pro</div>
        <Tag color="blue" style={{ marginLeft: 'auto' }}>Estimate Approval</Tag>
      </div>

      <div style={{ maxWidth: 900, margin: '32px auto', padding: '0 16px 64px' }}>
        {pageState === 'loading' && <Card><Skeleton active paragraph={{ rows: 8 }} /></Card>}

        {pageState === 'loadError' && (
          <Result status="error" title="Unable to Load Estimate" subTitle={loadErrorMsg} />
        )}

        {pageState === 'approved' && (
          <Result
            status="success"
            icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
            title="Thank you! Your approval has been recorded."
            subTitle="The service team has been notified and will proceed with the work."
          />
        )}

        {pageState === 'declined' && (
          <Result
            status="info"
            icon={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
            title="Estimate Declined"
            subTitle="You have declined this estimate. The service provider has been notified and will contact you."
          />
        )}

        {pageState === 'idle' && estimate && (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {/* Already actioned */}
            {estimate.status === 'customer_approved' && (
              <Alert message="This estimate has already been approved and signed." type="success" showIcon />
            )}
            {estimate.status === 'customer_rejected' && (
              <Alert message="This estimate has already been declined." type="error" showIcon />
            )}

            {/* Estimate summary */}
            <Card title={
              <Space>
                <span style={{ fontWeight: 600 }}>Service Estimate</span>
                <Tag color="blue">{estimate.estimate_number || estimate.id.slice(0, 8)}</Tag>
              </Space>
            }>
              <Row gutter={[16, 12]}>
                <Col xs={24} sm={12}>
                  <Text type="secondary" style={{ fontSize: 12 }}>Customer</Text>
                  <div style={{ fontWeight: 600, marginTop: 2 }}>
                    {estimate.contact ? `${estimate.contact.first_name} ${estimate.contact.last_name}` : '—'}
                  </div>
                </Col>
                <Col xs={24} sm={12}>
                  <Text type="secondary" style={{ fontSize: 12 }}>Total Amount</Text>
                  <div style={{ fontWeight: 700, fontSize: 22, color: '#1a1a2e', marginTop: 2 }}>
                    {formatCurrency(estimate.total || 0)}
                  </div>
                </Col>
                {estimate.notes && (
                  <Col xs={24}>
                    <Text type="secondary" style={{ fontSize: 12 }}>Technician Notes</Text>
                    <div style={{ marginTop: 2, padding: '8px 12px', background: '#fafafa', borderRadius: 6 }}>
                      {estimate.notes}
                    </div>
                  </Col>
                )}
                {estimate.public_token_expires_at && (
                  <Col xs={24} sm={12}>
                    <Text type="secondary" style={{ fontSize: 12 }}>Approval Link Expires</Text>
                    <div style={{ marginTop: 2 }}>{formatDateTime(estimate.public_token_expires_at)}</div>
                  </Col>
                )}
              </Row>
            </Card>

            {/* Line items */}
            <Card title="Service Breakdown">
              <Table
                columns={lineItemColumns}
                dataSource={estimate.line_items || []}
                rowKey="id"
                pagination={false}
                scroll={{ x: 500 }}
                locale={{ emptyText: 'No items' }}
                summary={() => (
                  <Table.Summary>
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={4} align="right"><strong>Subtotal</strong></Table.Summary.Cell>
                      <Table.Summary.Cell index={1} align="right"><strong>{formatCurrency(estimate.subtotal || 0)}</strong></Table.Summary.Cell>
                    </Table.Summary.Row>
                    {(estimate.tax || 0) > 0 && (
                      <Table.Summary.Row>
                        <Table.Summary.Cell index={0} colSpan={4} align="right">Tax / GST</Table.Summary.Cell>
                        <Table.Summary.Cell index={1} align="right">{formatCurrency(estimate.tax || 0)}</Table.Summary.Cell>
                      </Table.Summary.Row>
                    )}
                    {(estimate.discount || 0) > 0 && (
                      <Table.Summary.Row>
                        <Table.Summary.Cell index={0} colSpan={4} align="right">Discount</Table.Summary.Cell>
                        <Table.Summary.Cell index={1} align="right">-{formatCurrency(estimate.discount || 0)}</Table.Summary.Cell>
                      </Table.Summary.Row>
                    )}
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={4} align="right">
                        <strong style={{ fontSize: 16 }}>Total</strong>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1} align="right">
                        <strong style={{ fontSize: 16, color: '#1a1a2e' }}>{formatCurrency(estimate.total || 0)}</strong>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  </Table.Summary>
                )}
              />
            </Card>

            {/* Approval action — only show if still pending */}
            {estimate.status === 'pending_customer_approval' && (
              <>
                {submitError && (
                  <Alert message={submitError} type="error" showIcon closable onClose={() => setSubmitError('')} />
                )}

                <Card title={<Space><EditOutlined /><span>Approve &amp; Sign</span></Space>}>
                  <Space direction="vertical" style={{ width: '100%' }} size="middle">
                    {/* Customer name */}
                    <div>
                      <Text strong>Your Full Name <span style={{ color: '#ff4d4f' }}>*</span></Text>
                      <Input
                        size="large"
                        placeholder="Enter your full name"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        style={{ marginTop: 6 }}
                      />
                    </div>

                    {/* Signature pad */}
                    <div>
                      <Text strong>Your Signature <span style={{ color: '#ff4d4f' }}>*</span></Text>
                      <Text type="secondary" style={{ display: 'block', marginTop: 4, marginBottom: 8, fontSize: 13 }}>
                        Draw your signature below using your finger or mouse
                      </Text>
                      <div style={{
                        border: '2px dashed #d9d9d9', borderRadius: 8, background: '#fafafa',
                        overflow: 'hidden', cursor: 'crosshair', userSelect: 'none', position: 'relative',
                      }}>
                        <canvas
                          ref={canvasRef}
                          width={800}
                          height={180}
                          style={{ display: 'block', width: '100%', height: 180, touchAction: 'none' }}
                          onMouseDown={handleMouseDown}
                          onMouseMove={handleMouseMove}
                          onMouseUp={handleMouseUp}
                          onMouseLeave={handleMouseUp}
                        />
                        {!hasDrawn && (
                          <div style={{
                            position: 'absolute', inset: 0, display: 'flex',
                            alignItems: 'center', justifyContent: 'center',
                            pointerEvents: 'none', color: '#bfbfbf', fontSize: 14,
                          }}>
                            Sign here
                          </div>
                        )}
                      </div>
                      <Button size="small" icon={<ClearOutlined />} onClick={handleClear} disabled={!hasDrawn} style={{ marginTop: 8 }}>
                        Clear
                      </Button>
                    </div>

                    {/* Agreement checkbox */}
                    <Checkbox checked={agreed} onChange={(e) => setAgreed(e.target.checked)}>
                      I have reviewed this estimate and agree to proceed with the service at the quoted amount.
                    </Checkbox>

                    <Divider style={{ margin: '8px 0' }} />

                    <Button
                      type="primary"
                      size="large"
                      icon={<CheckCircleOutlined />}
                      disabled={!hasDrawn || !customerName.trim() || !agreed}
                      loading={submitting}
                      onClick={() => void handleApprove()}
                      style={{ minWidth: 200 }}
                    >
                      Confirm Approval
                    </Button>
                  </Space>
                </Card>

                {/* Decline section */}
                <Card
                  size="small"
                  style={{ borderColor: showDeclineForm ? '#ff4d4f' : '#f0f0f0' }}
                  title={<Space><ExclamationCircleOutlined style={{ color: '#ff4d4f' }} /><Title level={5} style={{ margin: 0, color: '#ff4d4f' }}>Decline this Estimate</Title></Space>}
                >
                  {!showDeclineForm ? (
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Text type="secondary" style={{ fontSize: 13 }}>
                        Not happy with the estimate? You can decline and the service provider will be notified.
                      </Text>
                      <Button danger icon={<CloseCircleOutlined />} onClick={() => setShowDeclineForm(true)}>
                        Decline Estimate
                      </Button>
                    </Space>
                  ) : (
                    <Space direction="vertical" style={{ width: '100%' }} size="middle">
                      <Alert
                        message="You are about to decline this estimate"
                        description="The service provider will be notified and may reach out to discuss alternatives."
                        type="warning" showIcon
                      />
                      <div>
                        <Text type="secondary" style={{ fontSize: 13 }}>Reason for declining (optional):</Text>
                        <TextArea
                          rows={3}
                          value={declineReason}
                          onChange={(e) => setDeclineReason(e.target.value)}
                          placeholder="e.g. Price is too high, I need more time to decide..."
                          style={{ marginTop: 6 }}
                        />
                      </div>
                      <Space>
                        <Button danger loading={declining} icon={<CloseCircleOutlined />} onClick={() => void handleDecline()}>
                          Confirm Decline
                        </Button>
                        <Button onClick={() => { setShowDeclineForm(false); setDeclineReason(''); }}>Cancel</Button>
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
