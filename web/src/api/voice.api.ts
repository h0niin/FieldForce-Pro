import axiosInstance from './axios-instance';
import { ApiResponse } from '../types/api.types';

export interface TranscriptionResult {
  text: string;
  language: string;
  duration_seconds: number;
  segments: Array<{
    start: number;
    end: number;
    text: string;
    confidence?: number;
  }>;
}

export interface LanguageDetectionResult {
  language: string;
  confidence: number;
  top_languages: Record<string, number>;
}

export const voiceApi = {
  transcribe: async (
    file: File,
    language: string = 'en',
  ): Promise<ApiResponse<TranscriptionResult>> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('language', language);
    const response = await axiosInstance.post('/voice/transcribe', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  detectLanguage: async (file: File): Promise<ApiResponse<LanguageDetectionResult>> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axiosInstance.post('/voice/detect-language', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};
