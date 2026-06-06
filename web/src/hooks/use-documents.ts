import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { documentsApi } from '../api/documents.api';

const QUERY_KEYS = {
  documents: ['documents'],
  document: (id: string) => ['documents', id],
};

export function useDocuments(params?: {
  document_type?: string;
  status?: string;
  search?: string;
  page?: number;
  take?: number;
}) {
  return useQuery({
    queryKey: [...QUERY_KEYS.documents, params],
    queryFn: () => documentsApi.getDocuments(params),
    staleTime: 30 * 1000,
  });
}

export function useDocument(id: string, enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.document(id),
    queryFn: () => documentsApi.getDocument(id),
    enabled: enabled && !!id,
  });
}

export function useUploadDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ file, documentType, metadata }: {
      file: File;
      documentType: string;
      metadata?: Record<string, any>;
    }) => documentsApi.upload(file, documentType, metadata),
    onSuccess: (response) => {
      message.success(response.message || 'Document uploaded and parsed');
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.documents });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Failed to upload document');
    },
  });
}

export function useUpdateDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: {
      id: string;
      data: { corrections?: Record<string, any>; status?: string };
    }) => documentsApi.updateDocument(id, data),
    onSuccess: (response) => {
      message.success(response.message || 'Document updated');
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.documents });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Failed to update document');
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: documentsApi.deleteDocument,
    onSuccess: () => {
      message.success('Document deleted');
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.documents });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Failed to delete document');
    },
  });
}
