import { useEffect, useRef, useState } from 'react';
import { Plus, Trash2, Package, FileSpreadsheet, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabase';
import type { Part } from '../lib/database.types';

type PreviewRow = {
  name: string;
  part_code: string;
  notes: string;
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

/** Excel ilk satır başlık: Parça Adı | Stok Kodu | Notlar */
export function PartsList() {
  const [parts, setParts] = useState<Part[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [partCode, setPartCode] = useState('');
  const [notes, setNotes] = useState('');

  const [importModalOpen, setImportModalOpen] = useState(false);
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
  const [importLoading, setImportLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchParts();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(t);
  }, [toast]);

  const fetchParts = async () => {
    try {
      const { data, error } = await supabase.from('parts').select('*').order('name');
      if (error) throw error;
      setParts(data || []);
    } catch (error) {
      console.error('Error fetching parts:', error);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      const { error } = await supabase.from('parts').insert([
        {
          name: name.trim(),
          part_code: partCode.trim(),
          notes: notes.trim(),
        },
      ]);
      if (error) throw error;
      setName('');
      setPartCode('');
      setNotes('');
      setShowForm(false);
      fetchParts();
    } catch (error) {
      console.error('Error adding part:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu parçayı silmek istediğinizden emin misiniz?')) return;
    try {
      const { error } = await supabase.from('parts').delete().eq('id', id);
      if (error) throw error;
      fetchParts();
    } catch (error) {
      console.error('Error deleting part:', error);
    }
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
      const n = row[0] != null ? String(row[0]).trim() : '';
      const code = row[1] != null ? String(row[1]).trim() : '';
      const note = row[2] != null ? String(row[2]).trim() : '';
      return {
        name: n,
        part_code: code,
        notes: note,
        isValid: n.length > 0,
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
      setToast('Kaydedilecek geçerli satır yok (Parça Adı zorunlu).');
      return;
    }

    const payloads = validRows.map((r) => ({
      name: r.name,
      part_code: r.part_code || '',
      notes: r.notes || '',
    }));

    setImportLoading(true);
    try {
      const { error } = await supabase.from('parts').insert(payloads);

      if (!error) {
        setToast(`${validRows.length} parça başarıyla eklendi`);
        setImportModalOpen(false);
        setPreviewRows([]);
        resetFileInput();
        await fetchParts();
        return;
      }

      if (isDuplicateError(error)) {
        let success = 0;
        const failed: string[] = [];
        for (const p of payloads) {
          const { error: rowErr } = await supabase.from('parts').insert([p]);
          if (rowErr) {
            failed.push(p.name);
          } else {
            success += 1;
          }
        }
        const partsMsg: string[] = [];
        if (success > 0) partsMsg.push(`${success} parça eklendi`);
        if (failed.length > 0) partsMsg.push(`Atlanan / hatalı: ${failed.slice(0, 10).join(', ')}${failed.length > 10 ? '…' : ''}`);
        setToast(partsMsg.join(' — '));
        setImportModalOpen(false);
        setPreviewRows([]);
        resetFileInput();
        await fetchParts();
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
          <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
              <h3 className="text-lg font-semibold text-gray-900">Parça listesi — Excel önizleme</h3>
              <button
                type="button"
                onClick={closeImportModal}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="px-4 pt-3 text-sm text-gray-600">
              İlk satır başlık olmalı: <strong>Parça Adı</strong> | <strong>Stok Kodu</strong> |{' '}
              <strong>Notlar</strong>
            </p>
            <div className="overflow-auto p-4">
              <table className="w-full min-w-[480px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-left">
                    <th className="px-3 py-2 font-semibold text-gray-700">Parça Adı</th>
                    <th className="px-3 py-2 font-semibold text-gray-700">Stok Kodu</th>
                    <th className="px-3 py-2 font-semibold text-gray-700">Notlar</th>
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
                      <td className="px-3 py-2">{row.name || '—'}</td>
                      <td className="px-3 py-2">{row.part_code || '—'}</td>
                      <td className="px-3 py-2">{row.notes || '—'}</td>
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
                className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
              >
                {importLoading ? 'Kaydediliyor...' : 'Onayla ve Kaydet'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Parça listesi</h2>
          <p className="text-sm text-gray-600 mt-1">
            Stok ve yedek parça kayıtları burada tutulur. Excel ile toplu içe aktarabilirsiniz.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 border border-amber-600 text-amber-800 bg-white px-4 py-2 rounded-lg hover:bg-amber-50 transition-colors text-sm font-semibold"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Excel&apos;den içe aktar
          </button>
          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors text-sm font-semibold"
          >
            <Plus className="w-4 h-4" />
            Parça ekle
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="mb-6 p-4 bg-amber-50/80 rounded-lg space-y-3 border border-amber-100">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Parça adı *"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            required
          />
          <input
            type="text"
            value={partCode}
            onChange={(e) => setPartCode(e.target.value)}
            placeholder="Stok / ürün kodu"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notlar"
            rows={2}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-y min-h-[72px]"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors font-semibold"
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
        {parts.map((part) => (
          <div
            key={part.id}
            className="flex items-start justify-between gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-10 h-10 shrink-0 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700">
                <Package className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-gray-900">{part.name}</div>
                {part.part_code ? (
                  <div className="text-sm text-gray-600">Kod: {part.part_code}</div>
                ) : null}
                {part.notes ? <div className="text-sm text-gray-500 mt-1">{part.notes}</div> : null}
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleDelete(part.id)}
              className="text-red-500 hover:text-red-700 transition-colors p-2 shrink-0"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        ))}
        {parts.length === 0 && (
          <div className="text-center text-gray-500 py-8">Henüz parça kaydı yok.</div>
        )}
      </div>
    </div>
  );
}
