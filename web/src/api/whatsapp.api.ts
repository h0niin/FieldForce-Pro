import api from './axios-instance';
import type { ApiResponse } from '@/types/api.types';

// ── Types ────────────────────────────────────────────────────────────────────

export interface WhatsAppChannel {
  id: string;
  tenant_id: string;
  connection_method: 'web_js' | 'business_api';
  phone_number: string | null;
  display_name: string | null;
  status: 'disconnected' | 'pending' | 'connected';
  meta_config: Record<string, unknown>;
  greeting_message: string;
  confirmation_message: string;
  working_hours_mode: '24_7' | 'office_hours';
  office_hours: { start: string; end: string; timezone: string };
  languages: string[];
  required_fields: Record<string, boolean>;
  default_priority: string;
  handoff_team: string | null;
  blocked_numbers: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppConversation {
  id: string;
  tenant_id: string;
  channel_id: string;
  customer_phone: string;
  contact_id: string | null;
  status: 'active' | 'draft' | 'completed' | 'handed_off' | 'abandoned';
  messages?: Array<{
    role: string;
    content: string;
    timestamp: string;
    media_url?: string;
  }>;
  collected_data: Record<string, unknown>;
  service_request_id: string | null;
  last_customer_message_at: string | null;
  reminder_sent: boolean;
  created_at: string;
  updated_at: string;
}


export interface ConnectionTestResult {
  success: boolean;
  message: string;
}

export interface WebJsQrStatus {
  status: 'not_initialized' | 'initializing' | 'qr_ready' | 'authenticated' | 'connected' | 'disconnected' | 'error';
  qr_data_url: string | null;
  phone_number: string | null;
  error: string | null;
}

export interface UpsertChannelPayload {
  connection_method?: 'web_js' | 'business_api';
  phone_number?: string;
  display_name?: string;
  meta_config?: Record<string, unknown>;
  greeting_message?: string;
  confirmation_message?: string;
  working_hours_mode?: '24_7' | 'office_hours';
  office_hours?: { start: string; end: string; timezone: string };
  languages?: string[];
  required_fields?: Record<string, boolean>;
  default_priority?: string;
  handoff_team?: string;
  blocked_numbers?: string[];
  is_active?: boolean;
}

// ── API Functions ────────────────────────────────────────────────────────────

export const whatsappApi = {
  getChannel() {
    return api.get<ApiResponse<WhatsAppChannel | null>>('/whatsapp/channel');
  },

  upsertChannel(payload: UpsertChannelPayload) {
    return api.put<ApiResponse<WhatsAppChannel>>('/whatsapp/channel', payload);
  },

  testConnection() {
    return api.post<ApiResponse<ConnectionTestResult>>('/whatsapp/channel/test');
  },

  disconnect() {
    return api.post<ApiResponse<WhatsAppChannel>>('/whatsapp/channel/disconnect');
  },


  getConversations(params?: { page?: number; take?: number }) {
    return api.get<ApiResponse<{ data: WhatsAppConversation[]; meta: unknown }>>('/whatsapp/conversations', { params });
  },

  getConversation(id: string) {
    return api.get<ApiResponse<WhatsAppConversation>>(`/whatsapp/conversations/${id}`);
  },

  // Web JS endpoints
  initializeWebJs() {
    return api.post<ApiResponse<{ status: string; message: string }>>('/whatsapp/webjs/initialize');
  },

  getWebJsQr() {
    return api.get<ApiResponse<WebJsQrStatus>>('/whatsapp/webjs/qr');
  },

  disconnectWebJs() {
    return api.post<ApiResponse<null>>('/whatsapp/webjs/disconnect');
  },
};
