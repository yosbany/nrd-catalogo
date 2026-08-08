/**
 * Persistencia en localStorage: carrito, últimos 5 pedidos (para repetir y precargar datos).
 */
const STORAGE_KEYS = {
  CART: 'nrd-catalogo-cart',
  LAST_ORDERS: 'nrd-catalogo-last-orders',
  MAX_LAST_ORDERS: 5,
  ACTIVE_ORDER_ID: 'nrd-catalogo-active-order-id',
  ACTIVE_ORDER_SNAPSHOT: 'nrd-catalogo-active-order-snapshot'
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
  const orderId = order.orderId || order.id || null;
  const entry = {
    orderId: orderId,
    name: order.name || '',
    phone: order.phone || '',
    address: order.address || '',
    items: order.items || [],
    total: order.total,
    status: order.status || null,
    rejectReason: order.rejectReason || null,
    createdAt: order.createdAt || Date.now()
  };
  if (orderId) {
    const existingIdx = list.findIndex((o) => o && (o.orderId === orderId || o.id === orderId));
    if (existingIdx >= 0) {
      list[existingIdx] = Object.assign({}, list[existingIdx], entry);
      try {
        localStorage.setItem(STORAGE_KEYS.LAST_ORDERS, JSON.stringify(list.slice(0, STORAGE_KEYS.MAX_LAST_ORDERS)));
      } catch (e) {
        console.warn('Error guardando últimos pedidos:', e);
      }
      return;
    }
  }
  // Historial viejo sin orderId: actualizar el más reciente con mismo total
  const statusLower = (entry.status || '').toLowerCase();
  if (statusLower === 'rechazado' || statusLower === 'completado') {
    const legacyIdx = list.findIndex((o) =>
      o && !o.orderId && o.total === entry.total && !(o.status && String(o.status).toLowerCase() === statusLower)
    );
    if (legacyIdx >= 0) {
      list[legacyIdx] = Object.assign({}, list[legacyIdx], entry, {
        orderId: orderId || list[legacyIdx].orderId || null,
        createdAt: list[legacyIdx].createdAt || entry.createdAt
      });
      try {
        localStorage.setItem(STORAGE_KEYS.LAST_ORDERS, JSON.stringify(list.slice(0, STORAGE_KEYS.MAX_LAST_ORDERS)));
      } catch (e) {
        console.warn('Error guardando últimos pedidos:', e);
      }
      return;
    }
  }
  list.unshift(entry);
  const trimmed = list.slice(0, STORAGE_KEYS.MAX_LAST_ORDERS);
  try {
    localStorage.setItem(STORAGE_KEYS.LAST_ORDERS, JSON.stringify(trimmed));
  } catch (e) {
    console.warn('Error guardando últimos pedidos:', e);
  }
}

/** Actualiza o inserta un pedido en el historial (p. ej. al confirmar un rechazo). */
function upsertLastOrder(order) {
  addLastOrder(order);
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
function getActiveOrderSnapshot() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVE_ORDER_SNAPSHOT);
    if (!raw) return null;
    const data = JSON.parse(raw);
    return data && typeof data === 'object' ? data : null;
  } catch {
    return null;
  }
}
function setActiveOrderSnapshot(snapshot) {
  try {
    if (snapshot && typeof snapshot === 'object') {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_ORDER_SNAPSHOT, JSON.stringify(snapshot));
    } else {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_ORDER_SNAPSHOT);
    }
  } catch (e) {
    console.warn('Error guardando snapshot de pedido activo:', e);
  }
}
function clearActiveOrderId() {
  setActiveOrderId(null);
  setActiveOrderSnapshot(null);
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
window.upsertLastOrderToStorage = upsertLastOrder;
window.getActiveOrderIdFromStorage = getActiveOrderId;
window.setActiveOrderIdToStorage = setActiveOrderId;
window.getActiveOrderSnapshotFromStorage = getActiveOrderSnapshot;
window.setActiveOrderSnapshotToStorage = setActiveOrderSnapshot;
window.clearActiveOrderIdFromStorage = clearActiveOrderId;
window.setLastAddedProductToStorage = setLastAddedProduct;
window.getAndClearLastAddedProductFromStorage = getAndClearLastAddedProduct;
window.setPendingCheckoutPreload = setPendingCheckoutPreload;
window.getAndClearPendingCheckoutPreload = getAndClearPendingCheckoutPreload;
