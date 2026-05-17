import api from './api';
import { formatCurrency } from '../utils/formatters';

const MOCK_DASHBOARD = {
  revenue: 1245000,
  revenueFormatted: formatCurrency(1245000),
  ordersCount: 24,
  pendingOrders: 7,
  avgOrder: 5167,
  avgOrderFormatted: formatCurrency(5167),
  activeTables: 5,
  availableProducts: 18,
  recentOrders: [
    { id: '#1042', table: 5, items: ['Ribeye Steak', 'Mojito'], total: formatCurrency(4250), status: 'pending', time: '2 min', payment: 'Wave' },
    { id: '#1041', table: 3, items: ['Salade César', 'Espresso'], total: formatCurrency(2800), status: 'preparing', time: '10 min', payment: 'Cash' },
    { id: '#1040', table: 7, items: ['Pizza Margherita'], total: formatCurrency(1500), status: 'ready', time: '18 min', payment: 'Wave' },
    { id: '#1039', table: 2, items: ['Spaghetti Carbonara', 'Tiramisu'], total: formatCurrency(3550), status: 'served', time: '35 min', payment: 'Cash' },
  ],
  topProducts: [
    { name: 'Ribeye Steak', count: 28, revenue: formatCurrency(784000) },
    { name: 'Mojito', count: 22, revenue: formatCurrency(242000) },
    { name: 'Pizza Margherita', count: 18, revenue: formatCurrency(270000) },
    { name: 'Salade César', count: 15, revenue: formatCurrency(187500) },
  ],
  serverAlerts: [
    { table: 4, time: '1 min', handled: false },
    { table: 8, time: '5 min', handled: false },
  ],
};

const MOCK_ORDERS = [
  { id: '#1042', table: 5, items: [{ name: 'Ribeye Steak', qty: 2 }, { name: 'Mojito', qty: 1 }], total: formatCurrency(4250), totalRaw: 4250, status: 'pending', payment: 'Wave', paymentStatus: 'paid', note: '', time: '2 min', createdAt: new Date().toISOString() },
  { id: '#1041', table: 3, items: [{ name: 'Salade César', qty: 1 }, { name: 'Espresso', qty: 2 }], total: formatCurrency(2800), totalRaw: 2800, status: 'preparing', payment: 'Cash', paymentStatus: 'pending', note: 'sans glaçon', time: '10 min', createdAt: new Date().toISOString() },
  { id: '#1040', table: 7, items: [{ name: 'Pizza Margherita', qty: 1 }], total: formatCurrency(1500), totalRaw: 1500, status: 'ready', payment: 'Wave', paymentStatus: 'paid', note: '', time: '18 min', createdAt: new Date().toISOString() },
  { id: '#1039', table: 2, items: [{ name: 'Spaghetti Carbonara', qty: 1 }, { name: 'Tiramisu', qty: 1 }], total: formatCurrency(3550), totalRaw: 3550, status: 'served', payment: 'Cash', paymentStatus: 'paid', note: 'bien cuit', time: '35 min', createdAt: new Date().toISOString() },
  { id: '#1038', table: 1, items: [{ name: 'Saumon grillé', qty: 1 }], total: formatCurrency(2450), totalRaw: 2450, status: 'paid', payment: 'Wave', paymentStatus: 'paid', note: '', time: '50 min', createdAt: new Date().toISOString() },
];

const MOCK_PRODUCTS = [
  { id: 1, name: 'Ribeye Steak', description: '300g avec légumes de saison', price: 28.00, category: 'Grillades', image_url: '', available: true, featured: true },
  { id: 2, name: 'Salade César', description: 'Romaine, parmesan, croûtons', price: 12.50, category: 'Plats', image_url: '', available: true, featured: false },
  { id: 3, name: 'Mojito', description: 'Menthe fraîche, citron vert, rhum', price: 11.00, category: 'Cocktails', image_url: '', available: true, featured: true },
  { id: 4, name: 'Tiramisu', description: 'Dessert italien classique', price: 9.00, category: 'Desserts', image_url: '', available: false, featured: false },
];

const MOCK_CATEGORIES = [
  { id: 1, name: 'Plats', description: 'Plats principaux', sort_order: 1, active: true },
  { id: 2, name: 'Grillades', description: 'Viandes grillées', sort_order: 2, active: true },
  { id: 3, name: 'Desserts', description: 'Desserts et pâtisseries', sort_order: 3, active: true },
  { id: 4, name: 'Boissons', description: 'Boissons fraîches et chaudes', sort_order: 4, active: true },
  { id: 5, name: 'Cocktails', description: 'Cocktails et mocktails', sort_order: 5, active: true },
  { id: 6, name: 'Promotions', description: 'Offres spéciales', sort_order: 6, active: false },
];

const MOCK_TABLES = [
  { id: 1, name: 'Table 1', table_number: 'Table 1', capacity: 4, status: 'occupied', order: '#1042', qrUrl: '/r/barorder/table/1', slug: 'barorder', restaurant_name: 'BarOrder', qr_url: null },
  { id: 2, name: 'Table 2', table_number: 'Table 2', capacity: 2, status: 'free', qrUrl: '/r/barorder/table/2', slug: 'barorder', restaurant_name: 'BarOrder', qr_url: null },
  { id: 3, name: 'Table 3', table_number: 'Table 3', capacity: 6, status: 'occupied', order: '#1041', qrUrl: '/r/barorder/table/3', slug: 'barorder', restaurant_name: 'BarOrder', qr_url: null },
  { id: 4, name: 'Table 4', table_number: 'Table 4', capacity: 4, status: 'free', qrUrl: '/r/barorder/table/4', slug: 'barorder', restaurant_name: 'BarOrder', qr_url: null },
  { id: 5, name: 'Table 5', table_number: 'Table 5', capacity: 4, status: 'occupied', order: '#1040', qrUrl: '/r/barorder/table/5', slug: 'barorder', restaurant_name: 'BarOrder', qr_url: null },
  { id: 6, name: 'Table 6', table_number: 'Table 6', capacity: 2, status: 'free', qrUrl: '/r/barorder/table/6', slug: 'barorder', restaurant_name: 'BarOrder', qr_url: null },
  { id: 7, name: 'Table 7', table_number: 'Table 7', capacity: 8, status: 'occupied', order: '#1039', qrUrl: '/r/barorder/table/7', slug: 'barorder', restaurant_name: 'BarOrder', qr_url: null },
  { id: 8, name: 'Table 8', table_number: 'Table 8', capacity: 4, status: 'free', qrUrl: '/r/barorder/table/8', slug: 'barorder', restaurant_name: 'BarOrder', qr_url: null },
];

const MOCK_PAYMENTS = [
  { id: 1, order: '#1042', table: 5, amount: formatCurrency(4250), amountRaw: 4250, method: 'Wave', status: 'paid', ref: 'WAVE-001', date: '2024-01-15 14:30' },
  { id: 2, order: '#1041', table: 3, amount: formatCurrency(2800), amountRaw: 2800, method: 'Cash', status: 'pending', ref: '-', date: '2024-01-15 14:15' },
  { id: 3, order: '#1040', table: 7, amount: formatCurrency(1500), amountRaw: 1500, method: 'Wave', status: 'paid', ref: 'WAVE-002', date: '2024-01-15 13:50' },
  { id: 4, order: '#1039', table: 2, amount: formatCurrency(3550), amountRaw: 3550, method: 'Cash', status: 'paid', ref: '-', date: '2024-01-15 13:20' },
];

const MOCK_STATS = {
  dailyRevenue: [12000, 18500, 22000, 16500, 24000, 19500, 28000],
  orderCounts: [8, 12, 15, 10, 18, 14, 22],
  topProducts: [
    { name: 'Ribeye Steak', count: 28, revenue: 784000 },
    { name: 'Mojito', count: 22, revenue: 242000 },
    { name: 'Pizza Margherita', count: 18, revenue: 270000 },
    { name: 'Salade César', count: 15, revenue: 187500 },
    { name: 'Tiramisu', count: 12, revenue: 108000 },
  ],
  paymentMethodSplit: { wave: 65, cash: 35 },
  avgOrder: 5167,
  avgOrderFormatted: formatCurrency(5167),
  totalRevenue: 1245000,
  totalRevenueFormatted: formatCurrency(1245000),
};

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
  console.log('FETCHING ADMIN ORDERS FROM:', `${api.defaults.baseURL}/admin/orders`);
  const { data } = await api.get('/api/admin/orders');
  if (!Array.isArray(data)) {
    throw new Error('Orders API returned invalid data');
  }
  const mapped = data.map(mapOrder);
  console.log('ADMIN ORDERS FETCH OK:', mapped.length);
  return mapped;
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
    table: c.table_id || c.table_number,
    time: c.created_at,
    handled: c.status !== 'new',
  }));
}

export async function markAlertHandled(alertId) {
  const { data } = await api.patch(`/api/admin/server-calls/${alertId}/status`, { status: 'handled' });
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

export { mapOrder, MOCK_ORDERS, MOCK_PRODUCTS, MOCK_CATEGORIES, MOCK_TABLES, MOCK_PAYMENTS, MOCK_STATS };
