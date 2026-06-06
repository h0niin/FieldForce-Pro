import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Card, Tag, Select, Space, Row, Col, Empty, Spin, Button, Avatar, Tooltip, Divider } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import {
  PlusOutlined, ClockCircleOutlined, EnvironmentOutlined,
  CheckCircleOutlined, CalendarOutlined, CloseOutlined,
  FileTextOutlined, EyeOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useAllAppointments } from '@/hooks/use-appointments';
import { useAgents } from '@/hooks/use-users';
import type { ServiceAppointment } from '@/types/models.types';
import PageHeader from '@/components/common/PageHeader';
import { PermissionGuard } from '@/components/permissions';

// ─── Status config ──────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { color: string; tagColor: string; label: string }> = {
  scheduled:   { color: '#1d4ed8', tagColor: 'blue',     label: 'Scheduled' },
  in_progress: { color: '#7c3aed', tagColor: 'purple',   label: 'In Progress' },
  completed:   { color: '#16a34a', tagColor: 'green',    label: 'Completed' },
  cancelled:   { color: '#9ca3af', tagColor: 'default',  label: 'Cancelled' },
};

const ACTIVE_STATUSES = ['scheduled', 'in_progress'];
const DONE_STATUSES   = ['completed', 'cancelled'];

type CalendarView = 'month' | 'year';

// ─── Appointment chip inside a calendar cell ────────────────────────────────────
function AppointmentChip({
  appointment,
  onClick,
}: {
  appointment: ServiceAppointment;
  onClick: (e: React.MouseEvent) => void;
}) {
  const { t } = useTranslation();
  const cfg    = STATUS_CONFIG[appointment.status] ?? { color: '#9ca3af', tagColor: 'default', label: '' };
  const woLabel = appointment.work_order?.wo_number ?? appointment.work_order?.summary ?? t('calendar.appt');
  const timeLabel = appointment.scheduled_start
    ? dayjs(appointment.scheduled_start).format('h:mm A')
    : '';
  const isDone = DONE_STATUSES.includes(appointment.status);

  return (
    <Tooltip
      title={
        <div style={{ fontSize: 12 }}>
          <div style={{ fontWeight: 600 }}>{woLabel}</div>
          {timeLabel && <div>🕐 {timeLabel}</div>}
          <div>
            <span
              style={{
                display: 'inline-block',
                width: 8,
                height: 8,
                borderRadius: 2,
                background: cfg.color,
                marginRight: 4,
              }}
            />
            {cfg.label}
          </div>
          <div style={{ opacity: 0.7, marginTop: 4 }}>{t('calendar.clickToView')}</div>
        </div>
      }
    >
      <div
        onClick={onClick}
        style={{
          background: isDone ? `${cfg.color}10` : `${cfg.color}18`,
          borderLeft: `3px solid ${cfg.color}`,
          borderRadius: '0 4px 4px 0',
          padding: '1px 6px',
          fontSize: 11,
          marginBottom: 2,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          cursor: 'pointer',
          lineHeight: '18px',
          color: isDone ? '#9ca3af' : cfg.color,
          fontWeight: 500,
          opacity: isDone ? 0.65 : 1,
          textDecoration: appointment.status === 'cancelled' ? 'line-through' : 'none',
        }}
      >
        {timeLabel && <span style={{ opacity: 0.7, marginRight: 3 }}>{timeLabel}</span>}
        {woLabel}
      </div>
    </Tooltip>
  );
}

// ─── Right-panel appointment card ───────────────────────────────────────────────
function AppointmentCard({
  appointment,
  agentName,
  onViewAppointment,
  onViewWorkOrder,
}: {
  appointment: ServiceAppointment;
  agentName?: string;
  onViewAppointment: () => void;
  onViewWorkOrder: () => void;
}) {
  const { t } = useTranslation();
  const cfg   = STATUS_CONFIG[appointment.status] ?? { color: '#9ca3af', tagColor: 'default', label: appointment.status };
  const start = appointment.scheduled_start ? dayjs(appointment.scheduled_start) : null;
  const end   = appointment.scheduled_end   ? dayjs(appointment.scheduled_end)   : null;
  const address = appointment.work_order?.location?.address;
  const isDone  = DONE_STATUSES.includes(appointment.status);

  return (
    <div
      style={{
        borderLeft: `4px solid ${cfg.color}`,
        borderRadius: '0 10px 10px 0',
        background: isDone ? '#fafafa' : '#fff',
        border: `1px solid ${isDone ? '#f0f0f0' : '#e8edf3'}`,
        
        padding: '10px 14px',
        transition: 'box-shadow 0.15s, transform 0.1s',
        boxShadow: isDone ? 'none' : '0 1px 4px rgba(0,0,0,0.06)',
        marginBottom: 10,
        opacity: isDone ? 0.8 : 1,
      }}
      onMouseEnter={(e) => {
        if (!isDone) {
          (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)';
          (e.currentTarget as HTMLDivElement).style.transform = 'translateX(2px)';
        }
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = isDone ? 'none' : '0 1px 4px rgba(0,0,0,0.06)';
        (e.currentTarget as HTMLDivElement).style.transform = 'translateX(0)';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontWeight: 700, fontSize: 13, color: isDone ? '#9ca3af' : '#111827' }}>
          {appointment.work_order?.wo_number ?? t('calendar.notApplicable')}
        </span>
        <Tag
          color={cfg.tagColor}
          style={{ margin: 0, fontSize: 10, padding: '0 6px', lineHeight: '18px', borderRadius: 10 }}
        >
          {cfg.label}
        </Tag>
      </div>

      {start && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <ClockCircleOutlined style={{ fontSize: 11, color: isDone ? '#d1d5db' : cfg.color }} />
          <span style={{ fontSize: 12, color: isDone ? '#9ca3af' : '#374151' }}>
            {start.format('h:mm A')}
            {end ? ` → ${end.format('h:mm A')}` : ''}
          </span>
        </div>
      )}

      {address && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 4 }}>
          <EnvironmentOutlined style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }} />
          <span
            style={{
              fontSize: 11, color: '#6b7280', flex: 1,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}
          >
            {address}
          </span>
        </div>
      )}

      {agentName && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <Avatar size={16} style={{ background: '#6366f1', fontSize: 9, flexShrink: 0 }}>
            {agentName.charAt(0)}
          </Avatar>
          <span style={{ fontSize: 11, color: '#6b7280' }}>{agentName}</span>
        </div>
      )}

      <Divider style={{ margin: '6px 0' }} />
      <div style={{ display: 'flex', gap: 6 }}>
        <Button
          type="primary"
          size="small"
          icon={<EyeOutlined />}
          onClick={onViewAppointment}
          style={{ flex: 1, fontSize: 11, height: 26 }}
          ghost={isDone}
        >
          {t('calendar.viewAppointment')}
        </Button>
        {appointment.work_order_id && (
          <Tooltip title={t('calendar.openWorkOrder')}>
            <Button
              size="small"
              icon={<FileTextOutlined />}
              onClick={onViewWorkOrder}
              style={{ height: 26, width: 26, padding: 0 }}
            />
          </Tooltip>
        )}
      </div>
    </div>
  );
}

// ─── Agent summary banner ────────────────────────────────────────────────────────
function AgentBanner({
  agentId,
  agents,
  appointments,
  currentMonth,
  onClear,
}: {
  agentId: string;
  agents: { id: string; first_name: string; last_name: string }[];
  appointments: ServiceAppointment[];
  currentMonth: Dayjs;
  onClear: () => void;
}) {
  const { t } = useTranslation();
  const agent = agents.find((a) => a.id === agentId);
  if (!agent) return null;

  const initials     = `${agent.first_name?.[0] ?? ''}${agent.last_name?.[0] ?? ''}`.toUpperCase();
  const monthAppts   = appointments.filter(
    (a) => a.agent_id === agentId && dayjs(a.scheduled_start).isSame(currentMonth, 'month'),
  );
  const activeCount    = monthAppts.filter((a) => ACTIVE_STATUSES.includes(a.status)).length;
  const completedCount = monthAppts.filter((a) => a.status === 'completed').length;

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
        border: '1px solid #bfdbfe',
        borderRadius: 10,
        padding: '12px 16px',
        marginBottom: 12,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
      }}
    >
      <Avatar
        size={44}
        style={{
          background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
          fontSize: 16,
          fontWeight: 700,
          flexShrink: 0,
          boxShadow: '0 2px 8px rgba(37,99,235,0.3)',
        }}
      >
        {initials}
      </Avatar>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: '#1e3a8a' }}>
          {agent.first_name} {agent.last_name}
        </div>
        <div style={{ fontSize: 12, color: '#3b82f6', marginTop: 2, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <span>
            <CalendarOutlined style={{ marginRight: 4 }} />
            {t('calendar.jobsInMonth', { count: monthAppts.length, month: currentMonth.format('MMMM') })}
          </span>
          <span style={{ color: '#f59e0b' }}>● {t('calendar.activeCount', { count: activeCount })}</span>
          <span style={{ color: '#16a34a' }}>
            <CheckCircleOutlined style={{ marginRight: 4 }} />
            {t('calendar.completedCount', { count: completedCount })}
          </span>
        </div>
      </div>
      <Tooltip title={t('calendar.clearAgentFilter')}>
        <Button
          type="text"
          size="small"
          icon={<CloseOutlined />}
          onClick={onClear}
          style={{ color: '#6b7280' }}
        />
      </Tooltip>
    </div>
  );
}

// ─── Main page ──────────────────────────────────────────────────────────────────
export default function CalendarViewPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate]   = useState<Dayjs>(dayjs());
  const [viewMode, setViewMode]           = useState<CalendarView>('month');
  const [selectedAgent, setSelectedAgent] = useState<string | undefined>(undefined);
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>(undefined);

  const { data: appointments = [], isLoading } = useAllAppointments();
  const { data: agents = [] }                  = useAgents();

  const agentMap = Object.fromEntries(agents.map((a) => [a.id, `${a.first_name} ${a.last_name}`]));

  const filteredAppointments = appointments.filter((a) => {
    if (selectedAgent && a.agent_id !== selectedAgent) return false;
    if (selectedStatus && a.status !== selectedStatus) return false;
    return true;
  });

  const getAppointmentsForDate = (date: Dayjs): ServiceAppointment[] =>
    filteredAppointments.filter((a) => dayjs(a.scheduled_start).isSame(date, 'day'));

  const openAppointment = (appt: ServiceAppointment) =>
    navigate(`/scheduling?appointment_id=${appt.id}`);

  const openWorkOrder = (appt: ServiceAppointment) =>
    navigate(`/work-orders/${appt.work_order_id}`);

  const dateCellRender = (value: Dayjs) => {
    const dayAppts = getAppointmentsForDate(value);
    if (dayAppts.length === 0) return null;

    const sorted = [...dayAppts].sort((a, b) => {
      const aD = DONE_STATUSES.includes(a.status) ? 1 : 0;
      const bD = DONE_STATUSES.includes(b.status) ? 1 : 0;
      return aD - bD;
    });

    return (
      <div>
        {sorted.slice(0, 3).map((appt) => (
          <AppointmentChip
            key={appt.id}
            appointment={appt}
            onClick={(e) => { e.stopPropagation(); openAppointment(appt); }}
          />
        ))}
        {sorted.length > 3 && (
          <div style={{ fontSize: 10, color: '#6b7280', paddingLeft: 4 }}>
            +{sorted.length - 3} {t('calendar.more')}
          </div>
        )}
      </div>
    );
  };

  const selectedDayAppointments = getAppointmentsForDate(selectedDate);
  const activeDayAppts = selectedDayAppointments.filter((a) => !DONE_STATUSES.includes(a.status));
  const doneDayAppts   = selectedDayAppointments.filter((a) => DONE_STATUSES.includes(a.status));

  return (
    <div>
      <PageHeader
        title={t('calendar.title')}
        subtitle={t('calendar.subtitle')}
      />

      <Row gutter={16}>
        <Col xs={24} lg={18}>
          {selectedAgent && (
            <AgentBanner
              agentId={selectedAgent}
              agents={agents}
              appointments={appointments}
              currentMonth={selectedDate}
              onClear={() => setSelectedAgent(undefined)}
            />
          )}

          <Card
            title={
              <Space>
                <CalendarOutlined style={{ color: '#2563eb' }} />
                <span style={{ fontWeight: 600 }}>{t('calendar.serviceAppointments')}</span>
                <Select
                  value={viewMode}
                  onChange={setViewMode}
                  size="small"
                  style={{ width: 100 }}
                  options={[
                    { value: 'month', label: t('calendar.month') },
                    { value: 'year', label: t('calendar.year') },
                  ]}
                />
              </Space>
            }
            extra={
              <Space wrap>
                <Select
                  placeholder={t('calendar.allAgents')}
                  allowClear
                  value={selectedAgent}
                  onChange={setSelectedAgent}
                  style={{ width: 200 }}
                  options={agents.map((a) => ({
                    value: a.id,
                    label: `${a.first_name} ${a.last_name}`,
                  }))}
                />
                <Select
                  placeholder={t('calendar.allStatuses')}
                  allowClear
                  value={selectedStatus}
                  onChange={setSelectedStatus}
                  style={{ width: 155 }}
                  options={Object.entries(STATUS_CONFIG).map(([v, c]) => ({
                    value: v,
                    label: c.label,
                  }))}
                />
              </Space>
            }
            styles={{ body: { padding: 0 } }}
          >
            {isLoading ? (
              <div style={{ textAlign: 'center', padding: 60 }}>
                <Spin size="large" />
              </div>
            ) : (
              <Calendar
                value={selectedDate}
                onSelect={setSelectedDate}
                onPanelChange={(date) => setSelectedDate(date)}
                mode={viewMode}
                dateCellRender={viewMode === 'month' ? dateCellRender : undefined}
              />
            )}
          </Card>
        </Col>

        <Col xs={24} lg={6}>
          <Card
            title={
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>
                  {selectedDate.format('dddd')}
                </div>
                <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 400 }}>
                  {selectedDate.format('MMMM D, YYYY')}
                </div>
              </div>
            }
            extra={
              selectedDayAppointments.length > 0 && (
                <span
                  style={{
                    background: '#2563eb',
                    color: '#fff',
                    borderRadius: 12,
                    padding: '1px 10px',
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {selectedDayAppointments.length}
                </span>
              )
            }
            style={{ marginBottom: 14 }}
            styles={{ body: { padding: '10px 12px' } }}
          >
            {selectedDayAppointments.length === 0 ? (
              <Empty
                description={
                  <span style={{ fontSize: 12, color: '#9ca3af' }}>
                    {t('calendar.noAppointments', { context: selectedAgent ? 'agent' : 'all' })}
                  </span>
                }
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                style={{ margin: '20px 0' }}
              />
            ) : (
              <>
                {activeDayAppts.map((appt) => (
                  <AppointmentCard
                    key={appt.id}
                    appointment={appt}
                    agentName={!selectedAgent && appt.agent_id ? agentMap[appt.agent_id] : undefined}
                    onViewAppointment={() => openAppointment(appt)}
                    onViewWorkOrder={() => openWorkOrder(appt)}
                  />
                ))}

                {doneDayAppts.length > 0 && (
                  <>
                    {activeDayAppts.length > 0 && (
                      <Divider style={{ margin: '8px 0' }}>
                        <span style={{ fontSize: 11, color: '#9ca3af' }}>{t('calendar.completedCancelled')}</span>
                      </Divider>
                    )}
                    {doneDayAppts.map((appt) => (
                      <AppointmentCard
                        key={appt.id}
                        appointment={appt}
                        agentName={!selectedAgent && appt.agent_id ? agentMap[appt.agent_id] : undefined}
                        onViewAppointment={() => openAppointment(appt)}
                        onViewWorkOrder={() => openWorkOrder(appt)}
                      />
                    ))}
                  </>
                )}
              </>
            )}
          </Card>

          <Card
            title={<span style={{ fontSize: 13, fontWeight: 600 }}>{t('calendar.statusLegend')}</span>}
            size="small"
            styles={{ body: { padding: '8px 12px' } }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 4px' }}>
              {Object.entries(STATUS_CONFIG).map(([status, cfg]) => (
                <div
                  key={status}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
                  onClick={() => setSelectedStatus(selectedStatus === status ? undefined : status)}
                >
                  <div
                    style={{
                      width: 10, height: 10, borderRadius: 3,
                      background: cfg.color, flexShrink: 0,
                      opacity: !selectedStatus || selectedStatus === status ? 1 : 0.3,
                    }}
                  />
                  <span
                    style={{
                      fontSize: 11,
                      color: !selectedStatus || selectedStatus === status ? '#374151' : '#9ca3af',
                      fontWeight: selectedStatus === status ? 600 : 400,
                    }}
                  >
                    {cfg.label}
                  </span>
                </div>
              ))}
            </div>
            {selectedStatus && (
              <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #f0f0f0', textAlign: 'center' }}>
                <Button
                  type="link"
                  size="small"
                  style={{ fontSize: 11, padding: 0, height: 'auto' }}
                  onClick={() => setSelectedStatus(undefined)}
                >
                  {t('calendar.clearStatusFilter')}
                </Button>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}