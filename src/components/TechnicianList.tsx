import { useEffect, useState } from 'react';
import { UserPlus, Trash2, Key, Check, AlertCircle, X, Copy } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Technician } from '../lib/database.types';

export function TechnicianList() {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [credentialsModal, setCredentialsModal] = useState<Technician | null>(null);
  const [modalUsername, setModalUsername] = useState('');
  const [modalPassword, setModalPassword] = useState('');
  const [credentialsLoading, setCredentialsLoading] = useState(false);
  const [credentialsError, setCredentialsError] = useState('');
  const [credentialsSuccess, setCredentialsSuccess] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    fetchTechnicians();
  }, []);

  const fetchTechnicians = async () => {
    try {
      const { data, error } = await supabase
        .from('technicians')
        .select('*')
        .order('name');

      if (error) throw error;
      setTechnicians(data || []);
    } catch (error) {
      console.error('Error fetching technicians:', error);
    }
  };

  const handleAddTechnician = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !username || !password) return;

    if (password.length < 8) {
      setFormError('Şifre en az 8 karakter olmalıdır');
      return;
    }

    setFormLoading(true);
    setFormError('');

    try {
      const colors = ['#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];

      const { data: techData, error } = await supabase.from('technicians').insert([
        {
          name,
          specialty,
          username,
          avatar_color: randomColor,
        },
      ]).select().single();

      if (error) {
        if (error.message.includes('unique') || error.message.includes('duplicate')) {
          throw new Error('Kullanıcı adı zaten kullanılıyor');
        }
        throw error;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auth/set-password`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            technicianId: techData.id,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Şifre ayarlanamadı');
      }

      setName('');
      setSpecialty('');
      setUsername('');
      setPassword('');
      setShowForm(false);
      fetchTechnicians();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Bir hata oluştu');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu teknisyeni silmek istediğinizden emin misiniz?')) return;

    try {
      const { error } = await supabase.from('technicians').delete().eq('id', id);

      if (error) throw error;
      fetchTechnicians();
    } catch (error) {
      console.error('Error deleting technician:', error);
    }
  };

  const openCredentialsModal = (tech: Technician) => {
    setCredentialsModal(tech);
    setModalUsername(tech.username || '');
    setModalPassword('');
    setCredentialsError('');
    setCredentialsSuccess(false);
  };

  const handleSetCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!credentialsModal || !modalUsername) return;

    setCredentialsError('');
    setCredentialsLoading(true);

    try {
      const { error: usernameError } = await supabase
        .from('technicians')
        .update({ username: modalUsername })
        .eq('id', credentialsModal.id);

      if (usernameError) {
        if (usernameError.message.includes('unique') || usernameError.message.includes('duplicate')) {
          throw new Error('Kullanıcı adı zaten kullanılıyor');
        }
        throw usernameError;
      }

      if (modalPassword) {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auth/set-password`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({
              technicianId: credentialsModal.id,
              password: modalPassword,
            }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Şifre ayarlanamadı');
        }
      }

      setCredentialsSuccess(true);
      fetchTechnicians();
      setTimeout(() => {
        closeCredentialsModal();
      }, 1500);
    } catch (err) {
      setCredentialsError(err instanceof Error ? err.message : 'Bir hata oluştu');
    } finally {
      setCredentialsLoading(false);
    }
  };

  const closeCredentialsModal = () => {
    setCredentialsModal(null);
    setModalUsername('');
    setModalPassword('');
    setCredentialsError('');
    setCredentialsSuccess(false);
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Teknisyenler</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold"
        >
          <UserPlus className="w-4 h-4" />
          Teknisyen Ekle
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAddTechnician} className="mb-6 p-4 bg-gray-50 rounded-lg space-y-3">
          {formError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {formError}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Ad *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tam ad"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Kullanıcı Adı *</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder="login_username"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Şifre *</label>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 karakter"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                minLength={8}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Uzmanlık</label>
              <input
                type="text"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                placeholder="Örn: Donanım Uzmanı"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={formLoading}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {formLoading ? 'Ekleniyor...' : 'Teknisyen Ekle'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setFormError('');
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
            >
              İptal
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {technicians.map((tech) => (
          <div
            key={tech.id}
            className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold shrink-0"
                  style={{ backgroundColor: tech.avatar_color }}
                >
                  {tech.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900">{tech.name}</span>
                    {tech.username && tech.password_plain ? (
                      <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                        Giriş Hazır
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">
                        Kurulum Gerekli
                      </span>
                    )}
                  </div>
                  {tech.specialty && (
                    <div className="text-sm text-gray-500">{tech.specialty}</div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => openCredentialsModal(tech)}
                  className="text-blue-600 hover:text-blue-800 transition-colors p-2 hover:bg-blue-50 rounded-lg"
                  title="Kimlik Bilgilerini Yönet"
                >
                  <Key className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDelete(tech.id)}
                  className="text-red-500 hover:text-red-700 transition-colors p-2 hover:bg-red-50 rounded-lg"
                  title="Sil"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            {(tech.username || tech.password_plain) && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex items-center gap-4 text-sm">
                  {tech.username && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">Kullanıcı Adı:</span>
                      <code className="bg-gray-200 px-2 py-0.5 rounded text-gray-800 font-mono text-xs">
                        {tech.username}
                      </code>
                      <button
                        onClick={() => copyToClipboard(tech.username!, `username-${tech.id}`)}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        title="Kullanıcı adını kopyala"
                      >
                        {copiedField === `username-${tech.id}` ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  )}
                  {tech.password_plain && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">Şifre:</span>
                      <code className="bg-gray-200 px-2 py-0.5 rounded text-gray-800 font-mono text-xs">
                        {tech.password_plain}
                      </code>
                      <button
                        onClick={() => copyToClipboard(tech.password_plain!, `password-${tech.id}`)}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        title="Şifreyi kopyala"
                      >
                        {copiedField === `password-${tech.id}` ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
        {technicians.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            Henüz teknisyen yok. Başlamak için bir tane ekleyin!
          </div>
        )}
      </div>

      {credentialsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Giriş Kimlik Bilgilerini Yönet</h3>
              <button
                onClick={closeCredentialsModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSetCredentials} className="p-6 space-y-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                  style={{ backgroundColor: credentialsModal.avatar_color }}
                >
                  {credentialsModal.name.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{credentialsModal.name}</p>
                  {credentialsModal.specialty && (
                    <p className="text-sm text-gray-500">{credentialsModal.specialty}</p>
                  )}
                </div>
              </div>

              {credentialsError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {credentialsError}
                </div>
              )}

              {credentialsSuccess && (
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                  <Check className="w-4 h-4 shrink-0" />
                  Kimlik bilgileri başarıyla güncellendi!
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kullanıcı Adı *
                </label>
                <input
                  type="text"
                  value={modalUsername}
                  onChange={(e) => setModalUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="örn: ahmet_yilmaz"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Sadece küçük harf, rakam ve alt çizgi
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {credentialsModal.password_plain ? 'Yeni Şifre (mevcut şifreyi korumak için boş bırakın)' : 'Şifre *'}
                </label>
                <input
                  type="text"
                  value={modalPassword}
                  onChange={(e) => setModalPassword(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                  placeholder="Minimum 8 karakter"
                  minLength={modalPassword ? 8 : undefined}
                  required={!credentialsModal.password_plain}
                />
                {credentialsModal.password_plain && (
                  <p className="text-xs text-gray-500 mt-1">
                    Mevcut şifre: <code className="bg-gray-100 px-1 rounded">{credentialsModal.password_plain}</code>
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeCredentialsModal}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={credentialsLoading || credentialsSuccess}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {credentialsLoading ? 'Kaydediliyor...' : 'Kimlik Bilgilerini Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
