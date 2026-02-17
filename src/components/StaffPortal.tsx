import { useState } from 'react';
import { Ticket, LogOut, BarChart3, X } from 'lucide-react';
import { KanbanBoard } from './KanbanBoard';
import { TicketModal } from './TicketModal';
import { TicketDetailView } from './TicketDetailView';
import { StaffAnalytics } from './StaffAnalytics';
import type { TicketWithRelations } from '../lib/database.types';

interface StaffUser {
  id: string;
  email: string;
  name: string;
  specialty: string;
  avatar_color: string;
}

interface StaffPortalProps {
  user: StaffUser;
  onLogout: () => void;
}

export function StaffPortal({ user, onLogout }: StaffPortalProps) {
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [showDetailView, setShowDetailView] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<TicketWithRelations | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);

  const handleViewTicket = (ticket: TicketWithRelations) => {
    setSelectedTicket(ticket);
    setShowDetailView(true);
  };

  const handleCloseDetailView = () => {
    setShowDetailView(false);
    setSelectedTicket(null);
  };

  const handleCloseModal = () => {
    setShowTicketModal(false);
    setSelectedTicket(null);
  };

  const handleSaveTicket = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleNewTicket = () => {
    setSelectedTicket(null);
    setShowTicketModal(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <nav className="bg-white border-b border-gray-200 shadow-sm pt-[env(safe-area-inset-top)]">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Ticket className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">TechService</h1>
                <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide hidden sm:block">Personel Portalı</p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4 shrink-0">
              <button
                onClick={() => setShowAnalyticsModal(true)}
                className="flex items-center gap-2 bg-green-600 text-white px-3 py-2.5 sm:px-5 sm:py-2.5 rounded-lg hover:bg-green-700 active:scale-[0.98] transition-all font-semibold text-sm min-h-[44px] touch-manipulation"
              >
                <BarChart3 className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">Performans İstatistikleri</span>
              </button>
              <button
                onClick={handleNewTicket}
                className="flex items-center gap-2 bg-blue-600 text-white px-3 py-2.5 sm:px-5 sm:py-2.5 rounded-lg hover:bg-blue-700 active:scale-[0.98] transition-all font-semibold text-sm min-h-[44px] touch-manipulation"
              >
                <Ticket className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">Yeni Bilet</span>
              </button>

              <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-4 border-l border-gray-200">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                  style={{ backgroundColor: user.avatar_color }}
                >
                  {user.name.charAt(0)}
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.specialty}</p>
                </div>
                <button
                  onClick={onLogout}
                  className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors touch-manipulation"
                  title="Çıkış Yap"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <div className="mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">Servis Biletleri</h2>
          <p className="text-gray-600 text-sm sm:text-base">
            Biletlerin durumunu güncellemek için biletleri sütunlar arasında sürükleyip bırakın
          </p>
        </div>
              <KanbanBoard 
                onEditTicket={handleViewTicket} 
                refreshTrigger={refreshTrigger}
                onTicketUpdate={() => setRefreshTrigger((prev) => prev + 1)}
                staffId={user.id}
              />
      </main>

      {showDetailView && selectedTicket && (
        <TicketDetailView
          ticket={selectedTicket}
          onClose={handleCloseDetailView}
          onRefresh={handleSaveTicket}
        />
      )}

      {showTicketModal && (
        <TicketModal
          ticket={selectedTicket}
          onClose={handleCloseModal}
          onSave={handleSaveTicket}
          staffName={user.name}
          staffId={user.id}
        />
      )}

      {showAnalyticsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-2xl w-full max-w-4xl h-[95dvh] sm:h-auto sm:max-h-[85vh] overflow-y-auto touch-manipulation">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex items-center justify-between z-10 gap-2">
              <h2 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">Performans İstatistikleri</h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setRefreshTrigger((prev) => prev + 1)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  title="Yenile"
                >
                  Yenile
                </button>
                <button
                  onClick={() => setShowAnalyticsModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Kapat"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <StaffAnalytics staffId={user.id} refreshTrigger={refreshTrigger} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
