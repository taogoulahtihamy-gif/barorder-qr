import api from './api';
import { setUsingMock } from './mockState';

const MOCK_MENU = [
  { id: 1, name: 'Salade César', category: 'Plats', price: 12.50, description: 'Romaine fraîche, parmesan, croûtons', available: true },
  { id: 2, name: 'Bruschetta', category: 'Plats', price: 8.90, description: 'Tomate, basilic, mozzarella', available: true },
  { id: 3, name: 'Ribeye Steak', category: 'Grillades', price: 28.00, description: '300g avec légumes de saison', available: true },
  { id: 4, name: 'Saumon grillé', category: 'Plats', price: 24.50, description: 'Sauce au beurre de citron', available: true },
  { id: 5, name: 'Tiramisu', category: 'Desserts', price: 9.00, description: 'Dessert italien classique', available: true },
  { id: 6, name: 'Mojito', category: 'Cocktails', price: 11.00, description: 'Menthe fraîche, citron vert, rhum', available: true },
  { id: 7, name: 'Espresso', category: 'Boissons', price: 3.50, description: 'Double shot', available: true },
  { id: 8, name: 'Panna Cotta', category: 'Desserts', price: 8.50, description: 'Vanille avec coulis de baies', available: false },
  { id: 9, name: 'Pizza Margherita', category: 'Plats', price: 15.00, description: 'Tomate, mozzarella, basilic', available: true },
  { id: 10, name: 'Spaghetti Carbonara', category: 'Plats', price: 16.50, description: 'Guanciale, œuf, pecorino', available: true },
  { id: 11, name: 'Assiette de grillades', category: 'Grillades', price: 32.00, description: 'Mix de viandes grillées', available: true },
  { id: 12, name: 'Menu du jour', category: 'Promotions', price: 18.00, description: 'Plat + dessert + boisson', available: true },
  { id: 13, name: 'Limonade', category: 'Boissons', price: 4.50, description: 'Limonade maison', available: false },
];

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
  try {
    const { data } = await api.get(`/public/menu/${restaurantId}`);
    if (!data || !Array.isArray(data.products)) {
      console.warn('Menu API returned invalid data, using mock');
      setUsingMock(true);
      return { products: MOCK_MENU, categories: [] };
    }
    setUsingMock(false);
    return {
      products: data.products.map(mapProduct),
      categories: data.categories || [],
    };
  } catch {
    setUsingMock(true);
    console.warn('Menu API unavailable, using mock data');
    return { products: MOCK_MENU, categories: [] };
  }
}

export async function getMenuBySlug(slug) {
  try {
    const { data } = await api.get(`/public/r/${slug}/menu`);
    if (!data || !Array.isArray(data.products)) {
      console.warn('Menu by slug API returned invalid data, using mock');
      setUsingMock(true);
      return { products: MOCK_MENU, categories: [], restaurant: null };
    }
    setUsingMock(false);
    return {
      restaurant: data.restaurant || null,
      products: data.products.map(mapProduct),
      categories: data.categories || [],
    };
  } catch {
    setUsingMock(true);
    console.warn('Menu by slug API unavailable, using mock data');
    return { products: MOCK_MENU, categories: [], restaurant: null };
  }
}

export async function getRestaurants() {
  try {
    const { data } = await api.get('/public/restaurants');
    if (!Array.isArray(data)) {
      console.warn('Restaurants API returned invalid data');
      return [];
    }
    return data;
  } catch {
    console.warn('Restaurants API unavailable');
    return [];
  }
}

export async function getRestaurantBySlug(slug) {
  try {
    const { data } = await api.get(`/public/restaurant/${slug}`);
    return data;
  } catch {
    console.warn('Restaurant by slug API unavailable');
    return null;
  }
}

export { MOCK_MENU };