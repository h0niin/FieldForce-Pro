import axiosInstance from './axios-instance';
import { ApiResponse } from '../types/api.types';

export interface ChatMessage {
  role: string;
  content: string;
  timestamp: string;
  sources?: Array<{ title: string; score: number }>;
}

export interface ChatResponse {
  session_id: string;
  reply: string;
  sources: Array<{ title: string; score: number }>;
  suggested_actions: string[];
}

export interface ChatSession {
  id: string;
  session_type: string;
  status: string;
  title: string;
  message_count: number;
  last_message_at: string;
  created_at: string;
}

export interface ChatSessionDetail extends ChatSession {
  messages: ChatMessage[];
  context: Record<string, any>;
}

export const chatbotApi = {
  sendMessage: async (data: {
    message: string;
    session_id?: string;
    session_type?: string;
    context?: Record<string, any>;
  }): Promise<ApiResponse<ChatResponse>> => {
    const response = await axiosInstance.post('/chatbot/message', data);
    return response.data;
  },

  getSessions: async (params?: {
    status?: string;
    session_type?: string;
    page?: number;
    take?: number;
  }): Promise<ApiResponse<ChatSession[]>> => {
    const response = await axiosInstance.get('/chatbot/sessions', { params });
    return response.data;
  },

  getSession: async (id: string): Promise<ApiResponse<ChatSessionDetail>> => {
    const response = await axiosInstance.get(`/chatbot/sessions/${id}`);
    return response.data;
  },

  closeSession: async (id: string): Promise<ApiResponse<any>> => {
    const response = await axiosInstance.post(`/chatbot/sessions/${id}/close`);
    return response.data;
  },

  deleteSession: async (id: string): Promise<ApiResponse<any>> => {
    const response = await axiosInstance.delete(`/chatbot/sessions/${id}`);
    return response.data;
  },
};
