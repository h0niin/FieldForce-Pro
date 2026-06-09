import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Table,
  Button,
  Space,
  Tabs,
  Typography,
  Modal,
  Tag,
  Input,
  Select,
  Form,
  Dropdown,
  type MenuProps,
  Divider,
  message,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  CopyOutlined,
  MoreOutlined,
  DeleteOutlined,
  CheckCircleFilled,
} from '@ant-design/icons';
import {
  useTemplates,
  useCreateTemplate,
  useUpdateTemplate,
  useDeleteTemplate,
} from '@/hooks/use-templates';
import type { Template } from '@/types/models.types';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;

const MODULE_OPTIONS = [
  { value: 'Work Order', label: 'Work Order' },
  { value: 'Service Appointment', label: 'Service Appointment' },
  { value: 'Estimate', label: 'Estimate' },
  { value: 'Invoice', label: 'Invoice' },
  { value: 'Job Sheet', label: 'Job Sheet' },
  { value: 'Report', label: 'Report' },
];

const TYPE_MAP: Record<string, string> = {
  invoice: 'Invoice',
  estimate: 'Estimate',
  job_sheet: 'Job Sheet',
  report: 'Report',
  work_order: 'Work Order',
  service_appointment: 'Service Appointment',
};

export default function TemplatesPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('pdf');
  const [searchText, setSearchText] = useState('');
  const [previewVisible, setPreviewVisible] = useState(false);
  const [createVisible, setCreateVisible] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();

  const { data, isLoading } = useTemplates();
  const createTemplate = useCreateTemplate();
  const updateTemplate = useUpdateTemplate();
  const deleteTemplate = useDeleteTemplate();

  const templates = data?.data || [];

  const pdfTemplates = templates.filter(
    (tpl) => tpl.type !== 'email' && tpl.name.toLowerCase().includes(searchText.toLowerCase()),
  );
  const emailTemplates = templates.filter(
    (tpl) => tpl.type === 'email' && tpl.name.toLowerCase().includes(searchText.toLowerCase()),
  );

  const handlePreview = (record: Template) => {
    setSelectedTemplate(record);
    setPreviewVisible(true);
  };

  const handleEdit = (record: Template) => {
    setSelectedTemplate(record);
    editForm.setFieldsValue({
      name: record.name,
      description: record.description,
      module_name: record.module_name,
    });
    setEditVisible(true);
  };

  const handleCreate = async () => {
    try {
      const values = await createForm.validateFields();
      await createTemplate.mutateAsync({
        ...values,
        type: 'report',
        content: {},
      });
      createForm.resetFields();
      setCreateVisible(false);
    } catch {
      // validation or network error handled by hook
    }
  };

  const handleUpdate = async () => {
    if (!selectedTemplate) return;
    try {
      const values = await editForm.validateFields();
      await updateTemplate.mutateAsync({ id: selectedTemplate.id, ...values });
      editForm.resetFields();
      setEditVisible(false);
      setSelectedTemplate(null);
    } catch {
      // validation or network error handled by hook
    }
  };

  const handleDelete = (record: Template) => {
    Modal.confirm({
      title: 'Delete Template',
      content: `Are you sure you want to delete "${record.name}"? This cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      onOk: () => deleteTemplate.mutateAsync(record.id),
    });
  };

  const getActionMenu = (record: Template): MenuProps => ({
    items: [
      {
        key: 'edit',
        icon: <EditOutlined />,
        label: 'Edit',
        onClick: () => handleEdit(record),
      },
      {
        key: 'clone',
        icon: <CopyOutlined />,
        label: 'Clone',
        onClick: () => {
          createForm.setFieldsValue({
            name: `${record.name} (Copy)`,
            description: record.description,
            module_name: record.module_name,
          });
          setCreateVisible(true);
        },
      },
      { type: 'divider' },
      {
        key: 'delete',
        icon: <DeleteOutlined />,
        danger: true,
        label: 'Delete',
        onClick: () => handleDelete(record),
      },
    ],
  });

  const columns = [
    {
      title: 'NAME',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Template) => (
        <Space>
          <Text
            strong
            style={{ color: '#1890ff', cursor: 'pointer' }}
            onClick={() => handlePreview(record)}
          >
            {text}
          </Text>
          {record.is_default && (
            <Tag
              icon={<CheckCircleFilled />}
              color="success"
              style={{ border: 'none', background: 'transparent' }}
            >
              Default
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: 'DESCRIPTION',
      dataIndex: 'description',
      key: 'description',
      render: (text: string) => <Text type="secondary">{text || '-'}</Text>,
    },
    {
      title: 'ALL MODULES',
      dataIndex: 'module_name',
      key: 'module_name',
      render: (text: string, record: Template) =>
        text || TYPE_MAP[record.type] || record.type || '-',
    },
    {
      title: 'CREATED BY',
      key: 'createdBy',
      render: () => 'Admin',
    },
    {
      title: 'CREATED TIME',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => dayjs(date).format('MMM DD, YYYY hh:mm A'),
    },
    {
      title: '',
      key: 'actions',
      width: 80,
      render: (_: unknown, record: Template) => (
        <Space size="small">
          <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Dropdown menu={getActionMenu(record)} trigger={['click']}>
            <Button type="text" icon={<MoreOutlined />} />
          </Dropdown>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Tabs */}
      <div style={{ padding: '0 24px', borderBottom: '1px solid #f0f0f0' }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            { key: 'pdf', label: 'PDF Templates' },
            { key: 'email', label: 'Email Template' },
          ]}
        />
      </div>

      <div style={{ padding: '24px' }}>
        {/* Description */}
        <Text type="secondary" style={{ display: 'block', marginBottom: 24, maxWidth: 820 }}>
          Make the default templates your own by adding your branding, colours, fonts, layout
          elements and other customisations. These are the templates that are used for printing,
          downloading records and attaching them to emails.
        </Text>

        {/* Toolbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <Input
            placeholder="Search"
            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
            style={{ width: 220 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <Space>
            <Button onClick={() => message.info('Global Components panel coming soon.')}>
              Global Components
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              style={{ backgroundColor: '#2e8b57', borderColor: '#2e8b57' }}
              onClick={() => setCreateVisible(true)}
            >
              Create Template
            </Button>
          </Space>
        </div>

        {/* Table */}
        <Table
          columns={columns}
          dataSource={activeTab === 'pdf' ? pdfTemplates : emailTemplates}
          rowKey="id"
          loading={isLoading}
          pagination={{
            pageSize: 10,
            showTotal: (total) => `Total ${total} templates`,
          }}
          size="middle"
        />
      </div>

      {/* Create Template Modal */}
      <Modal
        title="Create Template"
        open={createVisible}
        onOk={handleCreate}
        onCancel={() => {
          createForm.resetFields();
          setCreateVisible(false);
        }}
        okText="Create"
        okButtonProps={{
          loading: createTemplate.isPending,
          style: { backgroundColor: '#2e8b57', borderColor: '#2e8b57' },
        }}
        width={560}
      >
        <Form form={createForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="name"
            label="Template Name"
            rules={[{ required: true, message: 'Please enter a template name' }]}
          >
            <Input placeholder="e.g. Standard Work Order Template" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <TextArea rows={3} placeholder="Brief description of this template…" />
          </Form.Item>
          <Form.Item name="module_name" label="Module">
            <Select placeholder="Select a module" options={MODULE_OPTIONS} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Template Modal */}
      <Modal
        title="Edit Template"
        open={editVisible}
        onOk={handleUpdate}
        onCancel={() => {
          editForm.resetFields();
          setEditVisible(false);
          setSelectedTemplate(null);
        }}
        okText="Save"
        okButtonProps={{ loading: updateTemplate.isPending }}
        width={560}
      >
        <Form form={editForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="name"
            label="Template Name"
            rules={[{ required: true, message: 'Please enter a template name' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <TextArea rows={3} />
          </Form.Item>
          <Form.Item name="module_name" label="Module">
            <Select placeholder="Select a module" options={MODULE_OPTIONS} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Preview Modal */}
      <Modal
        title="PDF Template Preview"
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        width={900}
        footer={[
          <Button key="close" onClick={() => setPreviewVisible(false)}>
            Close
          </Button>,
        ]}
      >
        <div
          style={{
            backgroundColor: '#f5f5f5',
            padding: '12px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
            borderRadius: 4,
          }}
        >
          <Space>
            <Text type="secondary">Template name —</Text>
            <Text strong>{selectedTemplate?.name}</Text>
          </Space>
          <Space>
            <Button icon={<EditOutlined />} onClick={() => { setPreviewVisible(false); handleEdit(selectedTemplate!); }}>Edit</Button>
            <Button icon={<CopyOutlined />}>Clone</Button>
          </Space>
        </div>

        {/* Mock preview body */}
        <div style={{ padding: '24px', border: '1px solid #f0f0f0', borderRadius: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 32 }}>
            <Title level={4}>Your Company Name</Title>
            <div style={{ textAlign: 'right' }}>
              <Title level={4} style={{ margin: 0 }}>
                {selectedTemplate?.module_name || TYPE_MAP[selectedTemplate?.type || ''] || 'Work Order'}
              </Title>
              <Text code>{'${' + (selectedTemplate?.module_name || 'Work_Orders') + '.Name}'}</Text>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 32 }}>
            <div>
              <Text strong style={{ display: 'block', marginBottom: 4 }}>Service Address</Text>
              <Text type="secondary">{'${Work_Orders.Contact}'}</Text><br />
              <Text type="secondary">{'${Work_Orders.Company}'}</Text><br />
              <Text type="secondary">{'${Work_Orders.Service_Street_1}'}</Text><br />
              <Text type="secondary">{'${Work_Orders.Service_City}, ${Work_Orders.Service_State}'}</Text>
            </div>
            <div style={{ textAlign: 'right' }}>
              <Text strong style={{ display: 'block', marginBottom: 4 }}>Billing Address</Text>
              <Text type="secondary">{'${Work_Orders.Billing_Street_1}'}</Text><br />
              <Text type="secondary">{'${Work_Orders.Billing_City}, ${Work_Orders.Billing_State}'}</Text>
            </div>
          </div>

          <Divider />

          <Table
            pagination={false}
            size="small"
            dataSource={[
              { key: '1', item: '${Service_Line_Items.Service}', qty: '${Quantity}', price: '${List_Price}', amount: '${Amount}' },
              { key: '2', item: '${Part_Line_Items.Part}', qty: '${Quantity}', price: '${List_Price}', amount: '${Amount}' },
            ]}
            columns={[
              { title: 'Service / Part', dataIndex: 'item', render: (v: string) => <Text code style={{ fontSize: 11 }}>{v}</Text> },
              { title: 'Qty', dataIndex: 'qty', align: 'center' as const, render: (v: string) => <Text code style={{ fontSize: 11 }}>{v}</Text> },
              { title: 'List Price', dataIndex: 'price', align: 'right' as const, render: (v: string) => <Text code style={{ fontSize: 11 }}>{v}</Text> },
              { title: 'Amount', dataIndex: 'amount', align: 'right' as const, render: (v: string) => <Text code style={{ fontSize: 11 }}>{v}</Text> },
            ]}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
            <table>
              <tbody>
                {['Sub Total', 'Discount', 'Adjustment', 'Grand Total'].map((row) => (
                  <tr key={row}>
                    <td style={{ padding: '4px 16px', textAlign: 'right' }}><Text>{row}</Text></td>
                    <td style={{ padding: '4px 0', textAlign: 'right' }}>
                      <Text code style={{ fontSize: 11 }}>{'${' + row.replace(' ', '_') + '}'}</Text>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>
    </div>
  );
}
