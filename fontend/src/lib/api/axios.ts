import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

// Create a custom axios instance
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
}> = [];

const processQueue = (error: AxiosError | null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      // Cookie is automatically managed by the browser, so no token is needed here
      prom.resolve(null);
    }
  });
  failedQueue = [];
};

// Request Interceptor
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Tự động đính kèm cookie nhờ withCredentials: true.
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle global errors and refresh token
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response.data;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config;

    if (error.response) {
      const status = error.response.status;

      // Handle 403 First Login Force Password Change
      if (status === 403) {
        const message = (error.response.data as { message?: string })?.message;
        if (message === 'Bạn phải đổi mật khẩu trong lần đăng nhập đầu tiên.') {
          // Bắn event để AuthContext bắt lấy và bật Modal Force Change Password
          window.dispatchEvent(new CustomEvent('auth:force-change-password'));
        } else {
          console.error('Forbidden. You do not have permission.');
        }
      }

      // Handle 401 Unauthorized for Silent Refresh
      const requestUrl = originalRequest?.url ?? '';
      const isAuthEndpoint = requestUrl.includes('/auth/login') || requestUrl.includes('/auth/refresh');

      if (status === 401 && originalRequest && !isAuthEndpoint && !originalRequest.headers.get('x-no-retry')) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then(() => {
              return api(originalRequest);
            })
            .catch((err) => {
              return Promise.reject(err);
            });
        }

        isRefreshing = true;

        try {
          // Gọi lấy lại Access Token mới (gửi kèm Refresh Token HttpOnly Cookie)
          await axios.post('/auth/refresh', {}, {
            baseURL: api.defaults.baseURL,
            withCredentials: true,
            headers: { 'x-no-retry': 'true' }
          });
          
          isRefreshing = false;
          processQueue(null);
          
          // Replay the original request now that we have a new access token cookie
          return api(originalRequest);
        } catch (refreshError) {
          isRefreshing = false;
          processQueue(refreshError as AxiosError);
          // Token thực sự lỗi / đã hết hạn, chuyển hướng về Login nếu không ở trang login
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
          return Promise.reject(refreshError);
        }
      }

      if (status === 500) {
        console.error('Internal Server Error.');
      }
    }

    return Promise.reject(error);
  }
);
