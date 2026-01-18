import { useEffect, useState, useCallback } from 'react';
import { DollarSign, Wrench, Clock, TrendingUp, ArrowUp, ArrowDown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { TicketWithRelations } from '../lib/database.types';
import { MotivationalMessage } from './MotivationalMessage';

interface StaffAnalyticsProps {
  staffId: string;
  refreshTrigger?: number;
}

// We now track won tickets instead of just delivery status
// A ticket is considered completed when it's been marked as won

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDuration(ms: number): string {
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) {
    return `${days} gün ${hours} saat`;
  } else if (hours > 0) {
    return `${hours} saat ${minutes} dakika`;
  } else {
    return `${minutes} dakika`;
  }
}

function getMonthRange(monthOffset: number = 0) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() - monthOffset;
  
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0, 23, 59, 59);
  
  return { startDate, endDate };
}

function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

export function StaffAnalytics({ staffId, refreshTrigger }: StaffAnalyticsProps) {
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState({ revenue: 0, machines: 0, avgTime: 0 });
  const [previousMonth, setPreviousMonth] = useState({ revenue: 0, machines: 0, avgTime: 0 });
  const [showMotivationalMessage, setShowMotivationalMessage] = useState(false);
  const [messageType, setMessageType] = useState<'improvement' | 'achievement' | 'milestone'>('improvement');

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      
      console.log('🔍 Fetching analytics for staffId:', staffId);
      
      // Get current month range (monthOffset = 0)
      const currentRange = getMonthRange(0);
      // Get previous month range (monthOffset = 1)
      const previousRange = getMonthRange(1);
      
      console.log('📅 Date ranges:', {
        currentStart: currentRange.startDate.toISOString(),
        currentEnd: currentRange.endDate.toISOString(),
        previousStart: previousRange.startDate.toISOString(),
        previousEnd: previousRange.endDate.toISOString()
      });

      // First, let's check if there are ANY won tickets for this staff member (without date filter)
      const { data: allWonTickets, error: allWonError } = await supabase
        .from('tickets')
        .select('*')
        .eq('assigned_to', staffId)
        .eq('won', true);
      
      console.log('🎫 All won tickets for staff (no date filter):', {
        count: allWonTickets?.length || 0,
        tickets: allWonTickets?.map(t => ({
          id: t.id,
          title: t.title,
          won_at: t.won_at,
          assigned_to: t.assigned_to,
          total_service_amount: t.total_service_amount,
          created_at: t.created_at
        }))
      });
      
      // Also check tickets without assigned_to filter to see if assignment is the issue
      const { data: allWonTicketsNoAssignment, error: allWonNoAssignmentError } = await supabase
        .from('tickets')
        .select('*')
        .eq('won', true);
      
      console.log('🎫 All won tickets (any staff, no assignment filter):', {
        count: allWonTicketsNoAssignment?.length || 0,
        tickets: allWonTicketsNoAssignment?.map(t => ({
          id: t.id,
          title: t.title,
          won_at: t.won_at,
          assigned_to: t.assigned_to,
          staffId: staffId,
          matches: t.assigned_to === staffId
        }))
      });

      // Fetch current month data - only tickets that were won (dragged into Won section)
      // Filter by assigned_to, won=true, and won_at date range (won_at must not be null)
      const { data: currentData, error: currentError } = await supabase
        .from('tickets')
        .select('*')
        .eq('assigned_to', staffId)
        .eq('won', true)
        .not('won_at', 'is', null) // Ensure won_at is not null
        .gte('won_at', currentRange.startDate.toISOString())
        .lte('won_at', currentRange.endDate.toISOString());

      if (currentError) {
        console.error('❌ Error fetching current month analytics:', currentError);
        throw currentError;
      }
      
      console.log('📊 Current month query result:', {
        count: currentData?.length || 0,
        data: currentData
      });

      // Fetch previous month data - only tickets that were won
      // Filter by assigned_to, won=true, and won_at date range (won_at must not be null)
      const { data: previousData, error: previousError } = await supabase
        .from('tickets')
        .select('*')
        .eq('assigned_to', staffId)
        .eq('won', true)
        .not('won_at', 'is', null) // Ensure won_at is not null
        .gte('won_at', previousRange.startDate.toISOString())
        .lte('won_at', previousRange.endDate.toISOString());

      if (previousError) {
        console.error('❌ Error fetching previous month analytics:', previousError);
        throw previousError;
      }
      
      console.log('📊 Previous month query result:', {
        count: previousData?.length || 0,
        data: previousData
      });

      const currentTickets = (currentData || []).filter(ticket => {
        // Additional validation: ensure ticket has won_at and assigned_to matches
        return ticket.won === true && 
               ticket.assigned_to === staffId && 
               ticket.won_at != null;
      });
      
      const previousTickets = (previousData || []).filter(ticket => {
        // Additional validation: ensure ticket has won_at and assigned_to matches
        return ticket.won === true && 
               ticket.assigned_to === staffId && 
               ticket.won_at != null;
      });

      // Calculate current month metrics
      const currentRevenue = currentTickets.reduce(
        (sum, ticket) => sum + (ticket.total_service_amount || 0),
        0
      );
      const currentMachines = currentTickets.length;
      const currentAvgTime =
        currentMachines > 0
          ? currentTickets.reduce((sum, ticket) => {
              const created = new Date(ticket.created_at).getTime();
              // Since we filtered for won_at not null, we can safely use it
              const won = new Date(ticket.won_at!).getTime();
              return sum + (won - created);
            }, 0) / currentMachines
          : 0;

      // Calculate previous month metrics
      const previousRevenue = previousTickets.reduce(
        (sum, ticket) => sum + (ticket.total_service_amount || 0),
        0
      );
      const previousMachines = previousTickets.length;
      const previousAvgTime =
        previousMachines > 0
          ? previousTickets.reduce((sum, ticket) => {
              const created = new Date(ticket.created_at).getTime();
              // Since we filtered for won_at not null, we can safely use it
              const won = new Date(ticket.won_at!).getTime();
              return sum + (won - created);
            }, 0) / previousMachines
          : 0;
      
      console.log('✅ Staff analytics calculated:', {
        staffId,
        currentMonth: {
          revenue: currentRevenue,
          machines: currentMachines,
          tickets: currentTickets.length,
          ticketIds: currentTickets.map(t => t.id)
        },
        previousMonth: {
          revenue: previousRevenue,
          machines: previousMachines,
          tickets: previousTickets.length,
          ticketIds: previousTickets.map(t => t.id)
        }
      });

      setCurrentMonth({
        revenue: currentRevenue,
        machines: currentMachines,
        avgTime: currentAvgTime,
      });
      setPreviousMonth({
        revenue: previousRevenue,
        machines: previousMachines,
        avgTime: previousAvgTime,
      });

      // Determine if we should show a motivational message
      const hasImprovement = 
        currentRevenue > previousRevenue || 
        currentMachines > previousMachines || 
        (previousAvgTime > 0 && currentAvgTime < previousAvgTime);
      
      if (hasImprovement) {
        // Determine message type based on improvement level
        const revenueChange = calculatePercentageChange(currentRevenue, previousRevenue);
        const machinesChange = calculatePercentageChange(currentMachines, previousMachines);
        
        if (revenueChange >= 50 || machinesChange >= 50) {
          setMessageType('milestone');
        } else if (revenueChange >= 20 || machinesChange >= 20) {
          setMessageType('achievement');
        } else {
          setMessageType('improvement');
        }
        
        setShowMotivationalMessage(true);
      }
    } catch (error) {
      console.error('Error fetching staff analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [staffId]);

  useEffect(() => {
    console.log('🔄 StaffAnalytics useEffect triggered:', { staffId, refreshTrigger });
    fetchAnalytics();
  }, [staffId, refreshTrigger, fetchAnalytics]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  const revenueChange = calculatePercentageChange(currentMonth.revenue, previousMonth.revenue);
  const machinesChange = calculatePercentageChange(currentMonth.machines, previousMonth.machines);
  const timeChange = previousMonth.avgTime > 0
    ? calculatePercentageChange(previousMonth.avgTime - currentMonth.avgTime, previousMonth.avgTime)
    : 0; // For time, negative change is good (faster repairs)

  const isRevenueUp = revenueChange > 0;
  const isMachinesUp = machinesChange > 0;
  const isTimeFaster = currentMonth.avgTime < previousMonth.avgTime;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-lg">
          <TrendingUp className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Performans İstatistikleri</h3>
          <p className="text-sm text-gray-500">Geçen aya göre karşılaştırma</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Revenue Card */}
        <div className={`bg-gradient-to-br ${isRevenueUp ? 'from-green-50 to-emerald-50' : 'from-gray-50 to-slate-50'} rounded-lg p-4 border ${isRevenueUp ? 'border-green-200' : 'border-gray-200'} transition-all duration-500 hover:shadow-lg`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className={`p-2 ${isRevenueUp ? 'bg-green-100' : 'bg-gray-100'} rounded-lg animate-pulse`}>
                <DollarSign className={`w-5 h-5 ${isRevenueUp ? 'text-green-600' : 'text-gray-600'}`} />
              </div>
              <div>
                <p className={`text-sm font-medium ${isRevenueUp ? 'text-green-700' : 'text-gray-700'}`}>Toplam Gelir</p>
              </div>
            </div>
            {previousMonth.revenue > 0 && (
              <div className={`flex items-center gap-1 ${isRevenueUp ? 'text-green-600' : revenueChange < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                {isRevenueUp ? <ArrowUp className="w-4 h-4 animate-bounce" /> : revenueChange < 0 ? <ArrowDown className="w-4 h-4" /> : null}
                <span className="text-xs font-semibold">{Math.abs(revenueChange)}%</span>
              </div>
            )}
          </div>
          <p className={`text-2xl font-bold ${isRevenueUp ? 'text-green-900' : 'text-gray-900'} mb-1`}>
            {formatCurrency(currentMonth.revenue)}
          </p>
          <p className="text-xs text-gray-500">
            Geçen ay: {formatCurrency(previousMonth.revenue)}
          </p>
        </div>

        {/* Machines Repaired Card */}
        <div className={`bg-gradient-to-br ${isMachinesUp ? 'from-blue-50 to-cyan-50' : 'from-gray-50 to-slate-50'} rounded-lg p-4 border ${isMachinesUp ? 'border-blue-200' : 'border-gray-200'} transition-all duration-500 hover:shadow-lg`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className={`p-2 ${isMachinesUp ? 'bg-blue-100' : 'bg-gray-100'} rounded-lg animate-pulse`}>
                <Wrench className={`w-5 h-5 ${isMachinesUp ? 'text-blue-600' : 'text-gray-600'}`} />
              </div>
              <div>
                <p className={`text-sm font-medium ${isMachinesUp ? 'text-blue-700' : 'text-gray-700'}`}>Onarılan Makine</p>
              </div>
            </div>
            {previousMonth.machines > 0 && (
              <div className={`flex items-center gap-1 ${isMachinesUp ? 'text-blue-600' : machinesChange < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                {isMachinesUp ? <ArrowUp className="w-4 h-4 animate-bounce" /> : machinesChange < 0 ? <ArrowDown className="w-4 h-4" /> : null}
                <span className="text-xs font-semibold">{Math.abs(machinesChange)}%</span>
              </div>
            )}
          </div>
          <p className={`text-2xl font-bold ${isMachinesUp ? 'text-blue-900' : 'text-gray-900'} mb-1`}>
            {currentMonth.machines}
          </p>
          <p className="text-xs text-gray-500">
            Geçen ay: {previousMonth.machines}
          </p>
        </div>

        {/* Average Repair Time Card */}
        <div className={`bg-gradient-to-br ${isTimeFaster ? 'from-purple-50 to-pink-50' : 'from-gray-50 to-slate-50'} rounded-lg p-4 border ${isTimeFaster ? 'border-purple-200' : 'border-gray-200'} transition-all duration-500 hover:shadow-lg`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className={`p-2 ${isTimeFaster ? 'bg-purple-100' : 'bg-gray-100'} rounded-lg animate-pulse`}>
                <Clock className={`w-5 h-5 ${isTimeFaster ? 'text-purple-600' : 'text-gray-600'}`} />
              </div>
              <div>
                <p className={`text-sm font-medium ${isTimeFaster ? 'text-purple-700' : 'text-gray-700'}`}>Ortalama Onarım Süresi</p>
              </div>
            </div>
            {previousMonth.avgTime > 0 && (
              <div className={`flex items-center gap-1 ${isTimeFaster ? 'text-purple-600' : 'text-red-600'}`}>
                {isTimeFaster ? (
                  <>
                    <ArrowDown className="w-4 h-4 animate-bounce" />
                    <span className="text-xs font-semibold">{Math.abs(timeChange)}%</span>
                  </>
                ) : (
                  <>
                    <ArrowUp className="w-4 h-4" />
                    <span className="text-xs font-semibold">{Math.abs(timeChange)}%</span>
                  </>
                )}
              </div>
            )}
          </div>
          <p className={`text-2xl font-bold ${isTimeFaster ? 'text-purple-900' : 'text-gray-900'} mb-1`}>
            {currentMonth.avgTime > 0 ? formatDuration(currentMonth.avgTime) : '-'}
          </p>
          <p className="text-xs text-gray-500">
            Geçen ay: {previousMonth.avgTime > 0 ? formatDuration(previousMonth.avgTime) : '-'}
          </p>
        </div>
      </div>

      {/* Motivational Message */}
      {(isRevenueUp || isMachinesUp || isTimeFaster) && (
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-full">
              <TrendingUp className="w-5 h-5 text-blue-600 animate-pulse" />
            </div>
            <div>
              <p className="text-sm font-semibold text-blue-900">
                Harika iş çıkarıyorsunuz! 🎉
              </p>
              <p className="text-xs text-blue-700 mt-1">
                Performansınız geçen aya göre iyileşiyor. Bu tempo ile devam edin!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Floating Motivational Message */}
      {showMotivationalMessage && (
        <MotivationalMessage
          type={messageType}
          autoClose={true}
          duration={5000}
          onClose={() => setShowMotivationalMessage(false)}
        />
      )}
    </div>
  );
}
