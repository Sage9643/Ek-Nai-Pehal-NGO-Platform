import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getEvents = async ({ page = 1, limit = 9, category } = {}) => {
  const response = await api.get('/events', {
    params: {
      page,
      limit,
      ...(category && category !== 'All' ? { category } : {}),
    },
  });
  return response.data;
};

export const getGallery = async ({ page = 1, limit = 12 } = {}) => {
  const response = await api.get('/gallery', { params: { page, limit } });
  return response.data;
};

export const createVolunteer = async (data) => {
  const response = await api.post('/volunteers', data);
  return response.data;
};

export const createDonation = async (data) => {
  const response = await api.post('/donations', data);
  return response.data;
};

export const createContact = async (data) => {
  const response = await api.post('/contact', data);
  return response.data;
};

export const createPaymentOrder = async (data) => {
  const response = await api.post('/payments/create-order', data);
  return response.data;
};

export const verifyPayment = async (data) => {
  const response = await api.post('/payments/verify', data);
  return response.data;
};

export const getTransaction = async (transactionId) => {
  const response = await api.get(`/payments/${transactionId}`);
  return response.data;
};

export const sendChatMessage = async (message) => {
  const response = await api.post('/chat', { message });
  return response.data;
};

export default api;