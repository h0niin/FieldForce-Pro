import React, { useState, useEffect } from 'react';
import { Modal, Steps, Button, Typography, Result } from 'antd';
import { useAuthStore } from '@/store/auth.store';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/api/axios-instance';
import { useTranslation } from 'react-i18next';

const { Title, Paragraph } = Typography;

export default function OnboardingWizard() {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  // Query onboarding status
  const { data, isLoading } = useQuery({
    queryKey: ['onboardingStatus', user?.id],
    queryFn: async () => {
      const res = await axiosInstance.get('/onboarding/status');
      return res.data.data; // { isComplete: boolean }
    },
    enabled: !!user && !user.is_super_admin,
  });

  // Mutation to mark onboarding complete
  const { mutate: completeOnboarding, isPending } = useMutation({
    mutationFn: async () => {
      await axiosInstance.patch('/onboarding/complete');
    },
    onSuccess: () => {
      setIsModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['onboardingStatus'] });
    },
  });

  useEffect(() => {
    if (data && !data.isComplete && !isLoading) {
      setIsModalOpen(true);
    }
  }, [data, isLoading]);

  const steps = [
    {
      title: t('onboardingWizard.steps.welcome.title'),
      content: (
        <div className="text-center py-8">
          <Title level={3}>{t('onboardingWizard.steps.welcome.header')}</Title>
          <Paragraph>
            {t('onboardingWizard.steps.welcome.description')}
          </Paragraph>
        </div>
      ),
    },
    {
      title: t('onboardingWizard.steps.profileSetup.title'),
      content: (
        <div className="py-8">
          <Title level={4}>{t('onboardingWizard.steps.profileSetup.header')}</Title>
          <Paragraph>
            {t('onboardingWizard.steps.profileSetup.description')}
          </Paragraph>
        </div>
      ),
    },
    {
      title: t('onboardingWizard.steps.ready.title'),
      content: (
        <Result
          status="success"
          title={t('onboardingWizard.steps.ready.header')}
          subTitle={t('onboardingWizard.steps.ready.description')}
        />
      ),
    },
  ];

  if (!isModalOpen) return null;

  return (
    <Modal
      title={t('onboardingWizard.modalTitle')}
      open={isModalOpen}
      closable={false}
      maskClosable={false}
      footer={null}
      width={600}
    >
      <div className="mb-6 mt-4">
        <Steps current={currentStep} items={steps.map((s) => ({ title: s.title }))} />
      </div>
      <div className="min-h-[150px]">{steps[currentStep].content}</div>
      <div className="mt-8 flex justify-end gap-3">
        {currentStep > 0 && (
          <Button onClick={() => setCurrentStep((c) => c - 1)}>{t('onboardingWizard.buttons.back')}</Button>
        )}
        {currentStep < steps.length - 1 && (
          <Button type="primary" onClick={() => setCurrentStep((c) => c + 1)}>
            {t('onboardingWizard.buttons.next')}
          </Button>
        )}
        {currentStep === steps.length - 1 && (
          <Button type="primary" loading={isPending} onClick={() => completeOnboarding()}>
            {t('onboardingWizard.buttons.finish')}
          </Button>
        )}
      </div>
    </Modal>
  );
}