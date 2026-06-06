import axiosInstance from './axios-instance';
import { ApiResponse } from '../types/api.types';

export interface ParsedDocument {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  document_type: string;
  extracted_text: string;
  extracted_fields: Record<string, any>;
  confidence: number;
  pages: number;
  status: string;
  error_message?: string;
  corrections?: Record<string, any>;
  metadata?: Record<string, any>;
  created_at: string;
}

export const documentsApi = {
  upload: async (
    file: File,
    documentType: string,
    metadata?: Record<string, any>,
  ): Promise<ApiResponse<ParsedDocument>> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_type', documentType);
    if (metadata) {
      formData.append('metadata', JSON.stringify(metadata));
    }
    const response = await axiosInstance.post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  getDocuments: async (params?: {
    document_type?: string;
    status?: string;
    search?: string;
    page?: number;
    take?: number;
  }): Promise<ApiResponse<ParsedDocument[]>> => {
    const response = await axiosInstance.get('/documents', { params });
    return response.data;
  },

  getDocument: async (id: string): Promise<ApiResponse<ParsedDocument>> => {
    const response = await axiosInstance.get(`/documents/${id}`);
    return response.data;
  },

  updateDocument: async (
    id: string,
    data: { corrections?: Record<string, any>; status?: string },
  ): Promise<ApiResponse<ParsedDocument>> => {
    const response = await axiosInstance.put(`/documents/${id}`, data);
    return response.data;
  },

  deleteDocument: async (id: string): Promise<ApiResponse<any>> => {
    const response = await axiosInstance.delete(`/documents/${id}`);
    return response.data;
  },
};
