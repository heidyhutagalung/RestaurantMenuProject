import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { QrCode, LayoutDashboard, UtensilsCrossed, Download, RefreshCw, Plus, Pencil, Trash2, Eye, EyeOff, X, Upload, ChevronDown } from 'lucide-react';
import { qrApi, orderApi, adminApi } from '../utils/api';
import { formatRupiah, formatDate } from '../utils/format';

const TABS = ['menu', 'orders', 'qr'];
const TAB_ICONS = { menu: UtensilsCrossed, orders: LayoutDashboard, qr: QrCode };
const TAB_LABELS = { menu: 'Menu', orders: 'Pesanan', qr: 'QR Code' };

const STATUS_STYLE = {
  pending: 'bg-yellow-500/15 text-yellow-400',
  confirmed: 'bg-blue-500/15 text-blue-400',
  preparing: 'bg-orange-500/15 text-orange-400',
  ready: 'bg-green-500/15 text-green-400',
  completed: 'bg-dark-600 text-dark-200',
  cancelled: 'bg-red-500/15 text-red-400',
};
const PAY_STYLE = {
  unpaid: 'bg-red-500/15 text-red-400',
  pending: 'bg-yellow-500/15 text-yellow-400',
  paid: 'bg-green-500/15 text-green-400',
  failed: 'bg-red-500/15 text-red-400',
};

// ─── MenuItem Form Modal ───────────────────────────────────────────────────────
function MenuItemModal({ item, categories, onClose, onSaved }) {
  const isEdit = !!item;
  const [form, setForm] = useState({
    category_id: item?.category_id || categories[0]?.id || '',
    name_id: item?.name_id || '',
    name_en: item?.name_en || '',
    description_id: item?.description_id || '',
    description_en: item?.description_en || '',
    price: item?.price || '',
    image_emoji: item?.image_emoji || '🍽️',
    is_available: item ? item.is_available !== 0 : true,
    is_best_seller: item?.is_best_seller === 1,
    is_spicy: item?.is_spicy === 1,
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(item?.image_url || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef();

  function handleImage(e) {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function handleSubmit() {
    if (!form.name_id || !form.price) { setError('Nama & harga wajib diisi'); return; }
    setLoading(true); setError('');
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (imageFile) fd.append('image', imageFile);
      if (isEdit) await adminApi.updateMenuItem(item.id, fd);
      else await adminApi.createMenuItem(fd);
      onSaved();
    } catch (e) { setError(e.response?.data?.message || 'Gagal menyimpan'); }
    finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-dark-800 border border-dark-600 rounded-3xl overflow-hidden max-h-[90vh] overflow-y-auto animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-dark-700 sticky top-0 bg-dark-800 z-10">
          <h2 className="font-display text-lg font-bold text-white">{isEdit ? 'Edit Menu' : 'Tambah Menu Baru'}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-dark-700 flex items-center justify-center text-dark-200 hover:text-white">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Image Upload */}
          <div>
            <label className="label-text">Foto Menu</label>
            <div
              onClick={() => fileRef.current.click()}
              className="relative w-full h-40 rounded-2xl border-2 border-dashed border-dark-500 hover:border-brand-500/50
                         transition-colors cursor-pointer overflow-hidden bg-dark-700 flex items-center justify-center group"
            >
              {imagePreview ? (
                <>
                  <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Upload size={24} className="text-white" />
                  </div>
                </>
              ) : (
                <div className="text-center">
                  <Upload size={28} className="text-dark-400 mx-auto mb-2" />
                  <p className="text-sm text-dark-300">Klik untuk upload foto</p>
                  <p className="text-xs text-dark-500 mt-1">atau gunakan emoji di bawah</p>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
            {imagePreview && (
              <button onClick={() => { setImageFile(null); setImagePreview(null); }}
                className="mt-2 text-xs text-red-400 hover:text-red-300 flex items-center gap-1">
                <X size={12} /> Hapus foto
              </button>
            )}
          </div>

          {/* Emoji */}
          <div>
            <label className="label-text">Emoji (jika tidak ada foto)</label>
            <input value={form.image_emoji} onChange={e => setForm(f => ({ ...f, image_emoji: e.target.value }))}
              className="input-dark w-24 text-2xl text-center" placeholder="🍽️" />
          </div>

          {/* Category */}
          <div>
            <label className="label-text">Kategori</label>
            <div className="relative">
              <select value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}
                className="input-dark appearance-none pr-10 w-full">
                {categories.map(c => <option key={c.id} value={c.id} className="bg-dark-800">{c.icon} {c.name_id}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-300 pointer-events-none" />
            </div>
          </div>

          {/* Names */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-text">Nama (Indonesia) *</label>
              <input value={form.name_id} onChange={e => setForm(f => ({ ...f, name_id: e.target.value }))}
                className="input-dark" placeholder="Nasi Goreng" />
            </div>
            <div>
              <label className="label-text">Nama (English)</label>
              <input value={form.name_en} onChange={e => setForm(f => ({ ...f, name_en: e.target.value }))}
                className="input-dark" placeholder="Fried Rice" />
            </div>
          </div>

          {/* Descriptions */}
          <div>
            <label className="label-text">Deskripsi (Indonesia)</label>
            <textarea value={form.description_id} onChange={e => setForm(f => ({ ...f, description_id: e.target.value }))}
              className="input-dark resize-none" rows={2} placeholder="Deskripsi menu..." />
          </div>
          <div>
            <label className="label-text">Description (English)</label>
            <textarea value={form.description_en} onChange={e => setForm(f => ({ ...f, description_en: e.target.value }))}
              className="input-dark resize-none" rows={2} placeholder="Menu description..." />
          </div>

          {/* Price */}
          <div>
            <label className="label-text">Harga (Rp) *</label>
            <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
              className="input-dark font-mono" placeholder="35000" />
          </div>

          {/* Toggles */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { key: 'is_available', label: 'Tersedia' },
              { key: 'is_best_seller', label: 'Terlaris' },
              { key: 'is_spicy', label: 'Pedas' },
            ].map(tog => (
              <button key={tog.key} onClick={() => setForm(f => ({ ...f, [tog.key]: !f[tog.key] }))}
                className={`py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all
                  ${form[tog.key] ? 'bg-brand-500/20 border-brand-500/40 text-brand-400' : 'bg-dark-700 border-dark-600 text-dark-300'}`}>
                {tog.label}
              </button>
            ))}
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button onClick={handleSubmit} disabled={loading} className="btn-primary">
            {loading ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Tambah Menu'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main AdminPage ─────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [tab, setTab] = useState('menu');
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [filterCat, setFilterCat] = useState('all');

  useEffect(() => {
    loadCategories();
    loadMenuItems();
    loadOrders();
  }, []);

  useEffect(() => { if (tab === 'qr') loadQR(); }, [tab]);

  async function loadCategories() {
    try { const r = await adminApi.getCategories(); setCategories(r.data.data); } catch (e) {}
  }
  async function loadMenuItems() {
    setLoading(true);
    try { const r = await adminApi.getMenuItems(); setMenuItems(r.data.data); } catch (e) {}
    finally { setLoading(false); }
  }
  async function loadOrders() {
    try { const r = await orderApi.getAllOrders(); setOrders(r.data.data); } catch (e) {}
  }
  async function loadQR() {
    try { const r = await qrApi.getAllQR(); setTables(r.data.data); } catch (e) {}
  }
  async function handleDelete(id) {
    if (!confirm('Hapus menu ini?')) return;
    try { await adminApi.deleteMenuItem(id); loadMenuItems(); } catch (e) {}
  }
  async function handleToggle(id) {
    try { await adminApi.toggleAvailable(id); loadMenuItems(); } catch (e) {}
  }
  async function handleGenerateQR() {
    setGenerating(true);
    try { await qrApi.generateAll(); await loadQR(); } catch (e) {}
    finally { setGenerating(false); }
  }
  function downloadQR(t) {
    const a = document.createElement('a'); a.href = t.qr_data_url;
    a.download = `QR-Meja-${String(t.table_number).padStart(2,'0')}.png`; a.click();
  }
  async function updateStatus(orderNumber, status) {
    try { await orderApi.updateStatus(orderNumber, status); loadOrders(); } catch (e) {}
  }
  async function confirmCashierPayment(orderNumber) {
    try { await orderApi.confirmCashier(orderNumber); loadOrders(); } catch (e) {}
  }

  const filteredItems = filterCat === 'all' ? menuItems : menuItems.filter(i => i.category_id == filterCat);

  return (
    <div className="min-h-screen bg-dark-900">
      {/* Header */}
      <div className="relative overflow-hidden noise">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-600/15 to-transparent" />
        <div className="relative px-4 pt-10 pb-5">
          <p className="text-dark-300 text-xs uppercase tracking-widest mb-1">Dashboard</p>
          <h1 className="font-display text-2xl font-bold text-white">Restoran Nusantara</h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-dark-800 border-b border-dark-700 sticky top-0 z-20">
        {TABS.map(t => {
          const Icon = TAB_ICONS[t];
          return (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3.5 text-xs font-semibold uppercase tracking-wide transition-all
                ${tab === t ? 'text-brand-400 border-b-2 border-brand-500' : 'text-dark-300 hover:text-white'}`}>
              <Icon size={15} /> {TAB_LABELS[t]}
            </button>
          );
        })}
      </div>

      {/* ── MENU TAB ── */}
      {tab === 'menu' && (
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-bold text-white">Daftar Menu</h2>
            <button onClick={() => { setEditItem(null); setShowModal(true); }}
              className="flex items-center gap-2 px-4 py-2.5 bg-brand-500 text-white text-sm font-semibold rounded-xl active:scale-95 transition-all shadow-lg shadow-brand-500/25">
              <Plus size={16} /> Tambah Menu
            </button>
          </div>

          {/* Category filter */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4 pb-1">
            <button onClick={() => setFilterCat('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-all
                ${filterCat === 'all' ? 'bg-brand-500 text-white' : 'bg-dark-700 text-dark-300'}`}>
              Semua ({menuItems.length})
            </button>
            {categories.map(c => (
              <button key={c.id} onClick={() => setFilterCat(c.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-all
                  ${filterCat == c.id ? 'bg-brand-500 text-white' : 'bg-dark-700 text-dark-300'}`}>
                {c.icon} {c.name_id} ({menuItems.filter(i => i.category_id == c.id).length})
              </button>
            ))}
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-20 skeleton rounded-2xl" />)}
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredItems.map(item => (
                <div key={item.id} className={`card-dark p-3 flex gap-3 items-center transition-all ${!item.is_available ? 'opacity-50' : ''}`}>
                  <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-dark-700">
                    {item.image_url
                      ? <img src={item.image_url} alt={item.name_id} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-2xl">{item.image_emoji}</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{item.name_id}</p>
                    <p className="text-xs text-dark-300 truncate">{item.cat_name_id}</p>
                    <p className="text-sm font-bold text-brand-400 font-mono mt-0.5">{formatRupiah(item.price)}</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {item.is_best_seller ? <span className="text-amber-400 text-xs">⭐</span> : null}
                    {item.is_spicy ? <span className="text-xs">🌶</span> : null}
                    <button onClick={() => handleToggle(item.id)}
                      className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all
                        ${item.is_available ? 'bg-green-500/15 text-green-400' : 'bg-dark-600 text-dark-400'}`}>
                      {item.is_available ? <Eye size={14} /> : <EyeOff size={14} />}
                    </button>
                    <button onClick={() => { setEditItem(item); setShowModal(true); }}
                      className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleDelete(item.id)}
                      className="w-8 h-8 rounded-xl bg-red-500/15 text-red-400 flex items-center justify-center">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
              {filteredItems.length === 0 && (
                <div className="text-center py-16 text-dark-400">
                  <UtensilsCrossed size={40} className="mx-auto mb-3 opacity-30" />
                  <p>Belum ada menu</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── ORDERS TAB ── */}
      {tab === 'orders' && (
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-bold text-white">Pesanan Masuk</h2>
            <button onClick={loadOrders} className="flex items-center gap-1.5 px-3 py-2 bg-dark-700 text-dark-200 text-xs rounded-xl">
              <RefreshCw size={13} /> Refresh
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { label: 'Total', val: orders.length, color: 'text-white' },
              { label: 'Pending', val: orders.filter(o => o.status === 'pending').length, color: 'text-yellow-400' },
              { label: 'Lunas', val: orders.filter(o => o.payment_status === 'paid').length, color: 'text-green-400' },
            ].map(s => (
              <div key={s.label} className="card-dark p-3 text-center">
                <p className={`text-2xl font-bold font-mono ${s.color}`}>{s.val}</p>
                <p className="text-xs text-dark-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            {orders.map(order => (
              <div key={order.id} className="card-dark p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-sm font-bold text-white font-mono">{order.order_number}</p>
                    <p className="text-xs text-dark-400 mt-0.5">Meja {order.table_number} · {formatDate(order.created_at)}</p>
                  </div>
                  <div className="flex gap-1.5 flex-wrap justify-end">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLE[order.status] || 'bg-dark-600 text-dark-200'}`}>
                      {order.status}
                    </span>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${PAY_STYLE[order.payment_status] || 'bg-dark-600 text-dark-200'}`}>
                      {order.payment_status}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-base font-bold text-brand-400 font-mono">{formatRupiah(order.total)}</span>
                  <div className="flex gap-1.5 items-center">
                    {order.payment_method === 'cashier' && order.payment_status === 'unpaid' && (
                      <button onClick={() => confirmCashierPayment(order.order_number)}
                        className="text-xs px-2.5 py-1.5 bg-green-500/20 text-green-400 border border-green-500/30 rounded-xl hover:bg-green-500/35 active:scale-95 transition-all font-semibold mr-1">
                        💵 Terima Bayar
                      </button>
                    )}
                    {['confirmed','preparing','ready','completed'].map(s =>
                      !['completed','cancelled'].includes(order.status) && order.status !== s && (
                        <button key={s} onClick={() => updateStatus(order.order_number, s)}
                          className="text-xs px-2.5 py-1.5 bg-dark-700 text-dark-200 rounded-xl hover:bg-dark-600 active:scale-95 transition-all">
                          → {s}
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            ))}
            {orders.length === 0 && (
              <div className="text-center py-16 text-dark-400">
                <LayoutDashboard size={40} className="mx-auto mb-3 opacity-30" />
                <p>Belum ada pesanan</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── QR TAB ── */}
      {tab === 'qr' && (
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-bold text-white">QR Code Meja</h2>
            <button onClick={handleGenerateQR} disabled={generating}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-brand-500 text-white text-sm font-semibold rounded-xl active:scale-95 shadow-lg shadow-brand-500/25">
              {generating ? <RefreshCw size={14} className="animate-spin" /> : <QrCode size={14} />}
              {generating ? 'Generating...' : 'Generate Semua'}
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {tables.map(t => (
              <div key={t.table_number} className="card-dark p-3 text-center">
                <p className="text-xs font-bold text-dark-300 mb-2">Meja {t.table_number}</p>
                {t.qr_data_url
                  ? <img src={t.qr_data_url} alt={`QR ${t.table_number}`} className="w-full aspect-square rounded-xl mb-2 bg-white p-1" />
                  : <div className="w-full aspect-square bg-dark-700 rounded-xl flex items-center justify-center mb-2 text-dark-500"><QrCode size={28} /></div>
                }
                {t.qr_data_url && (
                  <button onClick={() => downloadQR(t)}
                    className="w-full flex items-center justify-center gap-1.5 text-xs py-2 bg-dark-700 text-dark-200 rounded-xl hover:bg-dark-600 transition-all">
                    <Download size={12} /> Download
                  </button>
                )}
              </div>
            ))}
            {tables.length === 0 && (
              <div className="col-span-3 text-center py-12 text-dark-400">
                <QrCode size={40} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">Klik "Generate Semua" untuk membuat QR code</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <MenuItemModal
          item={editItem}
          categories={categories}
          onClose={() => { setShowModal(false); setEditItem(null); }}
          onSaved={() => { setShowModal(false); setEditItem(null); loadMenuItems(); }}
        />
      )}
    </div>
  );
}
