import { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Tabs,
  Button,
  Input,
  Select,
  Switch,
  Badge,
  Tag,
  Space,
  Spin,
  Alert,
  Modal,
  Form,
  TimePicker,
  Table,
  Tooltip,
  Typography,
  Row,
  Col,
  Divider,
  message,
} from 'antd';
import {
  WhatsAppOutlined,
  QrcodeOutlined,
  ApiOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  SettingOutlined,
  MessageOutlined,
  TeamOutlined,
  GlobalOutlined,
  SafetyOutlined,
  ThunderboltOutlined,
  LinkOutlined,
  DisconnectOutlined,
  ReloadOutlined,
  CopyOutlined,
  EyeOutlined,
  PhoneOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import PageHeader from '@/components/common/PageHeader';
import {
  whatsappApi,
  type WhatsAppChannel,
  type WhatsAppConversation,
  type QrCodeInfo,
  type UpsertChannelPayload,
} from '@/api/whatsapp.api';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Text, Title, Paragraph } = Typography;

// ── Status badge helper ─────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  const config: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
    connected: {
      color: '#52c41a',
      icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      label: t('whatsapp.statusConnected'),
    },
    pending: {
      color: '#faad14',
      icon: <SyncOutlined spin style={{ color: '#faad14' }} />,
      label: t('whatsapp.statusPending'),
    },
    disconnected: {
      color: '#ff4d4f',
      icon: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
      label: t('whatsapp.statusDisconnected'),
    },
  };

  const c = config[status] || config.disconnected;
  return (
    <Space>
      {c.icon}
      <Text strong style={{ color: c.color }}>{c.label}</Text>
    </Space>
  );
}

// ── Connection Method Cards ─────────────────────────────────────────────────

function ConnectionMethodSelector({
  selected,
  onSelect,
}: {
  selected: 'twilio_qr' | 'business_api';
  onSelect: (method: 'twilio_qr' | 'business_api') => void;
}) {
  const { t } = useTranslation();
  const methods = [
    {
      key: 'twilio_qr' as const,
      icon: <QrcodeOutlined style={{ fontSize: 36, color: '#25D366' }} />,
      title: t('whatsapp.twilioTitle'),
      description: t('whatsapp.twilioDescription'),
      badge: t('whatsapp.recommended'),
    },
    {
      key: 'business_api' as const,
      icon: <ApiOutlined style={{ fontSize: 36, color: '#0088cc' }} />,
      title: t('whatsapp.businessApiTitle'),
      description: t('whatsapp.businessApiDescription'),
      badge: t('whatsapp.advanced'),
    },
  ];

  return (
    <Row gutter={[20, 20]}>
      {methods.map((m) => (
        <Col xs={24} md={12} key={m.key}>
          <Card
            hoverable
            onClick={() => onSelect(m.key)}
            style={{
              borderColor: selected === m.key ? '#25D366' : undefined,
              borderWidth: selected === m.key ? 2 : 1,
              background:
                selected === m.key
                  ? 'linear-gradient(135deg, rgba(37, 211, 102, 0.05), rgba(37, 211, 102, 0.02))'
                  : undefined,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
          >
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              {m.icon}
              <Title level={5} style={{ margin: '12px 0 4px' }}>{m.title}</Title>
              <Tag color={m.key === 'twilio_qr' ? 'green' : 'blue'}>{m.badge}</Tag>
              <Paragraph type="secondary" style={{ marginTop: 8, fontSize: 13 }}>
                {m.description}
              </Paragraph>
              {selected === m.key && (
                <CheckCircleOutlined style={{ fontSize: 20, color: '#25D366', marginTop: 8 }} />
              )}
            </div>
          </Card>
        </Col>
      ))}
    </Row>
  );
}

// ── Twilio Config Form ──────────────────────────────────────────────────────

function TwilioConfigForm({
  config,
  onChange,
  qrInfo,
  onLoadQr,
  loadingQr,
}: {
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
  qrInfo: QrCodeInfo | null;
  onLoadQr: () => void;
  loadingQr: boolean;
}) {
  const { t } = useTranslation();
  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Form.Item label={t('whatsapp.twilioSidLabel')}>
            <Input
              placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              value={(config.account_sid as string) || ''}
              onChange={(e) => onChange({ ...config, account_sid: e.target.value })}
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item label={t('whatsapp.twilioTokenLabel')}>
            <Input.Password
              placeholder={t('whatsapp.twilioTokenPlaceholder')}
              value={(config.auth_token as string) || ''}
              onChange={(e) => onChange({ ...config, auth_token: e.target.value })}
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item label={t('whatsapp.twilioNumberLabel')}>
            <Input
              placeholder="+14155238886 (sandbox default)"
              value={(config.twilio_number as string) || ''}
              onChange={(e) => onChange({ ...config, twilio_number: e.target.value })}
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item label={t('whatsapp.joinCodeLabel')}>
            <Input
              placeholder="join your-company"
              value={(config.join_code as string) || ''}
              onChange={(e) => onChange({ ...config, join_code: e.target.value })}
            />
          </Form.Item>
        </Col>
      </Row>

      <Divider>{t('whatsapp.customerQrCode')}</Divider>

      <div style={{ textAlign: 'center' }}>
        <Button
          icon={<QrcodeOutlined />}
          type="dashed"
          onClick={onLoadQr}
          loading={loadingQr}
          style={{ marginBottom: 16 }}
        >
          {t('whatsapp.generateQrCode')}
        </Button>

        {qrInfo && (
          <div>
            <div
              style={{
                display: 'inline-block',
                padding: 16,
                background: '#fff',
                borderRadius: 12,
                boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
                marginBottom: 16,
              }}
            >
              <img
                src={qrInfo.qr_url}
                alt="WhatsApp QR Code"
                style={{ width: 240, height: 240, borderRadius: 8 }}
              />
            </div>
            <div>
              <Text type="secondary">
                {t('whatsapp.scanInstruction')} <strong>{qrInfo.sandbox_number}</strong>
              </Text>
              <br />
              <Text code copyable>
                {qrInfo.join_code}
              </Text>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Meta Config Form ────────────────────────────────────────────────────────

function MetaConfigForm({
  config,
  onChange,
}: {
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
}) {
  const { t } = useTranslation();
  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} md={12}>
        <Form.Item label={t('whatsapp.metaAppIdLabel')}>
          <Input
            placeholder={t('whatsapp.metaAppIdPlaceholder')}
            value={(config.app_id as string) || ''}
            onChange={(e) => onChange({ ...config, app_id: e.target.value })}
          />
        </Form.Item>
      </Col>
      <Col xs={24} md={12}>
        <Form.Item label={t('whatsapp.appSecretLabel')}>
          <Input.Password
            placeholder={t('whatsapp.appSecretPlaceholder')}
            value={(config.app_secret as string) || ''}
            onChange={(e) => onChange({ ...config, app_secret: e.target.value })}
          />
        </Form.Item>
      </Col>
      <Col xs={24} md={12}>
        <Form.Item label={t('whatsapp.phoneNumberIdLabel')}>
          <Input
            placeholder="e.g. 123456789012345"
            value={(config.phone_number_id as string) || ''}
            onChange={(e) => onChange({ ...config, phone_number_id: e.target.value })}
          />
        </Form.Item>
      </Col>
      <Col xs={24} md={12}>
        <Form.Item label={t('whatsapp.accessTokenLabel')}>
          <Input.Password
            placeholder={t('whatsapp.accessTokenPlaceholder')}
            value={(config.access_token as string) || ''}
            onChange={(e) => onChange({ ...config, access_token: e.target.value })}
          />
        </Form.Item>
      </Col>
      <Col xs={24} md={12}>
        <Form.Item label={t('whatsapp.wabaIdLabel')}>
          <Input
            placeholder={t('whatsapp.wabaIdPlaceholder')}
            value={(config.waba_id as string) || ''}
            onChange={(e) => onChange({ ...config, waba_id: e.target.value })}
          />
        </Form.Item>
      </Col>
      <Col xs={24} md={12}>
        <Form.Item label={t('whatsapp.webhookTokenLabel')}>
          <Input
            placeholder={t('whatsapp.webhookTokenPlaceholder')}
            value={(config.verify_token as string) || ''}
            onChange={(e) => onChange({ ...config, verify_token: e.target.value })}
          />
        </Form.Item>
      </Col>
      <Col xs={24}>
        <Alert
          type="info"
          showIcon
          message={t('whatsapp.webhookUrl')}
          description={
            <span>
              {t('whatsapp.webhookInstruction')}{' '}
              <Text code copyable>
                {`${window.location.origin}/api/whatsapp/webhook/meta`}
              </Text>
            </span>
          }
        />
      </Col>
    </Row>
  );
}

// ── Main Page Component ─────────────────────────────────────────────────────

export default function WhatsAppChannelSettingsPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [loadingQr, setLoadingQr] = useState(false);
  const [channel, setChannel] = useState<WhatsAppChannel | null>(null);
  const [qrInfo, setQrInfo] = useState<QrCodeInfo | null>(null);
  const [conversations, setConversations] = useState<WhatsAppConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<WhatsAppConversation | null>(null);
  const [conversationModalOpen, setConversationModalOpen] = useState(false);

  // Form state
  const [connectionMethod, setConnectionMethod] = useState<'twilio_qr' | 'business_api'>('twilio_qr');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [twilioConfig, setTwilioConfig] = useState<Record<string, unknown>>({});
  const [metaConfig, setMetaConfig] = useState<Record<string, unknown>>({});
  const [greeting, setGreeting] = useState("Hi 👋 I'm your support assistant. Tell me what you need help with.");
  const [confirmation, setConfirmation] = useState('✅ Your service request has been created. Our team will contact you shortly.');
  const [workingHoursMode, setWorkingHoursMode] = useState<'24_7' | 'office_hours'>('24_7');
  const [officeHoursStart, setOfficeHoursStart] = useState('09:00');
  const [officeHoursEnd, setOfficeHoursEnd] = useState('18:00');
  const [timezone, setTimezone] = useState('Asia/Dubai');
  const [languages, setLanguages] = useState<string[]>(['en']);
  const [requiredFields, setRequiredFields] = useState<Record<string, boolean>>({
    name: true, location: true, category: true, photos: false, preferred_time: false,
  });
  const [defaultPriority, setDefaultPriority] = useState('MEDIUM');
  const [handoffTeam, setHandoffTeam] = useState('');
  const [isActive, setIsActive] = useState(false);

  // ── Load channel config ─────────────────────────────────────────────────────

  const loadChannel = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await whatsappApi.getChannel();
      const ch = data?.data;
      if (ch) {
        setChannel(ch);
        setConnectionMethod(ch.connection_method as 'twilio_qr' | 'business_api');
        setPhoneNumber(ch.phone_number || '');
        setDisplayName(ch.display_name || '');
        setTwilioConfig(ch.twilio_config || {});
        setMetaConfig(ch.meta_config || {});
        setGreeting(ch.greeting_message || '');
        setConfirmation(ch.confirmation_message || '');
        setWorkingHoursMode(ch.working_hours_mode as '24_7' | 'office_hours');
        setOfficeHoursStart((ch.office_hours as Record<string, string>)?.start || '09:00');
        setOfficeHoursEnd((ch.office_hours as Record<string, string>)?.end || '18:00');
        setTimezone((ch.office_hours as Record<string, string>)?.timezone || 'Asia/Dubai');
        setLanguages(ch.languages || ['en']);
        setRequiredFields(ch.required_fields || { name: true, location: true, category: true });
        setDefaultPriority(ch.default_priority || 'MEDIUM');
        setHandoffTeam(ch.handoff_team || '');
        setIsActive(ch.is_active);
      }
    } catch {
      // Channel not configured yet, that's fine
    } finally {
      setLoading(false);
    }
  }, []);

  const loadConversations = useCallback(async () => {
    try {
      const { data } = await whatsappApi.getConversations({ take: 50 });
      setConversations(data?.data?.data || []);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    void loadChannel();
    void loadConversations();
  }, [loadChannel, loadConversations]);

  // ── Save handler ────────────────────────────────────────────────────────────

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: UpsertChannelPayload = {
        connection_method: connectionMethod,
        phone_number: phoneNumber || undefined,
        display_name: displayName || undefined,
        twilio_config: connectionMethod === 'twilio_qr' ? twilioConfig : undefined,
        meta_config: connectionMethod === 'business_api' ? metaConfig : undefined,
        greeting_message: greeting,
        confirmation_message: confirmation,
        working_hours_mode: workingHoursMode,
        office_hours: { start: officeHoursStart, end: officeHoursEnd, timezone },
        languages,
        required_fields: requiredFields,
        default_priority: defaultPriority,
        handoff_team: handoffTeam || undefined,
        is_active: isActive,
      };

      const { data } = await whatsappApi.upsertChannel(payload);
      setChannel(data?.data || null);
      message.success(t('whatsapp.settingsSaved'));
    } catch (err: unknown) {
      message.error((err as Error)?.message || t('whatsapp.failedSave'));
    } finally {
      setSaving(false);
    }
  };

  // ── Test connection ─────────────────────────────────────────────────────────

  const handleTest = async () => {
    setTesting(true);
    try {
      const { data } = await whatsappApi.testConnection();
      const result = data?.data;
      if (result?.success) {
        message.success(result.message);
        void loadChannel();
      } else {
        message.warning(result?.message || t('whatsapp.testFailed'));
      }
    } catch (err: unknown) {
      message.error((err as Error)?.message || t('whatsapp.testFailed'));
    } finally {
      setTesting(false);
    }
  };

  // ── Disconnect ──────────────────────────────────────────────────────────────

  const handleDisconnect = async () => {
    try {
      await whatsappApi.disconnect();
      message.info(t('whatsapp.disconnected'));
      void loadChannel();
    } catch (err: unknown) {
      message.error((err as Error)?.message || t('whatsapp.failedDisconnect'));
    }
  };

  // ── Load QR ─────────────────────────────────────────────────────────────────

  const handleLoadQr = async () => {
    setLoadingQr(true);
    try {
      const { data } = await whatsappApi.getQrCode();
      setQrInfo(data?.data || null);
    } catch (err: unknown) {
      message.error((err as Error)?.message || t('whatsapp.failedLoadQr'));
    } finally {
      setLoadingQr(false);
    }
  };

  // ── View conversation ───────────────────────────────────────────────────────

  const handleViewConversation = async (conv: WhatsAppConversation) => {
    try {
      const { data } = await whatsappApi.getConversation(conv.id);
      setSelectedConversation(data?.data || null);
      setConversationModalOpen(true);
    } catch {
      message.error(t('whatsapp.failedLoadConversation'));
    }
  };

  // ── Loading state ───────────────────────────────────────────────────────────

  if (loading) {
    return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;
  }

  // ── Conversation columns ────────────────────────────────────────────────────

  const conversationColumns = [
    {
      title: t('whatsapp.columnPhone'),
      dataIndex: 'customer_phone',
      key: 'customer_phone',
      render: (phone: string) => (
        <Space>
          <PhoneOutlined />
          <Text>{phone}</Text>
        </Space>
      ),
    },
    {
      title: t('whatsapp.columnStatus'),
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors: Record<string, string> = {
          active: 'processing', completed: 'success', handed_off: 'warning',
          abandoned: 'default', draft: 'default',
        };
        return <Tag color={colors[status] || 'default'}>{status}</Tag>;
      },
    },
    {
      title: t('whatsapp.columnTicket'),
      dataIndex: 'service_request_id',
      key: 'service_request_id',
      render: (id: string | null) =>
        id ? <Tag color="green">{t('whatsapp.created')}</Tag> : <Tag>{t('whatsapp.pending')}</Tag>,
    },
    {
      title: t('whatsapp.columnLastMessage'),
      dataIndex: 'last_customer_message_at',
      key: 'last_customer_message_at',
      render: (d: string) => (d ? dayjs(d).format('MMM D, HH:mm') : '—'),
    },
    {
      title: t('whatsapp.columnActions'),
      key: 'actions',
      render: (_: unknown, record: WhatsAppConversation) => (
        <Button
          size="small"
          icon={<EyeOutlined />}
          onClick={() => void handleViewConversation(record)}
        >
          {t('whatsapp.view')}
        </Button>
      ),
    },
  ];

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div>
      <PageHeader
        title={t('whatsapp.pageTitle')}
        subtitle={t('whatsapp.pageSubtitle')}
      />

      {/* Connection Status Banner */}
      <Card
        style={{
          marginBottom: 24,
          background: 'linear-gradient(135deg, #f0fdf4, #ecfdf5)',
          border: '1px solid #bbf7d0',
        }}
      >
        <Row align="middle" justify="space-between">
          <Col>
            <Space size="large">
              <WhatsAppOutlined style={{ fontSize: 40, color: '#25D366' }} />
              <div>
                <Title level={4} style={{ margin: 0 }}>
                  {displayName || t('whatsapp.defaultDisplayName')}
                </Title>
                <StatusBadge status={channel?.status || 'disconnected'} />
                {phoneNumber && (
                  <Text type="secondary" style={{ marginLeft: 12 }}>
                    {phoneNumber}
                  </Text>
                )}
              </div>
            </Space>
          </Col>
          <Col>
            <Space>
              <Switch
                checked={isActive}
                onChange={setIsActive}
                checkedChildren={t('whatsapp.active')}
                unCheckedChildren={t('whatsapp.inactive')}
              />
              <Button
                icon={<ThunderboltOutlined />}
                onClick={() => void handleTest()}
                loading={testing}
                disabled={!channel}
              >
                {t('whatsapp.testButton')}
              </Button>
              {channel?.status === 'connected' && (
                <Button
                  icon={<DisconnectOutlined />}
                  danger
                  onClick={() => void handleDisconnect()}
                >
                  {t('whatsapp.disconnectButton')}
                </Button>
              )}
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Main Config Tabs */}
      <Card>
        <Tabs
          defaultActiveKey="connection"
          items={[
            {
              key: 'connection',
              label: (
                <span>
                  <LinkOutlined /> {t('whatsapp.tabConnection')}
                </span>
              ),
              children: (
                <div>
                  <Title level={5}>{t('whatsapp.connectionMethod')}</Title>
                  <Paragraph type="secondary" style={{ marginBottom: 20 }}>
                    {t('whatsapp.connectionMethodDescription')}
                  </Paragraph>

                  <ConnectionMethodSelector
                    selected={connectionMethod}
                    onSelect={setConnectionMethod}
                  />

                  <Divider />

                  <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
                    <Col xs={24} md={12}>
                      <Form.Item label={t('whatsapp.displayNameLabel')}>
                        <Input
                          placeholder="e.g. FieldForce HVAC Support"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          prefix={<WhatsAppOutlined style={{ color: '#25D366' }} />}
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item label={t('whatsapp.businessNumberLabel')}>
                        <Input
                          placeholder="+971 50 123 4567"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          prefix={<PhoneOutlined />}
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  {connectionMethod === 'twilio_qr' ? (
                    <TwilioConfigForm
                      config={twilioConfig}
                      onChange={setTwilioConfig}
                      qrInfo={qrInfo}
                      onLoadQr={() => void handleLoadQr()}
                      loadingQr={loadingQr}
                    />
                  ) : (
                    <MetaConfigForm config={metaConfig} onChange={setMetaConfig} />
                  )}
                </div>
              ),
            },
            {
              key: 'messages',
              label: (
                <span>
                  <MessageOutlined /> {t('whatsapp.tabMessages')}
                </span>
              ),
              children: (
                <div>
                  <Form.Item label={t('whatsapp.greetingLabel')}>
                    <TextArea
                      rows={3}
                      value={greeting}
                      onChange={(e) => setGreeting(e.target.value)}
                      placeholder="Hi 👋 I'm your support assistant. Tell me what you need help with."
                    />
                  </Form.Item>

                  <Form.Item label={t('whatsapp.confirmationLabel')}>
                    <TextArea
                      rows={3}
                      value={confirmation}
                      onChange={(e) => setConfirmation(e.target.value)}
                      placeholder="✅ Your service request has been created. Our team will contact you shortly."
                    />
                  </Form.Item>

                  <Alert
                    type="info"
                    showIcon
                    message={t('whatsapp.placeholderInfo')}
                    style={{ marginTop: 12 }}
                  />
                </div>
              ),
            },
            {
              key: 'intake',
              label: (
                <span>
                  <SettingOutlined /> {t('whatsapp.tabIntake')}
                </span>
              ),
              children: (
                <div>
                  <Paragraph type="secondary" style={{ marginBottom: 20 }}>
                    {t('whatsapp.intakeDescription')}
                  </Paragraph>

                  <Row gutter={[16, 16]}>
                    {Object.entries({
                      name: t('whatsapp.fieldCustomerName'),
                      location: t('whatsapp.fieldLocation'),
                      category: t('whatsapp.fieldCategory'),
                      photos: t('whatsapp.fieldPhotos'),
                      preferred_time: t('whatsapp.fieldPreferredTime'),
                    }).map(([key, label]) => (
                      <Col xs={24} sm={12} md={8} key={key}>
                        <Card size="small" style={{ borderRadius: 8 }}>
                          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                            <Text>{label}</Text>
                            <Switch
                              checked={requiredFields[key] ?? false}
                              onChange={(checked) =>
                                setRequiredFields((prev) => ({ ...prev, [key]: checked }))
                              }
                            />
                          </Space>
                        </Card>
                      </Col>
                    ))}
                  </Row>

                  <Divider />

                  <Row gutter={[16, 16]}>
                    <Col xs={24} md={12}>
                      <Form.Item label={t('whatsapp.defaultPriorityLabel')}>
                        <Select
                          value={defaultPriority}
                          onChange={setDefaultPriority}
                          options={[
                            { value: 'LOW', label: t('whatsapp.priorityLow') },
                            { value: 'MEDIUM', label: t('whatsapp.priorityMedium') },
                            { value: 'HIGH', label: t('whatsapp.priorityHigh') },
                            { value: 'CRITICAL', label: t('whatsapp.priorityCritical') },
                          ]}
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item label={t('whatsapp.handoffTeamLabel')}>
                        <Input
                          placeholder="e.g. Support Team"
                          value={handoffTeam}
                          onChange={(e) => setHandoffTeam(e.target.value)}
                          prefix={<TeamOutlined />}
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                </div>
              ),
            },
            {
              key: 'languages',
              label: (
                <span>
                  <GlobalOutlined /> {t('whatsapp.tabLanguagesHours')}
                </span>
              ),
              children: (
                <div>
                  <Form.Item label={t('whatsapp.supportedLanguagesLabel')}>
                    <Select
                      mode="multiple"
                      value={languages}
                      onChange={setLanguages}
                      placeholder={t('whatsapp.selectLanguages')}
                      options={[
                        { value: 'en', label: '🇬🇧 English' },
                        { value: 'ar', label: '🇦🇪 Arabic' },
                        { value: 'hi', label: '🇮🇳 Hindi' },
                        { value: 'ur', label: '🇵🇰 Urdu' },
                        { value: 'fr', label: '🇫🇷 French' },
                        { value: 'es', label: '🇪🇸 Spanish' },
                        { value: 'pt', label: '🇧🇷 Portuguese' },
                        { value: 'de', label: '🇩🇪 German' },
                        { value: 'zh', label: '🇨🇳 Chinese' },
                        { value: 'tl', label: '🇵🇭 Filipino' },
                      ]}
                    />
                  </Form.Item>

                  <Divider>{t('whatsapp.workingHoursDivider')}</Divider>

                  <Form.Item label={t('whatsapp.aiAvailabilityLabel')}>
                    <Select
                      value={workingHoursMode}
                      onChange={setWorkingHoursMode}
                      options={[
                        { value: '24_7', label: t('whatsapp.mode247') },
                        { value: 'office_hours', label: t('whatsapp.modeOfficeHours') },
                      ]}
                    />
                  </Form.Item>

                  {workingHoursMode === 'office_hours' && (
                    <Row gutter={[16, 16]}>
                      <Col xs={24} md={8}>
                        <Form.Item label={t('whatsapp.startTimeLabel')}>
                          <TimePicker
                            value={dayjs(officeHoursStart, 'HH:mm')}
                            format="HH:mm"
                            onChange={(_, timeStr) =>
                              setOfficeHoursStart(
                                typeof timeStr === 'string' ? timeStr : timeStr[0] || '09:00',
                              )
                            }
                            style={{ width: '100%' }}
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={8}>
                        <Form.Item label={t('whatsapp.endTimeLabel')}>
                          <TimePicker
                            value={dayjs(officeHoursEnd, 'HH:mm')}
                            format="HH:mm"
                            onChange={(_, timeStr) =>
                              setOfficeHoursEnd(
                                typeof timeStr === 'string' ? timeStr : timeStr[0] || '18:00',
                              )
                            }
                            style={{ width: '100%' }}
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={8}>
                        <Form.Item label={t('whatsapp.timezoneLabel')}>
                          <Select
                            value={timezone}
                            onChange={setTimezone}
                            showSearch
                            options={[
                              { value: 'Asia/Dubai', label: 'Asia/Dubai (UTC+4)' },
                              { value: 'Asia/Kolkata', label: 'Asia/Kolkata (UTC+5:30)' },
                              { value: 'Asia/Riyadh', label: 'Asia/Riyadh (UTC+3)' },
                              { value: 'Europe/London', label: 'Europe/London (UTC+0)' },
                              { value: 'America/New_York', label: 'America/New York (UTC-5)' },
                              { value: 'America/Los_Angeles', label: 'America/LA (UTC-8)' },
                            ]}
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                  )}
                </div>
              ),
            },
            {
              key: 'conversations',
              label: (
                <span>
                  <MessageOutlined /> {t('whatsapp.tabConversationLog')}
                </span>
              ),
              children: (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                    <Title level={5} style={{ margin: 0 }}>{t('whatsapp.recentConversations')}</Title>
                    <Button
                      icon={<ReloadOutlined />}
                      onClick={() => void loadConversations()}
                    >
                      {t('whatsapp.refresh')}
                    </Button>
                  </div>

                  <Table
                    dataSource={conversations}
                    columns={conversationColumns}
                    rowKey="id"
                    pagination={{ pageSize: 10 }}
                    locale={{ emptyText: t('whatsapp.noConversations') }}
                    size="middle"
                  />
                </div>
              ),
            },
          ]}
        />

        <Divider />

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <Button onClick={() => void loadChannel()}>{t('whatsapp.resetButton')}</Button>
          <Button
            type="primary"
            size="large"
            icon={<WhatsAppOutlined />}
            onClick={() => void handleSave()}
            loading={saving}
            style={{
              background: '#25D366',
              borderColor: '#25D366',
              fontWeight: 600,
            }}
          >
            {t('whatsapp.saveButton')}
          </Button>
        </div>
      </Card>

      {/* Conversation Detail Modal */}
      <Modal
        title={
          <Space>
            <WhatsAppOutlined style={{ color: '#25D366' }} />
            {t('whatsapp.conversationWith', { phone: selectedConversation?.customer_phone })}
          </Space>
        }
        open={conversationModalOpen}
        onCancel={() => setConversationModalOpen(false)}
        footer={null}
        width={600}
      >
        {selectedConversation?.messages && (
          <div
            style={{
              maxHeight: 400,
              overflowY: 'auto',
              padding: 12,
              background: '#f5f5f5',
              borderRadius: 8,
            }}
          >
            {selectedConversation.messages.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: msg.role === 'customer' ? 'flex-start' : 'flex-end',
                  marginBottom: 8,
                }}
              >
                <div
                  style={{
                    maxWidth: '80%',
                    padding: '8px 14px',
                    borderRadius: msg.role === 'customer' ? '4px 18px 18px 18px' : '18px 4px 18px 18px',
                    background: msg.role === 'customer' ? '#fff' : '#dcf8c6',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                  }}
                >
                  <Text style={{ fontSize: 13 }}>{msg.content}</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 10 }}>
                    {msg.role === 'customer' ? '👤' : '🤖'}{' '}
                    {dayjs(msg.timestamp).format('HH:mm')}
                  </Text>
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedConversation?.collected_data &&
          Object.keys(selectedConversation.collected_data).length > 0 && (
            <div style={{ marginTop: 16 }}>
              <Divider>{t('whatsapp.collectedData')}</Divider>
              {Object.entries(selectedConversation.collected_data).map(([key, value]) => (
                <div key={key} style={{ marginBottom: 4 }}>
                  <Text type="secondary">{key}: </Text>
                  <Text strong>{String(value)}</Text>
                </div>
              ))}
            </div>
          )}
      </Modal>
    </div>
  );
}