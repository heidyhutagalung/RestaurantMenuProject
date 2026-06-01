import axios from 'axios';

const api = axios.create({ baseURL: '/api', timeout: 15000 });

export const menuApi = {
  getMenu: (lang = 'id') => api.get(`/menu?lang=${lang}`),
  getTableInfo: (n) => api.get(`/tables/${n}`),
};

export const orderApi = {
  createOrder: (data) => api.post('/orders', data),
  getOrder: (n) => api.get(`/orders/${n}`),
  getAllOrders: (params) => api.get('/orders', { params }),
  updateStatus: (n, status) => api.patch(`/orders/${n}/status`, { status }),
  confirmCashier: (n) => api.post(`/orders/${n}/confirm-cashier`),
};

export const paymentApi = {
  createQris: (n) => api.post('/payment/qris', { order_number: n }),
  checkStatus: (n) => api.get(`/payment/status/${n}`),
};

export const qrApi = {
  generateAll: () => api.post('/qr/generate-all'),
  getTableQR: (n) => api.get(`/qr/table/${n}`),
  getAllQR: () => api.get('/qr/all'),
};

export const adminApi = {
  getCategories: () => api.get('/admin/categories'),
  createCategory: (data) => api.post('/admin/categories', data),
  updateCategory: (id, data) => api.put(`/admin/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/admin/categories/${id}`),
  getMenuItems: () => api.get('/admin/menu-items'),
  createMenuItem: (formData) => api.post('/admin/menu-items', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateMenuItem: (id, formData) => api.put(`/admin/menu-items/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteMenuItem: (id) => api.delete(`/admin/menu-items/${id}`),
  toggleAvailable: (id) => api.patch(`/admin/menu-items/${id}/toggle`),
};

export default api;
