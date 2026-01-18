import { useState, useEffect } from 'react';
import { Calendar, User, Search, FileText, Clock, DollarSign, Filter, X, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Technician, TicketWithRelations } from '../lib/database.types';

interface StaffActivityReportProps {
  onClose?: () => void;
}

const STATUS_LABELS: Record<string, string> = {
  accepted_pending: 'Kabul Edildi / Beklemede',
  fault_diagnosis: 'Arıza Tespiti',
  customer_approval: 'Müşteri Onayı',
  under_repair: 'Onarımda',
  ready_for_delivery: 'Teslimata Hazır',
  invoicing: 'Faturalama',
  delivery: 'Teslimat',
};

const STATUS_COLORS: Record<string, string> = {
  accepted_pending: 'bg-slate-100 text-slate-700',
  fault_diagnosis: 'bg-blue-100 text-blue-700',
  customer_approval: 'bg-amber-100 text-amber-700',
  under_repair: 'bg-orange-100 text-orange-700',
  ready_for_delivery: 'bg-emerald-100 text-emerald-700',
  invoicing: 'bg-teal-100 text-teal-700',
  delivery: 'bg-cyan-100 text-cyan-700',
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function StaffActivityReport({ onClose }: StaffActivityReportProps) {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [tickets, setTickets] = useState<TicketWithRelations[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTechnician, setSelectedTechnician] = useState<string>('all');
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null);

  useEffect(() => {
    fetchTechnicians();
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [selectedTechnician, startDate, endDate]);

  const fetchTechnicians = async () => {
    const { data } = await supabase
      .from('technicians')
      .select('*')
      .eq('active', true)
      .order('name');
    setTechnicians(data || []);
  };

  const fetchTickets = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('tickets')
        .select(`
          *,
          technicians(*),
          devices(*)
        `)
        .gte('updated_at', `${startDate}T00:00:00`)
        .lte('updated_at', `${endDate}T23:59:59`)
        .order('updated_at', { ascending: false });

      if (selectedTechnician !== 'all') {
        query = query.eq('assigned_to', selectedTechnician);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedTech = technicians.find((t) => t.id === selectedTechnician);

  const stats = {
    totalTickets: tickets.length,
    completedTickets: tickets.filter((t) => t.status === 'delivery').length,
    totalRevenue: tickets
      .filter((t) => t.status === 'delivery')
      .reduce((sum, t) => sum + (t.total_service_amount || 0), 0),
    avgTicketValue: 0,
  };
  stats.avgTicketValue = stats.completedTickets > 0 ? stats.totalRevenue / stats.completedTickets : 0;

  const statusBreakdown = tickets.reduce(
    (acc, t) => {
      acc[t.status] = (acc[t.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-teal-50 to-blue-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-100 rounded-lg">
              <FileText className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Staff Activity Report</h3>
              <p className="text-sm text-gray-500">View operations by staff member and date range</p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <div className="p-6 border-b border-gray-200 bg-gray-50">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4 inline mr-1" />
              Personel Üyesi
            </label>
            <select
              value={selectedTechnician}
              onChange={(e) => setSelectedTechnician(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white"
            >
              <option value="all">Tüm Personel Üyeleri</option>
              {technicians.map((tech) => (
                <option key={tech.id} value={tech.id}>
                  {tech.name}
                </option>
              ))}
            </select>
          </div>

          <div className="min-w-[160px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Başlangıç Tarihi
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white"
            />
          </div>

          <div className="min-w-[160px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Bitiş Tarihi
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white"
            />
          </div>

          <button
            onClick={fetchTickets}
            className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium"
          >
            <Search className="w-4 h-4" />
            Ara
          </button>
        </div>

        {selectedTech && (
          <div className="mt-4 flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
              style={{ backgroundColor: selectedTech.avatar_color }}
            >
              {selectedTech.name.charAt(0)}
            </div>
            <div>
              <p className="font-medium text-gray-900">{selectedTech.name}</p>
              <p className="text-sm text-gray-500">{selectedTech.specialty || selectedTech.email}</p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 border-b border-gray-200">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <Filter className="w-4 h-4" />
            Toplam Bilet
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.totalTickets}</p>
        </div>
        <div className="bg-emerald-50 rounded-lg p-4">
          <div className="flex items-center gap-2 text-emerald-600 text-sm mb-1">
            <FileText className="w-4 h-4" />
            Tamamlandı
          </div>
          <p className="text-2xl font-bold text-emerald-700">{stats.completedTickets}</p>
        </div>
        <div className="bg-teal-50 rounded-lg p-4">
          <div className="flex items-center gap-2 text-teal-600 text-sm mb-1">
            <DollarSign className="w-4 h-4" />
            Toplam Gelir
          </div>
          <p className="text-2xl font-bold text-teal-700">{formatCurrency(stats.totalRevenue)}</p>
        </div>
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center gap-2 text-blue-600 text-sm mb-1">
            <DollarSign className="w-4 h-4" />
            Ort. Bilet
          </div>
          <p className="text-2xl font-bold text-blue-700">{formatCurrency(stats.avgTicketValue)}</p>
        </div>
      </div>

      {Object.keys(statusBreakdown).length > 0 && (
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <p className="text-sm font-medium text-gray-700 mb-3">Durum Dağılımı</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(statusBreakdown)
              .sort((a, b) => b[1] - a[1])
              .map(([status, count]) => (
                <span
                  key={status}
                  className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[status] || 'bg-gray-100 text-gray-700'}`}
                >
                  {STATUS_LABELS[status] || status}: {count}
                </span>
              ))}
          </div>
        </div>
      )}

      <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Seçilen kriterlere uygun bilet bulunamadı</p>
          </div>
        ) : (
          tickets.map((ticket) => (
            <div key={ticket.id} className="hover:bg-gray-50 transition-colors">
              <div
                className="px-6 py-4 cursor-pointer"
                onClick={() => setExpandedTicket(expandedTicket === ticket.id ? null : ticket.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[ticket.status] || 'bg-gray-100 text-gray-700'}`}
                      >
                        {STATUS_LABELS[ticket.status] || ticket.status}
                      </span>
                      {ticket.custom_code && (
                        <span className="text-sm font-mono text-gray-500">#{ticket.custom_code}</span>
                      )}
                    </div>
                    <h4 className="font-medium text-gray-900 mb-1">{ticket.title}</h4>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      {ticket.customer_full_name && <span>{ticket.customer_full_name}</span>}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {formatDate(ticket.updated_at)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {ticket.total_service_amount != null && ticket.total_service_amount > 0 && (
                      <span className="text-lg font-semibold text-gray-900">
                        {formatCurrency(ticket.total_service_amount)}
                      </span>
                    )}
                    <button className="text-gray-400 hover:text-gray-600 transition-colors">
                      {expandedTicket === ticket.id ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {selectedTechnician === 'all' && ticket.technicians && (
                  <div className="mt-3 flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold text-white"
                      style={{ backgroundColor: ticket.technicians.avatar_color }}
                    >
                      {ticket.technicians.name.charAt(0)}
                    </div>
                    <span className="text-sm text-gray-600">{ticket.technicians.name}</span>
                  </div>
                )}
              </div>

              {expandedTicket === ticket.id && (
                <div className="px-6 pb-4">
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    {ticket.description && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">Açıklama</p>
                        <p className="text-sm text-gray-700">{ticket.description}</p>
                      </div>
                    )}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      {ticket.brand && (
                        <div>
                          <p className="text-xs font-medium text-gray-500">Marka</p>
                          <p className="text-gray-900">{ticket.brand}</p>
                        </div>
                      )}
                      {ticket.model && (
                        <div>
                          <p className="text-xs font-medium text-gray-500">Model</p>
                          <p className="text-gray-900">{ticket.model}</p>
                        </div>
                      )}
                      {ticket.serial_number && (
                        <div>
                          <p className="text-xs font-medium text-gray-500">Seri Numarası</p>
                          <p className="text-gray-900 font-mono">{ticket.serial_number}</p>
                        </div>
                      )}
                      {ticket.warranty_status && (
                        <div>
                          <p className="text-xs font-medium text-gray-500">Garanti</p>
                          <p className="text-gray-900">
                            {ticket.warranty_status === 'in_warranty'
                              ? 'Garanti Kapsamında'
                              : ticket.warranty_status === 'out_of_warranty'
                                ? 'Garanti Dışı'
                                : 'Bilinmiyor'}
                          </p>
                        </div>
                      )}
                    </div>
                    {(ticket.approved_labor_cost || ticket.approved_service_cost) && (
                      <div className="pt-3 border-t border-gray-200">
                        <p className="text-xs font-medium text-gray-500 mb-2">Maliyet Dağılımı</p>
                        <div className="flex gap-4 text-sm">
                          {ticket.approved_labor_cost != null && (
                            <span>
                              İşçilik: <strong>{formatCurrency(ticket.approved_labor_cost)}</strong>
                            </span>
                          )}
                          {ticket.approved_service_cost != null && (
                            <span>
                              Servis: <strong>{formatCurrency(ticket.approved_service_cost)}</strong>
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    <div className="pt-3 border-t border-gray-200 text-xs text-gray-500">
                      <span>Oluşturuldu: {formatDate(ticket.created_at)}</span>
                      <span className="mx-2">|</span>
                      <span>Son Güncelleme: {formatDate(ticket.updated_at)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {tickets.length > 0 && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 text-sm text-gray-500">
          {startDate} - {endDate} tarihleri arasında {tickets.length} bilet gösteriliyor
        </div>
      )}
    </div>
  );
}
