import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { TicketWithRelations } from '../lib/database.types';
import { KanbanColumn } from './KanbanColumn';
import { X, Receipt, ClipboardCheck } from 'lucide-react';
import { DeliveryCelebration } from './DeliveryCelebration';
import { MoneyAnimation } from './MoneyAnimation';

interface KanbanBoardProps {
  onEditTicket: (ticket: TicketWithRelations) => void;
  refreshTrigger: number;
  onTicketUpdate?: () => void;
  staffId?: string;
}

interface PendingMove {
  ticketId: string;
  newStatus: string;
  prompt: string;
}

interface PendingInvoice {
  ticketId: string;
  invoiceNumber: string;
  totalServiceAmount: string;
}

interface PendingApproval {
  ticketId: string;
  approvedLaborCost: string;
  approvedServiceCost: string;
}

const columns = [
  { title: 'Kabul Edildi / Beklemede', status: 'accepted_pending', color: 'border-slate-400' },
  { title: 'Arıza Tespiti', status: 'fault_diagnosis', color: 'border-blue-400' },
  { title: 'Müşteri Onayı', status: 'customer_approval', color: 'border-amber-400' },
  { title: 'Onarımda', status: 'under_repair', color: 'border-orange-400' },
  { title: 'Teslimata Hazır', status: 'ready_for_delivery', color: 'border-emerald-400' },
  { title: 'Faturalama', status: 'invoicing', color: 'border-teal-400' },
  { title: 'Teslimat', status: 'delivery', color: 'border-cyan-400' },
  { title: 'Kazanıldı', status: 'won', color: 'border-yellow-400' },
];

const statusOrder = columns.reduce((acc, col, idx) => {
  acc[col.status] = idx;
  return acc;
}, {} as Record<string, number>);

const statusPrompts: Record<string, string> = {
  fault_diagnosis: 'Arıza tespiti nedir?',
};

export function KanbanBoard({ onEditTicket, refreshTrigger, onTicketUpdate, staffId }: KanbanBoardProps) {
  const [tickets, setTickets] = useState<TicketWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingMove, setPendingMove] = useState<PendingMove | null>(null);
  const [pendingInvoice, setPendingInvoice] = useState<PendingInvoice | null>(null);
  const [pendingApproval, setPendingApproval] = useState<PendingApproval | null>(null);
  const [noteContent, setNoteContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showDeliveryCelebration, setShowDeliveryCelebration] = useState(false);
  const [deliveredTicketTitle, setDeliveredTicketTitle] = useState<string>('');
  const [showMoneyAnimation, setShowMoneyAnimation] = useState(false);
  const [wonAmount, setWonAmount] = useState(0);

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
      setTickets(data as TicketWithRelations[]);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [refreshTrigger]);

  const handleDragStart = (e: React.DragEvent, ticketId: string) => {
    e.dataTransfer.setData('ticketId', ticketId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = async (ticketId: string, newStatus: string) => {
    const ticket = tickets.find((t) => t.id === ticketId);
    if (!ticket) return;

    // Handle Won column specially - mark ticket as won without changing status
    if (newStatus === 'won') {
      // Only allow moving to won from delivery status
      if (ticket.status !== 'delivery' || ticket.won) return;
      
      // Validate that staffId exists - this is required to track who won the ticket
      if (!staffId) {
        console.warn('Cannot mark ticket as won: staffId is missing');
        return;
      }
      
      // Show money animation
      const amount = ticket.total_service_amount || 0;
      setWonAmount(amount);
      setShowMoneyAnimation(true);

      // Mark ticket as won in the database
      try {
        const updateData: { won: boolean; won_at: string; updated_at: string; assigned_to: string } = {
          won: true,
          won_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          assigned_to: staffId // Always set assigned_to to current staff when marking as won
        };
        
        const { data, error } = await supabase
          .from('tickets')
          .update(updateData)
          .eq('id', ticketId)
          .select();

        if (error) {
          throw error;
        }

        // Verify the update was successful
        if (!data || data.length === 0) {
          throw new Error('Failed to update ticket: no data returned');
        }

        const updatedTicket = data[0];
        if (!updatedTicket.won || updatedTicket.assigned_to !== staffId) {
          throw new Error('Failed to update ticket: verification failed');
        }

        console.log('✅ Ticket marked as won successfully:', {
          ticketId,
          staffId,
          won_at: updatedTicket.won_at,
          assigned_to: updatedTicket.assigned_to,
          total_service_amount: updatedTicket.total_service_amount,
          won: updatedTicket.won
        });

        // Refresh tickets list to get updated data
        await fetchTickets();
        
        // Add a small delay to ensure database consistency before refreshing analytics
        // This helps avoid race conditions where analytics queries might not see the updated data yet
        console.log('⏳ Waiting 500ms before refreshing analytics...');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Notify parent component to refresh analytics
        console.log('🔄 Calling onTicketUpdate callback...');
        if (onTicketUpdate) {
          onTicketUpdate();
        } else {
          console.warn('⚠️ onTicketUpdate callback is not defined!');
        }
      } catch (error) {
        console.error('Error marking ticket as won:', error);
        // Optionally show an error message to the user
        alert('Bilet kazanıldı olarak işaretlenirken bir hata oluştu. Lütfen tekrar deneyin.');
      }
      return;
    }

    // Normal status transitions
    if (ticket.status === newStatus) return;

    const currentIndex = statusOrder[ticket.status] ?? 0;
    const newIndex = statusOrder[newStatus] ?? 0;
    // Only allow moving forward by exactly one step
    if (newIndex !== currentIndex + 1) return;

    if (newStatus === 'customer_approval') {
      setPendingApproval({
        ticketId,
        approvedLaborCost: '',
        approvedServiceCost: '',
      });
      return;
    }

    if (newStatus === 'invoicing') {
      setPendingInvoice({
        ticketId,
        invoiceNumber: '',
        totalServiceAmount: '',
      });
      return;
    }

    if (statusPrompts[newStatus]) {
      setPendingMove({
        ticketId,
        newStatus,
        prompt: statusPrompts[newStatus],
      });
      return;
    }

    await executeMove(ticketId, newStatus);
  };

  const executeMove = async (ticketId: string, newStatus: string, note?: string) => {
    const ticket = tickets.find((t) => t.id === ticketId);
    if (!ticket) return;

    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, status: newStatus } : t))
    );

    try {
      const { error } = await supabase
        .from('tickets')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', ticketId);

      if (error) throw error;

      if (note) {
        const { error: noteError } = await supabase
          .from('ticket_notes')
          .insert({
            ticket_id: ticketId,
            content: note,
            created_by: 'Staff',
          });

        if (noteError) throw noteError;
      }

      // Show celebration when ticket reaches delivery stage
      if (newStatus === 'delivery') {
        setDeliveredTicketTitle(ticket.title);
        setShowDeliveryCelebration(true);
      }
    } catch (error) {
      console.error('Error updating ticket:', error);
      setTickets((prev) =>
        prev.map((t) => (t.id === ticketId ? { ...t, status: ticket.status } : t))
      );
    }
  };

  const executeInvoiceMove = async () => {
    if (!pendingInvoice) return;

    const { ticketId, invoiceNumber, totalServiceAmount } = pendingInvoice;
    const ticket = tickets.find((t) => t.id === ticketId);
    if (!ticket) return;

    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? {
              ...t,
              status: 'invoicing',
              invoice_number: invoiceNumber,
              total_service_amount: parseFloat(totalServiceAmount),
            }
          : t
      )
    );

    try {
      const { error } = await supabase
        .from('tickets')
        .update({
          status: 'invoicing',
          invoice_number: invoiceNumber,
          total_service_amount: parseFloat(totalServiceAmount),
          updated_at: new Date().toISOString(),
        })
        .eq('id', ticketId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating ticket:', error);
      setTickets((prev) =>
        prev.map((t) => (t.id === ticketId ? { ...t, status: ticket.status } : t))
      );
    }
  };

  const executeApprovalMove = async () => {
    if (!pendingApproval) return;

    const { ticketId, approvedLaborCost, approvedServiceCost } = pendingApproval;
    const ticket = tickets.find((t) => t.id === ticketId);
    if (!ticket) return;

    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? {
              ...t,
              status: 'customer_approval',
              approved_labor_cost: parseFloat(approvedLaborCost),
              approved_service_cost: parseFloat(approvedServiceCost),
            }
          : t
      )
    );

    try {
      const { error } = await supabase
        .from('tickets')
        .update({
          status: 'customer_approval',
          approved_labor_cost: parseFloat(approvedLaborCost),
          approved_service_cost: parseFloat(approvedServiceCost),
          updated_at: new Date().toISOString(),
        })
        .eq('id', ticketId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating ticket:', error);
      setTickets((prev) =>
        prev.map((t) => (t.id === ticketId ? { ...t, status: ticket.status } : t))
      );
    }
  };

  const handleNoteSubmit = async () => {
    if (!pendingMove || !noteContent.trim()) return;

    setSubmitting(true);
    await executeMove(pendingMove.ticketId, pendingMove.newStatus, noteContent.trim());
    setSubmitting(false);
    setPendingMove(null);
    setNoteContent('');
  };

  const handleNoteCancel = () => {
    setPendingMove(null);
    setNoteContent('');
  };

  const handleInvoiceSubmit = async () => {
    if (
      !pendingInvoice ||
      !pendingInvoice.invoiceNumber.trim() ||
      !pendingInvoice.totalServiceAmount.trim()
    )
      return;

    setSubmitting(true);
    await executeInvoiceMove();
    setSubmitting(false);
    setPendingInvoice(null);
  };

  const handleInvoiceCancel = () => {
    setPendingInvoice(null);
  };

  const handleApprovalSubmit = async () => {
    if (
      !pendingApproval ||
      !pendingApproval.approvedLaborCost.trim() ||
      !pendingApproval.approvedServiceCost.trim()
    )
      return;

    setSubmitting(true);
    await executeApprovalMove();
    setSubmitting(false);
    setPendingApproval(null);
  };

  const handleApprovalCancel = () => {
    setPendingApproval(null);
  };

  const isInvoiceFormValid =
    pendingInvoice &&
    pendingInvoice.invoiceNumber.trim() &&
    pendingInvoice.totalServiceAmount.trim() &&
    !isNaN(parseFloat(pendingInvoice.totalServiceAmount));

  const isApprovalFormValid =
    pendingApproval &&
    pendingApproval.approvedLaborCost.trim() &&
    pendingApproval.approvedServiceCost.trim() &&
    !isNaN(parseFloat(pendingApproval.approvedLaborCost)) &&
    !isNaN(parseFloat(pendingApproval.approvedServiceCost));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Biletler yükleniyor...</div>
      </div>
    );
  }

  return (
    <>
      {showDeliveryCelebration && (
        <DeliveryCelebration
          ticketTitle={deliveredTicketTitle}
          onComplete={() => setShowDeliveryCelebration(false)}
          duration={4000}
          delay={500}
        />
      )}
      {showMoneyAnimation && (
        <MoneyAnimation
          amount={wonAmount}
          onComplete={() => setShowMoneyAnimation(false)}
          duration={3000}
        />
      )}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((column) => {
          let filteredTickets;
          if (column.status === 'won') {
            // Won column shows all tickets with won=true
            filteredTickets = tickets.filter((t) => t.won === true);
          } else if (column.status === 'delivery') {
            // Delivery column excludes won tickets
            filteredTickets = tickets.filter((t) => t.status === column.status && !t.won);
          } else {
            // Other columns filter by status
            filteredTickets = tickets.filter((t) => t.status === column.status);
          }

          return (
            <KanbanColumn
              key={column.status}
              title={column.title}
              status={column.status}
              tickets={filteredTickets}
              onDrop={handleDrop}
              onDragStart={handleDragStart}
              onEdit={onEditTicket}
              color={column.color}
            />
          );
        })}
      </div>

      {pendingMove && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {pendingMove.prompt}
              </h3>
              <button
                onClick={handleNoteCancel}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-4">
              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Notunuzu girin..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                rows={4}
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-3 p-4 border-t border-gray-200">
              <button
                onClick={handleNoteCancel}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleNoteSubmit}
                disabled={!noteContent.trim() || submitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Kaydediliyor...' : 'Kaydet ve Taşı'}
              </button>
            </div>
          </div>
        </div>
      )}

      {pendingInvoice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-teal-600" />
                <h3 className="text-lg font-semibold text-gray-900">Fatura Detayları</h3>
              </div>
              <button
                onClick={handleInvoiceCancel}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fatura Numarası *
                </label>
                <input
                  type="text"
                  value={pendingInvoice.invoiceNumber}
                  onChange={(e) =>
                    setPendingInvoice((prev) =>
                      prev ? { ...prev, invoiceNumber: e.target.value } : null
                    )
                  }
                  placeholder="Fatura numarasını girin"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Toplam Servis Tutarı (KDV Hariç) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={pendingInvoice.totalServiceAmount}
                    onChange={(e) =>
                      setPendingInvoice((prev) =>
                        prev ? { ...prev, totalServiceAmount: e.target.value } : null
                      )
                    }
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t border-gray-200">
              <button
                onClick={handleInvoiceCancel}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleInvoiceSubmit}
                disabled={!isInvoiceFormValid || submitting}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Kaydediliyor...' : 'Faturalamaya Taşı'}
              </button>
            </div>
          </div>
        </div>
      )}

      {pendingApproval && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-amber-600" />
                <h3 className="text-lg font-semibold text-gray-900">Müşteri Onay Maliyetleri</h3>
              </div>
              <button
                onClick={handleApprovalCancel}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Onaylanan İşçilik Maliyeti *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={pendingApproval.approvedLaborCost}
                  onChange={(e) =>
                    setPendingApproval((prev) =>
                      prev ? { ...prev, approvedLaborCost: e.target.value } : null
                    )
                  }
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Onaylanan Servis Maliyeti *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={pendingApproval.approvedServiceCost}
                  onChange={(e) =>
                    setPendingApproval((prev) =>
                      prev ? { ...prev, approvedServiceCost: e.target.value } : null
                    )
                  }
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t border-gray-200">
              <button
                onClick={handleApprovalCancel}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleApprovalSubmit}
                disabled={!isApprovalFormValid || submitting}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Kaydediliyor...' : 'Müşteri Onayına Taşı'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
