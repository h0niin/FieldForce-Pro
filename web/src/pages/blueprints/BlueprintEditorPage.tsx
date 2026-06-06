import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Card,
  Button,
  Space,
  Typography,
  Input,
  Select,
  message,
  Modal,
  Form,
  Drawer,
  Tag,
  Tooltip,
  Divider,
  Alert,
  Tabs,
  Switch,
  InputNumber,
  Collapse,
  Badge,
} from 'antd';
import {
  PlusOutlined,
  SaveOutlined,
  PlayCircleOutlined,
  ArrowLeftOutlined,
  DeleteOutlined,
  EditOutlined,
  CopyOutlined,
  ExportOutlined,
  ImportOutlined,
  BugOutlined,
  NodeIndexOutlined,
  ApartmentOutlined,
  SettingOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  MarkerType,
  Panel,
  BackgroundVariant,
  NodeProps,
  EdgeProps,
  getBezierPath,
} from 'reactflow';
import 'reactflow/dist/style.css';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { TabPane } = Tabs;

// Custom Node Component for States
const StateNode: React.FC<NodeProps> = ({ data, selected }) => {
  const { t } = useTranslation();
  return (
    <div
      style={{
        padding: '15px 20px',
        borderRadius: 8,
        border: `2px solid ${selected ? '#1890ff' : data.color || '#d9d9d9'}`,
        backgroundColor: '#fff',
        minWidth: 150,
        boxShadow: selected ? '0 4px 12px rgba(24, 144, 255, 0.3)' : '0 2px 8px rgba(0,0,0,0.1)',
        cursor: 'pointer',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <Text strong style={{ fontSize: 16 }}>
            {data.label}
          </Text>
          {data.is_initial && (
            <Tag color="green" style={{ marginLeft: 8, fontSize: 10 }}>
              {t('blueprintEditor.initial')}
            </Tag>
          )}
          {data.is_final && (
            <Tag color="blue" style={{ marginLeft: 8, fontSize: 10 }}>
              {t('blueprintEditor.final')}
            </Tag>
          )}
        </div>
        {data.icon && <span style={{ fontSize: 20 }}>{data.icon}</span>}
      </div>
      {data.description && (
        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
          {data.description}
        </Text>
      )}
    </div>
  );
};

// Custom Edge Component for Transitions
const TransitionEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        strokeWidth={selected ? 3 : 2}
        stroke={selected ? '#1890ff' : data?.color || '#b1b1b7'}
        markerEnd="url(#arrowhead)"
      />
      {data?.label && (
        <foreignObject
          width={120}
          height={40}
          x={labelX - 60}
          y={labelY - 20}
          className="edgebutton-foreignobject"
          requiredExtensions="http://www.w3.org/1999/xhtml"
        >
          <div
            style={{
              backgroundColor: '#fff',
              border: '1px solid #d9d9d9',
              borderRadius: 4,
              padding: '4px 8px',
              fontSize: 12,
              textAlign: 'center',
              boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
            }}
          >
            {data.label}
            {data.has_guards && <Badge count="G" style={{ marginLeft: 4, backgroundColor: '#faad14' }} />}
            {data.has_webhooks && <Badge count="W" style={{ marginLeft: 4, backgroundColor: '#52c41a' }} />}
          </div>
        </foreignObject>
      )}
    </>
  );
};

const nodeTypes = {
  stateNode: StateNode,
};

const edgeTypes = {
  transitionEdge: TransitionEdge,
};

interface BlueprintEditorPageProps {}

export const BlueprintEditorPage: React.FC<BlueprintEditorPageProps> = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  // Blueprint metadata
  const [blueprintName, setBlueprintName] = useState(t('blueprintEditor.newBlueprint'));
  const [blueprintDescription, setBlueprintDescription] = useState('');
  const [entityType, setEntityType] = useState('work_order');

  // React Flow states
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);

  // UI states
  const [showAddStateModal, setShowAddStateModal] = useState(false);
  const [showTransitionDrawer, setShowTransitionDrawer] = useState(false);
  const [showSimulationModal, setShowSimulationModal] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [currentState, setCurrentState] = useState<string | null>(null);
  const [simulationHistory, setSimulationHistory] = useState<string[]>([]);

  // Load blueprint if editing existing one
  useEffect(() => {
    if (id && id !== 'new') {
      // Load blueprint from API
      loadBlueprint(id);
    }
  }, [id]);

  const loadBlueprint = async (blueprintId: string) => {
    try {
      // Mock loading - in production, fetch from API
      const mockBlueprint = {
        name: 'Work Order Workflow',
        description: 'Standard work order state machine',
        entity_type: 'work_order',
        states: [
          { id: '1', label: 'New', color: '#52c41a', is_initial: true, position: { x: 100, y: 100 } },
          { id: '2', label: 'In Progress', color: '#1890ff', position: { x: 300, y: 100 } },
          { id: '3', label: 'Completed', color: '#722ed1', is_final: true, position: { x: 500, y: 100 } },
          { id: '4', label: 'Cancelled', color: '#ff4d4f', is_final: true, position: { x: 300, y: 250 } },
        ],
        transitions: [
          { id: 'e1-2', source: '1', target: '2', label: 'Start Work', guards: ['has_technician'] },
          { id: 'e2-3', source: '2', target: '3', label: 'Complete', guards: ['all_items_done'] },
          { id: 'e1-4', source: '1', target: '4', label: 'Cancel' },
          { id: 'e2-4', source: '2', target: '4', label: 'Cancel' },
        ],
      };

      setBlueprintName(mockBlueprint.name);
      setBlueprintDescription(mockBlueprint.description);
      setEntityType(mockBlueprint.entity_type);

      // Convert to React Flow format
      const flowNodes = mockBlueprint.states.map((state) => ({
        id: state.id,
        type: 'stateNode',
        position: state.position,
        data: {
          label: state.label,
          color: state.color,
          is_initial: state.is_initial,
          is_final: state.is_final,
        },
      }));

      const flowEdges = mockBlueprint.transitions.map((transition) => ({
        id: transition.id,
        source: transition.source,
        target: transition.target,
        type: 'transitionEdge',
        data: {
          label: transition.label,
          guards: transition.guards,
          has_guards: transition.guards && transition.guards.length > 0,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
        },
      }));

      setNodes(flowNodes);
      setEdges(flowEdges);
    } catch (error) {
      message.error(t('blueprintEditor.errorLoadBlueprint'));
    }
  };

  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge = {
        ...params,
        type: 'transitionEdge',
        data: { label: 'New Transition' },
        markerEnd: {
          type: MarkerType.ArrowClosed,
        },
      };
      setEdges((eds) => addEdge(newEdge as Edge, eds));
    },
    [setEdges]
  );

  const handleAddState = () => {
    form.validateFields().then((values) => {
      const newNode: Node = {
        id: `state-${Date.now()}`,
        type: 'stateNode',
        position: { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 },
        data: {
          label: values.name,
          description: values.description,
          color: values.color || '#d9d9d9',
          is_initial: values.is_initial || false,
          is_final: values.is_final || false,
          icon: values.icon,
        },
      };

      setNodes((nds) => [...nds, newNode]);
      setShowAddStateModal(false);
      form.resetFields();
      message.success(t('blueprintEditor.successStateAdded'));
    });
  };

  const handleNodeClick = (event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    setSelectedEdge(null);
  };

  const handleEdgeClick = (event: React.MouseEvent, edge: Edge) => {
    setSelectedEdge(edge);
    setSelectedNode(null);
    setShowTransitionDrawer(true);
  };

  const handleDeleteSelected = () => {
    if (selectedNode) {
      setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
      setEdges((eds) => eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id));
      setSelectedNode(null);
      message.success(t('blueprintEditor.successStateDeleted'));
    } else if (selectedEdge) {
      setEdges((eds) => eds.filter((e) => e.id !== selectedEdge.id));
      setSelectedEdge(null);
      setShowTransitionDrawer(false);
      message.success(t('blueprintEditor.successTransitionDeleted'));
    }
  };

  const handleSaveBlueprint = async () => {
    try {
      const blueprintData = {
        name: blueprintName,
        description: blueprintDescription,
        entity_type: entityType,
        definition: {
          states: nodes.map((node) => ({
            id: node.id,
            name: node.data.label,
            description: node.data.description,
            color: node.data.color,
            is_initial: node.data.is_initial,
            is_final: node.data.is_final,
            position: node.position,
          })),
          transitions: edges.map((edge) => ({
            id: edge.id,
            from_state_id: edge.source,
            to_state_id: edge.target,
            name: edge.data?.label || 'Transition',
            guards: edge.data?.guards || [],
            required_fields: edge.data?.required_fields || [],
            webhooks: edge.data?.webhooks || [],
          })),
        },
      };

      // In production, save to API
      console.log('Saving blueprint:', blueprintData);
      message.success(t('blueprintEditor.successBlueprintSaved'));
    } catch (error) {
      message.error(t('blueprintEditor.errorSaveBlueprint'));
    }
  };

  const handleStartSimulation = () => {
    const initialState = nodes.find((n) => n.data.is_initial);
    if (!initialState) {
      message.error(t('blueprintEditor.errorNoInitialState'));
      return;
    }

    setCurrentState(initialState.id);
    setSimulationHistory([initialState.data.label]);
    setIsSimulating(true);
    setShowSimulationModal(true);
    message.success(t('blueprintEditor.successSimulationStarted', { state: initialState.data.label }));
  };

  const handleSimulateTransition = (transitionId: string) => {
    const edge = edges.find((e) => e.id === transitionId);
    if (!edge) return;

    const targetNode = nodes.find((n) => n.id === edge.target);
    if (!targetNode) return;

    // Check guards (simplified)
    if (edge.data?.guards && edge.data.guards.length > 0) {
      Modal.confirm({
        title: t('blueprintEditor.guardValidation'),
        content: t('blueprintEditor.guardWarning', { guards: edge.data.guards.join(', ') }),
        onOk: () => {
          executeTransition(targetNode, edge.data?.label);
        },
      });
    } else {
      executeTransition(targetNode, edge.data?.label);
    }
  };

  const executeTransition = (targetNode: Node, transitionLabel?: string) => {
    setCurrentState(targetNode.id);
    setSimulationHistory((history) => [
      ...history,
      `→ ${transitionLabel || t('blueprintEditor.transition')} → ${targetNode.data.label}`,
    ]);

    if (targetNode.data.is_final) {
      message.success(t('blueprintEditor.reachedFinalState', { state: targetNode.data.label }));
    }
  };

  const handleExportBlueprint = () => {
    const blueprintData = {
      name: blueprintName,
      description: blueprintDescription,
      entity_type: entityType,
      nodes,
      edges,
    };

    const dataStr = JSON.stringify(blueprintData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${blueprintName.replace(/\s+/g, '_')}.json`;
    link.click();
    message.success(t('blueprintEditor.successBlueprintExported'));
  };

  const availableTransitions = edges.filter((e) => e.source === currentState);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Card
        style={{ borderRadius: 0 }}
        bodyStyle={{ padding: '12px 24px' }}
      >
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/blueprints')}>
              {t('blueprintEditor.back')}
            </Button>
            <Divider type="vertical" />
            <Input
              value={blueprintName}
              onChange={(e) => setBlueprintName(e.target.value)}
              style={{ width: 300, fontWeight: 'bold' }}
              placeholder={t('blueprintEditor.blueprintNamePlaceholder')}
            />
            <Select value={entityType} onChange={setEntityType} style={{ width: 150 }}>
              <Option value="work_order">{t('blueprintEditor.entityTypes.workOrder')}</Option>
              <Option value="service_appointment">{t('blueprintEditor.entityTypes.appointment')}</Option>
              <Option value="estimate">{t('blueprintEditor.entityTypes.estimate')}</Option>
              <Option value="invoice">{t('blueprintEditor.entityTypes.invoice')}</Option>
              <Option value="service_request">{t('blueprintEditor.entityTypes.serviceRequest')}</Option>
            </Select>
          </Space>

          <Space>
            <Button icon={<PlayCircleOutlined />} onClick={handleStartSimulation} type="dashed">
              {t('blueprintEditor.test')}
            </Button>
            <Button icon={<ExportOutlined />} onClick={handleExportBlueprint}>
              {t('blueprintEditor.export')}
            </Button>
            <Button
              icon={<DeleteOutlined />}
              danger
              onClick={handleDeleteSelected}
              disabled={!selectedNode && !selectedEdge}
            >
              {t('blueprintEditor.delete')}
            </Button>
            <Button icon={<SaveOutlined />} type="primary" onClick={handleSaveBlueprint}>
              {t('blueprintEditor.saveBlueprint')}
            </Button>
          </Space>
        </Space>
      </Card>

      {/* Main Editor Area */}
      <div style={{ flex: 1, position: 'relative' }} ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={handleNodeClick}
          onEdgeClick={handleEdgeClick}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          attributionPosition="bottom-left"
        >
          <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
          <Controls />
          <MiniMap
            nodeColor={(node) => {
              return node.data.color || '#d9d9d9';
            }}
          />
          <Panel position="top-left">
            <Card size="small" style={{ width: 250 }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button
                  icon={<PlusOutlined />}
                  block
                  onClick={() => setShowAddStateModal(true)}
                >
                  {t('blueprintEditor.addState')}
                </Button>
                <Divider style={{ margin: '8px 0' }} />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  <ApartmentOutlined /> {nodes.length} {t('blueprintEditor.states')}, {edges.length} {t('blueprintEditor.transitions')}
                </Text>
              </Space>
            </Card>
          </Panel>

          {selectedNode && (
            <Panel position="top-right">
              <Card size="small" title={t('blueprintEditor.stateProperties')} style={{ width: 300 }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div>
                    <Text strong>{t('blueprintEditor.name')}:</Text>
                    <Input
                      value={selectedNode.data.label}
                      onChange={(e) => {
                        setNodes((nds) =>
                          nds.map((n) =>
                            n.id === selectedNode.id
                              ? { ...n, data: { ...n.data, label: e.target.value } }
                              : n
                          )
                        );
                      }}
                    />
                  </div>
                  <div>
                    <Text strong>{t('blueprintEditor.color')}:</Text>
                    <Input
                      type="color"
                      value={selectedNode.data.color}
                      onChange={(e) => {
                        setNodes((nds) =>
                          nds.map((n) =>
                            n.id === selectedNode.id
                              ? { ...n, data: { ...n.data, color: e.target.value } }
                              : n
                          )
                        );
                      }}
                    />
                  </div>
                  <div>
                    <Space>
                      <Switch
                        checked={selectedNode.data.is_initial}
                        onChange={(checked) => {
                          setNodes((nds) =>
                            nds.map((n) =>
                              n.id === selectedNode.id
                                ? { ...n, data: { ...n.data, is_initial: checked } }
                                : { ...n, data: { ...n.data, is_initial: false } }
                            )
                          );
                        }}
                      />
                      <Text>{t('blueprintEditor.initialState')}</Text>
                    </Space>
                  </div>
                  <div>
                    <Space>
                      <Switch
                        checked={selectedNode.data.is_final}
                        onChange={(checked) => {
                          setNodes((nds) =>
                            nds.map((n) =>
                              n.id === selectedNode.id
                                ? { ...n, data: { ...n.data, is_final: checked } }
                                : n
                            )
                          );
                        }}
                      />
                      <Text>{t('blueprintEditor.finalState')}</Text>
                    </Space>
                  </div>
                </Space>
              </Card>
            </Panel>
          )}
        </ReactFlow>
      </div>

      {/* Add State Modal */}
      <Modal
        title={t('blueprintEditor.addNewState')}
        open={showAddStateModal}
        onOk={handleAddState}
        onCancel={() => {
          setShowAddStateModal(false);
          form.resetFields();
        }}
        width={500}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label={t('blueprintEditor.stateName')}
            rules={[{ required: true, message: t('blueprintEditor.errorEnterStateName') }]}
          >
            <Input placeholder={t('blueprintEditor.stateNamePlaceholder')} />
          </Form.Item>

          <Form.Item name="description" label={t('blueprintEditor.description')}>
            <TextArea rows={3} placeholder={t('blueprintEditor.descriptionPlaceholder')} />
          </Form.Item>

          <Form.Item name="color" label={t('blueprintEditor.color')} initialValue="#1890ff">
            <Input type="color" />
          </Form.Item>

          <Form.Item name="is_initial" valuePropName="checked">
            <Switch /> {t('blueprintEditor.initialState')}
          </Form.Item>

          <Form.Item name="is_final" valuePropName="checked">
            <Switch /> {t('blueprintEditor.finalState')}
          </Form.Item>
        </Form>
      </Modal>

      {/* Transition Configuration Drawer */}
      {selectedEdge && (
        <TransitionConfigDrawer
          edge={selectedEdge}
          open={showTransitionDrawer}
          onClose={() => setShowTransitionDrawer(false)}
          onUpdate={(updatedData) => {
            setEdges((eds) =>
              eds.map((e) =>
                e.id === selectedEdge.id
                  ? { ...e, data: { ...e.data, ...updatedData } }
                  : e
              )
            );
            message.success(t('blueprintEditor.successTransitionDeleted'));
          }}
        />
      )}

      {/* Simulation Modal */}
      <Modal
        title={t('blueprintEditor.simulationTitle')}
        open={showSimulationModal}
        onCancel={() => {
          setShowSimulationModal(false);
          setIsSimulating(false);
          setCurrentState(null);
          setSimulationHistory([]);
        }}
        footer={[
          <Button
            key="reset"
            onClick={() => {
              handleStartSimulation();
            }}
          >
            {t('blueprintEditor.reset')}
          </Button>,
          <Button
            key="close"
            type="primary"
            onClick={() => {
              setShowSimulationModal(false);
              setIsSimulating(false);
            }}
          >
            {t('blueprintEditor.close')}
          </Button>,
        ]}
        width={600}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Alert
            message={t('blueprintEditor.simulationMode')}
            description={t('blueprintEditor.simulationDesc')}
            type="info"
            showIcon
          />

          <Card size="small" title={t('blueprintEditor.currentState')}>
            <Tag color="blue" style={{ fontSize: 16, padding: '8px 16px' }}>
              {nodes.find((n) => n.id === currentState)?.data.label || 'N/A'}
            </Tag>
          </Card>

          <Card size="small" title={t('blueprintEditor.availableTransitions')}>
            <Space direction="vertical" style={{ width: '100%' }}>
              {availableTransitions.length > 0 ? (
                availableTransitions.map((edge) => {
                  const targetNode = nodes.find((n) => n.id === edge.target);
                  return (
                    <Button
                      key={edge.id}
                      block
                      onClick={() => handleSimulateTransition(edge.id)}
                      icon={edge.data?.has_guards ? <BugOutlined /> : null}
                    >
                      {edge.data?.label} → {targetNode?.data.label}
                    </Button>
                  );
                })
              ) : (
                <Text type="secondary">{t('blueprintEditor.noTransitions')}</Text>
              )}
            </Space>
          </Card>

          <Card size="small" title={t('blueprintEditor.transitionHistory')}>
            <div style={{ maxHeight: 200, overflowY: 'auto' }}>
              {simulationHistory.map((item, index) => (
                <div key={index} style={{ padding: '4px 0' }}>
                  <Text>
                    {index + 1}. {item}
                  </Text>
                </div>
              ))}
            </div>
          </Card>
        </Space>
      </Modal>

      {/* SVG Marker for arrows */}
      <svg style={{ position: 'absolute', top: 0, left: 0 }}>
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M0,0 L0,6 L9,3 z" fill="#b1b1b7" />
          </marker>
        </defs>
      </svg>
    </div>
  );
};

// Transition Configuration Drawer Component
interface TransitionConfigDrawerProps {
  edge: Edge;
  open: boolean;
  onClose: () => void;
  onUpdate: (data: any) => void;
}

const TransitionConfigDrawer: React.FC<TransitionConfigDrawerProps> = ({
  edge,
  open,
  onClose,
  onUpdate,
}) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();

  useEffect(() => {
    if (open && edge) {
      form.setFieldsValue({
        label: edge.data?.label || '',
        guards: edge.data?.guards || [],
        required_fields: edge.data?.required_fields || [],
        webhooks: edge.data?.webhooks || [],
        auto_execute: edge.data?.auto_execute || false,
      });
    }
  }, [open, edge, form]);

  const handleSave = () => {
    form.validateFields().then((values) => {
      onUpdate({
        ...values,
        has_guards: values.guards && values.guards.length > 0,
        has_webhooks: values.webhooks && values.webhooks.length > 0,
      });
      onClose();
    });
  };

  return (
    <Drawer
      title={t('blueprintEditor.transitionConfig')}
      placement="right"
      width={500}
      open={open}
      onClose={onClose}
      extra={
        <Space>
          <Button onClick={onClose}>{t('blueprintEditor.cancel')}</Button>
          <Button type="primary" onClick={handleSave}>
            {t('blueprintEditor.save')}
          </Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="label"
          label={t('blueprintEditor.transitionName')}
          rules={[{ required: true, message: t('blueprintEditor.errorEnterTransitionName') }]}
        >
          <Input placeholder={t('blueprintEditor.transitionPlaceholder')} />
        </Form.Item>

        <Divider>{t('blueprintEditor.guardsValidation')}</Divider>

        <Form.Item
          name="guards"
          label={t('blueprintEditor.guardsConditions')}
          tooltip={t('blueprintEditor.guardsTooltip')}
        >
          <Select
            mode="tags"
            placeholder={t('blueprintEditor.addGuardsPlaceholder')}
            options={[
              { value: 'has_technician', label: t('blueprintEditor.guards.hasTechnician') },
              { value: 'has_location', label: t('blueprintEditor.guards.hasLocation') },
              { value: 'all_items_done', label: t('blueprintEditor.guards.allItemsDone') },
              { value: 'payment_received', label: t('blueprintEditor.guards.paymentReceived') },
              { value: 'customer_approval', label: t('blueprintEditor.guards.customerApproval') },
            ]}
          />
        </Form.Item>

        <Form.Item
          name="required_fields"
          label={t('blueprintEditor.requiredFields')}
          tooltip={t('blueprintEditor.requiredFieldsTooltip')}
        >
          <Select
            mode="tags"
            placeholder={t('blueprintEditor.requiredFieldsPlaceholder')}
            options={[
              { value: 'completion_notes', label: t('blueprintEditor.fields.completionNotes') },
              { value: 'technician_signature', label: t('blueprintEditor.fields.technicianSignature') },
              { value: 'customer_signature', label: t('blueprintEditor.fields.customerSignature') },
              { value: 'photos', label: t('blueprintEditor.fields.photos') },
              { value: 'parts_used', label: t('blueprintEditor.fields.partsUsed') },
            ]}
          />
        </Form.Item>

        <Divider>{t('blueprintEditor.webhooksActions')}</Divider>

        <Form.Item
          name="webhooks"
          label={t('blueprintEditor.webhookUrls')}
          tooltip={t('blueprintEditor.webhookTooltip')}
        >
          <Select
            mode="tags"
            placeholder={t('blueprintEditor.addWebhooksPlaceholder')}
          />
        </Form.Item>

        <Form.Item name="auto_execute" valuePropName="checked">
          <Switch /> {t('blueprintEditor.autoExecuteLabel')}
        </Form.Item>

        <Alert
          message={t('blueprintEditor.transitionLogic')}
          description={
            <div>
              <p>{t('blueprintEditor.transitionExecutesWhen')}</p>
              <ul>
                <li>{t('blueprintEditor.allGuardsTrue')}</li>
                <li>{t('blueprintEditor.allRequiredFieldsFilled')}</li>
                <li>{t('blueprintEditor.hasPermission')}</li>
              </ul>
            </div>
          }
          type="info"
          showIcon
          style={{ marginTop: 16 }}
        />
      </Form>
    </Drawer>
  );
};