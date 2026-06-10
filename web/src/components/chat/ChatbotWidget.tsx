import React, { useState, useRef, useEffect } from 'react';
import { Button, Input, Typography } from 'antd';
import {
  ThunderboltFilled,
  CloseOutlined,
  SendOutlined,
  RobotOutlined,
  UserOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { useChat } from '../../hooks/use-chat';
import { useAuthStore } from '../../store/auth.store';
import { useUiStore } from '../../store/ui.store';
import DOMPurify from 'dompurify';
import { marked } from 'marked';

const { Text } = Typography;

// ─── Persona config ───────────────────────────────────────────────────────────

interface PersonaConfig {
  name: string;
  subtitle: string;
  accent: string;
  accentSoft: string;
  gradient: string;
  greeting: string;
  placeholder: string;
  suggestions: string[];
}

const SALES_PERSONA: PersonaConfig = {
  name: 'FieldForce Assistant',
  subtitle: 'Sales & Product Info',
  accent: '#2563eb',
  accentSoft: '#3b82f6',
  gradient: 'linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)',
  greeting:
    "👋 Hi! I'm your FieldForce Pro assistant.\n\nI can tell you about our features, pricing, and how we help field service businesses like yours. What would you like to know?",
  placeholder: 'Ask about features, pricing, or integrations…',
  suggestions: ['What features do you offer?', 'How much does it cost?', 'Does it work offline?'],
};

const EXPERT_PERSONA: PersonaConfig = {
  name: 'FieldForce Assistant',
  subtitle: 'In-App Support',
  accent: '#2563eb',
  accentSoft: '#3b82f6',
  gradient: 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)',
  greeting:
    "👋 Hi! I'm your FieldForce Pro assistant.\n\nAsk me anything — how to configure a workflow, navigate a module, troubleshoot an issue, or understand any feature. I'll give you step-by-step guidance.",
  placeholder: 'Ask how to do anything in FieldForce Pro…',
  suggestions: ['How do I create a work order?', 'Schedule a recurring job', 'Track a technician'],
};

// ─── Theme tokens ───────────────────────────────────────────────────────────

interface Tokens {
  panelBg: string;
  panelBorder: string;
  headerBorder: string;
  bodyBg: string;
  assistantBg: string;
  assistantText: string;
  assistantShadow: string;
  inputBg: string;
  inputBorder: string;
  footerText: string;
  chipBg: string;
  chipBorder: string;
  chipText: string;
}

const LIGHT: Tokens = {
  panelBg: '#ffffff',
  panelBorder: 'rgba(15,23,42,0.06)',
  headerBorder: '#f1f5f9',
  bodyBg: '#f8fafc',
  assistantBg: '#ffffff',
  assistantText: '#334155',
  assistantShadow: '0 2px 10px rgba(15,23,42,0.06)',
  inputBg: '#f8fafc',
  inputBorder: '#e2e8f0',
  footerText: '#94a3b8',
  chipBg: '#ffffff',
  chipBorder: '#e2e8f0',
  chipText: '#475569',
};

const DARK: Tokens = {
  panelBg: '#0f172a',
  panelBorder: 'rgba(255,255,255,0.08)',
  headerBorder: 'rgba(255,255,255,0.06)',
  bodyBg: '#0b1220',
  assistantBg: '#1e293b',
  assistantText: '#e2e8f0',
  assistantShadow: '0 2px 10px rgba(0,0,0,0.4)',
  inputBg: '#1e293b',
  inputBorder: '#334155',
  footerText: '#64748b',
  chipBg: 'rgba(255,255,255,0.04)',
  chipBorder: 'rgba(255,255,255,0.1)',
  chipText: '#cbd5e1',
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

// ─── Injected keyframes (premium animations) ──────────────────────────────────

const KEYFRAMES = `
@keyframes ffp-fab-in { 0% { transform: scale(0) rotate(-45deg); opacity: 0; } 60% { transform: scale(1.1) rotate(8deg); } 100% { transform: scale(1) rotate(0); opacity: 1; } }
@keyframes ffp-ring { 0% { transform: scale(1); opacity: 0.5; } 100% { transform: scale(1.8); opacity: 0; } }
@keyframes ffp-panel-in { 0% { transform: translateY(24px) scale(0.96); opacity: 0; } 100% { transform: translateY(0) scale(1); opacity: 1; } }
@keyframes ffp-msg-in { 0% { transform: translateY(10px); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
@keyframes ffp-dot { 0%, 60%, 100% { transform: translateY(0); opacity: 0.4; } 30% { transform: translateY(-5px); opacity: 1; } }
@keyframes ffp-status { 0%, 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.6); } 50% { box-shadow: 0 0 0 4px rgba(34,197,94,0); } }
.ffp-scroll::-webkit-scrollbar { width: 6px; }
.ffp-scroll::-webkit-scrollbar-thumb { background: rgba(148,163,184,0.4); border-radius: 6px; }
.ffp-scroll::-webkit-scrollbar-track { background: transparent; }
.ffp-bubble p { margin: 0 0 6px; } .ffp-bubble p:last-child { margin-bottom: 0; }
.ffp-bubble ul, .ffp-bubble ol { margin: 4px 0; padding-left: 18px; }
.ffp-bubble code { background: rgba(148,163,184,0.18); padding: 1px 5px; border-radius: 4px; font-size: 12.5px; }
.ffp-bubble a { color: inherit; text-decoration: underline; }
`;

// ─── Component ────────────────────────────────────────────────────────────────

export const ChatbotWidget: React.FC = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const themeMode = useUiStore((s) => s.theme);
  const chatbotEnabled = useUiStore((s) => s.chatbotEnabled);
  const tk = themeMode === 'dark' ? DARK : LIGHT;
  const persona = isAuthenticated ? EXPERT_PERSONA : SALES_PERSONA;

  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [fabHover, setFabHover] = useState(false);
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

  const submit = (text: string) => {
    const value = text.trim();
    if (!value || isLoading) return;
    sendMessage(value);
    setInputValue('');
  };

  const handleSend = () => submit(inputValue);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // User disabled the assistant in Settings → render nothing
  if (!chatbotEnabled) return null;

  return (
    <>
      <style>{KEYFRAMES}</style>

      {/* ── Floating button ─────────────────────────────────────────────────── */}
      {!isOpen && (
        <div
          style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1000, width: 54, height: 54 }}
          onMouseEnter={() => setFabHover(true)}
          onMouseLeave={() => setFabHover(false)}
        >
          {/* Pulsing ring */}
          <span
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              background: persona.gradient,
              animation: 'ffp-ring 2.4s ease-out infinite',
              pointerEvents: 'none',
            }}
          />
          <button
            aria-label="Open assistant"
            onClick={() => setIsOpen(true)}
            style={{
              position: 'relative',
              width: 54,
              height: 54,
              borderRadius: '50%',
              border: 'none',
              cursor: 'pointer',
              background: persona.gradient,
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: fabHover
                ? `0 14px 36px ${persona.accent}77`
                : `0 8px 24px ${persona.accent}55`,
              transform: fabHover ? 'translateY(-3px) scale(1.06)' : 'none',
              transition: 'transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s ease',
              animation: 'ffp-fab-in 0.5s cubic-bezier(0.34,1.56,0.64,1)',
            }}
          >
            <ThunderboltFilled style={{ fontSize: 21 }} />
          </button>
        </div>
      )}

      {/* ── Chat window ──────────────────────────────────────────────────────── */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            width: 392,
            height: 624,
            maxHeight: 'calc(100vh - 48px)',
            maxWidth: 'calc(100vw - 32px)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            background: tk.panelBg,
            border: `1px solid ${tk.panelBorder}`,
            borderRadius: 20,
            overflow: 'hidden',
            boxShadow:
              themeMode === 'dark'
                ? '0 24px 70px rgba(0,0,0,0.55)'
                : '0 24px 70px rgba(15,23,42,0.22)',
            animation: 'ffp-panel-in 0.32s cubic-bezier(0.34,1.4,0.64,1)',
          }}
        >
          {/* ── Header (gradient) ─────────────────────────────────────────── */}
          <div
            style={{
              background: persona.gradient,
              padding: '16px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              flexShrink: 0,
            }}
          >
            <div
              style={{
                position: 'relative',
                width: 42,
                height: 42,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.18)',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <RobotOutlined style={{ fontSize: 20, color: '#fff' }} />
              {/* online status dot */}
              <span
                style={{
                  position: 'absolute',
                  bottom: 1,
                  right: 1,
                  width: 11,
                  height: 11,
                  borderRadius: '50%',
                  background: '#22c55e',
                  border: '2px solid rgba(255,255,255,0.9)',
                  animation: 'ffp-status 2s ease-in-out infinite',
                }}
              />
            </div>
            <div style={{ lineHeight: 1.25, flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#fff' }}>{persona.name}</div>
              <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.85)' }}>
                <span style={{ fontWeight: 500 }}>● </span>
                {persona.subtitle}
              </div>
            </div>
            {messages.length > 0 && (
              <Button
                type="text"
                size="small"
                icon={<DeleteOutlined />}
                onClick={clearMessages}
                title="Clear conversation"
                style={{ color: 'rgba(255,255,255,0.85)' }}
              />
            )}
            <Button
              type="text"
              icon={<CloseOutlined />}
              onClick={() => setIsOpen(false)}
              style={{ color: 'rgba(255,255,255,0.95)' }}
            />
          </div>

          {/* ── Messages ──────────────────────────────────────────────────── */}
          <div
            className="ffp-scroll"
            data-lenis-prevent
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '20px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
              backgroundColor: tk.bodyBg,
            }}
          >
            {/* Greeting + suggestions (shown before any messages) */}
            {messages.length === 0 && (
              <>
                <div style={{ display: 'flex', gap: 10, alignSelf: 'flex-start', maxWidth: '92%' }}>
                  <Avatar persona={persona} role="assistant" />
                  <div
                    className="ffp-bubble"
                    style={{
                      backgroundColor: tk.assistantBg,
                      color: tk.assistantText,
                      padding: '12px 15px',
                      borderRadius: 16,
                      borderTopLeftRadius: 4,
                      boxShadow: tk.assistantShadow,
                      fontSize: 14,
                      lineHeight: 1.55,
                    }}
                    dangerouslySetInnerHTML={renderMarkdown(persona.greeting)}
                  />
                </div>

                {/* Suggested prompt chips */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, paddingLeft: 42, marginTop: 2 }}>
                  {persona.suggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => submit(s)}
                      style={{
                        background: tk.chipBg,
                        border: `1px solid ${tk.chipBorder}`,
                        color: tk.chipText,
                        padding: '7px 13px',
                        borderRadius: 20,
                        fontSize: 12.5,
                        cursor: 'pointer',
                        transition: 'all 0.18s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = persona.accent;
                        e.currentTarget.style.color = persona.accent;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = tk.chipBorder;
                        e.currentTarget.style.color = tk.chipText;
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </>
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
                  maxWidth: '90%',
                  animation: 'ffp-msg-in 0.3s ease',
                }}
              >
                <Avatar persona={persona} role={msg.role} />
                <div
                  className="ffp-bubble"
                  style={{
                    background: msg.role === 'user' ? persona.gradient : tk.assistantBg,
                    color: msg.role === 'user' ? '#fff' : tk.assistantText,
                    padding: '10px 14px',
                    borderRadius: 16,
                    borderTopRightRadius: msg.role === 'user' ? 4 : 16,
                    borderTopLeftRadius: msg.role === 'assistant' ? 4 : 16,
                    boxShadow: msg.role === 'user' ? `0 4px 14px ${persona.accent}40` : tk.assistantShadow,
                    fontSize: 14,
                    lineHeight: 1.55,
                  }}
                  dangerouslySetInnerHTML={renderMarkdown(msg.content)}
                />
              </div>
            ))}

            {/* Typing indicator (animated dots) */}
            {isLoading && (
              <div style={{ display: 'flex', gap: 10, alignSelf: 'flex-start', animation: 'ffp-msg-in 0.3s ease' }}>
                <Avatar persona={persona} role="assistant" />
                <div
                  style={{
                    backgroundColor: tk.assistantBg,
                    padding: '14px 18px',
                    borderRadius: 16,
                    borderTopLeftRadius: 4,
                    boxShadow: tk.assistantShadow,
                    display: 'flex',
                    gap: 5,
                    alignItems: 'center',
                  }}
                >
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: '50%',
                        background: persona.accent,
                        display: 'inline-block',
                        animation: `ffp-dot 1.3s ${i * 0.18}s infinite ease-in-out`,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* ── Input ─────────────────────────────────────────────────────── */}
          <div
            style={{
              padding: '12px 14px',
              borderTop: `1px solid ${tk.headerBorder}`,
              backgroundColor: tk.panelBg,
              flexShrink: 0,
            }}
          >
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={persona.placeholder}
              disabled={isLoading}
              variant="filled"
              style={{
                borderRadius: 24,
                background: tk.inputBg,
                padding: '6px 6px 6px 16px',
              }}
              suffix={
                <button
                  onClick={handleSend}
                  disabled={!inputValue.trim() || isLoading}
                  aria-label="Send"
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: '50%',
                    border: 'none',
                    flexShrink: 0,
                    cursor: inputValue.trim() && !isLoading ? 'pointer' : 'default',
                    background: inputValue.trim() && !isLoading ? persona.gradient : 'transparent',
                    color: inputValue.trim() && !isLoading ? '#fff' : '#cbd5e1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <SendOutlined style={{ fontSize: 15 }} />
                </button>
              }
            />
            <div style={{ textAlign: 'center', marginTop: 8 }}>
              <Text style={{ fontSize: 10.5, color: tk.footerText }}>
                Powered by FieldForce Pro AI
              </Text>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// ─── Avatar sub-component ─────────────────────────────────────────────────────

const Avatar: React.FC<{ persona: PersonaConfig; role: 'user' | 'assistant' }> = ({
  persona,
  role,
}) => (
  <div
    style={{
      width: 32,
      height: 32,
      borderRadius: '50%',
      flexShrink: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#fff',
      fontSize: 15,
      background: role === 'user' ? '#1e293b' : persona.gradient,
      boxShadow: role === 'assistant' ? `0 2px 8px ${persona.accent}40` : 'none',
    }}
  >
    {role === 'user' ? <UserOutlined /> : <RobotOutlined />}
  </div>
);
