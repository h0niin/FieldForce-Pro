import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Form,
  Input,
  Button,
  Space,
  Skeleton,
  Select,
  Switch,
  Row,
  Col,
  Tabs,
  Tag,
  Divider,
  Collapse,
  Typography,
  Tooltip,
  message,
} from 'antd';
import {
  CopyOutlined,
  EyeOutlined,
  CodeOutlined,
  BoldOutlined,
  ItalicOutlined,
  UnorderedListOutlined,
  OrderedListOutlined,
  LinkOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next'; // Rule 1: Import useTranslation
import { useTemplate, useCreateTemplate, useUpdateTemplate } from '@/hooks/use-templates';
import PageHeader from '@/components/common/PageHeader';

const { TextArea } = Input;
const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

// These are base values for template types, labels will be translated dynamically
const TEMPLATE_TYPES_BASE = [
  { value: 'invoice', labelKey: 'templateBuilder.templateTypes.invoice' },
  { value: 'estimate', labelKey: 'templateBuilder.templateTypes.estimate' },
  { value: 'email', labelKey: 'templateBuilder.templateTypes.email' },
  { value: 'report', labelKey: 'templateBuilder.templateTypes.report' },
  { value: 'job_sheet', labelKey: 'templateBuilder.templateTypes.jobSheet' },
  { value: 'work_order', labelKey: 'templateBuilder.templateTypes.workOrder' },
  { value: 'contract', labelKey: 'templateBuilder.templateTypes.contract' },
];

// Template variables organized by category (category keys are used internally, descriptions are translated)
const TEMPLATE_VARIABLES = {
  'Work Order': [
    { key: '{{work_order.wo_number}}', descriptionKey: 'templateBuilder.variableDescriptions.workOrderNumber' },
    { key: '{{work_order.summary}}', descriptionKey: 'templateBuilder.variableDescriptions.workOrderSummary' },
    { key: '{{work_order.description}}', descriptionKey: 'templateBuilder.variableDescriptions.workOrderDescription' },
    { key: '{{work_order.status}}', descriptionKey: 'templateBuilder.variableDescriptions.currentStatus' },
    { key: '{{work_order.priority}}', descriptionKey: 'templateBuilder.variableDescriptions.priorityLevel' },
    { key: '{{work_order.scheduled_start}}', descriptionKey: 'templateBuilder.variableDescriptions.scheduledDate' },
  ],
  'Customer': [
    { key: '{{contact.name}}', descriptionKey: 'templateBuilder.variableDescriptions.customerFullName' },
    { key: '{{contact.email}}', descriptionKey: 'templateBuilder.variableDescriptions.customerEmail' },
    { key: '{{contact.phone}}', descriptionKey: 'templateBuilder.variableDescriptions.customerPhone' },
    { key: '{{company.name}}', descriptionKey: 'templateBuilder.variableDescriptions.companyName' },
    { key: '{{company.email}}', descriptionKey: 'templateBuilder.variableDescriptions.companyEmail' },
    { key: '{{company.phone}}', descriptionKey: 'templateBuilder.variableDescriptions.companyPhone' },
  ],
  'Service Location': [
    { key: '{{location.address}}', descriptionKey: 'templateBuilder.variableDescriptions.serviceAddress' },
    { key: '{{location.city}}', descriptionKey: 'templateBuilder.variableDescriptions.city' },
    { key: '{{location.state}}', descriptionKey: 'templateBuilder.variableDescriptions.state' },
    { key: '{{location.zip}}', descriptionKey: 'templateBuilder.variableDescriptions.zipCode' },
    { key: '{{location.country}}', descriptionKey: 'templateBuilder.variableDescriptions.country' },
  ],
  'Agent/Technician': [
    { key: '{{agent.name}}', descriptionKey: 'templateBuilder.variableDescriptions.assignedTechnicianName' },
    { key: '{{agent.email}}', descriptionKey: 'templateBuilder.variableDescriptions.technicianEmail' },
    { key: '{{agent.phone}}', descriptionKey: 'templateBuilder.variableDescriptions.technicianPhone' },
  ],
  'Invoice/Estimate': [
    { key: '{{invoice.number}}', descriptionKey: 'templateBuilder.variableDescriptions.invoiceNumber' },
    { key: '{{invoice.date}}', descriptionKey: 'templateBuilder.variableDescriptions.invoiceDate' },
    { key: '{{invoice.due_date}}', descriptionKey: 'templateBuilder.variableDescriptions.dueDate' },
    { key: '{{invoice.subtotal}}', descriptionKey: 'templateBuilder.variableDescriptions.subtotalAmount' },
    { key: '{{invoice.tax}}', descriptionKey: 'templateBuilder.variableDescriptions.taxAmount' },
    { key: '{{invoice.total}}', descriptionKey: 'templateBuilder.variableDescriptions.totalAmount' },
    { key: '{{estimate.number}}', descriptionKey: 'templateBuilder.variableDescriptions.estimateNumber' },
    { key: '{{estimate.date}}', descriptionKey: 'templateBuilder.variableDescriptions.estimateDate' },
    { key: '{{estimate.total}}', descriptionKey: 'templateBuilder.variableDescriptions.estimateTotal' },
  ],
  'Company/Settings': [
    { key: '{{company_settings.name}}', descriptionKey: 'templateBuilder.variableDescriptions.yourCompanyName' },
    { key: '{{company_settings.email}}', descriptionKey: 'templateBuilder.variableDescriptions.yourCompanyEmail' },
    { key: '{{company_settings.phone}}', descriptionKey: 'templateBuilder.variableDescriptions.yourCompanyPhone' },
    { key: '{{company_settings.address}}', descriptionKey: 'templateBuilder.variableDescriptions.yourCompanyAddress' },
    { key: '{{company_settings.logo_url}}', descriptionKey: 'templateBuilder.variableDescriptions.companyLogoUrl' },
  ],
  'Date/Time': [
    { key: '{{today}}', descriptionKey: 'templateBuilder.variableDescriptions.todaysDate' },
    { key: '{{current_time}}', descriptionKey: 'templateBuilder.variableDescriptions.currentTime' },
    { key: '{{current_year}}', descriptionKey: 'templateBuilder.variableDescriptions.currentYear' },
  ],
};

// Sample data for preview (Rule 6: Do NOT touch internal identifiers or variables)
const PREVIEW_DATA: Record<string, string> = {
  '{{work_order.wo_number}}': 'WO-001234',
  '{{work_order.summary}}': 'HVAC System Maintenance',
  '{{work_order.description}}': 'Perform routine maintenance on commercial HVAC system',
  '{{work_order.status}}': 'Scheduled',
  '{{work_order.priority}}': 'High',
  '{{work_order.scheduled_start}}': 'January 20, 2026',
  '{{contact.name}}': 'John Smith',
  '{{contact.email}}': 'john.smith@example.com',
  '{{contact.phone}}': '+1 (555) 123-4567',
  '{{company.name}}': 'Acme Corporation',
  '{{company.email}}': 'info@acme.com',
  '{{company.phone}}': '+1 (555) 987-6543',
  '{{location.address}}': '123 Main Street',
  '{{location.city}}': 'San Francisco',
  '{{location.state}}': 'CA',
  '{{location.zip}}': '94102',
  '{{location.country}}': 'USA',
  '{{agent.name}}': 'Mike Johnson',
  '{{agent.email}}': 'mike.j@fieldforce.com',
  '{{agent.phone}}': '+1 (555) 234-5678',
  '{{invoice.number}}': 'INV-001234',
  '{{invoice.date}}': 'January 20, 2026',
  '{{invoice.due_date}}': 'February 20, 2026',
  '{{invoice.subtotal}}': '$1,200.00',
  '{{invoice.tax}}': '$120.00',
  '{{invoice.total}}': '$1,320.00',
  '{{estimate.number}}': 'EST-001234',
  '{{estimate.date}}': 'January 15, 2026',
  '{{estimate.total}}': '$1,500.00',
  '{{company_settings.name}}': 'FieldForce Pro Services',
  '{{company_settings.email}}': 'contact@fieldforce.com',
  '{{company_settings.phone}}': '+1 (555) 100-2000',
  '{{company_settings.address}}': '456 Business Ave, Suite 100, San Francisco, CA 94103',
  '{{company_settings.logo_url}}': 'https://via.placeholder.com/150x50?text=FieldForce+Pro',
  '{{today}}': 'February 16, 2026',
  '{{current_time}}': '2:30 PM',
  '{{current_year}}': '2026',
};

export default function TemplateBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const isEdit = !!id;

  const { t } = useTranslation(); // Rule 2: Declare t

  const [content, setContent] = useState('');
  const [previewContent, setPreviewContent] = useState('');
  const [activeTab, setActiveTab] = useState('editor');

  const { data: template, isLoading } = useTemplate(id!);
  const createTemplate = useCreateTemplate();
  const updateTemplate = useUpdateTemplate();

  useEffect(() => {
    if (template) {
      form.setFieldsValue({
        type: template.type,
        name: template.name,
        subject: template.subject,
        content: template.content,
        is_default: template.is_default,
      });
      setContent(template.content || '');
    }
  }, [template, form]);

  // Update preview when content changes
  useEffect(() => {
    let preview = content;
    // Replace all variables with preview data
    Object.entries(PREVIEW_DATA).forEach(([variable, value]) => {
      preview = preview.replace(new RegExp(variable.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
    });
    setPreviewContent(preview);
  }, [content]);

  const handleSubmit = async (values: Record<string, unknown>) => {
    try {
      const payload = { ...values, content };
      if (isEdit) {
        await updateTemplate.mutateAsync({ id: id!, ...payload });
      } else {
        await createTemplate.mutateAsync(payload as never);
      }
      navigate('/customization/templates');
    } catch {
      // Error handled by mutation hooks
    }
  };

  const insertVariable = (variable: string) => {
    const textarea = document.getElementById('template-content') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = content;
      const before = text.substring(0, start);
      const after = text.substring(end);
      const newContent = before + variable + after;
      setContent(newContent);
      form.setFieldValue('content', newContent);

      // Set cursor position after inserted variable
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variable.length, start + variable.length);
      }, 10);
    }
  };

  const insertFormatting = (before: string, after: string) => {
    const textarea = document.getElementById('template-content') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = content;
      const selectedText = text.substring(start, end);
      const beforeText = text.substring(0, start);
      const afterText = text.substring(end);
      const newContent = beforeText + before + selectedText + after + afterText;
      setContent(newContent);
      form.setFieldValue('content', newContent);

      setTimeout(() => {
        textarea.focus();
        const newPosition = start + before.length + selectedText.length + after.length;
        textarea.setSelectionRange(newPosition, newPosition);
      }, 10);
    }
  };

  const copyVariable = (variable: string) => {
    navigator.clipboard.writeText(variable);
    // Rule 5: JS/TS strings
    message.success(t('templateBuilder.variableCopiedSuccess'));
  };

  if (isEdit && isLoading) {
    return (
      <div>
        {/* Rule 4: Attribute title */}
        <PageHeader title={t('templateBuilder.loadingPageHeader')} />
        <Card><Skeleton active /></Card>
      </div>
    );
  }

  // Translate TEMPLATE_TYPES_BASE labels for Ant Design Select options
  const translatedTemplateTypes = TEMPLATE_TYPES_BASE.map(type => ({
    ...type,
    label: t(type.labelKey),
  }));

  // Helper to map category strings to translation keys for Collapse header
  const getCategoryTranslationKey = (category: string) => {
    switch (category) {
      case 'Work Order': return 'templateBuilder.variableCategories.workOrder';
      case 'Customer': return 'templateBuilder.variableCategories.customer';
      case 'Service Location': return 'templateBuilder.variableCategories.serviceLocation';
      case 'Agent/Technician': return 'templateBuilder.variableCategories.agentTechnician';
      case 'Invoice/Estimate': return 'templateBuilder.variableCategories.invoiceEstimate';
      case 'Company/Settings': return 'templateBuilder.variableCategories.companySettings';
      case 'Date/Time': return 'templateBuilder.variableCategories.dateTime';
      default: return ''; // Fallback, should not happen if keys are well-defined
    }
  };

  return (
    <div>
      <PageHeader
        // Rule 4: Attribute title
        title={isEdit ? t('templateBuilder.editTemplateTitle') : t('templateBuilder.createTemplateTitle')}
        // Rule 4: Attribute subtitle
        subtitle={t('templateBuilder.pageSubtitle')}
        onBack={() => navigate('/customization/templates')}
      />

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        autoComplete="off"
        initialValues={{ is_default: false }}
      >
        <Row gutter={16}>
          {/* Main Editor Section */}
          <Col xs={24} lg={16}>
            <Card style={{ marginBottom: 16 }}>
              <Space size="large" style={{ display: 'flex', marginBottom: 16 }}>
                <Form.Item
                  name="type"
                  // Rule 4: Attribute label
                  label={t('templateBuilder.form.templateTypeLabel')}
                  style={{ flex: 1, marginBottom: 0 }}
                  // Rule 5: JS/TS string in rules message
                  rules={[{ required: true, message: t('templateBuilder.form.selectTypeRequired') }]}
                >
                  {/* Rule 4: Attribute placeholder */}
                  <Select placeholder={t('templateBuilder.form.selectTypePlaceholder')} options={translatedTemplateTypes} />
                </Form.Item>
                <Form.Item
                  name="name"
                  // Rule 4: Attribute label
                  label={t('templateBuilder.form.templateNameLabel')}
                  style={{ flex: 1, marginBottom: 0 }}
                  // Rule 5: JS/TS string in rules message
                  rules={[{ required: true, message: t('templateBuilder.form.enterNameRequired') }]}
                >
                  {/* Rule 4: Attribute placeholder */}
                  <Input placeholder={t('templateBuilder.form.templateNamePlaceholder')} />
                </Form.Item>
              </Space>

              <Form.Item
                name="subject"
                // Rule 4: Attribute label
                label={t('templateBuilder.form.subjectLabel')}
                style={{ marginBottom: 16 }}
              >
                {/* Rule 4: Attribute placeholder */}
                <Input placeholder={t('templateBuilder.form.subjectPlaceholder')} />
              </Form.Item>

              <Form.Item name="is_default"
                // Rule 4: Attribute label
                label={t('templateBuilder.form.setDefaultTemplateLabel')}
                valuePropName="checked">
                {/* Rule 4: Attributes checkedChildren and unCheckedChildren */}
                <Switch
                  checkedChildren={t('templateBuilder.form.defaultSwitchChecked')}
                  unCheckedChildren={t('templateBuilder.form.defaultSwitchUnchecked')}
                />
              </Form.Item>
            </Card>

            <Card>
              <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                items={[
                  {
                    key: 'editor',
                    // Rule 3: JSX Children
                    label: (
                      <span>
                        <CodeOutlined /> {t('templateBuilder.tabs.editor')}
                      </span>
                    ),
                    children: (
                      <div>
                        {/* Formatting Toolbar */}
                        <div style={{ marginBottom: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {/* Rule 4: Attribute title */}
                          <Tooltip title={t('templateBuilder.toolbar.bold')}>
                            <Button
                              size="small"
                              icon={<BoldOutlined />}
                              onClick={() => insertFormatting('**', '**')}
                            />
                          </Tooltip>
                          {/* Rule 4: Attribute title */}
                          <Tooltip title={t('templateBuilder.toolbar.italic')}>
                            <Button
                              size="small"
                              icon={<ItalicOutlined />}
                              onClick={() => insertFormatting('_', '_')}
                            />
                          </Tooltip>
                          <Divider type="vertical" />
                          {/* Rule 4: Attribute title */}
                          <Tooltip title={t('templateBuilder.toolbar.heading')}>
                            <Button
                              size="small"
                              onClick={() => insertFormatting('## ', '')}
                            >
                              H
                            </Button>
                          </Tooltip>
                          <Divider type="vertical" />
                          {/* Rule 4: Attribute title */}
                          <Tooltip title={t('templateBuilder.toolbar.unorderedList')}>
                            <Button
                              size="small"
                              icon={<UnorderedListOutlined />}
                              onClick={() => insertFormatting('- ', '')}
                            />
                          </Tooltip>
                          {/* Rule 4: Attribute title */}
                          <Tooltip title={t('templateBuilder.toolbar.orderedList')}>
                            <Button
                              size="small"
                              icon={<OrderedListOutlined />}
                              onClick={() => insertFormatting('1. ', '')}
                            />
                          </Tooltip>
                          <Divider type="vertical" />
                          {/* Rule 4: Attribute title */}
                          <Tooltip title={t('templateBuilder.toolbar.link')}>
                            <Button
                              size="small"
                              icon={<LinkOutlined />}
                              onClick={() => insertFormatting('[', '](url)')}
                            />
                          </Tooltip>
                        </div>

                        <Form.Item
                          name="content"
                          // Rule 5: JS/TS string in rules message
                          rules={[{ required: true, message: t('templateBuilder.form.contentRequired') }]}
                        >
                          <TextArea
                            id="template-content"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            rows={20}
                            // Rule 4: Attribute placeholder (multi-line)
                            placeholder={t('templateBuilder.form.contentPlaceholder')}
                            style={{ fontFamily: 'monospace', fontSize: 14 }}
                          />
                        </Form.Item>

                        {/* Rule 3: JSX Children */}
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {t('templateBuilder.markdownTips')}
                        </Text>
                      </div>
                    ),
                  },
                  {
                    key: 'preview',
                    // Rule 3: JSX Children
                    label: (
                      <span>
                        <EyeOutlined /> {t('templateBuilder.tabs.preview')}
                      </span>
                    ),
                    children: (
                      <div>
                        <div
                          style={{
                            padding: 24,
                            border: '1px solid #f0f0f0',
                            borderRadius: 8,
                            backgroundColor: '#fafafa',
                            minHeight: 400,
                            whiteSpace: 'pre-wrap',
                            fontFamily: 'system-ui, -apple-system, sans-serif',
                            lineHeight: 1.6,
                          }}
                          dangerouslySetInnerHTML={{
                            __html: previewContent
                              .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                              .replace(/_(.*?)_/g, '<em>$1</em>')
                              .replace(/^## (.*?)$/gm, '<h2 style="margin: 16px 0 8px 0; font-size: 20px;">$1</h2>')
                              .replace(/^# (.*?)$/gm, '<h1 style="margin: 20px 0 12px 0; font-size: 24px;">$1</h1>')
                              .replace(/^- (.*?)$/gm, '<li style="margin-left: 20px;">$1</li>')
                              .replace(/\n/g, '<br />'),
                          }}
                        />
                        <Divider />
                        {/* Rule 3: JSX Children */}
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {t('templateBuilder.previewDisclaimer')}
                        </Text>
                      </div>
                    ),
                  },
                ]}
              />

              <Divider />

              <Form.Item style={{ marginBottom: 0 }}>
                <Space>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={createTemplate.isPending || updateTemplate.isPending}
                    size="large"
                  >
                    {/* Rule 3: JSX Children */}
                    {isEdit ? t('templateBuilder.updateButton') : t('templateBuilder.createButton')}
                  </Button>
                  {/* Rule 3: JSX Children */}
                  <Button onClick={() => navigate('/customization/templates')} size="large">
                    {t('templateBuilder.cancelButton')}
                  </Button>
                </Space>
              </Form.Item>
            </Card>
          </Col>

          {/* Variables Sidebar */}
          <Col xs={24} lg={8}>
            <Card
              // Rule 4: Attribute title
              title={t('templateBuilder.sidebar.templateVariablesTitle')}
              size="small"
              style={{ position: 'sticky', top: 16 }}
            >
              {/* Rule 3: JSX Children */}
              <Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 16 }}>
                {t('templateBuilder.sidebar.variableInstructions')}
              </Paragraph>

              <Collapse
                defaultActiveKey={['Work Order', 'Customer']} // Rule 6: Do NOT touch internal identifiers
                ghost
                size="small"
              >
                {Object.entries(TEMPLATE_VARIABLES).map(([category, variables]) => (
                  <Panel
                    // Rule 3: JSX Children (inside header prop)
                    header={<Text strong>{t(getCategoryTranslationKey(category))}</Text>}
                    key={category} // Rule 6: Do NOT touch internal identifiers
                  >
                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                      {variables.map((variable) => (
                        <div
                          key={variable.key}
                          style={{
                            padding: '8px 12px',
                            backgroundColor: '#fafafa',
                            borderRadius: 6,
                            border: '1px solid #f0f0f0',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#e6f7ff';
                            e.currentTarget.style.borderColor = '#91d5ff';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#fafafa';
                            e.currentTarget.style.borderColor = '#f0f0f0';
                          }}
                          onClick={() => insertVariable(variable.key)}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ flex: 1 }}>
                              <Tag color="blue" style={{ fontSize: 11, fontFamily: 'monospace', marginBottom: 4 }}>
                                {variable.key}
                              </Tag>
                              {/* Rule 3: JSX Children */}
                              <div style={{ fontSize: 11, color: '#666' }}>{t(variable.descriptionKey)}</div>
                            </div>
                            {/* Rule 4: Attribute title */}
                            <Tooltip title={t('templateBuilder.sidebar.copyToClipboardTooltip')}>
                              <Button
                                type="text"
                                size="small"
                                icon={<CopyOutlined />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyVariable(variable.key);
                                }}
                              />
                            </Tooltip>
                          </div>
                        </div>
                      ))}
                    </Space>
                  </Panel>
                ))}
              </Collapse>

              <Divider />

              <div style={{ padding: '12px', backgroundColor: '#fff7e6', borderRadius: 6, border: '1px solid #ffd591' }}>
                {/* Rule 3: JSX Children */}
                <Title level={5} style={{ marginTop: 0, fontSize: 13 }}>
                  💡 {t('templateBuilder.sidebar.tipsTitle')}
                </Title>
                <ul style={{ margin: 0, paddingLeft: 20, fontSize: 12 }}>
                  {/* Rule 3: JSX Children */}
                  <li>{t('templateBuilder.sidebar.tipBold')}</li>
                  {/* Rule 3: JSX Children */}
                  <li>{t('templateBuilder.sidebar.tipItalic')}</li>
                  {/* Rule 3: JSX Children */}
                  <li>{t('templateBuilder.sidebar.tipHeadings')}</li>
                  {/* Rule 3: JSX Children */}
                  <li>{t('templateBuilder.sidebar.tipCaseSensitive')}</li>
                  {/* Rule 3: JSX Children */}
                  <li>{t('templateBuilder.sidebar.tipSampleData')}</li>
                </ul>
              </div>
            </Card>
          </Col>
        </Row>
      </Form>
    </div>
  );
}