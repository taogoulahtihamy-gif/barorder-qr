import { Check, X, ExternalLink, User, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/Card';
import { useApp } from '../../context/AppContext';
import { useT } from '../../i18n/useT';

const PERMISSION_MATRIX = {
  dashboard: { label: 'Dashboard', roles: ['admin', 'super_admin', 'manager'], path: '/admin/dashboard' },
  orders: { label: 'Orders', roles: ['admin', 'super_admin', 'manager', 'waiter', 'kitchen', 'cashier'], path: '/admin/orders' },
  kitchen: { label: 'Kitchen', roles: ['admin', 'super_admin', 'manager', 'kitchen'], path: '/admin/kitchen' },
  'server-calls': { label: 'Server calls', roles: ['admin', 'super_admin', 'manager', 'waiter'], path: '/admin/server-calls' },
  products: { label: 'Products', roles: ['admin', 'super_admin', 'manager'], path: '/admin/products' },
  categories: { label: 'Categories', roles: ['admin', 'super_admin', 'manager'], path: '/admin/categories' },
  tables: { label: 'Tables', roles: ['admin', 'super_admin', 'manager', 'waiter'], path: '/admin/tables' },
  payments: { label: 'Payments', roles: ['admin', 'super_admin', 'manager', 'cashier'], path: '/admin/payments' },
  stats: { label: 'Statistics', roles: ['admin', 'super_admin', 'manager'], path: '/admin/stats' },
  users: { label: 'Users', roles: ['admin', 'super_admin'], path: '/admin/users' },
  promotions: { label: 'Promotions', roles: ['admin', 'super_admin', 'manager'], path: '/admin/promotions' },
  settings: { label: 'Settings', roles: ['admin', 'super_admin', 'manager'], path: '/admin/settings' },
};

export default function RoleTestPage() {
  const navigate = useNavigate();
  const { t, tRole } = useT();
  const { user } = useApp();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">{t('Roles')}</h1>

      <Card>
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <User size={20} className="text-gold-500" />
          {t('Connected user')}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-white/40 mb-1">{t('Name')}</p>
            <p className="text-white font-medium">{user?.name || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-white/40 mb-1">{t('Email')}</p>
            <p className="text-white/80 text-sm">{user?.email || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-white/40 mb-1">{t('Role')}</p>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-red-400 bg-red-500/10">
              <Shield size={12} />
              {tRole(user?.role) || '-'}
            </span>
          </div>
          <div>
            <p className="text-xs text-white/40 mb-1">{t('Restaurant')}</p>
            <p className="text-white/80 text-sm">{user?.restaurant_id ?? '-'}</p>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Shield size={20} className="text-gold-500" />
          {t('Permissions matrix')}
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 text-sm text-white/40">
                <th className="pb-3 font-medium">{t('Page')}</th>
                <th className="pb-3 font-medium">{t('Access')}</th>
                <th className="pb-3 font-medium">{t('Allowed roles')}</th>
                <th className="pb-3 font-medium text-right">{t('Action')}</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(PERMISSION_MATRIX).map(([key, page]) => {
                const hasAccess = page.roles.includes(user?.role);
                return (
                  <tr key={key} className="border-b border-white/5 last:border-0">
                    <td className="py-3 text-white font-medium">{t(page.label)}</td>
                    <td className="py-3">
                      {hasAccess ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 text-sm">
                          <Check size={16} /> {t('Authorized')}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-400 text-sm" title={t('Access not authorized expected')}>
                          <X size={16} /> {t('Denied')}
                        </span>
                      )}
                    </td>
                    <td className="py-3">
                      <div className="flex flex-wrap gap-1">
                        {page.roles.map((r) => (
                          <span
                            key={r}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                              r === user?.role ? 'text-gold-500 bg-gold-500/10' : 'text-white/30 bg-white/5'
                            }`}
                          >
                            {tRole(r)}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 text-right">
                      {hasAccess ? (
                        <button
                          onClick={() => navigate(page.path)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-gold-500/10 text-gold-500 hover:bg-gold-500/20 transition-colors"
                        >
                          {t('Open')} <ExternalLink size={12} />
                        </button>
                      ) : (
                        <span className="text-xs text-white/30 italic">{t('Access not authorized expected')}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
