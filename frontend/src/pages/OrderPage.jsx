import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, QrCode, Wallet, Plus, Minus, Trash2 } from 'lucide-react';
import { useCartStore } from '../hooks/useCart';
import { orderApi, paymentApi } from '../utils/api';
import { formatRupiah } from '../utils/format';

export default function OrderPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { items, tableNumber, notes, setNotes, addItem, removeItem, setCurrentOrder, setCurrentPayment } = useCartStore();
  const [paymentMethod, setPaymentMethod] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const isSubmitting = useRef(false);

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const tax = Math.round(subtotal * 0.1);
  const total = subtotal + tax;

  if (items.length === 0) return (
    <div className="min-h-screen bg-dark-900 flex flex-col items-center justify-center px-8 text-center">
      <span className="text-6xl mb-4">🛒</span>
      <h2 className="text-xl font-bold text-white mb-2">{t('cart_empty')}</h2>
      <p className="text-dark-300 text-sm mb-6">{t('cart_empty_sub')}</p>
      <button onClick={() => navigate(`/menu?table=${tableNumber || 1}`)} className="btn-primary max-w-xs">{t('back')}</button>
    </div>
  );

  async function handleConfirm() {
    if (!paymentMethod || isSubmitting.current) return;
    isSubmitting.current = true;
    setLoading(true);
    setError('');

    try {
      // Step 1: buat order
      const orderRes = await orderApi.createOrder({
        table_number: tableNumber,
        payment_method: paymentMethod,
        customer_notes: notes,
        items: items.map(i => ({ menu_item_id: i.menu_item_id, quantity: i.quantity })),
      });
      const order = orderRes.data.data.order;

      // Simpan order ke store
      setCurrentOrder(order);

      if (paymentMethod === 'qris') {
        // Step 2: buat transaksi Midtrans
        const payRes = await paymentApi.createQris(order.order_number);
        const payment = payRes.data.data;
        setCurrentPayment(payment);
        // Navigate tanpa state — data sudah di store
        navigate(`/payment/qris?order=${order.order_number}`);
      } else {
        navigate(`/payment/cashier?order=${order.order_number}`);
      }
    } catch (e) {
      console.error('Order error:', e.response?.data || e.message);
      setError(e.response?.data?.message || 'Gagal membuat pesanan. Coba lagi.');
      isSubmitting.current = false;
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-dark-900 pb-32">
      <div className="bg-dark-800/80 backdrop-blur-sm border-b border-dark-700 px-4 py-4 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-dark-700 text-white">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-base font-bold text-white">{t('your_order')}</h1>
          <p className="text-xs text-dark-300">{t('table')} {tableNumber}</p>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        <div className="card-dark p-4">
          <p className="label-text">{t('order_summary')}</p>
          <div className="divide-y divide-dark-700">
            {items.map(item => (
              <div key={item.menu_item_id} className="flex items-center gap-3 py-3">
                <div className="w-10 h-10 rounded-xl bg-dark-700 flex items-center justify-center text-xl flex-shrink-0 overflow-hidden">
                  {item.image_url
                    ? <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                    : item.image_emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{item.name}</p>
                  <p className="text-xs text-brand-400 font-mono font-semibold">{formatRupiah(item.price)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => removeItem(item.menu_item_id)}
                    className="w-7 h-7 rounded-full border border-dark-500 flex items-center justify-center text-dark-200 active:scale-90 bg-dark-700">
                    {item.quantity === 1 ? <Trash2 size={11} /> : <Minus size={11} />}
                  </button>
                  <span className="text-sm font-bold text-white w-5 text-center font-mono">{item.quantity}</span>
                  <button onClick={() => addItem({ id: item.menu_item_id, name: item.name, price: item.price, image_emoji: item.image_emoji, image_url: item.image_url })}
                    className="w-7 h-7 rounded-full bg-brand-500 text-white flex items-center justify-center active:scale-90">
                    <Plus size={11} />
                  </button>
                </div>
                <span className="text-sm font-bold text-white min-w-[64px] text-right font-mono">{formatRupiah(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card-dark p-4">
          <p className="label-text">Catatan</p>
          <textarea value={notes} onChange={e => setNotes(e.target.value)}
            placeholder={t('notes_placeholder')} rows={2}
            className="w-full bg-transparent text-sm text-white placeholder-dark-400 resize-none outline-none" />
        </div>

        <div className="card-dark p-4 space-y-2.5">
          <div className="flex justify-between text-sm text-dark-200">
            <span>{t('subtotal')}</span><span className="font-mono">{formatRupiah(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm text-dark-200">
            <span>{t('tax')}</span><span className="font-mono">{formatRupiah(tax)}</span>
          </div>
          <div className="flex justify-between text-base font-bold text-white pt-2.5 border-t border-dark-600">
            <span>{t('total')}</span>
            <span className="text-brand-400 font-mono">{formatRupiah(total)}</span>
          </div>
        </div>

        <div className="card-dark p-4">
          <p className="label-text">{t('payment_method')}</p>
          <div className="space-y-2.5">
            {[
              { key: 'qris',    icon: <QrCode size={22}/>, iconBg: 'bg-violet-500/20 text-violet-400', title: t('pay_qris'),    desc: t('pay_qris_desc') },
              { key: 'cashier', icon: <Wallet size={22}/>, iconBg: 'bg-blue-500/20 text-blue-400',     title: t('pay_cashier'), desc: t('pay_cashier_desc') },
            ].map(opt => (
              <button key={opt.key} onClick={() => setPaymentMethod(opt.key)}
                className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all text-left
                  ${paymentMethod === opt.key ? 'border-brand-500 bg-brand-500/10' : 'border-dark-600 bg-dark-700 hover:border-dark-500'}`}>
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${opt.iconBg}`}>
                  {opt.icon}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-white">{opt.title}</p>
                  <p className="text-xs text-dark-300 mt-0.5">{opt.desc}</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0
                  ${paymentMethod === opt.key ? 'border-brand-500' : 'border-dark-500'}`}>
                  {paymentMethod === opt.key && <div className="w-2.5 h-2.5 rounded-full bg-brand-500" />}
                </div>
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
            <p className="text-red-400 text-sm text-center">{error}</p>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 px-4 pb-safe pt-3 bg-dark-900/95 backdrop-blur-sm border-t border-dark-700">
        <button onClick={handleConfirm} disabled={!paymentMethod || loading} className="btn-primary">
          {loading
            ? <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeLinecap="round"/>
                </svg>
                {t('processing')}
              </span>
            : !paymentMethod ? t('select_payment')
            : `${t('confirm_order')} · ${formatRupiah(total)}`
          }
        </button>
      </div>
    </div>
  );
}
