import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useLocale } from '../utils/translations';

const PERMISSIONS = {
  super_admin: ['restaurants','users','settings','payments','analytics','products','categories','tables','orders','kitchen','server_calls','dashboard','stats'],
  manager: ['dashboard','orders','kitchen','server_calls','products','categories','tables','payments','stats','settings'],
  waiter: ['orders','server_calls','tables'],
  kitchen: ['kitchen','orders'],
  cashier: ['orders','payments'],
};

const AppContext = createContext();

function loadCart() {
  try {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function loadUser() {
  try {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  } catch { return null; }
}

export function AppProvider({ children }) {
  const [cart, setCart] = useState(loadCart);
  const [user, setUser] = useState(loadUser);
  const [tableId, setTableId] = useState(() => localStorage.getItem('tableId') || null);
  const [restaurantId, setRestaurantId] = useState(() => localStorage.getItem('restaurantId') || null);
  const [restaurantSlug, setRestaurantSlug] = useState(() => localStorage.getItem('restaurantSlug') || '');
  const [restaurant, setRestaurant] = useState(() => {
    try {
      const saved = localStorage.getItem('restaurant');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const { locale, toggleLanguage, t } = useLocale();

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    if (tableId) localStorage.setItem('tableId', tableId);
  }, [tableId]);

  useEffect(() => {
    if (restaurantId) localStorage.setItem('restaurantId', restaurantId);
  }, [restaurantId]);

  useEffect(() => {
    if (restaurantSlug) localStorage.setItem('restaurantSlug', restaurantSlug);
  }, [restaurantSlug]);

  useEffect(() => {
    if (restaurant) localStorage.setItem('restaurant', JSON.stringify(restaurant));
  }, [restaurant]);

  useEffect(() => {
    if (user) localStorage.setItem('user', JSON.stringify(user));
    else localStorage.removeItem('user');
  }, [user]);

  const hasRole = useCallback((...roles) => {
    if (!user || !user.role) return false;
    return roles.includes(user.role);
  }, [user]);

  const canAccess = useCallback((permission) => {
    if (!user || !user.role) return false;
    const perms = PERMISSIONS[user.role] || [];
    return perms.includes(permission);
  }, [user]);

  const addToCart = useCallback((item) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  }, []);

  const removeFromCart = useCallback((itemId) => {
    setCart((prev) => prev.filter((i) => i.id !== itemId));
  }, []);

  const updateQuantity = useCallback((itemId, quantity) => {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((i) => i.id !== itemId));
      return;
    }
    setCart((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, quantity } : i))
    );
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    localStorage.removeItem('cart');
  }, []);

  const cartTotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  return (
    <AppContext.Provider
      value={{
        cart, cartTotal, cartCount, tableId, restaurantId, restaurantSlug, restaurant,
        user, setUser,
        hasRole, canAccess,
        setTableId, setRestaurantId, setRestaurantSlug, setRestaurant,
        addToCart, removeFromCart, updateQuantity, clearCart,
        locale, toggleLanguage, t,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);