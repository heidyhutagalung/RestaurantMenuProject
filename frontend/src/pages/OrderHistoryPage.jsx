import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCartStore } from '../hooks/useCart';
import { orderApi } from '../utils/api';
import { formatRupiah, formatDate } from '../utils/format';

// Helper untuk waktu relatif (menggunakan formatDate dari utils untuk parsing)
function formatRelativeTime(dateStr, currentTime, lang = 'id') {
  // Parse menggunakan helper yang sama dengan utils/format.js
  function parseDate(dateStr) {
    if (dateStr instanceof Date) return dateStr;
    if (typeof dateStr !== 'string') return new Date(dateStr);
    const sqliteUtcDatetime = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
    if (sqliteUtcDatetime.test(dateStr)) {
      return new Date(dateStr.replace(' ', 'T') + 'Z');
    }
    return new Date(dateStr);
  }

  const date = parseDate(dateStr);
  const now = new Date(currentTime);
  const diff = Math.floor((now - date) / 1000); // dalam detik
  
  if (diff < 60) return lang === 'id' ? 'Sekarang' : 'Just now';
  if (diff < 3600) {
    const mins = Math.floor(diff / 60);
    return lang === 'id' ? `${mins} menit lalu` : `${mins} min ago`;
  }
  if (diff < 86400) {
    const hours = Math.floor(diff / 3600);
    return lang === 'id' ? `${hours} jam lalu` : `${hours} hour${hours > 1 ? 's' : ''} ago`;
  }
  if (diff < 604800) {
    const days = Math.floor(diff / 86400);
    return lang === 'id' ? `${days} hari lalu` : `${days} day${days > 1 ? 's' : ''} ago`;
  }
  return date.toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', { month: 'short', day: 'numeric' });
}

export default function OrderHistoryPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const tableNumber = useCartStore(s => s.tableNumber) || 1;
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState({});
  const [timeNow, setTimeNow] = useState(new Date());

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const res = await orderApi.getAllOrders({ table: tableNumber });
        if (mounted) setOrders(res.data.data || []);
      } catch (err) {
        console.error('Failed to load order history', err);
      } finally { if (mounted) setLoading(false); }
    }
    load();
    return () => { mounted = false; };
  }, [tableNumber]);

  useEffect(() => {
    const interval = setInterval(() => setTimeNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  async function toggleDetails(orderNumber) {
    if (expanded[orderNumber]) {
      setExpanded(prev => { const c = { ...prev }; delete c[orderNumber]; return c; });
      return;
    }
    try {
      const res = await orderApi.getOrder(orderNumber);
      setExpanded(prev => ({ ...prev, [orderNumber]: res.data.data }));
    } catch (err) { console.error('Failed to load order', err); }
  }

  const fullDateTime = (dateStr) => {
    return formatDate(dateStr);
  };

  return (
    <div className="min-h-screen bg-dark-900 pb-28">
      <div className="relative overflow-hidden noise">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-600/20 via-dark-900 to-dark-900" />
        <div className="relative px-4 pt-12 pb-6 flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-white">Riwayat Pesanan</h1>
            <p className="text-dark-300 text-sm">Meja {tableNumber}</p>
            <p className="text-xs text-brand-300 mt-2 font-mono">
              Jam sekarang: {timeNow.toLocaleTimeString(i18n.language === 'id' ? 'id-ID' : 'en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/admin')} className="btn-secondary">Kembali</button>
          </div>
        </div>
      </div>

      <div className="px-4 py-4">
        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-20 skeleton rounded-2xl" />)}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16 text-dark-400">Belum ada riwayat pesanan</div>
        ) : (
          <div className="space-y-3">
            {orders.map(o => (
              <div key={o.order_number} className="card-dark p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm text-white font-mono font-bold">{o.order_number}</p>
                    <div className="group cursor-help">
                      <p className="text-xs text-brand-300 font-medium">{formatRelativeTime(o.created_at, timeNow, i18n.language)}</p>
                      <p className="text-xs text-dark-500 opacity-0 group-hover:opacity-100 transition-opacity">{fullDateTime(o.created_at)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-bold text-brand-400 font-mono">{formatRupiah(o.total)}</p>
                    <p className="text-xs text-dark-300">{o.status} · {o.payment_status}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleDetails(o.order_number)} className="btn-secondary">{expanded[o.order_number] ? 'Tutup' : 'Detil'}</button>
                </div>
                {expanded[o.order_number] && (
                  <div className="mt-3 border-t border-dark-700 pt-3">
                    {expanded[o.order_number].items.map(item => {
                      const displayName = (i18n.language === 'en' ? item.name_en : item.name_id) || item.name_id || item.menu_item_id;
                      return (
                        <div key={item.menu_item_id} className="flex justify-between text-sm mb-2">
                          <div>
                            <p className="text-white">{displayName} x{item.quantity}</p>
                            {item.notes && <p className="text-xs text-dark-400">{item.notes}</p>}
                          </div>
                          <div className="font-mono">{formatRupiah(item.subtotal)}</div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
