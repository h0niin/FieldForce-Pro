import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { superAdminApiKeysApi } from '@/api/super-admin-api-keys.api';
import { message } from 'antd';

export const useSuperAdminApiKeys = () => {
  return useQuery({
    queryKey: ['super-admin', 'api-keys'],
    queryFn: superAdminApiKeysApi.listKeys,
  });
};

export const useCreateSuperAdminApiKey = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: superAdminApiKeysApi.createKey,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super-admin', 'api-keys'] });
      message.success('API key generated successfully');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Failed to generate API key');
    },
  });
};

export const useRevokeSuperAdminApiKey = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: superAdminApiKeysApi.revokeKey,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super-admin', 'api-keys'] });
      message.success('API key revoked successfully');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Failed to revoke API key');
    },
  });
};

export const useRegenerateSuperAdminApiKey = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, key_name }: { id: string; key_name: string }) => superAdminApiKeysApi.regenerateKey(id, key_name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super-admin', 'api-keys'] });
      message.success('API key regenerated successfully');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Failed to regenerate API key');
    },
  });
};
