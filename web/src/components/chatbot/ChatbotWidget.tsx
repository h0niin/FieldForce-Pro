import { useState, useRef, useEffect } from 'react';
import { Button, Card, Input, List, Typography, Space, Tag, Badge, Tooltip, Drawer } from 'antd';
import {
  MessageOutlined,
  SendOutlined,
  CloseOutlined,
  RobotOutlined,
  UserOutlined,
  DeleteOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useSendMessage, useChatSessions } from '../../hooks/use-chatbot';

const { Text, Paragraph } = Typography;
const { TextArea } = Input;

interface ChatMessage {
  role: string;
  content: string;
  timestamp?: string;
  sources?: Array<{ title: string; score: number }>;
}

export default function ChatbotWidget({ sessionType = 'internal' }: { sessionType?: string }) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const sendMessage = useSendMessage();
  const { data: sessionsData } = useChatSessions({ session_type: sessionType });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!message.trim() || sendMessage.isPending) return;

    const userMsg: ChatMessage = {
      role: 'user',
      content: message.trim(),
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setMessage('');

    try {
      const response = await sendMessage.mutateAsync({
        message: userMsg.content,
        session_id: sessionId,
        session_type: sessionType,
      });

      if (response.data) {
        setSessionId(response.data.session_id);
        const assistantMsg: ChatMessage = {
          role: 'assistant',
          content: response.data.reply,
          timestamp: new Date().toISOString(),
          sources: response.data.sources,
        };
        setMessages((prev) => [...prev, assistantMsg]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: t('chatbot.errorOccurred') },
      ]);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setSessionId(undefined);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) {
    return (
      <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1000 }}>
        <Badge count={0}>
          <Button
            type="primary"
            shape="circle"
            size="large"
            icon={<MessageOutlined />}
            onClick={() => setIsOpen(true)}
            style={{ width: 56, height: 56, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
          />
        </Badge>
      </div>
    );
  }

  return (
    <>
      <div
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          width: 380,
          height: 520,
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          borderRadius: 12,
          overflow: 'hidden',
        }}
      >
        <Card
          size="small"
          title={
            <Space>
              <RobotOutlined />
              <span>{t('chatbot.title')}</span>
            </Space>
          }
          extra={
            <Space>
              <Tooltip title={t('chatbot.chatHistory')}>
                <Button
                  type="text"
                  size="small"
                  icon={<HistoryOutlined />}
                  onClick={() => setShowHistory(true)}
                />
              </Tooltip>
              <Tooltip title={t('chatbot.newChat')}>
                <Button
                  type="text"
                  size="small"
                  icon={<DeleteOutlined />}
                  onClick={handleNewChat}
                />
              </Tooltip>
              <Button
                type="text"
                size="small"
                icon={<CloseOutlined />}
                onClick={() => setIsOpen(false)}
              />
            </Space>
          }
          styles={{ body: { padding: 0, flex: 1, display: 'flex', flexDirection: 'column', height: '100%' } }}
          style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
        >
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '12px 16px',
              minHeight: 0,
            }}
          >
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', paddingTop: 40 }}>
                <RobotOutlined style={{ fontSize: 40, color: '#bfbfbf' }} />
                <Paragraph type="secondary" style={{ marginTop: 12 }}>
                  {t('chatbot.welcomeMessage')}
                </Paragraph>
              </div>
            )}
            {messages.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  marginBottom: 8,
                }}
              >
                <div
                  style={{
                    maxWidth: '80%',
                    padding: '8px 12px',
                    borderRadius: 12,
                    backgroundColor: msg.role === 'user' ? '#1677ff' : '#f5f5f5',
                    color: msg.role === 'user' ? '#fff' : '#000',
                  }}
                >
                  <Space size={4}>
                    {msg.role === 'assistant' && <RobotOutlined style={{ fontSize: 12 }} />}
                    {msg.role === 'user' && <UserOutlined style={{ fontSize: 12 }} />}
                  </Space>
                  <Text style={{ color: msg.role === 'user' ? '#fff' : '#000', display: 'block', marginTop: 2 }}>
                    {msg.content}
                  </Text>
                  {msg.sources && msg.sources.length > 0 && (
                    <div style={{ marginTop: 4 }}>
                      {msg.sources.map((s, i) => (
                        <Tag key={i} color="blue" style={{ fontSize: 10 }}>
                          {s.title}
                        </Tag>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {sendMessage.isPending && (
              <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 8 }}>
                <div style={{ padding: '8px 12px', borderRadius: 12, backgroundColor: '#f5f5f5' }}>
                  <Text type="secondary">{t('chatbot.thinking')}</Text>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div style={{ padding: '8px 12px', borderTop: '1px solid #f0f0f0' }}>
            <Space.Compact style={{ width: '100%' }}>
              <TextArea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder={t('chatbot.placeholder')}
                autoSize={{ minRows: 1, maxRows: 3 }}
                style={{ resize: 'none' }}
              />
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleSend}
                loading={sendMessage.isPending}
                disabled={!message.trim()}
              />
            </Space.Compact>
          </div>
        </Card>
      </div>

      <Drawer
        title={t('chatbot.chatHistory')}
        open={showHistory}
        onClose={() => setShowHistory(false)}
        placement="right"
        width={320}
      >
        <List
          dataSource={sessionsData?.data || []}
          renderItem={(session: any) => (
            <List.Item>
              <List.Item.Meta
                title={session.title || t('chatbot.untitled')}
                description={
                  <Space direction="vertical" size={0}>
                    <Text type="secondary">{t('chatbot.messageCount', { count: session.message_count })}</Text>
                    <Tag color={session.status === 'active' ? 'green' : 'default'}>
                      {session.status}
                    </Tag>
                  </Space>
                }
              />
            </List.Item>
          )}
          locale={{ emptyText: t('chatbot.noHistory') }}
        />
      </Drawer>
    </>
  );
}