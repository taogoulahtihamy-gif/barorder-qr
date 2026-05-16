import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingBag, Package, Tags, Grid3X3,
  Wallet, BarChart3, Settings, LogOut, Globe, Menu, X, ChefHat,
} from 'lucide-react';
import { useState } from 'react';
import { useApp } from '../context/AppContext';

const navItems = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { path: '/admin/kitchen', label: 'Cuisine', icon: ChefHat },
  { path: '/admin/products', label: 'Products', icon: Package },
  { path: '/admin/categories', label: 'Categories', icon: Tags },
  { path: '/admin/tables', label: 'Tables', icon: Grid3X3 },
  { path: '/admin/payments', label: 'Payments', icon: Wallet },
  { path: '/admin/stats', label: 'Statistics', icon: BarChart3 },
  { path: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { locale, toggleLanguage, t } = useApp();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/admin/login');
  };

  const handleNav = (path) => {
    navigate(path);
    setMobileOpen(false);
  };

  if (location.pathname === '/admin/login') {
    return <Outlet />;
  }

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
            <button onClick={toggleLanguage} className="p-1.5 text-white/40 hover:text-wave-500 text-xs font-medium">
              <Globe size={16} className="inline mr-0.5" />
              {locale === 'fr' ? 'EN' : 'FR'}
            </button>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-4 lg:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
