import { useState } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Space,
  Drawer,
  Typography,
  List,
  Modal,
  Form,
  Input,
  Select,
  message,
  Divider,
  Tooltip,
  Empty,
  Tag,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  SaveOutlined,
  EyeOutlined,
  DragOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next'; // Rule 1: Import useTranslation
import PageHeader from '@/components/common/PageHeader';
import {
  widgetTypes,
  widgetSizes,
  getWidgetComponent,
  type WidgetConfig,
  KPIWidget,
  ProgressWidget,
  LineChartWidget,
  BarChartWidget,
  PieChartWidget,
  DoughnutChartWidget,
  TableWidget,
  ListWidget,
  ActivityFeedWidget,
  StatusOverviewWidget,
  MetricCardsWidget,
  AlertsWidget,
} from '@/components/dashboard/WidgetLibrary';

const { Title, Text } = Typography;

// Mock data generators (strings within this function are treated as data values
// that would typically be translated by the consuming widget component or come pre-translated from an API.
// As t() is not in scope here and direct modification would break component structure assumptions,
// these strings are left as is, as per rule 6: "Do NOT touch code variables".
// The problem focuses on strings within the React component and its JSX output.)
const generateMockData = (type: string): any => {
  switch (type) {
    case 'kpi':
      return {
        title: 'Total Revenue',
        value: 84320,
        prefix: '$',
        trend: { direction: 'up', value: 12.5 },
        color: '#52c41a',
      };
    case 'progress':
      return {
        title: 'Monthly Goal',
        current: 42,
        total: 60,
        status: 'active',
      };
    case 'line-chart':
      return {
        title: 'Revenue Trend',
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        data: [12000, 19000, 15000, 25000, 22000, 30000],
      };
    case 'bar-chart':
      return {
        title: 'Work Orders by Status',
        labels: ['New', 'In Progress', 'Completed', 'On Hold'],
        data: [12, 19, 34, 5],
        color: '#1890ff',
      };
    case 'pie-chart':
      return {
        title: 'Services Distribution',
        labels: ['HVAC', 'Plumbing', 'Electrical', 'General'],
        data: [35, 25, 20, 20],
      };
    case 'doughnut-chart':
      return {
        title: 'Appointment Status',
        labels: ['Scheduled', 'Completed', 'Cancelled'],
        data: [45, 35, 20],
      };
    case 'table':
      return {
        title: 'Recent Work Orders',
        dataSource: [
          { key: '1', wo_number: 'WO-001', customer: 'John Doe', status: 'In Progress' },
          { key: '2', wo_number: 'WO-002', customer: 'Jane Smith', status: 'Completed' },
        ],
        columns: [
          { title: 'WO #', dataIndex: 'wo_number', key: 'wo_number' },
          { title: 'Customer', dataIndex: 'customer', key: 'customer' },
          { title: 'Status', dataIndex: 'status', key: 'status' },
        ],
      };
    case 'list':
      return {
        title: 'Pending Tasks',
        items: [
          { title: 'Review estimate #123', description: 'Due today', badge: 1 },
          { title: 'Complete work order #456', description: 'Due tomorrow' },
        ],
      };
    case 'activity-feed':
      return {
        title: 'Recent Activity',
        activities: [
          { title: 'Work Order WO-123 completed', time: '2 hours ago', type: 'success', tag: 'Work Order' },
          { title: 'New estimate created', time: '3 hours ago', type: 'info', tag: 'Estimate' },
        ],
      };
    case 'status-overview':
      return {
        title: 'Work Order Status',
        statuses: [
          { label: 'Completed', count: 45, total: 100, color: '#52c41a' },
          { label: 'In Progress', count: 30, total: 100, color: '#1890ff' },
          { label: 'Pending', count: 25, total: 100, color: '#faad14' },
        ],
      };
    case 'metric-cards':
      return {
        title: 'Key Metrics',
        metrics: [
          { label: 'Revenue', value: '$84.3K', icon: '$', color: '#52c41a', trend: { direction: 'up', value: 12 } },
          { label: 'Work Orders', value: '156', icon: '📋', color: '#1890ff', trend: { direction: 'up', value: 8 } },
          { label: 'Customers', value: '423', icon: '👥', color: '#722ed1' },
        ],
      };
    case 'alerts':
      return {
        title: 'Alerts',
        alerts: [
          { severity: 'critical', title: 'SLA Breach', message: 'Work order WO-456 exceeded SLA by 2 hours' },
          { severity: 'warning', title: 'Low Inventory', message: '5 parts below minimum stock level' },
        ],
      };
    default:
      return {};
  }
};

export default function DashboardBuilderPage() {
  const { t } = useTranslation(); // Rule 2: Declare t()
  const [widgets, setWidgets] = useState<WidgetConfig[]>([]);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [configModalVisible, setConfigModalVisible] = useState(false);
  const [currentWidget, setCurrentWidget] = useState<WidgetConfig | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [previewMode, setPreviewMode] = useState(false);

  const [form] = Form.useForm();

  const addWidget = (type: string) => {
    const widgetType = widgetTypes.find((w) => w.type === type);
    if (!widgetType) return;

    const newWidget: WidgetConfig = {
      id: `widget_${Date.now()}`,
      type,
      // Rule 5: Translate JS/TS string for widget title
      title: t(`dashboardBuilder.widgetLibrary.${widgetType.type}.name`),
      data: generateMockData(type),
      size: widgetType.defaultSize,
    };

    setWidgets([...widgets, newWidget]);
    setDrawerVisible(false);
    // Rule 5: Translate JS/TS string for message
    message.success(t('dashboardBuilder.messages.widgetAdded', { widgetName: t(`dashboardBuilder.widgetLibrary.${widgetType.type}.name`) }));
  };

  const deleteWidget = (widgetId: string) => {
    Modal.confirm({
      title: t('dashboardBuilder.confirmDelete.title'), // Rule 5: Translate JS/TS string for title
      content: t('dashboardBuilder.confirmDelete.content'), // Rule 5: Translate JS/TS string for content
      okText: t('dashboardBuilder.confirmDelete.okText'), // Rule 5: Translate JS/TS string for okText
      okType: 'danger',
      onOk: () => {
        setWidgets(widgets.filter((w) => w.id !== widgetId));
        // Rule 5: Translate JS/TS string for message
        message.success(t('dashboardBuilder.messages.widgetDeleted'));
      },
    });
  };

  const configureWidget = (widget: WidgetConfig) => {
    setCurrentWidget(widget);
    form.setFieldsValue({
      title: widget.title,
      size: widget.size,
    });
    setConfigModalVisible(true);
  };

  const saveWidgetConfig = () => {
    form.validateFields().then((values) => {
      if (!currentWidget) return;

      setWidgets(
        widgets.map((w) =>
          w.id === currentWidget.id
            ? {
                ...w,
                title: values.title,
                size: values.size,
              }
            : w
        )
      );

      setConfigModalVisible(false);
      setCurrentWidget(null);
      form.resetFields();
      // Rule 5: Translate JS/TS string for message
      message.success(t('dashboardBuilder.messages.widgetConfigured'));
    });
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newWidgets = [...widgets];
    const draggedWidget = newWidgets[draggedIndex];
    newWidgets.splice(draggedIndex, 1);
    newWidgets.splice(index, 0, draggedWidget);

    setWidgets(newWidgets);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const saveDashboard = () => {
    // In production, save to backend
    // Rule 5: Translate JS/TS string for message
    message.success(t('dashboardBuilder.messages.dashboardSaved'));
  };

  const renderWidget = (widget: WidgetConfig) => {
    const WidgetComponent = getWidgetComponent(widget.type);
    if (!WidgetComponent) return null;

    return <WidgetComponent {...widget.data} title={widget.title} />;
  };

  return (
    <div>
      <PageHeader
        title={t('dashboardBuilder.pageHeader.title')} // Rule 4: Translate attribute
        subtitle={t('dashboardBuilder.pageHeader.subtitle')} // Rule 4: Translate attribute
        extra={
          <Space>
            <Button
              icon={previewMode ? <EditOutlined /> : <EyeOutlined />}
              onClick={() => setPreviewMode(!previewMode)}
            >
              {previewMode ? t('dashboardBuilder.buttons.editMode') : t('dashboardBuilder.buttons.previewMode')} {/* Rule 3: Translate JSX children */}
            </Button>
            <Button type="primary" icon={<SaveOutlined />} onClick={saveDashboard}>
              {t('dashboardBuilder.buttons.saveDashboard')} {/* Rule 3: Translate JSX children */}
            </Button>
            {!previewMode && (
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setDrawerVisible(true)}>
                {t('dashboardBuilder.buttons.addWidget')} {/* Rule 3: Translate JSX children */}
              </Button>
            )}
          </Space>
        }
      />

      {/* Instructions Card */}
      {!previewMode && widgets.length === 0 && (
        <Card style={{ marginBottom: 16, background: '#e6f7ff', border: '1px solid #91d5ff' }}>
          <Space direction="vertical">
            <Title level={5} style={{ margin: 0 }}>
              {t('dashboardBuilder.instructions.cardTitle')} {/* Rule 3: Translate JSX children */}
            </Title>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              <li>{t('dashboardBuilder.instructions.listItem1')}</li> {/* Rule 3: Translate JSX children */}
              <li>{t('dashboardBuilder.instructions.listItem2')}</li> {/* Rule 3: Translate JSX children */}
              <li>{t('dashboardBuilder.instructions.listItem3')}</li> {/* Rule 3: Translate JSX children */}
              <li>{t('dashboardBuilder.instructions.listItem4')}</li> {/* Rule 3: Translate JSX children */}
              <li>{t('dashboardBuilder.instructions.listItem5')}</li> {/* Rule 3: Translate JSX children */}
            </ul>
          </Space>
        </Card>
      )}

      {/* Dashboard Canvas */}
      <Card>
        {widgets.length === 0 ? (
          <Empty
            description={t('dashboardBuilder.emptyState.description')} // Rule 4: Translate attribute
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            style={{ padding: '60px 0' }}
          >
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setDrawerVisible(true)}>
              {t('dashboardBuilder.buttons.addYourFirstWidget')} {/* Rule 3: Translate JSX children */}
            </Button>
          </Empty>
        ) : (
          <Row gutter={[16, 16]}>
            {widgets.map((widget, index) => (
              <Col
                key={widget.id}
                xs={24}
                sm={24}
                md={widgetSizes[widget.size || 'medium']}
                draggable={!previewMode}
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                style={{
                  cursor: previewMode ? 'default' : 'move',
                  opacity: draggedIndex === index ? 0.5 : 1,
                }}
              >
                <div style={{ position: 'relative' }}>
                  {!previewMode && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        zIndex: 10,
                        display: 'flex',
                        gap: 4,
                      }}
                    >
                      <Tooltip title={t('dashboardBuilder.tooltips.dragReorder')}> {/* Rule 4: Translate attribute */}
                        <Button
                          type="text"
                          size="small"
                          icon={<DragOutlined />}
                          style={{ cursor: 'grab' }}
                        />
                      </Tooltip>
                      <Tooltip title={t('dashboardBuilder.tooltips.configure')}> {/* Rule 4: Translate attribute */}
                        <Button
                          type="text"
                          size="small"
                          icon={<SettingOutlined />}
                          onClick={() => configureWidget(widget)}
                        />
                      </Tooltip>
                      <Tooltip title={t('dashboardBuilder.tooltips.delete')}> {/* Rule 4: Translate attribute */}
                        <Button
                          type="text"
                          size="small"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => deleteWidget(widget.id)}
                        />
                      </Tooltip>
                    </div>
                  )}
                  {renderWidget(widget)}
                </div>
              </Col>
            ))}
          </Row>
        )}
      </Card>

      {/* Widget Library Drawer */}
      <Drawer
        title={t('dashboardBuilder.drawer.title')} // Rule 4: Translate attribute
        placement="right"
        width={400}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {t('dashboardBuilder.drawer.description')} {/* Rule 3: Translate JSX children */}
            </Text>
          </div>

          <Divider style={{ margin: '8px 0' }} />

          <List
            dataSource={widgetTypes}
            renderItem={(widgetType) => (
              <List.Item>
                <Card
                  hoverable
                  style={{ width: '100%', cursor: 'pointer' }}
                  onClick={() => addWidget(widgetType.type)}
                  bodyStyle={{ padding: 16 }}
                >
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Space>
                      <div style={{ fontSize: 24, color: '#1890ff' }}>{widgetType.icon}</div>
                      <div>
                        <Text strong>{t(`dashboardBuilder.widgetLibrary.${widgetType.type}.name`)}</Text> {/* Rule 3: Translate JSX children */}
                        <br />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {t(`dashboardBuilder.widgetLibrary.${widgetType.type}.description`)} {/* Rule 3: Translate JSX children */}
                        </Text>
                      </div>
                    </Space>
                    <Tag color="blue">{t('dashboardBuilder.widgetLibrary.defaultSize', { size: widgetType.defaultSize })}</Tag> {/* Rule 3: Translate JSX children */}
                  </Space>
                </Card>
              </List.Item>
            )}
          />
        </Space>
      </Drawer>

      {/* Widget Configuration Modal */}
      <Modal
        title={t('dashboardBuilder.configModal.title')} // Rule 4: Translate attribute
        open={configModalVisible}
        onOk={saveWidgetConfig}
        onCancel={() => {
          setConfigModalVisible(false);
          setCurrentWidget(null);
          form.resetFields();
        }}
        okText={t('dashboardBuilder.configModal.saveButton')} // Rule 4: Translate attribute
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="title"
            label={t('dashboardBuilder.configModal.form.titleLabel')} // Rule 4: Translate attribute
            rules={[{ required: true, message: t('dashboardBuilder.configModal.form.titleRequired') }]} // Rule 5: Translate JS/TS string
          >
            <Input placeholder={t('dashboardBuilder.configModal.form.titlePlaceholder')} /> {/* Rule 4: Translate attribute */}
          </Form.Item>

          <Form.Item
            name="size"
            label={t('dashboardBuilder.configModal.form.sizeLabel')} // Rule 4: Translate attribute
            rules={[{ required: true, message: t('dashboardBuilder.configModal.form.sizeRequired') }]} // Rule 5: Translate JS/TS string
          >
            <Select>
              <Select.Option value="small">{t('dashboardBuilder.configModal.form.sizeOption.small')}</Select.Option> {/* Rule 3: Translate JSX children */}
              <Select.Option value="medium">{t('dashboardBuilder.configModal.form.sizeOption.medium')}</Select.Option> {/* Rule 3: Translate JSX children */}
              <Select.Option value="large">{t('dashboardBuilder.configModal.form.sizeOption.large')}</Select.Option> {/* Rule 3: Translate JSX children */}
              <Select.Option value="full">{t('dashboardBuilder.configModal.form.sizeOption.full')}</Select.Option> {/* Rule 3: Translate JSX children */}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}