/**
 * EduSense Frontend API Client
 */

import axios from 'axios';

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach Authorization token to requests automatically
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('edusense_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle unauthorized responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401 && typeof window !== 'undefined') {
      // If token expired, clear and optionally redirect
      if (!window.location.pathname.startsWith('/login') && window.location.pathname !== '/') {
        localStorage.removeItem('edusense_token');
        localStorage.removeItem('edusense_user');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
