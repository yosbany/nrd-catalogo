/**
 * Vista Carrito: lista de ítems, subtotal, mensaje de mínimo para envío, seguir comprando / finalizar.
 */
(function () {
  const formatCurrency = (n) => (n != null && !isNaN(n) ? '$ ' + Math.round(n).toLocaleString('es-UY') : '$ -');

  function formatOrderDate(ts) {
    if (!ts || isNaN(ts)) return '';
    const d = new Date(ts);
    const today = new Date();
    const sameDay = d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
    if (sameDay) {
      return 'hoy ' + d.toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString('es-UY', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  let activeOrderUnsubscribe = null;

  function render() {
    const itemsEl = document.getElementById('cart-items');
    const activeOrderEl = document.getElementById('cart-active-order');
    const lastOrdersEl = document.getElementById('cart-last-orders');
    const subtotalEl = document.getElementById('cart-subtotal');
    const minMsgEl = document.getElementById('cart-minimum-msg');
    if (!itemsEl || !window.cart) return;

    const activeOrderId = typeof window.getActiveOrderIdFromStorage === 'function' ? window.getActiveOrderIdFromStorage() : null;
    const nrd = window.nrd;

    if (activeOrderEl) {
      if (activeOrderUnsubscribe) {
        activeOrderUnsubscribe();
        activeOrderUnsubscribe = null;
      }
      if (activeOrderId && nrd && nrd.orders) {
        activeOrderUnsubscribe = nrd.orders.onValueById(activeOrderId, (order) => {
          if (!order) {
            if (typeof window.clearActiveOrderIdFromStorage === 'function') window.clearActiveOrderIdFromStorage();
            if (activeOrderEl) { activeOrderEl.classList.add('hidden'); activeOrderEl.innerHTML = ''; }
            return;
          }
          const status = (order.status || 'Pendiente').toLowerCase();
          const isPending = status !== 'completado' && status !== 'cancelado';
          if (!isPending) {
            if (typeof window.clearActiveOrderIdFromStorage === 'function') window.clearActiveOrderIdFromStorage();
            activeOrderEl.classList.add('hidden');
            activeOrderEl.innerHTML = '';
            return;
          }
          activeOrderEl.classList.remove('hidden');
          const summary = (order.items || []).slice(0, 2).map((i) => i.productName || '').join(', ') + ((order.items || []).length > 2 ? '...' : '');
          const total = order.total != null ? '$ ' + Math.round(order.total).toLocaleString('es-UY') : '';
          const dateStr = formatOrderDate(order.createdAt);
          activeOrderEl.innerHTML =
            '<h3 class="text-sm font-semibold text-red-700 mb-2 flex items-center gap-2">' +
            '<span class="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse" title="Pedido en curso"></span>' +
            'Pedido en curso</h3>' +
            '<div class="p-3 border-2 border-red-200 bg-red-50">' +
            '<span class="text-sm text-gray-800 block">' + escapeHtml(summary || 'Pedido') + (total ? ' — ' + total : '') + '</span>' +
            (dateStr ? '<span class="text-xs text-gray-600 block mt-1">' + escapeHtml(dateStr) + '</span>' : '') +
            '<span class="text-xs text-red-700 font-medium mt-1 block">Estado: ' + escapeHtml(order.status || 'Pendiente') + '</span>' +
            '</div>';
        });
      } else {
        activeOrderEl.classList.add('hidden');
        activeOrderEl.innerHTML = '';
      }
    }

    const lastOrders = typeof window.getLastOrdersFromStorage === 'function' ? window.getLastOrdersFromStorage() : [];
    if (lastOrdersEl && lastOrders.length > 0) {
      lastOrdersEl.classList.remove('hidden');
      lastOrdersEl.innerHTML = '<h3 class="text-sm font-semibold text-gray-700 mb-2">Historial de pedidos</h3>' +
        lastOrders.slice(0, 5).map((ord, idx) => {
          const summary = (ord.items || []).slice(0, 2).map((i) => i.productName).join(', ') + ((ord.items || []).length > 2 ? '...' : '');
          const total = ord.total != null ? '$ ' + Math.round(ord.total).toLocaleString('es-UY') : '';
          const dateStr = formatOrderDate(ord.createdAt);
          return `<div class="flex items-start justify-between gap-2 p-2 border border-gray-200 bg-gray-50 mb-1">
            <div class="flex-1 min-w-0">
              <span class="text-sm text-gray-700 truncate block">${escapeHtml(summary || 'Pedido')} ${total ? '— ' + total : ''}</span>
              ${dateStr ? `<span class="text-xs text-gray-500">${escapeHtml(dateStr)}</span>` : ''}
            </div>
            <button type="button" class="cart-repeat-btn flex-shrink-0 py-1 px-2 text-sm text-red-600 hover:text-red-700 border border-red-300 hover:bg-red-50" data-idx="${idx}">Repetir</button>
          </div>`;
        }).join('');
      lastOrdersEl.querySelectorAll('.cart-repeat-btn').forEach((btn) => {
        const idx = parseInt(btn.dataset.idx, 10);
        const ord = lastOrders[idx];
        if (!ord) return;
        btn.addEventListener('click', () => {
          window.cart.loadFromOrder(ord.items || []);
          if (typeof window.setPendingCheckoutPreload === 'function') {
            window.setPendingCheckoutPreload({ name: ord.name, phone: ord.phone, address: ord.address });
          }
          window.updateCartCount();
          window.showView('checkout');
          if (typeof window.renderCheckout === 'function') window.renderCheckout();
        });
      });
    } else if (lastOrdersEl) {
      lastOrdersEl.classList.add('hidden');
      lastOrdersEl.innerHTML = '';
    }

    const items = window.cart.items;
    const subtotal = window.cart.getSubtotal();
    const config = window.getCatalogConfig ? window.getCatalogConfig() : {};
    const minimum = config.minimumForShipping || 0;

    itemsEl.innerHTML = '';
    items.forEach((item, idx) => {
      const row = document.createElement('div');
      row.className = 'flex items-center justify-between gap-2 p-3 bg-white border border-gray-200';
      const key = item.variantId ? `${item.productId}_${item.variantId}` : item.productId;
      const notesKey = item.notes || '';
      row.innerHTML = `
        <div class="flex-1 min-w-0">
          <p class="font-medium text-gray-900 truncate">${escapeHtml(item.productName)}</p>
          ${notesKey ? `<p class="text-xs text-gray-500">${escapeHtml(notesKey)}</p>` : ''}
          <p class="text-sm text-gray-600">${formatCurrency(item.price)} × ${item.quantity}</p>
        </div>
        <div class="flex items-center gap-2">
          <button type="button" class="cart-qty-minus w-8 h-8 border border-gray-300 leading-none" data-idx="${idx}">−</button>
          <span class="cart-qty w-6 text-center">${item.quantity}</span>
          <button type="button" class="cart-qty-plus w-8 h-8 border border-gray-300 leading-none" data-idx="${idx}">+</button>
          <button type="button" class="cart-remove text-red-600 text-sm underline" data-idx="${idx}">Quitar</button>
        </div>
      `;
      row.querySelector('.cart-qty-minus').onclick = () => {
        window.cart.update(item.productId, item.variantId, notesKey, -1);
        render();
        window.updateCartCount();
      };
      row.querySelector('.cart-qty-plus').onclick = () => {
        window.cart.update(item.productId, item.variantId, notesKey, 1);
        render();
        window.updateCartCount();
      };
      row.querySelector('.cart-remove').onclick = () => {
        window.cart.remove(item.productId, item.variantId, notesKey);
        render();
        window.updateCartCount();
      };
      itemsEl.appendChild(row);
    });

    if (subtotalEl) subtotalEl.textContent = formatCurrency(subtotal);

    if (minMsgEl && minimum > 0 && subtotal < minimum) {
      const missing = minimum - subtotal;
      minMsgEl.textContent = 'Agregá ' + formatCurrency(missing) + ' para alcanzar el mínimo de envío.';
      minMsgEl.classList.remove('hidden');
    } else if (minMsgEl) {
      minMsgEl.classList.add('hidden');
    }

    const checkoutBtn = document.getElementById('cart-checkout');
    if (checkoutBtn) {
      const hasItems = items.length > 0;
      const meetsMinimum = minimum <= 0 || subtotal >= minimum;
      const canCheckout = hasItems && meetsMinimum;
      checkoutBtn.disabled = !canCheckout;
      checkoutBtn.classList.toggle('opacity-50', !canCheckout);
      checkoutBtn.classList.toggle('cursor-not-allowed', !canCheckout);
    }
  }

  function escapeHtml(s) {
    if (s == null) return '';
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  window.initCart = function () {
    document.getElementById('cart-continue').addEventListener('click', (e) => {
      e.preventDefault();
      window.showView('home');
    });
    document.getElementById('cart-checkout').addEventListener('click', () => {
      if (!window.cart || window.cart.items.length === 0) return;
      const config = window.getCatalogConfig ? window.getCatalogConfig() : {};
      const minimum = config.minimumForShipping || 0;
      const subtotal = window.cart.getSubtotal();
      if (minimum > 0 && subtotal < minimum) {
        const missing = minimum - subtotal;
        alert('Agregá ' + formatCurrency(missing) + ' más para alcanzar el mínimo de ' + formatCurrency(minimum) + '.');
        return;
      }
      window.showView('checkout');
      if (typeof window.renderCheckout === 'function') window.renderCheckout();
    });
  };

  const origRender = window.renderView;
  window.renderView = function (name) {
    if (typeof origRender === 'function') origRender(name);
    if (name === 'cart') render();
    if (name === 'checkout' && typeof window.renderCheckout === 'function') window.renderCheckout();
  };
})();
