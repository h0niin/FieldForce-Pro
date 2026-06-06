import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  blueprintDefinitionsApi,
  blueprintStatesApi,
  blueprintTransitionsApi,
  CreateBlueprintPayload,
  UpdateBlueprintPayload,
  CreateBlueprintStatePayload,
  UpdateBlueprintStatePayload,
  CreateBlueprintTransitionPayload,
  UpdateBlueprintTransitionPayload,
} from '@/api/blueprints.api';
import type { PageOptions } from '@/types/api.types';
import { useNotificationStore } from '@/store/notification.store';

// Blueprint Definitions
export function useBlueprintDefinitions(params?: PageOptions) {
  return useQuery({
    queryKey: ['blueprint-definitions', params],
    queryFn: async () => {
      const response = await blueprintDefinitionsApi.getAll(params);
      return { data: response.data.data!, meta: response.data.meta! };
    },
  });
}

export function useBlueprintDefinition(id: string) {
  return useQuery({
    queryKey: ['blueprint-definitions', id],
    queryFn: async () => {
      const response = await blueprintDefinitionsApi.getById(id);
      return response.data.data!;
    },
    enabled: !!id,
  });
}

export function useCreateBlueprintDefinition() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (payload: CreateBlueprintPayload) => blueprintDefinitionsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blueprint-definitions'] });
      addNotification({ type: 'success', message: 'Blueprint created successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to create blueprint' });
    },
  });
}

export function useUpdateBlueprintDefinition() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateBlueprintPayload & { id: string }) =>
      blueprintDefinitionsApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blueprint-definitions'] });
      addNotification({ type: 'success', message: 'Blueprint updated successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to update blueprint' });
    },
  });
}

export function useDeleteBlueprintDefinition() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (id: string) => blueprintDefinitionsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blueprint-definitions'] });
      addNotification({ type: 'success', message: 'Blueprint deleted successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to delete blueprint' });
    },
  });
}

// Blueprint States
export function useBlueprintStates(blueprintId: string) {
  return useQuery({
    queryKey: ['blueprint-states', 'blueprint', blueprintId],
    queryFn: async () => {
      const response = await blueprintStatesApi.getByBlueprintId(blueprintId);
      return response.data.data!;
    },
    enabled: !!blueprintId,
  });
}

export function useCreateBlueprintState() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (payload: CreateBlueprintStatePayload) => blueprintStatesApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blueprint-states'] });
      addNotification({ type: 'success', message: 'State added' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to add state' });
    },
  });
}

export function useUpdateBlueprintState() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateBlueprintStatePayload & { id: string }) =>
      blueprintStatesApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blueprint-states'] });
      addNotification({ type: 'success', message: 'State updated' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to update state' });
    },
  });
}

export function useDeleteBlueprintState() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (id: string) => blueprintStatesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blueprint-states'] });
      addNotification({ type: 'success', message: 'State removed' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to remove state' });
    },
  });
}

// Blueprint Transitions
export function useBlueprintTransitions(blueprintId: string) {
  return useQuery({
    queryKey: ['blueprint-transitions', 'blueprint', blueprintId],
    queryFn: async () => {
      const response = await blueprintTransitionsApi.getByBlueprintId(blueprintId);
      return response.data.data!;
    },
    enabled: !!blueprintId,
  });
}

export function useCreateBlueprintTransition() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (payload: CreateBlueprintTransitionPayload) => blueprintTransitionsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blueprint-transitions'] });
      addNotification({ type: 'success', message: 'Transition added' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to add transition' });
    },
  });
}

export function useUpdateBlueprintTransition() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateBlueprintTransitionPayload & { id: string }) =>
      blueprintTransitionsApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blueprint-transitions'] });
      addNotification({ type: 'success', message: 'Transition updated' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to update transition' });
    },
  });
}

export function useDeleteBlueprintTransition() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (id: string) => blueprintTransitionsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blueprint-transitions'] });
      addNotification({ type: 'success', message: 'Transition removed' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to remove transition' });
    },
  });
}

// Aliases for backward compatibility
export const useBlueprints = useBlueprintDefinitions;
export const useBlueprint = useBlueprintDefinition;
export const useCreateBlueprint = useCreateBlueprintDefinition;
export const useUpdateBlueprint = useUpdateBlueprintDefinition;
export const useDeleteBlueprint = useDeleteBlueprintDefinition;
