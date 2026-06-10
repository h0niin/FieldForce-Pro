import React, { useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, TimePicker, Typography, Tag, Space, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useWorkingCalendars, useCreateWorkingCalendar, useUpdateWorkingCalendar, useDeleteWorkingCalendar } from '@/hooks/use-slas';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

export default function WorkingCalendarsTab() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingCalendar, setEditingCalendar] = useState<any>(null);
  const [form] = Form.useForm();
  const { t } = useTranslation();
  
  const { data: calendars, isLoading } = useWorkingCalendars();
  const createCalendarMutation = useCreateWorkingCalendar();
  const updateCalendarMutation = useUpdateWorkingCalendar();
  const deleteCalendarMutation = useDeleteWorkingCalendar();

  const openCreateModal = () => {
    setEditingCalendar(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const openEditModal = (record: any) => {
    setEditingCalendar(record);
    form.setFieldsValue({
      name: record.name,
      timezone: record.timezone,
      start_time: record.business_hours?.start ? dayjs(record.business_hours.start, 'HH:mm') : null,
      end_time: record.business_hours?.end ? dayjs(record.business_hours.end, 'HH:mm') : null,
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    await deleteCalendarMutation.mutateAsync(id);
  };

  const handleSave = async (values: any) => {
    const payload = {
      name: values.name,
      timezone: values.timezone,
      business_hours: {
        start: values.start_time ? values.start_time.format('HH:mm') : null,
        end: values.end_time ? values.end_time.format('HH:mm') : null,
      },
    };

    if (editingCalendar) {
      await updateCalendarMutation.mutateAsync({ id: editingCalendar.id, payload });
    } else {
      await createCalendarMutation.mutateAsync(payload);
    }
    
    setIsModalVisible(false);
    form.resetFields();
  };

  const columns = [
    { title: t('common.name', 'Name'), dataIndex: 'name', key: 'name' },
    { title: t('sla.timezone', 'Timezone'), dataIndex: 'timezone', key: 'timezone' },
    {
      title: t('sla.businessHours', 'Business Hours'),
      key: 'business_hours',
      render: (_: any, record: any) => {
        if (!record.business_hours) return '-';
        return `${record.business_hours.start || '?'} - ${record.business_hours.end || '?'}`;
      },
    },
    {
      title: t('sla.isDefault', 'Default'),
      dataIndex: 'is_default',
      key: 'is_default',
      render: (isDefault: boolean) => (isDefault ? <Tag color="blue">{t('sla.isDefault', 'Default')}</Tag> : null),
    },
    {
      title: t('common.status', 'Status'),
      dataIndex: 'is_active',
      key: 'is_active',
      render: (active: boolean) => (active ? <Tag color="success">{t('common.active', 'Active')}</Tag> : <Tag color="default">{t('common.inactive', 'Inactive')}</Tag>),
    },
    {
      title: t('sla.actions', 'Actions'),
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          <Button type="text" icon={<EditOutlined />} onClick={() => openEditModal(record)} />
          {!record.is_default && (
            <Popconfirm title={t('sla.deleteConfirm', 'Delete this calendar?')} onConfirm={() => handleDelete(record.id)}>
              <Button type="text" danger icon={<DeleteOutlined />} loading={deleteCalendarMutation.isPending} />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>{t('sla.workingCalendars', 'Working Calendars')}</Title>
          <Text type="secondary">{t('sla.workingCalendarsDesc', 'Define business hours, timezones, and holiday schedules.')}</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
          {t('sla.addCalendar', 'Add Calendar')}
        </Button>
      </div>

      <Table
        dataSource={calendars || []}
        columns={columns}
        rowKey="id"
        loading={isLoading}
      />

      <Modal
        title={editingCalendar ? t('sla.editCalendar', 'Edit Working Calendar') : t('sla.addCalendar', 'Add Working Calendar')}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={() => form.submit()}
        confirmLoading={createCalendarMutation.isPending || updateCalendarMutation.isPending}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item name="name" label={t('common.name', 'Calendar Name')} rules={[{ required: true }]}>
            <Input placeholder={t('sla.calendarNamePlaceholder', 'e.g. Default Business Hours')} />
          </Form.Item>
          
          <Form.Item name="timezone" label={t('sla.timezone', 'Timezone')} rules={[{ required: true }]}>
            <Select placeholder={t('sla.selectTimezone', 'Select Timezone')} showSearch>
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
            <Form.Item name="start_time" label={t('sla.startTime', 'Start Time')} rules={[{ required: true }]} style={{ flex: 1 }}>
              <TimePicker format="HH:mm" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="end_time" label={t('sla.endTime', 'End Time')} rules={[{ required: true }]} style={{ flex: 1 }}>
              <TimePicker format="HH:mm" style={{ width: '100%' }} />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
