import React, { useState, useRef, useEffect } from 'react';
import { Button, Input, Card, Typography, Spin, Avatar, Tooltip } from 'antd';
import {
  MessageOutlined,
  CloseOutlined,
  SendOutlined,
  RobotOutlined,
  UserOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { useChat } from '../../hooks/use-chat';
import { useAuthStore } from '../../store/auth.store';
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import { useTranslation } from 'react-i18next';

const { Text } = Typography;

// ─── Persona config ───────────────────────────────────────────────────────────

interface PersonaConfig {
  name: string;
  subtitle: string;
  accentColor: string;
  avatarBg: string;
  greeting: string;
  placeholder: string;
}

const SALES_PERSONA: PersonaConfig = {
  name: 'FieldForce Assistant',
  subtitle: 'Sales & Product Info',
  accentColor: '#2563eb',
  avatarBg: '#2563eb',
  greeting:
    "👋 Hi! I'm your FieldForce Pro assistant.\n\nI can tell you about our features, pricing, and how we help field service businesses like yours. What would you like to know?",
  placeholder: 'Ask about features, pricing, or integrations…',
};

const EXPERT_PERSONA: PersonaConfig = {
  name: 'FieldForce Assistant',
  subtitle: 'In-App Support',
  accentColor: '#7c3aed',
  avatarBg: '#7c3aed',
  greeting:
    "👋 Hi! I'm your FieldForce Pro assistant.\n\nAsk me anything — how to configure a workflow, navigate a module, troubleshoot an issue, or understand any feature. I'll give you step-by-step guidance.",
  placeholder: 'Ask how to do anything in FieldForce Pro…',
};

// ─── Markdown renderer ────────────────────────────────────────────────────────

function renderMarkdown(content: string): { __html: string } {
  try {
    const html = marked.parse(content, { async: false }) as string;
    return { __html: DOMPurify.sanitize(html) };
  } catch {
    return { __html: content };
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export const ChatbotWidget: React.FC = () => {
  const { t } = useTranslation();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const persona = isAuthenticated ? EXPERT_PERSONA : SALES_PERSONA;

  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, isLoading, sendMessage, clearMessages } = useChat(isAuthenticated);

  // Auto-scroll to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, isOpen]);

  // Reset conversation when the user's auth state changes (login / logout)
  const prevAuthRef = useRef(isAuthenticated);
  useEffect(() => {
    if (prevAuthRef.current !== isAuthenticated) {
      clearMessages();
      prevAuthRef.current = isAuthenticated;
    }
  }, [isAuthenticated, clearMessages]);

  const handleSend = () => {
    const text = inputValue.trim();
    if (!text || isLoading) return;
    sendMessage(text);
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSend();
  };

  const renderMarkdown = (content: string) => {
    try {
      // Parse markdown and sanitize HTML to prevent XSS
      // Use marked.parse for marked v12+ compatibility
      const html = marked.parse(content, { async: false }) as string;
      return { __html: DOMPurify.sanitize(html) };
    } catch (err) {
      console.error(t('chatbot.markdownRenderError'), err);
      return { __html: content }; // Fallback to raw text if parsing fails
    }
  };

  return (
    <>
      {/* ── Floating button ─────────────────────────────────────────────────── */}
      {!isOpen && (
        <Button
          type="primary"
          shape="circle"
          size="large"
          icon={<MessageOutlined style={{ fontSize: 24 }} />}
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            width: 64,
            height: 64,
            backgroundColor: persona.accentColor,
            borderColor: persona.accentColor,
            boxShadow: `0 8px 24px ${persona.accentColor}66`,
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={() => setIsOpen(true)}
        />
      )}

      {/* ── Chat window ──────────────────────────────────────────────────────── */}
      {isOpen && (
        <Card
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  background: persona.accentColor,
                  color: '#fff',
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <RobotOutlined style={{ fontSize: 18 }} />
              </div>
              <div style={{ lineHeight: 1.2 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{persona.name}</div>
                <div style={{ fontWeight: 400, fontSize: 11, color: '#94a3b8' }}>
                  {persona.subtitle}
                </div>
              </div>
            </div>
          }
          extra={
            <div style={{ display: 'flex', gap: 4 }}>
              {messages.length > 0 && (
                <Tooltip title="Clear conversation">
                  <Button
                    type="text"
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={clearMessages}
                    style={{ color: '#94a3b8' }}
                  />
                </Tooltip>
              )}
              <Button
                type="text"
                icon={<CloseOutlined />}
                onClick={() => setIsOpen(false)}
              />
            </div>
          }
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            width: 390,
            height: 620,
            maxHeight: '82vh',
            boxShadow: '0 12px 48px rgba(0, 0, 0, 0.18)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1000,
            borderRadius: 18,
            overflow: 'hidden',
          }}
          styles={{
            header: {
              padding: '14px 16px',
              borderBottom: '1px solid #f1f5f9',
              minHeight: 'unset',
            },
            body: {
              padding: 0,
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              overflow: 'hidden',
            },
          }}
        >
          {/* ── Messages ──────────────────────────────────────────────────── */}
          <div
            data-lenis-prevent
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '20px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
              backgroundColor: '#f8fafc',
            }}
          >
            {/* Greeting (shown before any messages) */}
            {messages.length === 0 && (
              <div
                style={{
                  display: 'flex',
                  gap: 12,
                  alignSelf: 'flex-start',
                  maxWidth: '90%',
                }}
              >
                <Avatar
                  icon={<RobotOutlined />}
                  style={{ backgroundColor: persona.avatarBg, flexShrink: 0 }}
                />
                <div
                  style={{
                    backgroundColor: '#fff',
                    color: '#334155',
                    padding: '12px 16px',
                    borderRadius: 16,
                    borderTopLeftRadius: 4,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    fontSize: 14,
                    lineHeight: 1.55,
                  }}
                  dangerouslySetInnerHTML={renderMarkdown(persona.greeting)}
                />
              </div>
            )}

            {/* Message history */}
            {messages.map((msg, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  gap: 10,
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                  maxWidth: '88%',
                }}
              >
                <Avatar
                  icon={msg.role === 'user' ? <UserOutlined /> : <RobotOutlined />}
                  style={{
                    backgroundColor: msg.role === 'user' ? '#1e293b' : persona.avatarBg,
                    flexShrink: 0,
                  }}
                />
                <div
                  style={{
                    backgroundColor: msg.role === 'user' ? '#1e293b' : '#ffffff',
                    color: msg.role === 'user' ? '#ffffff' : '#334155',
                    padding: '10px 14px',
                    borderRadius: 16,
                    borderTopRightRadius: msg.role === 'user' ? 4 : 16,
                    borderTopLeftRadius: msg.role === 'assistant' ? 4 : 16,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                    fontSize: 14,
                    lineHeight: 1.55,
                  }}
                  dangerouslySetInnerHTML={renderMarkdown(msg.content)}
                />
              </div>
            ))}

            {/* Typing indicator */}
            {isLoading && (
              <div style={{ display: 'flex', gap: 10, alignSelf: 'flex-start' }}>
                <Avatar
                  icon={<RobotOutlined />}
                  style={{ backgroundColor: persona.avatarBg }}
                />
                <div
                  style={{
                    backgroundColor: '#fff',
                    padding: '12px 16px',
                    borderRadius: 16,
                    borderTopLeftRadius: 4,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                  }}
                >
                  <Spin size="small" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* ── Input ─────────────────────────────────────────────────────── */}
          <div
            style={{
              padding: '12px 14px',
              borderTop: '1px solid #e2e8f0',
              backgroundColor: '#fff',
            }}
          >
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={persona.placeholder}
              disabled={isLoading}
              style={{ borderRadius: 22 }}
              suffix={
                <Button
                  type="text"
                  icon={<SendOutlined />}
                  onClick={handleSend}
                  disabled={!inputValue.trim() || isLoading}
                  style={{ color: inputValue.trim() ? persona.accentColor : '#cbd5e1' }}
                />
              }
            />
            <div style={{ textAlign: 'center', marginTop: 7 }}>
              <Text type="secondary" style={{ fontSize: 11 }}>
                {t('chatbot.poweredBy')}
              </Text>
            </div>
          </div>
        </Card>
      )}
    </>
  );
};