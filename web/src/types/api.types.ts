import type { Order } from './enums';

export interface ApiResponse<T> {
  statusCode: number;
  status: boolean;
  message: string;
  data?: T;
  meta?: PageMeta;
}

export interface PagedResponse<T> {
  data: T[];
  meta: PageMeta;
  statusCode: number;
  status: boolean;
  message: string;
}

export interface PageMeta {
  page: number;
  take: number;
  itemCount: number;
  pageCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface PageOptions {
  page?: number;
  take?: number;
  order?: Order;
  search?: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

export interface LoginResponse {
  access_token?: string;
  refresh_token?: string;
  user?: Record<string, unknown>;
  mfa_required?: boolean;
  mfa_token?: string;
  mfa_method?: 'email' | 'totp';
}

export interface VerifyMFAPayload {
  mfa_token: string;
  code: string;
  device_name?: string;
  device_type?: string;
}

export interface MFAStatusResponse {
  mfa_enabled: boolean;
  mfa_method?: 'email' | 'totp' | null;
  recovery_codes_remaining?: number;
}

export interface EnableMFAResponse {
  recovery_codes: string[];
}

export interface SetupEmailMFAResponse {
  token: string;
}

export interface SetupTOTPResponse {
  secret: string;
  otpauth_url: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  company_name: string;
  phone?: string;
  plan_slug?: 'basic' | 'professional' | 'enterprise';
}

export interface LoginPayload {
  email: string;
  password: string;
  device_name?: string;
  device_type?: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  new_password: string;
}

export interface ChangePasswordPayload {
  old_password: string;
  new_password: string;
}

export interface RefreshTokenPayload {
  refresh_token: string;
}

export interface RequestMagicLinkPayload {
  email: string;
}

export interface RegisterMagicLinkPayload {
  email: string;
  first_name: string;
  last_name: string;
  company_name: string;
  phone?: string;
}

export interface VerifyMagicLinkPayload {
  token: string;
  device_name?: string;
  device_type?: string;
}
