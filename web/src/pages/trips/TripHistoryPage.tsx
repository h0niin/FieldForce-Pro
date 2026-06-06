import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Avatar,
  Card,
  Table,
  Space,
  DatePicker,
  Select,
  Tag,
  Button,
  Row,
  Col,
  Drawer,
  Typography,
  Empty,
  Timeline,
  Tooltip,
  Divider,
  Descriptions,
} from 'antd';
import { ServiceLocationMap } from '@/components/work-orders/ServiceLocationMap';
import type { ColumnsType } from 'antd/es/table';
import {
  EnvironmentOutlined,
  ClockCircleOutlined,
  DashboardOutlined,
  CarOutlined,
  EyeOutlined,
  FilterOutlined,
  UserOutlined,
  SwapRightOutlined,
  ReloadOutlined,
  CalendarOutlined,
  AimOutlined,
} from '@ant-design/icons';
import { useTrips } from '@/hooks/use-trips';
import { useUsers } from '@/hooks/use-users';
import StatsCard from '@/components/dashboard/StatsCard';
import PageHeader from '@/components/common/PageHeader';
import { formatDateTime, formatDuration } from '@/utils/format-date';
import dayjs from 'dayjs';
import SearchFilter from '@/components/common/SearchFilter';

const { RangePicker } = DatePicker;
const { Text } = Typography;

interface TripRecord {
  id: string;
  user_id: string;
  user?: { first_name: string; last_name: string };
  work_order_id?: string;
  work_order?: { wo_number: string; summary: string };
  start_lat?: number | string | null;
  start_lng?: number | string | null;
  end_lat?: number | string | null;
  end_lng?: number | string | null;
  start_time: string;
  end_time?: string;
  distance_km?: number | string;
  duration_minutes?: number;
  status: string;
  created_at: string;
}

// Helpers
const km = (v: unknown) => Number(v) || 0;
const getInitials = (u?: TripRecord['user']) =>
  u ? `${u.first_name?.[0] || ''}${u.last_name?.[0] || ''}`.toUpperCase() : '?';

export default function TripHistoryPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([null, null]);
  const [selectedTrip, setSelectedTrip] = useState<TripRecord | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);

  // Define STATUS_CONFIG inside the component to use t()
  const STATUS_CONFIG_TRANSLATED: Record<string, { color: string; label: string }> = {
    in_progress: { color: 'processing', label: t('tripHistory.status.inTransit') },
    completed:   { color: 'success',    label: t('tripHistory.status.completed') },
    cancelled:   { color: 'default',    label: t('tripHistory.status.cancelled') },
  };

  const { data, isLoading, error, refetch } = useTrips({ page, take: pageSize, search } as Record<string, unknown> & {
    page: number;
    take: number;
  });
  const { data: usersData } = useUsers({ page: 1, take: 100 });

  // Enrich trips with computed duration_minutes if missing
  const trips = ((data?.data || []) as unknown as TripRecord[]).map((trip) => {
    if (trip.duration_minutes == null && trip.start_time && trip.end_time) {
      const ms = new Date(trip.end_time).getTime() - new Date(trip.start_time).getTime();
      return { ...trip, duration_minutes: Math.round(ms / 60000) };
    }
    return trip;
  });
  const meta = data?.meta;
  const users = usersData?.data || [];

  // Client-side filters (agent, status, date range)
  const filteredTrips = trips.filter((trip) => {
    if (selectedAgent && trip.user_id !== selectedAgent) return false;
    if (statusFilter && trip.status !== statusFilter) return false;
    if (dateRange[0] && dateRange[1]) {
      const d = dayjs(trip.start_time);
      if (!d.isBetween(dateRange[0], dateRange[1], 'day', '[]')) return false;
    }
    return true;
  });

  // Statistics
  const totalTrips = filteredTrips.length;
  const completedTrips = filteredTrips.filter((t) => t.status === 'completed').length;
  const totalDistance = filteredTrips.reduce((s, t) => s + km(t.distance_km), 0);
  const totalDuration = filteredTrips.reduce((s, t) => s + (Number(t.duration_minutes) || 0), 0);
  const avgDistance = totalTrips > 0 ? totalDistance / totalTrips : 0;
  const activeTrips = filteredTrips.filter((t) => t.status === 'in_progress').length;

  const openDrawer = (trip: TripRecord) => {
    setSelectedTrip(trip);
    setDrawerVisible(true);
  };

  const clearFilters = () => {
    setSelectedAgent(undefined);
    setStatusFilter(undefined);
    setDateRange([null, null]);
    setSearch('');
  };
  const hasFilters = !!(selectedAgent || statusFilter || dateRange[0]);

  // ── Table columns ──────────────────────────────────────────────────────────
  const columns: ColumnsType<TripRecord> = [
    {
      title: t('tripHistory.table.technician'),
      dataIndex: 'user',
      key: 'user',
      width: 220,
      render: (user: TripRecord['user']) => (
        <Space size={10}>
          <Avatar
            size={36}
            style={{
              backgroundColor: user ? '#1677ff' : '#d9d9d9',
              fontSize: 13,
              fontWeight: 600,
            }}
            icon={!user ? <UserOutlined /> : undefined}
          >
            {user ? getInitials(user) : null}
          </Avatar>
          <div style={{ lineHeight: 1.3 }}>
            <Text strong style={{ fontSize: 13 }}>
              {user ? `${user.first_name} ${user.last_name}` : t('tripHistory.table.unknown')}
            </Text>
            <br />
            <Text type="secondary" style={{ fontSize: 11 }}>{t('tripHistory.table.fieldTechnician')}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: t('tripHistory.table.workOrder'),
      dataIndex: 'work_order',
      key: 'work_order',
      width: 160,
      render: (wo: TripRecord['work_order'], record) =>
        wo ? (
          <div>
            <Button
              type="link"
              size="small"
              onClick={() => navigate(`/work-orders/${record.work_order_id}`)}
              style={{ padding: 0, fontWeight: 600, fontSize: 13 }}
            >
              {wo.wo_number}
            </Button>
            <br />
            <Text type="secondary" style={{ fontSize: 11 }} ellipsis>
              {wo.summary}
            </Text>
          </div>
        ) : (
          <Text type="secondary">-</Text>
        ),
    },
    {
      title: t('tripHistory.table.dateTime'),
      dataIndex: 'start_time',
      key: 'start_time',
      width: 180,
      render: (date: string, record) => (
        <div style={{ lineHeight: 1.4 }}>
          <Text style={{ fontSize: 13 }}>{dayjs(date).format('MMM D, YYYY')}</Text>
          <br />
          <Space size={4}>
            <Text type="secondary" style={{ fontSize: 11 }}>{dayjs(date).format('h:mm A')}</Text>
            {record.end_time && (
              <>
                <SwapRightOutlined style={{ fontSize: 10, color: '#999' }} />
                <Text type="secondary" style={{ fontSize: 11 }}>{dayjs(record.end_time).format('h:mm A')}</Text>
              </>
            )}
          </Space>
        </div>
      ),
      sorter: (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
      defaultSortOrder: 'descend',
    },
    {
      title: t('tripHistory.table.duration'),
      dataIndex: 'duration_minutes',
      key: 'duration_minutes',
      width: 110,
      align: 'center',
      render: (minutes: number) =>
        minutes ? (
          <Tag
            color="blue"
            style={{ borderRadius: 12, fontWeight: 500, margin: 0 }}
          >
            <ClockCircleOutlined style={{ marginRight: 4 }} />
            {formatDuration(minutes * 60)}
          </Tag>
        ) : (
          <Tag color="processing" style={{ borderRadius: 12, margin: 0 }}>{t('tripHistory.status.inTransit')}</Tag>
        ),
    },
    {
      title: t('tripHistory.table.distance'),
      dataIndex: 'distance_km',
      key: 'distance_km',
      width: 100,
      align: 'center',
      render: (v: number | string) =>
        km(v) > 0 ? (
          <Text strong style={{ fontSize: 13 }}>{km(v).toFixed(1)} km</Text>
        ) : (
          <Text type="secondary">-</Text>
        ),
      sorter: (a, b) => km(a.distance_km) - km(b.distance_km),
    },
    {
      title: t('tripHistory.table.status'),
      dataIndex: 'status',
      key: 'status',
      width: 110,
      align: 'center',
      render: (status: string) => {
        const cfg = STATUS_CONFIG_TRANSLATED[status] || { color: 'default', label: status };
        return <Tag color={cfg.color} style={{ borderRadius: 12, margin: 0 }}>{cfg.label}</Tag>;
      },
    },
    {
      title: '',
      key: 'actions',
      fixed: 'right',
      width: 50,
      render: (_, record) => (
        <Tooltip title={t('tripHistory.table.viewDetails')}>
          <Button
            type="text"
            icon={<EyeOutlined />}
            size="small"
            onClick={() => openDrawer(record)}
          />
        </Tooltip>
      ),
    },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div>
      <PageHeader
        title={t('tripHistory.pageHeader.title')}
        subtitle={t('tripHistory.pageHeader.subtitle')}
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
              {t('tripHistory.pageHeader.refresh')}
            </Button>
          </Space>
        }
      />

      {/* ── Stat Cards ────────────────────────────────────────────────── */}
      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard
            title={t('tripHistory.stats.totalTrips')}
            value={totalTrips}
            icon={<CarOutlined style={{ fontSize: 22 }} />}
            color="#2563eb"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard
            title={t('tripHistory.stats.completed')}
            value={completedTrips}
            icon={<AimOutlined style={{ fontSize: 22 }} />}
            color="#16a34a"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard
            title={t('tripHistory.stats.totalDistance')}
            value={`${totalDistance.toFixed(1)} km`}
            icon={<DashboardOutlined style={{ fontSize: 22 }} />}
            color="#f59e0b"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard
            title={t('tripHistory.stats.avgDistance')}
            value={`${avgDistance.toFixed(1)} km`}
            icon={<EnvironmentOutlined style={{ fontSize: 22 }} />}
            color="#8b5cf6"
          />
        </Col>
      </Row>

      {/* ── Filters ───────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <SearchFilter
          placeholder={t('tripHistory.filters.searchPlaceholder')}
          allowClear
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: 260 }}
        />
        <Select
          placeholder={t('tripHistory.filters.allTechnicians')}
          allowClear
          value={selectedAgent}
          onChange={setSelectedAgent}
          style={{ width: 200 }}
          options={users.map((u) => ({
            value: u.id,
            label: `${u.first_name} ${u.last_name}`,
          }))}
        />
        <Select
          placeholder={t('tripHistory.filters.allStatus')}
          allowClear
          value={statusFilter}
          onChange={setStatusFilter}
          style={{ width: 150 }}
          options={[
            { value: 'in_progress', label: t('tripHistory.status.inTransit') },
            { value: 'completed', label: t('tripHistory.status.completed') },
            { value: 'cancelled', label: t('tripHistory.status.cancelled') },
          ]}
        />
        <RangePicker
          value={dateRange}
          onChange={(dates) => setDateRange(dates as [dayjs.Dayjs | null, dayjs.Dayjs | null])}
          style={{ width: 260 }}
          placeholder={[t('tripHistory.filters.startDate'), t('tripHistory.filters.endDate')]}
        />
        {hasFilters && (
          <Button icon={<FilterOutlined />} onClick={clearFilters} size="small" type="link">
            {t('tripHistory.filters.clear')}
          </Button>
        )}

        {activeTrips > 0 && (
          <Tag color="processing" style={{ marginLeft: 'auto', borderRadius: 12 }}>
            <CarOutlined /> {t('tripHistory.filters.activeTrips', { count: activeTrips, activeTrips: activeTrips })}
          </Tag>
        )}
      </div>

      {/* ── Error ─────────────────────────────────────────────────────── */}
      {error && (
        <Alert
          type="error"
          showIcon
          closable
          style={{ marginBottom: 16 }}
          message={t('tripHistory.alert.failedToLoadTrips')}
          description={
            (error as any)?.response?.status === 403
              ? t('tripHistory.alert.permissionDenied')
              : (error as any)?.message || t('tripHistory.alert.unexpectedError')
          }
        />
      )}

      {/* ── Table ─────────────────────────────────────────────────────── */}
      <Card
        style={{ borderRadius: 12 }}
        styles={{ body: { padding: 0 } }}
      >
        <Table
          columns={columns}
          dataSource={filteredTrips}
          rowKey="id"
          loading={isLoading}
          scroll={{ x: 1000 }}
          onRow={(record) => ({
            onClick: () => openDrawer(record),
            style: { cursor: 'pointer' },
          })}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                style={{ padding: '40px 0' }}
                description={
                  <Space direction="vertical" size={4}>
                    <Text type="secondary">{t('tripHistory.empty.noRecordsFound')}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {t('tripHistory.empty.recordsDescription')}
                    </Text>
                  </Space>
                }
              />
            ),
          }}
          pagination={{
            current: page,
            pageSize,
            total: meta?.itemCount || 0,
            showSizeChanger: true,
            showTotal: (total) => t('tripHistory.pagination.totalTrips', { total, count: total }),
            onChange: (p, ps) => {
              setPage(p);
              if (ps !== pageSize) { setPageSize(ps); setPage(1); }
            },
          }}
        />
      </Card>

      {/* ── Detail Drawer ─────────────────────────────────────────────── */}
      <Drawer
        title={null}
        placement="right"
        width={560}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        styles={{ body: { padding: 0 } }}
      >
        {selectedTrip && <TripDetailPanel trip={selectedTrip} navigate={navigate} />}
      </Drawer>
    </div>
  );
}

// ── Drawer Detail Panel ────────────────────────────────────────────────────

function TripDetailPanel({
  trip,
  navigate,
}: {
  trip: TripRecord;
  navigate: ReturnType<typeof useNavigate>;
}) {
  const { t } = useTranslation();

  // Define STATUS_CONFIG locally here as well
  const STATUS_CONFIG_TRANSLATED: Record<string, { color: string; label: string }> = {
    in_progress: { color: 'processing', label: t('tripHistory.status.inTransit') },
    completed:   { color: 'success',    label: t('tripHistory.status.completed') },
    cancelled:   { color: 'default',    label: t('tripHistory.status.cancelled') },
  };

  const status = STATUS_CONFIG_TRANSLATED[trip.status] || { color: 'default', label: trip.status };
  const durationMin = Number(trip.duration_minutes) || 0;
  const distKm = km(trip.distance_km);

  return (
    <div>
      {/* Header banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1677ff 0%, #4096ff 100%)',
          padding: '24px 24px 20px',
          color: '#fff',
        }}
      >
        <Space size={14} align="start">
          <Avatar
            size={48}
            style={{ backgroundColor: 'rgba(255,255,255,0.2)', fontSize: 16, fontWeight: 700 }}
          >
            {getInitials(trip.user)}
          </Avatar>
          <div>
            <Text strong style={{ color: '#fff', fontSize: 18, display: 'block' }}>
              {trip.user ? `${trip.user.first_name} ${trip.user.last_name}` : t('tripHistory.table.unknown')}
            </Text>
            <Space size={8} style={{ marginTop: 4 }}>
              <Tag color={status.color} style={{ borderRadius: 10, margin: 0 }}>{status.label}</Tag>
              {trip.work_order && (
                <Tag
                  color="blue"
                  style={{ borderRadius: 10, margin: 0, cursor: 'pointer' }}
                  onClick={() => navigate(`/work-orders/${trip.work_order_id}`)}
                >
                  {trip.work_order.wo_number}
                </Tag>
              )}
            </Space>
          </div>
        </Space>

        {/* Quick stats row */}
        <Row gutter={24} style={{ marginTop: 20 }}>
          <Col span={8}>
            <div style={{ textAlign: 'center' }}>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, display: 'block' }}>{t('tripHistory.detail.distance')}</Text>
              <Text strong style={{ color: '#fff', fontSize: 20 }}>{distKm > 0 ? `${distKm.toFixed(1)}` : '-'}</Text>
              {distKm > 0 && <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11 }}> {t('tripHistory.detail.kmLabel')}</Text>}
            </div>
          </Col>
          <Col span={8}>
            <div style={{ textAlign: 'center' }}>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, display: 'block' }}>{t('tripHistory.detail.duration')}</Text>
              <Text strong style={{ color: '#fff', fontSize: 20 }}>{durationMin > 0 ? formatDuration(durationMin * 60) : '-'}</Text>
            </div>
          </Col>
          <Col span={8}>
            <div style={{ textAlign: 'center' }}>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, display: 'block' }}>{t('tripHistory.detail.avgSpeed')}</Text>
              <Text strong style={{ color: '#fff', fontSize: 20 }}>
                {distKm > 0 && durationMin > 0
                  ? `${(distKm / (durationMin / 60)).toFixed(0)}`
                  : '-'}
              </Text>
              {distKm > 0 && durationMin > 0 && <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11 }}> {t('tripHistory.detail.kmhLabel')}</Text>}
            </div>
          </Col>
        </Row>
      </div>

      {/* Body */}
      <div style={{ padding: '20px 24px' }}>
        {/* Trip details */}
        <Descriptions
          column={2}
          size="small"
          style={{ marginBottom: 20 }}
          labelStyle={{ fontWeight: 500, color: '#666' }}
        >
          <Descriptions.Item label={<><CalendarOutlined /> {t('tripHistory.detail.start')}</>}>
            {formatDateTime(trip.start_time)}
          </Descriptions.Item>
          <Descriptions.Item label={<><CalendarOutlined /> {t('tripHistory.detail.end')}</>}>
            {trip.end_time ? formatDateTime(trip.end_time) : <Tag color="processing">{t('tripHistory.status.inTransit')}</Tag>}
          </Descriptions.Item>
          {trip.work_order && (
            <Descriptions.Item label={t('tripHistory.table.workOrder')} span={2}>
              <Button
                type="link"
                size="small"
                onClick={() => navigate(`/work-orders/${trip.work_order_id}`)}
                style={{ padding: 0, height: 'auto' }}
              >
                {trip.work_order.wo_number} — {trip.work_order.summary}
              </Button>
            </Descriptions.Item>
          )}
        </Descriptions>

        <Divider style={{ margin: '16px 0' }} />

        {/* Timeline */}
        <Text strong style={{ fontSize: 14, display: 'block', marginBottom: 16 }}>{t('tripHistory.detail.tripTimeline')}</Text>
        <Timeline
          items={[
            {
              color: '#16a34a',
              children: (
                <div>
                  <Text strong style={{ fontSize: 13 }}>{t('tripHistory.detail.tripStarted')}</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>{formatDateTime(trip.start_time)}</Text>
                  {trip.start_lat != null && Number(trip.start_lat) !== 0 && (
                    <>
                      <br />
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        <EnvironmentOutlined /> {Number(trip.start_lat).toFixed(5)}, {Number(trip.start_lng).toFixed(5)}
                      </Text>
                    </>
                  )}
                </div>
              ),
            },
            ...(trip.end_time
              ? [{
                  color: '#1677ff',
                  children: (
                    <div>
                      <Text strong style={{ fontSize: 13 }}>{t('tripHistory.detail.arrivedAtDestination')}</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 12 }}>{formatDateTime(trip.end_time)}</Text>
                      {trip.end_lat != null && Number(trip.end_lat) !== 0 && (
                        <>
                          <br />
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            <EnvironmentOutlined /> {Number(trip.end_lat).toFixed(5)}, {Number(trip.end_lng).toFixed(5)}
                          </Text>
                        </>
                      )}
                    </div>
                  ),
                }]
              : [{
                  color: 'blue' as const,
                  children: (
                    <div>
                      <Text strong style={{ fontSize: 13 }}>{t('tripHistory.status.inTransit')}</Text>
                      <br />
                      <Tag color="processing" style={{ borderRadius: 10 }}>{t('tripHistory.detail.active')}</Tag>
                    </div>
                  ),
                }]),
          ]}
        />

        <Divider style={{ margin: '16px 0' }} />

        {/* Map */}
        <Text strong style={{ fontSize: 14, display: 'block', marginBottom: 12 }}>{t('tripHistory.detail.routeMap')}</Text>
        <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid #f0f0f0' }}>
          <ServiceLocationMap
            serviceLat={trip.end_lat != null ? Number(trip.end_lat) : null}
            serviceLng={trip.end_lng != null ? Number(trip.end_lng) : null}
            serviceAddress={trip.work_order ? t('tripHistory.detail.destinationWO', { woNumber: trip.work_order.wo_number }) : undefined}
            originLat={trip.start_lat != null ? Number(trip.start_lat) : null}
            originLng={trip.start_lng != null ? Number(trip.start_lng) : null}
            originLabel={t('tripHistory.detail.tripStartLabel')}
          />
        </div>
      </div>
    </div>
  );
}