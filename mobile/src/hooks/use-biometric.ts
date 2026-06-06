import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';

interface BiometricState {
  isAvailable: boolean;
  isChecking: boolean;
  biometricType: string;
  authenticate: (reason: string) => Promise<boolean>;
}

export function useBiometric(): BiometricState {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [biometricType, setBiometricType] = useState('Biometrics');

  useEffect(() => {
    async function checkBiometrics() {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        setIsAvailable(false);
        setIsChecking(false);
        return;
      }

      setIsAvailable(true);

      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        // "Face ID" is Apple-only branding; use "Face Recognition" on Android
        setBiometricType(Platform.OS === 'ios' ? 'Face ID' : 'Face Recognition');
      } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        setBiometricType('Fingerprint');
      }

      setIsChecking(false);
    }

    checkBiometrics();
  }, []);

  const authenticate = useCallback(async (reason: string): Promise<boolean> => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: reason,
      fallbackLabel: '',
      disableDeviceFallback: false,
    });
    return result.success;
  }, []);

  return { isAvailable, isChecking, biometricType, authenticate };
}
