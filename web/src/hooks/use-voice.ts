import { useMutation } from '@tanstack/react-query';
import { message } from 'antd';
import { voiceApi } from '../api/voice.api';

export function useTranscribe() {
  return useMutation({
    mutationFn: ({ file, language }: { file: File; language?: string }) =>
      voiceApi.transcribe(file, language),
    onSuccess: (response) => {
      message.success(response.message || 'Transcription completed');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Transcription failed');
    },
  });
}

export function useDetectLanguage() {
  return useMutation({
    mutationFn: (file: File) => voiceApi.detectLanguage(file),
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Language detection failed');
    },
  });
}
