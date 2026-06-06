import api from './axios-instance';
import type { ApiResponse, PageOptions } from '@/types/api.types';
import type { JobSheetTemplate, JobSheetInstance, JobSheetItem } from '@/types/models.types';

// Templates
export interface CreateJobSheetTemplatePayload {
  name: string;
  description?: string;
  category?: string;
  items?: Record<string, unknown>[];
  is_active?: boolean;
  custom_fields?: Record<string, unknown>;
}

export interface UpdateJobSheetTemplatePayload {
  name?: string;
  description?: string;
  category?: string;
  items?: Record<string, unknown>[];
  is_active?: boolean;
  custom_fields?: Record<string, unknown>;
}

export const jobSheetTemplatesApi = {
  getAll(params?: PageOptions) {
    return api.get<ApiResponse<JobSheetTemplate[]>>('/job-sheet-templates', { params });
  },

  getAllNonPaginated() {
    return api.get<ApiResponse<JobSheetTemplate[]>>('/job-sheet-templates/all');
  },

  getById(id: string) {
    return api.get<ApiResponse<JobSheetTemplate>>(`/job-sheet-templates/${id}`);
  },

  create(payload: CreateJobSheetTemplatePayload) {
    return api.post<ApiResponse<JobSheetTemplate>>('/job-sheet-templates', payload);
  },

  update(id: string, payload: UpdateJobSheetTemplatePayload) {
    return api.put<ApiResponse<JobSheetTemplate>>(`/job-sheet-templates/${id}`, payload);
  },

  delete(id: string) {
    return api.delete<ApiResponse<null>>(`/job-sheet-templates/${id}`);
  },
};

// Instances
export interface CreateJobSheetInstancePayload {
  template_id: string;
  appointment_id?: string;
  work_order_id?: string;
  status?: string;
  custom_fields?: Record<string, unknown>;
}

export interface UpdateJobSheetInstancePayload {
  status?: string;
  work_order_id?: string;
  completed_by?: string;
  completed_at?: string;
  custom_fields?: Record<string, unknown>;
}

export const jobSheetInstancesApi = {
  getAll(params?: PageOptions & { status?: string; excludeStatus?: string }) {
    return api.get<ApiResponse<JobSheetInstance[]>>('/job-sheet-instances', { params });
  },

  getMyDrafts(params?: PageOptions) {
    return api.get<ApiResponse<JobSheetInstance[]>>('/job-sheet-instances/my-drafts', { params });
  },

  getMyApprovals(params?: PageOptions) {
    return api.get<ApiResponse<JobSheetInstance[]>>('/job-sheet-instances/my-approvals', { params });
  },

  getById(id: string) {
    return api.get<ApiResponse<JobSheetInstance>>(`/job-sheet-instances/${id}`);
  },

  getByAppointmentId(appointmentId: string) {
    return api.get<ApiResponse<JobSheetInstance[]>>(`/job-sheet-instances/appointment/${appointmentId}`);
  },

  getByWorkOrderId(workOrderId: string) {
    return api.get<ApiResponse<JobSheetInstance[]>>(`/job-sheet-instances/work-order/${workOrderId}`);
  },

  create(payload: CreateJobSheetInstancePayload) {
    return api.post<ApiResponse<JobSheetInstance>>('/job-sheet-instances', payload);
  },

  update(id: string, payload: UpdateJobSheetInstancePayload) {
    return api.put<ApiResponse<JobSheetInstance>>(`/job-sheet-instances/${id}`, payload);
  },

  delete(id: string) {
    return api.delete<ApiResponse<null>>(`/job-sheet-instances/${id}`);
  },
};

// Items
export interface CreateJobSheetItemPayload {
  instance_id: string;
  label: string;
  type?: 'checkbox' | 'text' | 'photo' | 'signature' | 'number' | 'date';
  value?: string;
  photo_url?: string;
  is_required?: boolean;
  sort_order?: number;
}

export interface UpdateJobSheetItemPayload {
  label?: string;
  type?: string;
  value?: string;
  photo_url?: string;
  is_required?: boolean;
  sort_order?: number;
}

export const jobSheetItemsApi = {
  getByInstanceId(instanceId: string) {
    return api.get<ApiResponse<JobSheetItem[]>>(`/job-sheet-items/instance/${instanceId}`);
  },

  getById(id: string) {
    return api.get<ApiResponse<JobSheetItem>>(`/job-sheet-items/${id}`);
  },

  create(payload: CreateJobSheetItemPayload) {
    return api.post<ApiResponse<JobSheetItem>>('/job-sheet-items', payload);
  },

  update(id: string, payload: UpdateJobSheetItemPayload) {
    return api.put<ApiResponse<JobSheetItem>>(`/job-sheet-items/${id}`, payload);
  },

  delete(id: string) {
    return api.delete<ApiResponse<null>>(`/job-sheet-items/${id}`);
  },
};
