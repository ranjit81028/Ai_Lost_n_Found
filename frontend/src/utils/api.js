import axios from 'axios';

// Base axios instance pointing to Flask backend
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// Attach JWT token to every request if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ---- Auth APIs ----

export const registerUser = (name, email, password) => {
  return api.post('/auth/register', { name, email, password });
};

export const loginUser = (email, password) => {
  return api.post('/auth/login', { email, password });
};

export const getCurrentUser = () => {
  return api.get('/auth/me');
};

// ---- Item APIs ----

export const reportItem = (formData) => {
  // formData is a FormData object (for file upload)
  return api.post('/items', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

export const getItems = (params = {}) => {
  return api.get('/items', { params });
};

export const getItem = (id) => {
  return api.get(`/items/${id}`);
};

export const getMyItems = () => {
  return api.get('/items/my');
};

export const updateItem = (id, data) => {
  return api.put(`/items/${id}`, data);
};

export const deleteItem = (id) => {
  return api.delete(`/items/${id}`);
};

export const getCategories = () => {
  return api.get('/items/categories');
};

// ---- Matching APIs ----

export const findMatches = (itemId) => {
  return api.get(`/match/${itemId}`);
};

// ---- Notification APIs ----

export const getNotifications = () => {
  return api.get('/notifications');
};

export const markNotificationRead = (id) => {
  return api.put(`/notifications/${id}/read`);
};

export const getUnreadCount = () => {
  return api.get('/notifications/unread-count');
};

// ---- Admin APIs ----

export const getAdminStats = () => {
  return api.get('/admin/stats');
};

export const getAdminUsers = () => {
  return api.get('/admin/users');
};

export const getAdminItems = () => {
  return api.get('/admin/items');
};

export const updateItemStatus = (id, status) => {
  return api.put(`/admin/items/${id}/status`, { status });
};

export const deleteUser = (id) => {
  return api.delete(`/admin/users/${id}`);
};

export default api;
