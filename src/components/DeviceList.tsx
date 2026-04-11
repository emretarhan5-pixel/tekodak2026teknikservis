import { useEffect, useRef, useState } from 'react';
import { Plus, Trash2, Wrench, FileSpreadsheet, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabase';
import type { Device } from '../lib/database.types';

/** Excel: Cihaz Tipi | Seri Numarası | Müşteri Adı | Model Adı | Ürün Kodu (5. sütun yoksa eski 4 sütunlu format) */
type PreviewRow = {
  device_type: string;
  serial_number: string;
  customer_name: string;
  model: string;
  custom_code: string | null;
  isValid: boolean;
};

function isDuplicateError(err: { code?: string; message?: string } | null): boolean {
  if (!err) return false;
  const msg = (err.message || '').toLowerCase();
  const code = err.code || '';
  return (
    code === '23505' ||
    msg.includes('duplicate') ||
    msg.includes('unique') ||
    msg.includes('already exists')
  );
}

export function DeviceList() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [deviceType, setDeviceType] = useState('');

  const [importModalOpen, setImportModalOpen] = useState(false);
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
  const [importLoading, setImportLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchDevices();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(t);
  }, [toast]);

  const fetchDevices = async () => {
    try {
      const { data, error } = await supabase
        .from('devices')
        .select('*')
        .order('device_type');

      if (error) throw error;
      setDevices(data || []);
    } catch (error) {
      console.error('Error fetching devices:', error);
    }
  };

  const handleAddDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deviceType) return;

    try {
      const serialNumber = `DEV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const { error } = await supabase.from('devices').insert([
        {
          device_type: deviceType,
          serial_number: serialNumber,
          customer_name: '',
          model: '',
        },
      ]);

      if (error) throw error;

      setDeviceType('');
      setShowForm(false);
      fetchDevices();
    } catch (error) {
      console.error('Error adding device:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu cihazı silmek istediğinizden emin misiniz?')) return;

    try {
      const { error } = await supabase.from('devices').delete().eq('id', id);

      if (error) throw error;
      fetchDevices();
    } catch (error) {
      console.error('Error deleting device:', error);
    }
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const parseExcelFile = async (file: File) => {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: 'array' });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const matrix = XLSX.utils.sheet_to_json<(string | number | undefined)[]>(sheet, {
      header: 1,
      defval: '',
      raw: false,
    }) as (string | number | undefined)[][];

    const dataRows = matrix.slice(1);
    const rows: PreviewRow[] = dataRows.map((row) => {
      const c0 = row[0] != null ? String(row[0]).trim() : '';
      const c1 = row[1] != null ? String(row[1]).trim() : '';
      const c2 = row[2] != null ? String(row[2]).trim() : '';
      const c3 = row[3] != null ? String(row[3]).trim() : '';
      const custom_code: string | null =
        row.length <= 4
          ? null
          : (() => {
              const v = row[4];
              if (v === undefined || v === null || String(v).trim() === '') return null;
              return String(v).trim();
            })();

      const isValid = c0.length > 0 && c1.length > 0;
      return {
        device_type: c0,
        serial_number: c1,
        customer_name: c2,
        model: c3,
        custom_code,
        isValid,
      };
    });

    setPreviewRows(rows);
    setImportModalOpen(true);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await parseExcelFile(file);
    } catch (err) {
      console.error('Excel parse error:', err);
      setToast('Dosya okunamadı. Geçerli bir Excel dosyası seçin.');
      resetFileInput();
    }
  };

  const resetFileInput = () => {
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleConfirmImport = async () => {
    const validRows = previewRows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      setToast('Kaydedilecek geçerli satır yok.');
      return;
    }

    const payloads = validRows.map((r) => ({
      device_type: r.device_type,
      serial_number: r.serial_number,
      customer_name: r.customer_name || '',
      model: r.model || '',
      custom_code: r.custom_code,
    }));

    setImportLoading(true);
    try {
      const { error } = await supabase.from('devices').insert(payloads);

      if (!error) {
        setToast(`${validRows.length} cihaz başarıyla eklendi`);
        setImportModalOpen(false);
        setPreviewRows([]);
        resetFileInput();
        await fetchDevices();
        return;
      }

      if (isDuplicateError(error)) {
        let success = 0;
        const failedSerials: string[] = [];

        for (const p of payloads) {
          const { error: rowErr } = await supabase.from('devices').insert([p]);
          if (rowErr) {
            if (isDuplicateError(rowErr)) {
              failedSerials.push(p.serial_number);
            } else {
              failedSerials.push(`${p.serial_number} (${rowErr.message})`);
            }
          } else {
            success += 1;
          }
        }

        const parts: string[] = [];
        if (success > 0) parts.push(`${success} cihaz başarıyla eklendi`);
        if (failedSerials.length > 0) {
          parts.push(
            `Tekrarlayan veya hatalı seri numaraları: ${failedSerials.join(', ')}`
          );
        }
        setToast(parts.join(' — '));
        setImportModalOpen(false);
        setPreviewRows([]);
        resetFileInput();
        await fetchDevices();
        return;
      }

      setToast(error.message || 'İçe aktarma başarısız.');
    } catch (e) {
      console.error(e);
      setToast('Beklenmeyen bir hata oluştu.');
    } finally {
      setImportLoading(false);
    }
  };

  const closeImportModal = () => {
    setImportModalOpen(false);
    setPreviewRows([]);
    resetFileInput();
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 relative">
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-[100] -translate-x-1/2 max-w-[90vw] rounded-lg bg-gray-900 px-4 py-3 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
        className="hidden"
        onChange={handleFileChange}
      />

      {importModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
              <h3 className="text-lg font-semibold text-gray-900">Excel Önizleme</h3>
              <button
                type="button"
                onClick={closeImportModal}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="overflow-auto p-4">
              <table className="w-full min-w-[720px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-left">
                    <th className="px-3 py-2 font-semibold text-gray-700">Cihaz Tipi</th>
                    <th className="px-3 py-2 font-semibold text-gray-700">Seri Numarası</th>
                    <th className="px-3 py-2 font-semibold text-gray-700">Müşteri Adı</th>
                    <th className="px-3 py-2 font-semibold text-gray-700">Model Adı</th>
                    <th className="px-3 py-2 font-semibold text-gray-700">Ürün Kodu</th>
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row, i) => (
                    <tr
                      key={i}
                      className={
                        row.isValid ? 'border-b border-gray-100' : 'border-b border-red-200 bg-red-50'
                      }
                    >
                      <td className="px-3 py-2">{row.device_type || '—'}</td>
                      <td className="px-3 py-2">{row.serial_number || '—'}</td>
                      <td className="px-3 py-2">{row.customer_name || '—'}</td>
                      <td className="px-3 py-2">{row.model || '—'}</td>
                      <td className="px-3 py-2">{row.custom_code ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {previewRows.length === 0 && (
                <p className="text-center text-gray-500 py-6">Veri yok</p>
              )}
            </div>
            <div className="flex justify-end gap-2 border-t border-gray-200 px-4 py-3">
              <button
                type="button"
                onClick={closeImportModal}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                İptal
              </button>
              <button
                type="button"
                disabled={importLoading || previewRows.filter((r) => r.isValid).length === 0}
                onClick={handleConfirmImport}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
              >
                {importLoading ? 'Kaydediliyor...' : 'Onayla ve Kaydet'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <h2 className="text-xl font-bold text-gray-900">Cihazlar</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openFilePicker}
            className="flex items-center gap-2 border border-green-600 text-green-700 bg-white px-4 py-2 rounded-lg hover:bg-green-50 transition-colors text-sm font-semibold"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Excel&apos;den İçe Aktar
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-semibold"
          >
            <Plus className="w-4 h-4" />
            Cihaz Ekle
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleAddDevice} className="mb-6 p-4 bg-gray-50 rounded-lg space-y-3">
          <div>
            <input
              type="text"
              value={deviceType}
              onChange={(e) => setDeviceType(e.target.value)}
              placeholder="Cihaz Tipi *"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-semibold"
            >
              Ekle
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
            >
              İptal
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {devices.map((device) => (
          <div
            key={device.id}
            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center text-green-600">
                <Wrench className="w-5 h-5" />
              </div>
              <div>
                <div className="font-semibold text-gray-900">
                  {device.device_type}
                </div>
              </div>
            </div>
            <button
              onClick={() => handleDelete(device.id)}
              className="text-red-500 hover:text-red-700 transition-colors p-2"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        ))}
        {devices.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            Henüz cihaz yok. Başlamak için bir tane ekleyin!
          </div>
        )}
      </div>
    </div>
  );
}
