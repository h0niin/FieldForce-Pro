import { useState } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  Tag,
  Tabs,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  MailOutlined,
  MessageOutlined,
  CopyOutlined,
} from '@ant-design/icons';
import PageHeader from '@/components/common/PageHeader';
import { showConfirmDialog } from '@/components/common/ConfirmDialog';
import { formatDateTime } from '@/utils/format-date';
import { useTranslation } from 'react-i18next'; // Rule 1: Import useTranslation

const { TextArea } = Input;
const { Text } = Typography;

interface Template {
  id: string;
  name: string;
  type: 'email' | 'sms';
  event_type: string;
  subject?: string;
  body: string;
  variables: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const EVENT_TYPES = [
  { label: 'Work Order Created', value: 'work_order_created' },
  { label: 'Work Order Assigned', value: 'work_order_assigned' },
  { label: 'Work Order Completed', value: 'work_order_completed' },
  { label: 'Appointment Scheduled', value: 'appointment_scheduled' },
  { label: 'Appointment Reminder', value: 'appointment_reminder' },
  { label: 'Estimate Sent', value: 'estimate_sent' },
  { label: 'Estimate Approved', value: 'estimate_approved' },
  { label: 'Invoice Generated', value: 'invoice_generated' },
  { label: 'Payment Received', value: 'payment_received' },
  { label: 'Service Request Created', value: 'service_request_created' },
];

const AVAILABLE_VARIABLES = {
  work_order: ['{{customer_name}}', '{{wo_number}}', '{{technician_name}}', '{{scheduled_date}}', '{{status}}'],
  appointment: ['{{customer_name}}', '{{appointment_date}}', '{{technician_name}}', '{{service_address}}'],
  estimate: ['{{customer_name}}', '{{estimate_number}}', '{{total_amount}}', '{{expiry_date}}'],
  invoice: ['{{customer_name}}', '{{invoice_number}}', '{{total_amount}}', '{{due_date}}'],
  payment: ['{{customer_name}}', '{{payment_amount}}', '{{payment_method}}', '{{transaction_id}}'],
};

export default function EmailSmsTemplateManagementPage() {
  // Rule 2: Declare t()
  const { t } = useTranslation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [form] = Form.useForm();
  const [templateType, setTemplateType] = useState<'email' | 'sms'>('email');

  // Mock data - replace with actual API calls
  const templates: Template[] = [
    {
      id: '1',
      name: 'Work Order Assigned',
      type: 'email',
      event_type: 'work_order_assigned',
      subject: 'New Work Order Assignment - {{wo_number}}',
      body: 'Hi {{technician_name}},\n\nYou have been assigned to work order {{wo_number}} for {{customer_name}}.\n\nScheduled Date: {{scheduled_date}}\n\nThank you!',
      variables: ['technician_name', 'wo_number', 'customer_name', 'scheduled_date'],
      is_active: true,
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z',
    },
    {
      id: '2',
      name: 'Appointment Reminder SMS',
      type: 'sms',
      event_type: 'appointment_reminder',
      body: 'Reminder: Your service appointment is scheduled for {{appointment_date}}. Technician: {{technician_name}}',
      variables: ['appointment_date', 'technician_name'],
      is_active: true,
      created_at: '2024-01-16T10:00:00Z',
      updated_at: '2024-01-16T10:00:00Z',
    },
  ];

  const handleCreate = () => {
    setEditingTemplate(null);
    form.resetFields();
    setTemplateType('email');
    setIsModalOpen(true);
  };

  const handleEdit = (template: Template) => {
    setEditingTemplate(template);
    setTemplateType(template.type);
    form.setFieldsValue({
      name: template.name,
      type: template.type,
      event_type: template.event_type,
      subject: template.subject,
      body: template.body,
      is_active: template.is_active,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (template: Template) => {
    showConfirmDialog({
      title: t('emailSmsTemplateManagement.deleteTemplateTitle'),
      content: t('emailSmsTemplateManagement.deleteTemplateContent', { templateName: template.name }),
      onOk: async () => {
        console.log('Delete template', template.id);
      },
      danger: true,
    });
  };

  const handleSubmit = async (values: any) => {
    console.log('Submit template', values);
    setIsModalOpen(false);
    form.resetFields();
  };

  const insertVariable = (variable: string) => {
    const currentBody = form.getFieldValue('body') || '';
    form.setFieldsValue({ body: currentBody + ' ' + variable });
  };

  const emailColumns: ColumnsType<Template> = [
    {
      title: t('emailSmsTemplateManagement.templateNameColumn'),
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => <span style={{ fontWeight: 500 }}>{name}</span>,
    },
    {
      title: t('emailSmsTemplateManagement.eventTypeColumn'),
      dataIndex: 'event_type',
      key: 'event_type',
      render: (type: string) => (
        <Tag color="blue">{type.replace(/_/g, ' ').toUpperCase()}</Tag>
      ),
    },
    {
      title: t('emailSmsTemplateManagement.subjectColumn'),
      dataIndex: 'subject',
      key: 'subject',
      ellipsis: true,
    },
    {
      title: t('emailSmsTemplateManagement.variablesColumn'),
      dataIndex: 'variables',
      key: 'variables',
      render: (vars: string[]) => (
        <Space size={4} wrap>
          {vars.slice(0, 3).map((v) => (
            <Tag key={v} style={{ fontSize: 11 }}>
              {`{{${v}}}`}
            </Tag>
          ))}
          {vars.length > 3 && <Text type="secondary">{t('emailSmsTemplateManagement.moreVariables', { count: vars.length - 3 })}</Text>}
        </Space>
      ),
    },
    {
      title: t('emailSmsTemplateManagement.statusColumn'),
      dataIndex: 'is_active',
      key: 'is_active',
      render: (active: boolean) => (
        <Tag color={active ? 'success' : 'default'}>
          {active ? t('common.active') : t('common.inactive')}
        </Tag>
      ),
    },
    {
      title: t('emailSmsTemplateManagement.updatedColumn'),
      dataIndex: 'updated_at',
      key: 'updated_at',
      render: (date: string) => formatDateTime(date),
    },
    {
      title: t('emailSmsTemplateManagement.actionsColumn'),
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Button type="text" icon={<EditOutlined />} size="small" onClick={() => handleEdit(record)} />
          <Button type="text" icon={<CopyOutlined />} size="small" onClick={() => handleEdit(record)} />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            size="small"
            onClick={() => handleDelete(record)}
          />
        </Space>
      ),
    },
  ];

  const smsColumns: ColumnsType<Template> = [
    {
      title: t('emailSmsTemplateManagement.templateNameColumn'),
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => <span style={{ fontWeight: 500 }}>{name}</span>,
    },
    {
      title: t('emailSmsTemplateManagement.eventTypeColumn'),
      dataIndex: 'event_type',
      key: 'event_type',
      render: (type: string) => (
        <Tag color="cyan">{type.replace(/_/g, ' ').toUpperCase()}</Tag>
      ),
    },
    {
      title: t('emailSmsTemplateManagement.messagePreviewColumn'),
      dataIndex: 'body',
      key: 'body',
      ellipsis: true,
      render: (body: string) => <Text type="secondary">{body.substring(0, 50)}...</Text>,
    },
    {
      title: t('emailSmsTemplateManagement.lengthColumn'),
      dataIndex: 'body',
      key: 'length',
      render: (body: string) => {
        const length = body.length;
        const color = length > 160 ? 'error' : length > 140 ? 'warning' : 'success';
        return <Tag color={color}>{t('emailSmsTemplateManagement.chars', { count: length })}</Tag>;
      },
    },
    {
      title: t('emailSmsTemplateManagement.statusColumn'),
      dataIndex: 'is_active',
      key: 'is_active',
      render: (active: boolean) => (
        <Tag color={active ? 'success' : 'default'}>
          {active ? t('common.active') : t('common.inactive')}
        </Tag>
      ),
    },
    {
      title: t('emailSmsTemplateManagement.actionsColumn'),
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Button type="text" icon={<EditOutlined />} size="small" onClick={() => handleEdit(record)} />
          <Button type="text" icon={<CopyOutlined />} size="small" onClick={() => handleEdit(record)} />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            size="small"
            onClick={() => handleDelete(record)}
          />
        </Space>
      ),
    },
  ];

  const emailTemplates = templates.filter((t) => t.type === 'email');
  const smsTemplates = templates.filter((t) => t.type === 'sms');

  const tabItems = [
    {
      key: 'email',
      label: (
        <Space>
          <MailOutlined />
          {t('emailSmsTemplateManagement.emailTemplatesTab')}
          <Tag>{emailTemplates.length}</Tag>
        </Space>
      ),
      children: (
        <Table
          columns={emailColumns}
          dataSource={emailTemplates}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      ),
    },
    {
      key: 'sms',
      label: (
        <Space>
          <MessageOutlined />
          {t('emailSmsTemplateManagement.smsTemplatesTab')}
          <Tag>{smsTemplates.length}</Tag>
        </Space>
      ),
      children: (
        <Table
          columns={smsColumns}
          dataSource={smsTemplates}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('emailSmsTemplateManagement.pageTitle')}
        subtitle={t('emailSmsTemplateManagement.pageSubtitle')}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            {t('emailSmsTemplateManagement.createTemplateButton')}
          </Button>
        }
      />

      <Card>
        <Tabs items={tabItems} />
      </Card>

      {/* Template Modal */}
      <Modal
        title={editingTemplate ? t('emailSmsTemplateManagement.editTemplateModalTitle') : t('emailSmsTemplateManagement.createTemplateModalTitle')}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        width={800}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="name"
            label={t('emailSmsTemplateManagement.templateNameLabel')}
            rules={[{ required: true, message: t('emailSmsTemplateManagement.templateNameRequired') }]}
          >
            <Input placeholder={t('emailSmsTemplateManagement.templateNamePlaceholder')} />
          </Form.Item>

          <Form.Item
            name="type"
            label={t('emailSmsTemplateManagement.templateTypeLabel')}
            rules={[{ required: true, message: t('emailSmsTemplateManagement.templateTypeRequired') }]}
          >
            <Select onChange={(value) => setTemplateType(value as 'email' | 'sms')}>
              <Select.Option value="email">
                <Space>
                  <MailOutlined />
                  {t('emailSmsTemplateManagement.emailOption')}
                </Space>
              </Select.Option>
              <Select.Option value="sms">
                <Space>
                  <MessageOutlined />
                  {t('emailSmsTemplateManagement.smsOption')}
                </Space>
              </Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="event_type"
            label={t('emailSmsTemplateManagement.triggerEventLabel')}
            rules={[{ required: true, message: t('emailSmsTemplateManagement.eventTypeRequired') }]}
          >
            <Select
              placeholder={t('emailSmsTemplateManagement.triggerEventPlaceholder')}
              options={EVENT_TYPES.map(eventType => ({
                ...eventType,
                label: t(`emailSmsTemplateManagement.eventType${eventType.value.split('_').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('')}`),
              }))}
            />
          </Form.Item>

          {templateType === 'email' && (
            <Form.Item
              name="subject"
              label={t('emailSmsTemplateManagement.emailSubjectLabel')}
              rules={[{ required: true, message: t('emailSmsTemplateManagement.emailSubjectRequired') }]}
            >
              <Input placeholder={t('emailSmsTemplateManagement.emailSubjectPlaceholder')} />
            </Form.Item>
          )}

          <Form.Item
            name="body"
            label={templateType === 'email' ? t('emailSmsTemplateManagement.emailBodyLabel') : t('emailSmsTemplateManagement.smsMessageLabel')}
            rules={[{ required: true, message: t('emailSmsTemplateManagement.messageBodyRequired') }]}
          >
            <TextArea
              rows={templateType === 'email' ? 8 : 4}
              placeholder={
                templateType === 'email'
                  ? t('emailSmsTemplateManagement.emailBodyPlaceholder')
                  : t('emailSmsTemplateManagement.smsMessagePlaceholder')
              }
              maxLength={templateType === 'sms' ? 320 : undefined}
              showCount={templateType === 'sms'}
            />
          </Form.Item>

          <Card size="small" title={t('emailSmsTemplateManagement.availableVariablesCardTitle')} style={{ marginBottom: 16 }}>
            <Space wrap>
              {AVAILABLE_VARIABLES.work_order.map((variable) => (
                <Button
                  key={variable}
                  size="small"
                  onClick={() => insertVariable(variable)}
                >
                  {variable}
                </Button>
              ))}
            </Space>
            <Text type="secondary" style={{ display: 'block', marginTop: 8, fontSize: 12 }}>
              {t('emailSmsTemplateManagement.insertVariableInstruction')}
            </Text>
          </Card>

          <Form.Item name="is_active" label={t('emailSmsTemplateManagement.activeLabel')} valuePropName="checked" initialValue={true}>
            <Switch checkedChildren={t('common.active')} unCheckedChildren={t('common.inactive')} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}