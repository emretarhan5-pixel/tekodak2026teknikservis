import { Shield, Users } from 'lucide-react';

interface PortalSelectorProps {
  onSelectPortal: (portal: 'admin' | 'staff') => void;
}

export function PortalSelector({ onSelectPortal }: PortalSelectorProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 sm:mb-3">TechService</h1>
          <p className="text-gray-400 text-base sm:text-lg">Servis Yönetim Platformu</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <button
            onClick={() => onSelectPortal('admin')}
            className="group bg-gray-800/50 backdrop-blur border border-gray-700 rounded-2xl p-6 sm:p-8 hover:bg-gray-800 hover:border-amber-500/50 active:scale-[0.98] transition-all duration-300 min-h-[120px] sm:min-h-0 touch-manipulation shadow-lg"
          >
            <div className="flex flex-col items-center text-center">
              <div className="bg-amber-500/10 p-4 sm:p-5 rounded-2xl mb-4 sm:mb-6 group-hover:bg-amber-500/20 transition-colors">
                <Shield className="w-10 h-10 sm:w-12 sm:h-12 text-amber-500" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 sm:mb-3">Admin Portal</h2>
              <p className="text-gray-400 text-sm sm:text-base">
                Analitiklere erişin, teknisyenleri ve cihazları yönetin, tüm işlemleri denetleyin
              </p>
            </div>
          </button>

          <button
            onClick={() => onSelectPortal('staff')}
            className="group bg-gray-800/50 backdrop-blur border border-gray-700 rounded-2xl p-6 sm:p-8 hover:bg-gray-800 hover:border-blue-500/50 active:scale-[0.98] transition-all duration-300 min-h-[120px] sm:min-h-0 touch-manipulation shadow-lg"
          >
            <div className="flex flex-col items-center text-center">
              <div className="bg-blue-500/10 p-4 sm:p-5 rounded-2xl mb-4 sm:mb-6 group-hover:bg-blue-500/20 transition-colors">
                <Users className="w-10 h-10 sm:w-12 sm:h-12 text-blue-500" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 sm:mb-3">Personel Portalı</h2>
              <p className="text-gray-400 text-sm sm:text-base">
                Servis biletlerini yönetin, onarımları takip edin ve müşteri taleplerini işleyin
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
