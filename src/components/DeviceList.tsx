import { useEffect, useState } from 'react';
import { Plus, Trash2, Wrench } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Device } from '../lib/database.types';

export function DeviceList() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [deviceType, setDeviceType] = useState('');

  useEffect(() => {
    fetchDevices();
  }, []);

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
      // Generate a unique serial number using UUID
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

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Cihazlar</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-semibold"
        >
          <Plus className="w-4 h-4" />
          Cihaz Ekle
        </button>
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
