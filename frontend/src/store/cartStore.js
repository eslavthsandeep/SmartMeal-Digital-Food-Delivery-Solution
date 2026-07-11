import { create } from 'zustand';

export const useCartStore = create((set, get) => ({
  items: [],
  restaurantId: null,
  restaurantName: null,
  deliveryFee: 40,

  addItem: (item, resId, resName) => {
    const { items, restaurantId } = get();

    // Single-restaurant checkout lock
    if (restaurantId && restaurantId !== resId) {
      throw new Error('CLEAR_CART_REQUIRED');
    }

    const existingItem = items.find((i) => i.menuItemId === item.menuItemId);
    let newItems;

    if (existingItem) {
      newItems = items.map((i) =>
        i.menuItemId === item.menuItemId
          ? { ...i, quantity: i.quantity + 1 }
          : i
      );
    } else {
      newItems = [...items, { ...item, quantity: 1 }];
    }

    set({
      items: newItems,
      restaurantId: resId,
      restaurantName: resName
    });
  },

  removeItem: (menuItemId) => {
    const { items } = get();
    const newItems = items.filter((i) => i.menuItemId !== menuItemId);

    if (newItems.length === 0) {
      set({ items: [], restaurantId: null, restaurantName: null });
    } else {
      set({ items: newItems });
    }
  },

  updateQuantity: (menuItemId, quantity) => {
    const { items } = get();
    if (quantity <= 0) {
      get().removeItem(menuItemId);
      return;
    }

    const newItems = items.map((i) =>
      i.menuItemId === menuItemId ? { ...i, quantity } : i
    );
    set({ items: newItems });
  },

  clearCart: () => {
    set({ items: [], restaurantId: null, restaurantName: null });
  },

  getSubtotal: () => {
    return get().items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  },

  getTotal: () => {
    const subtotal = get().getSubtotal();
    return subtotal > 0 ? subtotal + get().deliveryFee : 0;
  }
}));

export default useCartStore;
