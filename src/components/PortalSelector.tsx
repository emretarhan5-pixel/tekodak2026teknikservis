import { Shield, Users } from 'lucide-react';

interface PortalSelectorProps {
  onSelectPortal: (portal: 'admin' | 'staff') => void;
}

export function PortalSelector({ onSelectPortal }: PortalSelectorProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-3">TechService</h1>
          <p className="text-gray-400 text-lg">Servis Yönetim Platformu</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <button
            onClick={() => onSelectPortal('admin')}
            className="group bg-gray-800/50 backdrop-blur border border-gray-700 rounded-2xl p-8 hover:bg-gray-800 hover:border-amber-500/50 transition-all duration-300"
          >
            <div className="flex flex-col items-center text-center">
              <div className="bg-amber-500/10 p-5 rounded-2xl mb-6 group-hover:bg-amber-500/20 transition-colors">
                <Shield className="w-12 h-12 text-amber-500" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Admin Portal</h2>
              <p className="text-gray-400">
                Analitiklere erişin, teknisyenleri ve cihazları yönetin, tüm işlemleri denetleyin
              </p>
            </div>
          </button>

          <button
            onClick={() => onSelectPortal('staff')}
            className="group bg-gray-800/50 backdrop-blur border border-gray-700 rounded-2xl p-8 hover:bg-gray-800 hover:border-blue-500/50 transition-all duration-300"
          >
            <div className="flex flex-col items-center text-center">
              <div className="bg-blue-500/10 p-5 rounded-2xl mb-6 group-hover:bg-blue-500/20 transition-colors">
                <Users className="w-12 h-12 text-blue-500" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Personel Portalı</h2>
              <p className="text-gray-400">
                Servis biletlerini yönetin, onarımları takip edin ve müşteri taleplerini işleyin
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
