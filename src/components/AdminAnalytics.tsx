import { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  Users,
  Ticket,
  RefreshCw,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Technician } from '../lib/database.types';

interface TicketData {
  id: string;
  status: string;
  total_service_amount: number | null;
  assigned_to: string | null;
  created_at: string;
}

interface TechnicianRevenue {
  technician: Technician;
  totalRevenue: number;
  ticketCount: number;
  avgTicketValue: number;
}

type DateRange = '7d' | '30d' | '90d' | '12m' | 'all';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatCurrencyDetailed(amount: number) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function getDateRangeFilter(range: DateRange): Date | null {
  const now = new Date();
  switch (range) {
    case '7d':
      return new Date(now.setDate(now.getDate() - 7));
    case '30d':
      return new Date(now.setDate(now.getDate() - 30));
    case '90d':
      return new Date(now.setDate(now.getDate() - 90));
    case '12m':
      return new Date(now.setFullYear(now.getFullYear() - 1));
    case 'all':
      return null;
  }
}

const completedStatuses = ['delivery'];

export function AdminAnalytics() {
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>('30d');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ticketsResult, techniciansResult] = await Promise.all([
        supabase
          .from('tickets')
          .select('id, status, total_service_amount, assigned_to, created_at')
          .order('created_at', { ascending: false }),
        supabase.from('technicians').select('*').order('name'),
      ]);

      if (ticketsResult.error) throw ticketsResult.error;
      if (techniciansResult.error) throw techniciansResult.error;

      setTickets(ticketsResult.data || []);
      setTechnicians(techniciansResult.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const dateFilter = getDateRangeFilter(dateRange);
  const filteredTickets = dateFilter
    ? tickets.filter((t) => new Date(t.created_at) >= dateFilter)
    : tickets;

  const completedTickets = filteredTickets.filter((t) => completedStatuses.includes(t.status));

  const totalRevenue = completedTickets.reduce((sum, t) => sum + (t.total_service_amount || 0), 0);

  const totalTickets = filteredTickets.length;
  const completedCount = completedTickets.length;
  const avgTicketValue = completedCount > 0 ? totalRevenue / completedCount : 0;

  const technicianRevenues: TechnicianRevenue[] = technicians
    .map((tech) => {
      const techTickets = completedTickets.filter((t) => t.assigned_to === tech.id);
      const techRevenue = techTickets.reduce((sum, t) => sum + (t.total_service_amount || 0), 0);
      return {
        technician: tech,
        totalRevenue: techRevenue,
        ticketCount: techTickets.length,
        avgTicketValue: techTickets.length > 0 ? techRevenue / techTickets.length : 0,
      };
    })
    .filter((tr) => tr.ticketCount > 0)
    .sort((a, b) => b.totalRevenue - a.totalRevenue);

  const unassignedRevenue = completedTickets
    .filter((t) => !t.assigned_to)
    .reduce((sum, t) => sum + (t.total_service_amount || 0), 0);

  const previousDateFilter = dateFilter
    ? new Date(dateFilter.getTime() - (Date.now() - dateFilter.getTime()))
    : null;

  const previousTickets = previousDateFilter
    ? tickets.filter(
        (t) => new Date(t.created_at) >= previousDateFilter && new Date(t.created_at) < dateFilter!
      )
    : [];

  const previousCompletedTickets = previousTickets.filter((t) => completedStatuses.includes(t.status));
  const previousRevenue = previousCompletedTickets.reduce(
    (sum, t) => sum + (t.total_service_amount || 0),
    0
  );

  const revenueChange =
    previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-gray-500" />
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as DateRange)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
          >
            <option value="7d">Son 7 Gün</option>
            <option value="30d">Son 30 Gün</option>
            <option value="90d">Son 90 Gün</option>
            <option value="12m">Son 12 Ay</option>
            <option value="all">Tüm Zamanlar</option>
          </select>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Yenile
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-emerald-100 rounded-xl">
              <DollarSign className="w-6 h-6 text-emerald-600" />
            </div>
            {revenueChange !== null && (
              <div
                className={`flex items-center gap-1 text-sm font-medium ${
                  revenueChange >= 0 ? 'text-emerald-600' : 'text-red-600'
                }`}
              >
                {revenueChange >= 0 ? (
                  <ArrowUpRight className="w-4 h-4" />
                ) : (
                  <ArrowDownRight className="w-4 h-4" />
                )}
                {Math.abs(revenueChange).toFixed(1)}%
              </div>
            )}
          </div>
          <p className="text-sm text-gray-500 mb-1">Toplam Gelir</p>
          <p className="text-3xl font-bold text-gray-900">{formatCurrency(totalRevenue)}</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Ticket className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mb-1">Toplam Bilet</p>
          <p className="text-3xl font-bold text-gray-900">{totalTickets}</p>
          <p className="text-sm text-gray-500 mt-2">{completedCount} tamamlandı</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-amber-100 rounded-xl">
              <TrendingUp className="w-6 h-6 text-amber-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mb-1">Ort. Bilet Değeri</p>
          <p className="text-3xl font-bold text-gray-900">{formatCurrencyDetailed(avgTicketValue)}</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-teal-100 rounded-xl">
              <Users className="w-6 h-6 text-teal-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mb-1">Aktif Teknisyenler</p>
          <p className="text-3xl font-bold text-gray-900">
            {technicians.filter((t) => t.active).length}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            {technicianRevenues.length} gelirli
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900">Personel Bazında Gelir</h3>
          <p className="text-sm text-gray-500">Tamamlanan biletlere göre (Faturalama + Teslimat durumu)</p>
        </div>

        <div className="divide-y divide-gray-100">
          {technicianRevenues.length === 0 && unassignedRevenue === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">
              Seçilen dönem için gelir verisi bulunmuyor
            </div>
          ) : (
            <>
              {technicianRevenues.map((tr, index) => {
                const revenuePercentage = totalRevenue > 0 ? (tr.totalRevenue / totalRevenue) * 100 : 0;

                return (
                  <div key={tr.technician.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full text-sm font-semibold text-gray-600">
                        {index + 1}
                      </div>
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold text-white"
                        style={{ backgroundColor: tr.technician.avatar_color }}
                      >
                        {tr.technician.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium text-gray-900">{tr.technician.name}</p>
                          <p className="text-lg font-bold text-gray-900">
                            {formatCurrencyDetailed(tr.totalRevenue)}
                          </p>
                        </div>
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <span>
                            {tr.ticketCount} bilet - Ort: {formatCurrencyDetailed(tr.avgTicketValue)}
                          </span>
                          <span>{revenuePercentage.toFixed(1)}% toplam</span>
                        </div>
                        <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${revenuePercentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {unassignedRevenue > 0 && (
                <div className="px-6 py-4 hover:bg-gray-50 transition-colors bg-gray-50">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-8 h-8 bg-gray-200 rounded-full text-sm font-semibold text-gray-500">
                      -
                    </div>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold text-gray-500 bg-gray-300">
                      ?
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-gray-600">Atanmamış</p>
                        <p className="text-lg font-bold text-gray-600">
                          {formatCurrencyDetailed(unassignedRevenue)}
                        </p>
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>Teknisyen atanmamış biletler</span>
                        <span>
                          {totalRevenue > 0 ? ((unassignedRevenue / totalRevenue) * 100).toFixed(1) : 0}%
                          toplam
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900">Duruma Göre Biletler</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {[
                { status: 'accepted_pending', label: 'Kabul Edildi / Beklemede', color: 'bg-slate-500' },
                { status: 'fault_diagnosis', label: 'Arıza Tespiti', color: 'bg-blue-500' },
                { status: 'customer_approval', label: 'Müşteri Onayı', color: 'bg-amber-500' },
                { status: 'under_repair', label: 'Onarımda', color: 'bg-orange-500' },
                { status: 'ready_for_delivery', label: 'Teslimata Hazır', color: 'bg-emerald-500' },
                { status: 'invoicing', label: 'Faturalama', color: 'bg-teal-500' },
                { status: 'delivery', label: 'Teslimat', color: 'bg-cyan-500' },
              ].map(({ status, label, color }) => {
                const count = filteredTickets.filter((t) => t.status === status).length;
                const percentage = totalTickets > 0 ? (count / totalTickets) * 100 : 0;

                return (
                  <div key={status} className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${color}`} />
                    <span className="text-sm text-gray-600 flex-1">{label}</span>
                    <span className="text-sm font-medium text-gray-900">{count}</span>
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className={`${color} h-2 rounded-full transition-all duration-300`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900">En İyi Performanslar</h3>
            <p className="text-sm text-gray-500">Tamamlanan bilet sayısına göre</p>
          </div>
          <div className="p-6">
            {technicianRevenues.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Veri bulunmuyor</p>
            ) : (
              <div className="space-y-4">
                {[...technicianRevenues]
                  .sort((a, b) => b.ticketCount - a.ticketCount)
                  .slice(0, 5)
                  .map((tr, index) => (
                    <div key={tr.technician.id} className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                          index === 0
                            ? 'bg-amber-500'
                            : index === 1
                            ? 'bg-gray-400'
                            : index === 2
                            ? 'bg-amber-700'
                            : 'bg-gray-300'
                        }`}
                      >
                        {index + 1}
                      </div>
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white"
                        style={{ backgroundColor: tr.technician.avatar_color }}
                      >
                        {tr.technician.name.charAt(0)}
                      </div>
                      <span className="flex-1 text-sm font-medium text-gray-900">{tr.technician.name}</span>
                      <span className="text-sm font-bold text-gray-900">{tr.ticketCount} bilet</span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
