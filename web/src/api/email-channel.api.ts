import api from './axios-instance';
import type { ApiResponse } from '@/types/api.types';

// ── Types ────────────────────────────────────────────────────────────────────

export interface EmailChannelConfig {
  id: string;
  tenant_id: string;
  connection_method: 'forwarding' | 'mailbox' | 'platform_provided';
  support_email: string | null;
  platform_email: string | null;
  status: 'not_receiving' | 'receiving' | 'error';
  reply_from_name: string | null;
  reply_from_email: string | null;
  acknowledgement_template: string;
  clarification_template: string;
  category_mapping: string[];
  priority_rules: Record<string, unknown>;
  default_category: string;
  default_priority: string;
  allowed_senders: string[];
  blocked_senders: string[];
  spam_filter_enabled: boolean;
  human_handoff_keywords: string[];
  handoff_team: string | null;
  is_active: boolean;
  imap_config: Record<string, unknown>;
  smtp_config: Record<string, unknown>;
  webhook_secret: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmailThread {
  id: string;
  tenant_id: string;
  channel_id: string;
  sender_email: string;
  sender_name: string | null;
  contact_id: string | null;
  service_request_id: string | null;
  original_subject: string | null;
  thread_reference: string | null;
  ticket_tag: string | null;
  status: 'new' | 'processing' | 'ticket_created' | 'needs_review' | 'spam' | 'ignored';
  messages?: Array<{
    direction: string;
    from: string;
    to: string;
    subject: string;
    text_body: string;
    html_body?: string;
    timestamp: string;
    attachments?: Array<{ filename: string; content_type: string; size?: number }>;
    message_id?: string;
  }>;
  extracted_data: Record<string, unknown>;
  ai_confidence: number | null;
  created_at: string;
  updated_at: string;
}

export interface ConnectionTestResult {
  success: boolean;
  message: string;
}

export interface UpsertEmailChannelPayload {
  connection_method: 'forwarding' | 'mailbox' | 'platform_provided';
  support_email?: string;
  platform_email?: string;
  reply_from_name?: string;
  reply_from_email?: string;
  acknowledgement_template?: string;
  clarification_template?: string;
  category_mapping?: string[];
  priority_rules?: Record<string, unknown>;
  default_category?: string;
  default_priority?: string;
  allowed_senders?: string[];
  blocked_senders?: string[];
  spam_filter_enabled?: boolean;
  human_handoff_keywords?: string[];
  handoff_team?: string;
  is_active?: boolean;
  imap_config?: Record<string, unknown>;
  smtp_config?: Record<string, unknown>;
  webhook_secret?: string;
}

// ── API Functions ────────────────────────────────────────────────────────────

export const emailChannelApi = {
  getChannel() {
    return api.get<ApiResponse<EmailChannelConfig | null>>('/email-channel/channel');
  },

  upsertChannel(payload: UpsertEmailChannelPayload) {
    return api.put<ApiResponse<EmailChannelConfig>>('/email-channel/channel', payload);
  },

  testConnection() {
    return api.post<ApiResponse<ConnectionTestResult>>('/email-channel/channel/test');
  },

  disconnect() {
    return api.post<ApiResponse<EmailChannelConfig>>('/email-channel/channel/disconnect');
  },

  getThreads(params?: { page?: number; take?: number }) {
    return api.get<ApiResponse<{ data: EmailThread[]; meta: unknown }>>('/email-channel/threads', { params });
  },

  getThread(id: string) {
    return api.get<ApiResponse<EmailThread>>(`/email-channel/threads/${id}`);
  },
};
