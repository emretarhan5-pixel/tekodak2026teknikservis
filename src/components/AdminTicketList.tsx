import { useState, useEffect } from 'react';
import { Search, Filter, Eye, Edit3, AlertCircle, ChevronDown, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { TicketWithRelations, Technician, TicketStatus, TicketPriority } from '../lib/database.types';
import { TicketDetailView } from './TicketDetailView';
import { TicketModal } from './TicketModal';

const statusConfig: Record<string, { label: string; color: string }> = {
  accepted_pending: { label: 'Kabul Edildi / Beklemede', color: 'bg-slate-100 text-slate-700' },
  fault_diagnosis: { label: 'Arıza Tespiti', color: 'bg-blue-100 text-blue-700' },
  customer_approval: { label: 'Müşteri Onayı', color: 'bg-amber-100 text-amber-700' },
  under_repair: { label: 'Onarımda', color: 'bg-orange-100 text-orange-700' },
  ready_for_delivery: { label: 'Teslimata Hazır', color: 'bg-emerald-100 text-emerald-700' },
  invoicing: { label: 'Faturalama', color: 'bg-teal-100 text-teal-700' },
  delivery: { label: 'Teslimat', color: 'bg-cyan-100 text-cyan-700' },
};

const priorityConfig = {
  low: { label: 'Düşük', color: 'bg-gray-100 text-gray-700' },
  medium: { label: 'Orta', color: 'bg-blue-100 text-blue-700' },
  high: { label: 'Yüksek', color: 'bg-orange-100 text-orange-700' },
  urgent: { label: 'Acil', color: 'bg-red-100 text-red-700' },
};

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatCurrency(amount: number | null | undefined) {
  if (amount == null) return '-';
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
  }).format(amount);
}

export function AdminTicketList() {
  const [tickets, setTickets] = useState<TicketWithRelations[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [technicianFilter, setTechnicianFilter] = useState<string>('all');
  const [selectedTicket, setSelectedTicket] = useState<TicketWithRelations | null>(null);
  const [editingTicket, setEditingTicket] = useState<TicketWithRelations | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchTickets();
    fetchTechnicians();
  }, []);

  const fetchTickets = async () => {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select(`
          *,
          devices (*),
          technicians (*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTechnicians = async () => {
    try {
      const { data, error } = await supabase
        .from('technicians')
        .select('*')
        .eq('active', true)
        .order('name');

      if (error) throw error;
      setTechnicians(data || []);
    } catch (error) {
      console.error('Error fetching technicians:', error);
    }
  };

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      searchQuery === '' ||
      ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.customer_full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.serial_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.invoice_number?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesTechnician =
      technicianFilter === 'all' ||
      (technicianFilter === 'unassigned' && !ticket.assigned_to) ||
      ticket.assigned_to === technicianFilter;

    return matchesSearch && matchesStatus && matchesTechnician;
  });

  const handleTicketSaved = () => {
    fetchTickets();
    setEditingTicket(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Biletler, müşteriler, seri numaraları ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg font-medium transition-colors ${
            showFilters ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Filter className="w-5 h-5" />
          Filtreler
          <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </button>
        <button
          onClick={fetchTickets}
          className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className="w-5 h-5" />
          Yenile
        </button>
      </div>

      {showFilters && (
        <div className="flex flex-wrap gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="min-w-48">
            <label className="block text-sm font-medium text-gray-700 mb-1">Durum</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tüm Durumlar</option>
              {Object.entries(statusConfig).map(([value, { label }]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-48">
            <label className="block text-sm font-medium text-gray-700 mb-1">Teknisyen</label>
            <select
              value={technicianFilter}
              onChange={(e) => setTechnicianFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tüm Teknisyenler</option>
              <option value="unassigned">Atanmamış</option>
              {technicians.map((tech) => (
                <option key={tech.id} value={tech.id}>
                  {tech.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className="text-sm text-gray-500">
        {filteredTickets.length} / {tickets.length} bilet gösteriliyor
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Bilet
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Müşteri
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Durum
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Teknisyen
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Tutar
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Oluşturulma
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                    Kriterlerinize uygun bilet bulunamadı
                  </td>
                </tr>
              ) : (
                filteredTickets.map((ticket) => {
                  const status = statusConfig[ticket.status] || statusConfig.accepted_pending;
                  const priority = priorityConfig[ticket.priority as TicketPriority] || priorityConfig.medium;
                  const technician = technicians.find((t) => t.id === ticket.assigned_to);

                  return (
                    <tr key={ticket.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">{ticket.title}</p>
                            {ticket.serial_number && (
                              <p className="text-sm text-gray-500 truncate">Seri No: {ticket.serial_number}</p>
                            )}
                          </div>
                          <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${priority.color}`}>
                            <AlertCircle className="w-3 h-3 inline mr-0.5" />
                            {priority.label}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm text-gray-900">{ticket.customer_full_name || '-'}</p>
                        {ticket.customer_phone && <p className="text-sm text-gray-500">{ticket.customer_phone}</p>}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        {technician ? (
                          <div className="flex items-center gap-2">
                            <div
                              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold text-white"
                              style={{ backgroundColor: technician.avatar_color }}
                            >
                              {technician.name.charAt(0)}
                            </div>
                            <span className="text-sm text-gray-900">{technician.name}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Atanmamış</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm font-medium text-gray-900">
                          {formatCurrency(ticket.total_service_amount)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-gray-500">{formatDate(ticket.created_at)}</span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setSelectedTicket(ticket)}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Detayları Görüntüle"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingTicket(ticket)}
                            className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Bileti Düzenle"
                          >
                            <Edit3 className="w-4 h-4" />
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
          onEdit={() => {
            setEditingTicket(selectedTicket);
            setSelectedTicket(null);
          }}
          onRefresh={fetchTickets}
        />
      )}

      {editingTicket && (
        <TicketModal
          ticket={editingTicket}
          onClose={() => setEditingTicket(null)}
          onSave={handleTicketSaved}
        />
      )}
    </div>
  );
}
