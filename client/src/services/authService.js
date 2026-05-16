import api from './api';

const MOCK_USER = { id: 1, email: 'admin@barorder.sn', name: 'Admin', role: 'admin' };

export async function login(email, password) {
  try {
    const { data } = await api.post('/auth/login', { email, password });
    return data;
  } catch {
    console.warn('Auth API unavailable, using mock fallback');
    if (email === 'admin@barorder.sn' && password === 'admin123') {
      return { token: 'mock-jwt-token', user: MOCK_USER };
    }
    throw new Error('Email ou mot de passe incorrect');
  }
}

export async function getMe() {
  try {
    const { data } = await api.get('/auth/me');
    return data;
  } catch {
    console.warn('Auth API unavailable, using mock fallback');
    const token = localStorage.getItem('token');
    if (token) return MOCK_USER;
    throw new Error('Non authentifié');
  }
}

export function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}
