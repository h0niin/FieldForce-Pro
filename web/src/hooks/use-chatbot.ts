import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { chatbotApi } from '../api/chatbot.api';

const QUERY_KEYS = {
  sessions: ['chatbot', 'sessions'],
  session: (id: string) => ['chatbot', 'session', id],
};

export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: chatbotApi.sendMessage,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.sessions });
      if (response.data?.session_id) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.session(response.data.session_id),
        });
      }
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Failed to send message');
    },
  });
}

export function useChatSessions(params?: {
  status?: string;
  session_type?: string;
  page?: number;
  take?: number;
}) {
  return useQuery({
    queryKey: [...QUERY_KEYS.sessions, params],
    queryFn: () => chatbotApi.getSessions(params),
    staleTime: 30 * 1000,
  });
}

export function useChatSession(id: string, enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.session(id),
    queryFn: () => chatbotApi.getSession(id),
    enabled: enabled && !!id,
    staleTime: 10 * 1000,
  });
}

export function useCloseSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: chatbotApi.closeSession,
    onSuccess: () => {
      message.success('Session closed');
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.sessions });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Failed to close session');
    },
  });
}

export function useDeleteSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: chatbotApi.deleteSession,
    onSuccess: () => {
      message.success('Session deleted');
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.sessions });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Failed to delete session');
    },
  });
}
