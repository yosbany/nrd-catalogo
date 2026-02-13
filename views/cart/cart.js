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

  /** Convierte el ID del pedido en un código corto legible de 6 caracteres (mismo ID = mismo código). */
  function orderIdToShortCode(id) {
    if (!id || typeof id !== 'string') return '';
    const base = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let h = 0;
    for (let i = 0; i < id.length; i++) {
      h = ((h << 5) - h) + id.charCodeAt(i);
      h = h | 0;
    }
    h = Math.abs(h);
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += base[h % base.length];
      h = Math.floor(h / base.length);
    }
    return code;
  }

  let activeOrderUnsubscribe = null;
  let lastActiveOrderStatus = null;
  let activeOrderTimerInterval = null;

  function updateActiveOrderTimer() {
    const card = document.getElementById('cart-active-order-card');
    const timerEl = document.getElementById('cart-active-order-timer');
    if (!card || !timerEl) return;
    const createdAt = parseInt(card.dataset.createdAt, 10);
    const deliveryAt = parseInt(card.dataset.deliveryAt, 10);
    if (!createdAt || isNaN(createdAt)) return;
    const now = Date.now();
    const hasDelivery = deliveryAt && !isNaN(deliveryAt);
    let text;
    let isOverdue = false;
    if (hasDelivery) {
      if (now < deliveryAt) {
        const remainingMin = Math.ceil((deliveryAt - now) / 60000);
        text = remainingMin + ' min';
      } else {
        isOverdue = true;
        const overdueMin = Math.floor((now - deliveryAt) / 60000);
        text = '-' + overdueMin + ' min';
      }
    } else {
      const elapsedMin = Math.floor((now - createdAt) / 60000);
      text = elapsedMin + ' min';
    }
    const dotClass = isOverdue ? 'bg-red-500' : 'bg-blue-500';
    const textClass = isOverdue ? 'text-red-700' : 'text-blue-700';
    timerEl.innerHTML = '<span class="inline-block w-2 h-2 ' + dotClass + ' animate-pulse" aria-hidden="true"></span><span class="text-xs font-medium ' + textClass + '">' + text + '</span>';
  }

  function playAcceptedBeep() {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      osc.connect(gain);
      gain.connect(audioContext.destination);
      osc.frequency.value = 880;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.2, 0);
      gain.gain.exponentialRampToValueAtTime(0.01, 0.15);
      osc.start(0);
      osc.stop(0.15);
      if (audioContext.state === 'suspended') audioContext.resume();
    } catch (e) {
      console.warn('No se pudo reproducir el bip', e);
    }
  }

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
        lastActiveOrderStatus = null;
        activeOrderUnsubscribe = nrd.orders.onValueById(activeOrderId, (order) => {
          if (!order) {
            lastActiveOrderStatus = null;
            if (activeOrderTimerInterval) { clearInterval(activeOrderTimerInterval); activeOrderTimerInterval = null; }
            if (typeof window.clearActiveOrderIdFromStorage === 'function') window.clearActiveOrderIdFromStorage();
            if (activeOrderEl) { activeOrderEl.classList.add('hidden'); activeOrderEl.innerHTML = ''; }
            return;
          }
          const status = (order.status || 'Pendiente').toLowerCase();
          const isPending = status !== 'completado' && status !== 'cancelado';
          if (status === 'aceptado' && lastActiveOrderStatus === 'pendiente') {
            playAcceptedBeep();
          }
          lastActiveOrderStatus = status;
          if (!isPending) {
            lastActiveOrderStatus = null;
            if (activeOrderTimerInterval) { clearInterval(activeOrderTimerInterval); activeOrderTimerInterval = null; }
            if (typeof window.clearActiveOrderIdFromStorage === 'function') window.clearActiveOrderIdFromStorage();
            activeOrderEl.classList.add('hidden');
            activeOrderEl.innerHTML = '';
            return;
          }
          if (activeOrderTimerInterval) { clearInterval(activeOrderTimerInterval); activeOrderTimerInterval = null; }
          activeOrderEl.classList.remove('hidden');
          const items = order.items || [];
          const itemsHtml = items.length
            ? items.map((i) => '<li class="text-sm text-gray-800 leading-tight">' + escapeHtml((i.quantity || 1) + ' × ' + (i.productName || 'Producto')) + '</li>').join('')
            : '<li class="text-sm text-gray-500">Sin ítems</li>';
          const total = order.total != null ? '$ ' + Math.round(order.total).toLocaleString('es-UY') : '';
          const dateStr = formatOrderDate(order.createdAt);
          const whatsappNum = '59899646848';
          const orderCode = order.id ? orderIdToShortCode(order.id) : '';
          const defaultMsg = 'Hola, consulto por mi pedido' +
            (orderCode ? ' #' + orderCode : '') +
            (dateStr ? ' del ' + dateStr : '') +
            (total ? '. Total ' + total : '') + '.';
          const whatsappUrl = 'https://wa.me/' + whatsappNum + '?text=' + encodeURIComponent(defaultMsg);
          const createdAt = order.createdAt ? Number(order.createdAt) : Date.now();
          const deliveryAt = order.deliveryDate ? Number(order.deliveryDate) : 0;
          activeOrderEl.innerHTML =
            '<h3 class="text-sm font-semibold text-red-700 mb-2 flex items-center gap-2">Pedido en curso</h3>' +
            '<div id="cart-active-order-card" class="p-4 border-2 border-red-400 bg-red-50 shadow-sm" data-created-at="' + String(createdAt) + '" data-delivery-at="' + String(deliveryAt) + '">' +
            '<ul class="list-none pl-0 space-y-1">' + itemsHtml + '</ul>' +
            (total ? '<p class="text-sm font-bold text-gray-900 mt-2">' + total + '</p>' : '') +
            '<div class="flex items-center gap-2 mt-0.5 flex-wrap">' +
            (dateStr ? '<span class="text-xs text-gray-600">' + escapeHtml(dateStr) + '</span>' : '') +
            '<span id="cart-active-order-timer" class="flex items-center gap-1.5"></span></div>' +
            '<div class="mt-3 flex items-center justify-between gap-2">' +
            '<span class="inline-block px-2 py-1 text-xs font-bold text-red-700 uppercase tracking-wide bg-red-100 border border-red-300">' + escapeHtml(order.status || 'Pendiente') + '</span>' +
            '<a href="' + escapeHtml(whatsappUrl) + '" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 text-xs font-medium text-green-700 hover:text-green-800 hover:underline shrink-0">' +
            '<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>' +
            'Contactar por WhatsApp</a></div>' +
            '</div>';
          updateActiveOrderTimer();
          activeOrderTimerInterval = setInterval(updateActiveOrderTimer, 60000);
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
          const items = ord.items || [];
          const totalStr = ord.total != null ? formatCurrency(ord.total) : '';
          const dateStr = formatOrderDate(ord.createdAt);
          const itemsHtml = items.length
            ? items.map((i) => '<li class="leading-tight">' + escapeHtml((i.quantity || 1) + ' × ' + (i.productName || 'Producto')) + '</li>').join('')
            : '<li class="text-gray-500">Sin ítems</li>';
          const repeatIcon = '<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>';
          return `<div class="flex items-start justify-between gap-3 p-3 border border-gray-200 bg-white mb-2">
            <div class="flex-1 min-w-0">
              <ul class="text-sm text-gray-800 space-y-0.5 list-none pl-0">${itemsHtml}</ul>
              <div class="mt-2 flex flex-wrap items-center gap-x-2 gap-y-0 text-xs text-gray-500">
                ${totalStr ? `<span class="font-bold text-gray-800">${totalStr}</span>` : ''}
                ${dateStr ? `<span>${escapeHtml(dateStr)}</span>` : ''}
              </div>
            </div>
            <button type="button" class="cart-repeat-btn flex-shrink-0 inline-flex items-center gap-1.5 py-1.5 px-3 text-sm text-red-600 hover:text-red-700 border border-red-300 hover:bg-red-50" data-idx="${idx}">${repeatIcon}Repetir</button>
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
          window.showView('cart');
          render();
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
      row.className = 'flex items-center gap-2 py-2 px-2 sm:px-3 bg-white border border-gray-200';
      const notesKey = item.notes || '';
      const trashSvg = '<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>';
      row.innerHTML = `
        <div class="w-16 flex-shrink-0 self-stretch min-h-[4rem] overflow-hidden bg-gray-100 flex">${cartItemImageHtml(item)}</div>
        <div class="flex-1 min-w-0">
          <p class="font-medium text-gray-900 break-words">${escapeHtml(item.productName)}</p>
          ${notesKey ? `<p class="text-xs text-gray-500">${escapeHtml(notesKey)}</p>` : ''}
          <p class="text-sm text-gray-600">${formatCurrency(item.price)} × ${item.quantity} = <span class="font-bold">${formatCurrency((item.price || 0) * (item.quantity || 0))}</span></p>
        </div>
        <div class="flex items-center gap-0.5 flex-shrink-0">
          <div class="flex items-center border border-gray-300 overflow-hidden">
            <button type="button" class="cart-qty-minus w-8 h-8 flex items-center justify-center bg-gray-50 hover:bg-gray-100 text-gray-700 text-lg font-light" data-idx="${idx}">−</button>
            <span class="cart-qty w-8 text-center py-1 text-sm border-x border-gray-300 bg-white">${item.quantity}</span>
            <button type="button" class="cart-qty-plus w-8 h-8 flex items-center justify-center bg-gray-50 hover:bg-gray-100 text-gray-700 text-lg font-light" data-idx="${idx}">+</button>
          </div>
          <button type="button" class="cart-remove w-8 h-8 flex items-center justify-center text-gray-500 hover:text-red-600 hover:bg-red-50 -ml-px" data-idx="${idx}" title="Eliminar">${trashSvg}</button>
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

    const incentiveEl = document.getElementById('cart-incentive-msg');
    if (items.length === 0) {
      if (minMsgEl) minMsgEl.classList.add('hidden');
      if (incentiveEl) {
        incentiveEl.textContent = 'Tu pedido está vacío. Agregá productos del catálogo y te lo llevamos o retirás en local.';
        incentiveEl.classList.remove('hidden');
      }
    } else {
      if (incentiveEl) incentiveEl.classList.add('hidden');
      if (minMsgEl && minimum > 0 && subtotal < minimum) {
        const missing = minimum - subtotal;
        minMsgEl.textContent = 'Agregá ' + formatCurrency(missing) + ' para alcanzar el mínimo de envío.';
        minMsgEl.classList.remove('hidden');
      } else if (minMsgEl) {
        minMsgEl.classList.add('hidden');
      }
    }

    const checkoutBtn = document.getElementById('cart-checkout');
    const continueBtn = document.getElementById('cart-continue');
    const hasItems = items.length > 0;
    if (checkoutBtn) {
      if (!hasItems) {
        checkoutBtn.classList.add('hidden');
      } else {
        checkoutBtn.classList.remove('hidden');
        const meetsMinimum = minimum <= 0 || subtotal >= minimum;
        const storeOpen = typeof window.isStoreOpen === 'function' ? window.isStoreOpen() : true;
        const canCheckout = meetsMinimum && storeOpen;
        checkoutBtn.disabled = !canCheckout;
        checkoutBtn.classList.toggle('opacity-50', !canCheckout);
        checkoutBtn.classList.toggle('cursor-not-allowed', !canCheckout);
      }
    }
    if (continueBtn) {
      continueBtn.classList.toggle('flex-1', hasItems);
      if (!hasItems) continueBtn.classList.add('w-full');
      else continueBtn.classList.remove('w-full');
    }

    const suggestionsEl = document.getElementById('cart-suggestions');
    const suggestionsSection = document.getElementById('cart-suggestions-section');
    const suggestionsSubtotalEl = document.getElementById('cart-suggestions-subtotal');
    if (suggestionsSubtotalEl) suggestionsSubtotalEl.textContent = formatCurrency(subtotal);

    if (suggestionsEl && suggestionsSection) {
      if (items.length === 0) {
        suggestionsSection.classList.add('hidden');
        suggestionsEl.innerHTML = '';
      } else {
      const config = window.getCatalogConfig ? window.getCatalogConfig() : {};
      const catalogProducts = config.products || {};
      const allProducts = typeof window.getProducts === 'function' ? window.getProducts() : [];
      const getProductBySku = (sku) => (Array.isArray(allProducts) ? allProducts.find((p) => (p.sku || p.id || '').toString().trim() === sku) : null);
      function cartItemToCatalogSku(item) {
        const pid = (item.productId || '').toString().trim();
        const vid = (item.variantId || '').toString().trim();
        const productFromApi = Array.isArray(allProducts) ? allProducts.find((p) => (p.id || '').toString() === pid || (p.sku || '').toString() === pid) : null;
        const productSku = productFromApi ? (productFromApi.sku || productFromApi.id || '').toString().trim() : pid;
        const catalogSku = (typeof window.getOrderProductId === 'function' ? window.getOrderProductId(productSku, vid) : null) || (vid || productSku);
        return (catalogSku || productSku || pid || vid).trim() || '';
      }
      const skusInCart = new Set(items.map(cartItemToCatalogSku).filter(Boolean));
      const variantToParent = typeof window.getDisplayProducts !== 'function' ? {} : (() => {
        const display = window.getDisplayProducts(allProducts || []);
        const map = {};
        (display || []).forEach((g) => {
          if (g.variants && g.variants.length) {
            const parentSku = (g.sku || g.id || '').toString().trim();
            g.variants.forEach((v) => { map[(v.sku || v.id || '').toString().trim()] = parentSku; });
          }
        });
        return map;
      })();
      const inCartCatalogSkus = new Set(skusInCart);
      skusInCart.forEach((sku) => {
        const parent = variantToParent[sku];
        if (parent) inCartCatalogSkus.add(parent);
      });

      const suggested = Object.entries(catalogProducts)
        .filter(([sku, cfg]) => cfg && cfg.active !== false && sku && !inCartCatalogSkus.has(sku.trim()))
        .slice(0, 16)
        .map(([sku, cfg]) => {
          const skuTrim = sku.trim();
          const product = getProductBySku(skuTrim);
          const productForDisplay = product ? { ...product, sku: product.sku || product.id || skuTrim } : { sku: skuTrim, name: (cfg.name || '').trim(), price: 0 };
          const name = (typeof window.getProductDisplayName === 'function' ? window.getProductDisplayName(productForDisplay) : (cfg.name || '').trim()) || (product && (product.name || '').trim()) || skuTrim;
          const price = product && product.price != null ? product.price : 0;
          return { sku: skuTrim, name, price, product: product || productForDisplay };
        });

      if (suggested.length === 0) {
        suggestionsSection.classList.add('hidden');
        suggestionsEl.innerHTML = '';
      } else {
        suggestionsSection.classList.remove('hidden');
        suggestionsEl.innerHTML = suggested
          .map((item) => {
            const path = typeof window.getProductImagePath === 'function' ? window.getProductImagePath(item.product) : '';
            const raw = path ? (path.startsWith('assets/') || path.startsWith('/') ? path : 'assets/' + path) : 'assets/icons/icon-192.png';
            const src = typeof window.assetUrl === 'function' ? window.assetUrl(raw) : raw;
            const fallback = typeof window.getDefaultProductImageUrl === 'function' ? window.getDefaultProductImageUrl() : 'assets/icons/icon-192.png';
            const name = escapeHtml(item.name);
            const price = formatCurrency(item.price);
            return (
              '<button type="button" class="cart-suggestion-card flex-shrink-0 w-28 snap-start text-left border border-gray-200 overflow-hidden bg-white hover:border-red-300 hover:shadow transition-colors" data-sku="' +
              escapeHtml(item.sku) +
              '">' +
              '<div class="w-full aspect-square bg-gray-100 overflow-hidden">' +
              '<img src="' + escapeHtml(src) + '" alt="" class="w-full h-full object-cover" data-fallback="' + escapeHtml(fallback) + '" onerror="this.onerror=null;var f=this.getAttribute(\'data-fallback\');if(f)this.src=f;">' +
              '</div>' +
              '<div class="p-1.5">' +
              '<p class="text-[10px] font-medium text-gray-900 leading-tight break-words">' + name + '</p>' +
              '<p class="text-[10px] text-red-600 font-medium mt-0.5">' + price + '</p>' +
              '</div></button>'
            );
          })
          .join('');
        suggestionsEl.querySelectorAll('.cart-suggestion-card').forEach((btn) => {
          const sku = btn.dataset.sku;
          const item = suggested.find((s) => s.sku === sku);
          if (item && typeof window.showProductDetail === 'function') {
            btn.addEventListener('click', () => window.showProductDetail(item.product));
          }
        });
      }
      }
    }
  }

  function escapeHtml(s) {
    if (s == null) return '';
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function cartItemImageHtml(item) {
    const allProducts = typeof window.getProducts === 'function' ? window.getProducts() : [];
    const pid = (item.productId || '').toString().trim();
    const vid = (item.variantId || '').toString().trim();
    const productFromApi = Array.isArray(allProducts) ? allProducts.find((p) => (p.id || '').toString() === pid || (p.sku || '').toString() === pid) : null;
    const productSku = productFromApi ? (productFromApi.sku || productFromApi.id || '').toString().trim() : pid;
    const catalogSku = (typeof window.getOrderProductId === 'function' ? window.getOrderProductId(productSku, vid) : null) || (vid || productSku);
    const sku = (catalogSku || productSku || pid || vid).trim() || '';
    const p = sku ? { sku } : null;
    const path = (typeof window.getProductImagePath === 'function' ? window.getProductImagePath(p) : '') || '';
    const raw = path ? (path.startsWith('assets/') || path.startsWith('/') ? path : 'assets/' + path) : (typeof window.getDefaultProductImage === 'function' ? window.getDefaultProductImage() : 'assets/icons/icon-192.png');
    const src = typeof window.assetUrl === 'function' ? window.assetUrl(raw) : raw;
    const fallback = (typeof window.getDefaultProductImageUrl === 'function' ? window.getDefaultProductImageUrl() : 'assets/icons/icon-192.png');
    return '<img src="' + escapeHtml(src) + '" alt="" class="w-full h-full object-cover bg-gray-100" data-fallback="' + escapeHtml(fallback) + '" onerror="this.onerror=null;var f=this.getAttribute(\'data-fallback\');if(f)this.src=f;">';
  }

  function resolveCartItemToCatalogSku(item) {
    const allProducts = typeof window.getProducts === 'function' ? window.getProducts() : [];
    const pid = (item.productId || '').toString().trim();
    const vid = (item.variantId || '').toString().trim();
    const productFromApi = Array.isArray(allProducts) ? allProducts.find((p) => (p.id || '').toString() === pid || (p.sku || '').toString() === pid) : null;
    const productSku = productFromApi ? (productFromApi.sku || productFromApi.id || '').toString().trim() : pid;
    const catalogSku = (typeof window.getOrderProductId === 'function' ? window.getOrderProductId(productSku, vid) : null) || (vid || productSku);
    return (catalogSku || productSku || pid || vid).trim() || '';
  }

  window.getCartQuantityForProduct = function (productSku) {
    const sku = (productSku || '').toString().trim();
    if (!sku || !window.cart || !window.cart.items.length) return 0;
    const allProducts = typeof window.getProducts === 'function' ? window.getProducts() : [];
    const display = typeof window.getDisplayProducts === 'function' ? window.getDisplayProducts(allProducts || []) : [];
    const variantToParent = {};
    (display || []).forEach((g) => {
      if (g.variants && g.variants.length) {
        const parentSku = (g.sku || g.id || '').toString().trim();
        g.variants.forEach((v) => { variantToParent[(v.sku || v.id || '').toString().trim()] = parentSku; });
      }
    });
    return window.cart.items.reduce((total, item) => {
      const resolved = resolveCartItemToCatalogSku(item);
      if (!resolved) return total;
      if (resolved === sku || variantToParent[resolved] === sku) return total + (item.quantity || 0);
      return total;
    }, 0);
  };

  window.initCart = function () {
    const backBtn = document.getElementById('cart-back-btn');
    if (backBtn) backBtn.addEventListener('click', () => window.showView('home'));
    document.getElementById('cart-continue').addEventListener('click', (e) => {
      e.preventDefault();
      window.showView('home');
    });
    document.getElementById('cart-checkout').addEventListener('click', () => {
      if (!window.cart || window.cart.items.length === 0) return;
      if (typeof window.isStoreOpen === 'function' && !window.isStoreOpen()) {
        alert('El local está cerrado en este momento. No se pueden finalizar pedidos hasta que abramos.');
        return;
      }
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
