import { useState, useEffect } from 'react';
import {
  Typography,
  Table,
  Button,
  Select,
  Breadcrumb,
  Space,
  Card,
  Popconfirm,
  Empty,
  Skeleton,
} from 'antd';
import {
  ArrowRightOutlined,
  DeleteOutlined,
  PlusOutlined,
  RollbackOutlined,
  SaveOutlined,
  UndoOutlined,
} from '@ant-design/icons';
import { useUiStore } from '@/store/ui.store';
import {
  useModuleMappings,
  useModuleFields,
  useSaveModuleMappings,
  useResetModuleMappings,
} from '@/hooks/use-module-mappings';

const { Title, Text } = Typography;

interface MappingPair {
  source: string;
  target: string;
  description: string;
}

const CONVERSION_PAIRS: MappingPair[] = [
  { source: 'Service Requests', target: 'Work Orders', description: 'Map the fields whose values you want copied from Service Request to Work Order' },
  { source: 'Estimates', target: 'Work Orders', description: 'Map the fields whose values you want copied from Estimate to Work Order' },
  { source: 'Service Requests', target: 'Estimates', description: 'Map the fields whose values you want copied from Service Request to Estimate' },
  { source: 'Work Orders', target: 'Estimates', description: 'Map the fields whose values you want copied from Work Order to Estimate' },
  { source: 'Work Orders', target: 'Work Orders', description: 'Map the fields whose values you want copied from Work Order to Work Order' },
  { source: 'Work Orders', target: 'Service Appointments', description: 'Map the fields whose values you want copied from Work Order to Service Appointment' },
  { source: 'Service Appointments', target: 'Job Sheets', description: 'Map the fields whose values you want copied from Service Appointment to Job Sheet' },
];

export default function ModuleMappingPage() {
  const [selectedPair, setSelectedPair] = useState<MappingPair | null>(null);

  const theme = useUiStore((s) => s.theme);
  const isDark = theme === 'dark';

  if (!selectedPair) {
    return (
      <ListView
        pairs={CONVERSION_PAIRS}
        onSelect={setSelectedPair}
        isDark={isDark}
      />
    );
  }

  return (
    <DetailView
      pair={selectedPair}
      onBack={() => setSelectedPair(null)}
      isDark={isDark}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LIST VIEW
// ─────────────────────────────────────────────────────────────────────────────
interface ListViewProps {
  pairs: MappingPair[];
  onSelect: (pair: MappingPair) => void;
  isDark: boolean;
}

function ListView({ pairs, onSelect, isDark }: ListViewProps) {
  const columns = [
    {
      title: 'Conversion Mapping',
      dataIndex: 'name',
      key: 'name',
      render: (_: unknown, record: MappingPair) => (
        <a
          onClick={() => onSelect(record)}
          style={{ fontWeight: 600, color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: 8 }}
        >
          {record.source} to {record.target}
          <ArrowRightOutlined style={{ fontSize: 12 }} />
        </a>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (text: string) => (
        <Text style={{ color: isDark ? '#a3a3a3' : '#595959' }}>{text}</Text>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0, color: isDark ? '#e5e7eb' : '#1a1a2e' }}>
          Conversion Mapping
        </Title>
        <Text style={{ color: isDark ? '#a3a3a3' : '#8c8c8c', fontSize: 13 }}>
          Establish field mapping between modules to determine what values get copied during conversion.
        </Text>
      </div>

      <Table
        dataSource={pairs}
        columns={columns}
        rowKey={(record) => `${record.source}-${record.target}`}
        pagination={false}
        bordered
        style={{
          background: isDark ? '#1f1f1f' : '#fff',
        }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DETAIL VIEW
// ─────────────────────────────────────────────────────────────────────────────
interface DetailViewProps {
  pair: MappingPair;
  onBack: () => void;
  isDark: boolean;
}

interface RowMapping {
  key: string;
  source_field: string;
  target_field: string;
}

function DetailView({ pair, onBack, isDark }: DetailViewProps) {
  const { data: mappingsData, isLoading: mappingsLoading } = useModuleMappings(pair.source, pair.target);
  const { data: fieldsData, isLoading: fieldsLoading } = useModuleFields(pair.source, pair.target);

  const saveMutation = useSaveModuleMappings();
  const resetMutation = useResetModuleMappings();

  const [editMode, setEditMode] = useState(false);
  const [localMappings, setLocalMappings] = useState<RowMapping[]>([]);

  // Synchronize state when data loads
  useEffect(() => {
    if (mappingsData) {
      setLocalMappings(
        mappingsData.map((m, idx) => ({
          key: m.id || `${idx}-${m.source_field}`,
          source_field: m.source_field,
          target_field: m.target_field,
        }))
      );
    }
  }, [mappingsData]);

  const sourceFields = fieldsData?.sourceFields || [];
  const targetFields = fieldsData?.targetFields || [];

  const handleAddLine = () => {
    setLocalMappings([
      ...localMappings,
      {
        key: `new-${Date.now()}`,
        source_field: '',
        target_field: '',
      },
    ]);
  };

  const handleRemoveLine = (key: string) => {
    setLocalMappings(localMappings.filter((m) => m.key !== key));
  };

  const handleFieldChange = (key: string, type: 'source' | 'target', value: string) => {
    setLocalMappings(
      localMappings.map((m) => {
        if (m.key !== key) return m;
        if (type === 'source') {
          // Reset target field if type changes or source changes to match Zoho's same-type rule
          const prevSrcField = sourceFields.find((f) => f.name === m.source_field);
          const nextSrcField = sourceFields.find((f) => f.name === value);
          const targetFieldVal =
            prevSrcField?.type === nextSrcField?.type ? m.target_field : '';
          return { ...m, source_field: value, target_field: targetFieldVal };
        } else {
          return { ...m, target_field: value };
        }
      })
    );
  };

  const handleSave = () => {
    // Filter out incomplete mapping entries
    const validMappings = localMappings.filter(
      (m) => m.source_field && m.target_field
    );
    saveMutation.mutate(
      {
        sourceModule: pair.source,
        targetModule: pair.target,
        mappings: validMappings.map((m) => ({
          source_field: m.source_field,
          target_field: m.target_field,
        })),
      },
      {
        onSuccess: () => setEditMode(false),
      }
    );
  };

  const handleReset = () => {
    resetMutation.mutate(
      { sourceModule: pair.source, targetModule: pair.target },
      {
        onSuccess: () => setEditMode(false),
      }
    );
  };

  const isLoading = mappingsLoading || fieldsLoading;

  // Build key-value lookups for quick field retrieval
  const sourceFieldMap = new Map(sourceFields.map((f) => [f.name, f]));
  const targetFieldMap = new Map(targetFields.map((f) => [f.name, f]));

  return (
    <div>
      {/* Header Breadcrumb */}
      <Breadcrumb style={{ marginBottom: 16 }}>
        <Breadcrumb.Item>
          <a onClick={onBack}>Module Mapping</a>
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          {pair.source} to {pair.target}
        </Breadcrumb.Item>
      </Breadcrumb>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 20,
        }}
      >
        <div style={{ maxWidth: '60%' }}>
          <Title level={4} style={{ margin: 0, color: isDark ? '#e5e7eb' : '#1a1a2e' }}>
            {pair.source} to {pair.target}
          </Title>
          <Text style={{ color: isDark ? '#a3a3a3' : '#8c8c8c', fontSize: 13 }}>
            {pair.description}. You can add, edit, or delete fields of same data type.
          </Text>
        </div>

        <Space>
          {editMode ? (
            <>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                loading={saveMutation.isPending}
                onClick={handleSave}
              >
                Save
              </Button>
              <Button onClick={() => setEditMode(false)}>Cancel</Button>
            </>
          ) : (
            <>
              <Popconfirm
                title="Reset mapping?"
                description="Are you sure you want to reset mappings to standard defaults?"
                onConfirm={handleReset}
                okText="Reset"
                cancelText="Cancel"
              >
                <Button icon={<UndoOutlined />} loading={resetMutation.isPending}>
                  Reset
                </Button>
              </Popconfirm>
              <Button type="primary" onClick={() => setEditMode(true)}>
                Edit
              </Button>
            </>
          )}
          {editMode && (
            <Button
              type="dashed"
              icon={<PlusOutlined />}
              onClick={handleAddLine}
            >
              Add New Line
            </Button>
          )}
        </Space>
      </div>

      {isLoading ? (
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Skeleton active paragraph={{ rows: 8 }} />
        </Space>
      ) : (
        <Card bodyStyle={{ padding: 0 }} style={{ borderRadius: 12, overflow: 'hidden' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              color: isDark ? '#e5e7eb' : '#262626',
            }}
          >
            <thead>
              <tr
                style={{
                  background: isDark ? '#1f1f1f' : '#fafafa',
                  borderBottom: `1px solid ${isDark ? '#303030' : '#f0f0f0'}`,
                }}
              >
                <th style={{ padding: '16px 24px', textAlign: 'left', fontWeight: 600, width: '45%' }}>
                  {pair.source}
                </th>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontWeight: 600, width: '45%' }}>
                  {pair.target}
                </th>
                {editMode && (
                  <th style={{ padding: '16px 24px', textAlign: 'center', fontWeight: 600, width: '10%' }}>
                    Action
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {localMappings.length === 0 ? (
                <tr>
                  <td colSpan={editMode ? 3 : 2} style={{ padding: '40px 0' }}>
                    <Empty description="No fields mapped" />
                  </td>
                </tr>
              ) : (
                localMappings.map((mapping) => {
                  const selectedSourceObj = sourceFieldMap.get(mapping.source_field);

                  // Filter target fields by data type if source field is selected
                  const allowedTargetFields = selectedSourceObj
                    ? targetFields.filter((f) => f.type === selectedSourceObj.type)
                    : targetFields;

                  return (
                    <tr
                      key={mapping.key}
                      style={{
                        borderBottom: `1px solid ${isDark ? '#303030' : '#f0f0f0'}`,
                      }}
                    >
                      {/* Source Field Cell */}
                      <td style={{ padding: '12px 24px' }}>
                        {editMode ? (
                          <Select
                            showSearch
                            placeholder="Select source field"
                            style={{ width: '100%' }}
                            value={mapping.source_field || undefined}
                            onChange={(val) => handleFieldChange(mapping.key, 'source', val)}
                            filterOption={(input, option) =>
                              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                            }
                            options={sourceFields.map((f) => ({
                              value: f.name,
                              label: `${f.label} (${f.type})`,
                            }))}
                          />
                        ) : (
                          <div>
                            <span style={{ fontWeight: 500 }}>
                              {selectedSourceObj?.label || mapping.source_field || '—'}
                            </span>
                            {selectedSourceObj && (
                              <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
                                ({selectedSourceObj.type})
                              </Text>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Target Field Cell */}
                      <td style={{ padding: '12px 24px' }}>
                        {editMode ? (
                          <Select
                            showSearch
                            placeholder={
                              mapping.source_field
                                ? `Select target field (${selectedSourceObj?.type || ''})`
                                : 'Select source field first'
                            }
                            disabled={!mapping.source_field}
                            style={{ width: '100%' }}
                            value={mapping.target_field || undefined}
                            onChange={(val) => handleFieldChange(mapping.key, 'target', val)}
                            filterOption={(input, option) =>
                              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                            }
                            options={allowedTargetFields.map((f) => ({
                              value: f.name,
                              label: f.label,
                            }))}
                          />
                        ) : (
                          <div>
                            <span style={{ fontWeight: 500 }}>
                              {targetFieldMap.get(mapping.target_field)?.label || mapping.target_field || '—'}
                            </span>
                            {targetFieldMap.get(mapping.target_field) && (
                              <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
                                ({targetFieldMap.get(mapping.target_field)?.type})
                              </Text>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Action Cell */}
                      {editMode && (
                        <td style={{ padding: '12px 24px', textAlign: 'center' }}>
                          <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => handleRemoveLine(mapping.key)}
                          />
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
