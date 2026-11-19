import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
export const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'; // Defaults to true

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Interceptor to inject JWT token when moving to real Spring Boot backend
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('mediVault_auth_token_v2');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // In production: clear auth and redirect to login
      console.warn('Unauthorized request - redirecting or renewing token');
    }
    return Promise.reject(error);
  }
);

// Simulated delay helper for realistic UX during mock mode
export const mockDelay = (ms: number = 600): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
