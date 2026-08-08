/**
 * nrd-catalogo - App de catálogo y pedidos (cliente)
 * Habla solo con https://api.nrdonline.site (sin Firebase en el browser).
 */
(function () {
  const views = ['home', 'catalog', 'product', 'cart', 'checkout', 'success'];
  let currentView = 'home';
  let products = [];
  let companyInfo = null;
  let activeOrderPollTimer = null;
  const ACTIVE_ORDER_POLL_MS = 20000;

  function showView(name) {
    views.forEach((id) => {
      const el = document.getElementById('view-' + id);
      if (el) el.classList.toggle('hidden', id !== name);
    });
    currentView = name;
    if (typeof window.renderView === 'function') window.renderView(name);
  }

  function updateCartCount() {
    const el = document.getElementById('cart-count');
    if (!el) return;
    const n = window.cart ? window.cart.getCount() : 0;
    el.textContent = n;
    el.classList.toggle('hidden', n === 0);
  }

  function setActiveOrderStyle(isActive) {
    const navCart = document.getElementById('nav-cart');
    if (!navCart) return;
    if (isActive) {
      navCart.classList.remove('text-red-600', 'hover:text-red-700');
      navCart.classList.add('text-amber-600', 'hover:text-amber-700', 'nav-cart--active-order');
      navCart.title = 'Pedido en curso';
    } else {
      navCart.classList.remove('text-amber-600', 'hover:text-amber-700', 'nav-cart--active-order');
      navCart.classList.add('text-red-600', 'hover:text-red-700');
      navCart.title = 'Mi pedido';
    }
  }

  function stopActiveOrderPoll() {
    if (activeOrderPollTimer) {
      clearInterval(activeOrderPollTimer);
      activeOrderPollTimer = null;
    }
  }

  async function refreshActiveOrderStatus() {
    const activeOrderId = typeof window.getActiveOrderIdFromStorage === 'function'
      ? window.getActiveOrderIdFromStorage()
      : null;
    if (!activeOrderId) {
      setActiveOrderStyle(false);
      stopActiveOrderPoll();
      return null;
    }
    if (!window.CatalogAPI || typeof window.CatalogAPI.fetchOrder !== 'function') {
      setActiveOrderStyle(true);
      return null;
    }
    try {
      const order = await window.CatalogAPI.fetchOrder(activeOrderId);
      if (!order) {
        if (typeof window.clearActiveOrderIdFromStorage === 'function') window.clearActiveOrderIdFromStorage();
        setActiveOrderStyle(false);
        stopActiveOrderPoll();
        return null;
      }
      const status = (order.status || 'Pendiente').toLowerCase();
      const isPending = status !== 'completado' && status !== 'cancelado';
      if (!isPending) {
        if (typeof window.clearActiveOrderIdFromStorage === 'function') window.clearActiveOrderIdFromStorage();
        setActiveOrderStyle(false);
        stopActiveOrderPoll();
        return order;
      }
      setActiveOrderStyle(true);
      return order;
    } catch (e) {
      if (e && e.status === 404) {
        if (typeof window.clearActiveOrderIdFromStorage === 'function') window.clearActiveOrderIdFromStorage();
        setActiveOrderStyle(false);
        stopActiveOrderPoll();
        return null;
      }
      console.warn('No se pudo consultar pedido activo:', e);
      setActiveOrderStyle(true);
      return null;
    }
  }

  function updateActiveOrderIndicator() {
    stopActiveOrderPoll();
    const activeOrderId = typeof window.getActiveOrderIdFromStorage === 'function'
      ? window.getActiveOrderIdFromStorage()
      : null;
    if (!activeOrderId) {
      setActiveOrderStyle(false);
      return;
    }
    setActiveOrderStyle(true);
    refreshActiveOrderStatus();
    activeOrderPollTimer = setInterval(refreshActiveOrderStatus, ACTIVE_ORDER_POLL_MS);
  }

  document.getElementById('nav-home').addEventListener('click', (e) => { e.preventDefault(); showView('home'); });
  document.getElementById('nav-cart').addEventListener('click', (e) => { e.preventDefault(); showView('cart'); });

  function fixDor(name) {
    if (!name || typeof name !== 'string') return name;
    return name.replace(/\bDor\b/gi, "D'or");
  }

  function updateHeader() {
    const cfg = typeof window.getCatalogConfig === 'function' ? window.getCatalogConfig() : {};
    const businessEl = document.getElementById('header-business-name');
    const deliveryEl = document.getElementById('header-delivery-info');
    const logoEl = document.getElementById('header-logo');
    const raw = (companyInfo && companyInfo.tradeName) ? companyInfo.tradeName : (cfg.brandName || "Nueva Río D'or");
    if (businessEl) businessEl.textContent = fixDor(raw);
    if (deliveryEl) {
      const min = cfg.estimatedMinutes || '30-45';
      const ship = cfg.shippingCost != null ? Math.round(cfg.shippingCost).toLocaleString('es-UY') : '-';
      const minimo = cfg.minimumForShipping != null ? Math.round(cfg.minimumForShipping).toLocaleString('es-UY') : '-';
      deliveryEl.textContent = `${min} min · $${ship} envío · Mínimo $${minimo}`;
    }
    if (logoEl && typeof window.assetUrl === 'function') logoEl.src = window.assetUrl('assets/icons/icon-192.png');
  }

  function showAlert(title, message) {
    return new Promise(function (resolve) {
      var box = document.getElementById('app-alert');
      var titleEl = document.getElementById('app-alert-title');
      var messageEl = document.getElementById('app-alert-message');
      var okBtn = document.getElementById('app-alert-ok');
      if (!box || !titleEl || !messageEl || !okBtn) {
        resolve();
        return;
      }
      titleEl.textContent = title || '';
      messageEl.textContent = message || '';
      box.classList.remove('hidden');
      function close() {
        box.classList.add('hidden');
        okBtn.removeEventListener('click', close);
        box.removeEventListener('click', onBackdrop);
        resolve();
      }
      function onBackdrop(e) {
        if (e.target === box) close();
      }
      okBtn.addEventListener('click', close);
      box.addEventListener('click', onBackdrop);
    });
  }

  window.showView = showView;
  window.getProducts = () => products;
  window.setProducts = (p) => { products = p; };
  window.getCompanyInfo = () => companyInfo;
  window.setCompanyInfo = (c) => { companyInfo = c; };
  window.updateCartCount = updateCartCount;
  window.updateActiveOrderIndicator = updateActiveOrderIndicator;
  window.refreshActiveOrderStatus = refreshActiveOrderStatus;
  window.showAlert = showAlert;

  if (window.cart) window.cart.onChange(updateCartCount);

  function showCatalogError(message) {
    var app = document.getElementById('app');
    var el = document.getElementById('catalog-load-error');
    if (!el && app) {
      el = document.createElement('div');
      el.id = 'catalog-load-error';
      el.className = 'bg-amber-50 border-b border-amber-200 px-4 py-2 text-sm text-amber-900';
      app.insertBefore(el, app.firstChild);
    }
    if (el) {
      el.textContent = message;
      el.classList.remove('hidden');
    }
  }

  function clearCatalogError() {
    var el = document.getElementById('catalog-load-error');
    if (el) el.classList.add('hidden');
  }

  function showSpinnerSafe(message) {
    var el = document.getElementById('loading-spinner');
    if (!el) return;
    el.classList.remove('hidden');
    el.setAttribute('aria-hidden', 'false');
    el.textContent = message || 'Cargando...';
    el.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/40 text-white text-sm font-medium';
  }

  function hideSpinnerSafe() {
    var el = document.getElementById('loading-spinner');
    if (!el) return;
    el.classList.add('hidden');
    el.setAttribute('aria-hidden', 'true');
    el.textContent = '';
    el.className = 'hidden';
  }

  async function handleMercadoPagoReturn() {
    let params;
    try {
      params = new URLSearchParams(window.location.search || '');
    } catch (e) {
      return;
    }
    const paymentReturn = params.get('payment');
    const checkoutId = params.get('checkoutId') || params.get('orderId');
    if (!paymentReturn || !checkoutId) return;

    try {
      const cleanUrl = window.location.pathname + (window.location.hash || '');
      window.history.replaceState({}, '', cleanUrl);
    } catch (e) { /* ignore */ }

    let paymentStatus = '';
    let realOrderId = '';
    showSpinnerSafe('Confirmando pago...');
    try {
      if (window.CatalogAPI && typeof window.CatalogAPI.syncMpPayment === 'function') {
        try {
          const synced = await window.CatalogAPI.syncMpPayment(checkoutId);
          if (synced && synced.paymentStatus) paymentStatus = synced.paymentStatus;
          realOrderId = (synced && synced.orderId) ? String(synced.orderId) : '';
          if (realOrderId && paymentStatus === 'approved') {
            if (typeof window.setActiveOrderIdToStorage === 'function') {
              window.setActiveOrderIdToStorage(realOrderId);
            }
            if (typeof window.setActiveOrderSnapshotToStorage === 'function') {
              window.setActiveOrderSnapshotToStorage(Object.assign({}, synced, {
                id: realOrderId,
                orderId: realOrderId
              }));
            }
            if (window.cart) window.cart.clear();
            if (typeof window.updateCartCount === 'function') window.updateCartCount();
            try {
              const name = (synced.clientDisplayName || '').trim();
              // snapshot mínimo para repetir pedido
              if (typeof window.addLastOrderToStorage === 'function' && synced.total != null) {
                window.addLastOrderToStorage({
                  name: name,
                  phone: '',
                  address: '',
                  items: synced.items || [],
                  total: synced.total
                });
              }
            } catch (e) { /* ignore */ }
          }
        } catch (syncErr) {
          console.warn('No se pudo sincronizar pago MP:', syncErr);
        }
      }
      try { sessionStorage.removeItem('nrd-mp-checkout-id'); } catch (e) { /* ignore */ }
    } finally {
      hideSpinnerSafe();
    }

    if (typeof window.updateActiveOrderIndicator === 'function') {
      window.updateActiveOrderIndicator();
    }
    if (typeof window.showSuccess === 'function') {
      window.showSuccess({
        paymentReturn: paymentReturn,
        paymentStatus: paymentStatus,
        orderCreated: !!(realOrderId && paymentStatus === 'approved')
      });
    } else {
      showView('success');
    }
  }

  async function init() {
    showSpinnerSafe('Cargando catálogo...');
    try {
      if (!window.CatalogAPI || typeof window.CatalogAPI.fetchCatalog !== 'function') {
        console.error('CatalogAPI no disponible');
        showCatalogError('No se pudo cargar el cliente de la API. Recarga la página.');
        return;
      }
      try {
        const remote = await window.CatalogAPI.fetchCatalog();
        if (remote && typeof remote === 'object') {
          if (typeof window.setCatalogConfig === 'function') window.setCatalogConfig(remote);
          const built = typeof window.buildProductsFromCatalogConfig === 'function'
            ? window.buildProductsFromCatalogConfig()
            : [];
          window.setProducts(built);
          if (remote.brandName) {
            window.setCompanyInfo({ tradeName: remote.brandName });
          }
          clearCatalogError();
        } else {
          if (typeof window.setCatalogConfig === 'function') window.setCatalogConfig({});
          window.setProducts([]);
          showCatalogError('El catálogo llegó vacío. Intentá más tarde.');
        }
      } catch (e) {
        console.error('Error al cargar catálogo desde API:', e);
        const msg = (e && e.message) ? e.message : 'No se pudo cargar el catálogo';
        showCatalogError(msg + '. Revisá la conexión e intentá recargar.');
        window.setProducts([]);
      }
      updateHeader();
      if (typeof window.initHome === 'function') window.initHome();
      if (typeof window.initCatalog === 'function') window.initCatalog();
      if (typeof window.initProductDetail === 'function') window.initProductDetail();
      if (typeof window.initCart === 'function') window.initCart();
      if (typeof window.initCheckout === 'function') window.initCheckout();
      if (typeof window.initSuccess === 'function') window.initSuccess();
      updateCartCount();
      updateActiveOrderIndicator();
      await handleMercadoPagoReturn();
    } finally {
      hideSpinnerSafe();
    }
  }

  var catalogoAppStarted = false;

  function startCatalogApp() {
    if (catalogoAppStarted) return;
    catalogoAppStarted = true;
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  }

  window.addEventListener('nrd-catalogo-ready', startCatalogApp);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      setTimeout(startCatalogApp, 0);
    });
  } else {
    setTimeout(startCatalogApp, 0);
  }
})();
