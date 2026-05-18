import api from './api';

function mapProduct(p) {
  return {
    id: p.id,
    name: p.name,
    description: p.description || '',
    price: p.price,
    category: p.category_name || '',
    image_url: p.image_url || '',
    available: p.is_available,
    is_available: p.is_available,
    featured: p.is_featured || false,
  };
}

export async function getMenu(restaurantId) {
  const { data } = await api.get(`/api/public/menu/${restaurantId}`);
  if (!data || !Array.isArray(data.products)) {
    throw new Error('Menu API returned invalid data');
  }
  return {
    products: data.products.map(mapProduct),
    categories: data.categories || [],
  };
}

export async function getMenuBySlug(slug, tableId) {
  const path = tableId
    ? `/api/public/r/${slug}/menu/${tableId}`
    : `/api/public/r/${slug}/menu`;
  const { data } = await api.get(path);
  if (!data || !Array.isArray(data.products)) {
    throw new Error('Menu by slug API returned invalid data');
  }
  return {
    restaurant: data.restaurant || null,
    table: data.table || null,
    products: data.products.map(mapProduct),
    categories: data.categories || [],
  };
}

export async function getRestaurants() {
  const { data } = await api.get('/api/public/restaurants');
  if (!Array.isArray(data)) {
    throw new Error('Restaurants API returned invalid data');
  }
  return data;
}

export async function getRestaurantBySlug(slug) {
  const { data } = await api.get(`/api/public/restaurant/${slug}`);
  return data;
}

export async function getPromotions(slug) {
  try {
    const { data } = await api.get(`/api/public/r/${slug}/promotions`);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}