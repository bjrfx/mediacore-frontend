import axios from 'axios';
import { getIdToken } from '../config/firebase';

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://mediacoreapi.masakalirestrobar.ca';
const API_KEY = process.env.REACT_APP_PUBLIC_API_KEY || '';

console.log('[API] Base URL:', API_BASE_URL);

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`[API] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    console.log('[API] Headers:', config.headers);
    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log('[API] Response:', response.status, response.data);
    return response;
  },
  (error) => {
    console.error('[API Error]', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
      url: error.config?.url,
    });
    return Promise.reject(error);
  }
);

// ============================================
// PUBLIC API (uses API Key)
// ============================================

export const publicApi = {
  // Health check
  healthCheck: async () => {
    const response = await api.get('/health');
    return response.data;
  },

  // Get all media
  getMedia: async (options = {}) => {
    const { type, limit = 50, orderBy = 'createdAt', order = 'desc' } = options;
    const params = new URLSearchParams({ limit: String(limit), orderBy, order });
    if (type) params.append('type', type);

    const response = await api.get(`/api/feed?${params}`, {
      headers: { 'x-api-key': API_KEY },
    });
    return response.data;
  },

  // Get single media by ID
  getMediaById: async (id) => {
    const response = await api.get(`/api/media/${id}`, {
      headers: { 'x-api-key': API_KEY },
    });
    return response.data;
  },

  // Get app settings
  getSettings: async () => {
    const response = await api.get('/api/settings', {
      headers: { 'x-api-key': API_KEY },
    });
    return response.data;
  },
};

// ============================================
// ADMIN API (uses Firebase Auth)
// ============================================

// Helper to create auth headers
const getAuthHeaders = async () => {
  const token = await getIdToken();
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

export const adminApi = {
  // ---- Media Management ----

  uploadMedia: async (file, title, subtitle = '', type = 'video', onProgress) => {
    const token = await getIdToken();
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    formData.append('subtitle', subtitle);
    formData.append('type', type);

    console.log('[API] Upload:', { fileName: file.name, fileType: file.type, title, type });

    const response = await api.post('/admin/media', formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      },
    });
    return response.data;
  },

  updateMedia: async (id, data) => {
    const headers = await getAuthHeaders();
    const response = await api.put(`/admin/media/${id}`, data, { headers });
    return response.data;
  },

  deleteMedia: async (id, deleteFile = true) => {
    const headers = await getAuthHeaders();
    const response = await api.delete(`/admin/media/${id}?deleteFile=${deleteFile}`, { headers });
    return response.data;
  },

  // ---- API Key Management ----

  generateApiKey: async (name, accessType = 'read_only', options = {}) => {
    const headers = await getAuthHeaders();
    const response = await api.post(
      '/admin/generate-key',
      {
        name,
        accessType,
        ...options,
      },
      { headers }
    );
    return response.data;
  },

  getApiKeys: async () => {
    const headers = await getAuthHeaders();
    const response = await api.get('/admin/api-keys', { headers });
    return response.data;
  },

  deleteApiKey: async (id, hardDelete = false) => {
    const headers = await getAuthHeaders();
    const response = await api.delete(`/admin/api-keys/${id}?hardDelete=${hardDelete}`, { headers });
    return response.data;
  },

  // ---- Settings ----

  getSettings: async () => {
    const headers = await getAuthHeaders();
    const response = await api.get('/api/settings', { headers });
    return response.data;
  },

  updateSettings: async (settings) => {
    const headers = await getAuthHeaders();
    const response = await api.put('/admin/settings', settings, { headers });
    return response.data;
  },

  // ---- Analytics ----

  getDashboard: async () => {
    const headers = await getAuthHeaders();
    const response = await api.get('/admin/analytics/dashboard', { headers });
    return response.data;
  },

  getAnalyticsSummary: async (days = 30) => {
    const headers = await getAuthHeaders();
    const response = await api.get(`/admin/analytics/summary?days=${days}`, { headers });
    return response.data;
  },

  getRealTimeStats: async () => {
    const headers = await getAuthHeaders();
    const response = await api.get('/admin/analytics/realtime', { headers });
    return response.data;
  },

  getApiKeyStats: async (keyId) => {
    const headers = await getAuthHeaders();
    const url = keyId ? `/admin/analytics/api-keys?keyId=${keyId}` : '/admin/analytics/api-keys';
    const response = await api.get(url, { headers });
    return response.data;
  },
};

const apiService = { publicApi, adminApi };
export default apiService;
