/**
 * nrd-catalogo - App de catálogo y pedidos (cliente)
 * Navegación entre vistas sin registro ni login.
 */
(function () {
  const views = ['home', 'catalog', 'product', 'cart', 'checkout', 'success'];
  let currentView = 'home';
  let products = [];
  let companyInfo = null;

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

  let activeOrderIndicatorUnsubscribe = null;
  function updateActiveOrderIndicator() {
    const navCart = document.getElementById('nav-cart');
    if (!navCart) return;
    if (activeOrderIndicatorUnsubscribe) {
      activeOrderIndicatorUnsubscribe();
      activeOrderIndicatorUnsubscribe = null;
    }
    const activeOrderId = typeof window.getActiveOrderIdFromStorage === 'function' ? window.getActiveOrderIdFromStorage() : null;
    const nrd = window.nrd;

    function setActiveOrderStyle(isActive) {
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

    if (!activeOrderId) {
      setActiveOrderStyle(false);
      return;
    }
    if (!nrd || !nrd.orders) {
      setActiveOrderStyle(true);
      return;
    }
    activeOrderIndicatorUnsubscribe = nrd.orders.onValueById(activeOrderId, function (order) {
      if (!order) {
        if (typeof window.clearActiveOrderIdFromStorage === 'function') window.clearActiveOrderIdFromStorage();
        setActiveOrderStyle(false);
        return;
      }
      const status = (order.status || 'Pendiente').toLowerCase();
      const isPending = status !== 'completado' && status !== 'cancelado';
      if (!isPending) {
        if (typeof window.clearActiveOrderIdFromStorage === 'function') window.clearActiveOrderIdFromStorage();
        setActiveOrderStyle(false);
        return;
      }
      setActiveOrderStyle(true);
    });
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

  async function init() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.classList.remove('hidden');
    try {
      const nrd = window.nrd;
      if (!nrd) {
        console.error('NRD Data Access no disponible. Comprueba que nrd-data-access.js cargue (local: /nrd-data-access/dist/ o CDN).');
        showCatalogError('No se pudo cargar la librería de datos. Recarga la página.');
        if (overlay) overlay.classList.add('hidden');
        return;
      }
      if (!nrd.catalogConfig) {
        console.error('nrd.catalogConfig no existe. Usa una versión de nrd-data-access que incluya CatalogConfigService (build reciente).');
        showCatalogError('Versión de la librería sin soporte de catálogo. Actualiza nrd-data-access.');
      }
      // Autenticación anónima para acceder a Firebase (productos, companyInfo, catalog)
      if (nrd.auth && typeof nrd.auth.signInAnonymously === 'function') {
        if (!nrd.auth.getCurrentUser()) await nrd.auth.signInAnonymously();
        await new Promise(function (r) { setTimeout(r, 500); });
      }
      if (nrd.companyInfo) {
        try {
          const info = await nrd.companyInfo.get();
          window.setCompanyInfo(info);
          if (typeof window.setCatalogConfigFromCompany === 'function') window.setCatalogConfigFromCompany(info);
        } catch (e) { console.warn('CompanyInfo no cargado', e); }
      }
      if (nrd.catalogConfig) {
        if (typeof nrd.catalogConfig.onValue === 'function') {
          nrd.catalogConfig.onValue(function (config) {
            if (typeof window.setCatalogConfig === 'function') window.setCatalogConfig(config || {});
            clearCatalogError();
            updateHeader();
            if (typeof window.renderView === 'function' && currentView) window.renderView(currentView);
          });
        }
        try {
          const remote = await nrd.catalogConfig.get();
          if (remote && typeof remote === 'object' && typeof window.setCatalogConfig === 'function') {
            window.setCatalogConfig(remote);
            clearCatalogError();
          } else if (remote == null && typeof window.setCatalogConfig === 'function') {
            window.setCatalogConfig({});
          }
        } catch (e) {
          console.error('Error al cargar catálogo desde Firebase:', e);
          console.error('Revisa: 1) Reglas de Realtime Database (lectura en /catalog para auth != null). 2) Sign-in anónimo activado en Firebase Console.');
          showCatalogError('No se pudo cargar el catálogo. Revisa consola (F12) y reglas de Firebase.');
        }
      }
      if (nrd.products) {
        try {
          const flatProducts = await nrd.products.getAll({ flat: true });
          const list = Array.isArray(flatProducts) ? flatProducts : [];
          const active = list.filter(function (p) { return p.active !== false; });
          window.setProducts(active);
        } catch (e) {
          console.error('Error al cargar productos:', e);
          window.setProducts([]);
        }
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
    } finally {
      if (overlay) overlay.classList.add('hidden');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
