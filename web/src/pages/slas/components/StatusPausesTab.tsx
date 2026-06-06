import React, { useState } from 'react';
import { Table, Button, Modal, Form, Select, Typography, Tag } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useSlaPolicies, usePauseTriggers, useCreatePauseTrigger } from '@/hooks/use-slas';

const { Title, Text } = Typography;

export default function StatusPausesTab() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  
  const { data: pauses, isLoading } = usePauseTriggers();
  const { data: policies } = useSlaPolicies();
  const createPauseMutation = useCreatePauseTrigger();

  const handleCreate = async (values: any) => {
    await createPauseMutation.mutateAsync(values);
    setIsModalVisible(false);
    form.resetFields();
  };

  const columns = [
    {
      title: 'SLA Policy',
      dataIndex: 'sla_policy_id',
      key: 'sla_policy_id',
      render: (id: string) => policies?.find((p: any) => p.id === id)?.name || id,
    },
    { 
      title: 'Trigger Status', 
      dataIndex: 'trigger_status', 
      key: 'trigger_status',
      render: (status: string) => <Tag color="processing">{status}</Tag>
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (active: boolean) => (active ? <Tag color="success">Active</Tag> : <Tag color="default">Inactive</Tag>),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>Status Pauses</Title>
          <Text type="secondary">Automatically pause the SLA countdown when tickets enter specific statuses.</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}>
          Add Pause Rule
        </Button>
      </div>

      <Table
        dataSource={pauses}
        columns={columns}
        rowKey="id"
        loading={isLoading}
      />

      <Modal
        title="Add Pause Rule"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={() => form.submit()}
        confirmLoading={createPauseMutation.isPending}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="sla_policy_id" label="SLA Policy" rules={[{ required: true }]}>
            <Select placeholder="Select SLA Policy" allowClear showSearch optionFilterProp="children">
              {policies?.map((p: any) => (
                <Select.Option key={p.id} value={p.id}>{p.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item name="trigger_status" label="Trigger Status" rules={[{ required: true }]}>
            <Select placeholder="Select Status to Pause On">
              <Select.Option value="Waiting on Customer">Waiting on Customer</Select.Option>
              <Select.Option value="Waiting on Parts">Waiting on Parts</Select.Option>
              <Select.Option value="On Hold">On Hold</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
