import api from './axios-instance';
import type { ApiResponse, LoginResponse, RegisterPayload, LoginPayload, ForgotPasswordPayload, ResetPasswordPayload, ChangePasswordPayload, RefreshTokenPayload, VerifyMFAPayload, MFAStatusResponse, SetupEmailMFAResponse, SetupTOTPResponse, EnableMFAResponse, RequestMagicLinkPayload, RegisterMagicLinkPayload, VerifyMagicLinkPayload } from '@/types/api.types';
import type { User, LoginSession } from '@/types/models.types';

export const authApi = {
  register(payload: RegisterPayload) {
    return api.post<ApiResponse<LoginResponse>>('/auth/register', payload);
  },

  login(payload: LoginPayload) {
    return api.post<ApiResponse<LoginResponse>>('/auth/login', payload);
  },

  refresh(payload?: RefreshTokenPayload) {
    // Refresh token is sent automatically via cookies, payload is optional for backwards compatibility
    return api.post<ApiResponse<LoginResponse>>('/auth/refresh', payload || {});
  },

  logout() {
    return api.post<ApiResponse<null>>('/auth/logout');
  },

  logoutAll() {
    return api.post<ApiResponse<null>>('/auth/logout-all');
  },

  forgotPassword(payload: ForgotPasswordPayload) {
    return api.post<ApiResponse<null>>('/auth/forgot-password', payload);
  },

  resetPassword(payload: ResetPasswordPayload) {
    return api.post<ApiResponse<null>>('/auth/reset-password', payload);
  },

  changePassword(payload: ChangePasswordPayload) {
    return api.post<ApiResponse<null>>('/auth/change-password', payload);
  },

  getMe() {
    return api.get<ApiResponse<User>>('/auth/me');
  },

  updateMe(payload: { first_name?: string; last_name?: string; phone?: string; timezone?: string; language?: string }) {
    return api.patch<ApiResponse<User>>('/auth/me', payload);
  },

  getSessions() {
    return api.get<ApiResponse<LoginSession[]>>('/auth/sessions');
  },

  terminateSession(sessionId: string) {
    return api.post<ApiResponse<null>>(`/auth/terminate-session/${sessionId}`);
  },

  // Magic Link
  requestMagicLink(payload: RequestMagicLinkPayload) {
    return api.post<ApiResponse<null>>('/auth/magic-link/request', payload);
  },

  requestMagicLinkRegister(payload: RegisterMagicLinkPayload) {
    return api.post<ApiResponse<null>>('/auth/magic-link/register', payload);
  },

  verifyMagicLink(payload: VerifyMagicLinkPayload) {
    return api.post<ApiResponse<LoginResponse>>('/auth/magic-link/verify', payload);
  },

  // MFA
  verifyMFA(payload: VerifyMFAPayload) {
    return api.post<ApiResponse<LoginResponse>>('/auth/verify-mfa', payload);
  },

  setupMFA() {
    return api.post<ApiResponse<SetupEmailMFAResponse>>('/mfa/setup');
  },

  verifyMFASetup(code: string) {
    return api.post<ApiResponse<{ valid: boolean }>>('/mfa/verify', { code });
  },

  enableMFA(token: string, code: string) {
    return api.post<ApiResponse<EnableMFAResponse>>('/mfa/enable', { token, code });
  },

  disableMFA() {
    return api.delete<ApiResponse<null>>('/mfa/disable');
  },

  getMFAStatus() {
    return api.get<ApiResponse<MFAStatusResponse>>('/mfa/status');
  },

  // TOTP MFA
  setupTOTP() {
    return api.post<ApiResponse<SetupTOTPResponse>>('/mfa/setup-totp');
  },

  enableTOTP(code: string) {
    return api.post<ApiResponse<EnableMFAResponse>>('/mfa/enable-totp', { code });
  },

  regenerateRecoveryCodes() {
    return api.post<ApiResponse<EnableMFAResponse>>('/mfa/regenerate-recovery-codes');
  },

  getSubscriptionPlans() {
    return api.get<ApiResponse<any[]>>('/auth/subscription-plans');
  },
};

