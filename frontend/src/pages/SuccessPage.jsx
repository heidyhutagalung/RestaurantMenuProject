import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckCircle2 } from 'lucide-react';
import { useCartStore } from '../hooks/useCart';

export default function SuccessPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { state } = useLocation();
  const tableNumber = useCartStore(s => s.tableNumber);
  const order = state?.order;

  return (
    <div className="min-h-screen bg-dark-900 flex flex-col items-center justify-center px-6 text-center relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-brand-500/5 via-transparent to-transparent" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-brand-500/8 rounded-full blur-3xl" />

      <div className="relative animate-scale-in">
        <div className="w-24 h-24 bg-brand-500/20 border border-brand-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={48} className="text-brand-400" strokeWidth={1.5} />
        </div>

        <h1 className="font-display text-3xl font-bold text-white mb-3">{t('order_success')}</h1>
        <p className="text-dark-300 text-sm leading-relaxed mb-8 max-w-xs">
          {t('order_processing')}<br />
          <span className="text-brand-400 font-semibold">{t('estimated_time')}</span>
        </p>

        {order && (
          <div className="card-dark p-5 mb-6 w-full max-w-xs mx-auto">
            <p className="text-xs text-dark-300 mb-1 uppercase tracking-widest">{t('order_number')}</p>
            <p className="font-mono text-lg font-bold text-white mb-3">{order.order_number}</p>
            <div className="w-8 h-px bg-dark-600 mx-auto mb-3" />
            <p className="text-sm text-dark-200">{t('table')} <span className="text-white font-bold">{order.table_number || tableNumber}</span></p>
          </div>
        )}

        <p className="text-dark-400 text-sm mb-8">{t('thank_you')}</p>
        <button onClick={() => navigate(`/menu?table=${tableNumber || 1}`)} className="btn-primary max-w-xs">
          {t('back_to_menu')}
        </button>
      </div>
    </div>
  );
}
