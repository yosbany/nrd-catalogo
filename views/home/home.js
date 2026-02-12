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
    const path = (typeof window.getProductImagePath === 'function' ? window.getProductImagePath(p) : (p && p.imagePath) ? p.imagePath.trim() : '') || '';
    const raw = path ? (path.startsWith('assets/') || path.startsWith('/') ? path : 'assets/' + path) : (typeof window.getDefaultProductImage === 'function' ? window.getDefaultProductImage() : 'assets/icons/icon-192.png');
    const src = typeof window.assetUrl === 'function' ? window.assetUrl(raw) : raw;
    const fallback = (typeof window.getDefaultProductImageUrl === 'function' ? window.getDefaultProductImageUrl() : 'assets/icons/icon-192.png');
    const displayName = typeof window.getProductDisplayName === 'function' ? window.getProductDisplayName(p) : (p.name || '');
    return `<img src="${escapeHtml(src)}" alt="${escapeHtml(displayName)}" class="w-full h-full object-cover bg-gray-100 rounded-none" data-fallback="${escapeHtml(fallback)}" onerror="this.onerror=null;var f=this.getAttribute('data-fallback');if(f)this.src=f;">`;
  }

  function getProductTags(p) {
    const raw = p.tags;
    if (!raw) return [];
    return Array.isArray(raw) ? raw : (typeof raw === 'object' ? Object.values(raw) : []);
  }

  function findProductCategory(product) {
    const cats = config().categories || [];
    const cfgCatId = typeof window.getProductCategoryId === 'function' ? window.getProductCategoryId(product) : null;
    if (cfgCatId) {
      const cat = cats.find((c) => c.id === cfgCatId);
      if (cat) return cat;
    }
    const tags = getProductTags(product).map((t) => String(t).toUpperCase());
    const catsWithTag = cats.filter((c) => c.tag);
    for (const cat of catsWithTag) {
      const tag = (cat.tag || '').toUpperCase();
      if (tags.includes(tag)) return cat;
    }
    return null;
  }

  function filterProducts(products, categoryId, searchTerm) {
    let list = products || [];
    const cat = (config().categories || []).find((c) => c.id === categoryId);
    if (cat && categoryId !== 'todos') {
      if (cat.tag) {
        const tag = cat.tag.toUpperCase();
        list = list.filter((p) => {
          const cfgCatId = typeof window.getProductCategoryId === 'function' ? window.getProductCategoryId(p) : null;
          if (cfgCatId === categoryId) return true;
          return getProductTags(p).some((t) => String(t).toUpperCase() === tag);
        });
      } else {
        list = list.filter((p) => (typeof window.getProductCategoryId === 'function' ? window.getProductCategoryId(p) : null) === categoryId);
      }
    }
    if (searchTerm && searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      list = list.filter((p) => ((typeof window.getProductDisplayName === 'function' ? window.getProductDisplayName(p) : (p.name || '')) || '').toLowerCase().includes(term));
    }
    return list;
  }

  function groupProductsBySection(products) {
    const cats = (config().categories || []).filter((c) => c.tag);
    const sections = cats.map((c) => ({ id: c.id, name: c.name, products: [] }));
    const otros = { id: 'otros', name: 'Otros', products: [] };

    for (const p of products) {
      const cat = findProductCategory(p);
      if (cat) {
        const sec = sections.find((s) => s.id === cat.id);
        if (sec) sec.products.push(p);
        else otros.products.push(p);
      } else {
        otros.products.push(p);
      }
    }

    return [...sections.filter((s) => s.products.length > 0), ...(otros.products.length > 0 ? [otros] : [])];
  }

  function isMasVendido(p) {
    if (p.masVendido === true) return true;
    if (p.attributes && p.attributes.masVendido === true) return true;
    const tags = getProductTags(p).map((t) => String(t).toUpperCase());
    return tags.includes('MAS_VENDIDO') || tags.includes('MASVENDIDO');
  }


  function renderProductCard(p) {
    const price = p.price != null ? p.price : 0;
    const desc = (typeof window.getProductDescription === 'function' ? window.getProductDescription(p) : (p.description || (p.attributes && p.attributes.description) || '').trim());
    const masVendido = isMasVendido(p);
    const card = document.createElement('div');
    card.className = 'flex bg-white border border-gray-200 overflow-hidden hover:border-red-300 transition-colors cursor-pointer';
    card.dataset.productId = (p && p.id) ? String(p.id) : '';
    card.innerHTML = `
      <div class="flex-1 min-w-0 p-3 flex flex-col order-2 md:order-1">
        <div class="relative">
          ${masVendido ? '<span class="inline-block px-2 py-0.5 bg-amber-100 text-amber-900 text-xs font-medium border border-amber-200 mb-1">Más vendido</span>' : ''}
          <h3 class="font-medium text-gray-900 line-clamp-2">${escapeHtml(typeof window.getProductDisplayName === 'function' ? window.getProductDisplayName(p) : (p.name || ''))}</h3>
          ${desc ? `<p class="text-sm text-gray-600 mt-0.5 line-clamp-2">${escapeHtml(desc)}</p>` : ''}
          <p class="text-red-600 font-medium mt-1">${formatCurrency(price)}</p>
        </div>
      </div>
      <div class="w-24 md:w-32 flex-shrink-0 self-stretch overflow-hidden bg-gray-100 rounded-none order-1 md:order-2 flex items-stretch">${productImageHtml(p)}</div>
    `;
    card.addEventListener('click', () => {
      if (typeof window.showProductDetail === 'function') window.showProductDetail(p);
    });
    return card;
  }

  function renderProducts(list, categoryId) {
    const container = document.getElementById('home-products');
    if (!container) return;
    container.innerHTML = '';

    if (categoryId === 'todos' && list.length > 0) {
      const sections = groupProductsBySection(list);
      sections.forEach((sec) => {
        const header = document.createElement('h3');
        header.className = 'text-base font-semibold text-gray-900 py-3 border-b border-gray-200 mt-4 first:mt-0';
        header.textContent = sec.name;
        container.appendChild(header);
        const sectionWrap = document.createElement('div');
        sectionWrap.className = 'grid grid-cols-1 md:grid-cols-2 gap-2';
        sec.products.forEach((p) => sectionWrap.appendChild(renderProductCard(p)));
        container.appendChild(sectionWrap);
      });
    } else {
      const wrap = document.createElement('div');
      wrap.className = 'grid grid-cols-1 md:grid-cols-2 gap-2';
      (list || []).forEach((p) => wrap.appendChild(renderProductCard(p)));
      container.appendChild(wrap);
    }
    highlightLastAddedProduct();
  }

  function highlightLastAddedProduct() {
    const lastAdded = typeof window.getAndClearLastAddedProductFromStorage === 'function' ? window.getAndClearLastAddedProductFromStorage() : null;
    if (!lastAdded || !lastAdded.productId) return;
    requestAnimationFrame(() => {
      const container = document.getElementById('home-products');
      if (!container) return;
      const cards = container.querySelectorAll('[data-product-id]');
      const card = Array.from(cards).find((c) => c.dataset.productId === String(lastAdded.productId));
      if (!card) return;
      card.classList.add('ring-2', 'ring-red-500', 'ring-offset-2');
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => {
        card.classList.remove('ring-2', 'ring-red-500', 'ring-offset-2');
      }, 3000);
    });
  }

  let currentCategoryId = 'todos';

  function escapeHtml(s) {
    if (s == null) return '';
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function render() {
    const cfg = config();
    const categoriesEl = document.getElementById('home-categories');
    if (categoriesEl) {
      categoriesEl.innerHTML = (cfg.categories || []).map((c) => `<button type="button" class="category-btn px-3 py-1.5 border border-gray-300 text-sm hover:border-red-600 hover:text-red-600 hover:bg-red-50 whitespace-nowrap ${c.id === currentCategoryId ? 'active' : ''}" data-category="${escapeHtml(c.id)}">${escapeHtml(c.name)}</button>`).join('');
      categoriesEl.querySelectorAll('.category-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          categoriesEl.querySelectorAll('.category-btn').forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
          currentCategoryId = btn.dataset.category;
          const cat = currentCategoryId;
          const term = document.getElementById('home-search')?.value || '';
          const raw = window.getProducts() || [];
          const display = typeof window.getDisplayProducts === 'function' ? window.getDisplayProducts(raw) : raw;
          const list = filterProducts(display, cat, term);
          renderProducts(list, cat);
        });
      });
    }

    const searchEl = document.getElementById('home-search');
    const raw = window.getProducts() || [];
    const display = typeof window.getDisplayProducts === 'function' ? window.getDisplayProducts(raw) : raw;
    const list = filterProducts(display, currentCategoryId, searchEl ? searchEl.value : '');
    renderProducts(list, currentCategoryId);
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
