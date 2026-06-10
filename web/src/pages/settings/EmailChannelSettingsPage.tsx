import { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Tabs,
  Button,
  Input,
  Select,
  Switch,
  Tag,
  Space,
  Spin,
  Alert,
  Form,
  Row,
  Col,
  Divider,
  message,
  Typography,
} from 'antd';
import {
  MailOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  SettingOutlined,
  SafetyOutlined,
  ThunderboltOutlined,
  LinkOutlined,
  DisconnectOutlined,
  TeamOutlined,
  EditOutlined,
  FilterOutlined,
} from '@ant-design/icons';
import PageHeader from '@/components/common/PageHeader';
import {
  emailChannelApi,
  type EmailChannelConfig,
  type UpsertEmailChannelPayload,
} from '@/api/email-channel.api';
import { useTranslation } from 'react-i18next';

const { TextArea } = Input;
const { Text, Title, Paragraph } = Typography;

// ── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  const config: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
    receiving: {
      color: '#52c41a',
      icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      label: t('emailChannel.status.receiving'),
    },
    error: {
      color: '#faad14',
      icon: <SyncOutlined spin style={{ color: '#faad14' }} />,
      label: t('emailChannel.status.error'),
    },
    not_receiving: {
      color: '#ff4d4f',
      icon: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
      label: t('emailChannel.status.notReceiving'),
    },
  };

  const c = config[status] || config.not_receiving;
  return (
    <Space>
      {c.icon}
      <Text strong style={{ color: c.color }}>{c.label}</Text>
    </Space>
  );
}

// ── Connection Method Cards ──────────────────────────────────────────────────

function ConnectionMethodSelector({
  selected,
  onSelect,
}: {
  selected: 'forwarding' | 'platform_provided';
  onSelect: (method: 'forwarding' | 'platform_provided') => void;
}) {
  const { t } = useTranslation();
  const methods = [
    {
      key: 'forwarding' as const,
      icon: <MailOutlined style={{ fontSize: 36, color: '#1677ff' }} />,
      title: t('emailChannel.connection.forwardingTitle'),
      description: t('emailChannel.connection.forwardingDesc'),
      badge: t('emailChannel.connection.recommended'),
      badgeColor: 'blue',
    },
    {
      key: 'platform_provided' as const,
      icon: <ThunderboltOutlined style={{ fontSize: 36, color: '#13c2c2' }} />,
      title: t('emailChannel.connection.platformTitle'),
      description: t('emailChannel.connection.platformDesc'),
      badge: t('emailChannel.connection.easy'),
      badgeColor: 'cyan',
    },
  ];

  return (
    <Row gutter={[16, 16]}>
      {methods.map((m) => (
        <Col xs={24} md={12} key={m.key}>
          <Card
            hoverable
            onClick={() => onSelect(m.key)}
            style={{
              borderColor: selected === m.key ? '#1677ff' : undefined,
              borderWidth: selected === m.key ? 2 : 1,
              background:
                selected === m.key
                  ? 'linear-gradient(135deg, rgba(22, 119, 255, 0.05), rgba(22, 119, 255, 0.02))'
                  : undefined,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
          >
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              {m.icon}
              <Title level={5} style={{ margin: '12px 0 4px' }}>{m.title}</Title>
              <Tag color={m.badgeColor}>{m.badge}</Tag>
              <Paragraph type="secondary" style={{ marginTop: 8, fontSize: 13 }}>
                {m.description}
              </Paragraph>
              {selected === m.key && (
                <CheckCircleOutlined style={{ fontSize: 20, color: '#1677ff', marginTop: 8 }} />
              )}
            </div>
          </Card>
        </Col>
      ))}
    </Row>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function EmailChannelSettingsPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [channel, setChannel] = useState<EmailChannelConfig | null>(null);

  const [connectionMethod, setConnectionMethod] = useState<'forwarding' | 'platform_provided'>('forwarding');
  const [supportEmail, setSupportEmail] = useState('');
  const [platformEmail, setPlatformEmail] = useState('');
  const [replyFromName, setReplyFromName] = useState(t('emailChannel.defaults.supportTeam'));
  const [replyFromEmail, setReplyFromEmail] = useState('');
  const [ackTemplate, setAckTemplate] = useState(t('emailChannel.defaults.ackTemplate'));
  const [clarificationTemplate, setClarificationTemplate] = useState(t('emailChannel.defaults.clarifyTemplate'));
  const [categoryMapping, setCategoryMapping] = useState<string[]>(['General', 'Electrical', 'Plumbing', 'HVAC', 'IT', 'Cleaning', 'Other']);
  const [priorityRules, setPriorityRules] = useState<Record<string, unknown>>({
    keywords: { urgent: 'HIGH', emergency: 'CRITICAL', asap: 'HIGH', down: 'HIGH' },
  });
  const [defaultCategory, setDefaultCategory] = useState('General');
  const [defaultPriority, setDefaultPriority] = useState('MEDIUM');
  const [allowedSenders, setAllowedSenders] = useState<string[]>([]);
  const [blockedSenders, setBlockedSenders] = useState<string[]>(['no-reply@', 'noreply@', 'mailer-daemon@']);
  const [spamFilterEnabled, setSpamFilterEnabled] = useState(true);
  const [humanHandoffKeywords, setHumanHandoffKeywords] = useState<string[]>(['lawyer', 'legal', 'refund', 'sue', 'complaint']);
  const [handoffTeam, setHandoffTeam] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [webhookSecret, setWebhookSecret] = useState('');

  const [newCategory, setNewCategory] = useState('');
  const [newBlockedSender, setNewBlockedSender] = useState('');
  const [newAllowedSender, setNewAllowedSender] = useState('');
  const [newHandoffKeyword, setNewHandoffKeyword] = useState('');
  const [newPriorityKeyword, setNewPriorityKeyword] = useState('');
  const [newPriorityLevel, setNewPriorityLevel] = useState('HIGH');

  const loadChannel = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await emailChannelApi.getChannel();
      const ch = data?.data;
      if (ch) {
        setChannel(ch);
        setConnectionMethod(ch.connection_method as 'forwarding' | 'platform_provided');
        setSupportEmail(ch.support_email || '');
        setPlatformEmail(ch.platform_email || '');
        setReplyFromName(ch.reply_from_name || t('emailChannel.defaults.supportTeam'));
        setReplyFromEmail(ch.reply_from_email || '');
        setAckTemplate(ch.acknowledgement_template || '');
        setClarificationTemplate(ch.clarification_template || '');
        setCategoryMapping(ch.category_mapping || []);
        setPriorityRules(ch.priority_rules || { keywords: {} });
        setDefaultCategory(ch.default_category || 'General');
        setDefaultPriority(ch.default_priority || 'MEDIUM');
        setAllowedSenders(ch.allowed_senders || []);
        setBlockedSenders(ch.blocked_senders || []);
        setSpamFilterEnabled(ch.spam_filter_enabled ?? true);
        setHumanHandoffKeywords(ch.human_handoff_keywords || []);
        setHandoffTeam(ch.handoff_team || '');
        setIsActive(ch.is_active);
        setWebhookSecret(ch.webhook_secret || '');
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadChannel();
  }, [loadChannel]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: UpsertEmailChannelPayload = {
        connection_method: connectionMethod,
        support_email: supportEmail || undefined,
        platform_email: platformEmail || undefined,
        reply_from_name: replyFromName || undefined,
        reply_from_email: replyFromEmail || undefined,
        acknowledgement_template: ackTemplate,
        clarification_template: clarificationTemplate,
        category_mapping: categoryMapping,
        priority_rules: priorityRules,
        default_category: defaultCategory,
        default_priority: defaultPriority,
        allowed_senders: allowedSenders,
        blocked_senders: blockedSenders,
        spam_filter_enabled: spamFilterEnabled,
        human_handoff_keywords: humanHandoffKeywords,
        handoff_team: handoffTeam || undefined,
        is_active: isActive,
        webhook_secret: webhookSecret || undefined,
      };

      const { data } = await emailChannelApi.upsertChannel(payload);
      setChannel(data?.data || null);
      message.success(t('emailChannel.messages.saved'));
    } catch (err: unknown) {
      message.error((err as Error)?.message || t('emailChannel.messages.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const { data } = await emailChannelApi.testConnection();
      const result = data?.data;
      if (result?.success) {
        message.success(result.message);
        void loadChannel();
      } else {
        message.warning(result?.message || t('emailChannel.messages.testFailed'));
      }
    } catch (err: unknown) {
      message.error((err as Error)?.message || t('emailChannel.messages.testFailed'));
    } finally {
      setTesting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await emailChannelApi.disconnect();
      message.info(t('emailChannel.messages.disconnected'));
      void loadChannel();
    } catch (err: unknown) {
      message.error((err as Error)?.message || t('emailChannel.messages.disconnectFailed'));
    }
  };

  if (loading) {
    return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;
  }

  return (
    <div>
      <PageHeader
        title={t('emailChannel.title')}
        subtitle="Configure email integration rules and forwarding endpoints. Enable automated ticket classification, custom auto-replies, allowlist/blocklist senders, and keywords for human support handoff."
      />

      <Card
        style={{
          marginBottom: 24,
          background: 'linear-gradient(135deg, #eff6ff, #eef2ff)',
          border: '1px solid #bfdbfe',
        }}
      >
        <Row align="middle" justify="space-between">
          <Col>
            <Space size="large">
              <MailOutlined style={{ fontSize: 40, color: '#1677ff' }} />
              <div>
                <Title level={4} style={{ margin: 0 }}>
                  {supportEmail || t('emailChannel.defaults.supportLabel')}
                </Title>
                <StatusBadge status={channel?.status || 'not_receiving'} />
              </div>
            </Space>
          </Col>
          <Col>
            <Space>
              <Switch
                checked={isActive}
                onChange={setIsActive}
                checkedChildren={t('emailChannel.status.active')}
                unCheckedChildren={t('emailChannel.status.inactive')}
              />
              <Button
                icon={<ThunderboltOutlined />}
                onClick={() => void handleTest()}
                loading={testing}
                disabled={!channel}
              >
                {t('emailChannel.actions.test')}
              </Button>
              {channel?.status === 'receiving' && (
                <Button
                  icon={<DisconnectOutlined />}
                  danger
                  onClick={() => void handleDisconnect()}
                >
                  {t('emailChannel.actions.disconnect')}
                </Button>
              )}
            </Space>
          </Col>
        </Row>
      </Card>

      <Card>
        <Tabs
          defaultActiveKey="connection"
          items={[
            {
              key: 'connection',
              label: (
                <span>
                  <LinkOutlined /> {t('emailChannel.tabs.connection')}
                </span>
              ),
              children: (
                <div>
                  <Title level={5}>{t('emailChannel.connection.methodTitle')}</Title>
                  <Paragraph type="secondary" style={{ marginBottom: 20 }}>
                    {t('emailChannel.connection.methodDesc')}
                  </Paragraph>

                  <ConnectionMethodSelector
                    selected={connectionMethod}
                    onSelect={setConnectionMethod}
                  />

                  <Divider />

                  <Row gutter={[16, 16]}>
                    <Col xs={24} md={12}>
                      <Form.Item label={t('emailChannel.form.supportEmail')}>
                        <Input
                          placeholder={t('emailChannel.placeholders.email')}
                          value={supportEmail}
                          onChange={(e) => setSupportEmail(e.target.value)}
                          prefix={<MailOutlined style={{ color: '#1677ff' }} />}
                        />
                      </Form.Item>
                    </Col>
                    {connectionMethod === 'platform_provided' && (
                      <Col xs={24} md={12}>
                        <Form.Item label={t('emailChannel.form.platformAddress')}>
                          <Input
                            placeholder={t('emailChannel.placeholders.platformEmail')}
                            value={platformEmail}
                            onChange={(e) => setPlatformEmail(e.target.value)}
                          />
                        </Form.Item>
                      </Col>
                    )}
                    <Col xs={24} md={12}>
                      <Form.Item label={t('emailChannel.form.webhookSecret')}>
                        <Input.Password
                          placeholder={t('emailChannel.placeholders.webhookSecret')}
                          value={webhookSecret}
                          onChange={(e) => setWebhookSecret(e.target.value)}
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  {connectionMethod === 'forwarding' && (
                    <Alert
                      type="info"
                      showIcon
                      message={t('emailChannel.alerts.forwardingSetup')}
                      description={
                        <span>
                          {t('emailChannel.alerts.forwardingDescPart1')}{' '}
                          <Text code copyable>
                            {`${window.location.origin}/api/email-channel/webhook/inbound`}
                          </Text>
                          <br />
                          {t('emailChannel.alerts.forwardingDescPart2')}{' '}
                          <Text code copyable>
                            {`${window.location.origin}/api/email-channel/webhook/sendgrid`}
                          </Text>
                        </span>
                      }
                      style={{ marginTop: 16 }}
                    />
                  )}
                </div>
              ),
            },
            {
              key: 'replies',
              label: (
                <span>
                  <EditOutlined /> {t('emailChannel.tabs.replies')}
                </span>
              ),
              children: (
                <div>
                  <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
                    <Col xs={24} md={12}>
                      <Form.Item label={t('emailChannel.form.replyName')}>
                        <Input
                          placeholder={t('emailChannel.placeholders.replyName')}
                          value={replyFromName}
                          onChange={(e) => setReplyFromName(e.target.value)}
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item label={t('emailChannel.form.replyEmail')}>
                        <Input
                          placeholder={t('emailChannel.placeholders.email')}
                          value={replyFromEmail}
                          onChange={(e) => setReplyFromEmail(e.target.value)}
                          prefix={<MailOutlined />}
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item label={t('emailChannel.form.ackTemplate')}>
                    <TextArea
                      rows={5}
                      value={ackTemplate}
                      onChange={(e) => setAckTemplate(e.target.value)}
                    />
                  </Form.Item>

                  <Form.Item label={t('emailChannel.form.clarifyTemplate')}>
                    <TextArea
                      rows={4}
                      value={clarificationTemplate}
                      onChange={(e) => setClarificationTemplate(e.target.value)}
                    />
                  </Form.Item>

                  <Alert
                    type="info"
                    showIcon
                    message={t('emailChannel.placeholders.placeholdersInfo')}
                    style={{ marginTop: 8 }}
                  />
                </div>
              ),
            },
            {
              key: 'classification',
              label: (
                <span>
                  <SettingOutlined /> {t('emailChannel.tabs.ai')}
                </span>
              ),
              children: (
                <div>
                  <Title level={5}>{t('emailChannel.ai.categories')}</Title>
                  <Paragraph type="secondary">
                    {t('emailChannel.ai.categoriesDesc')}
                  </Paragraph>

                  <div style={{ marginBottom: 16 }}>
                    {categoryMapping.map((cat) => (
                      <Tag
                        key={cat}
                        closable
                        onClose={() => setCategoryMapping((prev) => prev.filter((c) => c !== cat))}
                        style={{ marginBottom: 4 }}
                      >
                        {cat}
                      </Tag>
                    ))}
                  </div>
                  <Space>
                    <Input
                      placeholder={t('emailChannel.placeholders.category')}
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      onPressEnter={() => {
                        if (newCategory.trim() && !categoryMapping.includes(newCategory.trim())) {
                          setCategoryMapping((prev) => [...prev, newCategory.trim()]);
                          setNewCategory('');
                        }
                      }}
                      style={{ width: 200 }}
                    />
                    <Button
                      type="dashed"
                      onClick={() => {
                        if (newCategory.trim() && !categoryMapping.includes(newCategory.trim())) {
                          setCategoryMapping((prev) => [...prev, newCategory.trim()]);
                          setNewCategory('');
                        }
                      }}
                    >
                      {t('emailChannel.actions.add')}
                    </Button>
                  </Space>

                  <Divider />

                  <Title level={5}>{t('emailChannel.ai.priorityRules')}</Title>
                  <Paragraph type="secondary">
                    {t('emailChannel.ai.priorityDesc')}
                  </Paragraph>

                  <div style={{ marginBottom: 16 }}>
                    {Object.entries(
                      (priorityRules.keywords as Record<string, string>) || {},
                    ).map(([keyword, level]) => (
                      <Tag
                        key={keyword}
                        closable
                        color={level === 'CRITICAL' ? 'red' : level === 'HIGH' ? 'orange' : 'blue'}
                        onClose={() => {
                          const keywords = { ...((priorityRules.keywords as Record<string, string>) || {}) };
                          delete keywords[keyword];
                          setPriorityRules({ ...priorityRules, keywords });
                        }}
                        style={{ marginBottom: 4 }}
                      >
                        "{keyword}" → {level}
                      </Tag>
                    ))}
                  </div>
                  <Space>
                    <Input
                      placeholder={t('emailChannel.placeholders.keyword')}
                      value={newPriorityKeyword}
                      onChange={(e) => setNewPriorityKeyword(e.target.value)}
                      style={{ width: 150 }}
                    />
                    <Select
                      value={newPriorityLevel}
                      onChange={setNewPriorityLevel}
                      style={{ width: 120 }}
                      options={[
                        { value: 'HIGH', label: 'HIGH' },
                        { value: 'CRITICAL', label: 'CRITICAL' },
                      ]}
                    />
                    <Button
                      type="dashed"
                      onClick={() => {
                        if (newPriorityKeyword.trim()) {
                          setPriorityRules({
                            ...priorityRules,
                            keywords: {
                              ...((priorityRules.keywords as Record<string, string>) || {}),
                              [newPriorityKeyword.trim().toLowerCase()]: newPriorityLevel,
                            },
                          });
                          setNewPriorityKeyword('');
                        }
                      }}
                    >
                      {t('emailChannel.actions.add')}
                    </Button>
                  </Space>

                  <Divider />

                  <Row gutter={[16, 16]}>
                    <Col xs={24} md={12}>
                      <Form.Item label={t('emailChannel.ai.defaultCategory')}>
                        <Select
                          value={defaultCategory}
                          onChange={setDefaultCategory}
                          options={categoryMapping.map((c) => ({ value: c, label: c }))}
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item label={t('emailChannel.ai.defaultPriority')}>
                        <Select
                          value={defaultPriority}
                          onChange={setDefaultPriority}
                          options={[
                            { value: 'LOW', label: t('emailChannel.priorities.low') },
                            { value: 'MEDIUM', label: t('emailChannel.priorities.medium') },
                            { value: 'HIGH', label: t('emailChannel.priorities.high') },
                            { value: 'CRITICAL', label: t('emailChannel.priorities.critical') },
                          ]}
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                </div>
              ),
            },
            {
              key: 'filtering',
              label: (
                <span>
                  <FilterOutlined /> {t('emailChannel.tabs.filtering')}
                </span>
              ),
              children: (
                <div>
                  <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
                    <Col xs={24}>
                      <Card size="small" style={{ borderRadius: 8 }}>
                        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                          <div>
                            <Text strong>{t('emailChannel.filtering.spamTitle')}</Text>
                            <br />
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {t('emailChannel.filtering.spamDesc')}
                            </Text>
                          </div>
                          <Switch
                            checked={spamFilterEnabled}
                            onChange={setSpamFilterEnabled}
                          />
                        </Space>
                      </Card>
                    </Col>
                  </Row>

                  <Title level={5}>{t('emailChannel.filtering.blockedTitle')}</Title>
                  <Paragraph type="secondary">
                    {t('emailChannel.filtering.blockedDesc')}
                  </Paragraph>
                  <div style={{ marginBottom: 12 }}>
                    {blockedSenders.map((sender) => (
                      <Tag
                        key={sender}
                        closable
                        color="red"
                        onClose={() => setBlockedSenders((prev) => prev.filter((s) => s !== sender))}
                        style={{ marginBottom: 4 }}
                      >
                        {sender}
                      </Tag>
                    ))}
                  </div>
                  <Space>
                    <Input
                      placeholder={t('emailChannel.placeholders.blocked')}
                      value={newBlockedSender}
                      onChange={(e) => setNewBlockedSender(e.target.value)}
                      onPressEnter={() => {
                        if (newBlockedSender.trim()) {
                          setBlockedSenders((prev) => [...prev, newBlockedSender.trim()]);
                          setNewBlockedSender('');
                        }
                      }}
                      style={{ width: 250 }}
                    />
                    <Button
                      type="dashed"
                      onClick={() => {
                        if (newBlockedSender.trim()) {
                          setBlockedSenders((prev) => [...prev, newBlockedSender.trim()]);
                          setNewBlockedSender('');
                        }
                      }}
                    >
                      {t('emailChannel.actions.block')}
                    </Button>
                  </Space>

                  <Divider />

                  <Title level={5}>{t('emailChannel.filtering.allowedTitle')}</Title>
                  <Paragraph type="secondary">
                    {t('emailChannel.filtering.allowedDesc')}
                  </Paragraph>
                  <div style={{ marginBottom: 12 }}>
                    {allowedSenders.map((sender) => (
                      <Tag
                        key={sender}
                        closable
                        color="green"
                        onClose={() => setAllowedSenders((prev) => prev.filter((s) => s !== sender))}
                        style={{ marginBottom: 4 }}
                      >
                        {sender}
                      </Tag>
                    ))}
                    {allowedSenders.length === 0 && (
                      <Text type="secondary" italic>{t('emailChannel.filtering.noAllowlist')}</Text>
                    )}
                  </div>
                  <Space>
                    <Input
                      placeholder={t('emailChannel.placeholders.allowed')}
                      value={newAllowedSender}
                      onChange={(e) => setNewAllowedSender(e.target.value)}
                      onPressEnter={() => {
                        if (newAllowedSender.trim()) {
                          setAllowedSenders((prev) => [...prev, newAllowedSender.trim()]);
                          setNewAllowedSender('');
                        }
                      }}
                      style={{ width: 250 }}
                    />
                    <Button
                      type="dashed"
                      onClick={() => {
                        if (newAllowedSender.trim()) {
                          setAllowedSenders((prev) => [...prev, newAllowedSender.trim()]);
                          setNewAllowedSender('');
                        }
                      }}
                    >
                      {t('emailChannel.actions.allow')}
                    </Button>
                  </Space>
                </div>
              ),
            },
            {
              key: 'handoff',
              label: (
                <span>
                  <SafetyOutlined /> {t('emailChannel.tabs.handoff')}
                </span>
              ),
              children: (
                <div>
                  <Paragraph type="secondary" style={{ marginBottom: 20 }}>
                    {t('emailChannel.handoff.desc')}
                  </Paragraph>

                  <div style={{ marginBottom: 16 }}>
                    {humanHandoffKeywords.map((kw) => (
                      <Tag
                        key={kw}
                        closable
                        color="orange"
                        onClose={() => setHumanHandoffKeywords((prev) => prev.filter((k) => k !== kw))}
                        style={{ marginBottom: 4 }}
                      >
                        {kw}
                      </Tag>
                    ))}
                  </div>
                  <Space>
                    <Input
                      placeholder={t('emailChannel.placeholders.keyword')}
                      value={newHandoffKeyword}
                      onChange={(e) => setNewHandoffKeyword(e.target.value)}
                      onPressEnter={() => {
                        if (newHandoffKeyword.trim() && !humanHandoffKeywords.includes(newHandoffKeyword.trim())) {
                          setHumanHandoffKeywords((prev) => [...prev, newHandoffKeyword.trim()]);
                          setNewHandoffKeyword('');
                        }
                      }}
                      style={{ width: 200 }}
                    />
                    <Button
                      type="dashed"
                      onClick={() => {
                        if (newHandoffKeyword.trim() && !humanHandoffKeywords.includes(newHandoffKeyword.trim())) {
                          setHumanHandoffKeywords((prev) => [...prev, newHandoffKeyword.trim()]);
                          setNewHandoffKeyword('');
                        }
                      }}
                    >
                      {t('emailChannel.actions.add')}
                    </Button>
                  </Space>

                  <Divider />

                  <Form.Item label={t('emailChannel.handoff.teamLabel')}>
                    <Input
                      placeholder={t('emailChannel.placeholders.team')}
                      value={handoffTeam}
                      onChange={(e) => setHandoffTeam(e.target.value)}
                      prefix={<TeamOutlined />}
                      style={{ maxWidth: 400 }}
                    />
                  </Form.Item>
                </div>
              ),
            },
          ]}
        />

        <Divider />

        <div style={{ textAlign: 'right' }}>
          <Button
            type="primary"
            size="large"
            icon={<MailOutlined />}
            onClick={() => void handleSave()}
            loading={saving}
          >
            {t('emailChannel.actions.save')}
          </Button>
        </div>
      </Card>
    </div>
  );
}