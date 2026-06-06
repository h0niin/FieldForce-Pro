import axiosInstance from './axios-instance';
import { ApiResponse } from '../types/api.types';

export interface NLQueryResult {
  sql_query: string;
  results: any[];
  explanation: string;
  visualization_hint: string | null;
}

export interface SentimentResult {
  text: string;
  sentiment: string;
  confidence: number;
  scores: { positive: number; neutral: number; negative: number };
  method?: string;
}

export const analyticsApi = {
  nlQuery: async (data: {
    query: string;
    context?: Record<string, any>;
  }): Promise<ApiResponse<NLQueryResult>> => {
    const response = await axiosInstance.post('/analytics/nl-query', data);
    return response.data;
  },

  analyzeSentiment: async (text: string): Promise<ApiResponse<SentimentResult>> => {
    const response = await axiosInstance.post('/analytics/sentiment', { text });
    return response.data;
  },

  analyzeSentimentBatch: async (texts: string[]): Promise<ApiResponse<{
    results: SentimentResult[];
    total: number;
    average_sentiment: Record<string, number>;
  }>> => {
    const response = await axiosInstance.post('/analytics/sentiment/batch', { texts });
    return response.data;
  },
};
