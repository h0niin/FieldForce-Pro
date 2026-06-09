import { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, Select, Tag, Tooltip, DatePicker } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, EditOutlined, DeleteOutlined, CalendarOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useSetting, useUpsertSetting } from '@/hooks/use-settings';
import { showConfirmDialog } from '@/components/common/ConfirmDialog';
import dayjs from 'dayjs';

interface HolidayItem {
  id: string;
  name: string;
  date: string;
  type: string;
  description: string;
}

const INITIAL_HOLIDAYS: HolidayItem[] = [
  {
    id: 'h-1',
    name: "New Year's Day",
    date: '2026-01-01',
    type: 'Public',
    description: 'National public holiday for New Years.',
  },
  {
    id: 'h-2',
    name: 'Company Foundation Day',
    date: '2026-06-15',
    type: 'Company',
    description: 'Annual celebration and paid day off for all staff.',
  },
];

export default function HolidaysSettingsPage() {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<HolidayItem | null>(null);
  const [form] = Form.useForm();

  // Fetch setting key
  const { data: settingData, isLoading } = useSetting('holidays_settings');
  const upsertMutation = useUpsertSetting();

  const [holidays, setHolidays] = useState<HolidayItem[]>(INITIAL_HOLIDAYS);

  useEffect(() => {
    if (settingData?.value?.list) {
      setHolidays(settingData.value.list as HolidayItem[]);
    }
  }, [settingData]);

  const saveHolidays = async (newList: HolidayItem[]) => {
    // Sort chronologically by date
    const sortedList = [...newList].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    await upsertMutation.mutateAsync({
      key: 'holidays_settings',
      category: 'workforce',
      value: { list: sortedList },
    });
    setHolidays(sortedList);
  };

  const handleCreateOrEdit = (record?: HolidayItem) => {
    if (record) {
      setEditingItem(record);
      form.setFieldsValue({
        name: record.name,
        type: record.type,
        description: record.description,
        date: dayjs(record.date),
      });
    } else {
      setEditingItem(null);
      form.resetFields();
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (values: any) => {
    let newList = [...holidays];
    const dateStr = values.date.format('YYYY-MM-DD');

    if (editingItem) {
      newList = newList.map((item) =>
        item.id === editingItem.id
          ? {
              ...item,
              name: values.name,
              date: dateStr,
              type: values.type,
              description: values.description,
            }
          : item
      );
    } else {
      newList.push({
        id: `h-${Date.now()}`,
        name: values.name,
        date: dateStr,
        type: values.type,
        description: values.description,
      });
    }

    await saveHolidays(newList);
    setIsModalOpen(false);
    form.resetFields();
  };

  const handleDelete = (record: HolidayItem) => {
    showConfirmDialog({
      title: t('settings.holidays.deleteTitle', 'Delete Holiday'),
      content: t('settings.holidays.deleteConfirm', {
        name: record.name,
      }),
      onOk: async () => {
        const newList = holidays.filter((item) => item.id !== record.id);
        await saveHolidays(newList);
      },
      danger: true,
    });
  };

  const columns: ColumnsType<HolidayItem> = [
    {
      title: t('settings.holidays.colName', 'Holiday Name'),
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => (
        <span style={{ fontWeight: 600, color: 'var(--primary-color)' }}>
          <CalendarOutlined style={{ marginRight: 6 }} /> {name}
        </span>
      ),
    },
    {
      title: t('settings.holidays.colDate', 'Date'),
      dataIndex: 'date',
      key: 'date',
      render: (date) => dayjs(date).format('MMMM D, YYYY'),
    },
    {
      title: t('settings.holidays.colType', 'Type'),
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const color = type === 'Public' ? 'geekblue' : type === 'Company' ? 'green' : 'orange';
        return <Tag color={color}>{type}</Tag>;
      },
    },
    {
      title: t('settings.holidays.colDesc', 'Description'),
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: t('settings.holidays.colActions', 'Actions'),
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
            {t('settings.holidays.title', 'Holidays')}
          </h3>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0 0', maxWidth: 650 }}>
            Define public, regional, and company holidays. These operational blackouts are integrated into the scheduling board and calendar views to prevent incorrect booking assignments.
          </p>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => handleCreateOrEdit()}
        >
          {t('settings.holidays.addBtn', 'Add Holidays List')}
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={holidays}
        rowKey="id"
        loading={isLoading}
        pagination={false}
      />

      <Modal
        title={
          editingItem
            ? t('settings.holidays.editTitle', 'Edit Holiday')
            : t('settings.holidays.createTitle', 'Add Holiday')
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
            label={t('settings.holidays.formName', 'Holiday Name')}
            rules={[{ required: true, message: t('settings.holidays.requiredName', 'Please input the holiday name') }]}
          >
            <Input placeholder="Christmas Day" />
          </Form.Item>

          <Form.Item
            name="date"
            label={t('settings.holidays.formDate', 'Date')}
            rules={[{ required: true, message: t('settings.holidays.requiredDate', 'Please pick a holiday date') }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="type"
            label={t('settings.holidays.formType', 'Type')}
            rules={[{ required: true, message: t('settings.holidays.requiredType', 'Please select the holiday type') }]}
            initialValue="Public"
          >
            <Select
              options={[
                { label: 'Public Holiday', value: 'Public' },
                { label: 'Company Holiday', value: 'Company' },
                { label: 'Regional Holiday', value: 'Regional' },
              ]}
            />
          </Form.Item>

          <Form.Item
            name="description"
            label={t('settings.holidays.formDesc', 'Description')}
          >
            <Input.TextArea placeholder="Describe the holiday details..." rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
