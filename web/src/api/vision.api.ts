import axiosInstance from './axios-instance';
import { ApiResponse } from '../types/api.types';

export interface WorkVerificationResult {
  verified: boolean;
  confidence: number;
  findings: Array<{
    class: string;
    confidence: number;
    bbox?: number[];
    details?: string;
  }>;
  issues: string[];
  total_detections?: number;
  method?: string;
}

export interface EquipmentDetectionResult {
  detections: Array<{
    label: string;
    confidence: number;
    bbox?: number[];
    category?: string;
  }>;
  equipment_count: number;
  labels: string[];
  image_size?: { width: number; height: number };
}

export interface BeforeAfterResult {
  work_order_id: string;
  significant_change: boolean;
  change_percentage: number;
  similarity_score: number;
  ssim_score: number | null;
  color_similarity: number;
  changed_regions: Array<{
    grid_position: number[];
    bbox: number[];
    change_percentage: number;
    significance: string;
  }>;
  analysis: string;
}

export const visionApi = {
  verifyWork: async (
    file: File,
    workOrderId?: string,
  ): Promise<ApiResponse<WorkVerificationResult>> => {
    const formData = new FormData();
    formData.append('file', file);
    if (workOrderId) formData.append('work_order_id', workOrderId);
    const response = await axiosInstance.post('/vision/verify-work', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  identifyEquipment: async (
    file: File,
    equipmentType?: string,
  ): Promise<ApiResponse<EquipmentDetectionResult>> => {
    const formData = new FormData();
    formData.append('file', file);
    if (equipmentType) formData.append('equipment_type', equipmentType);
    const response = await axiosInstance.post('/vision/identify-equipment', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  compareBeforeAfter: async (
    beforeFile: File,
    afterFile: File,
    workOrderId?: string,
  ): Promise<ApiResponse<BeforeAfterResult>> => {
    const formData = new FormData();
    formData.append('before', beforeFile);
    formData.append('after', afterFile);
    if (workOrderId) formData.append('work_order_id', workOrderId);
    const response = await axiosInstance.post('/vision/compare-before-after', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};
