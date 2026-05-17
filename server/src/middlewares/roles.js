const PERMISSIONS = {
  admin: [
    'restaurants', 'users', 'settings', 'payments', 'analytics',
    'products', 'categories', 'tables', 'orders', 'kitchen', 'server_calls',
    'dashboard', 'stats',
  ],
  super_admin: [
    'restaurants', 'users', 'settings', 'payments', 'analytics',
    'products', 'categories', 'tables', 'orders', 'kitchen', 'server_calls',
    'dashboard', 'stats',
  ],
  manager: [
    'dashboard', 'orders', 'kitchen', 'server_calls',
    'products', 'categories', 'tables', 'payments', 'stats', 'settings',
  ],
  waiter: [
    'orders', 'server_calls', 'tables',
  ],
  kitchen: [
    'kitchen', 'orders',
  ],
  cashier: [
    'orders', 'payments',
  ],
};

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentification requise' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }
    next();
  };
}

export function requirePermission(...permissions) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentification requise' });
    }
    const userPermissions = PERMISSIONS[req.user.role] || [];
    const hasAll = permissions.every((p) => userPermissions.includes(p));
    if (!hasAll) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }
    next();
  };
}

export { PERMISSIONS };
