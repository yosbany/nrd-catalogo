/**
 * Vista Carrito: lista de ítems, subtotal, mensaje de mínimo para envío, seguir comprando / finalizar.
 */
(function () {
  const formatCurrency = (n) => (n != null && !isNaN(n) ? '$ ' + Math.round(n).toLocaleString('es-UY') : '$ -');

  function render() {
    const itemsEl = document.getElementById('cart-items');
    const subtotalEl = document.getElementById('cart-subtotal');
    const minMsgEl = document.getElementById('cart-minimum-msg');
    if (!itemsEl || !window.cart) return;

    const items = window.cart.items;
    const subtotal = window.cart.getSubtotal();
    const config = window.getCatalogConfig ? window.getCatalogConfig() : {};
    const minimum = config.minimumForShipping || 0;

    itemsEl.innerHTML = '';
    items.forEach((item, idx) => {
      const row = document.createElement('div');
      row.className = 'flex items-center justify-between gap-2 p-3 bg-white border border-gray-200 rounded-lg';
      const key = item.variantId ? `${item.productId}_${item.variantId}` : item.productId;
      const notesKey = item.notes || '';
      row.innerHTML = `
        <div class="flex-1 min-w-0">
          <p class="font-medium text-gray-900 truncate">${escapeHtml(item.productName)}</p>
          ${notesKey ? `<p class="text-xs text-gray-500">${escapeHtml(notesKey)}</p>` : ''}
          <p class="text-sm text-gray-600">${formatCurrency(item.price)} × ${item.quantity}</p>
        </div>
        <div class="flex items-center gap-2">
          <button type="button" class="cart-qty-minus w-8 h-8 rounded border border-gray-300 leading-none" data-idx="${idx}">−</button>
          <span class="cart-qty w-6 text-center">${item.quantity}</span>
          <button type="button" class="cart-qty-plus w-8 h-8 rounded border border-gray-300 leading-none" data-idx="${idx}">+</button>
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
