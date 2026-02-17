import { useEffect, useState } from 'react';
import { X, Monitor, User, Building2, Receipt, ClipboardCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { TicketWithRelations, Device } from '../lib/database.types';
import { CelebrationAnimation } from './CelebrationAnimation';

interface TicketModalProps {
  ticket: TicketWithRelations | null;
  onClose: () => void;
  onSave: () => void;
  staffName?: string;
  staffId?: string;
}

interface TicketFormData {
  title: string;
  description: string;
  priority: string;
  status: string;
  assigned_to: string;
  device_id: string;
  serial_number: string;
  product_type: string;
  brand: string;
  model: string;
  model_number: string;
  warranty_status: string;
  customer_full_name: string;
  customer_phone: string;
  customer_extension: string;
  customer_email: string;
  customer_address: string;
  billing_company_name: string;
  billing_address: string;
  billing_tax_office: string;
  billing_tax_number: string;
  invoice_number: string;
  total_service_amount: string;
  approved_labor_cost: string;
  approved_service_cost: string;
}

const initialFormData: TicketFormData = {
  title: '',
  description: '',
  priority: 'medium',
  status: 'accepted_pending',
  assigned_to: '',
  device_id: '',
  serial_number: '',
  product_type: '',
  brand: '',
  model: '',
  model_number: '',
  warranty_status: 'unknown',
  customer_full_name: '',
  customer_phone: '',
  customer_extension: '',
  customer_email: '',
  customer_address: '',
  billing_company_name: '',
  billing_address: '',
  billing_tax_office: '',
  billing_tax_number: '',
  invoice_number: '',
  total_service_amount: '',
  approved_labor_cost: '',
  approved_service_cost: '',
};

export function TicketModal({ ticket, onClose, onSave, staffName, staffId }: TicketModalProps) {
  const [formData, setFormData] = useState<TicketFormData>(initialFormData);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(false);
  const [brandSelection, setBrandSelection] = useState<string>('');
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    fetchDevices();
    if (ticket) {
      const brand = ticket.brand || '';
      setBrandSelection(brand === 'KOBRA' || brand === 'HAGEL' ? brand : brand ? 'custom' : '');
      setFormData({
        title: ticket.title || '',
        description: ticket.description || '',
        priority: ticket.priority || 'medium',
        status: ticket.status || 'accepted_pending',
        assigned_to: ticket.assigned_to || '',
        device_id: ticket.device_id || '',
        serial_number: ticket.serial_number || '',
        product_type: ticket.product_type || '',
        brand: ticket.brand || '',
        model: ticket.model || '',
        model_number: ticket.model_number || '',
        warranty_status: ticket.warranty_status || 'unknown',
        customer_full_name: ticket.customer_full_name || '',
        customer_phone: ticket.customer_phone || '',
        customer_extension: ticket.customer_extension || '',
        customer_email: ticket.customer_email || '',
        customer_address: ticket.customer_address || '',
        billing_company_name: ticket.billing_company_name || '',
        billing_address: ticket.billing_address || '',
        billing_tax_office: ticket.billing_tax_office || '',
        billing_tax_number: ticket.billing_tax_number || '',
        invoice_number: ticket.invoice_number || '',
        total_service_amount: ticket.total_service_amount?.toString() || '',
        approved_labor_cost: ticket.approved_labor_cost?.toString() || '',
        approved_service_cost: ticket.approved_service_cost?.toString() || '',
      });
    } else {
      setFormData(initialFormData);
      setBrandSelection('');
    }
  }, [ticket]);

  const fetchDevices = async () => {
    try {
      const { data } = await supabase
        .from('devices')
        .select('*')
        .order('device_type');
      if (data) setDevices(data);
    } catch (error) {
      console.error('Error fetching devices:', error);
    }
  };

  const handleChange = (field: keyof TicketFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.device_id) return;

    setLoading(true);

    try {
      const ticketData = {
        title: formData.title,
        description: formData.description || null,
        priority: formData.priority,
        status: formData.status,
        assigned_to: staffId || formData.assigned_to || null,
        device_id: formData.device_id || null,
        serial_number: formData.serial_number || null,
        product_type: formData.product_type || null,
        brand: formData.brand || null,
        model: formData.model || null,
        model_number: formData.model_number || null,
        warranty_status: formData.warranty_status || null,
        customer_full_name: formData.customer_full_name || null,
        customer_phone: formData.customer_phone || null,
        customer_extension: formData.customer_extension || null,
        customer_email: formData.customer_email || null,
        customer_address: formData.customer_address || null,
        billing_company_name: formData.billing_company_name || null,
        billing_address: formData.billing_address || null,
        billing_tax_office: formData.billing_tax_office || null,
        billing_tax_number: formData.billing_tax_number || null,
        invoice_number: formData.invoice_number || null,
        total_service_amount: formData.total_service_amount
          ? parseFloat(formData.total_service_amount)
          : null,
        approved_labor_cost: formData.approved_labor_cost
          ? parseFloat(formData.approved_labor_cost)
          : null,
        approved_service_cost: formData.approved_service_cost
          ? parseFloat(formData.approved_service_cost)
          : null,
        updated_at: new Date().toISOString(),
      };

      if (ticket) {
        const { error } = await supabase
          .from('tickets')
          .update(ticketData)
          .eq('id', ticket.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('tickets').insert([ticketData]);
        if (error) throw error;
        
        // Show celebration animation for new ticket creation
        setShowCelebration(true);
      }

      onSave();
      
      // Delay closing to allow celebration animation to play (1s delay + 3s duration)
      if (!ticket) {
        setTimeout(() => {
          onClose();
        }, 4500);
      } else {
        onClose();
      }
    } catch (error) {
      console.error('Error saving ticket:', error);
    } finally {
      setLoading(false);
    }
  };

  const inputClasses =
    'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm';
  const labelClasses = 'block text-sm font-medium text-gray-700 mb-1';

  return (
    <>
      {showCelebration && (
        <CelebrationAnimation
          staffName={staffName}
          onComplete={() => setShowCelebration(false)}
          duration={3000}
          delay={1000}
        />
      )}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-2xl max-w-4xl w-full h-[95dvh] sm:h-auto sm:max-h-[95vh] overflow-hidden flex flex-col touch-manipulation">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-xl font-bold text-gray-900">
            {ticket ? 'Servis Biletini Düzenle' : 'Yeni Servis Bileti Oluştur'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2.5 hover:bg-gray-200 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className={labelClasses}>Başlık *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  className={inputClasses}
                  placeholder="Sorunun kısa açıklaması"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className={labelClasses}>Açıklama</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  className={inputClasses}
                  placeholder="Sorunun detaylı açıklaması..."
                  rows={3}
                />
              </div>

              <div>
                <label className={labelClasses}>Öncelik *</label>
                <select
                  value={formData.priority}
                  onChange={(e) => handleChange('priority', e.target.value)}
                  className={inputClasses}
                  required
                >
                  <option value="low">Düşük</option>
                  <option value="medium">Orta</option>
                  <option value="high">Yüksek</option>
                  <option value="urgent">Acil</option>
                </select>
              </div>

              <div>
                <label className={labelClasses}>Durum *</label>
                <select
                  value={formData.status}
                  onChange={(e) => handleChange('status', e.target.value)}
                  className={inputClasses}
                  required
                >
                  <option value="accepted_pending">Kabul Edildi / Beklemede</option>
                  <option value="fault_diagnosis">Arıza Tespiti</option>
                  <option value="customer_approval">Müşteri Onayı</option>
                  <option value="under_repair">Onarımda</option>
                  <option value="ready_for_delivery">Teslimata Hazır</option>
                  <option value="invoicing">Faturalama</option>
                  <option value="delivery">Teslimat</option>
                </select>
              </div>

            </div>

            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center gap-2 mb-4">
                <Monitor className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Cihaz Bilgileri</h3>
              </div>
              <div className="mb-4">
                <label className={labelClasses}>Cihaz Seç *</label>
                <select
                  value={formData.device_id}
                  onChange={(e) => handleChange('device_id', e.target.value)}
                  className={inputClasses}
                  required
                >
                  <option value="">Cihaz seçin</option>
                  {devices.map((device) => (
                    <option key={device.id} value={device.id}>
                      {device.device_type}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={labelClasses}>Seri Numarası</label>
                  <input
                    type="text"
                    value={formData.serial_number}
                    onChange={(e) => handleChange('serial_number', e.target.value)}
                    className={inputClasses}
                    placeholder="Seri numarasını girin"
                  />
                </div>
                <div>
                  <label className={labelClasses}>Ürün Tipi</label>
                  <select
                    value={formData.product_type}
                    onChange={(e) => handleChange('product_type', e.target.value)}
                    className={inputClasses}
                  >
                    <option value="">Ürün tipi seçin</option>
                    <option value="Evrak İmha Makinesi">Evrak İmha Makinesi</option>
                    <option value="Akıllı Dijital Kürsü">Akıllı Dijital Kürsü</option>
                    <option value="Hava Temizleme Cihazı">Hava Temizleme Cihazı</option>
                    <option value="FlexPack Karton Geri Dönüşüm Makinesi">FlexPack Karton Geri Dönüşüm Makinesi</option>
                  </select>
                </div>
                <div>
                  <label className={labelClasses}>Marka</label>
                  <select
                    value={brandSelection}
                    onChange={(e) => {
                      const value = e.target.value;
                      setBrandSelection(value);
                      if (value === 'custom') {
                        handleChange('brand', '');
                      } else {
                        handleChange('brand', value);
                      }
                    }}
                    className={inputClasses}
                  >
                    <option value="">Marka seçin</option>
                    <option value="KOBRA">KOBRA</option>
                    <option value="HAGEL">HAGEL</option>
                    <option value="custom">Diğer</option>
                  </select>
                  {brandSelection === 'custom' && (
                    <input
                      type="text"
                      value={formData.brand}
                      onChange={(e) => handleChange('brand', e.target.value)}
                      className={`${inputClasses} mt-2`}
                      placeholder="Özel marka girin"
                    />
                  )}
                </div>
                <div>
                  <label className={labelClasses}>Model</label>
                  <input
                    type="text"
                    value={formData.model}
                    onChange={(e) => handleChange('model', e.target.value)}
                    className={inputClasses}
                    placeholder="Örn: MacBook Pro"
                  />
                </div>
                <div>
                  <label className={labelClasses}>Model Numarası</label>
                  <input
                    type="text"
                    value={formData.model_number}
                    onChange={(e) => handleChange('model_number', e.target.value)}
                    className={inputClasses}
                    placeholder="Örn: A2338"
                  />
                </div>
                <div>
                  <label className={labelClasses}>Garanti Durumu</label>
                  <select
                    value={formData.warranty_status}
                    onChange={(e) => handleChange('warranty_status', e.target.value)}
                    className={inputClasses}
                  >
                    <option value="unknown">Bilinmiyor</option>
                    <option value="in_warranty">Garanti Kapsamında</option>
                    <option value="out_of_warranty">Garanti Dışı</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center gap-2 mb-4">
                <User className="w-5 h-5 text-emerald-600" />
                <h3 className="text-lg font-semibold text-gray-900">Müşteri İletişim Bilgileri</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className={labelClasses}>Müşteri Tam Adı</label>
                  <input
                    type="text"
                    value={formData.customer_full_name}
                    onChange={(e) => handleChange('customer_full_name', e.target.value)}
                    className={inputClasses}
                    placeholder="Tam ad"
                  />
                </div>
                <div>
                  <label className={labelClasses}>Telefon Numarası</label>
                  <input
                    type="tel"
                    value={formData.customer_phone}
                    onChange={(e) => handleChange('customer_phone', e.target.value)}
                    className={inputClasses}
                    placeholder="+90 555 123 4567"
                  />
                </div>
                <div>
                  <label className={labelClasses}>Dahili Numara</label>
                  <input
                    type="text"
                    value={formData.customer_extension}
                    onChange={(e) => handleChange('customer_extension', e.target.value)}
                    className={inputClasses}
                    placeholder="Dahili"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className={labelClasses}>E-posta Adresi</label>
                  <input
                    type="email"
                    value={formData.customer_email}
                    onChange={(e) => handleChange('customer_email', e.target.value)}
                    className={inputClasses}
                    placeholder="email@ornek.com"
                  />
                </div>
                <div className="md:col-span-3">
                  <label className={labelClasses}>Adres</label>
                  <textarea
                    value={formData.customer_address}
                    onChange={(e) => handleChange('customer_address', e.target.value)}
                    className={inputClasses}
                    placeholder="Tam adres"
                    rows={2}
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="w-5 h-5 text-amber-600" />
                <h3 className="text-lg font-semibold text-gray-900">Fatura Bilgileri</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClasses}>Şirket Adı</label>
                  <input
                    type="text"
                    value={formData.billing_company_name}
                    onChange={(e) => handleChange('billing_company_name', e.target.value)}
                    className={inputClasses}
                    placeholder="Şirket adı"
                  />
                </div>
                <div>
                  <label className={labelClasses}>Fatura Adresi</label>
                  <input
                    type="text"
                    value={formData.billing_address}
                    onChange={(e) => handleChange('billing_address', e.target.value)}
                    className={inputClasses}
                    placeholder="Fatura adresi"
                  />
                </div>
                <div>
                  <label className={labelClasses}>Vergi Dairesi</label>
                  <input
                    type="text"
                    value={formData.billing_tax_office}
                    onChange={(e) => handleChange('billing_tax_office', e.target.value)}
                    className={inputClasses}
                    placeholder="Vergi dairesi adı"
                  />
                </div>
                <div>
                  <label className={labelClasses}>Vergi Numarası</label>
                  <input
                    type="text"
                    value={formData.billing_tax_number}
                    onChange={(e) => handleChange('billing_tax_number', e.target.value)}
                    className={inputClasses}
                    placeholder="Vergi kimlik numarası"
                  />
                </div>
              </div>
            </div>

            {ticket && (formData.approved_labor_cost || formData.approved_service_cost) && (
              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <ClipboardCheck className="w-5 h-5 text-amber-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Müşteri Onay Maliyetleri</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClasses}>Onaylanan İşçilik Maliyeti</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.approved_labor_cost}
                      onChange={(e) => handleChange('approved_labor_cost', e.target.value)}
                      className={inputClasses}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className={labelClasses}>Onaylanan Servis Maliyeti</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.approved_service_cost}
                      onChange={(e) => handleChange('approved_service_cost', e.target.value)}
                      className={inputClasses}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
            )}

            {ticket && (formData.invoice_number || formData.total_service_amount) && (
              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Receipt className="w-5 h-5 text-teal-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Fatura Bilgileri</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClasses}>Fatura Numarası</label>
                    <input
                      type="text"
                      value={formData.invoice_number}
                      onChange={(e) => handleChange('invoice_number', e.target.value)}
                      className={inputClasses}
                      placeholder="Fatura numarasını girin"
                    />
                  </div>
                  <div>
                    <label className={labelClasses}>Toplam Servis Tutarı (KDV Hariç)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.total_service_amount}
                      onChange={(e) => handleChange('total_service_amount', e.target.value)}
                      className={inputClasses}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400"
            >
              {loading ? 'Kaydediliyor...' : ticket ? 'Bileti Güncelle' : 'Bilet Oluştur'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
            >
              İptal
            </button>
          </div>
        </form>
      </div>
    </div>
    </>
  );
}
