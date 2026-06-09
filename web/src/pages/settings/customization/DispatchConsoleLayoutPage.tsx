import { useState, useEffect } from 'react';
import {
  Typography,
  Card,
  Radio,
  Button,
  Space,
  List,
  Checkbox,
  Spin,
  Alert,
  Tooltip,
} from 'antd';
import {
  SaveOutlined,
  LayoutOutlined,
  UnorderedListOutlined,
  CalendarOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  PlusOutlined,
  MinusOutlined,
} from '@ant-design/icons';
import { useDispatchConsoleLayouts, useSaveDispatchConsoleLayout } from '@/hooks/use-dispatch-console-layouts';
import { useUiStore } from '@/store/ui.store';

const { Title, Text } = Typography;

// Available fields that can be included in the layouts
const AVAILABLE_FIELDS = [
  { name: 'work_order_number', label: 'Work Order Number' },
  { name: 'subject', label: 'Subject' },
  { name: 'status', label: 'Status' },
  { name: 'priority', label: 'Priority' },
  { name: 'scheduled_date', label: 'Scheduled Date' },
  { name: 'assigned_to', label: 'Assigned To' },
  { name: 'description', label: 'Description' },
  { name: 'total_cost', label: 'Total Cost' },
  { name: 'company', label: 'Company' },
  { name: 'contact', label: 'Contact' },
  { name: 'created_at', label: 'Created At' },
];

export default function DispatchConsoleLayoutPage() {
  const { data: layouts, isLoading } = useDispatchConsoleLayouts();
  const saveLayout = useSaveDispatchConsoleLayout();

  const theme = useUiStore((s) => s.theme);
  const isDark = theme === 'dark';

  const [activeTab, setActiveTab] = useState<'gantt' | 'grid' | 'calendar'>('gantt');
  const [layoutMode, setLayoutMode] = useState<string>('classic');
  const [visibleFields, setVisibleFields] = useState<string[]>([]);

  // Load configuration when layouts data or active tab changes
  useEffect(() => {
    if (layouts) {
      const activeLayout = layouts.find((l) => l.view_type === activeTab);
      if (activeLayout) {
        setLayoutMode(activeLayout.layout_mode);
        setVisibleFields(activeLayout.visible_fields);
      }
    }
  }, [layouts, activeTab]);

  if (isLoading || !layouts) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
        <Spin size="large" tip="Loading layout configurations..." />
      </div>
    );
  }

  const handleSave = async () => {
    await saveLayout.mutateAsync({
      view_type: activeTab,
      layout_mode: layoutMode,
      visible_fields: visibleFields,
    });
  };

  // Field transfer & reordering actions
  const addField = (fieldName: string) => {
    if (!visibleFields.includes(fieldName)) {
      setVisibleFields((prev) => [...prev, fieldName]);
    }
  };

  const removeField = (fieldName: string) => {
    setVisibleFields((prev) => prev.filter((name) => name !== fieldName));
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    setVisibleFields((prev) => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[index - 1];
      next[index - 1] = temp;
      return next;
    });
  };

  const moveDown = (index: number) => {
    if (index === visibleFields.length - 1) return;
    setVisibleFields((prev) => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[index + 1];
      next[index + 1] = temp;
      return next;
    });
  };

  const hiddenFields = AVAILABLE_FIELDS.filter((f) => !visibleFields.includes(f.name));

  // Find modifier name if available
  const activeLayoutRecord = layouts.find((l) => l.view_type === activeTab);
  const modifierName = activeLayoutRecord?.modifier
    ? `${activeLayoutRecord.modifier.first_name} ${activeLayoutRecord.modifier.last_name}`
    : 'System Default';

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0, color: isDark ? '#e5e7eb' : '#1a1a2e' }}>
          Dispatch Console Layouts
        </Title>
        <Text style={{ color: isDark ? '#a3a3a3' : '#8c8c8c', fontSize: 13 }}>
          Customize view density and configure visible columns/cards for Gantt, Grid, and Calendar console modules.
        </Text>
      </div>

      {/* Tabs */}
      <div style={{ marginBottom: 20 }}>
        <Radio.Group
          value={activeTab}
          onChange={(e) => setActiveTab(e.target.value)}
          buttonStyle="solid"
          size="large"
        >
          <Radio.Button value="gantt">
            <LayoutOutlined style={{ marginRight: 8 }} />
            Gantt Chart View
          </Radio.Button>
          <Radio.Button value="grid">
            <UnorderedListOutlined style={{ marginRight: 8 }} />
            Grid / Table View
          </Radio.Button>
          <Radio.Button value="calendar">
            <CalendarOutlined style={{ marginRight: 8 }} />
            Calendar View
          </Radio.Button>
        </Radio.Group>
      </div>

      {/* Layout Config Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24, alignItems: 'start' }}>
        
        {/* Left Control Panel: Density & Metadata */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Card title="Layout Settings" borderRadius={12} style={{ borderRadius: 12 }}>
            <div style={{ marginBottom: 20 }}>
              <Text strong style={{ display: 'block', marginBottom: 8, fontSize: 13 }}>
                Display Density
              </Text>
              <Radio.Group
                value={layoutMode}
                onChange={(e) => setLayoutMode(e.target.value)}
                style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}
              >
                <Radio value="comfortable">
                  <div style={{ display: 'inline-block', marginLeft: 4 }}>
                    <Text strong style={{ fontSize: 13, display: 'block' }}>Comfortable</Text>
                    <Text type="secondary" style={{ fontSize: 11 }}>Spacious padding, ideal for high-res monitors</Text>
                  </div>
                </Radio>
                <Radio value="classic">
                  <div style={{ display: 'inline-block', marginLeft: 4 }}>
                    <Text strong style={{ fontSize: 13, display: 'block' }}>Classic</Text>
                    <Text type="secondary" style={{ fontSize: 11 }}>Balanced default layout configuration</Text>
                  </div>
                </Radio>
                <Radio value="compact">
                  <div style={{ display: 'inline-block', marginLeft: 4 }}>
                    <Text strong style={{ fontSize: 13, display: 'block' }}>Compact</Text>
                    <Text type="secondary" style={{ fontSize: 11 }}>Tight padding, fits more rows on the screen</Text>
                  </div>
                </Radio>
              </Radio.Group>
            </div>

            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSave}
              loading={saveLayout.isPending}
              block
              style={{ borderRadius: 8, height: 40 }}
            >
              Save Configuration
            </Button>
          </Card>

          {activeLayoutRecord && (
            <Alert
              message="Audit Information"
              description={
                <div style={{ fontSize: 12 }}>
                  <div>Last modified by: <strong>{modifierName}</strong></div>
                  <div>Updated at: {new Date(activeLayoutRecord.updated_at).toLocaleString()}</div>
                </div>
              }
              type="info"
              showIcon
              style={{ borderRadius: 10 }}
            />
          )}
        </div>

        {/* Right Panel: Fields configuration */}
        <Card title="Column / Field List Configuration" style={{ borderRadius: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            
            {/* Active Fields */}
            <div>
              <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text strong style={{ fontSize: 13, color: isDark ? '#e5e7eb' : '#1a1a2e' }}>
                  Visible Fields ({visibleFields.length})
                </Text>
                <Text style={{ fontSize: 11, color: isDark ? '#a3a3a3' : '#8c8c8c' }}>
                  Determines column/card render order
                </Text>
              </div>

              <div
                style={{
                  border: `1.5px dashed ${isDark ? '#434343' : '#d9d9d9'}`,
                  borderRadius: 10,
                  padding: 12,
                  minHeight: 340,
                  background: isDark ? '#141414' : '#fafafa',
                }}
              >
                <List
                  dataSource={visibleFields}
                  renderItem={(fieldName, index) => {
                    const fieldDetail = AVAILABLE_FIELDS.find((f) => f.name === fieldName);
                    return (
                      <List.Item
                        style={{
                          background: isDark ? '#1f1f1f' : '#fff',
                          margin: '0 0 8px 0',
                          padding: '10px 14px',
                          borderRadius: 8,
                          border: `1px solid ${isDark ? '#303030' : '#e8e8e8'}`,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          boxShadow: isDark ? '0 1px 2px rgba(0,0,0,0.4)' : '0 1px 2px rgba(0,0,0,0.02)',
                        }}
                      >
                        <Space>
                          <Text style={{ fontSize: 13 }}>{fieldDetail?.label || fieldName}</Text>
                        </Space>
                        <Space size="small">
                          <Tooltip title="Move Up">
                            <Button
                              type="text"
                              icon={<ArrowUpOutlined />}
                              disabled={index === 0}
                              onClick={() => moveUp(index)}
                              size="small"
                            />
                          </Tooltip>
                          <Tooltip title="Move Down">
                            <Button
                              type="text"
                              icon={<ArrowDownOutlined />}
                              disabled={index === visibleFields.length - 1}
                              onClick={() => moveDown(index)}
                              size="small"
                            />
                          </Tooltip>
                          <Tooltip title="Hide field">
                            <Button
                              type="text"
                              danger
                              icon={<MinusOutlined />}
                              onClick={() => removeField(fieldName)}
                              size="small"
                            />
                          </Tooltip>
                        </Space>
                      </List.Item>
                    );
                  }}
                />
              </div>
            </div>

            {/* Inactive Fields */}
            <div>
              <div style={{ marginBottom: 12 }}>
                <Text strong style={{ fontSize: 13, color: isDark ? '#e5e7eb' : '#1a1a2e' }}>
                  Available (Hidden) Fields ({hiddenFields.length})
                </Text>
              </div>

              <div
                style={{
                  border: `1px solid ${isDark ? '#303030' : '#e8e8e8'}`,
                  borderRadius: 10,
                  padding: 12,
                  minHeight: 340,
                  background: isDark ? '#141414' : '#fff',
                }}
              >
                <List
                  dataSource={hiddenFields}
                  renderItem={(field) => (
                    <List.Item
                      style={{
                        margin: '0 0 8px 0',
                        padding: '10px 14px',
                        borderRadius: 8,
                        background: isDark ? '#1f1f1f' : '#fafafa',
                        border: `1px solid ${isDark ? '#303030' : '#f0f0f0'}`,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 13, color: isDark ? '#d9d9d9' : '#595959' }}>{field.label}</Text>
                      <Tooltip title="Show field">
                        <Button
                          type="primary"
                          ghost
                          icon={<PlusOutlined />}
                          onClick={() => addField(field.name)}
                          size="small"
                        />
                      </Tooltip>
                    </List.Item>
                  )}
                />
              </div>
            </div>

          </div>
        </Card>

      </div>
    </div>
  );
}
