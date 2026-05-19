import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingBag, Package, Tags, Grid3X3,
  Wallet, BarChart3, Settings, LogOut, Globe, Menu, X, ChefHat, Bell, Users, ClipboardCheck, Percent, Volume2, Bell as BellIcon,
} from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useApp } from '../context/AppContext';
import { connectSocket, onNewOrder, onOrderStatusUpdated, onPaymentUpdated, onNewServerCall, onServerCallUpdated } from '../services/socketService';
import { playNotificationSound, playServerCallSound, sendBrowserNotification, isSoundEnabled, requestSoundPermission } from '../utils/notificationService';

const ROLE_PAGES = {
  admin: ['dashboard','orders','kitchen','server-calls','products','categories','tables','payments','stats','users','settings','role-test','promotions'],
  super_admin: ['dashboard','orders','kitchen','server-calls','products','categories','tables','payments','stats','users','settings','role-test','promotions'],
  manager: ['dashboard','orders','kitchen','server-calls','products','categories','tables','payments','stats','settings','promotions'],
  waiter: ['orders','server-calls','tables'],
  kitchen: ['orders','kitchen'],
  cashier: ['orders','payments'],
};

const NAV_ITEMS = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, page: 'dashboard' },
  { path: '/admin/orders', label: 'Orders', icon: ShoppingBag, page: 'orders' },
  { path: '/admin/kitchen', label: 'Cuisine', icon: ChefHat, page: 'kitchen' },
  { path: '/admin/server-calls', label: 'Appels serveur', icon: Bell, page: 'server-calls' },
  { path: '/admin/products', label: 'Products', icon: Package, page: 'products' },
  { path: '/admin/categories', label: 'Categories', icon: Tags, page: 'categories' },
  { path: '/admin/tables', label: 'Tables', icon: Grid3X3, page: 'tables' },
  { path: '/admin/payments', label: 'Payments', icon: Wallet, page: 'payments' },
  { path: '/admin/stats', label: 'Statistics', icon: BarChart3, page: 'stats' },
  { path: '/admin/promotions', label: 'Promotions', icon: Percent, page: 'promotions' },
  { path: '/admin/users', label: 'Users', icon: Users, page: 'users' },
  { path: '/admin/role-test', label: 'Roles', icon: ClipboardCheck, page: 'role-test' },
  { path: '/admin/settings', label: 'Settings', icon: Settings, page: 'settings' },
];

const EVENT_ROLES = {
  new_order: ['kitchen', 'admin', 'super_admin', 'manager'],
  order_ready: ['waiter', 'admin', 'super_admin', 'manager'],
  order_served: ['cashier', 'admin', 'super_admin', 'manager'],
  payment_pending: ['cashier', 'admin', 'super_admin', 'manager'],
  server_call: ['waiter', 'admin', 'super_admin', 'manager'],
};

let notifIdCounter = 0;

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { locale, toggleLanguage, t, user } = useApp();
  const [notifications, setNotifications] = useState([]);
  const [bellOpen, setBellOpen] = useState(false);
  const [soundBanner, setSoundBanner] = useState(false);
  const bellRef = useRef(null);
  const pollingRef = useRef(null);

  const userRole = user?.role || '';

  const addNotification = useCallback((notif) => {
    setNotifications((prev) => {
      const next = [{ ...notif, id: ++notifIdCounter, read: false, createdAt: Date.now() }, ...prev];
      return next.slice(0, 50);
    });
  }, []);

  const notifyRole = useCallback((eventType, title, body, soundFn) => {
    const allowedRoles = EVENT_ROLES[eventType] || [];
    if (!allowedRoles.includes(userRole) && !['admin', 'super_admin', 'manager'].includes(userRole)) return;
    addNotification({ type: eventType, title, body });
    if (!isSoundEnabled()) { setSoundBanner(true); return; }
    if (soundFn) soundFn();
    sendBrowserNotification(title, body);
  }, [userRole, addNotification]);

  useEffect(() => {
    const socket = connectSocket();

    const unsubOrder = socket ? onNewOrder((data) => {
      const orderNum = data?.order_number || data?.orderNumber || '';
      notifyRole('new_order', t('Nouvelle commande'), `${t('Commande')} ${orderNum}`, playNotificationSound);
    }) : () => {};

    const unsubStatus = socket ? onOrderStatusUpdated((data) => {
      const status = data?.order_status || data?.status || '';
      const orderNum = data?.order_number || data?.orderNumber || '';
      if (status === 'ready') {
        notifyRole('order_ready', t('Commande prête'), `${t('Commande')} ${orderNum}`, playNotificationSound);
      } else if (status === 'served') {
        notifyRole('order_served', t('Commande servie'), `${t('Commande')} ${orderNum}`, playNotificationSound);
      }
    }) : () => {};

    const unsubPay = socket ? onPaymentUpdated(() => {
      notifyRole('payment_pending', t('Paiement en attente'), t('Un paiement nécessite votre attention'), playNotificationSound);
    }) : () => {};

    const unsubServerNew = socket ? onNewServerCall((call) => {
      const tableStr = call?.table_number || call?.table_id || '';
      notifyRole('server_call', t('Appel serveur'), `${t('Table')} ${tableStr}`, playServerCallSound);
    }) : () => {};

    const unsubServerUpd = socket ? onServerCallUpdated((call) => {
      addNotification({ type: 'server_call_resolved', title: t('Appel résolu'), body: `${t('Table')} ${call?.table_number || call?.table_id || ''}` });
    }) : () => {};

    const polling = setInterval(() => {
      if (!socket?.connected) {
        if (!pollingRef.current) {
          pollingRef.current = true;
        }
      }
    }, 5000);

    return () => {
      unsubOrder();
      unsubStatus();
      unsubPay();
      unsubServerNew();
      unsubServerUpd();
      clearInterval(polling);
    };
  }, [notifyRole, addNotification, t]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setBellOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isSoundEnabled()) setSoundBanner(true);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/admin/login');
  };

  const handleNav = (path) => {
    navigate(path);
    setMobileOpen(false);
    setBellOpen(false);
  };

  const handleEnableSound = () => {
    requestSoundPermission();
    setSoundBanner(false);
    playNotificationSound();
  };

  if (location.pathname === '/admin/login') {
    return <Outlet />;
  }

  const allowedPages = ROLE_PAGES[user?.role] || [];
  const navItems = NAV_ITEMS.filter((item) => allowedPages.includes(item.page));

  const sidebarContent = (
    <div className={`${collapsed ? 'w-16' : 'w-56'} transition-all duration-300 bg-zinc-950 border-r border-white/10 flex flex-col h-full`}>
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <h2 className={`font-bold text-gold-500 ${collapsed ? 'text-center text-sm' : 'text-lg'}`}>
          {collapsed ? 'BO' : 'BarOrder'}
        </h2>
        <button onClick={() => { setCollapsed(!collapsed); setMobileOpen(false); }} className="text-white/30 hover:text-white hidden lg:block">
          <Menu size={16} />
        </button>
      </div>
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = location.pathname === item.path || (item.path !== '/admin/dashboard' && location.pathname.startsWith(item.path));
          return (
            <button
              key={item.path}
              onClick={() => handleNav(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                active ? 'bg-gold-500/10 text-gold-500' : 'text-white/60 hover:text-white hover:bg-white/5'
              } ${collapsed ? 'justify-center' : ''}`}
            >
              <Icon size={20} />
              {!collapsed && <span className="text-sm">{t(item.label)}</span>}
            </button>
          );
        })}
      </nav>
      <div className="p-2 border-t border-white/10 space-y-1">
        <button
          onClick={toggleLanguage}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-white/40 hover:text-wave-500 transition-colors"
        >
          <Globe size={20} />
          {!collapsed && <span>{locale === 'fr' ? 'EN' : 'FR'}</span>}
        </button>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-white/40 hover:text-red-400 transition-colors"
        >
          <LogOut size={20} />
          {!collapsed && <span>{t('Logout')}</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black flex overflow-x-hidden max-w-full">
      <div className="hidden lg:flex flex-shrink-0">
        {sidebarContent}
      </div>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <div className="relative w-64 bg-zinc-950 border-r border-white/10">
            {sidebarContent}
          </div>
        </div>
      )}

      <main className="flex-1 flex flex-col min-h-screen max-w-full w-full overflow-x-hidden">
        {soundBanner && (
          <div className="sticky top-0 z-50 bg-gold-500/10 border-b border-gold-500/20 px-4 py-2.5 flex items-center justify-between">
            <p className="text-xs text-gold-400 font-medium flex items-center gap-2">
              <Volume2 size={14} /> {t('Activer les notifications sonores')}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={handleEnableSound}
                className="text-xs px-3 py-1 rounded-lg bg-gold-500 text-black font-semibold hover:bg-gold-600 transition-colors"
              >
                {t('Activer')}
              </button>
              <button
                onClick={() => setSoundBanner(false)}
                className="text-xs text-white/40 hover:text-white transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        <header className="sticky top-0 z-40 bg-black/90 backdrop-blur border-b border-white/10 px-4 py-3 flex items-center gap-3 lg:hidden">
          <button onClick={() => setMobileOpen(true)} className="p-1 text-white/60 hover:text-white">
            <Menu size={24} />
          </button>
          <h1 className="text-lg font-bold text-gold-500">BarOrder</h1>
          <div className="ml-auto flex items-center gap-2">
            <div className="relative" ref={bellRef}>
              <button
                onClick={() => setBellOpen(!bellOpen)}
                className="p-1.5 text-white/60 hover:text-gold-500 relative"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              {bellOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
                  <div className="p-3 border-b border-white/10 flex items-center justify-between">
                    <span className="text-sm font-semibold text-white">{t('Notifications')}</span>
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} className="text-xs text-gold-500 hover:text-gold-400 transition-colors">
                        {t('Tout lu')}
                      </button>
                    )}
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="text-sm text-white/30 text-center py-4">{t('Aucune notification')}</p>
                    ) : (
                      notifications.map((n) => (
                        <div key={n.id} className={`flex items-start gap-3 px-3 py-2.5 hover:bg-white/5 border-b border-white/5 last:border-0 ${n.read ? 'opacity-50' : ''}`}>
                          <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                            n.type === 'new_order' ? 'bg-wave-500' :
                            n.type === 'server_call' ? 'bg-yellow-400' :
                            n.type === 'order_ready' ? 'bg-emerald-400' :
                            'bg-blue-400'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white font-medium">{n.title}</p>
                            <p className="text-xs text-white/40 truncate">{n.body}</p>
                            <p className="text-[10px] text-white/20 mt-0.5">
                              {new Date(n.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  {notifications.length > 0 && unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="w-full p-2.5 text-xs font-medium text-gold-500 hover:bg-gold-500/10 transition-colors border-t border-white/10"
                    >
                      {t('Tout marquer comme lu')}
                    </button>
                  )}
                </div>
              )}
            </div>
            <button onClick={toggleLanguage} className="p-1.5 text-white/40 hover:text-wave-500 text-xs font-medium">
              <Globe size={16} className="inline mr-0.5" />
              {locale === 'fr' ? 'EN' : 'FR'}
            </button>
          </div>
        </header>

        <header className="sticky top-0 z-40 bg-black/90 backdrop-blur border-b border-white/10 px-6 py-3 hidden lg:flex items-center justify-end gap-4">
          <div className="relative" ref={bellRef}>
            <button
              onClick={() => setBellOpen(!bellOpen)}
              className="p-2 text-white/60 hover:text-gold-500 relative transition-colors"
            >
              <BellIcon size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center min-w-[18px] min-h-[18px] px-1">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
            {bellOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
                <div className="p-3 border-b border-white/10 flex items-center justify-between">
                  <span className="text-sm font-semibold text-white">{t('Notifications')}</span>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-xs text-gold-500 hover:text-gold-400 transition-colors">
                      {t('Tout lu')}
                    </button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="text-sm text-white/30 text-center py-4">{t('Aucune notification')}</p>
                  ) : (
                    notifications.map((n) => (
                      <div key={n.id} className={`flex items-start gap-3 px-3 py-2.5 hover:bg-white/5 border-b border-white/5 last:border-0 ${n.read ? 'opacity-50' : ''}`}>
                        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                          n.type === 'new_order' ? 'bg-wave-500' :
                          n.type === 'server_call' ? 'bg-yellow-400' :
                          n.type === 'order_ready' ? 'bg-emerald-400' :
                          'bg-blue-400'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white font-medium">{n.title}</p>
                          <p className="text-xs text-white/40 truncate">{n.body}</p>
                          <p className="text-[10px] text-white/20 mt-0.5">
                            {new Date(n.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {notifications.length > 0 && unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="w-full p-2.5 text-xs font-medium text-gold-500 hover:bg-gold-500/10 transition-colors border-t border-white/10"
                  >
                    {t('Tout marquer comme lu')}
                  </button>
                )}
              </div>
            )}
          </div>
          <button onClick={toggleLanguage} className="p-1.5 text-white/40 hover:text-wave-500 text-xs font-medium flex items-center gap-1">
            <Globe size={16} />
            {locale === 'fr' ? 'EN' : 'FR'}
          </button>
        </header>

        <div className="flex-1 overflow-auto p-4 lg:p-6 max-w-full w-full safe-area-bottom">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
