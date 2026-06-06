import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import {
  schedulingApi,
  OptimizeScheduleRequest,
  DemandForecastRequest,
  RouteOptimizationRequest,
} from '../api/scheduling.api';

// Query keys
const QUERY_KEYS = {
  optimizations: ['scheduling', 'optimizations'],
  optimization: (id: string) => ['scheduling', 'optimization', id],
  recommendations: ['scheduling', 'recommendations'],
};

// Hook for optimizing schedule
export function useOptimizeSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: OptimizeScheduleRequest) => schedulingApi.optimizeSchedule(data),
    onSuccess: (response) => {
      message.success(response.message || 'Schedule optimized successfully');
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.optimizations });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Failed to optimize schedule');
    },
  });
}

// Hook for generating demand forecast
export function useDemandForecast() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: DemandForecastRequest) => schedulingApi.generateDemandForecast(data),
    onSuccess: (response) => {
      message.success(response.message || 'Demand forecast generated successfully');
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.optimizations });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Failed to generate demand forecast');
    },
  });
}

// Hook for optimizing route
export function useOptimizeRoute() {
  return useMutation({
    mutationFn: (data: RouteOptimizationRequest) => schedulingApi.optimizeRoute(data),
    onSuccess: (response) => {
      message.success(response.message || 'Route optimized successfully');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Failed to optimize route');
    },
  });
}

// Hook for getting optimization history
export function useOptimizations(params?: {
  optimization_type?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  take?: number;
}) {
  return useQuery({
    queryKey: [...QUERY_KEYS.optimizations, params],
    queryFn: () => schedulingApi.getOptimizations(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook for getting optimization by ID
export function useOptimization(id: string, enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.optimization(id),
    queryFn: () => schedulingApi.getOptimizationById(id),
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook for applying optimization
export function useApplyOptimization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      optimization_id: string;
      notify_technicians?: boolean;
      auto_create_appointments?: boolean;
    }) => schedulingApi.applyOptimization(data),
    onSuccess: (response, variables) => {
      message.success(response.message || 'Optimization applied successfully');
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.optimization(variables.optimization_id) });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Failed to apply optimization');
    },
  });
}

// Hook for getting scheduling recommendations
export function useSchedulingRecommendations(params: {
  start_date: string;
  end_date: string;
}, enabled = true) {
  return useQuery({
    queryKey: [...QUERY_KEYS.recommendations, params],
    queryFn: () => schedulingApi.getSchedulingRecommendations(params),
    enabled: enabled && !!params.start_date && !!params.end_date,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Hook for real-time optimization
export function useRealtimeOptimization() {
  return useMutation({
    mutationFn: (data: {
      current_locations: Array<any>;
      pending_jobs: Array<any>;
      use_traffic?: boolean;
    }) => schedulingApi.realtimeOptimization(data),
    onSuccess: () => {
      message.success('Real-time routes optimized successfully');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Failed to optimize real-time routes');
    },
  });
}

// Hook for checking technician availability
export function useCheckAvailability() {
  return useMutation({
    mutationFn: (data: { agent_id: string; start_time: string; end_time: string }) =>
      schedulingApi.checkAvailability(data),
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Failed to check availability');
    },
  });
}

// Hook for detecting scheduling conflicts
export function useDetectConflicts() {
  return useMutation({
    mutationFn: (data: {
      agent_id: string;
      start_time: string;
      end_time: string;
      exclude_appointment_id?: string;
    }) => schedulingApi.detectConflicts(data),
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Failed to detect conflicts');
    },
  });
}

// Hook for auto-assigning a work order
export function useAutoAssign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      work_order_id: string;
      scheduled_start: string;
      scheduled_end?: string;
      required_skills?: string[];
      territory?: string;
    }) => schedulingApi.autoAssign(data),
    onSuccess: (response) => {
      if (response.data?.assigned) {
        message.success(response.message || `Assigned to ${response.data.agent_name}`);
      } else {
        message.warning(response.message || 'No available technician found');
      }
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Failed to auto-assign');
    },
  });
}

// Hook for polling optimization status (for long-running tasks)
export function useOptimizationStatus(taskId: string | null, enabled = false) {
  return useQuery({
    queryKey: ['scheduling', 'status', taskId],
    queryFn: async () => {
      if (!taskId) return null;
      // In a real implementation, would call a status endpoint
      // For now, simulate checking status
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            task_id: taskId,
            status: 'completed',
            progress: 100,
            result: {},
          });
        }, 2000);
      });
    },
    enabled: enabled && !!taskId,
    refetchInterval: enabled ? 5000 : false, // Poll every 5 seconds
  });
}