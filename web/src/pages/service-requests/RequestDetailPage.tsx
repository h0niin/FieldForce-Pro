import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Button, Space, Skeleton, Tag, Steps, Modal, Input, Alert, Select, Tabs, Table, Badge } from 'antd';
import { EditOutlined, DeleteOutlined, CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined, MinusCircleOutlined, UserAddOutlined, SwapOutlined, EnvironmentOutlined, PlusOutlined, FileTextOutlined } from '@ant-design/icons';
import {
  useServiceRequest,
  useDeleteServiceRequest,
  useUpdateServiceRequestStatus,
  useServiceRequestApprovals,
  useProcessServiceRequestApproval,
  useAssignServiceRequestTechnician,
  useApproveAndConvert,
} from '@/hooks/use-service-requests';
import { useEstimatesByServiceRequest } from '@/hooks/use-estimates';
import { useAgents } from '@/hooks/use-users';
import { useAuthStore } from '@/store/auth.store';
import { usePermission } from '@/components/permissions/usePermission';
import PageHeader from '@/components/common/PageHeader';
import { showConfirmDialog } from '@/components/common/ConfirmDialog';
import { formatDateTime } from '@/utils/format-date';
import FileUploadZone from '@/components/service-requests/FileUploadZone';

const priorityColors: Record<string, string> = {
  urgent: 'red',
  high: 'orange',
  medium: 'blue',
  low: 'default',
};

const statusColors: Record<string, string> = {
  new: 'blue',
  triaged: 'cyan',
  estimated: 'gold',
  approved: 'green',
  converted_to_wo: 'purple',
  rejected: 'red',
  closed: 'default',
  spam: 'red',
};

const statusLabels: Record<string, string> = {
  new: 'Pending Approval',
  triaged: 'Triaged',
  estimated: 'Estimated',
  approved: 'Approved',
  converted_to_wo: 'Converted to WO',
  rejected: 'Rejected',
  closed: 'Closed',
  spam: 'Flagged',
};

const estimateStatusColors: Record<string, string> = {
  draft: 'default',
  pending_approval: 'orange',
  sent: 'blue',
  viewed: 'cyan',
  approved: 'green',
  rejected: 'red',
  expired: 'orange',
  converted_to_wo: 'purple',
  converted_to_invoice: 'geekblue',
};

const statusTransitions: Record<string, string[]> = {
  new: ['triaged', 'rejected', 'spam'],
  triaged: ['estimated', 'rejected', 'closed', 'spam'],
  estimated: ['approved', 'rejected', 'closed'],
  approved: ['converted_to_wo', 'closed'],
  converted_to_wo: ['closed'],
  rejected: ['new', 'closed'],
  closed: [],
  spam: [],
};

function formatStatus(status: string): string {
  return statusLabels[status] || status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

interface ApprovalItem {
  id: string;
  status: string;
  order_no: number;
  approver_id: string;
  approver?: { id: string; first_name?: string; last_name?: string };
  action_date?: string;
  comments?: string;
}

export default function RequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { isAdmin } = usePermission();
  const { data: request, isLoading, error: requestError } = useServiceRequest(id!);
  const { data: approvals, refetch: refetchApprovals } = useServiceRequestApprovals(id!);
  const { data: agents = [] } = useAgents();
  const deleteRequest = useDeleteServiceRequest();
  const updateStatus = useUpdateServiceRequestStatus();
  const processApproval = useProcessServiceRequestApproval();
  const assignTechnician = useAssignServiceRequestTechnician();
  const approveAndConvert = useApproveAndConvert();

  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [approvalAction, setApprovalAction] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [approvalComments, setApprovalComments] = useState('');
  const [selectedApprovalId, setSelectedApprovalId] = useState<string>('');
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedTechnicianId, setSelectedTechnicianId] = useState<string>('');
  const [activeTab, setActiveTab] = useState('details');

  const { data: srEstimates = [], isLoading: estimatesLoading } = useEstimatesByServiceRequest(id!, activeTab === 'estimates');

  const handleDelete = () => {
    if (!request) return;
    showConfirmDialog({
      title: 'Delete Service Request',
      content: `Are you sure you want to delete "${request.subject}"?`,
      onOk: async () => {
        await deleteRequest.mutateAsync(request.id);
        navigate('/service-requests');
      },
      danger: true,
    });
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!request) return;
    await updateStatus.mutateAsync({ id: request.id, status: newStatus });
  };

  const handleAssignTechnician = async () => {
    if (!request || !selectedTechnicianId) return;
    const agent = agents.find((a) => a.id === selectedTechnicianId);
    const name = agent ? `${agent.first_name} ${agent.last_name}` : '';
    await assignTechnician.mutateAsync({ id: request.id, technicianId: selectedTechnicianId, technicianName: name });
    setAssignModalOpen(false);
    setSelectedTechnicianId('');
  };

  const handleApproveAndConvert = () => {
    if (!request) return;
    showConfirmDialog({
      title: 'Approve & Create Work Order',
      content: 'This will approve the service request and create a Work Order. You will be redirected to the new Work Order.',
      onOk: async () => {
        const response = await approveAndConvert.mutateAsync(request.id);
        const wo = response.data.data?.workOrder;
        if (wo) {
          navigate(`/work-orders/${wo.id}`);
        }
      },
    });
  };

  const openApprovalModal = (approvalId: string, action: 'APPROVE' | 'REJECT') => {
    setSelectedApprovalId(approvalId);
    setApprovalAction(action);
    setApprovalComments('');
    setApprovalModalOpen(true);
  };

  const handleProcessApproval = async () => {
    if (!id) return;
    await processApproval.mutateAsync({
      serviceRequestId: id,
      approvalId: selectedApprovalId,
      action: approvalAction,
      comments: approvalComments || undefined,
    });
    setApprovalModalOpen(false);
    refetchApprovals();
  };

  // Find the current user's pending approval (if any)
  const typedApprovals = approvals as ApprovalItem[] | undefined;
  const myPendingApproval = typedApprovals?.find(
    (a) => a.approver_id === user?.id && a.status === 'PENDING',
  );

  // Check if this approval is the next in sequence (all previous must be done)
  const canActOnApproval = myPendingApproval && typedApprovals
    ? !typedApprovals.some(
        (a) => a.order_no < myPendingApproval.order_no && a.status === 'PENDING',
      )
    : false;

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Service Request Details" />
        <Card><Skeleton active /></Card>
      </div>
    );
  }

  if (!request) {
    const errorStatus = (requestError as { response?: { status?: number } })?.response?.status;
    const errorMessage = errorStatus === 403
      ? 'You do not have permission to view this service request.'
      : errorStatus === 404
        ? 'Service request not found.'
        : requestError
          ? `Failed to load service request: ${(requestError as Error).message}`
          : 'Service request not found.';
    return (
      <div>
        <PageHeader title={errorStatus === 403 ? 'Access Denied' : 'Service Request Not Found'} onBack={() => navigate('/service-requests')} />
        <Card>{errorMessage}</Card>
      </div>
    );
  }

  const availableTransitions = statusTransitions[request.status] || [];

  return (
    <div>
      <PageHeader
        title={request.subject}
        onBack={() => navigate('/service-requests')}
        extra={
          isAdmin ? (
            <Space>
              <Button
                icon={<UserAddOutlined />}
                onClick={() => setAssignModalOpen(true)}
              >
                Assign Technician
              </Button>
              {!['converted_to_wo', 'closed', 'spam', 'rejected'].includes(request.status) && (
                <Button
                  type="primary"
                  icon={<SwapOutlined />}
                  loading={approveAndConvert.isPending}
                  onClick={handleApproveAndConvert}
                >
                  Approve &amp; Create Work Order
                </Button>
              )}
              <Button icon={<EditOutlined />} onClick={() => navigate(`/service-requests/${request.id}/edit`)}>
                Edit
              </Button>
              <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>
                Delete
              </Button>
            </Space>
          ) : undefined
        }
      />

      {request.is_spam && (
        <Alert
          message="This request was flagged as potential spam/duplicate"
          description={
            <div>
              <strong>Reason:</strong> {request.spam_reason || 'Similarity detected'}<br/>
              <strong>Confidence:</strong> {request.spam_confidence ? `${(request.spam_confidence * 100).toFixed(1)}%` : 'N/A'}
            </div>
          }
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {isAdmin && availableTransitions.length > 0 && (
        <Card style={{ marginBottom: 16 }}>
          <Space>
            <span style={{ fontWeight: 500 }}>Transition to:</span>
            {availableTransitions.map((status) => (
              <Button
                key={status}
                type="primary"
                size="small"
                loading={updateStatus.isPending}
                onClick={() => handleStatusChange(status)}
              >
                {formatStatus(status)}
              </Button>
            ))}
          </Space>
        </Card>
      )}

      {/* Approval Action Card — shown ONLY when current user is the active approver */}
      {canActOnApproval && myPendingApproval && (
        <Card
          title="Your Approval Required"
          style={{ marginBottom: 16, borderColor: '#faad14' }}
        >
          <p>This service request is awaiting your approval.</p>
          <Space>
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={() => openApprovalModal(myPendingApproval.id, 'APPROVE')}
            >
              Approve
            </Button>
            <Button
              danger
              icon={<CloseCircleOutlined />}
              onClick={() => openApprovalModal(myPendingApproval.id, 'REJECT')}
            >
              Reject
            </Button>
          </Space>
        </Card>
      )}

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        style={{ marginTop: 8 }}
        items={[
          {
            key: 'details',
            label: 'Details',
            children: (
              <>
                <Card title="Service Request Information">
                  <Descriptions column={2} bordered>
                    <Descriptions.Item label="Request ID">
                      <span style={{ fontWeight: 600, fontFamily: 'monospace', color: '#1890ff' }}>
                        {request.request_number || '-'}
                      </span>
                    </Descriptions.Item>

                    <Descriptions.Item label="Subject">
                      {request.subject}
                    </Descriptions.Item>

                    <Descriptions.Item label="Status">
                      <Tag color={statusColors[request.status] || 'default'}>
                        {formatStatus(request.status)}
                      </Tag>
                    </Descriptions.Item>

                    <Descriptions.Item label="Priority">
                      <Tag color={priorityColors[request.priority] || 'default'}>
                        {request.priority?.charAt(0).toUpperCase() + request.priority?.slice(1)}
                      </Tag>
                    </Descriptions.Item>

                    <Descriptions.Item label="Channel">
                      {request.channel ? (
                        <Tag>{request.channel.charAt(0).toUpperCase() + request.channel.slice(1)}</Tag>
                      ) : (
                        <span style={{ opacity: 0.5 }}>-</span>
                      )}
                    </Descriptions.Item>

                    <Descriptions.Item label="Category">
                      {request.category ? <Tag>{request.category}</Tag> : <span style={{ opacity: 0.5 }}>-</span>}
                    </Descriptions.Item>

                    <Descriptions.Item label="Customer">
                      {request.contact
                        ? `${request.contact.first_name} ${request.contact.last_name}`
                        : <span style={{ opacity: 0.5 }}>-</span>}
                    </Descriptions.Item>

                    <Descriptions.Item label="Location">
                      {request.location?.address || <span style={{ opacity: 0.5 }}>-</span>}
                    </Descriptions.Item>

                    <Descriptions.Item label="Description" span={2}>
                      {request.description || <span style={{ opacity: 0.5 }}>-</span>}
                    </Descriptions.Item>

                    <Descriptions.Item label="Scheduled Date">
                      {request.scheduled_start ? formatDateTime(request.scheduled_start) : <span style={{ opacity: 0.5 }}>-</span>}
                    </Descriptions.Item>

                    <Descriptions.Item label="Assigned To">
                      {request.assigned_to
                        ? (() => {
                            const agent = agents.find((a) => a.id === request.assigned_to);
                            return agent
                              ? `${agent.first_name} ${agent.last_name}`
                              : request.assigned_to;
                          })()
                        : <span style={{ opacity: 0.5 }}>-</span>}
                    </Descriptions.Item>

                    <Descriptions.Item label="Created At">
                      {formatDateTime(request.created_at)}
                    </Descriptions.Item>

                    <Descriptions.Item label="Updated At">
                      {formatDateTime(request.updated_at)}
                    </Descriptions.Item>
                  </Descriptions>
                </Card>

                {(() => {
                  const lat = (request.location?.lat ?? (request as any).lat) as number | undefined;
                  const lng = (request.location?.lng ?? (request as any).lng) as number | undefined;
                  const address = request.location?.address || ((request as any).custom_fields as Record<string, unknown>)?.service_address as string | undefined;
                  if (!lat || !lng) return null;
                  const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${Number(lng) - 0.01},${Number(lat) - 0.01},${Number(lng) + 0.01},${Number(lat) + 0.01}&layer=mapnik&marker=${lat},${lng}`;
                  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
                  return (
                    <Card
                      title={<><EnvironmentOutlined style={{ marginRight: 6 }} />Service Location</>}
                      style={{ marginTop: 16 }}
                    >
                      {address && <p style={{ marginBottom: 8, fontWeight: 500 }}>{address}</p>}
                      <p style={{ marginBottom: 8, color: '#666', fontSize: 13 }}>
                        GPS: {Number(lat).toFixed(6)}, {Number(lng).toFixed(6)}
                      </p>
                      <iframe
                        src={mapSrc}
                        title="Service Location Map"
                        style={{ width: '100%', height: 200, border: '1px solid #e8e8e8', borderRadius: 4, marginBottom: 12 }}
                        loading="lazy"
                      />
                      <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
                        <Button type="primary" icon={<EnvironmentOutlined />}>Get Directions</Button>
                      </a>
                    </Card>
                  );
                })()}

                {typedApprovals && typedApprovals.length > 0 && (
                  <Card title="Approval Status" style={{ marginTop: 16 }}>
                    <Steps
                      direction="vertical"
                      size="small"
                      current={typedApprovals.findIndex((a) => a.status === 'PENDING')}
                      items={typedApprovals.map((approval) => {
                        const approverName = approval.approver
                          ? `${approval.approver.first_name || ''} ${approval.approver.last_name || ''}`.trim()
                          : 'Unknown';

                        const statusMap: Record<string, { status: 'finish' | 'process' | 'wait' | 'error'; icon: React.ReactNode }> = {
                          APPROVED: { status: 'finish', icon: <CheckCircleOutlined style={{ color: '#52c41a' }} /> },
                          REJECTED: { status: 'error', icon: <CloseCircleOutlined style={{ color: '#ff4d4f' }} /> },
                          PENDING: { status: 'process', icon: <ClockCircleOutlined style={{ color: '#faad14' }} /> },
                          SKIPPED: { status: 'wait', icon: <MinusCircleOutlined style={{ color: '#d9d9d9' }} /> },
                          CORRECTION_REQUIRED: { status: 'error', icon: <CloseCircleOutlined style={{ color: '#fa8c16' }} /> },
                        };

                        const stepInfo = statusMap[approval.status] || { status: 'wait' as const, icon: null };

                        return {
                          title: (
                            <Space>
                              <span>{approverName}</span>
                              <Tag color={
                                approval.status === 'APPROVED' ? 'green' :
                                approval.status === 'REJECTED' ? 'red' :
                                approval.status === 'PENDING' ? 'orange' :
                                approval.status === 'SKIPPED' ? 'default' : 'gold'
                              }>
                                {approval.status}
                              </Tag>
                            </Space>
                          ),
                          description: (
                            <div>
                              {approval.action_date && (
                                <div style={{ fontSize: 12, color: '#999' }}>
                                  {formatDateTime(approval.action_date)}
                                </div>
                              )}
                              {approval.comments && (
                                <div style={{ fontSize: 12, marginTop: 4 }}>
                                  {approval.comments}
                                </div>
                              )}
                            </div>
                          ),
                          status: stepInfo.status,
                          icon: stepInfo.icon,
                        };
                      })}
                    />
                  </Card>
                )}

                <Card title="Attachments" style={{ marginTop: 16 }}>
                  <FileUploadZone requestId={request.id} />
                </Card>
              </>
            ),
          },
          {
            key: 'estimates',
            label: (
              <span>
                <FileTextOutlined style={{ marginRight: 4 }} />
                Estimates
                {srEstimates.length > 0 && (
                  <Badge count={srEstimates.length} size="small" style={{ marginLeft: 6 }} />
                )}
              </span>
            ),
            children: (
              <Card
                title="Linked Estimates"
                extra={
                  isAdmin && (
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() =>
                        navigate(
                          `/estimates/new?service_request_id=${request.id}${request.contact_id ? `&contact_id=${request.contact_id}` : ''}`,
                        )
                      }
                    >
                      Create Estimate
                    </Button>
                  )
                }
              >
                <Table
                  dataSource={srEstimates}
                  loading={estimatesLoading}
                  rowKey="id"
                  pagination={false}
                  locale={{ emptyText: 'No estimates linked to this service request yet.' }}
                  columns={[
                    {
                      title: 'Estimate #',
                      dataIndex: 'estimate_number',
                      render: (num: string, row: any) => (
                        <Button type="link" style={{ padding: 0 }} onClick={() => navigate(`/estimates/${row.id}`)}>
                          {num}
                        </Button>
                      ),
                    },
                    {
                      title: 'Status',
                      dataIndex: 'status',
                      render: (s: string) => (
                        <Tag color={estimateStatusColors[s] || 'default'}>
                          {s.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                        </Tag>
                      ),
                    },
                    {
                      title: 'Customer',
                      dataIndex: 'contact',
                      render: (c: any) => (c ? `${c.first_name} ${c.last_name}` : '-'),
                    },
                    {
                      title: 'Total',
                      dataIndex: 'total',
                      align: 'right' as const,
                      render: (t: number) => `$${Number(t || 0).toFixed(2)}`,
                    },
                    {
                      title: 'Created',
                      dataIndex: 'created_at',
                      render: (d: string) => formatDateTime(d),
                    },
                    {
                      title: '',
                      key: 'action',
                      render: (_: any, row: any) => (
                        <Button size="small" onClick={() => navigate(`/estimates/${row.id}`)}>
                          View
                        </Button>
                      ),
                    },
                  ]}
                />
              </Card>
            ),
          },
        ]}
      />

      {/* Assign Technician Modal */}
      <Modal
        title="Assign Technician"
        open={assignModalOpen}
        onOk={handleAssignTechnician}
        onCancel={() => { setAssignModalOpen(false); setSelectedTechnicianId(''); }}
        confirmLoading={assignTechnician.isPending}
        okText="Assign"
        okButtonProps={{ disabled: !selectedTechnicianId }}
      >
        <p style={{ marginBottom: 12 }}>Select a technician to assign to this service request:</p>
        <Select
          style={{ width: '100%' }}
          placeholder="Search and select a technician"
          showSearch
          optionFilterProp="label"
          value={selectedTechnicianId || undefined}
          onChange={(val) => setSelectedTechnicianId(val)}
          options={agents.map((a) => ({
            value: a.id,
            label: `${a.first_name} ${a.last_name}${a.email ? ` (${a.email})` : ''}`,
          }))}
        />
      </Modal>

      {/* Approval Action Modal */}
      <Modal
        title={approvalAction === 'APPROVE' ? 'Approve Service Request' : 'Reject Service Request'}
        open={approvalModalOpen}
        onOk={handleProcessApproval}
        onCancel={() => setApprovalModalOpen(false)}
        confirmLoading={processApproval.isPending}
        okText={approvalAction === 'APPROVE' ? 'Approve' : 'Reject'}
        okButtonProps={{
          danger: approvalAction === 'REJECT',
        }}
      >
        <p>
          {approvalAction === 'APPROVE'
            ? 'Are you sure you want to approve this service request?'
            : 'Are you sure you want to reject this service request? This will skip all remaining approvers.'}
        </p>
        <Input.TextArea
          rows={3}
          placeholder="Add comments (optional)"
          value={approvalComments}
          onChange={(e) => setApprovalComments(e.target.value)}
        />
      </Modal>
    </div>
  );
}
