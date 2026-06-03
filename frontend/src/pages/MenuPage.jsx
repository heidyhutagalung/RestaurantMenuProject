import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, X } from 'lucide-react';
import { menuApi } from '../utils/api';
import { useCartStore } from '../hooks/useCart';
import MenuItemCard from '../components/menu/MenuItemCard';
import CartBar from '../components/cart/CartBar';
import LangSwitcher from '../components/shared/LangSwitcher';

export default function MenuPage() {
  const { t, i18n } = useTranslation();
  const [searchParams] = useSearchParams();
  const tableNumber = searchParams.get('table') || '1';
  const setTableNumber = useCartStore(s => s.setTableNumber);

  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchMenu = useCallback(async () => {
    setLoading(true);
    try {
      const res = await menuApi.getMenu(i18n.language);
      setCategories(res.data.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [i18n.language]);

  useEffect(() => {
    setTableNumber(parseInt(tableNumber));
    fetchMenu();
  }, [tableNumber, fetchMenu, setTableNumber]);

  const displayCategories = (activeCategory === 'all' ? categories : categories.filter(c => c.id === activeCategory))
    .map(c => ({ ...c, filteredItems: c.items.filter(i => !search || i.name.toLowerCase().includes(search.toLowerCase())) }))
    .filter(c => c.filteredItems.length > 0);

  return (
    <div className="min-h-screen bg-dark-900 pb-28">
      {/* Hero */}
      <div className="relative overflow-hidden noise">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-600/20 via-dark-900 to-dark-900" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl" />
        <div className="relative px-4 pt-12 pb-6">
          <div className="flex items-start justify-between mb-5">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-dark-200 text-xs font-medium tracking-wide">
                  {t('table')} {tableNumber} · {t('app_name')}
                </span>
              </div>
              <h1 className="font-display text-3xl font-bold text-white leading-tight">
                {t('welcome')}
              </h1>
              <p className="text-dark-300 text-sm mt-1">{t('welcome_sub')}</p>
            </div>
            <div className="flex items-center gap-2">
              <LangSwitcher />
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-300" />
            <input
              type="text"
              placeholder={t('search_menu')}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-11 pr-10 py-3.5 rounded-2xl bg-dark-700/80 border border-dark-600
                         text-white text-sm placeholder-dark-300 outline-none focus:border-brand-500/50 transition-colors"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-300">
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 px-4 py-3 overflow-x-auto no-scrollbar border-b border-dark-700 sticky top-0 z-10 bg-dark-900/95 backdrop-blur-sm">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all flex-shrink-0
            ${activeCategory === 'all'
              ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/25'
              : 'bg-dark-700 text-dark-200 hover:bg-dark-600'}`}
        >
          {t('all')}
        </button>
        {categories.map(cat => (
          <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all flex-shrink-0
              ${activeCategory === cat.id
                ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/25'
                : 'bg-dark-700 text-dark-200 hover:bg-dark-600'}`}
          >
            {cat.icon} {cat.name}
          </button>
        ))}
      </div>

      {/* Menu */}
      <div className="px-4 py-4">
        {loading ? (
          <div className="space-y-3">
            {[1,2,3,4].map(i => (
              <div key={i} className="card-dark p-3 flex gap-3">
                <div className="w-[72px] h-[72px] rounded-xl skeleton flex-shrink-0" />
                <div className="flex-1 space-y-2 pt-1">
                  <div className="h-4 skeleton rounded-lg w-3/4" />
                  <div className="h-3 skeleton rounded-lg w-1/2" />
                  <div className="h-4 skeleton rounded-lg w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : displayCategories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="text-5xl mb-4">🔍</span>
            <p className="text-dark-200">{t('empty_menu')}</p>
          </div>
        ) : (
          displayCategories.map(cat => (
            <div key={cat.id} className="mb-7">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">{cat.icon}</span>
                <h2 className="font-display text-lg font-bold text-white">{cat.name}</h2>
                <div className="flex-1 h-px bg-dark-700 ml-2" />
              </div>
              <div className="flex flex-col gap-2.5">
                {cat.filteredItems.map(item => <MenuItemCard key={item.id} item={item} />)}
              </div>
            </div>
          ))
        )}
      </div>

      <CartBar />
    </div>
  );
}
