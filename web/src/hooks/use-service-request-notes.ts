import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  serviceRequestNotesApi,
  CreateServiceRequestNotePayload,
} from '@/api/service-request-notes.api';

export function useServiceRequestNotes(serviceRequestId: string, enabled = true) {
  return useQuery({
    queryKey: ['service-request-notes', serviceRequestId],
    queryFn: async () => {
      const res = await serviceRequestNotesApi.getByServiceRequestId(serviceRequestId);
      return res.data.data ?? [];
    },
    enabled: !!serviceRequestId && enabled,
  });
}

export function useCreateServiceRequestNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateServiceRequestNotePayload) =>
      serviceRequestNotesApi.create(payload),
    onSuccess: (_res, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['service-request-notes', variables.service_request_id],
      });
    },
  });
}
