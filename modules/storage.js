/**
 * Persistencia en localStorage: carrito, últimos 5 pedidos (para repetir y precargar datos).
 */
const STORAGE_KEYS = {
  CART: 'nrd-catalogo-cart',
  LAST_ORDERS: 'nrd-catalogo-last-orders',
  MAX_LAST_ORDERS: 5,
  ACTIVE_ORDER_ID: 'nrd-catalogo-active-order-id'
};

function getCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CART);
    if (!raw) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function setCart(items) {
  try {
    localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(items || []));
  } catch (e) {
    console.warn('Error guardando carrito:', e);
  }
}

function getLastOrders() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LAST_ORDERS);
    if (!raw) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function addLastOrder(order) {
  const list = getLastOrders();
  const entry = {
    name: order.name || '',
    phone: order.phone || '',
    address: order.address || '',
    items: order.items || [],
    total: order.total,
    createdAt: Date.now()
  };
  list.unshift(entry);
  const trimmed = list.slice(0, STORAGE_KEYS.MAX_LAST_ORDERS);
  try {
    localStorage.setItem(STORAGE_KEYS.LAST_ORDERS, JSON.stringify(trimmed));
  } catch (e) {
    console.warn('Error guardando últimos pedidos:', e);
  }
}

function getActiveOrderId() {
  try {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_ORDER_ID) || null;
  } catch {
    return null;
  }
}
function setActiveOrderId(id) {
  try {
    if (id) localStorage.setItem(STORAGE_KEYS.ACTIVE_ORDER_ID, id);
    else localStorage.removeItem(STORAGE_KEYS.ACTIVE_ORDER_ID);
  } catch (e) {
    console.warn('Error guardando pedido activo:', e);
  }
}
function clearActiveOrderId() {
  setActiveOrderId(null);
}

let lastAddedProduct = null;
function setLastAddedProduct(data) {
  lastAddedProduct = data ? { productId: data.productId, variantId: data.variantId || null } : null;
}
function getAndClearLastAddedProduct() {
  const d = lastAddedProduct;
  lastAddedProduct = null;
  return d;
}

let pendingCheckoutPreload = null;
function setPendingCheckoutPreload(data) {
  pendingCheckoutPreload = data;
}
function getAndClearPendingCheckoutPreload() {
  const d = pendingCheckoutPreload;
  pendingCheckoutPreload = null;
  return d;
}

window.getCartFromStorage = getCart;
window.setCartToStorage = setCart;
window.getLastOrdersFromStorage = getLastOrders;
window.addLastOrderToStorage = addLastOrder;
window.getActiveOrderIdFromStorage = getActiveOrderId;
window.setActiveOrderIdToStorage = setActiveOrderId;
window.clearActiveOrderIdFromStorage = clearActiveOrderId;
window.setLastAddedProductToStorage = setLastAddedProduct;
window.getAndClearLastAddedProductFromStorage = getAndClearLastAddedProduct;
window.setPendingCheckoutPreload = setPendingCheckoutPreload;
window.getAndClearPendingCheckoutPreload = getAndClearPendingCheckoutPreload;
