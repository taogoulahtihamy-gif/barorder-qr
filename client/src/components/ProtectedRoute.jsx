import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from './LoadingSpinner';
import { useApp } from '../context/AppContext';
import { getMe } from '../services/authService';

export default function ProtectedRoute({ children, roles }) {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const { user, setUser } = useApp();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/admin/login', { replace: true });
      return;
    }
    if (user) {
      setChecking(false);
      return;
    }
    getMe().then((res) => {
      if (res.user) setUser(res.user);
      setChecking(false);
    }).catch(() => {
      localStorage.removeItem('token');
      navigate('/admin/login', { replace: true });
    });
  }, [navigate, user, setUser]);

  if (checking) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (roles && user && !roles.includes(user.role)) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4 p-4">
        <h1 className="text-6xl font-bold text-white/10">403</h1>
        <p className="text-xl text-gold-500 font-semibold">Accès non autorisé</p>
        <p className="text-sm text-white/40">Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
        <button
          onClick={() => navigate('/admin/dashboard')}
          className="mt-4 px-6 py-2.5 rounded-xl bg-gold-500 text-black font-medium text-sm hover:bg-gold-600 transition-colors"
        >
          Retour au tableau de bord
        </button>
      </div>
    );
  }

  return children;
}
