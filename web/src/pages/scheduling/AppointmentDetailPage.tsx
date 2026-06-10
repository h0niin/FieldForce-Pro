import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Button, Space, Skeleton, Tabs, Tag } from 'antd';
import { EditOutlined, DeleteOutlined, PrinterOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useAppointment, useDeleteAppointment } from '@/hooks/use-appointments';
import PageHeader from '@/components/common/PageHeader';
import { showConfirmDialog } from '@/components/common/ConfirmDialog';
import { PermissionGuard } from '@/components/permissions';
import { formatDateTime } from '@/utils/format-date';

export default function AppointmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data: appointment, isLoading } = useAppointment(id!);
  const deleteAppointment = useDeleteAppointment();

  const handleDelete = () => {
    if (!appointment) return;
    showConfirmDialog({
      title: 'Delete Appointment',
      content: 'Are you sure you want to delete this appointment?',
      onOk: async () => {
        await deleteAppointment.mutateAsync(appointment.id);
        navigate('/scheduling');
      },
      danger: true,
    });
  };

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Appointment Details" />
        <Card><Skeleton active /></Card>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div>
        <PageHeader title="Appointment Not Found" />
        <Card>The appointment you are looking for does not exist.</Card>
      </div>
    );
  }

  const tabItems = [
    {
      key: 'details',
      label: 'Details',
      children: (
        <Card title="Appointment Information">
          <Descriptions column={2} bordered>
            <Descriptions.Item label="Work Order">
              {appointment.work_order?.wo_number || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={appointment.status === 'completed' ? 'success' : appointment.status === 'in_progress' ? 'processing' : 'default'}>
                {appointment.status}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Technician">
              {appointment.agent ? `${appointment.agent.first_name} ${appointment.agent.last_name}` : 'Unassigned'}
            </Descriptions.Item>
            <Descriptions.Item label="Scheduled Start">
              {formatDateTime(appointment.scheduled_start)}
            </Descriptions.Item>
            <Descriptions.Item label="Scheduled End">
              {formatDateTime(appointment.scheduled_end)}
            </Descriptions.Item>
            <Descriptions.Item label="Actual Start">
              {appointment.actual_start ? formatDateTime(appointment.actual_start) : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Actual End">
              {appointment.actual_end ? formatDateTime(appointment.actual_end) : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Notes" span={2}>
              {appointment.notes || '-'}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      )
    },
    {
      key: 'reports',
      label: 'Service Reports',
      children: (
        <Card 
          title="Service Reports"
          extra={
            <Button type="primary" icon={<PrinterOutlined />} onClick={() => navigate(`/service-reports/${appointment.id}/viewer`)}>
              View Service Report
            </Button>
          }
        >
          <p>This appointment has associated service reports that can be viewed and printed.</p>
        </Card>
      )
    }
  ];

  return (
    <div>
      <PageHeader
        title={`Appointment: ${formatDateTime(appointment.scheduled_start)}`}
        onBack={() => navigate('/scheduling')}
        extra={
          <Space>
            <PermissionGuard permission="scheduling:update">
              <Button icon={<EditOutlined />} onClick={() => navigate(`/scheduling/${appointment.id}/edit`)}>Edit</Button>
            </PermissionGuard>
            <PermissionGuard permission="scheduling:delete">
              <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>Delete</Button>
            </PermissionGuard>
          </Space>
        }
      />
      <Tabs defaultActiveKey="details" items={tabItems} />
    </div>
  );
}
