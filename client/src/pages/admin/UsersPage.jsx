import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Plus, Shield, UserCheck, UserX } from 'lucide-react';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Input from '../../components/Input';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';
import api from '../../services/api';
import { useApp } from '../../context/AppContext';

const VALID_ROLES = ['admin', 'super_admin', 'manager', 'waiter', 'kitchen', 'cashier'];

const ROLE_COLORS = {
  admin: 'text-rose-400 bg-rose-500/10',
  super_admin: 'text-red-400 bg-red-500/10',
  manager: 'text-amber-400 bg-amber-500/10',
  waiter: 'text-blue-400 bg-blue-500/10',
  kitchen: 'text-emerald-400 bg-emerald-500/10',
  cashier: 'text-purple-400 bg-purple-500/10',
};

export default function UsersPage() {
  const { t } = useApp();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'waiter' });

  const fetchUsers = useCallback(async () => {
    try {
      const { data } = await api.get('/api/admin/users');
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('[UsersPage] fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', email: '', password: '', role: 'waiter' });
    setModalOpen(true);
  };

  const openEdit = (user) => {
    setEditing(user);
    setForm({ name: user.name, email: user.email, password: '', role: user.role });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        const payload = { name: form.name, email: form.email, role: form.role };
        if (form.password) payload.password = form.password;
        await api.put(`/api/admin/users/${editing.id}`, payload);
        toast.success('Utilisateur mis à jour');
      } else {
        await api.post('/api/admin/users', form);
        toast.success('Utilisateur créé');
      }
      setModalOpen(false);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur');
    }
  };

  const toggleActive = async (user) => {
    try {
      await api.put(`/api/admin/users/${user.id}`, { is_active: !user.is_active });
      toast.success(user.is_active ? 'Utilisateur désactivé' : 'Utilisateur activé');
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur');
    }
  };

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Utilisateurs</h1>
        <Button variant="gold" onClick={openCreate} className="flex items-center gap-2">
          <Plus size={18} /> Ajouter
        </Button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 text-sm text-white/40">
                <th className="pb-3 font-medium">Nom</th>
                <th className="pb-3 font-medium">Email</th>
                <th className="pb-3 font-medium">Rôle</th>
                <th className="pb-3 font-medium">Statut</th>
                <th className="pb-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-white/5 last:border-0">
                  <td className="py-3 text-white font-medium">{u.name}</td>
                  <td className="py-3 text-white/60 text-sm">{u.email}</td>
                  <td className="py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[u.role] || 'text-white/40 bg-white/5'}`}>
                      <Shield size={12} />
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3">
                    <span className={`inline-flex items-center gap-1 text-sm ${u.is_active ? 'text-emerald-400' : 'text-red-400'}`}>
                      {u.is_active ? <UserCheck size={16} /> : <UserX size={16} />}
                      {u.is_active ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => toggleActive(u)}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                          u.is_active ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                        }`}
                      >
                        {u.is_active ? 'Désactiver' : 'Activer'}
                      </button>
                      <button
                        onClick={() => openEdit(u)}
                        className="px-3 py-1 rounded-lg text-xs font-medium bg-white/5 text-white/60 hover:bg-white/10 transition-colors"
                      >
                        Modifier
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-white/30">Aucun utilisateur</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Modifier l\'utilisateur' : 'Ajouter un utilisateur'}>
        <form onSubmit={handleSave} className="space-y-4">
          <Input label="Nom" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <Input
            label={editing ? 'Nouveau mot de passe (laisser vide pour conserver)' : 'Mot de passe'}
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required={!editing}
          />
          <div className="space-y-1.5">
            <label className="text-sm text-white/60">Rôle</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-gold-500/50"
            >
              {VALID_ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Annuler</Button>
            <Button type="submit" variant="gold">{editing ? 'Enregistrer' : 'Créer'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
