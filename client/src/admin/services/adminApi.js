import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const CSRF_COOKIE_NAME = 'admin_csrf';

/**
 * Reads a cookie value by name. Used only for the CSRF double-submit
 * token, which the server deliberately sets as non-httpOnly so this read
 * is possible. The actual session cookie (admin_token) is httpOnly and
 * is never readable here — the browser attaches it automatically.
 */
function getCookie(name) {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

const adminApi = axios.create({
  baseURL: `${API_BASE_URL}/admin`,
  headers: {
    'Content-Type': 'application/json',
  },
  // Required so the browser sends/receives the httpOnly auth cookie and
  // the CSRF cookie on cross-origin requests to the API domain.
  withCredentials: true,
});

adminApi.interceptors.request.use((config) => {
  const method = (config.method || 'get').toUpperCase();
  const isMutating = !['GET', 'HEAD', 'OPTIONS'].includes(method);

  if (isMutating) {
    const csrfToken = getCookie(CSRF_COOKIE_NAME);
    if (csrfToken) {
      config.headers['X-CSRF-Token'] = csrfToken;
    }
  }

  return config;
});

adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    const path = window.location.pathname;
    const onAdminRoute = path.startsWith('/admin');
    const onLoginPage = path === '/admin/login';

    if (error.response?.status === 401 && onAdminRoute && !onLoginPage) {
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

export const adminLogin = async (email, password) => {
  const response = await adminApi.post('/login', { email, password });
  return response.data;
};

export const adminLogout = async () => {
  const response = await adminApi.post('/logout');
  return response.data;
};

export const getCurrentAdmin = async () => {
  const response = await adminApi.get('/me');
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

export const getTransactions = async (params = {}) => {
  const response = await adminApi.get('/transactions', { params });
  return response.data;
};

export const getTransactionStats = async () => {
  const response = await adminApi.get('/transactions/stats');
  return response.data;
};

export default adminApi;