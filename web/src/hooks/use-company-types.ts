import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { companyTypesApi } from '@/api/company-types.api';

export function useCompanyTypes() {
  return useQuery({
    queryKey: ['company-types'],
    queryFn: async () => {
      const res = await companyTypesApi.getAll();
      return res.data.data ?? [];
    },
  });
}

export function useCreateCompanyType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ name }: { name: string }) => companyTypesApi.create(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-types'] });
    },
  });
}

export function useDeleteCompanyType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => companyTypesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-types'] });
    },
  });
}
