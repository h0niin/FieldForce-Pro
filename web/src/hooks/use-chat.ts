import { useState } from 'react';
import api from '../api/axios-instance';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Hook for the dual-persona AI chatbot.
 *
 * @param isAuthenticated - true → FSM Expert persona (in-app);
 *                          false → Sales AI persona (landing page)
 */
export const useChat = (isAuthenticated: boolean = false) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    const userMessage: ChatMessage = { role: 'user', content };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await api.post('/ai/chat', {
        message: content,
        history: messages,       // send full history for multi-turn context
        isAuthenticated,         // persona selector
      });

      const reply: string =
        response.data?.data?.reply ??
        response.data?.reply ??
        "I'm sorry, I couldn't process that. Please try again.";

      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearMessages = () => setMessages([]);

  return { messages, isLoading, sendMessage, clearMessages };
};
