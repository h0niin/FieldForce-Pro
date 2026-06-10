import { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, Select, Tag, Tooltip, TimePicker } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, EditOutlined, DeleteOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useSetting, useUpsertSetting } from '@/hooks/use-settings';
import { useUsers } from '@/hooks/use-users';
import { showConfirmDialog } from '@/components/common/ConfirmDialog';
import dayjs from 'dayjs';

interface ShiftItem {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  timezone: string;
  user_ids: string[];
}

const TIMEZONES = [
  'UTC',
  'US/Eastern',
  'US/Central',
  'US/Mountain',
  'US/Pacific',
  'Europe/London',
  'Europe/Paris',
  'Asia/Kolkata',
  'Asia/Tokyo',
  'Australia/Sydney',
];

const INITIAL_SHIFTS: ShiftItem[] = [
  {
    id: 'sh-1',
    name: 'Day Shift',
    start_time: '08:00',
    end_time: '17:00',
    timezone: 'US/Eastern',
    user_ids: [],
  },
  {
    id: 'sh-2',
    name: 'Evening Shift',
    start_time: '16:00',
    end_time: '00:00',
    timezone: 'US/Eastern',
    user_ids: [],
  },
];

export default function ShiftsSettingsPage() {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ShiftItem | null>(null);
  const [form] = Form.useForm();

  // Fetch setting key
  const { data: settingData, isLoading } = useSetting('shifts_settings');
  const upsertMutation = useUpsertSetting();

  // Fetch users for dropdown assignment
  const { data: usersData } = useUsers({ take: 100 });
  const users = usersData?.data || [];

  const [shifts, setShifts] = useState<ShiftItem[]>(INITIAL_SHIFTS);

  useEffect(() => {
    if (settingData?.value?.list) {
      setShifts(settingData.value.list as ShiftItem[]);
    }
  }, [settingData]);

  const saveShifts = async (newList: ShiftItem[]) => {
    await upsertMutation.mutateAsync({
      key: 'shifts_settings',
      category: 'workforce',
      value: { list: newList },
    });
    setShifts(newList);
  };

  const handleCreateOrEdit = (record?: ShiftItem) => {
    if (record) {
      setEditingItem(record);
      form.setFieldsValue({
        name: record.name,
        timezone: record.timezone,
        user_ids: record.user_ids,
        times: [dayjs(record.start_time, 'HH:mm'), dayjs(record.end_time, 'HH:mm')],
      });
    } else {
      setEditingItem(null);
      form.resetFields();
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (values: any) => {
    let newList = [...shifts];
    const startTimeStr = values.times[0].format('HH:mm');
    const endTimeStr = values.times[1].format('HH:mm');

    if (editingItem) {
      newList = newList.map((item) =>
        item.id === editingItem.id
          ? {
              ...item,
              name: values.name,
              start_time: startTimeStr,
              end_time: endTimeStr,
              timezone: values.timezone,
              user_ids: values.user_ids || [],
            }
          : item
      );
    } else {
      newList.push({
        id: `sh-${Date.now()}`,
        name: values.name,
        start_time: startTimeStr,
        end_time: endTimeStr,
        timezone: values.timezone,
        user_ids: values.user_ids || [],
      });
    }

    await saveShifts(newList);
    setIsModalOpen(false);
    form.resetFields();
  };

  const handleDelete = (record: ShiftItem) => {
    showConfirmDialog({
      title: t('settings.shifts.deleteTitle', 'Delete Shift'),
      content: t('settings.shifts.deleteConfirm', {
        name: record.name,
      }),
      onOk: async () => {
        const newList = shifts.filter((item) => item.id !== record.id);
        await saveShifts(newList);
      },
      danger: true,
    });
  };

  const getUserNames = (ids: string[]) => {
    return ids
      .map((id) => {
        const u = users.find((user) => user.id === id);
        return u ? `${u.first_name} ${u.last_name}` : null;
      })
      .filter(Boolean) as string[];
  };

  const columns: ColumnsType<ShiftItem> = [
    {
      title: t('settings.shifts.colName', 'Shift Name'),
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => (
        <span style={{ fontWeight: 600, color: 'var(--primary-color)' }}>
          <ClockCircleOutlined style={{ marginRight: 6 }} /> {name}
        </span>
      ),
    },
    {
      title: t('settings.shifts.colHours', 'Working Hours'),
      key: 'hours',
      render: (_, record) => `${record.start_time} - ${record.end_time}`,
    },
    {
      title: t('settings.shifts.colTimezone', 'Timezone'),
      dataIndex: 'timezone',
      key: 'timezone',
      render: (tz) => <Tag color="blue">{tz}</Tag>,
    },
    {
      title: t('settings.shifts.colAssigned', 'Assigned Employees'),
      dataIndex: 'user_ids',
      key: 'user_ids',
      render: (ids: string[]) => {
        const names = getUserNames(ids);
        return names.length > 0 ? (
          names.map((name) => <Tag color="green" key={name}>{name}</Tag>)
        ) : (
          <span style={{ opacity: 0.5 }}>-</span>
        );
      },
    },
    {
      title: t('settings.shifts.colActions', 'Actions'),
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title={t('common.edit', 'Edit')}>
            <Button
              type="text"
              icon={<EditOutlined />}
              size="small"
              onClick={() => handleCreateOrEdit(record)}
            />
          </Tooltip>
          <Tooltip title={t('common.delete', 'Delete')}>
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              size="small"
              onClick={() => handleDelete(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>
            {t('settings.shifts.title', 'Shifts')}
          </h3>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0 0', maxWidth: 650 }}>
            Define standard working hours, recurring schedules, and timezone alignments. Aligning workforce shifts ensures dispatchers can view real-time availability on the calendar and dispatch board.
          </p>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => handleCreateOrEdit()}
        >
          {t('settings.shifts.addBtn', 'Create Shift')}
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={shifts}
        rowKey="id"
        loading={isLoading}
        pagination={false}
      />

      <Modal
        title={
          editingItem
            ? t('settings.shifts.editTitle', 'Edit Shift')
            : t('settings.shifts.createTitle', 'Create Shift')
        }
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        confirmLoading={upsertMutation.isPending}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="name"
            label={t('settings.shifts.formName', 'Shift Name')}
            rules={[{ required: true, message: t('settings.shifts.requiredName', 'Please input the shift name') }]}
          >
            <Input placeholder="Night Shift" />
          </Form.Item>

          <Form.Item
            name="times"
            label={t('settings.shifts.formTimes', 'Shift Working Hours (Start - End)')}
            rules={[{ required: true, message: t('settings.shifts.requiredTimes', 'Please pick shift start/end times') }]}
          >
            <TimePicker.RangePicker format="HH:mm" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="timezone"
            label={t('settings.shifts.formTimezone', 'Timezone')}
            rules={[{ required: true, message: t('settings.shifts.requiredTimezone', 'Please select a timezone') }]}
            initialValue="UTC"
          >
            <Select
              placeholder={t('settings.shifts.selectTimezone', 'Select timezone')}
              options={TIMEZONES.map((tz) => ({ label: tz, value: tz }))}
              showSearch
            />
          </Form.Item>

          <Form.Item
            name="user_ids"
            label={t('settings.shifts.formUsers', 'Assign Active Employees')}
          >
            <Select
              mode="multiple"
              placeholder={t('settings.shifts.selectUsers', 'Select employees')}
              options={users.map((u) => ({
                label: `${u.first_name} ${u.last_name}`,
                value: u.id,
              }))}
              optionFilterProp="label"
              maxTagCount="responsive"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
