import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import api from '../utils/api';

export default function LoginPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/login', { password });
      const token = res.data.data.token;
      localStorage.setItem('admin_token', token);
      navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.message || 'Login gagal');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-brand-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="bg-dark-800/80 backdrop-blur-xl border border-dark-700 rounded-3xl p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-brand-500/20 border border-brand-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <LogIn size={32} className="text-brand-400" />
            </div>
            <h1 className="font-display text-2xl font-bold text-white mb-2">Admin Login</h1>
            <p className="text-dark-300 text-sm">Masukkan password untuk mengakses admin panel</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-dark-200 uppercase tracking-widest mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password admin"
                className="w-full px-4 py-3 rounded-xl bg-dark-700 border border-dark-600 text-white placeholder-dark-400 outline-none focus:border-brand-500/50 transition-colors"
                disabled={loading}
                autoFocus
              />
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-brand-500 text-white font-semibold rounded-xl hover:bg-brand-600 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-brand-500/25"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-dark-400 text-xs mt-6">
            Hanya untuk owner/admin restoran
          </p>
        </div>

        {/* Security notice */}
        <div className="mt-6 p-4 rounded-xl bg-dark-800/50 border border-dark-700">
          <p className="text-xs text-dark-300">
            💡 <span className="font-semibold">Tip:</span> Simpan password admin dengan aman. Jangan bagikan ke siapa pun.
          </p>
        </div>
      </div>
    </div>
  );
}
