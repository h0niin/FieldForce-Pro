import { useState } from 'react';
import {
  Card,
  Steps,
  Button,
  Space,
  Input,
  Alert,
  Typography,
  Tag,
  Modal,
  Spin,
  QRCode,
  Radio,
  message,
} from 'antd';
import {
  MailOutlined,
  SafetyOutlined,
  CheckCircleOutlined,
  MobileOutlined,
  CopyOutlined,
  DownloadOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/api/auth.api';
import { useTranslation } from 'react-i18next'; // Rule 1

const { Title, Text, Paragraph } = Typography;

type MFAMethod = 'email' | 'totp';

export default function MFASetupWizard() {
  const { t } = useTranslation(); // Rule 2
  const queryClient = useQueryClient();
  const [selectedMethod, setSelectedMethod] = useState<MFAMethod>('email');
  const [currentStep, setCurrentStep] = useState(0);
  const [verificationCode, setVerificationCode] = useState('');
  const [emailSetupToken, setEmailSetupToken] = useState('');
  const [totpSecret, setTotpSecret] = useState('');
  const [totpUrl, setTotpUrl] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);

  const { data: mfaStatus, isLoading: statusLoading } = useQuery({
    queryKey: ['mfa', 'status'],
    queryFn: async () => {
      const res = await authApi.getMFAStatus();
      return res.data.data!;
    },
  });

  // ─── Email MFA mutations ──────────────────────────────────

  const setupEmailMutation = useMutation({
    mutationFn: () => authApi.setupMFA(),
    onSuccess: (res) => {
      const data = res.data.data!;
      setEmailSetupToken(data.token);
      setCurrentStep(2);
    },
  });

  const enableEmailMutation = useMutation({
    mutationFn: (code: string) => authApi.enableMFA(emailSetupToken, code),
    onSuccess: (res) => {
      const codes = res.data.data?.recovery_codes ?? [];
      setRecoveryCodes(codes);
      setCurrentStep(3);
      queryClient.invalidateQueries({ queryKey: ['mfa', 'status'] });
    },
  });

  // ─── TOTP MFA mutations ──────────────────────────────────

  const setupTOTPMutation = useMutation({
    mutationFn: () => authApi.setupTOTP(),
    onSuccess: (res) => {
      const data = res.data.data!;
      setTotpSecret(data.secret);
      setTotpUrl(data.otpauth_url);
      setCurrentStep(2);
    },
  });

  const enableTOTPMutation = useMutation({
    mutationFn: (code: string) => authApi.enableTOTP(code),
    onSuccess: (res) => {
      const codes = res.data.data?.recovery_codes ?? [];
      setRecoveryCodes(codes);
      setCurrentStep(3);
      queryClient.invalidateQueries({ queryKey: ['mfa', 'status'] });
    },
  });

  // ─── Disable MFA ──────────────────────────────────────────

  const disableMutation = useMutation({
    mutationFn: () => authApi.disableMFA(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mfa', 'status'] });
    },
  });

  const regenerateMutation = useMutation({
    mutationFn: () => authApi.regenerateRecoveryCodes(),
    onSuccess: (res) => {
      const codes = res.data.data?.recovery_codes ?? [];
      setRecoveryCodes(codes);
      queryClient.invalidateQueries({ queryKey: ['mfa', 'status'] });
    },
  });

  const mfaEnabled = mfaStatus?.mfa_enabled ?? false;
  const activeMethod = mfaStatus?.mfa_method ?? null;

  const handleChooseMethod = () => {
    setCurrentStep(1);
    setVerificationCode('');
    if (selectedMethod === 'email') {
      setupEmailMutation.mutate();
    } else {
      setupTOTPMutation.mutate();
    }
  };

  const handleVerifyAndEnable = () => {
    if (selectedMethod === 'email') {
      enableEmailMutation.mutate(verificationCode);
    } else {
      enableTOTPMutation.mutate(verificationCode);
    }
  };

  const handleFinish = () => {
    setCurrentStep(0);
    setVerificationCode('');
    setEmailSetupToken('');
    setTotpSecret('');
    setTotpUrl('');
    setRecoveryCodes([]);
  };

  const handleCopyRecoveryCodes = () => {
    const text = recoveryCodes.join('\n');
    navigator.clipboard.writeText(text);
    message.success(t('mfaSetupWizard.recoveryCodesCopiedMessage'));
  };

  const handleDownloadRecoveryCodes = () => {
    const text = `${t('mfaSetupWizard.downloadFileHeader')}\n${'='.repeat(30)}\n\n${t('mfaSetupWizard.downloadFileInstructions')}\n\n${recoveryCodes.map((c, i) => `${i + 1}. ${c}`).join('\n')}\n`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fieldforce-recovery-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRegenerateRecoveryCodes = () => {
    Modal.confirm({
      title: t('mfaSetupWizard.regenerateModal.title'),
      content: t('mfaSetupWizard.regenerateModal.content'),
      onOk: () => regenerateMutation.mutate(),
    });
  };

  const handleDisable = () => {
    Modal.confirm({
      title: t('mfaSetupWizard.disableModal.title'),
      content: t('mfaSetupWizard.disableModal.content'),
      okButtonProps: { danger: true },
      onOk: () => disableMutation.mutate(),
    });
  };

  const isSetupLoading = setupEmailMutation.isPending || setupTOTPMutation.isPending;
  const isEnableLoading = enableEmailMutation.isPending || enableTOTPMutation.isPending;
  const enableError = selectedMethod === 'email' ? enableEmailMutation : enableTOTPMutation;

  if (statusLoading) {
    return <Spin />;
  }

  return (
    <div>
      {/* Current MFA Status */}
      <Card style={{ marginBottom: 24 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Title level={5} style={{ margin: 0 }}>
                {t('mfaSetupWizard.statusCard.title')}
              </Title>
              <Text type="secondary">
                {mfaEnabled
                  ? t('mfaSetupWizard.statusCard.mfaEnabledText')
                  : t('mfaSetupWizard.statusCard.mfaDisabledText')}
              </Text>
            </div>
            <Tag color={mfaEnabled ? 'success' : 'default'} icon={<SafetyOutlined />}>
              {mfaEnabled ? t('mfaSetupWizard.statusCard.tagEnabled') : t('mfaSetupWizard.statusCard.tagDisabled')}
            </Tag>
          </div>

          {mfaEnabled && (
            <div>
              <Alert
                message={
                  activeMethod === 'totp'
                    ? t('mfaSetupWizard.statusCard.totpProtectedMessage')
                    : t('mfaSetupWizard.statusCard.emailProtectedMessage')
                }
                type="success"
                showIcon
                icon={activeMethod === 'totp' ? <MobileOutlined /> : <MailOutlined />}
              />
              <div style={{ marginTop: 12 }}>
                <Text type="secondary">{t('mfaSetupWizard.statusCard.activeMethodLabel')}</Text>
                <Tag color="blue">
                  {activeMethod === 'totp' ? t('mfaSetupWizard.statusCard.totpMethod') : t('mfaSetupWizard.statusCard.emailMethod')}
                </Tag>
              </div>
              <div style={{ marginTop: 12 }}>
                <Text type="secondary">{t('mfaSetupWizard.statusCard.recoveryCodesRemainingLabel')}</Text>
                <Tag color={
                  (mfaStatus?.recovery_codes_remaining ?? 0) <= 2 ? 'error' :
                    (mfaStatus?.recovery_codes_remaining ?? 0) <= 4 ? 'warning' : 'success'
                }>
                  {mfaStatus?.recovery_codes_remaining ?? 0}
                </Tag>
              </div>
              <Space style={{ marginTop: 16 }}>
                <Button
                  icon={<ReloadOutlined />}
                  loading={regenerateMutation.isPending}
                  onClick={handleRegenerateRecoveryCodes}
                >
                  {t('mfaSetupWizard.statusCard.regenerateCodesButton')}
                </Button>
                <Button
                  danger
                  loading={disableMutation.isPending}
                  onClick={handleDisable}
                >
                  {t('mfaSetupWizard.statusCard.disableMfaButton')}
                </Button>
              </Space>
              {recoveryCodes.length > 0 && (
                <Card size="small" style={{ marginTop: 16, background: 'rgba(250, 173, 20, 0.1)', borderColor: 'rgba(250, 173, 20, 0.25)' }}>
                  <Alert
                    message={t('mfaSetupWizard.statusCard.saveRecoveryCodesMessage')}
                    description={t('mfaSetupWizard.statusCard.saveRecoveryCodesDescription')}
                    type="warning"
                    showIcon
                    style={{ marginBottom: 16 }}
                  />
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 8,
                      padding: 16,
                      background: 'var(--card-bg)',
                      borderRadius: 4,
                      fontFamily: 'monospace',
                      fontSize: 16,
                      marginBottom: 16,
                    }}
                  >
                    {recoveryCodes.map((code) => (
                      <div key={code} style={{ padding: '4px 0' }}>{code}</div>
                    ))}
                  </div>
                  <Space>
                    <Button icon={<CopyOutlined />} onClick={handleCopyRecoveryCodes}>
                      {t('mfaSetupWizard.statusCard.copyAllButton')}
                    </Button>
                    <Button icon={<DownloadOutlined />} onClick={handleDownloadRecoveryCodes}>
                      {t('mfaSetupWizard.statusCard.downloadTxtButton')}
                    </Button>
                  </Space>
                </Card>
              )}
            </div>
          )}
        </Space>
      </Card>

      {!mfaEnabled && (
        <Card title={t('mfaSetupWizard.setupCard.title')}>
          <Steps
            current={currentStep}
            style={{ marginBottom: 32 }}
            items={[
              { title: t('mfaSetupWizard.steps.chooseMethod') },
              { title: t('mfaSetupWizard.steps.setup') },
              { title: t('mfaSetupWizard.steps.verify') },
              { title: t('mfaSetupWizard.steps.done') },
            ]}
          />

          {/* Step 0: Choose Method */}
          {currentStep === 0 && (
            <div>
              <Title level={5}>{t('mfaSetupWizard.chooseMethod.title')}</Title>
              <Paragraph>
                {t('mfaSetupWizard.chooseMethod.description')}
              </Paragraph>

              <Radio.Group
                value={selectedMethod}
                onChange={(e) => setSelectedMethod(e.target.value)}
                style={{ width: '100%', marginBottom: 24 }}
              >
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                  <Card
                    hoverable
                    size="small"
                    style={{
                      border: selectedMethod === 'email' ? '2px solid #1890ff' : '1px solid var(--border-color)',
                      cursor: 'pointer',
                    }}
                    onClick={() => setSelectedMethod('email')}
                  >
                    <Radio value="email">
                      <Space>
                        <MailOutlined style={{ fontSize: 20, color: '#1890ff' }} />
                        <div>
                          <Text strong>{t('mfaSetupWizard.chooseMethod.emailOtpTitle')}</Text>
                          <br />
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {t('mfaSetupWizard.chooseMethod.emailOtpDescription')}
                          </Text>
                        </div>
                      </Space>
                    </Radio>
                  </Card>

                  <Card
                    hoverable
                    size="small"
                    style={{
                      border: selectedMethod === 'totp' ? '2px solid #1890ff' : '1px solid var(--border-color)',
                      cursor: 'pointer',
                    }}
                    onClick={() => setSelectedMethod('totp')}
                  >
                    <Radio value="totp">
                      <Space>
                        <MobileOutlined style={{ fontSize: 20, color: '#52c41a' }} />
                        <div>
                          <Text strong>{t('mfaSetupWizard.chooseMethod.authenticatorAppTitle')}</Text>
                          <br />
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {t('mfaSetupWizard.chooseMethod.authenticatorAppDescription')}
                          </Text>
                        </div>
                      </Space>
                    </Radio>
                  </Card>
                </Space>
              </Radio.Group>

              <Button
                type="primary"
                loading={isSetupLoading}
                onClick={handleChooseMethod}
              >
                {t('mfaSetupWizard.chooseMethod.continueButton')}
              </Button>
            </div>
          )}

          {/* Step 1: Setup (loading / transition) */}
          {currentStep === 1 && (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <Spin size="large" />
              <Paragraph style={{ marginTop: 16 }}>
                {t(selectedMethod === 'totp' ? 'mfaSetupWizard.setupLoading.totpText' : 'mfaSetupWizard.setupLoading.emailText')}
              </Paragraph>
            </div>
          )}

          {/* Step 2: Verify */}
          {currentStep === 2 && selectedMethod === 'email' && (
            <div>
              <Title level={5}>{t('mfaSetupWizard.verifyEmail.title')}</Title>
              <Paragraph>
                {t('mfaSetupWizard.verifyEmail.description')}
              </Paragraph>

              <Input
                size="large"
                placeholder={t('mfaSetupWizard.verifyEmail.inputPlaceholder')}
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                style={{ width: 200, fontSize: 24, textAlign: 'center', letterSpacing: 8, marginBottom: 24 }}
              />

              {enableError.isError && (
                <Alert
                  message={
                    (enableError.error as { response?: { data?: { message?: string } } })
                      ?.response?.data?.message?.includes('expired')
                      ? t('mfaSetupWizard.verifyEmail.expiredCodeMessage')
                      : t('mfaSetupWizard.verifyEmail.invalidCodeMessage')
                  }
                  type={
                    (enableError.error as { response?: { data?: { message?: string } } })
                      ?.response?.data?.message?.includes('expired')
                      ? 'warning'
                      : 'error'
                  }
                  showIcon
                  style={{ marginBottom: 16 }}
                />
              )}

              <div>
                <Space>
                  <Button onClick={() => { setCurrentStep(0); setVerificationCode(''); setEmailSetupToken(''); }}>
                    {t('mfaSetupWizard.verifyEmail.backButton')}
                  </Button>
                  <Button
                    type="primary"
                    loading={isEnableLoading}
                    disabled={verificationCode.length !== 6}
                    onClick={handleVerifyAndEnable}
                  >
                    {t('mfaSetupWizard.verifyEmail.verifyEnableButton')}
                  </Button>
                  <Button
                    type="link"
                    loading={setupEmailMutation.isPending}
                    onClick={() => setupEmailMutation.mutate()}
                  >
                    {t('mfaSetupWizard.verifyEmail.resendCodeButton')}
                  </Button>
                </Space>
              </div>
            </div>
          )}

          {currentStep === 2 && selectedMethod === 'totp' && (
            <div>
              <Title level={5}>{t('mfaSetupWizard.verifyTotp.scanQrTitle')}</Title>
              <Paragraph>
                {t('mfaSetupWizard.verifyTotp.scanQrDescription')}
              </Paragraph>

              <div style={{ display: 'flex', gap: 32, marginBottom: 24, flexWrap: 'wrap' }}>
                <div>
                  <QRCode value={totpUrl} size={200} />
                </div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <Alert
                    message={t('mfaSetupWizard.verifyTotp.cantScanQrMessage')}
                    description={
                      <div>
                        <Text type="secondary">{t('mfaSetupWizard.verifyTotp.manualKeyLabel')}</Text>
                        <div
                          style={{
                            marginTop: 8,
                            padding: '8px 12px',
                            background: 'var(--bg-color)',
                            borderRadius: 4,
                            fontFamily: 'monospace',
                            fontSize: 14,
                            wordBreak: 'break-all',
                            userSelect: 'all',
                          }}
                        >
                          {totpSecret}
                        </div>
                      </div>
                    }
                    type="info"
                    style={{ marginBottom: 16 }}
                  />
                </div>
              </div>

              <Title level={5}>{t('mfaSetupWizard.verifyTotp.enterCodeTitle')}</Title>
              <Paragraph>
                {t('mfaSetupWizard.verifyTotp.enterCodeDescription')}
              </Paragraph>

              <Input
                size="large"
                placeholder={t('mfaSetupWizard.verifyTotp.inputPlaceholder')}
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                style={{ width: 200, fontSize: 24, textAlign: 'center', letterSpacing: 8, marginBottom: 24 }}
              />

              {enableError.isError && (
                <Alert
                  message={t('mfaSetupWizard.verifyTotp.invalidCodeMessage')}
                  type="error"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
              )}

              <div>
                <Space>
                  <Button onClick={() => { setCurrentStep(0); setVerificationCode(''); setTotpSecret(''); setTotpUrl(''); }}>
                    {t('mfaSetupWizard.verifyTotp.backButton')}
                  </Button>
                  <Button
                    type="primary"
                    loading={isEnableLoading}
                    disabled={verificationCode.length !== 6}
                    onClick={handleVerifyAndEnable}
                  >
                    {t('mfaSetupWizard.verifyTotp.verifyEnableButton')}
                  </Button>
                </Space>
              </div>
            </div>
          )}

          {/* Step 3: Done — show recovery codes */}
          {currentStep === 3 && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <CheckCircleOutlined style={{ fontSize: 64, color: '#52c41a', marginBottom: 16 }} />
                <Title level={4}>{t('mfaSetupWizard.done.title')}</Title>
                <Paragraph>
                  {t(selectedMethod === 'totp'
                    ? 'mfaSetupWizard.done.totpEnabledMessage'
                    : 'mfaSetupWizard.done.emailEnabledMessage')}
                </Paragraph>
              </div>

              {recoveryCodes.length > 0 && (
                <Card size="small" style={{ marginBottom: 24, background: 'rgba(250, 173, 20, 0.1)', borderColor: 'rgba(250, 173, 20, 0.25)' }}>
                  <Alert
                    message={t('mfaSetupWizard.statusCard.saveRecoveryCodesMessage')}
                    description={t('mfaSetupWizard.statusCard.saveRecoveryCodesDescription')}
                    type="warning"
                    showIcon
                    style={{ marginBottom: 16 }}
                  />
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 8,
                      padding: 16,
                      background: 'var(--card-bg)',
                      borderRadius: 4,
                      fontFamily: 'monospace',
                      fontSize: 16,
                      marginBottom: 16,
                    }}
                  >
                    {recoveryCodes.map((code) => (
                      <div key={code} style={{ padding: '4px 0' }}>{code}</div>
                    ))}
                  </div>
                  <Space>
                    <Button icon={<CopyOutlined />} onClick={handleCopyRecoveryCodes}>
                      {t('mfaSetupWizard.statusCard.copyAllButton')}
                    </Button>
                    <Button icon={<DownloadOutlined />} onClick={handleDownloadRecoveryCodes}>
                      {t('mfaSetupWizard.statusCard.downloadTxtButton')}
                    </Button>
                  </Space>
                </Card>
              )}

              <div style={{ textAlign: 'center' }}>
                <Button type="primary" size="large" onClick={handleFinish}>
                  {t('mfaSetupWizard.done.finishButton')}
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}