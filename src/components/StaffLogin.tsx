import { useState } from 'react';
import { Users, ArrowLeft, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';

interface StaffUser {
  id: string;
  email: string;
  name: string;
  specialty: string;
  avatar_color: string;
}

interface StaffLoginProps {
  onBack: () => void;
  onLogin: (user: StaffUser) => void;
}

export function StaffLogin({ onBack, onLogin }: StaffLoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const baseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!baseUrl) {
        setError('Supabase yapılandırması eksik. .env dosyasını kontrol edin.');
        return;
      }

      const response = await fetch(
        `${baseUrl}/functions/v1/auth/login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ username, password, userType: 'staff' }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Giriş başarısız');
      }

      onLogin(data.user);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Bir hata oluştu';
      if (msg === 'Failed to fetch' || msg.includes('fetch') || err instanceof TypeError) {
        setError('Sunucuya bağlanılamıyor. Terminalde: npx supabase login → npx supabase link --project-ref cidvdsiajhgdwqypltsl → npx supabase functions deploy auth');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Portal seçimine dön
        </button>

        <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-2xl p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="bg-blue-500/10 p-4 rounded-2xl mb-4">
              <Users className="w-10 h-10 text-blue-500" />
            </div>
            <h1 className="text-2xl font-bold text-white">Personel Girişi</h1>
            <p className="text-gray-400 mt-1">Personel kimlik bilgilerinizi girin</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Kullanıcı Adı
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="Kullanıcı adınızı girin"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Şifre
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors pr-12"
                  placeholder="Şifrenizi girin"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Giriş yapılıyor...
                </>
              ) : (
                'Giriş Yap'
              )}
            </button>
          </form>

          <p className="text-center text-gray-500 text-sm mt-6">
            Giriş bilgilerinize ihtiyacınız varsa yöneticinizle iletişime geçin
          </p>
        </div>
      </div>
    </div>
  );
}
