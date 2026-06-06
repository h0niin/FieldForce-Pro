import React, { useState } from 'react';
import { Table, Button, Modal, Form, Select, InputNumber, Typography, Tag, Space } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useSlaPolicies, useEscalations, useCreateEscalation } from '@/hooks/use-slas';

const { Title, Text } = Typography;

export default function EscalationsTab() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  
  const { data: escalations, isLoading } = useEscalations();
  const { data: policies } = useSlaPolicies();
  const createEscalationMutation = useCreateEscalation();

  const handleCreate = async (values: any) => {
    await createEscalationMutation.mutateAsync(values);
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
      title: 'Trigger Type', 
      dataIndex: 'trigger_type', 
      key: 'trigger_type',
      render: (type: string) => (
        <Tag color={type === 'warning' ? 'warning' : 'error'}>
          {type?.toUpperCase()}
        </Tag>
      ),
    },
    { 
      title: 'Time Threshold (mins)', 
      dataIndex: 'time_threshold_minutes', 
      key: 'time_threshold_minutes' 
    },
    { 
      title: 'Action', 
      dataIndex: 'action', 
      key: 'action',
      render: (action: string) => {
        const actionMap: Record<string, string> = {
          'notify_technician': 'Notify Technician',
          'notify_manager': 'Notify Manager',
          'reassign': 'Re-assign Request'
        };
        return actionMap[action] || action;
      }
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
          <Title level={4} style={{ margin: 0 }}>Escalations & Alerts</Title>
          <Text type="secondary">Define rules to notify managers or re-assign requests when SLAs are nearing breach.</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}>
          Add Escalation
        </Button>
      </div>

      <Table
        dataSource={escalations}
        columns={columns}
        rowKey="id"
        loading={isLoading}
      />

      <Modal
        title="Add Escalation Rule"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={() => form.submit()}
        confirmLoading={createEscalationMutation.isPending}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="sla_policy_id" label="SLA Policy" rules={[{ required: true }]}>
            <Select placeholder="Select SLA Policy" allowClear showSearch optionFilterProp="children">
              {policies?.map((p: any) => (
                <Select.Option key={p.id} value={p.id}>{p.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          
          <Space style={{ width: '100%' }} size="large">
            <Form.Item name="trigger_type" label="Trigger Type" rules={[{ required: true }]} style={{ width: 220 }}>
              <Select placeholder="Select Type">
                <Select.Option value="warning">Warning (Before Breach)</Select.Option>
                <Select.Option value="breach">Breach (After Breach)</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item name="time_threshold_minutes" label="Time Threshold (Mins)" rules={[{ required: true }]} style={{ width: 220 }}>
              <InputNumber min={0} style={{ width: '100%' }} placeholder="e.g. 15" />
            </Form.Item>
          </Space>

          <Form.Item name="action" label="Action to Take" rules={[{ required: true }]}>
            <Select placeholder="Select Action">
              <Select.Option value="notify_technician">Notify Technician</Select.Option>
              <Select.Option value="notify_manager">Notify Manager</Select.Option>
              <Select.Option value="reassign">Re-assign Request</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
