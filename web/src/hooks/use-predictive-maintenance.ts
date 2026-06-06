import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { predictiveMaintenanceApi } from '../api/predictive-maintenance.api';

const QUERY_KEYS = {
  healthScores: ['predictive-maintenance', 'health-scores'],
  healthScore: (id: string) => ['predictive-maintenance', 'health-score', id],
  predictions: ['predictive-maintenance', 'predictions'],
  iotData: ['predictive-maintenance', 'iot-data'],
  latestReadings: (id: string) => ['predictive-maintenance', 'latest-readings', id],
};

export function useAssetHealthScore(assetId: string, enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.healthScore(assetId),
    queryFn: () => predictiveMaintenanceApi.getAssetHealthScore(assetId),
    enabled: enabled && !!assetId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useBatchHealthScores() {
  return useMutation({
    mutationFn: predictiveMaintenanceApi.getBatchHealthScores,
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Failed to calculate health scores');
    },
  });
}

export function usePredictFailureLSTM() {
  return useMutation({
    mutationFn: predictiveMaintenanceApi.predictFailureLSTM,
    onSuccess: (response) => {
      message.success(response.message || 'LSTM prediction completed');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'LSTM prediction failed');
    },
  });
}

export function usePredictFailureProphet() {
  return useMutation({
    mutationFn: predictiveMaintenanceApi.predictFailureProphet,
    onSuccess: (response) => {
      message.success(response.message || 'Prophet prediction completed');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Prophet prediction failed');
    },
  });
}

export function usePredictFailureEnsemble() {
  return useMutation({
    mutationFn: predictiveMaintenanceApi.predictFailureEnsemble,
    onSuccess: (response) => {
      message.success(response.message || 'Ensemble prediction completed');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Ensemble prediction failed');
    },
  });
}

export function useIoTData(params: {
  asset_id?: string;
  sensor_type?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  take?: number;
}, enabled = true) {
  return useQuery({
    queryKey: [...QUERY_KEYS.iotData, params],
    queryFn: () => predictiveMaintenanceApi.getIoTData(params),
    enabled,
    staleTime: 30 * 1000,
  });
}

export function useLatestReadings(assetId: string, enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.latestReadings(assetId),
    queryFn: () => predictiveMaintenanceApi.getLatestReadings(assetId),
    enabled: enabled && !!assetId,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
}

export function useIngestSensorData() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: predictiveMaintenanceApi.ingestSensorData,
    onSuccess: (response) => {
      message.success(response.message || 'Sensor data ingested');
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.iotData });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Failed to ingest sensor data');
    },
  });
}
