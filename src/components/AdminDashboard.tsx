import { useState } from 'react';
import { Shield, Users, Wrench, Ticket, LogOut, BarChart3, ClipboardList, UserCircle, Trophy } from 'lucide-react';
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

  const config = viewConfig[currentView];
  const IconComponent = config.icon;

  return (
    <div className="min-h-screen bg-gray-900 flex">
      <aside className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="bg-amber-500 p-2 rounded-lg">
              <Shield className="w-5 h-5 text-gray-900" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">TechService</h1>
              <p className="text-xs text-amber-400 font-semibold uppercase tracking-wide">Yönetici Paneli</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => setCurrentView('analytics')}
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
            onClick={() => setCurrentView('activity')}
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
            onClick={() => setCurrentView('tickets')}
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
            onClick={() => setCurrentView('technicians')}
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
            onClick={() => setCurrentView('devices')}
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
            onClick={() => setCurrentView('customers')}
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
            onClick={() => setCurrentView('won-tickets')}
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

      <main className="flex-1 bg-gradient-to-br from-gray-50 to-gray-100">
        <header className="bg-white border-b border-gray-200 px-8 py-6">
          <div className="flex items-center gap-3">
            <div className={`p-2 ${config.iconBg} rounded-lg`}>
              <IconComponent className={`w-5 h-5 ${config.iconColor}`} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{config.title}</h2>
              <p className="text-gray-600 text-sm">{config.description}</p>
            </div>
          </div>
        </header>

        <div className="p-8">
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
