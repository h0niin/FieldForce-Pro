import { useState, useEffect } from 'react';
import { Form, Switch, Input, Button, Card, Typography, Select, Slider, Divider, Space, Row, Col } from 'antd';
import { RobotOutlined, MessageOutlined, SaveOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useUiStore } from '@/store/ui.store';
import { useSetting, useUpsertSetting } from '@/hooks/use-settings';
import { useNotificationStore } from '@/store/notification.store';

const { Title, Paragraph, Text } = Typography;

interface ChatbotConfig {
  welcomeMessage: string;
  botName: string;
  systemPrompt: string;
  temperature: number;
  model: string;
}

const DEFAULT_CONFIG: ChatbotConfig = {
  welcomeMessage: "Hello! How can I assist you with your field service requests today?",
  botName: "Fieldy",
  systemPrompt: "You are a helpful AI assistant for a Field Service Management organization. Answer questions politely and assist clients with bookings, estimates, and schedules.",
  temperature: 0.7,
  model: 'gemini-1.5-flash',
};

export default function ChatbotSettingsPage() {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const addNotification = useNotificationStore((s) => s.add);

  // Bind to Zustand chatbot status
  const chatbotEnabled = useUiStore((s) => s.chatbotEnabled);
  const setChatbotEnabled = useUiStore((s) => s.setChatbotEnabled);

  // Fetch setting key
  const { data: settingData, isLoading } = useSetting('chatbot_settings');
  const upsertMutation = useUpsertSetting();

  useEffect(() => {
    if (settingData?.value) {
      form.setFieldsValue(settingData.value);
    } else {
      form.setFieldsValue(DEFAULT_CONFIG);
    }
  }, [settingData, form]);

  const handleSubmit = async (values: any) => {
    const mergedValue = {
      ...(settingData?.value || DEFAULT_CONFIG),
      ...values,
    };
    await upsertMutation.mutateAsync({
      key: 'chatbot_settings',
      category: 'general',
      value: mergedValue,
    });
  };

  return (
    <div style={{ maxWidth: 650 }}>
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>
          <RobotOutlined style={{ marginRight: 8, color: 'var(--primary-color)' }} />
          {t('settings.chatbot.title', 'AI Chatbot')}
        </h3>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
          Configure your AI-powered assistant to automate customer interactions, capture booking requests, and provide instant support. Set up your custom display name, customized welcome text, model parameters, and target behavioral instructions.
        </p>
      </div>

      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Card style={{ marginBottom: 24, borderRadius: 12 }} bodyStyle={{ padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Text strong style={{ fontSize: 14 }}>
                {t('settings.chatbot.toggleLabel', 'AI Chatbot Assistant')}
              </Text>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                {t('settings.chatbot.toggleDesc', 'Turn on/off the chatbot customer portal assistant.')}
              </div>
            </div>
            <Switch
              checked={chatbotEnabled}
              onChange={(checked) => {
                setChatbotEnabled(checked);
                addNotification({
                  type: 'success',
                  message: checked ? 'AI Chatbot Enabled' : 'AI Chatbot Disabled',
                });
              }}
            />
          </div>
        </Card>

        <Title level={5} style={{ fontWeight: 600 }}>
          {t('settings.chatbot.personalitySection', 'Chatbot Configuration')}
        </Title>
        <Divider style={{ margin: '8px 0 16px 0' }} />

        <Form.Item
          name="botName"
          label={t('settings.chatbot.formBotName', 'Assistant Display Name')}
          rules={[{ required: true, message: 'Please input the assistant name' }]}
        >
          <Input placeholder="Fieldy" disabled={!chatbotEnabled} />
        </Form.Item>

        <Form.Item
          name="temperature"
          label={t('settings.chatbot.formTemp', 'Creativity (Temperature)')}
        >
          <Slider min={0} max={1} step={0.1} disabled={!chatbotEnabled} />
        </Form.Item>

        <Form.Item style={{ marginTop: 24 }}>
          <Button
            type="primary"
            htmlType="submit"
            icon={<SaveOutlined />}
            loading={upsertMutation.isPending}
            disabled={!chatbotEnabled}
            style={{ minWidth: 150, height: 40 }}
          >
            {t('common.save', 'Save Configuration')}
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
}
