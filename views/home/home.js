/**
 * Vista Home: nombre comercio, tiempo/envío/mínimo, buscador, categorías, listado productos.
 */
(function () {
  const config = window.getCatalogConfig || (() => ({}));
  const formatCurrency = (n) => {
    if (n == null || isNaN(n)) return '$ -';
    return '$ ' + Math.round(n).toLocaleString('es-UY');
  };

  function productImageHtml(p) {
    const path = (p && p.imagePath) ? p.imagePath.trim() : '';
    if (!path) return '<div class="aspect-square bg-gray-100 flex items-center justify-center text-gray-400 text-4xl">📦</div>';
    const src = path.startsWith('assets/') || path.startsWith('/') ? path : 'assets/' + path;
    return `<img src="${escapeHtml(src)}" alt="${escapeHtml(p.name || '')}" class="w-full aspect-square object-cover bg-gray-100">`;
  }

  function filterProducts(products, categoryId, searchTerm) {
    let list = products || [];
    const cat = (config().categories || []).find((c) => c.id === categoryId);
    if (cat && cat.tag && categoryId !== 'todos') {
      const tag = cat.tag.toUpperCase();
      list = list.filter((p) => {
        const tags = Array.isArray(p.tags) ? p.tags : (p.tags && typeof p.tags === 'object' ? Object.values(p.tags) : []);
        return tags.some((t) => String(t).toUpperCase() === tag);
      });
    }
    if (searchTerm && searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      list = list.filter((p) => (p.name || '').toLowerCase().includes(term));
    }
    return list;
  }

  function renderProducts(list) {
    const container = document.getElementById('home-products');
    if (!container) return;
    container.innerHTML = '';
    (list || []).forEach((p) => {
      const price = p.price != null ? p.price : 0;
      const card = document.createElement('div');
      card.className = 'bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow transition-shadow';
      card.innerHTML = `
        <div class="aspect-square overflow-hidden bg-gray-100">${productImageHtml(p)}</div>
        <div class="p-3">
          <h3 class="font-medium text-gray-900 line-clamp-2">${escapeHtml(p.name || '')}</h3>
          <p class="text-sm text-gray-600 mt-0.5">${formatCurrency(price)}</p>
          <button type="button" class="mt-2 w-full py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 product-add-btn" data-product-id="${escapeHtml(p.id || '')}">Ver / Agregar</button>
        </div>
      `;
      card.querySelector('.product-add-btn').addEventListener('click', () => {
        if (typeof window.showProductDetail === 'function') window.showProductDetail(p);
      });
      container.appendChild(card);
    });
  }

  function escapeHtml(s) {
    if (s == null) return '';
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function render() {
    const cfg = config();
    document.getElementById('home-time').textContent = (cfg.estimatedMinutes || '30-45') + ' min';
    document.getElementById('home-shipping').textContent = formatCurrency(cfg.shippingCost);
    document.getElementById('home-minimum').textContent = formatCurrency(cfg.minimumForShipping);

    const categoriesEl = document.getElementById('home-categories');
    if (categoriesEl) {
      categoriesEl.innerHTML = (cfg.categories || []).map((c) => `<button type="button" class="category-btn px-3 py-1.5 rounded-full border border-gray-300 text-sm hover:border-red-600 hover:text-red-600" data-category="${escapeHtml(c.id)}">${escapeHtml(c.name)}</button>`).join('');
      categoriesEl.querySelectorAll('.category-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          const cat = btn.dataset.category;
          const term = document.getElementById('home-search')?.value || '';
          const list = filterProducts(window.getProducts(), cat, term);
          renderProducts(list);
        });
      });
    }

    const searchEl = document.getElementById('home-search');
    const categoryId = 'todos';
    const list = filterProducts(window.getProducts(), categoryId, searchEl ? searchEl.value : '');
    renderProducts(list);
  }

  window.initHome = function () {
    const searchEl = document.getElementById('home-search');
    if (searchEl) {
      searchEl.addEventListener('input', () => render());
      searchEl.addEventListener('search', () => render());
    }
    render();
  };

  window.renderView = window.renderView || (function () {});
  const orig = window.renderView;
  window.renderView = function (name) {
    if (typeof orig === 'function') orig(name);
    if (name === 'home') render();
  };
})();
