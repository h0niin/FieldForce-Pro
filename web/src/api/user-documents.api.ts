import api from './axios-instance';
import type { ApiResponse, PageOptions } from '@/types/api.types';

export type DocumentType =
  | 'certification'
  | 'license'
  | 'id_proof'
  | 'insurance'
  | 'contract'
  | 'other';

export interface UserDocument {
  id: string;
  tenant_id: string;
  user_id: string;
  document_type: DocumentType;
  document_name: string;
  file_url: string;
  file_type?: string;
  file_size?: number;
  issue_date?: string;
  expiry_date?: string;
  issuing_authority?: string;
  document_number?: string;
  notes?: string;
  is_verified: boolean;
  verified_at?: string;
  verified_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateUserDocumentPayload {
  user_id: string;
  document_type: DocumentType;
  document_name: string;
  file_url: string;
  file_type?: string;
  file_size?: number;
  issue_date?: string;
  expiry_date?: string;
  issuing_authority?: string;
  document_number?: string;
  notes?: string;
}

export interface UpdateUserDocumentPayload {
  document_type?: DocumentType;
  document_name?: string;
  file_url?: string;
  file_type?: string;
  file_size?: number;
  issue_date?: string;
  expiry_date?: string;
  issuing_authority?: string;
  document_number?: string;
  notes?: string;
}

export const userDocumentsApi = {
  getAll(params?: PageOptions) {
    return api.get<ApiResponse<UserDocument[]>>('/user-documents', { params });
  },

  getByUserId(userId: string) {
    return api.get<ApiResponse<UserDocument[]>>(`/user-documents/user/${userId}`);
  },

  getExpiring(days: number = 30) {
    return api.get<ApiResponse<UserDocument[]>>(`/user-documents/expiring?days=${days}`);
  },

  getById(id: string) {
    return api.get<ApiResponse<UserDocument>>(`/user-documents/${id}`);
  },

  create(payload: CreateUserDocumentPayload) {
    return api.post<ApiResponse<UserDocument>>('/user-documents', payload);
  },

  update(id: string, payload: UpdateUserDocumentPayload) {
    return api.put<ApiResponse<UserDocument>>(`/user-documents/${id}`, payload);
  },

  delete(id: string) {
    return api.delete<ApiResponse<null>>(`/user-documents/${id}`);
  },

  verify(id: string) {
    return api.patch<ApiResponse<UserDocument>>(`/user-documents/${id}/verify`);
  },

  unverify(id: string) {
    return api.patch<ApiResponse<UserDocument>>(`/user-documents/${id}/unverify`);
  },
};
