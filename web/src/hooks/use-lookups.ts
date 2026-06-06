import { useQuery } from '@tanstack/react-query';
import axios from '@/api/axios-instance';

export interface LookupItem {
  id: string;
  name: string;
}

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await axios.get<{ data: LookupItem[] }>('/lookups/categories');
      return response.data.data;
    },
  });
};

export const useSubCategories = (categoryId?: string) => {
  return useQuery({
    queryKey: ['sub-categories', categoryId],
    queryFn: async () => {
      const url = categoryId 
        ? `/lookups/sub-categories?category_id=${categoryId}`
        : `/lookups/sub-categories`;
      const response = await axios.get<{ data: LookupItem[] }>(url);
      return response.data.data;
    },
    enabled: !!categoryId,
  });
};

export const usePriorities = () => {
  return useQuery({
    queryKey: ['priorities'],
    queryFn: async () => {
      const response = await axios.get<{ data: LookupItem[] }>('/lookups/priorities');
      return response.data.data;
    },
  });
};

export const useLocations = () => {
  return useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const response = await axios.get<{ data: LookupItem[] }>('/lookups/locations');
      return response.data.data;
    },
  });
};
