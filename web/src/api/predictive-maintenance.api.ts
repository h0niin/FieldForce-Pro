import axiosInstance from './axios-instance';
import { ApiResponse } from '../types/api.types';

export interface HealthScoreResult {
  equipment_id: string;
  health_score: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  factors: Array<{
    factor: string;
    impact: number;
    severity: string;
    details?: string;
  }>;
  recommendations: string[];
  algorithm: string;
  ml_available: boolean;
}

export interface FailurePrediction {
  equipment_id: string;
  failure_probability: number;
  predicted_failure_date: string | null;
  recommended_action: string;
  health_score: number;
  model_type: string;
  confidence: number;
  factors?: string[];
  forecast?: Array<{
    date: string;
    failure_probability: number;
    lower_bound: number;
    upper_bound: number;
  }>;
}

export interface IoTSensorReading {
  id: string;
  asset_id: string;
  sensor_type: string;
  value: number;
  unit: string;
  recorded_at: string;
  metadata?: Record<string, any>;
}

export interface IoTAnomalyResult {
  anomalies: Array<{
    sensor_type: string;
    value: number;
    z_score?: number;
    method: string;
  }>;
  total_anomalies: number;
  sensors_analyzed: string[];
}

export interface BatchHealthScoreResult {
  results: HealthScoreResult[];
  total_scored: number;
  average_health: number;
  risk_distribution: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
}

export const predictiveMaintenanceApi = {
  // Health Scoring
  getHealthScore: async (data: {
    equipment_id: string;
    historical_data?: any[];
    sensor_data?: any[];
  }): Promise<ApiResponse<HealthScoreResult>> => {
    const response = await axiosInstance.post('/iot-data/health-score/' + data.equipment_id, {});
    return response.data;
  },

  getBatchHealthScores: async (data: {
    equipment_list: Array<{
      equipment_id: string;
      historical_data?: any[];
      sensor_data?: any[];
    }>;
  }): Promise<ApiResponse<BatchHealthScoreResult>> => {
    const response = await axiosInstance.post('/iot-data/health-score/batch', data);
    return response.data;
  },

  // Failure Predictions
  predictFailureLSTM: async (data: {
    equipment_id: string;
    sensor_data?: any[];
    historical_data?: any[];
  }): Promise<ApiResponse<FailurePrediction>> => {
    const response = await axiosInstance.post('/iot-data/predict/failure/lstm', data);
    return response.data;
  },

  predictFailureProphet: async (data: {
    equipment_id: string;
    historical_data?: any[];
    horizon_days?: number;
  }): Promise<ApiResponse<FailurePrediction>> => {
    const response = await axiosInstance.post('/iot-data/predict/failure/prophet', data);
    return response.data;
  },

  predictFailureEnsemble: async (data: {
    equipment_id: string;
    sensor_data?: any[];
    historical_data?: any[];
    horizon_days?: number;
  }): Promise<ApiResponse<FailurePrediction>> => {
    const response = await axiosInstance.post('/iot-data/predict/failure/ensemble', data);
    return response.data;
  },

  // IoT Data
  getIoTData: async (params: {
    asset_id?: string;
    sensor_type?: string;
    start_date?: string;
    end_date?: string;
    page?: number;
    take?: number;
  }): Promise<ApiResponse<IoTSensorReading[]>> => {
    const response = await axiosInstance.get('/iot-data', { params });
    return response.data;
  },

  getLatestReadings: async (assetId: string): Promise<ApiResponse<IoTSensorReading[]>> => {
    const response = await axiosInstance.get(`/iot-data/latest/${assetId}`);
    return response.data;
  },

  ingestSensorData: async (data: {
    readings: Array<{
      sensor_type: string;
      value: number;
      unit?: string;
      equipment_id?: string;
      recorded_at?: string;
    }>;
    asset_id?: string;
  }): Promise<ApiResponse<{ total_received: number; total_stored: number }>> => {
    const response = await axiosInstance.post('/iot-data/webhook', data);
    return response.data;
  },

  getAssetHealthScore: async (assetId: string): Promise<ApiResponse<any>> => {
    const response = await axiosInstance.get(`/iot-data/health-score/${assetId}`);
    return response.data;
  },
};
