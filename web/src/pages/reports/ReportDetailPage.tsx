import { useState, useMemo } from 'react';
import {
  Card,
  DatePicker,
  Button,
  Space,
  Typography,
  Row,
  Col,
  Spin,
  Tag,
  Table,
  Empty,
  Segmented,
} from 'antd';
import {
  FileExcelOutlined,
  DownloadOutlined,
  FileTextOutlined,
  DollarOutlined,
  BarChartOutlined,
  CustomerServiceOutlined,
  CreditCardOutlined,
  ArrowLeftOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import dayjs, { Dayjs } from 'dayjs';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useTranslation } from 'react-i18next';
import {
  useWorkOrderReport,
  useInvoiceReport,
  usePerformanceReport,
  useServiceRequestReport,
  usePaymentReport,
} from '@/hooks/use-reports';
import { exportToCSV, exportToExcel } from '@/utils/export.utils';
import { useNotificationStore } from '@/store/notification.store';

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

const COLORS = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2', '#eb2f96', '#fa8c16'];

const STATUS_COLORS: Record<string, string> = {
  new: '#1890ff',
  triaged: '#2f54eb',
  estimated: '#13c2c2',
  approved: '#722ed1',
  scheduled: '#2f54eb',
  in_progress: '#faad14',
  on_hold: '#fa541c',
  completed: '#52c41a',
  closed: '#8c8c8c',
  cancelled: '#f5222d',
  converted_to_wo: '#52c41a',
  spam: '#595959',
  draft: '#8c8c8c',
  sent: '#1890ff',
  viewed: '#13c2c2',
  partially_paid: '#faad14',
  paid: '#52c41a',
  overdue: '#f5222d',
  void: '#595959',
  pending: '#faad14',
  failed: '#f5222d',
  refunded: '#fa8c16',
};

function formatStatus(s: string) {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

const REPORT_TABS = [
  { value: 'work-orders', key: 'workOrders', icon: <FileTextOutlined /> },
  { value: 'service-requests', key: 'serviceRequests', icon: <CustomerServiceOutlined /> },
  { value: 'invoices', key: 'invoices', icon: <DollarOutlined /> },
  { value: 'payments', key: 'payments', icon: <CreditCardOutlined /> },
  { value: 'performance', key: 'performance', icon: <BarChartOutlined /> },
];

// Reusable stat card
function StatCard({ label, value, color, prefix, suffix, precision }: {
  label: string;
  value: number | string;
  color?: string;
  prefix?: string;
  suffix?: string;
  precision?: number;
}) {
  const displayValue = typeof value === 'number' && precision !== undefined
    ? `${prefix || ''}${value.toFixed(precision)}${suffix || ''}`
    : `${prefix || ''}${value}${suffix || ''}`;

  return (
    <div style={{
      background: '#fff',
      borderRadius: 10,
      padding: '18px 20px',
      border: '1px solid #f0f0f0',
      height: '100%',
    }}>
      <Text type="secondary" style={{ fontSize: 13 }}>{label}</Text>
      <div style={{
        fontSize: 24,
        fontWeight: 700,
        marginTop: 6,
        color: color || '#262626',
        lineHeight: 1.2,
      }}>
        {displayValue}
      </div>
    </div>
  );
}

export default function ReportDetailPage() {
  const { reportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const addNotification = useNotificationStore((s) => s.add);

  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().subtract(30, 'days'),
    dayjs(),
  ]);

  const params = {
    start_date: dateRange[0].format('YYYY-MM-DD'),
    end_date: dateRange[1].format('YYYY-MM-DD'),
  };

  const woQuery = useWorkOrderReport(params, reportId === 'work-orders');
  const invQuery = useInvoiceReport(params, reportId === 'invoices');
  const perfQuery = usePerformanceReport(params, reportId === 'performance');
  const srQuery = useServiceRequestReport(params, reportId === 'service-requests');
  const payQuery = usePaymentReport(params, reportId === 'payments');

  const getActiveQuery = () => {
    switch (reportId) {
      case 'work-orders': return woQuery;
      case 'invoices': return invQuery;
      case 'performance': return perfQuery;
      case 'service-requests': return srQuery;
      case 'payments': return payQuery;
      default: return woQuery;
    }
  };

  const { data, isLoading } = getActiveQuery();

  const handleExport = (format: 'csv' | 'excel') => {
    if (!data) return;
    const exportData = buildExportData();
    const filename = `Report_${(reportId || 'report').replace(/-/g, '_')}_${dayjs().format('YYYY-MM-DD')}`;
    if (format === 'csv') {
      exportToCSV(exportData, filename);
    } else {
      exportToExcel(exportData, filename);
    }
    addNotification({ type: 'success', message: t('reports.exportSuccess', { format: format.toUpperCase() }) });
  };

  const buildExportData = (): Record<string, unknown>[] => {
    if (!data) return [];
    const d = data as Record<string, unknown>;
    switch (reportId) {
      case 'work-orders':
      case 'service-requests': {
        const byStatus = (d.by_status || {}) as Record<string, number>;
        return Object.entries(byStatus).map(([status, count]) => ({
          [t('reports.export.status')]: t(`reports.statuses.${status}`, { defaultValue: formatStatus(status) }),
          [t('reports.export.count')]: count,
        }));
      }
      case 'invoices': {
        const byStatus = (d.by_status || {}) as Record<string, number>;
        return Object.entries(byStatus).map(([status, count]) => ({
          [t('reports.export.status')]: t(`reports.statuses.${status}`, { defaultValue: formatStatus(status) }),
          [t('reports.export.count')]: count,
          [t('reports.export.totalRevenue')]: d.total_revenue,
        }));
      }
      case 'payments': {
        const byMethod = (d.by_method || {}) as Record<string, { count: number; amount: number }>;
        return Object.entries(byMethod).map(([method, info]) => ({
          [t('reports.export.method')]: t(`reports.paymentMethods.${method}`, { defaultValue: formatStatus(method) }),
          [t('reports.export.count')]: info.count,
          [t('reports.export.amount')]: info.amount,
        }));
      }
      case 'performance': {
        const top = (d.top_performers || []) as { user_id: string | null; appointments: number }[];
        return top.map((p) => ({
          [t('reports.export.userId')]: p.user_id || t('reports.unassigned'),
          [t('reports.export.appointments')]: p.appointments,
        }));
      }
      default:
        return [];
    }
  };

  return (
    <div>
      {/* Back + Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/reports')} />
        <Title level={3} style={{ margin: 0 }}>{t('reports.title')}</Title>
      </div>

      {/* Navigation tabs */}
      <Segmented
        value={reportId || 'work-orders'}
        onChange={(val) => navigate(`/reports/${val}`, { replace: true })}
        options={REPORT_TABS.map((tab) => ({
          value: tab.value,
          label: (
            <Space size={6}>
              {tab.icon}
              <span>{t(`reports.tabs.${tab.key}`)}</span>
            </Space>
          ),
        }))}
        block
        style={{ marginBottom: 20 }}
      />

      {/* Filter + Export bar */}
      <Card size="small" style={{ marginBottom: 20, borderRadius: 10 }} styles={{ body: { padding: '12px 16px' } }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <Space>
            <CalendarOutlined style={{ color: '#8c8c8c' }} />
            <RangePicker
              value={dateRange}
              onChange={(dates) => dates && setDateRange(dates as [Dayjs, Dayjs])}
              presets={[
                { label: t('reports.presets.last7Days'), value: [dayjs().subtract(7, 'days'), dayjs()] },
                { label: t('reports.presets.last30Days'), value: [dayjs().subtract(30, 'days'), dayjs()] },
                { label: t('reports.presets.last90Days'), value: [dayjs().subtract(90, 'days'), dayjs()] },
                { label: t('reports.presets.thisYear'), value: [dayjs().startOf('year'), dayjs()] },
              ]}
              size="middle"
            />
          </Space>
          <Space>
            <Button size="middle" icon={<DownloadOutlined />} onClick={() => handleExport('csv')}>{t('reports.exportCsv')}</Button>
            <Button size="middle" icon={<FileExcelOutlined />} onClick={() => handleExport('excel')}>{t('reports.exportExcel')}</Button>
          </Space>
        </div>
      </Card>

      {/* Content */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 80 }}>
          <Spin size="large" />
        </div>
      ) : !data ? (
        <Empty description={t('reports.noData')} />
      ) : (
        <ReportContent reportId={reportId || 'work-orders'} data={data as Record<string, unknown>} />
      )}
    </div>
  );
}

function ReportContent({ reportId, data }: { reportId: string; data: Record<string, unknown> }) {
  const { t } = useTranslation();
  switch (reportId) {
    case 'work-orders':
      return <WorkOrderReportContent data={data} />;
    case 'service-requests':
      return <ServiceRequestReportContent data={data} />;
    case 'invoices':
      return <InvoiceReportContent data={data} />;
    case 'payments':
      return <PaymentReportContent data={data} />;
    case 'performance':
      return <PerformanceReportContent data={data} />;
    default:
      return <Empty description={t('reports.unknownType')} />;
  }
}

function WorkOrderReportContent({ data }: { data: Record<string, unknown> }) {
  const { t } = useTranslation();
  const byStatus = (data.by_status || {}) as Record<string, number>;
  const byPriority = (data.by_priority || {}) as Record<string, number>;

  const statusChartData = useMemo(
    () => Object.entries(byStatus).map(([statusKey, value]) => ({
      key: statusKey,
      name: t(`reports.statuses.${statusKey}`, { defaultValue: formatStatus(statusKey) }),
      value,
    })),
    [byStatus, t],
  );
  const priorityChartData = useMemo(
    () => Object.entries(byPriority).map(([priorityKey, value]) => ({
      key: priorityKey,
      name: t(`reports.priorities.${priorityKey}`, { defaultValue: formatStatus(priorityKey) }),
      value,
    })),
    [byPriority, t],
  );

  return (
    <>
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={8}>
          <StatCard label={t('reports.workOrders.total')} value={data.total_work_orders as number} />
        </Col>
        <Col xs={24} sm={8}>
          <StatCard label={t('reports.workOrders.completed')} value={byStatus.completed || 0} color="#52c41a" />
        </Col>
        <Col xs={24} sm={8}>
          <StatCard label={t('reports.workOrders.avgCompletionTime')} value={`${data.average_completion_time_hours ?? 0}h`} color="#1890ff" />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} lg={12}>
          <Card title={t('reports.workOrders.byStatus')} style={{ borderRadius: 10 }}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statusChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" name={t('reports.count')} radius={[4, 4, 0, 0]}>
                  {statusChartData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title={t('reports.workOrders.byPriority')} style={{ borderRadius: 10 }}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={priorityChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, value }) => `${name}: ${value}`}>
                  {priorityChartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      <Card title={t('reports.statusBreakdown')} style={{ borderRadius: 10 }}>
        <Table dataSource={statusChartData} rowKey="key" pagination={false} size="middle" columns={[
          { title: t('reports.columns.status'), dataIndex: 'name', render: (_, record) => <Tag color={STATUS_COLORS[record.key] || 'default'}>{record.name}</Tag> },
          { title: t('reports.columns.count'), dataIndex: 'value', sorter: (a, b) => a.value - b.value },
          { title: t('reports.columns.percentage'), render: (_, record) => `${(((record.value) / ((data.total_work_orders as number) || 1)) * 100).toFixed(1)}%` },
        ]} />
      </Card>
    </>
  );
}

function ServiceRequestReportContent({ data }: { data: Record<string, unknown> }) {
  const { t } = useTranslation();
  const byStatus = (data.by_status || {}) as Record<string, number>;
  const byPriority = (data.by_priority || {}) as Record<string, number>;

  const statusChartData = useMemo(
    () => Object.entries(byStatus).map(([statusKey, value]) => ({
      key: statusKey,
      name: t(`reports.statuses.${statusKey}`, { defaultValue: formatStatus(statusKey) }),
      value,
    })),
    [byStatus, t],
  );
  const priorityChartData = useMemo(
    () => Object.entries(byPriority).map(([priorityKey, value]) => ({
      key: priorityKey,
      name: t(`reports.priorities.${priorityKey}`, { defaultValue: formatStatus(priorityKey) }),
      value,
    })),
    [byPriority, t],
  );

  return (
    <>
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={6}><StatCard label={t('reports.serviceRequests.total')} value={data.total_requests as number} /></Col>
        <Col xs={24} sm={6}><StatCard label={t('reports.serviceRequests.new')} value={byStatus.new || 0} color="#1890ff" /></Col>
        <Col xs={24} sm={6}><StatCard label={t('reports.serviceRequests.convertedToWo')} value={byStatus.converted_to_wo || 0} color="#52c41a" /></Col>
        <Col xs={24} sm={6}><StatCard label={t('reports.serviceRequests.conversionRate')} value={`${data.conversion_rate ?? 0}%`} color={(data.conversion_rate as number) >= 50 ? '#52c41a' : '#faad14'} /></Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} lg={12}>
          <Card title={t('reports.serviceRequests.byStatus')} style={{ borderRadius: 10 }}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statusChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" name={t('reports.count')} radius={[4, 4, 0, 0]}>
                  {statusChartData.map((entry, i) => <Cell key={i} fill={STATUS_COLORS[entry.key] || COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title={t('reports.serviceRequests.byPriority')} style={{ borderRadius: 10 }}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={priorityChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, value }) => `${name}: ${value}`}>
                  {priorityChartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      <Card title={t('reports.statusBreakdown')} style={{ borderRadius: 10 }}>
        <Table dataSource={statusChartData} rowKey="key" pagination={false} size="middle" columns={[
          { title: t('reports.columns.status'), dataIndex: 'name', render: (_, record) => <Tag color={STATUS_COLORS[record.key] || 'default'}>{record.name}</Tag> },
          { title: t('reports.columns.count'), dataIndex: 'value', sorter: (a, b) => a.value - b.value },
          { title: t('reports.columns.percentage'), render: (_, record) => `${(((record.value) / ((data.total_requests as number) || 1)) * 100).toFixed(1)}%` },
        ]} />
      </Card>
    </>
  );
}

function InvoiceReportContent({ data }: { data: Record<string, unknown> }) {
  const { t } = useTranslation();
  const byStatus = (data.by_status || {}) as Record<string, number>;
  const chartData = useMemo(
    () => Object.entries(byStatus).map(([statusKey, value]) => ({
      key: statusKey,
      name: t(`reports.statuses.${statusKey}`, { defaultValue: formatStatus(statusKey) }),
      value,
    })),
    [byStatus, t],
  );

  return (
    <>
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={6}><StatCard label={t('reports.invoices.total')} value={data.total_invoices as number} /></Col>
        <Col xs={24} sm={6}><StatCard label={t('reports.invoices.totalRevenue')} value={data.total_revenue as number} color="#52c41a" prefix="$" precision={2} /></Col>
        <Col xs={24} sm={6}><StatCard label={t('reports.invoices.avgInvoice')} value={data.average_invoice_amount as number} prefix="$" precision={2} /></Col>
        <Col xs={24} sm={6}><StatCard label={t('reports.invoices.collectionRate')} value={`${data.collection_rate ?? 0}%`} color={(data.collection_rate as number) >= 80 ? '#52c41a' : '#faad14'} /></Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} lg={12}>
          <Card title={t('reports.invoices.byStatus')} style={{ borderRadius: 10 }}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" name={t('reports.count')} radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, i) => <Cell key={i} fill={STATUS_COLORS[entry.key] || COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title={t('reports.invoices.distribution')} style={{ borderRadius: 10 }}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, value }) => `${name}: ${value}`}>
                  {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      <Card title={t('reports.statusBreakdown')} style={{ borderRadius: 10 }}>
        <Table dataSource={chartData} rowKey="key" pagination={false} size="middle" columns={[
          { title: t('reports.columns.status'), dataIndex: 'name', render: (_, record) => <Tag color={STATUS_COLORS[record.key] || 'default'}>{record.name}</Tag> },
          { title: t('reports.columns.count'), dataIndex: 'value', sorter: (a, b) => a.value - b.value },
        ]} />
      </Card>
    </>
  );
}

function PaymentReportContent({ data }: { data: Record<string, unknown> }) {
  const { t } = useTranslation();
  const byStatus = (data.by_status || {}) as Record<string, number>;
  const byMethod = (data.by_method || {}) as Record<string, { count: number; amount: number }>;

  const statusChartData = useMemo(
    () => Object.entries(byStatus).map(([statusKey, value]) => ({
      key: statusKey,
      name: t(`reports.statuses.${statusKey}`, { defaultValue: formatStatus(statusKey) }),
      value,
    })),
    [byStatus, t],
  );
  const methodChartData = useMemo(
    () => Object.entries(byMethod).map(([methodKey, info]) => ({
      key: methodKey,
      name: t(`reports.paymentMethods.${methodKey}`, { defaultValue: formatStatus(methodKey) }),
      count: info.count,
      amount: info.amount,
    })),
    [byMethod, t],
  );

  return (
    <>
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={6}><StatCard label={t('reports.payments.total')} value={data.total_payments as number} /></Col>
        <Col xs={24} sm={6}><StatCard label={t('reports.payments.totalCollected')} value={data.total_collected as number} color="#52c41a" prefix="$" precision={2} /></Col>
        <Col xs={24} sm={6}><StatCard label={t('reports.payments.completedAmount')} value={data.completed_amount as number} prefix="$" precision={2} /></Col>
        <Col xs={24} sm={6}><StatCard label={t('reports.payments.successRate')} value={`${data.success_rate ?? 0}%`} color={(data.success_rate as number) >= 80 ? '#52c41a' : '#faad14'} /></Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} lg={12}>
          <Card title={t('reports.payments.byStatus')} style={{ borderRadius: 10 }}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statusChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" name={t('reports.count')} radius={[4, 4, 0, 0]}>
                  {statusChartData.map((entry, i) => <Cell key={i} fill={STATUS_COLORS[entry.key] || COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title={t('reports.payments.byMethod')} style={{ borderRadius: 10 }}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={methodChartData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, value }) => `${name}: ${value}`}>
                  {methodChartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {methodChartData.length > 0 && (
        <Card title={t('reports.payments.methodsCardTitle')} style={{ borderRadius: 10, marginBottom: 16 }}>
          <Table dataSource={methodChartData} rowKey="key" pagination={false} size="middle" columns={[
            { title: t('reports.columns.method'), dataIndex: 'name', render: (name: string) => <Tag color="blue">{name}</Tag> },
            { title: t('reports.columns.count'), dataIndex: 'count', sorter: (a, b) => a.count - b.count },
            { title: t('reports.columns.amount'), dataIndex: 'amount', render: (v: number) => <Text strong>${v.toFixed(2)}</Text>, sorter: (a, b) => a.amount - b.amount },
          ]} />
        </Card>
      )}

      <Card title={t('reports.statusBreakdown')} style={{ borderRadius: 10 }}>
        <Table dataSource={statusChartData} rowKey="key" pagination={false} size="middle" columns={[
          { title: t('reports.columns.status'), dataIndex: 'name', render: (_, record) => <Tag color={STATUS_COLORS[record.key] || 'default'}>{record.name}</Tag> },
          { title: t('reports.columns.count'), dataIndex: 'value', sorter: (a, b) => a.value - b.value },
        ]} />
      </Card>
    </>
  );
}

function PerformanceReportContent({ data }: { data: Record<string, unknown> }) {
  const { t } = useTranslation();
  const topPerformers = (data.top_performers || []) as { user_id: string | null; appointments: number }[];

  const chartData = useMemo(
    () => topPerformers.map((p) => ({
      name: p.user_id ? p.user_id.substring(0, 8) + '...' : t('reports.unassigned'),
      appointments: p.appointments,
      fullId: p.user_id || t('reports.unassigned'),
    })),
    [topPerformers, t],
  );

  const kpis = [
    { label: t('reports.performance.firstTimeFixRate'), value: `${data.first_time_fix_rate ?? 0}%`, color: (data.first_time_fix_rate as number) >= 80 ? '#52c41a' : '#faad14' },
    { label: t('reports.performance.avgResponseTime'), value: `${data.average_response_time_hours ?? 0}h`, color: '#1890ff' },
    { label: t('reports.performance.avgResolutionTime'), value: `${data.average_resolution_time_hours ?? 0}h`, color: '#722ed1' },
    { label: t('reports.performance.technicianUtilization'), value: data.technician_utilization_rate as number, color: '#13c2c2' },
  ];

  return (
    <>
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        {kpis.map((kpi, idx) => (
          <Col xs={24} sm={6} key={idx}>
            <StatCard label={kpi.label} value={kpi.value} color={kpi.color} />
          </Col>
        ))}
      </Row>

      {chartData.length > 0 && (
        <Card title={t('reports.performance.topPerformers')} style={{ borderRadius: 10, marginBottom: 16 }}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" allowDecimals={false} />
              <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="appointments" name={t('reports.performance.appointments')} fill="#722ed1" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      <Card title={t('reports.performance.performerDetails')} style={{ borderRadius: 10 }}>
        {topPerformers.length === 0 ? (
          <Empty description={t('reports.performance.noData')} />
        ) : (
          <Table dataSource={topPerformers} rowKey={(r) => r.user_id || 'unassigned'} pagination={false} size="middle" columns={[
            { title: t('reports.columns.rank'), render: (_, __, idx) => <Tag color={idx === 0 ? 'gold' : idx === 1 ? 'silver' : 'default'}>#{idx + 1}</Tag>, width: 70 },
            { title: t('reports.columns.userId'), dataIndex: 'user_id', render: (v: string | null) => v || <Text type="secondary">{t('reports.unassigned')}</Text>, ellipsis: true },
            { title: t('reports.columns.appointments'), dataIndex: 'appointments', sorter: (a, b) => a.appointments - b.appointments, render: (v: number) => <Text strong>{v}</Text> },
          ]} />
        )}
      </Card>
    </>
  );
}