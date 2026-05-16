import api from './api';

export async function callServer(tableId, restaurantId) {
  const { data } = await api.post('/public/server-call', { tableId, restaurantId });
  return data;
}
