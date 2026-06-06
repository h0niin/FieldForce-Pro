import React, { useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, TimePicker, Typography, Tag } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useWorkingCalendars, useCreateWorkingCalendar } from '@/hooks/use-slas';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

export default function WorkingCalendarsTab() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  
  const { data: calendars, isLoading } = useWorkingCalendars();
  const createCalendarMutation = useCreateWorkingCalendar();

  const handleCreate = async (values: any) => {
    const payload = {
      name: values.name,
      timezone: values.timezone,
      business_hours: {
        start: values.start_time ? values.start_time.format('HH:mm') : null,
        end: values.end_time ? values.end_time.format('HH:mm') : null,
      },
    };

    await createCalendarMutation.mutateAsync(payload);
    setIsModalVisible(false);
    form.resetFields();
  };

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Timezone', dataIndex: 'timezone', key: 'timezone' },
    {
      title: 'Business Hours',
      key: 'business_hours',
      render: (_: any, record: any) => {
        if (!record.business_hours) return '-';
        return `${record.business_hours.start || '?'} - ${record.business_hours.end || '?'}`;
      },
    },
    {
      title: 'Default',
      dataIndex: 'is_default',
      key: 'is_default',
      render: (isDefault: boolean) => (isDefault ? <Tag color="blue">Default</Tag> : null),
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
          <Title level={4} style={{ margin: 0 }}>Working Calendars</Title>
          <Text type="secondary">Define business hours, timezones, and holiday schedules.</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}>
          Add Calendar
        </Button>
      </div>

      <Table
        dataSource={calendars}
        columns={columns}
        rowKey="id"
        loading={isLoading}
      />

      <Modal
        title="Add Working Calendar"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={() => form.submit()}
        confirmLoading={createCalendarMutation.isPending}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="name" label="Calendar Name" rules={[{ required: true }]}>
            <Input placeholder="e.g. Default Business Hours" />
          </Form.Item>
          
          <Form.Item name="timezone" label="Timezone" rules={[{ required: true }]}>
            <Select placeholder="Select Timezone" showSearch>
              <Select.Option value="UTC">UTC</Select.Option>
              <Select.Option value="America/New_York">Eastern Time (US & Canada)</Select.Option>
              <Select.Option value="America/Chicago">Central Time (US & Canada)</Select.Option>
              <Select.Option value="America/Denver">Mountain Time (US & Canada)</Select.Option>
              <Select.Option value="America/Los_Angeles">Pacific Time (US & Canada)</Select.Option>
              <Select.Option value="Europe/London">London</Select.Option>
              <Select.Option value="Asia/Kolkata">India Standard Time</Select.Option>
            </Select>
          </Form.Item>

          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item name="start_time" label="Start Time" rules={[{ required: true }]} style={{ flex: 1 }}>
              <TimePicker format="HH:mm" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="end_time" label="End Time" rules={[{ required: true }]} style={{ flex: 1 }}>
              <TimePicker format="HH:mm" style={{ width: '100%' }} />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
