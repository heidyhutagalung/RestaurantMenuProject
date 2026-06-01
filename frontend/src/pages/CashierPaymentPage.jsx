import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { orderApi, paymentApi } from '../utils/api';
import { formatRupiah } from '../utils/format';
import { useCartStore } from '../hooks/useCart';

export default function CashierPaymentPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const { currentOrder: storeOrder, clearCart, tableNumber, setCurrentOrder } = useCartStore();
  const [order, setOrder] = useState(storeOrder);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const intervalRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    async function init() {
      let activeOrder = storeOrder;
      const urlOrderNumber = searchParams.get('order');

      // If not in state, load from URL
      if (!activeOrder && urlOrderNumber) {
        setLoading(true);
        try {
          const orderRes = await orderApi.getOrder(urlOrderNumber);
          activeOrder = orderRes.data.data.order;
          if (isMounted) {
            setOrder(activeOrder);
            setCurrentOrder(activeOrder);
          }
        } catch (e) {
          console.error('Failed to restore order:', e);
          if (isMounted) setError('Gagal memuat detail pesanan');
        } finally {
          if (isMounted) setLoading(false);
        }
      }

      if (!activeOrder) {
        console.log('No order found, redirecting...');
        if (isMounted) navigate(`/menu?table=${tableNumber || 1}`, { replace: true });
        return;
      }

      // Poll payment status setiap 3 detik
      intervalRef.current = setInterval(async () => {
        try {
          const res = await paymentApi.checkStatus(activeOrder.order_number);
          const status = res.data.data.payment_status;
          if (status === 'paid') {
            clearInterval(intervalRef.current);
            clearCart();
            if (isMounted) {
              navigate('/success', { state: { order: activeOrder } });
            }
          }
        } catch (e) {
          console.error('Poll error:', e);
        }
      }, 3000);
    }

    init();

    return () => {
      isMounted = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex flex-col items-center justify-center p-6 text-center">
        <RefreshCw className="animate-spin text-brand-400 mb-3" size={32} />
        <p className="text-white text-sm">{t('loading')}</p>
      </div>
    );
  }

  if (!order) return null;

  const queueNumber = String(order.id || '').padStart(3, '0');

  return (
    <div className="min-h-screen bg-dark-900">
      <div className="bg-dark-800/80 backdrop-blur-sm border-b border-dark-700 px-4 py-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-dark-700 text-white">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-base font-bold text-white">{t('cashier_title')}</h1>
          <p className="text-xs text-dark-400 font-mono">{order.order_number}</p>
        </div>
      </div>

      <div className="px-4 py-6 space-y-4">
        <div className="card-dark p-8 text-center">
          <p className="text-xs text-dark-400 uppercase tracking-widest mb-3">{t('queue_number')}</p>
          <div className="font-display text-7xl font-bold text-brand-400 mb-2 tracking-wider">
            #{queueNumber}
          </div>
          <p className="text-xs text-dark-500 font-mono">{order.order_number}</p>
        </div>

        <div className="card-dark p-4 space-y-2.5">
          <div className="flex justify-between text-sm text-dark-300">
            <span>{t('subtotal')}</span>
            <span className="font-mono">{formatRupiah(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm text-dark-300">
            <span>{t('tax')}</span>
            <span className="font-mono">{formatRupiah(order.tax)}</span>
          </div>
          <div className="flex justify-between text-base font-bold text-white pt-2.5 border-t border-dark-600">
            <span>{t('total')}</span>
            <span className="text-brand-400 font-mono">{formatRupiah(order.total)}</span>
          </div>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 flex gap-3">
          <span className="text-blue-400 text-lg flex-shrink-0">💡</span>
          <p className="text-sm text-blue-300/80 leading-relaxed">{t('go_to_cashier')}</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex gap-3">
            <span className="text-red-400 text-lg flex-shrink-0">⚠️</span>
            <p className="text-sm text-red-300/80 leading-relaxed">{error}</p>
          </div>
        )}

        <div className="card-dark p-6 flex flex-col items-center justify-center gap-3">
          <RefreshCw className="animate-spin text-brand-400" size={24} />
          <p className="text-sm font-semibold text-white">{t('checking_payment')}</p>
          <p className="text-xs text-dark-300 text-center">Pesanan akan otomatis diproses setelah kasir menerima pembayaran Anda.</p>
        </div>
      </div>
    </div>
  );
}
