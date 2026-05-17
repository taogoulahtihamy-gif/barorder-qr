import api from './api';

export async function callServer(tableId, restaurantId, message) {
  const { data } = await api.post('/api/public/server-call', { tableId, restaurantId, message });
  return data;
}