import { useMutation } from '@tanstack/react-query';
import { message } from 'antd';
import { analyticsApi } from '../api/analytics.api';

export function useNLQuery() {
  return useMutation({
    mutationFn: analyticsApi.nlQuery,
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Query failed');
    },
  });
}

export function useAnalyzeSentiment() {
  return useMutation({
    mutationFn: (text: string) => analyticsApi.analyzeSentiment(text),
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Sentiment analysis failed');
    },
  });
}

export function useAnalyzeSentimentBatch() {
  return useMutation({
    mutationFn: (texts: string[]) => analyticsApi.analyzeSentimentBatch(texts),
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Batch sentiment analysis failed');
    },
  });
}
