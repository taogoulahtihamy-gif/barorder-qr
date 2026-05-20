import api from './api';
import { formatCurrency } from '../utils/formatters';

function formatReadableDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy} ${hh}:${mi}`;
}

export async function getDashboard() {
  const { data } = await api.get('/api/admin/dashboard');
  if (!data || typeof data.revenueFormatted === 'undefined') {
    throw new Error('Dashboard API returned invalid data');
  }
  return {
    ...data,
    revenue: parseInt(data.revenue) || 0,
    ordersCount: parseInt(data.ordersCount) || 0,
    pendingOrders: parseInt(data.pendingOrders) || 0,
    avgOrder: parseInt(data.avgOrder) || 0,
    activeTables: parseInt(data.activeTables) || 0,
    availableProducts: parseInt(data.availableProducts) || 0,
    recentOrders: (data.recentOrders || []).map(o => ({
      ...o,
      items: Array.isArray(o.items) ? o.items : [],
      total: o.total != null ? formatCurrency(o.total) : o.total,
      time: o.time ? formatReadableDate(o.time) : o.time,
    })),
    topProducts: (data.topProducts || []).map(p => ({
      name: p.name,
      count: parseInt(p.count) || 0,
      revenue: p.revenueFormatted || p.revenue,
    })),
    serverAlerts: (data.serverAlerts || []).map(a => ({
      id: a.id,
      table: a.table_number || a.table,
      time: a.time || a.created_at,
      handled: a.handled || false,
    })),
  };
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'à l\'instant';
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}min`;
}

function mapOrder(o) {
  return {
    id: o.id,
    orderNumber: o.order_number,
    table: o.table_number || o.table_id,
    status: o.order_status,
    paymentStatus: o.payment_status,
    payment: o.payment_method,
    total: formatCurrency(o.total_amount),
    totalRaw: o.total_amount,
    items: (o.items || []).map(i => ({ name: i.product_name, qty: i.quantity, price: i.unit_price })),
    note: o.customer_note || '',
    kitchenNote: o.kitchen_note || '',
    customerName: o.customer_name || '',
    customerPhone: o.customer_phone || '',
    time: timeAgo(o.created_at),
    createdAt: o.created_at,
  };
}

export async function getOrders() {
  const { data } = await api.get('/api/admin/orders');
  if (!Array.isArray(data)) {
    throw new Error('Orders API returned invalid data');
  }
  return data.map(mapOrder);
}

export async function updateOrderStatus(orderId, status) {
  const { data } = await api.patch(`/api/admin/orders/${orderId}/status`, { status });
  return data;
}

export async function getProducts() {
  const { data } = await api.get('/api/admin/products');
  if (!Array.isArray(data)) {
    throw new Error('Products API returned invalid data');
  }
  return data;
}

export async function createProduct(product) {
  const { data } = await api.post('/api/admin/products', product);
  return data;
}

export async function updateProduct(id, product) {
  const { data } = await api.put(`/api/admin/products/${id}`, product);
  return data;
}

export async function deleteProduct(id) {
  await api.delete(`/api/admin/products/${id}`);
  return true;
}

export async function toggleProductAvailability(id) {
  const { data } = await api.patch(`/api/admin/products/${id}/availability`);
  return data;
}

export async function getCategories() {
  const { data } = await api.get('/api/admin/categories');
  if (!Array.isArray(data)) {
    throw new Error('Categories API returned invalid data');
  }
  return data;
}

export async function createCategory(category) {
  const { data } = await api.post('/api/admin/categories', category);
  return data;
}

export async function updateCategory(id, category) {
  const { data } = await api.put(`/api/admin/categories/${id}`, category);
  return data;
}

export async function deleteCategory(id) {
  await api.delete(`/api/admin/categories/${id}`);
  return true;
}

export async function getTables() {
  const { data } = await api.get('/api/admin/tables');
  if (!Array.isArray(data)) {
    throw new Error('Tables API returned invalid data');
  }
  return data;
}

export async function createTable(table) {
  const { data } = await api.post('/api/admin/tables', table);
  return data;
}

export async function deleteTable(id) {
  await api.delete(`/api/admin/tables/${id}`);
  return true;
}

export async function updateTableStatus(id, status) {
  const { data } = await api.patch(`/api/admin/tables/${id}/status`, { status });
  return data;
}

function mapPayment(p) {
  return {
    id: p.id,
    order: p.order_number,
    table: p.table_number,
    amount: `${(parseInt(p.amount) || 0).toLocaleString('fr-FR')} FCFA`,
    amountRaw: parseInt(p.amount) || 0,
    method: p.method,
    status: p.status,
    ref: p.transaction_reference || '-',
    date: p.created_at ? new Date(p.created_at).toLocaleString('fr-FR') : '',
  };
}

export async function getPayments() {
  const { data } = await api.get('/api/admin/payments');
  if (!Array.isArray(data)) {
    throw new Error('Payments API returned invalid data');
  }
  return data.map(mapPayment);
}

export async function getStats() {
  const { data } = await api.get('/api/admin/stats');
  if (!data || typeof data.totalRevenue === 'undefined') {
    throw new Error('Stats API returned invalid data');
  }
  return {
    ...data,
    totalRevenue: parseInt(data.totalRevenue) || 0,
    totalOrders: parseInt(data.totalOrders) || 0,
    avgOrder: parseInt(data.avgOrder) || 0,
    dailyRevenue: (data.dailyRevenue || []).map(v => parseInt(v) || 0),
    orderCounts: (data.orderCounts || []).map(v => parseInt(v) || 0),
    paymentMethodSplit: {
      wave: parseInt(data.paymentMethodSplit?.wave) || 0,
      cash: parseInt(data.paymentMethodSplit?.cash) || 0,
      orange_money: parseInt(data.paymentMethodSplit?.orange_money) || 0,
    },
    topProducts: (data.topProducts || []).map(p => ({
      name: p.name,
      count: parseInt(p.count) || 0,
      revenue: parseInt(p.revenue) || 0,
    })),
  };
}

export async function getServerAlerts() {
  const { data } = await api.get('/api/admin/server-calls');
  if (!Array.isArray(data)) {
    throw new Error('Server alerts API returned invalid data');
  }
  return data.map(c => ({
    id: c.id,
    table: c.table_number || c.table_id,
    time: c.created_at,
    status: c.status || 'pending',
    table_id: c.table_id,
  }));
}

export async function markAlertHandled(alertId) {
  const { data } = await api.patch(`/api/admin/server-calls/${alertId}/status`, { status: 'resolved' });
  return data;
}

export async function getServerCalls(status) {
  const params = status ? { params: { status } } : {};
  const { data } = await api.get('/api/admin/server-calls', params);
  if (!Array.isArray(data)) {
    throw new Error('Server calls API returned invalid data');
  }
  return data.map(c => ({
    id: c.id,
    tableId: c.table_id,
    tableNumber: c.table_number,
    status: c.status || 'pending',
    message: c.message || '',
    createdAt: c.created_at,
  }));
}

export async function updateServerCallStatus(callId, status) {
  const { data } = await api.patch(`/api/admin/server-calls/${callId}/status`, { status });
  return data;
}

export async function getSettings() {
  const { data } = await api.get('/api/admin/settings');
  if (!data || !data.id) {
    throw new Error('Settings API returned invalid data');
  }
  return data;
}

export async function updateSettings(settings) {
  const { data } = await api.put('/api/admin/settings', settings);
  return data;
}

export async function generateTableQR(id) {
  const { data } = await api.post(`/api/admin/tables/${id}/generate-qr`);
  return data;
}

export async function getPrintableQR() {
  const { data } = await api.get('/api/admin/tables/printable');
  return data;
}

export async function getRestaurants() {
  const { data } = await api.get('/api/admin/restaurants');
  if (!Array.isArray(data)) throw new Error('Restaurants API returned invalid data');
  return data;
}

export async function getRestaurant(id) {
  const { data } = await api.get(`/api/admin/restaurants/${id}`);
  return data;
}

export async function createRestaurant(restaurant) {
  const { data } = await api.post('/api/admin/restaurants', restaurant);
  return data;
}

export async function updateRestaurant(id, restaurant) {
  const { data } = await api.put(`/api/admin/restaurants/${id}`, restaurant);
  return data;
}

export async function updateRestaurantStatus(id, is_active) {
  const { data } = await api.patch(`/api/admin/restaurants/${id}/status`, { is_active });
  return data;
}

export { mapOrder };
