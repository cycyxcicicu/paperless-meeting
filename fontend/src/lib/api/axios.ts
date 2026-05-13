import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

// Create a custom axios instance
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // In a real app, retrieve token from localStorage or state management
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle global errors and refresh token
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Modify response if needed (e.g. unwrap data)
    return response.data;
  },
  async (error: AxiosError) => {
    // Handle specific error codes globally
    if (error.response) {
      const status = error.response.status;

      if (status === 401) {
        // Handle Unauthorized (e.g. redirect to login, trigger refresh token)
        console.error('Unauthorized access. Redirecting to login...');
        // window.location.href = '/login';
      } else if (status === 403) {
        console.error('Forbidden. You do not have permission.');
      } else if (status === 500) {
        console.error('Internal Server Error.');
      }
    }

    return Promise.reject(error);
  }
);
