import { useMutation } from '@tanstack/react-query';
import { message } from 'antd';
import { visionApi } from '../api/vision.api';

export function useVerifyWork() {
  return useMutation({
    mutationFn: ({ file, workOrderId }: { file: File; workOrderId?: string }) =>
      visionApi.verifyWork(file, workOrderId),
    onSuccess: (response) => {
      if (response.data?.verified) {
        message.success('Work verification passed');
      } else {
        message.warning('Work verification: issues found');
      }
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Work verification failed');
    },
  });
}

export function useIdentifyEquipment() {
  return useMutation({
    mutationFn: ({ file, equipmentType }: { file: File; equipmentType?: string }) =>
      visionApi.identifyEquipment(file, equipmentType),
    onSuccess: (response) => {
      message.success(`${response.data?.equipment_count || 0} equipment detected`);
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Equipment identification failed');
    },
  });
}

export function useCompareBeforeAfter() {
  return useMutation({
    mutationFn: ({
      beforeFile,
      afterFile,
      workOrderId,
    }: {
      beforeFile: File;
      afterFile: File;
      workOrderId?: string;
    }) => visionApi.compareBeforeAfter(beforeFile, afterFile, workOrderId),
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Comparison failed');
    },
  });
}
