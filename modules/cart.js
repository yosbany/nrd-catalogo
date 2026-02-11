/**
 * Carrito de compra: ítems en memoria, subtotal, persistencia opcional en sessionStorage.
 */
const cart = {
  items: [], // { productId, variantId?, productName, variantName?, quantity, price, notes? }

  add(productId, productName, price, quantity = 1, options = {}) {
    const variantId = options.variantId || null;
    const variantName = options.variantName || null;
    const notes = options.notes || '';
    const key = variantId ? `${productId}_${variantId}` : productId;
    const existing = this.items.find(
      (i) => (i.variantId ? `${i.productId}_${i.variantId}` : i.productId) === key && i.notes === notes
    );
    if (existing) {
      existing.quantity += quantity;
    } else {
      this.items.push({
        productId,
        variantId,
        productName: variantName ? `${productName} - ${variantName}` : productName,
        variantName,
        quantity,
        price,
        notes
      });
    }
    this._notify();
  },

  update(productId, variantId, notes, delta) {
    const key = variantId ? `${productId}_${variantId}` : productId;
    const item = this.items.find((i) => (i.variantId ? `${i.productId}_${i.variantId}` : i.productId) === key && (i.notes || '') === (notes || ''));
    if (!item) return;
    item.quantity = Math.max(0, item.quantity + delta);
    if (item.quantity <= 0) this.remove(productId, variantId, notes);
    this._notify();
  },

  remove(productId, variantId, notes) {
    this.items = this.items.filter(
      (i) =>
        i.productId !== productId ||
        (i.variantId || null) !== (variantId || null) ||
        (i.notes || '') !== (notes || '')
    );
    this._notify();
  },

  setQuantity(productId, variantId, notes, quantity) {
    const key = variantId ? `${productId}_${variantId}` : productId;
    const item = this.items.find((i) => (i.variantId ? `${i.productId}_${i.variantId}` : i.productId) === key && (i.notes || '') === (notes || ''));
    if (!item) return;
    if (quantity <= 0) {
      this.remove(productId, variantId, notes);
      return;
    }
    item.quantity = quantity;
    this._notify();
  },

  getSubtotal() {
    return this.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  },

  getCount() {
    return this.items.reduce((sum, i) => sum + i.quantity, 0);
  },

  clear() {
    this.items = [];
    this._notify();
  },

  _listeners: [],
  onChange(fn) {
    this._listeners.push(fn);
  },
  _notify() {
    this._listeners.forEach((fn) => fn());
  }
};

window.cart = cart;
