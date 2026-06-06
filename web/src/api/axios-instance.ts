import axios from 'axios';
import { API_URL } from '@/utils/constants';
import { useAuthStore } from '@/store/auth.store';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // IMPORTANT: Send cookies with requests
});

// No need to add Authorization header - cookies are sent automatically

let isRefreshing = false;
let failedQueue: Array<{
  resolve: () => void;
  reject: (error: unknown) => void;
}> = [];

function processQueue(error: unknown) {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Skip refresh attempt for auth endpoints — they should fail cleanly
    const url = originalRequest?.url || '';
    // Magic link verify endpoints return 401 for their own token validation reasons,
    // not for JWT expiry — exclude them so we don't accidentally redirect to /login
    const isAuthEndpoint =
      url.includes('/auth/login') ||
      url.includes('/auth/register') ||
      url.includes('/auth/refresh') ||
      url.includes('/auth/forgot-password') ||
      url.includes('/auth/reset-password') ||
      url.includes('/auth/magic/verify') ||
      url.includes('/auth/magic-link/verify');

    // 401 = token expired/invalid; 403 = token valid but permissions stale (admin just granted access)
    // In both cases, attempt a token refresh — the refresh endpoint re-reads permissions from DB.
    if ((error.response?.status === 401 || error.response?.status === 403) && !originalRequest._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        return new Promise<void>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => {
          return api(originalRequest);
        }).catch((err) => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Refresh token is sent automatically via cookies
        await axios.post(
          `${API_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        // Cookies are updated automatically by the server
        processQueue(null);

        // Retry original request
        return api(originalRequest);
      } catch (refreshError: any) {
        processQueue(refreshError);

        // Logout if refresh token is expired (401) or invalid/missing (400)
        if (refreshError?.response?.status === 401 || refreshError?.response?.status === 400) {
          // Refresh token is expired, invalid, or missing - user needs to login again
          useAuthStore.getState().logout();
          window.location.href = '/login';
        } else {
          // Network error, server error, or other issue
          // Don't force logout - user may still have valid session
          console.error('Token refresh failed:', refreshError);
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default api;
