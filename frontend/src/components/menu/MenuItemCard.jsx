import { useTranslation } from 'react-i18next';
import { Plus, Minus } from 'lucide-react';
import { useCartStore } from '../../hooks/useCart';
import { formatRupiah } from '../../utils/format';

export default function MenuItemCard({ item }) {
  const { t } = useTranslation();
  const { items, addItem, removeItem } = useCartStore();
  const cartItem = items.find(i => i.menu_item_id === item.id);
  const qty = cartItem?.quantity || 0;

  return (
    <div className="card-dark p-3 flex gap-3 items-center animate-slide-up hover:border-dark-500 transition-colors">
      {/* Image */}
      <div className="w-[72px] h-[72px] rounded-xl overflow-hidden flex-shrink-0 bg-dark-700">
        {item.image_url ? (
          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">{item.image_emoji}</div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white leading-snug mb-1 truncate">{item.name}</p>
        <div className="flex gap-1 mb-1.5 flex-wrap">
          {item.is_best_seller && <span className="badge-best">⭐ {t('best_seller')}</span>}
          {item.is_spicy && <span className="badge-spicy">🌶 {t('spicy')}</span>}
        </div>
        {item.description && (
          <p className="text-xs text-dark-200 leading-relaxed line-clamp-1 mb-1.5">{item.description}</p>
        )}
        <span className="text-sm font-bold text-brand-400 font-mono">{formatRupiah(item.price)}</span>
      </div>

      {/* Qty control */}
      <div className="flex-shrink-0">
        {qty === 0 ? (
          <button
            onClick={() => addItem(item)}
            className="w-9 h-9 rounded-full bg-brand-500 text-white flex items-center justify-center
                       active:scale-90 transition-all shadow-lg shadow-brand-500/30"
          >
            <Plus size={18} strokeWidth={2.5} />
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button onClick={() => removeItem(item.id)}
              className="w-8 h-8 rounded-full border border-dark-500 text-white flex items-center justify-center active:scale-90 transition-all bg-dark-700">
              <Minus size={13} />
            </button>
            <span className="text-sm font-bold text-white min-w-[18px] text-center font-mono">{qty}</span>
            <button onClick={() => addItem(item)}
              className="w-8 h-8 rounded-full bg-brand-500 text-white flex items-center justify-center active:scale-90 transition-all">
              <Plus size={13} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
