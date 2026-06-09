import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fieldPermissionsApi } from '@/api/field-permissions.api';
import { message } from 'antd';

export function useFieldPermissions(moduleName: string) {
  return useQuery({
    queryKey: ['field-permissions', moduleName],
    queryFn: async () => {
      const res = await fieldPermissionsApi.getForModule(moduleName);
      return res.data.data;
    },
    enabled: !!moduleName,
  });
}

export function useSaveFieldPermissions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      moduleName,
      permissions,
    }: {
      moduleName: string;
      permissions: { field_name: string; role_id: string; access_level: string }[];
    }) => fieldPermissionsApi.saveBatch(moduleName, permissions),
    onSuccess: (res, vars) => {
      queryClient.invalidateQueries({ queryKey: ['field-permissions', vars.moduleName] });
      message.success('Field permissions updated successfully');
    },
    onError: (err: Error) => {
      message.error(err.message || 'Failed to update field permissions');
    },
  });
}
