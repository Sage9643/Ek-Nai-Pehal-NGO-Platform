import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getEvents = async () => {
  const response = await api.get('/events');
  return response.data;
};

export const getGallery = async () => {
  const response = await api.get('/gallery');
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

export const sendChatMessage = async (message) => {
  const response = await api.post('/chat', { message });
  return response.data;
};

export default api;
