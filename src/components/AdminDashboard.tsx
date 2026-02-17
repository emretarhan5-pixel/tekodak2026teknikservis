import { useState } from 'react';
import { Shield, Users, Wrench, Ticket, LogOut, BarChart3, ClipboardList, UserCircle, Trophy, Menu, X } from 'lucide-react';
import { TechnicianList } from './TechnicianList';
import { DeviceList } from './DeviceList';
import { AdminTicketList } from './AdminTicketList';
import { AdminAnalytics } from './AdminAnalytics';
import { StaffActivityReport } from './StaffActivityReport';
import { CustomerData } from './CustomerData';
import { WonTicketsList } from './WonTicketsList';

interface AdminUser {
  id: string;
  email: string;
  name: string;
}

interface AdminDashboardProps {
  user: AdminUser;
  onLogout: () => void;
}

type AdminView = 'technicians' | 'devices' | 'tickets' | 'analytics' | 'activity' | 'customers' | 'won-tickets';

const viewConfig = {
  technicians: {
    icon: Users,
    title: 'Teknisyen Yönetimi',
    description: 'Servis ekibinizdeki üyeleri ekleyin, düzenleyin ve yönetin',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
  },
  devices: {
    icon: Wrench,
    title: 'Cihaz Yönetimi',
    description: 'Müşteri cihazlarını envanterinize kaydedin ve yönetin',
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
  },
  tickets: {
    icon: Ticket,
    title: 'Tüm Biletler',
    description: 'Tüm teknisyenlerdeki servis biletlerini görüntüleyin ve yönetin',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
  },
  analytics: {
    icon: BarChart3,
    title: 'Analitik ve Raporlar',
    description: 'Şirket genelinde gelir metrikleri ve personel performansı',
    iconBg: 'bg-teal-100',
    iconColor: 'text-teal-600',
  },
  activity: {
    icon: ClipboardList,
    title: 'Personel Aktiviteleri',
    description: 'Personel üyesi ve tarih aralığına göre işlemleri arayın ve inceleyin',
    iconBg: 'bg-cyan-100',
    iconColor: 'text-cyan-600',
  },
  customers: {
    icon: UserCircle,
    title: 'Müşteri Verileri',
    description: 'Tüm müşteri bilgilerini görüntüleyin ve CSV olarak dışa aktarın',
    iconBg: 'bg-rose-100',
    iconColor: 'text-rose-600',
  },
  'won-tickets': {
    icon: Trophy,
    title: 'Kazanılan Biletler',
    description: 'Kazanılan müşterileri ve kazanan personel bilgilerini görüntüleyin',
    iconBg: 'bg-yellow-100',
    iconColor: 'text-yellow-600',
  },
};

export function AdminDashboard({ user, onLogout }: AdminDashboardProps) {
  const [currentView, setCurrentView] = useState<AdminView>('analytics');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const config = viewConfig[currentView];
  const IconComponent = config.icon;

  const closeSidebar = () => setSidebarOpen(false);
  const handleNavClick = (view: AdminView) => {
    setCurrentView(view);
    closeSidebar();
  };

  return (
    <div className="min-h-screen bg-gray-900 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* Hamburger - mobile only */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="lg:hidden fixed z-50 p-2.5 bg-gray-800 text-white rounded-lg hover:bg-gray-700 active:scale-[0.95] transition-all min-h-[44px] min-w-[44px] touch-manipulation top-[calc(1rem+env(safe-area-inset-top))] left-[calc(1rem+env(safe-area-inset-left))]"
        title="Menü"
      >
        <Menu className="w-6 h-6" />
      </button>

      <aside className={`fixed lg:relative inset-y-0 left-0 z-40 w-72 sm:w-64 bg-gray-800 border-r border-gray-700 flex flex-col transform transition-transform duration-200 ease-out lg:translate-x-0 pt-[env(safe-area-inset-top)] ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-4 sm:p-6 border-b border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-amber-500 p-2 rounded-lg">
              <Shield className="w-5 h-5 text-gray-900" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">TechService</h1>
              <p className="text-xs text-amber-400 font-semibold uppercase tracking-wide">Yönetici Paneli</p>
            </div>
          </div>
          <button
            onClick={closeSidebar}
            className="lg:hidden p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-400 hover:text-white rounded-lg touch-manipulation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <button
            onClick={() => handleNavClick('analytics')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors text-left ${
              currentView === 'analytics'
                ? 'bg-amber-500 text-gray-900'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            Analitik
          </button>
          <button
            onClick={() => handleNavClick('activity')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors text-left ${
              currentView === 'activity'
                ? 'bg-amber-500 text-gray-900'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <ClipboardList className="w-5 h-5" />
            Personel Aktiviteleri
          </button>
          <button
            onClick={() => handleNavClick('tickets')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors text-left ${
              currentView === 'tickets'
                ? 'bg-amber-500 text-gray-900'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <Ticket className="w-5 h-5" />
            Tüm Biletler
          </button>
          <button
            onClick={() => handleNavClick('technicians')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors text-left ${
              currentView === 'technicians'
                ? 'bg-amber-500 text-gray-900'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <Users className="w-5 h-5" />
            Teknisyenler
          </button>
          <button
            onClick={() => handleNavClick('devices')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors text-left ${
              currentView === 'devices'
                ? 'bg-amber-500 text-gray-900'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <Wrench className="w-5 h-5" />
            Cihazlar
          </button>
          <button
            onClick={() => handleNavClick('customers')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors text-left ${
              currentView === 'customers'
                ? 'bg-amber-500 text-gray-900'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <UserCircle className="w-5 h-5" />
            Müşteriler
          </button>
          <button
            onClick={() => handleNavClick('won-tickets')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors text-left ${
              currentView === 'won-tickets'
                ? 'bg-amber-500 text-gray-900'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <Trophy className="w-5 h-5" />
            Kazanılan Biletler
          </button>
        </nav>

        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center gap-3 px-3 py-2 mb-3">
            <div className="w-9 h-9 rounded-full bg-amber-500 flex items-center justify-center text-gray-900 font-semibold text-sm">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user.name}</p>
              <p className="text-xs text-gray-400 truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-gray-300 hover:bg-red-500/10 hover:text-red-400 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Çıkış Yap
          </button>
        </div>
      </aside>

      <main className="flex-1 bg-gradient-to-br from-gray-50 to-gray-100 min-w-0">
        <header className="bg-white border-b border-gray-200 px-4 pt-16 pb-4 sm:pt-6 sm:px-8 sm:py-6">
          <div className="flex items-center gap-3">
            <div className={`p-2 ${config.iconBg} rounded-lg`}>
              <IconComponent className={`w-5 h-5 ${config.iconColor}`} />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{config.title}</h2>
              <p className="text-gray-600 text-sm hidden sm:block">{config.description}</p>
            </div>
          </div>
        </header>

        <div className="p-4 sm:p-8">
          <div className={currentView === 'tickets' || currentView === 'analytics' || currentView === 'activity' || currentView === 'customers' || currentView === 'won-tickets' ? '' : 'max-w-3xl'}>
            {currentView === 'technicians' && <TechnicianList />}
            {currentView === 'devices' && <DeviceList />}
            {currentView === 'tickets' && <AdminTicketList />}
            {currentView === 'analytics' && <AdminAnalytics />}
            {currentView === 'activity' && <StaffActivityReport />}
            {currentView === 'customers' && <CustomerData />}
            {currentView === 'won-tickets' && <WonTicketsList />}
          </div>
        </div>
      </main>
    </div>
  );
}
