import api from './api';

export async function login(email, password) {
  const { data } = await api.post('/api/auth/login', { email, password });
  return data;
}

export async function getMe() {
  const { data } = await api.get('/api/auth/me');
  return data;
}

export function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}
