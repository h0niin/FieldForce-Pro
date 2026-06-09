import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tenantModulesApi, type TenantModuleRecord } from '@/api/tenant-modules.api';
import { message } from 'antd';

const QUERY_KEY = ['tenant-modules'];

export function useTenantModules() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const res = await tenantModulesApi.getAll();
      return res.data.data as TenantModuleRecord[];
    },
  });
}

export function useToggleTenantModule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ moduleName, is_active }: { moduleName: string; is_active: boolean }) =>
      tenantModulesApi.toggle(moduleName, is_active),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      message.success(`${vars.moduleName} ${vars.is_active ? 'enabled' : 'disabled'}`);
    },
    onError: (err: Error) => {
      message.error(err.message || 'Failed to update module status');
    },
  });
}
