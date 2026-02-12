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

  document.getElementById('nav-home').addEventListener('click', (e) => { e.preventDefault(); showView('home'); });
  document.getElementById('nav-cart').addEventListener('click', (e) => { e.preventDefault(); showView('cart'); });

  function updateHeader() {
    const cfg = typeof window.getCatalogConfig === 'function' ? window.getCatalogConfig() : {};
    const businessEl = document.getElementById('header-business-name');
    const deliveryEl = document.getElementById('header-delivery-info');
    const logoEl = document.getElementById('header-logo');
    if (businessEl) businessEl.textContent = (companyInfo && companyInfo.tradeName) ? companyInfo.tradeName : (cfg.brandName || "Nueva Río D'or");
    if (deliveryEl) {
      const min = cfg.estimatedMinutes || '30-45';
      const ship = cfg.shippingCost != null ? Math.round(cfg.shippingCost).toLocaleString('es-UY') : '-';
      const minimo = cfg.minimumForShipping != null ? Math.round(cfg.minimumForShipping).toLocaleString('es-UY') : '-';
      deliveryEl.textContent = `${min} min · $${ship} envío · Mínimo $${minimo}`;
    }
    if (logoEl && typeof window.assetUrl === 'function') logoEl.src = window.assetUrl('assets/icons/icon-192.png');
  }

  window.showView = showView;
  window.getProducts = () => products;
  window.setProducts = (p) => { products = p; };
  window.getCompanyInfo = () => companyInfo;
  window.setCompanyInfo = (c) => { companyInfo = c; };
  window.updateCartCount = updateCartCount;

  if (window.cart) window.cart.onChange(updateCartCount);

  async function init() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.classList.remove('hidden');
    try {
      const nrd = window.nrd;
      if (!nrd) {
        console.error('NRD Data Access no disponible');
        if (overlay) overlay.classList.add('hidden');
        return;
      }
      // Autenticación anónima para acceder a Firebase (productos, companyInfo)
      if (nrd.auth) {
        const user = nrd.auth.getCurrentUser();
        if (!user) {
          if (typeof nrd.auth.signInAnonymously === 'function') {
            await nrd.auth.signInAnonymously();
          } else {
            console.warn('signInAnonymously no disponible; activar Anonymous en Firebase Console → Authentication → Sign-in method');
          }
        }
      }
      if (nrd.companyInfo) {
        const info = await nrd.companyInfo.get();
        window.setCompanyInfo(info);
        if (typeof setCatalogConfigFromCompany === 'function') setCatalogConfigFromCompany(info);
      }
      if (nrd.products) {
        const [withVariants, withoutVariants] = await Promise.all([
          nrd.products.getAll({ withVariants: true }),
          nrd.products.getAll({ withVariants: false })
        ]);
        const allItems = [...(withVariants || []), ...(withoutVariants || [])];
        const active = allItems.filter((p) => p.active !== false);
        const withCatalogTag = active.filter((p) => {
          const tags = Array.isArray(p.tags) ? p.tags : (p.tags && typeof p.tags === 'object' ? Object.values(p.tags) : []);
          return tags.some((t) => String(t).toUpperCase() === 'CATALOGO');
        });
        window.setProducts(withCatalogTag);
      }
      updateHeader();
      if (typeof window.initHome === 'function') window.initHome();
      if (typeof window.initCatalog === 'function') window.initCatalog();
      if (typeof window.initProductDetail === 'function') window.initProductDetail();
      if (typeof window.initCart === 'function') window.initCart();
      if (typeof window.initCheckout === 'function') window.initCheckout();
      if (typeof window.initSuccess === 'function') window.initSuccess();
      updateCartCount();
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
