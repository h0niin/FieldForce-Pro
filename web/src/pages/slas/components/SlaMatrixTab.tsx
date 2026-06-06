import React, { useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, InputNumber, Space, Typography, Tag } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useSlaPolicies, useCreateSlaPolicy } from '@/hooks/use-slas';
import { useCategories, useSubCategories, usePriorities } from '@/hooks/use-lookups';
import { useAllServiceLocations } from '@/hooks/use-service-locations';

const { Title, Text } = Typography;

export default function SlaMatrixTab() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  
  const { data: policies, isLoading } = useSlaPolicies();
  const createPolicyMutation = useCreateSlaPolicy();

  // Lookup Hooks
  const { data: categories } = useCategories();
  const { data: subCategories } = useSubCategories();
  const { data: priorities } = usePriorities();
  const { data: locations } = useAllServiceLocations();

  const handleCreate = async (values: any) => {
    // Convert time to minutes based on unit
    let multiplier = 1;
    if (values.time_unit === 'hours') multiplier = 60;
    if (values.time_unit === 'days') multiplier = 1440;
    
    const timeInMinutes = values.time_value * multiplier;

    const payload = {
      name: values.name,
      category_id: values.category_id || null,
      sub_category_id: values.sub_category_id || null,
      priority_id: values.priority_id || null,
      location_id: values.location_id || null,
      time_unit: values.time_unit,
      response_time_minutes: values.sla_type === 'response' ? timeInMinutes : 0,
      resolution_time_minutes: values.sla_type === 'completion' ? timeInMinutes : 0,
    };

    await createPolicyMutation.mutateAsync(payload);
    setIsModalVisible(false);
    form.resetFields();
  };

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    {
      title: 'Category',
      dataIndex: 'category_id',
      key: 'category_id',
      render: (id: string) => categories?.find((c: any) => c.id === id)?.name || '-',
    },
    {
      title: 'Sub-category',
      dataIndex: 'sub_category_id',
      key: 'sub_category_id',
      render: (id: string) => subCategories?.find((sc: any) => sc.id === id)?.name || '-',
    },
    {
      title: 'Priority',
      dataIndex: 'priority_id',
      key: 'priority_id',
      render: (id: string) => priorities?.find((p: any) => p.id === id)?.name || '-',
    },
    {
      title: 'Location',
      dataIndex: 'location_id',
      key: 'location_id',
      render: (id: string) => locations?.find((l: any) => l.id === id)?.address || '-',
    },
    {
      title: 'Response SLA',
      key: 'response_time',
      render: (_: any, record: any) => {
        if (record.response_time_minutes === 0) return '-';
        return <Tag color="blue">{record.response_time_minutes} min</Tag>;
      },
    },
    {
      title: 'Completion SLA',
      key: 'resolution_time',
      render: (_: any, record: any) => {
        if (record.resolution_time_minutes === 0) return '-';
        return <Tag color="green">{record.resolution_time_minutes} min</Tag>;
      },
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
          <Title level={4} style={{ margin: 0 }}>SLA Matrix</Title>
          <Text type="secondary">Configure Response and Completion SLAs based on categories, priorities, and locations.</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}>
          Add Rule
        </Button>
      </div>

      <Table
        dataSource={policies}
        columns={columns}
        rowKey="id"
        loading={isLoading}
      />

      <Modal
        title="Add SLA Rule"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={() => form.submit()}
        confirmLoading={createPolicyMutation.isPending}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="name" label="Rule Name" rules={[{ required: true }]}>
            <Input placeholder="e.g. High Priority Plumbing" />
          </Form.Item>
          
          <Space style={{ width: '100%' }} size="large">
            <Form.Item name="category_id" label="Category" style={{ width: 220 }}>
              <Select placeholder="Select Category" allowClear>
                {categories?.map((c: any) => (
                  <Select.Option key={c.id} value={c.id}>{c.name}</Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item name="sub_category_id" label="Sub-category" style={{ width: 220 }}>
              <Select placeholder="Select Sub-category" allowClear>
                {subCategories?.map((sc: any) => (
                  <Select.Option key={sc.id} value={sc.id}>{sc.name}</Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Space>

          <Space style={{ width: '100%' }} size="large">
            <Form.Item name="priority_id" label="Priority" style={{ width: 220 }}>
              <Select placeholder="Select Priority" allowClear>
                {priorities?.map((p: any) => (
                  <Select.Option key={p.id} value={p.id}>{p.name}</Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item name="location_id" label="Location" style={{ width: 220 }}>
              <Select placeholder="Select Location" allowClear>
                {locations?.map((l: any) => (
                  <Select.Option key={l.id} value={l.id}>{l.address}</Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Space>

          <Space style={{ width: '100%' }} size="large" align="start">
            <Form.Item name="sla_type" label="SLA Type" rules={[{ required: true }]} style={{ width: 140 }}>
              <Select placeholder="Type">
                <Select.Option value="response">Response</Select.Option>
                <Select.Option value="completion">Completion</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item name="time_value" label="Time Value" rules={[{ required: true }]} style={{ width: 140 }}>
              <InputNumber min={1} style={{ width: '100%' }} placeholder="e.g. 4" />
            </Form.Item>

            <Form.Item name="time_unit" label="Time Unit" rules={[{ required: true }]} style={{ width: 140 }}>
              <Select placeholder="Unit">
                <Select.Option value="minutes">Minutes</Select.Option>
                <Select.Option value="hours">Hours</Select.Option>
                <Select.Option value="days">Days</Select.Option>
              </Select>
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </div>
  );
}
