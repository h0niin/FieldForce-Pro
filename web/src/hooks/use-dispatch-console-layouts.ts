import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dispatchConsoleLayoutsApi, type DispatchConsoleLayoutRecord } from '@/api/dispatch-console-layouts.api';
import { message } from 'antd';

const QUERY_KEY = ['dispatch-console-layouts'];

export function useDispatchConsoleLayouts() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const res = await dispatchConsoleLayoutsApi.getAll();
      return res.data.data as DispatchConsoleLayoutRecord[];
    },
  });
}

export function useSaveDispatchConsoleLayout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      view_type,
      layout_mode,
      visible_fields,
    }: {
      view_type: string;
      layout_mode: string;
      visible_fields: string[];
    }) => dispatchConsoleLayoutsApi.save(view_type, layout_mode, visible_fields),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      message.success(`${res.data.data.view_type.toUpperCase()} layout updated successfully`);
    },
    onError: (err: Error) => {
      message.error(err.message || 'Failed to update layout');
    },
  });
}
