import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, Descriptions, Button, Space, Skeleton, Tag } from 'antd';
import { DeleteOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { useTimesheet, useDeleteTimesheet, useApproveTimesheet, useRejectTimesheet } from '@/hooks/use-timesheets';
import PageHeader from '@/components/common/PageHeader';
import { showConfirmDialog } from '@/components/common/ConfirmDialog';
import { PermissionGuard } from '@/components/permissions';
import { formatDateTime } from '@/utils/format-date';

const statusColors: Record<string, string> = {
  pending: 'blue',
  approved: 'green',
  rejected: 'red',
};

function formatStatus(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

export default function TimesheetDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: timesheet, isLoading } = useTimesheet(id!);
  const deleteTimesheet = useDeleteTimesheet();
  const approveTimesheet = useApproveTimesheet();
  const rejectTimesheet = useRejectTimesheet();

  const handleDelete = () => {
    if (!timesheet) return;
    showConfirmDialog({
      title: t('timesheetDetail.deleteTitle'),
      content: t('timesheetDetail.deleteConfirm'),
      onOk: async () => {
        await deleteTimesheet.mutateAsync(timesheet.id);
        navigate('/timesheets');
      },
      danger: true,
    });
  };

  const handleApprove = () => {
    if (!timesheet) return;
    showConfirmDialog({
      title: t('timesheetDetail.approveTitle'),
      content: t('timesheetDetail.approveConfirm'),
      onOk: async () => {
        await approveTimesheet.mutateAsync(timesheet.id);
      },
    });
  };

  const handleReject = () => {
    if (!timesheet) return;
    showConfirmDialog({
      title: t('timesheetDetail.rejectTitle'),
      content: t('timesheetDetail.rejectConfirm'),
      onOk: async () => {
        await rejectTimesheet.mutateAsync(timesheet.id);
      },
      danger: true,
    });
  };

  if (isLoading) {
    return (
      <div>
        <PageHeader title={t('timesheetDetail.title')} />
        <Card><Skeleton active /></Card>
      </div>
    );
  }

  if (!timesheet) {
    return (
      <div>
        <PageHeader title={t('timesheetDetail.notFoundTitle')} />
        <Card>{t('timesheetDetail.notFound')}</Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={t('timesheetDetail.title')}
        onBack={() => navigate('/timesheets')}
        extra={
          <Space>
            {timesheet.status === 'pending' && (
              <>
                <PermissionGuard permission="timesheets:update">
                  <Button
                    icon={<CheckOutlined />}
                    style={{ color: '#52c41a', borderColor: '#52c41a' }}
                    loading={approveTimesheet.isPending}
                    onClick={handleApprove}
                  >
                    {t('timesheetDetail.approve')}
                  </Button>
                </PermissionGuard>
                <PermissionGuard permission="timesheets:update">
                  <Button
                    danger
                    icon={<CloseOutlined />}
                    loading={rejectTimesheet.isPending}
                    onClick={handleReject}
                  >
                    {t('timesheetDetail.reject')}
                  </Button>
                </PermissionGuard>
              </>
            )}
            <PermissionGuard permission="timesheets:delete">
              <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>
                {t('timesheetDetail.delete')}
              </Button>
            </PermissionGuard>
          </Space>
        }
      />

      <Card title={t('timesheetDetail.infoTitle')}>
        <Descriptions column={2} bordered>
          <Descriptions.Item label={t('timesheetDetail.user')}>
            {timesheet.user
              ? `${timesheet.user.first_name} ${timesheet.user.last_name}`
              : timesheet.user_id || <span style={{ opacity: 0.5 }}>-</span>}
          </Descriptions.Item>

          <Descriptions.Item label={t('timesheetDetail.status')}>
            <Tag color={statusColors[timesheet.status] || 'default'}>
              {formatStatus(timesheet.status)}
            </Tag>
          </Descriptions.Item>

          <Descriptions.Item label={t('timesheetDetail.clockIn')}>
            {timesheet.clock_in ? formatDateTime(timesheet.clock_in) : <span style={{ opacity: 0.5 }}>-</span>}
          </Descriptions.Item>

          <Descriptions.Item label={t('timesheetDetail.clockOut')}>
            {timesheet.clock_out ? formatDateTime(timesheet.clock_out) : <span style={{ opacity: 0.5 }}>-</span>}
          </Descriptions.Item>

          <Descriptions.Item label={t('timesheetDetail.travelTime')}>
            {t('timesheetDetail.minutes', { count: timesheet.travel_time_minutes || 0 })}
          </Descriptions.Item>

          <Descriptions.Item label={t('timesheetDetail.workTime')}>
            {t('timesheetDetail.minutes', { count: timesheet.work_time_minutes || 0 })}
          </Descriptions.Item>

          <Descriptions.Item label={t('timesheetDetail.breakTime')}>
            {t('timesheetDetail.minutes', { count: timesheet.break_time_minutes || 0 })}
          </Descriptions.Item>

          <Descriptions.Item label={t('timesheetDetail.billable')}>
            {timesheet.is_billable ? <Tag color="green">{t('timesheetDetail.yes')}</Tag> : <Tag color="default">{t('timesheetDetail.no')}</Tag>}
          </Descriptions.Item>

          <Descriptions.Item label={t('timesheetDetail.appointmentId')}>
            {timesheet.appointment_id || <span style={{ opacity: 0.5 }}>-</span>}
          </Descriptions.Item>

          <Descriptions.Item label={t('timesheetDetail.workOrderId')}>
            {timesheet.work_order_id || <span style={{ opacity: 0.5 }}>-</span>}
          </Descriptions.Item>

          <Descriptions.Item label={t('timesheetDetail.approvedBy')}>
            {timesheet.approved_by || <span style={{ opacity: 0.5 }}>-</span>}
          </Descriptions.Item>

          <Descriptions.Item label={t('timesheetDetail.notes')} span={2}>
            {timesheet.notes || <span style={{ opacity: 0.5 }}>-</span>}
          </Descriptions.Item>

          <Descriptions.Item label={t('timesheetDetail.createdAt')}>
            {formatDateTime(timesheet.created_at)}
          </Descriptions.Item>
          <Descriptions.Item label={t('timesheetDetail.updatedAt')}>
            {formatDateTime(timesheet.updated_at)}
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );
}