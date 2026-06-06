import axiosInstance from './axios-instance';
import { ApiResponse, PagedResponse } from '../types/api.types';

export interface WorkOrderInput {
  id: string;
  service_location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  estimated_duration: number;
  time_window_start: string;
  time_window_end: string;
  required_skills?: string[];
  territory?: string;
  priority?: number;
}

export interface TechnicianInput {
  id: string;
  name: string;
  start_lat: number;
  start_lng: number;
  end_lat?: number;
  end_lng?: number;
  skills?: string[];
  territories?: string[];
  shift_start: string;
  shift_end: string;
  max_jobs?: number;
  max_distance?: number;
}

export interface OptimizeScheduleRequest {
  work_orders: WorkOrderInput[];
  technicians: TechnicianInput[];
  constraints?: {
    optimization_time_limit?: number;
    use_traffic_data?: boolean;
    allow_overtime?: boolean;
    buffer_percentage?: number;
  };
  optimization_date?: string;
}

export interface OptimizedSchedule {
  optimization_id: string;
  schedule: Array<{
    technician_id: string;
    technician_name: string;
    route: Array<{
      work_order_id: string;
      address: string;
      arrival_time: string;
      duration: number;
      sequence: number;
    }>;
    total_stops: number;
    estimated_duration: number;
  }>;
  cost: number;
  unassigned: string[];
  optimization_score: number;
  message?: string;
}

export interface DemandForecastRequest {
  historical_data: Array<{
    date: string;
    demand: number;
  }>;
  horizon_days: number;
  service_type?: string;
  include_seasonality?: boolean;
}

export interface DemandForecastResponse {
  forecast_id: string;
  forecast: Array<{
    date: string;
    predicted_demand: number;
    lower_bound: number;
    upper_bound: number;
  }>;
  trend: 'increasing' | 'decreasing' | 'stable';
  seasonality: Record<string, any>;
  capacity_recommendations: {
    average_daily_capacity: number;
    peak_capacity: number;
    minimum_technicians: number;
    buffer_percentage: number;
    peak_days: string[];
  };
  metrics: Record<string, any>;
  message?: string;
}

export interface RouteOptimizationRequest {
  locations: Array<{
    id: string;
    latitude: number;
    longitude: number;
    address: string;
    duration?: number;
  }>;
  start_location?: {
    latitude: number;
    longitude: number;
  };
  end_location?: {
    latitude: number;
    longitude: number;
  };
  use_traffic?: boolean;
}

export interface RouteOptimizationResponse {
  optimization_id: string;
  route: Array<{
    id: string;
    latitude: number;
    longitude: number;
    address: string;
    sequence?: number;
  }>;
  total_distance_km: number;
  total_duration_minutes: number;
  waypoints?: Array<[number, number]>;
  message?: string;
}

export interface SchedulingOptimization {
  id: string;
  tenant_id: string;
  optimization_type: 'vrp' | 'demand_forecast' | 'realtime' | 'recommendation';
  optimization_date: string;
  start_date?: string;
  end_date?: string;
  input_parameters: any;
  optimization_result: any;
  optimization_score?: number;
  total_jobs?: number;
  assigned_jobs?: number;
  unassigned_jobs?: number;
  total_distance_km?: number;
  total_duration_minutes?: number;
  execution_time_seconds?: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error_message?: string;
  is_applied: boolean;
  applied_at?: string;
  created_at: string;
  updated_at: string;
}

export interface AvailabilityResult {
  available: boolean;
  conflicts: any[];
  reasons: string[];
}

export interface ConflictResult {
  has_conflicts: boolean;
  conflict_count: number;
  conflicts: any[];
}

export interface AutoAssignCandidate {
  agent_id: string;
  agent_name: string;
  score: number;
  available: boolean;
  reasons: string[];
}

export interface AutoAssignResult {
  assigned: boolean;
  agent_id: string | null;
  agent_name: string | null;
  score: number;
  candidates: AutoAssignCandidate[];
}

export const schedulingApi = {
  // Optimize work order scheduling
  optimizeSchedule: async (data: OptimizeScheduleRequest): Promise<ApiResponse<OptimizedSchedule>> => {
    const response = await axiosInstance.post('/scheduling/optimize', data);
    return response.data;
  },

  // Generate demand forecast
  generateDemandForecast: async (data: DemandForecastRequest): Promise<ApiResponse<DemandForecastResponse>> => {
    const response = await axiosInstance.post('/scheduling/forecast/demand', data);
    return response.data;
  },

  // Optimize route for single technician
  optimizeRoute: async (data: RouteOptimizationRequest): Promise<ApiResponse<RouteOptimizationResponse>> => {
    const response = await axiosInstance.post('/scheduling/optimize/route', data);
    return response.data;
  },

  // Get optimization history
  getOptimizations: async (params?: {
    optimization_type?: string;
    status?: string;
    start_date?: string;
    end_date?: string;
    page?: number;
    take?: number;
  }): Promise<PagedResponse<SchedulingOptimization>> => {
    const response = await axiosInstance.get('/scheduling/optimizations', { params });
    return response.data;
  },

  // Get optimization by ID
  getOptimizationById: async (id: string): Promise<ApiResponse<SchedulingOptimization>> => {
    const response = await axiosInstance.get(`/scheduling/optimizations/${id}`);
    return response.data;
  },

  // Apply optimization results
  applyOptimization: async (data: {
    optimization_id: string;
    notify_technicians?: boolean;
    auto_create_appointments?: boolean;
  }): Promise<ApiResponse<any>> => {
    const response = await axiosInstance.post('/scheduling/apply', data);
    return response.data;
  },

  // Get AI scheduling recommendations
  getSchedulingRecommendations: async (params: {
    start_date: string;
    end_date: string;
  }): Promise<ApiResponse<any>> => {
    const response = await axiosInstance.get('/scheduling/recommendations', { params });
    return response.data;
  },

  // Real-time route optimization
  realtimeOptimization: async (data: {
    current_locations: Array<{
      technician_id: string;
      current_position: { latitude: number; longitude: number };
      end_location?: { latitude: number; longitude: number };
    }>;
    pending_jobs: Array<{
      technician_id: string;
      id: string;
      latitude: number;
      longitude: number;
      address: string;
    }>;
    use_traffic?: boolean;
  }): Promise<ApiResponse<any>> => {
    const response = await axiosInstance.post('/scheduling/optimize/realtime', data);
    return response.data;
  },

  // Check technician availability
  checkAvailability: async (data: {
    agent_id: string;
    start_time: string;
    end_time: string;
  }): Promise<ApiResponse<AvailabilityResult>> => {
    const response = await axiosInstance.post('/scheduling/availability/check', data);
    return response.data;
  },

  // Detect scheduling conflicts
  detectConflicts: async (data: {
    agent_id: string;
    start_time: string;
    end_time: string;
    exclude_appointment_id?: string;
  }): Promise<ApiResponse<ConflictResult>> => {
    const response = await axiosInstance.post('/scheduling/conflicts/detect', data);
    return response.data;
  },

  // Auto-assign work order to best technician
  autoAssign: async (data: {
    work_order_id: string;
    scheduled_start: string;
    scheduled_end?: string;
    required_skills?: string[];
    territory?: string;
  }): Promise<ApiResponse<AutoAssignResult>> => {
    const response = await axiosInstance.post('/scheduling/auto-assign', data);
    return response.data;
  },
};