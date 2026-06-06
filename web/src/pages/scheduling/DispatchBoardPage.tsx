import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Alert, Button, Table, Space, Tooltip, Tag, Tabs, Card, Descriptions, Skeleton, Modal, Select, Divider, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { EyeOutlined, UserAddOutlined, ReloadOutlined, CalendarOutlined, FileTextOutlined, TeamOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { workOrdersApi } from '@/api/work-orders.api';
import type { WorkOrder } from '@/types/models.types';

// Fix default Leaflet marker icons in bundlers
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});
const blueIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});
const greenIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

const { Text } = Typography;
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import {
  useAppointments,
  useAssignTechnician,
  useScheduleAssigner,
  useUpdateAppointmentStatus,
} from '@/hooks/use-appointments';
import { useAgents } from '@/hooks/use-users';
import { useAuthStore } from '@/store/auth.store';
import type { ServiceAppointment } from '@/types/models.types';
import PageHeader from '@/components/common/PageHeader';
import { PermissionGuard } from '@/components/permissions';
import SearchFilter from '@/components/common/SearchFilter';
import { formatDateTime } from '@/utils/format-date';

const statusColors: Record<string, string> = {
  scheduled: 'blue',
  in_progress: 'processing',
  completed: 'green',
  cancelled: 'red',
};

const statusTransitions: Record<string, string[]> = {
  scheduled: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

export default function DispatchBoardPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();

  const formatStatus = (status: string): string => {
    const key = status === 'in_progress' ? 'inProgress' : status;
    return t(`dispatchBoard.status.${key}`, {
      defaultValue: status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
    });
  };

  const statusOptions = [
    { value: 'scheduled', label: t('dispatchBoard.status.scheduled') },
    { value: 'in_progress', label: t('dispatchBoard.status.inProgress') },
    { value: 'completed', label: t('dispatchBoard.status.completed') },
    { value: 'cancelled', label: t('dispatchBoard.status.cancelled') },
  ];

  const initialTab = searchParams.get('tab') || 'all';
  const [activeTab, setActiveTab] = useState(initialTab);

  // Shared pagination (reset on tab switch — matching SR pattern)
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Search
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  // Status filter for "All" tab (server-side filtering via query param)
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);

  // Detail modal
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<ServiceAppointment | null>(null);

  // Assign modal
  const [assignVisible, setAssignVisible] = useState(false);
  const [assignTarget, setAssignTarget] = useState<ServiceAppointment | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState<string | undefined>(undefined);

  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const assignTechnician = useAssignTechnician();
  const updateStatus = useUpdateAppointmentStatus();
  const { data: agents = [] } = useAgents();
  const { data: scheduleAssignerId } = useScheduleAssigner();

  // Only the designated schedule assigner (from SCHEDULE workflow) can assign techs
  const canAssign = user?.id != null && user.id === scheduleAssignerId;

  // Resolve assigner name for the info banner
  const assignerAgent = agents.find((a: { id: string }) => a.id === scheduleAssignerId);
  const assignerName = assignerAgent
    ? `${(assignerAgent as any).first_name} ${(assignerAgent as any).last_name}`
    : null;

  // ─── Queries (only active tab fetches — matching SR pattern) ───────

  // Tab 1: All Appointments — show every appointment regardless of status
  const allQuery = useAppointments(
    {
      page,
      take: pageSize,
      search,
      ...(statusFilter ? { status: statusFilter } : {}),
    },
    activeTab === 'all',
  );

  // Tab 2: New / Assign — only scheduled appointments with no technician assigned
  const newQuery = useAppointments(
    { page, take: pageSize, search, status: 'scheduled', unassigned: 'true' },
    activeTab === 'new',
  );

  // Pick active query
  const currentQuery = activeTab === 'all' ? allQuery : newQuery;
  const appointments = currentQuery.data?.data || [];
  const meta = currentQuery.data?.meta;
  const isLoading = currentQuery.isLoading;

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Auto-open detail modal when arriving via appointment notification link
  useEffect(() => {
    const appointmentId = searchParams.get('appointment_id');
    if (appointmentId && appointments.length > 0) {
      const target = appointments.find((a) => a.id === appointmentId);
      if (target) {
        setSelectedAppointment(target);
        setDetailVisible(true);
      }
    }
  }, [searchParams, appointments]);

  // Reset page when switching tabs (matching SR pattern)
  const handleTabChange = (key: string) => {
    setActiveTab(key);
    setPage(1);
    setSearch('');
    setSearchInput('');
    setStatusFilter(undefined);
  };

  const handleViewDetail = (appointment: ServiceAppointment) => {
    setSelectedAppointment(appointment);
    setDetailVisible(true);
  };

  const handleOpenAssign = (appointment: ServiceAppointment) => {
    setAssignTarget(appointment);
    setSelectedAgentId(undefined);
    setAssignVisible(true);
  };

  const handleAssignSubmit = async () => {
    if (!assignTarget || !selectedAgentId) return;
    await assignTechnician.mutateAsync({ id: assignTarget.id, agentId: selectedAgentId });
    setAssignVisible(false);
    setAssignTarget(null);
    setSelectedAgentId(undefined);
    // Technician assigned (status stays scheduled), refresh & switch to All tab
    await queryClient.invalidateQueries({ queryKey: ['appointments'] });
    await queryClient.invalidateQueries({ queryKey: ['document-approvals'] });
    setActiveTab('all');
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    await updateStatus.mutateAsync({ id, status: newStatus });
    if (selectedAppointment && selectedAppointment.id === id) {
      setSelectedAppointment({ ...selectedAppointment, status: newStatus as ServiceAppointment['status'] });
    }
  };

  const handleReload = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['appointments'] });
  }, [queryClient]);

  // Live map: fetch all work orders with locations, auto-refresh every 30s
  const { data: mapWorkOrders = [], refetch: refetchMap } = useQuery({
    queryKey: ['work-orders', 'dispatch-map'],
    queryFn: async () => {
      const res = await workOrdersApi.getAllNonPaginated();
      return (res.data.data || []) as WorkOrder[];
    },
    enabled: activeTab === 'map',
    refetchInterval: activeTab === 'map' ? 30000 : false,
  });

  const jobsWithLocation = mapWorkOrders.filter(
    (wo) => wo.location?.lat && wo.location?.lng,
  );

  // ─── Shared columns (without actions) ─────────────────────────────

  const baseColumns: ColumnsType<ServiceAppointment> = [
    {
      title: t('dispatchBoard.columns.agent'),
      key: 'agent',
      render: (_, record) =>
        record.agent
          ? `${record.agent.first_name} ${record.agent.last_name}`
          : <Tag color="orange">{t('dispatchBoard.status.unassigned')}</Tag>,
    },
    {
      title: t('dispatchBoard.columns.workOrder'),
      key: 'work_order',
      render: (_, record) =>
        record.work_order
          ? <span style={{ fontWeight: 500 }}>{record.work_order.wo_number || record.work_order.summary}</span>
          : <span style={{ color: '#999' }}>{record.work_order_id || '-'}</span>,
    },
    {
      title: t('dispatchBoard.columns.status'),
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={statusColors[status] || 'default'}>
          {formatStatus(status)}
        </Tag>
      ),
    },
    {
      title: t('dispatchBoard.columns.scheduledStart'),
      dataIndex: 'scheduled_start',
      key: 'scheduled_start',
      render: (date: string) => date ? formatDateTime(date) : <span style={{ opacity: 0.5 }}>-</span>,
      sorter: (a, b) => new Date(a.scheduled_start).getTime() - new Date(b.scheduled_start).getTime(),
    },
    {
      title: t('dispatchBoard.columns.scheduledEnd'),
      dataIndex: 'scheduled_end',
      key: 'scheduled_end',
      render: (date: string) => date ? formatDateTime(date) : <span style={{ opacity: 0.5 }}>-</span>,
      sorter: (a, b) => new Date(a.scheduled_end).getTime() - new Date(b.scheduled_end).getTime(),
    },
    {
      title: t('dispatchBoard.columns.createdAt'),
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => date ? formatDateTime(date) : <span style={{ opacity: 0.5 }}>-</span>,
      sorter: (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      defaultSortOrder: 'descend',
    },
  ];

  // ─── Tab-specific action columns ──────────────────────────────────

  // Tab 1 (All): View only
  const allColumns: ColumnsType<ServiceAppointment> = [
    ...baseColumns,
    {
      title: t('dispatchBoard.columns.actions'),
      key: 'actions',
      fixed: 'right',
      width: 80,
      render: (_, record) => (
        <PermissionGuard anyPermissions={['service_appointments:read', 'scheduling:read']}>
          <Tooltip title={t('dispatchBoard.actions.view')}>
            <Button type="text" icon={<EyeOutlined />} size="small" onClick={() => handleViewDetail(record)} />
          </Tooltip>
        </PermissionGuard>
      ),
    },
  ];

  // Tab 2 (New / Assign): View + Assign Technician
  const newColumns: ColumnsType<ServiceAppointment> = [
    ...baseColumns,
    {
      title: t('dispatchBoard.columns.actions'),
      key: 'actions',
      fixed: 'right',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <PermissionGuard anyPermissions={['service_appointments:read', 'scheduling:read']}>
            <Tooltip title={t('dispatchBoard.actions.view')}>
              <Button type="text" icon={<EyeOutlined />} size="small" onClick={() => handleViewDetail(record)} />
            </Tooltip>
          </PermissionGuard>
          {canAssign && !record.agent_id && (
            <Tooltip title={t('dispatchBoard.actions.assignTechnician')}>
              <Button type="primary" icon={<UserAddOutlined />} size="small" onClick={() => handleOpenAssign(record)}>
                {t('dispatchBoard.actions.assign')}
              </Button>
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  const columns = activeTab === 'all' ? allColumns : newColumns;

  const availableTransitions = selectedAppointment
    ? statusTransitions[selectedAppointment.status] || []
    : [];

  const tabItems = [
    { key: 'all', label: t('dispatchBoard.tabs.allAppointments') },
    { key: 'new', label: t('dispatchBoard.tabs.newAssign') },
    { key: 'map', label: <span><EnvironmentOutlined style={{ marginRight: 4 }} />{t('dispatchBoard.tabs.liveMap')}</span> },
  ];

  return (
    <div>
      <PageHeader
        title={t('nav.scheduling')}
        subtitle={t('dispatchBoard.header.subtitle')}
      />

      <Tabs
        activeKey={activeTab}
        onChange={handleTabChange}
        items={tabItems}
        style={{ marginBottom: 16 }}
      />

      {activeTab !== 'map' && (
        <>
          <div style={{ marginBottom: 16, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <SearchFilter
              placeholder={t('dispatchBoard.filters.searchPlaceholder')}
              allowClear
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              style={{ width: 400 }}
            />
            {activeTab === 'all' && (
              <Select
                placeholder={t('dispatchBoard.filters.statusPlaceholder')}
                allowClear
                value={statusFilter}
                onChange={(value) => { setStatusFilter(value); setPage(1); }}
                options={statusOptions}
                style={{ width: 200 }}
              />
            )}
            <Button icon={<ReloadOutlined />} onClick={handleReload}>{t('dispatchBoard.actions.reload')}</Button>
          </div>

          {activeTab === 'new' && (
            <Alert
              type={canAssign ? 'info' : 'warning'}
              showIcon
              style={{ marginBottom: 16 }}
              message={
                canAssign
                  ? t('dispatchBoard.alerts.canAssign', { name: assignerName ? ` (${assignerName})` : '' })
                  : scheduleAssignerId
                    ? t('dispatchBoard.alerts.cannotAssign', { name: assignerName ? ` (${assignerName})` : '' })
                    : t('dispatchBoard.alerts.noWorkflow')
              }
            />
          )}

          <Table
            columns={columns}
            dataSource={appointments}
            rowKey="id"
            loading={isLoading}
            scroll={{ x: 1200 }}
            pagination={{
              current: page,
              pageSize,
              total: meta?.itemCount || 0,
              showSizeChanger: true,
              showTotal: (total) => t('dispatchBoard.pagination.total', { total }),
              onChange: (newPage, newPageSize) => {
                setPage(newPage);
                setPageSize(newPageSize);
              },
            }}
          />
        </>
      )}

      {activeTab === 'map' && (
        <Card
          extra={
            <Button icon={<ReloadOutlined />} size="small" onClick={() => refetchMap()}>
              {t('dispatchBoard.actions.refresh')}
            </Button>
          }
        >
          <Space style={{ marginBottom: 12 }}>
            <Tag color="red">{t('dispatchBoard.status.unassigned')}</Tag>
            <Tag color="blue">{t('dispatchBoard.status.assignedInProgress')}</Tag>
            <Tag color="green">{t('dispatchBoard.status.completed')}</Tag>
            <Text type="secondary" style={{ fontSize: 12 }}>{t('dispatchBoard.map.autoRefresh')}</Text>
          </Space>
          {jobsWithLocation.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: '#999' }}>
              {t('dispatchBoard.map.noLocations')}
            </div>
          ) : (
            <div style={{ height: 500, width: '100%', borderRadius: 8, overflow: 'hidden', border: '1px solid #d9d9d9' }}>
              <MapContainer
                center={[Number(jobsWithLocation[0].location!.lat), Number(jobsWithLocation[0].location!.lng)]}
                zoom={11}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {jobsWithLocation.map((wo) => {
                  const lat = Number(wo.location!.lat);
                  const lng = Number(wo.location!.lng);
                  const icon = wo.status === 'completed' || wo.status === 'closed'
                    ? greenIcon
                    : wo.assigned_to
                      ? blueIcon
                      : redIcon;
                  return (
                    <Marker key={wo.id} position={[lat, lng]} icon={icon}>
                      <Popup>
                        <strong>{wo.wo_number || wo.id}</strong>
                        <div style={{ fontSize: 12, marginTop: 4 }}>{wo.summary}</div>
                        <div style={{ fontSize: 12, marginTop: 2 }}>
                          {t('dispatchBoard.map.statusLabel')}: <Tag style={{ fontSize: 11 }}>{formatStatus(wo.status)}</Tag>
                        </div>
                        {wo.location?.address && (
                          <div style={{ fontSize: 12, marginTop: 2, color: '#666' }}>{wo.location.address}</div>
                        )}
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>
            </div>
          )}
        </Card>
      )}

      {/* Assign Technician Modal */}
      <Modal
        title={null}
        open={assignVisible}
        onCancel={() => { setAssignVisible(false); setAssignTarget(null); setSelectedAgentId(undefined); }}
        onOk={handleAssignSubmit}
        okText={t('dispatchBoard.actions.assign')}
        okButtonProps={{ disabled: !selectedAgentId, loading: assignTechnician.isPending }}
        width={520}
      >
        {assignTarget && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                background: 'linear-gradient(135deg, #1677ff 0%, #4096ff 100%)',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 12,
              }}>
                <UserAddOutlined style={{ fontSize: 22, color: '#fff' }} />
              </div>
              <div style={{ fontSize: 18, fontWeight: 600 }}>{t('dispatchBoard.assignModal.title')}</div>
              <Text type="secondary">{t('dispatchBoard.assignModal.subtitle')}</Text>
            </div>

            <Card size="small" style={{ marginBottom: 20, background: '#fafafa', border: '1px solid #f0f0f0' }}>
              <Space direction="vertical" size={8} style={{ width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <FileTextOutlined style={{ color: '#1677ff', fontSize: 16 }} />
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>{t('dispatchBoard.assignModal.workOrder')}</Text>
                    <div style={{ fontWeight: 500 }}>
                      {assignTarget.work_order
                        ? `${assignTarget.work_order.wo_number || 'N/A'}`
                        : assignTarget.work_order_id}
                    </div>
                    {assignTarget.work_order?.summary && (
                      <Text type="secondary" style={{ fontSize: 12 }}>{assignTarget.work_order.summary}</Text>
                    )}
                  </div>
                </div>
                <Divider style={{ margin: '4px 0' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <CalendarOutlined style={{ color: '#52c41a', fontSize: 16 }} />
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>{t('dispatchBoard.assignModal.schedule')}</Text>
                    <div style={{ fontWeight: 500 }}>
                      {assignTarget.scheduled_start ? formatDateTime(assignTarget.scheduled_start) : '-'}
                    </div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {t('dispatchBoard.assignModal.to')} {assignTarget.scheduled_end ? formatDateTime(assignTarget.scheduled_end) : '-'}
                    </Text>
                  </div>
                </div>
              </Space>
            </Card>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <TeamOutlined style={{ color: '#1677ff' }} />
              <Text strong>{t('dispatchBoard.assignModal.selectTechnician')}</Text>
            </div>
            <Select
              placeholder={t('dispatchBoard.assignModal.selectPlaceholder')}
              showSearch
              size="large"
              value={selectedAgentId}
              onChange={setSelectedAgentId}
              style={{ width: '100%' }}
              optionFilterProp="label"
              options={agents.map((agent: { id: string; first_name: string; last_name: string; email: string }) => ({
                value: agent.id,
                label: `${agent.first_name} ${agent.last_name} (${agent.email})`,
              }))}
            />
          </div>
        )}
      </Modal>

      {/* Appointment Detail Modal */}
      <Modal
        title={t('dispatchBoard.detailModal.title')}
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={700}
      >
        {selectedAppointment ? (
          <div>
            {availableTransitions.length > 0 && (
              <Card size="small" style={{ marginBottom: 16 }}>
                <Space>
                  <span style={{ fontWeight: 500 }}>{t('dispatchBoard.detailModal.transitionTo')}</span>
                  {availableTransitions.map((status) => (
                    <Button
                      key={status}
                      type="primary"
                      size="small"
                      loading={updateStatus.isPending}
                      onClick={() => handleStatusChange(selectedAppointment.id, status)}
                    >
                      {formatStatus(status)}
                    </Button>
                  ))}
                </Space>
              </Card>
            )}
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label={t('dispatchBoard.columns.agent')}>
                {selectedAppointment.agent
                  ? `${selectedAppointment.agent.first_name} ${selectedAppointment.agent.last_name}`
                  : <Tag color="orange">{t('dispatchBoard.status.unassigned')}</Tag>}
              </Descriptions.Item>
              <Descriptions.Item label={t('dispatchBoard.columns.status')}>
                <Tag color={statusColors[selectedAppointment.status] || 'default'}>
                  {formatStatus(selectedAppointment.status)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label={t('dispatchBoard.columns.workOrder')}>
                {selectedAppointment.work_order
                  ? selectedAppointment.work_order.wo_number || selectedAppointment.work_order.summary
                  : selectedAppointment.work_order_id || <span style={{ opacity: 0.5 }}>-</span>}
              </Descriptions.Item>
              <Descriptions.Item label={t('dispatchBoard.detailModal.crewId')}>
                {selectedAppointment.crew_id || <span style={{ opacity: 0.5 }}>-</span>}
              </Descriptions.Item>
              <Descriptions.Item label={t('dispatchBoard.columns.scheduledStart')}>
                {selectedAppointment.scheduled_start ? formatDateTime(selectedAppointment.scheduled_start) : <span style={{ opacity: 0.5 }}>-</span>}
              </Descriptions.Item>
              <Descriptions.Item label={t('dispatchBoard.columns.scheduledEnd')}>
                {selectedAppointment.scheduled_end ? formatDateTime(selectedAppointment.scheduled_end) : <span style={{ opacity: 0.5 }}>-</span>}
              </Descriptions.Item>
              <Descriptions.Item label={t('dispatchBoard.detailModal.actualStart')}>
                {selectedAppointment.actual_start ? formatDateTime(selectedAppointment.actual_start) : <span style={{ opacity: 0.5 }}>-</span>}
              </Descriptions.Item>
              <Descriptions.Item label={t('dispatchBoard.detailModal.actualEnd')}>
                {selectedAppointment.actual_end ? formatDateTime(selectedAppointment.actual_end) : <span style={{ opacity: 0.5 }}>-</span>}
              </Descriptions.Item>
              <Descriptions.Item label={t('dispatchBoard.detailModal.recurring')}>
                {selectedAppointment.is_recurring ? <Tag color="blue">{t('dispatchBoard.detailModal.yes')}</Tag> : <Tag>{t('dispatchBoard.detailModal.no')}</Tag>}
              </Descriptions.Item>
              <Descriptions.Item label={t('dispatchBoard.detailModal.recurrenceRule')}>
                {selectedAppointment.recurrence_rule || <span style={{ opacity: 0.5 }}>-</span>}
              </Descriptions.Item>
              <Descriptions.Item label={t('dispatchBoard.detailModal.notes')} span={2}>
                {selectedAppointment.notes || <span style={{ opacity: 0.5 }}>-</span>}
              </Descriptions.Item>
              <Descriptions.Item label={t('dispatchBoard.columns.createdAt')}>
                {formatDateTime(selectedAppointment.created_at)}
              </Descriptions.Item>
              <Descriptions.Item label={t('dispatchBoard.detailModal.updatedAt')}>
                {formatDateTime(selectedAppointment.updated_at)}
              </Descriptions.Item>
            </Descriptions>
          </div>
        ) : (
          <Skeleton active />
        )}
      </Modal>
    </div>
  );
}