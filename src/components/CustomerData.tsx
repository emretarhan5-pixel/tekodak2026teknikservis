import { useEffect, useMemo, useState } from 'react';
import { Download, Search, Users, User, Phone, Mail, MapPin, Building2, FileText } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface CustomerRecord {
  id: string;
  ticket_ids: string[];
  customer_full_name: string | null;
  customer_phone: string | null;
  customer_extension: string | null;
  customer_email: string | null;
  customer_address: string | null;
  billing_company_name: string | null;
  billing_address: string | null;
  billing_tax_office: string | null;
  billing_tax_number: string | null;
  ticket_count: number;
  last_ticket_date: string;
}

function isEmptyField(v: string | null | undefined): boolean {
  return v == null || String(v).trim() === '';
}

type EditFormState = {
  customer_full_name: string;
  customer_phone: string;
  customer_extension: string;
  customer_email: string;
  customer_address: string;
  billing_company_name: string;
  billing_address: string;
  billing_tax_office: string;
  billing_tax_number: string;
};

function recordToForm(c: CustomerRecord): EditFormState {
  return {
    customer_full_name: c.customer_full_name ?? '',
    customer_phone: c.customer_phone ?? '',
    customer_extension: c.customer_extension ?? '',
    customer_email: c.customer_email ?? '',
    customer_address: c.customer_address ?? '',
    billing_company_name: c.billing_company_name ?? '',
    billing_address: c.billing_address ?? '',
    billing_tax_office: c.billing_tax_office ?? '',
    billing_tax_number: c.billing_tax_number ?? '',
  };
}

interface CustomerDataProps {
  isAdmin?: boolean;
}

export function CustomerData({ isAdmin = true }: CustomerDataProps) {
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRecord | null>(null);
  const [editForm, setEditForm] = useState<EditFormState | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCustomerData();
  }, []);

  useEffect(() => {
    if (selectedCustomer) {
      setEditForm(recordToForm(selectedCustomer));
    } else {
      setEditForm(null);
    }
  }, [selectedCustomer]);

  const fetchCustomerData = async () => {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select(`
          id,
          customer_full_name,
          customer_phone,
          customer_extension,
          customer_email,
          customer_address,
          billing_company_name,
          billing_address,
          billing_tax_office,
          billing_tax_number,
          created_at
        `)
        .not('customer_full_name', 'is', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const customerMap = new Map<string, CustomerRecord>();

      (data || []).forEach((ticket) => {
        const key = `${ticket.customer_full_name || ''}-${ticket.customer_phone || ''}-${ticket.customer_email || ''}`.toLowerCase();

        if (!key.trim() || key === '--') return;

        const existing = customerMap.get(key);
        if (existing) {
          existing.ticket_ids.push(ticket.id);
          existing.ticket_count += 1;
          if (new Date(ticket.created_at) > new Date(existing.last_ticket_date)) {
            existing.last_ticket_date = ticket.created_at;
            if (ticket.customer_address) existing.customer_address = ticket.customer_address;
            if (ticket.billing_company_name) existing.billing_company_name = ticket.billing_company_name;
            if (ticket.billing_address) existing.billing_address = ticket.billing_address;
            if (ticket.billing_tax_office) existing.billing_tax_office = ticket.billing_tax_office;
            if (ticket.billing_tax_number) existing.billing_tax_number = ticket.billing_tax_number;
          }
        } else {
          customerMap.set(key, {
            id: ticket.id,
            ticket_ids: [ticket.id],
            customer_full_name: ticket.customer_full_name,
            customer_phone: ticket.customer_phone,
            customer_extension: ticket.customer_extension,
            customer_email: ticket.customer_email,
            customer_address: ticket.customer_address,
            billing_company_name: ticket.billing_company_name,
            billing_address: ticket.billing_address,
            billing_tax_office: ticket.billing_tax_office,
            billing_tax_number: ticket.billing_tax_number,
            ticket_count: 1,
            last_ticket_date: ticket.created_at,
          });
        }
      });

      const uniqueCustomers = Array.from(customerMap.values()).sort((a, b) =>
        new Date(b.last_ticket_date).getTime() - new Date(a.last_ticket_date).getTime()
      );

      setCustomers(uniqueCustomers);
    } catch (error) {
      console.error('Error fetching customer data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter((customer) => {
    const term = searchTerm.toLowerCase();
    return (
      customer.customer_full_name?.toLowerCase().includes(term) ||
      customer.customer_phone?.toLowerCase().includes(term) ||
      customer.customer_email?.toLowerCase().includes(term) ||
      customer.billing_company_name?.toLowerCase().includes(term) ||
      customer.customer_address?.toLowerCase().includes(term)
    );
  });

  const staffCanSave = useMemo(() => {
    if (!selectedCustomer || !editForm || isAdmin) return false;
    const orig = selectedCustomer;
    const keys: (keyof EditFormState)[] = [
      'customer_full_name',
      'customer_phone',
      'customer_extension',
      'customer_email',
      'customer_address',
      'billing_company_name',
      'billing_address',
      'billing_tax_office',
      'billing_tax_number',
    ];
    return keys.some((k) => {
      const wasEmpty = isEmptyField(orig[k as keyof CustomerRecord] as string | null);
      const now = editForm[k].trim();
      return wasEmpty && now.length > 0;
    });
  }, [selectedCustomer, editForm, isAdmin]);

  const adminFormDirty = useMemo(() => {
    if (!selectedCustomer || !editForm || !isAdmin) return false;
    const initial = recordToForm(selectedCustomer);
    return (Object.keys(initial) as (keyof EditFormState)[]).some((k) => initial[k] !== editForm[k]);
  }, [selectedCustomer, editForm, isAdmin]);

  const saveEnabled = isAdmin ? adminFormDirty : staffCanSave;

  const handleSave = async () => {
    if (!selectedCustomer || !editForm || selectedCustomer.ticket_ids.length === 0) return;
    if (!saveEnabled) return;

    setSaving(true);
    try {
      let payload: Record<string, string | null> = {};

      if (isAdmin) {
        payload = {
          customer_full_name: editForm.customer_full_name.trim() || null,
          customer_phone: editForm.customer_phone.trim() || null,
          customer_extension: editForm.customer_extension.trim() || null,
          customer_email: editForm.customer_email.trim() || null,
          customer_address: editForm.customer_address.trim() || null,
          billing_company_name: editForm.billing_company_name.trim() || null,
          billing_address: editForm.billing_address.trim() || null,
          billing_tax_office: editForm.billing_tax_office.trim() || null,
          billing_tax_number: editForm.billing_tax_number.trim() || null,
        };
      } else {
        const orig = selectedCustomer;
        const map: [keyof EditFormState, keyof CustomerRecord][] = [
          ['customer_full_name', 'customer_full_name'],
          ['customer_phone', 'customer_phone'],
          ['customer_extension', 'customer_extension'],
          ['customer_email', 'customer_email'],
          ['customer_address', 'customer_address'],
          ['billing_company_name', 'billing_company_name'],
          ['billing_address', 'billing_address'],
          ['billing_tax_office', 'billing_tax_office'],
          ['billing_tax_number', 'billing_tax_number'],
        ];
        for (const [formKey, recKey] of map) {
          if (isEmptyField(orig[recKey] as string | null) && editForm[formKey].trim()) {
            payload[formKey] = editForm[formKey].trim();
          }
        }
        if (Object.keys(payload).length === 0) {
          setSaving(false);
          return;
        }
      }

      const { error } = await supabase.from('tickets').update(payload).in('id', selectedCustomer.ticket_ids);

      if (error) throw error;

      setSelectedCustomer(null);
      await fetchCustomerData();
    } catch (error) {
      console.error('Error saving customer:', error);
      alert('Kayıt sırasında bir hata oluştu.');
    } finally {
      setSaving(false);
    }
  };

  const exportToCSV = () => {
    const headers = [
      'Tam Ad',
      'Telefon',
      'Dahili',
      'E-posta',
      'Adres',
      'Şirket Adı',
      'Fatura Adresi',
      'Vergi Dairesi',
      'Vergi Numarası',
      'Toplam Bilet',
      'Son Servis Tarihi',
    ];

    const escapeCSV = (value: string | null | number) => {
      if (value === null || value === undefined) return '';
      const str = String(value);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = filteredCustomers.map((customer) => [
      escapeCSV(customer.customer_full_name),
      escapeCSV(customer.customer_phone),
      escapeCSV(customer.customer_extension),
      escapeCSV(customer.customer_email),
      escapeCSV(customer.customer_address),
      escapeCSV(customer.billing_company_name),
      escapeCSV(customer.billing_address),
      escapeCSV(customer.billing_tax_office),
      escapeCSV(customer.billing_tax_number),
      escapeCSV(customer.ticket_count),
      escapeCSV(new Date(customer.last_ticket_date).toLocaleDateString('tr-TR')),
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `customer-data-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Müşteri Veritabanı</h3>
              <p className="text-sm text-gray-500">{customers.length} benzersiz müşteri</p>
            </div>
          </div>
          <button
            onClick={exportToCSV}
            disabled={filteredCustomers.length === 0}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            CSV Dışa Aktar
          </button>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Ad, telefon, e-posta, şirket veya adres ile ara..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {filteredCustomers.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {searchTerm ? 'Aramanıza uygun müşteri bulunamadı' : 'Müşteri verisi bulunmuyor'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Müşteri</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">İletişim</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Şirket</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700 text-sm">Biletler</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Son Servis</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700 text-sm">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr
                    key={customer.id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900">{customer.customer_full_name || '-'}</div>
                      {customer.customer_address && (
                        <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate max-w-[200px]">{customer.customer_address}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {customer.customer_phone && (
                        <div className="text-sm text-gray-700 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-gray-400" />
                          {customer.customer_phone}
                          {customer.customer_extension && (
                            <span className="text-gray-400 text-xs">dah. {customer.customer_extension}</span>
                          )}
                        </div>
                      )}
                      {customer.customer_email && (
                        <div className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3 text-gray-400" />
                          {customer.customer_email}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {customer.billing_company_name ? (
                        <div className="flex items-center gap-1 text-sm text-gray-700">
                          <Building2 className="w-3 h-3 text-gray-400" />
                          {customer.billing_company_name}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center justify-center min-w-[28px] px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                        {customer.ticket_count}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {new Date(customer.last_ticket_date).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedCustomer(customer)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Detayları Görüntüle
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedCustomer && editForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Müşteri Detayları</h3>
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors text-2xl leading-none"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-lg">
                  {selectedCustomer.customer_full_name?.charAt(0) || '?'}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 text-lg">
                    {selectedCustomer.customer_full_name || 'Bilinmiyor'}
                  </h4>
                  <p className="text-sm text-gray-500">{selectedCustomer.ticket_count} servis bileti</p>
                </div>
              </div>

              <div className="grid gap-4">
                <FormField
                  icon={User}
                  label="Tam Ad"
                  formKey="customer_full_name"
                  original={selectedCustomer.customer_full_name}
                  form={editForm}
                  setForm={setEditForm}
                  isAdmin={isAdmin}
                />
                <FormField
                  icon={Phone}
                  label="Telefon"
                  formKey="customer_phone"
                  original={selectedCustomer.customer_phone}
                  form={editForm}
                  setForm={setEditForm}
                  isAdmin={isAdmin}
                  inputMode="tel"
                />
                <FormField
                  icon={Phone}
                  label="Dahili"
                  formKey="customer_extension"
                  original={selectedCustomer.customer_extension}
                  form={editForm}
                  setForm={setEditForm}
                  isAdmin={isAdmin}
                />
                <FormField
                  icon={Mail}
                  label="E-posta"
                  formKey="customer_email"
                  original={selectedCustomer.customer_email}
                  form={editForm}
                  setForm={setEditForm}
                  isAdmin={isAdmin}
                  inputMode="email"
                />
                <FormField
                  icon={MapPin}
                  label="Adres"
                  formKey="customer_address"
                  original={selectedCustomer.customer_address}
                  form={editForm}
                  setForm={setEditForm}
                  isAdmin={isAdmin}
                  multiline
                />
              </div>

              <div className="pt-4 border-t border-gray-200">
                <h5 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-400" />
                  Fatura Bilgileri
                </h5>
                <div className="grid gap-4">
                  <FormField
                    icon={Building2}
                    label="Şirket Adı"
                    formKey="billing_company_name"
                    original={selectedCustomer.billing_company_name}
                    form={editForm}
                    setForm={setEditForm}
                    isAdmin={isAdmin}
                  />
                  <FormField
                    icon={MapPin}
                    label="Fatura Adresi"
                    formKey="billing_address"
                    original={selectedCustomer.billing_address}
                    form={editForm}
                    setForm={setEditForm}
                    isAdmin={isAdmin}
                    multiline
                  />
                  <FormField
                    icon={FileText}
                    label="Vergi Dairesi"
                    formKey="billing_tax_office"
                    original={selectedCustomer.billing_tax_office}
                    form={editForm}
                    setForm={setEditForm}
                    isAdmin={isAdmin}
                  />
                  <FormField
                    icon={FileText}
                    label="Vergi Numarası"
                    formKey="billing_tax_number"
                    original={selectedCustomer.billing_tax_number}
                    form={editForm}
                    setForm={setEditForm}
                    isAdmin={isAdmin}
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200 text-sm text-gray-500">
                Son servis: {new Date(selectedCustomer.last_ticket_date).toLocaleDateString('tr-TR')}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="flex-1 px-4 py-2.5 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              >
                Kapat
              </button>
              <button
                type="button"
                disabled={!saveEnabled || saving}
                onClick={handleSave}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FormField({
  icon: Icon,
  label,
  formKey,
  original,
  form,
  setForm,
  isAdmin,
  multiline,
  inputMode,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  formKey: keyof EditFormState;
  original: string | null;
  form: EditFormState;
  setForm: React.Dispatch<React.SetStateAction<EditFormState | null>>;
  isAdmin: boolean;
  multiline?: boolean;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
}) {
  const filled = !isEmptyField(original);
  const showInput = isAdmin || !filled;
  const displayValue = original?.trim() ? original : '—';

  const commonInput =
    'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-gray-900';

  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 mt-1">
        <Icon className="w-4 h-4 text-gray-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{label}</p>
        {showInput ? (
          multiline ? (
            <textarea
              value={form[formKey]}
              onChange={(e) =>
                setForm((prev) => (prev ? { ...prev, [formKey]: e.target.value } : null))
              }
              className={commonInput}
              rows={3}
            />
          ) : (
            <input
              type={inputMode === 'email' ? 'email' : 'text'}
              inputMode={inputMode}
              value={form[formKey]}
              onChange={(e) =>
                setForm((prev) => (prev ? { ...prev, [formKey]: e.target.value } : null))
              }
              className={commonInput}
            />
          )
        ) : (
          <p className="text-sm text-gray-900 py-2 px-1 border border-transparent bg-gray-50 rounded-lg">
            {displayValue}
          </p>
        )}
      </div>
    </div>
  );
}
