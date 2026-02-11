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

  document.getElementById('nav-home').addEventListener('click', (e) => {
    e.preventDefault();
    showView('home');
  });
  document.getElementById('nav-cart').addEventListener('click', (e) => {
    e.preventDefault();
    showView('cart');
  });

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
      if (nrd && nrd.companyInfo) {
        const info = await nrd.companyInfo.get();
        window.setCompanyInfo(info);
        if (typeof setCatalogConfigFromCompany === 'function') setCatalogConfigFromCompany(info);
        const titleEl = document.getElementById('nav-home');
        if (titleEl && info && info.tradeName) titleEl.textContent = info.tradeName;
      }
      if (nrd && nrd.products) {
        const list = await nrd.products.getAll({ withVariants: true });
        const active = (list || []).filter((p) => p.active !== false);
        const withCatalogTag = active.filter((p) => {
          const tags = Array.isArray(p.tags) ? p.tags : (p.tags && typeof p.tags === 'object' ? Object.values(p.tags) : []);
          return tags.some((t) => String(t).toUpperCase() === 'CATALOGO');
        });
        window.setProducts(withCatalogTag);
      }
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
