import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { moduleMappingsApi, type ModuleMappingRecord } from '@/api/module-mappings.api';
import { message } from 'antd';

export function useModuleMappings(sourceModule: string, targetModule: string) {
  return useQuery({
    queryKey: ['module-mappings', sourceModule, targetModule],
    queryFn: async () => {
      const res = await moduleMappingsApi.getMappings(sourceModule, targetModule);
      return res.data.data as ModuleMappingRecord[];
    },
    enabled: !!sourceModule && !!targetModule,
  });
}

export function useModuleFields(sourceModule: string, targetModule: string) {
  return useQuery({
    queryKey: ['module-fields', sourceModule, targetModule],
    queryFn: async () => {
      const res = await moduleMappingsApi.getFields(sourceModule, targetModule);
      return res.data.data;
    },
    enabled: !!sourceModule && !!targetModule,
  });
}

export function useSaveModuleMappings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      sourceModule,
      targetModule,
      mappings,
    }: {
      sourceModule: string;
      targetModule: string;
      mappings: { source_field: string; target_field: string }[];
    }) => moduleMappingsApi.save(sourceModule, targetModule, mappings),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['module-mappings', vars.sourceModule, vars.targetModule] });
      message.success('Module mappings saved successfully');
    },
    onError: (err: Error) => {
      message.error(err.message || 'Failed to save module mappings');
    },
  });
}

export function useResetModuleMappings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      sourceModule,
      targetModule,
    }: {
      sourceModule: string;
      targetModule: string;
    }) => moduleMappingsApi.reset(sourceModule, targetModule),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['module-mappings', vars.sourceModule, vars.targetModule] });
      message.success('Module mappings reset to defaults');
    },
    onError: (err: Error) => {
      message.error(err.message || 'Failed to reset module mappings');
    },
  });
}
