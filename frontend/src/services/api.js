import axios from 'axios';

export const GLOBAL_API_BASE = 'http://127.0.0.1:8000/api/v1';

export const CITY_PORTS = {
  mumbai: 8001,
  bengaluru: 8002,
  kolkata: 8003,
  chennai: 8004
};

export const getCityApiBase = (city) => `http://127.0.0.1:${CITY_PORTS[city.toLowerCase()] || 8001}/api/v1`;

const apiClient = axios.create({
  baseURL: GLOBAL_API_BASE,
  timeout: 20000,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('sangam_auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const apiService = {
  // Global Coordinator
  getDashboardSummary: () => apiClient.get('/dashboard/summary'),
  getServerStatuses: () => apiClient.get('/servers'),
  triggerSync: () => apiClient.post('/sync'),
  getSyncHistory: (limit = 10) => apiClient.get(`/sync/history?limit=${limit}`),
  
  getGlobalEvents: (params = {}) => apiClient.get('/events', { params }),
  getGlobalEventDetails: (id) => apiClient.get(`/events/${id}`),
  
  getCorrelations: (params = {}) => apiClient.get('/correlations', { params }),
  getCorrelationDetails: (id) => apiClient.get(`/correlations/${id}`),
  updateCorrelationStatus: (id, data) => apiClient.patch(`/correlations/${id}`, data),
  
  getCityAnalytics: () => apiClient.get('/analytics/cities'),

  // Direct City Node Services (Genuine Distributed HTTP communication)
  getCityHealth: (city) => axios.get(`${getCityApiBase(city)}/health`, { timeout: 3000 }),
  getCityProfile: (city) => axios.get(`${getCityApiBase(city)}/city`, { timeout: 3000 }),
  getCityEvents: (city, params = {}) => axios.get(`${getCityApiBase(city)}/events`, { params, timeout: 4000 }),
  submitCityEvent: (city, eventData) => axios.post(`${getCityApiBase(city)}/events`, eventData, { timeout: 5000 }),
  updateLocalEventReview: (city, eventId, status) => 
    axios.patch(`${getCityApiBase(city)}/events/${eventId}/review`, { verification_status: status }, { timeout: 4000 }),
  getCityAnalyticsSummary: (city) => axios.get(`${getCityApiBase(city)}/analytics/summary`, { timeout: 3000 }),
  getModelStatus: (city) => axios.get(`${getCityApiBase(city)}/model/status`, { timeout: 3000 }),
  testModelInference: (city, testData) => axios.post(`${getCityApiBase(city)}/predict`, testData, { timeout: 5000 }),

  // Auth
  login: (credentials) => apiClient.post('/auth/login', credentials),
  getCurrentUser: () => apiClient.get('/auth/me')
};
