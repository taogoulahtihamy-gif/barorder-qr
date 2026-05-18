import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingBag, Package, Tags, Grid3X3,
  Wallet, BarChart3, Settings, LogOut, Globe, Menu, X, ChefHat, Bell, Users, ClipboardCheck,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { connectSocket, onNewServerCall, onServerCallUpdated } from '../services/socketService';

const ROLE_PAGES = {
  admin: ['dashboard','orders','kitchen','server-calls','products','categories','tables','payments','stats','users','settings','role-test'],
  super_admin: ['dashboard','orders','kitchen','server-calls','products','categories','tables','payments','stats','users','settings','role-test'],
  manager: ['dashboard','orders','kitchen','server-calls','products','categories','tables','payments','stats','settings'],
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
  { path: '/admin/users', label: 'Users', icon: Users, page: 'users' },
  { path: '/admin/role-test', label: 'Test rôles', icon: ClipboardCheck, page: 'role-test' },
  { path: '/admin/settings', label: 'Settings', icon: Settings, page: 'settings' },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { locale, toggleLanguage, t, user } = useApp();
  const [pendingCalls, setPendingCalls] = useState([]);
  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef(null);

  useEffect(() => {
    const socket = connectSocket();
    if (!socket) return;
    const unsubNew = onNewServerCall((call) => {
      setPendingCalls((prev) => [call, ...prev].slice(0, 10));
    });
    const unsubUpd = onServerCallUpdated((call) => {
      setPendingCalls((prev) => prev.filter((c) => c.id !== call.id));
    });
    return () => {
      unsubNew();
      unsubUpd();
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setBellOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    <div className="min-h-screen bg-black flex">
      <div className="hidden lg:flex">
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

      <main className="flex-1 flex flex-col min-h-screen">
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
                {pendingCalls.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {pendingCalls.length > 9 ? '9+' : pendingCalls.length}
                  </span>
                )}
              </button>
              {bellOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
                  <div className="p-3 border-b border-white/10 flex items-center justify-between">
                    <span className="text-sm font-semibold text-white">Appels serveur</span>
                    <span className="text-xs text-white/40">{pendingCalls.length} en attente</span>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {pendingCalls.length === 0 ? (
                      <p className="text-sm text-white/30 text-center py-4">Aucun appel</p>
                    ) : (
                      pendingCalls.map((call) => (
                        <div key={call.id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 border-b border-white/5 last:border-0">
                          <div className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white font-medium">Table {call.table_number || call.table_id}</p>
                            <p className="text-xs text-white/40 truncate">
                              {new Date(call.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  {pendingCalls.length > 0 && (
                    <button
                      onClick={() => handleNav('/admin/server-calls')}
                      className="w-full p-2.5 text-xs font-medium text-gold-500 hover:bg-gold-500/10 transition-colors border-t border-white/10"
                    >
                      Voir tous les appels
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
              <Bell size={20} />
              {pendingCalls.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center min-w-[18px] min-h-[18px] px-1">
                  {pendingCalls.length > 99 ? '99+' : pendingCalls.length}
                </span>
              )}
            </button>
            {bellOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
                <div className="p-3 border-b border-white/10 flex items-center justify-between">
                  <span className="text-sm font-semibold text-white">Appels serveur</span>
                  <span className="text-xs text-white/40">{pendingCalls.length} en attente</span>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {pendingCalls.length === 0 ? (
                    <p className="text-sm text-white/30 text-center py-4">Aucun appel</p>
                  ) : (
                    pendingCalls.map((call) => (
                      <div key={call.id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 border-b border-white/5 last:border-0">
                        <div className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white font-medium">Table {call.table_number || call.table_id}</p>
                          <p className="text-xs text-white/40 truncate">
                            {new Date(call.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {pendingCalls.length > 0 && (
                  <button
                    onClick={() => handleNav('/admin/server-calls')}
                    className="w-full p-2.5 text-xs font-medium text-gold-500 hover:bg-gold-500/10 transition-colors border-t border-white/10"
                  >
                    Voir tous les appels
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

        <div className="flex-1 overflow-auto p-4 lg:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
