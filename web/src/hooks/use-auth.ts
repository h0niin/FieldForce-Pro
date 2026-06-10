import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/api/auth.api';
import { useAuthStore } from '@/store/auth.store';
import type { LoginPayload, RegisterPayload, ForgotPasswordPayload, ResetPasswordPayload, ChangePasswordPayload, VerifyMFAPayload, RequestMagicLinkPayload, RegisterMagicLinkPayload, VerifyMagicLinkPayload } from '@/types/api.types';
import type { User } from '@/types/models.types';
import { useNotificationStore } from '@/store/notification.store';
import { getApiErrorMessage } from '@/utils/get-api-error';

export interface LoginMFAResult {
  mfa_required: boolean;
  mfa_token?: string;
  mfa_method?: 'email' | 'totp';
}

export function useLogin(onMFARequired?: (mfaToken: string, mfaMethod?: 'email' | 'totp') => void) {
  const login = useAuthStore((s) => s.login);
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (payload: LoginPayload) => authApi.login(payload),
    onSuccess: (response) => {
      const data = response.data.data!;
      if (data.mfa_required && data.mfa_token) {
        onMFARequired?.(data.mfa_token, data.mfa_method);
        return;
      }
      // Tokens are now in HTTP-only cookies, only store user data
      login(data.user as unknown as User);
      addNotification({ type: 'success', message: 'Logged in successfully' });
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      const msg = err?.response?.data?.message || 'Login failed. Please check your credentials.';
      addNotification({ type: 'error', message: msg });
    },
  });
}

export function useVerifyMFA() {
  const login = useAuthStore((s) => s.login);
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (payload: VerifyMFAPayload) => authApi.verifyMFA(payload),
    onSuccess: (response) => {
      const data = response.data.data!;
      // Tokens are now in HTTP-only cookies, only store user data
      login(data.user as unknown as User);
      addNotification({ type: 'success', message: 'Logged in successfully' });
    },
    onError: (error) => {
      addNotification({ type: 'error', message: 'Verification failed', description: getApiErrorMessage(error) });
    },
  });
}

export function useRegister() {
  const login = useAuthStore((s) => s.login);
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (payload: RegisterPayload) => authApi.register(payload),
    onSuccess: (response) => {
      const data = response.data.data!;
      // Tokens are now in HTTP-only cookies, only store user data
      login(data.user as unknown as User);
      addNotification({ type: 'success', message: 'Account created successfully' });
    },
    onError: (error) => {
      addNotification({ type: 'error', message: 'Registration failed', description: getApiErrorMessage(error) });
    },
  });
}

export function useRequestMagicLink() {
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (payload: RequestMagicLinkPayload) => authApi.requestMagicLink(payload),
    onSuccess: () => {
      addNotification({ type: 'success', message: 'Magic link requested', description: 'If an account exists, a link has been sent to your email.' });
    },
    onError: (error) => {
      addNotification({ type: 'error', message: 'Failed to request magic link', description: getApiErrorMessage(error) });
    },
  });
}

export function useRegisterMagicLink() {
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (payload: RegisterMagicLinkPayload) => authApi.requestMagicLinkRegister(payload),
    onSuccess: () => {
      addNotification({ type: 'success', message: 'Registration initiated', description: 'A magic link has been sent to your email to complete registration.' });
    },
    onError: (error) => {
      addNotification({ type: 'error', message: 'Registration failed', description: getApiErrorMessage(error) });
    },
  });
}

export function useVerifyMagicLink() {
  const login = useAuthStore((s) => s.login);
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (payload: VerifyMagicLinkPayload) => authApi.verifyMagicLink(payload),
    onSuccess: (response) => {
      const data = response.data.data!;
      login(data.user as unknown as User);
      addNotification({ type: 'success', message: 'Logged in successfully' });
    },
    onError: (error) => {
      addNotification({ type: 'error', message: 'Verification failed', description: getApiErrorMessage(error) });
    },
  });
}

export function useLogout() {
  const logout = useAuthStore((s) => s.logout);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: () => {
      logout();
      queryClient.clear();
    },
  });
}

export function useLogoutAll() {
  const logout = useAuthStore((s) => s.logout);
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: () => authApi.logoutAll(),
    onSuccess: () => {
      addNotification({ type: 'success', message: 'All sessions terminated', description: 'All devices have been logged out.' });
      logout();
      queryClient.clear();
    },
    onError: (error) => {
      addNotification({ type: 'error', message: 'Failed to terminate sessions', description: getApiErrorMessage(error) });
    },
  });
}

export function useMe() {
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      try {
        const response = await authApi.getMe();
        const user = response.data.data!;

        // Set user and mark as authenticated
        setUser(user);

        return user;
      } catch (error: any) {
        // If 401, clear auth state (no valid cookies)
        if (error?.response?.status === 401) {
          logout();
          throw error;
        }

        // For other errors, still throw
        throw error;
      }
    },
    // Only fetch when user is authenticated (has valid session from login)
    enabled: isAuthenticated,
    retry: (failureCount, error: any) => {
      // Don't retry on 401 (unauthorized) or 400 (bad request / no cookies)
      if (error?.response?.status === 401 || error?.response?.status === 400) {
        return false;
      }
      // Retry other errors up to 2 times
      return failureCount < 2;
    },
    staleTime: 5 * 60 * 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });
}

export function useSessions() {
  return useQuery({
    queryKey: ['auth', 'sessions'],
    queryFn: async () => {
      const response = await authApi.getSessions();
      return response.data.data!;
    },
    retry: 1, // Only retry once on failure
    refetchOnWindowFocus: false, // Don't refetch on window focus to avoid unnecessary calls
    staleTime: 60 * 1000, // Consider data fresh for 1 minute
  });
}

export function useTerminateSession() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);
  const logout = useAuthStore((s) => s.logout);

  return useMutation({
    mutationFn: (sessionId: string) => authApi.terminateSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'sessions'] });

      // If user terminated their current session, logout locally
      // The backend will clear the cookies, so we need to update local state
      const currentUser = useAuthStore.getState().user;
      if (currentUser) {
        addNotification({ type: 'success', message: 'Session terminated' });
      }
    },
    onError: (error: any) => {
      // If terminating current session (401), logout gracefully
      if (error?.response?.status === 401) {
        logout();
        queryClient.clear();
        window.location.href = window.location.origin + '/login';
      } else {
        addNotification({ type: 'error', message: 'Failed to terminate session', description: getApiErrorMessage(error) });
      }
    },
  });
}

export function useForgotPassword() {
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (payload: ForgotPasswordPayload) => authApi.forgotPassword(payload),
    onSuccess: () => {
      addNotification({ type: 'success', message: 'Reset link sent', description: 'Password reset link has been sent to your email.' });
    },
    onError: (error) => {
      addNotification({ type: 'error', message: 'Failed to send reset link', description: getApiErrorMessage(error) });
    },
  });
}

export function useResetPassword() {
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (payload: ResetPasswordPayload) => authApi.resetPassword(payload),
    onSuccess: () => {
      addNotification({ type: 'success', message: 'Password reset successful', description: 'Your password has been reset. All active sessions have been logged out.' });
    },
    onError: (error) => {
      addNotification({ type: 'error', message: 'Password reset failed', description: getApiErrorMessage(error) });
    },
  });
}

export function useChangePassword() {
  const addNotification = useNotificationStore((s) => s.add);
  const logout = useAuthStore((s) => s.logout);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ChangePasswordPayload) => authApi.changePassword(payload),
    onSuccess: () => {
      addNotification({ type: 'success', message: 'Password changed', description: 'Your password has been changed. All other sessions have been logged out.' });
      logout();
      queryClient.clear();
    },
    onError: (error) => {
      addNotification({ type: 'error', message: 'Password change failed', description: getApiErrorMessage(error) });
    },
  });
}

export function usePublicSubscriptionPlans() {
  return useQuery({
    queryKey: ['public-subscription-plans'],
    queryFn: async () => {
      const res = await authApi.getSubscriptionPlans();
      return res.data.data!;
    },
  });
}

