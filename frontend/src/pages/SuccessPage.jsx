import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, Printer } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { useCartStore } from '../hooks/useCart';
import { orderApi } from '../utils/api';
import { formatRupiah } from '../utils/format';

export default function SuccessPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { state } = useLocation();
  const tableNumber = useCartStore(s => s.tableNumber);
  const order = state?.order;
  const [orderItems, setOrderItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!order?.order_number) return;
    async function loadOrderItems() {
      setLoading(true);
      try {
        const res = await orderApi.getOrder(order.order_number);
        setOrderItems(res.data.data.items || []);
      } catch (err) {
        console.error('Failed to load order items', err);
      } finally {
        setLoading(false);
      }
    }
    loadOrderItems();
  }, [order]);

  const getItemName = (item) => {
    if (i18n.language === 'en') {
      return item.name_en || item.name_id || item.menu_item_id;
    }
    return item.name_id || item.name_en || item.menu_item_id;
  };

  const downloadReceipt = () => {
    if (!order) return;

    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const lineHeight = 18;
    let y = 40;

    doc.setFontSize(16);
    doc.text('STRUK PESANAN', 40, y);

    doc.setFontSize(10);
    y += lineHeight * 2;
    doc.text(`Nomor Pesanan: ${order.order_number}`, 40, y);
    y += lineHeight;
    doc.text(`Meja: ${order.table_number || tableNumber}`, 40, y);
    y += lineHeight;
    doc.text('------------------------------', 40, y);

    orderItems.forEach(item => {
      y += lineHeight;
      doc.text(`${getItemName(item)} x${item.quantity}`, 40, y);
      doc.text(`${formatRupiah(item.unit_price)}  subtotal: ${formatRupiah(item.subtotal)}`, 40, y + lineHeight);
      y += lineHeight;
    });

    y += lineHeight;
    doc.text('------------------------------', 40, y);
    y += lineHeight;
    doc.text(`Subtotal: ${formatRupiah(order.subtotal)}`, 40, y);
    y += lineHeight;
    doc.text(`Pajak (10%): ${formatRupiah(order.tax)}`, 40, y);
    y += lineHeight;
    doc.text(`Total: ${formatRupiah(order.total)}`, 40, y);
    y += lineHeight * 2;
    doc.text('Terima kasih sudah makan di sini!', 40, y);

    doc.save(`struk-${order.order_number}.pdf`);
  };

  return (
    <div className="min-h-screen bg-dark-900 flex flex-col items-center justify-center px-6 text-center relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-brand-500/5 via-transparent to-transparent print:hidden" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-brand-500/8 rounded-full blur-3xl print:hidden" />

      <div className="relative animate-scale-in w-full max-w-md print:max-w-full">
        <div className="w-24 h-24 bg-brand-500/20 border border-brand-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={48} className="text-brand-400" strokeWidth={1.5} />
        </div>

        <h1 className="font-display text-3xl font-bold text-white mb-3">{t('order_success')}</h1>
        <p className="text-dark-300 text-sm leading-relaxed mb-8 max-w-xs mx-auto">
          {t('order_processing')}<br />
          <span className="text-brand-400 font-semibold">{t('estimated_time')}</span>
        </p>

        {order && (
          <div className="card-dark p-5 mb-6">
            <div className="flex items-center justify-between mb-4 gap-4">
              <div>
                <p className="text-xs text-dark-300 uppercase tracking-widest mb-1">{t('order_number')}</p>
                <p className="font-mono text-lg font-bold text-white">{order.order_number}</p>
              </div>
              <button onClick={downloadReceipt} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-brand-500 text-white text-xs font-semibold no-print">
                <Printer size={14} /> {t('download_receipt')}
              </button>
            </div>

            <p className="text-sm text-dark-200 mb-4">{t('table')} <span className="text-white font-bold">{order.table_number || tableNumber}</span></p>

            <div className="space-y-3">
              {loading ? (
                <p className="text-sm text-dark-400">Memuat detail pesanan...</p>
              ) : orderItems.length > 0 ? (
                <div className="space-y-3">
                  {orderItems.map(item => (
                    <div key={`${item.menu_item_id}-${item.notes || ''}`} className="flex items-center justify-between gap-3">
                      <div className="text-left">
                        <p className="text-sm text-white font-medium">{getItemName(item)}</p>
                        <p className="text-xs text-dark-400">x{item.quantity} · {formatRupiah(item.unit_price)}</p>
                      </div>
                      <p className="text-sm font-semibold text-white">{formatRupiah(item.subtotal)}</p>
                    </div>
                  ))}
                  <div className="pt-3 border-t border-dark-700">
                    <div className="flex justify-between text-sm text-dark-300">
                      <span>{t('subtotal')}</span>
                      <span className="font-mono">{formatRupiah(order.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-dark-300">
                      <span>{t('tax')}</span>
                      <span className="font-mono">{formatRupiah(order.tax)}</span>
                    </div>
                    <div className="flex justify-between text-base font-bold text-white pt-3">
                      <span>{t('total')}</span>
                      <span className="font-mono">{formatRupiah(order.total)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-dark-400">{t('no_order_details')}</p>
              )}
            </div>
          </div>
        )}

        <p className="text-dark-400 text-sm mb-8">{t('thank_you')}</p>
        <button onClick={() => navigate(`/menu?table=${tableNumber || 1}`)} className="btn-primary max-w-xs mx-auto no-print">
          {t('back_to_menu')}
        </button>
      </div>
    </div>
  );
}
