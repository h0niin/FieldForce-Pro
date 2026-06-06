import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Button,
  Card,
  Form,
  Select,
  Input,
  Table,
  Tag,
  Typography,
  Space,
  Spin,
  Modal,
  Switch,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  ArrowLeftOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  CheckSquareOutlined,
  FileTextOutlined,
  CameraOutlined,
  EditOutlined,
  NumberOutlined,
  CalendarOutlined,
  SaveOutlined,
  PlusOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import PageHeader from '@/components/common/PageHeader';
import {
  useJobSheetInstance,
  useJobSheetItems,
  useUpdateJobSheetInstance,
  useCreateJobSheetItem,
  useDeleteJobSheetItem,
} from '@/hooks/use-job-sheets';
import { jobSheetItemsApi } from '@/api/job-sheets.api';
import { useQueryClient } from '@tanstack/react-query';
import { useAllWorkOrders } from '@/hooks/use-work-orders';
import type { JobSheetItem } from '@/types/models.types';

const { TextArea } = Input;
const { Text } = Typography;

const typeIcons: Record<string, React.ReactNode> = {
  checkbox: <CheckSquareOutlined />,
  text: <FileTextOutlined />,
  photo: <CameraOutlined />,
  signature: <EditOutlined />,
  number: <NumberOutlined />,
  date: <CalendarOutlined />,
};

export default function JobSheetFormPage() {
  const { t } = useTranslation();
  
  const ITEM_TYPE_OPTIONS = [
    { value: 'checkbox', label: t('jobSheetForm.types.checkbox') },
    { value: 'text', label: t('jobSheetForm.types.text') },
    { value: 'number', label: t('jobSheetForm.types.number') },
    { value: 'photo', label: t('jobSheetForm.types.photo') },
    { value: 'signature', label: t('jobSheetForm.types.signature') },
    { value: 'date', label: t('jobSheetForm.types.date') },
  ];

  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [addItemForm] = Form.useForm();

  const { data: instance, isLoading: instanceLoading } = useJobSheetInstance(id || '');
  const { data: items, isLoading: itemsLoading } = useJobSheetItems(id || '');
  const { data: workOrders } = useAllWorkOrders();
  const queryClient = useQueryClient();
  const updateInstance = useUpdateJobSheetInstance();
  const createItem = useCreateJobSheetItem();
  const deleteItem = useDeleteJobSheetItem();

  const [sortedItems, setSortedItems] = useState<JobSheetItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [addingItem, setAddingItem] = useState(false);

  // Auto-fill form when instance loads
  useEffect(() => {
    if (instance) {
      const notes = (instance.custom_fields as Record<string, unknown>)?.notes as string | undefined;
      form.setFieldsValue({
        notes: notes || '',
      });
    }
  }, [instance, form]);

  // Keep local sorted copy of items
  useEffect(() => {
    if (items) {
      setSortedItems([...items].sort((a, b) => a.sort_order - b.sort_order));
    }
  }, [items]);

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= sortedItems.length) return;

    const updated = [...sortedItems];
    const temp = updated[index];
    updated[index] = updated[swapIndex];
    updated[swapIndex] = temp;
    // Reassign sort_order based on new positions
    updated.forEach((item, i) => {
      item = { ...item, sort_order: i };
      updated[i] = item;
    });
    setSortedItems(updated);
  };

  const handleAddItem = async (values: { label: string; type: string; is_required: boolean }) => {
    if (!instance) return;
    setAddingItem(true);
    try {
      const nextSort = sortedItems.length;
      await createItem.mutateAsync({
        instance_id: instance.id,
        label: values.label,
        type: values.type as 'checkbox' | 'text' | 'photo' | 'signature' | 'number' | 'date',
        is_required: values.is_required,
        sort_order: nextSort,
      });
      addItemForm.resetFields();
      setAddItemOpen(false);
    } catch {
      // Error handled by mutation hook
    } finally {
      setAddingItem(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    await deleteItem.mutateAsync(itemId);
  };

  const handleSubmit = async (values: { notes?: string; status?: string }) => {
    if (!instance) return;

    setSubmitting(true);
    try {
      await updateInstance.mutateAsync({
        id: instance.id,
        status: values.status || instance.status,
        custom_fields: { ...(instance.custom_fields as Record<string, unknown>), notes: values.notes || '' },
      });

      // Save position changes using raw API to avoid mid-loop cache invalidation
      const positionUpdates = sortedItems
        .map((item, i) => ({ id: item.id, newSort: i, oldSort: items?.find((it) => it.id === item.id)?.sort_order }))
        .filter((u) => u.oldSort !== u.newSort);

      for (const u of positionUpdates) {
        await jobSheetItemsApi.update(u.id, { sort_order: u.newSort });
      }

      // Invalidate cache once after all updates
      if (positionUpdates.length > 0) {
        queryClient.invalidateQueries({ queryKey: ['job-sheet-items'] });
      }

      navigate('/job-sheets');
    } catch {
      // Error notifications handled by mutation hooks
    } finally {
      setSubmitting(false);
    }
  };

  if (instanceLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!instance) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Text type="secondary">{t('jobSheetForm.notFound')}</Text>
      </div>
    );
  }

  // Resolve work order display label
  const linkedWo = workOrders?.find((wo) => wo.id === instance.work_order_id);
  const workOrderLabel = linkedWo
    ? `${linkedWo.wo_number || linkedWo.id.slice(0, 8)} - ${linkedWo.summary}`
    : instance.work_order_id
      ? instance.work_order_id.slice(0, 8) + '...'
      : t('jobSheetForm.noWorkOrderLinked');

  const columns: ColumnsType<JobSheetItem> = [
    {
      title: t('jobSheetForm.columns.position'),
      key: 'position',
      width: 120,
      render: (_, _record, index) => (
        <Space size={4}>
          <Button
            type="text"
            icon={<ArrowUpOutlined />}
            size="small"
            disabled={index === 0}
            onClick={() => moveItem(index, 'up')}
          />
          <span style={{ minWidth: 20, textAlign: 'center', display: 'inline-block' }}>{index + 1}</span>
          <Button
            type="text"
            icon={<ArrowDownOutlined />}
            size="small"
            disabled={index === sortedItems.length - 1}
            onClick={() => moveItem(index, 'down')}
          />
        </Space>
      ),
    },
    {
      title: t('jobSheetForm.columns.type'),
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => <Tag icon={typeIcons[type]}>{type}</Tag>,
    },
    {
      title: t('jobSheetForm.columns.label'),
      dataIndex: 'label',
      key: 'label',
    },
    {
      title: t('jobSheetForm.columns.required'),
      dataIndex: 'is_required',
      key: 'is_required',
      width: 90,
      render: (req: boolean) => req ? <Tag color="red">{t('jobSheetForm.required')}</Tag> : <Tag>{t('jobSheetForm.optional')}</Tag>,
    },
    {
      title: '',
      key: 'action',
      width: 50,
      render: (_, record) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          size="small"
          onClick={() => handleDeleteItem(record.id)}
        />
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('jobSheetForm.title')}
        subtitle={`${t('jobSheetForm.template')}: ${instance.template?.name || (instance.template_id ? instance.template_id.slice(0, 8) + '...' : 'N/A')}`}
        extra={
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/job-sheets')}>
            {t('common.back')}
          </Button>
        }
      />

      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Card title={t('jobSheetForm.details')} style={{ marginBottom: 24 }}>
          <Form.Item label={t('jobSheetForm.workOrder')} required>
            <Input value={workOrderLabel} disabled />
          </Form.Item>

          <Form.Item name="notes" label={t('jobSheetForm.notes')}>
            <TextArea rows={3} placeholder={t('jobSheetForm.notesPlaceholder')} />
          </Form.Item>
        </Card>

        <Card
          title={t('jobSheetForm.items')}
          style={{ marginBottom: 24 }}
          extra={
            <Button
              type="primary"
              icon={<PlusOutlined />}
              size="small"
              onClick={() => setAddItemOpen(true)}
            >
              {t('jobSheetForm.addItem')}
            </Button>
          }
        >
          <Table
            columns={columns}
            dataSource={sortedItems}
            rowKey="id"
            loading={itemsLoading}
            pagination={false}
            size="small"
          />
        </Card>

        <Card>
          <Space>
            <Button onClick={() => navigate('/job-sheets')}>{t('common.cancel')}</Button>
            <Form.Item name="status" noStyle initialValue={instance.status}>
              <Input type="hidden" />
            </Form.Item>
            <Button
              icon={<SaveOutlined />}
              loading={submitting}
              onClick={() => {
                form.setFieldValue('status', 'draft');
                form.submit();
              }}
            >
              {t('jobSheetForm.saveDraft')}
            </Button>
            <Button
              type="primary"
              loading={submitting}
              onClick={() => {
                form.setFieldValue('status', 'pending');
                form.submit();
              }}
            >
              {t('jobSheetForm.submitReview')}
            </Button>
          </Space>
        </Card>
      </Form>

      <Modal
        title={t('jobSheetForm.addItem')}
        open={addItemOpen}
        onCancel={() => { setAddItemOpen(false); addItemForm.resetFields(); }}
        footer={null}
        destroyOnClose
      >
        <Form
          form={addItemForm}
          layout="vertical"
          onFinish={handleAddItem}
          initialValues={{ type: 'text', is_required: false }}
        >
          <Form.Item
            name="label"
            label={t('jobSheetForm.columns.label')}
            rules={[{ required: true, message: t('jobSheetForm.validation.enterLabel') }]}
          >
            <Input placeholder={t('jobSheetForm.placeholder.label')} />
          </Form.Item>

          <Form.Item name="type" label={t('jobSheetForm.columns.type')} rules={[{ required: true }]}>
            <Select options={ITEM_TYPE_OPTIONS} />
          </Form.Item>

          <Form.Item name="is_required" label={t('jobSheetForm.columns.required')} valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button onClick={() => { setAddItemOpen(false); addItemForm.resetFields(); }}>
                {t('common.cancel')}
              </Button>
              <Button type="primary" htmlType="submit" loading={addingItem}>
                {t('jobSheetForm.add')}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}