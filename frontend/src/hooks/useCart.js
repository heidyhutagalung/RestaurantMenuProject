import { create } from 'zustand';

export const useCartStore = create((set, get) => ({
  items: [],
  tableNumber: null,
  notes: '',
  // Simpan order & payment di store supaya tidak hilang saat navigate
  currentOrder: null,
  currentPayment: null,

  setTableNumber: (num) => set({ tableNumber: num }),
  setNotes: (notes) => set({ notes }),
  setCurrentOrder: (order) => set({ currentOrder: order }),
  setCurrentPayment: (payment) => set({ currentPayment: payment }),

  addItem: (menuItem) => {
    const { items } = get();
    const existing = items.find(i => i.menu_item_id === menuItem.id);
    if (existing) {
      set({ items: items.map(i => i.menu_item_id === menuItem.id ? { ...i, quantity: i.quantity + 1 } : i) });
    } else {
      set({ items: [...items, {
        menu_item_id: menuItem.id,
        name: menuItem.name,
        price: menuItem.price,
        image_emoji: menuItem.image_emoji,
        image_url: menuItem.image_url || null,
        quantity: 1,
      }]});
    }
  },

  removeItem: (menuItemId) => {
    const { items } = get();
    const existing = items.find(i => i.menu_item_id === menuItemId);
    if (!existing) return;
    if (existing.quantity === 1) {
      set({ items: items.filter(i => i.menu_item_id !== menuItemId) });
    } else {
      set({ items: items.map(i => i.menu_item_id === menuItemId ? { ...i, quantity: i.quantity - 1 } : i) });
    }
  },

  clearCart: () => set({ items: [], notes: '', currentOrder: null, currentPayment: null }),

  get subtotal() { return get().items.reduce((s, i) => s + i.price * i.quantity, 0); },
  get tax() { return Math.round(get().items.reduce((s, i) => s + i.price * i.quantity, 0) * 0.1); },
  get total() {
    const sub = get().items.reduce((s, i) => s + i.price * i.quantity, 0);
    return sub + Math.round(sub * 0.1);
  },
  get totalItems() { return get().items.reduce((s, i) => s + i.quantity, 0); },
}));
