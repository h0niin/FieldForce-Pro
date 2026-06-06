import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/auth.store';
import { useBiometric } from '@/hooks/use-biometric';
import { authApi } from '@/api/endpoints';
import { colors, spacing, borderRadius } from '@/theme';
import { useAppTheme } from '@/hooks/useAppTheme';

const ACCENT = '#4F6BF6';

export default function BiometricLockScreen() {
  const insets = useSafeAreaInsets();
  const { colors: themeColors, isDark, cardBg, headerBg, inputBg, borderColor } = useAppTheme();
  const [isVerifying, setIsVerifying] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);

  const logout = useAuthStore((s) => s.logout);
  const loginWithVerification = useAuthStore((s) => s.loginWithVerification);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const { biometricType, authenticate } = useBiometric();

  const handleAuthenticate = async () => {
    setIsVerifying(true);
    setHasFailed(false);
    const success = await authenticate(`Sign in to FieldForce Pro`);
    if (!success) {
      setIsVerifying(false);
      setHasFailed(true);
      return;
    }

    try {
      const response = await authApi.refresh({ refresh_token: refreshToken! });
      const { access_token, refresh_token: newRefreshToken } = response.data.data!;
      useAuthStore.getState().setTokens(access_token, newRefreshToken);
      const meResponse = await authApi.getMe();
      const freshUser = meResponse.data.data!;
      loginWithVerification(freshUser, access_token, newRefreshToken);
    } catch {
      useAuthStore.getState().setBiometricVerified(true);
    }
    setIsVerifying(false);
  };

  // Delay slightly so React strict mode's unmount/remount cycle cancels the
  // first invocation — prevents the native biometric prompt from firing twice.
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      if (!cancelled) handleAuthenticate();
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  const handleUsePassword = () => {
    logout();
  };

  const icon =
    biometricType === 'Face ID' || biometricType === 'Face Recognition'
      ? 'scan-outline'
      : 'finger-print-outline';

  return (
    <View style={[s.container, { paddingTop: insets.top, paddingBottom: insets.bottom, backgroundColor: isDark ? themeColors.background : '#F8F9FB' }]}>
      <View style={s.content}>
        {/* Logo */}
        <View style={s.logoCircle}>
          <Ionicons name="flash" size={32} color="#FFF" />
        </View>
        <Text style={[s.title, { color: themeColors.text }]}>FieldForce Pro</Text>
        <Text style={[s.subtitle, { color: isDark ? themeColors.textSecondary : '#64748B' }]}>Verify your identity to continue</Text>

        {/* Biometric card */}
        <View style={[s.card, { backgroundColor: cardBg, borderColor }]}>
          <View style={[s.iconWrap, { backgroundColor: isDark ? themeColors.surface : '#EEF2FF' }]}>
            {isVerifying ? (
              <ActivityIndicator size="large" color={ACCENT} />
            ) : (
              <Ionicons name={icon} size={56} color={ACCENT} />
            )}
          </View>

          {hasFailed && (
            <Text style={s.errorText}>Verification failed. Please try again.</Text>
          )}

          <TouchableOpacity
            style={[s.primaryBtn, isVerifying && s.primaryBtnDisabled]}
            onPress={handleAuthenticate}
            disabled={isVerifying}
          >
            <Text style={s.primaryBtnText}>
              {hasFailed ? 'Try Again' : `Verify with ${biometricType}`}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={s.passwordLink} onPress={handleUsePassword}>
          <Text style={s.passwordLinkText}>Use Password Instead</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: spacing['3xl'],
    width: '100%',
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
  },
  card: {
    width: '100%',
    backgroundColor: '#FFF',
    borderRadius: borderRadius.xl,
    padding: spacing['2xl'],
    alignItems: 'center',
    marginTop: spacing['3xl'],
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  errorText: {
    fontSize: 14,
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  primaryBtn: {
    backgroundColor: ACCENT,
    borderRadius: borderRadius.md,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  primaryBtnDisabled: {
    opacity: 0.7,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  passwordLink: {
    paddingVertical: spacing.lg,
    marginTop: spacing.md,
  },
  passwordLinkText: {
    fontSize: 14,
    fontWeight: '500',
    color: ACCENT,
  },
});
