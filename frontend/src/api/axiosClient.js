import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 15000
});

// Request Interceptor: Attach JWT Token from localStorage
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('stockflow_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Global 401 handling & error formatting
axiosClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // If 401 Unauthorized occurs on an authenticated route, clear stored session
    if (error.response && error.response.status === 401) {
      const requestUrl = error.config?.url || '';
      const isAuthEndpoint = requestUrl.includes('/auth/login') || requestUrl.includes('/auth/register');

      if (!isAuthEndpoint) {
        localStorage.removeItem('stockflow_token');
        localStorage.removeItem('stockflow_user');
        localStorage.removeItem('stockflow_org');

        // Optional: Dispatch a custom window event for decoupled reactive logout
        window.dispatchEvent(new Event('stockflow:unauthorized'));
      }
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
