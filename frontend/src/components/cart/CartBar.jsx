import { useTranslation } from 'react-i18next';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { useCartStore } from '../../hooks/useCart';
import { formatRupiah } from '../../utils/format';
import { useNavigate } from 'react-router-dom';

export default function CartBar() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const items = useCartStore(s => s.items);
  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);

  if (totalItems === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-safe pt-2">
      <button
        onClick={() => navigate('/order')}
        className="w-full flex items-center justify-between bg-brand-500
                   px-5 py-4 rounded-2xl shadow-2xl shadow-brand-500/40 active:scale-[0.98] transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <ShoppingBag size={20} className="text-white" />
            <span className="absolute -top-2 -right-2 w-4 h-4 bg-white text-brand-600 text-[10px] font-bold rounded-full flex items-center justify-center">
              {totalItems}
            </span>
          </div>
          <span className="font-semibold text-white">{t('view_order')}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-bold text-white font-mono">{formatRupiah(subtotal)}</span>
          <ArrowRight size={16} className="text-white/70" />
        </div>
      </button>
    </div>
  );
}
