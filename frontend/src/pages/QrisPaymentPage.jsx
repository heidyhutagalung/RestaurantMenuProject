import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, CheckCircle2, RefreshCw, Clock } from 'lucide-react';
import { orderApi, paymentApi } from '../utils/api';
import { formatRupiah } from '../utils/format';
import { useCartStore } from '../hooks/useCart';

export default function QrisPaymentPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const { currentOrder: storeOrder, currentPayment: storePayment, clearCart, tableNumber, setCurrentOrder, setCurrentPayment } = useCartStore();
  const [order, setOrder] = useState(storeOrder);
  const [payment, setPayment] = useState(storePayment);

  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [snapLoaded, setSnapLoaded] = useState(false);
  const intervalRef = useRef(null);
  const snapScriptRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    async function init() {
      let activeOrder = storeOrder;
      let activePayment = storePayment;

      const urlOrderNumber = searchParams.get('order');

      // If not in state, load from URL
      if (!activeOrder && urlOrderNumber) {
        try {
          const orderRes = await orderApi.getOrder(urlOrderNumber);
          activeOrder = orderRes.data.data.order;
          if (isMounted) {
            setOrder(activeOrder);
            setCurrentOrder(activeOrder);
          }
        } catch (e) {
          console.error('Failed to restore order:', e);
        }
      }

      if (activeOrder && !activePayment) {
        try {
          const payRes = await paymentApi.createQris(activeOrder.order_number);
          activePayment = payRes.data.data;
          if (isMounted) {
            setPayment(activePayment);
            setCurrentPayment(activePayment);
          }
        } catch (e) {
          console.error('Failed to restore payment:', e);
        }
      }

      if (!activeOrder || !activePayment) {
        console.log('No order or payment found, redirecting...');
        if (isMounted) navigate(`/menu?table=${tableNumber || 1}`, { replace: true });
        return;
      }

      if (activePayment.qr_data_url) {
        if (isMounted) setSnapLoaded(true);
      } else {
        // Load Midtrans Snap JS
        const snapUrl = activePayment.is_production
          ? 'https://app.midtrans.com/snap/snap.js'
          : 'https://app.sandbox.midtrans.com/snap/snap.js';

        const script = document.createElement('script');
        script.src = snapUrl;
        script.setAttribute('data-client-key', activePayment.client_key);
        script.onload = () => {
          console.log('Snap loaded ✅');
          if (isMounted) setSnapLoaded(true);
        };
        script.onerror = () => console.error('Failed to load Snap');
        document.head.appendChild(script);
        snapScriptRef.current = script;
      }

      // Poll payment status setiap 3 detik
      intervalRef.current = setInterval(async () => {
        try {
          const res = await paymentApi.checkStatus(activeOrder.order_number);
          const status = res.data.data.payment_status;
          if (status === 'paid') {
            if (isMounted) setPaymentStatus('paid');
            clearInterval(intervalRef.current);
            clearCart();
            if (isMounted) setTimeout(() => navigate('/success', { state: { order: activeOrder } }), 1500);
          } else if (status === 'failed') {
            if (isMounted) setPaymentStatus('failed');
            clearInterval(intervalRef.current);
          }
        } catch (e) { console.error('Poll error:', e); }
      }, 3000);
    }

    init();

    return () => {
      isMounted = false;
      clearInterval(intervalRef.current);
      if (snapScriptRef.current && document.head.contains(snapScriptRef.current)) {
        document.head.removeChild(snapScriptRef.current);
      }
    };
  }, []);

  function openSnap() {
    if (payment?.qr_data_url) {
      console.warn('Direct QRIS mode does not use Midtrans Snap. Scan the QR image instead.');
      return;
    }

    if (!snapLoaded || !window.snap || !payment?.token) {
      console.warn('Snap not ready:', { snapLoaded, hasSnap: !!window.snap, token: payment?.token });
      return;
    }
    window.snap.pay(payment.token, {
      onSuccess: (result) => {
        console.log('Payment success:', result);
        setPaymentStatus('paid');
        clearCart();
        navigate('/success', { state: { order } });
      },
      onPending: (result) => console.log('Payment pending:', result),
      onError: (result) => {
        console.error('Payment error:', result);
        setPaymentStatus('failed');
      },
      onClose: () => console.log('Snap closed'),
    });
  }

  if (!order) return null;

  return (
    <div className="min-h-screen bg-dark-900">
      <div className="bg-dark-800/80 backdrop-blur-sm border-b border-dark-700 px-4 py-4 flex items-center gap-3 sticky top-0">
        <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-dark-700 text-white">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-base font-bold text-white">{t('qris_payment')}</h1>
          <p className="text-xs text-dark-400 font-mono">{order.order_number}</p>
        </div>
      </div>

      <div className="px-4 py-6 space-y-4">
        {paymentStatus === 'paid' ? (
          <div className="flex flex-col items-center justify-center py-16 animate-scale-in">
            <CheckCircle2 size={64} className="text-brand-400 mb-4" strokeWidth={1.5} />
            <h2 className="font-display text-2xl font-bold text-white">{t('payment_success')}</h2>
          </div>
        ) : paymentStatus === 'failed' ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="text-6xl mb-4">❌</span>
            <h2 className="font-display text-xl font-bold text-white mb-2">Pembayaran Gagal</h2>
            <p className="text-dark-300 text-sm mb-6">Silakan coba lagi</p>
            <button onClick={() => navigate('/order')} className="btn-primary max-w-xs">Kembali</button>
          </div>
        ) : (
          <>
            <div className="card-dark p-6 text-center">
              <div className="flex items-center justify-center gap-2 text-amber-400 text-xs mb-4 font-semibold">
                <Clock size={13} />
                <span>{t('valid_minutes')}</span>
              </div>
              {payment?.qr_data_url ? (
                <div className="mb-5">
                  <img src={payment.qr_data_url} alt="QRIS" className="mx-auto mb-5 w-64 h-64 object-contain rounded-2xl border border-dark-600" />
                  <p className="text-sm text-white font-semibold mb-2">{t('scan_qris')}</p>
                  <p className="text-xs text-dark-400">Tunjukkan QR ini ke aplikasi pembayaran Anda.</p>
                </div>
              ) : (
                <div className="w-44 h-44 bg-dark-700 rounded-2xl mx-auto flex flex-col items-center justify-center mb-5 border border-dark-600">
                  <span className="text-5xl mb-2">📱</span>
                  <p className="text-xs text-dark-400 px-4 text-center">{t('scan_qris')}</p>
                </div>
              )}
              <p className="text-xs text-dark-400 mb-1">{t('amount_to_pay')}</p>
              <p className="font-display text-3xl font-bold text-brand-400 font-mono mb-6">
                {formatRupiah(payment?.total || order.total)}
              </p>
              {!payment?.qr_data_url ? (
                <button
                  onClick={openSnap}
                  disabled={!snapLoaded}
                  className="btn-primary mb-4"
                >
                  {snapLoaded ? '💳 Buka Halaman Pembayaran' : (
                    <span className="flex items-center justify-center gap-2">
                      <RefreshCw size={14} className="animate-spin" /> Memuat...
                    </span>
                  )}
                </button>
              ) : (
                <button
                  onClick={async () => {
                    try {
                      const res = await orderApi.confirmCashier(order.order_number);
                      if (res.data?.success) {
                        setPaymentStatus('paid');
                        clearCart();
                        navigate('/success', { state: { order } });
                      }
                    } catch (error) {
                      console.error('Manual confirm failed', error);
                    }
                  }}
                  className="btn-primary mb-4"
                >
                  Konfirmasi Pembayaran Manual
                </button>
              )}
              <div className="flex items-center justify-center gap-2 text-dark-400 text-xs">
                <RefreshCw size={11} className="animate-spin" />
                <span>{t('checking_payment')}</span>
              </div>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex gap-3">
              <span className="text-amber-400 text-lg flex-shrink-0">ℹ️</span>
              <p className="text-sm text-amber-300/80 leading-relaxed">{t('qris_info')}</p>
            </div>

            <div className="card-dark p-4">
              <p className="text-xs text-dark-400 mb-3 text-center uppercase tracking-widest">Didukung oleh</p>
              <div className="flex justify-center gap-2 flex-wrap">
                {['GoPay','OVO','Dana','ShopeePay','LinkAja','BCA','Mandiri'].map(app => (
                  <span key={app} className="text-xs text-dark-300 bg-dark-700 px-2.5 py-1 rounded-full">{app}</span>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
