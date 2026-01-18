import { useEffect, useState } from 'react';
import {
  X,
  Monitor,
  User,
  Building2,
  Clock,
  Edit3,
  MessageSquare,
  Send,
  AlertCircle,
  Receipt,
  ClipboardCheck,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { TicketWithRelations, TicketNote, Technician } from '../lib/database.types';

interface TicketDetailViewProps {
  ticket: TicketWithRelations;
  onClose: () => void;
  onEdit: () => void;
  onRefresh: () => void;
}

const priorityConfig = {
  low: { label: 'Düşük', color: 'bg-gray-100 text-gray-700' },
  medium: { label: 'Orta', color: 'bg-blue-100 text-blue-700' },
  high: { label: 'Yüksek', color: 'bg-orange-100 text-orange-700' },
  urgent: { label: 'Acil', color: 'bg-red-100 text-red-700' },
};

const statusConfig: Record<string, { label: string; color: string }> = {
  accepted_pending: { label: 'Kabul Edildi / Beklemede', color: 'bg-slate-100 text-slate-700' },
  fault_diagnosis: { label: 'Arıza Tespiti', color: 'bg-blue-100 text-blue-700' },
  customer_approval: { label: 'Müşteri Onayı', color: 'bg-amber-100 text-amber-700' },
  under_repair: { label: 'Onarımda', color: 'bg-orange-100 text-orange-700' },
  ready_for_delivery: { label: 'Teslimata Hazır', color: 'bg-emerald-100 text-emerald-700' },
  invoicing: { label: 'Faturalama', color: 'bg-teal-100 text-teal-700' },
  delivery: { label: 'Teslimat', color: 'bg-cyan-100 text-cyan-700' },
};

const warrantyLabels: Record<string, string> = {
  in_warranty: 'Garanti Kapsamında',
  out_of_warranty: 'Garanti Dışı',
  unknown: 'Bilinmiyor',
};

function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3 py-2">
      <span className="text-sm text-gray-500 sm:w-36 shrink-0">{label}</span>
      <span className="text-sm text-gray-900">{value}</span>
    </div>
  );
}

export function TicketDetailView({ ticket, onClose, onEdit, onRefresh }: TicketDetailViewProps) {
  const [notes, setNotes] = useState<TicketNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [loadingNotes, setLoadingNotes] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [technician, setTechnician] = useState<Technician | null>(null);

  useEffect(() => {
    fetchNotes();
    if (ticket.assigned_to) {
      fetchTechnician();
    }
  }, [ticket.id, ticket.assigned_to]);

  const fetchNotes = async () => {
    try {
      const { data, error } = await supabase
        .from('ticket_notes')
        .select('*')
        .eq('ticket_id', ticket.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setLoadingNotes(false);
    }
  };

  const fetchTechnician = async () => {
    if (!ticket.assigned_to) return;
    try {
      const { data } = await supabase
        .from('technicians')
        .select('*')
        .eq('id', ticket.assigned_to)
        .maybeSingle();
      if (data) setTechnician(data);
    } catch (error) {
      console.error('Error fetching technician:', error);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from('ticket_notes').insert([
        {
          ticket_id: ticket.id,
          content: newNote.trim(),
          created_by: 'Staff',
        },
      ]);

      if (error) throw error;
      setNewNote('');
      fetchNotes();
      onRefresh();
    } catch (error) {
      console.error('Error adding note:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const priority = priorityConfig[ticket.priority as keyof typeof priorityConfig] || priorityConfig.medium;
  const status = statusConfig[ticket.status] || statusConfig.accepted_pending;

  const hasDeviceInfo =
    ticket.serial_number ||
    ticket.product_type ||
    ticket.brand ||
    ticket.model ||
    ticket.model_number ||
    ticket.custom_code ||
    ticket.warranty_status;

  const hasCustomerInfo =
    ticket.customer_full_name ||
    ticket.customer_phone ||
    ticket.customer_extension ||
    ticket.customer_email ||
    ticket.customer_address;

  const hasBillingInfo =
    ticket.billing_company_name ||
    ticket.billing_address ||
    ticket.billing_tax_office ||
    ticket.billing_tax_number;

  const hasInvoiceInfo = ticket.invoice_number || ticket.total_service_amount;

  const hasApprovalCostsInfo = ticket.approved_labor_cost || ticket.approved_service_cost;

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount == null) return null;
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-gray-900">Bilet Detayları</h2>
            <span className={`text-xs px-3 py-1 rounded-full font-medium ${status.color}`}>
              {status.label}
            </span>
            <span className={`text-xs px-3 py-1 rounded-full font-medium ${priority.color}`}>
              <AlertCircle className="w-3 h-3 inline mr-1" />
              {priority.label}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onEdit}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Edit3 className="w-4 h-4" />
              Düzenle
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-200 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{ticket.title}</h3>
              {ticket.description && (
                <p className="text-gray-600 text-sm whitespace-pre-wrap">{ticket.description}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2 text-gray-500">
                <Clock className="w-4 h-4" />
                <span>Oluşturuldu: {formatDateTime(ticket.created_at)}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-500">
                <Clock className="w-4 h-4" />
                <span>Güncellendi: {formatDateTime(ticket.updated_at)}</span>
              </div>
            </div>

            {technician && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold text-white"
                  style={{ backgroundColor: technician.avatar_color }}
                >
                  {technician.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{technician.name}</p>
                  <p className="text-xs text-gray-500">{technician.specialty}</p>
                </div>
              </div>
            )}

            {hasDeviceInfo && (
              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Monitor className="w-5 h-5 text-blue-600" />
                  <h4 className="text-base font-semibold text-gray-900">Cihaz Bilgileri</h4>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 divide-y divide-gray-200">
                  <DetailRow label="Seri Numarası" value={ticket.serial_number} />
                  <DetailRow label="Ürün Tipi" value={ticket.product_type} />
                  <DetailRow label="Marka" value={ticket.brand} />
                  <DetailRow label="Model" value={ticket.model} />
                  <DetailRow label="Model Numarası" value={ticket.model_number} />
                  <DetailRow label="Özel Kod" value={ticket.custom_code} />
                  <DetailRow
                    label="Garanti Durumu"
                    value={ticket.warranty_status ? warrantyLabels[ticket.warranty_status] : null}
                  />
                </div>
              </div>
            )}

            {hasCustomerInfo && (
              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <User className="w-5 h-5 text-emerald-600" />
                  <h4 className="text-base font-semibold text-gray-900">Müşteri İletişim</h4>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 divide-y divide-gray-200">
                  <DetailRow label="Tam Ad" value={ticket.customer_full_name} />
                  <DetailRow label="Telefon" value={ticket.customer_phone} />
                  <DetailRow label="Dahili" value={ticket.customer_extension} />
                  <DetailRow label="E-posta" value={ticket.customer_email} />
                  <DetailRow label="Adres" value={ticket.customer_address} />
                </div>
              </div>
            )}

            {hasBillingInfo && (
              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Building2 className="w-5 h-5 text-amber-600" />
                  <h4 className="text-base font-semibold text-gray-900">Fatura Bilgileri</h4>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 divide-y divide-gray-200">
                  <DetailRow label="Şirket Adı" value={ticket.billing_company_name} />
                  <DetailRow label="Fatura Adresi" value={ticket.billing_address} />
                  <DetailRow label="Vergi Dairesi" value={ticket.billing_tax_office} />
                  <DetailRow label="Vergi Numarası" value={ticket.billing_tax_number} />
                </div>
              </div>
            )}

            {hasApprovalCostsInfo && (
              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <ClipboardCheck className="w-5 h-5 text-amber-600" />
                  <h4 className="text-base font-semibold text-gray-900">Müşteri Onay Maliyetleri</h4>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 divide-y divide-gray-200">
                  <DetailRow
                    label="Onaylanan İşçilik Maliyeti"
                    value={formatCurrency(ticket.approved_labor_cost)}
                  />
                  <DetailRow
                    label="Onaylanan Servis Maliyeti"
                    value={formatCurrency(ticket.approved_service_cost)}
                  />
                </div>
              </div>
            )}

            {hasInvoiceInfo && (
              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Receipt className="w-5 h-5 text-teal-600" />
                  <h4 className="text-base font-semibold text-gray-900">Fatura Bilgileri</h4>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 divide-y divide-gray-200">
                  <DetailRow label="Fatura Numarası" value={ticket.invoice_number} />
                  <DetailRow
                    label="Toplam Tutar (KDV Hariç)"
                    value={formatCurrency(ticket.total_service_amount)}
                  />
                </div>
              </div>
            )}

            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="w-5 h-5 text-gray-600" />
                <h4 className="text-base font-semibold text-gray-900">Notlar</h4>
                <span className="text-sm text-gray-500">({notes.length})</span>
              </div>

              <form onSubmit={handleAddNote} className="mb-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Not ekle..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                  <button
                    type="submit"
                    disabled={submitting || !newNote.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </form>

              <div className="space-y-3 max-h-64 overflow-y-auto">
                {loadingNotes ? (
                  <p className="text-sm text-gray-500 text-center py-4">Notlar yükleniyor...</p>
                ) : notes.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">Henüz not yok</p>
                ) : (
                  notes.map((note) => (
                    <div key={note.id} className="bg-gray-50 rounded-lg p-3">
                      <p className="text-sm text-gray-900 mb-2">{note.content}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className="font-medium">{note.created_by}</span>
                        <span>-</span>
                        <span>{formatDateTime(note.created_at)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}
