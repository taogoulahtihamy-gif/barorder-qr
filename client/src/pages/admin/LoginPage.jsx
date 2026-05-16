import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, Eye, EyeOff, AlertCircle } from 'lucide-react';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { useApp } from '../../context/AppContext';
import { login } from '../../services/authService';

export default function LoginPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { t } = useApp();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Veuillez entrer votre email et mot de passe');
      return;
    }
    setLoading(true);
    try {
      const result = await login(email, password);
      localStorage.setItem('token', result.token);
      if (result.user) localStorage.setItem('user', JSON.stringify(result.user));
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.message || 'Email ou mot de passe incorrect');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gold-500 mb-2">BarOrder</h1>
          <p className="text-white/50 text-sm">{t('Admin Panel')}</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <Input label={t('Email')} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@barorder.sn" />
          <div className="space-y-1.5">
            <label className="text-sm text-white/60">{t('Password')}</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-2.5 pr-10 text-white placeholder:text-white/20 focus:outline-none focus:border-gold-500/50"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20">
              <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
              <span className="text-sm text-red-400">{error}</span>
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2">
            {loading ? <span className="animate-pulse">{t('Sign In')}...</span> : <><LogIn size={18} /> {t('Sign In')}</>}
          </Button>

          <p className="text-xs text-white/20 text-center mt-4">
            demo: admin@barorder.sn / admin123
          </p>
        </form>
      </div>
    </div>
  );
}
