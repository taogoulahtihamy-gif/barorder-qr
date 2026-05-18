import axios from 'axios';
import toast from 'react-hot-toast';

const isDev = import.meta.env.DEV || window.location.hostname === 'localhost';
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://barorder-qr.onrender.com',
  headers: { 'Content-Type': 'application/json' },
  timeout: isDev ? 10000 : 20000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let retryInProgress = false;

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.code === 'ECONNABORTED' && !err.config._retry && !retryInProgress) {
      err.config._retry = true;
      retryInProgress = true;
      toast('Synchronisation en cours…', { duration: 2000, style: { background: '#1a1a2e', color: '#D4AF37', borderRadius: '12px' } });
      try {
        const res = await api.request(err.config);
        return res;
      } catch (retryErr) {
        return Promise.reject(retryErr);
      } finally {
        retryInProgress = false;
      }
    }
    if (err.response?.status === 401 && !err.config.url?.includes('/auth/')) {
      localStorage.removeItem('token');
      if (window.location.pathname.startsWith('/admin')) {
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;
