import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
export const TOKEN_KEY = 'adminToken';

const adminApi = axios.create({
  baseURL: `${API_BASE_URL}/admin`,
  headers: {
    'Content-Type': 'application/json',
  },
});

adminApi.interceptors.request.use((config) => {
  const token = sessionStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      sessionStorage.removeItem(TOKEN_KEY);
      if (window.location.pathname !== '/admin/login') {
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(error);
  }
);

export const adminLogin = async (email, password) => {
  const response = await adminApi.post('/login', { email, password });
  return response.data;
};

export const getDashboard = async () => {
  const response = await adminApi.get('/dashboard');
  return response.data;
};

export const getVolunteers = async (params = {}) => {
  const response = await adminApi.get('/volunteers', { params });
  return response.data;
};

export const deleteVolunteer = async (id) => {
  const response = await adminApi.delete(`/volunteers/${id}`);
  return response.data;
};

export const getContactRequests = async (params = {}) => {
  const response = await adminApi.get('/contact-requests', { params });
  return response.data;
};

export const deleteContactRequest = async (id) => {
  const response = await adminApi.delete(`/contact-requests/${id}`);
  return response.data;
};

export const getAdminEvents = async (params = {}) => {
  const response = await adminApi.get('/events', { params });
  return response.data;
};

export const createEvent = async (payload) => {
  const response = await adminApi.post('/events', payload);
  return response.data;
};

export const updateEvent = async (id, payload) => {
  const response = await adminApi.put(`/events/${id}`, payload);
  return response.data;
};

export const deleteEvent = async (id) => {
  const response = await adminApi.delete(`/events/${id}`);
  return response.data;
};

export const getDonations = async (params = {}) => {
  const response = await adminApi.get('/donations', { params });
  return response.data;
};

export const updateDonationStatus = async (id, status) => {
  const response = await adminApi.put(`/donations/${id}/status`, { status });
  return response.data;
};

export const deleteDonation = async (id) => {
  const response = await adminApi.delete(`/donations/${id}`);
  return response.data;
};

export const getAdminGallery = async (params = {}) => {
  const response = await adminApi.get('/gallery', { params });
  return response.data;
};

export const createGalleryImage = async (payload) => {
  const response = await adminApi.post('/gallery', payload);
  return response.data;
};

export const updateGalleryImage = async (id, payload) => {
  const response = await adminApi.put(`/gallery/${id}`, payload);
  return response.data;
};

export const deleteGalleryImage = async (id) => {
  const response = await adminApi.delete(`/gallery/${id}`);
  return response.data;
};

export default adminApi;
