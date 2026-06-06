import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import * as Device from 'expo-device';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/auth.store';
import { authApi } from '@/api/endpoints';
import AuditLogger, { AUDIT_ACTIONS, AUDIT_MODULES } from '@/utils/AuditLogger';
import { useBiometric } from '@/hooks/use-biometric';
import { colors, spacing, borderRadius } from '@/theme';
import { useAppTheme } from '@/hooks/useAppTheme';

const ACCENT = '#4F6BF6';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { colors: themeColors, isDark, cardBg, headerBg, inputBg, borderColor } = useAppTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [isBiometricLoading, setIsBiometricLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const loginWithVerification = useAuthStore((s) => s.loginWithVerification);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const biometricEnabled = useAuthStore((s) => s.biometricEnabled);
  const { isAvailable, isChecking, biometricType, authenticate } = useBiometric();

  const canUseBiometric = isAvailable && biometricEnabled && refreshToken !== null;

  const biometricIcon =
    biometricType === 'Face ID' || biometricType === 'Face Recognition'
      ? 'scan-outline'
      : 'finger-print-outline';

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onBiometricSignIn = useCallback(async () => {
    setIsBiometricLoading(true);
    try {
      const success = await authenticate('Sign in to FieldForce Pro');
      if (!success) {
        return;
      }

      const response = await authApi.refresh({ refresh_token: refreshToken! });
      const { access_token, refresh_token: newRefreshToken } = response.data.data!;
      useAuthStore.getState().setTokens(access_token, newRefreshToken);
      const meResponse = await authApi.getMe();
      const freshUser = meResponse.data.data!;
      loginWithVerification(freshUser, access_token, newRefreshToken);
      AuditLogger.log({
        action: AUDIT_ACTIONS.BIOMETRIC_LOGIN,
        module: AUDIT_MODULES.AUTH,
        new_values: { user_id: freshUser.id, email: freshUser.email },
      });
    } catch {
      Alert.alert('Sign In Failed', 'Could not verify your identity. Please use your password.');
    } finally {
      setIsBiometricLoading(false);
    }
  }, [authenticate, refreshToken, loginWithVerification]);

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      const response = await authApi.login({
        ...data,
        device_type: 'mobile',
        device_name: Device.deviceName ?? undefined,
      });
      const { user, access_token, refresh_token } = response.data.data!;
      loginWithVerification(user, access_token, refresh_token);
      AuditLogger.log({
        action: AUDIT_ACTIONS.LOGIN_SUCCESS,
        module: AUDIT_MODULES.AUTH,
        new_values: { user_id: user.id, email: user.email },
      });
    } catch (error: any) {
      let message: string;
      if (!error.response) {
        message =
          'Cannot connect to the server. Make sure the server is running and your device is on the same network.';
      } else {
        message = error.response.data?.message ?? 'Login failed. Please try again.';
      }
      AuditLogger.log({
        action: AUDIT_ACTIONS.LOGIN_FAILED,
        module: AUDIT_MODULES.AUTH,
        new_values: { email: data.email, reason: message },
      });
      Alert.alert('Login Failed', message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[s.container, { paddingTop: insets.top, backgroundColor: isDark ? themeColors.background : '#F8F9FB' }]}>
      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={insets.top}
      >
        <ScrollView
          contentContainerStyle={[s.scrollContent, { paddingBottom: insets.bottom + spacing['3xl'] }]}
          keyboardShouldPersistTaps="handled"
          bounces={false}
          showsVerticalScrollIndicator={false}
        >
          {/* Logo / brand */}
          <View style={s.headerSection}>
            <View style={s.logoCircle}>
              <Ionicons name="flash" size={32} color="#FFF" />
            </View>
            <Text style={[s.brandTitle, { color: themeColors.text }]}>FieldForce Pro</Text>
            <Text style={[s.brandSub, { color: isDark ? themeColors.textSecondary : '#64748B' }]}>Sign in to your account</Text>
          </View>

          {/* Form card */}
          <View style={[s.formCard, { backgroundColor: cardBg, borderColor }]}>
            <View style={s.field}>
              <Text style={[s.label, { color: themeColors.text }]}>Email</Text>
              <Controller
                name="email"
                control={control}
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={[s.inputWrap, { backgroundColor: inputBg, borderColor }, errors.email && s.inputWrapError]}>
                    <Ionicons name="mail-outline" size={18} color={isDark ? themeColors.textSecondary : '#94A3B8'} style={s.inputIcon} />
                    <TextInput
                      style={[s.input, { color: themeColors.text }]}
                      placeholder="you@example.com"
                      placeholderTextColor={isDark ? themeColors.textLight : '#94A3B8'}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                    />
                  </View>
                )}
              />
              {errors.email && <Text style={s.errorText}>{errors.email.message}</Text>}
            </View>

            <View style={s.field}>
              <Text style={[s.label, { color: themeColors.text }]}>Password</Text>
              <Controller
                name="password"
                control={control}
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={[s.inputWrap, { backgroundColor: inputBg, borderColor }, errors.password && s.inputWrapError]}>
                    <Ionicons name="lock-closed-outline" size={18} color={isDark ? themeColors.textSecondary : '#94A3B8'} style={s.inputIcon} />
                    <TextInput
                      style={[s.input, { color: themeColors.text }]}
                      placeholder="Password"
                      placeholderTextColor={isDark ? themeColors.textLight : '#94A3B8'}
                      secureTextEntry={!showPassword}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                    />
                    <TouchableOpacity
                      style={s.eyeBtn}
                      onPress={() => setShowPassword((v) => !v)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={20}
                        color={isDark ? themeColors.textSecondary : '#94A3B8'}
                      />
                    </TouchableOpacity>
                  </View>
                )}
              />
              {errors.password && <Text style={s.errorText}>{errors.password.message}</Text>}
            </View>

            <Link href="/(auth)/forgot-password" asChild>
              <TouchableOpacity style={s.forgotLink}>
                <Text style={s.forgotText}>Forgot password?</Text>
              </TouchableOpacity>
            </Link>

            <TouchableOpacity
              style={[s.primaryBtn, isLoading && s.primaryBtnDisabled]}
              onPress={handleSubmit(onSubmit)}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={s.primaryBtnText}>Sign In</Text>
              )}
            </TouchableOpacity>

            {/* Biometric quick sign-in */}
            {canUseBiometric && !isChecking && (
              <>
                <View style={s.orRow}>
                  <View style={[s.orLine, { backgroundColor: borderColor }]} />
                  <Text style={[s.orText, { color: isDark ? themeColors.textSecondary : '#94A3B8' }]}>or</Text>
                  <View style={[s.orLine, { backgroundColor: borderColor }]} />
                </View>

                <TouchableOpacity
                  style={[s.biometricBtn, { backgroundColor: cardBg }, isBiometricLoading && s.primaryBtnDisabled]}
                  onPress={onBiometricSignIn}
                  disabled={isBiometricLoading}
                >
                  {isBiometricLoading ? (
                    <ActivityIndicator color={ACCENT} />
                  ) : (
                    <>
                      <View style={[s.biometricBtnIcon, { backgroundColor: isDark ? themeColors.surface : '#EEF2FF' }]}>
                        <Ionicons name={biometricIcon} size={22} color={ACCENT} />
                      </View>
                      <Text style={s.biometricBtnText}>Sign in with {biometricType}</Text>
                    </>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  flex: {
    flex: 1,
  },

  // ── Brand / logo ────────────────────────────────────────────────────────
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  brandSub: {
    fontSize: 15,
    color: '#64748B',
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: spacing['3xl'],
  },

  // ── Form card ──────────────────────────────────────────────────────────
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  formCard: {
    backgroundColor: '#FFF',
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    gap: spacing.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  field: {
    gap: spacing.xs,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FB',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: borderRadius.md,
    height: 50,
  },
  inputWrapError: {
    borderColor: colors.error,
  },
  inputIcon: {
    marginLeft: spacing.lg,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    paddingHorizontal: spacing.md,
    height: '100%',
  },
  eyeBtn: {
    paddingHorizontal: spacing.md,
    height: '100%',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 12,
    color: colors.error,
    marginTop: 2,
  },
  forgotLink: {
    alignSelf: 'flex-end',
  },
  forgotText: {
    fontSize: 13,
    fontWeight: '500',
    color: ACCENT,
  },

  // ── Primary button ─────────────────────────────────────────────────────
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

  // ── Or divider ─────────────────────────────────────────────────────────
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  orText: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '500',
  },

  // ── Biometric button ───────────────────────────────────────────────────
  biometricBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: 52,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: ACCENT,
    backgroundColor: '#FFF',
    width: '100%',
  },
  biometricBtnIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  biometricBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: ACCENT,
  },
});
