import { useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Form, Input, Button, Card, Space, Row, Col, Spin, Select, DatePicker, Switch, Alert } from 'antd';
import { SaveOutlined, CloseOutlined, CalendarOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import PageHeader from '@/components/common/PageHeader';
import { useAppointment, useCreateAppointment, useUpdateAppointment } from '@/hooks/use-appointments';
import { useWorkOrders, useWorkOrder } from '@/hooks/use-work-orders';
import { useAgents } from '@/hooks/use-users';
import type { CreateAppointmentPayload, UpdateAppointmentPayload } from '@/api/appointments.api';

const { TextArea } = Input;

export default function AppointmentFormPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [form] = Form.useForm();
  const isEdit = !!id;

  // Pre-fill from WO when navigating from WO approval
  const fromWorkOrderId = searchParams.get('work_order_id') || '';
  const isFromWOApproval = !!fromWorkOrderId && !isEdit;
  const { data: fromWorkOrder } = useWorkOrder(fromWorkOrderId);

  const { data: appointment, isLoading } = useAppointment(id || '');
  const createAppointment = useCreateAppointment();
  const updateAppointment = useUpdateAppointment();
  const { data: workOrdersData } = useWorkOrders({ take: 100 });
  const { data: agents = [] } = useAgents();

  const workOrders = workOrdersData?.data || [];

  // Pre-fill from linked WO when coming from WO approval flow
  useEffect(() => {
    if (isFromWOApproval && fromWorkOrder) {
      form.setFieldsValue({
        work_order_id: fromWorkOrder.id,
        scheduled_start: fromWorkOrder.scheduled_start ? dayjs(fromWorkOrder.scheduled_start) : null,
      });
    }
  }, [isFromWOApproval, fromWorkOrder, form]);

  useEffect(() => {
    if (appointment && isEdit) {
      form.setFieldsValue({
        work_order_id: appointment.work_order_id,
        agent_id: appointment.agent_id,
        crew_id: appointment.crew_id,
        scheduled_start: appointment.scheduled_start ? dayjs(appointment.scheduled_start) : null,
        scheduled_end: appointment.scheduled_end ? dayjs(appointment.scheduled_end) : null,
        notes: appointment.notes,
        is_recurring: appointment.is_recurring,
        recurrence_rule: appointment.recurrence_rule,
      });
    }
  }, [appointment, isEdit, form]);

  const handleSubmit = async (values: any) => {
    try {
      const formattedValues = {
        ...values,
        scheduled_start: values.scheduled_start ? values.scheduled_start.toISOString() : null,
        scheduled_end: values.scheduled_end ? values.scheduled_end.toISOString() : null,
      };

      if (isEdit) {
        const payload: UpdateAppointmentPayload = formattedValues;
        await updateAppointment.mutateAsync({ id: id!, ...payload });
      } else {
        const payload: CreateAppointmentPayload = formattedValues;
        await createAppointment.mutateAsync(payload);
      }
      navigate('/scheduling');
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  if (isLoading && isEdit) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={isEdit ? t('appointmentForm.editTitle') : isFromWOApproval ? t('appointmentForm.scheduleTitle') : t('appointmentForm.addTitle')}
        subtitle={
          isEdit
            ? t('appointmentForm.editSubtitle', { wo: appointment?.work_order?.wo_number || t('appointmentForm.workOrder') })
            : isFromWOApproval && fromWorkOrder
            ? t('appointmentForm.scheduleSubtitle', { id: fromWorkOrder.wo_number || fromWorkOrder.id })
            : t('appointmentForm.createSubtitle')
        }
        onBack={() => navigate(isFromWOApproval ? `/work-orders/${fromWorkOrderId}` : '/scheduling')}
      />

      {isFromWOApproval && fromWorkOrder && (
        <Alert
          icon={<CalendarOutlined />}
          type="success"
          showIcon
          message={t('appointmentForm.woApproved')}
          description={t('appointmentForm.woApprovedDesc', { id: fromWorkOrder.wo_number || fromWorkOrder.id })}
          style={{ marginBottom: 24 }}
        />
      )}

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          is_recurring: false,
        }}
      >
        <Row gutter={24}>
          <Col xs={24} lg={16}>
            <Card title={t('appointmentForm.details')} style={{ marginBottom: 24 }}>
              <Form.Item
                name="work_order_id"
                label={t('appointmentForm.workOrder')}
                rules={[{ required: true, message: t('appointmentForm.workOrderRequired') }]}
              >
                <Select
                  placeholder={t('appointmentForm.selectWorkOrder')}
                  showSearch
                  optionFilterProp="children"
                  disabled={isEdit || isFromWOApproval}
                >
                  {workOrders.map((wo) => (
                    <Select.Option key={wo.id} value={wo.id}>
                      {wo.wo_number} - {wo.summary}
                    </Select.Option>
                  ))}
                  {isFromWOApproval && fromWorkOrder && !workOrders.find((wo) => wo.id === fromWorkOrder.id) && (
                    <Select.Option key={fromWorkOrder.id} value={fromWorkOrder.id}>
                      {fromWorkOrder.wo_number} - {fromWorkOrder.summary}
                    </Select.Option>
                  )}
                </Select>
              </Form.Item>

              <Form.Item
                name="agent_id"
                label={t('appointmentForm.agent')}
                rules={[{ required: true, message: t('appointmentForm.agentRequired') }]}
              >
                <Select
                  placeholder={t('appointmentForm.selectAgent')}
                  showSearch
                  optionFilterProp="children"
                >
                  {agents.map((user) => (
                    <Select.Option key={user.id} value={user.id}>
                      {user.first_name} {user.last_name} {user.email && `(${user.email})`}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                name="crew_id"
                label={t('appointmentForm.crewId')}
              >
                <Input placeholder={t('appointmentForm.enterCrewId')} />
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="scheduled_start"
                    label={t('appointmentForm.scheduledStart')}
                    rules={[{ required: true, message: t('appointmentForm.startRequired') }]}
                  >
                    <DatePicker
                      showTime
                      style={{ width: '100%' }}
                      format="YYYY-MM-DD HH:mm"
                      placeholder={t('appointmentForm.selectStartDate')}
                      disabled={isFromWOApproval}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="scheduled_end"
                    label={t('appointmentForm.scheduledEnd')}
                    rules={[{ required: true, message: t('appointmentForm.endRequired') }]}
                  >
                    <DatePicker
                      showTime
                      style={{ width: '100%' }}
                      format="YYYY-MM-DD HH:mm"
                      placeholder={t('appointmentForm.selectEndDate')}
                      disabled={isFromWOApproval}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="notes"
                label={t('appointmentForm.notes')}
              >
                <TextArea
                  rows={4}
                  placeholder={t('appointmentForm.enterNotes')}
                />
              </Form.Item>
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Card title={t('appointmentForm.recurrenceSettings')} style={{ marginBottom: 24 }}>
              <Form.Item
                name="is_recurring"
                label={t('appointmentForm.recurringAppointment')}
                valuePropName="checked"
              >
                <Switch checkedChildren={t('appointmentForm.yes')} unCheckedChildren={t('appointmentForm.no')} />
              </Form.Item>

              <Form.Item
                noStyle
                shouldUpdate={(prevValues, currentValues) =>
                  prevValues.is_recurring !== currentValues.is_recurring
                }
              >
                {({ getFieldValue }) =>
                  getFieldValue('is_recurring') ? (
                    <Form.Item
                      name="recurrence_rule"
                      label={t('appointmentForm.recurrenceRule')}
                      tooltip={t('appointmentForm.recurrenceTooltip')}
                    >
                      <TextArea
                        rows={3}
                        placeholder="FREQ=WEEKLY;BYDAY=MO,WE,FR"
                      />
                    </Form.Item>
                  ) : null
                }
              </Form.Item>

              <div style={{ marginTop: 24, padding: 16, background: '#f5f5f5', borderRadius: 4 }}>
                <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
                  {t('appointmentForm.recurrenceExamples')}
                </div>
                <div style={{ fontSize: 11, color: '#999' }}>
                  <div>• {t('appointmentForm.daily')}</div>
                  <div>• {t('appointmentForm.everyWeekday')}</div>
                  <div>• {t('appointmentForm.monthly')}</div>
                  <div>• {t('appointmentForm.everyTwoWeeks')}</div>
                </div>
              </div>
            </Card>
          </Col>
        </Row>

        <Card>
          <Space>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={createAppointment.isPending || updateAppointment.isPending}
            >
              {isEdit ? t('appointmentForm.updateAppointment') : t('appointmentForm.createAppointment')}
            </Button>
            <Button
              onClick={() => navigate('/scheduling')}
              icon={<CloseOutlined />}
            >
              {t('appointmentForm.cancel')}
            </Button>
          </Space>
        </Card>
      </Form>
    </div>
  );
}