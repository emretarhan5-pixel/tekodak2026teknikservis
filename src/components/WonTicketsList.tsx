import { useState, useEffect } from 'react';
import { Trophy, Search, RefreshCw, Eye, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { TicketWithRelations, Technician } from '../lib/database.types';
import { TicketDetailView } from './TicketDetailView';

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatCurrency(amount: number | null | undefined) {
  if (amount == null) return '-';
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function WonTicketsList() {
  const [tickets, setTickets] = useState<TicketWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<TicketWithRelations | null>(null);

  useEffect(() => {
    fetchWonTickets();
  }, []);

  const fetchWonTickets = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tickets')
        .select(`
          *,
          devices (*),
          technicians (*)
        `)
        .eq('won', true)
        .or('won_hidden.is.null,won_hidden.eq.false')
        .order('won_at', { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      console.error('Error fetching won tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      searchQuery === '' ||
      ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.customer_full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.serial_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ticket.technicians?.name || '').toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  const totalRevenue = filteredTickets.reduce(
    (sum, ticket) => sum + (ticket.total_service_amount || 0),
    0
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-lg p-6 border border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-700 mb-1">Toplam Kazanılan</p>
              <p className="text-2xl font-bold text-yellow-900">{filteredTickets.length}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Trophy className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-700 mb-1">Toplam Gelir</p>
              <p className="text-2xl font-bold text-green-900">{formatCurrency(totalRevenue)}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Trophy className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Müşteri adı, bilet başlığı, seri numarası veya personel adı ile ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
            />
          </div>
          <button
            onClick={fetchWonTickets}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
            title="Yenile"
          >
            <RefreshCw className="w-4 h-4" />
            Yenile
          </button>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Bilet Başlığı
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Müşteri
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Personel
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Tutar
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Kazanıldığı Tarih
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <Trophy className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">Kazanılan bilet bulunamadı</p>
                    <p className="text-sm mt-1">Henüz kazanılan bilet yok</p>
                  </td>
                </tr>
              ) : (
                filteredTickets.map((ticket) => {
                  const technician = ticket.technicians;
                  
                  return (
                    <tr key={ticket.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-yellow-100 rounded-lg">
                            <Trophy className="w-4 h-4 text-yellow-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{ticket.title}</p>
                            {ticket.serial_number && (
                              <p className="text-sm text-gray-500">SN: {ticket.serial_number}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">
                            {ticket.customer_full_name || '-'}
                          </p>
                          {ticket.customer_phone && (
                            <p className="text-sm text-gray-500">{ticket.customer_phone}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {technician ? (
                          <div className="flex items-center gap-2">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                              style={{ backgroundColor: technician.avatar_color || '#3B82F6' }}
                            >
                              {technician.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{technician.name}</p>
                              {technician.specialty && (
                                <p className="text-xs text-gray-500">{technician.specialty}</p>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">Atanmamış</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-green-600">
                          {formatCurrency(ticket.total_service_amount)}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-900">
                          {ticket.won_at ? formatDate(ticket.won_at) : '-'}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={async () => {
                              await supabase.from('tickets').update({ won_hidden: true }).eq('id', ticket.id);
                              fetchWonTickets();
                            }}
                            className="flex items-center gap-1.5 px-2 py-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors text-sm"
                            title="Temizle"
                          >
                            <X className="w-4 h-4" />
                            <span>Temizle</span>
                          </button>
                          <button
                            onClick={() => setSelectedTicket(ticket)}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Detayları Görüntüle"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedTicket && (
        <TicketDetailView
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onEdit={() => {}}
          onRefresh={fetchWonTickets}
        />
      )}
    </div>
  );
}
