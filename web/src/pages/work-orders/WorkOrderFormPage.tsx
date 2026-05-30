import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Form, Input, Button, Space, Skeleton, Select, DatePicker, Row, Col } from 'antd';
import dayjs from 'dayjs';
import { useWorkOrder, useCreateWorkOrder, useUpdateWorkOrder } from '@/hooks/use-work-orders';
import { useAllContacts } from '@/hooks/use-contacts';
import { useAllServiceLocations } from '@/hooks/use-service-locations';
import { useAllAssets } from '@/hooks/use-assets';
import PageHeader from '@/components/common/PageHeader';

const { TextArea } = Input;

export default function WorkOrderFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const isEdit = !!id;

  const { data: workOrder, isLoading } = useWorkOrder(id!);
  const createWorkOrder = useCreateWorkOrder();
  const updateWorkOrder = useUpdateWorkOrder();
  const { data: contacts } = useAllContacts();
  const { data: locations } = useAllServiceLocations();
  const { data: assets } = useAllAssets();

  useEffect(() => {
    if (workOrder) {
      form.setFieldsValue({
        summary: workOrder.summary,
        description: workOrder.description,
        contact_id: workOrder.contact_id,
        location_id: workOrder.location_id,
        asset_id: workOrder.asset_id,
        priority: workOrder.priority,
        category: workOrder.category,
        slaHours: (workOrder as any).slaHours ?? 24,
        scheduled_start: workOrder.scheduled_start ? dayjs(workOrder.scheduled_start) : null,
      });
    }
  }, [workOrder, form]);

  const handleSubmit = async (values: Record<string, unknown>) => {
    const payload = {
      ...values,
      scheduled_start: values.scheduled_start
        ? (values.scheduled_start as dayjs.Dayjs).toISOString()
        : undefined,
    };

    try {
      if (isEdit) {
        await updateWorkOrder.mutateAsync({ id: id!, ...payload });
      } else {
        await createWorkOrder.mutateAsync(payload as Record<string, unknown> & { summary: string });
      }
      navigate('/work-orders');
    } catch {
      // Error handled by mutation hooks
    }
  };

  if (isEdit && isLoading) {
    return (
      <div>
        <PageHeader title="Loading..." />
        <Card><Skeleton active /></Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={isEdit ? 'Edit Work Order' : 'Create Work Order'}
        onBack={() => navigate('/work-orders')}
      />

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
          style={{ maxWidth: 800 }}
          initialValues={{ priority: 'medium', slaHours: 24 }}
        >
          <Form.Item
            name="summary"
            label="Summary"
            rules={[{ required: true, message: 'Please enter a summary' }]}
          >
            <Input placeholder="e.g. HVAC repair at 123 Main St" />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <TextArea rows={4} placeholder="Describe the work to be performed" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="contact_id" label="Customer (Contact)">
                <Select
                  placeholder="Select customer"
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  options={contacts?.map((c) => ({
                    value: c.id,
                    label: `${c.first_name} ${c.last_name}${c.email ? ` (${c.email})` : ''}`,
                  })) || []}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="location_id" label="Service Location">
                <Select
                  placeholder="Select location"
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  options={locations?.map((l) => ({
                    value: l.id,
                    label: l.address,
                  })) || []}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="asset_id" label="Asset">
                <Select
                  placeholder="Select asset"
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  options={assets?.map((a) => ({
                    value: a.id,
                    label: `${a.name}${a.serial_number ? ` (${a.serial_number})` : ''}`,
                  })) || []}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="priority" label="Priority">
                <Select placeholder="Select priority">
                  <Select.Option value="low">Low</Select.Option>
                  <Select.Option value="medium">Medium</Select.Option>
                  <Select.Option value="high">High</Select.Option>
                  <Select.Option value="urgent">Urgent</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="category" label="Category">
                <Select placeholder="Select category" allowClear>
                  <Select.Option value="HVAC">HVAC</Select.Option>
                  <Select.Option value="Plumbing">Plumbing</Select.Option>
                  <Select.Option value="Electrical">Electrical</Select.Option>
                  <Select.Option value="Appliance">Appliance</Select.Option>
                  <Select.Option value="General">General</Select.Option>
                  <Select.Option value="Preventive Maintenance">Preventive Maintenance</Select.Option>
                  <Select.Option value="Emergency">Emergency</Select.Option>
                  <Select.Option value="Other">Other</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="slaHours" label="SLA (Hours)">
                <Select placeholder="Select SLA">
                  <Select.Option value={2}>2</Select.Option>
                  <Select.Option value={4}>4</Select.Option>
                  <Select.Option value={8}>8</Select.Option>
                  <Select.Option value={24}>24 (Default)</Select.Option>
                  <Select.Option value={48}>48</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="scheduled_start"
            label="Scheduled Date"
            tooltip={workOrder?.estimate_id ? "This field is locked because the work order was converted from an estimate" : undefined}
          >
            <DatePicker
              format="YYYY-MM-DD"
              style={{ width: '100%' }}
              disabled={!!workOrder?.estimate_id}
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={createWorkOrder.isPending || updateWorkOrder.isPending}
              >
                {isEdit ? 'Update' : 'Create'}
              </Button>
              <Button onClick={() => navigate('/work-orders')}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
